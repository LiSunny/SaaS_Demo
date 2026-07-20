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
        <div v-if="detail.team.length" class="team-row">
          <span class="meta-label">小组成员：</span>
          <span v-for="(m, i) in detail.team" :key="m.id" class="team-tag">
            {{ m.role }}·{{ m.userName }}<span v-if="i < detail.team.length - 1">、</span>
          </span>
        </div>
      </div>

      <!-- ===== 阶段进度条（4 阶段） ===== -->
      <div class="stage-card">
        <div class="stage-bar">
          <div
            v-for="(st, si) in STAGES"
            :key="st.key"
            class="stage-node"
            :class="{
              'stage-done': stageState(st) === 'done',
              'stage-active': stageState(st) === 'active',
              'stage-selected': selectedStage === st.key,
              'stage-milestone': st.isMilestone,
            }"
            @click="selectStage(st.key)"
          >
            <div class="stage-circle">
              <span v-if="stageState(st) === 'done'">✓</span>
              <span v-else>{{ si + 1 }}</span>
            </div>
            <div class="stage-label">{{ st.label }}</div>
          </div>
        </div>

        <!-- 阶段内容：左侧步骤导航 + 右侧详情 -->
        <div v-if="currentStageSteps.length" class="stage-content">
          <!-- 左侧步骤导航 -->
          <div class="step-nav">
            <div
              v-for="s in currentStageSteps"
              :key="s.id"
              class="step-nav-item"
              :class="{ 'nav-selected': selectedStepId === s.id }"
              @click="selectedStepId = s.id"
            >
              <span class="nav-num">{{ s.stepOrder }}</span>
              <span class="nav-name">{{ stepMetaByType(s.stepType)?.label }}</span>
              <StatusTag :status="`step_${s.status}`" />
            </div>
          </div>

          <!-- 右侧步骤详情 -->
          <div class="step-detail">
            <template v-if="selectedStep">
              <div class="step-detail-header">
                <div class="step-detail-header-left">
                  <h3 class="step-detail-title">
                    {{ selectedStep.stepOrder }}. {{ stepMetaByType(selectedStep.stepType)?.label }}
                  </h3>
                  <StatusTag :status="`step_${selectedStep.status}`" />
                </div>
                <div v-if="canEdit(selectedStep)" class="step-header-actions">
                  <button v-if="selectedStep.status !== 'done'" class="btn-primary-sm" @click="openEditDialog('done')">
                    标记完成
                  </button>
                  <button v-else class="btn-outline-sm" @click="openEditDialog('edit')">
                    修改
                  </button>
                </div>
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

                <!-- 联合验收 — 签字人员 -->
                <div v-if="selectedStep.stepType === 'joint-acceptance' && selectedStep.status === 'done'" class="signers-section">
                  <span class="info-label">签字人员</span>
                  <div class="signer-list">
                    <div v-for="m in acceptanceSigners" :key="m.id" class="signer-item">
                      <span class="signer-role">{{ m.role }}</span>
                      <span class="signer-name">{{ m.userName }}</span>
                      <span class="signer-status">✓ 已签字</span>
                    </div>
                  </div>
                </div>

                <!-- 签发复工令 — 复工令详情 -->
                <div v-if="selectedStep.stepType === 'issue-order' && detail.order" class="order-section">
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
                </div>
              </div>

              <!-- 附件区 -->
              <div v-if="selectedStep.status !== 'pending'" class="step-attachments">
                <span class="info-label">现场留痕</span>
                <div v-if="selectedStep.attachments.length === 0" class="no-attachments">
                  📷 暂无附件（未上传或已归档）
                </div>
              </div>
            </template>

            <div v-else class="step-empty">
              请点击左侧步骤查看详情
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 加载中/无数据 -->
    <div v-else-if="loading" class="loading-wrap" v-loading="true" style="height:200px" />
    <div v-else class="empty-wrap">
      <p>计划不存在或已被删除</p>
      <button class="btn-link" @click="$router.push('/resumption')">← 返回列表</button>
    </div>

    <!-- ===== 步骤编辑弹窗 ===== -->
    <el-dialog
      v-model="editDialog.visible"
      :title="editDialog.mode === 'done' ? '标记步骤完成' : '修改步骤信息'"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="edit-form">
        <div class="edit-field">
          <label class="edit-label">完成人</label>
          <el-input v-model="editDialog.completedBy" placeholder="请输入完成人姓名" maxlength="20" />
        </div>
        <div class="edit-field">
          <label class="edit-label">操作备注</label>
          <el-input
            v-model="editDialog.remark"
            type="textarea"
            :rows="3"
            placeholder="记录操作摘要、整改情况等"
            maxlength="200"
          />
        </div>
        <div v-if="editDialog.mode === 'edit'" class="edit-field">
          <label class="edit-label">状态</label>
          <el-switch
            v-model="editDialog.keepDone"
            active-text="已完成"
            inactive-text="待执行"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-default" @click="editDialog.visible = false">取消</button>
        <button class="btn-primary" @click="saveStep">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useResumptionStore } from '@/stores/resumption'
