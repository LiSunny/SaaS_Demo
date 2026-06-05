/**
 * org-data.ts — 组织架构 Mock 数据
 *
 * 从 PersonSelector.vue 抽取，供 DynamicForm 等组件复用。
 */

export interface OrgDepartment {
  id: number
  name: string
}

export interface OrgPosition {
  id: number
  name: string
  deptId: number
}

export interface OrgPerson {
  id: number
  name: string
  deptId: number
  posId: number
}

// ===== Mock 数据 =====

export const DEPARTMENTS: OrgDepartment[] = [
  { id: 1, name: '产品开发部' },
  { id: 2, name: '设计部' },
  { id: 3, name: '运维部' },
  { id: 4, name: '市场部' },
  { id: 5, name: '质量管理部' },
]

export const POSITIONS: OrgPosition[] = [
  { id: 1, name: '产品经理', deptId: 1 },
  { id: 2, name: 'iOS工程师', deptId: 1 },
  { id: 3, name: '前端工程师', deptId: 1 },
  { id: 4, name: 'UI设计师', deptId: 2 },
  { id: 5, name: '交互设计师', deptId: 2 },
  { id: 6, name: '运维工程师', deptId: 3 },
  { id: 7, name: '市场专员', deptId: 4 },
  { id: 8, name: '测试工程师', deptId: 5 },
]

export const PERSONS: OrgPerson[] = [
  { id: 1,  name: '黎世雨', deptId: 1, posId: 1 },
  { id: 2,  name: '李磊',   deptId: 1, posId: 2 },
  { id: 3,  name: '李熙',   deptId: 1, posId: 3 },
  { id: 4,  name: '高江云', deptId: 1, posId: 2 },
  { id: 5,  name: '李浩敏', deptId: 1, posId: 2 },
  { id: 6,  name: '杨婷彤', deptId: 2, posId: 4 },
  { id: 7,  name: '谢东',   deptId: 3, posId: 6 },
  { id: 8,  name: '陈洪燕', deptId: 4, posId: 7 },
  { id: 9,  name: '梁冬',   deptId: 5, posId: 8 },
  { id: 10, name: '马达',   deptId: 3, posId: 6 },
  { id: 11, name: '杨伟',   deptId: 2, posId: 5 },
  { id: 12, name: '高楠',   deptId: 4, posId: 7 },
]

// ===== 查询辅助 =====

export function getDeptName(deptId: number): string {
  return DEPARTMENTS.find(d => d.id === deptId)?.name || '暂未划分'
}

export function getPosName(posId: number): string {
  return POSITIONS.find(p => p.id === posId)?.name || '暂未划分'
}

export function getPersonsByDept(deptId: number): OrgPerson[] {
  return PERSONS.filter(p => p.deptId === deptId)
}

export function getPersonsByPos(posId: number): OrgPerson[] {
  return PERSONS.filter(p => p.posId === posId)
}

// ===== 按类型获取下拉选项 =====

export type CallbackDataType = 'person' | 'department' | 'position'

/**
 * 根据动态数据源类型返回下拉选项
 */
export function resolveCallbackOptions(type: CallbackDataType): { value: string; label: string }[] {
  switch (type) {
    case 'person':
      return PERSONS.map(p => ({ value: String(p.id), label: `${p.name} · ${getDeptName(p.deptId)}` }))
    case 'department':
      return DEPARTMENTS.map(d => ({ value: String(d.id), label: d.name }))
    case 'position':
      return POSITIONS.map(p => ({ value: String(p.id), label: `${p.name}（${getDeptName(p.deptId)}）` }))
    default:
      return []
  }
}
