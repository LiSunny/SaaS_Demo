<template>
  <div class="standalone-layout">
    <router-view />
    <AgentFloatingChat />
  </div>
</template>

<script setup lang="ts">
import AgentFloatingChat from '@/views/bigscreen/components/AgentFloatingChat.vue'
</script>

<!-- 全局非 scoped 样式：vw/vh 变量 + overflow 控制 -->
<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

:root {
  --dw: 1920;
  --dh: 1080;
  /* 1 设计px 的水平/垂直换算 */
  --w: calc(100vw / var(--dw));
  --h: calc(100vh / var(--dh));
  /* 等比缩放因子：取宽高中较小的一边，保证圆形、字体不变形 */
  --min-scale: min(var(--w), var(--h));
}
</style>

<style scoped>
.standalone-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #010e23;
}
</style>
