<template>
  <div class="placeholder-widget">
    <div class="ph-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <p class="ph-title">{{ moduleName }}</p>
    <p class="ph-sub">即将上线</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const moduleName = computed(() => props.config?.moduleName || '功能模块')
</script>

<style scoped>
.placeholder-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  min-height: 140px;
  color: var(--text-placeholder);
  gap: 8px;
}
.ph-icon {
  opacity: 0.4;
  color: var(--text-placeholder);
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
