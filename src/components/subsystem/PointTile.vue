<template>
  <div class="pt" :class="[`pt--${status}`, { 'pt--clickable': !!onSelect }]" @click="onSelect?.(point)">
    <!-- 异常必须出文字：瓦片窄，颜色之外还要有词，投屏/色弱场景才读得出 -->
    <PointStatusDot :status="status" size="sm" :show-label="isAbnormal" />
    <span class="pt__code">{{ point.code }}</span>
    <span v-if="primaryState && showSwitchState" class="pt__state" :class="`pt__state--${primaryTone}`">{{ primaryState }}</span>
    <span class="pt__loc" :title="point.location">{{ shortLoc }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PointDef, PointRuntime } from '@/types/subsystem'
import PointStatusDot from './PointStatusDot.vue'
import { STATUS_LABELS, isAbnormalStatus } from './status-labels'

const props = defineProps<{
  point: PointDef
  runtime?: PointRuntime
  onSelect?: (p: PointDef) => void
}>()

const status = computed(() => props.runtime?.status ?? 'unknown')
const isAbnormal = computed(() => isAbnormalStatus(status.value))

/** 主开关量状态（阀门开/关、试水装置启停） */
const primary = computed(() => {
  const m = props.point.metrics.find(x => x.kind === 'switch')
  if (!m) return null
  const v = props.runtime?.values?.[m.key]
  const st = m.states?.find(s => s.value === v)
  return st ?? null
})
const primaryState = computed(() => primary.value?.label ?? '')
const primaryTone = computed(() => `t-${primary.value?.tone ?? 'unknown'}`)

/** 状态词与开关量词重复时（如开关量本身就是"故障"）不重复渲染 */
const showSwitchState = computed(() => {
  if (!isAbnormal.value) return true
  return primaryState.value !== STATUS_LABELS[status.value]
})

/**
 * 位置压缩：完整位置是 "A 区教学楼 3 层"。
 * 原实现取 split(' ').pop() → 只剩 "层"，791 个阀门位置全变成同一个字，等于没有位置。
 * 现在保留区域 + 楼层："A区教学楼 3层"，过长时由 CSS 省略号截断，title 保留全文。
 */
const shortLoc = computed(() => {
  let loc = (props.point.location ?? '').trim()
  if (!loc) return ''
  const floor = loc.match(/^(.*?)(\d+)\s*层$/)
  if (floor) {
    loc = `${floor[1].replace(/\s+/g, '')} ${floor[2]}层`
  } else {
    loc = loc.replace(/^([A-Z])\s+/, '$1')
  }
  return loc
})
</script>

<style scoped>
.pt {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  font-size: var(--font-xs);
  white-space: nowrap;
  overflow: hidden;
  transition: border-color .2s ease, background .2s ease;
}
.pt--clickable { cursor: pointer; }
.pt--clickable:hover { border-color: var(--accent-primary); }

.pt--alarm  { border-color: var(--danger);  background: var(--danger-bg); }
.pt--fault  { border-color: var(--warning); background: var(--warning-bg); }
.pt--offline{ opacity: .55; }

.pt__code {
  font-variant-numeric: tabular-nums; color: var(--text-secondary);
  font-weight: 500; flex-shrink: 0;
}
.pt__state {
  padding: 1px 5px; border-radius: 3px; font-weight: 600; flex-shrink: 0;
}
.pt__state--t-normal { background: var(--success-bg); color: var(--success-text); }
.pt__state--t-alarm  { background: var(--danger-bg);  color: var(--danger-text); }
.pt__state--t-fault  { background: var(--warning-bg); color: var(--warning-text); }
.pt__state--t-offline{ background: var(--normal-bg);  color: var(--text-muted); }
.pt__state--t-unknown{ background: var(--normal-bg);  color: var(--text-muted); }

.pt__loc {
  color: var(--text-muted); overflow: hidden; text-overflow: ellipsis;
  margin-left: auto; min-width: 0;
}
</style>
