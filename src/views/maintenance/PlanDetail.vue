<template>
  <div class="detail-page">
    <!-- ===== 面包屑 + 返回 ===== -->
    <div class="page-top">
      <button class="btn-link" @click="$router.back()">
        <AppIcon name="arrow-left" class="btn-link-icon" />
        返回列表
      </button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">保养管理</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/maintenance/plans' }">保养计划</el-breadcrumb-item>
        <el-breadcrumb-item>
          <span class="breadcrumb-current">{{ plan?.planName || '详情' }}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- ===== 内容区（全宽纵向） ===== -->
    <div class="detail-body" v-loading="loading">
      <!-- 基本信息（含开关） -->
      <el-card shadow="never" class="info-card">
        <template #header><span class="card-title">基本信息</span></template>
        <div class="info-grid single-col">
          <div class="info-item">
            <span class="info-label">计划名称</span>
            <span class="info-value">{{ plan?.planName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <StatusTag v-if="plan" :status="plan.status" />
          </div>
          <div class="info-item">
            <span class="info-label">保养类型</span>
            <span class="info-value type-link">{{ cycleLabel(plan?.maintenanceType) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">执行人</span>
            <span class="info-value">{{ plan?.executor }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">下次生成时间</span>
            <span class="info-value">{{ plan?.nextGenTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">启用状态</span>
            <div class="switch-inline">
              <el-switch
                v-model="enabled"
                :disabled="plan?.status === 'expired'"
                @change="handleToggle"
              />
              <span class="switch-label">{{ switchLabel }}</span>
              <span v-if="plan?.status === 'expired'" class="switch-hint">已过期计划不可启停</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计摘要 全宽 -->
      <el-card shadow="never" class="info-card">
        <template #header><span class="card-title">统计信息</span></template>
        <div class="info-grid two-col">
          <div class="info-item">
            <span class="info-label">设备总数</span>
            <span class="info-value stat-num">{{ plan?.deviceCount ?? 0 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">保养项目数</span>
            <span class="info-value stat-num">{{ plan?.maintenanceItems ?? 0 }} 项</span>
          </div>
        </div>
      </el-card>

      <!-- 操作日志 -->
      <el-card shadow="never" class="info-card">
        <template #header><span class="card-title">操作日志</span></template>
        <el-tabs>
          <el-tab-pane label="全部记录">
            <div class="log-empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
                <rect x="6" y="8" width="36" height="32" rx="4" stroke="currentColor" stroke-width="2" fill="none"/>
                <line x1="14" y1="17" x2="34" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="14" y1="24" x2="30" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="14" y1="31" x2="26" y2="31" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <p class="log-empty-text">暂无操作记录</p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- ===== 底部操作栏 ===== -->
    <div class="detail-footer">
      <button class="btn-primary" @click="handleEdit">编辑</button>
      <button class="btn-danger" @click="handleDelete">删除</button>
      <button class="btn-default" @click="$router.back()">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import { getPlanDetail, deletePlan, togglePlanStatus } from '@/api/maintenance'
import type { MaintenancePlan, PlanCycle } from '@/types/maintenance'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const { confirmDelete } = useConfirm()

const plan = ref<MaintenancePlan | null>(null)
const loading = ref(false)
const enabled = ref(false)

const cycleMap: Record<PlanCycle, string> = {
  daily: '每日保养', weekly: '每周保养', monthly: '每月保养',
  quarterly: '每季保养', yearly: '每年保养',
}
const cycleLabel = (type?: PlanCycle) => type ? cycleMap[type] : '—'

const switchLabel = computed(() => enabled.value ? '已启用' : '已停用')

const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (!id) { ElMessage.warning('参数错误'); router.back(); return }
  loading.value = true
  try {
    const data = await getPlanDetail(id)
    if (!data) { ElMessage.warning('计划不存在'); router.back(); return }
    plan.value = data
    enabled.value = data.enabled
  } finally {
    loading.value = false
  }
}

const handleToggle = async (val: boolean) => {
  if (!plan.value) return
  await togglePlanStatus(plan.value.id, val)
  ElMessage.success(val ? '已启用' : '已停用')
}

const handleEdit = () => {
  if (!plan.value) return
  ElMessage.info('编辑功能 — 待接入')
}

const handleDelete = async () => {
  if (!plan.value) return
  await confirmDelete(plan.value.planName)
  await deletePlan(plan.value.id)
  ElMessage.success('删除成功')
  router.push('/maintenance/plans')
}

onMounted(() => fetchDetail())

// 路由参数变化时重新加载
watch(() => route.params.id, () => { if (route.params.id) fetchDetail() })
</script>

<style scoped>
/* ===== 布局 ===== */
.detail-page { height: 100%; padding: var(--spacing-xl, 16px); overflow: auto; }

.page-top {
  display: flex; align-items: center; gap: var(--spacing-xl, 16px);
  margin-bottom: var(--spacing-xl, 16px);
}
.breadcrumb-current { color: var(--text-primary); font-weight: 500; }

.detail-body { display: flex; flex-direction: column; gap: var(--spacing-xl, 16px); }

/* ===== 卡片 ===== */
.info-card {
  background: var(--bg-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
}
.card-title {
  font-size: var(--font-h3, 18px); font-weight: 500;
  color: var(--text-primary);
}

/* ===== 信息网格 ===== */
.info-grid { display: grid; gap: var(--spacing-lg, 12px); }
.single-col { grid-template-columns: 1fr; }
.two-col { grid-template-columns: 1fr 1fr; }

.info-item { display: flex; align-items: center; gap: var(--spacing-lg, 12px); }
.info-label {
  font-size: var(--font-small, 14px); color: var(--text-secondary);
  white-space: nowrap; min-width: 90px;
}
.info-value {
  font-size: var(--font-body, 16px); color: var(--text-primary);
  font-weight: 400;
}
.stat-num { font-size: var(--font-h2, 20px); font-weight: 500; color: var(--accent-primary); }
.type-link { color: var(--accent-primary); }

/* ===== 开关（inline） ===== */
.switch-inline {
  display: inline-flex; align-items: center; gap: var(--spacing-md, 8px);
}
.switch-label { font-size: var(--font-small, 14px); color: var(--text-secondary); }
.switch-hint { font-size: var(--font-xs, 12px); color: var(--text-muted); }

/* ===== 底部操作栏 ===== */
.detail-footer {
  margin-top: var(--spacing-xl, 16px);
  display: flex; gap: var(--spacing-md, 8px); justify-content: flex-end;
  padding-top: var(--spacing-xl, 16px);
  border-top: 1px solid var(--border-default);
}

/* ===== 操作日志空态 ===== */
.log-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: var(--spacing-md, 8px); padding: var(--spacing-xxl, 24px) 0;
  color: var(--text-muted);
}
.log-empty-text { font-size: var(--font-small, 14px); }

/* ===== 响应式 ===== */
@media (max-width: 800px) {
  .page-top { flex-direction: column; align-items: flex-start; gap: var(--spacing-md, 8px); }
  .two-col { grid-template-columns: 1fr; }
  .detail-footer { flex-wrap: wrap; }
}

/* ===== Dark 适配 ===== */
:deep(.el-card__header) {
  border-bottom-color: var(--border-low);
}
:deep(.el-switch__core) { background: var(--border-high); }
:deep(.el-switch.is-checked .el-switch__core) {
  background: var(--accent-primary); border-color: var(--accent-primary);
}
:deep(.el-switch.is-disabled .el-switch__core) { opacity: .4; }
:deep(.el-breadcrumb__inner.is-link) { color: var(--text-secondary); }
:deep(.el-breadcrumb__inner.is-link:hover) { color: var(--accent-primary); }
:deep(.el-breadcrumb__separator) { color: var(--text-muted); }
</style>
