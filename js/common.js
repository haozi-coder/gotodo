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

// ========== HTML 转义，防止 innerHTML 拼接时的 XSS 注入 ==========
export function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ========== 统一的表单校验，三个页面复用 ==========
// 返回 { pass, titleErr, contentErr }
export function validateTodo(title, content) {
  let pass = true
  let titleErr = ''
  let contentErr = ''
  if (title.length < 3 || title.length > 20) {
    titleErr = '标题必填，长度3-20字符'
    pass = false
  }
  if (content.length > 100) {
    contentErr = '描述不能超过100字'
    pass = false
  }
  return { pass, titleErr, contentErr }
}

// ========== 生成唯一 id，避免 Date.now() 快速连点重复 ==========
export function generateTodoId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

// ========== 统一日期格式 YYYY-MM-DD（与 data.json 示例数据保持一致） ==========
export function formatDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ========== 组装一条新任务，首页/列表页复用，字段保持一致 ==========
export function createTodo(title, content) {
  return {
    id: generateTodoId(),
    title,
    content,
    done: false,
    createTime: formatDate()
  }
}

// ========== 安全读取 localStorage 里的 JSON ==========
// 存档被手工改坏、或旧版本写入非数组时，直接抛异常会让整页白屏，
// 这里统一兜底成 fallback 值。
function readJson(key, fallback) {
  try {
    const str = localStorage.getItem(key)
    if (!str) return fallback
    const val = JSON.parse(str)
    if (Array.isArray(fallback)) return Array.isArray(val) ? val : fallback
    return val == null ? fallback : val
  } catch (err) {
    console.warn('本地数据解析失败，已按空数据继续：' + key, err)
    return fallback
  }
}

// ========== id 归一化：地址栏 ?id=1 取到的是字符串，直接 === 比数字会找不到任务 ==========
function normalizeId(id) {
  const num = Number(id)
  return Number.isNaN(num) ? id : num
}

// ========= LocalStorage 工具函数：待办数据持久化 =========
// 注意：getTodoList / saveTodoList 在下方「按用户隔离」处统一定义，
// 此处不再重复导出，否则 ES Module 会报 Duplicate export 错误，导致整个模块加载失败。

// 新增一条待办
export function addTodo(todoObj) {
  const list = getTodoList()
  list.push(todoObj)
  saveTodoList(list)
}

// 根据id删除待办，返回是否真的删掉了
export function delTodo(id) {
  const target = normalizeId(id)
  const list = getTodoList()
  const next = list.filter(item => normalizeId(item.id) !== target)
  if (next.length === list.length) return false
  saveTodoList(next)
  return true
}

// 根据id获取单条任务
export function getTodoById(id) {
  const target = normalizeId(id)
  return getTodoList().find(item => normalizeId(item.id) === target)
}

// 修改任务，返回是否修改成功（任务可能已被别的页面删掉）
export function editTodo(id, newData) {
  const target = normalizeId(id)
  const list = getTodoList()
  const idx = list.findIndex(i => normalizeId(i.id) === target)
  if(idx === -1) return false
  list[idx] = {...list[idx], ...newData}
  saveTodoList(list)
  return true
}

// 切换完成状态，返回切换后的 done 值（任务不存在返回 null）
export function toggleTodoDone(id) {
  const task = getTodoById(id)
  if(!task) return null
  editTodo(task.id, { done: !task.done })
  return !task.done
}
// ===================== 登录、弹窗、用户隔离逻辑 =====================
// 是否看过欢迎提示
export function isTipShown() {
  return localStorage.getItem('hasShowTip') === 'true'
}
export function setTipShown() {
  localStorage.setItem('hasShowTip', 'true')
}

// 用户账号相关
const USER_LIST_KEY = "userList"
const CURRENT_USER_KEY = "currentUser"

// 获取全部注册用户
export function getUserList() {
  return readJson(USER_LIST_KEY, [])
}

