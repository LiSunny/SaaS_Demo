/**
 * 设备详情弹窗 · 数据派生层
 *
 * 设计稿：Figma「林业大学」节点 165:26122「Dialog - 设备详情」
 *
 * 数据口径沿用实时警情页的三层来源（见 duty/duty-data.ts 顶部说明）：
 *   设备 / 位置 = 组态画面节点（真值，来自平台组态配置 /api/scenes）
 *   点位 / 量程 = 图元库符号绑定（真值，symbolDef(...).bindings）
 *   次数 / 时间 / 数值 = 按「设备身份 key」做确定性随机
 *     （后端暂无告警工单查询接口，也暂无物联遥测接口 —— 与 duty-data.ts 同一口径）
 *
 * 同一台设备 → 永远同一组数据：刷新页面不会跳动。
 * 唯一的例外是「实时数据」区：它模拟物联终端上报，按「设备 key + 刷新次数」派生，
 * 点分区标题右侧的刷新图标即重新采一次值 —— 这也是设计稿在那两个分区放刷新图标的原因。
 */
import { symbolDef, SYMBOL_REGISTRY_VERSION } from '@/symbols'
import { rngOf, seedOf } from '../seeded-random'
import { deviceCodeOfKey, formatTime, type DutyEvent, type SceneDevice } from '../duty/duty-data'

/* ============================================================
 * 类型
 * ============================================================ */

/** 弹窗左侧导航的五个分区 */
export type DeviceDetailTab = 'basic' | 'realtime' | 'control' | 'history' | 'alarm'

/** 基础信息的一行 */
export interface DetailBasicRow {
  label: string
  value: string
  /** 值的末尾挂复制按钮 */
  copyable?: boolean
}

/** 实时数据的一个指标格 */
export interface DetailMetric {
  label: string
  value: string
  /** 异常时整格走异常红 */
  abnormal?: boolean
}

/** 告警日志的一行 */
export interface DetailAlarmRow {
  id: string
  /** 发生时间 */
  time: string
  /** 事件类别（火警 / 故障 / 预警 / 其他） */
  category: string
  /** 事件内容：触发的点位 */
  content: string
  /** 事件描述：处置班次 */
  desc: string
  /** 告警值 */
  value: string
  /** 角标语义：火警 / 故障 / 预警；其他类别不占语义色 */
  badge?: string
}

/** 历史曲线 */
export interface DetailHistory {
  /** x 轴标签 */
  xLabels: string[]
  /** 图表左上角的单位（无单位指标为空串） */
  unit: string
  /** y 轴下界 */
  min: number
  /** y 轴上界 */
  max: number
  /** 曲线：设备详情是单设备视角，一个指标一条时间序列 */
  series: Array<{ name: string; color: string; data: number[] }>
}

/* ============================================================
 * 常量
 * ============================================================ */

/** 左侧导航项（设计稿左栏 110 宽：返回 + 五个分区） */
export const DEVICE_DETAIL_TABS: Array<{ key: DeviceDetailTab; label: string }> = [
  { key: 'basic', label: '基础信息' },
  { key: 'realtime', label: '实时数据' },
  { key: 'control', label: '设备控制' },
  { key: 'history', label: '历史数据' },
  { key: 'alarm', label: '告警日志' },
]

/** 历史数据的曲线页签（设计稿 #165:26233） */
export const HISTORY_TABS: Array<{
  key: string
  label: string
  unit: string
  min: number
  max: number
}> = [
  { key: 'online', label: '联网状态', unit: '', min: 0, max: 1 },
  { key: 'run', label: '运行状态', unit: '', min: 0, max: 1 },
  { key: 'battery', label: '剩余电量', unit: '%', min: 0, max: 100 },
  { key: 'signal', label: '信号功率', unit: 'dBm', min: -120, max: -60 },
  { key: 'rsrq', label: 'RSRQ', unit: 'dB', min: -20, max: 0 },
  { key: 'snr', label: '信噪比', unit: 'dB', min: -10, max: 20 },
  { key: 'sensitivity', label: '烟雾灵敏度', unit: '级', min: 0, max: 5 },
]

