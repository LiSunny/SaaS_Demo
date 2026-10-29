<template>
  <div class="sm-scene">
    <!--
      三层叠加，同一 viewBox 与同一容器尺寸 → 渲染区域完全对齐。
      拆层的原因：SVG 内的位图与 SVG 整体一起被光栅化，数值一变整张 SVG 失效，
      一堆 512×512 位图就要重新栅格化，刷新因此周期性卡顿。
      底图层内容不变 → 位图只光栅化一次；变化只发生在无位图的文本层与动画层。
    -->
    <div class="sm-scene__canvas">
      <!-- 层1 · 静态底图：底管连线 + 图元位图。内容不变 -->
      <svg
        class="sm-scene__svg sm-scene__svg--base"
        :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        :aria-label="`${sceneName}组态图`"
      >
        <g class="sm-scene__edges">
          <path
            v-for="e in edges"
            :key="e.id"
            :d="pathOf(e)"
            class="sm-edge"
            :class="{ 'sm-edge--control': e.kind === 'control' }"
          />
        </g>

        <g
          v-for="n in nodeViews"
          :key="n.id"
          class="sm-scene__node"
          :class="{ 'sm-scene__node--schematic': n.schematic }"
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
        class="sm-scene__svg sm-scene__svg--text"
        :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          v-for="n in nodeViews"
          :key="n.id"
          class="sm-scene__node"
          :class="{ 'sm-scene__node--schematic': n.schematic }"
          role="button"
          tabindex="0"
          :aria-label="`${n.label}：${n.value}`"
          @click="onSelect(n)"
          @keydown.enter.prevent="onSelect(n)"
          @keydown.space.prevent="onSelect(n)"
        >
          <title>{{ tipOf(n) }}</title>

          <text class="sm-scene__label" :x="n.x" :y="n.labelY">{{ n.label }}</text>
          <text v-if="n.value" class="sm-scene__value" :x="n.x" :y="n.valueY">{{ n.value }}</text>
          <text v-if="n.subValue" class="sm-scene__sub" :x="n.x" :y="n.subY">{{ n.subValue }}</text>

          <!-- 命中区：图元与文字之间的空白处也要能点中，否则只有像素处可点 -->
          <rect
            class="sm-scene__hit"
            :x="n.x - n.size / 2"
            :y="n.hitY"
            :width="n.size"
            :height="n.hitH"
            fill="none"
            pointer-events="all"
          />
        </g>
      </svg>

      <!-- 层3 · 流动动画：只有描边，无位图 -->
      <svg
        class="sm-scene__svg sm-scene__svg--flow"
        :viewBox="`0 0 ${viewbox.w} ${viewbox.h}`"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="sm-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 Z" class="sm-arrow__head" />
          </marker>
        </defs>

        <g class="sm-scene__edges">
          <path
            v-for="e in flowingEdges"
            :key="`flow-${e.id}`"
            :d="flowPathOf(e)"
            class="sm-edge__flow"
            marker-end="url(#sm-arrow)"
          />
        </g>
      </svg>

      <!-- 图例：浮在画面左上角（设计稿） -->
      <div class="sm-scene__legend">
        <div class="sm-scene__legend-title">点击图元查看其下点位</div>
        <div class="sm-scene__legend-items">
          <span class="sm-scene__legend-item">
            <i class="sm-scene__legend-dot sm-scene__legend-dot--run" /> 正常
          </span>
          <span class="sm-scene__legend-item">
            <i class="sm-scene__legend-dot sm-scene__legend-dot--warn" /> 预警
          </span>
          <span class="sm-scene__legend-item">
            <i class="sm-scene__legend-dot sm-scene__legend-dot--fault" /> 故障
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 子系统组态总貌（只读组态渲染器）
 *
 * 与组态编辑器（SceneCanvas.vue）分开：编辑器带网格 / 端口 / 状态条等编辑器件，
 * 监控页只保留"画面 + 实时值 + 状态"，所以这里自绘 SVG，
 * 但图元几何、端口坐标、正交连线路径全部复用 @/symbols 的同一套实现。
 *
 * 画面内容由 props.adapter 决定（消防水 11 图元 / 气体灭火 2 图元走同一套渲染链路）。
 */
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import SceneSymbolNode from '@/components/device-facility/SceneSymbolNode.vue'
import {
  edgePath,
  edgePathReversed,
  registerInlineSymbols,
  symbolDef,
  SYMBOL_REGISTRY_VERSION,
} from '@/symbols'
import { useSubsystemStore } from '@/stores/subsystem'
import { useSymbolStore } from '@/stores/symbols'
import type { SceneEdge } from '@/types/scene-config'
import type { SubsystemPointGroup, SubsystemSceneAdapter } from '@/types/subsystem-scene'

const props = defineProps<{
  /** 画面适配器（节点 / 连线 / 图元定义 / 绑定规则） */
  adapter: SubsystemSceneAdapter
}>()

const emit = defineEmits<{
  /** 点击图元 → 下钻查看其下点位 */
  select: [group: SubsystemPointGroup]
}>()

