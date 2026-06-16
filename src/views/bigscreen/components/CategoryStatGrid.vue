<template>
  <div class="category-stat-grid" :style="gridStyle">
    <div
      v-for="(item, index) in items"
      :key="item.name || index"
      class="csg-card"
    >
      <!-- 图标 + 分类名称 -->
      <div class="csg-header">
        <img
          class="csg-icon"
          :src="item.icon"
          :alt="item.name"
        />
        <span class="csg-name">{{ item.name }}</span>
      </div>

      <!-- 数据区 -->
      <div class="csg-body">
        <!-- 履职数量行 -->
        <div class="csg-stats-row">
          <div class="csg-stat csg-stat--done">
            <span class="csg-stat-label">已履职</span>
            <span class="csg-stat-value">
              <span class="csg-stat-num">{{ item.done }}</span>
              <span class="csg-stat-unit">家</span>
            </span>
          </div>
          <div class="csg-stat csg-stat--undone">
            <span class="csg-stat-value csg-stat-value--danger">
              <span class="csg-stat-num">{{ item.undone }}</span>
              <span class="csg-stat-unit">家</span>
            </span>
            <span class="csg-stat-label">未履职</span>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="csg-bar-track">
          <div
            class="csg-bar-fill"
            :style="{ flex: item.done || 1 }"
          />
          <div
            class="csg-bar-rest"
            :style="{ flex: item.undone || 1 }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface CategoryStatItem {
  /** 行业 / 分类名称 */
  name: string
  /** 图标文件路径（相对于 assets 或 public） */
  icon: string
  /** 已履职数量 */
  done: number
  /** 未履职数量 */
  undone: number
}

const props = withDefaults(defineProps<{
  /** 分类数据数组，建议 4 项（2×2 网格） */
  items: CategoryStatItem[]
  /** 栅格列数，默认 2 */
  cols?: number
  /** 卡片间距，默认 6（设计稿 px） */
  gap?: number
}>(), {
  cols: 2,
  gap: 6,
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.cols}, 1fr)`,
  gap: `calc(${props.gap} * var(--min-scale))`,
}))
</script>

<style scoped>
/* ===== 2×2 网格容器 ===== */
.category-stat-grid {
  display: grid;
  width: 100%;
}

/* ===== 单项卡片 ===== */
.csg-card {
  background: rgba(138, 179, 245, 0.05);
  border-radius: calc(8 * var(--min-scale));
  padding: calc(8 * var(--min-scale));
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  min-width: 0;
}

/* ===== 头部：图标 + 名称 ===== */
.csg-header {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
}

/* 等比元素：图标（使用外部图片） */
.csg-icon {
  width: calc(22 * var(--min-scale));
  height: calc(22 * var(--min-scale));
  flex-shrink: 0;
  display: block;
  object-fit: contain;
  background-color: clear;
}

.csg-name {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(15 * var(--min-scale)), 18px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  word-break: break-word;
  line-height: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 数据区 ===== */
.csg-body {
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
}

/* ===== 履职数量行 ===== */
.csg-stats-row {
  display: flex;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  white-space: nowrap;
}

.csg-stat {
  display: flex;
  flex: 1 0 0;
  align-items: center;
  gap: calc(14 * var(--w));
  min-width: 0;
}

/* 标签文字 */
.csg-stat-label {
  font-size: clamp(10px, calc(13 * var(--min-scale)), 16px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
  line-height: normal;
}

/* 数字 + 单位容器 */
.csg-stat-value {
  flex-shrink: 0;
  line-height: 0;
}

/* 数字 */
.csg-stat-num {
  font-size: clamp(12px, calc(15 * var(--min-scale)), 18px);
  font-weight: 500;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

/* 单位 */
.csg-stat-unit {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

/* 未履职：数字变红（Figma: #ff4e51） */
.csg-stat-value--danger .csg-stat-num,
.csg-stat-value--danger .csg-stat-unit {
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: #ff4e51;
  background-clip: unset;
  color: #ff4e51;
}

/* ===== 进度条 ===== */
.csg-bar-track {
  display: flex;
  height: calc(8 * var(--h));
  overflow: hidden;
}

/* 已履职填充段，带负 margin 与剩余段叠加 6px */
.csg-bar-fill {
  height: 100%;
  min-width: 0;
  flex-shrink: 1;
  margin-right: calc(-6 * var(--w));
  position: relative;
  z-index: 1;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(137, 181, 255, 0.6) 50%,
    rgba(71, 132, 232, 0.45) 100%
  );
  border-radius: 0 calc(4 * var(--min-scale)) calc(4 * var(--min-scale)) 0;
}

/* 未履职剩余段 */
.csg-bar-rest {
  height: 100%;
  background: rgba(71, 132, 232, 0.15);
  min-width: 0;
  flex-shrink: 1;
  border-radius: 0 calc(4 * var(--min-scale)) calc(4 * var(--min-scale)) 0;
}
</style>
