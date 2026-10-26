/**
 * 子系统实时监测 · 通用类型定义
 *
 * 设计目标（复用内核）：
 * 本文件不含任何消防专有语义，只描述"一个设备监测子系统需要什么"。
 * 消防管网 / 气体灭火 / 防排烟 三个系统通过各自的 SubsystemProfile 配置接入，
 * 页面与组件 100% 复用。接入新子系统只需新增一份 profile 配置，无需改页面代码。
 */

/** 点位状态机取值 */
export type PointStatus =
  | 'normal'      // 正常
  | 'alarm'       // 报警（火警/超限）
  | 'fault'       // 故障
  | 'offline'     // 离线/失联
  | 'shielded'    // 已屏蔽/停用
  | 'unknown'     // 未知（数据异常）

/** 数据类型 —— 决定页面渲染哪种测点控件 */
export type MetricKind =
  | 'analog'      // 模拟量（压力/水位/流量/温度/湿度/电压电流）
  | 'switch'      // 开关量（阀门开/关、试水装置启停、水浸干湿）
  | 'status'      // 设备状态机（主机在线/故障/备用电源）

/**
 * 测点指标定义（声明式）
 * 页面根据 kind + unit + range 自动决定用什么控件展示。
 */
export interface MetricDef {
  key: string
  label: string
  kind: MetricKind
  unit?: string
  /** 正常量程 [min, max]，模拟量必填 */
  range?: [number, number]
  /**
   * 正常工作区间 [min, max] —— 真实报警判定以此为准。
   * 演示数据应落在此区间内，避免"全部常态即报警"的失真。
   * 缺省时回退到 range 的中段。
   */
  normalRange?: [number, number]
  /** 小数位，模拟量默认 2 */
  precision?: number
  /** 报警阈值（高限 / 低限），页面画阈值线 */
  highLimit?: number
  lowLimit?: number
  /** 开关量枚举 */
  states?: Array<{ value: string; label: string; tone: PointStatus }>
  /** 图标（AppIcon 名称） */
  icon?: string
}

/** 点位定义（最小观测单位） */
export interface PointDef {
  id: string
  /** 所属设备档案类型 key */
  typeKey: string
  /** 编号（现场铭牌号） */
  code: string
  /** 位置描述 */
  location: string
  /** 所属主机/分机标识 */
  hostId?: string
  /** 该点位的测点定义 */
  metrics: MetricDef[]
  /** 是否支持远程控制 */
  controllable?: boolean
  /** 绑定摄像头通道号（RTSP），支持视频联动 */
  videoChannel?: number
}

/** 设备档案模板 —— 换项目只改这里 */
export interface DeviceProfile {
  typeKey: string
  name: string
  category: 'sensor' | 'switch' | 'controller' | 'gateway' | 'video'
  /** 图标 */
  icon: string
  /** 该档案的默认测点（实例可覆盖/扩展） */
  metrics: MetricDef[]
  controllable?: boolean
}

/** 子系统档案 —— 一个子系统 = 一套页面配置 */
export interface SubsystemProfile {
  key: string
  name: string
  shortName: string
  icon: string
  /** 主题色，用于页面强调 */
  accent: string
  description: string
  /** 主机档案 */
  hostProfiles: DeviceProfile[]
  /** 该子系统包含的设备档案 */
  deviceProfiles: DeviceProfile[]
  /** 演示数据规模（真实项目由接口返回） */
  scale: {
    host: number
    slave: number
    devices: Array<{ typeKey: string; count: number; codePrefix: string; nameHint: string }>
  }
  /** 汇总卡片定义（页面顶部 KPI 条） */
  summaryCards: SummaryCardDef[]
  /** 页面分区标题 */
  sections: SubsystemSection[]
}

/** 汇总卡片定义 */
export interface SummaryCardDef {
  key: string
  label: string
  icon?: string
  /** 取值模式 */
  source: 'total' | 'statusCount' | 'metricAggregate' | 'custom'
  /** source=metricAggregate 时指定 metricKey */
  metricKey?: string
  /** 聚合方式 */
  agg?: 'min' | 'max' | 'avg'
  unit?: string
  hint?: string
}

/** 页面分区（左右栏或独立区块） */
export interface SubsystemSection {
  key: string
  title: string
  /** 分区内展示的设备档案 key */
  showTypes: string[]
  /** 展示形态 */
  layout: 'table' | 'cards' | 'grid'
  /** 卡片形态下的每行数量 */
  span?: number
  hint?: string
}

/** 实时点位数据（运行时值，模拟/接口返回） */
export interface PointRuntime {
  pointId: string
  status: PointStatus
  /** 指标键值对 */
  values: Record<string, number | string>
  /** 最近更新时间戳 */
  updatedAt: number
  /** 24 小时趋势序列（可选） */
  trend?: Record<string, number[]>
}