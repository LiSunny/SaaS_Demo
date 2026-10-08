// BarChartWidget 类型定义
//
// 设计稿：工单完成率柱状图（7 区域 × 完成率 %）
// 自包含 ECharts init/dispose/resize，浅色固定主题

/** 单个柱子数据（区域 + 完成率 %） */
export interface BarSeriesItem {
  /** X 轴分类标签（如区域名称） */
  name: string
  /** 完成率（0-100） */
  value: number
  /** 覆盖色（可选） */
  color?: string
}

/** 柱状图 widget 配置 */
export interface BarChartConfig {
  /** 柱状图标题（可选，DOM 头部显示） */
  title?: string
  /** 副标题/单位（如「完成率 %」） */
  unit?: string
  /** 柱子数据 */
  series: BarSeriesItem[]
  /** Y 轴最大值（默认 100） */
  max?: number
}

/** 柱状图 widget Props */
export interface BarChartWidgetProps {
  widgetId: string
  config?: BarChartConfig
  /** 外部 loading 态 */
  loading?: boolean
  /** 外部错误 */
  error?: Error | string | null
  /** 图表高度（px），默认 240 */
  height?: number
}