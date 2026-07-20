<template>
  <div class="dashboard-page">
    <!-- ===== 面包屑 ===== -->
    <div class="page-top">
      <button class="btn-link" @click="$router.push('/resumption')">
        ← 返回列表
      </button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/resumption' }">复工复产管理</el-breadcrumb-item>
        <el-breadcrumb-item>复工看板</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- ===== 统计卡片行（4 阶段 = 4 卡片） ===== -->
    <div class="metric-row">
      <div class="metric-card metric-prepare">
        <span class="metric-value">{{ stats.prepare }}</span>
        <span class="metric-label">复工准备</span>
      </div>
      <div class="metric-card metric-review">
        <span class="metric-value">{{ stats.review }}</span>
        <span class="metric-label">复工审核</span>
      </div>
      <div class="metric-card metric-trial">
        <span class="metric-value">{{ stats.trial }}</span>
        <span class="metric-label">试产观察</span>
      </div>
      <div class="metric-card metric-production">
        <span class="metric-value">{{ stats.production }}</span>
        <span class="metric-label">正式复产</span>
      </div>
    </div>

    <!-- ===== 车间进度卡片 ===== -->
    <div class="workshop-grid">
      <div
        v-for="plan in store.list"
        :key="plan.id"
        class="workshop-card"
        @click="$router.push(`/resumption/${plan.id}`)"
      >
        <div class="ws-header">
          <h4 class="ws-name">{{ plan.locationName }}</h4>
          <StatusTag :status="`plan_${plan.status}`" />
        </div>

        <!-- 步骤进度条 -->
        <div class="ws-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: stepPercent(plan) + '%' }"
              :class="plan.status === 'production' ? 'fill-success' : ''"
            />
          </div>
          <span class="progress-text">{{ completedSteps(plan) }}/11 步已完成</span>
        </div>

        <!-- 时间信息 -->
        <div class="ws-meta">
          <div class="ws-meta-item">
            <span class="meta-label">开始</span>
            <span>{{ plan.startedAt || '—' }}</span>
          </div>
          <div v-if="plan.completedAt" class="ws-meta-item">
            <span class="meta-label">完成</span>
            <span>{{ plan.completedAt }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!store.loading && store.list.length === 0" class="empty-card">
        <p>暂无复工计划</p>
        <button class="btn-outline-primary" @click="$router.push('/resumption')">去创建计划</button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="store.loading && store.list.length === 0" class="loading-wrap" v-loading="true" style="min-height: 300px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useResumptionStore } from '@/stores/resumption'
import type { ResumptionPlanItem } from '@/types/resumption'
import StatusTag from '@/components/business/StatusTag.vue'

const store = useResumptionStore()

// 统计
const stats = computed(() => ({
  prepare: store.list.filter(p => p.status === 'prepare').length,
  review: store.list.filter(p => p.status === 'review').length,
  trial: store.list.filter(p => p.status === 'trial').length,
  production: store.list.filter(p => p.status === 'production').length,
}))

function completedSteps(plan: ResumptionPlanItem): number {
  if (plan.status === 'production') return 11
  return plan.currentStep - 1
}

function stepPercent(plan: ResumptionPlanItem): number {
  return Math.round((completedSteps(plan) / 11) * 100)
}

onMounted(async () => {
  // 拉全量，不做分页
  store.query.size = 100
  await store.fetchList()
})
</script>

<style scoped>
/* ===== 页面容器 ===== */
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  overflow: auto;
}

.page-top {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* ===== 统计卡片 ===== */
.metric-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}
@media (max-width: 900px) {
  .metric-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .metric-row { grid-template-columns: 1fr; }
}

.metric-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}
.metric-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
.metric-prepare { border-left: 3px solid var(--accent-primary); }
.metric-review { border-left: 3px solid var(--warning, #D97706); }
.metric-trial { border-left: 3px solid #F59E0B; }
.metric-production { border-left: 3px solid var(--success, #059669); }

/* ===== 车间卡片网格 ===== */
.workshop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.workshop-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 16px;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.workshop-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px var(--accent-primary10);
}

.ws-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ws-name {
  font-size: var(--font-h3, 18px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 进度条 */
.ws-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-sub-card);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 3px;
  transition: width .4s ease;
}
.progress-fill.fill-success {
  background: var(--success, #059669);
}
.progress-text {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  white-space: nowrap;
}

/* 时间 */
.ws-meta {
  display: flex;
  gap: 16px;
  font-size: var(--font-xs, 12px);
  color: var(--text-secondary);
}
.ws-meta-item {
  display: flex;
  gap: 4px;
}
.meta-label {
  color: var(--text-muted);
}

/* 空状态 */
.empty-card {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  font-size: var(--font-body, 16px);
  color: var(--text-secondary);
}

.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
