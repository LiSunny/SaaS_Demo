<template>
  <div class="realtime-alerts-widget">
    <!-- 告警列表（WidgetCard 已提供标题"实时警情"+ 外框） -->
    <div v-if="displayList.length === 0" class="empty-state">暂无告警</div>
    <ul v-else class="alerts-list">
      <li
        v-for="alert in displayList"
        :key="alert.id"
        :class="['alert-item', { 'clickable': !!alert.link }]"
        @click="onAlertClick(alert)"
      >
        <!--
          icon 块：48×48 圆角方块，背景色按 level 区分
          - critical  → 浅红 rgba(220,38,38,0.1) + 红色 Caution 三角
          - warning   → 浅橙 rgba(217,119,6,0.1) + 橙色 Caution 三角
          - info      → 浅蓝 accent-primary10     + 蓝色 Caution 三角（mask 改色）
        -->
        <span :class="['alert-icon', `level-${alert.level}`]" aria-hidden="true">
          <img
            v-if="alert.level === 'critical'"
            src="/icons/widget-alert-caution.svg"
            class="alert-icon-img"
            alt="critical"
          />
          <img
            v-else-if="alert.level === 'warning'"
            src="/icons/widget-alert-caution-warning.svg"
            class="alert-icon-img"
            alt="warning"
          />
          <span
            v-else
            class="alert-icon-img alert-icon-img-info"
            aria-hidden="true"
          />
        </span>

        <!-- 文字区：标题 + 位置 -->
        <div class="alert-body">
          <div class="alert-title">{{ alert.title }}</div>
          <div v-if="alert.location" class="alert-location">{{ alert.location }}</div>
        </div>

        <!-- 时间戳 -->
        <span class="alert-time">{{ alert.timestamp }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// 实时告警 widget（列表型）
// 设计稿：Figma Frame 660 · 实时警情
//
// 整体结构（精确值）：
//   外层卡片（由 WidgetCard 提供，不在本 widget 重复）：
//     bg white / border 1px #DEDEDE / radius 10px / padding 12px 16px
//     标题"实时警情"（来自 widgetLabels['realtime-alerts']）
//   列表（gap 12px）
//   单条告警：
//     bg white / border 1px #F3F4F8 / radius 8px / padding 8px
//     row gap 10px（icon ↔ 文字）
//     icon 块 48×48 radius 8px
//       critical rgba(220,38,38,0.1)   + 红三角 #DC2626
//       warning  rgba(217,119,6,0.1)   + 橙三角 #D97706
//       info     var(--accent-primary10) + 蓝三角（复用 red SVG via mask）
//     文字区 flex:1, gap 6px, py 4px
//       title 14px #333 Medium / 单行省略
//       location 12px #666 Regular / 单行省略
//     时间戳 14px #666 Regular 居中
//
// 图标：本次按"100%按设计稿"指令，从 Figma Frame 660 下载
//      Caution SVG 24×24（圆形三角形警告图标）
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { AlertItem, RealtimeAlertsConfig } from './types'
import { realtimeAlertsMock } from './_mocks/realtime-alerts.mock'

defineProps<{
  widgetId: string
  config?: RealtimeAlertsConfig
}>()

const router = useRouter()

const displayList = computed<AlertItem[]>(() => {
  const limit = realtimeAlertsMock.limit ?? 5
  return realtimeAlertsMock.alerts.slice(0, limit)
})

function onAlertClick(alert: AlertItem) {
  if (!alert.link) return
  router.push(alert.link)
}
</script>

<style scoped>
/* ============================================
   实时警情 widget body（Figma Frame 660 精确还原）
   外层卡片和标题由 WidgetCard 提供，本组件只负责列表内容。
   ============================================ */
.realtime-alerts-widget {
  width: 100%;
}

/* 列表容器（gap 12px） */
.alerts-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* 单条告警卡片 */
.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #FFFFFF;
  border: 1px solid #F3F4F8;
  border-radius: 8px;
  cursor: default;
  transition: background .15s;
  box-sizing: border-box;
}
.alert-item.clickable {
  cursor: pointer;
}
.alert-item.clickable:hover {
  background: var(--accent-primary10, rgba(54, 120, 227, 0.06));
}

/* icon 容器 48×48 radius 8px（背景按级别） */
.alert-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  flex-shrink: 0;
}
.alert-icon.level-critical {
  background: rgba(220, 38, 38, 0.1); /* 设计稿 --semantic/danger-bg */
}
.alert-icon.level-warning {
  background: rgba(217, 119, 6, 0.1); /* 设计稿 --semantic/warning-bg */
}
.alert-icon.level-info {
  background: var(--accent-primary10, rgba(54, 120, 227, 0.1));
}

/* Caution SVG 24×24 居中 */
.alert-icon-img {
  width: 24px;
  height: 24px;
  display: block;
}
/* info 级别复用红三角 SVG，通过 mask 改色为蓝（保持图标形状一致） */
.alert-icon-img-info {
  background-color: var(--accent-primary, #3678E3);
  -webkit-mask: url(/icons/widget-alert-caution.svg) no-repeat center / contain;
  mask: url(/icons/widget-alert-caution.svg) no-repeat center / contain;
}

/* 文字区 flex:1 */
.alert-body {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}
.alert-title {
  font-size: 14px;
  font-weight: 500; /* Medium */
  color: #333;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.alert-location {
  font-size: 12px;
  font-weight: 400; /* Regular */
  color: #666;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 时间戳 14px #666 Regular 居中 */
.alert-time {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
  color: #666;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--text-placeholder, #999);
  font-size: 14px;
}
</style>