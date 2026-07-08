import request from '@/utils/request'

export interface LoginParams {
  phone: string
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: number
    phone: string
    realName: string
    email: string
    status: number
    systemRole: string | null
    position?: string | null  // 岗位 key（非系统角色用户）
  }
}

/**
 * 用户登录（手机号 + 密码）
 * POST /api/auth/login
 */
export async function loginApi(params: LoginParams): Promise<LoginResult> {
  const res = await request.post('/auth/login', params)
  return (res as any).data
}
