<template>
  <div class="bigscreen resumption-bigscreen">
    <!-- 顶部标题栏 -->
    <div class="rb-header">
      <div class="rb-header-left">
        <h1 class="rb-title">复工复产可视化大屏</h1>
        <span class="rb-subtitle">全厂复工进度实时监控</span>
      </div>
      <div class="rb-header-right">
        <span class="rb-time">{{ currentTime }}</span>
        <button class="rb-back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          返回列表
        </button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="rb-content">
      <!-- ===== KPI 指标行 ===== -->
      <div class="rb-kpi-row">
        <div class="rb-kpi-card">
          <span class="rb-kpi-value">{{ stats.total }}</span>
          <span class="rb-kpi-label">复工计划总数</span>
        </div>
        <div class="rb-kpi-card kpi-active">
          <span class="rb-kpi-value">{{ stats.active }}</span>
          <span class="rb-kpi-label">进行中</span>
        </div>
        <div class="rb-kpi-card kpi-review">
          <span class="rb-kpi-value">{{ stats.review }}</span>
          <span class="rb-kpi-label">待审核/签发</span>
        </div>
        <div class="rb-kpi-card kpi-done">
          <span class="rb-kpi-value">{{ stats.production }}</span>
          <span class="rb-kpi-label">已复产</span>
        </div>
        <div class="rb-kpi-card kpi-rate">
          <div class="rb-kpi-ring">
            <svg viewBox="0 0 64 64" class="rb-ring-svg">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(71,132,232,0.15)" stroke-width="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="#3678E3" stroke-width="4"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="ringOffset"
                transform="rotate(-90 32 32)"
              />
            </svg>
            <span class="rb-ring-text">{{ stats.rate }}%</span>
          </div>
          <span class="rb-kpi-label">整体复工率</span>
        </div>
      </div>

      <!-- ===== 第二行：阶段分布 + 活动（左）| 热力图（右）===== -->
      <div class="rb-row-2">
        <div class="rb-col-left">
          <StageFlow :plans="plans" />
          <ActivityTimeline :plans="plans" />
        </div>
        <div class="rb-col-right">
          <WorkshopHeatmap
            :plans="plans"
            @plan-click="goDetail"
          />
        </div>
      </div>

      <!-- ===== 第三行：隐患汇总 + 设备汇总 ===== -->
      <div class="rb-row-3">
        <div class="rb-col-half">
          <HazardSummary :plans="plans" />
        </div>
        <div class="rb-col-half">
          <DeviceSummary :plans="plans" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPlansWithDetails } from '@/api/adapters/resumption-dao'
import type { ResumptionPlan } from '@/types/resumption'
import StageFlow from './components/resumption/StageFlow.vue'
import WorkshopHeatmap from './components/resumption/WorkshopHeatmap.vue'
import HazardSummary from './components/resumption/HazardSummary.vue'
import DeviceSummary from './components/resumption/DeviceSummary.vue'
import ActivityTimeline from './components/resumption/ActivityTimeline.vue'

const router = useRouter()

// ===== 数据 =====
const plans = ref<ResumptionPlan[]>([])
const loading = ref(true)

async function fetchData() {
  loading.value = true
  try {
    plans.value = await getAllPlansWithDetails()
  } finally {
    loading.value = false
  }
}

// ===== 统计 =====
const circumference = 2 * Math.PI * 28 // ≈ 175.93

const stats = computed(() => {
  const total = plans.value.length
  const prepare = plans.value.filter(p => p.status === 'prepare').length
  const review = plans.value.filter(p => p.status === 'review').length
  const trial = plans.value.filter(p => p.status === 'trial').length
  const production = plans.value.filter(p => p.status === 'production').length
  const active = prepare + review + trial
  const rate = total > 0 ? Math.round((production / total) * 100) : 0
  return { total, active, review, production, rate, prepare, trial }
})

const ringOffset = computed(() => {
  const pct = stats.value.rate / 100
  return circumference * (1 - pct)
})

