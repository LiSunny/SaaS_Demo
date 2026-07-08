import { Router } from 'express'
import * as ctrl from '../controllers/position.controller.js'
import { authRequired, requireSystemRole } from '../middleware/auth.js'

const router = Router()
router.use(authRequired)

// 列表查询（所有登录用户可访问，企业成员页需要展示岗位标签）
router.get('/list', ctrl.getList)

// ===== 以下需要系统角色 =====
router.use(requireSystemRole('platform-ops', 'platform-admin'))

router.get('/:id', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
router.put('/:id/permissions', ctrl.savePermissions)

export { router as positionRouter }
