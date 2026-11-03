<template>
  <EbikeV2Card :title="title" class="list-panel">
    <!-- ===== ① tab 条：按记录类型分类 ===== -->
    <div class="list-panel__tabs" role="tablist" aria-label="档案分类">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        role="tab"
        class="list-panel__tab"
        :class="{ 'is-active': t.key === activeTab }"
        :aria-selected="t.key === activeTab"
        @click="emit('update:activeTab', t.key)"
      >
        {{ t.label }}
        <span class="list-panel__tab-count">{{ t.rows.length }}</span>
      </button>
    </div>

    <!-- ===== ② 工具条：筛选下拉 + 搜索 ===== -->
    <div ref="toolbarRef" class="list-panel__toolbar">
      <div v-for="f in filters" :key="f.key" class="list-panel__filter-wrap">
        <button
          type="button"
          class="list-panel__filter"
          :aria-expanded="openFilter === f.key"
          :aria-haspopup="'listbox'"
          @click="toggleFilter(f.key)"
        >
          {{ filterValue(f) }}
          <i class="list-panel__caret" />
        </button>

        <div v-if="openFilter === f.key" class="list-panel__menu" role="listbox">
          <button
            v-for="opt in f.options"
            :key="opt"
            type="button"
            role="option"
            class="list-panel__menu-item"
            :class="{ 'is-active': filterValue(f) === opt }"
            :aria-selected="filterValue(f) === opt"
            @click="pickFilter(f.key, opt)"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <label class="list-panel__search">
        <i class="list-panel__search-icon" />
        <input
          v-model="searchProxy"
          class="list-panel__search-input"
          type="search"
          :placeholder="searchPlaceholder"
        />
      </label>
    </div>

    <!-- ===== ③ 表格：表头 sticky（随内容横向滚动，纵向不滚） ===== -->
    <div class="list-panel__table">
      <div class="list-panel__head" :style="{ gridTemplateColumns: gridTemplate }">
        <span v-for="c in columns" :key="c.key" class="list-panel__th">{{ c.label }}</span>
      </div>

      <div class="list-panel__rows">
        <div
          v-for="(row, i) in pageRows"
          :key="i"
          class="list-panel__row"
          :style="{ gridTemplateColumns: gridTemplate }"
        >
          <span
            v-for="c in columns"
            :key="c.key"
            class="list-panel__td"
            :class="`is-${c.type ?? 'text'}`"
            :title="cellTitle(c, row)"
          >
            <!-- 状态胶囊 -->
            <span
              v-if="c.type === 'status'"
              class="list-panel__status"
              :class="statusClass(row[c.key])"
            >
              {{ row[c.key] }}
            </span>

            <!-- 标签小片 -->
            <span v-else-if="c.type === 'tag'" class="list-panel__tag">{{ row[c.key] }}</span>

            <!-- 操作：演示态，只给反馈 -->
            <template v-else-if="c.type === 'action'">
              <button type="button" class="list-panel__act" title="查看" @click="onAction('查看')">
                <Eye :size="14" />
              </button>
              <button type="button" class="list-panel__act" title="编辑" @click="onAction('编辑')">
                <Pencil :size="14" />
              </button>
              <button type="button" class="list-panel__act" title="删除" @click="onAction('删除')">
                <Trash2 :size="14" />
              </button>
            </template>

            <template v-else>{{ row[c.key] }}</template>
          </span>
        </div>

        <span v-if="!rows.length" class="list-panel__empty">{{ emptyText }}</span>
      </div>
    </div>

    <!-- ===== ④ 分页：Element Plus 分页器（样式走项目大屏深色主题） ===== -->
    <div class="list-panel__foot">
      <el-pagination
        :current-page="safePage"
        :page-size="pageSize"
        :page-sizes="PAGE_SIZES"
        :total="rows.length"
        layout="total, sizes, prev, pager, next"
        :pager-count="5"
        background
        popper-class="bigscreen-el-select-dropdown"
        @update:current-page="emit('update:page', $event)"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <!-- ===== 操作反馈 ===== -->
    <Transition name="toast">
      <div v-if="toast" class="list-panel__toast">{{ toast }}</div>
    </Transition>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 主区列表面板
 *
 * 消防档案页的列表容器：tab 条（记录类型）→ 工具条（筛选下拉 + 搜索）
 * → 表格（表头 sticky + 数据行）→ 底部计数。
 *
 * 表格用 CSS Grid 而不是 flex：列宽由数据给出（`minmax(最小宽, 占比fr)`），
 * 表头与数据行共用同一份 `grid-template-columns`，列必然对齐；
 * 窄视口时轨道按最小宽撑开、容器横向滚动，列不会被压扁（时间戳不折行）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Eye, Pencil, Trash2 } from 'lucide-vue-next'
