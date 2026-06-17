<template>
  <SectionCard title="隐患整改跟踪" subtitle="Hazard Tracking" more-label="更多">
    <div class="alert-hazard">
      <!-- 隐患统计 -->
      <div class="hazard-stats">
        <div class="hazard-stat-item">
          <span class="hazard-num">{{ hazardData.found }}</span>
          <span class="hazard-unit">项</span>
          <span class="hazard-label">本月发现隐患</span>
        </div>
        <div class="hazard-stat-item hazard-stat-item--done">
          <span class="hazard-num text-green">{{ hazardData.fixed }}</span>
          <span class="hazard-unit">项</span>
          <span class="hazard-label">已整改</span>
        </div>
        <div class="hazard-stat-item hazard-stat-item--rate">
          <span class="hazard-num text-blue">{{ hazardData.rate }}%</span>
          <span class="hazard-label">整改率</span>
        </div>
        <div class="hazard-stat-item hazard-stat-item--overtime">
          <span class="hazard-num text-red">{{ hazardData.overtime }}</span>
          <span class="hazard-unit">项</span>
          <span class="hazard-label">超期未整改</span>
        </div>
      </div>

      <!-- 隐患类型分布 + 超期隐患 -->
      <div class="hazard-main">
        <!-- 左侧：环形图 -->
        <div class="hazard-donut">
          <div class="donut-wrapper">
            <svg viewBox="0 0 120 120" class="donut-svg">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(71,132,232,0.12)" stroke-width="10" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#ef4444" stroke-width="10"
                stroke-dasharray="301.6" stroke-dashoffset="0" stroke-linecap="butt"
                transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f59e0b" stroke-width="10"
                stroke-dasharray="301.6" stroke-dashoffset="219.2" stroke-linecap="butt"
                transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#3b82f6" stroke-width="10"
                stroke-dasharray="301.6" stroke-dashoffset="252.8" stroke-linecap="butt"
                transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#8b5cf6" stroke-width="10"
                stroke-dasharray="301.6" stroke-dashoffset="274.5" stroke-linecap="butt"
                transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#6b7280" stroke-width="10"
                stroke-dasharray="301.6" stroke-dashoffset="277.2" stroke-linecap="butt"
                transform="rotate(-90 60 60)" />
            </svg>
          </div>
          <div class="hazard-type-list">
            <div v-for="item in hazardTypes" :key="item.name" class="type-item">
              <span class="type-dot" :style="{ background: item.color }" />
              <span class="type-name">{{ item.name }}</span>
              <span class="type-count">{{ item.count }}项</span>
              <span class="type-pct">({{ item.pct }}%)</span>
            </div>
          </div>
        </div>

        <!-- 右侧：超期未整改 -->
        <div class="hazard-overtime">
          <div class="mini-title mini-title--warn">超期未整改TOP5</div>
          <div class="overtime-list">
            <div v-for="item in overtimeShops" :key="item.name" class="overtime-item">
              <span class="overtime-name">{{ item.name }}</span>
              <span class="overtime-days">超期{{ item.days }}天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from '../SectionCard.vue'

const hazardData = {
  found: 126,
  fixed: 118,
  rate: 93.6,
  overtime: 8,
}

const hazardTypes = [
  { name: '消防通道堵塞', count: 34, pct: 27, color: '#ef4444' },
  { name: '灭火器失效', count: 28, pct: 22, color: '#f59e0b' },
  { name: '电气线路老化', count: 22, pct: 17, color: '#3b82f6' },
  { name: '燃气隐患', count: 18, pct: 14, color: '#8b5cf6' },
  { name: '其他隐患', count: 24, pct: 20, color: '#6b7280' },
]

const overtimeShops = [
  { name: 'XX餐饮店', days: 15 },
  { name: 'XX网吧', days: 10 },
  { name: 'XX便利店', days: 8 },
  { name: 'XX台球厅', days: 6 },
  { name: 'XX美容店', days: 5 },
]
</script>

<style scoped>
.alert-hazard {
  padding: calc(10 * var(--h)) calc(12 * var(--w));
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  overflow: hidden;
}

/* 隐患统计 */
.hazard-stats {
  display: flex;
  gap: calc(8 * var(--w));
}

.hazard-stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--h));
  padding: calc(6 * var(--h)) calc(4 * var(--w));
  background: rgba(2, 30, 80, 0.45);
  border: 1px solid rgba(71, 132, 232, 0.25);
  border-radius: 6px;
}

.hazard-stat-item--done {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.06);
}

.hazard-stat-item--rate {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.06);
}

.hazard-stat-item--overtime {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.06);
}

.hazard-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(16px, calc(26 * var(--min-scale)), 34px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-green {
  background: linear-gradient(to bottom, #86efac, #22c55e);
  -webkit-background-clip: text;
  background-clip: text;
}

.text-blue {
  background: linear-gradient(to bottom, #93c5fd, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
}

.text-red {
  background: linear-gradient(to bottom, #fca5a5, #ef4444);
  -webkit-background-clip: text;
  background-clip: text;
}

.hazard-unit {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  color: rgba(137, 181, 255, 0.5);
}

.hazard-label {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.7);
  text-align: center;
}

/* 中间：环形图 + 超期 */
.hazard-main {
  flex: 1;
  display: flex;
  gap: calc(12 * var(--w));
  min-height: 0;
  overflow: hidden;
}

.hazard-donut {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
  min-width: 0;
}

.donut-wrapper {
  width: calc(100 * var(--min-scale));
  flex-shrink: 0;
  align-self: center;
}

.donut-svg {
  width: 100%;
  height: auto;
}

.hazard-type-list {
  display: flex;
  flex-direction: column;
  gap: calc(3 * var(--h));
  flex: 1;
  overflow-y: auto;
}

.type-item {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: calc(2 * var(--h)) 0;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-name {
  flex: 1;
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  color: rgba(224, 234, 250, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-count {
  font-family: 'Douyin Sans', sans-serif;
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #89b5ff;
  flex-shrink: 0;
}

.type-pct {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 12px);
  color: rgba(137, 181, 255, 0.5);
  flex-shrink: 0;
}

/* 超期隐患 */
.hazard-overtime {
  width: calc(140 * var(--w));
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mini-title {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #89b5ff;
  margin-bottom: calc(6 * var(--h));
  padding-left: calc(6 * var(--w));
  border-left: 2px solid #3b82f6;
}

.mini-title--warn {
  color: #fca5a5;
  border-left-color: #ef4444;
}

.overtime-list {
  display: flex;
  flex-direction: column;
  gap: calc(5 * var(--h));
  flex: 1;
}

.overtime-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(6 * var(--h)) calc(8 * var(--w));
  background: rgba(127, 29, 29, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 4px;
}

.overtime-name {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  color: rgba(224, 234, 250, 0.9);
}

.overtime-days {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 12px);
  color: #fca5a5;
  font-weight: 700;
  background: rgba(239, 68, 68, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
