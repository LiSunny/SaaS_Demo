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
      <div class="rb-kpi-item" v-for="(kpi, i) in kpiList" :key="kpi.label">
        <div class="rb-kpi-icon">
          <div class="rb-kpi-placeholder" />
        </div>
        <div class="rb-kpi-text">
          <span class="rb-kpi-value">{{ kpi.value }}</span>
          <span class="rb-kpi-label">{{ kpi.label }}</span>
        </div>
        <div v-if="i < kpiList.length - 1" class="rb-kpi-divider">
          <div class="rb-kpi-line" />
        </div>
      </div>
    </div>

    <!-- ===== 主内容区 ===== -->
    <div class="rb-content">
      <div class="rb-col-left">
        <div class="rb-factory-panel">
          <img class="rb-factory-bg" src="@/assets/bigscreen/resumption/factory-bg.png" alt="工厂概览" />
          <div
            v-for="(plan, idx) in plans"
            :key="plan.id"
            class="rb-factory-dot"
            :class="`dot-${plan.status}`"
            :style="dotStyle(idx)"
            :title="`${plan.locationName} · ${statusLabel(plan.status)}`"
          />
          <div class="rb-factory-overlay">
            <span class="rb-factory-name">港南工厂 • 复工复产监控画面</span>
            <span class="rb-factory-live">● LIVE</span>
          </div>
        </div>
        <div class="rb-workshop-cards">
          <WorkshopStatusCard
            v-for="ws in workshopData"
            :key="ws.id"
            :name="ws.name" :leader="ws.leader" :date="ws.date"
            :status="ws.status" :progress="ws.progress" :warnings="ws.warnings"
          />
        </div>
      </div>
      <div class="rb-col-right">
        <StageFlow :plans="plans" />
        <HazardSummary :plans="plans" />
        <DeviceSummary :plans="plans" />
        <ActivityTimeline :plans="plans" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { ResumptionPlan, PlanStatus } from '@/types/resumption'
import { getAllPlansWithDetails } from '@/api/adapters/resumption-dao'
import WorkshopStatusCard from './components/resumption/WorkshopStatusCard.vue'
import StageFlow from './components/resumption/StageFlow.vue'
import HazardSummary from './components/resumption/HazardSummary.vue'
import DeviceSummary from './components/resumption/DeviceSummary.vue'
import ActivityTimeline from './components/resumption/ActivityTimeline.vue'

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

onMounted(async () => {
  try {
    plans.value = await getAllPlansWithDetails()
  } catch { /* mock 降级 */ }
})

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

  return [
    { label: '车间总数', value: total },
    { label: '已复工车间', value: resumed },
    { label: '未复工车间', value: notResumed },
    { label: '复工率', value: rate + '%' },
    { label: '未闭环隐患', value: unclosedHazards },
    { label: '异常设备', value: abnormalDevices },
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

const dotPositions = [
  { left: 18, top: 38 },
  { left: 62, top: 28 },
  { left: 42, top: 65 },
  { left: 78, top: 52 },
]
function dotStyle(idx: number) {
  const pos = dotPositions[idx] || dotPositions[0]
  return { left: pos.left + '%', top: pos.top + '%' }
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ================================================
   页面容器：flex 列布局，确保一屏完整显示
   ================================================ */
.resumption-bigscreen {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(50% 50% at 50% 50%, #0842A2 0%, #012458 100%);
  color: #c3d7f8;
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
  color: rgba(195, 215, 248, 0.45);
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
   与标题间距: vh(115) - vh(14 + 48) ≈ vh(53)
   ================================================ */
.rb-kpi-bar {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin: vh(52) auto 0;
  width: vw(1766);
  height: vh(100);
  background: var(--background\/main, #002b59);
  border: 1px solid var(--border\/default, #004671);
  border-radius: var(--lg, 10px);
  padding: vh(12) vw(12);
  gap: vw(12);
}

.rb-kpi-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: vw(12);
  height: 100%;
  padding: vh(8) vw(4);
  min-width: 0;
}

.rb-kpi-icon {
  flex-shrink: 0;
  width: vw(47);
  height: vw(47);
}

.rb-kpi-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(54, 120, 227, 0.15);
  border-radius: 6px;
  border: 1px solid rgba(71, 132, 232, 0.2);
}

.rb-kpi-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(2);
  min-width: 0;
  word-break: break-word;
}

.rb-kpi-value {
  font-family: 'Douyin Sans', 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(22px, calc(32 * var(--min-scale)), 36px);
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.rb-kpi-label {
  font-size: clamp(12px, calc(16 * var(--min-scale)), 20px);
  font-weight: 400;
  color: rgba(195, 215, 248, 0.75);
  line-height: 1.3;
  white-space: nowrap;
}

.rb-kpi-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  height: vh(78);
  width: 0;
  flex-shrink: 0;
}

.rb-kpi-line {
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(71, 132, 232, 0),
    rgba(71, 132, 232, 0.4) 20%,
    rgba(71, 132, 232, 0.4) 80%,
    rgba(71, 132, 232, 0)
  );
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

/* 右侧列 (Figma: 620px) */
.rb-col-right {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  /* 隐藏滚动条但可滚动 */
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

/* ================================================
   工厂概览面板 — flex:1 占满剩余高度
   ================================================ */
.rb-factory-panel {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border\/default, #004671);
  border-radius: var(--lg, 10px);
  overflow: hidden;
}

.rb-factory-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.85;
}

/* 车间点位标注 */
.rb-factory-dot {
  position: absolute;
  width: vw(14);
  height: vw(14);
  border-radius: 50%;
  cursor: pointer;
  z-index: 2;
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

  &:hover {
    transform: translate(-50%, -50%) scale(1.4);
    z-index: 3;
  }
}

.dot-prepare    { background: #86aef0; color: #86aef0; box-shadow: 0 0 8px rgba(134,174,240,0.6); }
.dot-review     { background: #5e93eb; color: #5e93eb; box-shadow: 0 0 8px rgba(94,147,235,0.6); }
.dot-trial      { background: #eda100; color: #eda100; box-shadow: 0 0 8px rgba(237,161,0,0.6); }
.dot-production { background: #1baf7a; color: #1baf7a; box-shadow: 0 0 8px rgba(27,175,122,0.6); }

@keyframes dot-radar {
  0%   { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
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
  color: rgba(195,215,248,0.9);
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
   车间状态卡片行 — flex-shrink:0 固定高度
   ================================================ */
.rb-workshop-cards {
  display: flex;
  gap: vw(16);
  width: 100%;
  flex-shrink: 0;
  padding: vh(12) vw(12);
  background: var(--background\/main, #002b59);
  border: 1px solid var(--border\/default, #004671);
  border-radius: var(--lg, 10px);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
</style>
