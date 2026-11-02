/**
 * 消防总览页 · 演示数据
 *
 * 口径分两类，不要混：
 *   - 真实：设备台数、报警阈值，取自 `config/subsystem-profiles.ts` 的设备档案
 *   - 演示：实时值、完好率、警情、隐患，本文件里的常量
 *
 * 接口接入后只替换本文件，组件不动。
 */
import { getSubsystemProfile } from '@/config/subsystem-profiles'

/**
 * 语义档位。页面的两条色彩规则（见 `fire-common.scss`）：
 *   - abnormal：异常数据，一律同一个红
 *   - normal：非异常正常值，不占用语义色，只靠字号与明度分层
 *   - idle：无告警的弱化状态（屏蔽 / 待机 / 待接入 / 演示标记）
 */
export type Tone = 'normal' | 'abnormal' | 'idle'

/** 完好率目标：达标为正常，低于即异常 */
export const RATE_TARGET = 97

/**
 * 状态分布环的配色：正常走中性色，三类异常用同族红的明度阶梯。
 *
 * 三个异常若同用一个红，环上会连成一段、看不出分界；用明度阶梯既满足
 * "异常统一红色"，又保留火警 / 预警 / 故障三段的区分（配合图例文字）。
 *
 * 色值与状态是一一对应的，改口径时色值跟着走，不要单独调色。
 */
export const DIST_COLOR: Record<'normal' | 'alarm' | 'warn' | 'fault', string> = {
  normal: 'var(--fire-dist-normal)',
  alarm: 'var(--fire-dist-alarm)',
  warn: 'var(--fire-dist-warn)',
  fault: 'var(--fire-dist-fault)',
}

/**
 * 数据色（文字级）。
 *
 * hero = 核心数值级（白 / 红），label = 次级数值级（淡蓝 / 红）。
 * 非异常不取语义色：核心用白，次级用淡蓝，明度差本身就构成层级。
 */
export function dataColor(tone: Tone, level: 'hero' | 'label' = 'hero'): string {
  if (tone === 'abnormal') return 'var(--fire-anomaly)'
  if (tone === 'idle') return 'var(--fire-text-sub)'
  return level === 'hero' ? 'var(--fire-text-hero)' : 'var(--fire-text-label)'
}

/** 设备台数：主机 + 分机 + 采集器件 */
export function deviceTotal(profileKey: string): number {
  const p = getSubsystemProfile(profileKey)
  if (!p) return 0
  return (
    p.scale.host +
    p.scale.slave +
    p.scale.devices.reduce((sum, d) => sum + d.count, 0)
  )
}

/** 取档案里某设备类型某指标的正常区间与单位 */
export function metricSpec(
  profileKey: string,
  typeKey: string,
  metricKey: string,
): { low: number; high: number; unit: string } {
  const p = getSubsystemProfile(profileKey)
  const dp = p
    ? [...p.hostProfiles, ...p.deviceProfiles].find((d) => d.typeKey === typeKey)
    : undefined
  const m = dp?.metrics.find((x) => x.key === metricKey)
  if (!m || m.kind !== 'analog') return { low: 0, high: 0, unit: '' }
  const nr = m.normalRange ?? [0, 0]
  return { low: nr[0], high: nr[1], unit: m.unit ?? '' }
}

/** 某类设备的台数 */
export function deviceCount(profileKey: string, typeKey: string): number {
  const p = getSubsystemProfile(profileKey)
  if (!p) return 0
  return p.scale.devices
    .filter((d) => d.typeKey === typeKey)
    .reduce((s, d) => s + d.count, 0)
}

// ============================================================
// 系统汇总
// ============================================================

/** 8 个系统的汇总（前三有档案 → 台数为真值；后五待接入） */
export interface SystemRow {
  key: string
  name: string
  /** 图标 key（对应 FireSystemIcon） */
  icon: string
  /** 设备台数（待接入系统为 0） */
  total: number
  /** 正常台数 */
  normal: number
  /** 报警台数 */
  alarm: number
  /** 故障台数 */
  fault: number
  /** 离线台数 */
  offline: number
  /** 可用率 % =（总数 − 故障 − 离线）/ 总数 */
  rate: number
  /** 待接入系统：档案与点表尚未建立 */
  pending: boolean
}

