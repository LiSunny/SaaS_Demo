import { Router } from 'express'
import * as ctrl from '../controllers/test-data.controller.js'

// ===== 测试数据管理（免登录，Agent 数据链测试工具；仅本地 demo 环境开放） =====
const router = Router()

// 企业下拉
router.get('/enterprises', ctrl.enterprises)

// 告警
router.get('/alarms', ctrl.getAlarms)
router.post('/alarms', ctrl.createAlarm)
router.put('/alarms/:id', ctrl.updateAlarm)
router.delete('/alarms/:id', ctrl.removeAlarm)

// 隐患
router.get('/hazards', ctrl.getHazards)
router.post('/hazards', ctrl.createHazard)
router.put('/hazards/:id', ctrl.updateHazard)
router.delete('/hazards/:id', ctrl.removeHazard)

// 设备
router.get('/devices', ctrl.getDevices)
router.post('/devices', ctrl.createDevice)
router.put('/devices/:id', ctrl.updateDevice)
router.delete('/devices/:id', ctrl.removeDevice)

export { router as testDataRouter }
