import * as svc from '../services/bigscreen.service.js'
import { Request, Response, NextFunction } from 'express'

// ===== 大屏 CRUD（运营管理端） =====

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, size = 20, keyword, type, scenario } = req.query
    const result = await svc.getList({
      page: +page,
      size: +size,
      keyword: keyword as string | undefined,
      type: type as string | undefined,
      scenario: scenario as string | undefined,
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
    const form = {
      ...req.body,
      createdBy: req.user?.id ?? 0,
    }
    const item = await svc.create(form)
    res.json({ code: 0, message: '创建成功', data: item })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.update(+req.params.id, req.body)
    res.json({ code: 0, message: '更新成功', data: item })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.remove(+req.params.id)
    res.json({ code: 0, message: '删除成功', data: null })
  } catch (err) { next(err) }
}

// ===== 大屏关联企业管理 =====

export async function getEnterprises(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getEnterprises(+req.params.id)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function addEnterprise(req: Request, res: Response, next: NextFunction) {
  try {
    const { enterpriseId, isDefault } = req.body
    if (!enterpriseId) {
      res.status(400).json({ code: 400, message: '请选择企业', data: null })
      return
    }
    const item = await svc.addEnterprise(+req.params.id, { enterpriseId: +enterpriseId, isDefault })
    res.json({ code: 0, message: '关联成功', data: item })
  } catch (err) { next(err) }
}

export async function updateEnterprise(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svc.updateEnterprise(+req.params.id, +req.params.enterpriseId, req.body)
    res.json({ code: 0, message: '更新成功', data: item })
  } catch (err) { next(err) }
}

export async function removeEnterprise(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.removeEnterprise(+req.params.id, +req.params.enterpriseId)
    res.json({ code: 0, message: '已移除关联', data: null })
  } catch (err) { next(err) }
}

// ===== 企业端查询 =====

export async function getUserBigscreens(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getUserBigscreens(req.user!.id)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function getUserDefaultBigscreen(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getUserDefaultBigscreen(req.user!.id)
    if (!data) {
      res.status(204).send()
      return
    }
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}
