<template>
  <ResumptionSectionCard title="复工阶段分布">
    <div class="stage-flow">
      <!-- 阶段卡片 -->
      <div
        v-for="stage in stageData"
        :key="stage.key"
        class="stage-card"
        :class="`stage-${stage.key}`"
      >
        <!-- 计数 -->
        <span class="stage-count">{{ stage.count }}</span>
        <!-- 标签 -->
        <span class="stage-label">{{ stage.label }}</span>
        <!-- 车间列表 -->
        <div v-if="stage.plans.length" class="stage-plans">
          <span v-for="p in stage.plans" :key="p.id" class="stage-plan-name">
            {{ p.locationName }}
          </span>
        </div>
        <span v-else class="stage-empty">—</span>
      </div>

      <!-- 连接箭头 -->
      <div v-for="i in 3" :key="'arrow-' + i" class="stage-arrow-wrap">
        <div class="stage-arrow" />
      </div>
    </div>
  </ResumptionSectionCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STAGES } from '@/types/resumption'
import type { ResumptionPlan } from '@/types/resumption'
import ResumptionSectionCard from './ResumptionSectionCard.vue'

const props = defineProps<{
  plans: ResumptionPlan[]
}>()

interface StageStat {
  key: string
  label: string
  count: number
  plans: { id: number; locationName: string }[]
}

const stageData = computed<StageStat[]>(() => {
  return STAGES.map(stage => {
    const plansInStage = props.plans.filter(p => p.status === stage.key)
    return {
      key: stage.key,
      label: stage.label,
      count: plansInStage.length,
      plans: plansInStage.map(p => ({ id: p.id, locationName: p.locationName })),
    }
  })
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.stage-flow {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  height: 100%;
}

/* ===== 阶段卡片 ===== */
.stage-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(4);
  padding: vw(12) vw(8);
  border-radius: 6px;
  background: rgba(15, 43, 91, 0.5);
  border: 1px solid rgba(71, 132, 232, 0.2);
  min-height: vh(80);
  text-align: center;
  transition: border-color 0.3s;

  &.stage-prepare { border-left: 3px solid #86aef0; }
  &.stage-review { border-left: 3px solid #5e93eb; }
  &.stage-trial { border-left: 3px solid #2b60b6; }
  &.stage-production { border-left: 3px solid #204785; }
}

/* 计数 */
.stage-count {
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(24px, calc(32 * var(--min-scale)), 36px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

/* 标签 */
.stage-label {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 14px);
  font-weight: 500;
  color: #89b5ff;
  white-space: nowrap;
}

/* 车间列表 */
.stage-plans {
  display: flex;
  flex-wrap: wrap;
  gap: vw(4);
  justify-content: center;
  margin-top: vh(2);
}

.stage-plan-name {
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: rgba(195, 215, 248, 0.7);
  background: rgba(54, 120, 227, 0.15);
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
  max-width: vw(80);
  overflow: hidden;
  text-overflow: ellipsis;
}

.stage-empty {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  color: rgba(195, 215, 248, 0.3);
}

/* ===== 连接箭头 ===== */
.stage-arrow-wrap {
  flex: 0 0 vw(30);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-arrow {
  width: vw(16);
  height: vw(2);
  background: rgba(54, 120, 227, 0.4);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: -2px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid rgba(54, 120, 227, 0.6);
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
  }
}
</style>
