<template>
  <section class="sym-picker">
    <header class="sym-picker__head">
      <div class="sym-picker__head-left">
        <span class="sym-picker__title">图元库</span>
        <span class="sym-picker__count">{{ filteredSymbols.length }} 个</span>
      </div>
      <button class="sym-picker__manage" title="图元管理" @click="emit('manage')">
        <AppIcon name="setting" class="sym-picker__manage-icon" />
        图元管理
      </button>
    </header>

    <div class="sym-picker__search">
      <div class="search-input-wrap">
        <input v-model="keyword" class="fi-input" placeholder="搜索图元名称 / ID" />
        <button v-if="keyword" class="fi-clear" @click="keyword = ''">
          <AppIcon name="clear" />
        </button>
        <AppIcon name="search" class="fi-icon" />
      </div>
    </div>

    <div class="sym-picker__body">
      <div v-for="cat in shownCategories" :key="cat" class="sym-picker__cat">
        <button class="sym-picker__cat-head" @click="toggle(cat)">
          <span class="sym-picker__cat-name">{{ cat }}</span>
          <span class="sym-picker__cat-count">{{ listOf(cat).length }}</span>
        </button>
        <div v-show="expanded[cat]" class="sym-picker__items">
          <button
            v-for="s in listOf(cat)"
            :key="s.id"
            class="sym-picker__item"
            :class="{ 'is-active': s.id === active }"
            :title="`${s.id} · ${s.name}`"
            @click="pick(s.id)"
          >
            <SymbolThumb :symbol="s.id" :size="34" :variant="variant" />
            <span class="sym-picker__item-name">{{ s.name }}</span>
          </button>
        </div>
      </div>

      <p v-if="!filteredSymbols.length" class="sym-picker__empty">没有匹配的图元</p>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 图元选择组件（编辑器右侧栏上部）
 *
 * 图元按 8 个分类折叠，点缩略图进入「放置」模式，再到画布上落点。
 * 右上角是图元管理入口。
 */
import { computed, reactive, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import SymbolThumb from '@/components/device-facility/SymbolThumb.vue'
import { SYMBOL_CATEGORIES, SYMBOLS } from '@/symbols'
import type { SceneStyle } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    /** 当前图形风格 */
    variant?: SceneStyle
    /** 处于放置模式的图元 ID */
    active?: string
  }>(),
  { variant: 'image', active: '' },
)

const emit = defineEmits<{
  /** 选中图元 → 进入放置模式 */
  pick: [symbolId: string]
  /** 打开图元管理 */
  manage: []
}>()

const keyword = ref('')
const expanded = reactive<Record<string, boolean>>(
  Object.fromEntries(SYMBOL_CATEGORIES.map((c) => [c, true])),
)

const filteredSymbols = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return SYMBOLS
  return SYMBOLS.filter(
    (s) => s.name.toLowerCase().includes(kw) || s.id.toLowerCase().includes(kw),
  )
})

/** 搜索时只显示命中的分类 */
const shownCategories = computed(() =>
  SYMBOL_CATEGORIES.filter((c) => listOf(c).length > 0),
)

function listOf(cat: string) {
  return filteredSymbols.value.filter((s) => s.category === cat)
}

function toggle(cat: string) {
  expanded[cat] = !expanded[cat]
}

function pick(symbolId: string) {
  emit('pick', symbolId)
}
</script>

<style scoped>
.sym-picker {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

/* 头部 */
.sym-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-low);
}
.sym-picker__head-left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
}
.sym-picker__title {
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--text-primary);
}
.sym-picker__count {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.sym-picker__manage {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  height: 26px;
  padding: 0 var(--spacing-md);
  font: inherit;
  font-size: var(--font-xs);
  color: var(--accent-primary);
  background: var(--accent-primary10);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
}
.sym-picker__manage:hover { filter: brightness(0.95); }
.sym-picker__manage-icon {
  width: 14px;
  height: 14px;
}

/* 搜索 */
.sym-picker__search {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-low);
}
.sym-picker__search .search-input-wrap {
  width: 100%;
}

/* 分类 */
.sym-picker__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
}
.sym-picker__cat + .sym-picker__cat {
  margin-top: var(--spacing-sm);
}
.sym-picker__cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm) 0;
  font: inherit;
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}
.sym-picker__cat-head:hover { color: var(--accent-primary); }
.sym-picker__cat-count {
  font-weight: 400;
  color: var(--text-muted);
}
.sym-picker__items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-xs) 0 var(--spacing-sm);
}
.sym-picker__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-xs);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}
.sym-picker__item:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.sym-picker__item.is-active {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.sym-picker__item-name {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.3;
}
.sym-picker__empty {
  padding: var(--spacing-xl) 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  text-align: center;
}
</style>
