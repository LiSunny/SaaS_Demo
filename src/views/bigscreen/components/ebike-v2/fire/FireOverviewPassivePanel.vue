<template>
  <EbikeV2Card title="被动安全与隐患概况">
    <div class="psv">
      <div v-for="b in PASSIVE_BLOCKS" :key="b.key" class="psv__block">
        <div class="psv__head">
          <span class="psv__name">{{ b.name }}</span>
          <span v-if="b.pending" class="psv__pending">演示数据</span>
        </div>

        <div class="psv__metrics">
          <div v-for="m in b.metrics" :key="m.label" class="psv__metric">
            <span class="psv__metric-value" :style="{ color: dataColor(m.tone ?? 'normal') }">
              {{ m.value }}<i v-if="m.unit" class="psv__metric-unit">{{ m.unit }}</i>
            </span>
            <span class="psv__metric-label">{{ m.label }}</span>
          </div>
        </div>

        <div v-if="b.top" class="psv__top" :style="{ color: dataColor(b.topTone ?? 'abnormal') }">
          <span class="psv__top-flag">最严重</span>
          <span class="psv__top-text">{{ b.top }}</span>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 被动安全与隐患概况
 *
 * 三个"会不会被烧、人跑不跑得掉"的系统：电气火灾 / 防火门 / 应急疏散。
 * 只给计数 + 最严重一条的位置，不放明细表（明细下钻二级页）。
 * 三个系统尚未建档案，数据为演示值，模块头部标"演示数据"。
 */
import EbikeV2Card from '../EbikeV2Card.vue'
import { PASSIVE_BLOCKS, dataColor } from './fire-mock'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

.psv {
  @include fire-panel;
  gap: vh(12);
}

.psv__block {
  display: flex;
  flex-direction: column;
  gap: vh(7);
  flex-shrink: 0;
}

.psv__head {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.psv__name {
  @include fire-label(15);
  color: var(--fire-text-title);
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

.psv__pending {
  @include fire-dim(12);
  padding: 0 vw(5);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: vw(2);
  margin-left: auto;
}

/* ===== 指标 ===== */
.psv__metrics {
  display: flex;
  gap: vw(10);
  padding-left: vw(8);
}

.psv__metric {
  display: flex;
  flex-direction: column;
  gap: vh(2);
  min-width: 0;
}

.psv__metric-value {
  @include fire-value(26);
  display: flex;
  align-items: baseline;
  gap: vw(2);
}

.psv__metric-unit {
  @include fire-sub(13);
  font-style: normal;
}

.psv__metric-label {
  @include fire-label(13);
  white-space: nowrap;
}

/* ===== 最严重一条 ===== */
.psv__top {
  display: flex;
  align-items: center;
  gap: vw(6);
  margin-left: vw(8);
  padding: vh(4) vw(8);
  border-radius: vw(2);
  background: rgba(0, 84, 160, 0.2);
  border-left: 2px solid currentColor;
}

.psv__top-flag {
  @include fire-sub(12);
  flex-shrink: 0;
  padding: 0 vw(4);
  border: 1px solid currentColor;
  border-radius: vw(2);
  line-height: 18px;
}

.psv__top-text {
  @include fire-sub(14);
  color: var(--fire-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
