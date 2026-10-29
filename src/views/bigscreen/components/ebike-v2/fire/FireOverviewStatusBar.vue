<template>
  <div class="fsb">
    <div v-for="m in STATUS_BAR" :key="m.key" class="fsb__item">
      <div class="fsb__label-row">
        <span class="fsb__label">{{ m.label }}</span>
        <span v-if="m.demo" class="fsb__demo">演示</span>
      </div>
      <div class="fsb__value" :style="{ color: TONE_COLOR[m.tone] }">
        {{ m.value }}<span v-if="m.unit" class="fsb__unit">{{ m.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 通栏态势条
 *
 * 一行 6 个核心指标：设备规模 / 完好率 / 预警 / 故障 / 离线 / 值班在岗。
 * 数值来自 `fire-mock.ts`，台数与可用率由各系统台数算出。
 */
import { STATUS_BAR, TONE_COLOR } from './fire-mock'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

.fsb {
  display: flex;
  align-items: stretch;
  height: 100%;
  padding: 0 vw(12);
  border-radius: 3px;
  overflow: hidden;
  /* 与模块卡片同一套玻璃底 */
  background: rgba(0, 44, 94, 0.62);
  backdrop-filter: blur(9px) saturate(125%);
  -webkit-backdrop-filter: blur(9px) saturate(125%);
  border: 1px solid rgba(0, 152, 230, 0.12);
}

.fsb__item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(4);
  padding: 0 vw(10);
  position: relative;

  /* 项间竖分隔线 */
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: vh(12);
    bottom: vh(12);
    width: 1px;
    background: $fire-line;
  }
}

.fsb__label-row {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.fsb__label {
  @include fire-label(15);
}

/* 演示数据标记 */
.fsb__demo {
  @include fire-sub(12);
  padding: 0 vw(4);
  border: 1px solid rgba(207, 210, 215, 0.35);
  border-radius: vw(2);
  color: #ced2d7;
  line-height: 18px;
}

.fsb__value {
  @include fire-value(28);
  display: flex;
  align-items: baseline;
  gap: vw(4);
}

.fsb__unit {
  @include fire-sub(14);
  font-size: 14px;
}
</style>
