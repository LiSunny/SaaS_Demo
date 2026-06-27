import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import db from '../config/db.js'

const SALT_ROUNDS = 10

export interface LoginInput {
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
  }
}

/**
 * 用户登录（手机号 + 密码）
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await db.user.findUnique({
    where: { phone: input.phone },
  })

  if (!user) {
    throw Object.assign(new Error('手机号或密码错误'), { statusCode: 401 })
  }

  if (user.status === 0) {
    throw Object.assign(new Error('账号已停用，请联系管理员'), { statusCode: 403 })
  }

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) {
    throw Object.assign(new Error('手机号或密码错误'), { statusCode: 401 })
  }

  // 更新最后登录时间
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const payload = {
    id: user.id,
    phone: user.phone,
    realName: user.realName,
    status: user.status,
  }

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  })

  return {
    token,
    user: {
      id: user.id,
      phone: user.phone,
      realName: user.realName,
      email: user.email,
      status: user.status,
    },
  }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { enterprises: { where: { status: 1 } } },
  })

  if (!user) {
    throw Object.assign(new Error('用户不存在'), { statusCode: 404 })
  }

  return {
    id: user.id,
    phone: user.phone,
    realName: user.realName,
    email: user.email,
    status: user.status,
    enterprises: user.enterprises.map(e => ({
      enterpriseId: e.enterpriseId,
      positions: JSON.parse(e.positions),
    })),
  }
}

/**
 * 初始化默认管理员（平台启动时调用，幂等）
 */
export async function ensureDefaultAdmin(): Promise<void> {
  const existing = await db.user.findUnique({
    where: { phone: '13800000000' },
  })

  if (existing) {
    console.log('[Auth] 默认管理员已存在，跳过创建')
    return
  }

  const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS)
  const user = await db.user.create({
    data: {
      phone: '13800000000',
      realName: '赵启明',
      password: hashedPassword,
      status: 1,
    },
  })

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
        contactName: '赵启明',
        contactPhone: '13800000000',
        status: 1,
        region: '杭州市',
        creatorName: '系统初始化',
      },
    })
  }

  // 关联到平台企业
  await db.userEnterprise.create({
    data: {
      userId: user.id,
      enterpriseId: platformOrg.id,
      positions: JSON.stringify(['platform_admin']),
      inviterName: '系统初始化',
    },
  })

  console.log('[Auth] ✅ 默认管理员已创建: 13800000000 / admin123')
}
