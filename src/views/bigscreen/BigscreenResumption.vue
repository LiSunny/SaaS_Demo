<template>
  <div class="bigscreen resumption-bigscreen">
    <!-- ===== 装饰层（z-index:0, pointer-events:none） ===== -->
    <img class="side-deco side-deco-left" src="@/assets/bigscreen/resumption/side-deco-left.svg" alt="" />
    <img class="side-bar side-bar-left" src="@/assets/bigscreen/resumption/side-bar.svg" alt="" />
    <img class="side-deco side-deco-right" src="@/assets/bigscreen/resumption/side-deco-right.svg" alt="" />
    <img class="side-bar side-bar-right" src="@/assets/bigscreen/resumption/side-bar-right.svg" alt="" />
    <img class="deco-center-bar" src="@/assets/bigscreen/resumption/center-bar.svg" alt="" />
    <div class="rb-top-deco">
      <img class="deco-banner deco-banner-left" src="@/assets/bigscreen/resumption/header-banner-left.svg" alt="" />
      <img class="deco-banner deco-banner-right" src="@/assets/bigscreen/resumption/header-banner-right.svg" alt="" />
      <img class="deco-corner deco-corner-left" src="@/assets/bigscreen/resumption/header-corner.svg" alt="" />
      <img class="deco-corner deco-corner-right" src="@/assets/bigscreen/resumption/header-corner.svg" alt="" />
      <img class="deco-star deco-star-left" src="@/assets/bigscreen/resumption/header-star.svg" alt="" />
      <img class="deco-star deco-star-right" src="@/assets/bigscreen/resumption/header-star.svg" alt="" />
      <div class="deco-dots deco-dots-left">
        <span class="deco-dot dot-1" /><span class="deco-dot dot-2" /><span class="deco-dot dot-3" />
      </div>
      <div class="deco-dots deco-dots-right">
        <span class="deco-dot dot-1" /><span class="deco-dot dot-2" /><span class="deco-dot dot-3" />
      </div>
    </div>

    <!-- ===== 标题区 ===== -->
    <div class="rb-header">
      <span class="rb-time">{{ currentTime }}</span>
      <h1 class="rb-title">复工复产可视化大屏</h1>
    </div>

    <!-- ===== KPI 指标栏 ===== -->
    <div class="rb-kpi-bar">
      <template v-for="(kpi, i) in kpiList" :key="kpi.label">
        <div class="rb-kpi-item">
          <div class="rb-kpi-icon">
            <img class="rb-kpi-icon-bg" src="@/assets/bigscreen/resumption/kpi/icon-bg.svg" alt="" />
            <img class="rb-kpi-icon-fg" :src="kpi.icon" alt="" />
          </div>
          <div class="rb-kpi-text">
            <span class="rb-kpi-value">{{ kpi.value }}</span>
            <span class="rb-kpi-label">{{ kpi.label }}</span>
          </div>
        </div>
        <div v-if="i < kpiList.length - 1" class="rb-kpi-divider" />
      </template>
    </div>

    <!-- ===== 主内容区 ===== -->
    <div class="rb-content">
      <div class="rb-col-left">
        <ResumptionSectionCard title="复工复产一张图" class="rb-factory-card">
          <div class="rb-factory-panel">
            <img class="rb-factory-bg" src="@/assets/bigscreen/resumption/factory-bg.png" alt="工厂概览" />
            <div
              v-for="(plan, idx) in plans"
              :key="plan.id"
              class="rb-factory-marker"
              :class="[{ 'rb-marker-selected': plan.id === selectedPlanId }, `rb-label-${labelSide(idx)}`]"
              :style="dotStyle(idx)"
              @click="selectedPlanId = plan.id"
            >
              <span class="rb-factory-dot" :class="`dot-${plan.status}`" />
              <span class="rb-dot-label" :class="`dot-label-${plan.status}`">
                {{ plan.locationName }}<span class="rb-dot-label-div">·</span>{{ statusLabel(plan.status) }}
              </span>
            </div>
            <!-- 图例 -->
            <div class="rb-factory-legend">
              <span class="rb-legend-item"><i class="rb-legend-dot dot-prepare" />复工准备</span>
              <span class="rb-legend-item"><i class="rb-legend-dot dot-review" />复工审核</span>
              <span class="rb-legend-item"><i class="rb-legend-dot dot-trial" />试产观察</span>
              <span class="rb-legend-item"><i class="rb-legend-dot dot-production" />已复产</span>
            </div>
            <div class="rb-factory-overlay">
              <span class="rb-factory-name">复工复产实时动态</span>
              <span class="rb-factory-live">● LIVE</span>
            </div>
          </div>
        </ResumptionSectionCard>
        <ResumptionSectionCard title="场所列表" class="rb-place-list">
          <div class="rb-workshop-cards">
            <div
              v-for="ws in workshopData"
              :key="ws.id"
              class="rb-ws-clickable"
              @click="selectedPlanId = ws.id"
            >
              <WorkshopStatusCard
                :name="ws.name" :leader="ws.leader" :date="ws.date"
                :status="ws.status" :progress="ws.progress" :warnings="ws.warnings"
                :selected="ws.id === selectedPlanId"
              />
            </div>
          </div>
        </ResumptionSectionCard>
      </div>
      <div class="rb-col-right">
        <ResumptionSectionCard title="场所详情" class="rb-place-detail">
          <template v-if="selectedPlan">
            <!-- 场所信息 -->
            <div class="pd-section">
              <h4 class="pd-subtitle">场所信息</h4>
              <div class="pd-info-grid">
                <div class="pd-info-cell">
                  <span class="pd-info-label">场所名称</span>
                  <span class="pd-info-value">{{ selectedPlan.locationName }}</span>
                </div>
                <div class="pd-info-cell">
                  <span class="pd-info-label">当前状态</span>
                  <span class="pd-info-value">
                    <span class="pd-status-tag" :class="`pd-${selectedPlan.status}`">
                      {{ statusLabel(selectedPlan.status) }}
                    </span>
                  </span>
                </div>
                <div class="pd-info-cell">
                  <span class="pd-info-label">负责人</span>
                  <span class="pd-info-value">{{ selectedPlan.team?.find(t => t.role === '组长')?.userName || '—' }}</span>
                </div>
                <div class="pd-info-cell">
                  <span class="pd-info-label">开始时间</span>
                  <span class="pd-info-value">{{ selectedPlan.startedAt || selectedPlan.createdAt?.slice(0, 10) || '—' }}</span>
                </div>
              </div>
            </div>
            <!-- 核心指标 -->
            <div class="pd-section">
              <h4 class="pd-subtitle">核心指标</h4>
              <div class="pd-metrics">
                <div class="pd-metric pd-metric-warn">
                  <span class="pd-metric-value">{{ planMetrics(selectedPlan).abnormalDevices }}</span>
                  <span class="pd-metric-label">异常设备数</span>
                </div>
                <div class="pd-metric pd-metric-danger">
                  <span class="pd-metric-value">{{ planMetrics(selectedPlan).unclosedHazards }}</span>
                  <span class="pd-metric-label">未闭环隐患数</span>
                </div>
                <div class="pd-metric pd-metric-primary">
                  <span class="pd-metric-value">{{ planMetrics(selectedPlan).progress }}%</span>
                  <span class="pd-metric-label">复产进度</span>
                </div>
              </div>
            </div>
            <!-- 复产详情：时间线（撑满剩余空间） -->
            <div class="pd-section pd-section-fill">
              <h4 class="pd-subtitle">复产详情</h4>
              <div class="pd-timeline">
                <template v-for="(stage, si) in STAGES" :key="stage.key">
                  <!-- 阶段头（可折叠） -->
                  <div class="ptl-stage-head" :class="{ 'ptl-stage-collapsed': !expandedStages.has(stage.key) }" @click="toggleStage(stage.key)">
                    <span class="ptl-stage-arrow" :class="{ 'ptl-arrow-open': expandedStages.has(stage.key) }">▶</span>
                    <span class="ptl-stage-label">{{ stage.label }}</span>
                    <span class="ptl-stage-sub">（{{ stage.stepOrders.length }} 步）</span>
                  </div>
                  <!-- 时间线节点 -->
                  <template v-if="expandedStages.has(stage.key)">
                    <template v-for="(order, i) in stage.stepOrders" :key="order">
                      <div
                        class="ptl-node"
                        :class="[
                          `ptl-${planStepStatus(selectedPlan, order)}`,
                          { 'ptl-active': selectedStepOrder === order }
                        ]"
                        @click="toggleStepDetail(order)"
                      >
                        <div class="ptl-line-area">
                          <span class="ptl-dot-node" />
                          <span v-if="i < stage.stepOrders.length - 1 || si < STAGES.length - 1" class="ptl-line" />
                        </div>
                        <div class="ptl-body">
                          <span class="ptl-order">{{ order }}.</span>
                          <span class="ptl-name">{{ planStepLabel(order) }}</span>
                          <span class="ptl-executor">{{ planStepExecutor(order) }}</span>
                          <span class="ptl-status-tag" :class="`ptl-tag-${planStepStatus(selectedPlan, order)}`">
                            {{ stepStatusLabel(planStepStatus(selectedPlan, order)) }}
                          </span>
                        </div>
                      </div>
                      <!-- 行内步骤详情 -->
                      <div v-if="selectedStepOrder === order && selectedStep" class="ptl-detail-inline">
                        <div class="ptl-detail-row">
                          <span class="ptl-detail-k">执行人</span>
                          <span class="ptl-detail-v">{{ planStepExecutor(order) }}</span>
                        </div>
                        <div class="ptl-detail-row">
                          <span class="ptl-detail-k">完成时间</span>
                          <span class="ptl-detail-v">{{ selectedStep.completedAt || '—' }}</span>
                        </div>
                        <div v-if="selectedStep.remark" class="ptl-detail-row">
                          <span class="ptl-detail-k">备注</span>
                          <span class="ptl-detail-v">{{ selectedStep.remark }}</span>
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </div>
            </div>
          </template>
          <div v-else class="pd-empty">
            <p>请选择车间</p>
          </div>
        </ResumptionSectionCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { ResumptionPlan, PlanStatus } from '@/types/resumption'
