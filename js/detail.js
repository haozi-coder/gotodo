import {renderHeader, renderFooter, getTodoById, editTodo, delTodo,
        getCurrentUser, escapeHtml, validateTodo} from './common.js'

// ========= 未登录直接跳登录页，后面的页面逻辑一律不执行 =========
const currentUser = getCurrentUser()

function init(){
  renderHeader()
  renderFooter()

  const form = document.querySelector('#editForm')
  const idDom = document.querySelector('#editId')
  const titleDom = document.querySelector('#editTitle')
  const contentDom = document.querySelector('#editContent')
  const titleErr = document.querySelector('#editTitleErr')
  const contentErr = document.querySelector('#editContentErr')
  const detailBox = document.querySelector('#detailBox')

  // 没有 id 或 id 找不到任务时，隐藏编辑表单：
  // 否则用户能在一个「空表单」里点保存，还会弹出「修改成功」的假提示。
  function showMissingTask(){
    form.hidden = true
    form.style.display = 'none' // 兼容 CSS 里 form{display:flex} 覆盖 hidden 的情况
    detailBox.innerHTML = '<p class="empty-tip">任务不存在或已被删除，请回到 <a href="list.html">全部任务</a> 重新选择</p>'
  }

  // 编辑表单提交（复用统一校验，与新增保持一致）
  form.onsubmit = function(e){
    e.preventDefault()
    const title = titleDom.value.trim()
    const content = contentDom.value.trim()

    const result = validateTodo(title, content)
    titleErr.textContent = result.titleErr
    contentErr.textContent = result.contentErr
    if(!result.pass) return

    // 任务可能在别的标签页里已被删除，这里要如实反馈
    if(!editTodo(Number(idDom.value), {title, content})){
      alert('该任务已不存在，无法保存')
      location.replace('list.html')
      return
    }
    alert('修改成功！')
    location.replace('list.html')
  }

  window.onload = function(){
    // 获取url参数 ?id=xxx
    const params = new URLSearchParams(location.search)
    const rawId = params.get('id')
    const taskId = Number(rawId)

    if(rawId === null || rawId.trim() === '' || Number.isNaN(taskId)){
      showMissingTask()
      return
    }

    const task = getTodoById(taskId)
    if(!task){
      showMissingTask()
      return
    }

    idDom.value = task.id
    titleDom.value = task.title
    contentDom.value = task.content
    detailBox.innerHTML = `
      <div class="todo-card ${task.done?'done':''}">
        <h3>原任务：${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.content)}</p>
      </div>
      <button id="delTaskBtn" type="button" style="margin:10px 0;">删除该任务</button>
    `

    // 详情页删除任务
    document.querySelector('#delTaskBtn').onclick = function(){
      if(!confirm('确定要删除该任务吗？')) return
      delTodo(task.id)
      location.replace('list.html')
    }
  }
}

if(!currentUser){
  location.replace('./login.html')
}else{
  init()
}
