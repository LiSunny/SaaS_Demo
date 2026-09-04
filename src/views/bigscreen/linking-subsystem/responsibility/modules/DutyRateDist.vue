<template>
  <!-- 模块4 · 履责率分布：商铺按履责率分档（90+ / 80-89 / 70-79 / 60-69 / <60）横向条形
       面板 flex:none 按内容自适应高度，保证完整显示不截断 -->
  <ModulePanel title="履责率分布" class="dd-panel">
    <div class="dd-sub">纳管商铺 {{ total }} 家 · 平均 {{ avg }}%</div>
    <div class="dd-row" v-for="b in buckets" :key="b.label">
      <span class="dd-label">{{ b.label }}</span>
      <div class="dd-track"><div class="dd-fill" :class="b.cls" :style="{ width: (b.n / max * 100) + '%' }"></div></div>
      <span class="dd-count">{{ b.n }} 家</span>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import ModulePanel from '../ModulePanel.vue'
import { SHOPS } from '../../data/shops'

const total = SHOPS.length
const avg = Math.round(SHOPS.reduce((a, s) => a + s.dutyRate, 0) / total)

/* 高档位青色、低档位（<70%）转红警示 */
const buckets = [
  { label: '90% 以上', test: (r: number) => r >= 90, cls: 'good' },
  { label: '80% - 89%', test: (r: number) => r >= 80 && r < 90, cls: 'good' },
  { label: '70% - 79%', test: (r: number) => r >= 70 && r < 80, cls: 'good' },
  { label: '60% - 69%', test: (r: number) => r >= 60 && r < 70, cls: 'low' },
  { label: '60% 以下', test: (r: number) => r < 60, cls: 'low' },
].map(b => ({ ...b, n: SHOPS.filter(s => b.test(s.dutyRate)).length }))
const max = Math.max(...buckets.map(b => b.n), 1)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.dd-panel { flex: none; }

.dd-sub {
  font-size: vmin(11);
  color: rgba(192, 215, 232, 0.65);
  letter-spacing: 0.5px;
  padding-bottom: vh(8);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.16);
}

.dd-row {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(8) 0;
}
.dd-label {
  width: vw(62);
  flex: none;
  font-size: vmin(11);
  color: #C0D7E8;
  white-space: nowrap;
}
.dd-track {
  flex: 1;
  height: vh(12);
  background: rgba(110, 227, 237, 0.10);
  overflow: hidden;
}
.dd-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E78AD, #6FE3ED);
}
.dd-fill.low { background: linear-gradient(90deg, #8C3A38, #FF7064); }
.dd-count {
  width: vw(34);
  flex: none;
  text-align: right;
  font-size: vmin(12);
  font-weight: 700;
  color: #F2F8FC;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