/** 曲线配色（与设计稿提示窗里的色点一致） */
const SERIES_COLOR = '#4f9df0'

/* ============================================================
 * 基础信息
 * ============================================================ */

/**
 * 基础信息行
 *
 * 字段与设计稿 #165:26138 的十行一一对应。取值口径：
 *   设备类型 / 设备型号 = 图元库符号真名 / 符号 ID（型号标识）
 *   设备编码            = 事件表里的设备编码，无事件时按设备身份 key 派生
 *   IMEI                = 同设备编码 —— 无线探测器的 IMEI 就是它的唯一标识，
 *                         与「设备编码」是同一个数（设计稿两行取值相同）
 *   身份标识码          = 画面节点 ID（平台侧该设备实例的身份码）
 *   安装位置            = 园区空间归属（建筑 + 部位）
 *   添加日期            = 按设备身份 key 派生的稳定日期（平台暂无台账登记时间）
 *   心跳时间            = 最新一次事件上报时间
 */
export function buildBasics(device: SceneDevice, event?: DutyEvent): DetailBasicRow[] {
  // 自定义图元（CUS-* / SCS-* …）是异步注册进图元库的，
  // 不碰一下注册版本号，computed 不会在注册完成后重算 ——
  // 「设备类型 / 设备型号」会一直显示原始符号 ID。
  void SYMBOL_REGISTRY_VERSION.value

  const def = symbolDef(device.symbol)
  const code = event?.deviceCode || deviceCodeOfKey(device.key)
  const rnd = rngOf(seedOf(`dd-basic-${device.key}`))

  // 添加日期：一年内往前推 3~360 天
  const addAt = Date.now() - (3 + Math.floor(rnd() * 357)) * 86_400_000

  return [
    { label: '设备类型：', value: def?.name || device.symbol },
    { label: '设备名称：', value: device.label },
    // 型号用图元符号 ID（平台侧的设备型号标识）；符号没有登记过时留空，
    // 免得「设备类型」和「设备型号」两行显示成同一个字符串
    { label: '设备型号：', value: def?.id || '—' },
    { label: '设备编码：', value: code, copyable: true },
    { label: 'IMEI：', value: code, copyable: true },
    { label: '身份标识码：', value: device.nodeId || '—' },
    { label: '安装位置：', value: placeOf(device, event) },
    { label: '添加日期：', value: formatTime(addAt).slice(0, 19) },
    { label: '负责人：', value: '—' },
    { label: '心跳时间：', value: event ? formatTime(event.latestAt) : '—' },
  ]
}

/** 安装位置：园区空间归属优先，其次事件里的位置 */
function placeOf(device: SceneDevice, event?: DutyEvent): string {
  if (device.space) return `${device.space.buildingName} ${device.space.part}`
  return event?.location || '—'
}

/* ============================================================
 * 实时数据
 * ============================================================ */

/**
 * 实时数据指标格（设计稿 #165:26175：八格一行，格间用虚线竖线分隔）
 *
 * 运行状态 / 联网状态是真实语义（有事件就是异常），其余四项是物联终端遥测，
 * 按「设备 key + 刷新次数」确定性派生 —— 点刷新图标即重新采一次。
 */
