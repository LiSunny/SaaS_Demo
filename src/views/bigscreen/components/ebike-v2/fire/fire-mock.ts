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
 * "异常统一红色"，又保留报警 / 故障 / 离线三段的区分（配合图例文字）。
 */
export const DIST_COLOR: Record<'normal' | 'alarm' | 'fault' | 'offline', string> = {
  normal: 'var(--fire-dist-normal)',
  alarm: 'var(--fire-dist-alarm)',
  fault: 'var(--fire-dist-fault)',
  offline: 'var(--fire-dist-offline)',
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

/**
 * 标记色（图形级）：圆点、进度条、图标、描边。
 * 与 dataColor 的差别只在非异常档用中性蓝而非文字白 —— 色块不能用白，
 * 否则在深底上像发光点。
 */
export function markColor(tone: Tone): string {
  if (tone === 'abnormal') return 'var(--fire-anomaly)'
  if (tone === 'idle') return 'var(--fire-text-sub)'
  return 'var(--fire-neutral)'
}

/** 异常态描边：芯片 / 行块左边线 */
export function markBorder(tone: Tone): string {
  return tone === 'abnormal' ? 'var(--fire-anomaly-soft)' : 'var(--fire-chip-border)'
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
// 态势条
// ============================================================

export interface StatusBarItem {
  key: string
  label: string
  value: string
  unit?: string
  tone: Tone
  /** 演示数据标记（真实数据不标） */
  demo?: boolean
}

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

export const SYSTEM_ROWS: SystemRow[] = [
  { key: 'water', name: '消防水', icon: 'water', total: deviceTotal('pipeline'), normal: 0, alarm: 8, fault: 7, offline: 16, rate: 0, pending: false },
  { key: 'gas', name: '气体灭火', icon: 'gas', total: deviceTotal('gas'), normal: 0, alarm: 1, fault: 2, offline: 2, rate: 0, pending: false },
  { key: 'smoke', name: '防排烟', icon: 'smoke', total: deviceTotal('smoke'), normal: 0, alarm: 2, fault: 2, offline: 2, rate: 0, pending: false },
  { key: 'alarm', name: '火灾报警', icon: 'alarm', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'door', name: '防火门', icon: 'door', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'evac', name: '应急疏散', icon: 'evac', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'power', name: '消防电源', icon: 'power', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
  { key: 'elec', name: '电气火灾', icon: 'elec', total: 0, normal: 0, alarm: 0, fault: 0, offline: 0, rate: 0, pending: true },
]

// 可用率与正常台数由台数与故障/离线数算出，不手写百分比
SYSTEM_ROWS.forEach((r) => {
  r.rate = r.total > 0 ? ((r.total - r.fault - r.offline) / r.total) * 100 : 0
  r.normal = r.total - r.alarm - r.fault - r.offline
})

/** 状态分布口径：正常 / 报警 / 故障 / 离线 */
export interface DistItem {
  key: string
  label: string
  count: number
  /** 占比 0~1 */
  ratio: number
  color: string
}

/** 状态分布：环形图与堆叠条共用 */
export function distributionOf(total: number, normal: number, alarm: number, fault: number, offline: number): DistItem[] {
  const t = total || 1
  return [
    { key: 'normal', label: '正常', count: normal, ratio: normal / t, color: DIST_COLOR.normal },
    { key: 'alarm', label: '报警', count: alarm, ratio: alarm / t, color: DIST_COLOR.alarm },
    { key: 'fault', label: '故障', count: fault, ratio: fault / t, color: DIST_COLOR.fault },
    { key: 'offline', label: '离线', count: offline, ratio: offline / t, color: DIST_COLOR.offline },
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
 * 顶部态势条：只放"事件 / 值守"类指标。
 * 设备类统计（接入设备 / 完好率 / 预警 / 故障 / 离线）全部下沉到
 * 「消防设备完好率」卡片里，总览页不存在两处设备数据。
 */
export const STATUS_BAR: StatusBarItem[] = [
  { key: 'alarms', label: '今日警情', value: '6', unit: '起', tone: 'abnormal' },
  { key: 'pending', label: '待处置', value: '2', unit: '起', tone: 'abnormal' },
  { key: 'closed', label: '今日闭环', value: '4', unit: '起', tone: 'normal' },
  { key: 'response', label: '平均响应', value: '3′12″', tone: 'normal' },
  { key: 'duty', label: '值班在岗', value: '2 / 2', unit: '人', tone: 'normal', demo: true },
  { key: 'patrol', label: '今日巡查完成率', value: '92', unit: '%', tone: 'normal', demo: true },
]

/** 设备概况：完好率卡片顶部总体区用 */
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
  TOTAL_FAULT,
  TOTAL_OFFLINE,
)

// ============================================================
// 实时警情与联动状态
// ============================================================

export interface AlarmCount {
  key: string
  label: string
  count: number
  tone: Tone
}

/**
 * 主机信号五类计数（火灾报警系统档案未建，取演示值）。
 * tone 描述"该计数当前是否异常"，不描述类目本身：
 * 火警当前 0 起属正常，标成异常会让一个红色的 0 站在最前面。
 */
export const ALARM_COUNTS: AlarmCount[] = [
  { key: 'fire', label: '火警', count: 0, tone: 'normal' },
  { key: 'fault', label: '故障', count: 3, tone: 'abnormal' },
  { key: 'shield', label: '屏蔽', count: 1, tone: 'idle' },
  { key: 'comm', label: '通讯异常', count: 2, tone: 'abnormal' },
]

export interface LinkageItem {
  key: string
  label: string
  /** 反馈 = 动作反馈正常；待机 = 未动作；故障 = 反馈异常 */
  state: '反馈' | '待机' | '故障'
  tone: Tone
}

export const LINKAGE: LinkageItem[] = [
  { key: 'sprinkler', label: '喷淋泵', state: '反馈', tone: 'normal' },
  { key: 'hydrant', label: '消火栓泵', state: '反馈', tone: 'normal' },
  { key: 'smoke', label: '排烟风机', state: '反馈', tone: 'normal' },
  { key: 'shutter', label: '防火卷帘', state: '待机', tone: 'idle' },
  { key: 'lift', label: '电梯迫降', state: '反馈', tone: 'normal' },
  { key: 'broadcast', label: '广播', state: '反馈', tone: 'normal' },
]

export interface AlarmRow {
  key: string
  time: string
  type: string
  typeTone: Tone
  location: string
  status: string
  statusTone: Tone
  /** 响应时长（异常行闪烁） */
  elapsed: string
  /** 是否异常行（待处置 / 处置中 / 故障） */
  active: boolean
}

export const ALARM_ROWS: AlarmRow[] = [
  { key: 'a1', time: '15:41', type: '故障', typeTone: 'abnormal', location: '3 号楼 2 单元 5 层', status: '待处置', statusTone: 'abnormal', elapsed: '03:12', active: true },
  { key: 'a2', time: '15:12', type: '屏蔽', typeTone: 'idle', location: '2 号楼 防火门磁', status: '已确认', statusTone: 'normal', elapsed: '01:48', active: false },
  { key: 'a3', time: '14:55', type: '通讯异常', typeTone: 'abnormal', location: '1 号楼 消火栓', status: '处置中', statusTone: 'abnormal', elapsed: '05:33', active: true },
  { key: 'a4', time: '14:31', type: '故障', typeTone: 'abnormal', location: '第一食堂 电缆温度', status: '待处置', statusTone: 'abnormal', elapsed: '08:06', active: true },
  { key: 'a5', time: '13:58', type: '监管', typeTone: 'normal', location: '校医院 疏散通道', status: '已确认', statusTone: 'normal', elapsed: '02:21', active: false },
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
// 被动安全与隐患概况
// ============================================================

export interface PassiveMetric {
  label: string
  value: string
  unit?: string
  tone?: Tone
}

export interface PassiveBlock {
  key: string
  name: string
  metrics: PassiveMetric[]
  /** 最严重一条（位置 + 描述） */
  top?: string
  topTone?: Tone
  pending?: boolean
}

export const PASSIVE_BLOCKS: PassiveBlock[] = [
  {
    key: 'elec',
    name: '电气火灾',
    metrics: [
      { label: '漏电', value: '2', unit: '处', tone: 'abnormal' },
      { label: '三相不平衡', value: '1', unit: '处', tone: 'normal' },
      { label: '线缆温度超限', value: '1', unit: '处', tone: 'abnormal' },
      { label: '违规充电', value: '3', unit: '处', tone: 'abnormal' },
    ],
    top: '5 号楼 3 单元竖井 · 线缆温度超限',
    topTone: 'abnormal',
    pending: true,
  },
  {
    key: 'door',
    name: '防火门',
    metrics: [
      { label: '常闭门被开启', value: '4', unit: '扇', tone: 'abnormal' },
      { label: '闭门器失效', value: '2', unit: '扇', tone: 'abnormal' },
      { label: '顺序器故障', value: '1', unit: '扇', tone: 'abnormal' },
      { label: '完好率', value: '96.0', unit: '%', tone: 'normal' },
    ],
    pending: true,
  },
  {
    key: 'evac',
    name: '应急疏散',
    metrics: [
      { label: '应急照明在线率', value: '98.4', unit: '%', tone: 'normal' },
      { label: '疏散指示故障', value: '3', unit: '处', tone: 'abnormal' },
      { label: '安全出口占用', value: '2', unit: '处', tone: 'abnormal' },
    ],
    pending: true,
  },
]
