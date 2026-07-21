<template>
  <ResumptionSectionCard title="设备体检汇总">
    <div class="device-summary">
      <!-- 统计卡片行 -->
      <div class="ds-stats">
        <div class="ds-stat">
          <span class="ds-stat-value">{{ summary.total }}</span>
          <span class="ds-stat-label">检查设备总数</span>
        </div>
        <div class="ds-stat ds-stat-good">
          <span class="ds-stat-value">{{ summary.normalCount }}</span>
          <span class="ds-stat-label">正常</span>
        </div>
        <div class="ds-stat ds-stat-warn">
          <span class="ds-stat-value">{{ summary.needsRepairCount }}</span>
          <span class="ds-stat-label">待修</span>
        </div>
        <div class="ds-stat ds-stat-bad">
          <span class="ds-stat-value">{{ summary.disabledCount }}</span>
          <span class="ds-stat-label">停用</span>
        </div>
      </div>

      <!-- 设备状态占比条 -->
      <div v-if="summary.total > 0" class="ds-bar">
        <div
          v-if="summary.normalCount"
          class="ds-bar-seg seg-normal"
          :style="{ flex: summary.normalCount }"
          :title="`正常: ${summary.normalCount}`"
        />
        <div
          v-if="summary.needsRepairCount"
          class="ds-bar-seg seg-repair"
          :style="{ flex: summary.needsRepairCount }"
          :title="`待修: ${summary.needsRepairCount}`"
        />
        <div
          v-if="summary.disabledCount"
          class="ds-bar-seg seg-disabled"
          :style="{ flex: summary.disabledCount }"
          :title="`停用: ${summary.disabledCount}`"
        />
      </div>

      <!-- 待修设备列表 -->
      <div v-if="needsRepairDevices.length" class="ds-repair-list">
        <div class="ds-repair-title">待修设备</div>
        <div v-for="d in needsRepairDevices" :key="d.deviceName" class="ds-repair-item">
          <span class="ds-repair-name">{{ d.deviceName }}</span>
          <span class="ds-repair-location">{{ d.location }}</span>
          <span class="ds-repair-checker">{{ d.checker }}</span>
        </div>
      </div>

      <!-- 空态 -->
      <div v-if="summary.total === 0" class="ds-empty">暂无设备检查数据</div>
    </div>
  </ResumptionSectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResumptionPlan, DeviceCheckItem } from '@/types/resumption'
import ResumptionSectionCard from './ResumptionSectionCard.vue'

const props = defineProps<{
  plans: ResumptionPlan[]
}>()

interface DeviceSummaryData {
  total: number
  normalCount: number
  needsRepairCount: number
  disabledCount: number
  allDevices: DeviceCheckItem[]
}

const summary = computed<DeviceSummaryData>(() => {
  const result: DeviceSummaryData = { total: 0, normalCount: 0, needsRepairCount: 0, disabledCount: 0, allDevices: [] }

  for (const plan of props.plans) {
    const deviceStep = plan.steps?.find(s => s.stepType === 'device-check')
    const devices: DeviceCheckItem[] = deviceStep?.formData?.devices || []
    for (const d of devices) {
      result.total++
      result.allDevices.push({ ...d, location: d.location || plan.locationName })
      if (d.result === 'normal') result.normalCount++
      else if (d.result === 'needs_repair') result.needsRepairCount++
      else if (d.result === 'disabled') result.disabledCount++
    }
  }

  return result
})

const needsRepairDevices = computed(() => {
  return summary.value.allDevices.filter(d => d.result === 'needs_repair' || d.result === 'disabled')
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.device-summary {
  display: flex;
  flex-direction: column;
  gap: vh(10);
}

/* 统计卡片 */
.ds-stats {
  display: flex;
  gap: vw(12);
}

.ds-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: vh(2);
  padding: vw(8) vw(6);
  background: rgba(15, 43, 91, 0.4);
  border-radius: 4px;
  border: 1px solid rgba(71, 132, 232, 0.15);
}

.ds-stat-value {
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(20px, calc(24 * var(--min-scale)), 28px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.ds-stat-good .ds-stat-value {
  background: linear-gradient(to bottom, #8ff0c8 0%, #1baf7a 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.ds-stat-warn .ds-stat-value {
  background: linear-gradient(to bottom, #ffd688 0%, #eda100 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.ds-stat-bad .ds-stat-value {
  background: linear-gradient(to bottom, #ffb088 0%, #e34948 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.ds-stat-label {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.6);
}

/* 状态占比条 */
.ds-bar {
  display: flex;
  height: vh(8);
  border-radius: 4px;
  overflow: hidden;
  gap: 1px;
  background: rgba(15, 43, 91, 0.3);
}

.ds-bar-seg {
  min-width: 2px;
  transition: flex 0.3s;

  &.seg-normal { background: #1baf7a; }
  &.seg-repair { background: #eda100; }
  &.seg-disabled { background: #e34948; }
}

/* 待修设备列表 */
.ds-repair-list {
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.ds-repair-title {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  font-weight: 600;
  color: #eda100;
  margin-bottom: vh(2);
}

.ds-repair-item {
  display: flex;
  gap: vw(8);
  padding: vw(4) vw(8);
  background: rgba(237, 161, 0, 0.08);
  border-radius: 3px;
  border-left: 2px solid rgba(237, 161, 0, 0.4);
}

.ds-repair-name {
  flex: 1;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  font-weight: 500;
  color: #c3d7f8;
}

.ds-repair-location {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.5);
}

.ds-repair-checker {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.4);
}

.ds-empty {
  text-align: center;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 13px);
  color: rgba(195, 215, 248, 0.4);
  padding: vh(16) 0;
}
</style>
