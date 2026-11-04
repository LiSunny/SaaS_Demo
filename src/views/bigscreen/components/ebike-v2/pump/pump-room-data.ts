/**
 * 水泵房场景监控页 · 数据装配
 *
 * 数据分两段，来源不同，页面上必须分开标注：
 *
 *   A. 平台实时  水罐液位 / 水泵 / 控制柜
 *      走平台既有绑定表（config/firewater-scene.ts）与公共内核
 *      （config/subsystem-scene-core.ts），与总览页「消防用水监控」卡、
 *      消防水系统监测页同源 —— 同一个数不会在两个页面对不上。
 *
 *   B. 本地模拟  环境温湿度 / 水浸
 *      平台档案侧没有这两类设备（subsystem-profiles.ts 的 pipeline 档案只有
 *      主机/分机/液位/压力/流量/阀门/末端试水七类；现有绑定表是让温湿度、水浸
 *      两个图元「领取监控分机」来凑的）。故本页用确定性伪随机自造数据，
 *      来源写在卡片的 ⓘ 说明里（用户 2026-11-04 要求：卡面不挂「演示」字样）。
 *
 * 空组不装正常：绑定规则匹配不到点位时状态是 off（灰）+ '--'，
 * 不能显示 0、也不能显示「正常」——「数据没到」和「设备健康」必须长得不一样。
 */
import { bindingOf, aggregateNode } from '@/config/firewater-scene'
import { metricOf, num, resolveNodePoints } from '@/config/subsystem-scene-core'
import { seedOf, rngOf } from '../seeded-random'
import type { PointDef, PointRuntime } from '@/types/subsystem'

/** 一台设备的状态口径 */
export type DeviceTone = 'normal' | 'abnormal' | 'off'

/** 演示数据：确定性种子 —— 同一颗种子永远同一串数，刷新页面值不跳动 */
const DEMO_SEED = seedOf('pump-room-demo')

/**
 * 演示序列生成
 *
 * 24 点（对应 24 小时趋势），围绕中心值小幅游走。
 * 用法：给一个中心值与波动幅度，返回 24 个点的序列。
 */
function demoSeries(center: number, spread: number, salt: string): number[] {
  const rnd = rngOf(DEMO_SEED ^ seedOf(salt))
  const out: number[] = []
  let cur = center
  for (let i = 0; i < 24; i++) {
    cur = cur + (rnd() - 0.5) * spread
    out.push(Number(cur.toFixed(2)))
  }
  return out
}

/** 演示数据：水浸报警状态（泵房地面积水 / 漏水） */
export const DEMO_WATER_LEAK = {
  /** 状态：'normal' | 'alarm' */
  state: (() => {
    const rnd = rngOf(DEMO_SEED ^ seedOf('water-leak'))
    // 大概率正常：小概率报警，让页面既有异常样本又不至于常亮
    return rnd() < 0.18 ? ('alarm' as const) : ('normal' as const)
  })(),
  /** 报警位置的说明文案 */
  location: '泵房东南角集水坑上方',
}

/** 演示数据：环境温湿度 */
export const DEMO_ENV = {
  /** 环境温度 ℃ */
  temperature: {
    value: 24.6,
    unit: '℃',
    trend: demoSeries(24.6, 1.6, 'env-temp'),
    /** 正常区间（消防泵房环境温度） */
    normalRange: [5, 40] as [number, number],
  },
  /** 相对湿度 %RH */
  humidity: {
    value: 58,
    unit: '%RH',
    trend: demoSeries(58, 6, 'env-humidity'),
    normalRange: [30, 85] as [number, number],
  },
}

/** 演示数据是否越界（越界走唯一异常红） */
function demoAbnormal(value: number, range: [number, number]): boolean {
  return value < range[0] || value > range[1]
}

/** 顶部指标卡的数据模型 */
export interface PumpMetricRow {
  key: string
  name: string
  /** ⓘ 说明 */
  hint: string
  /** 主数值文本 */
  value: string
  /** 单位（状态类指标为空） */
  unit: string
  /** 次读数（阈值 / 补充） */
  sub?: string
  /** 状态口径 */
  tone: DeviceTone
  /** 24 点趋势 */
  trend: number[]
}

/**
 * 平台绑定取数：按绑定规则聚合出「值 + 次值 + 状态」
 *
 * 直接复用 aggregateNode —— 它给出的口径与组态画面、消防水系统监测页完全一致。
 */