// ========== 密码加盐哈希（演示级方案） ==========
// 优先用 Web Crypto 的 SHA-256；非安全上下文（如局域网 IP 访问）下 crypto.subtle
// 不可用，降级为同步散列。注意：这仍是前端演示级加密，真实系统必须在服务端校验。
// 生成随机盐
function genSalt(){
  const buf = new Uint8Array(16)
  const wc = globalThis.crypto
  if(wc && wc.getRandomValues){
    wc.getRandomValues(buf)
    return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('')
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// 降级散列：非安全上下文时使用（非加密安全，仅保证不存明文）
function fallbackHash(text){
  let h = 0x811c9dc5
  for(let i = 0; i < text.length; i++){
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let h2 = 0x01000193
  for(let i = 0; i < text.length; i++){
    h2 = Math.imul(h2 ^ text.charCodeAt(i), 2654435761) >>> 0
  }
  return (h >>> 0).toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

// 统一哈希入口：盐和密码一起哈希，同一密码在不同用户下结果不同
async function hashPassword(password, salt){
  const text = salt + '::' + password
  const wc = globalThis.crypto
  if(wc && wc.subtle && wc.subtle.digest){
    try{
      const digest = await wc.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
    }catch(err){
      console.warn('Web Crypto 不可用，降级为散列：', err)
    }
  }
  return fallbackHash(text)
}

// 注册用户（密码以加盐哈希存储，不再保存明文）
export async function registerUser(username, password) {
  const users = getUserList()
  if(users.some(u => u.username === username)) return false //账号已存在
  const salt = genSalt()
  const passwordHash = await hashPassword(password, salt)
  users.push({username, salt, passwordHash})
  localStorage.setItem(USER_LIST_KEY, JSON.stringify(users))
  return true
}

// 登录校验
export async function loginUser(username, password) {
  const users = getUserList()
  const u = users.find(item => item.username === username)
  if(!u) return false
  // 兼容旧版明文账号：校验通过后自动迁移为加盐哈希存储
  if(typeof u.passwordHash !== 'string'){
    if(u.password !== password) return false
    const salt = genSalt()
    u.salt = salt
    u.passwordHash = await hashPassword(password, salt)
    delete u.password
    localStorage.setItem(USER_LIST_KEY, JSON.stringify(users))
    localStorage.setItem(CURRENT_USER_KEY, username)
    return true
  }
  if(await hashPassword(password, u.salt) !== u.passwordHash) return false
  localStorage.setItem(CURRENT_USER_KEY, username)
  return true
}

// 获取当前登录用户
export function getCurrentUser(){
  return localStorage.getItem(CURRENT_USER_KEY)
}

// 退出登录
export function logout(){
  localStorage.removeItem(CURRENT_USER_KEY)
}

// 获取当前用户的存储key
function getUserTodoKey(username){
  return "user_todo_" + username
}
function getUserInitFlagKey(username){
  return "user_initLoaded_" + username
}

// =========重写待办读写，按用户隔离（替换原来的全局todo）=========
// 获取当前用户待办
export function getTodoList() {
  const user = getCurrentUser()
  if(!user) return []
  return readJson(getUserTodoKey(user), [])
}

export function saveTodoList(arr) {
  const user = getCurrentUser()
  if(!user) return
  const key = getUserTodoKey(user)
  localStorage.setItem(key, JSON.stringify(arr))
}

// 判断该用户是否已经加载过示例数据
export function isUserHasInitData(userName){
  if(!userName) return false // 未登录时不要共用 user_initLoaded_null 这个键
  return localStorage.getItem(getUserInitFlagKey(userName)) === "true"
}
// 设置标记：该用户已经加载过示例，以后不再生成
export function markUserInitLoaded(userName){
  if(!userName) return
  localStorage.setItem(getUserInitFlagKey(userName), "true")
}

// 给新用户生成示例任务（只执行1次）
export function createInitTodoForNewUser(){
  const user = getCurrentUser()
  if(!user) return
  if(isUserHasInitData(user)) return; //已经加载过，直接返回，不再生成

  // 关键：老用户（早期版本没有 init 标记）本地已经有自己的任务，
  // 这里只补标记，绝不能拿示例数据覆盖他的数据。
  if(getTodoList().length > 0){
    markUserInitLoaded(user)
    return
  }

  // 示例测试任务
  const initData = [
    {id:1, title:"欢迎使用待办清单", content:"这是系统给你的示例任务，可以直接删除", done:false, createTime:"2026-09-17"},
    {id:2, title:"完成web课程作业", content:"完成待办综合项目", done:false, createTime:"2026-09-17"}
  ]
  saveTodoList(initData)
  markUserInitLoaded(user) //打上标记！！！删除完以后刷新不会再出现
}

