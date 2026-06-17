<template>
  <div class="alert-center">
    <div class="content-area">
      <!-- ===== 左侧面板 ===== -->
      <div class="left-panel">
      <!-- 告警概览 -->
      <div class="panel-section">
        <div class="section-title">
          <div class="title-bar" />
          <span class="title-text">告警概览</span>
        </div>
        <div class="overview-body">
          <!-- 左侧指标列 -->
          <div class="overview-metrics">
            <!-- 今日告警 -->
            <div class="metric-item">
              <span class="metric-label">今日告警</span>
              <div class="metric-value-row">
                <span class="metric-value">24</span>
                <span class="metric-unit">起</span>
              </div>
            </div>
            <!-- 分隔线 -->
            <div class="metric-divider" />
            <!-- 三列子指标 -->
            <div class="sub-metrics-row">
              <div class="metric-item">
                <span class="metric-label">待处置</span>
                <div class="metric-value-row">
                  <span class="metric-value metric-value--warn">8</span>
                  <span class="metric-unit">起</span>
                </div>
              </div>
              <div class="metric-item">
                <span class="metric-label">处置中</span>
                <div class="metric-value-row">
                  <span class="metric-value">5</span>
                  <span class="metric-unit">起</span>
                </div>
              </div>
              <div class="metric-item">
                <span class="metric-label">已处置</span>
                <div class="metric-value-row">
                  <span class="metric-value metric-value--done">11</span>
                  <span class="metric-unit">起</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 右侧环形图 + 处置率 -->
          <div class="overview-ring">
            <div class="ring-chart-wrapper">
              <v-chart :option="disposalRingOption" autoresize />
              <div class="ring-center-text">
                <span class="ring-rate-text">67%</span>
                <span class="ring-label-text">处置率</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最新告警动态 -->
      <div class="panel-section panel-section--flex">
        <div class="section-title">
          <div class="title-bar" />
          <span class="title-text">最新告警动态</span>
        </div>
        <div class="timeline-list">
          <div v-for="(item, index) in alertTimeline" :key="index" class="timeline-item">
            <!-- 时间轴线和圆点 -->
            <div class="timeline-line">
              <div class="timeline-dot" :class="'timeline-dot--' + item.level" />
              <div v-if="index < alertTimeline.length - 1" class="timeline-connector" />
            </div>
            <!-- 内容 -->
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-time">{{ item.time }}</span>
              </div>
              <div class="timeline-body">
                <span class="timeline-shop">{{ item.shop }}</span>
                <span class="timeline-sep">·</span>
                <span class="timeline-alert">{{ item.alert }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 右侧面板 ===== -->
    <div class="right-panel">
      <!-- 搜索/筛选栏 -->
      <div class="search-bar">
        <div class="search-input">
          <svg class="search-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="#ababab" stroke-width="1.5" />
            <path d="M11 11l3.5 3.5" stroke="#ababab" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span class="search-placeholder">搜索商户名称...</span>
        </div>
        <div class="status-filter">
          <span>全部类型</span>
          <svg class="filter-arrow" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="#f2fbff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="query-btn">查询</div>
      </div>
      <!-- 数据表格 -->
      <div class="table-wrapper">
        <!-- 表头 -->
        <div class="table-header">
          <div class="th th-level">告警级别</div>
          <div class="th th-content">告警内容</div>
          <div class="th th-shop">商户名称</div>
          <div class="th th-time">
            <span>告警时间</span>
            <div class="sort-icons">
              <svg class="sort-arrow sort-arrow--up" viewBox="0 0 12 12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
              <svg class="sort-arrow sort-arrow--down" viewBox="0 0 12 12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
            </div>
          </div>
          <div class="th th-action">操作</div>
        </div>
        <!-- 表体 -->
        <div class="table-body">
          <div v-for="(row, index) in paginatedRows" :key="index" class="table-row">
            <div class="td td-level">
              <span class="level-tag" :class="levelClass(row.level)">{{ row.level }}</span>
            </div>
            <div class="td td-content">{{ row.content }}</div>
            <div class="td td-shop">{{ row.shop }}</div>
            <div class="td td-time">{{ row.time }}</div>
            <div class="td td-action">
              <span class="action-link">处置</span>
            </div>
          </div>
        </div>
      </div>
      <!-- 分页栏 -->
      <div class="pagination">
        <div class="page-info">
          <span class="page-info-label">每页显示</span>
          <div class="page-size-select">
            <span>10 条</span>
            <svg class="page-size-arrow" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="#f2fbff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="page-info-label">共 {{ alertTableData.length }} 条数据</span>
        </div>
        <div class="page-controls">
          <div class="page-btn" :class="{ 'page-btn--disabled': currentPage <= 1 }" @click="prevPage">上一页</div>
          <div
            v-for="p in totalPages"
            :key="p"
            class="page-btn page-btn--num"
            :class="{ 'page-btn--active': p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</div>
          <div class="page-btn" :class="{ 'page-btn--disabled': currentPage >= totalPages }" @click="nextPage">下一页</div>
        </div>
      </div>
    </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

use([CanvasRenderer, PieChart])

// ===== 环形图 =====
const disposalRingOption = computed(() => ({
  series: [
    {
      type: 'pie',
      radius: ['65%', '85%'],
      center: ['50%', '50%'],
      startAngle: 90,
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      emphasis: { disabled: true },
      data: [
        { value: 67, name: '已处置', itemStyle: { color: '#148DFF' } },
        { value: 33, name: '未处置', itemStyle: { color: '#0151A4' } },
      ],
    },
  ],
}))

// ===== 最新告警动态（时间轴） =====
interface AlertTimelineItem {
  time: string
  shop: string
  alert: string
  level: 'danger' | 'warning' | 'normal'
}

const alertTimeline: AlertTimelineItem[] = [
  { time: '2025-10-14 16:45', shop: '沸腾鱼庄', alert: '烟感设备触发火灾报警', level: 'danger' },
  { time: '2025-10-14 16:30', shop: '湘味土菜馆', alert: '燃气浓度超标预警', level: 'danger' },
  { time: '2025-10-14 15:20', shop: '李记烧烤', alert: '电气线路温度过高', level: 'warning' },
  { time: '2025-10-14 14:10', shop: 'XX餐饮店', alert: '消防通道堵塞告警', level: 'warning' },
  { time: '2025-10-14 13:05', shop: '飞越网吧', alert: '烟感设备离线告警', level: 'warning' },
  { time: '2025-10-14 11:45', shop: '老四川火锅城', alert: '烟雾浓度异常预警', level: 'danger' },
  { time: '2025-10-14 10:30', shop: '金冠蛋糕坊', alert: '配电箱温度异常', level: 'normal' },
  { time: '2025-10-14 10:15', shop: '星光台球室', alert: '应急照明设备故障', level: 'normal' },
  { time: '2025-10-14 09:40', shop: '永辉电器维修', alert: '商铺用电负荷过载', level: 'warning' },
  { time: '2025-10-14 09:00', shop: '好邻居超市', alert: '消防栓水压偏低告警', level: 'normal' },
  { time: '2025-10-13 17:30', shop: '顺风货运站', alert: '仓库温感异常报警', level: 'danger' },
  { time: '2025-10-13 16:20', shop: '老味道面馆', alert: '可燃气体泄漏检测', level: 'danger' },
]

// ===== 表格数据 =====
interface AlertTableRow {
  level: string
  content: string
  shop: string
  time: string
}

const alertTableData: AlertTableRow[] = [
  { level: '一级', content: '烟感设备触发火灾报警', shop: '沸腾鱼庄', time: '2025-10-14 16:45' },
  { level: '一级', content: '燃气浓度严重超标', shop: '湘味土菜馆', time: '2025-10-14 16:30' },
  { level: '一级', content: '烟雾浓度异常预警', shop: '老四川火锅城', time: '2025-10-14 11:45' },
  { level: '二级', content: '电气线路温度过高', shop: '李记烧烤', time: '2025-10-14 15:20' },
  { level: '二级', content: '消防通道堵塞告警', shop: 'XX餐饮店', time: '2025-10-14 14:10' },
  { level: '二级', content: '烟感设备离线告警', shop: '飞越网吧', time: '2025-10-14 13:05' },
  { level: '二级', content: '商铺用电负荷过载', shop: '永辉电器维修', time: '2025-10-14 09:40' },
  { level: '三级', content: '配电箱温度异常', shop: '金冠蛋糕坊', time: '2025-10-14 10:30' },
  { level: '三级', content: '应急照明设备故障', shop: '星光台球室', time: '2025-10-14 10:15' },
  { level: '三级', content: '消防栓水压偏低', shop: '好邻居超市', time: '2025-10-14 09:00' },
  { level: '一级', content: '仓库温感异常报警', shop: '顺风货运站', time: '2025-10-13 17:30' },
  { level: '一级', content: '可燃气体泄漏检测', shop: '老味道面馆', time: '2025-10-13 16:20' },
  { level: '二级', content: '灭火器压力不足告警', shop: '李记烧烤', time: '2025-10-13 14:30' },
  { level: '三级', content: '监控摄像头离线', shop: '好旺角餐厅', time: '2025-10-13 11:00' },
  { level: '二级', content: '后厨动火离人告警', shop: '小辣椒火锅', time: '2025-10-13 10:15' },
]

function levelClass(level: string) {
  if (level === '一级') return 'level-tag--danger'
  if (level === '二级') return 'level-tag--warning'
  return 'level-tag--normal'
}

const pageSize = ref(5)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(alertTableData.length / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return alertTableData.slice(start, start + pageSize.value)
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
</script>

<style scoped>
/* ===== 容器 ===== */
.alert-center {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

/* ===== 内容区：左右分栏 ===== */
.content-area {
  flex: 1;
  display: flex;
  gap: 24px;
  min-height: 0;
  overflow: hidden;
}

/* ===== 左侧面板 ===== */
.left-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 12px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
}

.left-panel::-webkit-scrollbar { width: 2px; }
.left-panel::-webkit-scrollbar-track { background: transparent; }
.left-panel::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.2); border-radius: 1px; }

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.panel-section--flex {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 小节标题 */
.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: #2584ab;
  border-radius: 2px;
  box-shadow: 0 0 6px 0 rgba(37, 132, 171, 0.36);
  flex-shrink: 0;
}

