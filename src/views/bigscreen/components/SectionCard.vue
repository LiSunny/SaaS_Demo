<template>
  <div class="section-card" :style="height ? { height } : {}">
    <!-- 标题区：复用 BigscreenModuleTitle -->
    <BigscreenModuleTitle
      :title="title"
      :subtitle="subtitle"
      :show-zoom="showZoom"
      :is-zoomed="isZoomed"
      :subtitle-clickable="subtitleClickable"
      @zoom-click="$emit('zoom-click')"
      @subtitle-click="$emit('zoom-click')"
    />

    <!-- 内容区 -->
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import BigscreenModuleTitle from './BigscreenModuleTitle.vue'

defineProps<{
  title: string
  subtitle: string
  height?: string
  showZoom?: boolean
  isZoomed?: boolean
  subtitleClickable?: boolean
}>()

defineEmits<{
  'zoom-click': []
}>()
</script>

<style scoped>
.section-card {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* ===== 内容区 ===== */
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
