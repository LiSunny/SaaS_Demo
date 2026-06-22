<template>
  <div class="business-compliance">
    <!-- ===== 左右分栏 ===== -->
    <div class="content-area">
      <!-- ===== 左侧面板 ===== -->
      <div class="left-panel">
        <!-- 数据概览 -->
        <div class="panel-section">
          <div class="section-title">
            <div class="title-bar" />
            <span class="title-text">数据概览</span>
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
              <svg class="ring-svg" viewBox="0 0 142 142">
                <circle cx="71" cy="71" r="60" fill="none" stroke="#003063" stroke-width="12" />
                <circle
                  cx="71" cy="71" r="60"
                  fill="none"
                  stroke="url(#complianceRingGrad)"
                  stroke-width="12"
                  stroke-linecap="round"
                  stroke-dasharray="377"
                  stroke-dashoffset="38"
                  transform="rotate(-90 71 71)"
                />
                <defs>
                  <linearGradient id="complianceRingGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="9.38%" stop-color="#205CA9" />
                    <stop offset="90.5%" stop-color="#0072FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="ring-center-text">
                <span class="ring-label">今日履职率</span>
                <span class="ring-value">90%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 履职完成率Top5 -->
        <div class="panel-section">
          <div class="section-title">
            <div class="title-bar" />
            <span class="title-text">履职完成率Top5</span>
          </div>
          <div class="rank-list">
            <div v-for="(item, index) in rankList" :key="item.name" class="rank-item">
              <div class="rank-info">
                <div class="rank-header">
                  <span class="rank-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="rank-name">{{ item.name }}</span>
                </div>
                <div class="rank-progress">
                  <div class="rank-progress-bg" />
                  <div class="rank-progress-fill" :style="{ width: item.rate + '%' }" />
                </div>
              </div>
              <span class="rank-percent">{{ item.rate }}%</span>
            </div>
          </div>
        </div>

        <!-- 实时动态 -->
        <div class="panel-section panel-section--grow">
          <div class="section-title">
            <div class="title-bar" />
            <span class="title-text">实时动态</span>
          </div>
          <div class="feed-list">
            <div v-for="(item, idx) in dynamicList" :key="idx" class="feed-row">
              <span class="feed-shop">{{ item.name }}</span>
              <span class="feed-action">{{ item.action }}</span>
              <span class="feed-time">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 右侧面板 ===== -->
      <div class="right-panel">
        <!-- 搜索/筛选栏 -->
        <div class="search-bar">
          <div class="search-input">
            <svg class="search-icon-svg" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#c1c1c1" stroke-width="1.5">
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="14" y2="14" />
            </svg>
            <span class="search-placeholder">搜索任务名称...</span>
          </div>
          <div class="status-filter">
            <span>全部状态</span>
            <svg class="filter-arrow" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#c1c1c1" stroke-width="1.5">
              <polyline points="4 6 8 10 12 6" />
            </svg>
          </div>
          <button class="query-btn">查询</button>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrapper">
          <!-- 表头 -->
          <div class="table-header">
            <div class="th th-status">
              <span>履职状态</span>
              <div class="sort-icons">
                <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
              </div>
            </div>
            <div class="th th-name">商户名称</div>
            <div class="th th-category">
              <span>商户业态</span>
              <div class="sort-icons">
                <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
              </div>
            </div>
            <div class="th th-time">
              <span>上报时间</span>
              <div class="sort-icons">
                <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 3L2 8h8z" fill="#cecece" /></svg>
                <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 9l-4-5h8z" fill="#cecece" /></svg>
              </div>
            </div>
            <div class="th th-action">操作</div>
          </div>
          <!-- 表体 -->
          <div class="table-body">
            <div v-for="(row, idx) in paginatedRows" :key="idx" class="table-row">
              <div class="td td-status">
                <span class="status-tag" :class="row.status === 'warning' ? 'status-tag--warning' : 'status-tag--normal'">
                  {{ row.status === 'warning' ? '预警' : '正常' }}
                </span>
              </div>
              <div class="td td-name">{{ row.name }}</div>
              <div class="td td-category">{{ row.category }}</div>
              <div class="td td-time">{{ row.reportTime }}</div>
              <div class="td td-action">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" class="action-icon">
                  <circle cx="3" cy="3" r="1.5" />
                  <circle cx="3" cy="8" r="1.5" />
                  <circle cx="3" cy="13" r="1.5" />
                  <line x1="7" y1="3" x2="14" y2="3" />
                  <line x1="7" y1="8" x2="14" y2="8" />
                  <line x1="7" y1="13" x2="11" y2="13" />
                </svg>
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
              <svg class="page-size-arrow" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#f2fbff" stroke-width="1.5">
                <polyline points="4 6 8 10 12 6" />
              </svg>
            </div>
            <span class="page-info-label">共 {{ tableRows.length }} 条数据</span>
          </div>
          <div class="page-controls">
            <button class="page-btn page-btn--nav" :disabled="currentPage <= 1" @click="prevPage">上一页</button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="page-btn page-btn--num"
              :class="{ 'page-btn--active': p === currentPage }"
              @click="currentPage = p"
            >{{ p }}</button>
            <button class="page-btn page-btn--nav" :disabled="currentPage >= totalPages" @click="nextPage">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// ===== 履职完成率Top5 =====
