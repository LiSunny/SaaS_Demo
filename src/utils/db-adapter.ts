/**
 * db-adapter.ts — localStorage 持久化适配层
 *
 * 将模拟数据升级为跨刷新持久化的数据层，不改动 Store / Vue 组件代码。
 * 使用方法：在 src/api/*.ts 中，将 `let dataStore = [...]` 替换为：
 *   const store = createStore<T>('模块名', seedData)
 *
 * 首次访问时自动从 seedData 初始化 localStorage，后续从 localStorage 读取。
 */

const DB_PREFIX = 'db:'

// ===== 泛型 ID 提取 =====
type Identifiable = { id: number | string }

// ===== 持久化 Store =====
export interface PersistentStore<T extends Identifiable> {
  /** 获取全部数据（惰性初始化） */
  getAll(): T[]
  /** 按 ID 查找 */
  getById(id: T['id']): T | undefined
  /** 追加一条（自动生成数字 ID 若未提供） */
  add(item: T): T
  /** 按 ID 更新部分字段 */
  update(id: T['id'], patch: Partial<T>): T | undefined
  /** 按 ID 删除 */
  remove(id: T['id']): void
  /** 批量删除 */
  removeMany(ids: T['id'][]): void
  /** 自定义过滤 */
  findBy(predicate: (item: T) => boolean): T[]
  /** 直接替换全量数据 */
  setData(data: T[]): void
  /** 获取自增 ID 生成器 */
  nextId(): number
}

export function createPersistentStore<T extends Identifiable>(
  module: string,
  seedData: T[],
): PersistentStore<T> {
  const storageKey = `${DB_PREFIX}${module}`
  const idKey = `${DB_PREFIX}${module}:nextId`

  // —— 数据读写 ——
  function load(): T[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw)
    } catch {
      // 反序列化失败则重新初始化
    }
    // 首次访问：写入种子数据
    save(seedData)
    return [...seedData]
  }

  function save(data: T[]): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (e) {
      console.warn(`[db-adapter] localStorage 写入失败 (${storageKey}):`, e)
    }
  }

  // —— ID 生成 ——
  function nextId(): number {
    let id = 1
    try {
      const raw = localStorage.getItem(idKey)
      if (raw) id = parseInt(raw, 10)
    } catch { /* ignore */ }
    const newId = id
    try {
      localStorage.setItem(idKey, String(id + 1))
    } catch { /* ignore */ }
    return newId
  }

  function initNextId(data: T[]): void {
    const existing = localStorage.getItem(idKey)
    if (existing !== null) return
    const maxId = data.reduce((max, item) => {
      const n = typeof item.id === 'number' ? item.id : 0
      return n > max ? n : max
    }, 0)
    localStorage.setItem(idKey, String(maxId + 1))
  }

  // 初始化 nextId
  const initialData = load()
  initNextId(initialData)

  // —— API ——
  return {
    getAll(): T[] {
      return load()
    },

    getById(id: T['id']): T | undefined {
      return load().find(item => item.id === id)
    },

    add(item: T): T {
      const data = load()
      if (item.id == null || item.id === 0) {
        (item as any).id = nextId()
      }
      data.push(item)
      save(data)
      return item
    },

    update(id: T['id'], patch: Partial<T>): T | undefined {
      const data = load()
      const idx = data.findIndex(item => item.id === id)
      if (idx === -1) return undefined
      data[idx] = { ...data[idx], ...patch }
      save(data)
      return data[idx]
    },

    remove(id: T['id']): void {
      save(load().filter(item => item.id !== id))
    },

    removeMany(ids: T['id'][]): void {
      const idSet = new Set(ids)
      save(load().filter(item => !idSet.has(item.id)))
    },

    findBy(predicate: (item: T) => boolean): T[] {
      return load().filter(predicate)
    },

    setData(data: T[]): void {
      save(data)
    },

    nextId,
  }
}