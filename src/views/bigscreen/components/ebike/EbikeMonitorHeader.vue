<template>
  <BigscreenTitleBar title='港南区"人工智能+电动自行车"管理平台'>
    <template #background>
      <!-- Layer 0: 渐变背景 -->
      <div class="header-bg" />

      <!-- Layer 1: 左侧装饰 SVG（Figma Union 279×64） -->
      <img class="header-left-decor" src="@/assets/bigscreen/ebike-header-left.svg" alt="" />

      <!-- Layer 2: 右侧装饰 SVG（Figma Union 332×64） -->
      <img class="header-right-decor" src="@/assets/bigscreen/ebike-header-right.svg" alt="" />

      <!-- Layer 3: 底部分隔线（Figma Component 1: 渐变 + 蓝色方块 + Intersect 辉光） -->
      <div class="header-bottom-line">
        <img class="bottom-glow" src="@/assets/bigscreen/ebike-header-glow.svg" alt="" />
        <div class="bottom-block bottom-block--1" />
        <div class="bottom-block bottom-block--2" />
      </div>
    </template>
  </BigscreenTitleBar>
</template>

<script setup lang="ts">
import BigscreenTitleBar from '../common/BigscreenTitleBar.vue'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== Layer 0: 渐变背景（Figma: Rectangle 7 + blur(3px)） ===== */
.header-bg {
  position: absolute; inset: 0;
  background: linear-gradient(
    265.79deg,
    rgba(29, 134, 255, 0.025) 0%,
    rgba(38, 139, 241, 0.075) 38.46%,
    rgba(43, 126, 204, 0.28) 73.56%,
    rgba(0, 84, 161, 0.43) 100%
  );
}

/* ===== Layer 1: 左侧 SVG 装饰（Figma: 279×64 at x=0 y=0） ===== */
.header-left-decor {
  position: absolute; left: 0; top: 0;
  width: vw(279); height: vh(64);
  display: block; pointer-events: none;
}

/* ===== Layer 2: 右侧 SVG 装饰（Figma: 332×64 at x=1587 y=0） ===== */
.header-right-decor {
  position: absolute; right: 0; top: 0;
  width: vw(332); height: vh(64);
  display: block; pointer-events: none;
}

/* ===== Layer 3: 底部分隔线（Figma Component 1: 渐变 + 蓝色方块 + Intersect 辉光） ===== */
.header-bottom-line {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: vh(4);
  background: linear-gradient(
    90deg,
    rgb(1, 68, 123) 0%,
    rgb(67, 142, 204) 17.4%,
    rgb(65, 139, 201) 25.1%,
    rgb(104, 186, 253) 49.5%,
    rgb(1, 68, 123) 100%
  );
}

/* Intersect 辉光（Figma: 143.925×4 at x≈457.76） */
.bottom-glow {
  position: absolute; left: vw(457.76); top: 0;
  width: vw(143.925); height: 100%;
  display: block; pointer-events: none;
}

/* 蓝色方块①（Figma: 13×4 at x=912.5） */
.bottom-block--1 {
  position: absolute; left: vw(912.5); top: 0;
  width: vw(13); height: 100%;
  background: #0086e4;
}

/* 蓝色方块②（Figma: 27×4 at x=981.5） */
.bottom-block--2 {
  position: absolute; left: vw(981.5); top: 0;
  width: vw(27); height: 100%;
  background: #0086e4;
}
</style>
