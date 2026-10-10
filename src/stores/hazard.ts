import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { HazardItem, HazardQuery } from '@/types/hazard'
import {
  getHazardList,
  getHazardStats,
  batchFlag,
} from '@/api/adapters/hazard-dao'

export const useHazardStore = defineStore('hazard', () => {
  // ===== 列表 =====
  const list = ref<HazardItem[]>([])
  const loading = ref(false)
  const total = ref(0)
  const query = reactive<HazardQuery>({
    page: 1,
    size: 20,
    level: 'all',
    status: 'all',
    due: 'all',
    template: 'all',
    onlyMine: false,
    onlyFlagged: false,
    sortBy: 'foundAt',
    sortDir: 'desc',
  })

  // ===== 统计 =====
  const stats = ref({
    total: 0,
    pending: 0,
    processing: 0,
    overdue: 0,
    major: 0,
    thisMonth: 0,
  })
  const statsLoading = ref(false)

  async function fetchList(currentUserId?: string, currentEnterpriseId?: number) {
    loading.value = true
    try {
      const r = await getHazardList({ ...query }, currentUserId, currentEnterpriseId)
      list.value = r.data
      total.value = r.total
    } finally {
      loading.value = false
    }
  }

  async function fetchStats(currentUserId?: string, currentEnterpriseId?: number) {
    statsLoading.value = true
    try {
      const s = await getHazardStats(currentEnterpriseId, currentUserId)
      stats.value = s
    } finally {
      statsLoading.value = false
    }
  }

  /** 查询（重置页码到 1） */
  function search(currentUserId?: string, currentEnterpriseId?: number) {
    query.page = 1
    return fetchList(currentUserId, currentEnterpriseId)
  }

  /** 重置筛选 */
  function resetFilter() {
    query.keyword = ''
    query.level = 'all'
    query.status = 'all'
    query.due = 'all'
    query.startDate = undefined
    query.endDate = undefined
    query.template = 'all'
    query.onlyMine = false
    query.onlyFlagged = false
    query.page = 1
  }

  // ===== 选中 =====
  const selectedIds = ref<number[]>([])
  const hasSelection = computed(() => selectedIds.value.length > 0)

  function toggleSelect(id: number) {
    const i = selectedIds.value.indexOf(id)
    if (i >= 0) selectedIds.value.splice(i, 1)
    else selectedIds.value.push(id)
  }
  function toggleSelectAll(checked: boolean, rows: HazardItem[]) {
    if (checked) selectedIds.value = rows.map(r => r.id)
    else selectedIds.value = []
  }
  function clearSelection() { selectedIds.value = [] }

  // ===== 批量挂牌 =====
  async function batchSetFlag(flag: boolean) {
    if (selectedIds.value.length === 0) return
    await batchFlag(selectedIds.value, flag)
    await fetchList()
    await fetchStats()
    clearSelection()
  }

  return {
    list, loading, total, query,
    stats, statsLoading,
    fetchList, fetchStats, search, resetFilter,
    selectedIds, hasSelection,
    toggleSelect, toggleSelectAll, clearSelection,
    batchSetFlag,
  }
})