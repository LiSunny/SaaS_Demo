/**
 * 消防水系统监控 · 报警记录 Store
 *
 * 职责边界：
 *   - 由子系统点位的状态跃迁实时累积报警记录（模拟真实报警流水）
 *   - 首次加载补一段确定性历史，使"报警记录"在值守场景下有可查的历史
 *   - 记录与点位一一绑定（pointId），点位集合变化时整体重置
 *
 * 数据口径与 `useSubsystemStore` 一致（演示数据），未落库。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type { FireAlarmLevel, FireAlarmRecord, FireAlarmStatus } from '@/types/firewater'
import { alarmReasonText } from '@/components/subsystem/alarm-reason'

/** 记录条数上限：超出丢弃最旧 */
const MAX_RECORDS = 200

/** 首次加载补的历史条数 */
const SEED_HISTORY = 12

/** 历史记录的时间跨度（72 小时） */
const SEED_SPAN_MS = 72 * 3600 * 1000

/** 字符串哈希：让同一批点位每次生成同样的历史，避免刷新后记录乱跳 */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pseudo(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** 等级：消防水源不足 = 紧急；模拟量超限 = 重要；设备故障/离线 = 一般 */
function levelOf(point: PointDef, status: PointStatus): FireAlarmLevel {
  if (status === 'alarm') return point.typeKey === 'water_level' ? 'critical' : 'important'
  return 'general'
}

function typeName(point: PointDef): string {
  const t = point.typeKey
  if (t === 'water_level') return '液位探测器'
  if (t === 'pipe_pressure') return '压力探测器'
  if (t === 'flow_sensor') return '流量传感器'
  if (t === 'valve_switch') return '阀门探测装置'
  if (t === 'hydrant_test') return '末端试水装置'
  if (t === 'pipe_host') return '消防管网监控主机'
  if (t === 'pipe_slave') return '消防管网监控分机'
  return t
}

/** 故障 / 离线的原因文案 */
function deviceReason(point: PointDef, status: PointStatus): string {
  const name = typeName(point)
  return status === 'offline' ? `${name}通信中断` : `${name}设备故障`
}

/**
 * 历史记录的原因文案
 *
 * 模拟量按"阈值 + 确定性偏移"合成过去值：数值可由指标限值复算，不随手编。
 */
function historyReason(point: PointDef, seed: number): { reason: string; level: FireAlarmLevel } {
  const analog = point.metrics.find(m => m.kind === 'analog' && (m.highLimit != null || m.lowLimit != null))
  if (!analog) {
    return { reason: deviceReason(point, 'fault'), level: 'general' }
  }
  const r = pseudo(seed)
  const unit = analog.unit ?? ''
  const precision = analog.precision ?? 2
  if (analog.highLimit != null) {
    const offset = 0.05 + r() * 0.5
    const v = Number((analog.highLimit + offset).toFixed(precision))
    return {
      reason: `${analog.label} ${v}${unit} 已超上限 ${analog.highLimit}${unit}`,
      level: point.typeKey === 'water_level' ? 'critical' : 'important',
    }
  }
  const low = analog.lowLimit!
  const offset = 0.05 + r() * 0.5
  const v = Number(Math.max(0, low - offset).toFixed(precision))
  return {
    reason: `${analog.label} ${v}${unit} 已低于下限 ${low}${unit}`,
    level: point.typeKey === 'water_level' ? 'critical' : 'important',
  }
}

export const useFirewaterAlarmStore = defineStore('firewater-alarm', () => {
  /** 报警记录（新的在前） */
  const records = ref<FireAlarmRecord[]>([])

  /** 上一轮的点位状态快照：pointId → status */
  let snapshot = new Map<string, PointStatus>()
  /** 当前绑定的点位集合签名，变化即整体重置 */
  let boundSignature = ''
  let seeded = false
  let seq = 0

  /** 未处理条数 */
  const unhandledCount = computed(() => records.value.filter(r => r.status === 'unhandled').length)

  function nextId(): string {
    seq += 1
    return `fa-${Date.now().toString(36)}-${seq}`
  }

  function makeRecord(
    point: PointDef,
    status: PointStatus,
    runtime: PointRuntime | undefined,
    occurredAt: number,
  ): FireAlarmRecord {
    const reason = status === 'alarm' ? alarmReasonText(point, runtime) : ''
    return {
      id: nextId(),
      pointId: point.id,
      code: point.code,
      location: point.location,
      level: levelOf(point, status),
      reason: reason || deviceReason(point, status),
      status: 'unhandled' as FireAlarmStatus,
      occurredAt,
    }
  }

  /**
   * 首次绑定：当前已处于报警/故障的点位各记一条（与组态状态一致），
   * 再补一段确定性历史。
   */
  function seed(points: PointDef[], getRuntime: (id: string) => PointRuntime | undefined): void {
    const now = Date.now()
    const fresh: FireAlarmRecord[] = []

    for (const p of points) {
      const rt = getRuntime(p.id)
      const s = rt?.status ?? 'unknown'
      snapshot.set(p.id, s)
      if (s === 'alarm' || s === 'fault') {
        fresh.push(makeRecord(p, s, rt, now))
      }
    }

    // 历史：优先挑有模拟量限值的点位，其次任意点位
    const analogPoints = points.filter(p =>
      p.metrics.some(m => m.kind === 'analog' && (m.highLimit != null || m.lowLimit != null)),
    )
    const pool = analogPoints.length ? analogPoints : points
    const history: FireAlarmRecord[] = []
    if (pool.length) {
      const r = pseudo(hash(`firewater-history-${pool.length}`))
      const used = new Set<string>()
      let guard = 0
      while (history.length < SEED_HISTORY && guard < SEED_HISTORY * 20) {
        guard++
        const p = pool[Math.floor(r() * pool.length)]
        if (used.has(p.id)) continue
        used.add(p.id)
        const seedVal = hash(p.id)
        const { reason, level } = historyReason(p, seedVal)
        history.push({
          id: nextId(),
          pointId: p.id,
          code: p.code,
          location: p.location,
          level,
          reason,
          status: 'unhandled',
          occurredAt: now - Math.floor(r() * SEED_SPAN_MS),
        })
      }
    }

    records.value = [...fresh, ...history].sort((a, b) => b.occurredAt - a.occurredAt)
    seeded = true
  }

  /**
   * 与最新运行状态同步
   *
   * 只在"正常 → 报警/故障"这一跃迁上记一条：同一状态周期内不重复追加。
   */
  function sync(points: PointDef[], getRuntime: (id: string) => PointRuntime | undefined): void {
    const sig = points.length
      ? `${points[0].id}|${points[points.length - 1].id}|${points.length}`
      : ''
    if (sig !== boundSignature) {
      boundSignature = sig
      snapshot.clear()
      seeded = false
    }
    if (!points.length) return

    if (!seeded) {
      seed(points, getRuntime)
      return
    }

    const added: FireAlarmRecord[] = []
    for (const p of points) {
      const rt = getRuntime(p.id)
      const s = rt?.status ?? 'unknown'
      const prev = snapshot.get(p.id)
      if (prev === 'normal' && (s === 'alarm' || s === 'fault')) {
        added.push(makeRecord(p, s, rt, Date.now()))
      }
      snapshot.set(p.id, s)
    }
    if (added.length) {
      records.value = [...added, ...records.value].slice(0, MAX_RECORDS)
    }
  }

  /** 标记已处理 */
  function markHandled(id: string): void {
    records.value = records.value.map(r => (r.id === id ? { ...r, status: 'handled' as FireAlarmStatus } : r))
  }

  /** 清空并解除绑定（子系统切换时用） */
  function reset(): void {
    records.value = []
    snapshot.clear()
    boundSignature = ''
    seeded = false
  }

  return { records, unhandledCount, sync, markHandled, reset }
})
