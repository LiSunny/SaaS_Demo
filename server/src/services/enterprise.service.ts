import db from '../config/db.js'

// ============================================
// 类型转换：Prisma → 前端 EnterpriseItem
// ============================================
function toItem(e: any) {
  return {
    id: String(e.id),
    name: e.name,
    code: e.code,
    dimA: {
      level1: e.dimALevel1,
      level2: e.dimALevel2 || null,
      level3: e.dimALevel3 || null,
    },
    dimB: e.dimB,
    dimC: { code: e.dimCCode, name: e.dimCName },
    dimD: e.dimD,
    region: e.region,
    contactName: e.contactName,
    contactPhone: e.contactPhone,
    status: e.status as 1 | 0 | 2,
    validFrom: e.validFrom,
    validTo: e.validTo,
    parentId: String(e.parentId || ''),
    parentName: e.parentName,
    tags: safeJsonParse(e.tags, []),
    address: e.address,
    remark: e.remark,
    logo: e.logo,
    qrcode: e.qrcode,
    creatorName: e.creatorName,
    staffCount: e.staffCount,
    unitCount: e.unitCount,
    relCount: e.relCount,
    createdAt: formatDate(e.createdAt),
    updatedAt: formatDate(e.updatedAt),
  }
}

function safeJsonParse(raw: string, fallback: any) {
  try { return JSON.parse(raw) } catch { return fallback }
}

function formatDate(d: Date | string): string {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toISOString().replace('T', ' ').slice(0, 19)
}

// ============================================
// 列表
// ============================================
export interface ListParams {
  page: number
  size: number
  keyword?: string
  dimALevel1?: string
  dimB?: string
  dimC?: string
  dimD?: string
}

export async function getList(params: ListParams) {
  const where: any = {}

  if (params.keyword) {
    where.OR = [
      { name: { contains: params.keyword } },
      { code: { contains: params.keyword } },
    ]
  }
  if (params.dimALevel1) where.dimALevel1 = params.dimALevel1
  if (params.dimB) where.dimB = params.dimB
  if (params.dimC) where.dimCName = params.dimC
  if (params.dimD) where.dimD = params.dimD

  const [data, total] = await Promise.all([
    db.enterprise.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: { createdAt: 'desc' },
    }),
    db.enterprise.count({ where }),
  ])

  return { data: data.map(toItem), total }
}

// ============================================
// 详情
// ============================================
export async function getDetail(id: number) {
  const e = await db.enterprise.findUnique({ where: { id } })
  if (!e) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })
  return toItem(e)
}

// ============================================
// 新增
// ============================================
export async function create(form: any) {
  const code = `QY${Date.now()}`
  const e = await db.enterprise.create({
    data: {
      name: form.name,
      code,
      dimALevel1: form.dimA?.level1 || '',
      dimALevel2: form.dimA?.level2 || '',
      dimALevel3: form.dimA?.level3 || '',
      dimB: form.dimB || '',
      dimCCode: typeof form.dimC === 'string' ? form.dimC : form.dimC?.code || '',
      dimCName: typeof form.dimC === 'string' ? '' : form.dimC?.name || '',
      dimD: form.dimD || '',
      region: form.region || '',
      contactName: form.contactName || '',
      contactPhone: form.contactPhone || '',
      tags: JSON.stringify(parseTags(form.tags)),
      validFrom: form.validFrom || '',
      validTo: form.validTo || '',
      parentId: parseInt(form.parentId) || 0,
      address: form.address || '',
      remark: form.remark || '',
      logo: form.logo || '',
      status: 1,
      creatorName: form.creatorName || '当前用户',
    },
  })
  return toItem(e)
}

// ============================================
// 更新
// ============================================
export async function update(id: number, form: any) {
  const existing = await db.enterprise.findUnique({ where: { id } })
  if (!existing) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  const data: any = {}
  if (form.name !== undefined) data.name = form.name
  if (form.contactName !== undefined) data.contactName = form.contactName
  if (form.contactPhone !== undefined) data.contactPhone = form.contactPhone
  if (form.region !== undefined) data.region = form.region
  if (form.address !== undefined) data.address = form.address
  if (form.remark !== undefined) data.remark = form.remark
  if (form.dimA !== undefined) {
    data.dimALevel1 = form.dimA.level1 || ''
    data.dimALevel2 = form.dimA.level2 || ''
    data.dimALevel3 = form.dimA.level3 || ''
  }
  if (form.dimB !== undefined) data.dimB = form.dimB
  if (form.dimC !== undefined) {
    if (typeof form.dimC === 'string') {
      data.dimCCode = form.dimC
    } else {
      data.dimCCode = form.dimC.code || ''
      data.dimCName = form.dimC.name || ''
    }
  }
  if (form.dimD !== undefined) data.dimD = form.dimD
  if (form.tags !== undefined) data.tags = JSON.stringify(parseTags(form.tags))
  if (form.validFrom !== undefined) data.validFrom = form.validFrom
  if (form.validTo !== undefined) data.validTo = form.validTo
  if (form.parentId !== undefined) data.parentId = parseInt(form.parentId) || 0

  const e = await db.enterprise.update({ where: { id }, data })
  return toItem(e)
}

