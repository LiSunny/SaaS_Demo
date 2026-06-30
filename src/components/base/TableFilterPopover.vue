<template>
  <el-popover
    ref="popoverRef"
    placement="bottom"
    :width="200"
    trigger="click"
    :teleported="true"
    popper-class="fi-popper"
  >
    <template #reference>
      <button
        class="filter-btn"
        :class="{ 'filter-active': modelValue.length > 0 }"
        title="筛选"
        @click.stop
      >
        <img :src="filterSvg" class="filter-icon" />
      </button>
    </template>
    <div class="filter-popover-body">
      <el-checkbox-group v-model="checkedValues" class="filter-checkbox-group">
        <el-checkbox
          v-for="opt in options"
          :key="opt.value"
          :label="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </el-checkbox>
      </el-checkbox-group>
      <div class="filter-actions">
        <button class="btn-link" @click="handleReset">重置</button>
        <button class="btn-link btn-link-primary" @click="handleConfirm">确定</button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PopoverInstance } from 'element-plus'
import filterSvg from '@/assets/table/table-header-fliter.svg'

interface FilterOption {
  label: string
  value: string
}

const props = defineProps<{
  options: FilterOption[]
  modelValue: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const popoverRef = ref<PopoverInstance>()
const checkedValues = ref<string[]>([...props.modelValue])

watch(() => props.modelValue, (val) => {
  checkedValues.value = [...val]
})

function handleReset() {
  checkedValues.value = []
  emit('update:modelValue', [])
  popoverRef.value?.hide()
}

function handleConfirm() {
  emit('update:modelValue', [...checkedValues.value])
  popoverRef.value?.hide()
}
</script>

<style scoped>
.filter-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  vertical-align: middle;
}

.filter-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}


.filter-popover-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 12px);
}
.filter-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 8px);
}
.filter-actions {
  display: flex;
  justify-content: space-between;
  padding-top: var(--spacing-md, 8px);
  border-top: 1px solid var(--border-low);
}
.btn-link-primary {
  color: var(--accent-primary);
}
</style>
