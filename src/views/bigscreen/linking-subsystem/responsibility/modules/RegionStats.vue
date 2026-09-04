<template>
  <!-- 模块1 · 区域统计：辖区商铺/商业街/履职/隐患/告警/设备总量（数据实时汇总自 SHOPS/STREETS）
       面板 flex:none 按内容自适应高度，保证完整显示不截断 -->
  <ModulePanel title="区域统计" class="rs-panel">
    <div class="rs-grid">
      <div class="rs-tile"><span class="rs-v">{{ shopsTotal }}</span><span class="rs-l">纳管商铺</span></div>
      <div class="rs-tile"><span class="rs-v">{{ streetsTotal }}</span><span class="rs-l">商业街</span></div>
      <div class="rs-tile duty"><span class="rs-v">{{ dutyToday }}</span><span class="rs-l">今日履职</span></div>
      <div class="rs-tile notduty"><span class="rs-v">{{ notDutyToday }}</span><span class="rs-l">今日未履职</span></div>
    </div>

    <div class="rs-rate">
      <span class="rs-name">平均履责率</span>
      <div class="rs-track"><div class="rs-fill" :style="{ width: avgRate + '%' }"></div></div>
      <span class="rs-val">{{ avgRate }}%</span>
    </div>

    <div class="rs-rows">
      <div class="rs-row"><span class="rs-name">未闭环隐患</span><span class="rs-val warn">{{ hazardsTotal }} 起</span></div>
      <div class="rs-row"><span class="rs-name">未处置告警</span><span class="rs-val warn">{{ alarmsTotal }} 条</span></div>
      <div class="rs-row"><span class="rs-name">接入安全设备</span><span class="rs-val">{{ devicesTotal }} 台</span></div>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import ModulePanel from '../ModulePanel.vue'
import { SHOPS, STREETS } from '../../data/shops'

/* 数据口径与地图图例一致：商铺+商业街合并统计履职 */
const shopsTotal = SHOPS.length
const streetsTotal = STREETS.length
const shopsDuty = SHOPS.filter(s => s.todayDuty).length
const streetsDuty = STREETS.filter(s => s.todayDuty).length
const dutyToday = shopsDuty + streetsDuty
const notDutyToday = shopsTotal + streetsTotal - dutyToday
const avgRate = Math.round(SHOPS.reduce((a, s) => a + s.dutyRate, 0) / SHOPS.length)
const hazardsTotal = SHOPS.reduce((a, s) => a + s.hazards, 0)
const alarmsTotal = SHOPS.reduce((a, s) => a + s.alarms, 0)
const devicesTotal = SHOPS.reduce((a, s) => a + (s.devices?.total || 0), 0)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 面板按内容自适应（默认 flex:1 均分三栏，内容超出时会被裁切） */
.rs-panel {
  flex: none;
}

/* 4 宫格核心指标 */
.rs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: vw(8);
}
.rs-tile {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(4);
  padding: vh(10) vw(4);
  background: #0C3A5C;
  border: 1px solid rgba(110, 227, 237, 0.16);
}
.rs-v {
  font-size: vmin(22);
  font-weight: 700;
  line-height: 1;
  color: #F2F8FC;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rs-l {
  font-size: vmin(11);
  line-height: 1;
  color: #C0D7E8;
  white-space: nowrap;
}
.rs-tile.duty .rs-v { color: #7cf0b3; }
.rs-tile.notduty .rs-v { color: #ff9d93; }

/* 履责率进度条 */
.rs-rate {
  display: flex;
  align-items: center;
  gap: vw(10);
  margin-top: vh(14);
}
.rs-track {
  flex: 1;
  height: vh(6);
  background: rgba(110, 227, 237, 0.12);
  overflow: hidden;
}
.rs-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E78AD, #6FE3ED);
}

/* 计数行 */
.rs-rows {
  margin-top: vh(10);
  border-top: 1px dashed rgba(110, 227, 237, 0.16);
  padding-top: vh(4);
}
.rs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: vh(7) vw(2);
}
.rs-name {
  font-size: vmin(12);
  color: #C0D7E8;
  white-space: nowrap;
}
.rs-val {
  font-size: vmin(13);
  font-weight: 700;
  color: #F2F8FC;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rs-val.warn { color: #ff9d93; }
.rs-rate .rs-val { font-size: vmin(14); }
</style>
