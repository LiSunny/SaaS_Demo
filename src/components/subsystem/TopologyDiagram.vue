<template>
  <div class="td-wrap" ref="wrapRef">
    <svg
      class="td-svg"
      :viewBox="`0 0 ${TOPOLOGY_VIEWBOX.w} ${TOPOLOGY_VIEWBOX.h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="`${title}组态图`"
    >
      <defs>
        <marker
          id="td-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" class="td-arrow-head" />
        </marker>
      </defs>

      <!-- ===== 连线（水流向） ===== -->
      <g class="td-links">
        <path
          v-for="(l, i) in linkPaths"
          :key="`l-${i}`"
          :d="l.d"
          class="td-link"
          marker-end="url(#td-arrow)"
        />
      </g>

      <!-- ===== 环节节点 ===== -->
      <g
        v-for="a in aggregates"
        :key="a.stage.id"
        class="td-stage"
        :class="[`td-stage--${a.status}`]"
        :transform="`translate(${a.stage.pos.x}, ${a.stage.pos.y})`"
        tabindex="0"
        role="button"
        :aria-label="`${a.stage.name}：${statusText(a.status)}`"
        @click="emit('select', a.stage.id)"
        @keydown.enter.prevent="emit('select', a.stage.id)"
        @keydown.space.prevent="emit('select', a.stage.id)"
        @mouseenter="hover = a.stage.id"
        @mouseleave="hover = null"
      >
        <!-- 呼吸光晕：只在异常时出现 -->
        <rect
          v-if="isAbnormal(a.status)"
          class="td-stage__halo"
          x="-4" y="-4"
          :width="a.stage.pos.w + 8" :height="a.stage.pos.h + 8"
          rx="13"
        />

        <rect
          class="td-stage__box"
          x="0" y="0"
          :width="a.stage.pos.w" :height="a.stage.pos.h"
          rx="10"
        />

        <!-- 标题行：图标 + 名称 -->
        <g :transform="`translate(13, 14)`" class="td-stage__icon">
          <AppIcon :name="a.stage.icon" :size="18" />
        </g>
        <text class="td-stage__name" x="39" y="29">{{ a.stage.name }}</text>

        <!-- 状态徽标 -->
        <g :transform="`translate(13, 46)`">
          <rect
            class="td-stage__badge-bg"
            :class="`td-stage__badge-bg--${a.status}`"
            :width="badgeWidth(a)" height="22" rx="11"
          />
          <text
            class="td-stage__badge-text"
            :class="`td-stage__badge-text--${a.status}`"
            x="10" y="15"
          >{{ badgeText(a) }}</text>
        </g>

        <!-- 底部：点位数量 + 数据更新时间 -->
        <text class="td-stage__count" x="13" y="88">{{ a.points.length }} 点</text>
        <text class="td-stage__time" :x="a.stage.pos.w - 13" y="88" text-anchor="end">
          {{ timeText(a.updatedAt) }}
        </text>
      </g>
    </svg>

    <!-- ===== hover 提示 ===== -->
    <div
      v-if="hoverAgg"
      class="td-tip"
      :style="tipStyle"
    >
      <div class="td-tip__name">{{ hoverAgg.stage.name }}</div>
      <div class="td-tip__desc">{{ hoverAgg.stage.desc }}</div>
      <div class="td-tip__row">
        <span>状态</span><b :class="`td-tip__status--${hoverAgg.status}`">{{ statusText(hoverAgg.status) }}</b>
      </div>
      <div class="td-tip__row"><span>监测点位</span><b>{{ hoverAgg.points.length }} 个</b></div>
      <div v-if="hoverAgg.counts.alarm" class="td-tip__row"><span>报警</span><b class="td-tip__status--alarm">{{ hoverAgg.counts.alarm }} 个</b></div>
      <div v-if="hoverAgg.counts.fault" class="td-tip__row"><span>故障</span><b class="td-tip__status--fault">{{ hoverAgg.counts.fault }} 个</b></div>
      <div class="td-tip__row"><span>数据更新</span><b>{{ fullTime(hoverAgg.updatedAt) }}</b></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import {
  TOPOLOGY_VIEWBOX,
  STAGE_STATUS_TEXT,
  isStageAbnormal,
  type StageAggregate,
  type StageStatus,
  type TopologyLink,
  type TopologyStage,
} from '@/config/subsystem-topology'