.title-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #e6ecfd;
  line-height: normal;
  white-space: nowrap;
}

/* ===== 告警概览 ===== */
.overview-body {
  display: flex;
  align-items: center;
  gap: 46px;
}

.overview-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

/* 指标项 */
.metric-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  flex-shrink: 0;
}

.metric-label {
  font-family: 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #a2acd1;
  line-height: normal;
  white-space: nowrap;
}

.metric-value-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.metric-value {
  font-family: 'Douyin Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: normal;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-value--done {
  background: linear-gradient(to bottom, #56f0f4, #148dff);
  -webkit-background-clip: text;
  background-clip: text;
}

.metric-value--warn {
  background: linear-gradient(to bottom, #ff6b6e, #ff3b3e);
  -webkit-background-clip: text;
  background-clip: text;
}

.metric-unit {
  font-family: 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #fff;
  line-height: normal;
}

/* 分隔线 */
.metric-divider {
  width: 100%;
  height: 0;
  border-top: 1px solid rgba(223, 251, 255, 0.16);
}

/* 三个子指标水平排列 */
.sub-metrics-row {
  display: flex;
  align-items: center;
  gap: 36px;
}

/* ===== 环形图区域 ===== */
.overview-ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ring-chart-wrapper {
  position: relative;
  width: 142px;
  height: 142px;
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
  gap: 4px;
}

.ring-rate-text {
  font-family: 'Douyin Sans', sans-serif;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ring-label-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #f2fbff;
}

/* ===== 最新告警动态（时间轴） ===== */
.timeline-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  padding: 6px 6px 6px 0;
  min-height: 0;
}

.timeline-list::-webkit-scrollbar { width: 2px; }
.timeline-list::-webkit-scrollbar-track { background: transparent; }
.timeline-list::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.2); border-radius: 1px; }

