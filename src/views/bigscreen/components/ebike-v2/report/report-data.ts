/**
 * 运行报告页（ebike-v2）· 演示数据
 *
 * 三类报告：告警分析报告 / 设备运行报告 / 值守报告。
 *
 * 卡片版式来自 Figma「人工智能+公共安全管理平台（后台）」的两个组件：
 *   · 样式一 = 报告 6539:8661（日报 / 样式一）—— 顶部带「小安助手」角标，
 *     右侧插画是「剪贴板 + 放大镜」（放大镜 = 分析）；
 *   · 样式二 = 报表 280:13129（周报 / 样式一）—— 无角标，标题块贴底，
 *     右侧插画是「剪贴板 + 柱状图」（图表 = 统计）。
 *
 * 卡片族的分配规则（页面上三类报告共用这套规则，不按分类临时决定）：
 *   告警分析报告 → 样式一（AI 分析产物，带小安助手角标）+ 分析插画
 *   设备运行报告 → 样式二（设备侧统计报表，不由助手生成）+ 统计插画
 *   值守报告     → 样式一（值守小结由小安助手汇总）+ 统计插画
 * Figma 里「报表」族的六个变体也共用同一张统计插画，此处沿用同一口径。
 *
 * 数据口径：
 *   - 全部为演示数据，**基准日固定 2026-11-03**（与消防档案页同一基准），
 *     日期写死、不用随机数，截图与 e2e 断言可复现。
 *   - 班组、值班人员、值守内容沿用消防档案页的同一套口径（消控室一班/二班、
 *     园区巡检班等），楼栋取校园三维模型 Z4 生活服务区的真实 POI。
 *   - 接口接入时只换本文件，组件不动。
 */

/* ============================================================
 * 类型
 * ============================================================ */

/** 报告分类 */
export type ReportKind = 'alarm' | 'device' | 'duty'

/** 右侧插画：分析（放大镜）/ 统计（柱状图） */
export type ReportArt = 'alarm' | 'stats'

/**
 * 指标语义：abnormal 走异常红，normal 走中性色阶。
 * 口径与本大屏一致 —— 全页只留一个红。
 */
export type MetricTone = 'normal' | 'abnormal'

/** 一条关键指标 */
export interface ReportMetric {
  /** 指标名 */
  label: string
  /** 指标值（含单位） */
  value: string
  /** 语义色；缺省为中性 */
  tone?: MetricTone
}

/** 一条 TOP 榜条目 */
export interface ReportHighlight {
  /** 条目名 */
  label: string
  /** 数值（含单位） */
  value: string
}

/** 一份报告 */
export interface ReportItem {
  /** 报告 id */
  id: string
  /** 卡片主标题（报告名） */
  title: string
  /** 卡片副标题（周期 / 日期） */
  period: string
  /** 是否带「小安助手」角标（样式一） */
  agentBadge: boolean
  /** 右侧插画 */
  art: ReportArt
  /** 一句话结论 */
  summary: string
  /** 关键指标 */
  metrics: ReportMetric[]
  /** TOP 榜 */
  highlights: ReportHighlight[]
  /** 生成时间 */
  generatedAt: string
}

/** 一类报告（页面上的一个分区） */
export interface ReportGroup {
  /** 分类 key */
  key: ReportKind
  /** 分区标题 */
  label: string
  /** 分区说明（标题右侧） */
  desc: string
  /** 该类报告 */
  items: ReportItem[]
}

/* ============================================================
 * ① 告警分析报告（样式一 + 分析插画）
 * ============================================================ */

