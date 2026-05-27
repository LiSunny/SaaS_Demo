<template>
  <span class="fi-tag" :class="cssClass">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props { status: string | number }
const props = defineProps<Props>()

const MAP: Record<string, { label: string; cls: string }> = {
  running: { label: '执行中', cls: 'running' },
  pending: { label: '待生效', cls: 'pending' },
  stopped: { label: '已停用', cls: 'stopped' },
  expired: { label: '已过期', cls: 'expired' },
  '0': { label: '待生效', cls: 'pending' },
  '1': { label: '执行中', cls: 'running' },
  '2': { label: '已停用', cls: 'stopped' },
  '3': { label: '已过期', cls: 'expired' },
}

const entry = computed(() => MAP[String(props.status)] || { label: props.status, cls: '' })
const label = computed(() => entry.value.label)
const cssClass = computed(() => entry.value.cls)
</script>

<style scoped>
.fi-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: var(--font-small, 14px);
  font-weight: 400;
  line-height: normal;
  white-space: nowrap;
}
.fi-tag.running { background: var(--success-bg); color: var(--success); }
.fi-tag.pending { background: var(--info-bg); color: var(--accent-primary); }
.fi-tag.stopped { background: var(--danger-bg); color: var(--danger); }
.fi-tag.expired { background: var(--normal-bg); color: var(--normal); }
</style>
