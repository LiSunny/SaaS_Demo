import request from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: number
    name: string
    orgId: number
    orgName: string
    position: string
  }
}

/**
 * 用户登录
 * POST /api/auth/login
 */
export async function loginApi(params: LoginParams): Promise<LoginResult> {
  const res = await request.post('/auth/login', params)
  return (res as any).data
}
