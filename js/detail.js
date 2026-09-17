import {renderHeader, renderFooter, getTodoById, editTodo, delTodo,
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

    idDom.value = task.id
    titleDom.value = task.title
    contentDom.value = task.content
    dueTimeDom.value = task.dueTime || ''

    detailBox.innerHTML = `
      <article class="todo-card">
        <div class="card-date-badge">${escapeHtml(task.createTime || '')}</div>
        <h3>${escapeHtml(task.title)}</h3>
        ${task.content ? `<p>${escapeHtml(task.content)}</p>` : ''}
        ${task.dueTime ? `<p class="due-time">⏰ 预期完成：${escapeHtml(task.dueTime)}</p>` : ''}
      </article>
      <button id="delTaskBtn" type="button" class="del-btn" style="margin:10px 0;">🗑️ 删除该任务</button>
    `

    // 删除任务
    document.querySelector('#delTaskBtn').onclick = function() {
      if (!confirm('确定要删除该任务吗？')) return
      delTodo(task.id)
      location.replace('index.html')
    }
  }
}

if (!currentUser) {
  location.replace('./login.html')
} else {
  init()
}
