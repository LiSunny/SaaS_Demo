/**
 * agent.routes.ts — Agent API 路由
 */
import { Router } from 'express'
import * as ctrl from '../controllers/agent.controller.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// POST /api/agent/chat — 发送消息，SSE 流式返回
router.post('/chat', authRequired, ctrl.chat)

export { router as agentRouter }
