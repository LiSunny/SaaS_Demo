import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

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
