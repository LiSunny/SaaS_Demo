<template>
  <!-- 开关量：枚举状态标签 -->
  <span v-if="metric.kind === 'switch'" class="mc mc--switch">
    <span class="mc__sw" :class="`mc__sw--${stateTone}`">{{ stateLabel }}</span>
  </span>

  <!-- 状态量：状态机 -->
  <span v-else-if="metric.kind === 'status'" class="mc mc--status">
    <PointStatusDot :status="statusOf(value)" size="sm" show-label />
  </span>

  <!-- 模拟量：数值 + 相对量程条 + 阈值标记 -->
  <span v-else class="mc mc--analog" :class="{ 'mc--over': isOverLimit }">
    <span class="mc__num">{{ formatValue }}</span>
    <span v-if="metric.unit" class="mc__unit">{{ metric.unit }}</span>
    <span v-if="showBar && metric.range" class="mc__bar">
      <span class="mc__bar-fill" :style="barStyle" />
      <span
        v-if="metric.lowLimit != null && normLow != null"
        class="mc__bar-mark" :style="{ left: `calc(${normLow * 100}% - 1px)` }"
      />
      <span
        v-if="metric.highLimit != null && normHigh != null"
        class="mc__bar-mark" :style="{ left: `calc(${normHigh * 100}% - 1px)` }"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetricDef, PointStatus } from '@/types/subsystem'
import PointStatusDot from './PointStatusDot.vue'

const props = withDefaults(defineProps<{
  metric: MetricDef
  value: number | string | undefined
  status?: PointStatus
  showBar?: boolean
}>(), {
  status: 'normal',
  showBar: true,
})

const num = computed(() => {
  const v = Number(props.value)
  return Number.isFinite(v) ? v : null
})

const formatValue = computed(() => {
  if (num.value == null) return '--'
  const p = props.metric.precision ?? 2
  return num.value.toFixed(p)
})

/** 归一化到 0~1，用于量程条 */
function normalize(v: number | null): number | null {
  const [min, max] = props.metric.range ?? [0, 1]
  if (v == null || max === min) return null
  return Math.max(0, Math.min(1, (v - min) / (max - min)))
}

const barStyle = computed(() => {
  const n = normalize(num.value)
  if (n == null) return { width: '0%' }
  const [min, max] = props.metric.range ?? [0, 1]
  const lo = props.metric.lowLimit ?? min
  const hi = props.metric.highLimit ?? max
  const over = num.value! > hi || num.value! < lo
  return {
    width: `${n * 100}%`,
    background: over ? 'var(--danger)' : 'var(--success)',
  }
})

const normLow = computed(() => normalize(props.metric.lowLimit ?? null))
const normHigh = computed(() => normalize(props.metric.highLimit ?? null))

const isOverLimit = computed(() => {
  if (num.value == null) return false
  const { highLimit, lowLimit } = props.metric
  if (highLimit != null && num.value >= highLimit) return true
  if (lowLimit != null && num.value <= lowLimit) return true
  return false
})

/** 开关量：查枚举 → tone/label */
const stateTone = computed(() => {
  const st = props.metric.states?.find(s => s.value === props.value)
  return st ? `t-${st.tone}` : 't-unknown'
})
const stateLabel = computed(() => {
  const st = props.metric.states?.find(s => s.value === props.value)
  return st?.label ?? String(props.value ?? '--')
})

/** 状态量：值本身即状态 */
function statusOf(v: number | string | undefined): PointStatus {
  const s = String(v ?? 'normal')
  if (['normal', 'alarm', 'fault', 'offline', 'shielded', 'unknown'].includes(s)) {
    return s as PointStatus
  }
  return 'normal'
}
</script>

<style scoped>
.mc { display: inline-flex; align-items: center; }

.mc--switch { gap: 4px; }
.mc__sw {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 26px; height: 20px; padding: 0 7px;
  border-radius: 4px; font-size: var(--font-xs); font-weight: 500;
  border: 1px solid transparent; white-space: nowrap;
}
.mc__sw--t-normal   { background: var(--success-bg); color: var(--success-text); border-color: rgba(5,150,105,.25); }
.mc__sw--t-alarm    { background: var(--danger-bg);  color: var(--danger-text);  border-color: rgba(220,38,38,.25); }
.mc__sw--t-fault    { background: var(--warning-bg); color: var(--warning-text); border-color: rgba(217,119,6,.25); }
.mc__sw--t-offline  { background: var(--normal-bg);  color: var(--text-muted); border-color: var(--border-default); }
.mc__sw--t-shielded { background: var(--purple-bg);  color: var(--purple-text);  border-color: rgba(139,92,246,.25); }
.mc__sw--t-unknown  { background: var(--normal-bg);  color: var(--text-muted); border-color: var(--border-default); }

.mc--analog { flex-wrap: wrap; gap: 2px 4px; min-width: 0; }
.mc__num {
  font-size: var(--font-small); font-weight: 600; color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.mc--over .mc__num { color: var(--danger-text); }
.mc__unit { font-size: var(--font-xs); color: var(--text-muted); }

.mc__bar {
  display: flex; align-items: center; height: 4px; width: 100%;
  min-width: 48px; background: var(--border-low);
  border-radius: 2px; position: relative; overflow: visible;
  flex-basis: 100%;
}
.mc__bar-fill {
  height: 100%; border-radius: 2px;
  transition: width .4s ease, background .3s ease;
}
.mc__bar-mark {
  position: absolute; top: -1px; width: 1px; height: 6px;
  background: var(--warning); opacity: .9;
}
</style>