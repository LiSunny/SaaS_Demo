/**
 * enterprise-dao.ts — 租户管理 DAO 适配器（Mock 数据）
 */
import type { EnterpriseItem, EnterpriseQuery, EnterpriseForm, SubordinateItem, PartnerItem, OperationLogItem, PaginatedData, PartnerRole } from '@/types/enterprise'
import { createPersistentStore } from '@/utils/db-adapter'

// ===== Mock User 数据（供企业创建时自动初始化管理员） =====
interface MockUser {
  id: number
  phone: string
  realName: string
  password: string
  status: number
  createdAt: string
}

interface MockUserEnterprise {
  id: number
  userId: number
  enterpriseId: number
  positions: string[]
  status: number
  joinedAt: string
  inviterName: string
  remark: string
}

const MOCK_USERS: MockUser[] = [
  { id: 1, phone: '13800000000', realName: '赵启明', password: 'admin123', status: 1, createdAt: '2025-01-01 00:00:00' },
  { id: 2, phone: '16666666666', realName: '管理员', password: 'admin123!@#', status: 1, createdAt: '2025-01-01 00:00:00' },
]

const MOCK_USER_ENTERPRISES: MockUserEnterprise[] = [
  { id: 1, userId: 1, enterpriseId: 1, positions: ['platform:platform-admin'], status: 1, joinedAt: '2025-01-01 00:00:00', inviterName: '系统初始化', remark: '' },
  { id: 2, userId: 2, enterpriseId: 1, positions: ['platform:org-admin'], status: 1, joinedAt: '2025-06-01 00:00:00', inviterName: '孙文博', remark: '' },
]

const mockUserStore = createPersistentStore('mock_users', MOCK_USERS)
const mockUEStore = createPersistentStore('mock_user_enterprises', MOCK_USER_ENTERPRISES)

