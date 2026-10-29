/**
 * 子系统监测页 · 报警记录公共 Store
 *
 * 三个系统页的报警流水逻辑完全一样：按点位状态跃迁实时累积 + 首次加载补一段
 * 确定性历史，差别只有「设备类型叫什么」「这条报警算几级」。
 * 这里把逻辑做成工厂，各系统只传自己的口径。
 *
 * 数据口径与 `useSubsystemStore` 一致（演示数据），未落库。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type { SubsystemAlarmLevel, SubsystemAlarmRecord, SubsystemAlarmStatus } from '@/types/subsystem-scene'
import { alarmReasonText, findAlarmReason } from '@/components/subsystem/alarm-reason'

/** 记录条数上限：超出丢弃最旧 */
const MAX_RECORDS = 200

/** 首次加载补的历史条数 */
const SEED_HISTORY = 12

/** 历史记录的时间跨度（72 小时） */
const SEED_SPAN_MS = 72 * 3600 * 1000

/** 各系统的报警口径 */
export interface SubsystemAlarmOptions {
  /** pinia store id（各系统唯一） */
  storeId: string
  /** 设备档案类型 key → 名称 */
  typeNameOf: (typeKey: string) => string
  /**
   * 报警等级判定
   *
   * @param dir 越限方向：high=超上限 / low=低于下限 / null=非模拟量越限（设备故障、离线）
   */
  levelOf: (
    point: PointDef,
    status: PointStatus,
    dir: 'high' | 'low' | null,
  ) => SubsystemAlarmLevel
  /** 历史记录随机种子前缀（换系统要换，否则两边历史完全一样） */
  seedPrefix: string
}

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

/** 故障 / 离线的原因文案 */
function deviceReason(name: string, status: PointStatus): string {
  return status === 'offline' ? `${name}通信中断` : `${name}设备故障`
}

/**
 * 历史记录的原因文案
 *
 * 模拟量按"阈值 + 确定性偏移"合成过去值：数值可由指标限值复算，不随手编。
 */
function historyReason(
  point: PointDef,
  seed: number,
  typeNameOf: (typeKey: string) => string,
  levelOf: SubsystemAlarmOptions['levelOf'],
): { reason: string; level: SubsystemAlarmLevel } {
  const analog = point.metrics.find(m => m.kind === 'analog' && (m.highLimit != null || m.lowLimit != null))
  if (!analog) {
    const level = levelOf(point, 'fault', null)
    return { reason: deviceReason(typeNameOf(point.typeKey), 'fault'), level }
  }
  const r = pseudo(seed)
  const unit = analog.unit ?? ''
  const precision = analog.precision ?? 2
  if (analog.highLimit != null) {
    const offset = 0.05 + r() * 0.5
    const v = Number((analog.highLimit + offset).toFixed(precision))
    return {
      reason: `${analog.label} ${v}${unit} 已超上限 ${analog.highLimit}${unit}`,
      level: levelOf(point, 'alarm', 'high'),
    }
  }
  const low = analog.lowLimit!
  const offset = 0.05 + r() * 0.5
  const v = Number(Math.max(0, low - offset).toFixed(precision))
  return {
    reason: `${analog.label} ${v}${unit} 已低于下限 ${low}${unit}`,
    level: levelOf(point, 'alarm', 'low'),
  }
}

/**
 * 报警记录 Store 工厂
 *
 * 用法：
 *   export const useGasAlarmStore = createSubsystemAlarmStore({
 *     storeId: 'gas-alarm',
 *     typeNameOf: ...,
 *     levelOf: ...,
 *     seedPrefix: 'gas-history',
 *   })
 */
export function createSubsystemAlarmStore(options: SubsystemAlarmOptions) {
  const { typeNameOf, levelOf, seedPrefix } = options

  return defineStore(options.storeId, () => {
    /** 报警记录（新的在前） */
    const records = ref<SubsystemAlarmRecord[]>([])

    /** 上一轮的点位状态快照：pointId → status */
    let snapshot = new Map<string, PointStatus>()
    /** 当前绑定的点位集合签名，变化即整体重置 */
    let boundSignature = ''
    let seeded = false
    let seq = 0

    /** 未处理条数 */
    const unhandledCount = computed(
      () => records.value.filter(r => r.status === 'unhandled').length,
    )

    function nextId(): string {
      seq += 1
      return `sa-${Date.now().toString(36)}-${seq}`
    }

    function makeRecord(
      point: PointDef,
      status: PointStatus,
      runtime: PointRuntime | undefined,
      occurredAt: number,
    ): SubsystemAlarmRecord {
      const reason = status === 'alarm' ? alarmReasonText(point, runtime) : ''
      const dir = findAlarmReason(point, runtime)?.dir ?? null
      const name = typeNameOf(point.typeKey)
      return {
        id: nextId(),
        pointId: point.id,
        code: point.code,
        location: point.location,
        level: levelOf(point, status, dir),
        reason: reason || deviceReason(name, status),
        status: 'unhandled' as SubsystemAlarmStatus,
        occurredAt,
        pointStatus: status,
        typeKey: point.typeKey,
        hostId: point.hostId,
      }
    }

    /**
     * 首次绑定：当前已处于报警/故障的点位各记一条（与组态状态一致），
     * 再补一段确定性历史。
     */
    function seed(
      points: PointDef[],
      getRuntime: (id: string) => PointRuntime | undefined,
    ): void {
      const now = Date.now()
      const fresh: SubsystemAlarmRecord[] = []

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
      const history: SubsystemAlarmRecord[] = []
      if (pool.length) {
        const r = pseudo(hash(`${seedPrefix}-${pool.length}`))
        const used = new Set<string>()
        let guard = 0
        while (history.length < SEED_HISTORY && guard < SEED_HISTORY * 20) {
          guard++
          const p = pool[Math.floor(r() * pool.length)]
          if (used.has(p.id)) continue
          used.add(p.id)
          const seedVal = hash(p.id)
          const { reason, level } = historyReason(p, seedVal, typeNameOf, levelOf)
          history.push({
            id: nextId(),
            pointId: p.id,
            code: p.code,
            location: p.location,
            level,
            reason,
            status: 'unhandled',
            occurredAt: now - Math.floor(r() * SEED_SPAN_MS),
            pointStatus: level === 'general' ? 'fault' : 'alarm',
            typeKey: p.typeKey,
            hostId: p.hostId,
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
    function sync(
      points: PointDef[],
      getRuntime: (id: string) => PointRuntime | undefined,
    ): void {
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

      const added: SubsystemAlarmRecord[] = []
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
      records.value = records.value.map(r =>
        r.id === id ? { ...r, status: 'handled' as SubsystemAlarmStatus } : r,
      )
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
}
