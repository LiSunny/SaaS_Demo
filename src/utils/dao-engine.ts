/**
 * dao-engine.ts — 统一查询引擎
 *
 * 对 PersistentStore 的增强封装，提供：
 * - 类型安全的泛型 DAO
 * - 声明式过滤（filterMap）、排序（defaultSort）、分页
 * - transform 钩子（用于 keyword 多字段搜索）
 * - 批量删除、跨模块关联查询
 *
 * PoC 模式：接 db-adapter (localStorage)
 * 生产模式：切到 HTTP adapter，接口签名不变
 *
 * @example
 *   const dao = new Dao(store, {
 *     filterMap: q => [{ field: 'status', op: 'eq', value: q.status }],
 *     defaultSort: [{ field: 'updatedAt', dir: 'desc' }],
 *   })
 *   const { data, total } = dao.list({ page: 1, size: 20, status: 1 })
 */

import type { PersistentStore } from './db-adapter'

// ===== 查询基础类型 =====

export interface PageQuery {
  page: number
  size: number
}

export interface PageResult<T> {
  data: T[]
  total: number
}

// ===== 过滤 / 排序 =====

export type FilterOp =
  | 'eq'       // a === b
  | 'ne'       // a !== b
  | 'contains' // String(a).includes(b)
  | 'in'       // a ∈ array
  | 'gte'      // a >= b
  | 'gt'       // a > b
  | 'lte'      // a <= b
  | 'lt'       // a < b

export interface FilterRule<T> {
  field: keyof T & string
  op: FilterOp
  value: unknown
}

export interface SortRule<T> {
  field: keyof T & string
  dir: 'asc' | 'desc'
}

// ===== DAO 配置 =====

export interface DaoConfig<T, Q extends PageQuery> {
  /** 从查询参数推导过滤规则 */
  filterMap?: (query: Q) => FilterRule<T>[]
  /** 默认排序（query 层可扩展覆盖） */
  defaultSort?: SortRule<T>[]
  /**
   * 后处理钩子（在 filter 之后、sort/page 之前执行）
   * 适合 keyword 多字段搜索（OR 语义）、衍生字段计算
   */
  transform?: (items: T[], query: Q) => T[]
}

// ===== DAO 主类 =====

export class Dao<
  T extends { id: number | string },
  Q extends PageQuery = PageQuery,
> {
  private store: PersistentStore<T>
  private config: DaoConfig<T, Q>

  constructor(store: PersistentStore<T>, config: DaoConfig<T, Q> = {}) {
    this.store = store
    this.config = config
  }

  /** 查询列表（过滤 → transform → 排序 → 分页） */
  list(query: Q): PageResult<T> {
    const { filterMap, defaultSort, transform } = this.config

    // 1. 全量数据
    let items = this.store.getAll()

    // 2. 过滤（AND 语义）
    if (filterMap) {
      for (const rule of filterMap(query)) {
        items = items.filter(item => this.matches(item, rule))
      }
    }

    // 3. 后处理（多字段搜索 / 衍生字段）
    if (transform) {
      items = transform(items, query)
    }

    // 4. 排序
    const sorts = defaultSort ?? []
    if (sorts.length > 0) {
      items = [...items].sort((a, b) => this.compare(a, b, sorts))
    }

    // 5. 分页
    const total = items.length
    const start = (query.page - 1) * query.size
    const data = items.slice(start, start + query.size)

    return { data, total }
  }

  // ===== 标准 CRUD =====

  getById(id: T['id']): T | undefined {
    return this.store.getById(id)
  }

  create(item: T): T {
    return this.store.add(item)
  }

  update(id: T['id'], patch: Partial<T>): T | undefined {
    return this.store.update(id, patch)
  }

  remove(id: T['id']): void {
    this.store.remove(id)
  }

  removeMany(ids: T['id'][]): void {
    this.store.removeMany(ids)
  }

  // ===== 跨模块关联查询 =====

  /** 获取全量（不做过滤分页，供其他 DAO 做内存级 JOIN） */
  getAll(): T[] {
    return this.store.getAll()
  }

  /** 自定义谓词过滤 */
  findBy(predicate: (item: T) => boolean): T[] {
    return this.store.findBy(predicate)
  }

  // ===== private =====

  private matches(item: T, rule: FilterRule<T>): boolean {
    const value = (item as Record<string, unknown>)[rule.field]
    switch (rule.op) {
      case 'eq':
        return value === rule.value
      case 'ne':
        return value !== rule.value
      case 'contains':
        return String(value ?? '').includes(String(rule.value))
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value)
      case 'gte':
        return (value as number) >= (rule.value as number)
      case 'gt':
        return (value as number) > (rule.value as number)
      case 'lte':
        return (value as number) <= (rule.value as number)
      case 'lt':
        return (value as number) < (rule.value as number)
      default:
        return true
    }
  }

  private compare(a: T, b: T, sorts: SortRule<T>[]): number {
    for (const s of sorts) {
      const field = s.field as string
      const va = (a as Record<string, unknown>)[field] ?? ''
      const vb = (b as Record<string, unknown>)[field] ?? ''
      let cmp: number
      if (typeof va === 'string' && typeof vb === 'string') {
        cmp = va.localeCompare(vb)
      } else {
        cmp = va < vb ? -1 : va > vb ? 1 : 0
      }
      if (cmp !== 0) return s.dir === 'desc' ? -cmp : cmp
    }
    return 0
  }
}
