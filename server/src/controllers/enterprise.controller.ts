import type { Request, Response, NextFunction } from 'express'
import * as svc from '../services/enterprise.service.js'

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 20, keyword, dimALevel1, dimB, dimC, dimD } = req.query
    const result = await svc.getList({
      page: +page, size: +size,
      keyword: keyword as string,
      dimALevel1: dimALevel1 as string,
      dimB: dimB as string,
      dimC: dimC as string,
      dimD: dimD as string,
    })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.getDetail(+req.params.id)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.create(req.body)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.update(+req.params.id, req.body)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function lock(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.toggleLock(+req.params.id)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function extend(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.extend(+req.params.id, req.body.validTo)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function batchDelete(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.batchDelete(req.body.ids.map(Number))
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await svc.search(req.query.keyword as string || '')
    res.json({ code: 0, message: 'ok', data: list })
  } catch (err) { next(err) }
}

// ===== 下级管理 =====
export async function getSubordinates(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 100, keyword } = req.query
    const result = await svc.getSubordinates(+req.params.id, {
      page: +page, size: +size, keyword: keyword as string,
    })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function addSubordinates(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.addSubordinates(+req.params.id, req.body.ids.map(Number))
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

export async function removeSubordinates(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.removeSubordinates(+req.params.id, req.body.ids.map(Number))
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

// ===== 相关方 =====
export async function getPartners(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 100, keyword, tag } = req.query
    const result = await svc.getPartners(+req.params.id, {
      page: +page, size: +size,
      keyword: keyword as string, tag: tag as string,
    })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function addPartners(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.addPartners(+req.params.id, req.body.ids.map(Number))
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

export async function removePartners(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.removePartners(+req.params.id, req.body.ids.map(Number))
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

export async function savePartnerAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.savePartnerAuth(+req.params.relationId, req.body)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

// ===== 操作日志 =====
export async function getLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 100 } = req.query
    const result = await svc.getOperationLogs(+req.params.id, { page: +page, size: +size })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

// ===== 二维码 =====
export async function getQrcode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getQrcode(+req.params.id)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function regenerateQrcode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.regenerateQrcode(+req.params.id)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

// ===== 字典 =====
export async function getDimA(_req: Request, res: Response, next: NextFunction) {
  try { res.json((await svc.getDimADict()).data) } catch (err) { next(err) }
}
export async function getB(_req: Request, res: Response, next: NextFunction) {
  try { res.json((await svc.getDictB()).data) } catch (err) { next(err) }
}
export async function getC(_req: Request, res: Response, next: NextFunction) {
  try { res.json((await svc.getDictC()).data) } catch (err) { next(err) }
}
export async function getD(_req: Request, res: Response, next: NextFunction) {
  try { res.json((await svc.getDictD()).data) } catch (err) { next(err) }
}
export async function getModuleTree(_req: Request, res: Response, next: NextFunction) {
  try { res.json((await svc.getModuleTree()).data) } catch (err) { next(err) }
}
