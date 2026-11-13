/**
 * 运行报告页（ebike-v2）· 演示数据
 *
 * 版式对应设计稿 110:11432（智能安全管控平台 / 运行报告）：
 *   左栏「报告分类」（三类报告）→ 右栏「详细记录」（工具条 + 卡片列表 + 分页）。
 *
 * 三类报告：
 *   告警分析报告 —— AI 汇总的告警研判（按日），卡片用「分析」插画；
 *   设备运行报告 —— 设备侧统计报表（按周 / 月 / 季），卡片用「统计」插画；
 *   值守报告     —— 值守小结，由小尼平安汇总（按日），卡片用「统计」插画。
 *
 * 卡片素材（分类图标 / 插画 / 助手角标 / 点击图标 / 搜索·日历·箭头）全部取自
 * 设计稿原始导出，见 `src/assets/bigscreen/ebike-v2/report/`。
 *
 * 数据口径：
 *   - 全部为演示数据，**基准日固定 2026-11-03**（与消防档案页同一基准），
 *     日期写死、不用随机数，截图与 e2e 断言可复现。
 *   - 班组 / 班次 / 值班人员沿用消防档案页的同一套口径（消控室一班、消控室二班、
 *     园区巡检班；白班、夜班、24 小时），楼栋取校园三维模型 Z4 生活服务区的真实 POI。
 *   - 告警 / 值守两类按「人 · 班组 · 班次」组织；设备运行报告是设备侧统计，
 *     没有值班人，改按「系统 · 区域 · 设备」组织 —— 筛选维度随分类走，
 *     工具条上的下拉文案也跟着换，不出现「设备报告按班次筛」这种空筛选。
 *   - 接口接入时只换本文件，组件不动。
 */

/* ============================================================
 * 类型
 * ============================================================ */

/** 报告分类 */
export type ReportKind = 'alarm' | 'device' | 'duty'

/** 右侧插画：分析（放大镜）/ 统计（柱状图） */
export type ReportArt = 'analysis' | 'stats'

/** 分类图标：立体记录板 / 折叠地图定位 / 立体警示台账 */
export type ReportIcon = 'clipboard' | 'map' | 'warning'

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

/** 一个筛选维度（下拉） */
export interface ReportFilter {
  /** 维度键，与记录里的 fields 同名 */
  key: string
  /** 下拉未选中时显示的文案（同时是「不过滤」的哨兵值） */
  label: string
  /** 可选值；第一项为「全部」，命中即视为不过滤 */
  options: string[]
}

/** 一份报告记录（列表卡片 + 预览浮层共用） */
export interface ReportRecord {
  /** 记录 id */
  id: string
  /** 卡片主标题（报告名） */
  title: string
  /** 卡片副标题（周期 / 日期） */
  date: string
  /** 周期对应的日期（日期区间过滤用，YYYY-MM-DD） */
  dateValue: string
  /** 右侧插画 */
  art: ReportArt
  /** 是否带「小尼平安」角标 */
  agentBadge: boolean
  /** 检索 / 筛选字段，键与所属分类的筛选维度一致 */
  fields: Record<string, string>
  /** 一句话结论 */
  summary: string
  /** 关键指标 */
  metrics: ReportMetric[]
  /** TOP 榜 */
  highlights: ReportHighlight[]
  /** 生成时间 */
  generatedAt: string
}

/** 一类报告（左栏的一个分类 tab） */
export interface ReportCategory {
  /** 分类 key */
  key: ReportKind
  /** 左栏分类名 */
  label: string
  /** 左栏图标 */
  icon: ReportIcon
  /** 卡片标题（列表卡片上显示的报告名） */
  cardTitle: string
  /** 搜索框占位文案 */
  searchPlaceholder: string
  /** 筛选维度 */
  filters: ReportFilter[]
  /** 该类报告记录 */
  records: ReportRecord[]
}

/* ============================================================
 * 公共口径
 * ============================================================ */

/** 班组（与消防档案页一致） */
const TEAMS = ['全部班组', '消控室一班', '消控室二班', '园区巡检班']

/** 班次（与消防档案页一致） */
const SHIFTS = ['全部班次', '白班', '夜班', '24小时']

