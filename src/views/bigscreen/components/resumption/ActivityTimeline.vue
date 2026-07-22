<template>
  <ResumptionSectionCard title="最近动态">
    <div class="timeline-wrap">
      <div v-if="activities.length" class="timeline-list">
        <div
          v-for="(act, i) in activities"
          :key="`${act.planId}-${act.completedAt}`"
          class="timeline-item"
          :class="{ 'is-last': i === activities.length - 1 }"
        >
          <!-- 时间线节点 -->
          <div class="tl-node">
            <div class="tl-dot" :class="`dot-${act.planStatus}`" />
            <div v-if="i < activities.length - 1" class="tl-line" />
          </div>

          <!-- 内容 -->
          <div class="tl-content">
            <div class="tl-header">
              <span class="tl-time">{{ formatTime(act.completedAt) }}</span>
              <span :class="['tl-plan-badge', `badge-${act.planStatus}`]">
                {{ act.planName }}
              </span>
            </div>
            <div class="tl-body">
              <span class="tl-step">{{ act.stepLabel }}</span>
              <span class="tl-sep">·</span>
              <span class="tl-person">{{ act.completedBy }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空态 -->
      <div v-else class="tl-empty">暂无操作记录</div>
    </div>
  </ResumptionSectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STEP_META } from '@/types/resumption'
import type { ResumptionPlan } from '@/types/resumption'
import ResumptionSectionCard from './ResumptionSectionCard.vue'

const props = defineProps<{
  plans: ResumptionPlan[]
}>()

interface Activity {
  planId: number
  planName: string
  planStatus: string
  stepLabel: string
  completedBy: string
  completedAt: string
}

const activities = computed<Activity[]>(() => {
  const result: Activity[] = []

  for (const plan of props.plans) {
    for (const step of (plan.steps || [])) {
      if (step.status === 'done' && step.completedAt) {
        const meta = STEP_META.find(m => m.type === step.stepType)
        result.push({
          planId: plan.id,
          planName: plan.locationName,
          planStatus: plan.status,
          stepLabel: meta ? `完成「${meta.label}」` : `完成步骤 ${step.stepOrder}`,
          completedBy: step.completedBy || '—',
          completedAt: step.completedAt,
        })
      }
    }
  }

  // 按时间倒序，取最近 12 条
  result.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  return result.slice(0, 12)
})

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  // "2026-02-05 09:30:00" → "02-05 09:30"
  const parts = dateStr.split(' ')
  if (parts.length >= 2) {
    const date = parts[0].slice(5) // "02-05"
    const time = parts[1].slice(0, 5) // "09:30"
    return `${date} ${time}`
  }
  return dateStr
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.timeline-wrap {
  width: 100%;
  max-height: vh(300);
  overflow-y: auto;
}

.timeline-list {
  display: flex;
  flex-direction: column;
}

/* ===== 时间线条目 ===== */
.timeline-item {
  display: flex;
  gap: vw(8);
  padding-bottom: vh(2);

  &.is-last {
    padding-bottom: 0;
  }
}

/* 时间线节点列 */
.tl-node {
  flex: 0 0 vw(14);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tl-dot {
  width: vw(7);
  height: vw(7);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: vh(4);

  &.dot-prepare { background: #86aef0; }
  &.dot-review { background: #5e93eb; }
  &.dot-trial { background: #eda100; }
  &.dot-production { background: #1baf7a; }
}

.tl-line {
  width: 1px;
  flex: 1;
  min-height: vh(12);
  background: rgba(71, 132, 232, 0.15);
  margin-top: vh(2);
}

/* 内容区 */
.tl-content {
  flex: 1;
  min-width: 0;
  padding-bottom: vh(8);
}

.tl-header {
  display: flex;
  align-items: center;
  gap: vw(6);
  margin-bottom: vh(2);
}

.tl-time {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.4);
  white-space: nowrap;
}

.tl-plan-badge {
  font-size: clamp(8px, calc(9 * var(--min-scale)), 10px);
  padding: 0 vw(4);
  border-radius: 2px;
  white-space: nowrap;

  &.badge-prepare { color: #86aef0; background: rgba(134, 174, 240, 0.12); }
  &.badge-review { color: #5e93eb; background: rgba(94, 147, 235, 0.12); }
  &.badge-trial { color: #eda100; background: rgba(237, 161, 0, 0.12); }
  &.badge-production { color: #1baf7a; background: rgba(27, 175, 122, 0.12); }
}

.tl-body {
  display: flex;
  align-items: center;
  gap: vw(4);
  flex-wrap: wrap;
}

.tl-step {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  color: #c3d7f8;
  font-weight: 500;
}

.tl-sep {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.3);
}

.tl-person {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.5);
}

.tl-empty {
  text-align: center;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 13px);
  color: rgba(195, 215, 248, 0.4);
  padding: vh(16) 0;
}
</style>
