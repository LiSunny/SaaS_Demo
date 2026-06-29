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
    enterpriseCount: u._count?.enterprises ?? u.enterpriseCount ?? 0,
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
  const where: any = {}
  if (params.keyword) {
    where.OR = [
      { phone: { contains: params.keyword } },
      { realName: { contains: params.keyword } },
    ]
  }

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
export async function create(form: { phone: string; realName: string; password: string }) {
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
    },
    include: { _count: { select: { enterprises: true } } },
  })
  return toItem(u)
}

// ===== 编辑 =====
export async function update(id: number, form: { realName?: string; email?: string }) {
  const u = await db.user.findUnique({ where: { id } })
  if (!u) throw Object.assign(new Error('用户不存在'), { statusCode: 404 })

  const data: any = {}
  if (form.realName !== undefined) data.realName = form.realName
  if (form.email !== undefined) data.email = form.email

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
  const relations = await db.userEnterprise.findMany({
    where: { userId, status: 1 },
    include: { enterprise: true },
    orderBy: { joinedAt: 'desc' },
  })

  return relations.map(r => ({
    enterpriseId: r.enterpriseId,
    enterpriseName: r.enterprise.name,
    positions: JSON.parse(r.positions),
    joinedAt: formatDate(r.joinedAt),
  }))
}
