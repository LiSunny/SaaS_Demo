<template>
  <div class="module-card">
    <EbikeSectionTitle title="电动自行车火灾预案" />
    <div class="card-body">
      <div class="plan-card">
        <img class="plan-icon" src="@/assets/bigscreen/icon-emergency-plan.svg" alt="" />
        <div class="plan-info">
          <span class="plan-title">小区地上充电棚灭火应急预案</span>
        </div>
        <span class="watermark">应急预案</span>
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

.card-body { flex: 1; display: flex; align-items: center; padding: 0 vw(16); }

.plan-card {
  position: relative; overflow: hidden;
  display: flex; align-items: center; gap: vw(12);
  width: 100%; height: vh(84);
  background: rgba(138,179,245,0.05); border-radius: 6px;
  padding: vh(14) vw(12);
}

.plan-icon {
  width: calc(52 * var(--min-scale)); height: calc(52 * var(--min-scale)); flex-shrink: 0;
}

.plan-info { flex: 1; min-width: 0; }

.plan-title {
  font-family: 'Source-KeynoteartHans', sans-serif;
  font-size: clamp(12px, calc(18 * var(--min-scale)), 18px);
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  letter-spacing: 2.88px;
}

.watermark {
  position: absolute; right: vw(10); top: 50%; transform: translateY(-50%);
  font-family: 'Source-KeynoteartHans', sans-serif;
  font-size: clamp(32px, calc(64 * var(--min-scale)), 64px);
  color: rgba(103,133,159,0.08); letter-spacing: 10.24px;
  pointer-events: none; white-space: nowrap;
}
</style>
