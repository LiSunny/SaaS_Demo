<template>
  <BigscreenDataPanel
    search-placeholder="搜索商户名称..."
    filter-placeholder="全部等级"
    :filter-options="filterOpts"
    :table-rows="tableRows"
    :page-size="10"
    timeline-title="实时预警动态"
  >
    <!-- ===== 左侧：数据概览 ===== -->
    <template #overview>
      <div class="overview-body">
        <div class="overview-metrics">
          <div class="metric-item">
            <span class="metric-label">今日告警总数</span>
            <div class="metric-value-row">
              <span class="metric-value">35</span>
              <span class="metric-unit">条</span>
            </div>
          </div>
          <div class="metric-divider" />
          <div class="sub-metrics-row">
            <div class="metric-item">
              <span class="metric-label">已处理</span>
              <div class="metric-value-row">
                <span class="metric-value metric-value--alert">28</span>
                <span class="metric-unit">条</span>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">未处理</span>
              <div class="metric-value-row">
                <span class="metric-value metric-value--warning">5</span>
                <span class="metric-unit">条</span>
              </div>
            </div>
            <div class="metric-item">
              <span class="metric-label">累计未处理</span>
              <div class="metric-value-row">
                <span class="metric-value metric-value--warning">7</span>
                <span class="metric-unit">条</span>
              </div>
            </div>
          </div>
        </div>
        <div class="overview-ring">
          <div class="ring-chart-wrapper">
            <v-chart :option="handleRateRingOption" autoresize />
            <div class="ring-center-text">
              <span class="ring-label">今日处理率</span>
              <span class="ring-value">80%</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 左侧：实时预警动态时间轴（三级颜色） ===== -->
    <template #timeline>
      <div class="timeline-list">
        <div v-for="(item, index) in dynamicList" :key="item.id" class="timeline-item">
          <div class="timeline-line">
            <div
              class="timeline-dot"
              :class="item.level === 'high' ? 'timeline-dot--danger' : item.level === 'medium' ? 'timeline-dot--warning' : 'timeline-dot--normal'"
            />
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

    <!-- ===== 右侧：表格列定义（无操作列） ===== -->
    <template #table-columns>
      <el-table-column prop="level" label="告警类型" width="118">
        <template #default="{ row }">
          <span
            class="status-tag"
            :class="row.level === 'high' ? 'status-tag--danger' : row.level === 'medium' ? 'status-tag--warning' : 'status-tag--normal'"
          >
            {{ row.level === 'high' ? '火警' : row.level === 'medium' ? '故障' : '预警' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="alarmDes" label="告警描述" min-width="90" />
      <el-table-column prop="name" label="商户名称" min-width="90" />
      <el-table-column prop="type" label="处理状态" min-width="90" sortable />
      <el-table-column prop="alertTime" label="告警时间" min-width="140" sortable />
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

use([CanvasRenderer, PieChart])

// ===== 筛选选项 =====
const filterOpts = [
  { label: '全部等级', value: '' },
  { label: '火警', value: 'high' },
  { label: '故障', value: 'medium' },
  { label: '预警', value: 'low' },
]

// ===== 环形图 =====
const handleRateRingOption = computed(() => ({
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
      { value: 80, name: '已处理', itemStyle: { color: '#148DFF' } },
      { value: 20, name: '未处理', itemStyle: { color: '#0151A4' } },
    ],
  }],
}))

// ===== 实时预警动态（含三级颜色） =====
interface DynamicTimelineItem {
  id: number
  time: string
  name: string
  action: string
  level: 'high' | 'medium' | 'low'
}

const shopPool = ['盛邦木业', '南湖校区', '江南商贸城', '东北饭庄', '柳州螺蛳粉', '沸腾鱼庄', '湘味土菜馆', '李记烧烤']
const highActionPool = ['触发消防隐患预警', '燃气泄漏预警', '电气线路异常预警']
const mediumActionPool = ['食品安全预警', '证照到期预警', '人员密集预警', '设备故障预警']
const lowActionPool = ['环境卫生预警', '人员流动预警', '投诉举报预警', '天气影响预警']

const dynamicList = ref<DynamicTimelineItem[]>([])

let nextId = 1
function generateTimelineItem(): DynamicTimelineItem {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')

  const rand = Math.random()
  let level: 'high' | 'medium' | 'low'
  let action: string
  if (rand < 0.2) {
    level = 'high'
    action = highActionPool[Math.floor(Math.random() * highActionPool.length)]
  } else if (rand < 0.6) {
    level = 'medium'
    action = mediumActionPool[Math.floor(Math.random() * mediumActionPool.length)]
  } else {
    level = 'low'
    action = lowActionPool[Math.floor(Math.random() * lowActionPool.length)]
  }

  return {
    id: nextId++,
    time: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    name: shopPool[Math.floor(Math.random() * shopPool.length)],
    action,
    level,
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
  { name: '盛邦木业', type: '已处理', alarmDes: '真实火警', alertTime: '2025-10-15 08:30', level: 'high' },
  { name: '南湖校区', type: '已处理', alarmDes: '欠压故障', alertTime: '2025-10-15 09:15', level: 'medium' },
  { name: '江南商贸城', type: '未处理', alarmDes: '燃气泄漏', alertTime: '2025-10-15 10:00', level: 'high' },
  { name: '东北饭庄', type: '未处理', alarmDes: '食品安全问题', alertTime: '2025-10-14 14:20', level: 'low' },
  { name: '柳州螺蛳粉', type: '未处理', alarmDes: '预警', alertTime: '2025-10-14 11:10', level: 'medium' },
  { name: '沸腾鱼庄', type: '未处理', alarmDes: '设备故障', alertTime: '2025-10-14 09:45', level: 'low' },
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
  gap: vw(36);
}

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

/* ===== 实时预警动态（时间轴） ===== */
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

.timeline-dot--warning {
  background: #ffc107;
  box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
}

.timeline-dot--danger {
  background: #ff3a3a;
  box-shadow: 0 0 8px rgba(255, 58, 58, 0.6);
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
</style>
