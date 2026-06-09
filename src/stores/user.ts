import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  ALL_POSITIONS,
  DEFAULT_POSITION,
  findPosition,
  type PositionKey,
  type PositionDef,
} from '@/config/positions'

const STORAGE_KEY = 'demo-position'

function loadPosition(): PositionKey {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && ALL_POSITIONS.some(p => p.key === raw)) {
      return raw as PositionKey
    }
  } catch { /* 静默失败 */ }
  return DEFAULT_POSITION
}

function savePosition(key: PositionKey): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export const useUserStore = defineStore('user', () => {
  const currentPositionKey = ref<PositionKey>(loadPosition())

  /** 当前岗位完整定义 */
  const currentPosition = computed<PositionDef>(
    () => findPosition(currentPositionKey.value) || findPosition(DEFAULT_POSITION)!,
  )

  /** 当前用户（Mock） */
  const currentUser = computed(() => currentPosition.value.user)

  /** 切换岗位 */
  function switchPosition(key: PositionKey): void {
    if (ALL_POSITIONS.some(p => p.key === key)) {
      currentPositionKey.value = key
      savePosition(key)
    }
  }

  return {
    currentPositionKey,
    currentPosition,
    currentUser,
    switchPosition,
  }
})
