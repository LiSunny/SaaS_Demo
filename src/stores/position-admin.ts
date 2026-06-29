import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { PositionItem, PositionQuery, PositionForm } from '@/types/position-admin'
import { getPositionList, createPosition, updatePosition, deletePosition, savePermissions } from '@/api/position-admin'
import type { PermissionConfig } from '@/types/position-admin'

export const usePositionStore = defineStore('positionAdmin', () => {
  const list = ref<PositionItem[]>([])
  const loading = ref(false)
  const query = reactive<PositionQuery>({ page: 1, size: 20 })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const r = await getPositionList({ ...query })
      list.value = r.data
      total.value = r.total
    } finally { loading.value = false }
  }

  function search() { query.page = 1; fetchList() }

  async function handleCreate(form: PositionForm) {
    await createPosition(form)
    ElMessage.success('创建成功')
    fetchList()
  }

  async function handleUpdate(id: number, form: PositionForm) {
    await updatePosition(id, form)
    ElMessage.success('保存成功')
    fetchList()
  }

  async function handleDelete(id: number) {
    await deletePosition(id)
    ElMessage.success('已删除')
    fetchList()
  }

  async function handleSavePermissions(id: number, config: PermissionConfig): Promise<void> {
    await savePermissions(id, config)
  }

  return { list, loading, query, total, fetchList, search, handleCreate, handleUpdate, handleDelete, handleSavePermissions }
})
