<template>
  <ResumptionSectionCard title="隐患排查汇总">
    <div class="hazard-summary">
      <!-- 统计卡片行 -->
      <div class="hs-stats">
        <div class="hs-stat">
          <span class="hs-stat-value">{{ summary.total }}</span>
          <span class="hs-stat-label">隐患总数</span>
        </div>
        <div class="hs-stat hs-stat-warn">
          <span class="hs-stat-value">{{ summary.majorCount }}</span>
          <span class="hs-stat-label">重大隐患</span>
        </div>
        <div class="hs-stat">
          <span class="hs-stat-value">{{ summary.generalCount }}</span>
          <span class="hs-stat-label">一般隐患</span>
        </div>
        <div class="hs-stat hs-stat-good">
          <span class="hs-stat-value">{{ disposalRate }}%</span>
          <span class="hs-stat-label">处置率</span>
        </div>
      </div>

      <!-- 状态分布条 -->
      <div class="hs-bar-wrap">
        <div class="hs-bar">
          <div
            v-for="seg in statusSegments"
            :key="seg.key"
            class="hs-bar-seg"
            :class="`seg-${seg.key}`"
            :style="{ flex: seg.count || 0.1 }"
            :title="`${seg.label}: ${seg.count}`"
          />
        </div>
        <div class="hs-bar-labels">
          <span v-for="seg in statusSegments" :key="seg.key" class="hs-bar-label">
            <span class="hs-label-dot" :class="`dot-${seg.key}`" />{{ seg.label }} {{ seg.count }}
          </span>
        </div>
      </div>

      <!-- 空态 -->
      <div v-if="summary.total === 0" class="hs-empty">暂无隐患数据</div>
    </div>
  </ResumptionSectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ResumptionPlan, HazardRecord } from '@/types/resumption'
import ResumptionSectionCard from './ResumptionSectionCard.vue'

const props = defineProps<{
  plans: ResumptionPlan[]
}>()

interface HazardSummaryData {
  total: number
  generalCount: number
  majorCount: number
  found: number
  disposed: number
  rectified: number
  accepted: number
  archived: number
}

const summary = computed<HazardSummaryData>(() => {
  const result: HazardSummaryData = { total: 0, generalCount: 0, majorCount: 0, found: 0, disposed: 0, rectified: 0, accepted: 0, archived: 0 }

  for (const plan of props.plans) {
    const hazardStep = plan.steps?.find(s => s.stepType === 'hazard-check')
    const records: HazardRecord[] = hazardStep?.formData?.hazards || []
    for (const r of records) {
      result.total++
      if (r.level === 'major') result.majorCount++
      else result.generalCount++
      // 按状态分类
      const statusCounts: Record<string, keyof HazardSummaryData> = {
        found: 'found', disposed: 'disposed', rectified: 'rectified',
        accepted: 'accepted', archived: 'archived',
      }
      const key = statusCounts[r.status]
      if (key) result[key]++
    }
  }

  return result
})

const disposalRate = computed(() => {
  if (summary.value.total === 0) return 0
  const handled = processedCount.value + summary.value.archived
  return Math.round((handled / summary.value.total) * 100)
})

const processedCount = computed(() =>
  summary.value.disposed + summary.value.rectified + summary.value.accepted
)

const statusSegments = computed(() => [
  { key: 'found', label: '发现', count: summary.value.found },
  { key: 'processed', label: '已处理', count: processedCount.value },
  { key: 'archived', label: '已归档', count: summary.value.archived },
])
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.hazard-summary {
  display: flex;
  flex-direction: column;
  gap: vh(10);
}

/* 统计卡片 */
.hs-stats {
  display: flex;
  gap: vw(12);
}

.hs-stat {
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

.hs-stat-value {
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(20px, calc(24 * var(--min-scale)), 28px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.hs-stat-warn .hs-stat-value {
  background: linear-gradient(to bottom, #ffb088 0%, #eb6834 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hs-stat-good .hs-stat-value {
  background: linear-gradient(to bottom, #8ff0c8 0%, #1baf7a 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hs-stat-label {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.6);
}

/* 状态分布条 */
.hs-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.hs-bar {
  display: flex;
  height: vh(8);
  border-radius: 4px;
  overflow: hidden;
  gap: 1px;
  background: rgba(15, 43, 91, 0.3);
}

.hs-bar-seg {
  min-width: 2px;
  transition: flex 0.3s;

  &.seg-found { background: #e34948; }
  &.seg-processed { background: #3678E3; }
  &.seg-archived { background: #1baf7a; }
}

.hs-bar-labels {
  display: flex;
  gap: vw(12);
  flex-wrap: wrap;
}

.hs-bar-label {
  display: flex;
  align-items: center;
  gap: vw(3);
  font-size: clamp(8px, calc(9 * var(--min-scale)), 10px);
  color: rgba(195, 215, 248, 0.5);
}

.hs-label-dot {
  width: vw(6);
  height: vw(6);
  border-radius: 1px;

  &.dot-found { background: #e34948; }
  &.dot-processed { background: #3678E3; }
  &.dot-archived { background: #1baf7a; }
}

.hs-empty {
  text-align: center;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 13px);
  color: rgba(195, 215, 248, 0.4);
  padding: vh(16) 0;
}
</style>
