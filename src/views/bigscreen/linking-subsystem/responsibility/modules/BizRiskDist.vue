<template>
  <!-- 模块5 · 业态风险分布：按业态聚合（商铺数 / 平均履责率 / 未闭环隐患条 / 告警条）
       面板 flex:none 按内容自适应高度，保证完整显示不截断 -->
  <ModulePanel title="业态风险分布" class="bd-panel">
    <div class="bd-row" v-for="r in rows" :key="r.t">
      <div class="bd-top">
        <span class="bd-name">{{ r.t }} <i>{{ r.n }} 家</i></span>
        <span class="bd-meta">平均履责 <b :class="{ low: r.avg < 70 }">{{ r.avg }}%</b></span>
      </div>
      <div class="bd-mid">
        <span class="bd-mlabel">未闭环隐患</span>
        <div class="bd-track"><div class="bd-fill" :style="{ width: (r.hazards / maxH * 100) + '%' }"></div></div>
        <span class="bd-mval red">{{ r.hazards }} 起</span>
      </div>
      <div class="bd-mid">
        <span class="bd-mlabel">未处置告警</span>
        <div class="bd-track"><div class="bd-fill amber" :style="{ width: (r.alarms / maxH * 100) + '%' }"></div></div>
        <span class="bd-mval amber">{{ r.alarms }} 条</span>
      </div>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import ModulePanel from '../ModulePanel.vue'
import { SHOPS } from '../../data/shops'

const rows = [...new Set(SHOPS.map(s => s.type))].map(t => {
  const shops = SHOPS.filter(s => s.type === t)
  return {
    t,
    n: shops.length,
    avg: Math.round(shops.reduce((a, s) => a + s.dutyRate, 0) / shops.length),
    hazards: shops.reduce((a, s) => a + s.hazards, 0),
    alarms: shops.reduce((a, s) => a + s.alarms, 0),
  }
})
/* 隐患/告警条共用同一比例尺（取两者最大值） */
const maxH = Math.max(...rows.flatMap(r => [r.hazards, r.alarms]), 1)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.bd-panel { flex: none; }

.bd-row { padding: vh(8) vw(2) vh(10); }
.bd-row + .bd-row { border-top: 1px dashed rgba(110, 227, 237, 0.12); }

.bd-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
}
.bd-name {
  font-size: vmin(13);
  font-weight: 500;
  color: #F2F8FC;
  white-space: nowrap;
}
.bd-name i {
  font-style: normal;
  font-size: vmin(11);
  color: #C0D7E8;
  margin-left: vw(4);
}
.bd-meta {
  font-size: vmin(11);
  color: #C0D7E8;
  white-space: nowrap;
}
.bd-meta b { color: #7cf0b3; }
.bd-meta b.low { color: #ff9d93; }

.bd-mid {
  margin-top: vh(6);
  display: flex;
  align-items: center;
  gap: vw(8);
}
.bd-mlabel {
  width: vw(58);
  flex: none;
  font-size: vmin(11);
  color: #C0D7E8;
  white-space: nowrap;
}
.bd-track {
  flex: 1;
  height: vh(8);
  background: rgba(255, 112, 100, 0.10);
  overflow: hidden;
}
.bd-fill {
  height: 100%;
  background: linear-gradient(90deg, #8C3A38, #FF7064);
}
.bd-fill.amber { background: linear-gradient(90deg, #8C6124, #F5B027); }
.bd-mval {
  width: vw(36);
  flex: none;
  text-align: right;
  font-size: vmin(11);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bd-mval.red { color: #ff9d93; }
.bd-mval.amber { color: #ffc66d; }
</style>
