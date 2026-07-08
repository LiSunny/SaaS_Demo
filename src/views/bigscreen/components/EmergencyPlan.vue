<template>
  <SectionCard title="全区应急预案管理" subtitle="Preplan" height="100%">
    <div class="emergency-plan">
      <!-- 分段选择器 -->
      <div class="ep-segments">
        <button
          v-for="seg in segments"
          :key="seg.key"
          :class="['ep-seg', { active: activeSeg === seg.key }]"
          @click="activeSeg = seg.key"
        >
          <svg class="ep-seg-bg" viewBox="0 0 160 36" preserveAspectRatio="none">
            <path d="M160 26L150 36H0V10L10 0H160V26Z" />
          </svg>
          <span class="ep-seg-label">{{ seg.label }}</span>
        </button>
      </div>

      <!-- 统计内容 -->
      <div class="ep-content">
        <!-- ECharts 环形饼图 -->
        <div class="ep-donut-area">
          <v-chart :option="ringOption" autoresize class="ep-donut-chart" />
        </div>

        <!-- 右侧分类统计（2×2 网格） -->
        <div class="ep-types">
          <!-- 顶部汇总标题 -->
          <div class="ep-types-header">
            <span class="ep-types-header-label">接入企业</span>
            <span class="ep-types-header-num">234</span>
            <span class="ep-types-header-unit">家</span>
          </div>
          <!-- 2×2 分类网格 -->
          <div class="ep-types-grid">
            <div
              v-for="(item, i) in planTypes"
              :key="i"
              class="ep-type-cell"
            >
              <div class="ep-type-cell-top">
                <span class="ep-type-dot" :style="{ background: item.color }" />
                <span class="ep-type-name">{{ item.name }}</span>
              </div>
              <div class="ep-type-cell-bottom">
                <span class="ep-type-num">{{ item.value }}</span>
                <span class="ep-type-unit">家</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import SectionCard from './SectionCard.vue'

use([PieChart, CanvasRenderer])

const activeSeg = ref('all')

const segments = [
  { key: 'all', label: '全部' },
  { key: 'fire', label: '消防' },
  { key: 'earthquake', label: '地震' },
  { key: 'flood', label: '防汛' },
]

const planTypes = [
  { name: '应急预案类型1', value: 36, color: '#148dff' },
  { name: '应急预案类型2', value: 36, color: '#30c8d3' },
  { name: '应急预案类型3', value: 36, color: '#0151a4' },
  { name: '应急预案类型4', value: 36, color: '#0175b3' },
]

const ringOption = {
  series: [{
    type: 'pie',
    radius: ['55%', '85%'],
    center: ['50%', '50%'],
    silent: true,
    label: { show: false },
    emphasis: { disabled: true },
    data: planTypes.map(item => ({
      value: item.value,
      name: item.name,
      itemStyle: { color: item.color },
    })),
    itemStyle: { borderWidth: 2, borderColor: 'transparent' },
  }],
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.emergency-plan {
  padding: vh(8) vw(8);
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

.ep-segments {
  display: flex;
  gap: vw(16);
  padding: vh(6) vw(16);
}
.ep-seg {
  flex: 1;
  position: relative;
  height: vh(32);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.ep-seg-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ep-seg-bg path {
  fill: transparent;
  stroke: #0094E6;
  stroke-width: 1;
  transition: fill 0.2s ease, stroke 0.2s ease;
  vector-effect: non-scaling-stroke;
}
.ep-seg-label {
  position: relative;
  z-index: 1;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  color: #0094E6;
  transition: color 0.2s ease;
}
.ep-seg.active .ep-seg-bg path {
  fill: #0060A5;
  stroke: #3CD3D7;
}
.ep-seg.active .ep-seg-label {
  background: linear-gradient(to bottom, #ffffff, #94bbff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ep-seg:hover:not(.active) .ep-seg-bg path {
  stroke: rgba(0, 148, 230, 0.7);
}
.ep-seg:hover:not(.active) .ep-seg-label {
  color: rgba(0, 148, 230, 0.85);
}

.ep-content {
  display: flex;
  align-items: center;
  gap: vw(16);
  padding: 0 vw(8);
  flex: 1;
}

/* ===== 环形饼图区域 ===== */
.ep-donut-area {
  position: relative;
  width: calc(119 * var(--min-scale));
  height: calc(119 * var(--min-scale));
  flex-shrink: 0;
}
.ep-donut-chart {
  width: 100%;
  height: 100%;
}

/* ===== 右侧分类统计 ===== */
.ep-types {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(18);
}

/* 顶部汇总标题 */
.ep-types-header {
  display: flex;
  align-items: baseline;
  gap: vw(6);
}
.ep-types-header-label {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 16px);
  color: #fff;
}
.ep-types-header-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #84d6ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ep-types-header-unit {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 16px);
  color: #fff;
}

/* 2×2 分类网格 */
.ep-types-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: vh(18) vw(18);
}
.ep-type-cell {
  display: flex;
  flex-direction: column;
  gap: vh(6);
}
.ep-type-cell-top {
  display: flex;
  align-items: center;
  gap: vw(3);
}
/* 等比元素 */
.ep-type-dot {
  width: calc(14 * var(--min-scale));
  height: calc(14 * var(--min-scale));
  border-radius: calc(4 * var(--min-scale));
  flex-shrink: 0;
}
.ep-type-name {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 16px);
  color: #fff;
  white-space: nowrap;
}
.ep-type-cell-bottom {
  display: flex;
  align-items: baseline;
  gap: vw(6);
}
.ep-type-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  color: #fff;
}
.ep-type-unit {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 16px);
  color: #fff;
}
</style>
