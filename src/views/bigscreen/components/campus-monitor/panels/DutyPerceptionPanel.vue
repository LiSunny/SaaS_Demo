<!--
  DutyPerceptionPanel
  履职态势感知（左下模块）
  设计稿节点：670:2480（履职）

  包含：
    - 今日履职任务数（圆环 + 数字）
    - 未履职公示（学校列表，含履职率 + 警示）
-->
<template>
  <div class="dp-panel">
    <!-- 顶部：今日履职任务数 -->
    <div class="dp-summary">
      <div class="dp-summary__chart">
        <svg viewBox="0 0 100 100" class="dp-summary__svg">
          <circle cx="50" cy="50" r="42" fill="none"
            stroke="rgba(0, 215, 239, 0.18)" stroke-width="6" />
          <circle cx="50" cy="50" r="42" fill="none"
            stroke="#00d7ef" stroke-width="6" stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset(56.3)"
            transform="rotate(-90 50 50)" />
          <text x="50" y="50" text-anchor="middle"
            class="dp-summary__num" fill="#ffffff">843</text>
          <text x="50" y="64" text-anchor="middle"
            class="dp-summary__unit" fill="#96bee9">件</text>
        </svg>
      </div>
      <div class="dp-summary__info">
        <span class="dp-summary__label">今日履职任务数</span>
        <div class="dp-summary__trend">
          <img src="/campus-monitor/icons/trending-up.svg" class="dp-summary__trend-icon" alt="" />
          <span class="dp-summary__trend-text">较昨日 +12.5%</span>
        </div>
        <div class="dp-summary__rate-row">
          <span class="dp-summary__rate-label">完成率</span>
          <span class="dp-summary__rate-value">56.3%</span>
        </div>
      </div>
    </div>

    <!-- 底部：未履职公示 -->
    <div class="dp-list">
      <div class="dp-list__head">
        <img src="/campus-monitor/icons/alarm.svg" class="dp-list__head-icon" alt="" />
        <span class="dp-list__head-title">未履职公示</span>
        <span class="dp-list__head-count">{{ unduties.length }}</span>
      </div>
      <ul class="dp-list__items">
        <li
          v-for="(item, idx) in unduties"
          :key="idx"
          class="dp-item"
        >
          <span class="dp-item__rank">{{ idx + 1 }}</span>
          <span class="dp-item__name">{{ item.name }}</span>
          <span class="dp-item__rate">{{ item.rate }}%</span>
          <img
            v-if="item.isAlert"
            src="/campus-monitor/icons/caution.svg"
            class="dp-item__icon"
            alt="警示"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Unduty {
  name: string
  rate: number
  isAlert: boolean
}

const unduties: Unduty[] = [
  { name: '城南中学', rate: 56, isAlert: true },
  { name: '北辰中学', rate: 42, isAlert: true },
  { name: '实验高中', rate: 68, isAlert: true },
]

const R = 42
const circumference = 2 * Math.PI * R

function dashOffset(rate: number): number {
  return circumference * (1 - rate / 100)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../campus-monitor-common.scss" as *;

.dp-panel {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  gap: vh(10);
  min-height: 0;
}

/* ===== 顶部：今日履职任务数 ===== */
.dp-summary {
  flex: 0 0 auto;
  display: flex; align-items: center; gap: vw(12);
  padding: vh(8) vw(10);
  background: $cm-bg-tile;
  border-radius: 8px;

  &__chart {
    flex: 0 0 auto;
    width: vh(74); height: vh(74);
  }

  &__svg {
    width: 100%; height: 100%;
  }

  &__num {
    @include cm-num;
    font-size: 18px;
  }

  &__unit {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 9px;
  }

  &__info {
    flex: 1;
    display: flex; flex-direction: column;
    gap: vh(4);
    min-width: 0;
  }

  &__label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 12px;
    color: $cm-text-tertiary;
    line-height: normal;
  }

  &__trend {
    display: flex; align-items: center; gap: vw(4);
  }

  &__trend-icon { width: vh(10); height: vh(10); }

  &__trend-text {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    color: $cm-accent-green;
  }

  &__rate-row {
    display: flex; align-items: center; gap: vw(6);
    padding-top: vh(2);
  }

  &__rate-label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 11px;
    color: $cm-text-tertiary;
  }

  &__rate-value {
    @include cm-num;
    font-size: 16px;
    color: $cm-text-primary;
  }
}

/* ===== 底部：未履职公示 ===== */
.dp-list {
  flex: 1;
  display: flex; flex-direction: column;
  gap: vh(8);
  min-height: 0;

  &__head {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: vw(6);
    padding: 0 vw(2);
  }

  &__head-icon {
    width: vh(14); height: vh(14); flex-shrink: 0;
  }

  &__head-title {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 13px;
    color: $cm-text-tertiary;
  }

  &__head-count {
    @include cm-num;
    font-size: 14px;
    color: $cm-accent-cyan;
  }

  &__items {
    flex: 1;
    list-style: none;
    margin: 0; padding: 0;
    display: flex; flex-direction: column;
    gap: vh(6);
    overflow: hidden;
    @include cm-hide-scrollbar;
  }
}

.dp-item {
  flex: 1;
  display: flex; align-items: center;
  gap: vw(8);
  padding: 0 vw(10);
  background: $cm-bg-tile;
  border-radius: 6px;

  &__rank {
    flex: 0 0 auto;
    width: vh(18); height: vh(18);
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 215, 239, 0.2);
    border-radius: 50%;
    @include cm-num;
    font-size: 11px;
    color: $cm-accent-cyan;
  }

  &__name {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 13px;
    color: $cm-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__rate {
    @include cm-num;
    font-size: 13px;
    color: $cm-accent-cyan;
  }

  &__icon {
    width: vh(14); height: vh(14); flex-shrink: 0;
  }
}
</style>