const store = useSubsystemStore()
const { points } = storeToRefs(store)
const { getRuntime } = store

const viewbox = computed(() => props.adapter.viewbox)
const edges = computed(() => props.adapter.edges)
const sceneName = computed(() => props.adapter.name)

/** 只有管道连线有流动动画 */
const flowingEdges = computed(() => edges.value.filter(e => e.flow && e.flow !== 'none'))

/**
 * 标签画在节点上方还是下方
 *
 * 节点下方有管线伸出时（连线挂在朝下的端口上），标签画在下面会被管线压住，
 * 这类节点把标签翻到节点上方。
 */
const labelAboveIds = computed(() => {
  // 自定义图元注册完成后才有端口信息 → 依赖注册版本号重新判定
  void SYMBOL_REGISTRY_VERSION.value
  const ids = new Set<string>()
  for (const e of edges.value) {
    for (const end of [e.from, e.to]) {
      const node = props.adapter.nodes.find(n => n.id === end.node)
      if (!node) continue
      const dir = symbolDef(node.symbol)?.ports?.[end.port ?? 0]?.dir
      if (dir === 'down') ids.add(node.id)
    }
  }
  return ids
})

/** 节点视图：位置标签取自布局，实时值与状态按绑定表聚合 */
const nodeViews = computed(() => {
  // 同一图元符号可能在画面里出现多次 → 按出现次序区分（第几个实例）
  const seen = new Map<string, number>()
  return props.adapter.nodes.map(n => {
    const nth = (seen.get(n.symbol) ?? 0) + 1
    seen.set(n.symbol, nth)
    const binding = props.adapter.bindingOf(n.symbol, nth)
    const agg = binding ? props.adapter.aggregate(binding, points.value, getRuntime) : null
    const below = n.y + (n.size ?? 60) / 2
    const above = n.y - (n.size ?? 60) / 2
    const flip = labelAboveIds.value.has(n.id)
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
      binding,
      labelY: flip ? above - 16 : below + 16,
      valueY: flip ? above - 31 : below + 31,
      subY: flip ? above - 45 : below + 45,
      // 命中区跟着标签走：标签翻到上方时，热区也要覆盖上方
      hitY: flip ? above - 48 : n.y - (n.size ?? 60) / 2,
      hitH: flip ? (n.size ?? 60) + 96 : (n.size ?? 60) + 48,
    }
  })
})

function pathOf(e: SceneEdge): string {
  // 端口坐标来自图元定义，自定义图元注册完成后才有值 → 依赖注册版本号触发重算
  void SYMBOL_REGISTRY_VERSION.value
  return edgePath(e, props.adapter.nodes)
}

function flowPathOf(e: SceneEdge): string {
  void SYMBOL_REGISTRY_VERSION.value
  return e.flow === 'reverse'
    ? edgePathReversed(e, props.adapter.nodes)
    : edgePath(e, props.adapter.nodes)
}

function tipOf(n: (typeof nodeViews.value)[number]): string {
  if (n.schematic) return `${n.label} · 示意节点，设备档案中无对应测点`
  return `${n.label} · ${n.value} · ${n.total} 个点位${n.abnormal ? ` · ${n.abnormal} 个异常` : ''}`
}

function onSelect(n: (typeof nodeViews.value)[number]): void {
  if (n.schematic) return
  const binding = n.binding
  if (!binding) return
  const members = props.adapter.aggregate(binding, points.value, getRuntime).points
  emit('select', {
    key: n.id,
    title: n.label,
    desc: `${n.symbol} · ${members.length} 个点位`,
    points: members,
  })
}

/**
 * 自定义图元注册
 *
 * 画面用的是平台内新增的图元（CUS-* / GFES-* 段位图），渲染链路必须先知道它们：
 *   1. 服务端已收录 → 以服务端为准（产品图最新、包围盒更准）
 *   2. 服务端未收录或接口不可用 → 用画面文件内联的定义兜底
 * 注册完成后 SYMBOL_REGISTRY_VERSION 自增，图元与连线各自重绘。
 */
onMounted(async () => {
  try {
    await useSymbolStore().load()
  } catch {
    // 未登录或接口不可用：画面文件内联的定义足够渲染
  }
  registerInlineSymbols(props.adapter.symbols)
})
</script>

