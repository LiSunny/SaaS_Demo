/**
 * 警情弹窗 · 演示数据
 *
 * 口径说明：
 *   - 报警单位信息：全校同一法人单位（林业大学雄安校区），全表共用一份。
 *   - 报警设备信息 / 持续报警数据：按「实时警情监控」卡每条警情一行，
 *     与 fire-mock.ts 的 ALARM_ROWS 一一对应（key 相同）。
 *
 * 时间字段的取法（设计稿只给了占位值，这里让数据自洽）：
 *   最新报警时间 = 持续报警时间线的第一条（倒序，最新在前）
 *   首次报警时间 = 持续报警时间线的最后一条
 *   告警值 / 设备编码 取设备档案里的登记值，未登记的写「-」。
 *
 * 接口接入后只替换本文件，组件不动。
 */

/** 报警单位信息 */
export interface AlarmCompanyInfo {
  /** 企业名称 */
  name: string
  /** 企业标签 */
  tag: string
  /** 企业类型 */
  type: string
  /** 风险等级 */
  riskLevel: string
  /** 负责人 */
  owner: string
  /** 详细地址 */
  address: string
}

/** 报警设备信息 */
export interface AlarmDeviceInfo {
  /** 告警设备 */
  device: string
  /** 告警位置 */
  position: string
  /** 告警内容（火警 / 故障 / 预警） */
  content: string
  /** 管理单元 */
  unit: string
  /** 最新报警时间 */
  latestAt: string
  /** 首次报警时间 */
  firstAt: string
  /** 设备编码 */
  code: string
  /** 告警值 */
  value: string
  /** 告警图片 */
  image: string
  /** 设备联系人 */
  contact: string
}

/** 持续报警数据的一条 */
export interface AlarmTimelineItem {
  /** 报警时间 */
  time: string
  /** 报警类型 */
  type: string
}

/** 警情详情：弹窗的全部内容来源 */
export interface AlarmDetail {
  /** 警情 key（与列表行的 key 对应，提交处置时回传） */
  key: string
  /** 弹窗标题（发生火警 / 发生故障 …） */
  title: string
  /** 报警单位信息 */
  company: AlarmCompanyInfo
  /** 持续报警数据（倒序：最新在前） */
  timeline: AlarmTimelineItem[]
  /** 报警设备信息 */
  device: AlarmDeviceInfo
  /** 设备运行状态 */
  deviceStatus: string
}

/** 核实处置的提交载荷 */
export interface AlarmConfirmPayload {
  /** 警情 key（与 ALARM_ROWS 的 key 对应） */
  key: string
  /** 告警内容 */
  content: string
  /** 核实结果 */
  verify: string
  /** 处理结果 */
  handle: string
  /** 处理说明 */
  remark: string
}

/** 报警单位：全校共用（设计稿示例单位） */
const COMPANY: AlarmCompanyInfo = {
  name: '林业大学雄安校区',
  tag: '暂无',
  type: '暂无',
  riskLevel: '暂无',
  owner: '林业大学管理员 17733550542',
  address: '河北省保定市雄县雄州镇府后街15号阳光花园',
}

/** 每条警情的设备侧信息（时间线倒序：最新在前） */
interface AlarmDetailSpec {
  /** 告警内容（同时决定弹窗标题「发生X」） */
  content: string
  /** 告警设备 */
  device: string
  /** 告警位置 */
  position: string
  /** 管理单元 */
  unit: string
  /** 设备编码 */
  code: string
  /** 告警值 */
  value: string
  /** 设备联系人 */
  contact: string
  /** 设备运行状态 */
  deviceStatus: string
  /** 持续报警数据（倒序） */
  timeline: AlarmTimelineItem[]
}

/** 未登记告警图片时的占位文案（设计稿 #199:860） */
const NO_IMAGE = '暂无数据'

function buildDetail(key: string, spec: AlarmDetailSpec): AlarmDetail {
  return {
    key,
    title: `发生${spec.content}`,
    company: COMPANY,
    timeline: spec.timeline,
    device: {
      device: spec.device,
      position: spec.position,
      content: spec.content,
      unit: spec.unit,
      latestAt: spec.timeline[0]?.time ?? '',
      firstAt: spec.timeline[spec.timeline.length - 1]?.time ?? '',
      code: spec.code,
      value: spec.value,
      image: NO_IMAGE,
      contact: spec.contact,
    },
    deviceStatus: spec.deviceStatus,
  }
}

