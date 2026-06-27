import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/login — 登录（公开）
router.post('/login', ctrl.login)

// GET /api/auth/profile — 获取当前用户（需登录）
router.get('/profile', authRequired, ctrl.profile)

export { router as authRouter }
