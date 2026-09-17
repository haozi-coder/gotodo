import {renderHeader, renderFooter, getTodoList, getCurrentUser, addTodo, toggleTodoDone,
        isTipShown, setTipShown, logout, escapeHtml, validateTodo, createTodo} from './common.js'

// ========= 未登录直接跳登录页，后面的页面逻辑一律不执行 =========
const currentUser = getCurrentUser()

let modal = null

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
  const recentBox = document.querySelector('#recent-todo')

  if(recent.length === 0){
    recentBox.innerHTML = '<p class="empty-tip">还没有任务，用上面的表单新增一条吧～</p>'
    return
  }

  recentBox.innerHTML = recent.map(item=>`
    <div class="todo-card ${item.done?'done':''}">
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.content)}</p>
      <button data-id="${escapeHtml(item.id)}" class="toggle-btn">${item.done?'↩️取消完成':'✅标记完成'}</button>
      <a href="detail.html?id=${encodeURIComponent(item.id)}">去编辑详情</a>
    </div>
  `).join('')

  // 点击完成任务 / 取消完成
  document.querySelectorAll('.toggle-btn').forEach(btn=>{
    btn.onclick = function(){
      toggleTodoDone(this.dataset.id)
      renderHome() // 重新渲染，更新统计与样式
    }
  })
}

function init(){
  renderHeader()
  renderFooter()

  modal = document.querySelector('#welcomeModal')
  const closeBtn = document.querySelector('#closeTipBtn')

  // 关闭按钮事件
  closeBtn.onclick = function(){
    setTipShown()
    modal.style.display = "none"
  }

  // ========= 首页快速新增任务（带前端校验） =========
  document.querySelector('#indexAddForm').onsubmit = function(e){
    e.preventDefault()
    const title = document.querySelector('#idxTitle').value.trim()
    const content = document.querySelector('#idxContent').value.trim()
    const titleErr = document.querySelector('#idxTitleErr')
    const contentErr = document.querySelector('#idxContentErr')

    const result = validateTodo(title, content)
    titleErr.textContent = result.titleErr
    contentErr.textContent = result.contentErr
    if(!result.pass) return

    addTodo(createTodo(title, content))
    renderHome()
    this.reset()
  }

  window.onload = function(){
    // 判断是否展示弹窗（默认隐藏，避免老用户看到一闪而过的遮罩）
    modal.style.display = isTipShown() ? "none" : "flex"

    // 展示用户名
    document.querySelector('#showUser').innerText = currentUser
    // 退出登录
    document.querySelector('#logoutBtn').onclick = function(){
      logout()
      location.replace('./login.html')
    }

    renderHome()
  }
}

if(!currentUser){
  location.replace('./login.html')
}else{
  init()
}
