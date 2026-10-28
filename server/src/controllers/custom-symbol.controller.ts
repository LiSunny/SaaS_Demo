import type { Request, Response, NextFunction } from 'express'
import * as svc from '../services/custom-symbol.service.js'

// ===== 自定义图元 CRUD =====

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getList(req.user!.id)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getDetail(+req.params.id)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.create(req.body, req.user?.id ?? 0)
    res.json({ code: 0, message: '创建成功', data })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.update(+req.params.id, req.body)
    res.json({ code: 0, message: '更新成功', data })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.remove(+req.params.id)
    res.json({ code: 0, message: '删除成功', data: null })
  } catch (err) { next(err) }
}
