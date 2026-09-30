// RealtimeAlertsWidget 类型定义
//
// 设计稿来源：Figma Frame 667 · "实时警情" 列表（3-5 条）
// 每条：告警级别 icon + 告警内容 + 告警位置 + 时间戳

export type AlertLevel = 'critical' | 'warning' | 'info'

export interface AlertItem {
  id: string
  level: AlertLevel
  /** 主标题（告警内容） */
  title: string
  /** 副标题（告警位置） */
  location?: string
  /** 时间戳（ISO 或相对时间字符串） */
  timestamp: string
  /** 点击跳转路由（可选） */
  link?: string
  /**
   * 级别图标 SVG 文件名（不含扩展名，指向 public/icons/）。
   * 不传则按 level 自动推断：critical/warning→'widget-alert-caution'，info→'widget-alert-info'。
   * 设计稿 3 级共用 Caution（红色三角），可由业务按需覆盖。
   */
  icon?: string
}

export interface RealtimeAlertsConfig {
  /** 显示条数上限（默认 5） */
  limit?: number
  alerts: AlertItem[]
}

export interface RealtimeAlertsWidgetProps {
  widgetId: string
  config?: RealtimeAlertsConfig
}