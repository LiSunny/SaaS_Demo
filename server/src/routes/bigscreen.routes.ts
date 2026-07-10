import { Router } from 'express'
import * as ctrl from '../controllers/bigscreen.controller.js'
import { authRequired, requireSystemRole } from '../middleware/auth.js'

// ===== 运营管理端路由（需要平台运营角色） =====
const adminRouter = Router()
adminRouter.use(authRequired)
adminRouter.use(requireSystemRole('platform-ops', 'platform-admin'))

// 大屏 CRUD
adminRouter.get('/', ctrl.getList)
adminRouter.get('/:id', ctrl.getDetail)
adminRouter.post('/', ctrl.create)
adminRouter.put('/:id', ctrl.update)
adminRouter.delete('/:id', ctrl.remove)

// 大屏关联企业管理
adminRouter.get('/:id/enterprises', ctrl.getEnterprises)
adminRouter.post('/:id/enterprises', ctrl.addEnterprise)
adminRouter.put('/:id/enterprises/:enterpriseId', ctrl.updateEnterprise)
adminRouter.delete('/:id/enterprises/:enterpriseId', ctrl.removeEnterprise)

// ===== 企业用户端路由（需要登录即可，从 JWT 推导企业） =====
const userRouter = Router()
userRouter.use(authRequired)

userRouter.get('/', ctrl.getUserBigscreens)
userRouter.get('/default', ctrl.getUserDefaultBigscreen)

export { adminRouter as bigscreenAdminRouter, userRouter as bigscreenUserRouter }
