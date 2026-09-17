import {renderHeader, renderFooter, getTodoById, editTodo, delTodo, completeTodo, incrementTodayDone,
        getCurrentUser, escapeHtml, validateTodo} from './common.js'

// ========= 未登录直接跳登录页 =========
const currentUser = getCurrentUser()

function init() {
  renderHeader()
  renderFooter()

  const form = document.querySelector('#editForm')
  const idDom = document.querySelector('#editId')
  const titleDom = document.querySelector('#editTitle')
  const contentDom = document.querySelector('#editContent')
  const dueTimeDom = document.querySelector('#editDueTime')
  const titleErr = document.querySelector('#editTitleErr')
  const contentErr = document.querySelector('#editContentErr')
  const detailBox = document.querySelector('#detailBox')

  // 没有任务时直接跳回首页
  function showMissingTask() {
    location.replace('index.html')
  }

  // 渲染任务展示卡（含标记完成 / 删除按钮）
  function renderTaskCard(task) {
    detailBox.innerHTML = `
      <article class="todo-card">
        <div class="card-date-badge">${escapeHtml(task.createTime || '')}</div>
        <h3>${escapeHtml(task.title)}</h3>
        ${task.content ? `<p>${escapeHtml(task.content)}</p>` : ''}
        ${task.dueTime ? `<p class="due-time">⏰ 预期完成：${escapeHtml(task.dueTime)}</p>` : ''}
      </article>
      <div class="detail-actions">
        <button id="doneTaskBtn" type="button" class="done-btn">✅ 标记完成</button>
        <button id="delTaskBtn" type="button" class="del-btn">🗑️ 删除该任务</button>
      </div>
    `

    // 标记完成：今日完成数+1，任务从待办列表移除（与首页「完成」按钮语义一致）
    document.querySelector('#doneTaskBtn').onclick = function() {
      if (!confirm('确定标记「' + task.title + '」为已完成吗？')) return
      incrementTodayDone()
      completeTodo(task.id)
      alert('已完成！')
      location.replace('index.html')
    }

    // 删除任务
    document.querySelector('#delTaskBtn').onclick = function() {
      if (!confirm('确定要删除该任务吗？')) return
      delTodo(task.id)
      location.replace('index.html')
    }
  }

  // 用任务数据填充编辑表单与展示卡
  function fillTask(task) {
    idDom.value = task.id
    titleDom.value = task.title
    contentDom.value = task.content
    dueTimeDom.value = task.dueTime || ''
    renderTaskCard(task)
  }

  // 返回按钮
  document.querySelector('#backBtn').onclick = function() {
    location.replace('index.html')
  }

  // 编辑表单提交
  form.onsubmit = function(e) {
    e.preventDefault()
    const title = titleDom.value.trim()
    const content = contentDom.value.trim()
    const dueTime = dueTimeDom.value

    const result = validateTodo(title, content)
    titleErr.textContent = result.titleErr
    contentErr.textContent = result.contentErr
    if (!result.pass) return

    if (!editTodo(Number(idDom.value), { title, content, dueTime })) {
      alert('该任务已不存在，无法保存')
      location.replace('index.html')
      return
    }
    alert('修改成功！')
    location.replace('index.html')
  }

  window.onload = function() {
    const params = new URLSearchParams(location.search)
    const rawId = params.get('id')
    const taskId = Number(rawId)

    if (rawId === null || rawId.trim() === '' || Number.isNaN(taskId)) {
      showMissingTask()
      return
    }

    const task = getTodoById(taskId)
    if (!task) {
      showMissingTask()
      return
    }

    fillTask(task)
  }

  // ========= 多标签页同步：其他标签页增删改后自动刷新 =========
  window.addEventListener('storage', function(e) {
    if (!e.key) return
    // 当前用户在其他标签页退出登录 → 跟随跳转登录页
    if (e.key === 'currentUser' && !e.newValue) {
      location.replace('./login.html')
      return
    }
    // 当前用户待办数据变化 → 重新拉取本任务（被删则跳回首页）
    if (e.key === 'user_todo_' + currentUser) {
      const task = getTodoById(Number(idDom.value))
      if (!task) {
        alert('该任务已在其他标签页被删除')
        location.replace('index.html')
        return
      }
      fillTask(task)
    }
  })
}

if (!currentUser) {
  location.replace('./login.html')
} else {
  init()
}
