<template>
  <div class="detail-page">
    <template v-if="detail">
      <!-- ===== 单一父容器 ===== -->
      <div class="detail-container">
        <!-- 顶部操作栏 -->
        <div class="top-bar">
          <button class="btn-back" @click="$router.push('/resumption')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            返回列表
          </button>
          <div class="top-actions">
            <button class="btn-outline-primary" @click="$router.push(`/resumption/${detail.id}`)">
              <AppIcon name="edit" class="btn-add-icon" />编辑
            </button>
            <button class="btn-cancel" @click="handleDelete">
              <AppIcon name="delete" class="btn-add-icon" />删除
            </button>
          </div>
        </div>

        <!-- 摘要卡片 -->
        <div class="summary-card">
          <div class="summary-main">
            <div class="summary-info">
              <div class="summary-title-row">
                <h2 class="summary-title">{{ detail.locationName }}</h2>
                <StatusTag :status="`plan_${detail.status}`" />
              </div>
              <p class="summary-time">开始时间：{{ detail.startedAt || '—' }}</p>
              <p class="summary-time">结束时间：{{ detail.completedAt || '—' }}</p>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-icon-bg"><img :src="unitSvg" class="stat-icon" alt="" /></div>
                <div class="stat-body">
                  <span class="stat-label">排查设备</span>
                  <span class="stat-value">25<span class="stat-unit"> 个</span></span>
                </div>
              </div>
              <div class="stat-group">
                <div class="stat-item">
                  <div class="stat-icon-bg"><img :src="connectSvg" class="stat-icon" alt="" /></div>
                  <div class="stat-body">
                    <span class="stat-label">排查隐患</span>
                    <span class="stat-value">365<span class="stat-unit"> 个</span></span>
                  </div>
                </div>
                <div class="summary-divider-sm"></div>
                <div class="stat-item stat-no-icon">
                  <div class="stat-body">
                    <span class="stat-label">已闭环</span>
                    <span class="stat-value">365<span class="stat-unit"> 个</span></span>
                  </div>
                </div>
                <div class="stat-item stat-no-icon">
                  <div class="stat-body">
                    <span class="stat-label">未闭环</span>
                    <span class="stat-value">365<span class="stat-unit"> 个</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="summary-qr">
            <div class="qr-placeholder">QR</div>
          </div>
        </div>

        <!-- 流程区 -->
        <div class="stage-card">
          <!-- 阶段进度条 -->
          <div class="stage-bar">
            <div class="stage-line stage-line-bg"></div>
            <div class="stage-line stage-line-done" :style="doneLineStyle"></div>
            <div
              v-for="(st, si) in STAGES"
              :key="st.key"
              class="stage-node"
              :class="{
                'stage-done': stageState(st) === 'done',
                'stage-active': stageState(st) === 'active',
                'stage-selected': selectedStage === st.key,
              }"
              @click="selectStage(st.key)"
            >
              <div class="stage-circle">
                <span v-if="stageState(st) === 'done'">✓</span>
                <span v-else>{{ si + 1 }}</span>
              </div>
              <p class="stage-label">{{ st.label }}</p>
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
                @click="switchStep(s.id)"
              >
                <div class="nav-left">
                  <span class="nav-num">{{ s.stepOrder }}</span>
                  <span class="nav-name">{{ stepMetaByType(s.stepType)?.label }}</span>
                </div>
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
                  </div>
                  <div v-if="canEdit(selectedStep)" class="step-header-actions">
                    <template v-if="!editing">
                      <button class="btn-edit-outline" @click="startEdit">
                        {{ selectedStep.status !== 'done' ? '录入' : '编辑' }}
                      </button>
                    </template>
                    <template v-else>
                      <button class="btn-primary-sm" @click="handleSave">保存</button>
                      <button class="btn-outline-sm" @click="handleCancel">取消</button>
                    </template>
                  </div>
                </div>

                <!-- 动态步骤组件 -->
                <component
                  :is="stepComponent"
                  v-if="selectedStep"
                  :key="selectedStep.id"
                  ref="stepCompRef"
                  :step="selectedStep"
                  :editing="editing"
                  :plan-id="detail.id"
                />

                <!-- 特殊展示：联合验收签字 -->
                <div v-if="selectedStep.stepType === 'joint-acceptance' && selectedStep.status === 'done' && !editing" class="signers-section">
                  <span class="info-label">签字人员</span>
                  <div class="signer-list">
                    <div v-for="m in acceptanceSigners" :key="m.id" class="signer-item">
                      <span class="signer-role">{{ m.role }}</span>
                      <span class="signer-name">{{ m.userName }}</span>
                      <span class="signer-status">✓ 已签字</span>
                    </div>
                  </div>
                </div>

                <!-- 特殊展示：签发复工令 -->
                <div v-if="selectedStep.stepType === 'issue-order' && detail.order && !editing" class="order-section">
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
              </template>

              <div v-else class="step-empty">
                请点击左侧步骤查看详情
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, markRaw, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useResumptionStore } from '@/stores/resumption'
import { updateStep, updateTeamMembers } from '@/api/adapters/resumption-dao'
import { STEP_META, STAGES } from '@/types/resumption'
import type { StepType, ResumptionStep, StageDef } from '@/types/resumption'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import unitSvg from '@/assets/unit.svg'
import connectSvg from '@/assets/connect.svg'

