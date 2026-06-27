import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import db from '../config/db.js'

const SALT_ROUNDS = 10

export interface LoginInput {
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

export interface ProfileResult {
  id: number
  name: string
  orgId: number
  orgName: string
  position: string
}

/**
 * 用户登录
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await db.user.findFirst({
    where: { name: input.username },
  })

  if (!user) {
    throw Object.assign(new Error('用户名或密码错误'), { statusCode: 401 })
  }

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) {
    throw Object.assign(new Error('用户名或密码错误'), { statusCode: 401 })
  }

  const payload = {
    id: user.id,
    name: user.name,
    orgId: user.orgId,
    orgName: user.orgName,
    position: user.position,
  }

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })

  return { token, user: payload }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(userId: number): Promise<ProfileResult> {
  const user = await db.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw Object.assign(new Error('用户不存在'), { statusCode: 404 })
  }

  return {
    id: user.id,
    name: user.name,
    orgId: user.orgId,
    orgName: user.orgName,
    position: user.position,
  }
}

/**
 * 初始化默认管理员（系统启动时调用，幂等）
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const existing = await db.user.findFirst({
    where: { name: 'admin' },
  })

  if (existing) {
    console.log('[Auth] 默认管理员已存在，跳过创建')
    return
  }

  const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS)

  // 确保平台方企业存在
  let platformOrg = await db.enterprise.findFirst({
    where: { code: 'PLATFORM' },
  })

  if (!platformOrg) {
    platformOrg = await db.enterprise.create({
      data: {
        name: '平台运营方',
        code: 'PLATFORM',
        dimALevel1: 'platform_operator',
        contactName: '系统管理员',
        status: 1,
        creatorName: '系统初始化',
      },
    })
    console.log(`[Auth] 创建平台运营方企业: ${platformOrg.name}`)
  }

  await db.user.create({
    data: {
      name: 'admin',
      orgId: platformOrg.id,
      orgName: platformOrg.name,
      password: hashedPassword,
      position: 'platform_admin',
    },
  })

  console.log('[Auth] ✅ 默认管理员已创建: admin / admin123')
}
