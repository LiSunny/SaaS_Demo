// HeatmapWidget 类型定义
//
// 设计稿来源：Figma Frame 660 · "工单处置热力图"（7 行 × 8 列蓝渐变热力图 + 少→多图例 + 自定义 tooltip）
// 自包含 ECharts init/dispose/resize，浅色固定主题

/**
 * 热力图单个单元格
 * ECharts heatmap series 要求格式: [xIndex, yIndex, value]
 */
export type HeatmapCell = [number, number, number]

/** 关闭率查询函数（xIdx, yIdx）→ 0-100 关闭率百分比 */
export type CloseRateResolver = (xIdx: number, yIdx: number) => number

/** 热力图 widget 配置 */
export interface HeatmapConfig {
  /** X 轴分类标签（如月份），长度 = 列数 */
  xAxis: string[]
  /** Y 轴分类标签（如星期），长度 = 行数 */
  yAxis: string[]
  /**
   * 单元格数据 [xIndex, yIndex, value]
   * - xIndex: xAxis 索引
   * - yIndex: yAxis 索引
   * - value: 工单数（决定颜色深度）
   */
  data: HeatmapCell[]
  /** 当前 X 轴日期标题（如 "5月23"），用于 tooltip header */
  currentDateLabel?: string
  /**
   * 关闭率（可选）
   * - 提供函数：tooltip 多一行「关闭率：xx%」
   * - 不提供：tooltip 只有日期 + 发起数
   */
  closeRate?: CloseRateResolver
  /** 颜色梯度最大值（默认取 data 最大值） */
  max?: number
}

/** 热力图 widget Props */
export interface HeatmapWidgetProps {
  widgetId: string
  config?: HeatmapConfig
  /** 外部 loading 态（不传则默认 false） */
  loading?: boolean
  /** 外部错误（不传则默认 null） */
  error?: Error | string | null
  /** 图表高度（px），默认 240 */
  height?: number
}