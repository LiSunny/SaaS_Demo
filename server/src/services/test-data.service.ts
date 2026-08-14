/**
 * test-data.service.ts — 测试数据管理（告警/隐患/设备）
 * 用途：为 Agent 数据链提供可见可改的测试数据，不参与业务权限
 */

import db from '../config/db.js'

// ===== 通用分页 =====
interface PageParams {
  page?: number
  size?: number
  keyword?: string
  enterpriseId?: number
  status?: string
}

function pageSkip(p: PageParams) {
  const page = +(p.page || 1)
  const size = +(p.size || 20)
  return { page, size, skip: (page - 1) * size }
}

// ============================================================
// 企业列表（下拉用）
// ============================================================
export async function getEnterprises() {
  const list = await db.enterprise.findMany({
    where: { deletedAt: null },
    orderBy: { id: 'asc' },
    select: { id: true, name: true, groups: true },
  })
  return list.map((e: any) => ({ id: e.id, name: e.name, groups: JSON.parse(e.groups || '[]') }))
}

// ============================================================
// 告警
// ============================================================
export async function getAlarms(p: PageParams) {
  const { page, size, skip } = pageSkip(p)
  const where: any = {}
  if (p.keyword) where.point = { contains: p.keyword }
  if (p.enterpriseId) where.enterpriseId = p.enterpriseId
  if (p.status) where.status = p.status

  const [data, total] = await Promise.all([
    db.alarm.findMany({
      where,
      include: { enterprise: { select: { id: true, name: true } } },
      orderBy: { occurredAt: 'desc' },
      skip,
      take: size,
    }),
    db.alarm.count({ where }),
  ])
  return {
    data: data.map((a: any) => ({
      ...a,
      enterpriseName: a.enterprise?.name || '',
      enterprise: undefined,
    })),
    total,
  }
}

/** 告警录入：点位必填；设备未指定时自动挂该企业第一个设备（没有则自动创建） */
export async function createAlarm(form: {
  point: string
  type: string
  level: string
  status?: string
  occurredAt: string
  enterpriseId: number
  deviceId?: number
}) {
  let deviceId = form.deviceId
  if (!deviceId) {
    let d = await db.device.findFirst({ where: { enterpriseId: form.enterpriseId } })
    if (!d) {
      d = await db.device.create({
        data: { name: `自动-${form.point}`, type: '手动', status: '在线', enterpriseId: form.enterpriseId },
      })
    }
    deviceId = d.id
  }
  return db.alarm.create({
    data: {
      point: form.point,
      type: form.type,
      level: form.level,
      status: form.status || '未处理',
      occurredAt: new Date(form.occurredAt),
      enterpriseId: form.enterpriseId,
      deviceId,
    },
  })
}

export async function updateAlarm(id: number, form: Partial<{
  point: string; type: string; level: string; status: string; occurredAt: string
}>) {
  const data: any = { ...form }
  if (form.occurredAt) data.occurredAt = new Date(form.occurredAt)
  return db.alarm.update({ where: { id }, data })
}

export async function removeAlarm(id: number) {
  return db.alarm.delete({ where: { id } })
}

// ============================================================
// 隐患
// ============================================================
export async function getHazards(p: PageParams) {
  const { page, size, skip } = pageSkip(p)
  const where: any = {}
  if (p.keyword) where.location = { contains: p.keyword }
  if (p.enterpriseId) where.enterpriseId = p.enterpriseId
  if (p.status) where.status = p.status

  const [data, total] = await Promise.all([
    db.hazard.findMany({
      where,
      include: { enterprise: { select: { id: true, name: true } } },
      orderBy: { foundAt: 'desc' },
      skip,
      take: size,
    }),
    db.hazard.count({ where }),
  ])
  return {
    data: data.map((h: any) => ({ ...h, enterpriseName: h.enterprise?.name || '', enterprise: undefined })),
    total,
  }
}

export async function createHazard(form: {
  location: string
  category: string
  level: string
  status?: string
  foundAt: string
  description?: string
  enterpriseId: number
}) {
  return db.hazard.create({
    data: {
      location: form.location,
      category: form.category,
      level: form.level,
      status: form.status || '未整改',
      foundAt: new Date(form.foundAt),
      description: form.description || '',
      enterpriseId: form.enterpriseId,
    },
  })
}

export async function updateHazard(id: number, form: Partial<{
  location: string; category: string; level: string; status: string; foundAt: string; description: string
}>) {
  const data: any = { ...form }
  if (form.foundAt) data.foundAt = new Date(form.foundAt)
  return db.hazard.update({ where: { id }, data })
}

export async function removeHazard(id: number) {
  return db.hazard.delete({ where: { id } })
}

// ============================================================
// 设备
// ============================================================
export async function getDevices(p: PageParams) {
  const { page, size, skip } = pageSkip(p)
  const where: any = {}
  if (p.keyword) where.name = { contains: p.keyword }
  if (p.enterpriseId) where.enterpriseId = p.enterpriseId
  if (p.status) where.status = p.status

  const [data, total] = await Promise.all([
    db.device.findMany({
      where,
      include: { enterprise: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: size,
    }),
    db.device.count({ where }),
  ])
  return {
    data: data.map((d: any) => ({ ...d, enterpriseName: d.enterprise?.name || '', enterprise: undefined })),
    total,
  }
}

export async function createDevice(form: {
  name: string
  type: string
  status?: string
  location?: string
  enterpriseId: number
}) {
  return db.device.create({
    data: {
      name: form.name,
      type: form.type,
      status: form.status || '在线',
      location: form.location || '',
      enterpriseId: form.enterpriseId,
    },
  })
}

export async function updateDevice(id: number, form: Partial<{
  name: string; type: string; status: string; location: string
}>) {
  return db.device.update({ where: { id }, data: { ...form } })
}

export async function removeDevice(id: number) {
  return db.device.delete({ where: { id } })
}
