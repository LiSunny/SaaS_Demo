<template>
  <div class="monitor-scene">
    <!-- 空态：未取到画面 -->
    <div v-if="!scene" class="monitor-scene__empty">
      <span class="monitor-scene__empty-text">{{ emptyText }}</span>
    </div>

    <div
      v-else
      ref="canvasEl"
      class="monitor-scene__canvas"
      :class="{ 'monitor-scene__canvas--grab': canPan }"
      :style="canvasStyle"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!--
        三层叠加，同一 viewBox 与同一容器尺寸 → 渲染区域完全对齐。
        拆层的原因：SVG 内的位图与 SVG 整体一起被光栅化，动画一动整张 SVG 失效，
        一堆 512×512 位图就要重新栅格化，画面会周期性卡顿。
        底图层内容不变 → 位图只光栅化一次；变化只发生在无位图的文本层与动画层。
      -->
      <!-- 层1 · 静态底图：连线 + 图元位图 -->
      <svg
        class="monitor-scene__svg monitor-scene__svg--base"
        :viewBox="sceneViewBox"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-label="`${scene.name}组态图`"
      >
        <g class="monitor-scene__edges">
          <path
            v-for="e in edges"
            :key="e.id"
            :d="pathOf(e)"
            class="monitor-edge"
            :class="{ 'monitor-edge--control': e.kind === 'control' }"
          />
        </g>

        <g
          v-for="n in nodeViews"
          :key="n.id"
          class="monitor-scene__node"
          :transform="`translate(${n.x - n.size / 2}, ${n.y - n.size / 2})`"
        >
          <SceneSymbolNode :symbol="n.symbol" :size="n.size" variant="image" :state="n.state" />
        </g>

        <!-- 选中设备的标记环（值守工作台：指出是哪台在报警） -->
        <circle
          v-if="pickedNode"
          class="monitor-scene__pick"
          :cx="pickedNode.x"
          :cy="pickedNode.y"
          :r="pickedNode.size * 0.78"
        />
      </svg>

      <!-- 层2 · 设备名称（无位图，随画面刷新重绘） -->
      <svg
        class="monitor-scene__svg monitor-scene__svg--text"
        :viewBox="sceneViewBox"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="false"
      >
        <g
          v-for="n in nodeViews"
          :key="n.id"
          class="monitor-scene__hit-group"
          :class="{ 'is-clickable': clickable }"
          :role="clickable ? 'button' : undefined"
          :tabindex="clickable ? 0 : undefined"
          :aria-label="ariaOf(n)"
          @click="onSelect(n)"
          @keydown.enter.prevent="onSelect(n)"
          @keydown.space.prevent="onSelect(n)"
        >
          <!-- 原生 tooltip：说明这个图元管着多少台设备、其中多少台异常 -->
          <title>{{ tipOf(n) }}</title>

          <text
            class="monitor-scene__label"
            :x="n.x"
            :y="n.y + n.size / 2 + 18"
          >{{ labelOf(n) }}</text>

          <!-- 命中区：图元与文字之间的空白处也要能点中，否则只有像素处可点 -->
          <rect
            class="monitor-scene__hit"
            :x="n.x - n.size / 2"
            :y="n.y - n.size / 2"
            :width="n.size"
            :height="n.size + 36"
            fill="none"
            pointer-events="all"
          />
        </g>
      </svg>

      <!-- 层3 · 管道流动动画（只有描边，无位图） -->
      <svg
        class="monitor-scene__svg monitor-scene__svg--flow"
        :viewBox="sceneViewBox"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <marker
            :id="arrowId"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" class="monitor-arrow__head" />
          </marker>
        </defs>

        <g class="monitor-scene__edges">
          <path
            v-for="e in flowingEdges"
            :key="`flow-${e.id}`"
            :d="flowPathOf(e)"
            class="monitor-edge__flow"
            :marker-end="`url(#${arrowId})`"
          />
        </g>
      </svg>
    </div>

    <!-- 缩放控件：浮在画布右下角 -->
    <div v-if="scene && showZoom" class="monitor-scene__zoom">
      <button
        type="button"
        class="monitor-scene__zoom-btn"
        title="缩小"
        :disabled="zoom <= ZOOM_MIN"
        @click="zoomOut"
      >
        −
      </button>
      <span class="monitor-scene__zoom-val">{{ zoomPercent }}%</span>
      <button
        type="button"
        class="monitor-scene__zoom-btn"
        title="放大"
        :disabled="zoom >= ZOOM_MAX"
        @click="zoomIn"
      >
        ＋
      </button>
      <button
        type="button"
        class="monitor-scene__zoom-btn monitor-scene__zoom-btn--wide"
        title="适应画布"
        @click="resetZoom"
      >
        适应
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统监测页的只读组态画布
 *
 * 与组态编辑器（SceneCanvas.vue）分开：编辑器带网格 / 端口 / 状态条等编辑器件，
 * 大屏只需要"画面 + 设备"。图元几何、端口坐标、正交连线路径复用 @/symbols 同一套实现。
 *
 * 节点状态与点击下钻（传了 systemKey 时启用）：
 *   节点的设备归属与实时状态来自 useSubsystemStore + 各系统的绑定表，
 *   与「设备设施管理 → 运行监控」的三个系统主页同一套数据 ——
 *   画布上的闪烁角标就是那边那批设备的角标，点一下能看到这批设备的清单。
 * 不传 systemKey（值守工作台的平面图）时保持原样：只用画面自带的 state。
 */
