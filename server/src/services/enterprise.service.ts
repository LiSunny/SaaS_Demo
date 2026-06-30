import db from '../config/db.js'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

// 关系角色中文映射
const ROLE_MAP: Record<string, string> = {
  my_supervisor: "我的监管方",
  "my_supervisor/fire_rescue": "我的监管方>消防救援机构",
  "my_supervisor/emergency_mgmt": "我的监管方>应急管理部门",
  "my_supervisor/local_gov": "我的监管方>属地政府（街道/社区等）",
  "my_supervisor/industry_regulator": "我的监管方>行业主管部门",
  my_manager: "我的管理方",
  "my_manager/space_manager": "我的管理方>空间管理方",
  "my_manager/space_manager/business_street": "我的管理方>空间管理方>商业街",
  "my_manager/space_manager/property": "我的管理方>空间管理方>物业",
  "my_manager/space_manager/park": "我的管理方>空间管理方>园区",
  "my_manager/space_manager/market": "我的管理方>空间管理方>市场",
  "my_manager/space_manager/complex": "我的管理方>空间管理方>综合体",
  "my_manager/group_manager": "我的管理方>集团管理方",
  social_unit: "社会单位",
  my_service_unit: "我的服务单位",
  "my_service_unit/fire_tech_service": "我的服务单位>消防技术服务机构",
  my_operator: "我的运营方",
  "my_operator/operation_manager": "我的运营方>运营管理方",
  my_service_provider: "我的服务商",
  my_customer: "我的客户",
  my_collaborator: "我的协作方",
};

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
    mapLng: e.mapLng || 0,
    mapLat: e.mapLat || 0,
    mapLocation: e.mapLng && e.mapLat ? `${e.mapLng},${e.mapLat}` : '',
    mapAddress: e.mapAddress || '',
    creatorName: e.creatorName,
    staffCount: e.staffCount,
    unitCount: e.unitCount,
    relCount: e.relCount,
    deletedAt: e.deletedAt ? formatDate(e.deletedAt) : '',
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
  status?: string
  includeDeleted?: boolean
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
  if (params.status !== undefined && params.status !== '') where.status = +params.status

  // 默认排除已删除企业
  if (!params.includeDeleted) {
    where.deletedAt = null
  }

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

  // 查找该企业的管理员账号（UserEnterprise 中岗位包含 org-admin 的第一个）
  const adminUE = await db.userEnterprise.findFirst({
    where: { enterpriseId: id, status: 1 },
    include: { user: true },
    orderBy: { joinedAt: 'asc' },
  })

  return {
    ...toItem(e),
    adminAccount: adminUE?.user ? {
      phone: adminUE.user.phone,
      name: adminUE.user.realName,
    } : null,
  }
}

