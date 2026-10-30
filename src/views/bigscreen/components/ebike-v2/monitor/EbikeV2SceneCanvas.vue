<template>
  <div class="monitor-scene">
    <!-- 空态：未取到画面 -->
    <div v-if="!scene" class="monitor-scene__empty">
      <span class="monitor-scene__empty-text">{{ emptyText }}</span>
    </div>

    <div v-else class="monitor-scene__canvas">
      <!--
        三层叠加，同一 viewBox 与同一容器尺寸 → 渲染区域完全对齐。
        拆层的原因：SVG 内的位图与 SVG 整体一起被光栅化，动画一动整张 SVG 失效，
        一堆 512×512 位图就要重新栅格化，画面会周期性卡顿。
        底图层内容不变 → 位图只光栅化一次；变化只发生在无位图的文本层与动画层。
      -->
      <!-- 层1 · 静态底图：连线 + 图元位图 -->
      <svg
        class="monitor-scene__svg monitor-scene__svg--base"
        :viewBox="viewBox"
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
          v-for="n in nodes"
          :key="n.id"
          class="monitor-scene__node"
          :transform="`translate(${n.x - n.size / 2}, ${n.y - n.size / 2})`"
        >
          <SceneSymbolNode :symbol="n.symbol" :size="n.size" variant="image" :state="n.state" />
        </g>
      </svg>

      <!-- 层2 · 设备名称（无位图，随画面刷新重绘） -->
      <svg
        class="monitor-scene__svg monitor-scene__svg--text"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <text
          v-for="n in nodes"
          :key="n.id"
          class="monitor-scene__label"
          :x="n.x"
          :y="n.y + n.size / 2 + 18"
        >{{ labelOf(n) }}</text>
      </svg>

      <!-- 层3 · 管道流动动画（只有描边，无位图） -->
      <svg
        class="monitor-scene__svg monitor-scene__svg--flow"
        :viewBox="viewBox"
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
  </div>
</template>

<script setup lang="ts">
/**
 * 系统监测页的只读组态画布
 *
 * 与组态编辑器（SceneCanvas.vue）分开：编辑器带网格 / 端口 / 状态条等编辑器件，
 * 大屏只需要"画面 + 设备"。图元几何、端口坐标、正交连线路径复用 @/symbols 同一套实现。
 */
import { computed, onMounted, useId } from 'vue'
import SceneSymbolNode from '@/components/device-facility/SceneSymbolNode.vue'
import {
  edgePath,
  edgePathReversed,
  symbolDef,
  SYMBOL_REGISTRY_VERSION,
} from '@/symbols'
import { useSymbolStore } from '@/stores/symbols'
import type { SceneConfig, SceneEdge, SceneNode } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    /** 画面（来自 /api/scenes） */
    scene?: SceneConfig | null
    /** 空态文案 */
    emptyText?: string
  }>(),
  { scene: null, emptyText: '该系统暂无组态画面' },
)

/** 箭头 marker id（多实例不冲突） */
const arrowId = `monitor-arrow-${useId()}`

const viewBox = computed(() => `0 0 ${props.scene?.width || 1200} ${props.scene?.height || 700}`)

const nodes = computed<SceneNode[]>(() => props.scene?.nodes ?? [])
const edges = computed<SceneEdge[]>(() => props.scene?.edges ?? [])

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

function labelOf(n: SceneNode): string {
  return n.label || symbolDef(n.symbol)?.name || n.symbol
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
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.monitor-scene {
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
.monitor-scene__label {
  fill: #a9c9ea;
  font-size: 13px;
  text-anchor: middle;
  paint-order: stroke;
  stroke: rgba(4, 30, 64, 0.85);
  stroke-width: 3px;
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
