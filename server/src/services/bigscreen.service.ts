import db from '../config/db.js'

// ============================================================
// 可视化大屏 Service
// ============================================================

function formatDate(d: Date | string): string {
  if (!d) return ''
  return new Date(d).toISOString().replace('T', ' ').slice(0, 19)
}

function toItem(b: any) {
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    scenario: b.scenario || '',
    thumbnail: b.thumbnail || '',
    description: b.description || '',
    tags: JSON.parse(b.tags || '[]'),
    status: b.status,
    sortOrder: b.sortOrder ?? 0,
    enterpriseCount: b._count?.enterprises ?? b.enterpriseCount ?? 0,
    createdBy: b.createdBy,
    createdAt: formatDate(b.createdAt),
  }
}

function toEnterpriseItem(r: any) {
  return {
    id: r.id,
    enterpriseId: r.enterpriseId,
    enterpriseName: r.enterprise?.name || '',
    isDefault: r.isDefault,
    status: r.status,
    createdAt: formatDate(r.createdAt),
  }
}

// ===== 大屏列表（运营管理端） =====
export async function getList(params: { page: number; size: number; keyword?: string; type?: string; scenario?: string }) {
  const and: any[] = []
  if (params.keyword) {
    and.push({ name: { contains: params.keyword } })
  }
  if (params.type) {
    and.push({ type: params.type })
  }
  if (params.scenario) {
    and.push({ scenario: params.scenario })
  }
  const where: any = and.length > 0 ? { AND: and } : {}

  const [data, total] = await Promise.all([
    db.bigscreen.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { enterprises: { where: { status: 1 } } } } },
    }),
    db.bigscreen.count({ where }),
  ])

  return { data: data.map(toItem), total }
}

