<template>
  <div class="gongmao-section-card" :style="height ? { height } : {}">
    <GongmaoModuleTitle :title="title" />
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import GongmaoModuleTitle from './GongmaoModuleTitle.vue'

defineProps<{
  title: string
  height?: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.gongmao-section-card {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.card-body {
  flex: 1;
  background: linear-gradient(
    180deg,
    rgba(1, 70, 146, 0.4) 0%,
    rgba(4, 87, 167, 0.2) 100%
  );
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-top: none;
  border-radius: 0 0 4px 4px;
  overflow: hidden;
}
</style>
