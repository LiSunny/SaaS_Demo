<template>
  <svg
    class="fw-ring"
    :width="size"
    :height="size"
    viewBox="0 0 56 56"
    role="img"
    :aria-label="ariaLabel"
  >
    <circle class="fw-ring__track" cx="28" cy="28" :r="radius" />
    <circle
      v-for="a in arcs"
      :key="a.key"
      class="fw-ring__seg"
      cx="28"
      cy="28"
      :r="radius"
      :stroke="a.color"
      :stroke-dasharray="a.dash"
      :stroke-dashoffset="a.offset"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * 统计卡环形图
 *
 * 分段占比 = 分项计数 / 设备总数，与卡片底部图例共用同一份数据，
 * 所以环上的段与图例里的数字必然对得上。
 *
 * 用 SVG 而不是图表库：4 张卡 4 个实例常驻，图表库实例的创建与销毁
 * 比这个几十行的 SVG 贵得多。
 */
import { computed } from 'vue'
import type { FireWaterCardLegendItem } from '@/types/firewater'

const props = withDefaults(
  defineProps<{
    /** 分项（计数 + 颜色） */
    segments: FireWaterCardLegendItem[]
    /** 分母（设备总数） */
    total: number
    /** 直径（px） */
    size?: number
  }>(),
  { size: 56 },
)

/** 环半径：直径 56 → r 22，留 6px 给描边 */
const radius = computed(() => props.size / 2 - 6)

/** 周长 */
const circumference = computed(() => 2 * Math.PI * radius.value)

const arcs = computed(() => {
  let acc = 0
  return props.segments.map((s, i) => {
    const frac = props.total > 0 ? s.value / props.total : 0
    const len = Math.max(0, frac * circumference.value)
    const arc = {
      key: `${s.label}-${i}`,
      color: s.color,
      dash: `${len} ${circumference.value - len}`,
      offset: -acc,
    }
    acc += len
    return arc
  })
})

const ariaLabel = computed(() =>
  props.segments.map(s => `${s.label} ${s.value}`).join('，'),
)
</script>

<style scoped>
.fw-ring {
  display: block;
  flex-shrink: 0;
  transform: rotate(-90deg);
}
.fw-ring__track {
  fill: none;
  stroke: var(--border-low);
  stroke-width: 8;
}
.fw-ring__seg {
  fill: none;
  stroke-width: 8;
  stroke-linecap: butt;
}
</style>
