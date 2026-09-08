<template>
  <!-- 商铺主体责任系统 · 大标题（独立大屏专用，深色科技风标题条）
       2026-09-03 设计稿 130:20188 风格：深蓝渐变底 + 白→#7FD4FF 渐变标题 + 副标题 -->
  <header class="rsb-header">
    <div class="rsb-header-inner">
      <h1 class="rsb-title">{{ title }}</h1>
      <span v-if="subtitle" class="rsb-subtitle">{{ subtitle }}</span>
    </div>
    <div class="rsb-header-right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.rsb-header {
  /* 覆盖式标题条：absolute 悬浮在地图上方，SVG 半透明段透出地图而非页面底色（2026-09-03 去除标题条后藏蓝底色） */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: vh(86);
  min-height: vh(86);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 vw(20) 0 vw(44);
  /* 大标题背景 = Figma 导出整条 SVG（130:20188 大标题_bg：渐变底+全部装饰，100% 所见即所得，禁止 CSS 重绘） */
  background: url('/linking-subsystem/figma/topbar/overview-title-bg.svg') no-repeat 0 0 / 100% vh(86);
  z-index: 20;
}
.rsb-header-inner {
  display: flex;
  align-items: baseline;
  gap: vw(14);
}
.rsb-title {
  margin: 0;
  font-family: 'Source-KeynoteartHans', sans-serif;
  font-size: vmin(30);
  font-weight: 400;
  line-height: 1;
  color: transparent;
  background: linear-gradient(180deg, #FFFFFF 0%, #7FD4FF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.rsb-subtitle {
  font-size: vmin(13);
  color: rgba(192, 215, 232, 0.75);
  letter-spacing: 0.5px;
}
.rsb-header-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: vw(18);
  z-index: 2;
}
</style>
