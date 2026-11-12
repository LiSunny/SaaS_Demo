<template>
  <div class="form-designer-wrap">
    <DesignerInner ref="innerRef" :initial-fields="initialFields" :readonly="readonly" />
  </div>
</template>

<script setup lang="ts">
/**
 * 表单设计器（外层壳）
 *
 * 真正的设计器实现拆到 FormDesignerInner.vue，通过 defineAsyncComponent 异步加载。
 * 目的：@form-create/designer 会连带引入 element-plus 全量（约 1.5MB），
 * 放进入口 chunk 会拖垮首屏；拆开后只在这一个低频页面按需下载。
 *
 * 对外接口保持不变：props(initialFields / readonly) + expose(getFields / setFields)。
 */
import { ref, defineAsyncComponent } from 'vue'
import type { FormField } from '@/types/workflow'

const DesignerInner = defineAsyncComponent(() => import('./FormDesignerInner.vue'))

defineProps<{
  initialFields?: FormField[]
  readonly?: boolean
}>()

const innerRef = ref<InstanceType<typeof import('./FormDesignerInner.vue').default>>()

function getFields(): FormField[] {
  return innerRef.value?.getFields?.() ?? []
}

function setFields(fields: FormField[]) {
  innerRef.value?.setFields?.(fields)
}

defineExpose({ getFields, setFields })
</script>

<style scoped>
.form-designer-wrap {
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg, 10px);
  border: 1px solid var(--border-default);
}
</style>
