import { Router } from 'express'
import * as ctrl from '../controllers/user.controller.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

router.get('/list', ctrl.getList)
router.get('/:id', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.post('/:id/toggle-status', ctrl.toggleStatus)
router.post('/:id/reset-password', ctrl.resetPassword)
router.get('/:id/enterprises', ctrl.getUserEnterprises)

export { router as userRouter }
