<template>
  <div class="plan-status-widget">
    <div class="widget-state">
      <div class="ph-icon">📅</div>
      <p class="ph-title">维保计划</p>
      <p class="ph-sub">即将上线</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()
</script>

<style scoped>
.plan-status-widget {
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.widget-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.ph-icon {
  font-size: 32px;
  opacity: 0.4;
}
.ph-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}
.ph-sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-placeholder);
}
</style>
