<template>
  <section class="tree">
    <!-- ===== 搜索框（设计稿 #140:25755「列表组件 · 搜索框」） ===== -->
    <div class="tree__search">
      <input
        ref="searchInput"
        v-model="keyword"
        type="search"
        class="tree__search-input"
        placeholder="节点名称"
        aria-label="节点名称"
      />
      <img class="tree__search-icon" :src="searchIcon" alt="搜索" @click="focusSearch" />
    </div>

    <!-- ===== 树：园区 › 分区 › 建筑 › 部位 › 设备 ===== -->
    <div class="tree__body">
      <button
        v-for="row in rows"
        :key="row.node.key"
        type="button"
        class="tree__row"
        :class="[
          { 'is-active': modelValue === row.node.key, 'is-leaf': !row.node.children.length },
          `is-${row.node.level}`,
        ]"
        :style="{ '--depth': row.depth }"
        :title="row.node.label"
        @click="select(row.node.key)"
      >
        <!-- 展开折叠按钮：设计稿「展开折叠」24×24 -->
        <span
          v-if="row.node.children.length"
          class="tree__caret"
          :class="{ 'is-open': expanded[row.node.key] }"
          role="button"
          :aria-label="expanded[row.node.key] ? '收起' : '展开'"
          @click.stop="toggle(row.node.key)"
        >
          <img :src="caretIcon" alt="" />
          <img v-if="!expanded[row.node.key]" class="tree__caret-bar" :src="caretIcon" alt="" />
        </span>

        <!-- 管理单元图标：设计稿「管理单元树icon」24×24 -->
        <img class="tree__unit" :src="unitIcon" alt="" />

        <span class="tree__label">{{ row.node.label }}</span>
        <span v-if="row.node.count" class="tree__count">{{ row.node.count }}</span>
      </button>

      <span v-if="!rows.length" class="tree__empty">
        {{ keyword ? '没有匹配的节点' : '暂无设备' }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 实时警情页 · 管理单元信息（园区空间树）
 *
 * 版式按 Figma「智能安全管控平台/实时警情」节点 86:8287 的树卡 #140:25754：
 *
 *   搜索框   设计稿 #140:25755「列表组件 · 搜索框」：左侧标题「节点名称」+ 右侧放大镜 18×18
 *   树行     [展开折叠 24×24] [管理单元树icon 24×24] 名称 16px
 *   缩进     图标列落在 48 + 层级 × 16 px（设计稿三档实测：根 48 / 二级 64 / 叶子 78）
 *   选中态   底 rgba(37,135,255,.12) + 描边 #63A9FF + 名称转白
 *
 * 树的组织维度是**园区空间**（园区 › 分区 › 建筑 › 部位 › 设备），不是消防系统：
 * 建筑与楼层取校园三维模型的 POI 真值，设备落到哪栋楼由「设备空间归属表」
 * 按设备类型生成（平台暂无设备↔建筑的关联，见 config/duty-locations.ts）。
 *
 * 与设计稿的有意偏离：
 *   节点右侧保留待核实事件数。设计稿的树是通用组织树、没有告警数据；
 *   本页的树是"哪栋楼有异常"的导航，去掉计数就只剩一列楼名。
 */
import { computed, ref, watch } from 'vue'
import type { DutySpaceNode } from './duty-data'

const props = defineProps<{
  tree: DutySpaceNode
  /** 当前选中的节点 key */
  modelValue: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const keyword = ref('')

/** 设计稿素材：展开折叠按钮 / 管理单元树图标 / 放大镜 */
const caretIcon = new URL('@/assets/bigscreen/ebike-v2/duty/tree-caret.svg', import.meta.url).href
const unitIcon = new URL('@/assets/bigscreen/ebike-v2/duty/tree-unit.svg', import.meta.url).href
const searchIcon = new URL('@/assets/bigscreen/ebike-v2/duty/tree-search.svg', import.meta.url).href

/** 展开状态：默认只展开选中节点的祖先路径，别的分支由用户自己点开 */
const expanded = ref<Record<string, boolean>>({})

function toggle(key: string) {
  expanded.value = { ...expanded.value, [key]: !expanded.value[key] }
}

function select(key: string) {
  emit('update:modelValue', props.modelValue === key ? 'root' : key)
}

/** 放大镜：把焦点交给输入框 */
const searchInput = ref<HTMLInputElement | null>(null)
function focusSearch() {
  searchInput.value?.focus()
}

/** 某节点到根的路径（不含自身） */
function pathTo(node: DutySpaceNode, key: string, acc: string[] = []): string[] | null {
  if (node.key === key) return acc
  for (const c of node.children) {
    const hit = pathTo(c, key, [...acc, node.key])
    if (hit) return hit
  }
  return null
}

/**
 * 展开选中节点的路径（祖先 + 自身，保留用户已展开、收起的其它节点）
 *
 * 树是完整管理单元树（园区 › 分区 › 建筑 › 部位 › 设备），
 * 全展开会糊成几十行；只展开选中路径，进场时看到的是"当前位置 + 它的上下级"。
 */
watch(
  [() => props.tree, () => props.modelValue],
  ([tree, key]) => {
    const path = pathTo(tree, key) ?? []
    const next = { ...expanded.value }
    for (const k of path) next[k] = true
    // 选中节点自身也展开：分区选中时能看到它下面的楼栋
    if (tree.key !== key) next[key] = true
    expanded.value = next
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

  const source = kw ? [keep(props.tree)] : [props.tree]

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

/* 树卡：设计稿 #140:25754（368 宽、圆角 8、内距 12、行距 6） */
.tree {
  flex-shrink: 0;
  width: vw(368);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(6);
  padding: vw(12);
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(8);
  background: rgba(0, 44, 94, 0.72);
}

/* ===== 搜索框：设计稿 #140:25755 ===== */
.tree__search {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(8);
  height: vh(36);
  padding: 0 vw(16);
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(8);
  background: rgba(0, 44, 94, 0.72);
}

.tree__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);

  &::placeholder {
    color: #8fb0d8;
  }

  &::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
  }
}

.tree__search-icon {
  flex-shrink: 0;
  width: vw(18);
  height: vw(18);
  cursor: pointer;
}

/* ===== 树 ===== */
.tree__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 树行：设计稿 [展开折叠][管理单元icon] 名称
   缩进按图标列落点算：48 + 层级 × 16。
   有折叠按钮的行要让出 24(按钮) + 12(间距)，叶子行没有按钮、直接顶到图标列。 */
.tree__row {
  display: flex;
  align-items: center;
  gap: vw(8);
  width: 100%;
  min-width: 0;
  padding: vh(8) vw(12);
  padding-left: calc(#{vw(12)} + var(--depth) * #{vw(16)});
  border: 1px solid transparent;
  border-radius: vw(8);
  background: transparent;
  color: #8fbdf9;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  font-weight: 500;
  letter-spacing: -0.0094em;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    background: rgba(37, 135, 255, 0.08);
  }
}

/* 叶子行没有折叠按钮：内距直接顶到图标列
   （设计稿叶子行 padding-left 78 → 46 + 层级 × 16） */
.tree__row.is-leaf {
  padding-left: calc(#{vw(46)} + var(--depth) * #{vw(16)});
}

/* 选中态：设计稿 #140:25771 */
.tree__row.is-active {
  background: rgba(37, 135, 255, 0.12);
  border-color: #63a9ff;
  color: #ffffff;
}

/* 展开折叠按钮：设计稿「展开折叠」24×24
   按钮与图标之间留 12（= 行内 gap 8 + 按钮自带 4），图标列才落在设计稿的
   48 / 64 落点上 */
.tree__caret {
  flex-shrink: 0;
  position: relative;
  width: vw(24);
  height: vw(24);
  margin-right: vw(4);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }
}

/* 收起态：把同一枚「—」竖过来拼成「＋」（设计稿只给了展开态） */
.tree__caret-bar {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(90deg);
}

/* 管理单元图标 */
.tree__unit {
  flex-shrink: 0;
  width: vw(24);
  height: vw(24);
  display: block;
}

.tree__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 待核实事件数 */
.tree__count {
  flex-shrink: 0;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
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