import { updateStep } from '@/api/adapters/resumption-dao'
import { STEP_META, STAGES } from '@/types/resumption'
import type { StepType, ResumptionStep, StageDef } from '@/types/resumption'
import StatusTag from '@/components/business/StatusTag.vue'

const route = useRoute()
const store = useResumptionStore()
const detail = computed(() => store.detail)
const loading = computed(() => store.detailLoading)

// 当前选中的阶段和步骤
const selectedStage = ref('prepare')
const selectedStepId = ref<number | null>(null)

const selectedStep = computed(() => {
  if (!detail.value || !selectedStepId.value) return null
  return detail.value.steps.find(s => s.id === selectedStepId.value) || null
})

function stepMetaByType(type: StepType) {
  return STEP_META.find(m => m.type === type)
}

/** 阶段状态 */
function stageState(stage: StageDef): 'done' | 'active' | 'pending' {
  if (!detail.value) return 'pending'
  const steps = detail.value.steps.filter(s => stage.stepOrders.includes(s.stepOrder))
  if (steps.every(s => s.status === 'done')) return 'done'
  if (steps.some(s => s.status === 'done' || s.status === 'in_progress')) return 'active'
  return 'pending'
}

/** 当前选中阶段的子步骤 */
const currentStageSteps = computed(() => {
  if (!detail.value) return []
  const stage = STAGES.find(s => s.key === selectedStage.value)
  if (!stage) return []
  return detail.value.steps.filter(s => stage.stepOrders.includes(s.stepOrder))
})

function selectStage(key: string) {
  selectedStage.value = key
  // 直接从 detail 过滤，不依赖 computed（避免 Vue 惰性求值导致的旧数据）
  const stage = STAGES.find(s => s.key === key)
  const steps = stage && detail.value ? detail.value.steps.filter(s => stage.stepOrders.includes(s.stepOrder)) : []
  if (steps.length) {
    const firstPending = steps.find(s => s.status !== 'done')
    selectedStepId.value = firstPending ? firstPending.id : steps[steps.length - 1].id
  }
}

// 验收签字人
const acceptanceSigners = computed(() => {
  if (!detail.value) return []
  return detail.value.team.filter(m =>
    m.positionKey === 'workshop-director' || m.positionKey === 'workshop-safety-officer' || m.positionKey === 'team-leader'
  )
})

/** 步骤是否可编辑（4 状态分阶段锁定） */
function canEdit(step: ResumptionStep | null): boolean {
  if (!step || !detail.value) return false
  const s = detail.value.status
  if (s === 'prepare') return step.stepOrder <= 8
  if (s === 'review') {
    const firstPending = detail.value.steps.find(st => st.status !== 'done')
    return firstPending ? step.id === firstPending.id : false
  }
  if (s === 'trial') {
    const firstPending = detail.value.steps.find(st => st.status !== 'done')
    return firstPending ? step.id === firstPending.id : false
  }
  // production：全部只读
  return false
}

// 编辑弹窗
const editDialog = reactive({
  visible: false,
  mode: 'done' as 'done' | 'edit',
  stepId: 0,
  completedBy: '',
  remark: '',
  keepDone: true,
})

function openEditDialog(mode: 'done' | 'edit') {
  const s = selectedStep.value
  if (!s) return
  editDialog.mode = mode
  editDialog.stepId = s.id
  editDialog.completedBy = s.completedBy
  editDialog.remark = s.remark
  editDialog.keepDone = s.status === 'done'
  editDialog.visible = true
}

