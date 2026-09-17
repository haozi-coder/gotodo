// ========== 公用头部导航 插入页面 ==========
export function renderHeader() {
  const headerHtml = `
    <header>
      <nav class="nav-bar">
        <div class="title">📝待办清单系统</div>
        <ul class="nav-list">
          <li><a href="./index.html">首页总览</a></li>
          <li><a href="./list.html">全部任务</a></li>
          <li><a href="./detail.html">任务详情</a></li>
        </ul>
      </nav>
    </header>
  `
  document.body.insertAdjacentHTML('afterbegin', headerHtml)
}

// ========== 公用底部footer ==========
export function renderFooter() {
  const footerHtml = `
    <footer>
      <p>校园综合项目｜待办清单系统 ©2026</p>
    </footer>
  `
  document.body.insertAdjacentHTML('beforeend', footerHtml)
}

// ========= LocalStorage 工具函数：待办数据持久化 =========
const STORAGE_KEY = "todo_list"

// 获取本地存储待办，如果为空返回默认空数组
export function getTodoList() {
  const str = localStorage.getItem(STORAGE_KEY)
  return str ? JSON.parse(str) : []
}

// 保存数组到localStorage
export function saveTodoList(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

// 新增一条待办
export function addTodo(todoObj) {
  const list = getTodoList()
  list.push(todoObj)
  saveTodoList(list)
}

// 根据id删除待办
export function delTodo(id) {
  let list = getTodoList()
  list = list.filter(item => item.id !== id)
  saveTodoList(list)
}

// 根据id获取单条任务
export function getTodoById(id) {
  return getTodoList().find(item => item.id === id)
}

// 修改任务
export function editTodo(id, newData) {
  const list = getTodoList()
  const idx = list.findIndex(i=>i.id === id)
  if(idx !== -1){
    list[idx] = {...list[idx], ...newData}
    saveTodoList(list)
  }
}
