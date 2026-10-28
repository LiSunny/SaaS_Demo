import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import * as customSymbolCtrl from '../controllers/custom-symbol.controller.js'

/**
 * 自定义图元（组态图元管理）
 * 内置图元是图元库构建产物、平台内只读不可删；本组接口只管用户新增的图元。
 */
const router = Router()

router.use(authRequired)

router.get('/custom', customSymbolCtrl.getList)
router.get('/custom/:id', customSymbolCtrl.getDetail)
router.post('/custom', customSymbolCtrl.create)
router.put('/custom/:id', customSymbolCtrl.update)
router.delete('/custom/:id', customSymbolCtrl.remove)

export { router as customSymbolRouter }