const ALARM_REPORTS: ReportItem[] = [
  {
    id: 'alarm-2026-11-03',
    title: '告警分析报告',
    period: '2026年11月3日',
    agentBadge: true,
    art: 'alarm',
    summary: '全天告警 27 起，较前一日增加 4 起；集中在 3 号充电站与学生公寓区，均已闭环处置。',
    metrics: [
      { label: '告警总数', value: '27 起' },
      { label: '涉及设备', value: '14 台' },
      { label: '平均处置时长', value: '4.2 分钟' },
      { label: '超时未处置', value: '2 起', tone: 'abnormal' },
    ],
    highlights: [
      { label: '3 号充电站', value: '8 起' },
      { label: '2 号学生公寓', value: '5 起' },
      { label: '消控室主机', value: '4 起' },
    ],
    generatedAt: '2026-11-03 23:50',
  },
  {
    id: 'alarm-2026-11-02',
    title: '告警分析报告',
    period: '2026年11月2日',
    agentBadge: true,
    art: 'alarm',
    summary: '全天告警 23 起，火警信号 1 起为误报（食堂油烟干扰），其余为烟感与设备故障。',
    metrics: [
      { label: '告警总数', value: '23 起' },
      { label: '涉及设备', value: '12 台' },
      { label: '平均处置时长', value: '3.8 分钟' },
      { label: '超时未处置', value: '0 起' },
    ],
    highlights: [
      { label: '第一食堂烟感', value: '7 起' },
      { label: '3 号充电站', value: '6 起' },
      { label: '1 号高层公寓', value: '4 起' },
    ],
    generatedAt: '2026-11-02 23:48',
  },
  {
    id: 'alarm-2026-11-01',
    title: '告警分析报告',
    period: '2026年11月1日',
    agentBadge: true,
    art: 'alarm',
    summary: '全天告警 19 起，故障类占 11 起，主要为充电桩模块通信中断，已派单维保。',
    metrics: [
      { label: '告警总数', value: '19 起' },
      { label: '涉及设备', value: '9 台' },
      { label: '平均处置时长', value: '5.1 分钟' },
      { label: '超时未处置', value: '1 起', tone: 'abnormal' },
    ],
    highlights: [
      { label: '充电桩通信模块', value: '6 起' },
      { label: '2 号学生公寓', value: '5 起' },
      { label: '校园超市', value: '3 起' },
    ],
    generatedAt: '2026-11-01 23:52',
  },
  {
    id: 'alarm-2026-10-31',
    title: '告警分析报告',
    period: '2026年10月31日',
    agentBadge: true,
    art: 'alarm',
    summary: '全天告警 15 起，全部为巡查点位提醒，无火警信号，全部在当班闭环。',
    metrics: [
      { label: '告警总数', value: '15 起' },
      { label: '涉及设备', value: '7 台' },
      { label: '平均处置时长', value: '3.2 分钟' },
      { label: '超时未处置', value: '0 起' },
    ],
    highlights: [
      { label: '园区巡检点位', value: '5 起' },
      { label: '第三食堂', value: '4 起' },
      { label: '校医院', value: '3 起' },
    ],
    generatedAt: '2026-10-31 23:47',
  },
]

/* ============================================================
 * ② 设备运行报告（样式二 + 统计插画）
 * ============================================================ */

const DEVICE_REPORTS: ReportItem[] = [
  {
    id: 'device-2026-w45',
    title: '设备运行报告',
    period: '2026年-第45周',
    agentBadge: false,
    art: 'stats',
    summary: '本周设备在线率 98.6%，累计运行时长 12,480 小时，故障停机 3.2 小时，巡检完成率 96.4%。',
    metrics: [
      { label: '设备在线率', value: '98.6%' },
      { label: '累计运行时长', value: '12,480 小时' },
      { label: '故障停机', value: '3.2 小时' },
      { label: '巡检完成率', value: '96.4%' },
    ],
    highlights: [
      { label: '火灾探测器', value: '246 点位' },
      { label: '视频监控', value: '96 路' },
      { label: '充换电桩', value: '128 台' },
    ],
    generatedAt: '2026-11-01 02:00',
  },
  {
    id: 'device-2026-w44',
    title: '设备运行报告',
    period: '2026年-第44周',
    agentBadge: false,
    art: 'stats',
    summary: '本周设备在线率 98.1%，因 1 台充电桩模块更换停机 6.5 小时，其余指标平稳。',
    metrics: [
      { label: '设备在线率', value: '98.1%' },
      { label: '累计运行时长', value: '12,310 小时' },
      { label: '故障停机', value: '6.5 小时' },
      { label: '巡检完成率', value: '95.8%' },
    ],
    highlights: [
      { label: '火灾探测器', value: '246 点位' },
      { label: '视频监控', value: '96 路' },
      { label: '充换电桩', value: '128 台' },
    ],
    generatedAt: '2026-10-25 02:00',
  },
  {
    id: 'device-2026-w43',
    title: '设备运行报告',
    period: '2026年-第43周',
    agentBadge: false,
    art: 'stats',
    summary: '本周设备在线率 97.4%，秋季用电高峰充换电桩负荷上升，故障停机时长环比增加 1.2 小时。',
    metrics: [
      { label: '设备在线率', value: '97.4%' },
      { label: '累计运行时长', value: '12,140 小时' },
      { label: '故障停机', value: '5.3 小时' },
      { label: '巡检完成率', value: '94.2%' },
    ],
    highlights: [
      { label: '充换电桩', value: '128 台' },
      { label: '火灾探测器', value: '246 点位' },
      { label: '视频监控', value: '96 路' },
    ],
    generatedAt: '2026-10-18 02:00',
  },
  {
    id: 'device-2026-10',
    title: '设备运行报告',
    period: '2026年10月',
    agentBadge: false,
    art: 'stats',
    summary: '10 月整月设备在线率 98.3%，累计运行时长 51,600 小时，隐患整改完成率 100%。',
    metrics: [
      { label: '设备在线率', value: '98.3%' },
      { label: '累计运行时长', value: '51,600 小时' },
      { label: '故障停机', value: '21.8 小时' },
      { label: '巡检完成率', value: '96.9%' },
    ],
    highlights: [
      { label: '火灾探测器', value: '246 点位' },
      { label: '视频监控', value: '96 路' },
      { label: '充换电桩', value: '128 台' },
    ],
    generatedAt: '2026-11-01 02:10',
  },
]

