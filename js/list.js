 import {renderHeader, renderFooter, getTodoList, saveTodoList, addTodo, delTodo} from './common.js'
renderHeader()
renderFooter()

let todoArr = []
const container = document.querySelector('#todoContainer')
const form = document.querySelector('#addTodoForm')
const searchInput = document.querySelector('#search-input')
const filterSel = document.querySelector('#filter-select')

// 页面加载：优先localStorage，如果为空fetch读取data.json初始化
window.onload = async function(){
  todoArr = getTodoList()
  if(todoArr.length === 0){
    // fetch读取本地json
    const res = await fetch('./data.json')
    todoArr = await res.json()
    saveTodoList(todoArr)
  }
  renderList(todoArr)
}

// 渲染列表函数
function renderList(arr){
  container.innerHTML = arr.map(item=>`
    <div class="todo-card ${item.done?'done':''}">
      <h4>${item.title}</h4>
      <p>${item.content}</p>
      <p>创建：${item.createTime}</p>
      <button data-id="${item.id}" class="del-btn">删除</button>
      <a href="detail.html?id=${item.id}">去编辑详情</a>
    </div>
  `).join('')

  // 删除按钮事件
  document.querySelectorAll('.del-btn').forEach(btn=>{
    btn.onclick = function(){
      const id = Number(this.dataset.id)
      delTodo(id)
      todoArr = getTodoList()
      renderList(todoArr)
    }
  })
}

// =========表单校验=========
form.onsubmit = function(e){
  e.preventDefault()
  let pass = true
  const title = document.querySelector('#title').value.trim()
  const content = document.querySelector('#content').value.trim()
  const titleErr = document.querySelector('#titleErr')
  const contentErr = document.querySelector('#contentErr')
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

  // 新增任务
  const newItem = {
    id: Date.now(), // 使用时间戳作为唯一id
    title,
    content,
    done:false,
    createTime:new Date().toLocaleDateString()
  }
  addTodo(newItem)
  todoArr = getTodoList()
  renderList(todoArr)
  form.reset()
}

// 搜索+筛选
function filterData(){
  const keyword = searchInput.value.trim().toLowerCase()
  const filterVal = filterSel.value
  let temp = getTodoList()
  // 关键词过滤
  if(keyword){
    temp = temp.filter(i=>i.title.toLowerCase().includes(keyword))
  }
  // 状态筛选
  if(filterVal === 'done') temp = temp.filter(i=>i.done)
  if(filterVal === 'undone') temp = temp.filter(i=>!i.done)
  renderList(temp)
}
searchInput.addEventListener('input',filterData)
filterSel.addEventListener('change',filterData)
