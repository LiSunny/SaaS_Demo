<template>
  <GongmaoSectionCard title="应消一体救援联动">
    <div class="placeholder">
      <p class="placeholder-text">应消一体救援联动</p>
      <p class="placeholder-hint">待实现 — 视频监控画面 + 预警事件列表</p>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import GongmaoSectionCard from './GongmaoSectionCard.vue'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
.placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; min-height: vh(200); gap: vh(8);
}
.placeholder-text { font-size: clamp(14px, calc(18 * var(--min-scale)), 20px); color: rgba(255,255,255,0.4); margin: 0; }
.placeholder-hint { font-size: clamp(11px, calc(13 * var(--min-scale)), 15px); color: rgba(255,255,255,0.2); margin: 0; }
</style>