/* ============================================================
 * ③ 值守报告（样式一 + 统计插画）
 * ============================================================ */

const DUTY_REPORTS: ReportItem[] = [
  {
    id: 'duty-2026-11-03',
    title: '值守报告',
    period: '2026年11月3日',
    agentBadge: true,
    art: 'stats',
    summary: '今日 6 个班次在岗 72 小时，处置工单 19 单；消控室二班夜班交接记录缺 1 项。',
    metrics: [
      { label: '值班班次', value: '6 班' },
      { label: '在岗时长', value: '72 小时' },
      { label: '处置工单', value: '19 单' },
      { label: '交接异常', value: '1 起', tone: 'abnormal' },
    ],
    highlights: [
      { label: '消控室一班', value: '4 班' },
      { label: '园区巡检班', value: '2 班' },
      { label: '消控室二班', value: '0 班' },
    ],
    generatedAt: '2026-11-04 00:10',
  },
  {
    id: 'duty-2026-11-02',
    title: '值守报告',
    period: '2026年11月2日',
    agentBadge: true,
    art: 'stats',
    summary: '今日 6 个班次在岗 71 小时，处置工单 16 单；消控室二班白班迟到 10 分钟，已记录。',
    metrics: [
      { label: '值班班次', value: '6 班' },
      { label: '在岗时长', value: '71 小时' },
      { label: '处置工单', value: '16 单' },
      { label: '交接异常', value: '1 起', tone: 'abnormal' },
    ],
    highlights: [
      { label: '消控室一班', value: '4 班' },
      { label: '园区巡检班', value: '1 班' },
      { label: '消控室二班', value: '1 班' },
    ],
    generatedAt: '2026-11-03 00:08',
  },
  {
    id: 'duty-2026-11-01',
    title: '值守报告',
    period: '2026年11月1日',
    agentBadge: true,
    art: 'stats',
    summary: '今日 6 个班次在岗 72 小时，处置工单 21 单；消控室二班夜班缺岗 1 人次，已补班。',
    metrics: [
      { label: '值班班次', value: '6 班' },
      { label: '在岗时长', value: '72 小时' },
      { label: '处置工单', value: '21 单' },
      { label: '交接异常', value: '1 起', tone: 'abnormal' },
    ],
    highlights: [
      { label: '消控室一班', value: '4 班' },
      { label: '消控室二班', value: '2 班' },
      { label: '园区巡检班', value: '0 班' },
    ],
    generatedAt: '2026-11-02 00:06',
  },
  {
    id: 'duty-2026-10-31',
    title: '值守报告',
    period: '2026年10月31日',
    agentBadge: true,
    art: 'stats',
    summary: '今日 6 个班次在岗 72 小时，处置工单 14 单；食堂与宿舍楼消防设施抽查全部合格。',
    metrics: [
      { label: '值班班次', value: '6 班' },
      { label: '在岗时长', value: '72 小时' },
      { label: '处置工单', value: '14 单' },
      { label: '交接异常', value: '0 起' },
    ],
    highlights: [
      { label: '消控室一班', value: '4 班' },
      { label: '园区巡检班', value: '2 班' },
      { label: '消控室二班', value: '0 班' },
    ],
    generatedAt: '2026-11-01 00:12',
  },
]

/* ============================================================
 * 页面用的三个分区
 * ============================================================ */

/** 页面分区：告警分析 / 设备运行 / 值守 */
export const REPORT_GROUPS: ReportGroup[] = [
  {
    key: 'alarm',
    label: '告警分析报告',
    desc: 'AI 汇总 · 按日',
    items: ALARM_REPORTS,
  },
  {
    key: 'device',
    label: '设备运行报告',
    desc: '设备侧统计 · 按周',
    items: DEVICE_REPORTS,
  },
  {
    key: 'duty',
    label: '值守报告',
    desc: '小安助手汇总 · 按日',
    items: DUTY_REPORTS,
  },
]

/** 报告总数（页面头部概览用） */
export const REPORT_TOTAL = REPORT_GROUPS.reduce((sum, g) => sum + g.items.length, 0)
