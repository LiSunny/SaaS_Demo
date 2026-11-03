/**
 * 消防档案页（ebike-v2）· 演示数据
 *
 * 三类记录：值班记录 / 巡查记录 / 隐患台账。字段严格照平台端三张表的列：
 *   - 值班记录：日期 / 班组 / 班次 / 实际上班时间 / 负责人 / 值班人员 / 值班内容 / 状态
 *   - 巡查记录：状态 / 所属计划 / 任务名称 / 执行人 / 关联点位 / 计划开始·结束·实际完成时间
 *   - 隐患台账：整改状态 / 隐患名称 / 隐患类型 / 隐患位置 / 上报人 / 上报来源 / 上报日期 /
 *               关联巡检点 / 是否分享数据
 *
 * 口径说明
 * --------
 * - 全部为演示数据，**基准日固定 2026-11-03**，日期写死、不用随机数：
 *   e2e 断言与截图要可复现。
 * - 楼栋与部位取校园三维模型的真实 POI（`public/campus-model/assets/manifest.json`
 *   的 Z4 生活服务区共 22 栋：1~8 号高层公寓 / 1~5 号学生公寓 / 1~3 号生活公寓 /
 *   第一~三食堂 / 校园超市 / 校医院 / 生活服务中心），楼层按模型里的真实层数写。
 * - 接口接入时只换本文件，组件不动。
 */

/* ============================================================
 * 类型
 * ============================================================ */

/** tab key */
export type ArchiveTabKey = 'duty' | 'patrol' | 'hazard'

/** 单元格渲染类型 */
export type ArchiveCellType = 'text' | 'datetime' | 'status' | 'tag' | 'bool' | 'action'

/** 状态语义：abnormal 走异常红，normal 走中性色阶（全页只留一个红） */
export type StatusTone = 'abnormal' | 'normal'

/** 行：字段名 = 列的 key，值统一按字符串存（展示与筛选用同一份文案） */
export type ArchiveRow = Record<string, string>

/** 表头列 */
export interface ArchiveColumn {
  /** 字段名 */
  key: string
  /** 表头文案 */
  label: string
  /** 该列在行内的宽度占比 */
  flex: number
  /** 单元格渲染类型 */
  type?: ArchiveCellType
  /** 最小宽度（px）：窄视口下宁可横滚也不压列，避免时间戳折行 */
  minWidth?: number
}

/** 筛选维度 */
export interface ArchiveFilter {
  /** 字段名（dateRange 时为筛选器自身 key，另用 field 指定被筛字段） */
  key: string
  /** 触发器上显示的维度名 */
  label: string
  /** 可选值，第一项固定为「全部」 */
  options: string[]
  /** 匹配方式：exact 按字段精确匹配；dateRange 按日期区间匹配 */
  match?: 'exact' | 'dateRange'
  /** dateRange 时被比较的字段名 */
  field?: string
}

/** 一个 tab（记录类型） */
export interface ArchiveTab {
  key: ArchiveTabKey
  label: string
  columns: ArchiveColumn[]
  filters: ArchiveFilter[]
  rows: ArchiveRow[]
}

/* ============================================================
 * 状态语义色
 * ============================================================ */

/**
 * 状态文案 → 语义。
 *
 * 口径与本大屏一致：**异常统一一个红**（故障 / 预警 / 待处置 / 隐患计数都同色），
 * 非异常不占用语义色，只靠字号与明度分层。所以「已完成 / 已确认 / 在岗」走中性色阶，
 * 不使用平台截图里的绿 / 橙 —— 深蓝玻璃底上绿橙达不到 4.5:1 对比度。
 */
export const STATUS_TONE: Record<string, StatusTone> = {
  // 值班记录
  在岗: 'normal',
  迟到: 'abnormal',
  缺岗: 'abnormal',
  请假: 'normal',
  // 巡查记录（6 态与平台巡查任务一致）
  待执行: 'normal',
  执行中: 'normal',
  已完成: 'normal',
  预期未完成: 'abnormal',
  逾期完成: 'abnormal',
  已取消: 'normal',
  // 隐患台账
  待认领: 'abnormal',
  待整改: 'abnormal',
  已确认: 'normal',
}

/* ============================================================
 * 演示基准日
 * ============================================================ */

/** 演示基准日：所有日期以此为「今天」 */
export const ARCHIVE_BASE_DATE = '2026-11-03'