const props = defineProps<{
  title: string
  stages: TopologyStage[]
  links: TopologyLink[]
  aggregates: StageAggregate[]
}>()

const emit = defineEmits<{
  /** 点击环节 → 查看该环节下的点位 */
  select: [stageId: string]
}>()

const hover = ref<string | null>(null)
const wrapRef = ref<HTMLElement | null>(null)

function statusText(s: StageStatus): string {
  return STAGE_STATUS_TEXT[s]
}
function isAbnormal(s: StageStatus): boolean {
  return isStageAbnormal(s)
}

/** 状态徽标文案：异常时带数量，正常时只说正常 */
function badgeText(a: StageAggregate): string {
  if (a.status === 'alarm') return `报警 ${a.counts.alarm}`
  if (a.status === 'fault') return `故障 ${a.counts.fault}`
  if (a.status === 'nodata') return '无数据'
  return '正常'
}

/** 估算文本宽度：中文按 1 个字宽，数字/字母按 0.56 */
function textWidth(s: string, fs: number): number {
  let w = 0
  for (const ch of s) w += /[\u4e00-\u9fa5]/.test(ch) ? fs : fs * 0.56
  return w
}
function badgeWidth(a: StageAggregate): number {
  return Math.round(textWidth(badgeText(a), 12) + 20)
}

