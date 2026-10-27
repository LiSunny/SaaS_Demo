/**
 * 图元库接入层
 *
 * 图元库（symbol-library/）是独立子工程，产物为纯 JS；平台侧只做三件事：
 *   1. 建运行时（渲染 / 赋状态）
 *   2. 暴露图元元数据与点表
 *   3. 提供画布需要的几何计算（端口坐标、连线正交路径、状态类）
 *
 * 位图走 public/symbols/img（服务路径 /symbols/img/），由 scripts/sync-symbol-assets.mjs 同步。
 */
import '@symbols/symbols.css'
import './theme.css'

import { MANIFEST, GEOMETRY, GEOMETRY_IMAGE } from '@symbols/symbols.js'
import { createRuntime } from '@symbols/runtime.js'
import pointsCsv from '@symbols/points.sample.csv?raw'
import type { SymbolDef, SymbolSystemMeta, SymbolCategoryMeta } from '@symbols/symbols.js'

export type { SymbolDef, SymbolBinding, SymbolPort, SymbolSystemMeta, SymbolCategoryMeta } from '@symbols/symbols.js'

/** 图元运行时单例 */
export const symbolRuntime = createRuntime(MANIFEST, GEOMETRY, GEOMETRY_IMAGE)

/** 图元库元数据 */
export const SYMBOL_MANIFEST = MANIFEST

/** 图片版位图目录（public/symbols/img 的服务路径） */
export const IMAGE_BASE = '/symbols/img'

/** 画布网格（px），与图元库 SPEC.grid 一致 */
export const SYMBOL_GRID = MANIFEST.spec.grid

/** 全部图元 */
export const SYMBOLS = MANIFEST.symbols

/** 一级分类：系统归属，与平台 systemKey 同源（pipeline / gas / smoke / common） */
export const SYMBOL_SYSTEMS: SymbolSystemMeta[] = MANIFEST.systems ?? []

/** 二级分类：部件类别 */
export const SYMBOL_CATEGORIES: SymbolCategoryMeta[] = MANIFEST.categories ?? []

/** 分类键 → 分类元数据 */
const CATEGORY_MAP = new Map<string, SymbolCategoryMeta>(
  SYMBOL_CATEGORIES.map((c) => [c.key, c]),
)

/** 图元所属系统 */
export function symbolSystem(id: string): string | undefined {
  return symbolDef(id)?.system
}

/** 分类元数据 */
export function symbolCategory(key: string): SymbolCategoryMeta | undefined {
  return CATEGORY_MAP.get(key)
}

/** 某系统下的图元（含通用件） */
export function symbolsOfSystem(systemKey: string): SymbolDef[] {
  return SYMBOLS.filter((s) => s.system === systemKey || s.system === 'common')
}

const DEF_MAP = new Map<string, SymbolDef>(SYMBOLS.map((s) => [s.id, s]))

/** 按 ID 取图元定义 */
export function symbolDef(id: string): SymbolDef | undefined {
  return DEF_MAP.get(id)
}

/** 状态标志 → CSS 状态类（与图元库 is-* 类名一致） */
export function stateClasses(state?: Record<string, boolean>): string[] {
  const s = state || {}
  const out: string[] = []
  if (s.run) out.push('is-run')
  if (s.fault) out.push('is-fault')
  if (s.alarm) out.push('is-alarm')
  if (s.discharge) out.push('is-discharge')
  if (s.manual) out.push('is-manual')
  if (s.open) out.push('is-open')
  if (s.closed) out.push('is-closed')
  if (!out.length && s.off) out.push('is-off')
  return out
}

/** 端口在画布上的绝对坐标 */
export function portPos(
  node: { symbol: string; x: number; y: number; size?: number },
  port: number,
): { x: number; y: number; dir: string } | null {
  const def = symbolDef(node.symbol)
  const p = def?.ports?.[port]
  if (!p) return null
  const s = node.size || 60
  return {
    x: node.x - s / 2 + (p.x * s) / 64,
    y: node.y - s / 2 + (p.y * s) / 64,
    dir: p.dir || 'right',
  }
}

