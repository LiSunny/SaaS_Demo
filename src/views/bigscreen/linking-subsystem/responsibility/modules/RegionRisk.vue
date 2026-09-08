<template>
  <!-- 模块3 · 区域风险画像：按商业街聚合（平均履责率条 + 隐患/告警计数）
       面板 flex:auto 按内容自适应并均摊列内剩余高度，填满整列 -->
  <ModulePanel title="区域风险画像" class="rr-panel">
    <div class="rr-row" v-for="r in rows" :key="r.name">
      <div class="rr-top">
        <span class="rr-name">{{ r.name }}</span>
        <span class="rr-meta">{{ r.n }} 家商铺 · 平均履责 <b :class="{ low: r.avg < 70 }">{{ r.avg }}%</b></span>
      </div>
      <div class="rr-track"><div class="rr-fill" :class="{ low: r.avg < 70 }" :style="{ width: r.avg + '%' }"></div></div>
      <div class="rr-chips">
        <span>未闭环隐患 <b class="red">{{ r.hazards }} 起</b></span>
        <span>未处置告警 <b class="amber">{{ r.alarms }} 条</b></span>
      </div>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import ModulePanel from '../ModulePanel.vue'
import { SHOPS, STREETS } from '../../data/shops'

const rows = STREETS.map(st => {
  const shops = st.shops.map((id: number) => SHOPS.find(s => s.id === id)).filter(Boolean) as typeof SHOPS
  return {
    name: st.name,
    n: shops.length,
    avg: Math.round(shops.reduce((a, s) => a + s.dutyRate, 0) / shops.length),
    hazards: shops.reduce((a, s) => a + s.hazards, 0),
    alarms: shops.reduce((a, s) => a + s.alarms, 0),
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.rr-panel { flex: auto; }

.rr-row { padding: vh(6) vw(2) vh(6); }
.rr-row + .rr-row { border-top: 1px dashed rgba(110, 227, 237, 0.12); }

.rr-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
}
.rr-name {
  font-size: vmin(16);
  font-weight: 500;
  color: #F2F8FC;
  white-space: nowrap;
}
.rr-meta {
  font-size: vmin(14);
  color: #C0D7E8;
  white-space: nowrap;
}
.rr-meta b { color: #7cf0b3; }
.rr-meta b.low { color: #7FA8C9; } /* 低档位数值：去红，同色系弱化 */

.rr-track {
  margin-top: vh(5);
  height: vh(6);
  background: rgba(110, 227, 237, 0.12);
  overflow: hidden;
}
.rr-fill {
  height: 100%;
  background: linear-gradient(90deg, #2E78AD, #6FE3ED);
}
.rr-fill.low { background: linear-gradient(90deg, #16406B, #2E78AD); } /* 低档位：同色系暗蓝，不用红 */

.rr-chips {
  margin-top: vh(5);
  display: flex;
  gap: vw(14);
  font-size: vmin(14);
  color: #C0D7E8;
  white-space: nowrap;
}
.rr-chips b { font-variant-numeric: tabular-nums; }
.rr-chips b.red { color: #ff9d93; }
.rr-chips b.amber { color: #ffc66d; }
</style>
