import type { Request, Response, NextFunction } from 'express'
import * as svc from '../services/position.service.js'

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 20, keyword, enterpriseId } = req.query
    const result = await svc.getList({
      page: +page, size: +size,
      keyword: keyword as string,
      enterpriseId: enterpriseId ? +enterpriseId : undefined,
    })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getDetail(+req.params.id)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, key, description, enterpriseId } = req.body
    if (!name || !key) {
      res.status(400).json({ code: 400, message: '岗位名称和 Key 不能为空', data: null })
      return
    }
    const result = await svc.create({ name, key, description, enterpriseId: enterpriseId || null })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.update(+req.params.id, req.body)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deletePosition(+req.params.id)
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

export async function savePermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.savePermissions(+req.params.id, req.body)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}
