// ========== gotodo 核心逻辑测试（17 项） ==========
// 被测对象：js/common.js（纯逻辑层，浏览器全局由入口 run-tests.js 注入 mock）
// 覆盖范围：转义与校验 / 日期与任务组装 / 存储 CRUD / 登录注册 / 隔离与初始化
import {
  escapeHtml, validateTodo, validatePhone, formatDate, createTodo,
  addTodo, getTodoList, getTodoById, delTodo, editTodo, completeTodo,
  registerUser, loginUser, getCurrentUser, logout,
  getTodayDoneCount, incrementTodayDone, createInitTodoForNewUser
} from '../js/common.js'

// 极简断言：条件不成立则抛出，由入口捕获并记为失败
function assert(cond, msg) {
  if (!cond) throw new Error(msg || '断言失败')
}

// 模拟「当前已登录用户」的快捷方式（与 login.html 中登录成功后的状态一致）
function loginAs(username) {
  localStorage.setItem('currentUser', username)
}

export const tests = [
  // ---------- 1-2：HTML 转义 ----------
  {
    name: 'escapeHtml 转义 HTML 特殊字符，防 XSS 注入',
    async fn() {
      const out = escapeHtml(`<img src=x onerror=alert(1)> & "双引号" '单引号'`)
      assert(!out.includes('<'), '未转义 <')
      assert(!out.includes('>'), '未转义 >')
      assert(out.includes('&lt;'), '缺少 &lt;')
      assert(out.includes('&amp;'), '缺少 &amp;')
      assert(out.includes('&quot;'), '缺少 &quot;')
      assert(out.includes('&#39;'), '缺少 &#39;')
    }
  },
  {
    name: 'escapeHtml 对 null / undefined 安全返回空串',
    async fn() {
      assert(escapeHtml(null) === '', 'null 未返回空串')
      assert(escapeHtml(undefined) === '', 'undefined 未返回空串')
      assert(escapeHtml(0) === '0', '数字 0 应转为字符串')
    }
  },

  // ---------- 3-5：任务表单校验 ----------
  {
    name: 'validateTodo 标题长度边界：<3 或 >20 拒绝，3~20 通过',
    async fn() {
      assert(!validateTodo('ab', '').pass, '2 字标题未拒绝')
      assert(!validateTodo('x'.repeat(21), '').pass, '21 字标题未拒绝')
      assert(validateTodo('abc', '').pass, '3 字标题应通过')
      assert(validateTodo('x'.repeat(20), '').pass, '20 字标题应通过')
    }
  },
  {
    name: 'validateTodo 描述超过 100 字拒绝',
    async fn() {
      const r = validateTodo('合法标题', 'x'.repeat(101))
      assert(!r.pass, '101 字描述未拒绝')
      assert(r.contentErr, '缺少描述错误提示')
      assert(validateTodo('合法标题', 'x'.repeat(100)).pass, '100 字描述应通过')
    }
  },
  {
    name: 'validateTodo 合法输入通过且无错误提示',
    async fn() {
      const r = validateTodo('周末去图书馆', '把操作系统作业写完，顺便还书')
      assert(r.pass, '合法输入未通过')
      assert(r.titleErr === '', '合法输入产生标题错误')
      assert(r.contentErr === '', '合法输入产生描述错误')
    }
  },

  // ---------- 6：手机号校验 ----------
  {
    name: 'validatePhone 通过合法手机号、拦截非法格式',
    async fn() {
      assert(validatePhone('13812345678') === '', '合法手机号未通过')
      assert(validatePhone('') !== '', '空手机号未拦截')
      assert(validatePhone('12345678901') !== '', '第二位不是 3-9 未拦截')
      assert(validatePhone('1381234567') !== '', '10 位未拦截')
      assert(validatePhone('138123456789') !== '', '12 位未拦截')
    }
  },

  // ---------- 7-8：日期与任务组装 ----------
  {
    name: 'formatDate 统一输出 YYYY-MM-DD（含补零）',
    async fn() {
      assert(formatDate(new Date(2026, 8, 17)) === '2026-09-17', '9 月应补零为 09')
      assert(formatDate(new Date(2026, 0, 5)) === '2026-01-05', '1 月 5 日应补零')
      assert(formatDate(new Date(2026, 11, 31)) === '2026-12-31', '12 月 31 日输出错误')
    }
  },
  {
    name: 'createTodo 组装完整默认字段',
    async fn() {
      const t = createTodo('买牛奶', '记得买脱脂的')
      assert(typeof t.id === 'number', 'id 应为数字')
      assert(t.title === '买牛奶' && t.content === '记得买脱脂的', '标题/内容未组装')
      assert(t.done === false, '新任务 done 应为 false')
      assert(t.createTime === formatDate(), 'createTime 应为今天')
      assert(t.dueTime === '', '未设预期时间时应为空串')
      const t2 = createTodo('复习', '', '2026-09-20')
      assert(t2.dueTime === '2026-09-20', '指定 dueTime 未生效')
    }
  },

  // ---------- 9-13：存储 CRUD ----------
  {
    name: 'addTodo 与 getTodoList 增查一致',
    async fn() {
      loginAs('alice')
      addTodo({ id: 1, title: '任务A', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      const list = getTodoList()
      assert(list.length === 1, '列表长度应为 1')
      assert(list[0].id === 1 && list[0].title === '任务A', '读取内容不一致')
    }
  },
  {
    name: 'getTodoById 支持字符串 id（归一化）',
    async fn() {
      loginAs('alice')
      addTodo({ id: 42, title: '归一化', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      const t = getTodoById('42')
      assert(t && t.title === '归一化', '字符串 id 找不到数字 id 任务')
      assert(getTodoById(999) === undefined, '不存在的 id 应返回 undefined')
    }
  },
  {
    name: 'delTodo 删除成功返回 true、缺失返回 false',
    async fn() {
      loginAs('alice')
      addTodo({ id: 1, title: '待删', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      assert(delTodo('1') === true, '删除存在任务应返回 true')
      assert(getTodoList().length === 0, '删除后列表应为空')
      assert(delTodo(1) === false, '删除不存在任务应返回 false')
    }
  },
  {
    name: 'editTodo 修改字段生效、任务不存在返回 false',
    async fn() {
      loginAs('alice')
      addTodo({ id: 7, title: '旧标题', content: '旧内容', done: false, createTime: '2026-09-17', dueTime: '' })
      assert(editTodo('7', { title: '新标题', content: '新内容' }) === true, '编辑存在任务应返回 true')
      const t = getTodoById(7)
      assert(t.title === '新标题' && t.content === '新内容', '编辑后内容未持久化')
      assert(editTodo(999, { title: 'x' }) === false, '编辑不存在任务应返回 false')
    }
  },
  {
    name: 'completeTodo 完成即从列表删除（与首页语义一致）',
    async fn() {
      loginAs('alice')
      addTodo({ id: 3, title: '要完成的任务', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      assert(completeTodo(3) === true, '完成任务应返回 true')
      assert(getTodoById(3) === undefined, '完成后任务应已从列表移除')
    }
  },

  // ---------- 14-15：登录注册 ----------
  {
    name: 'registerUser 加盐哈希存储、不落明文',
    async fn() {
      assert(await registerUser('alice', '123456', '13812345678') === true, '首次注册应成功')
      assert(await registerUser('alice', 'other', '') === false, '重复用户名应失败')
      const users = JSON.parse(localStorage.getItem('userList'))
      const u = users[0]
      assert(u.username === 'alice', '用户名未保存')
      assert(typeof u.salt === 'string' && u.salt.length > 0, '缺少随机盐')
      assert(typeof u.passwordHash === 'string' && u.passwordHash.length === 64, '缺少 64 位 SHA-256 哈希')
      assert(u.passwordHash !== '123456', '存储了明文密码')
      assert(!('password' in u), '仍存在明文 password 字段')
      assert(u.phone === '13812345678', '手机号未保存')
    }
  },
  {
    name: 'loginUser 正确密码通过、错误密码拒绝、旧明文自动迁移',
    async fn() {
      // 正常注册登录
      await registerUser('bob', 'abcdef', '')
      assert(await loginUser('bob', 'abcdef') === true, '正确密码应登录成功')
      assert(getCurrentUser() === 'bob', '登录后未写入 currentUser')
      logout()
      assert(getCurrentUser() === null, '退出后 currentUser 未清空')
      assert(await loginUser('bob', 'wrong') === false, '错误密码应被拒绝')

      // 旧版明文账号自动迁移
      localStorage.setItem('userList', JSON.stringify([{ username: 'old', password: 'secret' }]))
      assert(await loginUser('old', 'secret') === true, '旧明文账号应能登录')
      const migrated = JSON.parse(localStorage.getItem('userList'))[0]
      assert(!('password' in migrated), '迁移后仍保留明文 password')
      assert(typeof migrated.passwordHash === 'string' && typeof migrated.salt === 'string', '迁移未生成盐与哈希')
      logout()
      assert(await loginUser('old', 'wrong') === false, '迁移后错误密码应被拒绝')
    }
  },

  // ---------- 16-17：隔离与初始化 ----------
  {
    name: '用户待办数据按账号隔离，互不可见',
    async fn() {
      await registerUser('alice', 'p1', '')
      await registerUser('bob', 'p2', '')
      await loginUser('alice', 'p1')
      addTodo({ id: 1, title: 'alice 的任务1', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      addTodo({ id: 2, title: 'alice 的任务2', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      logout()
      await loginUser('bob', 'p2')
      addTodo({ id: 1, title: 'bob 的任务', content: '', done: false, createTime: '2026-09-17', dueTime: '' })
      logout()
      await loginUser('alice', 'p1')
      const aliceList = getTodoList()
      assert(aliceList.length === 2, 'alice 应看到自己的 2 条任务，实际 ' + aliceList.length)
      assert(aliceList.every(t => t.title.startsWith('alice')), 'alice 看到了 bob 的任务')
      logout()
      await loginUser('bob', 'p2')
      const bobList = getTodoList()
      assert(bobList.length === 1 && bobList[0].title === 'bob 的任务', 'bob 应只看到自己的 1 条任务')
    }
  },
  {
    name: '示例数据只初始化一次、删光不复活；今日完成计数按天累加',
    async fn() {
      loginAs('newbie')
      createInitTodoForNewUser()
      assert(getTodoList().length === 2, '首次登录应生成 2 条示例任务')
      createInitTodoForNewUser()
      assert(getTodoList().length === 2, '重复调用不应重复生成示例数据')
      // 删光后再次调用：initLoaded 标记防止示例数据复活
      delTodo(getTodoList()[0].id)
      delTodo(getTodoList()[0].id)
      assert(getTodoList().length === 0, '示例任务应可被全部删除')
      createInitTodoForNewUser()
      assert(getTodoList().length === 0, '删光后刷新不应复活示例数据')
      // 今日完成计数
      incrementTodayDone()
      incrementTodayDone()
      assert(getTodayDoneCount() === 2, '今日完成数应累加到 2')
    }
  }
]
