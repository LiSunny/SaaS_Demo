/**
 * 子系统实时监测 Store
 *
 * 职责边界：
 *   - 由 SubsystemProfile 生成演示点位数据（真实项目替换为 WebSocket/API 推送）
 *   - 维护实时刷新计时器，模拟 7×24 连续数据流
 *   - 页面只消费本 store，不关心数据从 mock 还是 socket 来
 */

import { defineStore } from 'pinia'
import { ref, computed, shallowRef, reactive, markRaw, nextTick } from 'vue'
import type {
  PointDef,
  PointRuntime,
  PointStatus,
  SubsystemProfile,
  DeviceProfile,
} from '@/types/subsystem'
import { SUBSYSTEM_PROFILES, getSubsystemProfile } from '@/config/subsystem-profiles'

/** 建筑/区域分布（演示用，真实项目由空间树驱动） */
const ZONES = [
  'A 区教学楼', 'B 区实验楼', 'C 区图书馆', 'D 区宿舍楼',
  'E 区行政楼', 'F 区体育馆', 'G 区食堂', 'H 区车库',
]

/**
 * 演示场景注入比例：真实消防系统不会是"全绿"或"全红"，
 * 而是"绝大多数正常 + 少量报警/故障"。这里给出一个可调的初始异常率。
 */
const DEMO_ANOMALY_RATE = 0.06 // 约 6% 的点位处于报警/故障，用于验证告警链路与视觉层次

/** 刷新周期（毫秒） */
const REFRESH_INTERVAL_MS = 3000

