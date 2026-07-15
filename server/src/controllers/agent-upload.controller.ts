/**
 * agent-upload.controller.ts — Agent 文件上传与解析
 *
 * POST /api/agent/upload
 * 接收文件 → OSS 存储 → 解析文本 → 返回给前端
 */
import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { env } from '../config/env.js'
import * as uploadSvc from '../services/upload.service.js'
import * as fileParser from '../services/file-parser.service.js'

const AGENT_FOLDER = 'agent-files'

export async function uploadAndParse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ code: 400, message: '请选择文件', data: null })
      return
    }

    const file = req.file

    // 修复 multer 中文文件名编码问题：multer/Busboy 按 latin1 解码，
    // 而浏览器按 UTF-8 发送，需要重新编码还原
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf-8')

    // 大小预检
    const MAX_SIZE = 15 * 1024 * 1024 // 15MB
    if (file.size > MAX_SIZE) {
      res.status(400).json({ code: 400, message: '文件大小不能超过 15MB', data: null })
      return
    }

    // 1. 上传原文件到 OSS
    const { url, key } = await uploadSvc.uploadFile(
      file.buffer,
      originalName,
      AGENT_FOLDER,
    )

    const ext = originalName.split('.').pop()?.toLowerCase() || ''
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)

    // 2. 解析文本内容
    // 阿里云 OCR 优先用 OSS URL 传图（更可靠），其他格式用 buffer 解析
    let parsedText: string
    let ocrProvider: string | undefined

    if (isImage && env.OCR_PROVIDER === 'aliyun') {
      const result = await fileParser.parseImageOcrAliyunByUrl(url)
      parsedText = result.parsedText
      ocrProvider = result.ocrProvider
    } else {
      const result = await fileParser.parseFileContent(file.buffer, originalName)
      parsedText = result.parsedText
      ocrProvider = result.ocrProvider
    }

    res.json({
      code: 0,
      message: '上传成功',
      data: {
        url,
        key,
        fileName: originalName,
        fileType: ext,
        fileSize: file.size,
        parsedText,
        ocrProvider,
      },
    })
  } catch (err: unknown) {
    // multer 错误（文件过大等）
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ code: 400, message: '文件大小不能超过 15MB', data: null })
        return
      }
      res.status(400).json({ code: 400, message: err.message, data: null })
      return
    }
    next(err)
  }
}