// ============================================
// 锁定/解锁
// ============================================
export async function toggleLock(id: number) {
  const e = await db.enterprise.findUnique({ where: { id } })
  if (!e) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  const newStatus = e.status === 1 ? 0 : 1
  await db.enterprise.update({ where: { id }, data: { status: newStatus } })
  return toItem(await db.enterprise.findUnique({ where: { id } })!)
}

// ============================================
// 延期
// ============================================
export async function extend(id: number, validTo: string) {
  const e = await db.enterprise.findUnique({ where: { id } })
  if (!e) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  await db.enterprise.update({ where: { id }, data: { validTo, status: 1 } })
  return toItem(await db.enterprise.findUnique({ where: { id } })!)
}

// ============================================
// 批量删除
// ============================================
export async function batchDelete(ids: number[]) {
  await db.enterprise.deleteMany({ where: { id: { in: ids } } })
}

// ============================================
// 搜索（用于关联选择器）
// ============================================
export async function search(keyword: string) {
  const list = await db.enterprise.findMany({
    where: {
      OR: [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ],
    },
    take: 50,
    orderBy: { name: 'asc' },
  })
  return list.map(toItem)
}

// ============================================
// 下级管理
// ============================================
export async function getSubordinates(enterpriseId: number, params: { keyword?: string; page: number; size: number }) {
  const where: any = { type: 'subordinate', enterpriseId }
  if (params.keyword) {
    where.OR = [
      { enterpriseName: { contains: params.keyword } },
      { relatedName: { contains: params.keyword } },
    ]
  }

  const [data, total] = await Promise.all([
    db.enterpriseRelation.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: { relatedAt: 'desc' },
    }),
    db.enterpriseRelation.count({ where }),
  ])

  return {
    data: data.map(r => ({
      id: String(r.id),
      enterpriseId: String(r.relatedId),
      enterpriseName: r.relatedName,
      dimALevel1: r.dimALevel1,
      tags: safeJsonParse(r.tags, []),
      relatedAt: formatDate(r.relatedAt),
      operatorName: r.operatorName,
    })),
    total,
  }
}

export async function addSubordinates(enterpriseId: number, subordinateIds: number[]) {
  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId } })
  if (!enterprise) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  for (const subId of subordinateIds) {
    const sub = await db.enterprise.findUnique({ where: { id: subId } })
    if (!sub) continue

    await db.enterpriseRelation.upsert({
      where: { id: 0 }, // will create new since 0 doesn't exist
      update: {},
      create: {
        type: 'subordinate',
        enterpriseId,
        enterpriseName: enterprise.name,
        relatedId: subId,
        relatedName: sub.name,
        dimALevel1: sub.dimALevel1,
        operatorName: '当前用户',
      },
    })
  }
}

export async function removeSubordinates(_enterpriseId: number, relationIds: number[]) {
  await db.enterpriseRelation.deleteMany({ where: { id: { in: relationIds } } })
}

// ============================================
// 相关方管理
// ============================================
export async function getPartners(enterpriseId: number, params: { keyword?: string; tag?: string; page: number; size: number }) {
  const where: any = { type: 'partner', enterpriseId }
  if (params.keyword) {
    where.OR = [
      { enterpriseName: { contains: params.keyword } },
      { relatedName: { contains: params.keyword } },
    ]
  }

  const [data, total] = await Promise.all([
    db.enterpriseRelation.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: { relatedAt: 'desc' },
    }),
    db.enterpriseRelation.count({ where }),
  ])

  return {
    data: data.map(r => ({
      id: String(r.id),
      enterpriseId: String(r.relatedId),
      enterpriseName: r.relatedName,
      tags: safeJsonParse(r.tags, []),
      contactName: r.contactName,
      contactPhone: r.contactPhone,
      relatedAt: formatDate(r.relatedAt),
      operatorName: r.operatorName,
      authUnits: safeJsonParse(r.authUnits, []),
      allowOperation: r.allowOperation,
    })),
    total,
  }
}

