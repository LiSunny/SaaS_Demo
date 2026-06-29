import db from '../config/db.js'

const DEFAULT_PERMISSIONS = JSON.stringify({
  moduleAccess: [],
  dataOperations: {},
  managementOperations: [],
})

// ===== 数据转换 =====

function toItem(p: any) {
  return {
    id: p.id,
    name: p.name,
    key: p.key,
    description: p.description || '',
    userCount: p._userCount ?? 0,
    isBuiltin: p.isBuiltin === 1,
    createdAt: formatDate(p.createdAt),
  }
}

function toDetail(p: any) {
  return {
    ...toItem(p),
    permissions: parsePermissions(p.permissions),
  }
}

function parsePermissions(raw: string) {
  try {
    const parsed = JSON.parse(raw || '{}')
    return {
      moduleAccess: parsed.moduleAccess || [],
      dataOperations: parsed.dataOperations || {},
      managementOperations: parsed.managementOperations || [],
    }
  } catch {
    return { moduleAccess: [], dataOperations: {}, managementOperations: [] }
  }
}

function formatDate(d: Date | string): string {
  if (!d) return ''
  return new Date(d).toISOString().replace('T', ' ').slice(0, 19)
}

// ===== 列表 =====

export async function getList(params: { page: number; size: number; keyword?: string }) {
  const where: any = { isBuiltin: 1 }
  if (params.keyword) {
    where.OR = [
      { name: { contains: params.keyword } },
      { key: { contains: params.keyword } },
    ]
  }

  const [data, total] = await Promise.all([
    db.position.findMany({
      where,
      skip: (params.page - 1) * params.size,
      take: params.size,
      orderBy: { createdAt: 'asc' },
    }),
    db.position.count({ where }),
  ])

  // 手动计使用人数（岗位 key 存储在 UserEnterprise.positions JSON 字段中，非外键关联）
  const userCounts = await Promise.all(
    data.map(p =>
      db.userEnterprise.count({
        where: { status: 1, positions: { contains: `"${p.key}"` } },
      }),
    ),
  )
  data.forEach((p, i) => { (p as any)._userCount = userCounts[i] })

  return { data: data.map(toItem), total }
}

// ===== 详情 =====

export async function getDetail(id: number) {
  const p = await db.position.findUnique({ where: { id } })
  if (!p) throw Object.assign(new Error('岗位不存在'), { statusCode: 404 })
  return toDetail(p)
}

// ===== 新增 =====

export async function create(form: { name: string; key: string; description?: string }) {
  const key = form.key.replace(/^platform:/, '')

  const existing = await db.position.findUnique({ where: { key: `platform:${key}` } })
  if (existing) {
    throw Object.assign(new Error('岗位 Key 已存在'), { statusCode: 409 })
  }

  const p = await db.position.create({
    data: {
      name: form.name,
      key: `platform:${key}`,
      description: form.description || '',
      permissions: DEFAULT_PERMISSIONS,
      isBuiltin: 1,
      status: 1,
    },
  })
  return toItem(p)
}

// ===== 编辑 =====

export async function update(id: number, form: { name?: string; description?: string }) {
  const p = await db.position.findUnique({ where: { id } })
  if (!p) throw Object.assign(new Error('岗位不存在'), { statusCode: 404 })

  const data: any = {}
  if (form.name !== undefined) data.name = form.name
  if (form.description !== undefined) data.description = form.description

  const updated = await db.position.update({ where: { id }, data })
  return toItem(updated)
}

// ===== 删除 =====

export async function deletePosition(id: number) {
  const p = await db.position.findUnique({ where: { id } })
  if (!p) throw Object.assign(new Error('岗位不存在'), { statusCode: 404 })

  // 检查是否有用户使用此岗位
  const usedCount = await db.userEnterprise.count({
    where: { positions: { contains: `"${p.key}"` } },
  })
  if (usedCount > 0) {
    throw Object.assign(new Error('该岗位下有关联用户，无法删除'), { statusCode: 409 })
  }

  await db.position.delete({ where: { id } })
}

// ===== 保存权限 =====

export async function savePermissions(id: number, config: {
  moduleAccess: string[]
  dataOperations: Record<string, string[]>
  managementOperations: string[]
}) {
  const p = await db.position.findUnique({ where: { id } })
  if (!p) throw Object.assign(new Error('岗位不存在'), { statusCode: 404 })

  const updated = await db.position.update({
    where: { id },
    data: {
      permissions: JSON.stringify({
        moduleAccess: config.moduleAccess || [],
        dataOperations: config.dataOperations || {},
        managementOperations: config.managementOperations || [],
      }),
    },
  })
  return toDetail(updated)
}