import EbikeV2Card from './EbikeV2Card.vue'
import { STATUS_TONE } from './archive/archive-data'
import type {
  ArchiveColumn,
  ArchiveFilter,
  ArchiveRow,
  ArchiveTab,
  ArchiveTabKey,
} from './archive/archive-data'

const props = withDefaults(
  defineProps<{
    /** 面板标题 */
    title: string
    /** 记录类型（tab）列表 */
    tabs: ArchiveTab[]
    /** 当前 tab 的 key */
    activeTab: ArchiveTabKey
    /** 当前 tab 过滤后的行 */
    rows: ArchiveRow[]
    /** 当前页码（1 起） */
    page: number
    /** 每页条数 */
    pageSize: number
    /** 当前 tab 的搜索词 */
    search: string
    /** 当前 tab 各筛选维度的选中值 */
    filterValues: Record<string, string>
    /** 搜索框占位文案 */
    searchPlaceholder?: string
    /** 空数据区文案 */
    emptyText?: string
  }>(),
  {
    searchPlaceholder: '搜索关键字',
    emptyText: '暂无消防档案数据',
  },
)

const emit = defineEmits<{
  (e: 'update:activeTab', key: ArchiveTabKey): void
  (e: 'update:search', value: string): void
  (e: 'update:filterValues', value: Record<string, string>): void
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

/** 每页条数可选值 */
const PAGE_SIZES = [10, 20, 50]

/** 当前 tab 定义 */
const currentTab = computed(() => props.tabs.find((t) => t.key === props.activeTab) ?? props.tabs[0])

/** 当前 tab 的列 */
const columns = computed<ArchiveColumn[]>(() => currentTab.value?.columns ?? [])

/** 当前 tab 的筛选维度 */
const filters = computed<ArchiveFilter[]>(() => currentTab.value?.filters ?? [])

/** 总页数 */
const totalPages = computed(() => Math.max(1, Math.ceil(props.rows.length / props.pageSize)))

/**
 * 实际使用的页码：越界时收敛。
 * 切 tab 后上一页码可能超出该 tab 的页数（每个 tab 的页码各自记住）。
 */
const safePage = computed(() => Math.min(Math.max(1, props.page), totalPages.value))

/** 当前页显示的行 */
const pageRows = computed(() => {
  const start = (safePage.value - 1) * props.pageSize
  return props.rows.slice(start, start + props.pageSize)
})

/** 改每页条数：回到第一页（否则可能停在新页数下的越界页） */
function onPageSizeChange(size: number) {
  emit('update:pageSize', size)
  emit('update:page', 1)
}

/**
 * 列宽模板：`minmax(最小宽, 占比fr)`。
 * 最小宽兜底窄视口不压列（宁可横向滚动，也不让时间戳折行）。
 */
const gridTemplate = computed(() =>
  columns.value.map((c) => `minmax(${c.minWidth ?? 80}px, ${c.flex}fr)`).join(' '),
)

/* ============================================================
 * 搜索
 * ============================================================ */

const searchProxy = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v),
})

/* ============================================================
 * 筛选下拉
 * ============================================================ */

/** 当前展开的下拉 key */
const openFilter = ref('')
const toolbarRef = ref<HTMLElement | null>(null)

/** 某维度的当前取值（未选时取第一项「全部」） */
function filterValue(f: ArchiveFilter): string {
  return props.filterValues[f.key] ?? f.options[0]
}

function toggleFilter(key: string) {
  openFilter.value = openFilter.value === key ? '' : key
}

function pickFilter(key: string, value: string) {
  emit('update:filterValues', { ...props.filterValues, [key]: value })
  openFilter.value = ''
}

/** 点击面板外关闭下拉 */
function onDocClick(e: MouseEvent) {
  if (!openFilter.value) return
  const el = toolbarRef.value
  if (el && !el.contains(e.target as Node)) openFilter.value = ''
}

/** Esc 关闭下拉 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') openFilter.value = ''
}

/** 切 tab 时收起下拉 */
watch(
  () => props.activeTab,
  () => {
    openFilter.value = ''
  },
)

/* ============================================================
 * 单元格
 * ============================================================ */

/** 状态胶囊：异常走异常红，其余走中性色阶（全页只留一个红） */
function statusClass(value: string): string {
  return STATUS_TONE[value] === 'abnormal' ? 'is-abnormal' : 'is-normal'
}

