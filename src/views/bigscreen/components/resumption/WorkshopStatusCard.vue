<template>
  <div class="wsc-card" :class="[`wsc-${status}`, { 'wsc-selected': selected }]">
    <!-- 状态标签 -->
    <div class="wsc-tag" :class="`tag-${status}`">
      {{ statusLabel }}
    </div>

    <!-- 主体：信息 + 进度环 -->
    <div class="wsc-body">
      <!-- 左侧信息 -->
      <div class="wsc-info">
        <p class="wsc-name">{{ name }}</p>
        <p class="wsc-meta">{{ leader }} | {{ date }}</p>
      </div>

      <!-- 右侧进度环 -->
      <div class="wsc-ring-wrap">
        <svg class="wsc-ring" viewBox="0 0 46 46">
          <!-- 背景圆 -->
          <circle
            cx="23" cy="23" r="20"
            fill="none"
            stroke="rgba(71, 132, 232, 0.15)"
            stroke-width="4"
          />
          <!-- 进度弧 -->
          <circle
            cx="23" cy="23" r="20"
            fill="none"
            :stroke="progressColor"
            stroke-width="4"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 23 23)"
            class="wsc-ring-progress"
          />
        </svg>
        <span class="wsc-percent">{{ progress }}%</span>
      </div>
    </div>

    <!-- 底部警告/信息栏 -->
    <div v-if="warnings.length" class="wsc-warnings">
      <span class="wsc-warn-icon">⚠</span>
      <span v-for="(w, i) in warnings" :key="i" class="wsc-warn-text">{{ w }}</span>
    </div>
    <div v-else class="wsc-ok">
      <span class="wsc-ok-text">✓ 运行正常</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlanStatus } from '@/types/resumption'

const props = defineProps<{
  name: string
  leader: string
  date: string
  status: PlanStatus
  progress: number
  warnings: string[]
  selected?: boolean
}>()

const statusLabelMap: Record<PlanStatus, string> = {
  prepare: '复工准备中',
  review: '待签发',
  trial: '试产观察中',
  production: '已复产',
}

const statusLabel = computed(() => statusLabelMap[props.status] || props.status)

const radius = 20
const circumference = 2 * Math.PI * radius

const dashOffset = computed(() => {
  return circumference - (props.progress / 100) * circumference
})

const progressColor = computed(() => {
  if (props.progress >= 100) return '#1baf7a'
  if (props.progress >= 50) return '#3678E3'
  return '#eda100'
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.wsc-card {
  display: flex;
  flex-direction: column;
  gap: vh(6);
  height: vh(138);
  padding: vw(12) vw(13);
  background: var(--background\/card, #00336a);
  border: 2px solid transparent;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  width: vw(260);
  transition: border-color 0.2s, background 0.2s, transform 0.2s;

  &:hover {
    border-color: rgba(54, 120, 227, 0.4);
    transform: translateY(-1px);
  }

  &.wsc-selected {
    border-color: #2255b0;
    background: #2255b0;

    .wsc-name { color: #ffffff; }
    .wsc-meta { color: rgba(255, 255, 255, 0.8); }
    .wsc-tag {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.2);
    }
    .wsc-percent { color: #ffffff; }
    .wsc-ok, .wsc-warnings { background: rgba(255, 255, 255, 0.15); }
    .wsc-ok-text { color: rgba(255, 255, 255, 0.85); }
    .wsc-ring-progress {
      stroke: #ffffff;
    }
    /* 进度环背景圈 */
    circle:first-child {
      stroke: rgba(255, 255, 255, 0.2);
    }
  }
}

/* ===== 状态标签 ===== */
.wsc-tag {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: vh(4) vw(8);
  border-radius: 4px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.tag-prepare {
  color: #86aef0;
  background: rgba(134, 174, 240, 0.12);
}

.tag-review {
  color: #5e93eb;
  background: rgba(94, 147, 235, 0.12);
}

.tag-trial {
  color: #eda100;
  background: rgba(237, 161, 0, 0.12);
}

.tag-production {
  color: #1baf7a;
  background: rgba(27, 175, 122, 0.12);
}

/* ===== 主体 ===== */
.wsc-body {
  display: flex;
  align-items: center;
  gap: vw(10);
  flex: 1;
}

/* 左侧信息 */
.wsc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: vh(6);
  min-width: 0;
}

.wsc-name {
  margin: 0;
  font-size: clamp(13px, calc(16 * var(--min-scale)), 18px);
  font-weight: 600;
  color: var(--text\/primary, #edf6ff);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wsc-meta {
  margin: 0;
  font-size: clamp(10px, calc(12 * var(--min-scale)), 13px);
  font-weight: 500;
  color: var(--text\/secondary, #d4eaff);
  line-height: 1.4;
}

/* 右侧进度环 */
.wsc-ring-wrap {
  position: relative;
  width: vw(46);
  height: vw(46);
  flex-shrink: 0;
}

.wsc-ring {
  width: 100%;
  height: 100%;
}

.wsc-ring-progress {
  transition: stroke-dashoffset 0.8s ease;
}

.wsc-percent {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(10px, calc(12 * var(--min-scale)), 13px);
  font-weight: 500;
  color: var(--text\/primary, #edf6ff);
  white-space: nowrap;
}

/* ===== 底部警告 ===== */
.wsc-warnings {
  display: flex;
  align-items: center;
  gap: vw(8);
  padding: vh(5) vw(8) vh(4.5);
  background: rgba(244, 67, 54, 0.12);
  border-radius: 4px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(244, 67, 54, 0.9);
}

.wsc-warn-icon {
  flex-shrink: 0;
}

.wsc-warn-text {
  flex-shrink: 0;

  &:not(:last-child)::after {
    content: '·';
    margin-left: vw(8);
    opacity: 0.4;
  }
}

.wsc-ok {
  display: flex;
  align-items: center;
  padding: vh(5) vw(8) vh(4.5);
  background: rgba(27, 175, 122, 0.1);
  border-radius: 4px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  color: rgba(27, 175, 122, 0.9);
}
</style>
