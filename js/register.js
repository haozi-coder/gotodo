import {registerUser, validatePhone} from "./common.js"

const msgDom = document.querySelector('#msg')

// 左下角「返回登录」→ 跳转登录窗口
document.querySelector('#backLoginBtn').onclick = function() {
  location.replace('./login.html')
}

// 注册：用户名唯一校验 + 手机号格式校验
document.querySelector('#regForm').onsubmit = async function(e) {
  e.preventDefault()
  const u = document.querySelector('#regUser').value.trim()
  const p = document.querySelector('#regPwd').value.trim()
  const phone = document.querySelector('#regPhone').value.trim()

  if (!u || !p) {
    msgDom.className = 'tip'
    msgDom.textContent = '用户名和密码不能为空'
    return
  }
  const phoneErr = validatePhone(phone)
  if (phoneErr) {
    msgDom.className = 'tip'
    msgDom.textContent = phoneErr
    return
  }

  if (await registerUser(u, p, phone)) {
    msgDom.className = 'tip tip-ok'
    msgDom.textContent = '注册成功！正在跳转登录…'
    // 回登录窗口并预填用户名，只需输密码即可登录
    setTimeout(() => location.replace('./login.html?u=' + encodeURIComponent(u)), 800)
  } else {
    msgDom.className = 'tip'
    msgDom.textContent = '用户名已存在，请换一个'
  }
}