/** 日期偏移（天），用于近 N 天的区间判断 */
function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** 日期区间匹配（基准日口径）：今日 / 近7天 / 本月 */
function matchDateRange(date: string, range: string): boolean {
  if (!date) return false
  if (range === '今日') return date === ARCHIVE_BASE_DATE
  if (range === '近7天') {
    const from = shiftDate(ARCHIVE_BASE_DATE, -6)
    return date >= from && date <= ARCHIVE_BASE_DATE
  }
  if (range === '本月') return date.startsWith(ARCHIVE_BASE_DATE.slice(0, 7))
  return true
}

/* ============================================================
 * ① 值班记录
 * ============================================================ */

const DUTY_COLUMNS: ArchiveColumn[] = [
  { key: 'date', label: '日期', flex: 1, type: 'text', minWidth: 110 },
  { key: 'team', label: '班组', flex: 0.9, type: 'text', minWidth: 100 },
  { key: 'shift', label: '班次', flex: 0.7, type: 'text', minWidth: 76 },
  { key: 'onDutyAt', label: '实际上班时间', flex: 1.2, type: 'datetime', minWidth: 168 },
  { key: 'owner', label: '负责人', flex: 0.8, type: 'text', minWidth: 90 },
  { key: 'staff', label: '值班人员', flex: 1, type: 'text', minWidth: 120 },
  { key: 'content', label: '值班内容', flex: 1.8, type: 'text', minWidth: 200 },
  { key: 'status', label: '状态', flex: 0.8, type: 'status', minWidth: 90 },
  { key: 'action', label: '操作', flex: 0.6, type: 'action', minWidth: 84 },
]

const DUTY_ROWS: ArchiveRow[] = [
  {
    date: '2026-11-03', team: '消控室一班', shift: '白班', onDutyAt: '2026-11-03 08:00:00',
    owner: '李阳', staff: '王志刚、李明',
    content: '巡检消防水泵房与配电室，记录水压与电量并完成交接', status: '在岗', action: '',
  },
  {
    date: '2026-11-03', team: '消控室一班', shift: '夜班', onDutyAt: '2026-11-03 20:00:00',
    owner: '王志豪', staff: '陈建国',
    content: '值守中控室主机，复核火警与故障信号并登记', status: '在岗', action: '',
  },
  {
    date: '2026-11-02', team: '消控室二班', shift: '白班', onDutyAt: '2026-11-02 08:10:00',
    owner: '陈建国', staff: '刘建国',
    content: '检查气体灭火钢瓶压力与防排烟风机电位', status: '迟到', action: '',
  },
  {
    date: '2026-11-02', team: '园区巡检班', shift: '24小时', onDutyAt: '2026-11-02 00:00:00',
    owner: '李阳', staff: '网格员李明',
    content: '园区外围消防通道巡查，记录违规占道情况', status: '在岗', action: '',
  },
  {
    date: '2026-11-01', team: '消控室一班', shift: '白班', onDutyAt: '2026-11-01 08:00:00',
    owner: '王志豪', staff: '王志刚',
    content: '巡检消防水泵房与配电室，记录水压与电量并完成交接', status: '在岗', action: '',
  },
  {
    date: '2026-11-01', team: '消控室二班', shift: '夜班', onDutyAt: '2026-11-01 20:00:00',
    owner: '李阳', staff: '黄建国',
    content: '值守中控室主机，复核火警与故障信号并登记', status: '缺岗', action: '',
  },
  {
    date: '2026-10-31', team: '园区巡检班', shift: '24小时', onDutyAt: '2026-10-31 00:00:00',
    owner: '陈建国', staff: '网格员李明',
    content: '食堂与宿舍楼消防设施抽查，核对应急照明与疏散指示', status: '在岗', action: '',
  },
  {
    date: '2026-10-31', team: '消控室一班', shift: '白班', onDutyAt: '2026-10-31 08:00:00',
    owner: '李阳', staff: '李明',
    content: '巡检消防水泵房与配电室，记录水压与电量并完成交接', status: '在岗', action: '',
  },
  {
    date: '2026-10-30', team: '消控室二班', shift: '白班', onDutyAt: '2026-10-30 08:00:00',
    owner: '王志豪', staff: '刘建国',
    content: '检查气体灭火钢瓶压力与防排烟风机电位', status: '请假', action: '',
  },
  {
    date: '2026-10-30', team: '消控室一班', shift: '夜班', onDutyAt: '2026-10-30 20:00:00',
    owner: '李阳', staff: '王志刚',
    content: '值守中控室主机，复核火警与故障信号并登记', status: '在岗', action: '',
  },
  {
    date: '2026-10-29', team: '园区巡检班', shift: '24小时', onDutyAt: '2026-10-29 00:00:00',
    owner: '陈建国', staff: '网格员李明',
    content: '园区外围消防通道巡查，记录违规占道情况', status: '在岗', action: '',
  },
  {
    date: '2026-10-28', team: '消控室一班', shift: '白班', onDutyAt: '2026-10-28 08:00:00',
    owner: '李阳', staff: '黄建国',
    content: '巡检消防水泵房与配电室，记录水压与电量并完成交接', status: '迟到', action: '',
  },
]

