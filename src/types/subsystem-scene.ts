/**
 * 子系统监测页 · 公共类型
 *
 * 消防水系统监测、气体灭火系统监测、防排烟系统监测三页版式一致，
 * 差异只在「设备档案 + 组态画面 + 取值口径」，这些差异全部收敛在
 * 各系统的场景适配器（SubsystemSceneAdapter）里。
 *
 * 本文件只放三页共用的一层：报警记录、图元绑定、统计卡、视图切换。
 */
import type { PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type { SceneEdge, SceneNode } from '@/types/scene-config'

/** 报警等级：三档，与后端 `model Alarm.level`（紧急 / 重要 / 一般）一致 */
export type SubsystemAlarmLevel = 'critical' | 'important' | 'general'

/** 报警处置状态 */
export type SubsystemAlarmStatus = 'unhandled' | 'handled'

/** 一条报警记录 */
export interface SubsystemAlarmRecord {
  id: string
  /** 点位 id */
  pointId: string
  /** 点位编号（现场铭牌号） */
  code: string
  /** 点位位置 */
  location: string
  /** 等级 */
  level: SubsystemAlarmLevel
  /** 报警内容 */
  reason: string
  /** 处置状态 */
  status: SubsystemAlarmStatus
  /** 发生时间戳 */
  occurredAt: number
  /** 触发时的点位状态（alarm=超限 / fault=故障 / offline=离线） */
  pointStatus: PointStatus
  /** 设备档案类型 key */
  typeKey: string
  /** 所属主机/分机（管理单元）id */
  hostId?: string
}

/**
 * 组态图元的取值口径
 *
 * 各系统只实现自己用得上的几种，其余口径不出现在该系统的绑定表里。
 */
export type SubsystemValueKind =
  | 'levelPercent'     // 最低水位：主值 %，副值 m
  | 'pressureMin'      // 最小压力（最不利点）
  | 'cylinderPressure' // 钢瓶压力：最低压力 + 压力正常台数
  | 'fanPressure'      // 风机压差：最低压差 + 压差正常台数
  | 'flowSum'          // 瞬时流量合计
  | 'runningCount'     // 运行数 / 总数
  | 'openCount'        // 开阀数 / 总数
  | 'startedCount'     // 启动装置数 / 总数
  | 'deviceState'      // 设备状态文本

/**
 * 组态图元 → 点位分组 的绑定规则
 *
 * 按图元符号（symbol）匹配，不按场景节点 id：
 * 画面由用户在组态配置里编辑，节点 id 是编辑器生成的随机串，删一个节点就换一个，
 * 按 id 绑定会让规则随编辑失效；图元符号才是稳定契约 ——
 * 画面里放进 VLV-BUTT-01，阀门绑定即刻生效，不用改代码。
 */
export interface SubsystemNodeBinding {
  /** 图元符号（画面节点的 symbol 字段） */
  symbol: string
  /** 同一符号出现多次时取第几个（从 1 起）；缺省取第 1 个 */
  nth?: number
  /** 点位匹配 */
  match: {
    /** 设备档案类型 key */
    typeKeys: string[]
    /** 编号前缀（FM 消火栓环网阀门 / GT 钢瓶压力探测器 …） */
    codePrefix?: string
    /** 在匹配结果中的索引切片 [start, end) */
    slice?: [number, number]
  }
  /** 取值口径 */
  value: SubsystemValueKind
  /** 参与取值的指标 key */
  metricKey: string
  /** 开关量口径下代表「开 / 运行 / 启动」的状态值 */
  onValue?: string
  /** 示意节点：设备档案中无对应类型，不绑定点位 */
  schematic?: boolean
}

/** 组态节点聚合结果 */
export interface SubsystemNodeAggregate {
  /** 该节点所辖点位 */
  points: PointDef[]
  /** 异常点位数 */
  abnormal: number
  /** 图元上显示的主值文本 */
  value: string
  /** 图元上显示的副值文本 */
  subValue: string
  /** 图元状态标志（对应图元库 is-* 类） */
  state: Record<string, boolean>
}

/** 一个可下钻的点位组（组态图元所辖点位 / 核心数据卡所辖点位） */
export interface SubsystemPointGroup {
  /** 组标识 */
  key: string
  /** 组标题 */
  title: string
  /** 组说明 */
  desc: string
  /** 组内点位 */
  points: PointDef[]
}

/** 顶部统计卡口径（按设计稿：设备维度） */
export type SubsystemCardKind = 'deviceTotal' | 'deviceOnline' | 'deviceFault' | 'deviceWarning'

/** 视图切换键 */
export type SubsystemTabKey = 'overview' | 'alarm' | 'ledger'

/** 统计卡图例分项（环形图分段 + 底部图例行共用同一份数据） */
export interface SubsystemCardLegendItem {
  /** 分项名 */
  label: string
  /** 分项计数 */
  value: number
  /** 分项色 */
  color: string
}

/** 一张统计卡的最终呈现 */
export interface SubsystemCardValue {
  key: SubsystemCardKind
  /** 卡标题 */
  label: string
  /** 统计卡图标（设计稿导出的 SVG 路径，SVG 自带底色与配色） */
  icon: string
  /** 主值文本 */
  value: string
  /** 单位（台 / %） */
  unit: string
  /** 口径说明（title 提示，必须能自证） */
  hint: string
  /** 环形图与底部图例共用的分项 */
  legend: SubsystemCardLegendItem[]
  /** 参与计数的设备总数（环形图分母） */
  total: number
  /** 该卡下钻所辖点位 */
  points: PointDef[]
}

/**
 * 组态场景适配器
 *
 * 公共场景渲染组件只认这个接口，不认具体系统：
 * 消防水（11 图元 / 10 连线）与气体灭火（2 图元 / 1 连线）走同一套渲染链路。
 */
export interface SubsystemSceneAdapter {
  /** 画面名称 */
  name: string
  /** 画布尺寸 */
  viewbox: { w: number; h: number }
  /** 场景节点 */
  nodes: SceneNode[]
  /** 场景连线 */
  edges: SceneEdge[]
  /** 画面内联的自定义图元定义（服务端未收录时按此兜底注册） */
  symbols: Array<{
    id: string
    name: string
    category: string
    system: string
    image?: string
    ports: Array<{ x: number; y: number; dir: string }>
    bindings: Array<Record<string, unknown>>
  }>
  /** 取某节点的绑定规则（symbol + 第几个实例） */
  bindingOf: (symbol: string, nth: number) => SubsystemNodeBinding | undefined
  /** 聚合节点的实时值与状态 */
  aggregate: (
    binding: SubsystemNodeBinding,
    points: PointDef[],
    getRuntime: (id: string) => PointRuntime | undefined,
  ) => SubsystemNodeAggregate
  /** 反查点位落在哪个图元下（设备台帐「所属图元」） */
  findOwnerNode: (
    pointId: string,
    points: PointDef[],
  ) => { node: SceneNode; points: PointDef[] } | undefined
}
