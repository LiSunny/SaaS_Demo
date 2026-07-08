<template>
  <SectionCard title="安全自律履责概览" subtitle="Discipline">
    <div class="compliance-overview">
      <!--
        背景图占位：中间圆形 + 四条射线（Figma Rectangle 131 + 同心圆 + Union Stroke）
        TODO: 替换为实际设计图
        替换方式：将下方 background 属性替换为 url('@/assets/bigscreen/compliance-bg.png') 或实际图片路径
      -->
      <div class="overview-bg" />

      <!-- 中心数字（覆盖在背景图上方） -->
      <div class="center-text">
        <span class="center-num">999</span>
        <span class="center-label">接入企业</span>
      </div>

      <!-- 四角行业卡片 -->
      <div
        v-for="item in industries"
        :key="item.name"
        class="industry-card"
        :class="[`card--${item.corner}`]"
      >
        <div class="card-row" :class="[`card-row--${item.side}`]">
          <img class="card-icon" :src="item.icon" alt="" />
          <span class="card-num" :class="[`card-num--${item.side}`]"
            >{{ item.count }}<span class="card-unit">家</span></span
          >
        </div>
        <span class="card-label" :class="[`card-label--${item.side}`]">{{ item.name }}</span>
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

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 容器：撑满父级 + 内边距 ===== */
.compliance-overview {
  position: relative;
  width: 100%;
  height: 100%;
  /* 与父容器四周留有边距 */
  padding: vh(10) vw(12);
  overflow: hidden;
  box-sizing: border-box;
}

/* ===== 背景图占位（中间圆形 + 四条射线） ===== */
/*
 * TODO 用户自行替换：
 *   将下方 background 整行替换为实际背景图，例如：
 *   background: url('@/assets/bigscreen/compliance-bg.png') center/contain no-repeat;
 *   或直接使用 Figma 导出的 SVG/PNG
 */
.overview-bg {
  position: absolute;
  /* 覆盖 padded 区域 */
  inset: vh(10) vw(12);
  /* 占位示意：深色底 + 虚线框 + 中央淡色提示 */
  background: url('@/assets/bigscreen/circle_bg.svg') center / contain no-repeat;
  pointer-events: none;
  z-index: 0;
}

/* 占位提示文字 */
.overview-bg::after {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(8px, calc(12 * var(--min-scale)), 14px);
  color: rgba(157, 203, 254, 0.25);
  white-space: nowrap;
  pointer-events: none;
}

/* ===== 中心数字 ===== */
.center-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(4);
  z-index: 2;
}

.center-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(32 * var(--min-scale)), 40px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.center-label {
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
  width: vw(119);
  height: vh(72);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(8);
  padding: vh(6) vw(6);
  z-index: 3;
}

/* -- 左上：工贸企业 -- */
.card--tl {
  left: vw(12);
  top: vh(34);
  background: linear-gradient(-83deg, #014692 3.46%, #0457a7 96.54%);
  border-left: 1px solid #4784e8;
  border-bottom: 1px solid #4784e8;
  border-top: 1px solid #4784e8;
  border-radius: 4px 0 0 4px;
}

/* -- 右上：教育行业 -- */
.card--tr {
  right: vw(12);
  top: vh(34);
  background: linear-gradient(-83deg, #0457a7 3.46%, #014692 96.54%);
  border-right: 1px solid #4784e8;
  border-bottom: 1px solid #4784e8;
  border-top: 1px solid #4784e8;
  border-radius: 0 4px 4px 0;
}

/* -- 左下：社区物业 -- */
.card--bl {
  left: vw(12);
  bottom: vh(34);
  background: linear-gradient(-83deg, #014692 3.46%, #0457a7 96.54%);
  border-left: 1px solid #4784e8;
  border-bottom: 1px solid #4784e8;
  border-top: 1px solid #4784e8;
  border-radius: 4px 0 0 4px;
}

/* -- 右下：其他 -- */
.card--br {
  right: vw(12);
  bottom: vh(34);
  background: linear-gradient(-83deg, #0457a7 3.46%, #014692 96.54%);
  border-right: 1px solid #024792;
  border-bottom: 1px solid #024792;
  border-radius: 0 0 4px 0;
}

/* ===== 图标 + 数字行 ===== */
.card-row {
  display: flex;
  align-items: center;
  gap: vw(6);
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

/* ===== 图标 ===== */
.card-icon {
  width: calc(22 * var(--min-scale));
  height: calc(22 * var(--min-scale));
  flex-shrink: 0;
  display: block;
  object-fit: contain;
}

/* ===== 数字 ===== */
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

/* ===== 单位 "家" ===== */
.card-unit {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(8px, calc(14 * var(--min-scale)), 18px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== 行业名称标签 ===== */
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
