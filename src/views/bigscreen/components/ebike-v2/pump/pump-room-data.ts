/**
 * 水泵房场景监控页 · 数据装配
 *
 * 数据分两段，来源不同，页面上必须分开标注：
 *
 *   A. 平台实时  水罐液位 / 水泵 / 控制柜 / 阀门
 *      走平台既有绑定表（config/firewater-scene.ts）与公共内核
 *      （config/subsystem-scene-core.ts），与总览页「消防用水监控」卡、
 *      消防水系统监测页同源 —— 同一个数不会在两个页面对不上。
 *
 *   B. 本地演示  环境温湿度 / 水浸
 *      平台档案侧没有这两类设备（subsystem-profiles.ts 的 pipeline 档案只有
 *      主机/分机/液位/压力/流量/阀门/末端试水七类；现有绑定表是让温湿度、水浸
 *      两个图元「领取监控分机」来凑的）。故本页用确定性伪随机自造演示数据，
 *      卡片上标「演示」，不冒充平台测点。
 *
 * 空组不装正常：绑定规则匹配不到点位时状态是 off（灰）+ '--'，
 * 不能显示 0、也不能显示「正常」——「数据没到」和「设备健康」必须长得不一样。
 */
import { bindingOf, aggregateNode } from '@/config/firewater-scene'
import { metricOf, num, resolveNodePoints } from '@/config/subsystem-scene-core'
import { seedOf, rngOf } from '../seeded-random'
import type { PointDef, PointRuntime } from '@/types/subsystem'

/** 泵房 POI id（对应 public/pump-room-model/src/layout.js 的 POI_LIST） */
export const PUMP_ROOM_POI = {
  room: 'PR_ROOM_01',
  tank1: 'PR_TANK_01',
  tank2: 'PR_TANK_02',
  pump1: 'PR_PUMP_01',
  pump2: 'PR_PUMP_02',
  pump3: 'PR_PUMP_03',
  cabinet1: 'PR_CABINET_01',
  cabinet2: 'PR_CABINET_02',
  sump1: 'PR_SUMP_01',
  sump2: 'PR_SUMP_02',
  pipeSuction: 'PR_PIPE_SUCTION',
  pipeDischarge: 'PR_PIPE_DISCHARGE',
} as const

/** 数据来源标记：页面上用它决定要不要挂「演示」标签 */
export type DataOrigin = 'platform' | 'demo'

/** 一台设备在详情列表里的状态口径 */
export type DeviceTone = 'normal' | 'abnormal' | 'off'

export interface PumpDeviceRow {
  /** 泵房 POI id（点击聚焦三维用） */
  poiId: string
  /** 设备名 */
  name: string
  /** 主读数（液位 %、状态文案等） */
  value: string
  /** 次读数（原始值 / 阈值 / 补充说明） */
  sub?: string
  /** 状态色口径 */
  tone: DeviceTone
  /** 无独立测点（备泵、母管等）：标「示意」，不显示伪造状态 */
  schematic?: boolean
  /** 数据来源 */
  origin: DataOrigin
}