/**
 * 8 个系统的汇总（前三有档案 → 台数为真值；后五待接入）
 *
 * 系统名用设计稿 70:703 的全称（消防用水监测 / 气体灭火系统 …），
 * 短名只留在同页其他卡片里（消防保障卡按四大系统分组，用短名）。
 */
export const SYSTEM_ROWS: SystemRow[] = [
  { key: 'water', name: '消防用水监测', icon: 'water', total: deviceTotal('pipeline'), normal: 0, alarm: 8, fault: 7, offline: 16, rate: 0, pending: false },
  { key: 'gas', name: '气体灭火系统', icon: 'gas', total: deviceTotal('gas'), normal: 0, alarm: 1, fault: 2, offline: 2, rate: 0, pending: false },
  { key: 'smoke', name: '防排烟系统', icon: 'smoke', total: deviceTotal('smoke'), normal: 0, alarm: 2, fault: 2, offline: 2, rate: 0, pending: false },
  { key: 'alarm', name: '火灾报警系统', icon: 'alarm', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'door', name: '防火门监控', icon: 'door', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'evac', name: '应急疏散救援', icon: 'evac', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'power', name: '消防电源监控', icon: 'power', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'elec', name: '电气火灾监控', icon: 'elec', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
]

// 可用率与正常台数由台数与故障/离线数算出，不手写百分比
SYSTEM_ROWS.forEach((r) => {
  r.rate = r.total > 0 ? ((r.total - r.fault - r.offline) / r.total) * 100 : 0
  r.normal = r.total - r.alarm - r.fault - r.offline
})

/** 状态分布口径：正常 / 火警 / 预警 / 故障 */
export interface DistItem {
  key: string
  label: string
  count: number
  /** 占比 0~1 */
  ratio: number
  color: string
}

/**
 * 状态分布：环形图与堆叠条共用
 *
 * 图例的文案与排列按设计稿 80:4975 / 80:4986：正常 | 火警 / 预警 | 故障。
 *
 * 项目内部三类异常计数到设计稿四态的对应：
 *   火警 ← alarm   设备触发火警信号
 *   预警 ← offline 通讯中断 / 离线 —— 信号缺失，尚未定性为设备故障，需现场核查
 *   故障 ← fault   设备自身故障信号
 *
 * 参数按设计稿的展示顺序给（正常 / 火警 / 预警 / 故障），
 * 预警位传的是 offline 计数。
 */
export function distributionOf(
  total: number,
  normal: number,
  alarm: number,
  offline: number,
  fault: number,
): DistItem[] {
  const t = total || 1
  return [
    { key: 'normal', label: '正常', count: normal, ratio: normal / t, color: DIST_COLOR.normal },
    { key: 'alarm', label: '火警', count: alarm, ratio: alarm / t, color: DIST_COLOR.alarm },
    { key: 'warn', label: '预警', count: offline, ratio: offline / t, color: DIST_COLOR.warn },
    { key: 'fault', label: '故障', count: fault, ratio: fault / t, color: DIST_COLOR.fault },
  ]
}

const CONNECTED = SYSTEM_ROWS.filter((r) => !r.pending)
const TOTAL_DEVICES = CONNECTED.reduce((s, r) => s + r.total, 0)
const TOTAL_ALARM = CONNECTED.reduce((s, r) => s + r.alarm, 0)
const TOTAL_FAULT = CONNECTED.reduce((s, r) => s + r.fault, 0)
const TOTAL_OFFLINE = CONNECTED.reduce((s, r) => s + r.offline, 0)
const TOTAL_AVAILABLE =
  TOTAL_DEVICES > 0 ? ((TOTAL_DEVICES - TOTAL_FAULT - TOTAL_OFFLINE) / TOTAL_DEVICES) * 100 : 0

/**
 * 设备概况：完好率卡片顶部总体区用
 *
 * 总览页不再有通栏态势条（设计稿 70:313 无此元素），
 * 「今日警情 / 待处置 / 闭环 / 平均响应 / 值班在岗 / 巡查完成率」随之移出总览页。
 */
export const DEVICE_OVERALL = {
  total: TOTAL_DEVICES,
  fault: TOTAL_FAULT,
  offline: TOTAL_OFFLINE,
  warning: TOTAL_ALARM + TOTAL_FAULT,
  available: TOTAL_DEVICES - TOTAL_FAULT - TOTAL_OFFLINE,
  rate: TOTAL_AVAILABLE,
  normal: TOTAL_DEVICES - TOTAL_ALARM - TOTAL_FAULT - TOTAL_OFFLINE,
  alarm: TOTAL_ALARM,
}

/** 总体状态分布（环形图 + 图例共用） */
export const OVERALL_DIST = distributionOf(
  TOTAL_DEVICES,
  TOTAL_DEVICES - TOTAL_ALARM - TOTAL_FAULT - TOTAL_OFFLINE,
  TOTAL_ALARM,
  TOTAL_OFFLINE,
  TOTAL_FAULT,
)

// ============================================================
// 实时警情
// ============================================================

export interface AlarmKpi {
  key: string
  label: string
  count: number
  /**
   * 该计数当前是否异常。
   *
   * tone 描述"这一项现在有没有问题"，不描述类目本身：
   *   - 火警 0 起属正常，标成异常会让一个红色的 0 站在最前面
   *   - 屏蔽非零即异常 —— 有点位被屏蔽就不再上报，属于要处置的事
   */
  tone: Tone
  /** 图标素材（对应 `src/assets/bigscreen/ebike-v2/fire/kpi-*.png`，设计稿原图） */
  icon: string
  /** ⓘ 说明角标的文案 */
  hint: string
}

/**
 * 主机信号四类计数（火灾报警系统档案未建，取演示值）。
 *
 * 版式按设计稿 80:4826：2×2，图标框 + 名称ⓘ + 28px 数值 + 单位「件」。
 *
 * 色调按计数推导，不逐条手写：计数为 0 = 这一项现在没问题（正常的 0），
 * 计数大于 0 = 有火警 / 有故障 / 有屏蔽 / 有通讯中断，属异常。
 * 设计稿的占位值正好符合这条规则（火警 12、屏蔽 12 是红；
 * 故障 0、通讯异常 0 是蓝），换成真实计数后配色自动跟对。
 */
export const ALARM_COUNTS: AlarmKpi[] = [
  { key: 'fire', label: '火警', count: 0, icon: 'fire', hint: '当前处于火警状态的报警点位数量' },
  { key: 'fault', label: '故障', count: 3, icon: 'fault', hint: '当前处于故障状态的报警点位数量' },
  { key: 'shield', label: '屏蔽', count: 1, icon: 'shield', hint: '被临时屏蔽、不再上报的报警点位数量' },
  { key: 'comm', label: '通讯异常', count: 2, icon: 'comm', hint: '通讯中断、无法上报状态的设备数量' },
].map((c) => ({ ...c, tone: (c.count > 0 ? 'abnormal' : 'normal') as Tone }))

export interface AlarmRow {
  key: string
  /** 胶囊角标：故障 / 预警 */
  badge: string
  /** 事件标题 */
  title: string
  /** 完整时间戳 */
  time: string
  /** 发生位置 */
  location: string
}

/**
 * 最近警情（设计稿 80:4899 列表容器，2 行式：角标+标题+时间 / 位置）
 *
 * 角标只有"故障 / 预警"两类。设计稿把故障标橙、预警标红，
 * 与本页"异常统一一个红"的色彩规则冲突 —— 角标文案已经区分了档位，
 * 颜色不再承担区分职责，故统一用异常红。
 */
export const ALARM_ROWS: AlarmRow[] = [
  { key: 'a1', badge: '预警', title: '燃气预警', time: '2026-11-02 15:41', location: '2 号楼 燃气报警器' },
  { key: 'a2', badge: '故障', title: '欠压故障', time: '2026-11-02 15:12', location: '3 号楼 2 单元 5 层' },
  { key: 'a3', badge: '故障', title: '通讯中断', time: '2026-11-02 14:55', location: '1 号楼 消火栓' },
  { key: 'a4', badge: '预警', title: '烟感误报', time: '2026-11-02 14:31', location: '第一食堂 电缆温度' },
  { key: 'a5', badge: '预警', title: '疏散通道占用', time: '2026-11-02 13:58', location: '校医院 疏散通道' },
]

// ============================================================
// 消防保障系统概况
// ============================================================

export interface AssuranceMetric {
  label: string
  value: string
  unit?: string
  /** 阈值说明（正常区间） */
  threshold?: string
  tone?: Tone
}

export interface AssuranceBlock {
  key: string
  name: string
  metrics: AssuranceMetric[]
  /** 24 点趋势（仅消防水压力） */
  trend?: number[]
  trendLabel?: string
  pending?: boolean
}

const waterPressureSpec = metricSpec('pipeline', 'pipe_pressure', 'pressure')
const waterLevelSpec = metricSpec('pipeline', 'water_level', 'level')
const gasSpec = metricSpec('gas', 'cylinder_pressure', 'pressure')
const smokeSpec = metricSpec('smoke', 'fan_pressure', 'diffPressure')

export const ASSURANCE_BLOCKS: AssuranceBlock[] = [
  {
    key: 'water',
    name: '消防水',
    metrics: [
      {
        label: '最不利压力',
        value: '0.32',
        unit: waterPressureSpec.unit,
        threshold: `正常 ${waterPressureSpec.low.toFixed(2)}~${waterPressureSpec.high.toFixed(2)}`,
      },
      {
        label: '水池水位',
        value: '4.20',
        unit: waterLevelSpec.unit,
        threshold: `正常 ${waterLevelSpec.low.toFixed(2)}~${waterLevelSpec.high.toFixed(2)}`,
      },
      {
        label: '末端试水 / 阀门',
        value: `${deviceCount('pipeline', 'hydrant_test')} / ${deviceCount('pipeline', 'valve_switch')}`,
        unit: '处',
      },
    ],
    trend: [
      0.41, 0.39, 0.38, 0.36, 0.35, 0.34, 0.33, 0.34, 0.32, 0.33, 0.34, 0.32,
      0.31, 0.32, 0.33, 0.32, 0.31, 0.30, 0.32, 0.33, 0.32, 0.32, 0.31, 0.32,
    ],
    trendLabel: '24h 最不利压力趋势',
  },
  {
    key: 'gas',
    name: '气体灭火',
    metrics: [
      {
        label: '最低钢瓶压力',
        value: '1.28',
        unit: gasSpec.unit,
        threshold: `正常 ${gasSpec.low.toFixed(2)}~${gasSpec.high.toFixed(2)}`,
      },
      { label: '钢瓶探测器', value: String(deviceCount('gas', 'cylinder_pressure')), unit: '只' },
    ],
  },
  {
    key: 'smoke',
    name: '防排烟',
    metrics: [
      {
        label: '风机压差',
        value: '218',
        unit: smokeSpec.unit,
        threshold: `正常 ${smokeSpec.low}~${smokeSpec.high}`,
      },
      { label: '压差探测器', value: String(deviceCount('smoke', 'fan_pressure')), unit: '只' },
    ],
  },
  {
    key: 'power',
    name: '消防电源',
    metrics: [],
    pending: true,
  },
]

// ============================================================
// 隐患排查治理
// ============================================================

/** 隐患等级：一般 / 重大（与隐患台账 HazardLevel 同名同义） */
export type HazardLevelKey = 'general' | 'major'

export interface HazardSumItem {
  /** 子项名：完成 / 未完成 / 一般 / 重大 */
  label: string
  /** 子项计数 */
  count: number
  /** 占比 % —— 由 count 与总数算出，不手写百分比 */
  ratio: number
}

export interface HazardSummary {
  key: string
  name: string
  /** 图标素材 key（对应 `src/assets/bigscreen/ebike-v2/fire/sum-*.png`，设计稿原图） */
  icon: string
  /** ⓘ 说明角标的文案 */
  hint: string
  /** 主数值 */
  count: number
  /** 主数值单位 */
  unit: string
  /**
   * 主数值的色调：normal 走中性蓝，abnormal 走异常红。
   *
   * 「未闭环隐患」是异常计数 —— 它与「本月排查任务」同色时，值班员会把
   * 12 个未闭环隐患读成和 268 个任务一样的中性数字，异常就不可见了。
   * 设计稿这块也是红渐变（80:4517 的蓝 #A5CEFF→#D0E4FC，
   * 80:4541 的红 #E5523F→#FF8080）。
   */
  tone: 'normal' | 'abnormal'
  /** 两个子项（占比之和为 100%） */
  items: HazardSumItem[]
}

export interface HazardRow {
  key: string
  /** 等级角标：一般 / 重大 */
  level: HazardLevelKey
  /** 隐患描述 */
  title: string
  /** 发现时间 */
  time: string
  /** 位置 */
  location: string
}

/**
 * 隐患排查治理的两组汇总（设计稿 80:4517 / 80:4541）
 *
 * 占比不手写：由子项计数与总数算出，改计数时百分比跟着变，
 * 避免出现"加起来不等于 100%"的假数据。
 *
 * 口径说明（演示值，理由见组件注释）：
 *   - 隐患台账（M1）虽有实装 store，但它的种子数据挂在 enterprise 1，
 *     本演示账号属 enterprise 2，取不到数；排查任务（M1-7）仍是占位页。
 *   - 因此本卡按本页其它三张卡的同一口径给演示值，不冒充台账真值。
 */
export const HAZARD_SUMMARIES: HazardSummary[] = [
  {
    key: 'task',
    name: '本月排查任务',
    icon: 'task',
    hint: '本月按排查计划派发并已完成的现场排查任务数（演示口径）',
    count: 268,
    unit: '个',
    tone: 'normal',
    items: [
      { label: '完成', count: 222, ratio: 0 },
      { label: '未完成', count: 46, ratio: 0 },
    ],
  },
  {
    key: 'open',
    name: '未闭环隐患',
    icon: 'hazard',
    hint: '尚未完成整改闭环的隐患条数，按一般 / 重大分级（演示口径）',
    count: 12,
    unit: '个',
    tone: 'abnormal',
    items: [
      { label: '一般', count: 9, ratio: 0 },
      { label: '重大', count: 3, ratio: 0 },
    ],
  },
]

// 占比由计数算出
HAZARD_SUMMARIES.forEach((s) => {
  const total = s.items.reduce((sum, i) => sum + i.count, 0)
  s.items.forEach((i) => {
    i.ratio = total > 0 ? (i.count / total) * 100 : 0
  })
})

/**
 * 未闭环隐患列表（设计稿 80:4573 列表容器，2 行式：等级角标 + 标题 + 时间 / 位置）
 *
 * 与右上「实时警情」列表同一版式：角标 + 事件标题 + 完整时间戳 / 位置，
 * 行间 1px 虚线。角标是隐患等级（一般 / 重大），不是故障类型。
 */
export const HAZARD_ROWS: HazardRow[] = [
  { key: 'h1', level: 'general', title: '灭火器压力表指针在红区', time: '2026-11-02 15:20', location: '第一食堂 大厅东侧' },
  { key: 'h2', level: 'major', title: '疏散通道被成品纸箱堆放堵塞', time: '2026-11-02 14:05', location: '3 号楼 2 单元 东侧疏散通道' },
  { key: 'h3', level: 'general', title: '疏散指示灯不亮，应急照明失效', time: '2026-11-02 11:42', location: '大门口充电站 北侧通道' },
  { key: 'h4', level: 'major', title: '配电箱私拉乱接电线，多股铜线裸露', time: '2026-11-01 16:30', location: '5 号楼 3 单元 竖井配电箱' },
  { key: 'h5', level: 'general', title: '消防通道地面标识磨损褪色', time: '2026-11-01 10:12', location: '2 号楼 1 单元 主通道' },
]
