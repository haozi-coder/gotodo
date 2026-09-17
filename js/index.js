import {renderHeader, renderFooter, getTodoList, getCurrentUser, getTodoById, addTodo, editTodo, isTipShown, setTipShown, logout} from './common.js'

// 未登录直接跳登录页
if(!getCurrentUser()){
  location.href="./login.html"
}

renderHeader()
renderFooter()

// ========= 把弹窗和按钮事件提到window.onload外面 =========
const modal = document.querySelector('#welcomeModal')
const closeBtn = document.querySelector('#closeTipBtn')

// 关闭按钮事件，提前绑定
closeBtn.onclick = function(){
  setTipShown()
  modal.style.display="none"
  console.log("已标记提示已读")
}

// ========= 渲染统计 + 最近任务（可点击完成） =========
function renderHome(){
  const list = getTodoList()
  const total = list.length
  const doneNum = list.filter(i=>i.done).length
  const undoneNum = total - doneNum

  document.querySelector('#stat-box').innerHTML = `
    <p>总任务：${total}</p>
    <p>已完成：${doneNum}</p>
    <p>未完成：${undoneNum}</p>
  `

  // 展示前3条最近任务
  const recent = list.slice(-3)
  const html = recent.map(item=>`
    <div class="todo-card ${item.done?'done':''}">
      <h4>${item.title}</h4>
      <p>${item.content}</p>
      <button data-id="${item.id}" class="toggle-btn">${item.done?'↩️取消完成':'✅标记完成'}</button>
      <a href="detail.html?id=${item.id}">去编辑详情</a>
    </div>
  `).join('')
  document.querySelector('#recent-todo').innerHTML = html

  // 点击完成任务 / 取消完成
  document.querySelectorAll('.toggle-btn').forEach(btn=>{
    btn.onclick = function(){
      const id = Number(this.dataset.id)
      const task = getTodoById(id)
      if(!task) return
      editTodo(id, { done: !task.done })
      renderHome() // 重新渲染，更新统计与样式
    }
  })
}

window.onload = function(){
  //判断是否展示弹窗
  if(isTipShown()){
    modal.style.display="none"
  }else{
    modal.style.display="flex"
  }

  //展示用户名
  document.querySelector('#showUser').innerText = getCurrentUser()
  //退出登录
  document.querySelector('#logoutBtn').onclick = function(){
    logout()
    location.href="./login.html"
  }

  renderHome()
}

// ========= 首页快速新增任务（带前端校验） =========
document.querySelector('#indexAddForm').onsubmit = function(e){
  e.preventDefault()
  let pass = true
  const titleDom = document.querySelector('#idxTitle')
  const contentDom = document.querySelector('#idxContent')
  const title = titleDom.value.trim()
  const content = contentDom.value.trim()
  const titleErr = document.querySelector('#idxTitleErr')
  const contentErr = document.querySelector('#idxContentErr')
  titleErr.textContent = ''
  contentErr.textContent = ''

  if(title.length <3 || title.length>20){
    titleErr.textContent = '标题必填,长度3-20字符'
    pass = false
  }
  if(content.length>100){
    contentErr.textContent = '描述不能超过100字'
    pass = false
  }
  if(!pass) return

  const newItem = {
    id: Date.now(),
    title,
    content,
    done:false,
    createTime:new Date().toLocaleDateString()
  }
  addTodo(newItem)
  renderHome()
  this.reset()
}