export async function addPartners(enterpriseId: number, partnerIds: number[]) {
  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId } })
  if (!enterprise) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  for (const pId of partnerIds) {
    const partner = await db.enterprise.findUnique({ where: { id: pId } })
    if (!partner) continue

    await db.enterpriseRelation.upsert({
      where: { id: 0 },
      update: {},
      create: {
        type: 'partner',
        enterpriseId,
        enterpriseName: enterprise.name,
        relatedId: pId,
        relatedName: partner.name,
        dimALevel1: partner.dimALevel1,
        contactName: partner.contactName,
        contactPhone: partner.contactPhone,
        operatorName: '当前用户',
      },
    })
  }
}

export async function removePartners(_enterpriseId: number, relationIds: number[]) {
  await db.enterpriseRelation.deleteMany({ where: { id: { in: relationIds } } })
}

export async function savePartnerAuth(relationId: number, data: { authUnits: string[]; allowOperation: boolean }) {
  const r = await db.enterpriseRelation.update({
    where: { id: relationId },
    data: {
      authUnits: JSON.stringify(data.authUnits),
      allowOperation: data.allowOperation,
    },
  })
  return {
    id: String(r.id),
    enterpriseId: String(r.relatedId),
    enterpriseName: r.relatedName,
    tags: safeJsonParse(r.tags, []),
    contactName: r.contactName,
    contactPhone: r.contactPhone,
    relatedAt: formatDate(r.relatedAt),
    operatorName: r.operatorName,
    authUnits: safeJsonParse(r.authUnits, []),
    allowOperation: r.allowOperation,
  }
}

// ============================================
// 操作日志
// ============================================
export async function getOperationLogs(_enterpriseId: number, _params: { page: number; size: number }) {
  // 简化版：返回空，后续实现
  return { data: [], total: 0 }
}

// ============================================
// 二维码
// ============================================
export async function getQrcode(_id: number) {
  return { url: '' }
}

export async function regenerateQrcode(_id: number) {
  return { url: '' }
}

// ============================================
// 字典
// ============================================
const DIM_A_OPTIONS = [
  { value: 'supervisor', label: '监管方', children: [
    { value: 'fire_rescue', label: '消防救援机构' },
    { value: 'emergency_mgmt', label: '应急管理部门' },
    { value: 'local_gov', label: '属地政府' },
    { value: 'industry_supervisor', label: '行业主管部门' },
  ]},
  { value: 'manager', label: '管理方', children: [
    { value: 'space_manager', label: '空间管理方', children: [
      { value: 'property_mgr', label: '物业管理方' },
      { value: 'park_mgr', label: '园区管理方' },
      { value: 'market_mgr', label: '市场管理方' },
      { value: 'complex_mgr', label: '综合体管理方' },
      { value: 'commercial_street_mgr', label: '商业街管理方' },
    ]},
    { value: 'group_manager', label: '集团管理方' },
  ]},
  { value: 'social_unit', label: '社会单位' },
  { value: 'service_unit', label: '服务单位', children: [
    { value: 'fire_tech_service', label: '消防技术服务机构' },
  ]},
  { value: 'platform_operator', label: '平台运营方' },
]

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

const DIM_D_OPTIONS = [
  { value: '1', label: '人员密集场所' }, { value: '2', label: '高层建筑' },
  { value: '3', label: '地下建筑' }, { value: '4', label: '易燃易爆场所' },
  { value: '5', label: '文物古建筑' }, { value: '6', label: '大型商业综合体' },
  { value: '7', label: '工业建筑' }, { value: '8', label: '普通商铺' },
  { value: '9', label: '办公建筑' }, { value: '10', label: '交通建筑' },
  { value: '11', label: '医疗建筑' }, { value: '12', label: '教育建筑' },
  { value: '99', label: '其他' },
]

export async function getDimADict() { return { data: DIM_A_OPTIONS } }
export async function getDictB() { return { data: DIM_B_OPTIONS } }
export async function getDictC() { return { data: DIM_C_OPTIONS } }
export async function getDictD() { return { data: DIM_D_OPTIONS } }
export async function getModuleTree() { return { data: [] } }

// ============================================
// 辅助
// ============================================
function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags.filter(Boolean)
  if (typeof tags === 'string') return tags.split(',').map(s => s.trim()).filter(Boolean)
  return []
}
