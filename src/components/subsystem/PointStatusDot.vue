<template>
  <span class="psd" :class="`psd--${size}`" :title="statusText">
    <span class="psd__dot" :class="[`psd__dot--${status}`, { 'psd__dot--pulse': status === 'alarm' }]" />
    <span v-if="showLabel" class="psd__label" :class="`psd__label--${status}`">{{ statusText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PointStatus } from '@/types/subsystem'
import { STATUS_LABELS } from './status-labels'

const props = withDefaults(defineProps<{
  status: PointStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}>(), {
  size: 'md',
  showLabel: false,
})

const statusText = computed(() => STATUS_LABELS[props.status] ?? '未知')
</script>

<style scoped>
.psd { display: inline-flex; align-items: center; gap: 6px; }

.psd__dot {
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color .2s ease, box-shadow .2s ease;
}
.psd--sm .psd__dot { width: 7px; height: 7px; }
.psd--md .psd__dot { width: 9px; height: 9px; }
.psd--lg .psd__dot { width: 12px; height: 12px; }

.psd__dot--normal   { background: var(--success); }
.psd__dot--alarm    { background: var(--danger); box-shadow: 0 0 0 3px var(--danger-bg); }
.psd__dot--fault    { background: var(--warning); }
.psd__dot--offline  { background: var(--text-placeholder); }
.psd__dot--shielded { background: var(--purple); }
.psd__dot--unknown  { background: var(--border-high); }

.psd__dot--pulse { animation: psd-pulse 1.4s ease-in-out infinite; }
@keyframes psd-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
  50%      { box-shadow: 0 0 0 5px rgba(220, 38, 38, 0); }
}

.psd__label { font-size: var(--font-xs); line-height: 1; }
.psd__label--normal   { color: var(--success-text); }
.psd__label--alarm    { color: var(--danger-text);  font-weight: 600; }
.psd__label--fault    { color: var(--warning-text); font-weight: 600; }
.psd__label--offline  { color: var(--text-muted); }
.psd__label--shielded { color: var(--purple-text); }
.psd__label--unknown  { color: var(--text-muted); }
</style>