/* ============================================================
 * ② 巡查记录
 * ============================================================ */

const PATROL_COLUMNS: ArchiveColumn[] = [
  { key: 'status', label: '状态', flex: 0.9, type: 'status', minWidth: 100 },
  { key: 'plan', label: '所属计划', flex: 1.5, type: 'text', minWidth: 170 },
  { key: 'task', label: '任务名称', flex: 1.5, type: 'text', minWidth: 160 },
  { key: 'executor', label: '执行人', flex: 0.8, type: 'text', minWidth: 90 },
  { key: 'point', label: '关联点位', flex: 1.2, type: 'text', minWidth: 140 },
  { key: 'planStart', label: '计划开始时间', flex: 1.2, type: 'datetime', minWidth: 168 },
  { key: 'planEnd', label: '计划结束时间', flex: 1.2, type: 'datetime', minWidth: 168 },
  { key: 'finishedAt', label: '实际完成时间', flex: 1.2, type: 'datetime', minWidth: 168 },
  { key: 'action', label: '操作', flex: 0.6, type: 'action', minWidth: 84 },
]

const PATROL_ROWS: ArchiveRow[] = [
  {
    status: '已完成', plan: '员工食堂隐患排查计划', task: '11月3日第1次任务', executor: '李阳',
    point: '第一食堂·后厨', planStart: '2026-11-03 00:00:00', planEnd: '2026-11-03 23:59:59',
    finishedAt: '2026-11-03 10:24:10', action: '',
  },
  {
    status: '执行中', plan: '校园超市消防安全巡查计划', task: '11月3日第2次任务', executor: '王志豪',
    point: '校园超市·冷链区', planStart: '2026-11-03 00:00:00', planEnd: '2026-11-03 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '待执行', plan: '生活服务区隐患排查计划', task: '11月4日第1次任务', executor: '李阳',
    point: '生活服务中心·设备间', planStart: '2026-11-04 00:00:00', planEnd: '2026-11-04 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '逾期完成', plan: '员工食堂隐患排查计划', task: '11月2日第1次任务', executor: '王志豪',
    point: '第二食堂·灶房', planStart: '2026-11-02 00:00:00', planEnd: '2026-11-02 23:59:59',
    finishedAt: '2026-11-03 09:15:42', action: '',
  },
  {
    status: '预期未完成', plan: '校园超市消防安全巡查计划', task: '11月2日第1次任务', executor: '李阳',
    point: '校园超市·仓储区', planStart: '2026-11-02 00:00:00', planEnd: '2026-11-02 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '已取消', plan: '生活服务区隐患排查计划', task: '11月1日第1次任务', executor: '王志豪',
    point: '生活服务中心·配电室', planStart: '2026-11-01 00:00:00', planEnd: '2026-11-01 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '已完成', plan: '生活服务区隐患排查计划', task: '11月1日第2次任务', executor: '李阳',
    point: '第一食堂·储藏间', planStart: '2026-11-01 00:00:00', planEnd: '2026-11-01 23:59:59',
    finishedAt: '2026-11-01 15:02:36', action: '',
  },
  {
    status: '执行中', plan: '员工食堂隐患排查计划', task: '11月2日第2次任务', executor: '王志豪',
    point: '第三食堂·大厅', planStart: '2026-11-02 00:00:00', planEnd: '2026-11-02 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '待执行', plan: '校园超市消防安全巡查计划', task: '11月5日第1次任务', executor: '李阳',
    point: '校园超市·收银区', planStart: '2026-11-05 00:00:00', planEnd: '2026-11-05 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '逾期完成', plan: '校园超市消防安全巡查计划', task: '10月31日第1次任务', executor: '李阳',
    point: '第一食堂·后厨', planStart: '2026-10-31 00:00:00', planEnd: '2026-10-31 23:59:59',
    finishedAt: '2026-11-01 08:41:19', action: '',
  },
  {
    status: '预期未完成', plan: '生活服务区隐患排查计划', task: '10月31日第2次任务', executor: '李阳',
    point: '第二食堂·冷库', planStart: '2026-10-31 00:00:00', planEnd: '2026-10-31 23:59:59',
    finishedAt: '--', action: '',
  },
  {
    status: '已取消', plan: '员工食堂隐患排查计划', task: '10月30日第1次任务', executor: '王志豪',
    point: '校医院·门诊楼', planStart: '2026-10-30 00:00:00', planEnd: '2026-10-30 23:59:59',
    finishedAt: '--', action: '',
  },
]

