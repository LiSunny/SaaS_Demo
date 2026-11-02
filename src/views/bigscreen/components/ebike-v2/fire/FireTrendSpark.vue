<template>
  <svg
    class="spark"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="ariaLabel"
  >
    <defs>
      <!-- 面积渐变：底部 #002857 → 顶部 #004C94（设计稿 94:9962 导出实测） -->
      <linearGradient :id="gid" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#002857" />
        <stop offset="1" stop-color="#004C94" />
      </linearGradient>
    </defs>
    <path v-if="areaPath" :d="areaPath" :fill="`url(#${gid})`" />
    <path
      v-if="linePath"
      :d="linePath"
      fill="none"
      stroke="#6facdc"
      stroke-width="1"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 迷你趋势面积图
 *
 * 设计稿 94:9962 / 94:9963 / 94:9967 的结构：一条平滑曲线 + 曲线下方渐变填充，
 * 画布 292×66（曲线占上 53.5px，填充一直到底部 65.5px）。
 *
 * 为什么自己画而不是用 ECharts：
 *   - 设计稿里这三个图就是"纯曲线 + 面积"：没有坐标轴、没有图例、没有 tooltip，
 *     用 ECharts 要把这些默认组件全关掉，只剩 series —— 等于只用它画一条 path。
 *   - 尺寸只有 291×65，一次 ECharts 实例要挂 grid/axis/动画/canvas 上下文，
 *     而大屏是 3s 刷新周期 + 三维模型持续动画，三个实例的 setOption/resize
 *     是白付的开销；SVG 只是一串 path 字符串，每轮重算一次，成本可忽略。
 *   - 颜色走固定值（设计稿配色），跟着主题切换不需要重新 setOption。
 *   - 与本项目既有做法一致：组态画面（EbikeV2SceneCanvas）也是自绘 SVG。
 *
 * 什么时候该换成 ECharts：要 tooltip 读某个时刻的精确值、要坐标轴刻度、
 * 要多序列对比或时间轴缩放 —— 那时它才划算。
 */
import { computed, useId } from 'vue'

/** 画布尺寸（与设计稿导出的 SVG 一致） */
const W = 292
const H = 66
/** 曲线带的上下沿 */
const Y_TOP = 0.5
const Y_BOTTOM = 53.5
/** 面积填充的底边 */
const Y_AREA = 65.5

const props = defineProps<{
  /** 趋势序列（24 个点） */
  series: number[]
  /** 无障碍标签（读屏用） */
  ariaLabel?: string
}>()

/** 渐变 id 必须每实例唯一，否则同页多个图会互相覆盖 */
const gid = `fire-trend-spark-${useId()}`

/** 数据 → 画布坐标点 */
const points = computed(() => {
  const s = props.series.filter((v) => Number.isFinite(v))
  if (s.length < 2) return []
  const min = Math.min(...s)
  const max = Math.max(...s)
  const span = max - min || 1
  const x0 = 0.5
  const x1 = W - 0.5
  const step = (x1 - x0) / (s.length - 1)
  return s.map((v, i) => ({
    x: x0 + step * i,
    y: Y_BOTTOM - ((v - min) / span) * (Y_BOTTOM - Y_TOP),
  }))
})

/**
 * Catmull-Rom 转三次贝塞尔：过点且切线连续，比折线自然，比样条省。
 * 控制点取前后邻点的 1/6 偏移量。
 */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

const linePath = computed(() => smoothPath(points.value))

/** 面积：曲线 + 右侧落到底边 + 底边 + 左侧回到起点 */
const areaPath = computed(() => {
  const pts = points.value
  if (pts.length < 2) return ''
  const line = smoothPath(pts)
  const last = pts[pts.length - 1]
  const first = pts[0]
  return `${line} L ${last.x.toFixed(2)} ${Y_AREA} L ${first.x.toFixed(2)} ${Y_AREA} Z`
})
</script>

<style lang="scss" scoped>
/* 尺寸由外层布局给（设计稿 291×65），这里只兜底 */
.spark {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
