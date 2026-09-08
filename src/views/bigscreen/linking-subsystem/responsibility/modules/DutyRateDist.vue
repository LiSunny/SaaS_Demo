<template>
  <!-- 模块4 · 履责率分布：商铺按履责率分档（90+ / 80-89 / 70-79 / 60-69 / <60）环形图
       配色 = 同一色系深浅梯度（亮→暗 = 档位高→低），不用红/橙等语义警示色
       面板 flex:auto 按内容自适应并均摊列内剩余高度，填满整列 -->
  <ModulePanel title="履责率分布" class="dd-panel">
    <div class="dd-sub">纳管商铺 {{ total }} 家 · 平均 {{ avg }}%</div>
    <div class="dd-wrap">
      <div class="dd-donut">
        <div ref="chartEl" class="dd-canvas"></div>
        <div class="dd-center">
          <b>{{ total }}</b>
          <span>商铺</span>
        </div>
      </div>
      <div class="dd-legend">
        <div class="dd-leg" v-for="b in buckets" :key="b.label">
          <i class="dd-dot" :style="{ background: b.color }"></i>
          <span class="dd-label">{{ b.label }}</span>
          <span class="dd-count">{{ b.n }} 家</span>
        </div>
      </div>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import ModulePanel from '../ModulePanel.vue'
import { SHOPS } from '../../data/shops'

const total = SHOPS.length
const avg = Math.round(SHOPS.reduce((a, s) => a + s.dutyRate, 0) / total)

/* 同色系深浅梯度：档位越高越亮，低档位仅以深浅区分，不引入红/橙 */
const buckets = [
  { label: '90% 以上', test: (r: number) => r >= 90, color: '#6FE3ED' },
  { label: '80%-89%', test: (r: number) => r >= 80 && r < 90, color: '#4FB3E8' },
  { label: '70%-79%', test: (r: number) => r >= 70 && r < 80, color: '#2E78AD' },
  { label: '60%-69%', test: (r: number) => r >= 60 && r < 70, color: '#1D5E96' },
  { label: '60% 以下', test: (r: number) => r < 60, color: '#16406B' },
].map(b => ({ ...b, n: SHOPS.filter(s => b.test(s.dutyRate)).length }))

const chartEl = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let ro: ResizeObserver | undefined

onMounted(() => {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value)
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 家' },
    series: [{
      type: 'pie',
      radius: ['62%', '88%'],
      center: ['50%', '50%'],
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderColor: '#0C3A5C', borderWidth: 2 },
      data: buckets.map(b => ({ value: b.n, name: b.label, itemStyle: { color: b.color } })),
    }],
  })
  ro = new ResizeObserver(() => chart?.resize())
  ro.observe(chartEl.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.dd-panel { flex: auto; }

.dd-sub {
  font-size: vmin(14);
  color: rgba(192, 215, 232, 0.65);
  letter-spacing: 0.5px;
  padding-bottom: vh(6);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.16);
}

.dd-wrap {
  display: flex;
  align-items: center;
  gap: vw(14);
  margin-top: vh(8);
}
.dd-donut {
  position: relative;
  width: vw(118);
  height: vh(108);
  flex: none;
}
.dd-canvas {
  position: absolute;
  inset: 0;
}
.dd-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(2);
  pointer-events: none;
}
.dd-center b {
  font-size: vmin(20);
  font-weight: 700;
  line-height: 1;
  color: #F2F8FC;
  font-variant-numeric: tabular-nums;
}
.dd-center span {
  font-size: vmin(11);
  line-height: 1;
  color: #C0D7E8;
}
.dd-legend {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(5);
}
.dd-leg {
  display: flex;
  align-items: center;
  gap: vw(7);
}
.dd-dot {
  width: vmin(9);
  height: vmin(9);
  border-radius: vmin(2);
  flex: none;
}
.dd-label {
  flex: 1;
  font-size: vmin(14);
  color: #C0D7E8;
  white-space: nowrap;
}
.dd-count {
  font-size: vmin(14);
  font-weight: 700;
  color: #F2F8FC;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
