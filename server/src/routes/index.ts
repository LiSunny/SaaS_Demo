import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { enterpriseRouter } from './enterprise.routes.js'
import { userRouter } from './user.routes.js'

const router = Router()

// ========== 健康检查 ==========
router.get('/api/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    },
  })
})

// ========== 认证 ==========
router.use('/api/auth', authRouter)

// ========== 租户管理 ==========
router.use('/api/enterprise', enterpriseRouter)

// ========== 用户管理 ==========
router.use('/api/admin/users', userRouter)

// ========== 模块路由（后续逐步添加） ==========
// import { workflowRouter } from './workflow.routes.js'
// import { workOrderRouter } from './work-order.routes.js'
// import { maintenanceRouter } from './maintenance.routes.js'

// router.use('/api/workflow', workflowRouter)
// router.use('/api/work-order', workOrderRouter)
// router.use('/api/maintenance', maintenanceRouter)

export { router as apiRouter }
