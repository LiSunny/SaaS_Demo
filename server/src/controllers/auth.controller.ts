import type { Request, Response, NextFunction } from 'express'
import * as authService from '../services/auth.service.js'

/**
 * POST /api/auth/login
 * Body: { phone: string, password: string }
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, password } = req.body

    if (!phone || !password) {
      res.status(400).json({
        code: 400,
        message: '请输入手机号和密码',
        data: null,
      })
      return
    }

    const result = await authService.login({ phone, password })

    res.json({
      code: 0,
      message: '登录成功',
      data: result,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/auth/profile
 * 需登录
 */
export async function profile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getProfile(req.user!.id)

    res.json({
      code: 0,
      message: 'ok',
      data: user,
    })
  } catch (err) {
    next(err)
  }
}
