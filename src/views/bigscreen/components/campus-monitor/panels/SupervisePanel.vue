<!--
  SupervisePanel
  平安联勤督办（右上模块）
  设计稿节点：670:2480（督办）

  包含：
    - 未闭环督办数（圆环 + 数字）
    - 逾期未反馈（学校列表 + 整改事项 + 逾期天数）
-->
<template>
  <div class="sv-panel">
    <!-- 顶部：未闭环督办数 -->
    <div class="sv-summary">
      <div class="sv-summary__chart">
        <svg viewBox="0 0 100 100" class="sv-summary__svg">
          <circle cx="50" cy="50" r="42" fill="none"
            stroke="rgba(244, 67, 54, 0.18)" stroke-width="6" />
          <circle cx="50" cy="50" r="42" fill="none"
            stroke="#f44336" stroke-width="6" stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset(28.7)"
            transform="rotate(-90 50 50)" />
          <text x="50" y="50" text-anchor="middle"
            class="sv-summary__num" fill="#ffffff">843</text>
          <text x="50" y="64" text-anchor="middle"
            class="sv-summary__unit" fill="#96bee9">件</text>
        </svg>
      </div>
      <div class="sv-summary__info">
        <span class="sv-summary__label">未闭环督办数</span>
        <div class="sv-summary__rate-row">
          <span class="sv-summary__rate-label">逾期率</span>
          <span class="sv-summary__rate-value">28.7%</span>
        </div>
        <div class="sv-summary__trend">
          <img src="/campus-monitor/icons/trending-up.svg" class="sv-summary__trend-icon" alt="" />
          <span class="sv-summary__trend-text">较昨日 +5.2%</span>
        </div>
      </div>
    </div>

    <!-- 底部：逾期未反馈 -->
    <div class="sv-list">
      <div class="sv-list__head">
        <img src="/campus-monitor/icons/caution.svg" class="sv-list__head-icon" alt="" />
        <span class="sv-list__head-title">逾期未反馈</span>
        <span class="sv-list__head-count">{{ overdues.length }}</span>
      </div>
      <ul class="sv-list__items">
        <li
          v-for="(item, idx) in overdues"
          :key="idx"
          class="sv-item"
        >
          <div class="sv-item__main">
            <span class="sv-item__school">{{ item.school }}</span>
            <span class="sv-item__dot">·</span>
            <span class="sv-item__desc">{{ item.desc }}</span>
          </div>
          <div class="sv-item__sub">
            <span class="sv-item__overdue">逾期 {{ item.days }} 天</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Overdue {
  school: string
  desc: string
  days: number
}

const overdues: Overdue[] = [
  { school: '城南中学', desc: '消防通道堵塞整改', days: 11 },
  { school: '北辰中学', desc: '食堂卫生隐患整改', days: 7 },
  { school: '实验高中', desc: '宿舍电路检修整改', days: 4 },
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

.sv-panel {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  gap: vh(10);
  min-height: 0;
}

/* ===== 顶部：未闭环督办数 ===== */
.sv-summary {
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

  &__rate-row {
    display: flex; align-items: center; gap: vw(6);
  }

  &__rate-label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 11px;
    color: $cm-text-tertiary;
  }

  &__rate-value {
    @include cm-num;
    font-size: 16px;
    color: $cm-accent-red;
  }

  &__trend {
    display: flex; align-items: center; gap: vw(4);
  }

  &__trend-icon { width: vh(10); height: vh(10); }

  &__trend-text {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    color: $cm-accent-red;
  }
}

/* ===== 底部：逾期未反馈 ===== */
.sv-list {
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
    color: $cm-accent-red;
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

.sv-item {
  flex: 1;
  display: flex; flex-direction: column;
  justify-content: center;
  gap: vh(2);
  padding: vh(6) vw(10);
  background: $cm-bg-tile;
  border-radius: 6px;

  &__main {
    display: flex; align-items: center;
    gap: vw(4);
    overflow: hidden;
  }

  &__school {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 13px;
    color: $cm-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: vw(110);
  }

  &__dot {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 12px;
    color: $cm-text-b0;
    flex-shrink: 0;
  }

  &__desc {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 12px;
    color: $cm-text-tertiary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sub {
    display: flex; align-items: center;
  }

  &__overdue {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    color: $cm-accent-red;
    line-height: 1;
  }
}
</style>