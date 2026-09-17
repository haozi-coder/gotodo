// ========== 浏览器全局模拟（仅供 Node 测试使用） ==========
// 纯逻辑层测试不需要真实浏览器，这里提供：
// 1. 内存版 localStorage（Map 实现，行为与浏览器一致：setItem 强制转字符串、缺失键返回 null）
// 2. crypto 兜底：Node 18 下 Web Crypto 不作为全局存在，从 node:crypto 引入
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}

export function createMockStorage() {
  const store = new Map()
  return {
    getItem(key) {
      return store.has(String(key)) ? store.get(String(key)) : null
    },
    setItem(key, value) {
      store.set(String(key), String(value))
    },
    removeItem(key) {
      store.delete(String(key))
    },
    clear() {
      store.clear()
    }
  }
}

// 全局共享同一份存储，模拟浏览器中单页面的 localStorage
export const mockStorage = createMockStorage()

// 每个用例执行前重置，保证用例相互独立
export function resetStorage() {
  mockStorage.clear()
}
