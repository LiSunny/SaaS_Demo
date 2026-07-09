import type { Request, Response, NextFunction } from 'express'
import * as svc from '../services/position.service.js'

// ===== 企业级岗位管理 Controller =====
// URL 前缀: /api/enterprise/:id/positions
// 权限: authRequired → requireEnterpriseRole('org-admin')
// 注意: req.params.id 是企业 ID（来自父路由 :id），req.params.positionId 是岗位 ID

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const enterpriseId = +req.params.id
    const { page = 1, size = 20, keyword } = req.query
    const result = await svc.getList({
      page: +page, size: +size,
      keyword: keyword as string,
      enterpriseId, // 过滤：系统级 + 本企业自定义岗位
    })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const enterpriseId = +req.params.id
    const positionId = +req.params.positionId
    const result = await svc.getDetail(positionId)
    if (result.enterpriseId !== null && result.enterpriseId !== enterpriseId) {
      res.status(403).json({ code: 403, message: '无权访问该岗位', data: null })
      return
    }
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const enterpriseId = +req.params.id
    const { name, key, description } = req.body
    if (!name || !key) {
      res.status(400).json({ code: 400, message: '岗位名称和 Key 不能为空', data: null })
      return
    }
    const result = await svc.create({ name, key, description, enterpriseId })
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const enterpriseId = +req.params.id
    const positionId = +req.params.positionId

    const existing = await svc.getDetail(positionId)
    if (existing.enterpriseId === null) {
      res.status(403).json({ code: 403, message: '平台内置岗位不可修改', data: null })
      return
    }
    if (existing.enterpriseId !== enterpriseId) {
      res.status(403).json({ code: 403, message: '无权修改该岗位', data: null })
      return
    }

    const result = await svc.update(positionId, req.body)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const enterpriseId = +req.params.id
    const positionId = +req.params.positionId

    const existing = await svc.getDetail(positionId)
    if (existing.enterpriseId === null) {
      res.status(403).json({ code: 403, message: '平台内置岗位不可删除', data: null })
      return
    }
    if (existing.enterpriseId !== enterpriseId) {
      res.status(403).json({ code: 403, message: '无权删除该岗位', data: null })
      return
    }

    await svc.deletePosition(positionId)
    res.json({ code: 0, message: 'ok', data: null })
  } catch (err) { next(err) }
}

export async function savePermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const enterpriseId = +req.params.id
    const positionId = +req.params.positionId

    const existing = await svc.getDetail(positionId)
    if (existing.enterpriseId !== null && existing.enterpriseId !== enterpriseId) {
      res.status(403).json({ code: 403, message: '无权配置该岗位权限', data: null })
      return
    }

    const result = await svc.savePermissions(positionId, req.body)
    res.json({ code: 0, message: 'ok', data: result })
  } catch (err) { next(err) }
}