export function buildMetrics(
  device: SceneDevice,
  event: DutyEvent | undefined,
  refreshTick: number,
): DetailMetric[] {
  const rnd = rngOf(seedOf(`dd-tlm-${device.key}-${refreshTick}`))

  const runState = event ? event.category : '正常'
  const online = rnd() > 0.12

  return [
    { label: '运行状态', value: runState, abnormal: !!event },
    { label: '联网状态', value: online ? '在线' : '离线', abnormal: !online },
    { label: '剩余电量', value: `${60 + Math.floor(rnd() * 41)}%` },
    { label: '信号功率', value: `${-(60 + Math.floor(rnd() * 61))}dBm` },
    { label: 'RSRQ', value: String(-(3 + Math.floor(rnd() * 18))) },
    { label: '信噪比', value: String(-5 + Math.floor(rnd() * 26)) },
    { label: '烟感灵敏度', value: String(1 + Math.floor(rnd() * 5)) },
  ]
}

/* ============================================================
 * 设备控制
 * ============================================================ */

/**
 * 可下发的控制动作
 *
 * 设计稿 #165:26215 给的是「消音」。无线探测器有消音；
 * 有线阀门 / 泵组没有这个动作，入口就不该摆 —— 空按钮比没有按钮更误导。
 */
export function buildActions(device: SceneDevice): Array<{ key: string; label: string; icon: string }> {
  const symbol = device.symbol
  // 探测报警 / 手动报警类才有消音
  const muteable = /EFD|THS|RPD|PSW|WIM|FTM|MTS/.test(symbol)
  if (!muteable) return []
  return [{ key: 'mute', label: '消音', icon: 'mute' }]
}

/* ============================================================
 * 告警日志
 * ============================================================ */

/** 一天四班，每班 6 小时（设计稿的「消控室一班 ~ 四班」） */
const SHIFTS = ['消控室一班', '消控室二班', '消控室三班', '消控室四班']

/** 事件时间 → 处置班次 */
export function shiftOf(t: number): string {
  const d = new Date(t)
  const hour = d.getHours()
  return SHIFTS[Math.floor(hour / 6)] ?? SHIFTS[0]
}

/**
 * 告警日志行数
 *
 * 设计稿是「共 6 条数据」但分页又画了两页 —— 6 条填不满 10 条一页，
 * 是设计稿的自相矛盾。这里取 12 条（10 条 / 页 = 2 页），
 * 分页结构与设计稿一致，条数按演示数据的规模来。
 */
const ALARM_ROWS = 12

/**
 * 告警日志
 *
 * 第一行用该设备的真实事件（有事件时），其余行按设备身份 key 确定性派生 ——
 * 平台暂无告警工单查询接口，历史行与 duty-data.ts 的演示事件同源。
 */
export function buildAlarms(device: SceneDevice, event?: DutyEvent, now = Date.now()): DetailAlarmRow[] {
  const rnd = rngOf(seedOf(`dd-alarm-${device.key}`))
  const rows: DetailAlarmRow[] = []

  for (let i = 0; i < ALARM_ROWS; i++) {
    const isPrimary = i === 0 && !!event
    const at = isPrimary
      ? event!.latestAt
      : now - (i + 1) * (2 + Math.floor(rnd() * 8)) * 3_600_000

    const category = isPrimary ? event!.category : pickCategory(rnd)
    const content = isPrimary ? event!.point : `${category}信号`
    const value = isPrimary ? event!.alarmValue : alarmValueOf(rnd)

    rows.push({
      id: `${device.key}-${i}`,
      time: formatTime(at),
      category,
      content,
      desc: shiftOf(at),
      value,
      badge: category === '火警' || category === '故障' || category === '预警' ? category : undefined,
    })
  }

  return rows
}

/** 派生一条历史告警的类别 */
function pickCategory(rnd: () => number): string {
  const r = rnd()
  if (r < 0.4) return '故障'
  if (r < 0.62) return '预警'
  if (r < 0.78) return '火警'
  return '其他'
}

/** 派生一条历史告警的告警值 */
function alarmValueOf(rnd: () => number): string {
  return `${(rnd() * 0.1).toFixed(3)}MPa`
}

/* ============================================================
 * 历史数据
 * ============================================================ */

/**
 * 历史曲线
 *
 * @param tab  页签 key（HISTORY_TABS 之一）
 * @param from 起始时间
 * @param to   结束时间
 */