// ===== Mock 企业数据 =====
const MOCK_ENTERPRISES: EnterpriseItem[] = [
  {
    id: '1', name: '尼特', code: 'QY1',
    dimB: '', dimC: { code: '', name: '' }, dimD: '',
    region: '', contactName: '管理员', contactPhone: '16666666666',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 5, unitCount: 2, relCount: 3,
    deletedAt: '', createdAt: '2024-10-31 15:53:06', updatedAt: '2024-10-31 15:53:06',
  },
  {
    id: '2', name: '港南一中', code: 'QY1013801074735185920',
    dimB: '06', dimC: { code: '85', name: '教育' }, dimD: '12',
    region: '广西壮族自治区 贵港市 港南区', contactName: '李文学', contactPhone: '17733550542',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['消防安全重点单位'], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 1, unitCount: 1, relCount: 2,
    deletedAt: '', createdAt: '2025-08-29 13:23:32', updatedAt: '2025-08-29 13:23:32',
  },
  {
    id: '3', name: '港南消防队', code: 'QY1044197200894099456',
    dimB: '', dimC: { code: '91', name: '国家机构' }, dimD: '',
    region: '', contactName: '李阳', contactPhone: '17733550542',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 3, unitCount: 1, relCount: 1,
    deletedAt: '', createdAt: '2025-11-21 10:26:53', updatedAt: '2025-11-21 10:26:53',
  },
  {
    id: '4', name: '阳光物业管理有限公司', code: 'QY1000000000000000001',
    dimB: '', dimC: { code: '70', name: '房地产业' }, dimD: '2',
    region: '北京市 朝阳区', contactName: '赵丽萍', contactPhone: '13800001111',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '朝阳区XX路100号', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 12, unitCount: 5, relCount: 8,
    deletedAt: '', createdAt: '2025-06-15 09:00:00', updatedAt: '2025-06-15 09:00:00',
  },
  {
    id: '5', name: '蓝盾消防技术服务公司', code: 'QY1000000000000000002',
    dimB: '', dimC: { code: '80', name: '居民服务业' }, dimD: '',
    region: '北京市 海淀区', contactName: '郑晓峰', contactPhone: '13900002222',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['维保', '检测'], address: '海淀区XX科技园', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 25, unitCount: 3, relCount: 6,
    deletedAt: '', createdAt: '2025-07-01 10:00:00', updatedAt: '2025-07-01 10:00:00',
  },
  {
    id: '6', name: '应急管理局安全管理中心', code: 'QY1000000000000000003',
    dimB: '', dimC: { code: '91', name: '国家机构' }, dimD: '',
    region: '北京市', contactName: '王蕾', contactPhone: '13700003333',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 8, unitCount: 2, relCount: 4,
    deletedAt: '', createdAt: '2025-08-01 08:00:00', updatedAt: '2025-08-01 08:00:00',
  },
  {
    id: '7', name: '海港区政府', code: 'QY1000000000000000004',
    dimB: '27', dimC: { code: '91', name: '国家机构' }, dimD: '',
    region: '河北省 秦皇岛市 海港区', contactName: '李子新', contactPhone: '18751529933',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['标签1'], address: '秦皇岛市海港区XX路', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 15, unitCount: 5, relCount: 10,
    deletedAt: '', createdAt: '2025-09-01 08:00:00', updatedAt: '2025-09-01 08:00:00',
  },
  {
    id: '8', name: '烟草局', code: 'QY1000000000000000005',
    dimB: '', dimC: { code: '91', name: '国家机构' }, dimD: '',
    region: '河北省 秦皇岛市', contactName: '宋力志', contactPhone: '17040201428',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['标签2'], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 6, unitCount: 2, relCount: 3,
    deletedAt: '', createdAt: '2025-09-15 08:00:00', updatedAt: '2025-09-15 08:00:00',
  },
  {
    id: '9', name: '秦皇岛一中', code: 'QY1000000000000000006',
    dimB: '06', dimC: { code: '82', name: '教育' }, dimD: '12',
    region: '河北省 秦皇岛市', contactName: '王小康', contactPhone: '18946450602',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['标签3', '消防安全重点单位'], address: '秦皇岛市XX区XX路', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 45, unitCount: 8, relCount: 5,
    deletedAt: '', createdAt: '2025-10-01 08:00:00', updatedAt: '2025-10-01 08:00:00',
  },
  {
    id: '10', name: '盛泰北苑', code: 'QY1000000000000000007',
    dimB: '26', dimC: { code: '70', name: '房地产业' }, dimD: '8',
    region: '河北省 秦皇岛市', contactName: '宋敏', contactPhone: '13781265439',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['标签4'], address: '秦皇岛市XX区XX小区', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 3, unitCount: 1, relCount: 2,
    deletedAt: '', createdAt: '2025-10-05 08:00:00', updatedAt: '2025-10-05 08:00:00',
  },
  {
    id: '11', name: '万达商业管理有限公司', code: 'QY1000000000000000008',
    dimB: '14', dimC: { code: '70', name: '房地产业' }, dimD: '6',
    region: '北京市 朝阳区', contactName: '陈伟强', contactPhone: '18612345678',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['消防安全重点单位'], address: '朝阳区XX路万达广场', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 60, unitCount: 12, relCount: 15,
    deletedAt: '', createdAt: '2025-11-01 08:00:00', updatedAt: '2025-11-01 08:00:00',
  },
]

// ===== Mock 下级关联 =====
const MOCK_SUBORDINATES: Record<string, SubordinateItem[]> = {
  '6': [
    { id: 's1', enterpriseId: '3', enterpriseName: '港南消防队', tags: [], relatedAt: '2025-12-01 10:00:00', operatorName: '王蕾' },
    { id: 's2', enterpriseId: '4', enterpriseName: '阳光物业管理有限公司', tags: [], relatedAt: '2025-12-15 14:00:00', operatorName: '王蕾' },
  ],
  '4': [
    { id: 's3', enterpriseId: '5', enterpriseName: '蓝盾消防技术服务公司', tags: [], relatedAt: '2026-01-10 09:00:00', operatorName: '赵丽萍' },
  ],
}