/** 出线方向单位向量 */
export function dirVec(d: string): { x: number; y: number } {
  if (d === 'left') return { x: -1, y: 0 }
  if (d === 'up') return { x: 0, y: -1 }
  if (d === 'down') return { x: 0, y: 1 }
  return { x: 1, y: 0 }
}

/** 连线路径（正交，电气连线走直线） */
export function edgePath(
  edge: {
    from: { node: string; port?: number }
    to: { node: string; port?: number }
    via?: [number, number][]
    kind?: string
  },
  nodes: Array<{ id: string; symbol: string; x: number; y: number; size?: number }>,
): string {
  const a = nodes.find((n) => n.id === edge.from.node)
  const b = nodes.find((n) => n.id === edge.to.node)
  if (!a || !b) return ''
  if (edge.kind === 'control') return `M${a.x},${a.y} L${b.x},${b.y}`

  const pa = portPos(a, edge.from.port ?? 0)
  const pb = portPos(b, edge.to.port ?? 0)
  if (!pa || !pb) return ''

  const va = dirVec(pa.dir)
  const vb = dirVec(pb.dir)
  const A = { x: pa.x + va.x * 16, y: pa.y + va.y * 16 }
  const B = { x: pb.x + vb.x * 16, y: pb.y + vb.y * 16 }
  const pts: Array<[number, number]> = [
    [pa.x, pa.y],
    [A.x, A.y],
  ]
  let cur = A
  for (const m of edge.via || []) {
    if (m[0] !== cur.x) pts.push([m[0], cur.y])
    if (m[1] !== cur.y) pts.push([m[0], m[1]])
    cur = { x: m[0], y: m[1] }
  }
  if (B.x !== cur.x) pts.push([B.x, cur.y])
  if (B.y !== cur.y) pts.push([B.x, B.y])
  pts.push([pb.x, pb.y])
  return 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')
}

/** 拖拽连线时的预览路径 */
export function linkPath(
  from: { node: string; port: number },
  nodes: Array<{ id: string; symbol: string; x: number; y: number; size?: number }>,
  mouse: { x: number; y: number },
): string {
  const a = nodes.find((n) => n.id === from.node)
  if (!a) return ''
  const pa = portPos(a, from.port)
  if (!pa) return ''
  const va = dirVec(pa.dir)
  const A = { x: pa.x + va.x * 16, y: pa.y + va.y * 16 }
  const pts: Array<[number, number]> = [
    [pa.x, pa.y],
    [A.x, A.y],
  ]
  if (A.x !== mouse.x) pts.push([mouse.x, A.y])
  pts.push([mouse.x, mouse.y])
  return 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')
}

/** 点表一行 */
export interface SymbolPoint {
  point: string
  symbolId: string
  symbolName: string
  /** 所属系统（一级分类） */
  system: string
  category: string
  binding: string
  dataType: string
  register: string
  rw: string
  min: string
  max: string
  unit: string
  alarmLo: string
  alarmHi: string
  deadband: string
  delay: string
  screen: string
  note: string
}

const CSV_COLUMNS = [
  'point', 'symbolId', 'symbolName', 'system', 'category', 'binding', 'dataType', 'register', 'rw',
  'min', 'max', 'unit', 'alarmLo', 'alarmHi', 'deadband', 'delay', 'screen', 'note',
] as const

/** 点表（图元库生成，示例限值须按现场整定） */
export const SYMBOL_POINTS: SymbolPoint[] = pointsCsv
  .replace(/^\uFEFF/, '')
  .split(/\r?\n/)
  .filter((line) => line.trim() !== '')
  .slice(1)
  .map((line) => {
    const cells = line.split(',')
    const row: Record<string, string> = {}
    CSV_COLUMNS.forEach((col, i) => {
      row[col] = cells[i] ?? ''
    })
    return row as unknown as SymbolPoint
  })

/** 按图元 ID 取该图元的可绑定点名 */
export function pointsOfSymbol(symbolId: string): SymbolPoint[] {
  return SYMBOL_POINTS.filter((p) => p.symbolId === symbolId)
}