/** 数据更新时间：HH:mm:ss（值守最关心的就是这个） */
function timeText(ts: number): string {
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
}
function fullTime(ts: number): string {
  if (!ts) return '暂无数据'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${timeText(ts)}`
}

/**
 * 连线路径
 *
 * 三种走法自动判定：
 *   同排且目标在右  → 水平向右（右边缘 → 左边缘）
 *   同排且目标在左  → 水平向左（左边缘 → 右边缘）
 *   上下不同排      → 竖直向下/上（底边 → 顶边）
 *   上下不同排且横向有偏移 → 分流（三折线，经公共竖干分叉）
 */
const linkPaths = computed(() => {
  const map = new Map(props.stages.map(s => [s.id, s]))
  return props.links
    .map(l => {
      const from = map.get(l.from)
      const to = map.get(l.to)
      if (!from || !to) return null

      const fcx = from.pos.x + from.pos.w / 2
      const tcy = to.pos.y + to.pos.h / 2
      const fcy = from.pos.y + from.pos.h / 2
      const sameRow = Math.abs(from.pos.y - to.pos.y) < 5

      // 同排：水平连线
      if (sameRow) {
        const ltr = to.pos.x > from.pos.x
        const x1 = ltr ? from.pos.x + from.pos.w : from.pos.x
        const x2 = ltr ? to.pos.x : to.pos.x + to.pos.w
        const dx = Math.max(22, Math.abs(x2 - x1) * 0.45) * (ltr ? 1 : -1)
        return {
          key: `${l.from}-${l.to}`,
          d: `M ${x1} ${fcy} C ${x1 + dx} ${fcy}, ${x2 - dx} ${tcy}, ${x2} ${tcy}`,
        }
      }

      // 跨排且中心对齐：竖直连线
      if (Math.abs(fcx - (to.pos.x + to.pos.w / 2)) < 5) {
        const down = to.pos.y > from.pos.y
        const y1 = down ? from.pos.y + from.pos.h : from.pos.y
        const y2 = down ? to.pos.y : to.pos.y + to.pos.h
        const dy = Math.max(22, Math.abs(y2 - y1) * 0.45) * (down ? 1 : -1)
        return {
          key: `${l.from}-${l.to}`,
          d: `M ${fcx} ${y1} C ${fcx} ${y1 + dy}, ${fcx} ${y2 - dy}, ${fcx} ${y2}`,
        }
      }

      // 跨排且横向有偏移：分流（公共竖干 + 两支）
      const trunkX = to.pos.x + to.pos.w + 45
      const sx = Math.min(trunkX, from.pos.x - 20)
      return {
        key: `${l.from}-${l.to}`,
        d: `M ${from.pos.x} ${fcy} L ${sx} ${fcy} L ${sx} ${tcy} L ${to.pos.x + to.pos.w} ${tcy}`,
      }
    })
    .filter(Boolean) as Array<{ key: string; d: string }>
})

const hoverAgg = computed(() =>
  hover.value ? props.aggregates.find(a => a.stage.id === hover.value) ?? null : null,
)

const tipStyle = computed(() => {
  const a = hoverAgg.value
  if (!a || !wrapRef.value) return {}
  const svg = wrapRef.value.querySelector('svg')
  if (!svg) return {}
  const box = svg.getBoundingClientRect()
  const parent = wrapRef.value.getBoundingClientRect()
  const scale = box.width / TOPOLOGY_VIEWBOX.w
  // 跟随鼠标不好取（hover 的是 SVG 元素），改用节点中心定位
  const cx = (a.stage.pos.x + a.stage.pos.w / 2) * scale + (box.left - parent.left)
  const cy = (a.stage.pos.y + a.stage.pos.h / 2) * scale + (box.top - parent.top)
  return { left: `${cx}px`, top: `${cy}px` }
})
</script>

<style scoped>
/* SVG 撑满可用空间，preserveAspectRatio=meet 保证整图等比缩放不裁切 */
.td-wrap {
  position: relative;
  width: 100%; flex: 1; min-height: 0;
  display: flex; align-items: center; justify-content: center;
}
.td-svg { width: 100%; height: 100%; display: block; }

/* ===== 连线 ===== */
.td-link {
  fill: none;
  stroke: var(--border-high);
  stroke-width: 1.8;
  stroke-linejoin: round;
}
.td-arrow-head { fill: var(--border-high); }

/* ===== 节点 ===== */
.td-stage { cursor: pointer; outline: none; }
.td-stage__box {
  fill: var(--bg-card);
  stroke: var(--border-default);
  stroke-width: 1.2;
  transition: stroke .2s ease, fill .2s ease;
}
.td-stage:hover .td-stage__box,
.td-stage:focus-visible .td-stage__box { stroke: var(--accent-primary); }
.td-stage:focus-visible .td-stage__box { stroke-width: 2; }

.td-stage--alarm .td-stage__box { fill: var(--danger-bg); stroke: var(--danger); stroke-width: 1.8; }
.td-stage--fault .td-stage__box { fill: var(--warning-bg); stroke: var(--warning); stroke-width: 1.8; }
.td-stage--nodata .td-stage__box { fill: var(--bg-sub-card); stroke: var(--border-default); stroke-dasharray: 4 3; }

/* 呼吸光晕：1.8s 周期，远低于光敏阈值（3Hz），值班室长时间看不刺眼 */
.td-stage__halo {
  fill: none;
  stroke: var(--danger);
  stroke-width: 2;
  animation: td-breathe 1.8s ease-in-out infinite;
}
.td-stage--fault .td-stage__halo { stroke: var(--warning); }
@keyframes td-breathe {
  0%, 100% { opacity: .2; }
  50%      { opacity: .85; }
}

.td-stage__icon { color: var(--text-secondary); }
.td-stage--alarm .td-stage__icon { color: var(--danger-text); }
.td-stage--fault .td-stage__icon { color: var(--warning-text); }

.td-stage__name {
  font-size: 13.5px; font-weight: 600;
  fill: var(--text-primary);
  dominant-baseline: middle;
}
.td-stage__badge-bg { fill: var(--normal-bg); }
.td-stage__badge-bg--alarm { fill: var(--danger-bg); }
.td-stage__badge-bg--fault { fill: var(--warning-bg); }
.td-stage__badge-bg--nodata { fill: var(--normal-bg); }
.td-stage__badge-text {
  font-size: 12px; font-weight: 600; fill: var(--text-secondary);
}
.td-stage__badge-text--alarm { fill: var(--danger-text); }
.td-stage__badge-text--fault { fill: var(--warning-text); }

.td-stage__count { font-size: 12px; fill: var(--text-muted); }
.td-stage__time {
  font-size: 12px; fill: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* ===== hover 提示 ===== */
.td-tip {
  position: absolute;
  transform: translate(-50%, calc(-100% - 12px));
  min-width: 190px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .14);
  font-size: var(--font-xs);
  color: var(--text-secondary);
  pointer-events: none;
  z-index: 5;
}
.td-tip__name { font-size: var(--font-small); font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.td-tip__desc { color: var(--text-muted); margin-bottom: 6px; line-height: 1.5; }
.td-tip__row { display: flex; justify-content: space-between; gap: 12px; line-height: 1.8; }
.td-tip__row b { color: var(--text-primary); font-weight: 600; }
.td-tip__status--alarm { color: var(--danger-text); }
.td-tip__status--fault { color: var(--warning-text); }
</style>
