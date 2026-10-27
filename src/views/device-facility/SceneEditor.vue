<template>
  <div class="scene-editor">
    <!-- ===== 顶栏 ===== -->
    <header class="scene-editor__bar">
      <button class="btn-default scene-editor__back" @click="goBack">
        <AppIcon name="arrow-left" class="scene-editor__btn-icon" />
        返回列表
      </button>

      <input
        v-model="sceneName"
        class="fi-input scene-editor__name"
        placeholder="画面名称"
        maxlength="50"
      />

      <span class="scene-editor__sep" />

      <button class="btn-default" @click="onNew">新建</button>
      <button class="btn-primary" @click="onSave">保存</button>

      <el-select
        v-model="loadTarget"
        size="small"
        placeholder="读取画面"
        class="scene-editor__select"
        @change="onLoad"
      >
        <el-option
          v-for="s in otherScenes"
          :key="s.id"
          :label="s.name"
          :value="s.id"
        />
      </el-select>

      <button class="btn-default" @click="onExport">导出 JSON</button>
      <button class="btn-default" @click="fileInput?.click()">导入 JSON</button>
      <button class="btn-default" @click="onLoadSample">载入示例</button>

      <span class="scene-editor__sep" />

      <button class="btn-default" @click="toggleVariant">
        {{ scene.style === 'image' ? '图片版' : '线框版' }}
      </button>

      <label class="scene-editor__chk">
        <input v-model="snapOn" type="checkbox" />
        网格吸附
      </label>

      <span class="scene-editor__spacer" />

      <button class="btn-default scene-editor__zoom" @click="canvasRef?.zoomOut()">－</button>
      <button class="btn-default scene-editor__zoom" @click="canvasRef?.zoomIn()">＋</button>
      <button class="btn-default" @click="canvasRef?.fit()">适配</button>

      <input ref="fileInput" type="file" accept=".json,application/json" class="scene-editor__file" @change="onImport" />
    </header>

    <!-- ===== 主体 ===== -->
    <div class="scene-editor__body">
      <SceneCanvas
        ref="canvasRef"
        :nodes="nodes"
        :edges="edges"
        :selection="selection"
        :variant="scene.style"
        :width="scene.width"
        :height="scene.height"
        :place-symbol="placeSymbol"
        @select="onSelect"
        @create-node="onCreateNode"
        @update-node="onUpdateNode"
        @delete-node="onDeleteNode"
        @create-edge="onCreateEdge"
        @update-edge="onUpdateEdge"
        @delete-edge="onDeleteEdge"
      />

      <aside class="scene-editor__side">
        <SymbolPicker
          class="scene-editor__picker"
          :variant="scene.style"
          :active="placeSymbol"
          @pick="onPick"
          @manage="goSymbolLibrary"
        />
        <ScenePropertyPanel
          class="scene-editor__prop"
          :selection="selection"
          :nodes="nodes"
          :edges="edges"
          @update-node="onUpdateNode"
          @delete-node="onDeleteNode"
          @update-edge="onUpdateEdge"
          @delete-edge="onDeleteEdge"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组态编辑器
 *
 * 数据流：本地状态（nodes/edges/name）→ 改动即写草稿（节流 500ms）→ 「保存」写回画面记录。
 * 首次进入若存在更新的草稿，提示已恢复。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import SceneCanvas from '@/components/device-facility/SceneCanvas.vue'
import ScenePropertyPanel from '@/components/device-facility/ScenePropertyPanel.vue'
import SymbolPicker from '@/components/device-facility/SymbolPicker.vue'
import { symbolDef } from '@/symbols'
import { useSceneConfigStore } from '@/stores/scene-config'
import type { SceneConfig, SceneEdge, SceneNode, SceneSelection } from '@/types/scene-config'
import sampleLayoutRaw from '@symbols/layouts/demo-firewater.json?raw'

const route = useRoute()
const router = useRouter()
const store = useSceneConfigStore()

