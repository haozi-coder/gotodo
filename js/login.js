import {loginUser, getCurrentUser, createInitTodoForNewUser, userExists} from "./common.js"

const msgDom = document.querySelector('#msg')

// 如果已经登录，直接跳首页
if (getCurrentUser()) {
  location.replace("./index.html")
}

// 注册成功跳回登录时预填用户名（login.html?u=xxx）
const prefill = new URLSearchParams(location.search).get('u')
if (prefill) {
  document.querySelector('#username').value = prefill
  document.querySelector('#pwd').focus()
}

// 左下角「去注册」→ 跳转注册窗口
document.querySelector('#goRegisterBtn').onclick = function() {
  location.replace('./register.html')
}

// 登录：第一步验证账号是否存在，第二步校验密码
document.querySelector('#loginForm').onsubmit = async function(e) {
  e.preventDefault()
  const u = document.querySelector('#username').value.trim()
  const p = document.querySelector('#pwd').value.trim()

  if (!u || !p) {
    msgDom.textContent = '用户名和密码不能为空'
    return
  }

  // 第一步：先验证账号是否存在，不存在则提示注册
  if (!userExists(u)) {
    msgDom.textContent = '账号不存在，请先注册'
    return
  }

  // 第二步：校验密码
  if (await loginUser(u, p)) {
    createInitTodoForNewUser() // 新用户首次登录生成示例任务（仅一次）
    location.replace("./index.html")
  } else {
    msgDom.textContent = '密码错误，请重试'
  }
}
