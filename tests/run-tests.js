// ========== gotodo 自动化测试入口 ==========
// 运行方式（项目根目录下）：
//   npm test
//   或 node tests/run-tests.js
// 退出码：0 = 全部通过；1 = 存在失败
import { mockStorage, resetStorage } from './mock-storage.js'
import { tests } from './common.test.js'

// 注入 localStorage 全局（common.js 的数据读写都依赖它）
globalThis.localStorage = mockStorage

// ---------- 17 项逻辑测试 ----------
console.log('')
console.log('========== gotodo 逻辑测试（17 项） ==========')
let passed = 0
const failed = []
for (const t of tests) {
  resetStorage()
  try {
    await t.fn()
    passed++
    console.log(`  ✅ ${t.name}`)
  } catch (err) {
    failed.push({ name: t.name, message: err.message })
    console.log(`  ❌ ${t.name}`)
    console.log(`     ↳ ${err.message}`)
  }
}

// ---------- 页面脚本语法检查 ----------
// 页面脚本依赖浏览器 DOM（document / location），Node 无法真正执行，
// 这里只验证「语法级」正确：import 能完成解析即为通过；
// 抛 ReferenceError（缺浏览器全局）属于运行期预期，不算语法错误。
async function checkSyntax(path) {
  try {
    await import(path)
    return true
  } catch (err) {
    return !(err instanceof SyntaxError)
  }
}

console.log('')
console.log('========== 页面脚本语法检查 ==========')
const syntaxTargets = ['../js/index.js', '../js/detail.js']
const syntaxResults = []
for (const p of syntaxTargets) {
  const ok = await checkSyntax(p)
  syntaxResults.push(ok)
  console.log(`  ${ok ? '✅' : '❌'} ${p.replace('../js/', 'js/')}`)
}

// ---------- 汇总 ----------
console.log('')
const total = tests.length
const allPassed = failed.length === 0 && syntaxResults.every(Boolean)
if (allPassed) {
  console.log(`========== 全部通过：${passed}/${total} 项逻辑测试 + ${syntaxResults.length} 个脚本语法检查 ✅ ==========`)
} else {
  console.log(`========== 存在失败：${passed}/${total} 项逻辑测试通过 ❌ ==========`)
  for (const f of failed) console.log(`  - ${f.name}：${f.message}`)
}
console.log('')
process.exitCode = allPassed ? 0 : 1
