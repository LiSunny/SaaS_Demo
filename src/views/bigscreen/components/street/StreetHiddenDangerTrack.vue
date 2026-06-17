<template>
  <div class="danger-track">
      <div class="content-area">
        <!-- ===== 左侧面板 ===== -->
        <div class="left-panel">
          <!-- 隐患概览 -->
          <div class="panel-section">
            <div class="section-title">
              <div class="title-bar" />
              <span class="title-text">隐患概览</span>
            </div>
            <div class="overview-body">
              <!-- 左侧指标列 -->
              <div class="overview-metrics">
                <!-- 累计隐患 -->
                <div class="metric-item">
                  <span class="metric-label">累计隐患</span>
                  <div class="metric-value-row">
                    <span class="metric-value">156</span>
                    <span class="metric-unit">项</span>
                  </div>
                </div>
                <!-- 分隔线 -->
                <div class="metric-divider" />
                <!-- 三列子指标 -->
                <div class="sub-metrics-row">
                  <div class="metric-item">
                    <span class="metric-label">已整改</span>
                    <div class="metric-value-row">
                      <span class="metric-value metric-value--done">128</span>
                      <span class="metric-unit">项</span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">未整改</span>
                    <div class="metric-value-row">
                      <span class="metric-value">28</span>
                      <span class="metric-unit">项</span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">逾期未改</span>
                    <div class="metric-value-row">
                      <span class="metric-value metric-value--warn">12</span>
                      <span class="metric-unit">项</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 右侧环形图 + 整改率 -->
              <div class="overview-ring">
                <div class="ring-chart-wrapper">
                  <v-chart :option="rateRingOption" autoresize />
                  <div class="ring-center-text">
                    <span class="ring-rate-text">82%</span>
                    <span class="ring-label-text">整改率</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 整改完成率Top3 -->
          <div class="panel-section">
            <div class="section-title">
              <div class="title-bar" />
              <span class="title-text">整改完成率Top3</span>
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

          <!-- 实时整改动态 -->
          <div class="panel-section panel-section--flex">
            <div class="section-title">
              <div class="title-bar" />
              <span class="title-text">实时整改动态</span>
            </div>
            <div class="dynamic-list">
              <div v-for="(item, index) in dynamicList" :key="index" class="dynamic-row">
                <span class="dynamic-name">{{ item.company }}</span>
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
              <span class="search-placeholder">搜索隐患内容...</span>
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
                <span>整改状态</span>
                <div class="sort-icons">
                  <svg class="sort-arrow sort-arrow--up" viewBox="0 0 12 12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
                  <svg class="sort-arrow sort-arrow--down" viewBox="0 0 12 12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
                </div>
              </div>
              <div class="th th-content">隐患内容</div>
              <div class="th th-company">上报企业</div>
              <div class="th th-deadline">
                <span>整改期限</span>
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
                  <span class="status-tag" :class="statusClass(row.status)">{{ row.status }}</span>
                </div>
                <div class="td td-content">{{ row.content }}</div>
                <div class="td td-company">{{ row.company }}</div>
                <div class="td td-deadline">{{ row.deadline }}</div>
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
        { value: 82, name: '已整改', itemStyle: { color: '#148DFF' } },
        { value: 18, name: '未整改', itemStyle: { color: '#0151A4' } },
      ],
    },
  ],
}))

// ===== 整改完成率Top3 =====
const rankList = [
  { name: '消防隐患', rate: 95 },
  { name: '电气隐患', rate: 88 },
  { name: '通道隐患', rate: 76 },
]

// ===== 实时整改动态 =====
const dynamicList = [
  { company: '盛邦木业', action: '消防通道堵塞已整改', time: '2025-10-14 16:30' },
  { company: '华泰建材', action: '化学品存放不当整改中', time: '2025-10-14 15:20' },
  { company: '远大化工', action: '配电箱接地已修复', time: '2025-10-14 14:10' },
  { company: '中联重科', action: '电焊作业防护已落实', time: '2025-10-14 11:45' },
  { company: '盛邦木业', action: '灭火器已更换', time: '2025-10-14 10:30' },
  { company: '旺达建材', action: '安全出口标识已补设', time: '2025-10-14 09:15' },
  { company: '幸福超市', action: '应急灯已维修', time: '2025-10-13 17:00' },
  { company: '天天小吃', action: '燃气管道老化整改中', time: '2025-10-13 15:40' },
  { company: '南湖校区', action: '消防栓遮挡已清理', time: '2025-10-13 14:20' },
]

// ===== 表格数据 =====
const tableRows = [
  { content: '消防通道堵塞', company: '盛邦木业', deadline: '2025-10-20', status: '整改中' },
  { content: '灭火器过期', company: '盛邦木业', deadline: '2025-10-18', status: '整改中' },
  { content: '电线私拉乱接', company: '盛邦木业', deadline: '2025-10-15', status: '逾期' },
  { content: '安全出口标识缺失', company: '旺达建材', deadline: '2025-10-22', status: '整改中' },
  { content: '应急灯故障', company: '幸福超市', deadline: '2025-10-25', status: '整改中' },
  { content: '消防栓遮挡', company: '南湖校区', deadline: '2025-10-12', status: '已整改' },
  { content: '化学品存放不当', company: '华泰建材', deadline: '2025-10-28', status: '整改中' },
  { content: '电焊作业无防护', company: '中联重科', deadline: '2025-10-16', status: '逾期' },
  { content: '配电箱接地修复', company: '远大化工', deadline: '2025-10-10', status: '已整改' },
  { content: '疏散通道清理', company: '盛邦木业', deadline: '2025-10-08', status: '已整改' },
  { content: '燃气管道老化', company: '天天小吃', deadline: '2025-10-30', status: '整改中' },
  { content: '电梯维保超期', company: '江南商贸城', deadline: '2025-10-14', status: '逾期' },
]

function statusClass(status: string) {
  if (status === '已整改') return 'status-tag--done'
  if (status === '逾期') return 'status-tag--overdue'
  return 'status-tag--ongoing'
}

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
.danger-track {
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
  font-size: 16px;
  font-weight: 500;
  color: #e6ecfd;
  line-height: normal;
  white-space: nowrap;
}

/* ===== 隐患概览 ===== */
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

/* ===== 整改完成率Top3 ===== */
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
  font-size: 16px;
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
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: normal;
}

/* ===== 实时整改动态 ===== */
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
  font-size: 16px;
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
  font-size: 16px;
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
  font-size: 16px;
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
.th-content { flex: 1; min-width: 0; }
.th-company { flex: 1; min-width: 0; }
.th-deadline { flex: 1; min-width: 0; }
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
.td-content { flex: 1; min-width: 0; justify-content: flex-start; }
.td-company { flex: 1; min-width: 0; }
.td-deadline { flex: 1; min-width: 0; }
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

.status-tag--done {
  background: rgba(0, 184, 219, 0.3);
  color: #56f0f4;
}

.status-tag--ongoing {
  background: rgba(255, 180, 0, 0.3);
  color: #ffb400;
}

.status-tag--overdue {
  background: rgba(254, 151, 151, 0.625);
  color: #ff6b6e;
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
