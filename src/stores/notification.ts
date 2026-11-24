/**
 * notification.ts — 消息通知 Store
 *
 * 单一事实源：未读状态只存在于 `NotificationItem.read`。
 * `unreadCount` 是基于 `allItems` 的 computed，不单独存数字，
 * 因此顶栏角标、弹窗红点、列表状态列永远一致。
 *
 * `allItems` 常驻全量（演示数据量级），弹窗与详情页的「上一条/下一条」
 * 都以它按接收时间倒序后的顺序为基准，不受列表页筛选/分页影响。
 */

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import type { NotificationItem, NotificationQuery } from '@/types/notification'
import {
  getAllNotifications,
  getNotificationDetail,
  getNotificationList,
  getRecentNotifications,
  markAllAsRead,
  markAsRead,
} from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  /** 全量消息（按接收时间倒序） */
  const allItems = ref<NotificationItem[]>([])
  /** 当前页数据 */
  const list = ref<NotificationItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  /** 弹窗用：最近 N 条 */
  const recent = ref<NotificationItem[]>([])
  const recentLoading = ref(false)

  const query = reactive<NotificationQuery>({
    keyword: '',
    readStatus: 'all',
    page: 1,
    size: 10,
    sortBy: 'receivedAt',
    sortOrder: 'desc',
  })

  /** 未读数（派生，不单独存储） */
  const unreadCount = computed(() => allItems.value.filter((n) => !n.read).length)

  /** 顶栏角标文案：>99 显示 99+，0 时外层不渲染角标 */
  const badgeText = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

  /** 拉全量并同步到 allItems —— 角标与「上一条/下一条」的基准 */
  async function syncAll() {
    allItems.value = await getAllNotifications()
  }

  /** 拉当前页列表 */
  async function fetchList() {
    loading.value = true
    try {
      const result = await getNotificationList({ ...query })
      list.value = result.data
      total.value = result.total
      await syncAll()
    } finally {
      loading.value = false
    }
  }

  /** 重置到第一页再查 */
  function search() {
    query.page = 1
    fetchList()
  }

  /** 拉弹窗数据 */
  async function fetchRecent(limit = 3) {
    recentLoading.value = true
    try {
      recent.value = await getRecentNotifications(limit)
      await syncAll()
    } finally {
      recentLoading.value = false
    }
  }

  /** 按 id 取详情 */
  async function fetchDetail(id: number): Promise<NotificationItem | undefined> {
    await syncAll()
    return getNotificationDetail(id)
  }

  /** 标记已读（幂等），并同步本地 allItems / list */
  async function markRead(id: number) {
    await markAsRead(id)
    await syncAll()
    list.value = list.value.map((n) => (n.id === id ? { ...n, read: true } : n))
    recent.value = recent.value.map((n) => (n.id === id ? { ...n, read: true } : n))
  }

  /** 全部标记已读（幂等） */
  async function markAllRead() {
    await markAllAsRead()
    await syncAll()
    list.value = list.value.map((n) => ({ ...n, read: true }))
    recent.value = recent.value.map((n) => ({ ...n, read: true }))
  }

  /**
   * 「上一条 / 下一条」定位
   *
   * 基准是 allItems，但按**时间正序**（旧 → 新）取邻位，与设计稿的图标方向一致：
   *   上一条 = 更旧的一条（图标向上）
   *   下一条 = 更新的一条（图标向下）
   *
   * @param id 当前消息 id
   * @returns 上一条 / 下一条，到边界时为 undefined
   */
  function getNeighbors(id: number): { prev?: NotificationItem; next?: NotificationItem } {
    const ordered = [...allItems.value].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
    const index = ordered.findIndex((n) => n.id === id)
    if (index === -1) return {}
    return {
      prev: index > 0 ? ordered[index - 1] : undefined,
      next: index < ordered.length - 1 ? ordered[index + 1] : undefined,
    }
  }

  return {
    allItems,
    list,
    total,
    loading,
    recent,
    recentLoading,
    query,
    unreadCount,
    badgeText,
    syncAll,
    fetchList,
    search,
    fetchRecent,
    fetchDetail,
    markRead,
    markAllRead,
    getNeighbors,
  }
})