import Step1BuildTeam from './steps/Step1BuildTeam.vue'
import Step2SignPledge from './steps/Step2SignPledge.vue'
import Step3SafetyTraining from './steps/Step3SafetyTraining.vue'
import Step4TechDisclosure from './steps/Step4TechDisclosure.vue'
import Step5HazardCheck from './steps/Step5HazardCheck.vue'
import Step6DeviceCheck from './steps/Step6DeviceCheck.vue'
import StepGeneric from './steps/StepGeneric.vue'

const route = useRoute()
const store = useResumptionStore()
const detail = computed(() => store.detail)
const loading = computed(() => store.detailLoading)

const stepComponentMap: Record<StepType, Component> = {
  'build-team': markRaw(Step1BuildTeam),
  'sign-pledge': markRaw(Step2SignPledge),
  'safety-training': markRaw(Step3SafetyTraining),
  'tech-disclosure': markRaw(Step4TechDisclosure),
  'hazard-check': markRaw(Step5HazardCheck),
  'device-check': markRaw(Step6DeviceCheck),
  'rectify': markRaw(StepGeneric),
  'joint-acceptance': markRaw(StepGeneric),
  'issue-order': markRaw(StepGeneric),
  'duty-log': markRaw(StepGeneric),
  'archive': markRaw(StepGeneric),
}

const selectedStage = ref('prepare')
const selectedStepId = ref<number | null>(null)
const editing = ref(false)
const stepCompRef = ref<any>(null)

const selectedStep = computed(() => {
  if (!detail.value || !selectedStepId.value) return null
  return detail.value.steps.find(s => s.id === selectedStepId.value) || null
})

const stepComponent = computed(() => {
  if (!selectedStep.value) return null
  return stepComponentMap[selectedStep.value.stepType] || markRaw(StepGeneric)
})

function stepMetaByType(type: StepType) { return STEP_META.find(m => m.type === type) }

function stageState(stage: StageDef): 'done' | 'active' | 'pending' {
  if (!detail.value) return 'pending'
  const steps = detail.value.steps.filter(s => stage.stepOrders.includes(s.stepOrder))
  if (steps.every(s => s.status === 'done')) return 'done'
  if (steps.some(s => s.status === 'done' || s.status === 'in_progress')) return 'active'
  return 'pending'
}

const currentStageSteps = computed(() => {
  if (!detail.value) return []
  const stage = STAGES.find(s => s.key === selectedStage.value)
  if (!stage) return []
  return detail.value.steps.filter(s => stage.stepOrders.includes(s.stepOrder))
})

function selectStage(key: string) {
  if (editing.value) return
  selectedStage.value = key
  const stage = STAGES.find(s => s.key === key)
  const steps = stage && detail.value ? detail.value.steps.filter(s => stage.stepOrders.includes(s.stepOrder)) : []
  if (steps.length) {
    const firstPending = steps.find(s => s.status !== 'done')
    selectedStepId.value = firstPending ? firstPending.id : steps[steps.length - 1].id
    editing.value = false
  }
}

function switchStep(stepId: number) {
  if (editing.value) return
  selectedStepId.value = stepId
  editing.value = false
}

