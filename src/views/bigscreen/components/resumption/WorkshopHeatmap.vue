<template>
  <ResumptionSectionCard title="车间复工进度热力图">
    <div class="heatmap-wrap">
      <!-- 表头行：阶段分组 + 步骤列 -->
      <div class="heatmap-header">
        <!-- 车间名列占位 -->
        <div class="hm-col-name hm-header-cell">车间</div>
        <!-- 阶段分组 -->
        <template v-for="stage in STAGES" :key="stage.key">
          <div class="hm-stage-group" :style="{ flex: stage.stepOrders.length }">
            <div class="hm-stage-label">{{ stage.label }}</div>
            <div class="hm-step-labels">
              <div
                v-for="order in stage.stepOrders"
                :key="order"
                class="hm-step-cell hm-header-cell"
                :title="stepMetaByOrder[order]?.label"
              >
                {{ order }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 数据行 -->
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="heatmap-row"
        @click="$emit('plan-click', plan.id)"
      >
        <!-- 车间名 -->
        <div class="hm-col-name hm-data-cell">
          <span class="hm-plan-name">{{ plan.locationName }}</span>
          <span :class="['hm-plan-status', `status-${plan.status}`]">
            {{ statusLabel(plan.status) }}
          </span>
        </div>

        <!-- 11 个步骤单元格 -->
        <template v-for="stage in STAGES" :key="stage.key">
          <div
            v-for="order in stage.stepOrders"
            :key="order"
            class="hm-step-cell hm-data-cell"
            :class="cellClass(getStepStatus(plan, order))"
            :title="cellTitle(plan, order)"
          >
            <div class="hm-cell-dot" />
          </div>
        </template>
      </div>

      <!-- 空态 -->
      <div v-if="!plans.length" class="heatmap-empty">
        暂无复工计划数据
      </div>
    </div>

    <!-- 图例 -->
    <div class="heatmap-legend">
      <span class="legend-item"><span class="legend-dot dot-done" /> 已完成</span>
      <span class="legend-item"><span class="legend-dot dot-progress" /> 进行中</span>
      <span class="legend-item"><span class="legend-dot dot-pending" /> 待执行</span>
    </div>
  </ResumptionSectionCard>
</template>

<script setup lang="ts">
import { STAGES, STEP_META } from '@/types/resumption'
import type { ResumptionPlan } from '@/types/resumption'
import ResumptionSectionCard from './ResumptionSectionCard.vue'

defineProps<{
  plans: ResumptionPlan[]
}>()

defineEmits<{
  'plan-click': [planId: number]
}>()

// 步骤元数据按 order 索引
const stepMetaByOrder: Record<number, typeof STEP_META[number]> = {}
STEP_META.forEach(m => { stepMetaByOrder[m.order] = m })

const statusLabelMap: Record<string, string> = {
  prepare: '复工准备',
  review: '复工审核',
  trial: '试产观察',
  production: '正式复产',
}

function statusLabel(status: string): string {
  return statusLabelMap[status] || status
}

function getStepStatus(plan: ResumptionPlan, stepOrder: number): string {
  const step = plan.steps?.find(s => s.stepOrder === stepOrder)
  return step?.status || 'pending'
}

function cellClass(status: string): string {
  return `cell-${status}`
}

function cellTitle(plan: ResumptionPlan, order: number): string {
  const meta = stepMetaByOrder[order]
  const step = plan.steps?.find(s => s.stepOrder === order)
  const statusText = step?.status === 'done' ? '已完成' : step?.status === 'in_progress' ? '进行中' : '待执行'
  const name = meta ? meta.label : `步骤${order}`
  const who = step?.completedBy ? ` — ${step.completedBy}` : ''
  return `${plan.locationName} · ${name} · ${statusText}${who}`
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.heatmap-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
  max-height: vh(320);
}

/* ===== 表头 ===== */
.heatmap-header {
  display: flex;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
}

.hm-header-cell {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  font-weight: 600;
  color: #89b5ff;
  background: rgba(15, 43, 91, 0.8);
  text-align: center;
}

/* 阶段分组 */
.hm-stage-group {
  display: flex;
  flex-direction: column;
}

.hm-stage-label {
  text-align: center;
  font-size: clamp(8px, calc(9 * var(--min-scale)), 10px);
  font-weight: 500;
  color: rgba(137, 181, 255, 0.6);
  padding: vh(2) 0;
  background: rgba(15, 43, 91, 0.8);
  border-bottom: 1px solid rgba(71, 132, 232, 0.15);
}

.hm-step-labels {
  display: flex;
}

/* ===== 数据行 ===== */
.heatmap-row {
  display: flex;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(54, 120, 227, 0.1);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(71, 132, 232, 0.08);
  }
}

/* 车间名列 */
.hm-col-name {
  flex: 0 0 vw(100);
  min-width: vw(80);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: vh(2);
  padding: vw(4) vw(8);
}

.hm-plan-name {
  font-size: clamp(10px, calc(12 * var(--min-scale)), 13px);
  font-weight: 600;
  color: #c3d7f8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.hm-plan-status {
  font-size: clamp(8px, calc(9 * var(--min-scale)), 10px);
  padding: 0 vw(4);
  border-radius: 2px;

  &.status-prepare { color: #86aef0; background: rgba(134, 174, 240, 0.15); }
  &.status-review { color: #5e93eb; background: rgba(94, 147, 235, 0.15); }
  &.status-trial { color: #eda100; background: rgba(237, 161, 0, 0.15); }
  &.status-production { color: #1baf7a; background: rgba(27, 175, 122, 0.15); }
}

/* 步骤单元格 */
.hm-step-cell {
  flex: 1;
  min-width: vw(20);
  max-width: vw(32);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hm-data-cell {
  padding: vw(6) 0;
}

.hm-cell-dot {
  width: vw(10);
  height: vw(10);
  border-radius: 2px;
}

/* 单元格状态颜色 */
.cell-done .hm-cell-dot {
  background: #3678E3;
  box-shadow: 0 0 4px rgba(54, 120, 227, 0.4);
}

.cell-in_progress .hm-cell-dot {
  background: #eda100;
  box-shadow: 0 0 6px rgba(237, 161, 0, 0.5);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.cell-pending .hm-cell-dot {
  background: rgba(137, 181, 255, 0.15);
  border: 1px solid rgba(137, 181, 255, 0.1);
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 4px rgba(237, 161, 0, 0.3); }
  50% { box-shadow: 0 0 10px rgba(237, 161, 0, 0.7); }
}

/* 空态 */
.heatmap-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: vh(60);
  font-size: clamp(12px, calc(13 * var(--min-scale)), 14px);
  color: rgba(195, 215, 248, 0.4);
}

/* ===== 图例 ===== */
.heatmap-legend {
  display: flex;
  gap: vw(16);
  justify-content: center;
  padding-top: vh(8);
  border-top: 1px solid rgba(71, 132, 232, 0.1);
  margin-top: vh(6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: vw(4);
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.6);
}

.legend-dot {
  width: vw(8);
  height: vw(8);
  border-radius: 2px;

  &.dot-done { background: #3678E3; }
  &.dot-progress { background: #eda100; }
  &.dot-pending { background: rgba(137, 181, 255, 0.15); border: 1px solid rgba(137, 181, 255, 0.1); }
}
</style>