.timeline-item {
  display: flex;
  gap: 12px;
  min-height: 60px;
}

/* 时间轴线 */
.timeline-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 20px;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.timeline-dot--danger {
  background: #ff4e51;
  box-shadow: 0 0 8px rgba(255, 78, 81, 0.6);
}

.timeline-dot--warning {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.timeline-dot--normal {
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.timeline-connector {
  width: 1px;
  flex: 1;
  background: rgba(71, 132, 232, 0.2);
  margin-top: 4px;
}

/* 时间轴内容 */
.timeline-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 14px;
}

.timeline-header {
  display: flex;
  align-items: center;
}

.timeline-time {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #a9b0c5;
  line-height: normal;
}

.timeline-body {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.timeline-shop {
  font-family: 'PingFang SC', sans-serif;
  font-size: 15px;
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
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #a9b0c5;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

/* ===== 搜索/筛选栏 ===== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
}

.search-input {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 203px;
  height: 36px;
  padding: 4px 12px;
  background: rgba(3, 74, 173, 0.5);
  border: 1px solid rgba(0, 184, 219, 0.3);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.search-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-placeholder {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  color: #ababab;
  white-space: nowrap;
}

.status-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  width: 140px;
  padding: 1px 13px;
  background: rgba(3, 74, 173, 0.5);
  border: 1px solid rgba(0, 184, 219, 0.3);
  border-radius: 8px;
  flex-shrink: 0;
}

.status-filter span {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  color: #b8b8b8;
  line-height: 20px;
  white-space: nowrap;
}

.filter-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.query-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 8px 18px;
  background: #0095ff;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

/* ===== 右侧面板 ===== */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* ===== 数据表格 ===== */
.table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: #034aad;
  flex-shrink: 0;
}

.th {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 21px;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #cecece;
  line-height: 21px;
  white-space: nowrap;
}

.th-level { width: 118px; flex-shrink: 0; }
.th-content { flex: 1; min-width: 0; }
.th-shop { flex: 1; min-width: 0; }
.th-time { flex: 1; min-width: 0; }
.th-action { width: 48px; flex-shrink: 0; }

.sort-icons {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 12px;
  height: 20px;
  opacity: 0.4;
  flex-shrink: 0;
}

.sort-arrow {
  width: 12px;
  height: 12px;
}

.sort-arrow--down {
  margin-top: -4px;
}

/* 表体 */
.table-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.table-body::-webkit-scrollbar { width: 2px; }
.table-body::-webkit-scrollbar-track { background: transparent; }
.table-body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.2); border-radius: 1px; }

