import {renderHeader, renderFooter, getTodoList, saveTodoList, addTodo, delTodo,
        getCurrentUser, escapeHtml, validateTodo, createTodo, toggleTodoDone,
        isUserHasInitData, markUserInitLoaded} from './common.js'

// ========= 未登录直接跳登录页，后面的页面逻辑一律不执行 =========
const currentUser = getCurrentUser()

let container = null
let form = null
let searchInput = null
let filterSel = null

// 渲染列表函数
function renderList(arr){
  if(arr.length === 0){
    container.innerHTML = '<p class="empty-tip">暂无任务，换个筛选条件或新增一条吧～</p>'
    return
  }

  container.innerHTML = arr.map(item=>`
    <article class="todo-card ${item.done?'done':''}">
      <h4>${escapeHtml(item.title)}</h4>
      <p>${escapeHtml(item.content)}</p>
      <p>创建：${escapeHtml(item.createTime)}</p>
      <button data-id="${escapeHtml(item.id)}" class="toggle-btn">${item.done?'↩️取消完成':'✅标记完成'}</button>
      <button data-id="${escapeHtml(item.id)}" class="del-btn">删除</button>
      <a href="detail.html?id=${encodeURIComponent(item.id)}">去编辑详情</a>
    </article>
  `).join('')

  // 标记完成 / 取消完成
  container.querySelectorAll('.toggle-btn').forEach(btn=>{
    btn.onclick = function(){
      toggleTodoDone(this.dataset.id)
      refresh()
    }
  })

  // 删除按钮事件（先确认，避免误删）
  container.querySelectorAll('.del-btn').forEach(btn=>{
    btn.onclick = function(){
      if(!confirm('确定要删除该任务吗？')) return
      delTodo(this.dataset.id)
      refresh()
    }
  })
}

// 按当前搜索/筛选条件重新渲染
function refresh(){
  const keyword = searchInput.value.trim().toLowerCase()
  const filterVal = filterSel.value
  let temp = getTodoList()

  if(keyword){
    // 同时匹配标题和内容（老数据可能缺 content 字段，用 ?? 兜底）
    temp = temp.filter(i => (String(i.title) + ' ' + String(i.content ?? '')).toLowerCase().includes(keyword))
  }
  if(filterVal === 'done') temp = temp.filter(i => i.done)
  if(filterVal === 'undone') temp = temp.filter(i => !i.done)

  renderList(temp)
}

function init(){
  renderHeader()
  renderFooter()

  container = document.querySelector('#todoContainer')
  form = document.querySelector('#addTodoForm')
  searchInput = document.querySelector('#search-input')
  filterSel = document.querySelector('#filter-select')

  // 页面加载：优先 localStorage；只有「从未初始化过」的用户才用 data.json 灌初始数据
  // （用 init 标记判断，避免用户把任务全删光后刷新又复活）
  window.onload = async function(){
    const stored = getTodoList()
    if(stored.length === 0 && currentUser && !isUserHasInitData(currentUser)){
      try{
        const res = await fetch('./data.json')
        if(!res.ok) throw new Error('HTTP ' + res.status)
        const data = await res.json()
        if(!Array.isArray(data)) throw new Error('data.json 不是数组')
        saveTodoList(data)
        // 只有真正加载成功才打标记，失败时下次刷新还能重试
        markUserInitLoaded(currentUser)
      }catch(err){
        console.error('加载初始示例数据失败：', err)
      }
    }
    refresh()
  }

  // =========表单校验=========
  form.onsubmit = function(e){
    e.preventDefault()
    const title = document.querySelector('#title').value.trim()
    const content = document.querySelector('#content').value.trim()
    const titleErr = document.querySelector('#titleErr')
    const contentErr = document.querySelector('#contentErr')

    const result = validateTodo(title, content)
    titleErr.textContent = result.titleErr
    contentErr.textContent = result.contentErr
    if(!result.pass) return

    // 新增任务
    addTodo(createTodo(title, content))
    form.reset()
    refresh() // 新增后按当前筛选条件刷新，而不是把筛选结果冲掉
  }

  // 搜索+筛选
  searchInput.addEventListener('input', refresh)
  filterSel.addEventListener('change', refresh)
}

if(!currentUser){
  location.replace('./login.html')
}else{
  init()
}
