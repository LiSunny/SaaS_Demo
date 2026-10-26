<template>
  <button
    class="pr"
    :class="[`pr--${status}`, { 'pr--abnormal': isAbnormal }]"
    :title="`${point.code} · ${point.location}`"
    @click="emit('open', point)"
  >
    <span class="pr__line1">
      <!-- 异常必须出文字：颜色之外还要有词，投屏/色弱场景才读得出 -->
      <PointStatusDot :status="status" size="sm" :show-label="isAbnormal" />
      <span class="pr__code">{{ point.code }}</span>
      <span v-if="primaryMetric" class="pr__value">
        <MetricCell
          :metric="primaryMetric"
          :value="runtime?.values?.[primaryMetric.key]"
          :status="status"
          :show-bar="false"
        />
      </span>
    </span>

    <span class="pr__line2">
      <span class="pr__loc">{{ shortLoc || '—' }}</span>
      <span class="pr__time">{{ timeText }}</span>
    </span>

    <!-- 异常原因直达：不点开抽屉也知道超了哪条限 -->
    <span v-if="alarmReason" class="pr__reason">{{ alarmReason }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PointDef, PointRuntime, MetricDef } from '@/types/subsystem'
import PointStatusDot from './PointStatusDot.vue'
import MetricCell from './MetricCell.vue'
import { alarmReasonText } from './alarm-reason'
import { isAbnormalStatus } from './status-labels'

const props = defineProps<{
  point: PointDef
  runtime?: PointRuntime
}>()

const emit = defineEmits<{
  /** 点击行 → 打开点位详情抽屉 */
  open: [p: PointDef]
}>()

const status = computed(() => props.runtime?.status ?? 'unknown')
const isAbnormal = computed(() => isAbnormalStatus(status.value))

const alarmReason = computed(() => alarmReasonText(props.point, props.runtime))

/**
 * 主测点：优先模拟量（压力/水位/流量——值守最常看的数），
 * 其次开关量（阀门开/关），状态量不重复展示（左侧状态点已经表达）。
 */
const primaryMetric = computed<MetricDef | undefined>(() => {
  const ms = props.point.metrics
  return ms.find(m => m.kind === 'analog') ?? ms.find(m => m.kind === 'switch')
})

/** 位置压缩：完整位置是 "A 区教学楼 3 层"，这里保留区域 + 楼层 */
const shortLoc = computed(() => {
  let loc = (props.point.location ?? '').trim()
  if (!loc) return ''
  const floor = loc.match(/^(.*?)(\d+)\s*层$/)
  if (floor) return `${floor[1].replace(/\s+/g, '')} ${floor[2]}层`
  return loc.replace(/^([A-Z])\s+/, '$1')
})

/** 数据更新时间：值守判断数据是否可信就看这个 */
const timeText = computed(() => {
  const ts = props.runtime?.updatedAt
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':')
})
</script>

<style scoped>
.pr {
  display: flex; flex-direction: column; gap: 3px; width: 100%;
  flex-shrink: 0;
  padding: 7px 9px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  font: inherit; text-align: left;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease;
}
.pr:hover { border-color: var(--accent-primary); background: var(--accent-primary10); }
.pr:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 1px; }

.pr--abnormal { border-color: var(--danger); background: var(--danger-bg); }
.pr--abnormal.pr--fault { border-color: var(--warning); background: var(--warning-bg); }

.pr__line1 { display: flex; align-items: center; gap: 7px; min-width: 0; }
.pr__code {
  font-size: var(--font-xs); font-weight: 600; color: var(--text-primary);
  font-variant-numeric: tabular-nums; flex-shrink: 0;
}
.pr__value { margin-left: auto; flex-shrink: 0; }

.pr__line2 { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.pr__loc {
  font-size: var(--font-xs); color: var(--text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.pr__time {
  margin-left: auto; flex-shrink: 0;
  font-size: var(--font-xs); color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.pr__reason {
  font-size: var(--font-xs); color: var(--danger-text); font-weight: 500;
  line-height: 1.5;
}
</style>