<style scoped>
.sm-scene {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 三层共用同一容器：底图撑开高度，文本层与动画层绝对定位叠上去 */
.sm-scene__canvas {
  position: relative;
  flex: 1;
  min-height: 0;
}

.sm-scene__svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 文本层与动画层尺寸跟随容器 → 与底图落在同一渲染区域 */
.sm-scene__svg--text,
.sm-scene__svg--flow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 底图不参与命中：命中区交给文本层，避免位图挡住点击 */
.sm-scene__svg--base {
  pointer-events: none;
}

/* 动画层纯装饰 */
.sm-scene__svg--flow {
  pointer-events: none;
}

/* ===== 连线 ===== */
/* 底管实线 + 高亮光带沿流向移动：光带间隙露出底管，读起来是"管里有水在流" */
.sm-edge {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: .38;
}
.sm-edge--control {
  stroke: var(--text-tertiary);
  stroke-width: 2;
  stroke-dasharray: 6 5;
  opacity: .75;
}
.sm-edge__flow {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 12 28;
  opacity: .95;
  animation: sm-flow 1.1s linear infinite;
}
.sm-arrow__head { fill: var(--accent-primary); }

@keyframes sm-flow {
  to { stroke-dashoffset: -40; }
}

/* ===== 图元 ===== */
.sm-scene__node {
  cursor: pointer;
}
.sm-scene__node:focus { outline: none; }
.sm-scene__node:focus-visible .sm-scene__label { fill: var(--accent-primary); }
.sm-scene__node--schematic { cursor: default; opacity: .55; }

.sm-scene__label {
  fill: var(--text-secondary);
  font-size: 12px;
  text-anchor: middle;
}
.sm-scene__value {
  fill: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  text-anchor: middle;
  font-variant-numeric: tabular-nums;
}
.sm-scene__sub {
  fill: var(--text-muted);
  font-size: 10px;
  text-anchor: middle;
}

/* ===== 图例 ===== */
/* 浮在画面左上角：底 #FBFBFB / 边 #F3F3F3 / 圆角 6，标题与图例之间一条虚线 */
.sm-scene__legend {
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
.sm-scene__legend-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.sm-scene__legend-items {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(83, 101, 123, .35);
  font-size: 11px;
  color: var(--text-tertiary);
}
.sm-scene__legend-item { display: inline-flex; align-items: center; gap: 5px; }
.sm-scene__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
}
.sm-scene__legend-dot--run { background: var(--success); }
.sm-scene__legend-dot--warn { background: var(--danger); }
.sm-scene__legend-dot--fault { background: var(--warning); }

/* 故障在本页用橙色（图例口径与图元库全局红色故障态区分开） */
.sm-scene :deep(.sym-root.is-fault) {
  --sym-fill: var(--warning);
  --sym-stroke: var(--warning);
}
.sm-scene :deep(.sym-root.is-fault .sym-halo) { stroke: var(--warning); }
.sm-scene :deep(.sym-badge-fault .sym-badge-bg) { fill: var(--warning); }

/* ===== 角标：正常不显示，只有异常提示 ===== */
/* 正常（is-run）的绿色 ▶ 角标在组态里是噪声：满屏图元全带角标时，
   角标不再传递"这里有异常"的信息，反而淹没真正要看的故障 / 预警角标。 */
.sm-scene :deep(.sym-root.is-run .sym-badge-run) { display: none; }

/* 超限 / 预警：图元库没有单独的角标图形，复用报警角标（⚠ 三角），
   配色按本页图例口径取红色 —— 预警=红、故障=橙。 */
.sm-scene :deep(.sym-root.is-over .sym-badge-alarm) { display: block; }
.sm-scene :deep(.sym-root.is-over .sym-badge-alarm .sym-badge-bg) { fill: var(--danger); }
.sm-scene :deep(.sym-root.is-over .sym-badge-alarm .sym-badge-mark) { stroke: var(--bg-card); }

/* ===== 图标后面的光晕圈去掉 ===== */
/* 状态只由角标表达，画面里不再有套在图标外圈的圆环。 */
.sm-scene :deep(.sym-halo) { display: none; }

/* ===== 异常角标闪烁 ===== */
/* 角标是画面里唯一的异常提示，必须自己跳起来 —— 不闪的角标在余光里扫不到。
   节奏按两点定：
     1. 别太快。1s 硬切在 60Hz 屏上是每秒 60 帧全亮全灭，刺眼且像卡顿；
        改成 2s（故障）/ 2.5s（预警）周期。
     2. 别和刷新撞节奏。页面每 3s 刷一轮，1s 的角标周期会被刷新切成一段段，
        看起来像画面周期性顿住。2s / 2.5s 与 3s 错开。
   亮灭边缘各留 8% 的渐变过渡，避免硬切的刺眼感。
   will-change: opacity 把角标提升为合成层，闪烁由合成器处理，
   不再每帧重绘底图层（那里有一堆 512×512 位图，重绘代价高）。 */
@keyframes sm-badge-blink {
  0% { opacity: 1; }
  46% { opacity: 1; }
  50% { opacity: .2; }
  96% { opacity: .2; }
  100% { opacity: 1; }
}
.sm-scene :deep(.sym-root.is-fault .sym-badge-fault) {
  animation: sm-badge-blink 2s linear infinite;
  will-change: opacity;
}
.sm-scene :deep(.sym-root.is-over .sym-badge-alarm) {
  animation: sm-badge-blink 2.5s linear infinite;
  will-change: opacity;
}
@media (prefers-reduced-motion: reduce) {
  .sm-scene :deep(.sym-root.is-fault .sym-badge-fault),
  .sm-scene :deep(.sym-root.is-over .sym-badge-alarm) { animation: none; }
}
</style>
