<template>
  <div ref="wrapRef" class="scene-canvas" :class="{ 'is-placing': !!placeSymbol }">
    <svg
      ref="svgRef"
      class="scene-canvas__svg"
      :viewBox="`0 0 ${width} ${height}`"
      :width="Math.round(width * zoom)"
      :height="Math.round(height * zoom)"
      @mousedown="onCanvasDown"
      @mousemove="onCanvasMove"
    >
      <!-- 网格 -->
      <g class="scene-grid">
        <line
          v-for="x in gridLinesX"
          :key="`gx-${x}`"
          :x1="x" :y1="0" :x2="x" :y2="height"
          class="scene-grid__line"
        />
        <line
          v-for="y in gridLinesY"
          :key="`gy-${y}`"
          :x1="0" :y1="y" :x2="width" :y2="y"
          class="scene-grid__line"
        />
      </g>

      <!-- 连线 -->
      <g class="scene-edges">
        <path
          v-for="e in edges"
          :key="e.id"
          :d="edgePath(e)"
          class="scene-edge"
          :class="[
            e.kind === 'control' ? 'scene-edge--control' : '',
            selection?.type === 'edge' && selection.id === e.id ? 'is-selected' : '',
          ]"
          @mousedown.stop="emit('select', { type: 'edge', id: e.id })"
        />
      </g>

      <!-- 连线预览 -->
      <path v-if="previewPath" :d="previewPath" class="scene-edge scene-edge--hot" />

      <!-- 图元 -->
      <g
        v-for="n in nodes"
        :key="n.id"
        class="scene-node"
        :class="{ 'is-selected': selection?.type === 'node' && selection.id === n.id }"
        :transform="`translate(${n.x - (n.size || 60) / 2}, ${n.y - (n.size || 60) / 2})`"
        @mousedown.stop="onNodeDown(n, $event)"
      >
        <SceneSymbolNode
          :symbol="n.symbol"
          :size="n.size || 60"
          :variant="variant"
          :value="n.value"
          :state="n.state"
        />
        <rect
          class="scene-node__sel"
          x="-6"
          y="-6"
          :width="(n.size || 60) + 12"
          :height="(n.size || 60) + 12"
          rx="4"
        />
        <text class="scene-node__label" :x="(n.size || 60) / 2" :y="(n.size || 60) + 16">
          {{ n.label || symbolDef(n.symbol)?.name }}
        </text>
        <text class="scene-node__point" :x="(n.size || 60) / 2" :y="(n.size || 60) + 29">
          {{ n.point || '' }}
        </text>

        <circle
          v-for="(p, i) in portsOf(n)"
          :key="`${n.id}-${i}`"
          class="scene-port"
          :class="{ 'is-source': linkFrom?.node === n.id && linkFrom?.port === i }"
          :cx="p.relX"
          :cy="p.relY"
          r="4"
          @mousedown.stop="onPortDown(n, i, $event)"
        />
      </g>
    </svg>

    <div class="scene-canvas__status">
      <span>模式：{{ modeText }}</span>
      <span>已选：{{ selectionText }}</span>
      <span>缩放 {{ Math.round(zoom * 100) }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组态画布
 *
 * 交互全部照搬图元库编辑器：放置 / 拖动 / 端口连线 / 选中 / Delete 删除 / 网格吸附。
 * 画布只负责交互与渲染，数据的读写由 SceneEditor 负责。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import SceneSymbolNode from '@/components/device-facility/SceneSymbolNode.vue'
import { SYMBOL_GRID, edgePath as calcEdgePath, linkPath as calcLinkPath, portPos, symbolDef } from '@/symbols'
import type { SceneEdge, SceneNode, SceneSelection, SceneStyle } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    nodes: SceneNode[]
    edges: SceneEdge[]
    selection: SceneSelection
    variant: SceneStyle
    width: number
    height: number
    /** 放置模式：待放置的图元 ID */
    placeSymbol?: string
    /** 只读（预览） */
    readonly?: boolean
  }>(),
  { placeSymbol: '', readonly: false },
)

const emit = defineEmits<{
  select: [selection: SceneSelection]
  'create-node': [payload: { symbol: string; x: number; y: number }]
  'update-node': [id: string, patch: Partial<SceneNode>]
  'delete-node': [id: string]
  'create-edge': [edge: SceneEdge]
  'update-edge': [id: string, patch: Partial<SceneEdge>]
  'delete-edge': [id: string]
}>()

const wrapRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

/** 缩放倍数 */
const zoom = ref(1)
/** 拖拽状态 */
const drag = ref<null | { type: 'move'; nodeId: string; dx: number; dy: number }>(null)
/** 连线起点 */
const linkFrom = ref<null | { node: string; port: number }>(null)
/** 连线预览路径 */
const previewPath = ref('')

const GRID_STEP = 40
const gridLinesX = computed(() => {
  const out: number[] = []
  for (let x = 0; x <= props.width; x += GRID_STEP) out.push(x)
  return out
})
const gridLinesY = computed(() => {
  const out: number[] = []
  for (let y = 0; y <= props.height; y += GRID_STEP) out.push(y)
  return out
})

const modeText = computed(() => (props.placeSymbol ? `放置 ${symbolDef(props.placeSymbol)?.name || ''}` : '选择'))
const selectionText = computed(() => {
  if (props.selection?.type === 'node') {
    const n = props.nodes.find((x) => x.id === props.selection!.id)
    return n ? n.label || n.symbol : '—'
  }
  if (props.selection?.type === 'edge') return '连线'
  return '未选中'
})

/** 节点端口相对节点左上角的偏移 */
function portsOf(n: SceneNode) {
  const def = symbolDef(n.symbol)
  const size = n.size || 60
  return (def?.ports || []).map((_, i) => {
    const pos = portPos(n, i)
    return {
      relX: pos ? pos.x - (n.x - size / 2) : 0,
      relY: pos ? pos.y - (n.y - size / 2) : 0,
    }
  })
}

function edgePath(e: SceneEdge): string {
  return calcEdgePath(e, props.nodes)
}

/** 屏幕坐标 → 画布坐标 */
function toCanvas(ev: { clientX: number; clientY: number }) {
  const svg = svgRef.value
  if (!svg) return { x: 0, y: 0 }
  const r = svg.getBoundingClientRect()
  return {
    x: ((ev.clientX - r.left) / r.width) * props.width,
    y: ((ev.clientY - r.top) / r.height) * props.height,
  }
}

function snap(v: number): number {
  return Math.round(v / SYMBOL_GRID) * SYMBOL_GRID
}

// ===== 交互 =====

function onCanvasDown(ev: MouseEvent) {
  if (props.readonly) return
  if (ev.target !== svgRef.value && !(ev.target as Element).classList.contains('scene-grid__line')) return

  if (props.placeSymbol) {
    const p = toCanvas(ev)
    emit('create-node', {
      symbol: props.placeSymbol,
      x: snap(p.x),
      y: snap(p.y),
    })
    return
  }
  emit('select', null)
}

function onNodeDown(n: SceneNode, ev: MouseEvent) {
  if (props.readonly) return
  emit('select', { type: 'node', id: n.id })
  const p = toCanvas(ev)
  drag.value = { type: 'move', nodeId: n.id, dx: n.x - p.x, dy: n.y - p.y }
}

function onPortDown(n: SceneNode, port: number, ev: MouseEvent) {
  if (props.readonly) return
  ev.preventDefault()
  linkFrom.value = { node: n.id, port }
  drag.value = null
}

function onCanvasMove(ev: MouseEvent) {
  if (props.readonly) return
  if (drag.value?.type === 'move') {
    const p = toCanvas(ev)
    emit('update-node', drag.value.nodeId, {
      x: snap(p.x + drag.value.dx),
      y: snap(p.y + drag.value.dy),
    })
  } else if (linkFrom.value) {
    previewPath.value = calcLinkPath(linkFrom.value, props.nodes, toCanvas(ev))
  }
}

function onWindowUp(ev: MouseEvent) {
  if (props.readonly) return

  if (linkFrom.value) {
    const p = toCanvas(ev)
    const target = nearestPort(p, linkFrom.value.node)
    if (target) {
      emit('create-edge', {
        id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        from: { node: linkFrom.value.node, port: linkFrom.value.port },
        to: { node: target.node, port: target.port },
      })
    }
    linkFrom.value = null
    previewPath.value = ''
    drag.value = null
    return
  }

  if (drag.value?.type === 'move') {
    const nodeId = drag.value.nodeId
    drag.value = null
    // 通知父级拖动结束（用于触发草稿落盘）
    emit('update-node', nodeId, {})
  }
}

