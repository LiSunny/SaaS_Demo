import { Router } from 'express'
import * as ctrl from '../controllers/user.controller.js'
import { authRequired, requireSystemRole } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

// ===== 所有已登录用户可访问 =====
router.get('/me/enterprises', ctrl.getMyEnterprises)
router.get('/lookup', ctrl.lookupUser)

// ===== 以下需要系统角色 =====
router.use(requireSystemRole('platform-ops', 'platform-admin'))

router.get('/list', ctrl.getList)
router.get('/:id', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.post('/:id/toggle-status', ctrl.toggleStatus)
router.post('/:id/reset-password', ctrl.resetPassword)
router.get('/:id/enterprises', ctrl.getUserEnterprises)

export { router as userRouter }
