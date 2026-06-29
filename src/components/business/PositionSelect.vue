<template>
  <div class="pos-select">
    <el-checkbox-group :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
      <div v-for="p in positionList" :key="p.key" class="pos-item">
        <el-checkbox :label="p.key" :value="p.key">
          <span class="pos-name">{{ p.name }}</span>
        </el-checkbox>
        <span class="pos-desc">{{ p.description || '暂无说明' }}</span>
      </div>
    </el-checkbox-group>
    <div v-if="positionList.length === 0" class="pos-empty">暂无岗位可选</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPositionList } from '@/api/position-admin'
import { ALL_POSITIONS } from '@/config/positions'
import type { PositionItem } from '@/types/position-admin'

defineProps<{
  modelValue: string[]
}>()

defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const positionList = ref<PositionItem[]>([])

onMounted(async () => {
  try {
    const res = await getPositionList({ page: 1, size: 50 })
    positionList.value = res.data
  } catch {
    // API 不可用时 fallback 到静态岗位配置（DAO Mock 模式）
    positionList.value = ALL_POSITIONS.map(p => ({
      id: 0,
      name: p.name,
      key: `platform:${p.key}`,        // 使用 platform: 前缀与创建企业写入一致
      description: p.description,
      userCount: 0,
      isBuiltin: true,
      createdAt: '',
    }))
  }
})
</script>

<style scoped>
.pos-select {
  max-height: 300px;
  overflow-y: auto;
}
.pos-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-light, rgba(0,0,0,.04));
}
.pos-item:last-child {
  border-bottom: none;
}
.pos-name {
  font-weight: 500;
  font-size: var(--font-small, 14px);
}
.pos-desc {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  line-height: 1.6;
  flex: 1;
  margin-left: 4px;
}
.pos-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 24px 0;
  font-size: var(--font-small, 14px);
}
</style>