/** 设备系统维度 */
const SYSTEMS = ['全部系统', '火灾探测器', '视频监控', '充换电桩', '火灾报警主机']

/** ISO 日期 → 设计稿口径的中文日期（2026-11-03 → 2026年11月3日） */
function displayDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}

/** 设备区域维度（校园三维模型 Z4 生活服务区真实 POI） */
const AREAS = [
  '全部区域',
  '第一食堂',
  '3号高层公寓',
  '8号学生公寓',
  '2号高层公寓',
  '校医院·门诊楼',
  '生活服务中心',
]

/* ============================================================
 * ① 告警分析报告（按日 · 分析插画）
 * ============================================================ */

/** 告警分析的种子数据：数值写死，摘要由模板拼出 */
const ALARM_SEEDS = [
  {
    date: '2026-11-03', count: 27, devices: 14, avg: '4.2 分钟', overdue: 2,
    person: '王志刚', team: '消控室一班', shift: '白班',
    note: '告警集中在 3 号充电站与学生公寓区，均已闭环处置。',
    top: [['3 号充电站', '8 起'], ['2 号学生公寓', '5 起'], ['消控室主机', '4 起']],
  },
  {
    date: '2026-11-02', count: 23, devices: 12, avg: '3.8 分钟', overdue: 0,
    person: '陈建国', team: '消控室一班', shift: '夜班',
    note: '火警信号 1 起为误报（食堂油烟干扰），其余为烟感与设备故障。',
    top: [['第一食堂烟感', '7 起'], ['3 号充电站', '6 起'], ['1 号高层公寓', '4 起']],
  },
  {
    date: '2026-11-01', count: 19, devices: 9, avg: '5.1 分钟', overdue: 1,
    person: '刘建国', team: '消控室二班', shift: '白班',
    note: '故障类占 11 起，主要为充电桩模块通信中断，已派单维保。',
    top: [['充电桩通信模块', '6 起'], ['2 号学生公寓', '5 起'], ['校园超市', '3 起']],
  },
  {
    date: '2026-10-31', count: 15, devices: 7, avg: '3.2 分钟', overdue: 0,
    person: '黄建国', team: '消控室二班', shift: '夜班',
    note: '全部为巡查点位提醒，无火警信号，全部在当班闭环。',
    top: [['园区巡检点位', '5 起'], ['第三食堂', '4 起'], ['校医院', '3 起']],
  },
  {
    date: '2026-10-30', count: 22, devices: 11, avg: '4.6 分钟', overdue: 0,
    person: '李明', team: '园区巡检班', shift: '24小时',
    note: '外围违规充电类告警上升，已联合宿管现场劝阻。',
    top: [['4 号高层公寓', '9 起'], ['8 号学生公寓', '5 起'], ['校园超市', '4 起']],
  },
  {
    date: '2026-10-29', count: 18, devices: 8, avg: '3.9 分钟', overdue: 1,
    person: '王志刚', team: '消控室一班', shift: '白班',
    note: '夜间设备自检误报较多，已调整主机灵敏度。',
    top: [['消控室主机', '6 起'], ['2 号高层公寓', '4 起'], ['生活服务中心', '3 起']],
  },
  {
    date: '2026-10-28', count: 12, devices: 6, avg: '3.4 分钟', overdue: 0,
    person: '陈建国', team: '消控室一班', shift: '夜班',
    note: '巡查点位提醒 12 起，全部当班闭环，无超时。',
    top: [['园区巡检点位', '5 起'], ['第一食堂', '3 起'], ['校医院', '2 起']],
  },
  {
    date: '2026-10-27', count: 26, devices: 13, avg: '6.2 分钟', overdue: 3,
    person: '刘建国', team: '消控室二班', shift: '白班',
    note: '国庆假期后设备集中投运，故障类告警偏多，已加派维保。',
    top: [['充换电桩', '11 起'], ['视频监控', '6 起'], ['消控室主机', '4 起']],
  },
  {
    date: '2026-10-26', count: 9, devices: 5, avg: '2.8 分钟', overdue: 0,
    person: '黄建国', team: '消控室二班', shift: '夜班',
    note: '全天仅 9 起，全部为巡查提醒，处置时长平稳。',
    top: [['园区巡检点位', '4 起'], ['第三食堂', '2 起'], ['8 号学生公寓', '2 起']],
  },
  {
    date: '2026-10-25', count: 21, devices: 10, avg: '4.4 分钟', overdue: 0,
    person: '李明', team: '园区巡检班', shift: '24小时',
    note: '充电桩模块更换后运行稳定，告警量回落。',
    top: [['3 号充电站', '7 起'], ['生活服务中心', '5 起'], ['校园超市', '3 起']],
  },
  {
    date: '2026-10-24', count: 17, devices: 9, avg: '4.0 分钟', overdue: 1,
    person: '王志刚', team: '消控室一班', shift: '白班',
    note: '食堂油烟干扰导致烟感误报 3 起，其余为点位低电量提醒。',
    top: [['第一食堂烟感', '6 起'], ['8 号学生公寓', '4 起'], ['视频监控', '3 起']],
  },
  {
    date: '2026-10-23', count: 14, devices: 7, avg: '3.1 分钟', overdue: 0,
    person: '陈建国', team: '消控室一班', shift: '夜班',
    note: '巡查提醒 14 起，无火警信号，全部在当班闭环。',
    top: [['园区巡检点位', '5 起'], ['校医院', '3 起'], ['第二食堂', '2 起']],
  },
]

