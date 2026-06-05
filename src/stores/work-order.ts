import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { WorkOrderItem, WorkOrderQuery, WorkOrderDetail, WorkOrderStats, CreateOrderParams } from '@/types/work-order'
import type { TemplateDetail } from '@/types/workflow'
import { getWorkOrderList, getWorkOrderDetail, getWorkOrderStats, cancelWorkOrder, reassignWorkOrder, acceptWorkOrder, submitNodeForm, performNodeAction, createWorkOrder, submitDraft as submitDraftOrder } from '@/api/work-order'
import { getTemplateDetail } from '@/api/workflow'

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
  const templateDetail = ref<TemplateDetail | null>(null)  // 关联的模板详情（formSchema/flowDefinition）

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

  // 详情（含模板表单配置）
  async function openDetail(id: number) {
    detailVisible.value = true
    detailLoading.value = true
    try {
      const wo = await getWorkOrderDetail(id)
      detail.value = wo
      // 同步加载模板详情（确保表单数据在 loading 结束前就位）
      if (wo.templateId) {
        try {
          const td = await getTemplateDetail(wo.templateId)
          templateDetail.value = td || null
        } catch {
          templateDetail.value = null
        }
      }
    } finally {
      detailLoading.value = false
    }
  }

  function closeDetail() {
    detailVisible.value = false
    detail.value = null
    templateDetail.value = null
  }

  // 操作
  async function cancel(id: number, reason: string) {
    await cancelWorkOrder(id, reason)
    detail.value = null
    templateDetail.value = null
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

  async function createOrder(data: CreateOrderParams) {
    const res = await createWorkOrder(data)
    ElMessage.success(`工单 ${res.orderNo} 已创建`)
    return res
  }

  /** 发起草稿状态的工单 */
  async function submitDraft(id: number) {
    const res = await submitDraftOrder(id)
    detail.value = res
    ElMessage.success('工单已发起，进入流转')
    fetchList()
    return res
  }

  // ===== 详情交互操作 =====

  async function acceptOrder(id: number) {
    const res = await acceptWorkOrder(id)
    detail.value = res
    ElMessage.success('已接单')
  }

  async function submitForm(id: number, formData: Record<string, any>) {
    const res = await submitNodeForm(id, formData)
    detail.value = res
    ElMessage.success('处置结果已提交')
  }

  async function executeNodeAction(id: number, action: { name: string; targetNodeId: string; conditionExpression?: string }) {
    const res = await performNodeAction(id, action)
    detail.value = res
    // 刷新关联的模板详情（当前节点可能变了，需要新的表单 schema）
    try {
      const td = await getTemplateDetail(res.templateId)
      templateDetail.value = td || null
    } catch {
      templateDetail.value = null
    }
    ElMessage.success(`${action.name}操作成功`)
  }

  return {
    list, loading, query, total, stats,
    detailVisible, detailLoading, detail, templateDetail,
    fetchList, fetchStats, search, reset, toggleStatFilter,
    activeStatFilter,
    openDetail, closeDetail, cancel, reassign, createOrder, submitDraft,
    acceptOrder, submitForm, executeNodeAction,
  }
})
