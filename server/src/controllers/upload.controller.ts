import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import * as uploadSvc from '../services/upload.service.js'

/**
 * 上传图片文件
 * POST /api/upload/image
 */
export async function uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ code: 400, message: '请选择文件', data: null })
      return
    }

    const folder = (req.body?.folder as string) || 'uploads'
    const { url, key } = await uploadSvc.uploadFile(req.file.buffer, req.file.originalname, folder)

    res.json({ code: 0, message: '上传成功', data: { url, key } })
  } catch (err: unknown) {
    // 处理 multer 错误（文件过大等）
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ code: 400, message: '文件大小不能超过 5MB', data: null })
        return
      }
      res.status(400).json({ code: 400, message: err.message, data: null })
      return
    }
    next(err)
  }
}