/** 告警分析记录 */
const ALARM_RECORDS: ReportRecord[] = ALARM_SEEDS.map((s) => ({
  id: `alarm-${s.date}`,
  title: '告警分析报告',
  date: displayDate(s.date),
  dateValue: s.date,
  art: 'analysis',
  agentBadge: true,
  fields: { person: s.person, team: s.team, shift: s.shift },
  summary: `全天告警 ${s.count} 起，涉及设备 ${s.devices} 台，平均处置时长 ${s.avg}，超时未处置 ${s.overdue} 起；${s.note}`,
  metrics: [
    { label: '告警总数', value: `${s.count} 起` },
    { label: '涉及设备', value: `${s.devices} 台` },
    { label: '平均处置时长', value: s.avg },
    { label: '超时未处置', value: `${s.overdue} 起`, tone: s.overdue > 0 ? 'abnormal' : 'normal' },
  ],
  highlights: s.top.map(([label, value]) => ({ label, value })),
  generatedAt: `${s.date} 23:50`,
}))

/* ============================================================
 * ② 设备运行报告（按周 / 月 / 季 · 统计插画）
 * ============================================================ */

/** 设备运行的种子数据 */
const DEVICE_SEEDS = [
  {
    period: '2026年 第45周', date: '2026-11-01', online: '98.6%', runtime: '12,480 小时',
    downtime: '3.2 小时', inspect: '96.4%', system: '火灾探测器', area: '3号高层公寓',
    device: '3 号高层公寓·2 单元·5 层烟感探测器',
    note: '本周设备在线率 98.6%，故障停机 3.2 小时，巡检完成率 96.4%。',
  },
  {
    period: '2026年 第44周', date: '2026-10-25', online: '98.1%', runtime: '12,310 小时',
    downtime: '6.5 小时', inspect: '95.8%', system: '充换电桩', area: '生活服务中心',
    device: '生活服务中心·设备间 2 号充电桩模块',
    note: '1 台充电桩模块更换停机 6.5 小时，其余指标平稳。',
  },
  {
    period: '2026年 第43周', date: '2026-10-18', online: '97.4%', runtime: '12,140 小时',
    downtime: '5.3 小时', inspect: '94.2%', system: '视频监控', area: '第一食堂',
    device: '第一食堂·后厨摄像机 04',
    note: '秋季用电高峰充换电桩负荷上升，故障停机环比增加 1.2 小时。',
  },
  {
    period: '2026年 第42周', date: '2026-10-11', online: '98.5%', runtime: '12,390 小时',
    downtime: '2.8 小时', inspect: '96.8%', system: '火灾报警主机', area: '校医院',
    device: '校医院·门诊楼 火灾报警主机',
    note: '主机联动测试完成，设备在线率回升至 98.5%。',
  },
  {
    period: '2026年 第41周', date: '2026-10-04', online: '98.9%', runtime: '12,520 小时',
    downtime: '1.6 小时', inspect: '97.3%', system: '火灾探测器', area: '8号学生公寓',
    device: '8 号学生公寓·3 层烟感探测器',
    note: '国庆前完成一轮探测器校准，在线率与巡检完成率均为本季度最高。',
  },
  {
    period: '2026年 第40周', date: '2026-09-27', online: '97.8%', runtime: '11,980 小时',
    downtime: '5.9 小时', inspect: '95.1%', system: '视频监控', area: '校园超市',
    device: '校园超市·东侧通道摄像机 12',
    note: '视频平台升级重启导致短时离线，已恢复。',
  },
  {
    period: '2026年 第39周', date: '2026-09-20', online: '98.2%', runtime: '12,150 小时',
    downtime: '3.1 小时', inspect: '96.0%', system: '火灾探测器', area: '2号高层公寓',
    device: '2 号高层公寓·1 单元·8 层烟感探测器',
    note: '完成高层公寓探测器批量更换，运行指标恢复平稳。',
  },
  {
    period: '2026年 第38周', date: '2026-09-13', online: '96.9%', runtime: '11,720 小时',
    downtime: '7.4 小时', inspect: '93.8%', system: '充换电桩', area: '3号高层公寓',
    device: '3 号高层公寓·负一层 5 号充电桩',
    note: '开学季充电桩集中使用，模块故障率上升，已增派巡检。',
  },
  {
    period: '2026年10月', date: '2026-10-31', online: '98.3%', runtime: '51,600 小时',
    downtime: '21.8 小时', inspect: '96.9%', system: '火灾探测器', area: '3号高层公寓',
    device: '3 号高层公寓·2 单元·5 层烟感探测器',
    note: '整月设备在线率 98.3%，累计运行时长 51,600 小时，隐患整改完成率 100%。',
  },
  {
    period: '2026年9月', date: '2026-09-30', online: '97.6%', runtime: '49,840 小时',
    downtime: '26.4 小时', inspect: '95.2%', system: '充换电桩', area: '生活服务中心',
    device: '生活服务中心·设备间 2 号充电桩模块',
    note: '9 月开学季负荷高峰，月度故障停机 26.4 小时。',
  },
  {
    period: '2026年8月', date: '2026-08-31', online: '98.0%', runtime: '50,120 小时',
    downtime: '18.9 小时', inspect: '96.4%', system: '视频监控', area: '第一食堂',
    device: '第一食堂·后厨摄像机 04',
    note: '8 月为设备集中保养月，停机时长较 7 月下降 3.5 小时。',
  },
  {
    period: '2026年第三季度', date: '2026-09-30', online: '97.4%', runtime: '149,680 小时',
    downtime: '64.1 小时', inspect: '95.8%', system: '火灾报警主机', area: '校医院',
    device: '校医院·门诊楼 火灾报警主机',
    note: '第三季度累计运行时长 149,680 小时，季度巡检完成率 95.8%。',
  },
]

