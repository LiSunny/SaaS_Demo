<template>
  <EbikeV2Card title="报警记录" class="timeline">
    <div class="timeline__inner">
      <div class="timeline__list">
        <div v-for="(r, i) in records" :key="i" class="timeline__row">
          <!-- 左侧时间轴 -->
          <span class="timeline__dot" />
          <span class="timeline__time">{{ r.time }}</span>
          <span class="timeline__tag">消息推送</span>
          <span class="timeline__text">{{ r.text }}</span>
        </div>
        <span v-if="!records.length" class="timeline__empty">该事件暂无报警记录</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 报警记录
 *
 * 消息推送流水（云端口径：时间 + 推送对象 + 推送渠道）。
 * 数据按事件的最新报警时间倒推生成，同一事件每次刷新一致。
 */
import { computed } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import { dutyTimelineOf, type DutyEvent } from './duty-data'

const props = defineProps<{
  event: DutyEvent | null
}>()

const records = computed(() => (props.event ? dutyTimelineOf(props.event) : []))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.timeline {
  height: 100%;
}

.timeline__inner {
  @include fire-panel;
  padding: vh(10) vw(12);
}

.timeline__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* 单条记录 */
.timeline__row {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: vw(8);
  padding-left: vw(16);
}

/* 时间轴圆点 */
.timeline__dot {
  position: absolute;
  left: 0;
  top: vh(7);
  width: vw(7);
  height: vw(7);
  border-radius: 50%;
  background: #4fa8ff;
  box-shadow: 0 0 0 vw(3) rgba(79, 168, 255, 0.16);
}

.timeline__time {
  @include fire-dim(14);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 推送方式标签 */
.timeline__tag {
  flex-shrink: 0;
  padding: vh(1) vw(6);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.5);
  color: var(--fire-text-label);
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
}

.timeline__text {
  flex: 1 1 100%;
  min-width: 0;
  @include fire-sub(14);
  line-height: 1.4;
}

.timeline__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fire-dim(14);
}
</style>
