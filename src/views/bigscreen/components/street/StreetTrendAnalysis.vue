<template>
  <SectionCard title="趋势分析" subtitle="Trend Analysis" more-label="更多">
    <div class="trend-analysis">
      <!-- 告警趋势 -->
      <div class="trend-card">
        <div class="trend-header">
          <span class="trend-title">告警趋势</span>
          <div class="trend-compare">
            <span class="compare-today">今日 6 起</span>
            <span class="compare-change compare-up">较上周同期 +50%</span>
          </div>
        </div>
        <svg class="trend-svg" viewBox="0 0 300 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="alertGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line v-for="i in 3" :key="'h' + i" :x1="0" :y1="i * 20" x2="300" :y2="i * 20" stroke="rgba(71,132,232,0.08)" stroke-width="0.5" />
          <path :d="alertAreaPath" fill="url(#alertGrad2)" />
          <polyline :points="alertLinePoints" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 履职完成率趋势 -->
      <div class="trend-card">
        <div class="trend-header">
          <span class="trend-title">履职完成率趋势</span>
          <div class="trend-compare">
            <span class="compare-today">今日 92%</span>
            <span class="compare-change compare-up">较上周同期 +6%</span>
          </div>
        </div>
        <svg class="trend-svg" viewBox="0 0 300 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dutyGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#22c55e" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line v-for="i in 3" :key="'h' + i" :x1="0" :y1="i * 20" x2="300" :y2="i * 20" stroke="rgba(71,132,232,0.08)" stroke-width="0.5" />
          <path :d="dutyAreaPath" fill="url(#dutyGrad2)" />
          <polyline :points="dutyLinePoints" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 隐患整改趋势 -->
      <div class="trend-card">
        <div class="trend-header">
          <span class="trend-title">隐患整改趋势</span>
          <div class="trend-compare">
            <span class="compare-today">今日 8 起</span>
            <span class="compare-change compare-up">较上周同期 +20%</span>
          </div>
        </div>
        <svg class="trend-svg" viewBox="0 0 300 80" preserveAspectRatio="none">
          <line v-for="i in 3" :key="'h' + i" :x1="0" :y1="i * 20" x2="300" :y2="i * 20" stroke="rgba(71,132,232,0.08)" stroke-width="0.5" />
          <polyline :points="hazardNewPoints" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <polyline :points="hazardFixedPoints" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <polyline :points="hazardStockPoints" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="trend-legend">
          <span class="legend-line"><i style="background:#ef4444" />新增</span>
          <span class="legend-line"><i style="background:#22c55e" />整改完成</span>
          <span class="legend-line"><i style="background:#f59e0b" />存量</span>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '../SectionCard.vue'

// 告警趋势数据（30天简化）
const alertData = [12, 10, 9, 14, 11, 8, 7, 15, 13, 9, 6, 11, 14, 8, 7, 10, 12, 9, 5, 8, 11, 13, 7, 6, 9, 10, 8, 6, 7, 6]
const alertLinePoints = computed(() => generatePoints(alertData, 80))
const alertAreaPath = computed(() => generateArea(alertData, 80))

// 履职率趋势
const dutyData = [88, 89, 87, 90, 91, 89, 92, 91, 93, 92, 94, 93, 95, 94, 96, 95, 94, 96, 95, 97, 96, 95, 97, 96, 98, 97, 96, 98, 97, 95]
const dutyLinePoints = computed(() => generatePoints(dutyData, 80))
const dutyAreaPath = computed(() => generateArea(dutyData, 80))

// 隐患整改趋势 - 三条线
const hazardNewData = [8, 6, 10, 7, 5, 9, 8, 6, 11, 7, 5, 8, 9, 6, 7, 10, 8, 5, 7, 9, 6, 8, 10, 7, 5, 6, 8, 7, 6, 5]
const hazardFixedData = [7, 5, 9, 8, 6, 8, 7, 5, 10, 8, 6, 9, 8, 5, 6, 9, 9, 6, 8, 8, 5, 9, 9, 8, 6, 5, 7, 8, 5, 6]
const hazardStockData = [15, 16, 17, 16, 15, 16, 17, 18, 19, 18, 17, 16, 17, 18, 19, 20, 19, 18, 17, 18, 19, 18, 19, 18, 17, 18, 19, 18, 19, 18]

const hazardNewPoints = computed(() => generatePoints(hazardNewData, 80))
const hazardFixedPoints = computed(() => generatePoints(hazardFixedData, 80))
const hazardStockPoints = computed(() => generatePoints(hazardStockData, 80))

function generatePoints(data: number[], maxHeight: number): string {
  const step = 300 / (data.length - 1)
  const maxVal = Math.max(...data)
  return data
    .map((v, i) => {
      const x = i * step
      const y = maxHeight - (v / maxVal) * (maxHeight - 10)
      return `${x},${y}`
    })
    .join(' ')
}

function generateArea(data: number[], maxHeight: number): string {
  const step = 300 / (data.length - 1)
  const maxVal = Math.max(...data)
  const points = data.map((v, i) => {
    const x = i * step
    const y = maxHeight - (v / maxVal) * (maxHeight - 10)
    return `${x},${y}`
  })
  return `M${points[0]} L${points.join(' L')} L300,${maxHeight} L0,${maxHeight} Z`
}
</script>

<style scoped>
.trend-analysis {
  padding: calc(8 * var(--h)) calc(12 * var(--w));
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
  overflow: hidden;
}

.trend-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(2, 20, 50, 0.5);
  border: 1px solid rgba(71, 132, 232, 0.2);
  border-radius: 6px;
  padding: calc(6 * var(--h)) calc(8 * var(--w));
  min-height: 0;
  overflow: hidden;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(2 * var(--h));
  flex-shrink: 0;
}

.trend-title {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 13px);
  font-weight: 700;
  color: #89b5ff;
}

.trend-compare {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
}

.compare-today {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  color: #fff;
  font-weight: 700;
}

.compare-change {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.compare-up {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.compare-down {
  color: #86efac;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.trend-svg {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.trend-legend {
  display: flex;
  justify-content: center;
  gap: calc(10 * var(--w));
  padding-top: calc(2 * var(--h));
  flex-shrink: 0;
}

.legend-line {
  display: flex;
  align-items: center;
  gap: calc(4 * var(--w));
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  color: rgba(224, 234, 250, 0.6);
}

.legend-line i {
  display: inline-block;
  width: 10px;
  height: 2px;
  border-radius: 1px;
}
</style>
