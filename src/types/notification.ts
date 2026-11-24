/**
 * 消息通知 —— 类型定义
 *
 * 三个正文字段对应三种并列的展现形态（不是"先做 Markdown、以后再扩展"）：
 *   - markdown    富文本报告（标题 / 列表 / 加粗）
 *   - html        HTML 网页（内容型富文本，iframe 沙箱渲染）
 *   - table       结构化表格
 */

/** 已读 / 未读 */
export type NotificationReadStatus = 'read' | 'unread'

/**
 * 消息分类 —— 决定弹窗卡片与详情页头部的图标与文案
 *   system        系统通知（提醒图标）
 *   communication 系统消息（沟通图标）
 */
export type NotificationCategory = 'system' | 'communication'

/** 正文的展现形态 */
export type NotificationContentType = 'markdown' | 'html' | 'table'

export interface NotificationTableData {
  columns: string[]
  rows: (string | number)[][]
}

export interface NotificationItem {
  id: number
  title: string
  category: NotificationCategory
  contentType: NotificationContentType
  /** markdown / html 原文 */
  content: string
  /** contentType === 'table' 时使用 */
  tableData?: NotificationTableData
  /** 'YYYY-MM-DD HH:mm:ss'（定长字符串，字典序即时间序） */
  receivedAt: string
  read: boolean
}

export interface NotificationQuery {
  /** 按标题 / 正文模糊匹配 */
  keyword?: string
  /** 'all' 表示不限 */
  readStatus?: NotificationReadStatus | 'all'
  page: number
  size: number
  sortBy?: 'receivedAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分类的展示口径（图标名 + 文案），避免在多个组件里各写一份
 *
 * 图标统一用**线性（描边）**版本：系统通知 = 铃铛 notification，系统消息 = 对话气泡 chat-bubble-1；
 * 颜色由组件按设计稿给蓝色（#4A79EE），见 MessageNotificationDrawer 的 --nd-icon
 */
export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: string }
> = {
  system: { label: '系统通知', icon: 'notification' },
  communication: { label: '系统消息', icon: 'chat-bubble-1' },
}
