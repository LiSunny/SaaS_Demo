/**
 * 后端 API 辅助函数
 * 用于测试中跳过 UI 直接操作数据（如创建测试企业、清理数据等）
 */
import { APIRequestContext } from '@playwright/test'

const BASE = 'http://localhost:3202/api'

let cachedToken: string | null = null

/** 获取管理员 token（缓存复用） */
export async function getAdminToken(request: APIRequestContext): Promise<string> {
  if (cachedToken) return cachedToken

  const res = await request.post(`${BASE}/auth/login`, {
    data: { phone: '13800000000', password: 'admin123' },
  })
  const body = await res.json()
  cachedToken = body.data.token
  return cachedToken
}

/** 带认证头的请求辅助 */
export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}
