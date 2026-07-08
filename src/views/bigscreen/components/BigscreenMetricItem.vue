<template>
  <div class="metric-item">
    <!-- 六边形图标（hexSrc 指向外部 SVG 文件，替换文件即可换图标） -->
    <img
      class="metric-hex"
      :src="hexSrc"
      alt=""
    />

    <!-- 右侧文字区（Figma: 123px 宽, 16px 间距） -->
    <div class="metric-text">
      <!-- 标签行（带背景装饰线） -->
      <div class="metric-label-row">
        <div class="metric-label-line" />
        <p class="metric-label">{{ label }}</p>
      </div>
      <!-- 数值 -->
      <p class="metric-value">
        <span class="metric-num">{{ value }}</span>
        <span v-if="unit" class="metric-unit">{{ unit }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import defaultHexSrc from '@/assets/bigscreen/metric-hex-default.svg'

withDefaults(defineProps<{
  /** 标签文字，如"电动自行车" */
  label: string
  /** 指标数值 */
  value: string | number
  /** 单位，如"个"，不传则不显示 */
  unit?: string
  /** 六边形 SVG 文件路径，默认使用 Figma 样式；替换文件即可换图标 */
  hexSrc?: string
}>(), {
  hexSrc: () => defaultHexSrc,
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.metric-item {
  display: flex;
  align-items: center;
  gap: vw(16);
}

/* ===== 六边形图标区 ===== */
.metric-hex {
  width: calc(65 * var(--min-scale));
  height: calc(66 * var(--min-scale));
  flex-shrink: 0;
  display: block;
  overflow: hidden;
}

/* ===== 右侧文字区 ===== */
.metric-text {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  min-width: 0;
}

/* ===== 标签行 ===== */
.metric-label-row {
  position: relative;
  display: inline-grid;
  grid-template-rows: max-content;
}

/* 标签背景装饰线（Figma: 79.92° 蓝色渐变斜线） */
.metric-label-line {
  grid-column: 1;
  grid-row: 1;
  height: vh(13);
  margin-top: vh(10);
  width: 100%;
  background: linear-gradient(
    79.92deg,
    rgba(15, 43, 91, 0) 0%,
    rgb(25, 82, 170) 0%,
    rgba(22, 70, 145, 0.688) 75%,
    rgba(15, 43, 91, 0) 100%
  );
}

/* 标签文字（Figma: 18px, Douyin Sans Bold, 白色→蓝色渐变） */
.metric-label {
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(15px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

/* ===== 数值行（Figma: 24px 数字 + 16px 单位） ===== */
.metric-value {
  margin: 0;
  white-space: nowrap;
  line-height: 0;
  display: flex;
  align-items: baseline;
  gap: vw(4);
}
.metric-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(20px, calc(22 * var(--min-scale)), 24px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}
.metric-unit {
  font-family: 'Heiti TC', 'PingFang SC', sans-serif;
  font-size: clamp(8px, calc(13 * var(--min-scale)), 16px);
  font-weight: 500;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}
</style>
