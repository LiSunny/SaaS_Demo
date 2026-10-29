/**
 * 子系统监测页 · 组态绑定公共内核
 *
 * 消防水、气体灭火两套场景配置共用同一批工具函数：
 * 成员解析（带缓存）、组内状态汇总、图元状态类映射。
 *
 * 各系统只在自己的配置文件里声明「哪个图元管哪批点位」和「这个图元显示什么值」。
 */
import type { MetricDef, PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type { SubsystemNodeBinding } from '@/types/subsystem-scene'

/**
 * 成员列表缓存（按点位清单的数组引用分桶）
 *
 * 「这个节点管哪些点位」每轮刷新都要回答一遍：组态节点绑定 + 统计卡，
 * 直接 filter 就是 N × 点位数 次谓词调用，外加 N 个大数组的分配。
 * 而成员集合只随点位清单变化（loadSubsystem 时换一份数组），
 * 所以缓存后每轮 0 次遍历，聚合只做真正需要的那一遍。
 */
const memberCache = new WeakMap<PointDef[], Map<string, PointDef[]>>()

function cachedMembers(points: PointDef[], key: string, build: () => PointDef[]): PointDef[] {
  let byKey = memberCache.get(points)
  if (!byKey) {
    byKey = new Map()
    memberCache.set(points, byKey)
  }
  let list = byKey.get(key)
  if (!list) {
    list = build()
    byKey.set(key, list)
  }
  return list
}

/** 按绑定规则取出该节点所辖点位 */
export function resolveNodePoints(
  binding: SubsystemNodeBinding,
  points: PointDef[],
): PointDef[] {
  return cachedMembers(points, `node:${binding.symbol}#${binding.nth ?? 1}`, () => {
    const list = points.filter(p => {
      if (!binding.match.typeKeys.includes(p.typeKey)) return false
      if (binding.match.codePrefix && !p.code.startsWith(binding.match.codePrefix)) return false
      return true
    })
    if (!binding.match.slice) return list
    const [start, end] = binding.match.slice
    return list.slice(start, end)
  })
}

/** 取点位档案里的指标定义 */
export function metricOf(point: PointDef | undefined, key: string): MetricDef | undefined {
  return point?.metrics.find(m => m.key === key)
}

/** 点位实时状态 */
export function statusOf(
  point: PointDef,
  getRuntime: (id: string) => PointRuntime | undefined,
): PointStatus {
  return getRuntime(point.id)?.status ?? 'unknown'
}

/** 数值化（非法值返回 undefined） */
export function num(v: unknown): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** 固定小数位 */
export function fmt(v: number, precision = 2): string {
  return v.toFixed(precision)
}

/** 组内点位状态汇总：报警 > 故障 > 离线 > 正常 */
export function groupStatus(
  members: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): 'alarm' | 'fault' | 'offline' | 'normal' {
  let alarm = 0
  let fault = 0
  let offline = 0
  for (const p of members) {
    const s = statusOf(p, getRuntime)
    if (s === 'alarm') alarm++
    else if (s === 'fault') fault++
    else if (s === 'offline') offline++
  }
  if (alarm > 0) return 'alarm'
  if (fault > 0) return 'fault'
  if (offline > 0) return 'offline'
  return 'normal'
}

/**
 * 图元状态标记
 *
 * 与页面图例同一套色：正常=绿(is-run)、预警=红(is-over，超限)、故障=橙(is-fault)、
 * 离线=灰(is-off)。
 */
export function analogState(status: 'alarm' | 'fault' | 'offline' | 'normal'): Record<string, boolean> {
  if (status === 'alarm') return { over: true }
  if (status === 'fault') return { fault: true }
  if (status === 'offline') return { off: true }
  return { run: true }
}

/**
 * 计数口径的状态标记
 *
 * 开关量类节点（开阀数 / 启动数 / 运行数）：异常优先，
 * 否则按计数表达常态（开=is-open、关=is-closed、未启动=is-off）。
 */
export function countState(
  kind: 'runningCount' | 'openCount' | 'startedCount',
  status: 'alarm' | 'fault' | 'offline' | 'normal',
  on: number,
): Record<string, boolean> {
  if (status === 'alarm' || status === 'fault' || status === 'offline') return { fault: true }
  if (kind === 'openCount') return on > 0 ? { open: true } : { closed: true }
  if (kind === 'startedCount') return on > 0 ? { run: true } : { off: true }
  return { run: true }
}