.table-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
  border-top: 1px solid rgba(223, 251, 255, 0.16);
  flex-shrink: 0;
}

.td {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #f2fbff;
  line-height: 21px;
}

.td-level { width: 118px; flex-shrink: 0; }
.td-content { flex: 1; min-width: 0; justify-content: flex-start; }
.td-shop { flex: 1; min-width: 0; }
.td-time { flex: 1; min-width: 0; }
.td-action { width: 48px; flex-shrink: 0; }

/* 级别标签 */
.level-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  white-space: nowrap;
}

.level-tag--danger {
  background: rgba(254, 151, 151, 0.625);
  color: #ff6b6e;
}

.level-tag--warning {
  background: rgba(255, 180, 0, 0.3);
  color: #ffb400;
}

.level-tag--normal {
  background: rgba(0, 184, 219, 0.3);
  color: #56f0f4;
}

.action-link {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  color: #3cd3d7;
  cursor: pointer;
}

/* ===== 分页栏 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  flex-shrink: 0;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 36px;
}

.page-info-label {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #f2fbff;
  line-height: 21px;
  white-space: nowrap;
}

.page-size-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  width: 82px;
  padding: 1px 13px;
  background: rgba(3, 74, 173, 0.5);
  border: 1px solid rgba(0, 184, 219, 0.3);
  border-radius: 8px;
}

.page-size-select span {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #f2fbff;
  line-height: 20px;
  white-space: nowrap;
}

.page-size-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background: #0165b2;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.page-btn--num {
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(3, 74, 173, 0.5);
  color: #00a4db;
}

.page-btn--active {
  background: rgba(32, 92, 194, 0.56);
  border: 1px solid rgba(0, 184, 219, 0.3);
  color: #00d6ff;
}

.page-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
