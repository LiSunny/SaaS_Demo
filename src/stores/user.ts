import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

// ===== Store =====

export const useUserStore = defineStore('user', () => {
  // ===== 登录态 =====
  const token = ref<string>(loadToken())
  const user = ref<any>(loadUser())

  const isLoggedIn = computed(() => !!token.value)

  /** 登录成功后设置 token 和用户信息 */
  function setLogin(newToken: string, newUser: any): void {
    token.value = newToken
    user.value = newUser
    saveToken(newToken)
    saveUser(newUser)
    // 同步岗位
    if (newUser.position && ALL_POSITIONS.some(p => p.key === newUser.position)) {
      currentPositionKey.value = newUser.position as PositionKey
      savePosition(newUser.position as PositionKey)
    }
  }

  /** 登出 */
  function logout(): void {
    token.value = ''
    user.value = null
    removeToken()
    removeUser()
  }

  // ===== 岗位 =====
  const currentPositionKey = ref<PositionKey>(loadPosition())

  /** 当前岗位完整定义 */
  const currentPosition = computed<PositionDef>(
    () => findPosition(currentPositionKey.value) || findPosition(DEFAULT_POSITION)!,
  )

  /** 当前用户 */
  const currentUser = computed(() => user.value || currentPosition.value.user)

  /** 切换岗位 */
  function switchPosition(key: PositionKey): void {
    if (ALL_POSITIONS.some(p => p.key === key)) {
      currentPositionKey.value = key
      savePosition(key)
    }
  }

  return {
    // 登录态
    token,
    user,
    isLoggedIn,
    setLogin,
    logout,
    // 岗位
    currentPositionKey,
    currentPosition,
    currentUser,
    switchPosition,
  }
})
