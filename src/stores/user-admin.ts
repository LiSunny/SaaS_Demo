import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { UserItem, UserQuery, CreateUserForm, UpdateUserForm, UserEnterpriseItem, AddUserEnterpriseForm } from '@/types/user-admin'
import {
  getUserList, createUser, updateUser,
  toggleUserStatus, resetUserPassword, getUserEnterprises, addUserEnterprise,
  deleteUser, removeUserEnterprise,
} from '@/api/user-admin'

export const useUserAdminStore = defineStore('userAdmin', () => {
  // ===== 列表 =====
  const list = ref<UserItem[]>([])
  const loading = ref(false)
  const query = reactive<UserQuery>({ page: 1, size: 20 })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const r = await getUserList({ ...query })
      list.value = r.data
      total.value = r.total
    } finally { loading.value = false }
  }

  function search() { query.page = 1; fetchList() }

  // ===== 新增 =====
  async function handleCreate(form: CreateUserForm) {
    await createUser(form)
    ElMessage.success('创建成功')
    fetchList()
  }

  // ===== 编辑 =====
  async function handleUpdate(id: number, form: UpdateUserForm) {
    await updateUser(id, form)
    ElMessage.success('保存成功')
    fetchList()
  }

  // ===== 停用/启用 =====
  async function handleToggleStatus(id: number) {
    const updated = await toggleUserStatus(id)
    ElMessage.success(updated.status === 0 ? '已停用' : '已启用')
    fetchList()
  }

  // ===== 重置密码 =====
  async function handleResetPassword(id: number): Promise<string> {
    const r = await resetUserPassword(id)
    ElMessage.success(`密码已重置为: ${r.password}`)
    return r.password
  }

  // ===== 关联企业 =====
  const enterprises = ref<UserEnterpriseItem[]>([])
  const enterprisesLoading = ref(false)

  async function fetchEnterprises(userId: number) {
    enterprisesLoading.value = true
    try {
      enterprises.value = await getUserEnterprises(userId)
    } finally { enterprisesLoading.value = false }
  }

  // ===== 添加关联企业 =====
  async function handleAddEnterprise(userId: number, form: AddUserEnterpriseForm) {
    await addUserEnterprise(userId, form)
    ElMessage.success('关联成功')
    // 刷新抽屉 + 外层列表
    await fetchEnterprises(userId)
    await fetchList()
  }

  // ===== 删除用户 =====
  async function handleDelete(id: number) {
    await deleteUser(id)
    ElMessage.success('已删除')
    await fetchList()
  }

  // ===== 移除关联企业 =====
  async function handleRemoveEnterprise(userId: number, enterpriseId: number) {
    await removeUserEnterprise(userId, enterpriseId)
    ElMessage.success('已移除关联')
    await fetchEnterprises(userId)
    await fetchList()
  }

  return {
    list, loading, query, total, fetchList, search,
    handleCreate, handleUpdate, handleToggleStatus, handleResetPassword,
    enterprises, enterprisesLoading, fetchEnterprises, handleAddEnterprise,
    handleDelete, handleRemoveEnterprise,
  }
})
