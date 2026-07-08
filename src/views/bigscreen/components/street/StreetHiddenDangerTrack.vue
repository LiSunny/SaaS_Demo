<template>
  <BigscreenDataPanel
    search-placeholder="搜索隐患名称..."
    filter-placeholder="全部状态"
    :filter-options="filterOpts"
    :table-rows="tableRows"
    :page-size="10"
    timeline-title="实时动态"
  >
    <!-- ===== 左侧：数据概览 ===== -->
    <template #overview>
      <div class="overview-body">
        <div class="overview-metrics">
          <div class="metric-item">
            <span class="metric-label">今日隐患总数</span>
            <div class="metric-value-row">
              <span class="metric-value">47</span>
              <span class="metric-unit">条</span>
            </div>
          </div>
          <div class="metric-divider" />
          <div class="sub-metrics-row">
            <div class="metric-item">
              <span class="metric-label">已整改</span>
              <div class="metric-value-row">
                <span class="metric-value metric-value--alert">38</span>
                <span class="metric-unit">条</span>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">未整改</span>
              <div class="metric-value-row">
                <span class="metric-value metric-value--warning">6</span>
                <span class="metric-unit">条</span>
              </div>
            </div>
          </div>
        </div>
        <div class="overview-ring">
          <div class="ring-chart-wrapper">
            <v-chart :option="rectifyRateRingOption" autoresize />
            <div class="ring-center-text">
              <span class="ring-label">今日整改率</span>
              <span class="ring-value">81%</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 左侧：整改完成率Top5 ===== -->
    <template #ranking>
      <RankingTop5 title="整改完成率Top5" :items="rankList" />
    </template>

    <!-- ===== 左侧：实时动态时间轴 ===== -->
    <template #timeline>
      <div class="timeline-list">
        <div v-for="(item, index) in dynamicList" :key="item.id" class="timeline-item">
          <div class="timeline-line">
            <div class="timeline-dot timeline-dot--normal" />
            <div v-if="index < dynamicList.length - 1" class="timeline-connector" />
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-time">{{ item.time }}</span>
            </div>
            <div class="timeline-body">
              <span class="timeline-shop">{{ item.name }}</span>
              <span class="timeline-sep">·</span>
              <span class="timeline-alert">{{ item.action }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 右侧：表格列定义 ===== -->
    <template #table-columns>
      <el-table-column prop="status" label="隐患状态" width="118">
        <template #default="{ row }">
          <span
            class="status-tag"
            :class="row.status === 'danger' ? 'status-tag--danger' : row.status === 'warning' ? 'status-tag--warning' : 'status-tag--normal'"
          >
            {{ row.status === 'danger' ? '逾期未改' : row.status === 'warning' ? '未整改' : '已整改' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="隐患名称" min-width="100" />
      <el-table-column prop="shopName" label="商户名称" min-width="90" />
      <el-table-column prop="reportTime" label="上报时间" min-width="140" sortable />
      <el-table-column label="操作" width="48">
        <template #default>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" class="action-icon">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <line x1="7" y1="3" x2="14" y2="3" />
            <line x1="7" y1="8" x2="14" y2="8" />
            <line x1="7" y1="13" x2="11" y2="13" />
          </svg>
        </template>
      </el-table-column>
    </template>
  </BigscreenDataPanel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import BigscreenDataPanel from '../BigscreenDataPanel.vue'
import RankingTop5 from '../RankingTop5.vue'

use([CanvasRenderer, PieChart])

// ===== 筛选选项 =====
const filterOpts = [
  { label: '全部状态', value: '' },
  { label: '已整改', value: 'normal' },
  { label: '未整改', value: 'warning' },
  { label: '逾期未改', value: 'danger' },
]

// ===== 环形图 =====
const rectifyRateRingOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['65%', '85%'],
    center: ['50%', '50%'],
    startAngle: 90,
    silent: true,
    label: { show: false },
    labelLine: { show: false },
    emphasis: { disabled: true },
    data: [
      { value: 81, name: '已整改', itemStyle: { color: '#148DFF' } },
      { value: 19, name: '未整改', itemStyle: { color: '#0151A4' } },
    ],
  }],
}))

// ===== 整改完成率Top5 =====
const rankList = [
  { name: '江南商贸城', rate: 95 },
  { name: '南湖校区', rate: 88 },
  { name: '东北饭庄', rate: 82 },
  { name: '柳州螺蛳粉', rate: 71 },
  { name: '沸腾鱼庄', rate: 55 },
]

// ===== 实时动态 =====
interface DynamicTimelineItem {
  id: number
  time: string
  name: string
  action: string
}

const shopPool = ['盛邦木业', '南湖校区', '江南商贸城', '东北饭庄', '柳州螺蛳粉', '沸腾鱼庄', '湘味土菜馆', '李记烧烤']
const actionPool = ['发现消防隐患并上报', '完成电气隐患整改', '提交隐患复查报告', '逾期隐患督促整改', '新增安全隐患排查', '更新隐患台账', '完成安全专项检查']

const dynamicList = ref<DynamicTimelineItem[]>([])

