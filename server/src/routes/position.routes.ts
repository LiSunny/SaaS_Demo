import { Router } from 'express'
import * as ctrl from '../controllers/position.controller.js'
import { authRequired, requireSystemRole } from '../middleware/auth.js'

const router = Router()
router.use(authRequired)
router.use(requireSystemRole('platform-ops', 'platform-admin'))

router.get('/list', ctrl.getList)
router.get('/:id', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
router.put('/:id/permissions', ctrl.savePermissions)

export { router as positionRouter }