// ===== 大屏详情（含关联企业列表） =====
export async function getDetail(id: number) {
  const b = await db.bigscreen.findUnique({
    where: { id },
    include: { _count: { select: { enterprises: { where: { status: 1 } } } } },
  })
  if (!b) throw Object.assign(new Error('大屏不存在'), { statusCode: 404 })

  const enterpriseRelations = await db.bigscreenEnterprise.findMany({
    where: { bigscreenId: id, status: 1 },
    include: { enterprise: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return {
    ...toItem(b),
    enterprises: enterpriseRelations.map(toEnterpriseItem),
  }
}

// ===== 创建大屏 =====
export async function create(form: {
  name: string
  type?: string
  scenario?: string
  thumbnail?: string
  description?: string
  tags?: string[]
  sortOrder?: number
  createdBy?: number
}) {
  // 校验名称唯一
  const existing = await db.bigscreen.findUnique({ where: { name: form.name } })
  if (existing) {
    throw Object.assign(new Error('大屏名称已存在'), { statusCode: 409 })
  }

  const b = await db.bigscreen.create({
    data: {
      name: form.name,
      type: form.type || 'landing',
      scenario: form.scenario || '',
      thumbnail: form.thumbnail || '',
      description: form.description || '',
      tags: JSON.stringify(form.tags || []),
      sortOrder: form.sortOrder ?? 0,
      status: 1,
      createdBy: form.createdBy ?? 0,
    },
    include: { _count: { select: { enterprises: { where: { status: 1 } } } } },
  })

  return toItem(b)
}

// ===== 更新大屏 =====
export async function update(
  id: number,
  form: {
    name?: string
    type?: string
    scenario?: string
    thumbnail?: string
    description?: string
    tags?: string[]
    status?: number
    sortOrder?: number
  },
) {
  const b = await db.bigscreen.findUnique({ where: { id } })
  if (!b) throw Object.assign(new Error('大屏不存在'), { statusCode: 404 })

  // 如果改了名称，校验唯一
  if (form.name && form.name !== b.name) {
    const dup = await db.bigscreen.findUnique({ where: { name: form.name } })
    if (dup) throw Object.assign(new Error('大屏名称已存在'), { statusCode: 409 })
  }

  const data: any = {}
  if (form.name !== undefined) data.name = form.name
  if (form.type !== undefined) data.type = form.type
  if (form.scenario !== undefined) data.scenario = form.scenario
  if (form.thumbnail !== undefined) data.thumbnail = form.thumbnail
  if (form.description !== undefined) data.description = form.description
  if (form.tags !== undefined) data.tags = JSON.stringify(form.tags)
  if (form.status !== undefined) data.status = form.status
  if (form.sortOrder !== undefined) data.sortOrder = form.sortOrder

  const updated = await db.bigscreen.update({
    where: { id },
    data,
    include: { _count: { select: { enterprises: { where: { status: 1 } } } } },
  })

  return toItem(updated)
}

// ===== 删除大屏（级联清理 BigscreenEnterprise） =====
export async function remove(id: number) {
  const b = await db.bigscreen.findUnique({ where: { id } })
  if (!b) throw Object.assign(new Error('大屏不存在'), { statusCode: 404 })

  await db.bigscreen.delete({ where: { id } })
}

// ===== 大屏已关联企业列表 =====
export async function getEnterprises(bigscreenId: number) {
  const b = await db.bigscreen.findUnique({ where: { id: bigscreenId } })
  if (!b) throw Object.assign(new Error('大屏不存在'), { statusCode: 404 })

  const relations = await db.bigscreenEnterprise.findMany({
    where: { bigscreenId, status: 1 },
    include: { enterprise: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return relations.map(toEnterpriseItem)
}

// ===== 关联企业 =====
export async function addEnterprise(
  bigscreenId: number,
  form: { enterpriseId: number; isDefault?: boolean },
) {
  const enterpriseId = +form.enterpriseId

  // 校验大屏存在
  const b = await db.bigscreen.findUnique({ where: { id: bigscreenId }, select: { id: true, name: true } })
  if (!b) throw Object.assign(new Error('大屏不存在'), { statusCode: 404 })

  // 校验企业存在
  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId }, select: { id: true, name: true } })
  if (!enterprise) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  // 检查是否已关联
  const existing = await db.bigscreenEnterprise.findUnique({
    where: { bigscreenId_enterpriseId: { bigscreenId, enterpriseId } },
  })
  if (existing) {
    // 如果已存在但被软删除，恢复
    if (existing.status === 0) {
      const restored = await db.bigscreenEnterprise.update({
        where: { id: existing.id },
        data: { status: 1, isDefault: form.isDefault ?? existing.isDefault },
        include: { enterprise: { select: { id: true, name: true } } },
      })
      return toEnterpriseItem(restored)
    }
    throw Object.assign(new Error('该大屏已关联此企业'), { statusCode: 409 })
  }

  // 若设为默认，先取消该企业其他大屏的默认标记
  if (form.isDefault) {
    await db.bigscreenEnterprise.updateMany({
      where: { enterpriseId, isDefault: true },
      data: { isDefault: false },
    })
  }

  const relation = await db.bigscreenEnterprise.create({
    data: {
      bigscreenId,
      enterpriseId,
      isDefault: form.isDefault ?? false,
      status: 1,
    },
    include: { enterprise: { select: { id: true, name: true } } },
  })

  return toEnterpriseItem(relation)
}

// ===== 更新关联（设置/取消默认） =====
export async function updateEnterprise(
  bigscreenId: number,
  enterpriseId: number,
  form: { isDefault?: boolean },
) {
  const relation = await db.bigscreenEnterprise.findUnique({
    where: { bigscreenId_enterpriseId: { bigscreenId, enterpriseId: +enterpriseId } },
  })
  if (!relation) throw Object.assign(new Error('关联不存在'), { statusCode: 404 })

  // 若设为默认，先取消该企业其他大屏的默认标记
  if (form.isDefault) {
    await db.bigscreenEnterprise.updateMany({
      where: { enterpriseId: +enterpriseId, isDefault: true, id: { not: relation.id } },
      data: { isDefault: false },
    })
  }

  const data: any = {}
  if (form.isDefault !== undefined) data.isDefault = form.isDefault

  const updated = await db.bigscreenEnterprise.update({
    where: { id: relation.id },
    data,
    include: { enterprise: { select: { id: true, name: true } } },
  })

  return toEnterpriseItem(updated)
}

// ===== 移除关联（软删除） =====
export async function removeEnterprise(bigscreenId: number, enterpriseId: number) {
  const relation = await db.bigscreenEnterprise.findUnique({
    where: { bigscreenId_enterpriseId: { bigscreenId, enterpriseId: +enterpriseId } },
  })
  if (!relation) throw Object.assign(new Error('关联不存在'), { statusCode: 404 })

  await db.bigscreenEnterprise.update({
    where: { id: relation.id },
    data: { status: 0, isDefault: false },
  })
}

// ===== 企业端：获取当前用户所属企业的大屏列表 =====
export async function getUserBigscreens(userId: number) {
  // 获取用户关联的有效企业
  const userEnterprises = await db.userEnterprise.findMany({
    where: { userId, status: 1 },
    select: { enterpriseId: true },
  })

  if (userEnterprises.length === 0) return []

  const enterpriseIds = userEnterprises.map(ue => ue.enterpriseId)

  // 查询这些企业关联的启用大屏
  const relations = await db.bigscreenEnterprise.findMany({
    where: {
      enterpriseId: { in: enterpriseIds },
      status: 1,
      bigscreen: { status: 1 },
    },
    include: {
      bigscreen: true,
      enterprise: { select: { id: true, name: true } },
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return relations.map(r => ({
    ...toItem(r.bigscreen),
    enterpriseId: r.enterpriseId,
    enterpriseName: r.enterprise.name,
    isDefault: r.isDefault,
    relationId: r.id,
  }))
}

// ===== 企业端：获取默认大屏 =====
export async function getUserDefaultBigscreen(userId: number) {
  const userEnterprises = await db.userEnterprise.findMany({
    where: { userId, status: 1 },
    select: { enterpriseId: true },
  })

  if (userEnterprises.length === 0) return null

  const enterpriseIds = userEnterprises.map(ue => ue.enterpriseId)

  const relation = await db.bigscreenEnterprise.findFirst({
    where: {
      enterpriseId: { in: enterpriseIds },
      status: 1,
      isDefault: true,
      bigscreen: { status: 1 },
    },
    include: { bigscreen: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!relation) return null

  return toItem(relation.bigscreen)
}
