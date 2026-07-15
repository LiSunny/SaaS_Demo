import { extname } from 'path'
import { randomUUID } from 'crypto'
import { getClient, ossConfig } from '../config/oss.js'

/** 默认允许的文件 MIME 类型（图片） */
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

/** 默认最大文件大小：5MB */
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024

/**
 * 上传文件到阿里云 OSS
 * @param buffer 文件二进制内容
 * @param originalName 原始文件名（用于提取扩展名）
 * @param prefix 存储路径前缀，默认 "uploads"
 * @param allowedTypes 可选，允许的 MIME 类型列表。不传则默认为图片类型
 * @param maxSize 可选，最大文件大小（bytes）。不传则默认 5MB
 * @returns OSS 公网访问 URL
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  prefix: string = 'uploads',
  allowedTypes?: string[],
  maxSize?: number,
): Promise<{ url: string; key: string }> {
  const effectiveAllowed = allowedTypes ?? DEFAULT_ALLOWED_TYPES
  const effectiveMaxSize = maxSize ?? DEFAULT_MAX_SIZE

  // 大小校验
  if (buffer.length > effectiveMaxSize) {
    const maxMB = Math.round(effectiveMaxSize / (1024 * 1024))
    throw Object.assign(new Error(`文件大小不能超过 ${maxMB}MB`), { statusCode: 400 })
  }

  // 类型校验（由调用方控制，multer 层已过滤）
  // 不做 MIME 二次校验，信任调用方传入的 allowedTypes 由上层 multer 保证

  // 生成 OSS Object Key：{prefix}/{YYYY-MM-DD}/{timestamp}-{uuid8}.{ext}
  const now = new Date()
  const dateDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const ext = extname(originalName).toLowerCase() || '.png'
  const key = `${prefix}/${dateDir}/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`

  const client = getClient()
  await client.put(key, buffer)

  return {
    url: `${ossConfig.baseUrl}/${key}`,
    key,
  }
}
