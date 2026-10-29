<template>
  <div class="sm-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="t in tabs"
      :key="t.key"
      type="button"
      role="tab"
      class="sm-tabs__item"
      :class="{ 'sm-tabs__item--on': t.key === modelValue }"
      :aria-selected="t.key === modelValue"
      @click="emit('update:modelValue', t.key)"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 视图切换条（对应设计稿组件「导航/大」）
 *
 * 选中态 = 文字取主色 + 底部 3px 主色下划线；默认态文字取正文色。
 */
import { computed } from 'vue'
import type { SubsystemTabKey } from '@/types/subsystem-scene'

const props = defineProps<{
  modelValue: SubsystemTabKey
  tabs: Array<{ key: SubsystemTabKey; label: string }>
  /** 无障碍标签（各系统自报系统名） */
  systemLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [key: SubsystemTabKey]
}>()

const ariaLabel = computed(() => `${props.systemLabel ?? '子系统'}视图切换`)
</script>

<style scoped>
.sm-tabs {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}
.sm-tabs__item {
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
.sm-tabs__item:hover {
  color: var(--accent-primary);
}
.sm-tabs__item--on {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
.sm-tabs__item:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
</style>
