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
}

.rm-card-body {
  flex: 1;
  background: linear-gradient(
    180deg,
    rgba(1, 70, 146, 0.35) 0%,
    rgba(4, 87, 167, 0.15) 100%
  );
  border: 1px solid rgba(71, 132, 232, 0.25);
  border-top: none;
  border-radius: 0 0 4px 4px;
  overflow: hidden;
  padding: vw(12) vw(16);
}
</style>
