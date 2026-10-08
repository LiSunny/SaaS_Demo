// TrendLineWidget 类型定义
//
// 设计稿来源：Figma Frame 667 · "工单处置热力图" 行 折线图（2 系列 + tooltip）
// 自包含 ECharts init/dispose/resize/主题切换，禁止共享 composables

export interface LineSeries {
  name: string
  /** Y 轴数据点数组，与 xAxis 等长 */
  data: number[]
  /** 是否显示面积渐变（默认 false） */
  area?: boolean
}

export interface TrendLineConfig {
  /** X 轴分类标签（如日期） */
  xAxis: string[]
  /** 数据系列，至少 1 条 */
  series: LineSeries[]
}

export interface TrendLineWidgetProps {
  widgetId: string
  config?: TrendLineConfig
  /** 外部 loading 态（通常由调用方控制；不传则默认 false） */
  loading?: boolean
  /** 外部错误（不传则默认 null） */
  error?: Error | string | null
  /** 图表高度（px），默认 240 */
  height?: number
}