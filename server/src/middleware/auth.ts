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
