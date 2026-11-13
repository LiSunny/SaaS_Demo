import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAiChatStore } from './ai-chat'
import {
  ALL_POSITIONS,
  DEFAULT_POSITION,
  findPosition,
  type PositionKey,
  type PositionDef,
} from '@/config/positions'

const POSITION_KEY = 'demo-position'
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

// ===== 岗位持久化 =====

function loadPosition(): PositionKey {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (raw && ALL_POSITIONS.some(p => p.key === raw)) {
      return raw as PositionKey
    }
  } catch { /* 静默失败 */ }
  return DEFAULT_POSITION
}

function savePosition(key: PositionKey): void {
  localStorage.setItem(POSITION_KEY, key)
}

// ===== 登录态持久化 =====

function loadToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function loadUser(): any {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function removeUser(): void {
  localStorage.removeItem(USER_KEY)
}

const SYSTEM_ROLE_KEY = 'system-role'

function loadSystemRole(): string | null {
  return localStorage.getItem(SYSTEM_ROLE_KEY) || null
}

function saveSystemRole(role: string | null): void {
  if (role) {
    localStorage.setItem(SYSTEM_ROLE_KEY, role)
  } else {
    localStorage.removeItem(SYSTEM_ROLE_KEY)
  }
}

// ===== Store =====

export const useUserStore = defineStore('user', () => {
  /** 清空 AI 对话（登录/登出时调用；ai-chat store 是全局单例，跨账号必须清） */
  function resetAiChat() {
    try {
      useAiChatStore().reset()
    } catch { /* pinia 未就绪时忽略 */ }
  }

  // ===== 登录态 =====
  const token = ref<string>(loadToken())
  const user = ref<any>(loadUser())

  const isLoggedIn = computed(() => !!token.value)

  /** 当前系统角色（null = 普通用户，platform-ops / platform-admin） */
  const systemRole = ref<string | null>(loadSystemRole())

  /** 登录成功后设置 token 和用户信息 */
  function setLogin(newToken: string, newUser: any): void {
    token.value = newToken
    user.value = newUser
    saveToken(newToken)
    saveUser(newUser)
    // 同步系统角色
    systemRole.value = newUser.systemRole || null
    saveSystemRole(newUser.systemRole || null)
    // 换账号：清掉上一个账号的 AI 对话（ai-chat store 是全局单例，
    // 残留的对话会显示给新用户，并作为 history 发给后端，导致 AI 引用上个账号的企业数据）
    resetAiChat()
    // 系统角色用户不需要岗位
    if (!newUser.systemRole && newUser.position && ALL_POSITIONS.some(p => p.key === newUser.position)) {
      currentPositionKey.value = newUser.position as PositionKey
      savePosition(newUser.position as PositionKey)
    }
  }

  /** 登出 */
  function logout(): void {
    token.value = ''
    user.value = null
    systemRole.value = null
    removeToken()
    removeUser()
    localStorage.removeItem(SYSTEM_ROLE_KEY)
    // 登出同样要清 AI 对话，避免下一个人（或下一个账号）看到上一位用户的会话
    resetAiChat()
  }

  /**
   * 登录态失效（Agent 接口返回 401：token 过期 / JWT_SECRET 变更）。
   * 与 logout 的区别：**不清 AI 对话** —— 保留用户已经看到的上下文，
   * 重新登录后可以继续追问，不必从头再来。
   */
  function invalidateAuth(): void {
    token.value = ''
    user.value = null
    systemRole.value = null
    removeToken()
    removeUser()
    localStorage.removeItem(SYSTEM_ROLE_KEY)
  }

  // ai-chat store 在接口返回 401 时广播该事件。
  // 依赖方向只能是 ai-chat → user（user store 已经 import 了 ai-chat），
  // 所以这里用事件而不是反向 import，避免循环依赖。
  if (typeof window !== 'undefined') {
    window.addEventListener('agent:auth-expired', invalidateAuth)
  }

  // ===== 岗位 =====
  const currentPositionKey = ref<PositionKey>(loadPosition())

  /** 当前岗位完整定义（系统角色用户返回 null） */
  const currentPosition = computed<PositionDef | null>(() => {
    if (systemRole.value) return null
    return findPosition(currentPositionKey.value) || findPosition(DEFAULT_POSITION)!
  })

  /** 当前用户（系统角色用户返回真实登录用户，普通用户回退到 mock） */
  const currentUser = computed(() => {
    if (systemRole.value) return user.value
    return user.value || currentPosition.value?.user
  })

  /** 切换岗位 */
  function switchPosition(key: PositionKey): void {
    if (ALL_POSITIONS.some(p => p.key === key)) {
      currentPositionKey.value = key
      savePosition(key)
    }
  }

  // ===== 使用群体（企业级导航分组） =====

  /**
   * 当前用户的使用群体标签。
   * 优先取登录用户关联企业的 groups；无企业信息时按岗位 group 兜底。
   * 系统角色用户返回 []（只看平台分组）。
   */
  const currentGroups = computed<string[]>(() => {
    if (systemRole.value) return []
    // ① 登录用户关联企业（UserEnterprise）的 groups
    const enterprises = user.value?.enterprises
    if (Array.isArray(enterprises) && enterprises.length > 0) {
      const groups = enterprises[0]?.groups
      if (Array.isArray(groups) && groups.length > 0) return groups as string[]
    }
    // ② 企业详情（平台运营方后台选中当前企业时）
    const detailGroups = user.value?.groups
    if (Array.isArray(detailGroups) && detailGroups.length > 0) return detailGroups as string[]
    // ③ 岗位 group 兜底（Demo 岗位切换器）
    const pos = findPosition(currentPositionKey.value)
    if (pos?.group) return [pos.group]
    return []
  })

  return {
    // 登录态
    token,
    user,
    isLoggedIn,
    setLogin,
    logout,
    invalidateAuth,
    // 系统角色
    systemRole,
    // 岗位
    currentPositionKey,
    currentPosition,
    currentUser,
    switchPosition,
    // 使用群体
    currentGroups,
  }
})
