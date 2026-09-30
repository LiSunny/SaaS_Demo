// StatCardsWidget 类型定义
//
// 设计稿来源：Figma Frame 667 · "工单处置热力图" 行 4 张并排统计卡
// 布局：4 张卡 size:3 占整行；1024-1440 自适应栅格 2x2；<1024 单列

export type StatTrend = 'up' | 'down' | 'flat'
export type StatAccent = 'primary' | 'success' | 'warning' | 'danger'

export interface StatIndicator {
  /** 指标标签，如 "较昨日"、"占比" */
  label: string
  /** 百分比数值，正数带 +，负数自动带 - */
  delta: number
  /** 走向（决定箭头方向与颜色） */
  trend: StatTrend
}

export interface StatCard {
  id: string
  /** 顶部图标占位（null 时 widget 渲染 CSS 色块；业务接入时换为项目 public/icons/ 下 SVG） */
  icon: string | null
  /** 卡标题，如 "工单总数" */
  title: string
  /** 主数值（数字类型，便于格式化） */
  value: number
  /** 单位，如 "单"、"%"、"台" */
  unit?: string
  /** 主指标（必填），如 "较昨日" */
  primary: StatIndicator
  /** 副指标（可选），如 "占比"；不传则不渲染 */
  secondary?: StatIndicator
  /** 主题强调色（影响 icon 背景与 title 颜色） */
  accent: StatAccent
}

/** widget config 形态：业务数据全部在 cards 数组里 */
export interface StatCardsConfig {
  cards: StatCard[]
}

/** widget 统一 props 形态，与现有 widget 对齐 */
export interface StatCardsWidgetProps {
  widgetId: string
  config?: StatCardsConfig
}