const rankList = [
  { name: '沙县小吃', rate: 96 },
  { name: '爱玛电动车', rate: 89 },
  { name: 'Tony美发店', rate: 80 },
  { name: '东北饭庄', rate: 74 },
  { name: '柳州螺蛳粉', rate: 50 },
]

// ===== 实时动态 =====
const dynamicList = [
  { name: '沙县小吃', action: '完成每日履职打卡', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日履职打卡', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日履职打卡', time: '2025-09-10 13:24' },
  { name: '沙县小吃', action: '完成每日履职打卡', time: '2025-09-10 13:24' },
]

// ===== 表格数据 =====
const tableRows = [
  { name: '盛邦木业', category: '木材加工', reportTime: '2025-10-14 09:00', status: 'warning' },
  { name: '南湖校区', category: '物业', reportTime: '2025-10-14 09:00', status: 'warning' },
  { name: '江南商贸城', category: '商业', reportTime: '2025-10-14 09:00', status: 'warning' },
  { name: '生产计划执行与分配', category: '2025-10-14 09:00', reportTime: '2025-10-14 09:00', status: 'normal' },
  { name: '生产计划执行与分配', category: '2025-10-14 09:00', reportTime: '2025-10-14 09:00', status: 'normal' },
  { name: '生产计划执行与分配', category: '2025-10-14 09:00', reportTime: '2025-10-14 09:00', status: 'normal' },
]

const pageSize = ref(10)
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
  overflow: hidden;
}

/* ===== 内容区：左右分栏 ===== */
.content-area {
  flex: 1;
  display: flex;
  gap: calc(24 * var(--w));
  min-height: 0;
  overflow: hidden;
  padding: calc(12 * var(--h)) calc(12 * var(--w));
}

/* ===== 左侧面板 ===== */
.left-panel {
  flex-shrink: 0;
  width: calc(423 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
  padding: calc(12 * var(--h)) 0;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.left-panel::-webkit-scrollbar { width: 4px; }
.left-panel::-webkit-scrollbar-track { background: transparent; }
.left-panel::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.panel-section {
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
  flex-shrink: 0;
}

.panel-section--grow {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ===== 小节标题（蓝色竖条 + 文字） ===== */
.section-title {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
  flex-shrink: 0;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: #2584ab;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(37, 132, 171, 0.36);
  flex-shrink: 0;
}

.title-text {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #ffffff;
  line-height: normal;
  white-space: nowrap;
}

/* ===== 数据概览 ===== */
.overview-body {
  display: flex;
  align-items: center;
  gap: calc(46 * var(--w));
}

.overview-metrics {
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
  flex-shrink: 0;
}

/* 指标项（Figama: 左对齐, gap label→value = 8px） */
.metric-item {
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  align-items: flex-start;
  flex-shrink: 0;
}

.metric-label {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f2fbff;
  line-height: normal;
  white-space: nowrap;
}

.metric-value-row {
  display: flex;
  align-items: flex-end;
  gap: calc(8 * var(--w));
  line-height: 0;
}

.metric-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  font-weight: 700;
  color: #ffffff;
  line-height: normal;
}

.metric-unit {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #ffffff;
  line-height: normal;
}

/* 分隔线（Figma: 79.92° 蓝色渐变斜线） */
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

/* 三个子指标水平排列 */
.sub-metrics-row {
  display: flex;
  align-items: center;
  gap: calc(36 * var(--w));
}

/* ===== 环形图区域 ===== */
.overview-ring {
  display: grid;
  grid-template-columns: max-content;
  grid-template-rows: max-content;
  place-items: center;
  flex-shrink: 0;
}

.ring-svg {
  grid-column: 1;
  grid-row: 1;
  width: calc(142 * var(--min-scale));
  height: calc(142 * var(--min-scale));
}

.ring-center-text {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(8 * var(--h));
}

.ring-label {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(13 * var(--min-scale)), 15px);
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

/* ===== 履职完成率Top5 ===== */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.rank-item {
  display: flex;
  align-items: center;
  gap: calc(18 * var(--w));
  height: calc(38 * var(--h));
}

.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.rank-header {
  display: flex;
  align-items: center;
  gap: calc(19 * var(--w));
}

.rank-index {
  width: calc(30 * var(--w));
  height: calc(16 * var(--h));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(12 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #ffffff;
  background: rgba(60, 211, 215, 0.15);
  border: 1px solid rgba(60, 211, 215, 0.2);
  border-radius: 3px;
  flex-shrink: 0;
}

.rank-name {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #ffffff;
  white-space: nowrap;
}

.rank-progress {
  display: grid;
  grid-template-rows: max-content;
  width: 100%;
}

.rank-progress-bg {
  grid-column: 1;
  grid-row: 1;
  height: 6px;
  border-radius: 3px;
  background: #003063;
}

.rank-progress-fill {
  grid-column: 1;
  grid-row: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(175.85deg, rgb(32, 92, 169) 9.38%, rgb(0, 114, 255) 90.5%);
}

.rank-percent {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 22px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: normal;
}

/* ===== 实时动态 ===== */
.feed-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  overflow-y: auto;
  padding: calc(6 * var(--h)) 0;
  min-height: 0;
}

.feed-list::-webkit-scrollbar { width: 4px; }
.feed-list::-webkit-scrollbar-track { background: transparent; }
.feed-list::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.feed-row {
  display: flex;
  align-items: center;
  padding: calc(6 * var(--h)) 0;
  flex-shrink: 0;
}

.feed-shop {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #f1f1f1;
  line-height: normal;
}

.feed-action {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #f1f1f1;
  text-align: center;
  line-height: normal;
}

.feed-time {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #d8d8d8;
  text-align: center;
  line-height: normal;
}

/* ===== 右侧面板 ===== */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--h));
  padding: calc(12 * var(--h)) 0;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* ===== 搜索/筛选栏 ===== */
