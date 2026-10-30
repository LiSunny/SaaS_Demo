<template>
  <EbikeV2Card title="健康度分析">
    <div class="health">
      <!-- ===== ① 评价结论：结论大字在上，说明在下 ===== -->
      <div class="health__verdict">
        <div class="health__verdict-head">
          <i class="health__dot" />
          <span class="health__word">{{ VERDICT.word }}</span>
        </div>
        <p class="health__note">{{ verdictNote }}</p>
      </div>

      <!-- ===== ② 雷达图（ECharts，鼠标悬浮出各维度详情） ===== -->
      <div class="health__chart">
        <EChart ref="chartRef" class="health__chart-ec" :option="chartOption" autoresize />

        <!-- 详情窗体：跟随鼠标，显示所指方向的维度 -->
        <div v-if="hover" class="health__tip" :style="tipStyle">
          <div class="health__tip-name">{{ hover.name }}</div>
          <div class="health__tip-row">
            本系统 <b>{{ hover.score }}</b> 分
          </div>
          <div class="health__tip-row">全院平均 {{ hover.average }} 分</div>
          <div class="health__tip-diff" :class="{ 'is-bad': hover.diff < 0 }">{{ hover.diffText }}</div>
        </div>
      </div>

      <!-- ===== ③ 待改进：放在模块最下方，配淡背景图 ===== -->
      <div class="health__advice">
        <span class="health__advice-tag">待改进</span>
        <span class="health__advice-note">{{ adviceNote }}</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 健康度分析
 *
 * 版式取自 Figma「人工智能+公共安全管理平台（后台）」node 6027:20066：
 *   雷达图（5 维）+ 评价结论说明。
 * 只借版式，视觉沿用本大屏的深蓝玻璃卡片与文字色阶。
 *
 * 卡片内自上而下三段：
 *   ① 评价结论（结论大字 + 说明，垂直排列）
 *   ② 雷达图（ECharts 绘制，鼠标悬浮在某个方向上即弹出该维度详情）
 *   ③ 待改进（贴模块底边，带淡背景图）
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { RadarChart } from 'echarts/charts'
import { RadarComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import EbikeV2Card from './EbikeV2Card.vue'

use([RadarChart, RadarComponent, CanvasRenderer])
const EChart = VChart

const props = withDefaults(
  defineProps<{
    /** 当前系统名（取自画布的系统切换） */
    systemName?: string
  }>(),
  { systemName: '本系统' },
)

interface HealthDimension {
  /** 维度名 */
  name: string
  /** 当前系统得分 */
  score: number
  /** 全院平均得分 */
  average: number
}

/**
 * 5 个健康维度
 *
 * 顺序与雷达轴一一对应（顶 / 右 / 右下 / 左下 / 左），
 * 雷达数据与结论文字同出一份，避免图形与文字对不上。
 */
const DIMENSIONS: HealthDimension[] = [
  { name: '设备完好率', score: 92, average: 85 },
  { name: '告警响应', score: 74, average: 68 },
  { name: '巡检覆盖', score: 86, average: 66 },
  { name: '整改闭环', score: 68, average: 74 },
  { name: '实时在线', score: 95, average: 88 },
]

/** 雷达数据（当前系统） */
const SCORES = DIMENSIONS.map((d) => d.score)

/** 评价结论 */
const VERDICT = { word: '良好' }

/** 结论说明：系统名 + 与全院平均的对比 */
const verdictNote = computed(
  () => `${props.systemName}完好率与在线率领先全院，整改闭环偏低`,
)

/** 待改进项：取与全院平均差距最大的维度 */
const adviceNote = computed(() => {
  const weakest = DIMENSIONS.reduce((a, b) =>
    b.score - b.average < a.score - a.average ? b : a,
  )
  return `${weakest.name} ${weakest.score} 分，低于全院平均 ${weakest.average - weakest.score} 分，台账待补齐`
})

/* ============================================================
 * 雷达图
 * ============================================================ */

/** 5 条轴的屏幕角度（度）：顶 / 右 / 右下 / 左下 / 左 */
const AXIS_ANGLES = [-90, -18, 54, 126, 198]

/** 雷达圆心（相对图表宽高的百分比），与 option.radar.center 一致 */
const RADAR_CENTER_X = 0.5
const RADAR_CENTER_Y = 0.55

/** 雷达半径（相对图表较小边的一半），与 option.radar.radius 一致 */
const RADAR_RADIUS = 0.62

/**
 * 等比缩放因子
 *
 * 与全局 --min-scale 同源（取宽高较小边），字号按 clamp(14, 尺寸 × 缩放, 尺寸)
 * 取值 —— 与页面其它文字同一套下限与上限，ECharts 的画布不会另起一套尺度。
 */
const scale = ref(1)

function updateScale(): void {
  scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
}

/** 设计尺寸 → 实际字号（像素），下限 14px、上限不超过设计尺寸 */
function fs(design: number): number {
  return Math.min(design, Math.max(14, Math.round(design * scale.value)))
}

/** 图表实例（模板引用） */
const chartRef = ref<InstanceType<typeof VChart> | null>(null)

/** 最近一次鼠标位置（画布坐标）：tooltip 定位与维度判定都用它 */
const pointer = ref({ x: 0, y: 0 })

/** 图表根元素 */
function chartEl(): HTMLElement | null {
  return (chartRef.value?.$el as HTMLElement | undefined) ?? null
}

/** 图表画布尺寸 */
function chartBox(): { w: number; h: number } {
  const el = chartEl()
  return { w: el?.clientWidth ?? 0, h: el?.clientHeight ?? 0 }
}

/** 雷达圆心与半径（画布像素） */
function radarCenter(): { cx: number; cy: number; r: number } | null {
  const { w, h } = chartBox()
  if (!w || !h) return null
  return {
    cx: w * RADAR_CENTER_X,
    cy: h * RADAR_CENTER_Y,
    r: (Math.min(w, h) * RADAR_RADIUS) / 2,
  }
}

/**
 * 鼠标所在方向对应的维度序号
 *
 * 取鼠标相对圆心的方位角，与 5 条轴的角度比，取最接近的一条。
 * 鼠标落在雷达外圈以外就不出窗体（否则角落处也会弹出一个不相干的维度）。
 */
function dimensionAtPointer(): number {
  const geo = radarCenter()
  if (!geo) return -1
  const dx = pointer.value.x - geo.cx
  const dy = pointer.value.y - geo.cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  /* 圆心附近没有方向可言，外圈以外也不出窗 */
  if (dist < geo.r * 0.2 || dist > geo.r * 1.15) return -1
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI
  let best = -1
  let bestDiff = 361
  AXIS_ANGLES.forEach((a, i) => {
    const diff = Math.abs(((((ang - a) % 360) + 540) % 360) - 180)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  })
  return best
}

/** 当前所指维度的详情 */
const hover = computed(() => {
  const i = dimensionAtPointer()
  if (i < 0) return null
  const d = DIMENSIONS[i]
  const diff = d.score - d.average
  return {
    name: d.name,
    score: d.score,
    average: d.average,
    diff,
    diffText:
      diff === 0
        ? '与全院平均持平'
        : diff > 0
          ? `领先全院平均 ${diff} 分`
          : `低于全院平均 ${-diff} 分`,
  }
})

/** 详情窗体位置：贴着鼠标，且不越出图表区 */
const tipStyle = computed(() => {
  const { w, h } = chartBox()
  const x = Math.min(Math.max(pointer.value.x + 14, 4), Math.max(w - 172, 4))
  const y = Math.min(Math.max(pointer.value.y + 12, 4), Math.max(h - 96, 4))
  return { left: `${x}px`, top: `${y}px` }
})

const chartOption = computed<EChartsOption>(() => ({
  animationDuration: 600,
  radar: {
    /* 圆心下移、半径收小：维度名是画在轴端外侧的，顶部那个（「设备完好率」）
       会被画布上沿切掉 —— 圆心 52% + 半径 70% 时它的顶边落在 y = -7 */
    center: ['50%', '55%'],
    radius: '62%',
    /* 起始角 90° + 顺时针，与旧版 SVG 的轴序一致（顶 / 右 / 右下 / 左下 / 左） */
    startAngle: 90,
    clockwise: true,
    splitNumber: 4,
    splitArea: { show: false },
    axisLine: { lineStyle: { color: 'rgba(126, 166, 214, 0.2)', width: 1 } },
    splitLine: {
      lineStyle: { color: 'rgba(126, 166, 214, 0.26)', width: 1, type: 'dashed' },
    },
    axisName: {
      color: '#a9c9ea',
      fontSize: fs(14),
      fontFamily: 'Alibaba PuHuiTi, PingFang SC, sans-serif',
    },
    indicator: DIMENSIONS.map((d) => ({ name: d.name, max: 100 })),
  },
  series: [
    {
      type: 'radar',
      symbol: 'circle',
      symbolSize: 6,
      data: [
        {
          value: SCORES,
          name: '本系统',
          lineStyle: { color: '#00af95', width: 2 },
          itemStyle: { color: '#00af95', borderColor: '#ffffff', borderWidth: 1 },
          areaStyle: { color: 'rgba(0, 175, 149, 0.22)' },
        },
      ],
    },
  ],
}))

/* ============================================================
 * 鼠标位置跟踪
 * ============================================================ */

/**
 * 记录鼠标位置
 *
 * 走画布的 DOM 事件而不是 ECharts 的 'mousemove'：
 * ECharts 只在鼠标落在图形元素（这里是数据面）上才派发该事件，
 * 移到雷达外圈的空白处就收不到位置，窗体会停在上一帧的维度上。
 */
function onMove(e: MouseEvent): void {
  const el = chartEl()
  if (!el) return
  const rect = el.getBoundingClientRect()
  pointer.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

/** 鼠标移出画布：收起窗体 */
function onLeave(): void {
  pointer.value = { x: -1, y: -1 }
}

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
  const el = chartEl()
  el?.addEventListener('mousemove', onMove)
  el?.addEventListener('mouseleave', onLeave)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
  const el = chartEl()
  el?.removeEventListener('mousemove', onMove)
  el?.removeEventListener('mouseleave', onLeave)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.health {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(10);
  padding: vh(8) vw(12);
  overflow: hidden;
}

/* ===== ① 评价结论 ===== */
.health__verdict {
  flex-shrink: 0;
}

.health__verdict-head {
  display: flex;
  align-items: center;
  gap: vw(8);
}

/* 结论色点：与雷达数据面同色 */
.health__dot {
  flex-shrink: 0;
  width: vw(10);
  height: vw(10);
  border-radius: vw(2);
  background: #00af95;
}

/* 结论大字 */
.health__word {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(22px, calc(30 * var(--min-scale)), 30px);
  line-height: 1.1;
  letter-spacing: vw(2);
  color: var(--fire-text-hero);
}

/* 结论说明 */
.health__note {
  margin: vh(4) 0 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-sub);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== ② 雷达图 ===== */
.health__chart {
  flex: 1;
  min-height: 0;
  position: relative;
}

.health__chart-ec {
  width: 100%;
  height: 100%;
}

/* 详情窗体：跟随鼠标，显示所指方向的维度 */
.health__tip {
  position: absolute;
  z-index: 3;
  width: 160px;
  padding: vh(6) vw(10);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.96);
  box-shadow: 0 vw(6) vw(16) rgba(0, 12, 34, 0.45);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.35;
  color: #cfe4ff;
  pointer-events: none;
}

.health__tip-name {
  font-weight: 700;
  color: var(--fire-text-hero);
  margin-bottom: vh(2);
}

.health__tip-row b {
  font-family: 'Douyin Sans', sans-serif;
  font-size: 16px;
  color: var(--fire-text-hero);
}

/* 低于全院平均：异常统一一个红 */
.health__tip-diff {
  margin-top: vh(2);
  color: var(--fire-text-title);
}

.health__tip-diff.is-bad {
  color: var(--fire-anomaly);
}

/* ===== ③ 待改进（模块最下方） ===== */
.health__advice {
  flex-shrink: 0;
  height: vh(40);
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: 0 vw(12);
  background-image: url('@/assets/bigscreen/ebike-v2/health-advice-bg.svg');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  border-top: 1px solid rgba(120, 190, 255, 0.14);
}

.health__advice-tag {
  flex-shrink: 0;
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  color: var(--fire-anomaly);
}

.health__advice-note {
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