import { STAGES, STEP_META } from '@/types/resumption'
import { getAllPlansWithDetails } from '@/api/adapters/resumption-dao'
import WorkshopStatusCard from './components/resumption/WorkshopStatusCard.vue'
import ResumptionSectionCard from './components/resumption/ResumptionSectionCard.vue'

// ===== 时钟 =====
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    + ' ' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// ===== 数据加载 =====
const plans = ref<ResumptionPlan[]>([])

// ===== 选中车间 =====
const selectedPlanId = ref<number>(0)
const selectedPlan = computed(() => plans.value.find(p => p.id === selectedPlanId.value))

// ===== 阶段折叠（智能默认展开含进行中步骤的阶段） =====
function defaultExpandedStage(): string {
  if (!selectedPlan.value) return STAGES[0].key
  const inProgress = selectedPlan.value.steps?.find(s => s.status === 'in_progress')
  if (inProgress) return STEP_META.find(m => m.order === inProgress.stepOrder)?.stage || STAGES[0].key
  const firstPending = selectedPlan.value.steps?.find(s => s.status === 'pending')
  if (firstPending) return STEP_META.find(m => m.order === firstPending.stepOrder)?.stage || STAGES[0].key
  return STAGES[STAGES.length - 1].key // 全部完成 → 展开最后一阶段
}

