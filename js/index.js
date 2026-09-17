import {renderHeader, renderFooter, getTodoList, getCurrentUser, addTodo, completeTodo, delTodo,
        isTipShown, setTipShown, logout, escapeHtml, validateTodo, createTodo, formatDate,
        getTodayDoneCount, incrementTodayDone, saveTodoList} from './common.js'

// ========= 未登录直接跳登录页 =========
const currentUser = getCurrentUser()

let welcomeModal = null

// ========= Canvas 绘制今日到期占比环形图 =========
function drawPieChart(canvas, todayDue, total) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const radius = 56
  const innerRadius = 36

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 无任务
  if (total === 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = '#e8e8e8'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#f0f4f8'
    ctx.fill()
    ctx.fillStyle = '#999'
    ctx.font = '13px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('暂无任务', cx, cy)
    return
  }

  const dueRatio = todayDue / total
  const otherRatio = 1 - dueRatio
  const startAngle = -Math.PI / 2

  // 其他任务（浅蓝灰）
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, radius, startAngle, startAngle + otherRatio * Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = '#d6e4ff'
  ctx.fill()

  // 今日到期（橙色突出）
  if (dueRatio > 0) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle + otherRatio * Math.PI * 2, startAngle + Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = '#fa8c16'
    ctx.fill()
  }

  // 中间挖白
  ctx.beginPath()
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#f0f4f8'
  ctx.fill()

  // 中间文字
  const percent = Math.round(dueRatio * 100)
  ctx.fillStyle = '#2c3e50'
  ctx.font = 'bold 18px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(todayDue + '/' + total, cx, cy - 6)
  ctx.font = '11px system-ui'
  ctx.fillStyle = '#666'
  ctx.fillText('今日到期', cx, cy + 12)
}

// ========= 按创建时间分组 =========
function groupByCreateTime(list) {
  const groups = {}
  list.forEach(item => {
    const date = item.createTime || '未知日期'
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
  })
  // 按日期倒序排列（最新的在前）
  const sortedDates = Object.keys(groups).sort().reverse()
  return sortedDates.map(date => ({ date, items: groups[date] }))
}

