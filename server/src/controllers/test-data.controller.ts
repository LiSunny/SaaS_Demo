import * as svc from '../services/test-data.service.js'
import type { Request, Response, NextFunction } from 'express'

function wrap(fn: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try { await fn(req, res) } catch (err) { next(err) }
  }
}

function pageParams(q: any) {
  return {
    page: q.page ? +q.page : undefined,
    size: q.size ? +q.size : undefined,
    keyword: (q.keyword as string) || undefined,
    enterpriseId: q.enterpriseId ? +q.enterpriseId : undefined,
    status: (q.status as string) || undefined,
  }
}

// ===== 企业（下拉） =====
export const enterprises = wrap(async (_req, res) => {
  const data = await svc.getEnterprises()
  res.json({ code: 0, message: 'ok', data })
})

// ===== 告警 =====
export const getAlarms = wrap(async (req, res) => {
  const data = await svc.getAlarms(pageParams(req.query))
  res.json({ code: 0, message: 'ok', data })
})
export const createAlarm = wrap(async (req, res) => {
  const item = await svc.createAlarm(req.body)
  res.json({ code: 0, message: '创建成功', data: item })
})
export const updateAlarm = wrap(async (req, res) => {
  const item = await svc.updateAlarm(+req.params.id, req.body)
  res.json({ code: 0, message: '更新成功', data: item })
})
export const removeAlarm = wrap(async (req, res) => {
  await svc.removeAlarm(+req.params.id)
  res.json({ code: 0, message: '删除成功', data: null })
})

// ===== 隐患 =====
export const getHazards = wrap(async (req, res) => {
  const data = await svc.getHazards(pageParams(req.query))
  res.json({ code: 0, message: 'ok', data })
})
export const createHazard = wrap(async (req, res) => {
  const item = await svc.createHazard(req.body)
  res.json({ code: 0, message: '创建成功', data: item })
})
export const updateHazard = wrap(async (req, res) => {
  const item = await svc.updateHazard(+req.params.id, req.body)
  res.json({ code: 0, message: '更新成功', data: item })
})
export const removeHazard = wrap(async (req, res) => {
  await svc.removeHazard(+req.params.id)
  res.json({ code: 0, message: '删除成功', data: null })
})

// ===== 设备 =====
export const getDevices = wrap(async (req, res) => {
  const data = await svc.getDevices(pageParams(req.query))
  res.json({ code: 0, message: 'ok', data })
})
export const createDevice = wrap(async (req, res) => {
  const item = await svc.createDevice(req.body)
  res.json({ code: 0, message: '创建成功', data: item })
})
export const updateDevice = wrap(async (req, res) => {
  const item = await svc.updateDevice(+req.params.id, req.body)
  res.json({ code: 0, message: '更新成功', data: item })
})
export const removeDevice = wrap(async (req, res) => {
  await svc.removeDevice(+req.params.id)
  res.json({ code: 0, message: '删除成功', data: null })
})
