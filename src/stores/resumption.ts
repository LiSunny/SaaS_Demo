import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { ResumptionPlanItem, ResumptionQuery } from '@/types/resumption'
import { getResumptionPlanList, getResumptionPlanDetail } from '@/api/adapters/resumption-dao'
import type { ResumptionPlan } from '@/types/resumption'

export const useResumptionStore = defineStore('resumption', () => {
  // ===== 列表 =====
  const list = ref<ResumptionPlanItem[]>([])
  const loading = ref(false)
  const query = reactive<ResumptionQuery>({ page: 1, size: 20 })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const r = await getResumptionPlanList({ ...query })
      list.value = r.data
      total.value = r.total
    } finally {
      loading.value = false
    }
  }

  function search() { query.page = 1; fetchList() }

  // ===== 详情 =====
  const detail = ref<ResumptionPlan | null>(null)
  const detailLoading = ref(false)

  async function fetchDetail(id: number) {
    detailLoading.value = true
    try {
      detail.value = await getResumptionPlanDetail(id)
    } finally {
      detailLoading.value = false
    }
  }

  return { list, loading, query, total, fetchList, search, detail, detailLoading, fetchDetail }
})