/** 设备运行记录 */
const DEVICE_RECORDS: ReportRecord[] = DEVICE_SEEDS.map((s) => ({
  id: `device-${s.date}-${s.period}`,
  title: '设备运行报表',
  date: s.period,
  dateValue: s.date,
  art: 'stats',
  agentBadge: false,
  fields: { system: s.system, area: s.area, device: s.device },
  summary: s.note,
  metrics: [
    { label: '设备在线率', value: s.online },
    { label: '累计运行时长', value: s.runtime },
    { label: '故障停机', value: s.downtime, tone: parseFloat(s.downtime) > 20 ? 'abnormal' : 'normal' },
    { label: '巡检完成率', value: s.inspect },
  ],
  highlights: [
    { label: '火灾探测器', value: '246 点位' },
    { label: '视频监控', value: '96 路' },
    { label: '充换电桩', value: '128 台' },
  ],
  generatedAt: `${s.date} 02:00`,
}))

/* ============================================================
 * ③ 值守报告（按日 · 统计插画）
 * ============================================================ */

/** 值守报告的种子数据 */
const DUTY_SEEDS = [
  {
    date: '2026-11-03', shifts: 6, hours: 72, orders: 19, handover: 1,
    person: '王志刚', team: '消控室一班', shift: '白班',
    note: '消控室二班夜班交接记录缺 1 项。',
    top: [['消控室一班', '4 班'], ['园区巡检班', '2 班'], ['消控室二班', '0 班']],
  },
  {
    date: '2026-11-02', shifts: 6, hours: 71, orders: 16, handover: 1,
    person: '陈建国', team: '消控室一班', shift: '夜班',
    note: '消控室二班白班迟到 10 分钟，已记录。',
    top: [['消控室一班', '4 班'], ['园区巡检班', '1 班'], ['消控室二班', '1 班']],
  },
  {
    date: '2026-11-01', shifts: 6, hours: 72, orders: 21, handover: 1,
    person: '刘建国', team: '消控室二班', shift: '白班',
    note: '消控室二班夜班缺岗 1 人次，已补班。',
    top: [['消控室一班', '4 班'], ['消控室二班', '2 班'], ['园区巡检班', '0 班']],
  },
  {
    date: '2026-10-31', shifts: 6, hours: 72, orders: 14, handover: 0,
    person: '黄建国', team: '消控室二班', shift: '夜班',
    note: '食堂与宿舍楼消防设施抽查全部合格。',
    top: [['消控室一班', '4 班'], ['园区巡检班', '2 班'], ['消控室二班', '0 班']],
  },
  {
    date: '2026-10-30', shifts: 5, hours: 60, orders: 12, handover: 0,
    person: '李明', team: '园区巡检班', shift: '24小时',
    note: '园区巡检班合并 1 个班次，通道巡查无异常。',
    top: [['消控室一班', '3 班'], ['园区巡检班', '1 班'], ['消控室二班', '1 班']],
  },
  {
    date: '2026-10-29', shifts: 6, hours: 72, orders: 17, handover: 0,
    person: '王志刚', team: '消控室一班', shift: '白班',
    note: '气瓶压力与防排烟风机电位例行检查全部正常。',
    top: [['消控室一班', '4 班'], ['消控室二班', '2 班'], ['园区巡检班', '0 班']],
  },
  {
    date: '2026-10-28', shifts: 6, hours: 72, orders: 15, handover: 2,
    person: '陈建国', team: '消控室一班', shift: '夜班',
    note: '夜班主机复位 2 次均已登记，设备无损坏。',
    top: [['消控室一班', '4 班'], ['园区巡检班', '2 班'], ['消控室二班', '0 班']],
  },
  {
    date: '2026-10-27', shifts: 6, hours: 72, orders: 23, handover: 1,
    person: '刘建国', team: '消控室二班', shift: '白班',
    note: '节假日外围巡查加派 1 组，通道秩序良好。',
    top: [['消控室二班', '3 班'], ['消控室一班', '3 班'], ['园区巡检班', '0 班']],
  },
  {
    date: '2026-10-26', shifts: 5, hours: 60, orders: 11, handover: 0,
    person: '黄建国', team: '消控室二班', shift: '夜班',
    note: '设备集中保养，值守以巡检提醒为主。',
    top: [['消控室一班', '3 班'], ['消控室二班', '1 班'], ['园区巡检班', '1 班']],
  },
  {
    date: '2026-10-25', shifts: 6, hours: 72, orders: 18, handover: 0,
    person: '李明', team: '园区巡检班', shift: '24小时',
    note: '充换电桩更换当日配合厂家做停机挂牌。',
    top: [['园区巡检班', '2 班'], ['消控室一班', '2 班'], ['消控室二班', '2 班']],
  },
  {
    date: '2026-10-24', shifts: 6, hours: 72, orders: 13, handover: 1,
    person: '王志刚', team: '消控室一班', shift: '白班',
    note: '交接班时配电室钥匙登记缺 1 项，已补登。',
    top: [['消控室一班', '4 班'], ['园区巡检班', '1 班'], ['消控室二班', '1 班']],
  },
  {
    date: '2026-10-23', shifts: 6, hours: 72, orders: 10, handover: 0,
    person: '陈建国', team: '消控室一班', shift: '夜班',
    note: '在岗记录完整，无异常记录。',
    top: [['消控室一班', '4 班'], ['消控室二班', '2 班'], ['园区巡检班', '0 班']],
  },
]

