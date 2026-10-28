<template>
  <div class="fw-scene">
    <!--
      三层叠加，同一 viewBox 与同一容器尺寸 → 渲染区域完全对齐。
      拆层的原因：SVG 内的位图与 SVG 整体一起被光栅化，数值一变整张 SVG 失效，
      12 张 512×512 位图就要重新栅格化（单次约 79ms），刷新因此周期性卡顿。
      底图层内容不变 → 位图只光栅化一次；变化只发生在无位图的文本层与动画层。
    -->
    <div class="fw-scene__canvas">
      <!-- 层1 · 静态底图：底管连线 + 图元位图。内容不变 -->
      <svg
        class="fw-scene__svg fw-scene__svg--base"
        :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-label="`${sceneName}组态图`"
      >
        <g class="fw-scene__edges">
          <path
            v-for="e in edges"
            :key="e.id"
            :d="pathOf(e)"
            class="fw-edge"
            :class="{ 'fw-edge--control': e.kind === 'control' }"
          />
        </g>

        <g
          v-for="n in nodeViews"
          :key="n.id"
          class="fw-scene__node"
          :class="{ 'fw-scene__node--schematic': n.schematic }"
          :transform="`translate(${n.x - n.size / 2}, ${n.y - n.size / 2})`"
          aria-hidden="true"
        >
          <SceneSymbolNode
            :symbol="n.symbol"
            :size="n.size"
            variant="image"
            :state="n.state"
          />
        </g>
      </svg>

      <!-- 层2 · 文本与交互：数值随刷新变化，层内无位图 -->
      <svg
        class="fw-scene__svg fw-scene__svg--text"
        :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          v-for="n in nodeViews"
          :key="n.id"
          class="fw-scene__node"
          :class="{ 'fw-scene__node--schematic': n.schematic }"
          role="button"
          tabindex="0"
          :aria-label="`${n.label}：${n.value}`"
          @click="onSelect(n)"
          @keydown.enter.prevent="onSelect(n)"
          @keydown.space.prevent="onSelect(n)"
        >
          <title>{{ tipOf(n) }}</title>

          <text class="fw-scene__label" :x="n.x" :y="n.y + n.size / 2 + 16">{{ n.label }}</text>
          <text v-if="n.value" class="fw-scene__value" :x="n.x" :y="n.y + n.size / 2 + 31">{{ n.value }}</text>
          <text v-if="n.subValue" class="fw-scene__sub" :x="n.x" :y="n.y + n.size / 2 + 45">{{ n.subValue }}</text>

          <!-- 命中区：图元与文字之间的空白处也要能点中，否则只有像素处可点 -->
          <rect
            class="fw-scene__hit"
            :x="n.x - n.size / 2"
            :y="n.y - n.size / 2"
            :width="n.size"
            :height="n.size + 48"
            fill="none"
            pointer-events="all"
          />
        </g>
      </svg>

      <!-- 层3 · 流动动画：只有描边，无位图 -->
      <svg
        class="fw-scene__svg fw-scene__svg--flow"
        :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="fw-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" class="fw-arrow__head" />
          </marker>
        </defs>

        <g class="fw-scene__edges">
          <path
            v-for="e in flowingEdges"
            :key="`flow-${e.id}`"
            :d="flowPathOf(e)"
            class="fw-edge__flow"
            marker-end="url(#fw-arrow)"
          />
        </g>
      </svg>

      <!-- 图例：浮在画面左上角（设计稿） -->
      <div class="fw-scene__legend">
        <div class="fw-scene__legend-title">点击图元查看其下点位</div>
        <div class="fw-scene__legend-items">
          <span class="fw-scene__legend-item">
            <i class="fw-scene__legend-dot fw-scene__legend-dot--run" /> 正常
          </span>
          <span class="fw-scene__legend-item">
            <i class="fw-scene__legend-dot fw-scene__legend-dot--warn" /> 预警
          </span>
          <span class="fw-scene__legend-item">
            <i class="fw-scene__legend-dot fw-scene__legend-dot--fault" /> 故障
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 消防给水系统总貌（只读组态渲染器）
 *
 * 与组态编辑器（SceneCanvas.vue）分开：编辑器带网格 / 端口 / 状态条等编辑器件，
 * 监控页只保留"画面 + 实时值 + 状态"，所以这里自绘 SVG，
 * 但图元几何、端口坐标、正交连线路径全部复用 @/symbols 的同一套实现。
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import SceneSymbolNode from '@/components/device-facility/SceneSymbolNode.vue'
import { edgePath, edgePathReversed } from '@/symbols'
import { useSubsystemStore } from '@/stores/subsystem'
import {
  FIREWATER_EDGES,
  FIREWATER_NODE_BINDINGS,
  FIREWATER_NODES,
  FIREWATER_SCENE_NAME,
  FIREWATER_VIEWBOX,
  aggregateNode,
} from '@/config/firewater-scene'
import type { SceneEdge } from '@/types/scene-config'
import type { FireWaterPointGroup } from '@/types/firewater'

const props = defineProps<{
  /** 场景名称（无障碍标签） */
  sceneName?: string
}>()

const emit = defineEmits<{
  /** 点击图元 → 下钻查看其下点位 */
  select: [group: FireWaterPointGroup]
}>()

const store = useSubsystemStore()
const { points } = storeToRefs(store)
const { getRuntime } = store

