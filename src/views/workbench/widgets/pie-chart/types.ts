// PieChartWidget 类型定义
//
// 设计稿来源：Figma Frame "工单处置热力图" 环形图（6 扇形 + 中心数字 + 底部图例）
// 自包含 ECharts init/dispose/resize，浅色固定主题，不监听 dark mode
// 中心数字通过 DOM 绝对定位叠加在 canvas 上

/** 单个数据扇形 */
export interface PieSeriesItem {
  /** 扇形名称（同时作为图例标签），如「餐饮企业」 */
  name: string
  /** 该扇形数值 */
  value: number
  /** 覆盖色（可选；不传则按 palette 取） */
  color?: string
}

/** 饼图 widget 配置 */
export interface PieChartConfig {
  /** 中心数字（接入企业总数），DOM 叠加显示 */
  centerValue: number
  /** 中心副标题，如「接入企业」 */
  centerLabel?: string
  /** 扇形数据 */
  series: PieSeriesItem[]
}

/** 饼图 widget Props */
export interface PieChartWidgetProps {
  widgetId: string
  config?: PieChartConfig
  /** 外部 loading 态（不传则默认 false） */
  loading?: boolean
  /** 外部错误（不传则默认 null） */
  error?: Error | string | null
  /** 图表高度（px），默认 240 */
  height?: number
}