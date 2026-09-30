<template>
  <div class="stat-cards-widget">
    <div v-if="cards.length === 0" class="empty-state">暂无统计数据</div>
    <div v-else class="stat-grid">
      <div
        v-for="card in cards"
        :key="card.id"
        class="stat-card"
      >
        <!-- 行 1：图标 46×46 + 右列（标题+数值） -->
        <div class="row-header">
          <span class="stat-icon-wrap" aria-hidden="true">
            <img
              v-if="card.icon"
              :src="`/icons/${card.icon}.svg`"
              class="stat-icon-img"
              :alt="card.title"
            />
            <span v-else class="stat-icon-fallback" />
          </span>
          <div class="header-text">
            <div class="row-title">
              <span class="stat-title">{{ card.title }}</span>
              <img
                src="/icons/widget-stat-attention.svg"
                class="stat-help"
                :title="`${card.title} 详情`"
                :alt="`${card.title} 详情`"
              />
            </div>
            <div class="row-value">
              <span class="stat-value">{{ formatNumber(card.value) }}</span>
              <span v-if="card.unit" class="stat-unit">{{ card.unit }}</span>
            </div>
          </div>
        </div>

        <!-- 行 2：指标行（左右两列） -->
        <div class="row-indicators">
          <div class="indicator">
            <span class="indicator-label">{{ card.primary.label }}</span>
            <img
              :src="trendIconPath(card.primary.trend)"
              class="indicator-arrow"
              :alt="card.primary.trend"
            />
            <span :class="['indicator-trend', `trend-${card.primary.trend}`]">
              {{ formatDelta(card.primary.delta) }}%
            </span>
          </div>
          <div v-if="card.secondary" class="indicator">
            <span class="indicator-label">{{ card.secondary.label }}</span>
            <img
              :src="trendIconPath(card.secondary.trend)"
              class="indicator-arrow"
              :alt="card.secondary.trend"
            />
            <span :class="['indicator-trend', `trend-${card.secondary.trend}`]">
              {{ formatDelta(card.secondary.delta) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 单指标卡片（Figma Frame 5997:12979 单卡 1:1 还原）
// 布局：行 1 = 图标 46×46 + (标题 14px / ⓘ 12 + 数值 24px Bold / 单位 10px)
//      行 2 = 指标 (12 muted + ↗ SVG + 12 success/danger bold)
// 设计稿尺寸：391×116 / padding 12 / border-radius 10 / border #DEDEDE
// 设计稿图标块背景：rgba(54,120,227,0.05)（极浅蓝）
//
// 图标：本次按"100%按设计稿"指令，从 Figma Frame 667 下载
//      - Bookmark（合并 Union 蓝矩形 + Vector 白书签）
//      - Attention（ⓘ 12×12 帮助图标）
//      - TrendingUp / TrendingDown（12×12 趋势箭头 SVG）
import { computed } from 'vue'
import type { StatCard, StatCardsConfig } from './types'
import { statCardsMock } from './_mocks/stat-cards.mock'

defineProps<{
  widgetId: string
  config?: StatCardsConfig
}>()

const cards = computed<StatCard[]>(() => statCardsMock.cards)

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString('zh-CN')
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function formatDelta(d: number): string {
  return d > 0 ? `+${d}` : `${d}`
}

function trendIconPath(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return '/icons/widget-stat-trending-up.svg'
  if (trend === 'down') return '/icons/widget-stat-trending-down.svg'
  // flat 暂复用 up（设计稿只有 up/down 两态）
  return '/icons/widget-stat-trending-up.svg'
}
</script>

<style scoped>
.stat-cards-widget {
  width: 100%;
  height: 100%;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

@media (max-width: 1439px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1023px) {
  .stat-grid { grid-template-columns: 1fr; }
}

/* ===== 单卡（Figma 5997:12979 精确参数） ===== */
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--bg-card, #FFFFFF);
  border: 1px solid #DEDEDE;
  border-radius: 10px;
  box-sizing: border-box;
}

/* 行 1：图标 + 右列 */
.row-header {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.stat-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  background: rgba(54, 120, 227, 0.05); /* 设计稿精确值 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-img {
  width: 26px;   /* 设计稿 Bookmark aspect 26/26 */
  height: 26px;
  display: block;
}
/* null 时的占位 */
.stat-icon-fallback {
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  background: rgba(54, 120, 227, 0.15);
}

.header-text {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 行 1a：标题 + ⓘ */
.row-title {
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
}
.stat-title {
  font-size: 14px;
  color: #5E5E5E; /* 设计稿 --text/muted */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-help {
  width: 12px;
  height: 12px;
  display: block;
  flex-shrink: 0;
  cursor: help;
  opacity: 0.8;
}

/* 行 1b：数值 + 单位（基线对齐） */
.row-value {
  display: flex;
  gap: 8px;
  align-items: baseline; /* baseline 对齐：让数字和单位文字底部基线在一条线上 */
  width: 100%;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #101010);
  line-height: 1;
  letter-spacing: 0.07em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.stat-unit {
  font-size: 14px;
  color: #5E5E5E;
  line-height: 1; /* 与 .stat-value 同 line-height，align-items:baseline 才能精确对齐 */
}

/* 行 2：指标行 */
.row-indicators {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}
.indicator {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  gap: 6px;
  align-items: center;
}
.indicator-label {
  font-size: 12px;
  color: #5E5E5E;
  white-space: nowrap;
}
.indicator-arrow {
  width: 12px;
  height: 12px;
  display: block;
  flex-shrink: 0;
}
.indicator-trend {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.07em;
}
.trend-up   { color: #059669; }  /* 设计稿 --semantic/success */
.trend-down { color: #DC2626; }  /* 设计稿 --semantic/danger */
.trend-flat { color: #5E5E5E; }

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-placeholder);
  font-size: var(--font-small, 14px);
}
</style>