const expandedStages = ref(new Set<string>([defaultExpandedStage()]))

function toggleStage(key: string) {
  if (expandedStages.value.has(key)) {
    expandedStages.value.delete(key)
  } else {
    expandedStages.value.add(key)
  }
  expandedStages.value = new Set(expandedStages.value)
}

// 切换车间时重新计算默认展开阶段
watch(selectedPlanId, () => {
  expandedStages.value = new Set([defaultExpandedStage()])
  selectedStepOrder.value = 0
})

// ===== 选中步骤（行内展开/收起） =====
const selectedStepOrder = ref<number>(0)
const selectedStep = computed(() =>
  selectedPlan.value?.steps?.find(s => s.stepOrder === selectedStepOrder.value)
)

function toggleStepDetail(order: number) {
  selectedStepOrder.value = selectedStepOrder.value === order ? 0 : order
}

onMounted(async () => {
  try {
    plans.value = await getAllPlansWithDetails()
    if (plans.value.length) selectedPlanId.value = plans.value[0].id
  } catch { /* mock 降级 */ }
})

// ===== 步骤状态展示 =====
function stepStatusLabel(s: string) {
  if (s === 'done') return '已完成'
  if (s === 'in_progress') return '进行中'
  return '待处理'
}

// ===== KPI 指标计算 =====
const kpiList = computed(() => {
  const total = plans.value.length
  const resumed = plans.value.filter(p => p.status === 'production').length
  const notResumed = total - resumed
  const rate = total > 0 ? Math.round((resumed / total) * 100) : 0

  let unclosedHazards = 0
  for (const plan of plans.value) {
    const hazardStep = plan.steps?.find(s => s.stepType === 'hazard-check')
    const hazards = hazardStep?.formData?.hazards || []
    unclosedHazards += hazards.filter((h: any) => h.status !== 'archived').length
  }

  let abnormalDevices = 0
  for (const plan of plans.value) {
    const deviceStep = plan.steps?.find(s => s.stepType === 'device-check')
    const devices = deviceStep?.formData?.devices || []
    abnormalDevices += devices.filter((d: any) => d.result === 'needs_repair' || d.result === 'disabled').length
  }

  const iconServer = new URL('@/assets/bigscreen/resumption/kpi/icon-server.svg', import.meta.url).href
  return [
    { label: '车间总数', value: total, icon: iconServer },
    { label: '已复工车间', value: resumed, icon: iconServer },
    { label: '未复工车间', value: notResumed, icon: iconServer },
    { label: '复工率', value: rate + '%', icon: iconServer },
    { label: '未闭环隐患', value: unclosedHazards, icon: iconServer },
    { label: '异常设备', value: abnormalDevices, icon: iconServer },
  ]
})

