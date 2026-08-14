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
    systemRole: string | null
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

  // 非系统角色用户：查询岗位 + 企业使用群体 + 所在企业名称
  let position: string | null = null
  let groups: string[] = []
  let enterpriseName: string | null = null
  if (!user.systemRole) {
    const ue = await db.userEnterprise.findFirst({
      where: { userId: user.id, status: 1 },
      include: { enterprise: true },
    })
    if (ue) {
      const positions: string[] = JSON.parse(ue.positions)
      if (positions.length > 0) {
        // 去掉 "platform:" 前缀，匹配前端 PositionKey
        position = positions[0].replace(/^[a-z]+:/, '')
      }
      // 企业使用群体（决定导航分组）
      if (ue.enterprise?.groups) {
        try { groups = JSON.parse(ue.enterprise.groups) } catch { groups = [] }
      }
      // 所在企业名称（Agent 工作台用户卡展示）
      enterpriseName = ue.enterprise?.name || null
    }
  }

  const payload = {
    id: user.id,
    phone: user.phone,
    realName: user.realName,
    status: user.status,
    systemRole: user.systemRole,
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
      systemRole: user.systemRole,
      position,
      groups,
      enterpriseName,
    } as {
      id: number
      phone: string
      realName: string
      email: string
      status: number
      systemRole: string | null
      position: string | null
      groups: string[]
      enterpriseName: string | null
    },
  }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(userId: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      enterprises: {
        where: { status: 1 },
        include: { enterprise: true },
      },
    },
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
    systemRole: user.systemRole,
    enterprises: user.enterprises.map(e => {
      let groups: string[] = []
      try { groups = JSON.parse((e.enterprise as any)?.groups || '[]') } catch { groups = [] }
      return {
        enterpriseId: e.enterpriseId,
        positions: JSON.parse(e.positions),
        groups,
      }
    }),
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
    // 如果已存在但 systemRole 为空，补上
    if (!existing.systemRole) {
      await db.user.update({
        where: { id: existing.id },
        data: { systemRole: 'platform-ops' },
      })
      // 清理历史残留的 UserEnterprise 关联（系统角色用户不应关联企业）
      const deleted = await db.userEnterprise.deleteMany({
        where: { userId: existing.id },
      })
      if (deleted.count > 0) {
        console.log(`[Auth] 已清理默认管理员的 ${deleted.count} 条历史企业关联`)
      }
      console.log('[Auth] 默认管理员已存在，已补充 systemRole 并清理企业关联')
    } else {
      console.log('[Auth] 默认管理员已存在，跳过创建')
    }
    return
  }

  const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS)
  await db.user.create({
    data: {
      phone: '13800000000',
      realName: '赵启明',
      password: hashedPassword,
      status: 1,
      systemRole: 'platform-ops',
    },
  })

  console.log('[Auth] ✅ 默认管理员已创建: 13800000000 / admin123 (systemRole=platform-ops)')
}
