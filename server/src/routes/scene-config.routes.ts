import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import * as sceneConfigCtrl from '../controllers/scene-config.controller.js'

/**
 * 组态画面（组态配置）
 *
 * 画面主体与布局入 Prisma。节点只存图元 ID 引用，产品图在 OSS。
 * 归属口径与自定义图元一致：enterpriseId=null → 平台级共享。
 */
const router = Router()

router.use(authRequired)

// 本地历史数据一次性导入（须在 /:sceneId 之前注册，避免被动态段吞掉）
router.post('/import', sceneConfigCtrl.importLocal)

// 图元引用检查与清理
router.get('/references/:symbolId', sceneConfigCtrl.findSymbolReferences)
router.post('/references/:symbolId/purge', sceneConfigCtrl.purgeSymbolReferences)

// 画面候选（须在 /:sceneId 之前注册，否则被动态段吞掉）
router.get('/options', sceneConfigCtrl.getOptions)

// 画面 CRUD
router.get('/', sceneConfigCtrl.getList)
router.get('/:sceneId', sceneConfigCtrl.getDetail)
router.post('/', sceneConfigCtrl.create)
router.put('/:sceneId', sceneConfigCtrl.update)
router.put('/:sceneId/layout', sceneConfigCtrl.saveLayout)
router.put('/:sceneId/draft', sceneConfigCtrl.saveDraft)
router.patch('/:sceneId/status', sceneConfigCtrl.toggleStatus)
router.delete('/:sceneId', sceneConfigCtrl.remove)

export { router as sceneConfigRouter }
