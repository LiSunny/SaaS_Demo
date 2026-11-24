/**
 * notification.ts — 消息通知 API 门面
 *
 * 对外只暴露这一层，组件与 store 不直接 import DAO。
 *
 * 后端就绪后的切换方式（本次不实现，仅留说明）：
 *   1. 新建 `src/api/adapters/notification-http.ts`，导出与本文件**同名同签名**的函数，
 *      内部走 `@/utils/request`（axios → /api/notification/...）；
 *   2. 在本文件按环境变量切换实现，例如
 *      `const api = import.meta.env.VITE_API_MODE === 'real' ? http : dao`；
 *   3. 组件层无需改动。
 *
 * 当前后端（server/）尚无通知相关模型，固定走 DAO（localStorage 持久化）。
 */

import * as dao from './adapters/notification-dao'
import type { NotificationItem, NotificationQuery } from '@/types/notification'
import type { PaginatedData } from '@/types/device'

/** 分页查询消息列表 */
export async function getNotificationList(
  query: NotificationQuery,
): Promise<PaginatedData<NotificationItem>> {
  return dao.getNotificationList(query)
}

/** 按 id 取消息详情（不存在返回 undefined） */
export async function getNotificationDetail(
  id: number,
): Promise<NotificationItem | undefined> {
  return dao.getNotificationDetail(id)
}

/** 全量消息（按接收时间倒序）—— 角标与「上一条/下一条」用它做基准 */
export async function getAllNotifications(): Promise<NotificationItem[]> {
  return dao.getAllNotifications()
}

/** 最近 N 条（弹窗用） */
export async function getRecentNotifications(limit = 3): Promise<NotificationItem[]> {
  return dao.getRecentNotifications(limit)
}

/** 未读数量 */
export async function getUnreadCount(): Promise<number> {
  return dao.getUnreadCount()
}

/** 标记已读（幂等） */
export async function markAsRead(id: number): Promise<void> {
  dao.markAsRead(id)
}

/** 全部标记已读（幂等） */
export async function markAllAsRead(): Promise<void> {
  dao.markAllAsRead()
}
