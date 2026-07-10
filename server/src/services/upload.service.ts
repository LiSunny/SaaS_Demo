import { extname } from 'path'
import { randomUUID } from 'crypto'
import { getClient, ossConfig } from '../config/oss.js'

/** 允许的文件 MIME 类型 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

/** 最大文件大小：5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * 上传文件到阿里云 OSS
 * @param buffer 文件二进制内容
 * @param originalName 原始文件名（用于提取扩展名）
 * @param prefix 存储路径前缀，默认 "uploads"
 * @returns OSS 公网访问 URL
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  prefix: string = 'uploads',
): Promise<{ url: string; key: string }> {
  // 大小校验
  if (buffer.length > MAX_FILE_SIZE) {
    throw Object.assign(new Error('文件大小不能超过 5MB'), { statusCode: 400 })
  }

  // 类型校验
  // 注意：这里不做 MIME 二次校验，因为 multer 的 fileFilter 已经过滤了。
  // 如果从其他入口调用（如 base64），可以加 fileType 检测。

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
