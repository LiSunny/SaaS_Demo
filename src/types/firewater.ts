/**
 * 消防水系统监控 · 类型定义
 *
 * 与 `src/types/subsystem.ts` 的分工：
 *   subsystem.ts  描述「一个设备监测子系统需要什么」（通用，不含消防语义）
 *   firewater.ts  描述「消防水系统监控页特有什么」（报警记录、组态点位绑定）
 */
import type { PointDef } from '@/types/subsystem'

/** 报警等级：三档，与后端 `model Alarm.level`（紧急 / 重要 / 一般）一致 */
export type FireAlarmLevel = 'critical' | 'important' | 'general'

/** 报警处置状态 */
export type FireAlarmStatus = 'unhandled' | 'handled'

/** 一条报警记录 */
export interface FireAlarmRecord {
  id: string
  /** 点位 id */
  pointId: string
  /** 点位编号（现场铭牌号） */
  code: string
  /** 点位位置 */
  location: string
  /** 等级 */
  level: FireAlarmLevel
  /** 报警内容 */
  reason: string
  /** 处置状态 */
  status: FireAlarmStatus
  /** 发生时间戳 */
  occurredAt: number
}

/** 组态图元的取值口径 */
export type FireWaterValueKind =
  | 'levelPercent'   // 最低水位：主值 %，副值 m
  | 'pressureMin'    // 最小压力
  | 'runningCount'   // 运行数 / 总数
  | 'openCount'      // 开阀数 / 总数
  | 'startedCount'   // 启动装置数 / 总数
  | 'deviceState'    // 设备状态文本

/** 组态图元 → 点位分组 的绑定规则 */
export interface FireWaterNodeBinding {
  /** 场景节点 id */
  nodeId: string
  /** 点位匹配 */
  match: {
    /** 设备档案类型 key */
    typeKeys: string[]
    /** 编号前缀（FM 消火栓环网阀门 / BZ 报警阀间阀门 …） */
    codePrefix?: string
    /** 在匹配结果中的索引切片 [start, end) */
    slice?: [number, number]
  }
  /** 取值口径 */
  value: FireWaterValueKind
  /** 参与取值的指标 key */
  metricKey: string
  /** 开关量口径下代表「开 / 运行 / 启动」的状态值 */
  onValue?: string
  /** 示意节点：设备档案中无对应类型，不绑定点位 */
  schematic?: boolean
}

/** 组态节点聚合结果 */
export interface FireWaterNodeAggregate {
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
export interface FireWaterPointGroup {
  /** 组标识 */
  key: string
  /** 组标题 */
  title: string
  /** 组说明 */
  desc: string
  /** 组内点位 */
  points: PointDef[]
}

/** 核心数据卡的取值口径 */
export type FireWaterCardKind = 'pressure' | 'flow' | 'level' | 'system'

/** 核心数据卡定义 */
export interface FireWaterCardDef {
  key: FireWaterCardKind
  label: string
  /** 图标名（AppIcon → TDesign 图标） */
  icon: string
  /** 取值口径：min 最不利点 / avg 平均值；system 卡不取值 */
  agg?: 'min' | 'avg'
  /** 设备档案类型 key */
  typeKey?: string
  /** 指标 key */
  metricKey?: string
  /** 主值按量程上限折算成百分比 */
  asPercent?: boolean
}
