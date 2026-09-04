<template>
  <!-- 模块小标题（Figma 节点 128:19601「模块小标题」：384×39 SVG 背景原样导出 + 文字浮上层）
       标题最多 6 个汉字（2026-09-03 用户定） -->
  <div class="ov-module-title">
    <span class="ov-module-title-text">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style lang="scss">
/* 非 scoped：.ov-module-title-* 同名类在 OverviewOverlay 组件内也引用本组件时样式不丢（统一单一来源） */
@use "@/styles/function.scss" as *;

.ov-module-title {
  position: relative;
  flex-shrink: 0;
  height: vh(39);
  background: url('/linking-subsystem/figma/overview/ov-module-title-bg.svg') no-repeat 0 0 / 100% vh(39);
}
.ov-module-title-text {
  position: absolute;
  left: vw(16);
  top: 0;
  height: vh(39);
  display: inline-flex;
  align-items: center;
  font-family: sans-serif;
  font-size: vmin(18);
  line-height: 1;
  font-weight: 600;
  background: linear-gradient(180deg, #FFFFFF 0%, #89D2FF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  /* text-shadow: 0 2px 4px rgba(0, 40, 80, 0.4); */
}
</style>
