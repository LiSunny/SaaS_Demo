// RankingWidget 类型定义
//
// 设计稿来源：Figma Frame 667 · 排行榜卡（5 行）
// 每行：序号徽章 + 名称 + 进度条 + 百分比

export type RankAccent = 'danger' | 'warning' | 'success' | 'placeholder'

export interface RankItem {
  id: string
  /** 显示名称，如"沙县小吃"、"李明辉" */
  name: string
  /** 原始数值（可选展示，不影响进度条） */
  value?: number
  /** 进度条百分比 0-100 */
  percent: number
  /** 排名 1-N，决定徽章颜色 */
  rank: number
  /** 可选自定义徽章颜色（覆盖默认 TOP3 配色） */
  accent?: RankAccent
}

export interface RankingConfig {
  /** 顶部度量说明，如"完成率"、"工单数" */
  metric?: string
  items: RankItem[]
}

export interface RankingWidgetProps {
  widgetId: string
  config?: RankingConfig
}