/**
 * 自定义图元 — 类型定义
 *
 * 平台内新增的图元（组态图元管理）。内置图元是图元库构建产物、只读不可删，
 * 这里的记录由服务端 Prisma 返回，产品图存 OSS。
 */

/** 连接点方向 */
export type SymbolPortDir = 'left' | 'right' | 'up' | 'down'

/** 绑定点类型：自定义图元只有产品图，无指针/旋转几何，故不开放 angle */
export type SymbolBindingKind = 'bool' | 'level' | 'text'

/** 连接点（64×64 画布坐标） */
export interface CustomSymbolPort {
  x: number
  y: number
  dir: SymbolPortDir
}

/** 绑定点（点名全局唯一） */
export interface CustomSymbolBinding {
  /** 绑定名，如「运行」「液位」 */
  name: string
  kind: SymbolBindingKind
  /** 点名 */
  point: string
  /** 置位时启用的状态类 */
  onClass?: string[]
  /** 复位时启用的状态类 */
  offClass?: string[]
  unit?: string
  min?: number
  max?: number
  alarmLo?: number
  alarmHi?: number
}

/** 自定义图元记录（服务端返回） */
export interface CustomSymbolItem {
  /** 数据库主键 */
  id: number
  /** 图元 ID，如 CUS-PUMP-01 */
  symbolId: string
  name: string
  /** 所属系统：pipeline / gas / smoke / common */
  system: string
  /** 二级分类，归入图元库已有分类 */
  category: string
  desc: string
  /** 产品图公网地址 */
  imageUrl: string
  /** 产品图 OSS object key */
  imageKey: string
  /** 内容包围盒 [x0,y0,x1,y1]，512 空间，与图元库 img/index.json 同格式 */
  bbox: number[]
  ports: CustomSymbolPort[]
  bindings: CustomSymbolBinding[]
  /** null = 平台级共享 */
  enterpriseId: number | null
  createdAt: string
  updatedAt: string
}

/** 新增/更新提交体 */
export interface CustomSymbolForm {
  symbolId: string
  name: string
  system: string
  category: string
  desc?: string
  imageUrl: string
  imageKey?: string
  bbox?: number[]
  ports?: CustomSymbolPort[]
  bindings?: CustomSymbolBinding[]
  enterpriseId?: number | null
}

/** 图元库已声明的状态类（与 manifest.spec.stateColors 同源） */
export const SYMBOL_STATE_CLASSES: Array<{ value: string; label: string }> = [
  { value: 'is-run', label: '运行' },
  { value: 'is-off', label: '停机/备用' },
  { value: 'is-fault', label: '故障' },
  { value: 'is-manual', label: '手动' },
  { value: 'is-open', label: '阀开' },
  { value: 'is-closed', label: '阀关' },
  { value: 'is-over', label: '溢流/超高' },
  { value: 'is-flow', label: '过流' },
  { value: 'is-alarm', label: '报警' },
  { value: 'is-discharge', label: '喷放' },
]
