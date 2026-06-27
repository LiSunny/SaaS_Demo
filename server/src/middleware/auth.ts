import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        name: string
        orgId: number
        orgName: string
        position: string
      }
    }
  }
}

/**
 * JWT 认证中间件
 * 从 Authorization header 提取 Bearer token，验证后挂载 req.user
 */
export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未登录，请先登录',
      data: null,
    })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: number
      name: string
      orgId: number
      orgName: string
      position: string
    }
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
      data: null,
    })
  }
}

/**
 * 可选认证：有 token 就解析，没有也放行（用于公开接口）
 */
export function authOptional(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: number
        name: string
        orgId: number
        orgName: string
        position: string
      }
      req.user = decoded
    } catch {
      // token 解析失败，不挂载 user
    }
  }

  next()
}
