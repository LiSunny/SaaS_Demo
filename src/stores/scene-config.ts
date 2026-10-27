/**
 * 组态配置 Store
 *
 * 画面列表走项目统一的 localStorage 持久化适配层（src/utils/db-adapter.ts），
 * 编辑中的布局另存草稿键（scene-config:draft:<id>），刷新不丢。
 *
 * 单用户 Demo：无服务端、无锁，同一画面多标签同时编辑按最后写入覆盖。
 */
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { createPersistentStore } from '@/utils/db-adapter'
import type { SceneConfig, SceneEdge, SceneNode, SceneQuery } from '@/types/scene-config'

const DRAFT_PREFIX = 'scene-config:draft:'

/** 画面列表持久化（模块名 → localStorage 键 db:scene-config） */
const persist = createPersistentStore<SceneConfig>('scene-config', [])

function uid(prefix: string): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** 空画面 */
export function blankScene(patch: Partial<SceneConfig> = {}): SceneConfig {
  const now = Date.now()
  return {
    id: uid('scene-'),
    name: '未命名画面',
    systemKey: 'pipeline',
    scope: '',
    width: 1200,
    height: 700,
    style: 'image',
    status: 'draft',
    nodes: [],
    edges: [],
    remark: '',
    createdAt: now,
    updatedAt: now,
    ...patch,
  }
}

export const useSceneConfigStore = defineStore('scene-config', () => {
  /** 全部画面 */
  const scenes = ref<SceneConfig[]>(persist.getAll())
  /** 列表查询条件 */
  const query = reactive<SceneQuery>({ page: 1, size: 20 })

  /** 过滤后的结果（不分页） */
  const filtered = computed(() => {
    const kw = (query.name || '').trim().toLowerCase()
    return scenes.value.filter((s) => {
      if (kw && !s.name.toLowerCase().includes(kw)) return false
      if (query.status && s.status !== query.status) return false
      if (query.systemKey && s.systemKey !== query.systemKey) return false
      return true
    })
  })

  const total = computed(() => filtered.value.length)

  /** 当前页数据 */
  const list = computed(() => {
    const start = (query.page - 1) * query.size
    return filtered.value.slice(start, start + query.size)
  })

  /** 重新读取持久化数据 */
  function fetchList() {
    scenes.value = persist.getAll()
    const maxPage = Math.max(1, Math.ceil(filtered.value.length / query.size))
    if (query.page > maxPage) query.page = maxPage
  }

  /** 按 ID 取画面 */
  function getById(id: string): SceneConfig | undefined {
    return scenes.value.find((s) => s.id === id)
  }

  /** 新建画面 */
  function createScene(patch: Partial<SceneConfig>): SceneConfig {
    const scene = blankScene(patch)
    persist.add(scene)
    scenes.value = persist.getAll()
    return scene
  }

  /** 更新画面字段（不含布局） */
  function updateSceneMeta(id: string, patch: Partial<SceneConfig>) {
    const cur = getById(id)
    if (!cur) return
    persist.update(id, { ...patch, updatedAt: Date.now() })
    scenes.value = persist.getAll()
  }

  /** 保存画面布局（编辑器「保存」） */
  function saveLayout(id: string, nodes: SceneNode[], edges: SceneEdge[]) {
    const cur = getById(id)
    if (!cur) return
    persist.update(id, { nodes, edges, updatedAt: Date.now() })
    scenes.value = persist.getAll()
  }

  /** 切换启停：草稿 ↔ 已停用 */
  function toggleStatus(scene: SceneConfig) {
    const next = scene.status === 'disabled' ? 'draft' : 'disabled'
    persist.update(scene.id, { status: next, updatedAt: Date.now() })
    scenes.value = persist.getAll()
  }

  /** 删除画面（连带草稿） */
  function removeScene(id: string) {
    persist.remove(id)
    clearDraft(id)
    scenes.value = persist.getAll()
  }

  // ===== 草稿 =====

  /** 写草稿 */
  function saveDraft(scene: SceneConfig): boolean {
    try {
      localStorage.setItem(
        DRAFT_PREFIX + scene.id,
        JSON.stringify({
          name: scene.name,
          style: scene.style,
          width: scene.width,
          height: scene.height,
          nodes: scene.nodes,
          edges: scene.edges,
          updatedAt: Date.now(),
        }),
      )
      return true
    } catch {
      // 配额超限等异常：内存态保留，提示由调用方给出
      return false
    }
  }

  /** 读草稿 */
  function loadDraft(id: string): { nodes: SceneNode[]; edges: SceneEdge[]; updatedAt: number } | null {
    try {
      const raw = localStorage.getItem(DRAFT_PREFIX + id)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) return null
      return data
    } catch {
      return null
    }
  }

  /** 清草稿 */
  function clearDraft(id: string) {
    try {
      localStorage.removeItem(DRAFT_PREFIX + id)
    } catch {
      // 忽略：清草稿失败不影响主流程
    }
  }

  return {
    scenes,
    query,
    list,
    total,
    filtered,
    fetchList,
    getById,
    createScene,
    updateSceneMeta,
    saveLayout,
    toggleStatus,
    removeScene,
    saveDraft,
    loadDraft,
    clearDraft,
  }
})