// ============================================
// 新增（含自动初始化管理员 + 下级管理关联）
// ============================================
export async function create(form: any, _operator?: any) {
  const code = `QY${Date.now()}`

  // ① 创建企业记录
  const e = await db.enterprise.create({
    data: {
      name: form.name,
      code,
      dimALevel1: form.dimA?.level1 || '',
      dimALevel2: form.dimA?.level2 || '',
      dimALevel3: form.dimA?.level3 || '',
      dimB: form.dimB || '',
      dimCCode: typeof form.dimC === 'string' ? form.dimC : form.dimC?.code || '',
      dimCName: typeof form.dimC === 'string' ? resolveDimCName(form.dimC) : form.dimC?.name || '',
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
      // GIS 地图标注
      mapLng: parseFloat(form.mapLng) || 0,
      mapLat: parseFloat(form.mapLat) || 0,
      mapAddress: form.mapAddress || '',
    },
  })

  // ② 检索/新建 User（以联系人手机号）
  const phone = form.contactPhone?.trim()
  let user = phone ? await db.user.findUnique({ where: { phone } }) : null
  let isNewUser = false

  if (phone && !user) {
    const hashedPassword = await bcrypt.hash('admin123!@#', SALT_ROUNDS)
    user = await db.user.create({
      data: {
        phone,
        realName: form.contactName?.trim() || '',
        password: hashedPassword,
        status: 1,
      },
    })
    isNewUser = true
  }

  // ③ 写入 UserEnterprise（统一分配企业管理员岗位）
  if (user) {
    // 检查是否已有该企业的关联（避免重复）
    const existingUE = await db.userEnterprise.findFirst({
      where: { userId: user.id, enterpriseId: e.id },
    })
    if (!existingUE) {
      await db.userEnterprise.create({
        data: {
          userId: user.id,
          enterpriseId: e.id,
          positions: JSON.stringify(['platform:org-admin']),
          inviterName: form.creatorName || '平台运营方',
        },
      })
    }
  }

  // ④ 条件建立下级管理关联
  const parentId = parseInt(form.parentId) || 0
  if (parentId > 0) {
    const parent = await db.enterprise.findUnique({ where: { id: parentId } })
    if (parent) {
      // 校验：一企业一上级（该企业不能已被其他企业纳为下级）
      const existingSub = await db.enterpriseRelation.findFirst({
        where: { type: 'subordinate', relatedId: e.id },
      })
      if (existingSub) {
        throw Object.assign(
          new Error(`该企业已是「${existingSub.enterpriseName}」的下级，不可重复关联`),
          { statusCode: 409 },
        )
      }

      // 校验：环检测（上级不能间接是当前企业的下级）
      const hasCycle = await checkCycle(parentId, e.id)
      if (hasCycle) {
        throw Object.assign(
          new Error('上级企业选择不合法：所选上级间接是当前企业的下级，形成循环链'),
          { statusCode: 409 },
        )
      }

      await db.enterpriseRelation.create({
        data: {
          type: 'subordinate',
          enterpriseId: parentId,
          enterpriseName: parent.name,
          relatedId: e.id,
          relatedName: e.name,
          dimALevel1: e.dimALevel1,
          operatorName: form.creatorName || '当前用户',
        },
      })

      // 回写上级企业名称
      await db.enterprise.update({
        where: { id: e.id },
        data: { parentName: parent.name },
      })
    }
  }

  return {
    ...toItem(await db.enterprise.findUnique({ where: { id: e.id } })!),
    // 附带管理员账号信息（仅新建 User 时返回密码）
    adminAccount: user ? {
      phone: user.phone,
      name: user.realName,
      isNewUser,
      initialPassword: isNewUser ? 'admin123!@#' : undefined,
    } : null,
  }
}

/**
 * 环检测：检查 ancestorId 是否间接是 childId 的下级
 */
async function checkCycle(ancestorId: number, childId: number): Promise<boolean> {
  const visited = new Set<number>()
  let current = ancestorId
  while (current) {
    if (current === childId) return true
    if (visited.has(current)) return false // 安全阀
    visited.add(current)
    const ent = await db.enterprise.findUnique({ where: { id: current } })
    current = ent?.parentId || 0
  }
  return false
}

// ============================================
// 更新
// ============================================
export async function update(id: number, form: any, _operator?: any) {
  const existing = await db.enterprise.findUnique({ where: { id } })
  if (!existing) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })
  if (existing.deletedAt) throw Object.assign(new Error('企业已被删除，无法操作'), { statusCode: 409 })

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
      data.dimCName = resolveDimCName(form.dimC)
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
  // GIS 地图标注
  if (form.mapLng !== undefined) data.mapLng = parseFloat(form.mapLng) || 0
  if (form.mapLat !== undefined) data.mapLat = parseFloat(form.mapLat) || 0
  if (form.mapAddress !== undefined) data.mapAddress = form.mapAddress

  const e = await db.enterprise.update({ where: { id }, data })
  return toItem(e)
}

// ============================================
// 锁定/解锁
// ============================================
export async function toggleLock(id: number, _operator?: any) {
  const e = await db.enterprise.findUnique({ where: { id } })
  if (!e) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })
  if (e.deletedAt) throw Object.assign(new Error('企业已被删除，无法操作'), { statusCode: 409 })

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
  if (e.deletedAt) throw Object.assign(new Error('企业已被删除，无法操作'), { statusCode: 409 })

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
// 软删除
// ============================================
export async function softDelete(id: number, _operator?: any) {
  const e = await db.enterprise.findUnique({ where: { id } })
  if (!e) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })
  if (e.deletedAt) throw Object.assign(new Error('企业已被删除'), { statusCode: 409 })

  await db.enterprise.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  // 级联：停用该企业下所有用户-企业关联
  await db.userEnterprise.updateMany({
    where: { enterpriseId: id, status: 1 },
    data: { status: 0 },
  })

  // 级联：删除该企业作为任一方的所有关系记录
  await db.enterpriseRelation.deleteMany({
    where: {
      OR: [
        { enterpriseId: id },
        { relatedId: id },
      ],
    },
  })
}

