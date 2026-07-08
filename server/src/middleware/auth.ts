import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import db from '../config/db.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        phone: string
        realName: string
        status: number
        systemRole: string | null
      }
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未登录，请先登录', data: null })
    return
  }

  try {
    req.user = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as any
    next()
  } catch {
    res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null })
  }
}

export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(authHeader.split(' ')[1], env.JWT_SECRET) as any } catch {}
  }
  next()
}

/**
 * 系统角色校验中间件
 * 仅当 req.user.systemRole 在允许列表中时才放行
 */
export function requireSystemRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.systemRole || !roles.includes(req.user.systemRole)) {
      res.status(403).json({ code: 403, message: '无权限', data: null })
      return
    }
    next()
  }
}

/**
 * 企业角色校验中间件
 * 系统角色用户（platform-ops / platform-admin）直接放行；
 * 普通用户需在指定企业（req.params.id）中拥有至少一个指定岗位。
 */
export function requireEnterpriseRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 系统角色用户直接放行
    if (req.user?.systemRole && ['platform-ops', 'platform-admin'].includes(req.user.systemRole)) {
      next()
      return
    }

    const enterpriseId = +req.params.id
    if (!enterpriseId) {
      res.status(400).json({ code: 400, message: '缺少企业 ID', data: null })
      return
    }

    const ue = await db.userEnterprise.findFirst({
      where: { userId: req.user!.id, enterpriseId, status: 1 },
    })
    if (!ue) {
      res.status(403).json({ code: 403, message: '无权限：不属于该企业', data: null })
      return
    }

    const positions: string[] = JSON.parse(ue.positions)
    const hasRole = positions.some(p => roles.includes(p.replace(/^[a-z]+:/, '')))
    if (!hasRole) {
      res.status(403).json({ code: 403, message: '无权限：没有所需岗位', data: null })
      return
    }

    next()
  }
}
