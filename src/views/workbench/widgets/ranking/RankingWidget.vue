<template>
  <div class="ranking-widget">
    <div v-if="items.length === 0" class="empty-state">暂无排行数据</div>
    <ol v-else class="ranking-list">
      <li
        v-for="item in items"
        :key="item.id"
        :class="['ranking-item', { 'is-top3': item.rank <= 3 }]"
      >
        <span :class="['rank-badge', `rank-${rankAccent(item.rank, item.accent)}`]">
          {{ String(item.rank).padStart(2, '0') }}
        </span>
        <span class="rank-name" :title="item.name">{{ item.name }}</span>
        <div class="rank-bar-wrap">
          <div
            class="rank-bar"
            :style="{ width: clampPercent(item.percent) + '%' }"
          />
        </div>
        <span :class="['rank-percent', { 'is-top3': item.rank <= 3 }]">
          {{ item.percent }}%
        </span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
// 排行榜 widget（5 行）
// 序号徽章 + 名称 + 进度条 + 百分比
// TOP3 徽章颜色：1=danger, 2=warning, 3=success；其余 placeholder
import { computed } from 'vue'
import type { RankItem, RankAccent, RankingConfig } from './types'
import { rankingMock } from './_mocks/ranking.mock'

defineProps<{
  widgetId: string
  config?: RankingConfig
}>()

const items = computed<RankItem[]>(() => rankingMock.items)

function rankAccent(rank: number, override?: RankAccent): RankAccent {
  if (override) return override
  if (rank === 1) return 'danger'
  if (rank === 2) return 'warning'
  if (rank === 3) return 'success'
  return 'placeholder'
}

function clampPercent(p: number): number {
  if (Number.isNaN(p)) return 0
  return Math.max(0, Math.min(100, p))
}
</script>

<style scoped>
.ranking-widget {
  width: 100%;
  height: 100%;
}

.ranking-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: grid;
  grid-template-columns: 32px 1fr 80px 44px;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-radius: var(--radius-sm, 6px);
  transition: background .15s;
}
.ranking-item:hover {
  background: var(--accent-primary10);
}

/* 序号徽章 */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  border-radius: 4px;
  font-size: var(--font-xs, 12px);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-style: italic;
}
.rank-danger      { background: var(--danger-bg);  color: var(--danger); }
.rank-warning     { background: var(--warning-bg); color: var(--warning); }
.rank-success     { background: var(--success-bg); color: var(--success); }
.rank-placeholder { background: var(--border-low, #F3F3F3); color: var(--text-placeholder); }

/* 名称 */
.rank-name {
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 进度条 */
.rank-bar-wrap {
  width: 100%;
  height: 6px;
  background: var(--border-low, #F3F3F3);
  border-radius: 3px;
  overflow: hidden;
}
.rank-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary));
  border-radius: 3px;
  transition: width .3s ease;
}
.ranking-item.is-top3 .rank-bar {
  background: linear-gradient(90deg, var(--accent-primary), var(--purple, #8B5CF6));
}

/* 百分比 */
.rank-percent {
  font-size: var(--font-small, 14px);
  font-weight: 600;
  color: var(--text-secondary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.rank-percent.is-top3 {
  color: var(--accent-primary);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-placeholder);
  font-size: var(--font-small, 14px);
}
</style>