async function saveStep() {
  const status = editDialog.mode === 'done' || editDialog.keepDone ? 'done' as const : 'pending' as const
  const updated = await updateStep(editDialog.stepId, {
    status,
    completedBy: editDialog.completedBy,
    remark: editDialog.remark,
  })
  if (updated && detail.value) {
    await store.fetchDetail(detail.value.id)
  }
  editDialog.visible = false
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (id) {
    await store.fetchDetail(id)
    if (detail.value) {
      // 找到第一个未完成步骤所属的阶段
      const firstPending = detail.value.steps.find(s => s.status !== 'done')
      if (firstPending) {
        const meta = STEP_META.find(m => m.order === firstPending.stepOrder)
        if (meta) selectedStage.value = meta.stage
        selectedStepId.value = firstPending.id
      } else {
        selectedStage.value = 'production'
        const last = detail.value.steps[detail.value.steps.length - 1]
        if (last) selectedStepId.value = last.id
      }
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

/* ===== 阶段卡片 ===== */
.stage-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 阶段进度条 ===== */
.stage-bar {
  display: flex;
  align-items: flex-start;
}
.stage-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  cursor: pointer;
  position: relative;
  padding: 4px 4px 8px;
  border-radius: 8px;
  transition: background .2s;
}
.stage-node:hover {
  background: var(--bg-sub-card);
}
.stage-node::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: var(--border-default);
  z-index: 0;
}
.stage-node:last-child::after { display: none; }
.stage-done::after { background: var(--success, #059669); }
.stage-active::after { background: var(--accent-primary); }

/* 选中态 */
.stage-node.stage-selected {
  background: var(--accent-primary08, rgba(24, 144, 255, 0.08));
}
.stage-node.stage-selected .stage-label {
  color: var(--accent-primary);
  font-weight: 600;
}

.stage-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-h3, 18px);
  font-weight: 700;
  z-index: 1;
  background: var(--bg-sub-card);
  border: 2px solid var(--border-default);
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all .2s;
}
.stage-done .stage-circle {
  background: var(--success, #059669);
  border-color: var(--success, #059669);
  color: #fff;
}
.stage-active .stage-circle {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #fff;
  box-shadow: 0 0 0 4px var(--accent-primary10);
}

/* 关键阶段（复工审核 / 试产观察） */
.stage-milestone .stage-circle {
  border-color: var(--warning, #D97706);
}
.stage-milestone.stage-done .stage-circle {
  background: var(--warning, #D97706);
  border-color: var(--warning, #D97706);
}
.stage-milestone.stage-active .stage-circle {
  background: var(--warning, #D97706);
  border-color: var(--warning, #D97706);
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.2);
}

.stage-label {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
}
.stage-done .stage-label { color: var(--text-muted); }

/* ===== 阶段内容（左导航 + 右详情） ===== */
.stage-content {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-low);
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

/* ===== 左侧步骤导航 ===== */
.step-nav {
  width: 170px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 12px;
  border-right: 1px solid var(--border-low);
  overflow-y: auto;
}
.step-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
}
.step-nav-item:hover { background: var(--bg-sub-card); }
.step-nav-item.nav-selected {
  background: var(--accent-primary08, rgba(24, 144, 255, 0.08));
}
.step-nav-item.nav-selected .nav-name {
  color: var(--accent-primary);
  font-weight: 500;
}
.nav-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: var(--bg-sub-card);
  color: var(--text-muted);
  flex-shrink: 0;
}
.nav-name {
  flex: 1;
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
  white-space: nowrap;
}

/* ===== 右侧步骤详情 ===== */
.step-detail {
  flex: 1;
  padding-left: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.step-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-default);
}
.step-detail-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.step-header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

/* ===== 签字人员 ===== */
.signers-section {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-low);
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

/* ===== 复工令详情 ===== */
.order-section {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--border-low);
  display: flex;
  flex-direction: column;
  gap: 10px;
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

/* ===== 按钮 ===== */
.btn-primary-sm {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 16px; border-radius: 6px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--accent-primary); color: #fff;
  border: none; cursor: pointer; transition: all .2s;
}
.btn-primary-sm:hover { opacity: 0.85; }
.btn-outline-sm {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 16px; border-radius: 6px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer; transition: all .2s;
}
.btn-outline-sm:hover { background: var(--accent-primary10); }

/* ===== 编辑弹窗 ===== */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.edit-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edit-label {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  font-weight: 500;
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
