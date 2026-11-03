<template>
  <EbikeV2Card title="泵房设备" class="pd">
    <div class="pd__body">
      <section v-for="g in groups" :key="g.key" class="pd__group">
        <div class="pd__group-head">
          <span class="pd__group-title">{{ g.title }}</span>
          <span class="pd__group-count">{{ g.rows.length }}</span>
        </div>

        <div class="pd__rows">
          <button
            v-for="r in g.rows"
            :key="r.poiId"
            type="button"
            class="pd__row"
            :class="{ 'is-schematic': r.schematic }"
            :title="r.sub"
            @click="$emit('select', r.poiId)"
          >
            <!-- 状态点：只表示异常与否，正常态不占语义色 -->
            <i class="pd__dot" :class="`is-${r.tone}`" />
            <span class="pd__name">{{ r.name }}</span>
            <span class="pd__value" :class="`is-${r.tone}`">{{ r.value }}</span>
          </button>
        </div>
      </section>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 水泵房场景监控 · 右侧设备详情列
 *
 * 按泵房 POI 分组列出设备：储水 / 水泵 / 电气 / 阀门 / 其它。
 * 点一行 → 抛给父组件 → 父组件调三维模型的 selectPOI 聚焦对应设备。
 *
 * 「示意」条目（备泵、母管、排污井）没有独立测点：显示静态属性并标注，
 * 不显示伪造的运行状态。
 */
import EbikeV2Card from '../EbikeV2Card.vue'
import type { PumpDeviceGroup } from './pump-room-data'

defineProps<{
  groups: PumpDeviceGroup[]
}>()

defineEmits<{ (e: 'select', poiId: string): void }>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.pd {
  height: 100%;
}

.pd__body {
  @include fire-panel;
  gap: vh(10);
  overflow-y: auto;
  overflow-x: hidden;
}

/* ===== 分组 ===== */
.pd__group {
  display: flex;
  flex-direction: column;
  gap: vh(6);
  flex-shrink: 0;
}

.pd__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
}

.pd__group-title {
  @include fire-section-title(14);
  line-height: 1.12;
}

.pd__group-count {
  @include fire-dim(14);
  font-variant-numeric: tabular-nums;
}

/* ===== 设备行 ===== */
.pd__rows {
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.pd__row {
  display: flex;
  align-items: center;
  gap: vw(8);
  width: 100%;
  min-width: 0;
  padding: vh(5) vw(8);
  border: 1px solid transparent;
  border-radius: vw(2);
  background: rgba(0, 31, 60, 0.45);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.pd__row:hover {
  background: rgba(0, 84, 160, 0.5);
  border-color: rgba(120, 190, 255, 0.28);
}

/* 示意条目：整体弱一档，避免与有真实测点的设备混为一谈 */
.pd__row.is-schematic {
  background: transparent;
  border-style: dashed;
  border-color: rgba(120, 190, 255, 0.14);
}

.pd__row.is-schematic .pd__name {
  color: var(--fire-text-dim);
}

/* 状态点：正常不占语义色（中性蓝），异常走唯一红，离线走灰 */
.pd__dot {
  flex-shrink: 0;
  width: vw(6);
  height: vw(6);
  border-radius: 50%;
  background: var(--fire-neutral);
}

.pd__dot.is-abnormal {
  background: var(--fire-anomaly);
}

.pd__dot.is-off {
  background: rgba(126, 166, 214, 0.45);
}

.pd__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.pd__value {
  flex-shrink: 0;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 1.1;
  color: var(--fire-text-title);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.pd__value.is-abnormal {
  color: var(--fire-anomaly);
}

.pd__value.is-off {
  color: var(--fire-text-dim);
  font-weight: 400;
}
</style>
