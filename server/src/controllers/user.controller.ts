import type { Request, Response, NextFunction } from 'express'
import * as svc from '../services/user.service.js'

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 20, keyword } = req.query
    const result = await svc.getList({ page: +page, size: +size, keyword: keyword as string })
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
    const { phone, realName, password, systemRole } = req.body
    if (!phone || !realName || !password) {
      res.status(400).json({ code: 400, message: '手机号、姓名和密码不能为空', data: null })
      return
    }
    const item = await svc.create({ phone, realName, password, systemRole })
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.update(+req.params.id, req.body, req.user?.id)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.toggleStatus(+req.params.id)
    res.json({ code: 0, message: 'ok', data: item })
  } catch (err) { next(err) }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.resetPassword(+req.params.id)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function getUserEnterprises(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await svc.getUserEnterprises(+req.params.id)
    res.json({ code: 0, message: 'ok', data: list })
  } catch (err) { next(err) }
}

export async function lookupUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = req.query
    if (!phone) {
      res.status(400).json({ code: 400, message: '手机号不能为空', data: null })
      return
    }
    const user = await svc.lookupByPhone(phone as string)
    res.json({ code: 0, message: 'ok', data: user })
  } catch (err) { next(err) }
}

export async function getMyEnterprises(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await svc.getUserEnterprises(req.user!.id)
    res.json({ code: 0, message: 'ok', data: list })
  } catch (err) { next(err) }
}
