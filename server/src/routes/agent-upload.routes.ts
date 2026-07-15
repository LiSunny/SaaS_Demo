/**
 * agent-upload.routes.ts — Agent 文件上传路由
 *
 * 独立的 multer 配置，支持 PDF / 图片 / 纯文本。
 */
import { Router } from 'express'
import multer from 'multer'
import { authRequired } from '../middleware/auth.js'
import * as ctrl from '../controllers/agent-upload.controller.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb: multer.FileFilterCallback) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase()

    // MIME + 扩展名双重校验白名单
    const allowed: Record<string, string[]> = {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'text/plain': ['.txt', '.md', '.json'],
    }

    const allowedExts = allowed[file.mimetype]
    if (allowedExts && ext && allowedExts.includes('.' + ext)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件格式: ${file.originalname}`))
    }
  },
})

const router = Router()

// 所有上传接口需登录
router.use(authRequired)

// POST /api/agent/upload — 上传文件并解析
router.post('/upload', upload.single('file'), ctrl.uploadAndParse)

export { router as agentUploadRouter }