export interface PumpDeviceGroup {
  key: string
  title: string
  rows: PumpDeviceRow[]
}

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
  /** 数据来源：决定是否挂「演示」标签 */
  origin: DataOrigin
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
 * 装配顶部 5 张指标卡
 *
 * 1 环境温度（演示）  2 环境湿度（演示）  3 水浸报警（演示）
 * 4 水罐液位（平台）  5 水泵 / 控制柜（平台）
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
    // 趋势取两路里"有数据的那条"的逐点最小值，口径与 aggregateNode 一致
    const series = [tank, pool]
      .map((b) => (b ? b.members : []))
      .filter((m) => m.length > 0)
    if (!series.length) return []
    const perMember = series.flatMap((members) =>
      members.map((p) => getRuntime(p.id)?.trend?.level ?? []),
    )
    const usable = perMember.filter((s) => s.length > 0)
    if (!usable.length) return []
    const len = Math.max(...usable.map((s) => s.length))
    const out: number[] = []
    for (let i = 0; i < len; i++) {
      const vals = usable
        .map((s) => s[i])
        .filter((v): v is number => v !== undefined && Number.isFinite(v))
      if (!vals.length) continue
      const min = Math.min(...vals)
      const rangeMax = tankMetric?.range?.[1] ?? 100
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
      hint: '泵房环境温度：本地演示数据，平台档案侧暂无温湿度测点',
      value: DEMO_ENV.temperature.value.toFixed(1),
      unit: DEMO_ENV.temperature.unit,
      sub: `正常 ${DEMO_ENV.temperature.normalRange[0]}~${DEMO_ENV.temperature.normalRange[1]}`,
      tone: demoAbnormal(DEMO_ENV.temperature.value, DEMO_ENV.temperature.normalRange)
        ? 'abnormal'
        : 'normal',
      trend: DEMO_ENV.temperature.trend,
      origin: 'demo',
    },
    {
      key: 'env-humidity',
      name: '环境湿度',
      hint: '泵房相对湿度：本地演示数据，平台档案侧暂无温湿度测点',
      value: DEMO_ENV.humidity.value.toFixed(0),
      unit: DEMO_ENV.humidity.unit,
      sub: `正常 ${DEMO_ENV.humidity.normalRange[0]}~${DEMO_ENV.humidity.normalRange[1]}`,
      tone: demoAbnormal(DEMO_ENV.humidity.value, DEMO_ENV.humidity.normalRange)
        ? 'abnormal'
        : 'normal',
      trend: DEMO_ENV.humidity.trend,
      origin: 'demo',
    },
    {
      key: 'water-leak',
      name: '水浸报警',
      hint: '泵房地面积水 / 漏水报警：本地演示数据',
      value: DEMO_WATER_LEAK.state === 'alarm' ? '报警' : '正常',
      unit: '',
      sub: DEMO_WATER_LEAK.state === 'alarm' ? DEMO_WATER_LEAK.location : '未检测到积水',
      tone: DEMO_WATER_LEAK.state === 'alarm' ? 'abnormal' : 'normal',
      // 状态类指标没有连续量 —— 空数组，页面不画趋势图。
      // 塞 0/1 序列会画出一条毫无信息量的平直线。
      trend: [],
      origin: 'demo',
    },
    {
      key: 'tank-level',
      name: '水罐液位',
      hint: '消防水箱 / 水池液位：取各组液位探测器最低值，按量程折算成百分比',
      value: tankPct ?? '--',
      unit: '%',
      sub:
        tankMembers.length > 0
          ? `水箱 ${tankAgg?.value ?? '--'} · 水池 ${poolAgg?.value ?? '--'}`
          : '无测点',
      tone: levelAbnormal ? 'abnormal' : tankMembers.length > 0 ? 'normal' : 'off',
      trend: levelTrend,
      origin: 'platform',
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
      origin: 'platform',
    },
  ]
}

/**
 * 装配右侧详情列表（按泵房 POI 分组）
 *
 * 无独立测点的设备（3# 备泵、母管、排污井、房间）走 POI 静态属性，
 * 标「示意」，不显示伪造的运行状态。
 */
