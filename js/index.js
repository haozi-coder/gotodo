import {renderHeader, renderFooter, getTodoList,getCurrentUser,isTipShown,setTipShown,logout} from './common.js'

// 未登录直接跳登录页
if(!getCurrentUser()){
  location.href="./login.html"
}

renderHeader()
renderFooter()

window.onload = function(){
  //欢迎弹窗逻辑：只有第一次打开网页才显示
  const modal = document.querySelector('#welcomeModal')
  if(isTipShown()){
    modal.style.display="none"
  }else{
    modal.style.display="flex"
  }
  //点击关闭，永久标记已读
  document.querySelector('#closeTipBtn').onclick = function(){
    setTipShown()
    modal.style.display="none"
  }

  //展示用户名
  document.querySelector('#showUser').innerText = getCurrentUser()
  //退出登录
  document.querySelector('#logoutBtn').onclick = function(){
    logout()
    location.href="./login.html"
  }

  //统计待办
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
  const html = list.slice(-3).map(item=>`
    <div class="todo-card ${item.done?'done':''}">
      <h4>${item.title}</h4>
      <p>${item.content}</p>
    </div>
  `).join('')
  document.querySelector('#recent-todo').innerHTML = html
}
