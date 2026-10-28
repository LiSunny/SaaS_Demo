/**
 * 图元库接入层
 *
 * 图元库（symbol-library/）是独立子工程，产物为纯 JS；平台侧只做三件事：
 *   1. 建运行时（渲染 / 赋状态）
 *   2. 暴露图元元数据与点表
 *   3. 提供画布需要的几何计算（端口坐标、连线正交路径、状态类）
 *
 * 位图走 public/symbols/img（服务路径 /symbols/img/），由 scripts/sync-symbol-assets.mjs 同步。
 *
 * 平台内新增的自定义图元（Prisma + OSS）不重建图元库，而是在运行时叠加：
 * 注册时把图元写进 SYMBOLS / SYMBOL_POINTS / DEF_MAP / GEOMETRY / GEOMETRY_IMAGE /
 * symbolRuntime.defs，渲染链路与内置图元完全一致。
 */
import { reactive, ref } from 'vue'
import '@symbols/symbols.css'
import './theme.css'

import { MANIFEST, GEOMETRY, GEOMETRY_IMAGE, BADGES } from '@symbols/symbols.js'
import { createRuntime } from '@symbols/runtime.js'
import pointsCsv from '@symbols/points.sample.csv?raw'
import type { SymbolDef, SymbolSystemMeta, SymbolCategoryMeta } from '@symbols/symbols.js'
import type { CustomSymbolItem } from '@/types/symbol'

export type { SymbolDef, SymbolBinding, SymbolPort, SymbolSystemMeta, SymbolCategoryMeta } from '@symbols/symbols.js'

/** 图元运行时单例 */
export const symbolRuntime = createRuntime(MANIFEST, GEOMETRY, GEOMETRY_IMAGE)

/** 图元库元数据 */
export const SYMBOL_MANIFEST = MANIFEST

/** 图片版位图目录（public/symbols/img 的服务路径） */
export const IMAGE_BASE = '/symbols/img'

/** 画布网格（px），与图元库 SPEC.grid 一致 */
export const SYMBOL_GRID = MANIFEST.spec.grid

/**
 * 安全渲染图元
 *
 * 图元库 runtime 对未知图元直接抛错。自定义图元是异步注册进渲染链路的，
 * 页面首帧可能先于注册完成 —— 抛错会中断 Vue 的挂载队列，
 * 导致同批次的其他缩略图 / 画布节点一起不渲染。
 * 这里改为返回 null，由调用方在图元注册完成后重绘。
 */
export function renderSymbolSafe(
  id: string,
  opts?: Parameters<typeof symbolRuntime.renderSymbol>[1],
): SVGSVGElement | null {
  try {
    return symbolRuntime.renderSymbol(id, opts)
  } catch {
    return null
  }
}

/** 全部图元（内置 + 平台内新增的自定义图元） */
export const SYMBOLS = reactive([...MANIFEST.symbols]) as SymbolDef[]

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
  // 超限（模拟量越限）也是一种异常：不映射就没有任何状态类，
  // 图元既不亮光晕也不挂角标，报警设备和正常设备长得一模一样
  if (s.over) out.push('is-over')
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

/** 解析点表 CSV（跳过表头，空行忽略） */
function parsePoints(csv: string): SymbolPoint[] {
  return csv
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
}

/** 点表（图元库生成，示例限值须按现场整定；平台内新增的自定义图元在注册时追加） */
export const SYMBOL_POINTS = reactive(parsePoints(pointsCsv)) as SymbolPoint[]

/** 按图元 ID 取该图元的可绑定点名 */
export function pointsOfSymbol(symbolId: string): SymbolPoint[] {
  return SYMBOL_POINTS.filter((p) => p.symbolId === symbolId)
}

// ============================================================
// 自定义图元（平台内新增）—— 运行时注册
//
// 不重建图元库：注册时把图元写进 SYMBOLS / SYMBOL_POINTS / DEF_MAP /
// GEOMETRY / GEOMETRY_IMAGE / symbolRuntime.defs，渲染链路与内置图元完全一致。
// ============================================================

/** 自定义图元 ID 前缀（与内置图元 ID 段区分） */
export const CUSTOM_SYMBOL_PREFIX = 'CUS-'

/** 平台内新增的图元 ID 集合 */
const CUSTOM_SYMBOL_IDS = new Set<string>()

/**
 * 图元注册版本号
 *
 * 自定义图元是异步拉取后注册进渲染链路的，页面首帧可能先于注册完成。
 * 缩略图与画布节点监听此版本号，注册完成后重绘。
 */
export const SYMBOL_REGISTRY_VERSION = ref(0)

/** 该图元是否为平台内新增的自定义图元 */
export function isCustomSymbol(id: string): boolean {
  return CUSTOM_SYMBOL_IDS.has(id)
}

/** 数值保留两位 */
function r2(n: number): number {
  return Number(n.toFixed(2))
}

/** XML 文本转义 */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 图片版几何：位图本体 + 状态光晕 + 状态角标
 *
 * 与图元库 imageMarkup 同构，但 <image> 不带 data-file ——
 * runtime.js 只在存在 data-file 时才把 href 拼成 imageBase/xxx，
 * 省略后 href 保留产品图的公网地址。
 */
function customImageMarkup(bbox: number[], imageUrl: string): string {
  const S = 64 / 512
  const [x0, y0, x1, y1] = bbox.length === 4 ? bbox : [0, 0, 512, 512]
  const cx = ((x0 + x1) / 2) * S
  const cy = ((y0 + y1) / 2) * S
  const rx = ((x1 - x0) / 2) * S * 0.82
  const ry = ((y1 - y0) / 2) * S * 0.82
  return [
    `<ellipse class="sym-halo" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"/>`,
    `<image class="sym-img" href="${imageUrl}" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>`,
    BADGES,
  ].join('')
}

