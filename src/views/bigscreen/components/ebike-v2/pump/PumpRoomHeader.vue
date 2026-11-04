<template>
  <!--
    场景专用顶栏

    与其它大屏页共用的 EbikeV2Header 区分开：场景页不显示全局菜单与右上角用户信息，
    只保留自己的标题牌（英文装饰 + 中文名 + 返回总览），避免在专题页里
    出现与当前场景无关的全局导航。

    底图沿用 ebike-v2 顶栏那一套素材（斜纹底板 + 底部装饰线 + 流动辉光），
    高度比通用顶栏高：标题牌三行（英文 / 中文名 / 返回按钮）需要这块空间。
  -->
  <div class="pr-header" :style="{ '--bs-title-size': titleSize }">
    <!-- 底衬：大屏底色。三维模型在最底层，必须补一层同色底衬，
         否则标题条会透出模型的深色天空，与设计稿不符。 -->
    <div class="pr-header__backdrop" />
    <img class="pr-header__bg" src="@/assets/bigscreen/ebike-v2/header-bg.svg" alt="" />
    <!-- 底部装饰线：独立图层，由代码贴底定位 -->
    <img class="pr-header__line" src="@/assets/bigscreen/ebike-v2/header-line.svg" alt="" />
    <!-- 装饰线上的流动高光：设计稿自带的辉光块，沿线循环滑动 -->
    <img class="pr-header__glow" src="@/assets/bigscreen/ebike-v2/header-line-glow.svg" alt="" />

    <!-- 标题牌：英文装饰 / 中文名 / 返回总览 -->
    <div class="pump-title">
      <span class="pump-title__en" aria-hidden="true">{{ titleEn }}</span>
      <h1 class="pump-title__cn">{{ title }}</h1>
      <button type="button" class="pump-title__back" title="返回校园总览" @click="$emit('back')">
        <AppIcon name="arrow-left" class="pump-title__back-icon" />
        <span>返回总览</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 水泵房场景监控 · 场景顶栏
 *
 * 只做场景标题牌这一件事：中文名 + 水平英文装饰 + 返回总览按钮。
 * 返回按钮放在中文名下方一行（用户 2026-11-04 批注）。
 */
import AppIcon from '@/components/base/AppIcon.vue'

withDefaults(
  defineProps<{
    /** 场景中文名 */
    title?: string
    /** 场景英文装饰 */
    titleEn?: string
    /** 中文名字号（设计稿像素，与平台顶栏标题同档） */
    titleSize?: number
  }>(),
  { title: '消防水泵房', titleEn: 'FIRE PUMP ROOM', titleSize: 28 },
)

defineEmits<{ (e: 'back'): void }>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "@/styles/bigscreen-title.scss" as *;

.pr-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  /* 三行标题牌要放得下：英文 12 + 中文名 33.5 + 返回按钮 26 + 两道间距 */
  height: vh(90);
  z-index: 100;
}

/* 底衬：拟态玻璃层，与 Figma 底图同宽，盖住三维模型的深色天空 */
.pr-header__backdrop {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: vw(1932);
  height: 100%;
  background: rgba(0, 52, 106, 0.55);
  backdrop-filter: blur(10px) saturate(135%);
  -webkit-backdrop-filter: blur(10px) saturate(135%);
  pointer-events: none;
}

/* 斜纹底图：铺满整条顶栏（preserveAspectRatio=none，随框拉伸） */
.pr-header__bg {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: vw(1932);
  height: 100%;
  display: block;
  pointer-events: none;
}

/* 底部装饰线：独立图层，按 bottom:0 定位，保证贴住顶栏底边 */
.pr-header__line {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: vw(1932);
  height: vh(4);
  display: block;
  pointer-events: none;
}

/* 装饰线上的流动高光：8s 一轮，沿线滑动 */
.pr-header__glow {
  position: absolute;
  left: 0;
  bottom: 0;
  width: vw(144);
  height: vh(4);
  display: block;
  pointer-events: none;
  animation: pr-header-glow 8s linear infinite;
  will-change: transform;
}

@keyframes pr-header-glow {
  from { transform: translateX(-100%); }
  to { transform: translateX(calc(100vw + 100%)); }
}

/* ===== 标题牌 ===== */
/**
 * 三行：英文装饰 / 中文名 / 返回总览按钮。
 * 返回按钮在中文名下方一行 —— 按钮与中文名同排时会把牌子撑成一条横带，
 * 下面的场景元素容易被压住。
 */
.pump-title {
  position: absolute;
  left: vw(32);
  top: vh(6);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: vh(3);
  padding-left: vw(14);
}

/* 装饰竖线：牌子左缘的渐变光条 */
.pump-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: vw(2);
  background: linear-gradient(to bottom, rgba(127, 212, 255, 0.85) 0%, rgba(127, 212, 255, 0) 100%);
}

/* 水平英文装饰：字距拉开当引导行用 */
.pump-title__en {
  flex-shrink: 0;
  font-family: 'NavKeynote', 'Alibaba PuHuiTi', sans-serif;
  font-size: 12px;
  letter-spacing: 3px;
  line-height: 1;
  color: rgba(127, 212, 255, 0.72);
  white-space: nowrap;
}

.pump-title__cn {
  @include bs-title-text;
}

/* 返回按钮：中文名下方一行 */
.pump-title__back {
  display: flex;
  align-items: center;
  gap: vw(6);
  height: vh(26);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(6, 24, 44, 0.78);
  color: rgba(200, 228, 255, 0.92);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.pump-title__back:hover {
  background: rgba(0, 92, 168, 0.85);
  color: #eaf6ff;
}

.pump-title__back-icon {
  font-size: 14px;
}
</style>