/**
 * 警情详情表：key 与 fire-mock.ts 的 ALARM_ROWS 一一对应
 *
 * 覆盖「实时警情监控」卡可见的前 4 条，第 5 条一并备好，
 * 后续该卡放开显示条数时不用再补数据。
 */
export const ALARM_DETAILS: Record<string, AlarmDetail> = {
  a1: buildDetail('a1', {
    content: '预警',
    device: '可燃气体探测器',
    position: '2 号楼 1 单元 厨房',
    unit: '林业大学雄安校区/2 号楼',
    code: 'RQ-GAS-2F-0032',
    value: '25%LEL',
    contact: '张建国 13903331234',
    deviceStatus: '预警（可燃气体浓度超限）',
    timeline: [
      { time: '2026-11-02 15:41:12', type: '预警' },
      { time: '2026-11-02 15:41:05', type: '预警' },
      { time: '2026-11-02 15:40:58', type: '预警' },
    ],
  }),
  a2: buildDetail('a2', {
    content: '故障',
    device: '三相电压监测模块',
    position: '3 号楼 2 单元 5 层 配电间',
    unit: '林业大学雄安校区/3 号楼',
    code: 'DY-VOL-3F-0117',
    value: '176V',
    contact: '李国强 13903335678',
    deviceStatus: '故障（电压低于下限）',
    timeline: [
      { time: '2026-11-02 15:12:31', type: '故障' },
      { time: '2026-11-02 15:11:47', type: '故障' },
      { time: '2026-11-02 15:10:52', type: '故障' },
    ],
  }),
  a3: buildDetail('a3', {
    content: '故障',
    device: '消防水压监测终端',
    position: '1 号楼 1 单元 消火栓',
    unit: '林业大学雄安校区/1 号楼',
    code: 'XJ-PRESS-1F-0021',
    value: '0.28MPa',
    contact: '王海涛 13903339012',
    deviceStatus: '离线（通讯中断）',
    timeline: [
      { time: '2026-11-02 14:55:08', type: '故障' },
      { time: '2026-11-02 14:53:40', type: '故障' },
      { time: '2026-11-02 14:52:16', type: '故障' },
    ],
  }),
  a4: buildDetail('a4', {
    content: '预警',
    device: '缆式感温探测器',
    position: '第一食堂 后厨配电箱',
    unit: '林业大学雄安校区/第一食堂',
    code: 'RJ-TEMP-C01-0008',
    value: '68℃',
    contact: '赵敏 13903332345',
    deviceStatus: '预警（温度超限）',
    timeline: [
      { time: '2026-11-02 14:31:22', type: '预警' },
      { time: '2026-11-02 14:30:55', type: '预警' },
      { time: '2026-11-02 14:30:11', type: '预警' },
    ],
  }),
  a5: buildDetail('a5', {
    content: '预警',
    device: '疏散通道占用检测器',
    position: '校医院 2 层 疏散通道',
    unit: '林业大学雄安校区/校医院',
    code: 'XS-OCC-YY-0014',
    value: '占用',
    contact: '孙丽 13903336789',
    deviceStatus: '预警（疏散通道被占用）',
    timeline: [
      { time: '2026-11-02 13:58:44', type: '预警' },
      { time: '2026-11-02 13:58:02', type: '预警' },
      { time: '2026-11-02 13:57:30', type: '预警' },
    ],
  }),
}

/**
 * 消防水系统的警情详情
 *
 * 与 ALARM_DETAILS 是两套：前者给「实时警情监控」卡的跨系统警情，
 * 这里给「消防用水监控」卡的水系统警情（键与 fire-mock.ts 的
 * WATER_ALARM_ROWS 对应）。两张卡都点得开警情弹窗，但内容各自收口。
 */
