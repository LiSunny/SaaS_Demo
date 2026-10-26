<template>
  <div class="ssb">
    <button
      v-for="c in cards"
      :key="c.key"
      type="button"
      class="ssb__card"
      :class="[
        `ssb__card--${c.key}`,
        { 'ssb__card--zero': valueOf(c) === 0 && c.key !== 'total', 'ssb__card--active': active === c.key },
      ]"
      :disabled="valueOf(c) === 0 && c.key !== 'total'"
      :title="valueOf(c) === 0 && c.key !== 'total' ? '当前无该状态点位' : `点击按「${c.label}」筛选`"
      @click="emit('select', c.key)"
    >
      <span class="ssb__icon" :class="`ssb__icon--${c.key}`">
        <AppIcon :name="c.icon || 'chart'" />
      </span>
      <div class="ssb__body">
        <div class="ssb__value">
          <span class="ssb__num">{{ valueOf(c) }}</span>
          <span v-if="c.unit" class="ssb__unit">{{ c.unit }}</span>
        </div>
        <div class="ssb__label">{{ c.label }}</div>
        <div v-if="c.hint" class="ssb__hint">{{ c.hint }}</div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SummaryCardDef } from '@/types/subsystem'
import type { PointStatus } from '@/types/subsystem'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps<{
  cards: SummaryCardDef[]
  statusCount: Record<PointStatus, number>
  total: number
  /** 当前选中的卡片 key（'total' 表示未筛选） */
  active?: string
}>()

const emit = defineEmits<{
  /** 点击汇总卡 → 按该状态筛选页面 */
  select: [key: string]
}>()

function valueOf(c: SummaryCardDef): number {
  if (c.source === 'total') return props.total
  if (c.source === 'statusCount') return props.statusCount[c.key as PointStatus] ?? 0
  return 0
}
</script>

<style scoped>
.ssb {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
}

.ssb__card {
  display: flex; align-items: center; gap: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  font: inherit;
  text-align: left;
  transition: box-shadow .2s ease, border-color .2s ease, background .2s ease;
}
.ssb__card:not(:disabled) { cursor: pointer; }
.ssb__card:not(:disabled):hover { border-color: var(--accent-primary); box-shadow: 0 2px 8px rgba(0,0,0,.05); }
.ssb__card:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
.ssb__card--zero { opacity: .55; }
.ssb__card:disabled { cursor: not-allowed; }
.ssb__card--active {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}

.ssb__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius-md);
  font-size: 20px; flex-shrink: 0;
}
.ssb__icon--total    { background: var(--accent-primary10); color: var(--accent-primary); }
.ssb__icon--normal   { background: var(--success-bg); color: var(--success-text); }
.ssb__icon--alarm    { background: var(--danger-bg);  color: var(--danger-text); }
.ssb__icon--fault    { background: var(--warning-bg); color: var(--warning-text); }
.ssb__icon--offline  { background: var(--normal-bg);  color: var(--text-muted); }

.ssb__body { min-width: 0; }
.ssb__value { display: flex; align-items: baseline; gap: 2px; }
.ssb__num {
  font-size: 26px; font-weight: 700; color: var(--text-primary);
  font-variant-numeric: tabular-nums; line-height: 1.1;
}
.ssb__unit { font-size: var(--font-xs); color: var(--text-muted); }
.ssb__label { font-size: var(--font-xs); color: var(--text-secondary); margin-top: 2px; }
.ssb__hint {
  font-size: 10px; color: var(--text-muted); margin-top: 1px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
</style>