// ============================================
// 恢复软删除
// ============================================
export async function recover(id: number, _operator?: any) {
  const e = await db.enterprise.findUnique({ where: { id } })
  if (!e) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })
  if (!e.deletedAt) throw Object.assign(new Error('企业未被删除'), { statusCode: 409 })

  await db.enterprise.update({
    where: { id },
    data: { deletedAt: null },
  })
}

// ============================================
// 搜索（用于关联选择器）
// ============================================
export async function search(keyword: string) {
  const list = await db.enterprise.findMany({
    where: {
      deletedAt: null,
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

export async function addSubordinates(enterpriseId: number, subordinateIds: number[], _operator?: any) {
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

export async function removeSubordinates(_enterpriseId: number, relationIds: number[], _operator?: any) {
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
      role: "my_manager",
      roleLabel: ROLE_MAP["my_manager"] || "我的管理方",
      allowOperation: r.allowOperation,
    })),
    total,
  }
}

export async function addPartner(enterpriseId: number, partnerId: number, role?: string, tags: string[] = [], _operator?: any) {
  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId } })
  if (!enterprise) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  const partner = await db.enterprise.findUnique({ where: { id: partnerId } })
  if (!partner) throw Object.assign(new Error('目标企业不存在'), { statusCode: 404 })

  // 同一企业只能关联一次
  const existing = await db.enterpriseRelation.findFirst({
    where: { type: "partner", enterpriseId, relatedId: partnerId },
  })
  if (existing) throw Object.assign(new Error("该企业已是相关方，不可重复关联"), { statusCode: 409 })


  await db.enterpriseRelation.create({
    data: {
      type: 'partner',
      enterpriseId,
      enterpriseName: enterprise.name,
      relatedId: partnerId,
      relatedName: partner.name,
      dimALevel1: partner.dimALevel1,
      contactName: partner.contactName,
      contactPhone: partner.contactPhone,
      operatorName: '当前用户',
    },
  })
}

export async function removePartners(_enterpriseId: number, relationIds: number[], _operator?: any) {
  await db.enterpriseRelation.deleteMany({ where: { id: { in: relationIds } } })
}

export async function savePartnerAuth(relationId: number, data: { authUnits: string[]; allowOperation: boolean }, _operator?: any) {
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
    role: "my_manager",
      roleLabel: ROLE_MAP["my_manager"] || "我的管理方",
      allowOperation: r.allowOperation,
  }
}

export async function updatePartner(enterpriseId: number, relationId: number, data: any, _operator?: any) {
  const r = await db.enterpriseRelation.findFirst({
    where: { id: relationId, enterpriseId, type: 'partner' },
  })
  if (!r) throw Object.assign(new Error('相关方关系不存在'), { statusCode: 404 })

  const updateData: any = {}
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
  if (data.contactName !== undefined) updateData.contactName = data.contactName
  if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone

  const updated = await db.enterpriseRelation.update({
    where: { id: relationId },
    data: updateData,
  })

  return {
    id: String(updated.id),
    enterpriseId: String(updated.relatedId),
    enterpriseName: updated.relatedName,
    tags: safeJsonParse(updated.tags, []),
    contactName: updated.contactName,
    contactPhone: updated.contactPhone,
    relatedAt: formatDate(updated.relatedAt),
    operatorName: updated.operatorName,
    authUnits: safeJsonParse(updated.authUnits, []),
    role: data.role || "my_manager",
    roleLabel: ROLE_MAP[data.role] || ROLE_MAP["my_manager"] || "我的管理方",
    allowOperation: updated.allowOperation,
  }
}

// ============================================
// M1 企业用户管理
// ============================================

function toMemberItem(ue: any) {
  return {
    id: ue.id,
    userId: ue.userId,
    phone: ue.user?.phone || '',
    realName: ue.user?.realName || '',
    positions: safeJsonParse(ue.positions, []),
    status: ue.status,
    joinedAt: formatDate(ue.joinedAt),
    inviterName: ue.inviterName,
    remark: ue.remark,
  }
}

