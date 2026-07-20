<template>
  <div class="detail-page">
    <!-- ===== 面包屑 + 返回 ===== -->
    <div class="page-top">
      <button class="btn-link" @click="$router.push(`/resumption/${planId}`)">
        ← 返回流程详情
      </button>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/resumption' }">复工复产管理</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: `/resumption/${planId}` }">复工流程详情</el-breadcrumb-item>
        <el-breadcrumb-item>验收与签发</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <template v-if="detail">
      <!-- ===== 标题 ===== -->
      <div class="page-header">
        <h2 class="page-title">{{ detail.locationName }} · 验收与签发</h2>
        <StatusTag :status="`plan_${detail.status}`" />
      </div>

      <div class="content-grid">
        <!-- ===== 联合验收卡片 ===== -->
        <div class="info-card">
          <div class="card-header">
            <h3 class="card-title">联合验收</h3>
            <StatusTag :status="acceptanceStep ? `step_${acceptanceStep.status}` : 'step_pending'" />
          </div>
          <div class="card-body">
            <template v-if="acceptanceStep && acceptanceStep.status === 'done'">
              <div class="info-row">
                <span class="info-label">验收结论</span>
                <span class="info-value remark-text">{{ acceptanceStep.remark }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">验收人</span>
                <span class="info-value">{{ acceptanceStep.completedBy }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">验收时间</span>
                <span class="info-value">{{ acceptanceStep.completedAt }}</span>
              </div>
              <div class="signers-section">
                <span class="info-label">签字人员</span>
                <div class="signer-list">
                  <div v-for="m in acceptanceSigners" :key="m.id" class="signer-item">
                    <span class="signer-role">{{ m.role }}</span>
                    <span class="signer-name">{{ m.userName }}</span>
                    <span class="signer-status">✓ 已签字</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="empty-hint">
              联合验收尚未完成，请先完成前序步骤（建组→签责→培训→交底→排查→体检→整改）。
            </div>
          </div>
        </div>

        <!-- ===== 复工令卡片 ===== -->
        <div class="info-card">
          <div class="card-header">
            <h3 class="card-title">复工令</h3>
            <StatusTag :status="detail.order ? 'step_done' : 'step_pending'" />
          </div>
          <div class="card-body">
            <template v-if="detail.order">
              <div class="info-row">
                <span class="info-label">签发人</span>
                <span class="info-value">{{ detail.order.issuedBy }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">签发时间</span>
                <span class="info-value">{{ detail.order.issuedAt }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">签发结论</span>
                <span class="info-value remark-text">{{ detail.order.conclusion }}</span>
              </div>
              <div v-if="detail.order.signatureUrl" class="signature-preview">
                <span class="info-label">电子签名</span>
                <div class="sig-placeholder">📝 签名已上传</div>
              </div>
            </template>
            <div v-else class="empty-hint">
              复工令尚未签发。联合验收通过后，由厂长/总经理签发。
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 前序步骤概览 ===== -->
      <div class="info-card">
        <div class="card-header">
          <h3 class="card-title">前序步骤完成情况</h3>
        </div>
        <div class="card-body">
          <div class="step-checklist">
            <div
              v-for="s in preAcceptanceSteps"
              :key="s.id"
              class="check-item"
              :class="{ done: s.status === 'done', pending: s.status !== 'done' }"
            >
              <span class="check-icon">{{ s.status === 'done' ? '✓' : '○' }}</span>
              <span class="check-label">{{ stepMetaByType(s.stepType)?.label || s.stepType }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 加载/空状态 -->
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
import type { StepType, OrgTeamMember } from '@/types/resumption'
import StatusTag from '@/components/business/StatusTag.vue'

const route = useRoute()
const store = useResumptionStore()
const planId = Number(route.params.id)
const detail = computed(() => store.detail)
const loading = computed(() => store.detailLoading)

// 联合验收步骤（stepOrder = 8）
const acceptanceStep = computed(() => {
  if (!detail.value) return null
  return detail.value.steps.find(s => s.stepType === 'joint-acceptance') || null
})

// 联合验收签字人（车间主任 + 安全员 + 班组长）
const acceptanceSigners = computed<OrgTeamMember[]>(() => {
  if (!detail.value) return []
  return detail.value.team.filter(m =>
    m.positionKey === 'workshop-director' || m.positionKey === 'workshop-safety-officer' || m.positionKey === 'team-leader'
  )
})

// 验收前的前序步骤（stepOrder 1-7）
const preAcceptanceSteps = computed(() => {
  if (!detail.value) return []
  return detail.value.steps.filter(s => s.stepOrder >= 1 && s.stepOrder <= 7)
})

function stepMetaByType(type: StepType) {
  return STEP_META.find(m => m.type === type)
}

onMounted(async () => {
  if (planId) {
    await store.fetchDetail(planId)
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

/* ===== 标题 ===== */
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.page-title {
  font-size: var(--font-h2, 20px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* ===== 内容网格 ===== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 900px) {
  .content-grid { grid-template-columns: 1fr; }
}

/* ===== 信息卡片 ===== */
.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-default);
}
.card-title {
  font-size: var(--font-h3, 18px);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ===== 信息行 ===== */
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

/* ===== 签字人 ===== */
.signers-section {
  margin-top: 4px;
}
.signer-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.signer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-sub-card);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
}
.signer-role {
  color: var(--accent-primary);
  font-weight: 500;
  min-width: 50px;
}
.signer-name {
  color: var(--text-primary);
  flex: 1;
}
.signer-status {
  color: var(--success, #059669);
}

/* ===== 签名预览 ===== */
.signature-preview {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}
.sig-placeholder {
  padding: 8px 12px;
  background: var(--bg-sub-card);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

/* ===== 空状态提示 ===== */
.empty-hint {
  padding: 24px 12px;
  text-align: center;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  line-height: 1.8;
}

/* ===== 前序步骤清单 ===== */
.step-checklist {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}
.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-small, 14px);
}
.check-item.done { color: var(--success, #059669); }
.check-item.pending { color: var(--text-muted); }
.check-icon { font-size: 14px; min-width: 18px; text-align: center; }

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