/* ============================================================
 * ③ 隐患台账
 * ============================================================ */

const HAZARD_COLUMNS: ArchiveColumn[] = [
  { key: 'status', label: '整改状态', flex: 0.9, type: 'status', minWidth: 96 },
  { key: 'name', label: '隐患名称', flex: 1.4, type: 'text', minWidth: 160 },
  { key: 'type', label: '隐患类型', flex: 0.9, type: 'tag', minWidth: 110 },
  { key: 'location', label: '隐患位置', flex: 1.4, type: 'text', minWidth: 175 },
  { key: 'reporter', label: '上报人', flex: 0.8, type: 'text', minWidth: 92 },
  { key: 'source', label: '上报来源', flex: 1, type: 'tag', minWidth: 130 },
  { key: 'reportedAt', label: '上报日期', flex: 1.2, type: 'datetime', minWidth: 168 },
  { key: 'patrolPoint', label: '关联巡检点', flex: 1.1, type: 'text', minWidth: 130 },
  { key: 'shared', label: '是否分享数据', flex: 0.8, type: 'bool', minWidth: 100 },
  { key: 'action', label: '操作', flex: 0.6, type: 'action', minWidth: 84 },
]

const HAZARD_ROWS: ArchiveRow[] = [
  {
    status: '待认领', name: '食堂电气隐患', type: '安全档案记录', location: '第一食堂·后厨',
    reporter: '李阳', source: '安全档案二维码', reportedAt: '2026-11-03 09:41:30',
    patrolPoint: '第一食堂·后厨', shared: '否', action: '',
  },
  {
    status: '待认领', name: '消火栓压力异常', type: '消防设施', location: '3号高层公寓·2单元·5层',
    reporter: '网格员李明', source: '员工自查', reportedAt: '2026-11-02 15:26:08',
    patrolPoint: '3号高层公寓·消火栓', shared: '否', action: '',
  },
  {
    status: '待认领', name: '疏散通道堆物', type: '区域风险', location: '校园超市·东侧通道',
    reporter: '李阳', source: '系统自建', reportedAt: '2026-11-01 10:08:44',
    patrolPoint: '校园超市·疏散通道', shared: '是', action: '',
  },
  {
    status: '待认领', name: '应急照明不亮', type: '消防设施', location: '8号学生公寓·3层',
    reporter: '网格员李明', source: '员工自查', reportedAt: '2026-10-30 20:12:55',
    patrolPoint: '8号学生公寓·走廊', shared: '否', action: '',
  },
  {
    status: '待整改', name: '配电箱私拉乱接', type: '电气线路', location: '校医院·门诊楼',
    reporter: '李阳', source: '安全档案二维码', reportedAt: '2026-10-29 14:33:21',
    patrolPoint: '校医院·配电室', shared: '否', action: '',
  },
  {
    status: '待整改', name: '防火门闭门器失效', type: '消防设施', location: '2号高层公寓·1单元·8层',
    reporter: '网格员李明', source: '系统自建', reportedAt: '2026-10-28 09:47:03',
    patrolPoint: '2号高层公寓·防火门', shared: '是', action: '',
  },
  {
    status: '待整改', name: '灭火器压力表指针在红区', type: '消防设施', location: '第一食堂·大厅',
    reporter: '李阳', source: '员工自查', reportedAt: '2026-10-27 11:20:36',
    patrolPoint: '第一食堂·大厅', shared: '否', action: '',
  },
  {
    status: '待整改', name: '电缆温度超限', type: '电气线路', location: '生活服务中心·设备间',
    reporter: '王志豪', source: '系统自建', reportedAt: '2026-10-26 16:05:12',
    patrolPoint: '生活服务中心·配电室', shared: '否', action: '',
  },
  {
    status: '已确认', name: '违规充电', type: '区域风险', location: '4号高层公寓·负一层',
    reporter: '李阳', source: '员工自查', reportedAt: '2026-10-25 19:52:40',
    patrolPoint: '4号高层公寓·车棚', shared: '是', action: '',
  },
  {
    status: '已确认', name: '消防通道标识褪色', type: '安全档案记录', location: '第一食堂·后厨',
    reporter: '网格员李明', source: '安全档案二维码', reportedAt: '2026-10-24 08:31:19',
    patrolPoint: '第一食堂·后厨', shared: '否', action: '',
  },
  {
    status: '已确认', name: '常闭式防火门被固定开启', type: '区域风险', location: '校医院·门诊楼',
    reporter: '李阳', source: '系统自建', reportedAt: '2026-10-23 13:44:27',
    patrolPoint: '校医院·疏散通道', shared: '否', action: '',
  },
  {
    status: '已确认', name: '烟感探测器被遮挡', type: '消防设施', location: '5号生活公寓·2单元·3层',
    reporter: '王志豪', source: '员工自查', reportedAt: '2026-10-22 17:09:58',
    patrolPoint: '5号生活公寓·走廊', shared: '否', action: '',
  },
]