export function buildHistory(
  device: SceneDevice,
  tab: string,
  from: number,
  to: number,
): DetailHistory {
  const meta = HISTORY_TABS.find((t) => t.key === tab) ?? HISTORY_TABS[0]
  const span = Math.max(1, to - from)
  // 区间长度决定采样粒度：3 天内每 12 小时，之后每天
  const step = span <= 3 * 86_400_000 ? 12 * 3_600_000 : 86_400_000
  // 采样点最多 12 个。
  // 未超上限时按规整的 step 采样（x 轴时刻才对得齐：00:00 / 12:00）；
  // 超上限才在区间内**均匀分布**，否则长区间只画得上前 12 天、后半段空白
  const raw = Math.floor(span / step) + 1
  const capped = raw > 12
  const count = capped ? 12 : Math.max(2, raw)
  const gap = capped ? span / (count - 1) : step

  const rnd = rngOf(seedOf(`dd-hist-${device.key}-${tab}`))
  const xLabels: string[] = []
  const data: number[] = []

  for (let i = 0; i < count; i++) {
    const at = from + i * gap
    const d = new Date(at)
    const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // 按天采样时只显示日期，带上小时是冗余
    xLabels.push(step <= 12 * 3_600_000 ? `${md} ${String(d.getHours()).padStart(2, '0')}:00` : md)
    data.push(historyValue(tab, i, count, rnd))
  }

  return {
    xLabels,
    unit: meta.unit,
    min: meta.min,
    max: meta.max,
    series: [{ name: meta.label, color: SERIES_COLOR, data }],
  }
}

/**
 * 单个采样点的取值
 *
 * 形态按各指标的真实特征给，不是纯随机 ——
 * 纯随机画出来是锯齿噪声，看不出任何趋势：
 *   电量    缓慢下降，中途一次充电回升
 *   信号类  围绕基线小幅起伏
 *   状态类  0 / 1 跳变
 */
function historyValue(tab: string, i: number, count: number, rnd: () => number): number {
  const t = count > 1 ? i / (count - 1) : 0
  const jitter = (span: number) => (rnd() - 0.5) * span
  switch (tab) {
    case 'online': {
      // 在线 / 离线：每隔 3~4 个采样点掉线一次（起点随机，看起来不规律）
      // 纯随机会经常连成一条直线，看不出是阶梯状态
      const phase = Math.floor(rnd() * 3)
      return (i - phase) % 4 === 0 ? 0 : 1
    }
    case 'run': {
      // 正常 / 故障：每隔 4~5 个采样点故障一次
      const phase = Math.floor(rnd() * 4)
      return (i - phase) % 5 === 0 ? 0 : 1
    }
    case 'battery': {
      // 电量：缓慢下降，中途一次充电回升
      const down = 94 - 78 * t
      const charge = t > 0.5 && t < 0.78 ? (t - 0.5) * 190 : 0
      return clampInt(Math.round(down + charge + jitter(5)), 6, 100)
    }
    case 'signal':
      // 信号功率：围绕 -86dBm 起伏
      return Math.round(-86 + 9 * Math.sin(t * Math.PI * 2.1) + jitter(9))
    case 'rsrq':
      // RSRQ：围绕 -11dB 起伏
      return Math.round(-11 + 4.5 * Math.sin(t * Math.PI * 2.4) + jitter(3.5))
    case 'snr':
      // 信噪比：围绕 +8dB 起伏
      return Math.round(8 + 7 * Math.sin(t * Math.PI * 1.8 + 1) + jitter(4))
    case 'sensitivity':
      // 烟雾灵敏度：1~5 级，整级变化
      return clampInt(Math.round(3 + 1.6 * Math.sin(t * Math.PI * 1.4) + jitter(1.2)), 1, 5)
    default:
      return 0
  }
}

/** 取整并夹在 [min, max] */
function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v)))
}