.search-bar {
  display: flex;
  align-items: center;
  gap: calc(18 * var(--w));
  flex-shrink: 0;
}

.search-input {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
  height: calc(36 * var(--h));
  padding: calc(4 * var(--h)) calc(12 * var(--w));
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  width: calc(203 * var(--w));
}

.search-icon-svg {
  flex-shrink: 0;
}

.search-placeholder {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #c1c1c1;
  line-height: normal;
  white-space: nowrap;
}

.status-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(36 * var(--h));
  width: calc(140 * var(--w));
  padding: 1px calc(13 * var(--w));
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  flex-shrink: 0;
  cursor: pointer;
}

.status-filter span {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #c1c1c1;
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
  height: calc(36 * var(--h));
  padding: calc(8 * var(--h)) calc(18 * var(--w));
  background: #0095ff;
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
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

/* 表头（Figma: bg #0457a7） */
.table-header {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: calc(6 * var(--h)) calc(6 * var(--w));
  background: #0457a7;
  flex-shrink: 0;
}

.th {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(6 * var(--w));
  height: 21px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #cecece;
  line-height: 21px;
  white-space: nowrap;
}

.th-status { width: calc(118 * var(--w)); flex-shrink: 0; }
.th-name { flex: 1; min-width: 0; justify-content: flex-start; }
.th-category { flex: 1; min-width: 0; }
.th-time { flex: 1; min-width: 0; }
.th-action { width: calc(48 * var(--w)); flex-shrink: 0; }

.sort-icons {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 12px;
  height: 20px;
  opacity: 0.4;
  flex-shrink: 0;
}

.sort-icons svg {
  display: block;
}

.sort-icons svg:last-child {
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

.table-body::-webkit-scrollbar { width: 4px; }
.table-body::-webkit-scrollbar-track { background: transparent; }
.table-body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.table-row {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: 0 calc(6 * var(--w));
  border-top: 1px solid rgba(223, 251, 255, 0.16);
  flex-shrink: 0;
}

.td {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(10 * var(--h)) 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #f2fbff;
  line-height: 21px;
}

.td-status { width: calc(118 * var(--w)); flex-shrink: 0; }
.td-name { flex: 1; min-width: 0; justify-content: flex-start; }
.td-category { flex: 1; min-width: 0; }
.td-time { flex: 1; min-width: 0; }
.td-action { width: calc(48 * var(--w)); flex-shrink: 0; }

/* 状态标签（Figma） */
.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(2 * var(--h)) calc(6 * var(--w));
  border-radius: 4px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  white-space: nowrap;
}

.status-tag--warning {
  background: rgba(255, 106, 106, 0.2);
  color: #ff3a3a;
}

.status-tag--normal {
  background: rgba(0, 84, 219, 0.2);
  color: #0072ff;
}

.action-icon {
  color: rgba(137, 181, 255, 0.6);
  cursor: pointer;
  flex-shrink: 0;
}

.action-icon:hover {
  color: #3cd3d7;
}

/* ===== 分页栏 ===== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(12 * var(--w));
  flex-shrink: 0;
}

.page-info {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
  height: calc(36 * var(--h));
}

.page-info-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f2fbff;
  line-height: 21px;
  white-space: nowrap;
}

.page-size-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(36 * var(--h));
  width: calc(82 * var(--w));
  padding: 1px calc(13 * var(--w));
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  cursor: pointer;
}

.page-size-select span {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
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
  gap: calc(8 * var(--w));
  height: 32px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(6 * var(--h)) calc(10 * var(--w));
  background: none;
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  color: #ffffff;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.page-btn--nav {
  background: rgba(1, 101, 178, 0.3);
}

.page-btn--nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-btn--num {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: #bebebe;
}

.page-btn--active {
  background: rgba(32, 92, 194, 0.56);
  border: 1px solid rgba(0, 84, 201, 0.67);
  color: #f2fbff;
}
</style>
