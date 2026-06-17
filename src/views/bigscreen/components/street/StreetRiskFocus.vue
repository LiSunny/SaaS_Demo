<template>
  <SectionCard title="告警处置中心" subtitle="Alert Center" more-label="更多">
    <div class="risk-focus">
      <!-- 告警处置统计 -->
      <div class="risk-section">
        <div class="alert-stats">
          <div class="alert-stat-item">
            <span class="alert-stat-value">6</span>
            <span class="alert-stat-label">今日告警</span>
          </div>
          <div class="alert-stat-item alert-stat-item--processing">
            <span class="alert-stat-value">2</span>
            <span class="alert-stat-label">处理中</span>
          </div>
          <div class="alert-stat-item alert-stat-item--closed">
            <span class="alert-stat-value">4</span>
            <span class="alert-stat-label">已关闭</span>
          </div>
          <div class="alert-stat-item alert-stat-item--overtime">
            <span class="alert-stat-value">1</span>
            <span class="alert-stat-label">超时未处理</span>
          </div>
        </div>
      </div>

      <!-- 告警分类环形图 -->
      <div class="risk-section">
        <div class="section-title">告警类型分布</div>
        <div class="donut-chart">
          <svg viewBox="0 0 120 120" class="donut-svg">
            <!-- 背景环 -->
            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(71,132,232,0.12)" stroke-width="12" />
            <!-- 烟感 40% -->
            <circle cx="60" cy="60" r="48" fill="none" stroke="#ef4444" stroke-width="12"
              stroke-dasharray="301.6" stroke-dashoffset="0" stroke-linecap="butt"
              transform="rotate(-90 60 60)" />
            <!-- 设备离线 30% -->
            <circle cx="60" cy="60" r="48" fill="none" stroke="#f59e0b" stroke-width="12"
              stroke-dasharray="301.6" stroke-dashoffset="120.6" stroke-linecap="butt"
              transform="rotate(-90 60 60)" />
            <!-- 低电量 20% -->
            <circle cx="60" cy="60" r="48" fill="none" stroke="#3b82f6" stroke-width="12"
              stroke-dasharray="301.6" stroke-dashoffset="211.1" stroke-linecap="butt"
              transform="rotate(-90 60 60)" />
            <!-- 履职逾期 10% -->
            <circle cx="60" cy="60" r="48" fill="none" stroke="#8b5cf6" stroke-width="12"
              stroke-dasharray="301.6" stroke-dashoffset="271.4" stroke-linecap="butt"
              transform="rotate(-90 60 60)" />
            <!-- 中心文字 -->
            <text x="60" y="57" text-anchor="middle" fill="#fff" font-size="18" font-weight="700" font-family="'Douyin Sans'">6</text>
            <text x="60" y="73" text-anchor="middle" fill="#89b5ff" font-size="9">总告警</text>
          </svg>
          <div class="donut-legend">
            <div v-for="item in alertCategories" :key="item.name" class="legend-item">
              <span class="legend-dot" :style="{ background: item.color }" />
              <span class="legend-name">{{ item.name }}</span>
              <span class="legend-pct">{{ item.pct }}%</span>
              <span class="legend-count">({{ item.count }}起)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新告警流 -->
      <div class="risk-section risk-section--grow">
        <div class="section-title">最新告警动态</div>
        <div class="alert-stream">
          <div v-for="(alert, i) in recentAlerts" :key="i" class="alert-stream-item">
            <span class="stream-time">{{ alert.time }}</span>
            <span class="stream-dot" :style="{ background: alert.color }" />
            <span class="stream-text">{{ alert.text }}</span>
            <span class="stream-tag" :class="`tag--${alert.status}`">{{ alert.statusLabel }}</span>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from '../SectionCard.vue'

const alertCategories = [
  { name: '烟感报警', pct: 40, count: 2, color: '#ef4444' },
  { name: '设备离线', pct: 30, count: 2, color: '#f59e0b' },
  { name: '低电量', pct: 20, count: 1, color: '#3b82f6' },
  { name: '履职逾期', pct: 10, count: 1, color: '#8b5cf6' },
]

const recentAlerts = [
  { time: '14:26', text: 'XX餐饮店烟感报警', color: '#ef4444', status: 'unprocessed', statusLabel: '未处理' },
  { time: '14:12', text: 'XX服装店设备离线（30分钟）', color: '#f59e0b', status: 'processing', statusLabel: '处理中' },
  { time: '13:58', text: 'XX超市早班检查逾期未未完成', color: '#8b5cf6', status: 'processing', statusLabel: '处理中' },
  { time: '13:30', text: 'XX奶茶店低电量告警', color: '#3b82f6', status: 'closed', statusLabel: '已关闭' },
  { time: '12:45', text: 'XX五金店设备离线', color: '#f59e0b', status: 'closed', statusLabel: '已关闭' },
]
</script>

<style scoped>
.risk-focus {
  padding: calc(8 * var(--h)) calc(10 * var(--w));
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  overflow: hidden;
}

.risk-section {
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
}

.risk-section--grow {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.section-title {
  font-size: clamp(9px, calc(12 * var(--min-scale)), 15px);
  font-weight: 700;
  color: #89b5ff;
  padding-left: calc(6 * var(--w));
  border-left: 2px solid #3b82f6;
}

/* 告警统计 */
.alert-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(4 * var(--h)) calc(6 * var(--w));
}

.alert-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--h));
  padding: calc(6 * var(--h)) calc(4 * var(--w));
  background: rgba(2, 30, 80, 0.45);
  border: 1px solid rgba(71, 132, 232, 0.2);
  border-radius: 6px;
}

.alert-stat-item--processing {
  border-color: rgba(59, 130, 246, 0.35);
  background: rgba(59, 130, 246, 0.08);
}

.alert-stat-item--closed {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.06);
}

.alert-stat-item--overtime {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.08);
}

.alert-stat-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(24 * var(--min-scale)), 30px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.alert-stat-label {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.7);
  text-align: center;
}

/* 环形图 */
.donut-chart {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
}

.donut-svg {
  width: calc(90 * var(--min-scale));
  height: calc(90 * var(--min-scale));
  flex-shrink: 0;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: calc(4 * var(--w));
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-name {
  flex: 1;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.8);
  white-space: nowrap;
}

.legend-pct {
  font-family: 'Douyin Sans', sans-serif;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  font-weight: 700;
  color: rgba(137, 181, 255, 0.7);
}

.legend-count {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.5);
  white-space: nowrap;
}

/* 告警流 */
.alert-stream {
  display: flex;
  flex-direction: column;
  gap: calc(3 * var(--h));
  overflow-y: auto;
  flex: 1;
}

.alert-stream::-webkit-scrollbar { width: 2px; }
.alert-stream::-webkit-scrollbar-track { background: transparent; }
.alert-stream::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.2); border-radius: 1px; }

.alert-stream-item {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: calc(4 * var(--h)) calc(6 * var(--w));
  background: rgba(2, 20, 50, 0.4);
  border-radius: 4px;
  transition: background 0.2s;
}

.alert-stream-item:hover {
  background: rgba(2, 30, 80, 0.6);
}

.stream-time {
  font-family: 'DingTalk JinBuTi', monospace;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.5);
  flex-shrink: 0;
}

.stream-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stream-text {
  flex: 1;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.stream-tag {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.tag--unprocessed {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.tag--processing {
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tag--closed {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
</style>