export function buildPumpDeviceGroups(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
): PumpDeviceGroup[] {
  const row = (
    poiId: string,
    name: string,
    r: { value: string; sub?: string; tone: DeviceTone; schematic?: boolean; origin: DataOrigin },
  ): PumpDeviceRow => ({ poiId, name, ...r })

  // ===== 储水 =====
  const tank = platformAggregate('TNK-FIRE-01', 1, points, getRuntime)
  const pool = platformAggregate('RES-TANK-01', 1, points, getRuntime)
  const tankAgg = tank?.agg
  const poolAgg = pool?.agg

  const storage: PumpDeviceRow[] = [
    row(PUMP_ROOM_POI.tank1, '1# 消防水罐', {
      value: tankAgg?.value ?? '--',
      sub: tank && tank.members.length > 0 ? '水箱液位（平台实时）' : '无测点',
      tone: tank
        ? aggregateTone(tankAgg!.state, tank.members.length > 0)
        : 'off',
      origin: 'platform',
    }),
    row(PUMP_ROOM_POI.tank2, '2# 消防水罐', {
      value: poolAgg?.value ?? '--',
      sub: pool && pool.members.length > 0 ? '水池液位（平台实时）' : '无测点',
      tone: pool
        ? aggregateTone(poolAgg!.state, pool.members.length > 0)
        : 'off',
      origin: 'platform',
    }),
  ]

  // ===== 水泵 =====
  const pump1 = platformAggregate('PMP-SET-01', 1, points, getRuntime)
  const pump2 = platformAggregate('PMP-SET-01', 2, points, getRuntime)
  const pumps: PumpDeviceRow[] = [
    row(PUMP_ROOM_POI.pump1, '1# 消防主泵', {
      value: pump1?.agg.value ?? '--',
      sub: pump1 && pump1.members.length > 0 ? '平台实时' : '无测点',
      tone: pump1 ? aggregateTone(pump1.agg.state, pump1.members.length > 0) : 'off',
      origin: 'platform',
    }),
    row(PUMP_ROOM_POI.pump2, '2# 消防主泵', {
      value: pump2?.agg.value ?? '--',
      sub: pump2 && pump2.members.length > 0 ? '平台实时' : '无测点',
      tone: pump2 ? aggregateTone(pump2.agg.state, pump2.members.length > 0) : 'off',
      origin: 'platform',
    }),
    // 平台 pipe_slave 只能领出 2 个泵组，第 3 台备泵无独立测点 —— 不伪造状态
    row(PUMP_ROOM_POI.pump3, '3# 消防备用泵', {
      value: '备用',
      sub: '示意 · 无独立测点',
      tone: 'off',
      schematic: true,
      origin: 'demo',
    }),
  ]

  // ===== 电气 =====
  const cab1 = platformAggregate('CAB-PMP-01', 1, points, getRuntime)
  const cab2 = platformAggregate('CAB-PMP-01', 2, points, getRuntime)
  const cabinets: PumpDeviceRow[] = [
    row(PUMP_ROOM_POI.cabinet1, '1# 消防泵控制柜', {
      value: cab1?.agg.value ?? '--',
      sub: cab1 && cab1.members.length > 0 ? '平台实时' : '无测点',
      tone: cab1 ? aggregateTone(cab1.agg.state, cab1.members.length > 0) : 'off',
      origin: 'platform',
    }),
    row(PUMP_ROOM_POI.cabinet2, '2# 消防泵控制柜', {
      value: cab2?.agg.value ?? '--',
      sub: cab2 && cab2.members.length > 0 ? '平台实时' : '无测点',
      tone: cab2 ? aggregateTone(cab2.agg.state, cab2.members.length > 0) : 'off',
      origin: 'platform',
    }),
  ]

  // ===== 阀门 =====
  // 泵房三维模型里有 10 只阀门，平台侧却是全网 791 个阀门点位（消火栓环网 719 +
  // 报警阀间/水泵/稳压泵 72），二者无法逐一映射 —— 不能把全网汇总写成
  // 「泵房阀门开 x/10」，那是在编造对应关系。
  // 如实表述：标题写清是全网口径，值给出各类开启数。
  const butterfly = platformAggregate('VLV-BUTT-01', 1, points, getRuntime)
  const gate = platformAggregate('VLV-GATE-01', 1, points, getRuntime)
  // 只有真正领到点位的阀门类才进值：两类都没点位时是 '--'，
  // 而不是 '-- / --'（两个都不存在的读数，读者无从判断是缺哪一类）。
  const valveParts = [butterfly, gate]
    .filter((b) => b && b.members.length > 0)
    .map((b) => b!.agg.value)
  const valveHasPoints = valveParts.length > 0
  const valveAbnormal = [butterfly, gate]
    .filter((b) => b && b.members.length > 0)
    .some((b) => aggregateTone(b!.agg.state, true) === 'abnormal')
  const valves: PumpDeviceRow[] = [
    row('PR_VLV_01', '阀门', {
      value: valveHasPoints ? valveParts.join(' / ') : '--',
      sub: valveHasPoints ? '全网口径 · 非泵房 10 只' : '无测点',
      tone: valveAbnormal ? 'abnormal' : valveHasPoints ? 'normal' : 'off',
      origin: 'platform',
    }),
  ]

  // ===== 其它（无测点，走 POI 静态属性） =====
  const misc: PumpDeviceRow[] = [
    row(PUMP_ROOM_POI.pipeSuction, '吸水母管 DN200', {
      value: 'DN200',
      sub: '示意 · 无独立测点',
      tone: 'off',
      schematic: true,
      origin: 'demo',
    }),
    row(PUMP_ROOM_POI.pipeDischarge, '出水母管 DN200', {
      value: 'DN200',
      sub: '示意 · 无独立测点',
      tone: 'off',
      schematic: true,
      origin: 'demo',
    }),
    row(PUMP_ROOM_POI.sump1, '1# 排污井', {
      value: '深 1.6 m',
      sub: '示意 · 无独立测点',
      tone: 'off',
      schematic: true,
      origin: 'demo',
    }),
    row(PUMP_ROOM_POI.sump2, '2# 排污井', {
      value: '深 1.6 m',
      sub: '示意 · 无独立测点',
      tone: 'off',
      schematic: true,
      origin: 'demo',
    }),
  ]

  return [
    { key: 'storage', title: '储水', rows: storage },
    { key: 'pump', title: '水泵', rows: pumps },
    { key: 'electric', title: '电气', rows: cabinets },
    { key: 'valve', title: '阀门', rows: valves },
    { key: 'misc', title: '其它', rows: misc },
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
