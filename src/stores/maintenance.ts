import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { MaintenancePlan, PlanQuery } from '@/types/maintenance'
import { getPlanList, togglePlanStatus, deletePlan } from '@/api/maintenance'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const list = ref<MaintenancePlan[]>([])
  const loading = ref(false)
  const query = reactive<PlanQuery>({ page: 1, size: 20 })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const res = await getPlanList({ ...query })
      list.value = res.data
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function toggleStatus(plan: MaintenancePlan) {
    const newEnabled = !plan.enabled
    await togglePlanStatus(plan.id, newEnabled)
    plan.enabled = newEnabled
    ElMessage.success('修改状态成功')
  }

  async function removePlan(id: number) {
    await deletePlan(id)
    ElMessage.success('删除成功')
    fetchList()
  }

  return { list, loading, query, total, fetchList, toggleStatus, removePlan }
})