/** 已完成阶段连线样式（硬编码精确值，停在当前活跃圆心左侧） */
const STAGE_LINE_WIDTHS = ['10%', '34%', '60%'] // 4 阶段时 index 0/1/2 的蓝色宽度
const doneLineStyle = computed(() => {
  const activeIdx = STAGES.findIndex(s => stageState(s) === 'active')
  if (activeIdx === -1) return { left: '0', right: '0' }
  return { width: STAGE_LINE_WIDTHS[activeIdx] || '0%' }
})

const acceptanceSigners = computed(() => {
  if (!detail.value) return []
  return detail.value.team.filter(m =>
    m.positionKey === 'workshop-director' || m.positionKey === 'workshop-safety-officer' || m.positionKey === 'team-leader'
  )
})

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
  return false
}

function handleDelete() {
  ElMessage.info('删除功能 — 待接入')
}

function startEdit() { editing.value = true }

function handleCancel() {
  editing.value = false
  if (stepCompRef.value?.handleCancel) stepCompRef.value.handleCancel()
}

async function handleSave() {
  const comp = stepCompRef.value
  if (!comp?.getSaveData || !selectedStep.value || !detail.value) return
  const data = comp.getSaveData()
  if (selectedStep.value.stepType === 'build-team' && data.teamMembers) {
    await updateTeamMembers(detail.value.id, data.teamMembers)
    delete data.teamMembers
  }
  await updateStep(selectedStep.value.id, {
    status: data.status, completedBy: data.completedBy,
    remark: data.remark, formData: data.formData,
  })
  await store.fetchDetail(detail.value.id)
  if (detail.value) {
    const steps = detail.value.steps.filter(s => {
      const stage = STAGES.find(st => st.key === selectedStage.value)
      return stage ? stage.stepOrders.includes(s.stepOrder) : false
    })
    const firstPending = steps.find(s => s.status !== 'done')
    if (firstPending) selectedStepId.value = firstPending.id
  }
  editing.value = false
  ElMessage.success('保存成功')
}

