<template>
  <div class="fw-cards">
    <button
      v-for="c in cards"
      :key="c.key"
      type="button"
      class="fw-card"
      :title="c.hint"
      @click="emit('select', c)"
    >
      <!-- 上半：图标 + 指标名/主值 + 环形图 -->
      <div class="fw-card__head">
        <div class="fw-card__lead">
          <span class="fw-card__icon">
            <img class="fw-card__icon-img" :src="c.icon" :alt="c.label" />
          </span>
          <div class="fw-card__meta">
            <div class="fw-card__label">
              {{ c.label }}
              <AppIcon name="error-circle" size="12" class="fw-card__label-mark" />
            </div>
            <div class="fw-card__value">
              <span class="fw-card__num">{{ c.value }}</span>
              <span class="fw-card__unit">{{ c.unit }}</span>
            </div>
          </div>
        </div>
        <FireWaterKpiRing :segments="c.legend" :total="c.total" />
      </div>

      <!-- 下半：分项图例（计数与环形图分段同源） -->
      <div class="fw-card__legend">
        <span v-for="item in c.legend" :key="item.label" class="fw-card__legend-item">
          <span class="fw-card__legend-key">
            <i class="fw-card__legend-chip" :style="{ background: item.color }" />
            {{ item.label }}
          </span>
          <b class="fw-card__legend-value">{{ item.value }}</b>
        </span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 顶部统计卡组（4 张）
 *
 * 口径写在 config/firewater-scene.ts（computeFireWaterCards），
 * 本组件只负责呈现与下钻入口，不做任何二次计算。
 *
 * 版式取自设计稿：图标 + 指标名/主值 + 环形图，下方一条分项图例。
 */
import AppIcon from '@/components/base/AppIcon.vue'
import FireWaterKpiRing from '@/components/subsystem/FireWaterKpiRing.vue'
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.fw-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  font: inherit;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid #dedede;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.fw-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .05);
}
.fw-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* 上半 */
.fw-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.fw-card__lead {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.fw-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
/* 设计稿导出的 SVG 自带底色与圆角，不再叠背景 */
.fw-card__icon-img {
  width: 48px;
  height: 48px;
  display: block;
}
.fw-card__meta {
  min-width: 0;
}
.fw-card__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-muted);
  white-space: nowrap;
}
.fw-card__label-mark {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.fw-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
}
.fw-card__num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.fw-card__unit {
  font-size: 10px;
  color: var(--text-primary);
}

/* 下半：分项图例 */
.fw-card__legend {
  display: flex;
  align-items: center;
  gap: 16px;
}
.fw-card__legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: 10px;
  color: var(--text-muted);
}
.fw-card__legend-key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.fw-card__legend-chip {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.fw-card__legend-value {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
</style>
