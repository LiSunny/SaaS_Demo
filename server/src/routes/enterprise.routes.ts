import { Router } from 'express'
import * as ctrl from '../controllers/enterprise.controller.js'
import { authRequired, requireSystemRole, requireEnterpriseRole } from '../middleware/auth.js'

const router = Router()

// 列表 + 搜索 + 字典（无需登录）
router.get('/list', ctrl.getList)
router.get('/search', ctrl.search)
router.get('/dict/a', ctrl.getDimA)
router.get('/dict/b', ctrl.getB)
router.get('/dict/c', ctrl.getC)
router.get('/dict/d', ctrl.getD)
router.get('/dict/module-tree', ctrl.getModuleTree)
router.get('/dict/relation-roles', ctrl.getRelationRoles)

// ===== 以下需要登录 =====
router.use(authRequired)

// M1 企业用户管理（系统角色 + 该企业管理员均可访问）
router.get('/:id/users', requireEnterpriseRole('org-admin'), ctrl.getMembers)
router.post('/:id/users', requireEnterpriseRole('org-admin'), ctrl.addMember)
router.put('/:id/users/:userId', requireEnterpriseRole('org-admin'), ctrl.updateMember)
router.delete('/:id/users/:userId', requireEnterpriseRole('org-admin'), ctrl.removeMember)

// ===== 以下需要运营管理权限 =====
router.use(requireSystemRole('platform-ops', 'platform-admin'))

// CRUD
router.get('/:id', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.post('/batch-delete', ctrl.batchDelete)
router.post('/:id/delete', ctrl.softDelete)
router.post('/:id/recover', ctrl.recover)
router.post('/:id/lock', ctrl.lock)
router.post('/:id/extend', ctrl.extend)

// 下级管理
router.get('/:id/subordinates', ctrl.getSubordinates)
router.post('/:id/subordinates', ctrl.addSubordinates)
router.delete('/:id/subordinates', ctrl.removeSubordinates)

// 相关方
router.get('/:id/partners', ctrl.getPartners)
router.post('/:id/partners', ctrl.addPartners)
router.put('/:id/partners/:relationId', ctrl.updatePartner)
router.delete('/:id/partners', ctrl.removePartners)
router.put('/partners/:relationId/auth', ctrl.savePartnerAuth)

// 其他
router.get('/:id/logs', ctrl.getLogs)
router.get('/:id/qrcode', ctrl.getQrcode)
router.post('/:id/qrcode/regenerate', ctrl.regenerateQrcode)

export { router as enterpriseRouter }
