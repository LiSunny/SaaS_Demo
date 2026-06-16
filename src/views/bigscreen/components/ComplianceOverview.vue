<template>
  <SectionCard title="安全自律履责概览" subtitle="Discipline">
    <div class="compliance-overview">
      <!-- 矢量背景底图（Figma Rectangle 131） -->
      <svg
        class="vec-bg"
        viewBox="0 0 430 213"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="430" height="213" fill="url(#vecBgGrad)" />
        <defs>
          <linearGradient id="vecBgGrad" x1="0" y1="0" x2="0" y2="213" gradientUnits="userSpaceOnUse">
            <stop stop-color="#014692" stop-opacity="0.25" />
            <stop offset="1" stop-color="#0457a7" stop-opacity="0.08" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Union Stroke 十字装饰（内联 SVG，避免额外文件依赖） -->
      <svg
        class="union-stroke"
        viewBox="0 0 398 188"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 水平条 -->
        <rect
          x="0" y="66" width="398" height="56" rx="28"
          stroke="url(#unionGrad)" stroke-width="1" fill="none"
          opacity="0.4"
        />
        <!-- 垂直条 -->
        <rect
          x="170" y="0" width="58" height="188" rx="29"
          stroke="url(#unionGrad)" stroke-width="1" fill="none"
          opacity="0.4"
        />
        <defs>
          <linearGradient id="unionGrad" x1="199" y1="0" x2="199" y2="188" gradientUnits="userSpaceOnUse">
            <stop stop-color="#4784e8" stop-opacity="0" />
            <stop offset="0.5" stop-color="#89b5ff" stop-opacity="0.6" />
            <stop offset="1" stop-color="#4784e8" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <!-- 三层同心环形图 -->
      <div class="donut-area">
        <svg class="donut" viewBox="0 0 168 168">
          <!-- 外环：r=79, 视觉直径168 -->
          <circle cx="84" cy="84" r="79" fill="none" stroke="rgba(71,132,232,0.12)" stroke-width="10" />
          <circle
            cx="84" cy="84" r="79" fill="none" stroke="#4784e8" stroke-width="10"
            stroke-dasharray="446" stroke-dashoffset="80" stroke-linecap="round"
            transform="rotate(-90 84 84)"
          />
          <!-- 中环：r=74, 视觉直径158 -->
          <circle cx="84" cy="84" r="74" fill="none" stroke="rgba(71,132,232,0.08)" stroke-width="10" />
          <circle
            cx="84" cy="84" r="74" fill="none" stroke="#5ea3f6" stroke-width="10"
            stroke-dasharray="415" stroke-dashoffset="75" stroke-linecap="round"
            transform="rotate(-90 84 84)"
          />
          <!-- 内环：r=64, 视觉直径138 -->
          <circle cx="84" cy="84" r="64" fill="none" stroke="rgba(71,132,232,0.06)" stroke-width="10" />
          <circle
            cx="84" cy="84" r="64" fill="none" stroke="#89b5ff" stroke-width="10"
            stroke-dasharray="352" stroke-dashoffset="65" stroke-linecap="round"
            transform="rotate(-90 84 84)"
          />
        </svg>
        <!-- 中心数字 -->
        <div class="donut-center">
          <span class="donut-num">999</span>
          <span class="donut-label">接入企业</span>
        </div>
      </div>

      <!-- 四角行业卡片 -->
      <div
        v-for="item in industries"
        :key="item.name"
        class="industry-card"
        :class="[`card--${item.corner}`]"
      >
        <div class="card-row" :class="`card-row--${item.side}`">
          <img class="card-icon" :src="item.icon" alt="" />
          <span class="card-num" :class="`card-num--${item.side}`"
            >{{ item.count }}<span class="card-unit">家</span></span
          >
        </div>
        <span class="card-label" :class="`card-label--${item.side}`">{{ item.name }}</span>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from './SectionCard.vue'