/** 值守报告记录 */
const DUTY_RECORDS: ReportRecord[] = DUTY_SEEDS.map((s) => ({
  id: `duty-${s.date}`,
  title: '值守报表',
  date: displayDate(s.date),
  dateValue: s.date,
  art: 'stats',
  agentBadge: true,
  fields: { person: s.person, team: s.team, shift: s.shift },
  summary: `今日 ${s.shifts} 个班次在岗 ${s.hours} 小时，处置工单 ${s.orders} 单；${s.note}`,
  metrics: [
    { label: '值班班次', value: `${s.shifts} 班` },
    { label: '在岗时长', value: `${s.hours} 小时` },
    { label: '处置工单', value: `${s.orders} 单` },
    { label: '交接异常', value: `${s.handover} 起`, tone: s.handover > 0 ? 'abnormal' : 'normal' },
  ],
  highlights: s.top.map(([label, value]) => ({ label, value })),
  generatedAt: `${s.date} 23:58`,
}))

/* ============================================================
 * 页面用的三个分类
 * ============================================================ */

/** 页面分类：告警分析 / 设备运行 / 值守 */
export const REPORT_CATEGORIES: ReportCategory[] = [
  {
    key: 'alarm',
    label: '告警分析报告',
    icon: 'clipboard',
    cardTitle: '告警分析报告',
    searchPlaceholder: '搜索人员',
    filters: [
      { key: 'team', label: '全部班组', options: TEAMS },
      { key: 'shift', label: '全部班次', options: SHIFTS },
    ],
    records: ALARM_RECORDS,
  },
  {
    key: 'device',
    label: '设备运行报告',
    icon: 'map',
    cardTitle: '设备运行报表',
    searchPlaceholder: '搜索设备',
    filters: [
      { key: 'system', label: '全部系统', options: SYSTEMS },
      { key: 'area', label: '全部区域', options: AREAS },
    ],
    records: DEVICE_RECORDS,
  },
  {
    key: 'duty',
    label: '值守报告',
    icon: 'warning',
    cardTitle: '值守报表',
    searchPlaceholder: '搜索人员',
    filters: [
      { key: 'team', label: '全部班组', options: TEAMS },
      { key: 'shift', label: '全部班次', options: SHIFTS },
    ],
    records: DUTY_RECORDS,
  },
]