/* ============================================================
 * tab 定义
 * ============================================================ */

export const ARCHIVE_TABS: ArchiveTab[] = [
  {
    key: 'duty',
    label: '值班记录',
    columns: DUTY_COLUMNS,
    filters: [
      { key: 'shift', label: '班次', options: ['全部', '白班', '夜班', '24小时'] },
      { key: 'status', label: '状态', options: ['全部', '在岗', '迟到', '缺岗', '请假'] },
      { key: 'date', label: '日期', options: ['全部', '今日', '近7天', '本月'], match: 'dateRange', field: 'date' },
    ],
    rows: DUTY_ROWS,
  },
  {
    key: 'patrol',
    label: '巡查记录',
    columns: PATROL_COLUMNS,
    filters: [
      {
        key: 'status',
        label: '状态',
        options: ['全部', '待执行', '执行中', '已完成', '预期未完成', '逾期完成', '已取消'],
      },
      {
        key: 'plan',
        label: '所属计划',
        options: ['全部', '员工食堂隐患排查计划', '生活服务区隐患排查计划', '校园超市消防安全巡查计划'],
      },
    ],
    rows: PATROL_ROWS,
  },
  {
    key: 'hazard',
    label: '隐患台账',
    columns: HAZARD_COLUMNS,
    filters: [
      { key: 'status', label: '整改状态', options: ['全部', '待认领', '待整改', '已确认'] },
      { key: 'type', label: '隐患类型', options: ['全部', '安全档案记录', '区域风险', '消防设施', '电气线路'] },
      { key: 'source', label: '上报来源', options: ['全部', '系统自建', '安全档案二维码', '员工自查'] },
    ],
    rows: HAZARD_ROWS,
  },
]

/* ============================================================
 * 过滤
 * ============================================================ */

/**
 * 按搜索词与筛选值过滤行。
 *
 * 搜索词匹配行内**全部字段**（含状态文案），大小写不敏感；
 * 多个筛选器之间是 AND 关系，与搜索词也是 AND。
 */
export function filterArchiveRows(
  tab: ArchiveTab,
  rows: ArchiveRow[],
  search: string,
  filterValues: Record<string, string>,
): ArchiveRow[] {
  const keyword = search.trim().toLowerCase()

  return rows.filter((row) => {
    for (const f of tab.filters) {
      const picked = filterValues[f.key]
      if (!picked || picked === '全部') continue
      const value = row[f.field ?? f.key] ?? ''
      if (f.match === 'dateRange') {
        if (!matchDateRange(value, picked)) return false
      } else if (value !== picked) {
        return false
      }
    }

    if (keyword) {
      const hit = Object.values(row).some((v) => String(v).toLowerCase().includes(keyword))
      if (!hit) return false
    }

    return true
  })
}
