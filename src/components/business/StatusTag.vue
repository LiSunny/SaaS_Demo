<template>
  <span class="fi-tag" :class="cssClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props { status: string | number; label?: string }
const props = defineProps<Props>()

const MAP: Record<string, { label: string; cls: string }> = {
  // 模板状态
  running: { label: '执行中', cls: 'success' },
  pending: { label: '待生效', cls: 'info' },
  stopped: { label: '已停用', cls: 'danger' },
  expired: { label: '已过期', cls: 'normal' },
  '0': { label: '待生效', cls: 'info' },
  '1': { label: '执行中', cls: 'success' },
  '2': { label: '已停用', cls: 'danger' },
  '3': { label: '已过期', cls: 'normal' },
  // 工单实例状态
  draft: { label: '草稿', cls: 'info' },
  pending_assign: { label: '待指派', cls: 'info' },
  pending_accept: { label: '待接单', cls: 'warning' },
  processing: { label: '处置中', cls: 'warning' },
  verifying: { label: '验收中', cls: 'warning' },
  closed: { label: '已关闭', cls: 'normal' },
  // 优先级
  urgent: { label: '紧急', cls: 'danger' },
  normal: { label: '普通', cls: 'warning' },
  low: { label: '低优', cls: 'info' },
  // 时间线节点状态
  completed: { label: '已完成', cls: 'success' },
  in_progress: { label: '进行中', cls: 'info' },
  node_pending: { label: '待处理', cls: 'normal' },
}

const entry = computed(() => MAP[String(props.status)] || { label: props.status, cls: '' })
const label = computed(() => props.label || entry.value.label)
const cssClass = computed(() => entry.value.cls)
</script>

<style scoped>
.fi-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs, 4px) var(--spacing-lg, 12px);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  font-weight: 400;
  line-height: normal;
  white-space: nowrap;
}
.fi-tag.success { background: var(--success-bg); color: var(--success); }
.fi-tag.info { background: var(--info-bg); color: var(--accent-primary); }
.fi-tag.warning { background: var(--warning-bg); color: var(--warning); }
.fi-tag.danger { background: var(--danger-bg); color: var(--danger); }
.fi-tag.normal { background: var(--normal-bg); color: var(--normal); }
</style>