/* SVG 图标资源 — 由用户自行导入维护 */
import iconGongmao from '@/assets/bigscreen/industry/gongmao.svg'
import iconJiaoyu from '@/assets/bigscreen/industry/jiaoyu.svg'
import iconShequ from '@/assets/bigscreen/industry/shequ.svg'
import iconQita from '@/assets/bigscreen/industry/qita.svg'

interface IndustryItem {
  name: string
  count: number
  icon: string
  side: 'left' | 'right'
  corner: 'tl' | 'tr' | 'bl' | 'br'
}

const industries: IndustryItem[] = [
  { name: '工贸企业', count: 18, icon: iconGongmao, side: 'left', corner: 'tl' },
  { name: '教育行业', count: 18, icon: iconJiaoyu, side: 'right', corner: 'tr' },
  { name: '社区物业', count: 18, icon: iconShequ, side: 'left', corner: 'bl' },
  { name: '其他', count: 18, icon: iconQita, side: 'right', corner: 'br' },
]
</script>

<style scoped>
/* ===== 容器 ===== */
.compliance-overview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ===== 矢量背景底图（Figma Rectangle 131） ===== */
.vec-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ===== Union Stroke 十字装饰 ===== */
.union-stroke {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: calc(398 * var(--w));
  height: calc(188 * var(--h));
  pointer-events: none;
  z-index: 1;
}

/* ===== 环形图区域 ===== */
.donut-area {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: calc(168 * var(--min-scale));
  height: calc(168 * var(--min-scale));
  z-index: 2;
}

.donut {
  width: 100%;
  height: 100%;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(4 * var(--h));
}

.donut-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(32 * var(--min-scale)), 40px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.donut-label {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(18 * var(--min-scale)), 22px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== 四角行业卡片 ===== */
.industry-card {
  position: absolute;
  width: calc(119 * var(--w));
  height: calc(72 * var(--h));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(8 * var(--h));
  padding: calc(6 * var(--h)) calc(6 * var(--w));
  z-index: 3;
}

/* 左上：工贸企业 */
.card--tl {
  left: 0;
  top: 0;
  background: linear-gradient(-83deg, #014692 3.46%, #0457a7 96.54%);
  border-left: 1px solid #4784e8;
  border-top: 1px solid #4784e8;
  border-radius: 4px 0 0 0;
}

/* 右上：教育行业 */
.card--tr {
  right: 0;
  top: 0;
  background: linear-gradient(-83deg, #0457a7 3.46%, #014692 96.54%);
  border-right: 1px solid #024792;
  border-top: 1px solid #024792;
  border-radius: 0 4px 0 0;
}

/* 左下：社区物业 */
.card--bl {
  left: 0;
  bottom: 0;
  background: linear-gradient(-83deg, #014692 3.46%, #0457a7 96.54%);
  border-left: 1px solid #4784e8;
  border-bottom: 1px solid #4784e8;
  border-radius: 0 0 0 4px;
}

/* 右下：其他 */
.card--br {
  right: 0;
  bottom: 0;
  background: linear-gradient(-83deg, #0457a7 3.46%, #014692 96.54%);
  border-right: 1px solid #024792;
  border-bottom: 1px solid #024792;
  border-radius: 0 0 4px 0;
}

/* 图标 + 数字行 */
.card-row {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  width: 100%;
}

.card-row--left {
  flex-direction: row;
  justify-content: center;
}

.card-row--right {
  flex-direction: row-reverse;
  justify-content: center;
}

/* 图标 */
.card-icon {
  width: calc(22 * var(--min-scale));
  height: calc(22 * var(--min-scale));
  flex-shrink: 0;
  display: block;
  object-fit: contain;
}

/* 数字 */
.card-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(20 * var(--min-scale)), 24px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.card-num--left {
  text-align: left;
}
.card-num--right {
  text-align: right;
}

/* 单位 "家" */
.card-unit {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(8px, calc(14 * var(--min-scale)), 18px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 行业名称标签 */
.card-label {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(9px, calc(18 * var(--min-scale)), 22px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  width: 100%;
}
.card-label--left {
  text-align: left;
}
.card-label--right {
  text-align: right;
}
</style>
