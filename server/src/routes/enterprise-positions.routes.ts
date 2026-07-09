import { Router } from 'express'
import * as ctrl from '../controllers/enterprise-positions.controller.js'
import { authRequired, requireEnterpriseRole } from '../middleware/auth.js'

const router = Router({ mergeParams: true })
router.use(authRequired)
router.use(requireEnterpriseRole('org-admin'))

// 列表：系统级岗位 + 本企业自定义岗位
router.get('/list', ctrl.getList)

router.get('/:positionId', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:positionId', ctrl.update)
router.delete('/:positionId', ctrl.remove)
router.put('/:positionId/permissions', ctrl.savePermissions)

export { router as enterprisePositionRouter }