// ===== Mock 相关方（v1.1 新角色） =====
const MOCK_PARTNERS: Record<string, PartnerItem[]> = {
  '2': [
    { id: 'p1', enterpriseId: '6', enterpriseName: '海港区政府', role: 'my_supervisor' as PartnerRole, roleLabel: '我的监管方>属地政府（街道/社区等）', tags: ['标签1'], contactName: '李子新', contactPhone: '18751529933', relatedAt: '2025-10-09 10:00:00', operatorName: '孙文博', authUnits: [], allowOperation: false },
    { id: 'p2', enterpriseId: '7', enterpriseName: '烟草局', role: 'my_supervisor' as PartnerRole, roleLabel: '我的监管方>行业主管部门', tags: ['标签2'], contactName: '宋力志', contactPhone: '17040201428', relatedAt: '2025-10-09 11:00:00', operatorName: '孙文博', authUnits: [], allowOperation: false },
    { id: 'p3', enterpriseId: '4', enterpriseName: '秦皇岛一中', role: 'my_manager' as PartnerRole, roleLabel: '我的管理方>空间管理方>商业街', tags: ['标签3'], contactName: '王小康', contactPhone: '18946450602', relatedAt: '2025-10-09 14:30:00', operatorName: '孙文博', authUnits: [], allowOperation: false },
    { id: 'p4', enterpriseId: '8', enterpriseName: '盛泰北苑', role: 'my_operator' as PartnerRole, roleLabel: '我的运营方>运营管理方', tags: ['标签4'], contactName: '宋敏', contactPhone: '13781265439', relatedAt: '2025-10-09 09:15:00', operatorName: '孙文博', authUnits: [], allowOperation: false },
  ],
  '4': [
    { id: 'p5', enterpriseId: '5', enterpriseName: '蓝盾消防技术服务公司', role: 'my_service_unit' as PartnerRole, roleLabel: '我的服务单位>消防技术服务机构', tags: ['维保', '检测'], contactName: '郑晓峰', contactPhone: '13900002222', relatedAt: '2025-11-20 10:00:00', operatorName: '赵丽萍', authUnits: [], allowOperation: false },
    { id: 'p6', enterpriseId: '9', enterpriseName: '万达商业管理有限公司', role: 'social_unit' as PartnerRole, roleLabel: '社会单位', tags: ['消防安全重点单位'], contactName: '陈伟强', contactPhone: '18612345678', relatedAt: '2025-12-01 08:30:00', operatorName: '赵丽萍', authUnits: [], allowOperation: false },
  ],
}

// ===== Mock 操作日志 =====
const MOCK_LOGS: OperationLogItem[] = [
  { id: 'l1', action: '创建企业', timestamp: '2025-08-29 13:23:32', operatorName: '超级管理员', details: [{ label: '企业名称', value: '港南一中' }] },
  { id: 'l2', action: '关联相关方', timestamp: '2025-08-29 13:23:32', operatorName: '超级管理员', details: [{ label: '关联企业', value: '尼特' }] },
  { id: 'l3', action: '关联相关方', timestamp: '2025-08-29 14:08:21', operatorName: '李文学', details: [{ label: '关联企业', value: '港南消防队' }] },
]

const store = createPersistentStore('enterprises', MOCK_ENTERPRISES)

// ===== API 实现 =====

export async function getEnterpriseList(query: EnterpriseQuery): Promise<PaginatedData<EnterpriseItem>> {
  let list = store.getAll() as EnterpriseItem[]
  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(kw) || e.code.toLowerCase().includes(kw))
  }
  if (query.dimB) list = list.filter(e => e.dimB === query.dimB)
  if (query.dimC) list = list.filter(e => e.dimC.name === query.dimC)
  // 默认排除已删除企业
  if (!query.includeDeleted) {
    list = list.filter(e => !e.deletedAt)
  }
  const total = list.length
  const start = (query.page - 1) * query.size
  return { data: list.slice(start, start + query.size), total }
}

export async function getEnterpriseDetail(id: string): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  return item
}

