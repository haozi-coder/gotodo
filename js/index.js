import {renderHeader, renderFooter, getTodoList, getCurrentUser, addTodo, completeTodo, delTodo,
        isTipShown, setTipShown, logout, escapeHtml, validateTodo, createTodo, formatDate} from './common.js'

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

  // 统计信息
  document.querySelector('#stat-box').innerHTML = `
    <p>📋待完成任务：<strong>${total}</strong> 项</p>
    <p>⏰今日到期：<strong style="color:#fa8c16">${todayDue}</strong> 项</p>
  `

  // Canvas 环形图
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

  // 完成按钮：直接删除任务（已完成自动消失）
  document.querySelectorAll('.complete-btn').forEach(btn => {
    btn.onclick = function() {
      completeTodo(this.dataset.id)
      renderHome()
    }
  })
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
