// RadarChartWidget 类型定义
//
// 设计稿来源：Figma Frame "工单处置热力图" 雷达图（5 轴 + 2 系列 + 图例）
// 自包含 ECharts init/dispose/resize，浅色固定主题，不监听 dark mode

/** 单个维度（雷达图一条轴） */
export interface RadarIndicator {
  /** 维度名称，如「消防安全」 */
  name: string
  /** 该轴上限 */
  max: number
}

/** 单条数据系列 */
export interface RadarSeriesItem {
  /** 系列名称，如「当前」「上月」 */
  name: string
  /** 各维度数值，长度应与 indicators 等长 */
  value: number[]
  /** 覆盖色（可选；不传则使用 palette 默认色） */
  color?: string
}

export interface RadarChartConfig {
  /** 卡片标题（可选，仅作语义标识，渲染层不展示） */
  title?: string
  /** 维度列表（5 个） */
  indicators: RadarIndicator[]
  /** 数据系列，至少 1 条 */
  series: RadarSeriesItem[]
}

export interface RadarChartWidgetProps {
  widgetId: string
  config?: RadarChartConfig
  /** 外部 loading 态（不传则默认 false） */
  loading?: boolean
  /** 外部错误（不传则默认 null） */
  error?: Error | string | null
  /** 图表高度（px），默认 280 */
  height?: number
}