import { computed, onMounted, reactive, ref, useId } from 'vue'
import { storeToRefs } from 'pinia'
import SceneSymbolNode from '@/components/device-facility/SceneSymbolNode.vue'
import {
  edgePath,
  edgePathReversed,
  symbolDef,
  SYMBOL_REGISTRY_VERSION,
} from '@/symbols'
import { useSubsystemStore } from '@/stores/subsystem'
import { useSymbolStore } from '@/stores/symbols'
import { aggregateNodeOf } from '../monitor-bindings'
import { monitorNodeViews, type MonitorNodeView } from '../monitor-data'
import type { SceneConfig, SceneEdge, SceneNode } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    /** 画面（来自 /api/scenes） */
    scene?: SceneConfig | null
    /** 空态文案 */
    emptyText?: string
    /**
     * 视口裁剪（SVG viewBox），缺省用画面自身尺寸。
     * 画面原始比例与小卡片比例不一致时，裁到内容外接框能填满卡片；
     * 不裁则会在上下留出大片空白。
     */
    viewBox?: string
    /** 是否显示缩放控件；小卡片里没有交互需求，关掉 */
    showZoom?: boolean
    /**
     * 高亮的节点 id —— 值守工作台「报警位置」用它指出是哪台设备在报警。
     * 这是"选中"标记，不是设备状态：设备状态只由角标承担。
     */
    highlightNodeId?: string
    /**
     * 所属系统（pipeline / gas / smoke）——
     * 传了就接实时设备状态（异常角标闪烁）并支持点击下钻看设备清单；
     * 不传就只用画面自带的 state（值守工作台的平面图走这条）。
     */
    systemKey?: string
  }>(),
  {
    scene: null,
    emptyText: '该系统暂无组态画面',
    viewBox: '',
    showZoom: true,
    highlightNodeId: '',
    systemKey: '',
  },
)

const emit = defineEmits<{ (e: 'select', node: MonitorNodeView): void }>()

/* ================= 实时设备数据 ================= */

const subsystem = useSubsystemStore()
const { points } = storeToRefs(subsystem)
const { getRuntime } = subsystem

/** 箭头 marker id（多实例不冲突） */
const arrowId = `monitor-arrow-${useId()}`

const sceneViewBox = computed(
  () => props.viewBox || `0 0 ${props.scene?.width || 1200} ${props.scene?.height || 700}`,
)

const nodes = computed<SceneNode[]>(() => props.scene?.nodes ?? [])
const edges = computed<SceneEdge[]>(() => props.scene?.edges ?? [])

/** 是否支持点击下钻 */
const clickable = computed(() => !!props.systemKey)

/**
 * 节点视图
 *
 * 有 systemKey → 按设备数据聚合状态（异常角标闪烁 + 下钻设备清单）；
 * 无 systemKey → 用画面自带的 state（值守工作台的平面图）。
 */
