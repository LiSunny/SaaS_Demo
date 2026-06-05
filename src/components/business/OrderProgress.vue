<template>
  <div class="order-progress">
    <div class="progress-header">
      <p class="progress-title">流程进度</p>
    </div>

    <div class="progress-steps">
      <template v-for="(step, idx) in displaySteps" :key="step.node.id">
        <!-- 步骤节点 -->
        <div
          class="progress-step"
          :class="[`step-${step.status}`, { 'step-clickable': step.status !== 'pending' }]"
          @click="handleStepClick(step, idx)"
        >
          <div class="step-circle">
            <span class="step-number">{{ idx + 1 }}</span>
          </div>
          <span class="step-name">{{ step.node.name }}</span>
        </div>

        <!-- 步骤间连接线 -->
        <div
          v-if="idx < displaySteps.length - 1"
          class="step-connector"
          :class="`connector-${step.status}`"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrderNode } from '@/types/work-order'
import type { FlowNode } from '@/types/workflow'

const props = withDefaults(defineProps<{
  /** 模板流程定义节点（来自 templateDetail.flowDefinition.nodes） */
  flowNodes?: FlowNode[]
  /** 运行时节点状态（来自 detail.nodes） */
  runtimeNodes?: WorkOrderNode[]
}>(), {
  flowNodes: () => [],
  runtimeNodes: () => [],
})

const emit = defineEmits<{
  select: [node: WorkOrderNode]
}>()

interface DisplayStep {
  node: FlowNode
  runtimeNode: WorkOrderNode | undefined
  status: 'completed' | 'in_progress' | 'pending' | 'skipped'
}

const displaySteps = computed<DisplayStep[]>(() => {
  // 过滤不产生独立步骤的节点类型
  const visibleFlowNodes = props.flowNodes.filter(
    n => n.type !== 'condition' && n.type !== 'external' && n.type !== 'close',
  )

  return visibleFlowNodes.map(fn => {
    const runtimeNode = props.runtimeNodes.find(
      rn => String(rn.id) === String(fn.id) || rn.name === fn.name,
    )
    return {
      node: fn,
      runtimeNode,
      status: runtimeNode?.status || 'pending',
    }
  })
})

function handleStepClick(step: DisplayStep, _idx: number) {
  if (step.runtimeNode && step.status !== 'pending') {
    emit('select', step.runtimeNode)
  }
}
</script>

<style scoped>
.order-progress {
  background: var(--bg-card, #fff);
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--border-default, #e9e9e9);
  padding: var(--spacing-md, 12px);
}

.progress-header {
  margin-bottom: var(--spacing-md, 12px);
}

.progress-title {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
}

/* 步骤容器 */
.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  height: 69px;
}

/* 单个步骤 */
.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.step-clickable {
  cursor: pointer;
}
.step-clickable:hover {
  opacity: 0.8;
}

/* 步骤圆圈 */
.step-circle {
  width: 18px;
  height: 18px;
  border-radius: 13px;
  border: 1px solid var(--text-secondary, #2e2e2e);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-completed .step-circle,
.step-in_progress .step-circle {
  border-color: var(--accent-primary, #3678e3);
}

.step-pending .step-circle {
  border-color: var(--text-secondary, #2e2e2e);
}

.step-skipped .step-circle {
  border-color: var(--text-muted, #5e5e5e);
}

/* 步骤数字 */
.step-number {
  font-family: 'PingFang SC', sans-serif;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.step-completed .step-number,
.step-in_progress .step-number {
  color: var(--accent-primary, #3678e3);
}

.step-pending .step-number {
  color: var(--text-secondary, #2e2e2e);
}

.step-skipped .step-number {
  color: var(--text-muted, #5e5e5e);
}

/* 步骤名称 */
.step-name {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  white-space: nowrap;
}

.step-completed .step-name,
.step-in_progress .step-name {
  color: var(--accent-primary, #3678e3);
}

.step-pending .step-name {
  color: var(--text-secondary, #2e2e2e);
}

.step-skipped .step-name {
  color: var(--text-muted, #5e5e5e);
  text-decoration: line-through;
}

/* 连接线 */
.step-connector {
  width: 36px;
  height: 2px;
  flex-shrink: 0;
  background: var(--border-high, #d9d9d9);
  margin: 0 0;
}

.connector-completed {
  background: var(--accent-primary, #3678e3);
}

.connector-in_progress {
  background: var(--accent-primary10, rgba(54, 120, 227, 0.1));
}

.connector-pending {
  background: var(--border-high, #d9d9d9);
}
</style>