/** 文本类单元格给 title，长文本被省略时仍可看全 */
function cellTitle(c: ArchiveColumn, row: ArchiveRow): string | undefined {
  if (c.type === 'status' || c.type === 'tag' || c.type === 'action') return undefined
  return row[c.key]
}

/* ============================================================
 * 操作反馈
 * ============================================================ */

const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function flash(text: string) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
    toastTimer = null
  }, 2600)
}

/** 操作列：本期只落 mock 数据，点击给明示反馈，不静默无响应 */
function onAction(kind: string) {
  flash(`演示数据，暂未接入「${kind}」操作`)
}

/* ============================================================
 * 生命周期
 * ============================================================ */

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire/fire-common.scss" as fire;

.list-panel {
  height: 100%;
}

/* 卡片内容区改为纵向排列：tab 条 / 工具条 / 表格 / 计数依次落位 */
.list-panel :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* ===== tab 条 ===== */
.list-panel__tabs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: vw(8);
  padding: vh(10) vw(14) 0;
}

.list-panel__tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  height: vh(30);
  padding: 0 vw(12);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.list-panel__tab:hover {
  background: rgba(0, 92, 168, 0.6);
  color: var(--fire-text-title);
}

.list-panel__tab.is-active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #ffffff;
}

/* tab 上的条数角标 */
.list-panel__tab-count {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ===== 工具条 ===== */
/* z-index 高于表格：下拉浮层要盖住下方表格行 */
.list-panel__toolbar {
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: 0 vw(14);
}

.list-panel__filter-wrap {
  position: relative;
}

/* 下拉触发器 */
.list-panel__filter {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  height: vh(30);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.list-panel__filter:hover {
  background: rgba(0, 92, 168, 0.6);
  color: var(--fire-text-title);
}

/* 下拉箭头 */
.list-panel__caret {
  width: 0;
  height: 0;
  border-left: vw(4) solid transparent;
  border-right: vw(4) solid transparent;
  border-top: vh(5) solid rgba(169, 201, 234, 0.75);
}

/* 下拉浮层 */
.list-panel__menu {
  position: absolute;
  top: calc(100% + vh(4));
  left: 0;
  z-index: 20;
  min-width: vw(160);
  max-height: vh(280);
  overflow-y: auto;
  padding: vh(4) 0;
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(0, 38, 82, 0.97);
  box-shadow: 0 vh(6) vh(18) rgba(0, 10, 30, 0.45);
}

.list-panel__menu-item {
  display: block;
  width: 100%;
  padding: vh(6) vw(12);
  border: none;
  background: transparent;
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.list-panel__menu-item:hover {
  background: rgba(0, 92, 168, 0.6);
  color: #ffffff;
}

.list-panel__menu-item.is-active {
  background: rgba(0, 134, 228, 0.55);
  color: #ffffff;
}

/* 搜索框 */
.list-panel__search {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: vw(8);
  width: vw(240);
  height: vh(30);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 30, 68, 0.5);
}

.list-panel__search-icon {
  width: vw(12);
  height: vw(12);
  border: 1px solid rgba(143, 176, 216, 0.8);
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;

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

.list-panel__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;

  &::placeholder {
    color: var(--fire-text-dim);
  }

  /* 去掉原生搜索框的清除按钮与大 Safari 的圆角 */
  &::-webkit-search-decoration,
  &::-webkit-search-cancel-button {
    display: none;
  }
}

/* ===== 表格 ===== */
.list-panel__table {
  flex: 1;
  min-height: 0;
  /* 列被压扁会让时间戳折行，窄视口宁可横向滚动 */
  overflow: auto;
}

/* 表头：纵向 sticky（不随内容滚动），横向随内容滚动以保持列对齐 */
.list-panel__head {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  align-items: center;
  height: vh(38);
  padding: 0 vw(14);
  background: rgba(0, 40, 86, 0.96);
  border-bottom: 1px solid rgba(120, 190, 255, 0.18);
}

.list-panel__th {
  padding: 0 vw(8);
  font-size: 14px;
  color: var(--fire-text-title);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-panel__rows {
  padding-bottom: vh(4);
}

.list-panel__row {
  display: grid;
  align-items: center;
  height: 34px;
  padding: 0 vw(14);
  border-bottom: 1px solid rgba(120, 190, 255, 0.1);
}

.list-panel__row:hover {
  background: rgba(0, 84, 160, 0.18);
}

.list-panel__td {
  padding: 0 vw(8);
  font-size: 14px;
  color: var(--fire-text-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 时间戳：次要一级 */
.list-panel__td.is-datetime {
  color: var(--fire-text-sub);
  font-variant-numeric: tabular-nums;
}

/* 状态胶囊 */
.list-panel__status {
  display: inline-flex;
  align-items: center;
  padding: vh(2) vw(7);
  border-radius: vw(4);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
}

/* 异常：全页只留这一个红 */
.list-panel__status.is-abnormal {
  @include fire.fire-badge(255, 128, 128);
}

/* 非异常：中性描边小片，不占用语义色 */
.list-panel__status.is-normal {
  border: 1px solid rgba(120, 190, 255, 0.22);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
}

/* 标签小片（隐患类型 / 上报来源） */
.list-panel__tag {
  display: inline-flex;
  align-items: center;
  padding: vh(2) vw(7);
  border: 1px solid rgba(120, 190, 255, 0.18);
  border-radius: vw(2);
  background: rgba(0, 152, 230, 0.12);
  color: var(--fire-text-label);
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
}

/* 操作列图标 */
.list-panel__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(22);
  height: vh(22);
  margin-right: vw(2);
  padding: 0;
  border: none;
  border-radius: vw(2);
  background: transparent;
  color: var(--fire-text-dim);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.list-panel__act:hover {
  background: rgba(0, 134, 228, 0.4);
  color: var(--fire-text-title);
}

/* ===== 空态 ===== */
.list-panel__empty {
  display: block;
  margin: auto;
  padding: vh(60) 0;
  font-size: 14px;
  color: var(--fire-text-dim);
  letter-spacing: 1px;
  text-align: center;
}

/* ===== 分页 ===== */
/* 右内边距 140px：右下角常驻「AI 助手」悬浮球（fixed，right 24 / 宽 112）
   会压住卡片右下角，分页右对齐时必须让开它（悬浮球是固定像素尺寸，这里
   也用固定像素，不用 vw —— 视口变窄时 vw 会跟着缩，反而让不开）。 */
.list-panel__foot {
  flex-shrink: 0;
  padding: 0 140px vh(8) vw(14);
}

/* 分页器（Element Plus）在本页的变量覆盖：
   1) 字号下限锁 14px：共享大屏 EP 主题的下限是 11px，本大屏要求 14px。
   2) --pagi-bg / --pagi-text：全局 `style.css` 的页码按钮规则用的是
      `background-color: var(--pagi-bg) !important` + `color: var(--pagi-text) !important`，
      而这两个变量只在 `html.dark` 下才是深色值（style.css 的 :root 是浅色
      #F0F1F6 / #71747B）——大屏页面没有 html.dark，于是页码按钮渲染成浅灰方块，
      与深蓝卡片割裂。这里按大屏 EP 主题（styles/bigscreen-ep.scss 的 el-pagination 段）
      声明的口径改回深色：透明底 + 灰字，描边仍由主题的蓝边提供。
      变量只在本页分页器作用域内重定义，不动全局。 */
.list-panel :deep(.el-pagination) {
  --pagi-bg: transparent;
  --pagi-text: #bebebe;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 16px);
}

/* 分页器里的「每页条数」选择框：
   全局 `style.css` 的 `.el-pagination .el-select .el-select__wrapper` 用了
   `background-color: var(--bg-card) !important`，而大屏页面没有 html.dark，
   `--bg-card` 落到 :root 的浅色值 → 选择框渲染成一块白底，与深蓝卡片割裂。
   这里的 !important 是为了盖过全局那条（同为 !important，靠特异性取胜）：
   选择器带上 .list-panel 后是 5 个类，比全局的 3 个类更高。 */
.list-panel :deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: transparent !important;
  border: 1px solid rgba(0, 84, 201, 0.67) !important;
  box-shadow: none !important;
}

/* 选择框里的文字与箭头：跟大屏 EP 主题（bigscreen-ep.scss 的 el-select 口径）一致，
   否则在深底上是浅灰的浅色主题字，看不清。 */
.list-panel :deep(.el-pagination .el-select .el-select__selected-item),
.list-panel :deep(.el-pagination .el-select .el-select__placeholder),
.list-panel :deep(.el-pagination .el-select .el-select__input) {
  color: #f2fbff;
}
.list-panel :deep(.el-pagination .el-select .el-select__caret) {
  color: #c1c1c1;
}

/* ===== 操作反馈 ===== */
.list-panel__toast {
  position: fixed;
  left: 50%;
  top: vh(84);
  transform: translateX(-50%);
  z-index: 10020;
  padding: vh(9) vw(18);
  border: 1px solid rgba(96, 200, 255, 0.5);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.96);
  color: #cfe4ff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.24s, transform 0.24s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