const nodeViews = computed<MonitorNodeView[]>(() => {
  const scene = props.scene
  if (!scene) return []
  if (!props.systemKey) {
    return (scene.nodes ?? []).map((n) => ({
      id: n.id,
      symbol: n.symbol,
      label: n.label || symbolDef(n.symbol)?.name || n.symbol,
      x: n.x,
      y: n.y,
      size: n.size ?? 60,
      state: n.state ?? {},
      abnormal: 0,
      total: 0,
      members: [],
    }))
  }
  return monitorNodeViews(scene, (symbol, nth) =>
    aggregateNodeOf(props.systemKey, symbol, nth, points.value, getRuntime),
  )
})

/** 被选中的节点（报警位置高亮用） */
const pickedNode = computed<MonitorNodeView | null>(
  () => nodeViews.value.find((n) => n.id === props.highlightNodeId) ?? null,
)

/** 只有管道连线有流动动画 */
const flowingEdges = computed(() => edges.value.filter((e) => e.flow && e.flow !== 'none'))

function pathOf(e: SceneEdge): string {
  // 端口坐标来自图元定义，自定义图元注册完成后才有值 → 依赖注册版本号触发重算
  void SYMBOL_REGISTRY_VERSION.value
  return edgePath(e, nodes.value)
}

function flowPathOf(e: SceneEdge): string {
  void SYMBOL_REGISTRY_VERSION.value
  return e.flow === 'reverse'
    ? edgePathReversed(e, nodes.value)
    : edgePath(e, nodes.value)
}

function labelOf(n: MonitorNodeView): string {
  return n.label || symbolDef(n.symbol)?.name || n.symbol
}

/** tooltip：说明这个图元管着多少台设备、其中多少台异常 */
function tipOf(n: MonitorNodeView): string {
  if (!props.systemKey) return n.label
  return `${n.label} · ${n.total} 台设备${n.abnormal ? ` · ${n.abnormal} 台异常` : ' · 全部正常'}`
}

/** 无障碍读法 */
function ariaOf(n: MonitorNodeView): string {
  if (!props.systemKey) return n.label
  return `${n.label}：${n.total} 台设备，${n.abnormal} 台异常`
}

/** 点击图元 → 下钻看这批设备的清单 */
function onSelect(n: MonitorNodeView): void {
  if (!clickable.value) return
  emit('select', n)
}

/**
 * 自定义图元注册
 *
 * 画面里含平台内新增的图元（CUS-* 段位图），渲染链路必须先知道它们：
 * 服务端已收录 → 以服务端为准；未收录或接口不可用 → 画面文件内联定义兜底。
 */
onMounted(async () => {
  try {
    await useSymbolStore().load()
  } catch {
    // 未登录或接口不可用：内置图元仍可渲染
  }
})

/* ================= 缩放与平移 =================
 *
 * SVG 用 preserveAspectRatio="xMidYMid meet" 始终把画面缩放居中到容器，
 * 缩放叠加在容器上（transform-origin: center）→ 画面放大后仍然居中，
 * 不会出现"以左上角为基准放大、内容跑偏"的问题。
 *
 * 缩放倍数 1 = 适应画布（SVG 原始适配比例），可放大到 400%、缩小到 50%。
 * 放大后可按住拖动平移，平移量按容器尺寸夹紧，不会把画面拖出视野。
 */

/** 缩放范围 */
const ZOOM_MIN = 0.5
const ZOOM_MAX = 4
/** 一次滚轮 / 按钮的缩放步长 */
const ZOOM_STEP = 1.25

const canvasEl = ref<HTMLElement | null>(null)
/** 缩放倍数：1 = 适应画布 */
const zoom = ref(1)
/** 平移量（px） */
const pan = reactive({ x: 0, y: 0 })

const zoomPercent = computed(() => Math.round(zoom.value * 100))
/** 放大后才能拖动 */
const canPan = computed(() => zoom.value > 1)

