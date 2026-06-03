<template>
  <Suspense>
    <template #default>
      <component :is="widgetComponent" :widget-id="widgetId" :config="config" />
    </template>
    <template #fallback>
      <div class="widget-loading">
        <el-skeleton :rows="3" animated />
      </div>
    </template>
  </Suspense>
  <div v-if="error" class="widget-error">
    <span class="widget-error-icon">⚠</span>
    <span class="widget-error-text">组件加载失败</span>
    <button class="widget-error-retry" @click="retry">重试</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'
import { widgetRegistry, type WidgetType } from '@/config/widget-registry'

const props = defineProps<{
  type: WidgetType
  widgetId: string
  config?: Record<string, any>
}>()

const error = ref(false)
const componentKey = ref(0)

const widgetComponent = computed(() => {
  return widgetRegistry[props.type] || null
})

function retry() {
  error.value = false
  componentKey.value++
}

onErrorCaptured((err) => {
  console.error(`[WidgetRenderer] Error loading "${props.type}":`, err)
  error.value = true
  return false
})
</script>

<style scoped>
.widget-loading {
  padding: 16px;
}
.widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 8px;
  color: var(--text-secondary);
  min-height: 120px;
}
.widget-error-icon {
  font-size: 24px;
}
.widget-error-text {
  font-size: 14px;
}
.widget-error-retry {
  background: var(--accent-primary);
  color: #fff;
  border: none;
  padding: 4px 16px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  font-size: 13px;
}
.widget-error-retry:hover {
  opacity: 0.9;
}
</style>