// ===== 时钟 =====
const currentTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }) + ' ' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ===== 导航 =====
function goBack() {
  router.push('/resumption')
}

function goDetail(planId: number) {
  router.push(`/resumption/${planId}`)
}

onMounted(() => {
  fetchData()
  updateTime()
  timer = setInterval(updateTime, 30000) // 30s 刷新时钟
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 页面容器 ===== */
.resumption-bigscreen {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #0a1a2e 100%);
  color: #c3d7f8;
  overflow: hidden;
  font-family: 'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ===== 顶部标题栏 ===== */
.rb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: vh(56);
  padding: 0 vw(24);
  background: linear-gradient(180deg, rgba(15, 43, 91, 0.9) 0%, rgba(15, 43, 91, 0) 100%);
  border-bottom: 1px solid rgba(71, 132, 232, 0.15);
}

.rb-header-left {
  display: flex;
  align-items: baseline;
  gap: vw(12);
}

.rb-title {
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(24 * var(--min-scale)), 28px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.rb-subtitle {
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.5);
}

.rb-header-right {
  display: flex;
  align-items: center;
  gap: vw(16);
}

.rb-time {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: rgba(195, 215, 248, 0.6);
  font-variant-numeric: tabular-nums;
}

.rb-back-btn {
  display: flex;
  align-items: center;
  gap: vw(4);
  padding: vw(6) vw(12);
  background: rgba(54, 120, 227, 0.15);
  border: 1px solid rgba(54, 120, 227, 0.3);
  border-radius: 4px;
  color: #89b5ff;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 13px);
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;

  &:hover {
    background: rgba(54, 120, 227, 0.25);
  }
}

/* ===== 主体内容 ===== */
.rb-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: vh(12);
  padding: vh(12) vw(20) vh(16);
  overflow-y: auto;
  overflow-x: hidden;
}

/* ===== KPI 指标行 ===== */
.rb-kpi-row {
  display: flex;
  gap: vw(16);
  flex-shrink: 0;
}

.rb-kpi-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(4);
  padding: vw(12) vw(16);
  background: linear-gradient(180deg, rgba(15, 43, 91, 0.5) 0%, rgba(15, 43, 91, 0.25) 100%);
  border: 1px solid rgba(71, 132, 232, 0.2);
  border-radius: 6px;
  position: relative;
  overflow: hidden;

  /* 顶部彩色线 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #3678E3;
  }

  &.kpi-active::before { background: #5e93eb; }
  &.kpi-review::before { background: #eda100; }
  &.kpi-done::before { background: #1baf7a; }
  &.kpi-rate::before { background: linear-gradient(to right, #3678E3, #1baf7a); }
}

.rb-kpi-value {
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(28px, calc(36 * var(--min-scale)), 42px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.rb-kpi-label {
  font-size: clamp(10px, calc(12 * var(--min-scale)), 13px);
  color: rgba(195, 215, 248, 0.55);
  white-space: nowrap;
}

/* 复工率环形图 */
.rb-kpi-ring {
  position: relative;
  width: vw(48);
  height: vw(48);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rb-ring-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rb-ring-text {
  position: relative;
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(14 * var(--min-scale)), 16px);
  font-weight: 700;
  background: linear-gradient(to bottom, #8ff0c8 0%, #1baf7a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== 第二行：左右分栏 ===== */
.rb-row-2 {
  display: flex;
  gap: vw(16);
  flex: 1;
  min-height: 0;
}

.rb-col-left {
  flex: 0 0 38%;
  display: flex;
  flex-direction: column;
  gap: vh(12);
  min-width: 0;
}

.rb-col-right {
  flex: 1;
  display: flex;
  min-width: 0;
}

/* ===== 第三行：均分两栏 ===== */
.rb-row-3 {
  display: flex;
  gap: vw(16);
  flex-shrink: 0;
}

.rb-col-half {
  flex: 1;
  min-width: 0;
}
</style>
