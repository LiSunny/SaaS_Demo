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
  // 工单实例状态（3 状态标准化）
  draft: { label: '草稿', cls: 'info' },
  active: { label: '进行中', cls: 'warning' },
  closed: { label: '已关闭', cls: 'normal' },
  // 优先级
  urgent: { label: '紧急', cls: 'danger' },
  high: { label: '高', cls: 'warning' },
  normal: { label: '普通', cls: 'normal' },
  low: { label: '低', cls: 'info' },
  // 时间线节点状态
  completed: { label: '已完成', cls: 'success' },
  in_progress: { label: '进行中', cls: 'info' },
  node_pending: { label: '待处理', cls: 'normal' },
  skipped: { label: '已跳过', cls: 'normal' },
  // 企业状态
  ent_active: { label: '有效', cls: 'success' },
  ent_locked: { label: '已锁定', cls: 'notice' },
  ent_expired: { label: '已过期', cls: 'danger' },
  ent_deleted: { label: '已删除', cls: 'normal' },
  ent_pending: { label: '待生效', cls: 'info' },
  // 相关方关系角色（v1.1）— 由数据层 roleLabel 字段驱动，StatusTag 不做二次映射
  // 系统角色
  'platform-ops': { label: '运营管理', cls: 'success' },
  'platform-admin': { label: '技术管理', cls: 'purple' },
  'platform-user': { label: '普通用户', cls: 'normal' },
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
.fi-tag.notice { background: var(--notice-bg); color: var(--notice); }
.fi-tag.purple { background: var(--purple-bg, rgba(139, 92, 246, 0.1)); color: var(--purple, #8B5CF6); }
</style>