export async function getMembers(enterpriseId: number, params: { page: number; size: number; keyword?: string; positionKey?: string }) {
  const where: any = { enterpriseId, status: 1 }
  if (params.keyword) {
    where.user = {
      OR: [
        { phone: { contains: params.keyword } },
        { realName: { contains: params.keyword } },
      ],
    }
  }
  if (params.positionKey) {
    where.positions = { contains: `"${params.positionKey}"` }
  }

  const [data, total] = await Promise.all([
    db.userEnterprise.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: { joinedAt: 'desc' },
      include: { user: true },
    }),
    db.userEnterprise.count({ where }),
  ])

  return { data: data.map(toMemberItem), total }
}

export async function addMember(enterpriseId: number, form: { phone: string; realName?: string; positions: string[]; inviterName?: string }) {
  // ① 检索/新建 User
  const phone = form.phone?.trim()
  if (!phone) throw Object.assign(new Error('手机号不能为空'), { statusCode: 400 })

  let user = await db.user.findUnique({ where: { phone } })
  if (!user) {
    if (!form.realName) {
      throw Object.assign(new Error('未找到该手机号对应的用户，请输入姓名创建'), { statusCode: 404 })
    }
    const hashedPassword = await bcrypt.hash('admin123!@#', SALT_ROUNDS)
    user = await db.user.create({
      data: {
        phone,
        realName: form.realName.trim(),
        password: hashedPassword,
        status: 1,
      },
    })
  }

  // ② 检查是否已在该企业（活跃状态）
  const existingActive = await db.userEnterprise.findFirst({
    where: { userId: user.id, enterpriseId, status: 1 },
  })
  if (existingActive) {
    throw Object.assign(new Error('该用户已在本企业中'), { statusCode: 409 })
  }

  // ③ 建立/恢复关联（处理软删除后重新加入的场景）
  const ue = await db.userEnterprise.upsert({
    where: { userId_enterpriseId: { userId: user.id, enterpriseId } },
    update: {
      status: 1,
      positions: JSON.stringify(form.positions || []),
      inviterName: form.inviterName || '',
    },
    create: {
      userId: user.id,
      enterpriseId,
      positions: JSON.stringify(form.positions || []),
      inviterName: form.inviterName || '',
    },
    include: { user: true },
  })

  return toMemberItem(ue)
}

export async function updateMember(enterpriseId: number, userId: number, form: { positions?: string[]; remark?: string }) {
  const ue = await db.userEnterprise.findFirst({
    where: { enterpriseId, userId, status: 1 },
  })
  if (!ue) throw Object.assign(new Error('该用户不在本企业中'), { statusCode: 404 })

  const data: any = {}
  if (form.positions !== undefined) data.positions = JSON.stringify(form.positions)
  if (form.remark !== undefined) data.remark = form.remark

  const updated = await db.userEnterprise.update({
    where: { id: ue.id },
    data,
    include: { user: true },
  })
  return toMemberItem(updated)
}

export async function removeMember(enterpriseId: number, userId: number, operatorId?: number) {
  // 不允许移除自己
  if (operatorId && operatorId === userId) {
    throw Object.assign(new Error('不能移除自己，请联系其他管理员操作'), { statusCode: 403 })
  }

  const ue = await db.userEnterprise.findFirst({
    where: { enterpriseId, userId, status: 1 },
  })
  if (!ue) throw Object.assign(new Error('该用户不在本企业中'), { statusCode: 404 })

  await db.userEnterprise.update({
    where: { id: ue.id },
    data: { status: 0 },
  })
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

const RELATION_ROLE_OPTIONS = [
  { value: 'my_supervisor', label: '我的监管方', description: '对方对我有监管/检查职能' },
  { value: 'my_manager', label: '我的管理方', description: '对方是我的上级管理单位' },
  { value: 'my_service_provider', label: '我的服务商', description: '对方为我提供服务' },
  { value: 'my_customer', label: '我的客户', description: '我向对方提供服务' },
  { value: 'my_collaborator', label: '我的协作方', description: '双方平等协作' },
]

export async function getRelationRoleDict() { return { data: RELATION_ROLE_OPTIONS } }

// ============================================
// 辅助
// ============================================
function resolveDimCName(code: string): string {
  return DIM_C_OPTIONS.find(o => o.value === code)?.label || ''
}

function parseTags(tags: any): string[] {
  if (Array.isArray(tags)) return tags.filter(Boolean)
  if (typeof tags === 'string') return tags.split(',').map(s => s.trim()).filter(Boolean)
  return []
}
