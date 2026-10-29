<template>
  <EbikeV2Card title="消防保障系统概况">
    <div class="asr">
      <div v-for="b in ASSURANCE_BLOCKS" :key="b.key" class="asr__block">
        <div class="asr__head">
          <span class="asr__name">{{ b.name }}</span>
          <span v-if="b.pending" class="asr__pending">待接入</span>
        </div>

        <template v-if="!b.pending">
          <div v-for="m in b.metrics" :key="m.label" class="asr__metric">
            <span class="asr__metric-label">{{ m.label }}</span>
            <span class="asr__metric-value">
              {{ m.value }}<span v-if="m.unit" class="asr__metric-unit">{{ m.unit }}</span>
            </span>
            <span v-if="m.threshold" class="asr__metric-th">{{ m.threshold }}</span>
          </div>

          <!-- 24h 趋势 -->
          <div v-if="b.trend" class="asr__trend">
            <svg class="asr__trend-svg" viewBox="0 0 200 34" preserveAspectRatio="none">
              <polyline
                class="asr__trend-line"
                :points="sparkPoints(b.trend)"
                fill="none"
                stroke="#3d9bff"
                stroke-width="1.5"
                vector-effect="non-scaling-stroke"
              />
            </svg>
            <span class="asr__trend-label">{{ b.trendLabel }}</span>
          </div>
        </template>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 消防保障系统概况
 *
 * 四个"能不能救"的系统：消防水 / 气体灭火 / 防排烟 / 消防电源。
 * 每个指标后面直接跟正常区间，值班员不用另查规范。
 * 趋势线用 SVG polyline，不叠 backdrop-filter（玻璃层已占帧率预算）。
 */
import EbikeV2Card from '../EbikeV2Card.vue'
import { ASSURANCE_BLOCKS } from './fire-mock'

/** 24 点数值 → SVG polyline 坐标（viewBox 200×34，上下留 3px） */
function sparkPoints(series: number[]): string {
  if (!series.length) return ''
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  return series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * 200
      const y = 31 - ((v - min) / span) * 28
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

.asr {
  @include fire-panel;
  gap: vh(9);
}

.asr__block {
  display: flex;
  flex-direction: column;
  gap: vh(3);
  flex-shrink: 0;
}

.asr__head {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.asr__name {
  @include fire-label(15);
  color: #cfe4ff;
  position: relative;
  padding-left: vw(8);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: vw(3);
    height: vh(10);
    border-radius: 1px;
    background: rgba(0, 152, 230, 0.65);
  }
}

.asr__pending {
  @include fire-sub(13);
  padding: 0 vw(5);
  border: 1px solid rgba(207, 210, 215, 0.3);
  border-radius: vw(2);
  color: #ced2d7;
}

.asr__metric {
  display: flex;
  align-items: baseline;
  gap: vw(6);
  padding-left: vw(8);
  line-height: 20px;
}

.asr__metric-label {
  @include fire-sub(14);
  flex-shrink: 0;
}

.asr__metric-value {
  @include fire-value(19);
  flex-shrink: 0;
}

.asr__metric-unit {
  @include fire-sub(13);
  margin-left: vw(2);
}

.asr__metric-th {
  @include fire-sub(13);
  margin-left: auto;
  flex-shrink: 0;
  color: #6fa5e0;
}

/* ===== 趋势 ===== */
.asr__trend {
  display: flex;
  align-items: center;
  gap: vw(8);
  padding-left: vw(8);
  margin-top: vh(2);
}

.asr__trend-svg {
  flex: 1;
  min-width: 0;
  height: vh(40);
  background: rgba(0, 84, 160, 0.22);
  border-radius: vw(2);
}

.asr__trend-line {
  filter: drop-shadow(0 0 2px rgba(61, 155, 255, 0.55));
}

.asr__trend-label {
  @include fire-sub(12);
  flex-shrink: 0;
  min-width: vw(120);
  line-height: 19px;
  white-space: nowrap;
}
</style>