const scene = reactive<SceneConfig>({
  id: '',
  name: '未命名画面',
  systemKey: 'pipeline',
  scope: '',
  width: 1200,
  height: 700,
  style: 'image',
  status: 'draft',
  nodes: [],
  edges: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

const nodes = ref<SceneNode[]>([])
const edges = ref<SceneEdge[]>([])
const sceneName = ref('')
const selection = ref<SceneSelection>(null)
const placeSymbol = ref('')
const snapOn = ref(true)
const loadTarget = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const canvasRef = ref<InstanceType<typeof SceneCanvas> | null>(null)

const otherScenes = computed(() => store.scenes.filter((s) => s.id !== scene.id))

watch(sceneName, (v) => {
  scene.name = v
  scheduleDraft()
})

// ===== 载入 =====

function applyScene(target: SceneConfig, draft?: { nodes: SceneNode[]; edges: SceneEdge[]; updatedAt: number } | null) {
  scene.id = target.id
  scene.name = target.name
  scene.systemKey = target.systemKey
  scene.scope = target.scope
  scene.width = target.width
  scene.height = target.height
  scene.style = target.style
  scene.status = target.status
  scene.createdAt = target.createdAt
  scene.updatedAt = target.updatedAt
  sceneName.value = target.name
  nodes.value = draft ? draft.nodes : [...target.nodes]
  edges.value = draft ? draft.edges : [...target.edges]
  selection.value = null
  placeSymbol.value = ''
  loadTarget.value = ''
}

onMounted(() => {
  const id = String(route.params.id || '')
  const target = store.getById(id)
  if (!target) {
    ElMessage.error('画面不存在或已删除')
    router.replace('/device-facility/rule/scene-config')
    return
  }
  const draft = store.loadDraft(id)
  const useDraft = !!draft && draft.updatedAt > target.updatedAt
  applyScene(target, useDraft ? draft : null)
  if (useDraft) ElMessage.info('已恢复未保存的草稿')
})

// ===== 草稿 =====

let draftTimer: number | null = null
/** 是否有未保存的改动（保存后置 false，决定离开时是否再写草稿） */
let dirty = false

function scheduleDraft() {
  if (!scene.id) return
  dirty = true
  if (draftTimer) window.clearTimeout(draftTimer)
  draftTimer = window.setTimeout(flushDraft, 500)
}

/** 立即落盘草稿（离开页面 / 刷新前调用，避免 500ms 节流窗口内丢改动） */
function flushDraft() {
  if (draftTimer) {
    window.clearTimeout(draftTimer)
    draftTimer = null
  }
  if (!scene.id || !dirty) return
  const ok = store.saveDraft({
    ...scene,
    name: sceneName.value,
    nodes: nodes.value,
    edges: edges.value,
  })
  if (!ok) ElMessage.warning('草稿保存失败：浏览器本地存储已满')
}

window.addEventListener('beforeunload', flushDraft)

onBeforeUnmount(() => {
  flushDraft()
  window.removeEventListener('beforeunload', flushDraft)
})

watch(nodes, scheduleDraft, { deep: true })
watch(edges, scheduleDraft, { deep: true })

// ===== 画布事件 =====

function onSelect(sel: SceneSelection) {
  selection.value = sel
  if (sel) placeSymbol.value = ''
}

function onPick(symbolId: string) {
  placeSymbol.value = placeSymbol.value === symbolId ? '' : symbolId
  selection.value = null
}

function onCreateNode(payload: { symbol: string; x: number; y: number }) {
  const node: SceneNode = {
    id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    symbol: payload.symbol,
    x: payload.x,
    y: payload.y,
    size: 60,
    label: symbolDef(payload.symbol)?.name || '',
    point: '',
    value: '',
    state: {},
  }
  nodes.value = [...nodes.value, node]
  selection.value = { type: 'node', id: node.id }
  placeSymbol.value = ''
  scheduleDraft()
}

function onUpdateNode(id: string, patch: Partial<SceneNode>) {
  nodes.value = nodes.value.map((n) => (n.id === id ? { ...n, ...patch } : n))
}

function onDeleteNode(id: string) {
  nodes.value = nodes.value.filter((n) => n.id !== id)
  edges.value = edges.value.filter((e) => e.from.node !== id && e.to.node !== id)
  selection.value = null
}

function onCreateEdge(edge: SceneEdge) {
  edges.value = [...edges.value, edge]
}

function onUpdateEdge(id: string, patch: Partial<SceneEdge>) {
  edges.value = edges.value.map((e) => (e.id === id ? { ...e, ...patch } : e))
}

function onDeleteEdge(id: string) {
  edges.value = edges.value.filter((e) => e.id !== id)
  selection.value = null
}

// ===== 顶栏动作 =====

function onSave() {
  store.updateSceneMeta(scene.id, { name: sceneName.value, style: scene.style })
  store.saveLayout(scene.id, nodes.value, edges.value)
  store.clearDraft(scene.id)
  dirty = false
  ElMessage.success('已保存')
}

function onNew() {
  nodes.value = []
  edges.value = []
  selection.value = null
  placeSymbol.value = ''
  scheduleDraft()
  ElMessage.success('已新建空白画面')
}

function onLoad(id: string) {
  const target = store.getById(id)
  if (!target) return
  applyScene(target)
  ElMessage.success(`已读取：${target.name}`)
}

function toggleVariant() {
  scene.style = scene.style === 'image' ? 'line' : 'image'
  scheduleDraft()
}

/** 导出：与图元库同款信封 */
function onExport() {
  const payload = {
    version: 1,
    name: sceneName.value,
    width: scene.width,
    height: scene.height,
    nodes: nodes.value,
    edges: edges.value,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = (sceneName.value || 'layout') + '.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

/** 导入校验：图元必须存在、端口序号合法、坐标为有限数 */
function validateLayout(data: unknown): { nodes: SceneNode[]; edges: SceneEdge[]; name: string; width?: number; height?: number } | null {
  if (!data || typeof data !== 'object') return null
  const raw = data as { name?: unknown; nodes?: unknown; edges?: unknown; width?: unknown; height?: unknown }
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return null

  const nodeIds = new Set<string>()
  for (const n of raw.nodes as SceneNode[]) {
    if (!n || typeof n.id !== 'string' || !n.id) return null
    if (nodeIds.has(n.id)) return null
    nodeIds.add(n.id)
    if (!symbolDef(n.symbol)) return null
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) return null
  }
  for (const e of raw.edges as SceneEdge[]) {
    if (!e || typeof e.id !== 'string') return null
    if (!nodeIds.has(e.from?.node) || !nodeIds.has(e.to?.node)) return null
    const a = symbolDef((raw.nodes as SceneNode[]).find((n) => n.id === e.from.node)!.symbol)
    const b = symbolDef((raw.nodes as SceneNode[]).find((n) => n.id === e.to.node)!.symbol)
    if (!a || !b) return null
    // 控制连线不经过端口，只校验节点引用
    if (e.kind !== 'control') {
      if ((e.from.port ?? 0) >= (a.ports?.length || 0)) return null
      if ((e.to.port ?? 0) >= (b.ports?.length || 0)) return null
    }
  }
  const size = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : undefined)
  return {
    nodes: raw.nodes as SceneNode[],
    edges: raw.edges as SceneEdge[],
    name: typeof raw.name === 'string' ? raw.name : '',
    width: size(raw.width),
    height: size(raw.height),
  }
}

async function onImport(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    const valid = validateLayout(parsed)
    if (!valid) {
      ElMessage.error('JSON 不合法：图元 ID 不存在、端口越界或坐标非法，已拒绝导入')
      return
    }
    nodes.value = valid.nodes
    edges.value = valid.edges
    if (valid.width) scene.width = valid.width
    if (valid.height) scene.height = valid.height
    if (valid.name) sceneName.value = valid.name
    selection.value = null
    ElMessage.success(`已导入：${valid.name || file.name}`)
  } catch {
    ElMessage.error('JSON 解析失败')
  } finally {
    input.value = ''
  }
}

function onLoadSample() {
  try {
    const parsed = JSON.parse(sampleLayoutRaw)
    const valid = validateLayout(parsed)
    if (!valid) {
      ElMessage.error('示例布局不合法')
      return
    }
    nodes.value = valid.nodes
    edges.value = valid.edges
    if (valid.width) scene.width = valid.width
    if (valid.height) scene.height = valid.height
    selection.value = null
    ElMessage.success('已载入示例画面')
  } catch {
    ElMessage.error('示例布局读取失败')
  }
}

// ===== 导航 =====

function goBack() {
  router.push('/device-facility/rule/scene-config')
}

function goSymbolLibrary() {
  // 带 scene 参数：图元管理页「返回编辑器」能准确回到当前画面
  router.push({ path: '/device-facility/rule/symbol-library', query: { scene: scene.id } })
}
</script>

<style scoped>
.scene-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
}

/* 顶栏 */
.scene-editor__bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.scene-editor__back {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}
.scene-editor__btn-icon { width: 15px; height: 15px; }
.scene-editor__name {
  width: 220px;
}
.scene-editor__sep {
  width: 1px;
  height: 20px;
  background: var(--border-default);
}
.scene-editor__select {
  width: 160px;
}
.scene-editor__spacer { flex: 1; }
.scene-editor__zoom {
  min-width: 34px;
  text-align: center;
}
.scene-editor__chk {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}
.scene-editor__file { display: none; }

/* 主体 */
.scene-editor__body {
  display: flex;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}
.scene-editor__side {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
}
.scene-editor__picker {
  flex: 1.15;
  min-height: 0;
}
.scene-editor__prop {
  flex: 1;
  min-height: 0;
}
</style>