/** 默认选中的分类 */
export const DEFAULT_REPORT_CATEGORY: ReportKind = 'alarm'

/* ============================================================
 * 过滤
 * ============================================================ */

/** 日期区间（YYYY-MM-DD） */
export type ReportDateRange = [string, string] | null

/**
 * 过滤记录
 *
 * 关键词命中记录任一维度值；下拉之间是 AND 关系；下拉的第一个选项（「全部…」）
 * 视为不过滤。日期区间按周期的日期值（dateValue）闭区间比较。
 */
export function filterReportRecords(
  category: ReportCategory,
  records: ReportRecord[],
  search: string,
  filterValues: Record<string, string>,
  dateRange: ReportDateRange,
): ReportRecord[] {
  const keyword = search.trim().toLowerCase()

  return records.filter((r) => {
    // 关键词：命中任一维度值即可
    if (keyword) {
      const haystack = Object.values(r.fields).join(' ').toLowerCase()
      if (!haystack.includes(keyword)) return false
    }

    // 筛选维度：逐个命中
    for (const f of category.filters) {
      const value = filterValues[f.key]
      if (!value || value === f.options[0]) continue
      if (r.fields[f.key] !== value) return false
    }

    // 日期区间
    if (dateRange) {
      const [start, end] = dateRange
      if (start && r.dateValue < start) return false
      if (end && r.dateValue > end) return false
    }

    return true
  })
}
