import { Router } from 'express'
import multer from 'multer'
import { authRequired } from '../middleware/auth.js'
import * as uploadCtrl from '../controllers/upload.controller.js'

// 文件上传中间件：内存缓冲 + 类型过滤 + 大小限制
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPG/PNG/GIF/WebP/SVG 格式'))
    }
  },
})

const router = Router()

// 所有上传接口需登录
router.use(authRequired)

// POST /api/upload/image — 上传图片
router.post('/image', upload.single('file'), uploadCtrl.uploadImage)

export { router as uploadRouter }
