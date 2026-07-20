<template>
  <div class="detail-page">
    <!-- ===== 面包屑 + 返回 ===== -->
    <div class="page-top">
      <button class="btn-link" @click="$router.push('/resumption')">
        ← 返回列表
      </button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/resumption' }">复工复产管理</el-breadcrumb-item>
        <el-breadcrumb-item>复工流程详情</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <template v-if="detail">
      <!-- ===== 摘要卡片 ===== -->
      <div class="summary-card">
        <div class="summary-left">
          <h2 class="summary-title">{{ detail.locationName }}</h2>
          <StatusTag :status="`plan_${detail.status}`" />
        </div>
        <div class="summary-meta">
          <div class="meta-item">
            <span class="meta-label">复工时间</span>
            <span class="meta-value">{{ detail.startedAt || '—' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">完成时间</span>
            <span class="meta-value">{{ detail.completedAt || '—' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">小组人数</span>
            <span class="meta-value">{{ detail.team.length }} 人</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">复工令</span>
            <span class="meta-value">{{ detail.order ? '已签发' : '未签发' }}</span>
          </div>
        </div>
        <!-- 小组名单 -->
        <div v-if="detail.team.length" class="team-row">
          <span class="meta-label">小组成员：</span>
          <span v-for="(m, i) in detail.team" :key="m.id" class="team-tag">
            {{ m.role }}·{{ m.userName }}<span v-if="i < detail.team.length - 1">、</span>
          </span>
        </div>
        <!-- 验收入口 -->
        <div class="summary-actions">
          <button class="btn-outline-primary" @click="$router.push(`/resumption/${detail.id}/acceptance`)">
            查看验收与签发
          </button>
        </div>
      </div>

      <!-- ===== 步骤进度条 ===== -->
      <div class="steps-card">
        <div class="steps-scroll">
          <div
            v-for="(s, i) in detail.steps"
            :key="s.id"
            class="step-node"
            :class="{
              'step-done': s.status === 'done',
              'step-active': s.status === 'in_progress',
              'step-pending': s.status === 'pending',
              'step-selected': selectedStepId === s.id,
            }"
            @click="selectedStepId = s.id"
          >
            <div class="step-circle">
              <span v-if="s.status === 'done'">✓</span>
              <span v-else>{{ s.stepOrder }}</span>
            </div>
            <div class="step-label">{{ stepMetaByType(s.stepType)?.label || s.stepType }}</div>
          </div>
        </div>
      </div>

      <!-- ===== 步骤详情 ===== -->
      <div class="step-detail-card">
        <template v-if="selectedStep">
          <div class="step-detail-header">
            <h3 class="step-detail-title">
              {{ selectedStep.stepOrder }}. {{ stepMetaByType(selectedStep.stepType)?.label }}
            </h3>
            <StatusTag :status="`step_${selectedStep.status}`" />
          </div>

          <div class="step-detail-body">
            <div class="info-row">
              <span class="info-label">执行角色</span>
              <span class="info-value">{{ stepMetaByType(selectedStep.stepType)?.executor || '—' }}</span>
            </div>
            <div v-if="stepMetaByType(selectedStep.stepType)?.sixOneLabel" class="info-row">
              <span class="info-label">法规依据</span>
              <span class="info-value">{{ stepMetaByType(selectedStep.stepType)?.sixOneLabel }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">完成人</span>
              <span class="info-value">{{ selectedStep.completedBy || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">完成时间</span>
              <span class="info-value">{{ selectedStep.completedAt || '—' }}</span>
            </div>
            <div v-if="selectedStep.remark" class="info-row">
              <span class="info-label">操作记录</span>
              <span class="info-value remark-text">{{ selectedStep.remark }}</span>
            </div>
          </div>

          <!-- 附件区 -->
          <div v-if="selectedStep.status !== 'pending'" class="step-attachments">
            <span class="info-label">现场留痕</span>
            <div v-if="selectedStep.attachments.length === 0" class="no-attachments">
              📷 暂无附件（未上传或已归档）
            </div>
            <div v-else class="attachment-grid">
              <!-- light 阶段占位 -->
            </div>
          </div>

          <!-- 步骤 8/9 → 验收签发快捷入口 -->
          <div
            v-if="selectedStep.stepType === 'joint-acceptance' || selectedStep.stepType === 'issue-order'"
            class="step-nav-hint"
          >
            <button class="btn-outline-primary" @click="$router.push(`/resumption/${detail!.id}/acceptance`)">
              查看验收与签发详情 →
            </button>
          </div>
        </template>

        <div v-else class="step-empty">
          请点击上方步骤查看详情
        </div>
      </div>
    </template>

    <!-- 加载中/无数据 -->
    <div v-else-if="loading" class="loading-wrap" v-loading="true" style="height:200px" />
    <div v-else class="empty-wrap">
      <p>计划不存在或已被删除</p>
      <button class="btn-link" @click="$router.push('/resumption')">← 返回列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useResumptionStore } from '@/stores/resumption'
import { STEP_META } from '@/types/resumption'
import type { StepType, ResumptionStep } from '@/types/resumption'
import StatusTag from '@/components/business/StatusTag.vue'

const route = useRoute()
const store = useResumptionStore()
const detail = computed(() => store.detail)
const loading = computed(() => store.detailLoading)

// 默认选中第一个未完成的步骤
const selectedStepId = ref<number | null>(null)

const selectedStep = computed(() => {
  if (!detail.value || !selectedStepId.value) return null
  return detail.value.steps.find(s => s.id === selectedStepId.value) || null
})

function stepMetaByType(type: StepType) {
  return STEP_META.find(m => m.type === type)
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (id) {
    await store.fetchDetail(id)
    // 默认选中第一个未完成（或最后一个已完成）的步骤
    if (detail.value) {
      const firstPending = detail.value.steps.find(s => s.status !== 'done')
      selectedStepId.value = firstPending ? firstPending.id : detail.value.steps[detail.value.steps.length - 1]?.id || null
    }
  }
})
</script>

<style scoped>
/* ===== 页面容器 ===== */
.detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  overflow: auto;
}

/* ===== 面包屑 ===== */
.page-top {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

/* ===== 摘要卡片 ===== */
.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.summary-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.summary-title {
  font-size: var(--font-h2, 20px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.summary-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.meta-label {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
}
.meta-value {
  font-size: var(--font-body, 16px);
  color: var(--text-primary);
}
.team-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
}
.team-tag {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}

/* ===== 步骤进度条 ===== */
.steps-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 16px 12px;
  flex-shrink: 0;
}
.steps-scroll {
  display: flex;
  gap: 0;
  overflow-x: auto;
  align-items: flex-start;
}
.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 52px;
  cursor: pointer;
  position: relative;
  padding: 0 2px;
}
/* 连接线 */
.step-node::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 0;
  right: 50%;
  height: 2px;
  background: var(--border-default);
  z-index: 0;
}
.step-node::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 50%;
  right: 0;
  height: 2px;
  background: var(--border-default);
  z-index: 0;
}
.step-node:first-child::before { display: none; }
.step-node:last-child::after { display: none; }
.step-node.step-done::before,
.step-node.step-done::after { background: var(--success, #059669); }
.step-node.step-active::before { background: var(--success, #059669); }
.step-node.step-active::after { background: var(--border-default); }

.step-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-xs, 12px);
  font-weight: 600;
  z-index: 1;
  background: var(--bg-sub-card);
  border: 2px solid var(--border-default);
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all .2s;
}
.step-done .step-circle {
  background: var(--success, #059669);
  border-color: var(--success, #059669);
  color: #fff;
}
.step-active .step-circle {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 0 0 3px var(--accent-primary10);
}
.step-selected .step-circle {
  box-shadow: 0 0 0 3px var(--accent-primary10);
}

.step-label {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
}
.step-done .step-label { color: var(--text-secondary); }
.step-active .step-label { color: var(--accent-primary); font-weight: 500; }

/* ===== 步骤详情卡片 ===== */
.step-detail-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 20px;
  flex: 1;
  min-height: 200px;
}
.step-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-default);
}
.step-detail-title {
  font-size: var(--font-h3, 18px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.step-detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.info-row {
  display: flex;
  gap: 12px;
}
.info-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  min-width: 70px;
  flex-shrink: 0;
}
.info-value {
  font-size: var(--font-body, 16px);
  color: var(--text-primary);
}
.remark-text {
  line-height: 1.6;
  color: var(--text-secondary);
}

.step-attachments {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-low);
}
.no-attachments {
  margin-top: 8px;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

.step-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 160px;
  font-size: var(--font-body, 16px);
  color: var(--text-muted);
}

/* ===== 验收入口 ===== */
.summary-actions {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-low);
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
.step-nav-hint {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-low);
  display: flex;
  justify-content: flex-end;
}

.loading-wrap, .empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--text-secondary);
  font-size: var(--font-body, 16px);
}
</style>