// ===== 车间卡片数据 =====
interface WorkshopData {
  id: number; name: string; leader: string; date: string
  status: PlanStatus; progress: number; warnings: string[]
}

const workshopData = computed<WorkshopData[]>(() => {
  return plans.value.map(plan => {
    const teamLeader = plan.team?.find(t => t.role === '组长')
    const leader = teamLeader?.userName || '—'
    const totalSteps = plan.steps?.length || 11
    const doneSteps = plan.steps?.filter(s => s.status === 'done').length || 0
    const progress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0
    const date = plan.startedAt || plan.createdAt?.slice(0, 10) || '—'

    const warnings: string[] = []
    const deviceStep = plan.steps?.find(s => s.stepType === 'device-check')
    const devices = deviceStep?.formData?.devices || []
    const badDevices = devices.filter((d: any) => d.result === 'needs_repair' || d.result === 'disabled')
    if (badDevices.length > 0) warnings.push(`${badDevices.length}台设备异常`)

    const hazardStep = plan.steps?.find(s => s.stepType === 'hazard-check')
    const hazards = hazardStep?.formData?.hazards || []
    const unclosed = hazards.filter((h: any) => h.status !== 'archived')
    if (unclosed.length > 0) warnings.push(`${unclosed.length}处未闭环隐患`)

    return { id: plan.id, name: plan.locationName, leader, date, status: plan.status, progress, warnings }
  })
})

const statusLabelMap: Record<string, string> = {
  prepare: '复工准备', review: '复工审核', trial: '试产观察', production: '正式复产',
}
function statusLabel(s: string) { return statusLabelMap[s] || s }

// ===== 单个车间指标 =====
function planMetrics(plan: ResumptionPlan) {
  const steps = plan.steps || []
  const total = 11
  const done = steps.filter(s => s.status === 'done').length

  const deviceStep = steps.find(s => s.stepType === 'device-check')
  const devices = deviceStep?.formData?.devices || []
  const abnormalDevices = devices.filter((d: any) => d.result === 'needs_repair' || d.result === 'disabled').length

  const hazardStep = steps.find(s => s.stepType === 'hazard-check')
  const hazards = hazardStep?.formData?.hazards || []
  const unclosedHazards = hazards.filter((h: any) => h.status !== 'archived').length

  return {
    progress: Math.round((done / total) * 100),
    abnormalDevices,
    unclosedHazards,
  }
}

// ===== 步骤状态 & 标签 =====
function planStepStatus(plan: ResumptionPlan, order: number): string {
  const step = plan.steps?.find(s => s.stepOrder === order)
  return step?.status || 'pending'
}

function planStepLabel(order: number): string {
  return STEP_META.find(m => m.order === order)?.label || `步骤${order}`
}

function planStepExecutor(order: number): string {
  return STEP_META.find(m => m.order === order)?.executor || '—'
}