export async function createEnterprise(form: EnterpriseForm): Promise<EnterpriseItem> {
  const id = String(Date.now())
  const code = `QY${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const tags: string[] = form.tags ? form.tags.split(',').filter(Boolean) : []

  // 维度 B 命中重点单位类别时自动打标签
  const hitCodes = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28']
  if (form.dimB && hitCodes.includes(form.dimB)) {
    if (!tags.includes('消防安全重点单位')) {
      tags.push('消防安全重点单位')
    }
  }

  const newItem: EnterpriseItem = {
    id, code,
    name: form.name, contactName: form.contactName, contactPhone: form.contactPhone,
    tags,
    validFrom: form.validFrom || '', validTo: form.validTo || '',
    region: form.region || '', parentId: form.parentId || '', parentName: '',
    address: form.address || '', remark: form.remark || '', logo: form.logo || '',
    dimB: form.dimB || '', dimC: { code: form.dimC || '', name: '' },
    dimD: form.dimD || '', status: 1, qrcode: '', creatorName: '当前用户',
    staffCount: 0, unitCount: 0, relCount: 0, createdAt: now, updatedAt: now,
  }

  // ① 创建企业
  store.add(newItem)

  // ② 检索/新建 Mock User
  const phone = form.contactPhone?.trim()
  let user = phone ? mockUserStore.findBy(u => u.phone === phone)[0] : null
  let isNewUser = false

  if (phone && !user) {
    user = {
      id: mockUserStore.nextId(),
      phone,
      realName: form.contactName?.trim() || '',
      password: 'admin123!@#', // Mock 明文存储
      status: 1,
      createdAt: now,
    }
    mockUserStore.add(user)
    isNewUser = true
  }

  // ③ 写入 UserEnterprise（org-admin）
  if (user) {
    const existing = mockUEStore.findBy(
      ue => ue.userId === user!.id && String(ue.enterpriseId) === id,
    )
    if (existing.length === 0) {
      mockUEStore.add({
        id: mockUEStore.nextId(),
        userId: user.id,
        enterpriseId: Number(id),
        positions: ['platform:org-admin'],
        status: 1,
        joinedAt: now,
        inviterName: '平台运营方',
        remark: '',
      })
    }
  }

  // ④ 条件建立下级管理关联
  const parentId = parseInt(form.parentId) || 0
  if (parentId > 0) {
    const parent = MOCK_ENTERPRISES.find(e => e.id === String(parentId))
    if (parent) {
      // 一企业一上级校验
      const existingSub = Object.values(MOCK_SUBORDINATES).flat().find(
        s => s.enterpriseId === id,
      )
      if (existingSub) {
        // Mock 模式：忽略已存在的情况，不抛错
        console.warn(`[DAO] 企业 ${id} 已有上级，跳过下级管理关联`)
      } else {
        if (!MOCK_SUBORDINATES[String(parentId)]) {
          MOCK_SUBORDINATES[String(parentId)] = []
        }
        MOCK_SUBORDINATES[String(parentId)].push({
          id: `s${Date.now()}`,
          enterpriseId: id,
          enterpriseName: newItem.name,
          tags: newItem.tags,
          relatedAt: now,
          operatorName: '当前用户',
        })
        newItem.parentId = String(parentId)
        newItem.parentName = parent.name
        store.update(id, { parentId: String(parentId), parentName: parent.name })
      }
    }
  }

  // 返回企业信息 + 管理员账号
  return {
    ...newItem,
    adminAccount: user ? {
      phone: user.phone,
      name: user.realName,
      isNewUser,
      initialPassword: isNewUser ? 'admin123!@#' : undefined,
    } : null,
  }
}

export async function updateEnterprise(id: string, form: Partial<EnterpriseForm>): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  Object.assign(item, form, { updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })
  // 维度 B 命中重点单位类别时自动打/去标签
  const hitCodes = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28']
  if (form.dimB && hitCodes.includes(form.dimB)) {
    if (!item.tags.includes('消防安全重点单位')) item.tags.push('消防安全重点单位')
  } else if (form.dimB !== undefined) {
    item.tags = item.tags.filter(t => t !== '消防安全重点单位')
  }
  store.update(id, item)
  return item
}

export async function lockEnterprise(id: string): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  item.status = item.status === 1 ? 0 : 1
  store.update(id, item)
  return item
}

export async function extendEnterprise(id: string, validTo: string): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  item.validTo = validTo
  item.status = 1
  store.update(id, item)
  return item
}

export async function batchDeleteEnterprises(ids: string[]): Promise<void> {
  ids.forEach(id => store.remove(id))
}

export async function softDeleteEnterprise(id: string): Promise<void> {
  const item = store.getById(id) as EnterpriseItem | undefined
  if (!item) throw new Error('企业不存在')
  if (item.deletedAt) throw new Error('企业已被删除')
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  store.update(id, { deletedAt: now } as any)

  // 级联：停用该企业下所有用户-企业关联
  const mockUEs = mockUEStore.getAll() as MockUserEnterprise[]
  for (const ue of mockUEs) {
    if (ue.enterpriseId === Number(id) && ue.status === 1) {
      mockUEStore.update(ue.id, { status: 0 } as any)
    }
  }

  // 级联：删除该企业作为任一方的所有关系记录
  for (const key of Object.keys(MOCK_SUBORDINATES)) {
    MOCK_SUBORDINATES[key] = MOCK_SUBORDINATES[key].filter(
      s => s.enterpriseId !== id && String(s.enterpriseId) !== id,
    )
    if (MOCK_SUBORDINATES[key].length === 0) delete MOCK_SUBORDINATES[key]
  }
  if (MOCK_SUBORDINATES[id]) delete MOCK_SUBORDINATES[id]

  for (const key of Object.keys(MOCK_PARTNERS)) {
    MOCK_PARTNERS[key] = MOCK_PARTNERS[key].filter(
      p => p.enterpriseId !== id,
    )
    if (MOCK_PARTNERS[key].length === 0) delete MOCK_PARTNERS[key]
  }
  if (MOCK_PARTNERS[id]) delete MOCK_PARTNERS[id]
}

export async function recoverEnterprise(id: string): Promise<void> {
  const item = store.getById(id) as EnterpriseItem | undefined
  if (!item) throw new Error('企业不存在')
  if (!item.deletedAt) throw new Error('企业未被删除')
  store.update(id, { deletedAt: '' } as any)
}

export async function getSubordinates(enterpriseId: string, _query: { keyword?: string; page: number; size: number }): Promise<PaginatedData<SubordinateItem>> {
  const list = MOCK_SUBORDINATES[enterpriseId] || []
  return { data: list, total: list.length }
}

export async function addSubordinates(_enterpriseId: string, _enterpriseIds: string[]): Promise<void> {
  // Mock: 无实际操作
}

export async function removeSubordinates(_enterpriseId: string, _relationIds: string[]): Promise<void> {
  // Mock: 无实际操作
}

export async function getPartners(enterpriseId: string, query: { keyword?: string; role?: string; page: number; size: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }): Promise<PaginatedData<PartnerItem>> {
  let list = MOCK_PARTNERS[enterpriseId] || []
  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    list = list.filter(p => p.enterpriseName.toLowerCase().includes(kw) || p.contactName.toLowerCase().includes(kw))
  }
  if (query.role) list = list.filter(p => p.role === query.role)
  // 排序
  if (query.sortBy === 'relatedAt') {
    list = [...list].sort((a, b) => {
      const cmp = a.relatedAt.localeCompare(b.relatedAt)
      return query.sortOrder === 'asc' ? cmp : -cmp
    })
  } else {
    // 默认按关联日期倒序
    list = [...list].sort((a, b) => b.relatedAt.localeCompare(a.relatedAt))
  }
  const total = list.length
  const start = (query.page - 1) * query.size
  return { data: list.slice(start, start + query.size), total }
}

export async function addPartner(enterpriseId: string, data: { enterpriseId: string; role: string; tags?: string[] }): Promise<PartnerItem> {
  const target = MOCK_ENTERPRISES.find(e => e.id === data.enterpriseId)
  if (!target) throw new Error('目标企业不存在')
  // 查关系角色字典获取 label
  const roleOption = RELATION_ROLE_OPTIONS.find(r => r.value === data.role)
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const newPartner: PartnerItem = {
    id: `p${Date.now()}`,
    enterpriseId: target.id,
    enterpriseName: target.name,
    role: data.role as PartnerRole,
    roleLabel: roleOption?.label || data.role,
    tags: data.tags || [],
    contactName: target.contactName,
    contactPhone: target.contactPhone,
    relatedAt: now,
    operatorName: '当前用户',
    authUnits: [],
    allowOperation: false,
  }
  if (!MOCK_PARTNERS[enterpriseId]) MOCK_PARTNERS[enterpriseId] = []
  MOCK_PARTNERS[enterpriseId].push(newPartner)
  return newPartner
}

export async function updatePartner(enterpriseId: string, relationId: string, data: { role?: string; tags?: string[] }): Promise<PartnerItem> {
  const list = MOCK_PARTNERS[enterpriseId]
  if (!list) throw new Error('相关方列表不存在')
  const idx = list.findIndex(p => p.id === relationId)
  if (idx === -1) throw new Error('相关方关联不存在')
  if (data.role) {
    const roleOption = RELATION_ROLE_OPTIONS.find(r => r.value === data.role)
    list[idx].role = data.role as PartnerRole
    list[idx].roleLabel = roleOption?.label || data.role
  }
  if (data.tags !== undefined) list[idx].tags = data.tags
  return list[idx]
}

export async function removePartners(enterpriseId: string, relationIds: string[]): Promise<void> {
  if (!MOCK_PARTNERS[enterpriseId]) return
  MOCK_PARTNERS[enterpriseId] = MOCK_PARTNERS[enterpriseId].filter(p => !relationIds.includes(p.id))
}

export async function savePartnerAuth(relationId: string, _enterpriseId: string, data: { authUnits: string[]; allowOperation: boolean }): Promise<PartnerItem> {
  // 遍历所有企业的相关方查找对应记录
  for (const list of Object.values(MOCK_PARTNERS)) {
    const idx = list.findIndex(p => p.id === relationId)
    if (idx !== -1) {
      list[idx].authUnits = data.authUnits
      list[idx].allowOperation = data.allowOperation
      return list[idx]
    }
  }
  throw new Error('相关方关联不存在')
}

export async function getPartnerAuth(relationId: string, _enterpriseId: string): Promise<PartnerItem> {
  for (const list of Object.values(MOCK_PARTNERS)) {
    const found = list.find(p => p.id === relationId)
    if (found) return found
  }
  throw new Error('相关方关联不存在')
}

export async function getOperationLogs(_enterpriseId: string, _query: { page: number; size: number }): Promise<PaginatedData<OperationLogItem>> {
  return { data: MOCK_LOGS, total: MOCK_LOGS.length }
}

export async function getEnterpriseQrcode(_id: string): Promise<string> {
  return ''
}

export async function regenerateQrcode(_id: string): Promise<string> {
  return ''
}

export async function searchEnterprises(enterpriseId: string, keyword: string): Promise<{ id: string; name: string; tags: string[] }[]> {
  // 排除自身、已有相关方、已有下级
  const existingPartnerIds = (MOCK_PARTNERS[enterpriseId] || []).map(p => p.enterpriseId)
  const existingSubIds = (MOCK_SUBORDINATES[enterpriseId] || []).map(s => s.enterpriseId)
  const excludeIds = new Set([enterpriseId, ...existingPartnerIds, ...existingSubIds])
  const kw = keyword.toLowerCase()
  return MOCK_ENTERPRISES
    .filter(e => !e.deletedAt && !excludeIds.has(e.id) && (e.name.toLowerCase().includes(kw) || e.code.toLowerCase().includes(kw)))
    .slice(0, 20)
    .map(e => ({ id: e.id, name: e.name, tags: e.tags }))
}

// ===== 字典 =====
export async function getRelationRoleDict(): Promise<{ data: any[] }> {
  return { data: PARTNER_ROLE_TREE }
}

export async function getTagDict(): Promise<{ data: { value: string; label: string }[] }> {
  return { data: TAG_OPTIONS }
}

export async function getDictB() { return { data: DIM_B_OPTIONS } }
export async function getDictC() { return { data: DIM_C_OPTIONS } }
export async function getDictD() { return { data: DIM_D_OPTIONS } }
export async function getModuleTree() { return { data: MODULE_TREE } }

// ===== 关系角色选项（"我的"视角） =====
export interface RelationRoleOption {
  value: string
  label: string
  description: string
}

const RELATION_ROLE_OPTIONS: RelationRoleOption[] = [
  { value: 'my_supervisor', label: '我的监管方', description: '消防救援机构/应急管理部门/属地政府（街道/社区等）/行业主管部门' },
  { value: 'my_manager', label: '我的管理方', description: '空间管理方（物业/园区/市场/综合体/商业街等）/集团管理方' },
  { value: 'social_unit', label: '社会单位', description: '落实消防安全主体责任企业' },
  { value: 'my_service_unit', label: '我的服务单位', description: '消防技术服务机构（维保、检测、评估、工程安装等）' },
  { value: 'my_operator', label: '我的运营方', description: '运营管理方' },
]

const PARTNER_ROLE_TREE = [
  {
    value: 'my_supervisor', label: '我的监管方',
    children: [
      { value: 'fire_rescue', label: '消防救援机构' },
      { value: 'emergency_mgmt', label: '应急管理部门' },
      { value: 'local_gov', label: '属地政府（街道/社区等）' },
      { value: 'industry_regulator', label: '行业主管部门' },
    ],
  },
  {
    value: 'my_manager', label: '我的管理方',
    children: [
      {
        value: 'space_manager', label: '空间管理方',
        children: [
          { value: 'business_street', label: '商业街' },
          { value: 'property', label: '物业' },
          { value: 'park', label: '园区' },
          { value: 'market', label: '市场' },
          { value: 'complex', label: '综合体' },
        ],
      },
      { value: 'group_manager', label: '集团管理方' },
    ],
  },
  { value: 'social_unit', label: '社会单位' },
  {
    value: 'my_service_unit', label: '我的服务单位',
    children: [
      { value: 'fire_tech_service', label: '消防技术服务机构' },
    ],
  },
  {
    value: 'my_operator', label: '我的运营方',
    children: [
      { value: 'operation_manager', label: '运营管理方' },
    ],
  },
]

const TAG_OPTIONS = [
  { value: '消防安全重点单位', label: '消防安全重点单位' },
  { value: '维保', label: '维保' },
  { value: '检测', label: '检测' },
  { value: '评估', label: '评估' },
  { value: '标签1', label: '标签1' },
  { value: '标签2', label: '标签2' },
  { value: '标签3', label: '标签3' },
  { value: '标签4', label: '标签4' },
]

// XF/T 3016.1-2022 消防安全重点单位类别代码（28 项）
const DIM_B_OPTIONS = [
  { value: '01', label: '商场市场' }, { value: '02', label: '宾馆饭店' },
  { value: '03', label: '公共娱乐场所' }, { value: '04', label: '餐饮场所' },
  { value: '05', label: '医院' }, { value: '06', label: '学校' },
  { value: '07', label: '养老福利机构' }, { value: '08', label: '体育场馆' },
  { value: '09', label: '交通枢纽' }, { value: '10', label: '劳动密集型企业' },
  { value: '11', label: '易燃易爆场所' }, { value: '12', label: '高层公共建筑' },
  { value: '13', label: '地下建筑' }, { value: '14', label: '大型商业综合体' },
  { value: '15', label: '文物古建筑' }, { value: '16', label: '仓储物流' },
  { value: '17', label: '金融机构' }, { value: '18', label: '通信枢纽' },
  { value: '19', label: '广播电视' }, { value: '20', label: '发电厂/变电站' },
  { value: '21', label: '博物馆/展览馆' }, { value: '22', label: '图书馆/档案馆' },
  { value: '23', label: '科研机构' }, { value: '24', label: '旅游景区' },
  { value: '25', label: '宗教活动场所' }, { value: '26', label: '住宅小区' },
  { value: '27', label: '党政机关' }, { value: '28', label: '其他重点单位' },
]

// GB/T 4754-2017 国民经济行业分类（摘录常见 26 项）
const DIM_C_OPTIONS = [
  { value: '01', label: '农业' }, { value: '06', label: '煤炭开采和洗选业' },
  { value: '13', label: '农副食品加工业' }, { value: '17', label: '纺织业' },
  { value: '25', label: '石油、煤炭及其他燃料加工业' }, { value: '26', label: '化学原料和化学制品制造业' },
  { value: '33', label: '金属制品业' }, { value: '41', label: '土木工程建筑业' },
  { value: '47', label: '房屋建筑业' }, { value: '51', label: '批发业' },
  { value: '52', label: '零售业' }, { value: '56', label: '住宿业' },
  { value: '62', label: '餐饮业' }, { value: '63', label: '电信、广播电视和卫星传输服务' },
  { value: '64', label: '互联网和相关服务' }, { value: '66', label: '金融业' },
  { value: '70', label: '房地产业' }, { value: '80', label: '居民服务业' },
  { value: '82', label: '教育' }, { value: '83', label: '卫生' },
  { value: '85', label: '社会工作' }, { value: '86', label: '新闻和出版业' },
  { value: '87', label: '广播、电视、电影和影视录音制作业' }, { value: '90', label: '文化艺术业' },
  { value: '91', label: '国家机构' }, { value: '96', label: '基层群众自治组织' },
]

// 各省消防安全重点单位界定标准 — 场所/建筑类型（13 项）
const DIM_D_OPTIONS = [
  { value: '1', label: '人员密集场所' }, { value: '2', label: '高层建筑' },
  { value: '3', label: '地下建筑' }, { value: '4', label: '易燃易爆场所' },
  { value: '5', label: '文物古建筑' }, { value: '6', label: '大型商业综合体' },
  { value: '7', label: '工业建筑' }, { value: '8', label: '普通商铺' },
  { value: '9', label: '办公建筑' }, { value: '10', label: '交通建筑' },
  { value: '11', label: '医疗建筑' }, { value: '12', label: '教育建筑' },
  { value: '99', label: '其他' },
]

const MODULE_TREE = [
  {
    key: '设备管理', label: '设备管理',
    children: [
      { key: 'device-ledger', label: '设备台账' },
      { key: 'maintenance', label: '保养管理' },
      { key: 'monitor', label: '运行监控' },
    ],
  },
  { key: 'IOT', label: 'IOT', children: [] },
  {
    key: '远程值守', label: '远程值守',
    children: [
      { key: 'alarm-center', label: '告警中心' },
      { key: 'verify', label: '核实判定' },
    ],
  },
  {
    key: '巡查检查', label: '巡查检查',
    children: [
      { key: 'patrol-plan', label: '巡查计划' },
      { key: 'patrol-task', label: '巡查任务' },
    ],
  },
  { key: '项目管理', label: '项目管理', children: [] },
  { key: '维保应用', label: '维保应用', children: [] },
  { key: '数据可视化', label: '数据可视化', children: [] },
  {
    key: '隐患管理', label: '隐患管理',
    children: [
      { key: 'hazard-ledger', label: '隐患台账' },
    ],
  },
  { key: '食品安全管理', label: '食品安全管理', children: [] },
  { key: '培训与演练', label: '培训与演练', children: [] },
  { key: '系统管理', label: '系统管理', children: [] },
  { key: '政务管理', label: '政务管理', children: [] },
  { key: '危险作业管理', label: '危险作业管理', children: [] },
]
