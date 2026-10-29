<template>
  <div class="section-title">
    <!-- Layer 0: 渐变背景 + 底部边框 -->
    <div class="title-bg" />

    <!-- Layer 1: 底部 Intersect 装饰（Figma: bottom-0, left 25.79px, 191×5px） -->
    <img class="title-intersect" src="@/assets/bigscreen/section-intersect.svg" alt="" />

    <!-- Layer 2: 左侧装饰 Group4（Figma: bottom 1.63px, left 2.76px, 26×35px） -->
    <img class="title-deco-left" src="@/assets/bigscreen/section-deco-left.svg" alt="" />

    <!-- Layer 3: 右侧装饰 Union（Figma: bottom 0.73px, right 18.53px, 44×20px） -->
    <img class="title-deco-right" src="@/assets/bigscreen/section-deco-right.svg" alt="" />

    <!-- Layer 4: 标题文字（Figma: left 39.87px, 垂直居中, Source-KeynoteartHans 22px, white→#89b5ff） -->
    <span class="title-text">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.section-title {
  position: relative;
  height: vh(40);
  width: 100%;
  flex-shrink: 0;
}

/* Layer 0: 渐变背景 + 底部边框（Figma: #06406e → rgba(12,123,212,0), border-bottom rgba(128,209,253,0.15)） */
.title-bg {
  position: absolute;
  inset: 0 0 0.02px 0;
  background: linear-gradient(
    to right,
    #06406e 0%,
    rgba(12, 123, 212, 0) 100%
  );
  border-bottom: 1px solid rgba(128, 209, 253, 0.15);
  border-radius: 2px;
}

/* Layer 1: Intersect 底部装饰（191×5px at bottom 0, left 25.79px） */
.title-intersect {
  position: absolute;
  left: vw(25.79); bottom: 0;
  width: vw(191.074); height: vh(4.896);
  display: block; pointer-events: none;
}

/* Layer 2: 左侧装饰（26×35px at bottom 1.63px, left 2.76px） */
.title-deco-left {
  position: absolute;
  left: vw(2.76); bottom: vh(1.63);
  width: vw(25.849); height: vh(34.771);
  display: block; pointer-events: none;
}

/* Layer 3: 右侧装饰（44×20px at bottom 0.73px, right 18.53px） */
.title-deco-right {
  position: absolute;
  right: vw(18.53); bottom: vh(0.73);
  width: vw(44.21); height: vh(20.271);
  display: block; pointer-events: none;
}

/* Layer 4: 标题文字（Figma: left 39.87px, 垂直居中, Source-KeynoteartHans 22px, white→#89b5ff） */
.title-text {
  position: absolute;
  left: vw(39.87); top: 50%; transform: translateY(-50%);
  font-family: 'Source-KeynoteartHans', 'YouSheBiaoTiHei', 'PingFang SC', sans-serif;
  font-size: clamp(16px, calc(22 * var(--min-scale)), 22px);
  font-weight: 400; line-height: vh(33);
  background: linear-gradient(to bottom, #ffffff 0%, #c8e4ff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}
</style>
