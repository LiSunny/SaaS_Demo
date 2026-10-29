<template>
  <svg
    class="donut"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
  >
    <!-- 底环 -->
    <circle
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      stroke="rgba(255, 255, 255, 0.08)"
      :stroke-width="thickness"
    />
    <!-- 状态分段 -->
    <circle
      v-for="(s, i) in arcs"
      :key="i"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      fill="none"
      :stroke="s.color"
      :stroke-width="thickness"
      :stroke-dasharray="`${s.len} ${circumference - s.len}`"
      :stroke-dashoffset="-s.offset"
      :transform="`rotate(-90 ${size / 2} ${size / 2})`"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * 状态分布环形图
 *
 * 结构对齐 Figma「单个指标总分占比」卡片里的 56×56 环形图：
 * 底环 + 按占比切分的彩色弧段。
 *
 * 分段之间留 1px 的缝（用 dasharray 收尾减去 gap），避免相邻色块糊在一起。
 */
import { computed } from 'vue'

export interface DonutSegment {
  /** 占比 0~1 */
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    segments: DonutSegment[]
    /** 直径（px） */
    size?: number
    /** 环宽（px） */
    thickness?: number
    /** 分段之间的缝（占周长的比例） */
    gap?: number
  }>(),
  { size: 56, thickness: 8, gap: 0.012 },
)

const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

/** 把占比换算成 dasharray / dashoffset */
const arcs = computed(() => {
  const total = props.segments.reduce((s, x) => s + Math.max(0, x.value), 0)
  if (!total) return []
  const gapLen = props.gap * circumference.value
  let offset = 0
  return props.segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = s.value / total
      const len = Math.max(0, pct * circumference.value - gapLen)
      const arc = { color: s.color, len, offset }
      offset += pct * circumference.value
      return arc
    })
})
</script>

<style scoped>
.donut {
  display: block;
  flex-shrink: 0;
}
</style>
