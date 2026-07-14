import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { enterpriseRouter } from './enterprise.routes.js'
import { userRouter } from './user.routes.js'
import { positionRouter } from './position.routes.js'
import { enterprisePositionRouter } from './enterprise-positions.routes.js'
import { bigscreenAdminRouter, bigscreenUserRouter } from './bigscreen.routes.js'
import { uploadRouter } from './upload.routes.js'

const router = Router()

// ========== 高德地图代理 ==========
// JSAPI 安全模式代理（官方文档：https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode）
// 代理规则（仅需两条，顺序：具体路径优先）：
//   1. /_AMapService/v4/map/styles/* → webapi.amap.com/v4/map/styles/* （自定义地图服务，可选）
//   2. /_AMapService/*               → restapi.amap.com/*               （Web 服务 API，必须）
import * as amapCtrl from '../controllers/amap.controller.js'
router.all('/_AMapService/v4/map/styles/*', amapCtrl.mapStylesProxy)
router.all('/_AMapService/*', amapCtrl.generalProxy)

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

// ========== 企业级岗位管理（org-admin 视角，必须在 /api/enterprise 之前注册，否则会被前缀匹配拦截） ==========
router.use('/api/enterprise/:id/positions', enterprisePositionRouter)

// ========== 租户管理 ==========
router.use('/api/enterprise', enterpriseRouter)

// ========== 用户管理 ==========
router.use('/api/admin/users', userRouter)

// ========== 岗位管理 ==========
router.use('/api/admin/positions', positionRouter)

// ========== 文件上传 ==========
router.use('/api/upload', uploadRouter)

// ========== 大屏配置 ==========
router.use('/api/admin/bigscreens', bigscreenAdminRouter)
router.use('/api/user/bigscreens', bigscreenUserRouter)

// ========== AI Agent ==========
import { agentRouter } from './agent.routes.js'
router.use('/api/agent', agentRouter)

// ========== 模块路由（后续逐步添加） ==========
// import { workflowRouter } from './workflow.routes.js'
// import { workOrderRouter } from './work-order.routes.js'
// import { maintenanceRouter } from './maintenance.routes.js'

// router.use('/api/workflow', workflowRouter)
// router.use('/api/work-order', workOrderRouter)
// router.use('/api/maintenance', maintenanceRouter)

export { router as apiRouter }
