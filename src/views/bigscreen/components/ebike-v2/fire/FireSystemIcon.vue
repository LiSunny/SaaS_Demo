<template>
  <svg class="fsi" :width="size" :height="size" viewBox="0 0 24 24" fill="none">
    <g
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(d, i) in paths" :key="i" :d="d" />
    </g>
  </svg>
</template>

<script setup lang="ts">
/**
 * 8 个消防系统的图标
 *
 * 统一 24×24 线性图标，描边取 currentColor —— 颜色由调用方给，
 * 与「设备完好率」模块的状态色联动。
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ system: string; size?: number }>(), { size: 20 })

/** 每个系统的描边路径 */
const ICONS: Record<string, string[]> = {
  // 消防水：水滴
  water: ['M12 3.2c0 0-5.6 6.4-5.6 10a5.6 5.6 0 0 0 11.2 0c0-3.6-5.6-10-5.6-10z', 'M9.4 14.6a2.8 2.8 0 0 0 2.6 2.6'],
  // 气体灭火：钢瓶
  gas: ['M9.2 3.2h5.6v2.6l1.8 2.6v10a1.8 1.8 0 0 1-1.8 1.8H9.2a1.8 1.8 0 0 1-1.8-1.8v-10l1.8-2.6V3.2z', 'M7.6 11h8.8'],
  // 防排烟：风
  smoke: ['M3.2 8.4h8.4a2.6 2.6 0 1 0-2.6-2.6', 'M3.2 12.4h12a2.6 2.6 0 1 1-2.6 2.6', 'M3.2 16.4h6.6'],
  // 火灾报警：警铃
  alarm: ['M6.4 16.6v-4.8a5.6 5.6 0 0 1 11.2 0v4.8l1.6 1.8H4.8l1.6-1.8z', 'M10 21h4'],
  // 防火门：门 + 门把手
  door: ['M6.4 3.4h9.2a1.8 1.8 0 0 1 1.8 1.8v15.4H4.6V5.2a1.8 1.8 0 0 1 1.8-1.8z', 'M11.2 12.2h.01'],
  // 应急疏散：出口箭头
  evac: ['M14 3.6h5.2v16.8H14', 'M3.6 12h10.6', 'M10.4 8.2 14.2 12l-3.8 3.8'],
  // 消防电源：电池 / 充电
  power: ['M13.4 2.4 5.2 13.6h5.4l-1 8 8.2-11.2h-5.4l1-8z'],
  // 电气火灾：插座
  elec: ['M9 3.4v5.2M15 3.4v5.2', 'M7 8.6h10v2.8a5 5 0 0 1-10 0V8.6z', 'M12 16.4v4.2'],
  // 书签：Figma「单个指标总分占比」卡片用的就是这个图标
  bookmark: ['M6.4 3.4h11.2v17.2L12 16.4l-5.6 4.2V3.4z'],
}

const paths = computed(() => ICONS[props.system] ?? [])
</script>

<style scoped>
.fsi {
  display: block;
  flex-shrink: 0;
}
</style>
