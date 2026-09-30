<!--
  SafetyPerceptionPanel
  安全态势感知（左上模块）
  设计稿节点：666:3645（容器） + 666:3660（容器内容） + 670:2384（健康度） + 670:2412（指标网格）

  包含：
    - 辖区健康度（优秀/良好/中等/较差）
    - 4 个指标 2x2：欺凌事件/宿舍隐患/教师隐患/食堂隐患
-->
<template>
  <div class="sp-panel">
    <!-- 辖区健康度 -->
    <div class="sp-health">
      <div class="sp-health__row">
        <span class="sp-health__label">辖区健康度</span>
        <span class="sp-health__legend">
          <span class="sp-health__legend-item" :class="`is-${level}`" v-for="level in healthLevels" :key="level.key">
            {{ level.label }}
          </span>
        </span>
      </div>
      <div class="sp-health__tip">
        <img class="sp-health__tip-icon" src="/campus-monitor/icons/info.svg" alt="" />
        <span class="sp-health__tip-text">分析结论来源于昨日指标数据</span>
      </div>
    </div>

    <!-- 4 个指标 2×2 -->
    <div class="sp-grid">
      <div
        v-for="(metric, idx) in metrics"
        :key="idx"
        class="sp-metric"
      >
        <div class="sp-metric__row">
          <!-- 图标 -->
          <div class="sp-metric__icon" :class="{ 'sp-metric__icon--teach': metric.icon === 'teaching', 'sp-metric__icon--dining': metric.icon === 'dining' }">
            <img :src="metric.iconSrc" alt="" />
          </div>
          <!-- 标签 + 注意 -->
          <div class="sp-metric__info">
            <div class="sp-metric__label-row">
              <span class="sp-metric__label">{{ metric.label }}</span>
              <img class="sp-metric__attention" src="/campus-monitor/icons/attention.svg" alt="" />
            </div>
            <div class="sp-metric__value-row">
              <span class="sp-metric__value" :class="{ 'sp-metric__value--alert': metric.isAlert }">{{ metric.value }}</span>
              <span class="sp-metric__unit">{{ metric.unit }}</span>
            </div>
          </div>
        </div>
        <div class="sp-metric__trend">
          <span class="sp-metric__trend-label">较昨日</span>
          <img class="sp-metric__trend-icon" src="/campus-monitor/icons/trending-up.svg" alt="" />
          <span class="sp-metric__trend-value">{{ metric.trend }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const healthLevels = [
  { key: 'excellent', label: '优秀' },
  { key: 'good',      label: '良好' },
  { key: 'medium',    label: '中等' },
  { key: 'poor',      label: '较差' },
]

interface MetricDef {
  label: string
  value: string
  unit: string
  trend: string
  icon: string          // 'bullying' | 'dorm' | 'teaching' | 'dining'
  iconSrc: string
  isAlert: boolean
}

const metrics = computed<MetricDef[]>(() => [
  {
    label: '欺凌事件',
    value: '12',
    unit: '件',
    trend: '12.5%',
    icon: 'bullying',
    iconSrc: '/campus-monitor/icons/bullying-event.svg',
    isAlert: true,
  },
  {
    label: '宿舍隐患',
    value: '0',
    unit: '件',
    trend: '12.5%',
    icon: 'dorm',
    iconSrc: '/campus-monitor/icons/dorm-hazard.svg',
    isAlert: false,
  },
  {
    label: '教师隐患',
    value: '0',
    unit: '件',
    trend: '12.5%',
    icon: 'teaching',
    iconSrc: '/campus-monitor/icons/teaching.svg',
    isAlert: false,
  },
  {
    label: '食堂隐患',
    value: '0',
    unit: '件',
    trend: '12.5%',
    icon: 'dining',
    iconSrc: '/campus-monitor/icons/dining.svg',
    isAlert: false,
  },
])
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../campus-monitor-common.scss" as *;

.sp-panel {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  gap: vh(8);
  min-height: 0;
}

/* ===== 健康度（顶部小区域） ===== */
.sp-health {
  flex: 0 0 auto;
  display: flex; flex-direction: column;
  gap: vh(2);
  padding: 0 vw(2);

  &__row {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%;
  }

  &__label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 14px;
    color: $cm-text-secondary;
    line-height: 1.4;
  }

  &__legend {
    flex: 1; text-align: right;
    font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: $cm-text-secondary;

    &-item {
      padding: 0 vw(2);
      &.is-excellent { color: $cm-health-excellent; }
      &.is-good      { color: $cm-health-good; }
      &.is-medium    { color: $cm-health-medium; }
      &.is-poor      { color: $cm-health-poor; }
    }
  }

  &__tip {
    display: flex; align-items: center; gap: vw(4);
    width: 100%;

    &-icon { width: vh(12); height: vh(12); flex-shrink: 0; }
    &-text {
      font-family: 'Alibaba PuHuiTi', sans-serif;
      font-size: 10px;
      color: $cm-text-b0;
      line-height: 1.2;
    }
  }
}

/* ===== 4 指标 2×2 grid ===== */
.sp-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: vh(8) vw(8);
  padding: 0 vw(2);
}

.sp-metric {
  background: $cm-bg-tile;
  border-radius: 10px;
  padding: vh(8) vw(12);
  display: flex; flex-direction: column;
  gap: vh(4);
  justify-content: center;
  min-height: 0;
  min-width: 0;

  &__row {
    display: flex; align-items: center; gap: vw(10);
  }

  &__icon {
    flex: 0 0 auto;
    width: vh(36); height: vh(36);
    border-radius: 6px;
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    img { width: 100%; height: 100%; object-fit: contain; }

    &--teach,
    &--dining {
      border: 1px solid rgba(47, 252, 255, 0.36);
      background: radial-gradient(circle, rgba(99,237,255,0.36) 0%, rgba(148,250,255,0.15) 100%);
      padding: vh(6);
      img { width: vh(22); height: vh(22); }
    }
  }

  &__info {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
    gap: vh(4);
  }

  &__label-row {
    display: flex; align-items: center; gap: vw(4);
  }

  &__label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 13px;
    color: $cm-text-secondary;
    line-height: 1.2;
  }

  &__attention {
    width: vh(12); height: vh(12); flex-shrink: 0;
  }

  &__value-row {
    display: flex; align-items: flex-end; gap: vw(4);
  }

  &__value {
    @include cm-num;
    font-size: 22px;
    color: $cm-text-primary;
    line-height: 1;

    &--alert { color: $cm-accent-red-strong; }
  }

  &__unit {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    color: $cm-text-tertiary;
    line-height: 1;
    padding-bottom: vh(2);
  }

  &__trend {
    display: flex; align-items: center; gap: vw(4);
  }

  &__trend-label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 9px;
    color: $cm-text-tertiary;
    line-height: 1;
  }

  &__trend-icon {
    width: vh(10); height: vh(10); flex-shrink: 0;
  }

  &__trend-value {
    @include cm-num;
    font-size: 10px;
    color: $cm-accent-green;
    line-height: 1;
  }
}
</style>