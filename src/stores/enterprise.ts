import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type {
  EnterpriseItem, EnterpriseQuery, EnterpriseForm,
  SubordinateItem, PartnerItem, OperationLogItem,
  DictItem, ModuleTreeNode,
} from '@/types/enterprise'
import {
  getEnterpriseList, getEnterpriseDetail,
  createEnterprise, updateEnterprise,
  lockEnterprise, extendEnterprise, batchDeleteEnterprises,
  getSubordinates, addSubordinates, removeSubordinates,
  getPartners, addPartners, removePartners, savePartnerAuth,
  getOperationLogs, getEnterpriseQrcode, regenerateQrcode,
  searchEnterprises, getDimADict, getDictB, getDictC, getDictD, getModuleTree,
} from '@/api/enterprise'
import defaultQrcode from '@/assets/qr_code.png'

export const useEnterpriseStore = defineStore('enterprise', () => {
  // ===== 列表 =====
  const list = ref<EnterpriseItem[]>([])
  const loading = ref(false)
  const query = reactive<EnterpriseQuery>({ page: 1, size: 20 })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try {
      const r = await getEnterpriseList({ ...query })
      list.value = r.data
      total.value = r.total
    } finally {
      loading.value = false
    }
  }

  function search() { query.page = 1; fetchList() }
  function resetQuery() {
    query.keyword = ''
    query.dimALevel1 = undefined
    query.dimB = ''
    query.dimC = ''
    query.dimD = ''
    search()
  }

  // ===== 详情 =====
  const detail = ref<EnterpriseItem | null>(null)
  const detailLoading = ref(false)

  async function fetchDetail(id: string) {
    detailLoading.value = true
    try {
      detail.value = await getEnterpriseDetail(id)
    } finally {
      detailLoading.value = false
    }
  }

  // ===== 操作 =====
  async function handleLock(id: string) {
    await lockEnterprise(id)
    ElMessage.success('操作成功')
    fetchList()
  }

  async function handleExtend(id: string, validTo: string) {
    await extendEnterprise(id, validTo)
    ElMessage.success('延期成功')
    fetchList()
  }

  async function handleBatchDelete(ids: string[]) {
    await batchDeleteEnterprises(ids)
    ElMessage.success('删除成功')
    fetchList()
  }

  // ===== 创建/编辑 =====
  async function handleCreate(form: EnterpriseForm) {
    const item = await createEnterprise(form)
    ElMessage.success('创建成功')
    return item
  }

  async function handleUpdate(id: string, form: Partial<EnterpriseForm>) {
    const item = await updateEnterprise(id, form)
    ElMessage.success('保存成功')
    return item
  }

  // ===== 下级管理 =====
  const subordinates = ref<SubordinateItem[]>([])
  const subLoading = ref(false)

  async function fetchSubordinates(enterpriseId: string, kw = '') {
    subLoading.value = true
    try {
      const r = await getSubordinates(enterpriseId, { keyword: kw, page: 1, size: 100 })
      subordinates.value = r.data
    } finally { subLoading.value = false }
  }

  async function handleAddSubordinates(enterpriseId: string, ids: string[]) {
    await addSubordinates(enterpriseId, ids)
    ElMessage.success('关联成功')
    fetchSubordinates(enterpriseId)
  }

  async function handleRemoveSubordinates(enterpriseId: string, ids: string[]) {
    await removeSubordinates(enterpriseId, ids)
    ElMessage.success('已取消关联')
    fetchSubordinates(enterpriseId)
  }

  // ===== 相关方管理 =====
  const partners = ref<PartnerItem[]>([])
  const partnerLoading = ref(false)

  async function fetchPartners(enterpriseId: string, kw = '', tag = '') {
    partnerLoading.value = true
    try {
      const r = await getPartners(enterpriseId, { keyword: kw, tag, page: 1, size: 100 })
      partners.value = r.data
    } finally { partnerLoading.value = false }
  }

  async function handleAddPartners(enterpriseId: string, ids: string[]) {
    await addPartners(enterpriseId, ids)
    ElMessage.success('关联成功')
    fetchPartners(enterpriseId)
  }

  async function handleRemovePartners(enterpriseId: string, ids: string[]) {
    await removePartners(enterpriseId, ids)
    ElMessage.success('已取消关联')
    fetchPartners(enterpriseId)
  }

  async function handleSavePartnerAuth(relationId: string, data: { authUnits: string[]; allowOperation: boolean }) {
    await savePartnerAuth(relationId, data)
    ElMessage.success('数据授权已保存')
  }

  // ===== 操作日志 =====
  const logs = ref<OperationLogItem[]>([])
  const logLoading = ref(false)

  async function fetchLogs(enterpriseId: string) {
    logLoading.value = true
    try {
      const r = await getOperationLogs(enterpriseId, { page: 1, size: 100 })
      logs.value = r.data
    } finally { logLoading.value = false }
  }

  // ===== 二维码 =====
  const qrcode = ref(defaultQrcode)

  async function fetchQrcode(id: string) {
    const url = await getEnterpriseQrcode(id)
    qrcode.value = url || defaultQrcode
  }

  async function handleRegenerateQrcode(id: string) {
    const url = await regenerateQrcode(id)
    qrcode.value = url || defaultQrcode
    ElMessage.success('二维码已重新生成')
  }

  // ===== 字典 =====
  const dimADict = ref<DictItem[]>([])
  const dictB = ref<DictItem[]>([])
  const dictC = ref<DictItem[]>([])
  const dictD = ref<DictItem[]>([])
  const moduleTree = ref<ModuleTreeNode[]>([])

  async function fetchDicts() {
    const [a, b, c, d, m] = await Promise.all([
      getDimADict(), getDictB(), getDictC(), getDictD(), getModuleTree(),
    ])
    dimADict.value = a.data
    dictB.value = b.data
    dictC.value = c.data
    dictD.value = d.data
    moduleTree.value = m.data
  }

  // ===== 搜索 =====
  async function searchEnterprisesRemote(keyword: string): Promise<EnterpriseItem[]> {
    if (!keyword) return []
    return searchEnterprises(keyword)
  }

  return {
    list, loading, query, total, fetchList, search, resetQuery,
    detail, detailLoading, fetchDetail,
    handleLock, handleExtend, handleBatchDelete, handleCreate, handleUpdate,
    subordinates, subLoading, fetchSubordinates, handleAddSubordinates, handleRemoveSubordinates,
    partners, partnerLoading, fetchPartners, handleAddPartners, handleRemovePartners, handleSavePartnerAuth,
    logs, logLoading, fetchLogs,
    qrcode, fetchQrcode, handleRegenerateQrcode,
    dimADict, dictB, dictC, dictD, moduleTree, fetchDicts,
    searchEnterprisesRemote,
  }
})
