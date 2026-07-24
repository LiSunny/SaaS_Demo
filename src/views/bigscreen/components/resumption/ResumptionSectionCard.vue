<template>
  <div class="rm-section-card" :style="height ? { height } : {}">
    <ResumptionModuleTitle :title="title" />
    <!-- 内容区（Figma: background/card = #00336a） -->
    <div class="rm-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import ResumptionModuleTitle from './ResumptionModuleTitle.vue'

defineProps<{
  title: string
  height?: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.rm-section-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
}

/* ===== 内容区（Figma: background/card #00336A, stroke #1565A4） ===== */
.rm-card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #00336A;
  border: 1px solid #1565A4;
  border-radius: 0 0 4px 4px;
  margin-top: vh(8);
  padding: vh(16) 0 vh(12);
}
</style>