// ========= 渲染统计 + 待完成任务列表 =========
function renderHome() {
  const list = getTodoList()
  const total = list.length
  const today = formatDate()
  const todayDue = list.filter(i => i.dueTime === today).length
  const todayDone = getTodayDoneCount()

  // 第一个统计卡片：待完成总数 + 今日完成
  document.querySelector('#totalCount').textContent = total
  document.querySelector('#todayDoneCount').textContent = todayDone

  // Canvas 环形图：今日到期占比
  drawPieChart(document.querySelector('#statChart'), todayDue, total)

  // 待完成任务列表
  const listBox = document.querySelector('#todoList')

  if (list.length === 0) {
    listBox.innerHTML = '<p class="empty-tip">🎉没有待完成任务，点右下角 + 添加一条吧～</p>'
    return
  }

  // 按创建时间分组渲染
  const groups = groupByCreateTime(list)
  listBox.innerHTML = groups.map(group => `
    <div class="date-group">
      <div class="date-label">📅 ${escapeHtml(group.date)}</div>
      ${group.items.map(item => `
        <article class="todo-card">
          <div class="card-date-badge">${escapeHtml(item.createTime)}</div>
          <h4>${escapeHtml(item.title)}</h4>
          ${item.content ? `<p>${escapeHtml(item.content)}</p>` : ''}
          <div class="card-footer">
            ${item.dueTime ? `<span class="due-time">⏰ 预期：${escapeHtml(item.dueTime)}</span>` : ''}
            <div class="card-actions">
              <a href="detail.html?id=${encodeURIComponent(item.id)}" class="edit-link">✏️编辑</a>
              <button data-id="${escapeHtml(item.id)}" class="complete-btn">✅完成</button>
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  `).join('')

  // 完成按钮：今日完成数+1，然后直接删除任务
  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.onclick = function() {
      incrementTodayDone()
      completeTodo(this.dataset.id)
      renderHome()
    }
  })
}

// ========= 多标签页同步：监听 storage 事件自动刷新列表 =========
// 说明：storage 事件只在「其他标签页」修改 localStorage 时触发，
// 本页自身的修改不会重复触发，不会造成死循环。
let syncTimer = null
function scheduleHomeRefresh() {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(renderHome, 30) // 合并同一次改动的多个事件
}

window.addEventListener('storage', function(e) {
  if (!e.key) return
  // 当前用户待办数据 / 今日完成计数变化 → 重新渲染统计与列表
  if (e.key === 'user_todo_' + currentUser || e.key.indexOf('todayDone_') === 0) {
    scheduleHomeRefresh()
  }
  // 其他标签页退出登录 → 本页跟随跳转登录页
  if (e.key === 'currentUser' && !e.newValue) {
    location.replace('./login.html')
  }
})

// ========= 数据导出 / 导入（JSON 备份，防清缓存丢数据） =========
function setupDataTransfer() {
  const exportBtn = document.querySelector('#exportBtn')
  const importBtn = document.querySelector('#importBtn')
  const importFile = document.querySelector('#importFile')

  // 下载 JSON：把当前账号的待办数据打包成备份文件
  exportBtn.onclick = function() {
    const list = getTodoList()
    if (list.length === 0) {
      alert('当前没有待办数据可导出')
      return
    }
    const payload = {
      app: 'gotodo',
      version: 1,
      exportedAt: formatDate(),
      username: currentUser,
      todos: list
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'gotodo-' + currentUser + '-' + formatDate() + '.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  // 导入 JSON：选择文件 → 校验 → 确认覆盖 → 恢复数据
  importBtn.onclick = function() {
    importFile.click()
  }
  importFile.onchange = function() {
    const file = importFile.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = function() {
      try {
        const todos = parseImportTodos(JSON.parse(reader.result))
        if (todos.length === 0) {
          alert('导入失败：文件里没有可导入的任务（需为数组或 {todos:[...]} 格式）')
          return
        }
        const currentCount = getTodoList().length
        if (currentCount > 0 && !confirm('导入将覆盖当前 ' + currentCount + ' 条待办，共导入 ' + todos.length + ' 条，确定继续吗？')) return
        saveTodoList(todos)
        renderHome()
        alert('导入成功！已恢复 ' + todos.length + ' 条待办')
      } catch (err) {
        alert('导入失败：文件不是有效的 JSON 数据')
      } finally {
        importFile.value = ''
      }
    }
    reader.readAsText(file)
  }
}

// 解析导入内容：兼容「原始数组」与「{todos:[...]} 备份包」两种格式，
// 自动清理非法项、补全缺失字段、给重复/非法 id 重新编号，避免详情页错乱
function parseImportTodos(parsed) {
  const arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.todos) ? parsed.todos : null)
  if (!arr) return []
  const seen = new Set()
  const now = formatDate()
  const result = []
  for (const t of arr) {
    if (!t || !t.title) continue // 跳过空项与无标题项
    let id = Number(t.id)
    if (!Number.isFinite(id) || seen.has(id)) {
      id = Date.now() + Math.floor(Math.random() * 1000)
    }
    seen.add(id)
    result.push({
      id,
      title: String(t.title).slice(0, 20),
      content: t.content ? String(t.content).slice(0, 100) : '',
      done: !!t.done,
      createTime: t.createTime || now,
      dueTime: t.dueTime ? String(t.dueTime) : ''
    })
  }
  return result
}

// ========= 添加弹窗控制 =========
function setupAddModal() {
  const fabBtn = document.querySelector('#fabAddBtn')
  const addModal = document.querySelector('#addModal')
  const cancelBtn = document.querySelector('#cancelAddBtn')

  // 点 + 号打开弹窗
  fabBtn.onclick = function() {
    addModal.style.display = 'flex'
    document.querySelector('#idxTitle').focus()
  }

  // 点取消关闭弹窗
  cancelBtn.onclick = function() {
    addModal.style.display = 'none'
    document.querySelector('#indexAddForm').reset()
    document.querySelector('#idxTitleErr').textContent = ''
    document.querySelector('#idxContentErr').textContent = ''
  }

  // 点遮罩关闭弹窗
  addModal.onclick = function(e) {
    if (e.target === addModal) {
      addModal.style.display = 'none'
      document.querySelector('#indexAddForm').reset()
    }
  }
}

function init() {
  renderHeader()
  renderFooter()

  welcomeModal = document.querySelector('#welcomeModal')
  const closeBtn = document.querySelector('#closeTipBtn')

  closeBtn.onclick = function() {
    setTipShown()
    welcomeModal.style.display = "none"
  }

  // 添加弹窗
  setupAddModal()

  // 数据导出 / 导入
  setupDataTransfer()

  // 新增任务表单提交
  document.querySelector('#indexAddForm').onsubmit = function(e) {
    e.preventDefault()
    const title = document.querySelector('#idxTitle').value.trim()
    const content = document.querySelector('#idxContent').value.trim()
    const dueTime = document.querySelector('#idxDueTime').value
    const titleErr = document.querySelector('#idxTitleErr')
    const contentErr = document.querySelector('#idxContentErr')

    const result = validateTodo(title, content)
    titleErr.textContent = result.titleErr
    contentErr.textContent = result.contentErr
    if (!result.pass) return

    addTodo(createTodo(title, content, dueTime))
    renderHome()
    this.reset()
    document.querySelector('#addModal').style.display = 'none'
  }

  window.onload = function() {
    // 欢迎弹窗
    welcomeModal.style.display = isTipShown() ? "none" : "flex"

    // 用户名
    document.querySelector('#showUser').innerText = currentUser
    document.querySelector('#logoutBtn').onclick = function() {
      logout()
      location.replace('./login.html')
    }

    renderHome()
  }
}

if (!currentUser) {
  location.replace('./login.html')
} else {
  init()
}
