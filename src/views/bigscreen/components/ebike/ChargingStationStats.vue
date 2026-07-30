<template>
  <div class="module-card" :style="{ height: vh(319) }">
    <EbikeSectionTitle title="充电桩(棚)消安台账" />
    <div class="tab-row">
      <button :class="['tab-btn', { active: activeTab === 'enterprise' }]" @click="activeTab = 'enterprise'">
        <img src="@/assets/bigscreen/icon-school.svg" alt="" class="tab-icon" />
        <span>企事业主体</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'community' }]" @click="activeTab = 'community'">
        <img src="@/assets/bigscreen/icon-city.svg" alt="" class="tab-icon" />
        <span>社区主体</span>
      </button>
    </div>
    <div class="card-body">
      <div class="center-ring">
        <svg viewBox="0 0 119 119">
          <!-- 使用 Figma 中的圆环图样式 -->
          <circle cx="59.5" cy="59.5" r="55" fill="none" stroke="rgba(128,209,253,0.15)" stroke-width="9" />
          <circle cx="59.5" cy="59.5" r="55" fill="none" stroke="#148dff" stroke-width="9"
            stroke-dasharray="240 105.6" stroke-linecap="round" transform="rotate(-90 59.5 59.5)" />
        </svg>
        <div class="ring-center-text">
          <span class="ring-num">70</span>
          <span class="ring-unit">%</span>
        </div>
      </div>
      <div class="stats-detail">
        <div class="detail-header">
          <span class="detail-title">充电桩（棚）</span>
          <span class="detail-total">23<span class="detail-unit">个</span></span>
        </div>
        <div class="detail-rows">
          <div class="detail-row">
            <div class="detail-row-header">
              <span class="dot dot--done" />
              <span>已达标充电桩（棚）</span>
              <span class="info-icon">ⓘ</span>
            </div>
            <div class="detail-row-value"><span class="num">16</span><span class="unit">家</span></div>
          </div>
          <div class="detail-row">
            <div class="detail-row-header">
              <span class="dot dot--undone" />
              <span>未达标充电桩（棚）</span>
              <span class="info-icon">ⓘ</span>
            </div>
            <div class="detail-row-value"><span class="num">7</span><span class="unit">家</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EbikeSectionTitle from './EbikeSectionTitle.vue'

const activeTab = ref('enterprise')
const vh = (px: number) => `calc(${px} / 1080 * 100vh)`
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

.tab-row { display: flex; gap: vw(16); padding: 0 vw(10); flex-shrink: 0; }

.tab-btn {
  display: flex; flex: 1; align-items: center; justify-content: center; gap: vw(10);
  padding: vh(8) 0; border-radius: 4px; cursor: pointer;
  background: transparent;
  border: 1px solid rgba(128, 209, 253, 0.3);
  transition: background 0.2s, border-color 0.2s;

  > span {
    font-family: 'STHeiti', 'Alibaba PuHuiTi', sans-serif;
    font-size: clamp(14px, calc(20 * var(--min-scale)), 20px); font-weight: 400;
    background: linear-gradient(to bottom, #ffffff, #c8e4ff);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
}

.tab-btn:not(.active) > span {
  opacity: 0.45;
}

.tab-btn.active {
  background: linear-gradient(to top, rgba(128,209,253,0.15) 0%, rgba(77,125,151,0.15) 100%);
  border-color: transparent;
}
.tab-icon { width: vw(24); height: vw(24); opacity: 0.8; }

.card-body { flex: 1; display: flex; align-items: center; gap: vw(49); padding: 0 vw(16); }

.center-ring { position: relative; width: vw(119); height: vw(119); flex-shrink: 0; }
.center-ring svg { width: 100%; height: 100%; }

.ring-center-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; gap: vw(2);
}
.ring-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif; font-weight: 700;
  font-size: clamp(18px, calc(28 * var(--min-scale)), 28px); color: #fff;
}
.ring-unit { font-size: clamp(10px, calc(14 * var(--min-scale)), 14px); color: rgba(255,255,255,0.6); }

.stats-detail { flex: 1; display: flex; flex-direction: column; gap: vh(22); }
.detail-header { display: flex; align-items: baseline; gap: vw(10); }
.detail-title {
  font-family: 'Alibaba PuHuiTi', sans-serif; font-weight: 500;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px); color: #fff;
}
.detail-total {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif; font-weight: 700;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  background: linear-gradient(to bottom, #ffffff, #b8dcff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.detail-unit { font-family: 'Alibaba PuHuiTi', sans-serif; font-weight: 500; font-size: clamp(12px, calc(16 * var(--min-scale)), 16px); }

.detail-rows { display: flex; flex-direction: column; gap: vh(18); }
.detail-row { display: flex; flex-direction: column; gap: vh(6); }

.detail-row-header {
  display: flex; align-items: center; gap: vw(6);
  font-family: 'Alibaba PuHuiTi', sans-serif; font-weight: 500;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px); color: #fff;
}
.dot { width: vw(14); height: vw(14); border-radius: 4px; flex-shrink: 0; }
.dot--done { background: #148dff; }
.dot--undone { background: #30c8d3; }
.info-icon { margin-left: auto; font-size: clamp(10px, calc(16 * var(--min-scale)), 16px); color: rgba(255,255,255,0.3); }

.detail-row-value { padding-left: vw(20); }
.num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif; font-weight: 700;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  background: linear-gradient(to bottom, #ffffff, #b8dcff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.unit { font-family: 'Alibaba PuHuiTi', sans-serif; font-weight: 500; font-size: clamp(12px, calc(16 * var(--min-scale)), 16px); color: #fff; margin-left: vw(6); }
</style>