async function loadPlan(id: number) {
  await store.fetchDetail(id)
  if (detail.value) {
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
  editing.value = false
}

onMounted(() => {
  const id = Number(route.params.id)
  if (id) loadPlan(id)
})

watch(() => route.params.id, (newId) => {
  if (newId) loadPlan(Number(newId))
})
</script>

<style scoped>
/* ===== 页面 ===== */
.detail-page { height: 100%; }

/* ===== 父容器（与列表页 .content-card 一致） ===== */
.detail-container {
  background: var(--bg-card, #fbfbfb); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  gap: var(--spacing-lg, 12px); height: 100%; overflow: hidden;
}

/* ===== 顶部操作栏 ===== */
.top-bar { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.top-actions { display: flex; gap: 10px; }

.btn-back {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: var(--radius-md, 8px); border: none;
  background: transparent; color: var(--accent-primary, #3678e3);
  font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer;
}
.btn-back:hover { background: var(--accent-primary08); }

/* 描边按钮（复用项目标准） */
.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s; font-family: inherit;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

.btn-cancel {
  display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; height: 37px;
  border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; background: rgba(220, 38, 38, 0.1);
  color: var(--semantic-danger, #DC2626); font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
}
.btn-cancel:hover { opacity: 0.8; }

/* ===== 摘要卡片 ===== */
.summary-card {
  background: var(--bg-sub-card, #fff); border: 1px solid var(--border-default, #dedede);
  border-radius: var(--radius-md, 8px); padding: var(--spacing-lg, 12px);
  flex-shrink: 0; display: flex; align-items: center; gap: 24px;
}
.summary-main { display: flex; align-items: center; gap: 24px; flex: 1; min-width: 0; }
.summary-info { display: flex; flex-direction: column; gap: 4px; min-width: 320px; width: 420px; flex-shrink: 0; }
.summary-title-row { display: flex; align-items: center; justify-content: space-between; }
.summary-title { font-size: var(--font-h2, 20px); font-weight: 500; color: var(--text-primary, #101010); margin: 0; white-space: nowrap; }
.summary-time { font-size: var(--font-small, 14px); color: var(--text-tertiary, #454545); margin: 0; line-height: 1.6; }

.summary-divider { width: 0; height: 78px; border-left: 1px solid var(--border-low, #e5e7eb); flex-shrink: 0; }
.summary-divider-sm { width: 0; height: 78px; border-left: 1px solid var(--border-low, #e5e7eb); flex-shrink: 0; }

.summary-stats { display: flex; align-items: center; gap: 0; flex: 1; min-width: 0; }
.stat-item { display: flex; align-items: center; gap: 18px; padding: 0 18px; flex-shrink: 0; }
.stat-item.stat-no-icon { gap: 0; }

.stat-group { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
.stat-group .stat-item { padding: 0 18px; }

.stat-icon-bg {
  width: 56px; height: 56px; border-radius: var(--radius-md, 8px);
  background: var(--info-bg);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-icon { width: 36px; height: 36px; }
.stat-body { display: flex; flex-direction: column; gap: 8px; width: 80px; flex-shrink: 0; }
.stat-label { font-size: var(--font-body, 16px); color: var(--text-secondary, #2e2e2e); }
.stat-value { font-size: 24px; font-weight: 500; color: var(--text-primary, #101010); }
.stat-unit { font-size: var(--font-body, 16px); font-weight: 500; color: var(--text-tertiary, #454545); }

.summary-qr { flex-shrink: 0; }
.qr-placeholder {
  width: 78px; height: 78px; border: 1px solid #e5e7eb; border-radius: 4px;
  background: var(--bg-card, #fff); display: flex; align-items: center;
  justify-content: center; font-size: 14px; font-weight: 500; color: var(--text-muted);
}

/* ===== 阶段卡片（流程区）===== */
.stage-card {
  background: var(--bg-sub-card, #fff); border: 1px solid var(--border-default, #dedede);
  border-radius: var(--radius-md, 8px); padding: var(--spacing-lg, 12px);
  flex: 1; display: flex; flex-direction: column; gap: 24px; overflow: hidden;
}

/* ===== 阶段进度条 ===== */
.stage-bar { display: flex; align-items: flex-start; position: relative; padding-top: 4px; }
.stage-node {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  flex: 1; cursor: pointer;
  padding: 4px 4px 8px; border-radius: var(--radius-md, 8px);
}
/* 连线：z-index: -1 确保在圆环下方 */
/* 连线：两层 — 底层虚线 + 上层已完成实线 */
.stage-line {
  position: absolute; top: 28px; left: 20px; right: 20px;
  height: 2px; z-index: 0;
}
.stage-line-bg {
  border-top: 2px dashed var(--border-default, #dedede);
}
.stage-line-done {
  background: var(--accent-primary, #3678e3);
}

.stage-circle {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--font-body, 16px); font-weight: 500;
  position: relative; z-index: 1;
  background: var(--bg-sub-card, #fff);
  border: 2px solid var(--border-default, #dedede);
  color: var(--text-muted, #5e5e5e); flex-shrink: 0; transition: all .2s;
}
.stage-done .stage-circle {
  background: var(--success, #059669); border-color: var(--success, #059669); color: #fff;
}
.stage-active .stage-circle {
  background: var(--accent-primary, #3678e3); border-color: var(--accent-primary, #3678e3);
  color: #fff;
}

.stage-active .stage-circle::before,
.stage-active .stage-circle::after {
  content: ''; position: absolute; inset: -2px; border-radius: 50%;
  border: 2px solid var(--accent-primary, #3678e3);
  animation: stage-ripple 2s ease-out infinite;
}
.stage-active .stage-circle::after { animation-delay: 1s; }

@keyframes stage-ripple {
  0% { transform: scale(1); opacity: .5; }
  100% { transform: scale(1.8); opacity: 0; }
}

.stage-label { font-size: var(--font-small, 14px); color: var(--text-muted, #5e5e5e); text-align: center; font-weight: 500; margin: 0; }
.stage-done .stage-label { color: var(--text-muted); }
.stage-active .stage-label,
.stage-selected .stage-label { color: var(--accent-primary, #3678e3); }

/* ===== 阶段内容 ===== */
.stage-content { display: flex; gap: 0; flex: 1; overflow: hidden; }

/* ===== 左侧步骤导航 ===== */
.step-nav {
  width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 2px;
  overflow-y: auto; padding: 6px 0;
}
.step-nav-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px var(--spacing-xl, 16px); border-radius: 6px;
  cursor: pointer; transition: background .15s;
}
.step-nav-item:hover { background: var(--bg-card-hover, rgba(147,147,147,0.05)); }
.step-nav-item.nav-selected {
  background: var(--bg-page, #f0f1f6);
  border-radius: 6px 0 0 6px;
}
.step-nav-item.nav-selected .nav-num {
  background: var(--accent-primary06, rgba(54,120,227,0.05)); color: var(--accent-primary, #3678e3);
}
.step-nav-item.nav-selected .nav-name { color: var(--accent-primary, #3778e3); }

.nav-left { display: flex; align-items: center; gap: 8px; flex: 1 0 0; min-width: 0; }
.nav-num {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 500; background: var(--bg-card, #fbfbfb);
  color: var(--text-muted, #5e5e5e); flex-shrink: 0;
}
.nav-name { flex: 1 0 0; min-width: 0; font-size: var(--font-body, 16px); color: var(--text-primary, #101010); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== 右侧步骤详情 ===== */
.step-detail {
  flex: 1; padding: var(--spacing-xl, 16px); overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--spacing-lg, 12px);
  background: var(--bg-page, #f0f1f6); border-radius: var(--radius-md, 8px); margin-left: 0;
}
.step-detail-header {
  display: flex; align-items: center; justify-content: space-between;
  padding-bottom: 12px; border-bottom: 1px solid #e9e9e9;
  height: 50px; box-sizing: border-box;
}
.step-detail-header-left { display: flex; align-items: center; gap: 12px; }
.step-header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.step-detail-title {
  font-size: var(--font-body, 16px); font-weight: 500; color: var(--text-primary, #101010); margin: 0;
}

.step-empty {
  display: flex; align-items: center; justify-content: center;
  height: 100%; min-height: 160px; color: var(--text-muted);
  font-size: var(--font-body, 16px);
}

/* ===== 步骤内详情标签/值 ===== */
.step-detail :deep(.info-label) { color: var(--text-muted, #5e5e5e); }
.step-detail :deep(.info-value) { color: var(--text-secondary, #2e2e2e); font-weight: 500; }

/* ===== 按钮 ===== */
.btn-edit-outline {
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px; padding: 0 16px; border-radius: var(--radius-md, 8px);
  border: 1px solid var(--accent-primary, #3678e3);
  background: var(--accent-primary06, rgba(54,120,227,0.05));
  color: var(--accent-primary, #3678e3);
  font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; min-width: 65px;
}
.btn-edit-outline:hover { background: var(--accent-primary10); }

.btn-primary-sm {
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px; padding: 0 16px; border-radius: var(--radius-md, 8px);
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--accent-primary, #3678e3); color: #fff;
  border: none; cursor: pointer; font-family: inherit; min-width: 65px;
}
.btn-primary-sm:hover { opacity: 0.85; }

.btn-outline-sm {
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px; padding: 0 16px; border-radius: var(--radius-md, 8px);
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--accent-primary06, rgba(54,120,227,0.05));
  color: var(--accent-primary, #3678e3);
  border: 1px solid var(--accent-primary, #3678e3);
  cursor: pointer; font-family: inherit; min-width: 65px;
}
.btn-outline-sm:hover { background: var(--accent-primary10); }

/* ===== 签字人员 ===== */
.signers-section { margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--border-low); }
.signer-list { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
.signer-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: var(--bg-sub-card); border-radius: var(--radius-sm, 6px); font-size: var(--font-small, 14px);
}
.signer-role { color: var(--accent-primary); font-weight: 500; min-width: 50px; }
.signer-name { color: var(--text-primary); flex: 1; }
.signer-status { color: var(--success, #059669); }

/* ===== 复工令详情 ===== */
.order-section { margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--border-low); display: flex; flex-direction: column; gap: 10px; }
.info-row { display: flex; gap: 12px; }
.info-label { font-size: var(--font-body, 16px); color: var(--text-muted, #5e5e5e); min-width: 70px; flex-shrink: 0; font-weight: 400; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-secondary, #2e2e2e); font-weight: 500; }
.remark-text { line-height: 1.6; color: var(--text-secondary); }

.loading-wrap, .empty-wrap {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 48px; color: var(--text-secondary); font-size: var(--font-body, 16px);
}
</style>
