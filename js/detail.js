import {renderHeader, renderFooter, getTodoById, editTodo} from './common.js'
renderHeader()
renderFooter()

window.onload = function(){
  // 获取url参数 ?id=xxx
  const params = new URLSearchParams(location.search)
  const taskId = Number(params.get('id'))
  const task = getTodoById(taskId)
  if(!task){
    document.querySelector('#detailBox').innerHTML = "<p>任务不存在，请回到列表页</p>"
    return
  }
  document.querySelector('#editId').value = task.id
  document.querySelector('#editTitle').value = task.title
  document.querySelector('#editContent').value = task.content
  document.querySelector('#detailBox').innerHTML = `
    <div class="todo-card ${task.done?'done':''}">
      <h3>原任务：${task.title}</h3>
      <p>${task.content}</p>
    </div>
  `
}

// 编辑表单提交
document.querySelector('#editForm').onsubmit = function(e){
  e.preventDefault()
  const id = Number(document.querySelector('#editId').value)
  const title = document.querySelector('#editTitle').value.trim()
  const content = document.querySelector('#editContent').value.trim()
  editTodo(id, {title,content})
  alert('修改成功！')
  location.href = 'list.html'
}
