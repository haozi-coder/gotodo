import {renderHeader, renderFooter, getTodoList} from './common.js'
renderHeader()
renderFooter()

window.onload = function(){
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