/** 线框版占位：自定义图元只有产品图，线框版画方框 + 名称 */
function customLineMarkup(name: string): string {
  return [
    '<rect class="sym-outline" x="8" y="8" width="48" height="48" rx="4"/>',
    `<text class="sym-label" x="32" y="36">${escapeXml(name)}</text>`,
  ].join('')
}

/** 自定义图元 → 图元库定义（与内置 SymbolDef 同构） */
function toCustomDef(item: CustomSymbolItem): SymbolDef {
  let textIndex = 0
  const bindings = item.bindings.map((b) => {
    const o: Record<string, unknown> = { ...b }
    if (b.kind === 'text') o.textIndex = textIndex++
    return o as unknown as SymbolDef['bindings'][number]
  })

  return {
    id: item.symbolId,
    name: item.name,
    category: item.category,
    system: item.system,
    screen: null,
    desc: item.desc,
    size: { w: 64, h: 64 },
    anchor: [32, 32],
    ports: item.ports.map((p) => ({ x: p.x, y: p.y, dir: p.dir })),
    pivots: {},
    image: item.imageUrl,
    styles: ['image'],
    bindings,
  }
}

/** 自定义图元 → 点表行 */
function toCustomPoints(item: CustomSymbolItem): SymbolPoint[] {
  return item.bindings.map((b) => ({
    point: b.point,
    symbolId: item.symbolId,
    symbolName: item.name,
    system: item.system,
    category: item.category,
    binding: b.name,
    dataType: b.kind,
    register: '',
    rw: 'R',
    min: b.min === undefined ? '' : String(b.min),
    max: b.max === undefined ? '' : String(b.max),
    unit: b.unit ?? '',
    alarmLo: b.alarmLo === undefined ? '' : String(b.alarmLo),
    alarmHi: b.alarmHi === undefined ? '' : String(b.alarmHi),
    deadband: '',
    delay: '',
    screen: '',
    note: '',
  }))
}

/**
 * 注册一个自定义图元到渲染链路
 * 同 ID 重复注册视为更新（先注销再注册）
 */
export function registerCustomSymbol(item: CustomSymbolItem): void {
  if (CUSTOM_SYMBOL_IDS.has(item.symbolId)) unregisterCustomSymbol(item.symbolId)

  const def = toCustomDef(item)
  GEOMETRY_IMAGE[item.symbolId] = customImageMarkup(item.bbox, item.imageUrl)
  GEOMETRY[item.symbolId] = customLineMarkup(item.name)
  DEF_MAP.set(item.symbolId, def)
  symbolRuntime.defs.set(item.symbolId, def)
  SYMBOLS.push(def)
  SYMBOL_POINTS.push(...toCustomPoints(item))
  CUSTOM_SYMBOL_IDS.add(item.symbolId)
  SYMBOL_REGISTRY_VERSION.value++
}

/** 画面文件内联的自定义图元定义（组态配置导出格式） */
export interface InlineSymbolDef {
  /** 图元 ID，如 CUS-PSW-01 */
  id: string
  name: string
  category: string
  system: string
  /** 产品图公网地址 */
  image?: string
  ports?: Array<{ x: number; y: number; dir: string }>
  bindings?: Array<Record<string, unknown>>
}

/**
 * 用画面文件内联的定义补齐自定义图元
 *
 * 组态配置导出的画面文件自带图元定义（产品图地址 + 端口 + 绑定点），
 * 监控页据此渲染，不依赖服务端是否已收录。
 * 服务端已收录的以服务端为准（包围盒更准、产品图更新），这里只补缺失的。
 *
 * @returns 新注册的图元个数
 */
export function registerInlineSymbols(defs: InlineSymbolDef[]): number {
  let added = 0
  for (const d of defs) {
    if (!d.id || symbolDef(d.id)) continue
    registerCustomSymbol({
      id: 0,
      symbolId: d.id,
      name: d.name,
      system: d.system,
      category: d.category,
      desc: '',
      imageUrl: d.image ?? '',
      imageKey: '',
      // 文件里没有包围盒：按整图铺满，光晕范围偏大但不影响识别
      bbox: [0, 0, 512, 512],
      ports: (d.ports ?? []) as unknown as CustomSymbolItem['ports'],
      bindings: (d.bindings ?? []) as unknown as CustomSymbolItem['bindings'],
      enterpriseId: null,
      createdAt: '',
      updatedAt: '',
    })
    added++
  }
  return added
}

/**
 * 注销一个自定义图元
 * 只清平台内新增的图元，内置图元不受影响
 */
export function unregisterCustomSymbol(symbolId: string): void {
  if (!CUSTOM_SYMBOL_IDS.has(symbolId)) return

  const idx = SYMBOLS.findIndex((s) => s.id === symbolId)
  if (idx >= 0) SYMBOLS.splice(idx, 1)
  for (let i = SYMBOL_POINTS.length - 1; i >= 0; i--) {
    if (SYMBOL_POINTS[i].symbolId === symbolId) SYMBOL_POINTS.splice(i, 1)
  }
  DEF_MAP.delete(symbolId)
  symbolRuntime.defs.delete(symbolId)
  delete GEOMETRY_IMAGE[symbolId]
  delete GEOMETRY[symbolId]
  CUSTOM_SYMBOL_IDS.delete(symbolId)
  SYMBOL_REGISTRY_VERSION.value++
}
