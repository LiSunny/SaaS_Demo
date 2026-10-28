<template>
  <div class="fw-cards">
    <button
      v-for="c in cards"
      :key="c.key"
      type="button"
      class="fw-card"
      :class="`fw-card--${c.tone}`"
      :disabled="!c.points.length"
      :title="c.points.length ? `查看「${c.label}」相关点位（${c.points.length} 个）` : '暂无可下钻的点位'"
      @click="emit('select', c)"
    >
      <span class="fw-card__icon">
        <AppIcon :name="c.icon" />
      </span>
      <div class="fw-card__body">
        <div class="fw-card__label">{{ c.label }}</div>
        <div class="fw-card__value">
          <span class="fw-card__num">{{ c.value }}</span>
          <span v-if="c.unit" class="fw-card__unit">{{ c.unit }}</span>
        </div>
        <div class="fw-card__sub">{{ c.sub }}</div>
        <div v-if="c.normalRange" class="fw-card__range">{{ c.normalRange }}</div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 核心数据卡组
 *
 * 4 张卡的取值规则写在 config/firewater-scene.ts（computeFireWaterCards），
 * 这里的组件只负责呈现与下钻入口，不做任何二次计算。
 */
import AppIcon from '@/components/base/AppIcon.vue'
import type { FireWaterCardValue } from '@/config/firewater-scene'

defineProps<{
  cards: FireWaterCardValue[]
}>()

const emit = defineEmits<{
  /** 点击卡片 → 下钻查看相关点位 */
  select: [card: FireWaterCardValue]
}>()
</script>

<style scoped>
.fw-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: var(--spacing-lg);
}

.fw-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  font: inherit;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.fw-card:not(:disabled) { cursor: pointer; }
.fw-card:not(:disabled):hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .05);
}
.fw-card:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
.fw-card:disabled { cursor: not-allowed; }

.fw-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  font-size: 20px;
  background: var(--accent-primary10);
  color: var(--accent-primary);
}
.fw-card--alarm .fw-card__icon { background: var(--danger-bg); color: var(--danger-text); }
.fw-card--fault .fw-card__icon { background: var(--warning-bg); color: var(--warning-text); }
.fw-card--offline .fw-card__icon { background: var(--normal-bg); color: var(--text-muted); }

.fw-card__body { min-width: 0; flex: 1; }
.fw-card__label {
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.fw-card__value {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-top: 2px;
}
.fw-card__num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.fw-card--alarm .fw-card__num { color: var(--danger-text); }
.fw-card--fault .fw-card__num { color: var(--warning-text); }
.fw-card__unit { font-size: var(--font-xs); color: var(--text-muted); }
.fw-card__sub {
  margin-top: 3px;
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.fw-card__range {
  margin-top: 1px;
  font-size: 10px;
  color: var(--text-tertiary);
}
</style>
