<template>
  <div class="campus-loading">
    <!-- 底图：三维模型就位前的园区占位图，铺满整个模型层（设计稿 173:26616） -->
    <div class="campus-loading__poster" />

    <!-- 模型可视区（x=538→1382）：设计稿 173:27314
         这里叠一份按可视区尺寸裁切的鸟瞰图 + 0.55 压暗 + 上下渐变压条 + 进度组 -->
    <div class="campus-loading__viewport">
      <div class="campus-loading__poster campus-loading__poster--viewport" />
      <div class="campus-loading__dim" />

      <!-- 上下渐变压条：各 120px，从大屏底色渐隐到透明 -->
      <div class="campus-loading__scrim campus-loading__scrim--top" />
      <div class="campus-loading__scrim campus-loading__scrim--bottom" />

      <div class="campus-loading__panel">
        <p class="campus-loading__title">正在加载校园三维模型</p>
        <div class="campus-loading__gauge">
          <p class="campus-loading__percent">{{ percent }}%</p>
          <div class="campus-loading__bar">
            <div class="campus-loading__track">
              <div class="campus-loading__fill" :style="{ width: `${percent}%` }" />
              <span class="campus-loading__head" :style="{ left: `${percent}%` }" />
            </div>
          </div>
          <p class="campus-loading__sub">{{ stage }}</p>
        </div>
      </div>

      <img class="campus-loading__logo" :src="logoSrc" alt="北京林业大学" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '@/assets/bigscreen/ebike-v2/loading/campus-logo.png'

/**
 * 三维模型加载遮罩。
 *
 * 按设计稿 173:26615（「智能安全管控平台/校园总览-旧版」）还原：
 *   · 底图 = 园区鸟瞰图
 *   · 模型可视区叠一份裁切过的鸟瞰图 + rgba(0,13,52,0.55) 压暗
 *   · 可视区上下各一条 120px 渐变压条
 *   · 「正在加载校园三维模型」26px 斜黑体 900 + 百分比 40px 抖音体
 *     + 380×8 进度条（已填充段 #4A9EE8→#CBE2FD 渐变、末端径向发光点）
 *     + 16px 副文案
 *   · 底部校徽 36×12，opacity 0.45
 *
 * 进度是真的：模型侧 app.js 按装配阶段 postMessage 上报
 * （campus-model:progress），这里只负责显示，不做假进度。
 */

const props = withDefaults(
  defineProps<{
    /** 已完成百分比 0~100 */
    percent?: number
    /** 副文案：当前装配阶段 */
    stage?: string
  }>(),
  {
    percent: 0,
    stage: '正在加载模型资源…',
  },
)

const percent = computed(() => Math.max(0, Math.min(100, Math.round(props.percent))))
const logoSrc = logoUrl
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 遮罩铺满模型层（三维 iframe 的位置），随模型层一起淡入淡出 */
.campus-loading {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* 底图：园区鸟瞰占位图。cover + 居中，与模型落位机位一致，
   模型就位后整层淡出，视觉上是「同一片园区由静图换成实景」。 */
.campus-loading__poster {
  position: absolute;
  inset: 0;
  background-image: url('@/assets/bigscreen/ebike-v2/loading/campus-poster.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 模型可视区：左列右缘 538 → 右列左缘 1382 */
.campus-loading__viewport {
  position: absolute;
  top: vh(86);
  left: vw(538);
  width: vw(844);
  bottom: vh(16);
  overflow: hidden;
}

/* 可视区内的鸟瞰图：按 845×978 重新 cover 裁切（设计稿里模型区是单独一张图，
   与整页底图不是同一裁切） */
.campus-loading__poster--viewport {
  background-size: cover;
  background-position: center;
}

/* 压暗层 */
.campus-loading__dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 13, 52, 0.55);
}

/* 上下渐变压条：各 120px，从大屏底色渐隐到透明 */
.campus-loading__scrim {
  position: absolute;
  left: 0;
  right: 0;
  height: vh(120);
  pointer-events: none;
}

.campus-loading__scrim--top {
  top: 0;
  background: linear-gradient(180deg, rgba(0, 13, 52, 0.8) 0%, rgba(0, 13, 52, 0) 100%);
}

.campus-loading__scrim--bottom {
  bottom: 0;
  background: linear-gradient(0deg, rgba(0, 13, 52, 0.8) 0%, rgba(0, 13, 52, 0) 100%);
}

/* 文案组：垂直居中于可视区 */
.campus-loading__panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: vh(20);
  width: vw(380);
  text-align: center;
}

/* 标题：26px 斜黑体 900，渐变文字 */
.campus-loading__title {
  margin: 0;
  font-family: 'SectionTitleHans', 'Source-KeynoteartHans', sans-serif;
  font-weight: 900;
  font-size: vw(26);
  line-height: 1.2;
  background: linear-gradient(180deg, rgba(208, 228, 252, 1) 0%, rgba(167, 198, 255, 1) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  white-space: nowrap;
}

/* 百分比 + 进度条 + 副文案 */
.campus-loading__gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: vh(10);
  width: 100%;
}

/* 百分比：40px 抖音体 Bold 700，渐变文字 */
.campus-loading__percent {
  margin: 0;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: vw(40);
  line-height: 1.2;
  background: linear-gradient(180deg, rgba(165, 206, 255, 1) 0%, rgba(208, 228, 252, 1) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-variant-numeric: tabular-nums;
}

/* 进度条：轨道 380×8，已填充段用设计稿的 #4A9EE8 → #CBE2FD 渐变，
   末端一个径向渐变发光点（设计稿 SVG 179:368 的做法）。 */
.campus-loading__bar {
  width: vw(380);
  /* 设计稿里发光点直径 16px 溢出 8px 的轨道，故容器留 16px 高、轨道垂直居中 */
  height: vh(16);
  display: flex;
  align-items: center;
}

.campus-loading__track {
  position: relative;
  width: 100%;
  height: vh(8);
  border-radius: vh(4);
  background: #002452;
  overflow: visible;
}

.campus-loading__fill {
  height: 100%;
  border-radius: vh(4);
  background: linear-gradient(90deg, #4a9ee8 0%, #cbe2fd 100%);
  transition: width 0.35s ease;
}

.campus-loading__head {
  position: absolute;
  top: 50%;
  width: vh(16);
  height: vh(16);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(203, 226, 255, 0.8) 0%, rgba(74, 158, 232, 0) 100%);
  transition: left 0.35s ease;
}

/* 副文案：16px 普惠体，#7BA8D4 */
.campus-loading__sub {
  margin: 0;
  font-family: 'LoadingPuHuiTi', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-weight: 400;
  font-size: vw(16);
  line-height: 1.4;
  color: #7ba8d4;
  opacity: 0.9;
  white-space: nowrap;
}

/* 校徽：36×12，opacity 0.45，锚在可视区底部居中略偏左（设计稿 x=372/844） */
.campus-loading__logo {
  position: absolute;
  bottom: vh(116);
  left: 50%;
  width: vw(36);
  height: vw(12);
  transform: translateX(calc(-50% - vw(32)));
  opacity: 0.45;
  object-fit: contain;
  pointer-events: none;
}
</style>