let nextId = 1
function generateTimelineItem(): DynamicTimelineItem {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    id: nextId++,
    time: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    name: shopPool[Math.floor(Math.random() * shopPool.length)],
    action: actionPool[Math.floor(Math.random() * actionPool.length)],
  }
}

function initTimeline() {
  dynamicList.value = Array.from({ length: 6 }, () => generateTimelineItem())
}

let timelineTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  initTimeline()
  function scheduleNext() {
    const delay = 4000 + Math.random() * 4000
    timelineTimer = setTimeout(() => {
      dynamicList.value.unshift(generateTimelineItem())
      if (dynamicList.value.length > 50) dynamicList.value.length = 50
      scheduleNext()
    }, delay)
  }
  scheduleNext()
})

onBeforeUnmount(() => {
  if (timelineTimer) { clearTimeout(timelineTimer); timelineTimer = null }
})

// ===== 表格数据 =====
const tableRows = [
  { name: '消防通道堵塞', shopName: '盛邦木业', reportTime: '2025-10-15 08:30', status: 'warning' },
  { name: '电线裸露老化', shopName: '南湖校区', reportTime: '2025-10-15 09:15', status: 'warning' },
  { name: '燃气阀门泄漏', shopName: '江南商贸城', reportTime: '2025-10-15 10:00', status: 'warning' },
  { name: '仓库结构裂缝', shopName: '东北饭庄', reportTime: '2025-10-14 14:20', status: 'warning' },
  { name: '灭火器过期未检', shopName: '柳州螺蛳粉', reportTime: '2025-10-14 11:10', status: 'normal' },
  { name: '安全出口标识损坏', shopName: '沸腾鱼庄', reportTime: '2025-10-14 09:45', status: 'normal' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 数据概览 ===== */
.overview-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  overflow: hidden;
}

.overview-metrics {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  flex: 1;
  min-width: 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: vh(6);
  align-items: flex-start;
  flex-shrink: 0;
}

.metric-label {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #b5d3ff;
  line-height: normal;
  white-space: nowrap;
}

.metric-value-row {
  display: flex;
  align-items: flex-end;
  gap: vw(8);
  line-height: 0;
}

.metric-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(24px, calc(26 * var(--min-scale)), 28px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

.metric-value--warning {
  background: linear-gradient(to bottom, #ffffff, #ff3a3a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-value--alert {
  background: linear-gradient(to bottom, #93c5fd, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-unit {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #b3c5f9;
  line-height: normal;
}

.metric-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    79.92deg,
    rgba(15, 43, 91, 0) 0%,
    rgb(25, 82, 170) 0%,
    rgba(22, 70, 145, 0.688) 75%,
    rgba(15, 43, 91, 0) 100%
  );
}

.sub-metrics-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sub-metrics-row .metric-item { flex: 1; }

/* ===== 环形图 ===== */
.overview-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: vh(8);
  flex-shrink: 0;
}

.ring-chart-wrapper {
  position: relative;
  width: calc(142 * var(--min-scale));
  height: calc(142 * var(--min-scale));
  flex-shrink: 0;
}

.ring-chart-wrapper :deep(.echarts) {
  width: 100% !important;
  height: 100% !important;
}

.ring-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  gap: vh(4);
}

.ring-label {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(15 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f2fbff;
  line-height: normal;
  white-space: nowrap;
}

.ring-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

/* ===== 实时动态（时间轴） ===== */
.timeline-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  padding: vh(6) vw(6) vh(6) 0;
  min-height: 0;

  &::-webkit-scrollbar { width: 2px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.2); border-radius: 1px; }
}

.timeline-item {
  display: flex;
  gap: vw(12);
  min-height: vh(60);
}

.timeline-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: vw(20);
}

.timeline-dot {
  width: calc(10 * var(--min-scale));
  height: calc(10 * var(--min-scale));
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: vh(6);
}

.timeline-dot--normal {
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.timeline-connector {
  width: 1px;
  flex: 1;
  background: rgba(71, 132, 232, 0.2);
  margin-top: vh(4);
}

.timeline-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
  padding-bottom: vh(14);
}

.timeline-header {
  display: flex;
  align-items: center;
}

.timeline-time {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #a9b0c5;
  line-height: normal;
}

.timeline-body {
  display: flex;
  align-items: center;
  gap: vw(6);
  flex-wrap: wrap;
}

.timeline-shop {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(15 * var(--min-scale)), 16px);
  font-weight: 500;
  color: #d6e3ff;
  line-height: normal;
  white-space: nowrap;
}

.timeline-sep {
  color: #a9b0c5;
  font-size: 12px;
}

.timeline-alert {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 15px);
  font-weight: 400;
  color: #a9b0c5;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

/* ===== 状态标签 ===== */
.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: vh(2) vw(6);
  border-radius: 4px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  white-space: nowrap;
}

.status-tag--danger {
  background: rgba(255, 58, 58, 0.2);
  color: #ff3a3a;
}

.status-tag--warning {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.status-tag--normal {
  background: rgba(0, 84, 219, 0.2);
  color: #0072ff;
}

/* ===== 操作图标 ===== */
.action-icon {
  color: rgba(137, 181, 255, 0.6);
  cursor: pointer;
  flex-shrink: 0;

  &:hover { color: #3cd3d7; }
}
</style>
