/**
 * bigscreen.ts — 大屏管理 Pinia Store
 */
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getBigscreenList,
  getBigscreenDetail,
  createBigscreen,
  updateBigscreen,
  deleteBigscreen,
  getBigscreenEnterprises,
  addBigscreenEnterprise,
  updateBigscreenEnterprise,
  removeBigscreenEnterprise,
} from '@/api/bigscreen'
import type { BigscreenItem, BigscreenDetail, BigscreenEnterpriseItem, BigscreenForm } from '@/types/bigscreen'

export const useBigscreenStore = defineStore('bigscreen', () => {
  // ===== 列表 =====
  const list = ref<BigscreenItem[]>([])
  const total = ref(0)
  const loading = ref(false)
  const query = reactive({ page: 1, size: 20, keyword: '' })

  // ===== 详情 =====
  const detail = ref<BigscreenDetail | null>(null)
  const detailLoading = ref(false)

  // ===== 关联企业 =====
  const enterprises = ref<BigscreenEnterpriseItem[]>([])
  const enterprisesLoading = ref(false)

  // ===== 列表查询 =====
  async function fetchList() {
    loading.value = true
    try {
      const res = await getBigscreenList({ ...query } as any)
      list.value = res.data
      total.value = res.total
    } catch (err: any) {
      ElMessage.error(err?.message || '加载大屏列表失败')
    } finally {
      loading.value = false
    }
  }

  function search() { query.page = 1; fetchList() }

  // ===== 详情 =====
  async function fetchDetail(id: number) {
    detailLoading.value = true
    try {
      detail.value = await getBigscreenDetail(id)
    } catch (err: any) {
      ElMessage.error(err?.message || '加载大屏详情失败')
    } finally {
      detailLoading.value = false
    }
  }

  // ===== 创建 =====
  async function handleCreate(form: BigscreenForm) {
    try {
      await createBigscreen(form)
      ElMessage.success('创建成功')
      return true
    } catch (err: any) {
      ElMessage.error(err?.message || '创建失败')
      return false
    }
  }

  // ===== 更新 =====
  async function handleUpdate(id: number, form: Partial<BigscreenForm>) {
    try {
      await updateBigscreen(id, form)
      ElMessage.success('更新成功')
      return true
    } catch (err: any) {
      ElMessage.error(err?.message || '更新失败')
      return false
    }
  }

  // ===== 删除 =====
  async function handleDelete(id: number) {
    try {
      await deleteBigscreen(id)
      ElMessage.success('删除成功')
      return true
    } catch (err: any) {
      ElMessage.error(err?.message || '删除失败')
      return false
    }
  }

  // ===== 加载关联企业列表 =====
  async function fetchEnterprises(bigscreenId: number) {
    enterprisesLoading.value = true
    try {
      enterprises.value = await getBigscreenEnterprises(bigscreenId)
    } catch (err: any) {
      ElMessage.error(err?.message || '加载关联企业失败')
    } finally {
      enterprisesLoading.value = false
    }
  }

  // ===== 添加关联企业 =====
  async function handleAddEnterprise(bigscreenId: number, form: { enterpriseId: number; isDefault: boolean }) {
    try {
      await addBigscreenEnterprise(bigscreenId, form)
      ElMessage.success('关联成功')
      return true
    } catch (err: any) {
      ElMessage.error(err?.message || '关联失败')
      return false
    }
  }

  // ===== 更新关联 =====
  async function handleUpdateEnterprise(bigscreenId: number, enterpriseId: number, form: { isDefault?: boolean }) {
    try {
      await updateBigscreenEnterprise(bigscreenId, enterpriseId, form)
      ElMessage.success('更新成功')
      return true
    } catch (err: any) {
      ElMessage.error(err?.message || '更新失败')
      return false
    }
  }

  // ===== 移除关联 =====
  async function handleRemoveEnterprise(bigscreenId: number, enterpriseId: number) {
    try {
      await removeBigscreenEnterprise(bigscreenId, enterpriseId)
      ElMessage.success('已移除关联')
      return true
    } catch (err: any) {
      ElMessage.error(err?.message || '移除失败')
      return false
    }
  }

  return {
    list, total, loading, query,
    detail, detailLoading,
    enterprises, enterprisesLoading,
    fetchList, search, fetchDetail,
    handleCreate, handleUpdate, handleDelete,
    fetchEnterprises, handleAddEnterprise, handleUpdateEnterprise, handleRemoveEnterprise,
  }
})