// 工厂图点位坐标（%），按 plans 数组顺序一一对应。直接改数值即可调位置
const dotPositions = [
  { left: 27, top: 34},  // 计划 1 — 冲压车间
  { left: 52, top: 24},  // 计划 2 — 喷涂车间
  { left: 55, top: 50 },  // 计划 3 — 组装车间
  { left: 68, top: 28 },  // 计划 4 — 锅炉房
]
function dotStyle(idx: number) {
  const pos = dotPositions[idx] || dotPositions[0]
  return { left: pos.left + '%', top: pos.top + '%' }
}
// 点位靠右时标签翻到左侧，避免溢出
function labelSide(idx: number): 'left' | 'right' {
  const pos = dotPositions[idx] || dotPositions[0]
  return pos.left > 55 ? 'left' : 'right'
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ================================================
   页面容器：flex 列布局，确保一屏完整显示
   ================================================ */
.resumption-bigscreen {
  /* 文字层级令牌 */
  --text-primary: rgba(212, 234, 255, 0.92);    // 主文字、关键信息
  --text-secondary: rgba(212, 234, 255, 0.68);  // 标签、辅助说明
  --text-tertiary: rgba(212, 234, 255, 0.48);   // 序号、元数据、提示

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(50% 50% at 50% 50%, #0842A2 0%, #012458 100%);
  color: var(--text-secondary);
  overflow: hidden;
  font-family: 'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ================================================
   装饰层 — 全部 absolute + z-index:0 + pointer-events:none
   ================================================ */

/* 侧边大面积装饰：从标题横线下方延伸到底部（Figma: 947×1066.5 at x=13 y≈75） */
.side-deco {
  position: absolute;
  top: vh(75);
  bottom: 0;
  height: calc(100vh - vh(75));
  width: vw(947);
  pointer-events: none;
  z-index: 0;
}
.side-deco-left  { left: vw(13); }
.side-deco-right { right: vw(13); transform: scaleX(-1); }

/* 侧边竖条（Figma: 28×696 at x=14 y=192） */
.side-bar {
  position: absolute;
  top: vh(192);
  width: vw(28);
  height: vh(696);
  pointer-events: none;
  z-index: 0;
}
.side-bar-left  { left: vw(14); }
.side-bar-right { right: vw(14); transform: scaleX(-1); }

/* 标题下方装饰横线（Figma: 259×5 at x=828 y=70） */
.deco-center-bar {
  position: absolute;
  top: vh(70);
  left: 50%;
  transform: translateX(-50%);
  height: vh(5);
  width: vw(259);
  pointer-events: none;
  z-index: 3;
  opacity: 0.95;
}

/* 顶部装饰组（Figma: y=0 h=84） */
.rb-top-deco {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: vh(84);
  pointer-events: none;
  z-index: 0;
}

.deco-banner {
  position: absolute;
  top: 0;
  height: vh(61);
  width: 50.05vw;
}
.deco-banner-left  { left: 0; }
.deco-banner-right { left: 49.95vw; transform: scaleX(-1); }

.deco-corner {
  position: absolute;
  top: 0;
  height: vh(84);
  width: vw(352);
}
.deco-corner-left  { left: vw(608); }
.deco-corner-right { left: vw(960); transform: scaleX(-1); }

.deco-star {
  position: absolute;
  top: vh(20);
  height: vh(8);
  width: vw(61);
  opacity: 0.4;
}
.deco-star-left  { left: vw(515); }
.deco-star-right { right: vw(515); transform: scaleX(-1); }

.deco-dots {
  position: absolute;
  top: vh(68);
  display: flex;
  gap: vw(8);
  opacity: 0.5;
}
.deco-dots-left  { left: vw(576); }
.deco-dots-right { right: vw(576); flex-direction: row-reverse; }

.deco-dot {
  width: vw(20);
  height: vh(4);
  border-radius: 1px;
  &.dot-1 { background: #f0fce1; }
  &.dot-2 { background: #ebffcf; }
  &.dot-3 { background: #d9ffa5; }
}

/* ================================================
   标题区 — flex-shrink:0, 与顶部装饰间距 vh(9)
   ================================================ */
.rb-header {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: vh(9);
}

.rb-time {
  position: absolute;
  right: vw(24);
  top: vh(20);
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.rb-title {
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(24px, calc(36 * var(--min-scale)), 40px);
  font-weight: 400;
  background: linear-gradient(to bottom, #e5f2ff 0%, #b0cdff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 vh(4) vw(8) rgba(0, 45, 122, 0.47);
  line-height: 1.2;
  letter-spacing: vw(4);
}

/* ================================================
   KPI 指标栏 — flex-shrink:0
   Figma: y=115, w=1766, 左右居中
   ================================================ */
.rb-kpi-bar {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin: vh(52) auto 0;
  width: vw(1766);
  background: #00336A;
  border: 1px solid #1565A4;
  border-radius: 4px;
  padding: vh(16) vw(12);
  gap: vw(37);
  box-shadow: inset 0 vh(1) vw(12) 0 rgba(4, 151, 253, 0.44);
}

.rb-kpi-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: vw(12);
  min-width: 0;
}

.rb-kpi-icon {
  position: relative;
  flex-shrink: 0;
  width: vw(56);
  height: vw(56);
}

.rb-kpi-icon-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rb-kpi-icon-fg {
  position: absolute;
  left: 50%;
  top: 38%;
  transform: translate(-50%, -50%);
  width: vw(26);
  height: vw(26);
}

.rb-kpi-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  flex-shrink: 0;
}

.rb-kpi-value {
  font-family: 'Douyin Sans', 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(22px, calc(28 * var(--min-scale)), 32px);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.rb-kpi-label {
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #ffffff;
  line-height: 1.3;
  white-space: nowrap;
}

.rb-kpi-divider {
  width: 1px;
  height: vh(56);
  flex-shrink: 0;
  background: #004671;
}

/* ================================================
   主内容区 — flex:1 + min-height:0 自适应填充
   Figma: y=249, 到 y=1017（右侧面板底部）
   底部 padding 为底部装饰(17px) + 安全间距留白
   左右 margin 对应 Figma 的 (1920-1766)/2 = 77px
   ================================================ */
.rb-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  margin: vh(24) auto vh(38);
  width: vw(1766);
  gap: vw(16);
  overflow: hidden;
}

/* 左侧列 (Figma: 1122px) */
.rb-col-left {
  display: flex;
  flex-direction: column;
  gap: vh(16);
  width: vw(1122);
  flex-shrink: 0;
  min-height: 0;
}

/* 左侧卡片：工厂图 flex:1 撑满，场所列表 auto */
.rb-factory-card {
  flex: 1;
  min-height: 0;

  :deep(.rm-card-body) {
    display: flex;
    flex-direction: column;
    padding: 0;
  }
}

.rb-place-list {
  flex-shrink: 0;

  :deep(.rm-card-body) {
    padding: vh(16) 0;
  }
}

/* 右侧列 (Figma: 620px) */
.rb-col-right {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

/* 场所详情模块 */
.rb-place-detail {
  flex: 1;
  min-height: 0;

  :deep(.rm-card-body) {
    display: flex;
    flex-direction: column;
    padding: vh(16) 0;
    overflow: hidden;
  }
}

/* 子区块 */
.pd-section {
  padding-left: vw(16);
  padding-right: vw(16);

  & + & {
    margin-top: vh(14);
    padding-top: vh(14);
    border-top: 1px solid rgba(21, 101, 164, 0.3);
  }

  /* 最后一个（复产详情）撑满剩余空间 */
  &.pd-section-fill {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .pd-timeline {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
  }
}

.pd-subtitle {
  margin: 0 0 vh(8);
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(15 * var(--min-scale)), 16px);
  font-weight: 500;
  color: #89b5ff;
}

/* 场所信息 2×2 网格 */
.pd-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: vh(8) vw(12);
}

.pd-info-cell {
  display: flex;
  flex-direction: column;
  gap: vh(2);
}

.pd-info-label {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 14px);
  color: var(--text-secondary);
  white-space: nowrap;
}

.pd-info-value {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 14px);
  color: var(--text-primary);
}

.pd-status-tag {
  display: inline-block;
  padding: 0 vw(6);
  border-radius: 3px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  line-height: 1.8;

  &.pd-prepare    { background: rgba(134,174,240,0.2); color: #86aef0; }
  &.pd-review     { background: rgba(94,147,235,0.2); color: #5e93eb; }
  &.pd-trial      { background: rgba(237,161,0,0.2);  color: #eda100; }
  &.pd-production { background: rgba(27,175,122,0.2); color: #1baf7a; }
}

/* 核心指标 3 列 */
.pd-metrics {
  display: flex;
  gap: vw(10);
}

.pd-metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: vh(8) vw(6);
  border-radius: 4px;
  background: rgba(0, 51, 106, 0.4);
  border: 1px solid rgba(21, 101, 164, 0.25);
}

.pd-metric-value {
  font-family: 'Douyin Sans', 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(20px, calc(28 * var(--min-scale)), 32px);
  font-weight: 700;
  line-height: 1.2;
}

.pd-metric-label {
  font-size: clamp(10px, calc(12 * var(--min-scale)), 13px);
  margin-top: vh(2);
}

.pd-metric-warn  .pd-metric-value { color: #eda100; }
.pd-metric-danger .pd-metric-value { color: #e34948; }
.pd-metric-primary .pd-metric-value { color: #3678E3; }
.pd-metric-warn  .pd-metric-label,
.pd-metric-danger .pd-metric-label,
.pd-metric-primary .pd-metric-label { color: var(--text-secondary); }

/* ================================================
   复产详情 — 时间线
   ================================================ */
.pd-timeline {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

/* 阶段头 */
.ptl-stage-head {
  display: flex;
  align-items: center;
  gap: vw(8);
  padding: vh(8) 0 vh(6) 0;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }

  &:not(:first-child) {
    margin-top: vh(6);
    border-top: 1px solid rgba(21, 101, 164, 0.15);
  }

  &.ptl-stage-collapsed {
    opacity: 0.6;
  }
}

.ptl-stage-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(16);
  height: vw(16);
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: var(--text-tertiary);
  transition: transform 0.2s;
  flex-shrink: 0;

  &.ptl-arrow-open {
    transform: rotate(90deg);
  }
}

.ptl-stage-label {
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 600;
  color: var(--text-primary);
}

.ptl-stage-sub {
  font-size: clamp(12px, calc(14 * var(--min-scale)), 15px);
  color: var(--text-secondary);
}

/* 时间线节点 */
.ptl-node {
  display: flex;
  gap: vw(10);
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 4px;
  padding: vh(2) vw(4);

  &:hover {
    background: rgba(54, 120, 227, 0.08);
  }

  &.ptl-active {
    background: rgba(54, 120, 227, 0.15);
  }
}

/* 左侧：圆点 + 竖线 */
.ptl-line-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: vw(20);
  flex-shrink: 0;
  padding-top: vh(0);
}

.ptl-dot-node {
  width: vw(12);
  height: vw(12);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: vh(7);
  background: rgba(195, 215, 248, 0.25);
  border: 2px solid rgba(195, 215, 248, 0.2);
  transition: all 0.2s;
}

.ptl-line {
  flex: 1;
  width: 2px;
  min-height: vh(18);
  background: rgba(21, 101, 164, 0.2);
  margin-top: vh(4);
}

/* 节点状态色 */
.ptl-done .ptl-dot-node {
  background: #1baf7a;
  border-color: #1baf7a;
  box-shadow: 0 0 6px rgba(27, 175, 122, 0.4);
}
.ptl-done .ptl-line {
  background: rgba(27, 175, 122, 0.4);
}

.ptl-in_progress .ptl-dot-node {
  background: #eda100;
  border-color: #eda100;
  box-shadow: 0 0 6px rgba(237, 161, 0, 0.4);
  animation: ptl-pulse 2s ease-in-out infinite;
}
.ptl-in_progress .ptl-line {
  background: rgba(237, 161, 0, 0.3);
}

.ptl-pending .ptl-dot-node {
  background: transparent;
  border-color: rgba(195, 215, 248, 0.35);
}

@keyframes ptl-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(237, 161, 0, 0.4); }
  50%      { box-shadow: 0 0 12px rgba(237, 161, 0, 0.7); }
}

/* 右侧：文字信息 */
.ptl-body {
  display: flex;
  align-items: center;
  gap: vw(8);
  flex: 1;
  min-width: 0;
  padding: vh(6) 0;
  font-size: clamp(13px, calc(15 * var(--min-scale)), 16px);
}

.ptl-order {
  color: var(--text-tertiary);
  flex-shrink: 0;
  width: vw(26);
  text-align: right;
}

.ptl-name {
  color: var(--text-primary);
  flex-shrink: 0;
}

.ptl-executor {
  color: var(--text-secondary);
  font-size: clamp(11px, calc(13 * var(--min-scale)), 14px);
  flex-shrink: 0;
}

.ptl-status-tag {
  margin-left: auto;
  padding: vh(1) vw(7);
  border-radius: 3px;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 13px);
  white-space: nowrap;
  flex-shrink: 0;

  &.ptl-tag-done        { background: rgba(27,175,122,0.15); color: #1baf7a; }
  &.ptl-tag-in_progress { background: rgba(237,161,0,0.15); color: #eda100; }
  &.ptl-tag-pending     { background: rgba(195,215,248,0.1); color: var(--text-tertiary); }
}

/* ================================================
   步骤详情 — 行内展开（时间线节点下方）
   ================================================ */
.ptl-detail-inline {
  margin: vh(2) 0 vh(6) vw(20);
  padding: vh(6) vw(10);
  background: rgba(54, 120, 227, 0.08);
}

.ptl-detail-row {
  display: flex;
  gap: vw(10);
  font-size: clamp(11px, calc(13 * var(--min-scale)), 14px);
  line-height: 1.8;

  & + & {
    margin-top: vh(1);
  }
}

.ptl-detail-k {
  color: var(--text-tertiary);
  flex-shrink: 0;
  width: vw(52);
}

.ptl-detail-v {
  color: var(--text-secondary);
}

/* 空状态 */
.pd-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: vh(120);
  color: var(--text-tertiary);
  font-size: clamp(12px, calc(14 * var(--min-scale)), 15px);
}

/* 车间卡片容器 */
.rb-ws-clickable {
  cursor: pointer;
}

/* ================================================
   工厂概览面板 — 由 SectionCard 包裹，去掉独立边框
   ================================================ */
.rb-factory-panel {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 0 0 4px 4px;
}

.rb-factory-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

/* ================================================
   地图点位标注 — marker = dot + label
   ================================================ */
.rb-factory-marker {
  position: absolute;
  // left/top 由 dotStyle() 内联设置
  z-index: 2;
  cursor: pointer;
  pointer-events: auto;
}

.rb-factory-dot {
  position: absolute;
  display: block;
  width: vw(14);
  height: vw(14);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.2s, box-shadow 0.2s;

  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid currentColor;
    animation: dot-radar 2s ease-out infinite;
  }

  &.dot-production::after {
    content: none;
  }
}

.rb-factory-marker:hover .rb-factory-dot {
  transform: translate(-50%, -50%) scale(1.4);
}

.rb-marker-selected .rb-factory-dot {
  transform: translate(-50%, -50%) scale(1.6);
  z-index: 4;
  box-shadow: 0 0 8px currentColor, 0 0 20px currentColor;
  animation: dot-selected-pulse 1.5s ease-in-out infinite;
}

@keyframes dot-selected-pulse {
  0%, 100% { box-shadow: 0 0 8px currentColor, 0 0 20px currentColor; }
  50%      { box-shadow: 0 0 6px currentColor, 0 0 32px currentColor; }
}

/* 点位状态色 */
.dot-prepare    { background: #86aef0; color: #86aef0; box-shadow: 0 0 8px rgba(134,174,240,0.6); }
.dot-review     { background: #5e93eb; color: #5e93eb; box-shadow: 0 0 8px rgba(94,147,235,0.6); }
.dot-trial      { background: #eda100; color: #eda100; box-shadow: 0 0 8px rgba(237,161,0,0.6); }
.dot-production { background: #1baf7a; color: #1baf7a; box-shadow: none; }

/* 标签 */
.rb-dot-label {
  position: absolute;
  top: 0;
  transform: translateY(-50%) translateY(vw(1));
  padding: vh(2) vw(8);
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  font-weight: 500;
  white-space: nowrap;
  color: var(--text-primary);
  background: rgba(0, 36, 89, 0.88);
  border-radius: 3px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  line-height: 1.5;

  .rb-factory-marker:hover &,
  .rb-marker-selected & { opacity: 1; }

  .rb-marker-selected & { background: rgba(0, 36, 89, 0.95); }

  /* 默认右侧 */
  .rb-label-right & { left: vw(10); right: auto; }
  /* 靠右点位翻左侧 */
  .rb-label-left  & { left: auto; right: vw(10); }

  /* 已复产标签半透明（仅显示时） */
  .rb-factory-marker:hover .dot-production ~ &,
  .rb-marker-selected .dot-production ~ & { opacity: 0.6; }

  /* 尖角 — 指向圆点 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: vw(5) solid transparent;
    border-bottom: vw(5) solid transparent;
  }

  /* 右侧标签：尖角在左边，指向左侧圆点 */
  .rb-label-right &::before {
    left: vw(-5);
    border-right: vw(5) solid rgba(0, 36, 89, 0.88);
  }

  /* 左侧标签：尖角在右边，指向右侧圆点 */
  .rb-label-left &::before {
    right: vw(-5);
    border-left: vw(5) solid rgba(0, 36, 89, 0.88);
  }
}

.rb-dot-label-div {
  margin: 0 vw(3);
  opacity: 0.35;
}



@keyframes dot-radar {
  0%   { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* 图例 — 右上角 */
.rb-factory-legend {
  position: absolute;
  right: vw(12);
  top: vh(8);
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: vw(14);
  padding: vh(5) vw(12);
  background: rgba(0, 36, 89, 0.78);
  border-radius: 4px;
  pointer-events: none;
}

.rb-legend-item {
  display: inline-flex;
  align-items: center;
  gap: vw(5);
  font-size: clamp(11px, calc(12 * var(--min-scale)), 13px);
  color: var(--text-primary);
  white-space: nowrap;
}

.rb-legend-dot {
  display: inline-block;
  width: vw(8);
  height: vw(8);
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-prepare    { background: #86aef0; box-shadow: 0 0 4px rgba(134,174,240,0.5); }
  &.dot-review     { background: #5e93eb; box-shadow: 0 0 4px rgba(94,147,235,0.5); }
  &.dot-trial      { background: #eda100; box-shadow: 0 0 4px rgba(237,161,0,0.5); }
  &.dot-production { background: #1baf7a; box-shadow: none; }
}

/* 工厂画面底部信息条 */
.rb-factory-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: vh(36);
  background: linear-gradient(to top, rgba(0,43,89,0.9), rgba(0,43,89,0));
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 vw(16) vh(8);
  z-index: 2;
}

.rb-factory-name {
  font-size: clamp(12px, calc(14 * var(--min-scale)), 15px);
  font-weight: 500;
  color: var(--text-primary);
}

.rb-factory-live {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  font-weight: 600;
  color: #e34948;
  letter-spacing: vw(1);
  animation: live-blink 2s ease-in-out infinite;
}

@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}

/* ================================================
   车间状态卡片行 — 由 SectionCard 包裹，去掉独立背景边框
   ================================================ */
.rb-workshop-cards {
  display: flex;
  gap: vw(16);
  width: 100%;
  padding: 0 vw(16);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
</style>
