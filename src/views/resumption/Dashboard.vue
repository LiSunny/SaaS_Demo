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

    <!-- ===== 统计卡片行 ===== -->
    <div class="metric-row">
      <div class="metric-card metric-preparing">
        <span class="metric-value">{{ stats.preparing }}</span>
        <span class="metric-label">筹备中</span>
      </div>
      <div class="metric-card metric-trial">
        <span class="metric-value">{{ stats.trial }}</span>
        <span class="metric-label">试产中</span>
      </div>
      <div class="metric-card metric-archived">
        <span class="metric-value">{{ stats.archived }}</span>
        <span class="metric-label">已归档</span>
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
              :class="plan.status === 'archived' ? 'fill-success' : ''"
            />
          </div>
          <span class="progress-text">{{ completedSteps(plan) }}/11 步已完成</span>
        </div>

        <!-- 当前步骤 -->
        <div class="ws-current">
          <span class="current-label">当前步骤</span>
          <span class="current-value">{{ currentStepLabel(plan) }}</span>
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
import { getStepLabel } from '@/api/adapters/resumption-dao'
import StatusTag from '@/components/business/StatusTag.vue'

const store = useResumptionStore()

// 统计
const stats = computed(() => ({
  preparing: store.list.filter(p => p.status === 'preparing').length,
  trial: store.list.filter(p => p.status === 'trial').length,
  archived: store.list.filter(p => p.status === 'archived').length,
}))

function completedSteps(plan: ResumptionPlanItem): number {
  // 通过 currentStep 推算：当前步骤之前的步骤即为已完成
  // preparing 状态下 currentStep 指向正在进行的步骤
  // trial 状态下 currentStep 指向 duty-log(10)
  // archived 状态下 currentStep=11，全部完成
  if (plan.status === 'archived') return 11
  if (plan.status === 'trial') return 9 // 复工令已签发 = 前9步完成
  return plan.currentStep - 1 // 当前步骤之前 = 已完成数
}

function stepPercent(plan: ResumptionPlanItem): number {
  return Math.round((completedSteps(plan) / 11) * 100)
}

function currentStepLabel(plan: ResumptionPlanItem): string {
  return getStepLabel(plan)
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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex-shrink: 0;
}
@media (max-width: 700px) {
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
.metric-preparing { border-left: 3px solid var(--accent-primary); }
.metric-trial { border-left: 3px solid var(--warning, #D97706); }
.metric-archived { border-left: 3px solid var(--success, #059669); }

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

/* 当前步骤 */
.ws-current {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.current-label {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
}
.current-value {
  font-size: var(--font-small, 14px);
  color: var(--accent-primary);
  font-weight: 500;
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