export const WATER_ALARM_DETAILS: Record<string, AlarmDetail> = {
  w1: buildDetail('w1', {
    content: '预警',
    device: '管网压力探测器',
    position: '3 号楼 2 单元 立管',
    unit: '林业大学雄安校区/3 号楼',
    code: 'XL-PRESS-3F-0206',
    value: '0.18MPa',
    contact: '周建军 13903331234',
    deviceStatus: '预警（压力低于下限）',
    timeline: [
      { time: '2026-11-02 15:41:26', type: '预警' },
      { time: '2026-11-02 15:41:03', type: '预警' },
      { time: '2026-11-02 15:40:49', type: '预警' },
    ],
  }),
  w2: buildDetail('w2', {
    content: '故障',
    device: '阀门探测装置',
    position: '1 号楼 消火栓环网阀门',
    unit: '林业大学雄安校区/1 号楼',
    code: 'FM-VALVE-1F-0043',
    value: '未反馈',
    contact: '周建军 13903331234',
    deviceStatus: '故障（阀门状态无反馈）',
    timeline: [
      { time: '2026-11-02 15:12:09', type: '故障' },
      { time: '2026-11-02 15:11:55', type: '故障' },
      { time: '2026-11-02 15:10:38', type: '故障' },
    ],
  }),
  w3: buildDetail('w3', {
    content: '预警',
    device: '消防水箱液位探测器',
    position: '消防水箱 液位探测器',
    unit: '林业大学雄安校区/消防水箱',
    code: 'XL-LEVEL-TK-0007',
    value: '1.85m',
    contact: '周建军 13903331234',
    deviceStatus: '预警（液位低于下限）',
    timeline: [
      { time: '2026-11-02 14:55:41', type: '预警' },
      { time: '2026-11-02 14:54:17', type: '预警' },
      { time: '2026-11-02 14:53:02', type: '预警' },
    ],
  }),
  w4: buildDetail('w4', {
    content: '故障',
    device: '消防主泵',
    position: '泵房 1# 消防主泵',
    unit: '林业大学雄安校区/泵房',
    code: 'BZ-PUMP-1-0002',
    value: '未运行',
    contact: '吴建民 13903334567',
    deviceStatus: '故障（主泵故障停机）',
    timeline: [
      { time: '2026-11-02 14:31:54', type: '故障' },
      { time: '2026-11-02 14:30:29', type: '故障' },
      { time: '2026-11-02 14:29:11', type: '故障' },
    ],
  }),
  w5: buildDetail('w5', {
    content: '预警',
    device: '末端试水装置',
    position: '2 号楼 末端试水装置',
    unit: '林业大学雄安校区/2 号楼',
    code: 'XL-TEST-2F-0018',
    value: '已启动',
    contact: '周建军 13903331234',
    deviceStatus: '预警（试水装置动作）',
    timeline: [
      { time: '2026-11-02 13:58:33', type: '预警' },
      { time: '2026-11-02 13:57:48', type: '预警' },
      { time: '2026-11-02 13:56:12', type: '预警' },
    ],
  }),
}

/**
 * 按警情 key 取详情
 *
 * 两张卡各自的警情表都从这里取；表里没有的警情退化成"按列表行生成"的详情，
 * 保证任何一条警情点得开弹窗，不会出现"点了没反应"。
 */
export function detailOf(row: {
  key: string
  badge: string
  title: string
  time: string
  location: string
}): AlarmDetail {
  const known = ALARM_DETAILS[row.key] ?? WATER_ALARM_DETAILS[row.key]
  if (known) return known
  const time = row.time.length > 16 ? row.time : `${row.time}:00`
  return buildDetail(row.key, {
    content: row.badge,
    device: row.title,
    position: row.location,
    unit: '林业大学雄安校区',
    code: '-',
    value: '-',
    contact: '暂无联系人',
    deviceStatus: `${row.badge}（${row.title}）`,
    timeline: [{ time, type: row.badge }],
  })
}

/** 核实结果选项（设计稿 #200:1219 的 radio-group，四选一） */
export const VERIFY_OPTIONS = ['火警', '故障', '误报', '测试'] as const

/** 处理结果选项（设计稿 #200:1260 的 radio-group，三选一） */
export const HANDLE_OPTIONS = ['火警排除', '转隐患处置', '生成真实警情'] as const

/**
 * 核实结果的默认选中项
 *
 * 取该警情自身的类型 —— 设计稿里「发生火警」对应选中「火警」，同理
 * 故障类警情默认选「故障」。「预警」不在四个选项里（预警 = 通讯中断类，
 * 见 fire-mock.ts 的状态分布口径），落到「故障」。
 */
export function defaultVerifyOf(content: string): string {
  if ((VERIFY_OPTIONS as readonly string[]).includes(content)) return content
  if (content === '预警') return '故障'
  return VERIFY_OPTIONS[0]
}
