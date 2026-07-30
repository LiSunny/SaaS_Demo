<template>
  <div class="stat-card-row">
    <div
      v-for="card in cards"
      :key="card.title"
      class="stat-card"
    >
      <img :src="bgSrc" alt="" class="stat-card-bg" />
      <!-- 标题行 -->
      <div class="stat-title-row">
        
        <span class="stat-title">{{ card.title }}</span>
        
      </div>
      <!-- 数据行 -->
      <div class="stat-data-row">
        <div class="data-col">
          <span class="data-label">社会单位</span>
          <span class="data-value">{{ card.val1 }}</span>
        </div>
        <div class="data-col">
          <span class="data-label">社区住宅</span>
          <span class="data-value">{{ card.val2 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import bgSrc from '@/assets/bigscreen/stat-card-bg.svg'

const cards = [
  { title: '充电端口', val1: 1657, val2: 2473 },
  { title: '充电桩', val1: 56, val2: 236 },
  { title: '电动自行车', val1: 5873, val2: 14678 },
  { title: '接入单位', val1: 10, val2: 23 },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.stat-card-row {
  display: flex; gap: vw(16); flex-shrink: 0;
  height: vh(126); padding: vh(4) 0;
}

.stat-card {
  flex: 1; min-width: 0;
  border-radius: 6px; overflow: hidden;
  position: relative;
  display: flex; flex-direction: column;
  padding: vh(14) vw(8);
}

.stat-card-bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block; pointer-events: none;
  filter: brightness(0.85);
}

/* 内容在背景之上 */
.stat-title-row,
.stat-data-row { position: relative; z-index: 1; }

/* 标题行 */
.stat-title-row {
  display: flex; align-items: center; justify-content: center; gap: vw(8);
  flex-shrink: 0;
}

.title-deco { display: flex; align-items: center; gap: vw(4); }
.title-deco--rev { flex-direction: row-reverse; }
.deco-line { width: vw(25); height: vh(2); background: rgba(0,134,228,0.45); border-radius: 1px; }
.deco-dot { width: vw(2); height: vw(2); background: rgba(0,134,228,0.35); border-radius: 50%; }
.deco-diamond { width: vw(10); height: vw(10); background: rgba(0,134,228,0.45); transform: rotate(45deg); border-radius: 1px; }

.stat-title {
  font-family: 'YouSheBiaoTiHei', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  background: linear-gradient(to bottom, #e2f5ff, #9dd8ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 数据行 */
.stat-data-row {
  display: flex; justify-content: space-around;
  flex: 1; padding: vh(12) vw(16) 0;
}

.data-col { display: flex; flex-direction: column; align-items: center; gap: vh(8); }

.data-label {
  font-family: 'Alibaba PuHuiTi', sans-serif; font-weight: 700;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  background: linear-gradient(to bottom, #ffffff, #b8dcff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.data-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif; font-weight: 700;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  background: linear-gradient(to bottom, #ffffff, #b8dcff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
