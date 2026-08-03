import db from '../config/db.js'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

function toItem(u: any) {
  return {
    id: u.id,
    phone: u.phone,
    realName: u.realName,
    email: u.email || '',
    status: u.status,
    systemRole: u.systemRole || null,
    enterpriseCount: u.systemRole ? 0 : (u._count?.enterprises ?? u.enterpriseCount ?? 0),
    createdAt: formatDate(u.createdAt),
    lastLoginAt: u.lastLoginAt ? formatDate(u.lastLoginAt) : null,
    lastLoginIp: u.lastLoginIp || null,
  }
}

function formatDate(d: Date | string): string {
  if (!d) return ''
  return new Date(d).toISOString().replace('T', ' ').slice(0, 19)
}

// ===== 列表 =====
export async function getList(params: { page: number; size: number; keyword?: string }) {
  const and: any[] = [{ deletedAt: null }]
  if (params.keyword) {
    and.push({
      OR: [
        { phone: { contains: params.keyword } },
        { realName: { contains: params.keyword } },
      ],
    })
  }
  const where: any = { AND: and }

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { enterprises: true } } },
    }),
    db.user.count({ where }),
  ])

  return { data: data.map(toItem), total }
}

// ===== 详情 =====
export async function getDetail(id: number) {
  const u = await db.user.findUnique({
    where: { id },
    include: { _count: { select: { enterprises: true } } },
  })
  if (!u) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })
  return toItem(u)
}

// ===== 按手机号查找用户（M1 企业用户管理用） =====
export async function lookupByPhone(phone: string) {
  const u = await db.user.findUnique({ where: { phone } })
  if (!u) return null
  return toItem(u)
}
export async function create(form: { phone: string; realName: string; password: string; systemRole?: string | null }) {
  const existing = await db.user.findUnique({ where: { phone: form.phone } })
  if (existing) {
    throw Object.assign(new Error('该手机号已被注册'), { statusCode: 409 })
  }

  const hashedPassword = await bcrypt.hash(form.password, SALT_ROUNDS)
  const u = await db.user.create({
    data: {
      phone: form.phone,
      realName: form.realName,
      password: hashedPassword,
      status: 1,
      systemRole: form.systemRole || null,
    },
    include: { _count: { select: { enterprises: true } } },
  })
  return toItem(u)
}

// ===== 编辑 =====
export async function update(
  id: number,
  form: { realName?: string; email?: string; systemRole?: string | null },
  operatorId?: number,
) {
  const u = await db.user.findUnique({ where: { id } })
  if (!u) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })

  // 不允许降级自己
  if (operatorId && operatorId === id && form.systemRole !== undefined) {
    if (!form.systemRole && u.systemRole) {
      throw Object.assign(new Error('不能移除自己的系统角色'), { statusCode: 403 })
    }
  }

  const data: any = {}
  if (form.realName !== undefined) data.realName = form.realName
  if (form.email !== undefined) data.email = form.email
  if (form.systemRole !== undefined) data.systemRole = form.systemRole || null

  const updated = await db.user.update({
    where: { id },
    data,
    include: { _count: { select: { enterprises: true } } },
  })
  return toItem(updated)
}

// ===== 停用/启用 =====
export async function toggleStatus(id: number) {
  const u = await db.user.findUnique({ where: { id } })
  if (!u) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })

  const newStatus = u.status === 1 ? 0 : 1
  const updated = await db.user.update({
    where: { id },
    data: { status: newStatus },
    include: { _count: { select: { enterprises: true } } },
  })
  return toItem(updated)
}

// ===== 重置密码 =====
export async function resetPassword(id: number) {
  const u = await db.user.findUnique({ where: { id } })
  if (!u) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })

  const newPassword = Math.random().toString(36).slice(-6)
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await db.user.update({ where: { id }, data: { password: hashedPassword } })

  return { password: newPassword }
}

// ===== 关联企业 =====
export async function getUserEnterprises(userId: number) {
  // 系统角色用户不展示企业关联
  const user = await db.user.findUnique({ where: { id: userId }, select: { systemRole: true } })
  if (user?.systemRole) return []

  const relations = await db.userEnterprise.findMany({
    where: { userId, status: 1 },
    include: { enterprise: true },
    orderBy: { joinedAt: 'desc' },
  })

  return relations.map(r => {
    let groups: string[] = []
    try { groups = JSON.parse(r.enterprise.groups || '[]') } catch { groups = [] }
    return {
      enterpriseId: r.enterpriseId,
      enterpriseName: r.enterprise.name,
      positions: JSON.parse(r.positions),
      joinedAt: formatDate(r.joinedAt),
      groups,
    }
  })
}

// ===== 添加用户关联企业 =====
export async function addUserEnterprise(userId: number, form: { enterpriseId: number; positions: string[] }) {
  const enterpriseId = +form.enterpriseId

  // 校验用户存在且非系统角色
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, systemRole: true } })
  if (!user) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })
  if (user.systemRole) throw Object.assign(new Error('系统角色用户不支持关联企业'), { statusCode: 400 })

  // 校验企业存在
  const enterprise = await db.enterprise.findUnique({ where: { id: enterpriseId }, select: { id: true, name: true } })
  if (!enterprise) throw Object.assign(new Error('企业不存在'), { statusCode: 404 })

  // 检查是否已关联
  const existing = await db.userEnterprise.findUnique({
    where: { userId_enterpriseId: { userId, enterpriseId } },
  })
  if (existing) {
    throw Object.assign(new Error('该用户已关联此企业'), { statusCode: 409 })
  }

  const relation = await db.userEnterprise.create({
    data: {
      userId,
      enterpriseId,
      positions: JSON.stringify(form.positions),
      status: 1,
    },
    include: { enterprise: true },
  })

  return {
    enterpriseId: relation.enterpriseId,
    enterpriseName: relation.enterprise.name,
    positions: JSON.parse(relation.positions),
    joinedAt: formatDate(relation.joinedAt),
  }
}

// ===== 删除用户（软删除） =====
export async function deleteUser(id: number, operatorId?: number) {
  const u = await db.user.findUnique({ where: { id } })
  if (!u) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })
  if (u.deletedAt) throw Object.assign(new Error('用户已被删除'), { statusCode: 400 })

  // 不允许删除自己
  if (operatorId && operatorId === id) {
    throw Object.assign(new Error('不能删除自己'), { statusCode: 403 })
  }

  await db.user.update({ where: { id }, data: { deletedAt: new Date() } })
}

// ===== 移除用户关联企业（软删除） =====
export async function removeUserEnterprise(userId: number, enterpriseId: number) {
  const relation = await db.userEnterprise.findUnique({
    where: { userId_enterpriseId: { userId, enterpriseId: +enterpriseId } },
  })
  if (!relation) throw Object.assign(new Error('关联不存在'), { statusCode: 404 })

  await db.userEnterprise.update({
    where: { id: relation.id },
    data: { status: 0 },
  })
}