/** 找离鼠标最近的连接点（同节点除外） */
function nearestPort(p: { x: number; y: number }, excludeNode: string) {
  let best: { node: string; port: number } | null = null
  let bestDist = 12
  for (const n of props.nodes) {
    if (n.id === excludeNode) continue
    const def = symbolDef(n.symbol)
    const count = def?.ports?.length || 0
    for (let i = 0; i < count; i++) {
      const pos = portPos(n, i)
      if (!pos) continue
      const d = Math.hypot(pos.x - p.x, pos.y - p.y)
      if (d < bestDist) {
        bestDist = d
        best = { node: n.id, port: i }
      }
    }
  }
  return best
}

function onKeyDown(ev: KeyboardEvent) {
  if (props.readonly || !props.selection) return
  const el = document.activeElement
  const tag = el?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement)?.isContentEditable) return

  if (ev.key === 'Delete' || ev.key === 'Backspace') {
    ev.preventDefault()
    if (props.selection.type === 'node') emit('delete-node', props.selection.id)
    else emit('delete-edge', props.selection.id)
  } else if (props.selection.type === 'node') {
    const n = props.nodes.find((x) => x.id === props.selection!.id)
    if (!n) return
    const step = ev.shiftKey ? 8 : 1
    if (ev.key === 'ArrowLeft') emit('update-node', n.id, { x: n.x - step })
    else if (ev.key === 'ArrowRight') emit('update-node', n.id, { x: n.x + step })
    else if (ev.key === 'ArrowUp') emit('update-node', n.id, { y: n.y - step })
    else if (ev.key === 'ArrowDown') emit('update-node', n.id, { y: n.y + step })
  }
}

// ===== 缩放 =====

function zoomIn() {
  zoom.value = Math.min(2, Number((zoom.value + 0.15).toFixed(2)))
}

function zoomOut() {
  zoom.value = Math.max(0.4, Number((zoom.value - 0.15).toFixed(2)))
}

/** 适配：按容器宽高缩放到 1:1 以内 */
function fit() {
  const el = wrapRef.value
  if (!el) return
  const w = el.clientWidth - 24
  const h = el.clientHeight - 24
  // 容器未布局（弹窗隐藏、隐藏的 tab）时宽高为 0，不能算出负缩放
  if (w <= 0) return
  const ratio = h > 0 ? Math.min(w / props.width, h / props.height) : w / props.width
  zoom.value = Math.min(1, Math.max(0.4, Number(ratio.toFixed(3))))
}

defineExpose({ zoomIn, zoomOut, fit })

onMounted(() => {
  window.addEventListener('mouseup', onWindowUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('resize', fit)
  fit()
})

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', onWindowUp)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('resize', fit)
})
</script>

<style scoped>
.scene-canvas {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: var(--bg-main);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
.scene-canvas.is-placing {
  cursor: crosshair;
  border-color: var(--accent-primary);
}
.scene-canvas__svg {
  display: block;
  background: var(--bg-card);
  border-radius: var(--radius-md);
}
.scene-grid__line {
  stroke: var(--border-low);
  stroke-width: 1;
}
.scene-edge {
  fill: none;
  stroke: var(--normal-border);
  stroke-width: 3;
  cursor: pointer;
}
.scene-edge:hover { stroke: var(--accent-primary); }
.scene-edge.is-selected {
  stroke: var(--accent-primary);
  stroke-width: 4;
}
.scene-edge--control {
  stroke: var(--text-muted);
  stroke-dasharray: 6 4;
  stroke-width: 2;
}
.scene-edge--hot {
  stroke: var(--accent-primary);
  stroke-width: 2;
  stroke-dasharray: 4 3;
}
.scene-node { cursor: move; }
.scene-node__sel {
  fill: none;
  stroke: transparent;
  stroke-width: 1.5;
}
.scene-node.is-selected .scene-node__sel {
  stroke: var(--accent-primary);
}
.scene-node__label {
  fill: var(--text-secondary);
  font-size: 12px;
  text-anchor: middle;
}
.scene-node__point {
  fill: var(--text-muted);
  font-size: 10px;
  text-anchor: middle;
}
.scene-port {
  fill: var(--success);
  stroke: var(--bg-card);
  stroke-width: 1;
  cursor: crosshair;
}
.scene-port:hover { fill: var(--accent-primary); }
.scene-port.is-source { fill: var(--accent-primary); }

.scene-canvas__status {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
  font-size: var(--font-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
