<template>
  <div class="module-card">
    <EbikeSectionTitle title="共享电动自行车监管" />
    <div class="card-body">
      <div class="platform-row">
        <span class="platform-name">美团共享单车</span>
        <div class="platform-stat">
          <div class="stat-icon ebike-icon">
            <img src="@/assets/bigscreen/icon-ebike.svg" alt="" />
          </div>
          <div class="stat-data">
            <span class="stat-label">投放数量</span>
            <span class="stat-value">18907 <small>辆</small></span>
          </div>
        </div>
        <div class="platform-stat">
          <div class="stat-icon battery-icon">
            <img src="@/assets/bigscreen/icon-battery.svg" alt="" />
          </div>
          <div class="stat-data">
            <span class="stat-label">电池预警</span>
            <span class="stat-value">187 <small>个</small></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EbikeSectionTitle from './EbikeSectionTitle.vue'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.module-card {
  display: flex; flex-direction: column; gap: vh(16);
  background: rgba(0, 80, 140, 0.45);
  border: 1px solid rgba(0, 152, 230, 0.2);
  border-radius: 4px;
  padding: vh(10) vw(10);
}

.card-body {
  flex: 1; padding: vh(10);
  background: rgba(138,179,245,0.05); border-radius: 6px;
}

.platform-row {
  display: flex; align-items: center; gap: vw(8); padding: vh(11) 0;
}

.platform-name {
  flex: 1;
  font-family: 'Source-KeynoteartHans', sans-serif;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.platform-stat { display: flex; align-items: center; gap: vw(10); flex-shrink: 0; }

.stat-icon {
  width: calc(52 * var(--min-scale)); height: calc(52 * var(--min-scale)); flex-shrink: 0;
  img { width: 100%; height: 100%; }
}

.stat-data { display: flex; flex-direction: column; gap: vh(7); }

.stat-label {
  font-family: 'STHeiti', sans-serif;
  font-size: clamp(11px, calc(16 * var(--min-scale)), 16px);
  color: rgba(255,255,255,0.5);
}

.stat-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px); font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  small { font-family: 'Heiti TC', sans-serif; font-size: clamp(10px, calc(14 * var(--min-scale)), 14px); font-weight: 500; }
}
</style>
