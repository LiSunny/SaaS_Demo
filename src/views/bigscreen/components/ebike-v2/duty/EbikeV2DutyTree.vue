<template>
  <EbikeV2Card title="管理单元信息" class="tree-panel">
    <div class="tree">
      <!-- 搜索框 -->
      <div class="tree__search">
        <i class="tree__search-icon" />
        <input
          v-model="keyword"
          type="search"
          class="tree__search-input"
          placeholder="节点名称"
          aria-label="节点名称"
        />
      </div>

      <!-- 树：园区 › 分区 › 建筑 › 部位 › 设备 -->
      <div class="tree__body">
        <button
          v-for="row in rows"
          :key="row.node.key"
          type="button"
          class="tree__row"
          :class="[`is-${row.node.level}`, { 'is-active': modelValue === row.node.key }]"
          :style="{ '--depth': row.depth }"
          :title="row.node.label"
          @click="select(row.node.key)"
        >
          <i
            v-if="row.node.children.length"
            class="tree__caret"
            :class="{ 'is-open': expanded[row.node.key] }"
            @click.stop="toggle(row.node.key)"
          />
          <span v-else class="tree__caret tree__caret--none" />
          <span class="tree__icon" :class="`tree__icon--${row.node.level}`" />
          <span class="tree__label">{{ row.node.label }}</span>
          <span class="tree__count">{{ row.node.count }}</span>
        </button>

        <span v-if="!rows.length" class="tree__empty">
          {{ keyword ? '没有匹配的节点' : '暂无待核实事件' }}
        </span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 管理单元信息（园区空间树）
 *
 * 五层：园区 › 分区 › 建筑 › 部位 › 设备。
 * 建筑与楼层取校园三维模型的 POI 真值（60 栋建筑、真实层数），
 * 设备落到哪栋楼由「设备空间归属表」按设备类型生成（演示口径，见 config/duty-locations.ts）。
 *
 * 树的每一层都带待核实事件数，选中任一层即把下方队列筛到该范围。
 * 节点 key 表达筛选范围：
 *   zone-*  按园区分区筛
 *   bld-*   按建筑筛
 *   part-*  按建筑内的部位筛
 *   dev-*   按设备筛（同一台设备跨画面的事件一起出来）
 */
import { computed, ref, watch } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import type { DutySpaceNode } from './duty-data'

const props = defineProps<{
  tree: DutySpaceNode
  /** 当前选中的节点 key */
  modelValue: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const keyword = ref('')

/** 展开状态：默认展开分区与建筑层，部位/设备按需展开 */
const expanded = ref<Record<string, boolean>>({})

function toggle(key: string) {
  expanded.value = { ...expanded.value, [key]: !expanded.value[key] }
}

function select(key: string) {
  emit('update:modelValue', props.modelValue === key ? 'root' : key)
}

/** 首次拿到树时展开分区与建筑层（保留用户已展开/收起的其它节点） */
watch(
  () => props.tree,
  (tree) => {
    const defaults: Record<string, boolean> = {}
    const walk = (n: DutySpaceNode) => {
      if (n.level === 'zone' || n.level === 'building') defaults[n.key] = true
      n.children.forEach(walk)
    }
    tree.children.forEach(walk)
    expanded.value = { ...defaults, ...expanded.value }
  },
  { immediate: true },
)

/** 树摊平成一行行（带层级深度），搜索时自动全展开 */
const rows = computed<Array<{ node: DutySpaceNode; depth: number }>>(() => {
  const kw = keyword.value.trim()

  /** 命中自身或命中子孙则保留 */
  const match = (n: DutySpaceNode): boolean =>
    !kw || n.label.includes(kw) || n.children.some(match)
  /** 剪掉不命中的子树 */
  const keep = (n: DutySpaceNode): DutySpaceNode => ({
    ...n,
    children: n.children.filter(match).map(keep),
  })

  const source = kw ? props.tree.children.filter(match).map(keep) : props.tree.children

  const out: Array<{ node: DutySpaceNode; depth: number }> = []
  const walk = (nodes: DutySpaceNode[], depth: number) => {
    for (const n of nodes) {
      out.push({ node: n, depth })
      // 搜索时全部展开，否则按用户展开状态
      if (n.children.length && (kw || expanded.value[n.key])) walk(n.children, depth + 1)
    }
  }
  walk(source, 0)
  return out
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.tree-panel {
  height: 100%;
}

.tree {
  @include fire-panel;
  gap: vh(8);
}

/* ===== 搜索框 ===== */
.tree__search {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(8);
  height: vh(30);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 30, 68, 0.5);
}

.tree__search-icon {
  flex-shrink: 0;
  width: vw(12);
  height: vw(12);
  border: 1px solid rgba(143, 176, 216, 0.8);
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: vw(-4);
    bottom: vw(-3);
    width: vw(5);
    height: 1px;
    background: rgba(143, 176, 216, 0.8);
    transform: rotate(45deg);
  }
}

.tree__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;

  &::placeholder {
    color: var(--fire-text-dim);
  }
}

/* ===== 树 ===== */
.tree__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.tree__row {
  display: flex;
  align-items: center;
  gap: vw(6);
  width: 100%;
  min-width: 0;
  height: vh(28);
  /* 缩进按层级深度递进：分区 0 → 建筑 1 → 部位 2 → 设备 3 */
  padding: 0 vw(6) 0 calc(#{vw(6)} + var(--depth) * #{vw(14)});
  border: none;
  border-radius: vw(2);
  background: transparent;
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(0, 84, 160, 0.3);
  }
}

.tree__row.is-active {
  background: rgba(0, 84, 160, 0.55);
  color: var(--fire-text-title);
  box-shadow: inset 2px 0 0 rgba(96, 200, 255, 0.8);
}

/* 层级文字权重：分区最重，设备最弱 */
.tree__row.is-zone .tree__label {
  color: var(--fire-text-title);
}

.tree__row.is-building .tree__label {
  color: var(--fire-text-title);
}

.tree__row.is-part .tree__label,
.tree__row.is-device .tree__label {
  color: var(--fire-text-label);
}

/* 展开箭头 */
.tree__caret {
  flex-shrink: 0;
  width: 0;
  height: 0;
  border-top: vh(5) solid rgba(169, 201, 234, 0.75);
  border-right: vw(4) solid transparent;
  border-left: vw(4) solid transparent;
  transform-origin: 50% 40%;
  transition: transform 0.18s;
  cursor: pointer;
}

.tree__caret.is-open {
  transform: rotate(180deg);
}

/* 叶子节点：留同宽占位，保证文字对齐 */
.tree__caret--none {
  border: none;
  width: vw(8);
  cursor: default;
}

/* 层级图标：分区方块 / 建筑圆角块 / 部位小方点 / 设备无 */
.tree__icon {
  flex-shrink: 0;
  width: vw(8);
  height: vw(8);
  border-radius: 1px;
  background: rgba(120, 190, 255, 0.5);
}

.tree__icon--building {
  border-radius: vw(2);
  background: rgba(120, 190, 255, 0.42);
}

.tree__icon--part {
  border-radius: 50%;
  background: rgba(120, 190, 255, 0.28);
}

.tree__icon--device {
  background: transparent;
}

.tree__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 事件数 */
.tree__count {
  flex-shrink: 0;
  font-family: 'Douyin Sans', sans-serif;
  font-size: 14px;
  color: var(--fire-anomaly);
  font-variant-numeric: tabular-nums;
}

.tree__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fire-dim(14);
}
</style>
