import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { TemplateItem, TemplateQuery } from '@/types/workflow'
import { getTemplateList, deleteTemplate, batchDeleteTemplates, updateTemplateStatus } from '@/api/workflow'

export const useWorkflowStore = defineStore('workflow', () => {
  const list = ref<TemplateItem[]>([])
  const loading = ref(false)
  const selected = ref<TemplateItem[]>([])
  const query = reactive<TemplateQuery>({ page: 1, size: 20, status: '' })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const res = await getTemplateList({ ...query })
      list.value = res.data
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  function onSelect(rows: TemplateItem[]) { selected.value = rows }

  async function remove(id: number) {
    await deleteTemplate(id)
    ElMessage.success('删除成功')
    fetchList()
  }

  async function batchRemove() {
    const ids = selected.value.map(r => r.id)
    await batchDeleteTemplates(ids)
    ElMessage.success(`已删除 ${ids.length} 条`)
    selected.value = []
    fetchList()
  }

  async function toggleStatus(item: TemplateItem) {
    const newStatus = item.status === 2 ? 1 : 2
    await updateTemplateStatus(item.id, newStatus)
    item.status = newStatus as TemplateItem['status']
    ElMessage.success(newStatus === 1 ? '已启用' : '已停用')
  }

  return { list, loading, selected, query, total, fetchList, onSelect, remove, batchRemove, toggleStatus }
})