const viewbox = FIREWATER_VIEWBOX
const edges = FIREWATER_EDGES
const sceneName = computed(() => props.sceneName ?? FIREWATER_SCENE_NAME)

/** 只有管道连线有流动动画 */
const flowingEdges = computed(() => edges.filter(e => e.flow && e.flow !== 'none'))

/** 节点视图：位置标签取自布局，实时值与状态按绑定表聚合 */
const nodeViews = computed(() => {
  const bindingMap = new Map(FIREWATER_NODE_BINDINGS.map(b => [b.nodeId, b]))
  return FIREWATER_NODES.map(n => {
    const binding = bindingMap.get(n.id)
    const agg = binding ? aggregateNode(binding, points.value, getRuntime) : null
    return {
      id: n.id,
      symbol: n.symbol,
      label: n.label ?? n.symbol,
      x: n.x,
      y: n.y,
      size: n.size ?? 60,
      value: agg?.value ?? '',
      subValue: agg?.subValue ?? '',
      state: agg?.state ?? {},
      abnormal: agg?.abnormal ?? 0,
      total: agg?.points.length ?? 0,
      schematic: binding?.schematic ?? false,
    }
  })
})

function pathOf(e: SceneEdge): string {
  return edgePath(e, FIREWATER_NODES)
}

function flowPathOf(e: SceneEdge): string {
  return e.flow === 'reverse' ? edgePathReversed(e, FIREWATER_NODES) : edgePath(e, FIREWATER_NODES)
}

function tipOf(n: (typeof nodeViews.value)[number]): string {
  if (n.schematic) return `${n.label} · 示意节点，设备档案中无对应测点`
  return `${n.label} · ${n.value} · ${n.total} 个点位${n.abnormal ? ` · ${n.abnormal} 个异常` : ''}`
}

function onSelect(n: (typeof nodeViews.value)[number]): void {
  if (n.schematic) return
  const binding = FIREWATER_NODE_BINDINGS.find(b => b.nodeId === n.id)
  if (!binding) return
  const members = aggregateNode(binding, points.value, getRuntime).points
  emit('select', {
    key: n.id,
    title: n.label,
    desc: `${n.symbol} · ${members.length} 个点位`,
    points: members,
  })
}
</script>

<style scoped>
.fw-scene {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 三层共用同一容器：底图撑开高度，文本层与动画层绝对定位叠上去 */
.fw-scene__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
}

.fw-scene__svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 文本层与动画层尺寸跟随容器 → 与底图落在同一渲染区域 */
.fw-scene__svg--text,
.fw-scene__svg--flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 底图不参与命中：命中区交给文本层，避免位图挡住点击 */
.fw-scene__svg--base {
  pointer-events: none;
}

/* 动画层纯装饰 */
.fw-scene__svg--flow {
  pointer-events: none;
}

/* ===== 连线 ===== */
/* 底管实线 + 高亮光带沿流向移动：光带间隙露出底管，读起来是"管里有水在流" */
.fw-edge {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .38;
}
.fw-edge--control {
  stroke: var(--text-tertiary);
  stroke-width: 2;
  stroke-dasharray: 6 5;
  opacity: .75;
}
.fw-edge__flow {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 12 28;
  opacity: .95;
  animation: fw-flow 1.1s linear infinite;
}
.fw-arrow__head { fill: var(--accent-primary); }

@keyframes fw-flow {
  to { stroke-dashoffset: -40; }
}

/* ===== 图元 ===== */
.fw-scene__node {
  cursor: pointer;
}
.fw-scene__node:focus { outline: none; }
.fw-scene__node:focus-visible .fw-scene__label { fill: var(--accent-primary); }
.fw-scene__node--schematic { cursor: default; opacity: .55; }

.fw-scene__label {
  fill: var(--text-secondary);
  font-size: 12px;
  text-anchor: middle;
}
.fw-scene__value {
  fill: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  text-anchor: middle;
  font-variant-numeric: tabular-nums;
}
.fw-scene__sub {
  fill: var(--text-muted);
  font-size: 10px;
  text-anchor: middle;
}

/* ===== 图例 ===== */
/* 浮在画面左上角：底 #FBFBFB / 边 #F3F3F3 / 圆角 6，标题与图例之间一条虚线 */
.fw-scene__legend {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 186px;
  padding: 8px 12px;
  background: var(--bg-sub-card);
  border: 1px solid var(--border-low);
  border-radius: 6px;
  pointer-events: none;
}
.fw-scene__legend-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.fw-scene__legend-items {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(83, 101, 123, .35);
  font-size: 11px;
  color: var(--text-tertiary);
}
.fw-scene__legend-item { display: inline-flex; align-items: center; gap: 5px; }
.fw-scene__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
}
.fw-scene__legend-dot--run { background: var(--success); }
.fw-scene__legend-dot--warn { background: var(--danger); }
.fw-scene__legend-dot--fault { background: var(--warning); }

/* 故障在本页用橙色（图例口径与图元库全局红色故障态区分开） */
.fw-scene :deep(.sym-root.is-fault) {
  --sym-fill: var(--warning);
  --sym-stroke: var(--warning);
}
.fw-scene :deep(.sym-root.is-fault .sym-halo) { stroke: var(--warning); }
.fw-scene :deep(.sym-badge-fault .sym-badge-bg) { fill: var(--warning); }
</style>
