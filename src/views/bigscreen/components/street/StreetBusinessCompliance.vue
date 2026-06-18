<template>
  <div class="business-compliance">
      <!-- ===== 左右分栏 ===== -->
      <div class="content-area">
        <!-- ===== 左侧面板 ===== -->
        <div class="left-panel">
          <!-- 履职概览 -->
          <div class="panel-section">
            <div class="section-title">
              <div class="title-bar" />
              <span class="title-text">履职概览</span>
            </div>
            <div class="overview-body">
              <!-- 左侧指标列 -->
              <div class="overview-metrics">
                <!-- 今日应完成任务 -->
                <div class="metric-item">
                  <span class="metric-label">今日应完成任务</span>
                  <div class="metric-value-row">
                    <span class="metric-value">68</span>
                    <span class="metric-unit">项</span>
                  </div>
                </div>
                <!-- 分隔线 -->
                <div class="metric-divider" />
                <!-- 三列子指标 -->
                <div class="sub-metrics-row">
                  <div class="metric-item">
                    <span class="metric-label">已完成</span>
                    <div class="metric-value-row">
                      <span class="metric-value">60</span>
                      <span class="metric-unit">项</span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">未完成</span>
                    <div class="metric-value-row">
                      <span class="metric-value">8</span>
                      <span class="metric-unit">项</span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">累计逾期</span>
                    <div class="metric-value-row">
                      <span class="metric-value">8</span>
                      <span class="metric-unit">项</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 右侧环形图 + 履职率 -->
              <div class="overview-ring">
                <div class="ring-chart-wrapper">
                  <v-chart :option="rateRingOption" autoresize />
                  <div class="ring-center-text">
                    <span class="ring-rate-text">90%</span>
                    <span class="ring-label-text">今日履职率</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 履职完成率Top3 -->
          <div class="panel-section">
            <div class="section-title">
              <div class="title-bar" />
              <span class="title-text">履职完成率Top3</span>
            </div>
            <div class="rank-list">
              <div v-for="(item, index) in rankList" :key="item.name" class="rank-item">
                <div class="rank-num-wrap">
                  <svg class="rank-bg" viewBox="0 0 30 16" fill="none">
                    <rect x="1" y="1" width="28" height="14" rx="3" fill="rgba(60,211,215,0.15)" stroke="rgba(60,211,215,0.2)" />
                  </svg>
                  <span class="rank-num">{{ String(index + 1).padStart(2, '0') }}</span>
                </div>
                <span class="rank-name">{{ item.name }}</span>
                <div class="rank-progress">
                  <div class="rank-progress-bg">
                    <div class="rank-progress-fill" :style="{ width: item.rate + '%' }" />
                  </div>
                </div>
                <span class="rank-percent">{{ item.rate }}%</span>
              </div>
            </div>
          </div>

          <!-- 实时履职动态 -->
          <div class="panel-section panel-section--flex">
            <div class="section-title">
              <div class="title-bar" />
              <span class="title-text">实时履职动态</span>
            </div>
            <div class="dynamic-list">
              <div v-for="(item, index) in dynamicList" :key="index" class="dynamic-row">
                <span class="dynamic-name">{{ item.name }}</span>
                <span class="dynamic-action">{{ item.action }}</span>
                <span class="dynamic-time">{{ item.time }}</span>
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
              <span class="search-placeholder">搜索任务名称...</span>
            </div>
            <div class="status-filter">
              <span>全部状态</span>
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
              <div class="th th-status">
                <span>履职状态</span>
                <div class="sort-icons">
                  <svg class="sort-arrow sort-arrow--up" viewBox="0 0 12 12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
                  <svg class="sort-arrow sort-arrow--down" viewBox="0 0 12 12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
                </div>
              </div>
              <div class="th th-name">商户名称</div>
              <div class="th th-category">
                <span>商户业态</span>
                <div class="sort-icons">
                  <svg class="sort-arrow sort-arrow--up" viewBox="0 0 12 12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
                  <svg class="sort-arrow sort-arrow--down" viewBox="0 0 12 12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
                </div>
              </div>
              <div class="th th-time">
                <span>上报时间</span>
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
                <div class="td td-status">
                  <span class="status-tag" :class="row.status === 'warning' ? 'status-tag--warning' : 'status-tag--normal'">
                    {{ row.status === 'warning' ? '预警' : '正常' }}
                  </span>
                </div>
                <div class="td td-name">{{ row.name }}</div>
                <div class="td td-category">{{ row.category }}</div>
                <div class="td td-time">{{ row.reportTime }}</div>
                <div class="td td-action">
                  <span class="action-link">查看</span>
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
              <span class="page-info-label">共 {{ tableRows.length }} 条数据</span>
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
const rateRingOption = computed(() => ({
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
        { value: 90, name: '已完成', itemStyle: { color: '#148DFF'} },
        { value: 10, name: '未完成', itemStyle: { color: '#0151A4' } },
      ],
    },
  ],
}))

