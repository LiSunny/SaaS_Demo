<template>
  <!-- 模块6 · 告警隐患处置：全量告警+隐患按「未处置优先、时间倒序」取前3条流式列表
       （右列三模块高度受限于视口，条数按 1080 高度实测定为 3，保证整列不溢出） -->
  <ModulePanel title="告警隐患处置" class="ah-panel">
    <div class="ah-legend">
      <span class="ah-leg"><i class="dot red"></i>未处置/待整改 <b>{{ redN }}</b></span>
      <span class="ah-leg"><i class="dot green"></i>已处置/已整改 <b>{{ greenN }}</b></span>
    </div>
    <div class="ah-item" v-for="(it, i) in list" :key="i">
      <span class="ah-kind" :class="it.red ? 'red' : 'green'">{{ it.kind }}</span>
      <div class="ah-info">
        <div class="ah-title">{{ it.title }}</div>
        <div class="ah-sub">{{ it.shop }} · {{ it.time }}</div>
      </div>
      <span class="ah-status" :class="it.red ? 'red' : 'green'">{{ it.status }}</span>
    </div>
  </ModulePanel>
</template>

<script setup lang="ts">
import ModulePanel from '../ModulePanel.vue'
import { SHOPS } from '../../data/shops'

/* 汇总全部设备告警 + 隐患，带商铺名与类别 */
const items = SHOPS.flatMap(s => [
  ...s.deviceAlarms.map(a => ({ kind: '告警', title: a.title, shop: s.name, time: a.time, status: a.status, red: a.red })),
  ...s.hazardList.map(h => ({ kind: '隐患', title: h.title, shop: s.name, time: h.time, status: h.status, red: h.red })),
])
const redN = items.filter(x => x.red).length
const greenN = items.length - redN

/* "6/18 07:45" → "06-18 07:45"，同月内可字符串比较 */
const timeKey = (t: string) => {
  const [md, hm] = t.split(' ')
  const [m, d] = md.split('/')
  return `${m.padStart(2, '0')}-${d.padStart(2, '0')} ${hm}`
}
const list = [...items]
  .sort((a, b) => (Number(b.red) - Number(a.red)) || timeKey(b.time).localeCompare(timeKey(a.time)))
  .slice(0, 3)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ah-panel { flex: auto; }

.ah-legend {
  display: flex;
  gap: vw(14);
  font-size: vmin(14);
  color: #C0D7E8;
  padding-bottom: vh(6);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.16);
}
.ah-leg { display: flex; align-items: center; gap: vw(5); white-space: nowrap; }
.ah-leg b { color: #F2F8FC; font-variant-numeric: tabular-nums; }
.dot { width: vmin(8); height: vmin(8); border-radius: 50%; flex: none; }
.dot.red { background: #FF7064; }
.dot.green { background: #3DDC97; }

.ah-item {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(6) vw(2);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.10);
}
.ah-item:last-child { border-bottom: 0; }

.ah-kind {
  flex: none;
  font-size: vmin(14);
  font-weight: 700;
  line-height: 1;
  padding: vh(3) vw(6);
  border-radius: vmin(2);
}
.ah-kind.red { background: rgba(255, 112, 100, 0.16); color: #ff9d93; }
.ah-kind.green { background: rgba(61, 220, 151, 0.14); color: #7cf0b3; }

.ah-info { flex: 1; min-width: 0; }
.ah-title {
  font-size: vmin(15);
  font-weight: 500;
  color: #F2F8FC;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ah-sub {
  margin-top: vh(2);
  font-size: vmin(14);
  color: rgba(192, 215, 232, 0.75);
  white-space: nowrap;
}

.ah-status {
  flex: none;
  font-size: vmin(14);
  font-weight: 700;
  line-height: 1;
  padding: vh(3) vw(7);
  border-radius: vmin(2);
  white-space: nowrap;
}
.ah-status.red { background: rgba(255, 112, 100, 0.16); color: #ff9d93; }
.ah-status.green { background: rgba(61, 220, 151, 0.14); color: #7cf0b3; }
</style>
