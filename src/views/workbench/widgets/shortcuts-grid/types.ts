// ShortcutsGridWidget 类型定义
//
// 设计稿来源：Figma Frame 661 · "常用功能" 4 行 × 2 列 = 8 个入口
// 外层卡片和标题由 WidgetCard 提供，本 widget 只渲染菜单行内容。
// 与 AppShortcutsWidget（紧凑 3 列入口）并存，可配 columns/rows。

export interface Shortcut {
  key: string
  label: string
  /**
   * 入口图标（null 时 widget 渲染 CSS 色块占位）。
   * 业务接入时请将已存在的 SVG 上传到 public/icons/ 后，传入文件名如 'MenuIcon-管理单元-白色'。
   */
  icon: string | null
  /** 跳转路由 */
  route?: string
  /** 是否可用（false 时按钮置灰，不可点击） */
  ready?: boolean
}

export interface ShortcutsGridConfig {
  /** 列数，默认 2（设计稿 4×2）；可自定义 */
  columns?: number
  /** 行数限制（默认按 items.length 推断） */
  rows?: number
  items: Shortcut[]
}

export interface ShortcutsGridWidgetProps {
  widgetId: string
  config?: ShortcutsGridConfig
}