import { Router } from 'express'
import * as ctrl from '../controllers/enterprise.controller.js'

const router = Router()

// 列表 + 搜索 + 字典
router.get('/list', ctrl.getList)
router.get('/search', ctrl.search)
router.get('/dict/a', ctrl.getDimA)
router.get('/dict/b', ctrl.getB)
router.get('/dict/c', ctrl.getC)
router.get('/dict/d', ctrl.getD)
router.get('/dict/module-tree', ctrl.getModuleTree)
router.get('/dict/relation-roles', ctrl.getRelationRoles)

// CRUD
router.get('/:id', ctrl.getDetail)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.post('/batch-delete', ctrl.batchDelete)
router.post('/:id/lock', ctrl.lock)
router.post('/:id/extend', ctrl.extend)

// 下级管理
router.get('/:id/subordinates', ctrl.getSubordinates)
router.post('/:id/subordinates', ctrl.addSubordinates)
router.delete('/:id/subordinates', ctrl.removeSubordinates)

// 相关方
router.get('/:id/partners', ctrl.getPartners)
router.post('/:id/partners', ctrl.addPartners)
router.delete('/:id/partners', ctrl.removePartners)
router.put('/partners/:relationId/auth', ctrl.savePartnerAuth)

// 其他
router.get('/:id/logs', ctrl.getLogs)
router.get('/:id/qrcode', ctrl.getQrcode)
router.post('/:id/qrcode/regenerate', ctrl.regenerateQrcode)

export { router as enterpriseRouter }