function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export const useSubsystemStore = defineStore('subsystem', () => {
  /** 点位清单（按档案生成） */
  const points = shallowRef<PointDef[]>([])
  /**
   * 运行时数据 pointId → PointRuntime
   *
   * 用 keyed 的 reactive Map 而不是 `ref<Record<...>>`：
   * 整体替换 Record 会让所有订阅者一次性失效（组态 12 节点、4 张卡片、719 行下钻抽屉
   * 每次刷新全部重渲染）。Map.set 只触发该点位的依赖，
   * 未变化的点位（791 个阀门是开关量，值几乎不动）不再参与刷新。
   */
  const runtime = reactive(new Map<string, PointRuntime>())
  /**
   * 运行时点位对象必须是 raw（markRaw），不能是响应式代理。
   *
   * 代理对象有两个代价，都落在每轮刷新上：
   *   1. 每读一个字段都要过一次 proxy handler —— 一轮要对 1156 个点位读
   *      状态 + 数值 + 趋势，上万次代理读是每轮 JS 的主要开销；
   *   2. 在 computed 里读代理字段，会给每个字段各建一条依赖，
   *      一条 computed 就能攒出上万条依赖，失效时的依赖清理随之变贵。
   *
   * 改成 raw 之后：
   *   - 字段读变回普通属性读；
   *   - 响应式粒度落在 reactive Map 的「键」上：点位值变了就整体替换该键，
   *     订阅这个键的组件（抽屉行、详情抽屉、组态节点）照常拿到新值，
   *     没变化的点位不会被重渲染。
   *
   * ⚠️ 别改回代理：症状是"开刷新几秒后整页假死"，不是"数据不更新"。
   */
  /**
   * 刷新序号：每轮 tick 自增。
   * runtime 的 Map 引用不变、内容变，watch(runtime) 不会触发，报警同步靠它驱动。
   */
  const refreshSeq = ref(0)
  /** 当前激活子系统 */
  const activeKey = ref('')
  /** 最后更新时间戳 */
  const lastUpdate = ref(0)
  /** 是否正在实时刷新 */
  const live = ref(true)

  /** 刷新定时器句柄（null = 当前没有在刷新） */
  const timer = ref<number | null>(null)

  /**
   * 刷新是否真的在跑。
   * live=true 只代表"用户没有手动暂停"，不代表定时器还活着——
   * 页面切换时定时器被停掉而 live 仍是 true，就会出现"显示在刷新、实际不动"的假象。
   * 这个状态给 UI 用：宁可显式告诉用户"刷新已停止"，也不要让值守员看着静止的数据。
   */
  const timerRunning = computed(() => timer.value != null)

  /** 主机/分机状态 */
  const hostStatus = ref<Record<string, PointStatus>>({})

  // ===== 档案索引 =====
  const profileMap = computed(() => {
    const m = new Map<string, DeviceProfile>()
    const p = activeProfile.value
    if (!p) return m
    ;[...p.hostProfiles, ...p.deviceProfiles].forEach(d => m.set(d.typeKey, d))
    return m
  })

  const activeProfile = computed<SubsystemProfile | undefined>(() =>
    getSubsystemProfile(activeKey.value),
  )

  function findProfile(typeKey: string): DeviceProfile | undefined {
    const p = activeProfile.value
    if (!p) return undefined
    return [...p.hostProfiles, ...p.deviceProfiles].find(d => d.typeKey === typeKey)
  }

  // ===== 数据生成 =====

  function generatePoints(profile: SubsystemProfile) {
    const list: PointDef[] = []
    let seed = profile.key.length * 7919
    const r = pseudoRandom(seed)

    // 主机
    list.push({
      id: `${profile.key}-host-1`,
      typeKey: profile.hostProfiles[0]?.typeKey ?? 'host',
      code: 'HOST-01',
      location: '消防控制室',
      metrics: profile.hostProfiles[0]?.metrics ?? [],
    })

    // 分机
    for (let i = 0; i < profile.scale.slave; i++) {
      list.push({
        id: `${profile.key}-slave-${i + 1}`,
        typeKey: profile.hostProfiles[1]?.typeKey ?? profile.hostProfiles[0]?.typeKey,
        code: `SLAVE-${String(i + 1).padStart(2, '0')}`,
        location: ZONES[i % ZONES.length],
        metrics: profile.hostProfiles[1]?.metrics ?? [],
      })
    }

    // 采集设备
    profile.scale.devices.forEach((group, gi) => {
      const dp = findProfile(group.typeKey)
      for (let i = 0; i < group.count; i++) {
        const zone = ZONES[Math.floor(r() * ZONES.length)]
        list.push({
          id: `${profile.key}-${group.typeKey}-${gi}-${i}`,
          typeKey: group.typeKey,
          code: `${group.codePrefix}-${String(i + 1).padStart(4, '0')}`,
          location: `${zone} ${1 + Math.floor(r() * 6)} 层`,
          hostId: `${profile.key}-slave-${(i % profile.scale.slave) + 1}`,
          metrics: dp?.metrics ?? [],
          controllable: dp?.controllable,
          videoChannel: group.typeKey === 'valve_switch' ? 100 + (i % 120) : undefined,
        })
      }
    })

    return list
  }

  function initialRuntime(points: PointDef[]): Map<string, PointRuntime> {
    const map = new Map<string, PointRuntime>()
    const p = activeProfile.value
    if (!p) return map

    for (const pt of points) {
      const values: Record<string, number | string> = {}
      const trend: Record<string, number[]> = {}

      for (const m of pt.metrics) {
        if (m.kind === 'status') {
          values[m.key] = 'normal'
        } else if (m.kind === 'switch') {
          const first = m.states?.[0]?.value ?? 'normal'
          const rngStates = m.states ?? []
          const v = rngStates.length > 1 && Math.random() < 0.25
            ? rngStates[1].value
            : first
          values[m.key] = v
        } else {
          // 在"正常工作区间"内取值：normalRange 优先，缺省回退到 range 中段。
          // 这样演示数据不会因为量程远大于工作区间而全部落在报警区。
          const [rMin, rMax] = m.range ?? [0, 100]
          const [nMin, nMax] = m.normalRange ?? [
            rMin + (rMax - rMin) * 0.4,
            rMin + (rMax - rMin) * 0.7,
          ]
          const mid = nMin + (nMax - nMin) * (0.3 + Math.random() * 0.4)
          values[m.key] = Number(mid.toFixed(m.precision ?? 2))
          const series: number[] = []
          let cur = mid
          for (let t = 0; t < 24; t++) {
            cur = Math.max(rMin, Math.min(rMax, cur + (Math.random() - 0.5) * (nMax - nMin) * 0.12))
            series.push(Number(cur.toFixed(m.precision ?? 2)))
          }
          trend[m.key] = series
        }
      }

      // 注入少量异常点位：模拟真实运行中的报警/故障分布
      let status: PointStatus = 'normal'
      if (Math.random() < DEMO_ANOMALY_RATE) {
        /**
         * 报警必须能说清原因（哪个量、超了哪条限）。
         * 只有开关量/状态量、没有阈值型模拟量的点位（如阀门、试水装置）注入"报警"会变成
         * 无法解释的红块 —— 这类点位只注入"故障"，由设备自身状态体现。
         */
        const hasLimit = pt.metrics.some(
          m => m.kind === 'analog' && (m.highLimit != null || m.lowLimit != null),
        )
        const isFault = !hasLimit || Math.random() < 0.3
        status = isFault ? 'fault' : 'alarm'
        if (isFault) {
          // 故障：把状态量置为故障
          for (const m of pt.metrics) {
            if (m.kind === 'status') values[m.key] = 'fault'
            if (m.kind === 'switch') {
              values[m.key] = m.states?.find(s => s.tone === 'fault')?.value ?? 'fault'
            }
          }
        } else {
          // 报警：把模拟量推出阈值
          for (const m of pt.metrics) {
            if (m.kind !== 'analog') continue
            const [rMin, rMax] = m.range ?? [0, 100]
            if (m.lowLimit != null && Math.random() < 0.5) {
              values[m.key] = Number((rMin + (rMax - rMin) * 0.03).toFixed(m.precision ?? 2))
              if (trend[m.key]) trend[m.key][trend[m.key].length - 1] = values[m.key] as number
            } else if (m.highLimit != null) {
              values[m.key] = Number((rMax - (rMax - rMin) * 0.03).toFixed(m.precision ?? 2))
              if (trend[m.key]) trend[m.key][trend[m.key].length - 1] = values[m.key] as number
            }
          }
        }
      }

      map.set(
        pt.id,
        markRaw({
          pointId: pt.id,
          status,
          values,
          trend,
          updatedAt: Date.now(),
        }),
      )
    }
    return map
  }

  // ===== 实时刷新 =====

  /**
   * 一轮刷新
   *
   * 只写回真正变化的点位：
   *   - 阀门 / 末端试水 / 主机分机是开关量与状态量，值几乎不动 → 不写回 → 不重渲染
   *   - 压力 / 流量 / 水位是模拟量，每轮都漂移 → 写回
   * 未变化的点位保持对象引用不变，updatedAt 也不更新（数据没变，时间戳就不该变）。
   */
  function tick() {
    const p = activeProfile.value
    if (!p) return

    for (const pt of points.value) {
      const cur = runtime.get(pt.id)
      if (!cur) continue

      /**
       * values 惰性拷贝：开关量与状态量几乎不变，先不拷贝，
       * 确认要改值时再复制一份。1156 个点位每轮都拷贝一遍是纯浪费。
       */
      let values: Record<string, number | string> | null = null
      const ensureValues = (): Record<string, number | string> => {
        if (!values) values = { ...cur.values }
        return values
      }
      const trend = cur.trend
      let status = cur.status
      let dirty = false

      const setStatus = (s: PointStatus) => {
        if (s !== status) {
          status = s
          dirty = true
        }
      }

      for (const m of pt.metrics) {
        if (m.kind === 'status') {
          // 极小概率故障
          if (Math.random() < 0.0004) setStatus('fault')
          else if (status === 'fault' && Math.random() < 0.35) setStatus('normal')
        } else if (m.kind === 'switch') {
          // 开关量轻微抖动：故障态概率出现
          if (Math.random() < 0.0006) {
            setStatus('fault')
            const v = m.states?.find(s => s.tone === 'fault')?.value ?? 'fault'
            if (cur.values[m.key] !== v) {
              ensureValues()[m.key] = v
              dirty = true
            }
          } else if (status === 'fault' && Math.random() < 0.4) {
            setStatus('normal')
          }
        } else {
          const [min, max] = m.range ?? [0, 100]
          const [nMin, nMax] = m.normalRange ?? [min, max]
          const prev = Number(cur.values[m.key] ?? nMin)
          // 以工作区间宽度为步长小幅漂移，避免大幅跳变失真
          let v = prev + (Math.random() - 0.5) * (nMax - nMin) * 0.08
          v = Math.max(min, Math.min(max, v))
          const nv = Number(v.toFixed(m.precision ?? 2))
          if (cur.values[m.key] !== nv) {
            ensureValues()[m.key] = nv
            dirty = true
          }
          if (trend?.[m.key]) {
            const s = trend[m.key]
            s.push(nv)
            if (s.length > 24) s.shift()
          }
          // 阈值判定
          if (m.highLimit != null && nv >= m.highLimit) setStatus('alarm')
          else if (m.lowLimit != null && nv <= m.lowLimit) setStatus('alarm')
          else if (status === 'alarm') setStatus('normal')
        }
      }

      if (!dirty) continue

      runtime.set(
        pt.id,
        markRaw({
          pointId: pt.id,
          status,
          values: values ?? cur.values,
          trend,
          updatedAt: Date.now(),
        }),
      )
    }

    lastUpdate.value = Date.now()
    refreshSeq.value++
  }

  /**
   * 刷新定时器：自调度链，不是 setInterval
   *
   * 为什么不用 setInterval：
   *   setInterval 按固定节奏无条件触发，回调排队不会自我收敛。
   *   一旦「一轮刷新」的总耗时（tick + Vue 渲染 + 布局）超过刷新周期，
   *   待执行的回调就会越攒越多 —— 页面不是在变慢，是在持续假死，
   *   表现就是"开启刷新几秒后组态动画卡住、菜单也点不动"。
   *
   * 自调度链保证任何时刻最多只有一轮在飞：
   *   tick() → 等 Vue 把本轮渲染刷完（nextTick）→ 再排下一轮。
   * 单轮再慢也只是刷新变慢，不会堆积。
   *
   * 这里不用 requestAnimationFrame 收尾：后台标签页里 rAF 不触发，
   * 链会断掉，页面回到前台后数据也不再刷新。nextTick 与标签页可见性无关。
   */
  function startTimer() {
    stopTimer()
    if (!live.value) return

    const schedule = () => {
      timer.value = window.setTimeout(async () => {
        if (!live.value) return
        tick()
        // 等本轮渲染刷完，再排下一轮
        await nextTick()
        if (live.value) schedule()
      }, REFRESH_INTERVAL_MS)
    }

    schedule()
  }

  function stopTimer() {
    if (timer.value != null) {
      clearTimeout(timer.value)
      timer.value = null
    }
  }

  function toggleLive() {
    live.value = !live.value
    if (live.value) startTimer()
    else stopTimer()
  }

  // ===== 对外 actions =====

  function loadSubsystem(key: string) {
    const p = getSubsystemProfile(key)
    if (!p) return
    /**
     * 同一子系统的不同页面之间切换时（设备列表页 ↔ 组态总览页），
     * 数据还在，但上一个页面卸载时会 stopTimer()。
     * 这里必须把刷新续上 —— 否则新页面会永远停在旧数据上，
     * 在值守场景下就表现为"页面卡死"（界面正常、数据不动）。
     */
    if (activeKey.value === key && points.value.length) {
      startTimer()
      return
    }
    activeKey.value = key
    const list = generatePoints(p)
    points.value = list
    runtime.clear()
    for (const [id, r] of initialRuntime(list)) runtime.set(id, r)

    hostStatus.value = {}
    hostStatus.value[`${key}-host-1`] = 'normal'
    for (let i = 0; i < p.scale.slave; i++) {
      hostStatus.value[`${key}-slave-${i + 1}`] = Math.random() < 0.12 ? 'fault' : 'normal'
    }

    stopTimer()
    startTimer()
  }

  // ===== 派生数据 =====

  /** 状态计数（全量，含未渲染点位） */
  const statusCount = computed(() => {
    const c: Record<PointStatus, number> = {
      normal: 0, alarm: 0, fault: 0, offline: 0, shielded: 0, unknown: 0,
    }
    for (const pt of points.value) {
      const r = runtime.get(pt.id)
      if (!r) { c.unknown++; continue }
      c[r.status] = (c[r.status] ?? 0) + 1
    }
    return c
  })

  /** 主机/分机列表 */
  const hosts = computed(() => {
    const p = activeProfile.value
    if (!p) return []
    const out: Array<{ point: PointDef; profile: DeviceProfile | undefined; status: PointStatus }> = []
    for (const pt of points.value) {
      if (pt.id.includes('-host-') || pt.id.includes('-slave-')) {
        out.push({
          point: pt,
          profile: findProfile(pt.typeKey),
          status: hostStatus.value[pt.id] ?? 'normal',
        })
      }
    }
    return out
  })

  /** 按设备类型分组的点位（用于分区渲染） */
  const groupedBySection = computed(() => {
    const p = activeProfile.value
    if (!p) return []
    return p.sections.map(sec => {
      const pts = points.value
        .filter(pt => sec.showTypes.includes(pt.typeKey) && !pt.id.includes('-host-') && !pt.id.includes('-slave-'))
      return { section: sec, points: pts }
    })
  })

  /** 单点位运行时数据 */
  function getRuntime(pointId: string): PointRuntime | undefined {
    return runtime.get(pointId)
  }

  return {
    profiles: SUBSYSTEM_PROFILES,
    activeKey,
    activeProfile,
    points,
    runtime,
    refreshSeq,
    lastUpdate,
    live,
    timerRunning,
    hostStatus,
    statusCount,
    hosts,
    groupedBySection,
    profileMap,
    loadSubsystem,
    findProfile,
    getRuntime,
    toggleLive,
    startTimer,
    stopTimer,
  }
})