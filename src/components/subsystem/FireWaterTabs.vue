<template>
  <nav class="fw-tabs" role="tablist" aria-label="消防水系统视图切换">
    <button
      v-for="t in tabs"
      :key="t.key"
      type="button"
      role="tab"
      class="fw-tabs__item"
      :class="{ 'fw-tabs__item--on': t.key === modelValue }"
      :aria-selected="t.key === modelValue"
      @click="emit('update:modelValue', t.key)"
    >
      {{ t.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
/**
 * 视图切换条（对应设计稿组件「导航/大」）
 *
 * 选中态 = 文字取主色 + 底部 3px 主色下划线；默认态文字取正文色。
 */
import type { FireWaterTabKey } from '@/types/firewater'

defineProps<{
  modelValue: FireWaterTabKey
  tabs: Array<{ key: FireWaterTabKey; label: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [key: FireWaterTabKey]
}>()
</script>

<style scoped>
.fw-tabs {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.fw-tabs__item {
  padding: 10px;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: color .2s ease, border-color .2s ease;
}
.fw-tabs__item:hover {
  color: var(--accent-primary);
}
.fw-tabs__item--on {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
.fw-tabs__item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>
