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

      <!-- ===== ② 雷达图 + 各维度分值 ===== -->
      <div class="health__chart">
        <div class="health__radar">
          <svg
            class="health__svg"
            :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <!-- 网格：外框实线 + 4 层虚线五边形 -->
            <polygon
              v-for="r in RINGS"
              :key="r"
              class="health__ring"
              :class="{ 'health__ring--outer': r === 1 }"
              :points="ringPoints(r)"
            />

            <!-- 轴线：中心 → 5 个顶点 -->
            <line
              v-for="(deg, i) in AXES"
              :key="`axis-${i}`"
              class="health__axis"
              :x1="CX"
              :y1="CY"
              :x2="vertex(deg, 1).x"
              :y2="vertex(deg, 1).y"
            />

            <!-- 数据面 -->
            <polygon class="health__series" :points="dataPoints(SCORES)" />
          </svg>

          <!-- 5 个维度名：位置对齐 5 个顶点方向 -->
          <span
            v-for="(d, i) in DIMENSIONS"
            :key="d.name"
            class="health__dim"
            :class="`health__dim--${i}`"
          >
            {{ d.name }}
          </span>
        </div>

        <!-- 各维度分值 -->
        <ul class="health__dims">
          <li v-for="d in DIMENSIONS" :key="d.name" class="health__dim-row">
            <span class="health__dim-name">{{ d.name }}</span>
            <span class="health__dim-score">{{ d.score }}</span>
          </li>
        </ul>
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
 *   ② 雷达图 + 各维度分值（左右并排）
 *   ③ 待改进（贴模块底边，带淡背景图）
 */
import { computed } from 'vue'
import EbikeV2Card from './EbikeV2Card.vue'

const props = withDefaults(
  defineProps<{
    /** 当前系统名（取自画布的系统切换） */
    systemName?: string
  }>(),
  { systemName: '本系统' },
)

/** ===== 雷达图几何（viewBox 与设计尺寸 1:1，容器按同一比例拉伸） ===== */
const VIEW_W = 240
const VIEW_H = 143
/** 网格中心 */
const CX = 120
const CY = 72
/** 外接圆半径 */
const R = 52
/** 5 条轴的角度：顶 / 右 / 右下 / 左下 / 左 */
const AXES = [-90, -18, 54, 126, 198]
/** 网格环：外框 + 4 层内环 */
const RINGS = [1, 0.8, 0.6, 0.4, 0.2]

/** 顶点在画布坐标上的位置（ratio 为半径占比） */
function vertex(deg: number, ratio: number) {
  const rad = (deg * Math.PI) / 180
  return {
    x: CX + Math.cos(rad) * R * ratio,
    y: CY + Math.sin(rad) * R * ratio,
  }
}

/** 网格环顶点串 */
function ringPoints(ratio: number): string {
  return AXES.map((deg) => {
    const p = vertex(deg, ratio)
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
  }).join(' ')
}

/** 数据面顶点串：values 为 0~100 */
function dataPoints(values: number[]): string {
  return AXES.map((deg, i) => {
    const p = vertex(deg, values[i] / 100)
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
  }).join(' ')
}

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

/* ===== ② 雷达图 + 维度分值 ===== */
.health__chart {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: vw(24);
}

/* ===== 雷达图 ===== */
.health__radar {
  position: relative;
  flex-shrink: 0;
  width: vw(240);
  height: 100%;
}

.health__svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 网格：内环虚线，外框实线 */
.health__ring {
  fill: none;
  stroke: rgba(126, 166, 214, 0.26);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.health__ring--outer {
  stroke: rgba(126, 166, 214, 0.55);
  stroke-dasharray: none;
}

/* 轴线 */
.health__axis {
  stroke: rgba(126, 166, 214, 0.2);
  stroke-width: 1;
}

/* 数据面：当前系统 */
.health__series {
  fill: #00af95;
  fill-opacity: 0.22;
  stroke: #00af95;
  stroke-width: 2;
  stroke-linejoin: round;
}

/* 维度名：位置对齐 5 个顶点方向（按比例定位，随图缩放） */
.health__dim {
  position: absolute;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-label);
  white-space: nowrap;
  line-height: 1.2;
}

/* 顶 */
.health__dim--0 {
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

/* 右 */
.health__dim--1 {
  left: 72.1%;
  top: 33.2%;
}

/* 右下 */
.health__dim--2 {
  left: 67%;
  top: 82.5%;
  transform: translateX(-50%);
}

/* 左下 */
.health__dim--3 {
  left: 33%;
  top: 82.5%;
  transform: translateX(-50%);
}

/* 左 */
.health__dim--4 {
  left: 4.6%;
  top: 33.2%;
}

/* ===== 各维度分值 ===== */
.health__dims {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.health__dim-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: vw(12);
  min-width: 0;
}

.health__dim-name {
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-label);
  white-space: nowrap;
}

.health__dim-score {
  flex-shrink: 0;
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  color: var(--fire-text-hero);
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
