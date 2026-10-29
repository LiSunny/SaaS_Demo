import type { Request, Response, NextFunction } from 'express'
import * as svc from '../services/scene-config.service.js'

// ===== 组态画面 CRUD =====

export async function getList(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getList(req.user!.id, {
      name: req.query.name as string | undefined,
      status: req.query.status as string | undefined,
      systemKey: req.query.systemKey as string | undefined,
      page: Number(req.query.page ?? 1),
      size: Number(req.query.size ?? 20),
    })
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getDetail(req.user!.id, String(req.params.sceneId))
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function getOptions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.getOptions(req.user!.id)
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.create(req.user!.id, req.body)
    res.json({ code: 0, message: '创建成功', data })
  } catch (err) { next(err) }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.update(req.user!.id, String(req.params.sceneId), req.body)
    res.json({ code: 0, message: '更新成功', data })
  } catch (err) { next(err) }
}

export async function saveLayout(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.saveLayout(req.user!.id, String(req.params.sceneId), {
      nodes: req.body?.nodes,
      edges: req.body?.edges,
    })
    res.json({ code: 0, message: '保存成功', data })
  } catch (err) { next(err) }
}

export async function saveDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.saveDraft(req.user!.id, String(req.params.sceneId), req.body)
    res.json({ code: 0, message: '草稿已保存', data })
  } catch (err) { next(err) }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.toggleStatus(req.user!.id, String(req.params.sceneId))
    res.json({ code: 0, message: '状态已更新', data })
  } catch (err) { next(err) }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.remove(req.user!.id, String(req.params.sceneId))
    res.json({ code: 0, message: '删除成功', data: null })
  } catch (err) { next(err) }
}

// ===== 图元引用 =====

export async function findSymbolReferences(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.findSymbolReferences(req.user!.id, String(req.params.symbolId))
    res.json({ code: 0, message: 'ok', data })
  } catch (err) { next(err) }
}

export async function purgeSymbolReferences(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.purgeSymbolReferences(req.user!.id, String(req.params.symbolId))
    res.json({ code: 0, message: '引用已清理', data })
  } catch (err) { next(err) }
}

// ===== 本地历史数据导入 =====

export async function importLocal(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await svc.importLocal(req.user!.id, req.body)
    res.json({ code: 0, message: '导入完成', data })
  } catch (err) { next(err) }
}
