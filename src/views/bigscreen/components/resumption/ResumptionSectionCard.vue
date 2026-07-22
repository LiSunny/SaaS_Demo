<template>
  <div class="rm-section-card" :style="height ? { height } : {}">
    <ResumptionModuleTitle :title="title" />
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
}

.rm-card-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(8, 66, 162, 0.3) 0%,
    rgba(5, 51, 125, 0.12) 100%
  );
  border: 1px solid rgba(71, 132, 232, 0.2);
  border-top: none;
  border-radius: 0 0 4px 4px;
  padding: vw(12) vw(16);
}
</style>
