<template>
  <!-- 模块2 · 重点监管：问题商铺点名（按未闭环隐患降序、履责率升序取前4）
       面板 flex:none 按内容自适应高度，保证完整显示不截断 -->
  <ModulePanel title="重点监管" class="ks-panel">
    <div class="ks-head">问题商铺点名 · 按未闭环隐患排序</div>
    <div class="ks-row" v-for="s in list" :key="s.id">
      <span class="ks-dot" :class="s.todayDuty ? 'green' : 'red'"></span>
      <div class="ks-info">
        <div class="ks-name">{{ s.name }}</div>
        <div class="ks-sub">{{ s.type }} · 履责率 <b :class="{ low: s.dutyRate < 70 }">{{ s.dutyRate }}%</b></div>
      </div>
      <div class="ks-chips">
        <span class="ks-chip red">患 {{ s.hazards }}</span>
        <span class="ks-chip amber">警 {{ s.alarms }}</span>
      </div>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import ModulePanel from '../ModulePanel.vue'
import { SHOPS } from '../../data/shops'

const list = [...SHOPS]
  .sort((a, b) => (b.hazards - a.hazards) || (a.dutyRate - b.dutyRate))
  .slice(0, 4)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ks-panel { flex: none; }

.ks-head {
  font-size: vmin(11);
  color: rgba(192, 215, 232, 0.65);
  letter-spacing: 0.5px;
  padding-bottom: vh(8);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.16);
}

.ks-row {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(9) vw(2);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.10);
}
.ks-row:last-child { border-bottom: 0; }

.ks-dot {
  width: vmin(7);
  height: vmin(7);
  border-radius: 50%;
  flex: none;
}
.ks-dot.green { background: #3DDC97; }
.ks-dot.red { background: #FF7064; }

.ks-info { flex: 1; min-width: 0; }
.ks-name {
  font-size: vmin(13);
  font-weight: 500;
  color: #F2F8FC;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ks-sub {
  margin-top: vh(2);
  font-size: vmin(11);
  color: #C0D7E8;
  white-space: nowrap;
}
.ks-sub b { color: #7cf0b3; }
.ks-sub b.low { color: #ff9d93; }

.ks-chips { display: flex; gap: vw(5); flex: none; }
.ks-chip {
  font-size: vmin(11);
  font-weight: 700;
  line-height: 1;
  padding: vh(4) vw(7);
  border-radius: vmin(2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.ks-chip.red { background: rgba(255, 112, 100, 0.16); color: #ff9d93; }
.ks-chip.amber { background: rgba(245, 176, 39, 0.16); color: #ffc66d; }
</style>
