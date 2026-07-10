import OSS from 'ali-oss'

/** 阿里云 OSS 配置，统一从此处读取 */
const ossConfig = {
  region: process.env.OSS_REGION || '',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || '',
  baseUrl: process.env.OSS_BASE_URL || '',
}

/** 校验 OSS 配置是否完整 */
export function isOssConfigured(): boolean {
  return !!(ossConfig.region && ossConfig.accessKeyId && ossConfig.accessKeySecret && ossConfig.bucket)
}

let client: OSS | null = null

/** 懒初始化 OSS Client，避免启动时因未配置而报错 */
function getClient(): OSS {
  if (!client) {
    if (!isOssConfigured()) {
      throw Object.assign(new Error('OSS 未配置，请检查环境变量'), { statusCode: 500 })
    }
    client = new OSS({
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
    })
  }
  return client
}

export { ossConfig, getClient }
