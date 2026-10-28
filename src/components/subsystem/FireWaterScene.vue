<template>
  <div class="fw-scene">
    <svg
      class="fw-scene__svg"
      :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${sceneName}组态图`"
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

      <!-- ===== 连线（水流向） ===== -->
      <g class="fw-scene__edges">
        <path
          v-for="e in edges"
          :key="e.id"
          :d="pathOf(e)"
          class="fw-edge"
          :class="{ 'fw-edge--control': e.kind === 'control' }"
        />
        <path
          v-for="e in flowingEdges"
          :key="`flow-${e.id}`"
          :d="flowPathOf(e)"
          class="fw-edge__flow"
          marker-end="url(#fw-arrow)"
        />
      </g>

      <!-- ===== 图元 ===== -->
      <g
        v-for="n in nodeViews"
        :key="n.id"
        class="fw-scene__node"
        :class="{ 'fw-scene__node--schematic': n.schematic }"
        :transform="`translate(${n.x - n.size / 2}, ${n.y - n.size / 2})`"
        role="button"
        tabindex="0"
        :aria-label="`${n.label}：${n.value}`"
        @click="onSelect(n)"
        @keydown.enter.prevent="onSelect(n)"
        @keydown.space.prevent="onSelect(n)"
      >
        <title>{{ tipOf(n) }}</title>

        <SceneSymbolNode
          :symbol="n.symbol"
          :size="n.size"
          variant="image"
          :state="n.state"
        />

        <text class="fw-scene__label" :x="n.size / 2" :y="n.size + 16">{{ n.label }}</text>
        <text v-if="n.value" class="fw-scene__value" :x="n.size / 2" :y="n.size + 31">{{ n.value }}</text>
        <text v-if="n.subValue" class="fw-scene__sub" :x="n.size / 2" :y="n.size + 45">{{ n.subValue }}</text>

        <!-- 命中区：图元与文字之间的空白处也要能点中，否则只有像素处可点 -->
        <rect
          class="fw-scene__hit"
          x="0"
          y="0"
          :width="n.size"
          :height="n.size + 48"
          fill="none"
          pointer-events="all"
        />
      </g>
    </svg>

    <!-- ===== 图例 ===== -->
    <div class="fw-scene__legend">
      <span class="fw-scene__legend-item">
        <i class="fw-scene__legend-line" /> 供水管路
      </span>
      <span class="fw-scene__legend-item">
        <i class="fw-scene__legend-dot fw-scene__legend-dot--run" /> 正常
      </span>
      <span class="fw-scene__legend-item">
        <i class="fw-scene__legend-dot fw-scene__legend-dot--over" /> 报警
      </span>
      <span class="fw-scene__legend-item">
        <i class="fw-scene__legend-dot fw-scene__legend-dot--fault" /> 故障
      </span>
      <span class="fw-scene__legend-note">点击图元查看其下点位</span>
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
  gap: var(--spacing-md);
}

.fw-scene__svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 620px;
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
.fw-scene__legend {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.fw-scene__legend-item { display: inline-flex; align-items: center; gap: 5px; }
.fw-scene__legend-line {
  width: 18px; height: 3px; border-radius: 2px;
  background: var(--accent-primary); opacity: .55;
}
.fw-scene__legend-dot {
  width: 8px; height: 8px; border-radius: 50%;
}
.fw-scene__legend-dot--run { background: var(--success); }
.fw-scene__legend-dot--over { background: var(--warning); }
.fw-scene__legend-dot--fault { background: var(--danger); }
.fw-scene__legend-note { margin-left: auto; }
</style>
