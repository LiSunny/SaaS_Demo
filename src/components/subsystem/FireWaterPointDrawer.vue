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
          v-for="p in pageItems"
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

      <!-- 分页：阀门组 719 个点位一次性铺满会把抽屉渲染撑爆 -->
      <div class="fwd__pager">
        <span class="fwd__range">{{ rangeText }}</span>
        <div class="fwd__pager-actions">
          <button
            type="button"
            class="fwd__pg-btn"
            :disabled="page <= 1"
            @click="page -= 1"
          >
            上一页
          </button>
          <span class="fwd__pg-text">{{ page }} / {{ pageCount }}</span>
          <button
            type="button"
            class="fwd__pg-btn"
            :disabled="page >= pageCount"
            @click="page += 1"
          >
            下一页
          </button>
        </div>
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
const page = ref(1)

/** 每页行数：阀门组 719 个点位，一次性渲染会把抽屉 DOM 撑到上万个节点 */
const PAGE_SIZE = 100

watch(
  () => props.group?.key,
  () => {
    keyword.value = ''
    page.value = 1
  },
)

watch(keyword, () => {
  page.value = 1
})

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

const pageCount = computed(() => Math.max(1, Math.ceil(visible.value.length / PAGE_SIZE)))

/** 当前页的点位 */
const pageItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return visible.value.slice(start, start + PAGE_SIZE)
})

/** 显示区间：明确说清"总共几条、现在看的是哪一段" */
const rangeText = computed(() => {
  const total = visible.value.length
  if (!total) return '无匹配点位'
  const start = (page.value - 1) * PAGE_SIZE + 1
  const end = Math.min(total, page.value * PAGE_SIZE)
  return `显示 ${start}–${end} / 共 ${total} 个点位`
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

/* 分页 */
.fwd__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-low);
}
.fwd__range {
  font-size: var(--font-xs);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.fwd__pager-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.fwd__pg-text {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  text-align: center;
}
.fwd__pg-btn {
  padding: 3px 10px;
  font: inherit;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease;
}
.fwd__pg-btn:hover:not(:disabled) { border-color: var(--accent-primary); color: var(--accent-primary); }
.fwd__pg-btn:disabled { opacity: .45; cursor: not-allowed; }
</style>
