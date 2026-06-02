import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { WorkOrderItem, WorkOrderQuery, WorkOrderDetail, WorkOrderStats } from '@/types/work-order'
import { getWorkOrderList, getWorkOrderDetail, getWorkOrderStats, cancelWorkOrder, reassignWorkOrder } from '@/api/work-order'

export const useWorkOrderStore = defineStore('workOrder', () => {
  const list = ref<WorkOrderItem[]>([])
  const loading = ref(false)
  const query = reactive<WorkOrderQuery>({ page: 1, size: 20 })
  const total = ref(0)
  const stats = ref<WorkOrderStats>({
    all: 0, draft: 0, pendingAssign: 0, pendingAccept: 0,
    processing: 0, verifying: 0, closed: 0,
  })

  // 详情抽屉状态
  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<WorkOrderDetail | null>(null)

  async function fetchList() {
    loading.value = true
    try {
      const res = await getWorkOrderList({ ...query })
      list.value = res.list
      total.value = res.total
      if (res.stats) stats.value = res.stats
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      stats.value = await getWorkOrderStats()
    } catch { /* silent */ }
  }

  function search() {
    query.page = 1
    fetchList()
  }

  function reset() {
    query.keyword = ''
    query.status = ''
    query.templateId = ''
    query.priority = ''
    query.slaStatus = ''
    query.startDate = ''
    query.endDate = ''
    search()
  }

  // 统计卡片筛选（不与下拉重叠，仅通过卡片点击触发）
  const activeStatFilter = ref('')
  function toggleStatFilter(status: string) {
    if (activeStatFilter.value === status) {
      activeStatFilter.value = ''
      query.status = ''
    } else {
      activeStatFilter.value = status
      query.status = status
    }
    search()
  }

  function toggleStatFilter(status: string) {
    if (query.status === status) {
      query.status = ''
    } else {
      query.status = status
    }
    search()
  }

  // 详情
  async function openDetail(id: number) {
    detailVisible.value = true
    detailLoading.value = true
    try {
      detail.value = await getWorkOrderDetail(id)
    } finally {
      detailLoading.value = false
    }
  }

  function closeDetail() {
    detailVisible.value = false
    detail.value = null
  }

  // 操作
  async function cancel(id: number, reason: string) {
    await cancelWorkOrder(id, reason)
    closeDetail()
    fetchList()
  }

  async function reassign(id: number, targetAssigneeId: number, reason: string) {
    const res = await reassignWorkOrder(id, targetAssigneeId, reason)
    // 更新抽屉内当前处理人
    if (detail.value) {
      detail.value.currentAssigneeId = targetAssigneeId
      detail.value.currentAssigneeName = res.currentAssigneeName
    }
    return res
  }

  return {
    list, loading, query, total, stats,
    detailVisible, detailLoading, detail,
    fetchList, fetchStats, search, reset, toggleStatFilter,
    openDetail, closeDetail, cancel, reassign,
  }
})
