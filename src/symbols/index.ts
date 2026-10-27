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

/** 连线路径方式 */
export type EdgeRouteMode = 'auto' | 'align' | 'manual'

/** 连线输入结构（与 SceneEdge 对齐） */
export interface EdgeLike {
  from: { node: string; port?: number }
  to: { node: string; port?: number }
  via?: [number, number][]
  kind?: string
  routeMode?: EdgeRouteMode
}

/** 端口引出段长度（px） */
const STUB = 16

/** 去重相邻重复点 */
function dedupe(pts: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (const p of pts) {
    const last = out[out.length - 1]
    if (last && last[0] === p[0] && last[1] === p[1]) continue
    out.push(p)
  }
  return out
}

/**
 * 有效路径方式：显式 routeMode 优先；否则有折点按手动折行、无折点按自动中点。
 * 保证带 via 的历史布局走线不变，新连线默认拐点居中。
 */
export function edgeRouteMode(edge: EdgeLike): EdgeRouteMode {
  if (edge.routeMode) return edge.routeMode
  return edge.via && edge.via.length ? 'manual' : 'auto'
}

/**
 * 自动中点路由：路径经过两个端口连线的中点。
 * 中间长边取两端口偏移的较大者：纵向差大 → 中间段竖直（拐点列在中点列）；横向差大 → 中间段水平。
 * 端口方向背离目标时取消引出段，避免折返。
 */
function autoPoints(
  pa: { x: number; y: number },
  A: { x: number; y: number },
  B: { x: number; y: number },
  pb: { x: number; y: number },
  va: { x: number; y: number },
): Array<[number, number]> {
  const dx = pb.x - pa.x
  const dy = pb.y - pa.y
  const verticalMiddle = Math.abs(dy) >= Math.abs(dx)

  const conflictH = va.x !== 0 && dx !== 0 && Math.sign(dx) !== Math.sign(va.x)
  const conflictV = va.y !== 0 && dy !== 0 && Math.sign(dy) !== Math.sign(va.y)
  const s = conflictH || conflictV ? { x: pa.x, y: pa.y } : A

  const pts: Array<[number, number]> = [
    [pa.x, pa.y],
    [s.x, s.y],
  ]
  if (verticalMiddle) {
    const cx = (pa.x + pb.x) / 2
    pts.push([cx, s.y])
    pts.push([cx, B.y])
  } else {
    const cy = (pa.y + pb.y) / 2
    pts.push([s.x, cy])
    pts.push([B.x, cy])
  }
  pts.push([B.x, B.y])
  pts.push([pb.x, pb.y])
  return dedupe(pts)
}

/** 对齐目标路由：拐点落在目标节点所在列/行（历史默认观感） */
function alignPoints(
  pa: { x: number; y: number },
  A: { x: number; y: number },
  B: { x: number; y: number },
  pb: { x: number; y: number },
): Array<[number, number]> {
  const pts: Array<[number, number]> = [
    [pa.x, pa.y],
    [A.x, A.y],
  ]
  if (B.x !== A.x) pts.push([B.x, A.y])
  if (B.y !== A.y) pts.push([B.x, B.y])
  pts.push([pb.x, pb.y])
  return dedupe(pts)
}

/** 手动折点路由：按 via 依次横→纵折行 */
function manualPoints(
  pa: { x: number; y: number },
  A: { x: number; y: number },
  B: { x: number; y: number },
  pb: { x: number; y: number },
  via: [number, number][],
): Array<[number, number]> {
  const pts: Array<[number, number]> = [
    [pa.x, pa.y],
    [A.x, A.y],
  ]
  let cur = { x: A.x, y: A.y }
  for (const m of via) {
    if (m[0] !== cur.x) pts.push([m[0], cur.y])
    if (m[1] !== cur.y) pts.push([m[0], m[1]])
    cur = { x: m[0], y: m[1] }
  }
  if (B.x !== cur.x) pts.push([B.x, cur.y])
  if (B.y !== cur.y) pts.push([B.x, B.y])
  pts.push([pb.x, pb.y])
  return dedupe(pts)
}

/** 连线折点（正交路径点序，源 → 目标） */
export function edgePoints(
  edge: EdgeLike,
  nodes: Array<{ id: string; symbol: string; x: number; y: number; size?: number }>,
): Array<[number, number]> {
  const a = nodes.find((n) => n.id === edge.from.node)
  const b = nodes.find((n) => n.id === edge.to.node)
  if (!a || !b) return []
  if (edge.kind === 'control') return [[a.x, a.y], [b.x, b.y]]

  const pa = portPos(a, edge.from.port ?? 0)
  const pb = portPos(b, edge.to.port ?? 0)
  if (!pa || !pb) return []

  const va = dirVec(pa.dir)
  const vb = dirVec(pb.dir)
  const A = { x: pa.x + va.x * STUB, y: pa.y + va.y * STUB }
  const B = { x: pb.x + vb.x * STUB, y: pb.y + vb.y * STUB }

  const mode = edgeRouteMode(edge)
  if (mode === 'manual') return manualPoints(pa, A, B, pb, edge.via ?? [])
  if (mode === 'align') return alignPoints(pa, A, B, pb)
  return autoPoints(pa, A, B, pb, va)
}

/** 点序 → SVG 路径 */
function pointsToPath(pts: Array<[number, number]>): string {
  if (!pts.length) return ''
  return 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')
}

/** 连线路径（正交，电气连线走直线） */
export function edgePath(
  edge: EdgeLike,
  nodes: Array<{ id: string; symbol: string; x: number; y: number; size?: number }>,
): string {
  return pointsToPath(edgePoints(edge, nodes))
}

/** 反向连线路径（点序倒置，几何不变、走向相反） */
export function edgePathReversed(
  edge: EdgeLike,
  nodes: Array<{ id: string; symbol: string; x: number; y: number; size?: number }>,
): string {
  return pointsToPath(edgePoints(edge, nodes).slice().reverse())
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