/** 画布的缩放与平移 */
const canvasStyle = computed(() => ({
  transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom.value})`,
}))

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** 平移夹紧：放大后的画面不会整体移出容器 */
function clampPan() {
  const el = canvasEl.value
  if (!el || zoom.value <= 1) {
    pan.x = 0
    pan.y = 0
    return
  }
  // clientWidth / clientHeight 是布局尺寸，不受 transform 影响
  const maxX = (el.clientWidth * (zoom.value - 1)) / 2
  const maxY = (el.clientHeight * (zoom.value - 1)) / 2
  pan.x = clamp(pan.x, -maxX, maxX)
  pan.y = clamp(pan.y, -maxY, maxY)
}

/** 设置缩放倍数（缩放基准是容器中心 → 画面始终居中） */
function setZoom(next: number) {
  zoom.value = clamp(next, ZOOM_MIN, ZOOM_MAX)
  if (zoom.value <= 1) {
    pan.x = 0
    pan.y = 0
    return
  }
  clampPan()
}

function zoomIn() {
  setZoom(zoom.value * ZOOM_STEP)
}

function zoomOut() {
  setZoom(zoom.value / ZOOM_STEP)
}

/** 复位：回到适应画布 */
function resetZoom() {
  zoom.value = 1
  pan.x = 0
  pan.y = 0
}

/** 滚轮缩放（以画布中心为基准） */
function onWheel(e: WheelEvent) {
  setZoom(zoom.value * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP))
}

/** 拖拽平移 */
let dragging = false
let dragStart = { x: 0, y: 0, px: 0, py: 0 }

function onPointerDown(e: PointerEvent) {
  if (!canPan.value) return
  dragging = true
  dragStart = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  pan.x = dragStart.px + (e.clientX - dragStart.x)
  pan.y = dragStart.py + (e.clientY - dragStart.y)
  clampPan()
}

function onPointerUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.monitor-scene {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 三层共用同一容器：底图撑开高度，文本层与动画层绝对定位叠上去 */
.monitor-scene__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  /* 缩放以容器中心为基准 → 画面放大后仍然居中 */
  transform-origin: center center;
  touch-action: none;
  will-change: transform;
}

/* 放大后可拖动平移 */
.monitor-scene__canvas--grab {
  cursor: grab;
}

.monitor-scene__canvas--grab:active {
  cursor: grabbing;
}

.monitor-scene__svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 文本层与动画层尺寸跟随容器 → 与底图落在同一渲染区域 */
.monitor-scene__svg--text,
.monitor-scene__svg--flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 底图与动画层纯装饰 */
.monitor-scene__svg--base,
.monitor-scene__svg--flow {
  pointer-events: none;
}

/* 空态 */
.monitor-scene__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monitor-scene__empty-text {
  font-size: clamp(14px, calc(15 * var(--min-scale)), 15px);
  color: rgba(143, 176, 216, 0.7);
  letter-spacing: 1px;
}

/* ===== 缩放控件（浮在画布右上角，设计稿 #117:22511） ===== */
.monitor-scene__zoom {
  position: absolute;
  top: vh(16);
  right: vw(16);
  z-index: 4;
  display: flex;
  align-items: center;
  gap: vw(6);
  padding: vh(4) vw(6);
  border-radius: vw(2);
  background: #00346f;
}

.monitor-scene__zoom-btn {
  width: vw(26);
  height: vh(26);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.55);
  color: rgba(200, 228, 255, 0.9);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.monitor-scene__zoom-btn:hover:not(:disabled) {
  background: rgba(0, 92, 168, 0.72);
  color: #eaf6ff;
}

.monitor-scene__zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.monitor-scene__zoom-btn--wide {
  width: vw(44);
}

/* 当前缩放比（100% = 适应画布）：设计稿 #117:22515 用 Douyin Sans Bold 14px #CFE4FF */
.monitor-scene__zoom-val {
  min-width: vw(38);
  text-align: center;
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: #cfe4ff;
}

/* ===== 连线 ===== */
/* 底管实线 + 高亮光带沿流向移动：光带间隙露出底管，读起来是"管里有水在流" */
.monitor-edge {
  fill: none;
  stroke: #2f7fd0;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.55;
}

.monitor-edge--control {
  stroke: #7ea6d6;
  stroke-width: 2;
  stroke-dasharray: 6 5;
  opacity: 0.7;
}

.monitor-edge__flow {
  fill: none;
  stroke: #4fa8ff;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 12 28;
  opacity: 0.95;
  animation: monitor-flow 1.1s linear infinite;
}

.monitor-arrow__head { fill: #4fa8ff; }

@keyframes monitor-flow {
  to { stroke-dashoffset: -40; }
}

/* ===== 设备名称 ===== */
/* 14px：大屏最小字号下限（fire-common.scss 的 $fire-min-size）。
   这张画布在值守工作台的「报警位置」里被缩到约 450×290，
   13px 的标签在那个尺寸下已经认不出来了。 */
.monitor-scene__label {
  fill: #a9c9ea;
  font-size: 14px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(4, 30, 64, 0.85);
  stroke-width: 3px;
}

/* ===== 可点击的图元（传了 systemKey 才可点）===== */
.monitor-scene__hit-group:focus {
  outline: none;
}

.monitor-scene__hit-group.is-clickable {
  cursor: pointer;
}

.monitor-scene__hit-group.is-clickable:hover .monitor-scene__label {
  fill: #cfe4ff;
}

.monitor-scene__hit-group.is-clickable:focus-visible .monitor-scene__label {
  fill: #a2caff;
}

/* ===== 角标：正常不显示，只有异常提示 ===== */
/* 满屏图元全带角标时，角标不再传递"这里有异常"的信息，反而淹没真正要看的告警。 */
.monitor-scene :deep(.sym-root.is-run .sym-badge-run) { display: none; }

/* 超限 / 预警复用报警角标（⚠ 三角），配色按大屏口径：预警=红、故障=橙 */
.monitor-scene :deep(.sym-root.is-over .sym-badge-alarm) { display: block; }
.monitor-scene :deep(.sym-root.is-over .sym-badge-alarm .sym-badge-bg) { fill: #ff8080; }
.monitor-scene :deep(.sym-root.is-over .sym-badge-alarm .sym-badge-mark) { stroke: #0e1013; }

.monitor-scene :deep(.sym-root.is-fault) {
  --sym-fill: #ffab5c;
  --sym-stroke: #ffab5c;
}
.monitor-scene :deep(.sym-root.is-fault .sym-halo) { stroke: #ffab5c; }
.monitor-scene :deep(.sym-root.is-fault .sym-badge-fault .sym-badge-bg) { fill: #ffab5c; }

/* 图标后面的光晕圈去掉：状态只由角标承担 */
.monitor-scene :deep(.sym-halo) { display: none; }

/* ===== 选中标记（值守工作台：指出是哪台设备在报警） =====
   这是"选中"不是"状态" —— 设备状态仍只由角标承担，两者不混用。
   环画在 SVG 层（position:absolute 对 SVG 元素无效，故用真实的 <circle>）。 */
.monitor-scene__pick {
  fill: none;
  stroke: #ff8080;
  stroke-width: 2;
  opacity: 0.9;
  transform-box: fill-box;
  transform-origin: center;
  animation: monitor-pick-pulse 1.6s ease-in-out infinite;
}
@keyframes monitor-pick-pulse {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.18); }
}
@media (prefers-reduced-motion: reduce) {
  .monitor-scene__pick { animation: none; }
}

/* 异常角标闪烁：故障 2s / 预警 2.5s，与页面 3s 刷新周期错开 */
@keyframes monitor-badge-blink {
  0% { opacity: 1; }
  46% { opacity: 1; }
  50% { opacity: 0.2; }
  96% { opacity: 0.2; }
  100% { opacity: 1; }
}
.monitor-scene :deep(.sym-root.is-fault .sym-badge-fault) {
  animation: monitor-badge-blink 2s linear infinite;
  will-change: opacity;
}
.monitor-scene :deep(.sym-root.is-over .sym-badge-alarm) {
  animation: monitor-badge-blink 2.5s linear infinite;
  will-change: opacity;
}
@media (prefers-reduced-motion: reduce) {
  .monitor-scene :deep(.sym-root.is-fault .sym-badge-fault),
  .monitor-scene :deep(.sym-root.is-over .sym-badge-alarm) { animation: none; }
}
</style>
