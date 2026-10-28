<template>
  <el-drawer
    :model-value="modelValue"
    :title="group?.title ?? ''"
    size="480px"
    @update:model-value="(v: boolean) => !v && emit('update:modelValue', false)"
  >
    <div v-if="group" class="fwd">
      <!-- 组信息：数量口径必须写清，避免把"显示了几条"当成"总共几条" -->
      <div class="fwd__meta">
        <span class="fwd__count">{{ group.points.length }} 个点位</span>
        <span class="fwd__count" :class="{ 'fwd__count--bad': abnormalCount > 0 }">
          {{ abnormalCount }} 个异常
        </span>
        <span class="fwd__desc">{{ group.desc }}</span>
      </div>

      <el-input
        v-model="keyword"
        size="small"
        placeholder="搜索编号 / 位置"
        clearable
        class="fwd__search"
      >
        <template #prefix><AppIcon name="search" /></template>
      </el-input>

      <div class="fwd__list">
        <PointRow
          v-for="p in visible"
          :key="p.id"
          :point="p"
          :runtime="getRuntime(p.id)"
          @open="emit('open', $event)"
        />
        <el-empty
          v-if="!visible.length"
          :description="keyword.trim() ? '没有匹配的点位' : '该组暂无点位'"
          :image-size="60"
        />
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * 组态下钻 · 点位组抽屉
 *
 * 列出某个图元（或核心数据卡）所辖的全部点位，异常优先排序。
 * 点行后交给上层切到 PointDetailDrawer 看单点详情。
 */
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import PointRow from './PointRow.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import { STATUS_ORDER } from './status-labels'
import type { PointDef } from '@/types/subsystem'
import type { FireWaterPointGroup } from '@/types/firewater'

const props = defineProps<{
  modelValue: boolean
  group?: FireWaterPointGroup
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  /** 点行 → 打开单点详情 */
  open: [point: PointDef]
}>()

const store = useSubsystemStore()
const { getRuntime } = store

const keyword = ref('')

watch(
  () => props.group?.key,
  () => {
    keyword.value = ''
  },
)

function statusOf(p: PointDef) {
  return getRuntime(p.id)?.status ?? 'unknown'
}

/** 异常优先、其次按编号 */
const sorted = computed(() =>
  [...(props.group?.points ?? [])].sort((a, b) => {
    const d = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)]
    return d !== 0 ? d : a.code.localeCompare(b.code)
  }),
)

const abnormalCount = computed(() => sorted.value.filter(p => statusOf(p) !== 'normal').length)

const visible = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return sorted.value
  return sorted.value.filter(
    p =>
      p.code.toLowerCase().includes(kw) ||
      p.location.toLowerCase().includes(kw),
  )
})
</script>

<style scoped>
.fwd {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
  min-height: 0;
}

.fwd__meta {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
.fwd__count {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.fwd__count--bad { color: var(--danger-text); font-weight: 600; }
.fwd__desc { font-size: var(--font-xs); color: var(--text-muted); }

.fwd__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 2px;
}
</style>
