<template>
  <GongmaoSectionCard title="设备智慧运维管理">
    <div class="placeholder">
      <p class="placeholder-text">设备智慧运维管理</p>
      <p class="placeholder-hint">待实现 — KPI 指标卡 + 保养表格</p>
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
  height: 100%; min-height: vh(220); gap: vh(8);
}
.placeholder-text { font-size: clamp(14px, calc(18 * var(--min-scale)), 20px); color: rgba(255,255,255,0.4); margin: 0; }
.placeholder-hint { font-size: clamp(11px, calc(13 * var(--min-scale)), 15px); color: rgba(255,255,255,0.2); margin: 0; }
</style>