// ===== 履职完成率Top5 =====
const rankList = [
  { name: '沙县小吃', rate: 96 },
  { name: '爱玛电动车', rate: 89 },
  { name: 'Tony美发店', rate: 80 },
]

// ===== 实时履职动态 =====
const dynamicList = [
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日隐患排查', time: '2025-09-10 13:24' },
]

// ===== 表格数据 =====
const tableRows = [
  { name: '盛邦木业', category: '木材加工', reportTime: '2025-10-14 09:00', status: 'warning' },
  { name: '南湖校区', category: '物业', reportTime: '2025-10-14 09:00', status: 'warning' },
  { name: '江南商贸城', category: '商业', reportTime: '2025-10-14 09:00', status: 'warning' },
  { name: '旺达建材', category: '建材销售', reportTime: '2025-10-14 09:00', status: 'normal' },
  { name: '幸福超市', category: '零售', reportTime: '2025-10-14 09:00', status: 'normal' },
  { name: '天天小吃', category: '餐饮', reportTime: '2025-10-14 09:00', status: 'normal' },
]

const pageSize = ref(5)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(tableRows.length / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return tableRows.slice(start, start + pageSize.value)
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
.business-compliance {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(22, 70, 145, 0.51);
  overflow: hidden;
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

/* 小节标题（蓝色竖条 + 文字） */
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
  font-size: 14px;
  font-weight: 500;
  color: #e6ecfd;
  line-height: normal;
  white-space: nowrap;
}

/* ===== 履职概览 ===== */
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

/* 指标项（样式一：左对齐） */
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
  font-size: 20px;
  font-weight: 700;
  line-height: normal;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-unit {
  font-family: 'PingFang SC', sans-serif;
  font-size: 14px;
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

/* ===== 环形图区域（样式二：居中） ===== */
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
  font-size: 20px;
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

/* ===== 履职完成率Top5 ===== */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 38px;
}

.rank-num-wrap {
  position: relative;
  width: 30px;
  height: 16px;
  flex-shrink: 0;
}

.rank-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rank-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Douyin Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #c2d9fd;
  line-height: normal;
}

.rank-name {
  font-family: 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #d6e3ff;
  white-space: nowrap;
  flex-shrink: 0;
}

.rank-progress {
  flex: 1;
  min-width: 0;
}

.rank-progress-bg {
  width: 100%;
  height: 6px;
  background: #d9d9d9;
  border-radius: 3px;
  overflow: hidden;
}

.rank-progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(172deg, rgb(32, 92, 169) 9.4%, rgb(0, 67, 154) 90.5%);
}

.rank-percent {
  font-family: 'Douyin Sans', sans-serif;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: normal;
}

/* ===== 实时履职动态 ===== */
.dynamic-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 6px;
  min-height: 0;
}

.dynamic-list::-webkit-scrollbar { width: 2px; }
.dynamic-list::-webkit-scrollbar-track { background: transparent; }
.dynamic-list::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.2); border-radius: 1px; }

.dynamic-row {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.dynamic-name {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #a9b0c5;
  line-height: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dynamic-action {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #a9b0c5;
  text-align: center;
  line-height: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dynamic-time {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #a9b0c5;
  text-align: center;
  line-height: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 表头（Figma: bg #034aad, text #cecece, 14px） */
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

.th-status { width: 118px; flex-shrink: 0; }
.th-name { flex: 1; min-width: 0; }
.th-category { flex: 1; min-width: 0; }
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

.td-status { width: 118px; flex-shrink: 0; }
.td-name { flex: 1; min-width: 0; justify-content: flex-start; }
.td-category { flex: 1; min-width: 0; }
.td-time { flex: 1; min-width: 0; }
.td-action { width: 48px; flex-shrink: 0; }

/* 状态标签 */
.status-tag {
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

.status-tag--warning {
  background: rgba(254, 151, 151, 0.625);
  color: #bd0000;
}

.status-tag--normal {
  background: rgba(0, 184, 219, 0.3);
  color: #002873;
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
