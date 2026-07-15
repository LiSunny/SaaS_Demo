import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config({ path: resolve(__dirname, '../.env') })

export const env = {

  PORT: parseInt(process.env.PORT || '3201', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || `file:${resolve(__dirname, '../dev.db')}`,
  JWT_SECRET: process.env.JWT_SECRET || 'maintenance-demo-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // DeepSeek API（openai 兼容接口），Key 请在 server/.env 中配置
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',

  // OCR 方案选择：tesseract（本地免费）｜ aliyun（阿里云，需配置 OSS 密钥，每月 200 次免费）
  // OCR_PROVIDER: 'aliyun',
  OCR_PROVIDER: 'tesseract',
  // 阿里云 OCR 复用 OSS 的 AK/SK
  ALIYUN_OCR_ENDPOINT: process.env.ALIYUN_OCR_ENDPOINT || 'ocr-api.cn-hangzhou.aliyuncs.com',
  ALIYUN_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID || '',
  ALIYUN_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET || '',

}
