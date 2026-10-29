<template>
  <div class="sm-cards">
    <button
      v-for="c in cards"
      :key="c.key"
      type="button"
      class="sm-card"
      :title="c.hint"
      @click="emit('select', c)"
    >
      <!-- 上半：图标 + 指标名/主值 + 环形图 -->
      <div class="sm-card__head">
        <div class="sm-card__lead">
          <span class="sm-card__icon">
            <img class="sm-card__icon-img" :src="c.icon" :alt="c.label" />
          </span>
          <div class="sm-card__meta">
            <div class="sm-card__label">
              {{ c.label }}
              <AppIcon name="error-circle" size="12" class="sm-card__label-mark" />
            </div>
            <div class="sm-card__value">
              <span class="sm-card__num">{{ c.value }}</span>
              <span class="sm-card__unit">{{ c.unit }}</span>
            </div>
          </div>
        </div>
        <SubsystemKpiRing :segments="c.legend" :total="c.total" />
      </div>

      <!-- 下半：分项图例（计数与环形图分段同源） -->
      <div class="sm-card__legend">
        <span v-for="item in c.legend" :key="item.label" class="sm-card__legend-item">
          <span class="sm-card__legend-key">
            <i class="sm-card__legend-chip" :style="{ background: item.color }" />
            {{ item.label }}
          </span>
          <b class="sm-card__legend-value">{{ item.value }}</b>
        </span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 顶部统计卡组（4 张）
 *
 * 口径写在 config/subsystem-cards.ts（三系统共用），
 * 本组件只负责呈现与下钻入口，不做任何二次计算。
 *
 * 版式取自设计稿：图标 + 指标名/主值 + 环形图，下方一条分项图例。
 */
import AppIcon from '@/components/base/AppIcon.vue'
import SubsystemKpiRing from '@/components/subsystem/SubsystemKpiRing.vue'
import type { SubsystemCardValue } from '@/types/subsystem-scene'

defineProps<{
  cards: SubsystemCardValue[]
}>()

const emit = defineEmits<{
  /** 点击卡片 → 下钻查看相关点位 */
  select: [card: SubsystemCardValue]
}>()
</script>

<style scoped>
.sm-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.sm-card {
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
.sm-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .05);
}
.sm-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* 上半 */
.sm-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
.sm-card__lead {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.sm-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
/* 设计稿导出的 SVG 自带底色与圆角，不再叠背景 */
.sm-card__icon-img {
  width: 48px;
  height: 48px;
  display: block;
}
.sm-card__meta {
  min-width: 0;
}
.sm-card__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-muted);
  white-space: nowrap;
}
.sm-card__label-mark {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.sm-card__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 2px;
}
.sm-card__num {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.sm-card__unit {
  font-size: 10px;
  color: var(--text-primary);
}

/* 下半：分项图例 */
.sm-card__legend {
  display: flex;
  align-items: center;
  gap: 16px;
}
.sm-card__legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1;
  min-width: 0;
  font-size: 10px;
  color: var(--text-muted);
}
.sm-card__legend-key {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.sm-card__legend-chip {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.sm-card__legend-value {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
</style>
