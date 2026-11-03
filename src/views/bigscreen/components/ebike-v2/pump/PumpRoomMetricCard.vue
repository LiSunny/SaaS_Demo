<template>
  <EbikeV2Card plain class="pm">
    <div class="pm__inner">
      <!-- 指标名 + ⓘ 说明 + 来源标签 -->
      <div class="pm__head">
        <span class="pm__name">{{ metric.name }}</span>
        <svg class="pm__info" viewBox="0 0 12 12" width="13" height="13">
          <title>{{ metric.hint }}</title>
          <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.1" />
          <path d="M6 3.1v3.3M6 8.5v.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
        </svg>
        <!-- 演示数据来源标注：本地造的数据必须说清楚，不能冒充平台测点 -->
        <span v-if="metric.origin === 'demo'" class="pm__origin">演示</span>
      </div>

      <!-- 数值 + 单位 -->
      <div class="pm__value-row">
        <span class="pm__value" :class="`is-${metric.tone}`">{{ metric.value }}</span>
        <span v-if="metric.unit" class="pm__unit">{{ metric.unit }}</span>
      </div>

      <!-- 次读数（阈值 / 补充） -->
      <span v-if="metric.sub" class="pm__sub">{{ metric.sub }}</span>

      <!-- 24 点迷你趋势 -->
      <FireTrendSpark
        v-if="showTrend"
        class="pm__chart"
        :series="metric.trend"
        :aria-label="`${metric.name} 24 小时趋势`"
      />
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 水泵房场景监控 · 顶部指标卡
 *
 * 版式沿用总览页「消防用水监控」卡的指标行（图标 + 名称ⓘ + 数值 + 24h 迷你趋势），
 * 但改成竖排：顶部一排 5 张，每张自带标题区。
 *
 * 数值色只有两种语义：正常走中性色阶，异常走全页唯一的异常红 #ff8080。
 * 不按等级分色（橙/黄）—— 用户定的口径：全页角标只留一个红，
 * 等级差异由文案承担。
 */
import EbikeV2Card from '../EbikeV2Card.vue'
import FireTrendSpark from '../fire/FireTrendSpark.vue'
import type { PumpMetricRow } from './pump-room-data'

withDefaults(
  defineProps<{
    metric: PumpMetricRow
    /** 是否画趋势图（状态类指标没有连续量，不画） */
    showTrend?: boolean
  }>(),
  { showTrend: true },
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.pm {
  min-width: 0;
}

.pm__inner {
  @include fire-panel;
  gap: vh(6);
  padding: vh(10) vw(12);
}

/* ===== 指标名行 ===== */
.pm__head {
  display: flex;
  align-items: center;
  gap: vw(4);
  min-width: 0;
}

.pm__name {
  @include fire-label(15);
  color: var(--fire-text-title);
  line-height: 1.12;
  white-space: nowrap;
}

.pm__info {
  flex-shrink: 0;
  color: var(--fire-text-sub);
}

/* 来源标签：弱色小字，只说明"这是演示数据"，不承担语义 */
.pm__origin {
  @include fire-dim(14);
  flex-shrink: 0;
  margin-left: auto;
  padding: 0 vw(6);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  line-height: 1.4;
}

/* ===== 数值行 ===== */
.pm__value-row {
  display: flex;
  align-items: baseline;
  gap: vw(6);
  min-width: 0;
}

/**
 * 主数值：26px。
 * 正常走纵向冷蓝渐变（与总览页核心数值同一套视觉），
 * 异常换红渐变，off（无测点）用弱色。
 */
.pm__value {
  @include fire-value(26);
  line-height: 1.2;
  background: linear-gradient(180deg, #a5ceff 0%, #d0e4fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 异常：红渐变（暗端即全页唯一异常红 #ff8080）。
   用 background-image 而不是 background —— 后者会把 background-clip
   重置回 border-box，渐变铺满数字盒子，文字被 fill-color 吃掉。 */
.pm__value.is-abnormal {
  background-image: linear-gradient(180deg, #ff8080 0%, #ffb3b3 100%);
}

/* 无测点：弱色，"数据没到"与"设备健康"不能长得一样 */
.pm__value.is-off {
  background: none;
  -webkit-text-fill-color: currentColor;
  color: var(--fire-text-dim);
}

.pm__unit {
  @include fire-label(16);
  color: var(--fire-text-label);
  flex-shrink: 0;
}

/* ===== 次读数 ===== */
.pm__sub {
  @include fire-sub(14);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 迷你趋势 ===== */
.pm__chart {
  flex: 1;
  min-width: 0;
  height: vh(52);
  margin-top: vh(2);
}
</style>