function platformAggregate(
  symbol: string,
  nth: number,
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
) {
  const binding = bindingOf(symbol, nth)
  if (!binding) return null
  const agg = aggregateNode(binding, points, getRuntime)
  const members = resolveNodePoints(binding, points)
  const metric = metricOf(members[0], binding.metricKey)
  return { agg, binding, members, metric }
}

/** 平台聚合结果的色调：空组 → off（灰），异常 → abnormal，其余 normal */
function aggregateTone(state: Record<string, boolean>, hasMembers: boolean): DeviceTone {
  if (!hasMembers) return 'off'
  if (state.fault || state.over) return 'abnormal'
  if (state.off) return 'off'
  return 'normal'
}

/**
 * 装配 5 张指标卡
 *
 * 1 环境温度（本地模拟）  2 环境湿度（本地模拟）  3 水浸报警（本地模拟）
 * 4 水罐液位（平台实时）  5 水泵 / 控制柜（平台实时）
 */
export function buildPumpMetrics(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): PumpMetricRow[] {
  // ===== 4 水罐液位（平台实时） =====
  const tank = platformAggregate('TNK-FIRE-01', 1, points, getRuntime)
  const pool = platformAggregate('RES-TANK-01', 1, points, getRuntime)
  const tankAgg = tank?.agg
  const poolAgg = pool?.agg
  const tankMembers = tank?.members ?? []
  const poolMembers = pool?.members ?? []
  const tankMetric = tank?.metric
  const tankPct = tankAgg?.state.run || tankAgg?.state.over ? tankAgg?.value : '--'

  // 水箱 + 水池两路液位都异常时，汇总卡才算异常（任一异常即异常）
  const levelAbnormal =
    (tankAgg ? aggregateTone(tankAgg.state, tankMembers.length > 0) === 'abnormal' : false) ||
    (poolAgg ? aggregateTone(poolAgg.state, poolMembers.length > 0) === 'abnormal' : false)

  const levelTrend = (() => {
    /**
     * 趋势与主值同口径
     *
     * 主值取的是水箱组的最小（aggregateNode 的 levelPercent），趋势就得是
     * "每个时刻水箱组内的最小" —— 与总览页 water-metrics.ts 的 minPerIndex 一套规矩。
     * 原来这里把水箱+水池合并取最小、量程又只用水箱的，曲线末点必然低于旁边的数字
     * （实测 40/40 次低 1~2 个百分点），趋势图和主值自相矛盾。
     * 水池的读数在副读数行里单独给，不混进这条曲线。
     */
    const members = tank?.members ?? []
    const series = members
      .map((p) => getRuntime(p.id)?.trend?.level ?? [])
      .filter((s) => s.length > 0)
    if (!series.length) return []
    const rangeMax = tankMetric?.range?.[1] ?? 100
    const len = Math.max(...series.map((s) => s.length))
    const out: number[] = []
    for (let i = 0; i < len; i++) {
      const vals = series
        .map((s) => s[i])
        .filter((v): v is number => v !== undefined && Number.isFinite(v))
      if (!vals.length) continue
      const min = Math.min(...vals)
      out.push(Number(((min / rangeMax) * 100).toFixed(1)))
    }
    return out
  })()

  // ===== 5 水泵 / 控制柜（平台实时） =====
  const pump1 = platformAggregate('PMP-SET-01', 1, points, getRuntime)
  const pump2 = platformAggregate('PMP-SET-01', 2, points, getRuntime)
  const cab1 = platformAggregate('CAB-PMP-01', 1, points, getRuntime)
  const cab2 = platformAggregate('CAB-PMP-01', 2, points, getRuntime)

  const pumpRows = [pump1, pump2].filter(Boolean)
  const runningPumps = pumpRows.filter(
    (b) => b!.agg.state.run && b!.members.length > 0,
  ).length
  const pumpAbnormal = pumpRows.some(
    (b) => aggregateTone(b!.agg.state, b!.members.length > 0) === 'abnormal',
  )
  const cabRows = [cab1, cab2].filter(Boolean)
  const cabAbnormal = cabRows.some(
    (b) => aggregateTone(b!.agg.state, b!.members.length > 0) === 'abnormal',
  )
  const cabFault = cabRows.filter((b) => b!.agg.state.fault && b!.members.length > 0).length

  /**
   * 空组不装正常
   *
   * 泵组与控制柜都取不到测点时，这张卡不能写「0 运行 / 控制柜正常」——
   * 那不是设备停了，是数据没到。口径与平台绑定表一致：off（灰）+ '--'。
   */
  const pumpHasPoints = pumpRows.some((b) => b!.members.length > 0)
  const cabHasPoints = cabRows.some((b) => b!.members.length > 0)
  const deviceHasPoints = pumpHasPoints || cabHasPoints

  const deviceTone: DeviceTone = !deviceHasPoints
    ? 'off'
    : pumpAbnormal || cabAbnormal
      ? 'abnormal'
      : 'normal'
  const deviceValue = deviceHasPoints ? `${runningPumps} 运行` : '--'
  const deviceSub = !deviceHasPoints
    ? '无测点'
    : cabFault > 0
      ? `控制柜 ${cabFault} 故障`
      : cabHasPoints
        ? '控制柜正常'
        : '控制柜无测点'

  return [
    {
      key: 'env-temp',
      name: '环境温度',
      hint: '泵房环境温度：平台档案侧暂无温湿度测点，数值由本地模拟生成',
      value: DEMO_ENV.temperature.value.toFixed(1),
      unit: DEMO_ENV.temperature.unit,
      sub: `正常 ${DEMO_ENV.temperature.normalRange[0]}~${DEMO_ENV.temperature.normalRange[1]}`,
      tone: demoAbnormal(DEMO_ENV.temperature.value, DEMO_ENV.temperature.normalRange)
        ? 'abnormal'
        : 'normal',
      trend: DEMO_ENV.temperature.trend,
    },
    {
      key: 'env-humidity',
      name: '环境湿度',
      hint: '泵房相对湿度：平台档案侧暂无温湿度测点，数值由本地模拟生成',
      value: DEMO_ENV.humidity.value.toFixed(0),
      unit: DEMO_ENV.humidity.unit,
      sub: `正常 ${DEMO_ENV.humidity.normalRange[0]}~${DEMO_ENV.humidity.normalRange[1]}`,
      tone: demoAbnormal(DEMO_ENV.humidity.value, DEMO_ENV.humidity.normalRange)
        ? 'abnormal'
        : 'normal',
      trend: DEMO_ENV.humidity.trend,
    },
    {
      key: 'water-leak',
      name: '水浸报警',
      hint: '泵房地面积水 / 漏水报警：平台档案侧暂无该类测点，数值由本地模拟生成',
      value: DEMO_WATER_LEAK.state === 'alarm' ? '报警' : '正常',
      unit: '',
      sub: DEMO_WATER_LEAK.state === 'alarm' ? DEMO_WATER_LEAK.location : '未检测到积水',
      tone: DEMO_WATER_LEAK.state === 'alarm' ? 'abnormal' : 'normal',
      // 状态类指标没有连续量 —— 空数组，页面不画趋势图。
      // 塞 0/1 序列会画出一条毫无信息量的平直线。
      trend: [],
    },
    {
      key: 'tank-level',
      name: '水罐液位',
      hint: '消防水箱 / 水池液位：取各组液位探测器最低值，按量程折算成百分比',
      value: tankPct ?? '--',
      // 单位不重复写：aggregateNode 的 levelPercent 分支返回的值已带 %（"43%"），
      // 卡上再挂一个 unit 会显示成「43% %」。
      unit: '',
      sub:
        tankMembers.length > 0
          ? `水箱 ${tankAgg?.value ?? '--'} · 水池 ${poolAgg?.value ?? '--'}`
          : '无测点',
      tone: levelAbnormal ? 'abnormal' : tankMembers.length > 0 ? 'normal' : 'off',
      trend: levelTrend,
    },
    {
      key: 'pump-cabinet',
      name: '水泵 / 控制柜',
      hint: '消防泵组与泵房控制柜的运行状态：取平台监控分机绑定',
      value: deviceValue,
      unit: '',
      sub: deviceSub,
      tone: deviceTone,
      trend: [],
    },
  ]
}

/**
 * 取某台设备的实时数值（用于详情行右侧的补充读数）
 *
 * 供组件按需取原始值，避免在组件里重复解析绑定规则。
 */
export function levelRawOf(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
  symbol: string,
  nth: number,
): number | undefined {
  const binding = bindingOf(symbol, nth)
  if (!binding) return undefined
  const members = resolveNodePoints(binding, points)
  const vals = members
    .map((p) => num(getRuntime(p.id)?.values?.[binding.metricKey]))
    .filter((v): v is number => v !== undefined)
  return vals.length ? Math.min(...vals) : undefined
}
