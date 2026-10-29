/**
 * 组态配置 Store
 *
 * 后端（/api/scenes）为唯一真源。浏览器 localStorage 只保留一份只读存档：
 *   - db:scene-config            接入后台前的本地画面快照（迁移后不再写）
 *   - db:scene-config:migrated   迁移标记（时间 + 导入数量）
 *   - scene-config:draft:<id>    接入后台前的本地草稿快照（迁移后不再写）
 *
 * 首次拉取列表前做一次性本地导入：把存档里的画面与草稿提交到后端。
 * 后端按画面 ID 去重，重复执行安全；导入成功后本地存档原样保留，可随时回溯。
 */
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import {
  createScene as apiCreateScene,
  fetchSceneDetail,
  fetchSceneList,
  fetchSceneOptions,
  importLocalScenes,
  removeScene as apiRemoveScene,
  saveSceneDraft,
  saveSceneDraftKeepalive,
  saveSceneLayout,
  toggleSceneStatus as apiToggleSceneStatus,
  updateScene as apiUpdateScene,
  type SceneFormPayload,
} from '@/api/scene-config'
import type {
  SceneConfig,
  SceneDraft,
  SceneEdge,
  SceneNode,
  SceneQuery,
} from '@/types/scene-config'

/** 本地存档键（只读） */
const ARCHIVE_KEY = 'db:scene-config'
/** 迁移标记键 */
const MIGRATED_KEY = 'db:scene-config:migrated'
/** 本地草稿存档键前缀（只读） */
const DRAFT_PREFIX = 'scene-config:draft:'

/** 读取本地画面存档 */
function readArchive(): any[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** 读取本地草稿存档（按画面 ID 索引） */
function readDraftArchive(sceneIds: string[]): Record<string, SceneDraft> {
  const out: Record<string, SceneDraft> = {}
  for (const id of sceneIds) {
    try {
      const raw = localStorage.getItem(DRAFT_PREFIX + id)
      if (!raw) continue
      const d = JSON.parse(raw)
      if (d && Array.isArray(d.nodes) && Array.isArray(d.edges)) out[id] = d
    } catch {
      // 单个草稿损坏不影响其他画面
    }
  }
  return out
}

export const useSceneConfigStore = defineStore('scene-config', () => {
  /** 当前页画面 */
  const scenes = ref<SceneConfig[]>([])
  /** 画面总数（服务端分页） */
  const total = ref(0)
  /** 列表查询条件 */
  const query = reactive<SceneQuery>({ page: 1, size: 20 })
  /** 加载中 */
  const loading = ref(false)
  /** 编辑器「读取画面」下拉的候选（仅 id + name） */
  const options = ref<Array<{ id: string; name: string }>>([])
  /** 最近一次本地导入结果 */
  const lastImport = ref<{ imported: number; skipped: number } | null>(null)

  // ===== 本地存档一次性导入 =====

  let migration: Promise<void> | null = null

  /**
   * 把浏览器本地存档的画面与草稿导入后端
   *
   * 幂等：后端按画面 ID 去重，已存在的跳过；导入标记写入后不再重试。
   */
  function migrateLocalArchive(): Promise<void> {
    if (migration) return migration
    migration = (async () => {
      if (localStorage.getItem(MIGRATED_KEY)) return

      const archive = readArchive()
      if (!archive.length) {
        localStorage.setItem(
          MIGRATED_KEY,
          JSON.stringify({ at: Date.now(), imported: 0, skipped: 0, reason: '无本地存档' }),
        )
        return
      }

      const ids = archive.map((s) => s?.id).filter(Boolean) as string[]
      const drafts = readDraftArchive(ids)
      try {
        const res = await importLocalScenes({ scenes: archive, drafts })
        lastImport.value = res
        localStorage.setItem(MIGRATED_KEY, JSON.stringify({ at: Date.now(), ...res }))
      } catch (err) {
        // 失败不写标记，下次进入重试
        migration = null
        throw err
      }
    })()
    return migration
  }

  // ===== 列表 =====

  /** 拉取列表（先做本地存档导入，再取服务端数据） */
  async function fetchList() {
    loading.value = true
    try {
      // 导入失败不挡列表：存档导入是兜底动作，服务端数据照常拉取
      try {
        await migrateLocalArchive()
      } catch (err) {
        console.warn('[scene-config] 本地存档导入失败，已跳过：', err)
      }
      const res = await fetchSceneList({ ...query })
      scenes.value = res.data
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  /** 拉取画面候选（编辑器「读取画面」下拉） */
  async function fetchOptions() {
    options.value = await fetchSceneOptions()
  }

  /** 单个画面 */
  async function fetchDetail(sceneId: string): Promise<SceneConfig> {
    return fetchSceneDetail(sceneId)
  }

  // ===== 增删改 =====

  /** 新建画面 */
  async function createScene(form: SceneFormPayload): Promise<SceneConfig> {
    return apiCreateScene(form)
  }

  /** 更新画面字段（不含布局） */
  async function updateSceneMeta(sceneId: string, form: Partial<SceneFormPayload>) {
    return apiUpdateScene(sceneId, form)
  }

  /** 保存画面布局（编辑器「保存」），服务端同时清空草稿 */
  async function saveLayout(sceneId: string, nodes: SceneNode[], edges: SceneEdge[]) {
    return saveSceneLayout(sceneId, nodes, edges)
  }

  /** 保存草稿（未保存的改动） */
  async function saveDraft(sceneId: string, draft: SceneDraft): Promise<void> {
    await saveSceneDraft(sceneId, draft)
  }

  /** 保存草稿（页面卸载时，走 keepalive 保证请求能发出去） */
  async function saveDraftOnUnload(sceneId: string, draft: SceneDraft): Promise<void> {
    await saveSceneDraftKeepalive(sceneId, draft)
  }

  /** 切换启停：草稿 ↔ 已停用 */
  async function toggleStatus(sceneId: string) {
    return apiToggleSceneStatus(sceneId)
  }

  /** 删除画面 */
  async function removeScene(sceneId: string) {
    await apiRemoveScene(sceneId)
  }

  return {
    scenes,
    total,
    query,
    loading,
    options,
    lastImport,
    migrateLocalArchive,
    fetchList,
    fetchOptions,
    fetchDetail,
    createScene,
    updateSceneMeta,
    saveLayout,
    saveDraft,
    saveDraftOnUnload,
    toggleStatus,
    removeScene,
  }
})
