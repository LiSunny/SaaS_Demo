<template>
  <EbikeV2Card title="详细记录" class="list-panel">
    <!-- ===== ① 工具条：搜索 + 筛选下拉 + 日期区间 + 查询 / 批量导出 ===== -->
    <div class="list-panel__toolbar-wrap">
      <div ref="toolbarRef" class="list-panel__toolbar">
        <!-- 搜索 -->
        <label class="list-panel__search">
          <Search class="list-panel__search-icon" :size="16" :stroke-width="1.8" />
          <input
            v-model="searchProxy"
            class="list-panel__search-input"
            type="search"
            :placeholder="currentTab.searchPlaceholder"
          />
        </label>

        <!-- 筛选下拉 -->
        <div v-for="f in filters" :key="f.key" class="list-panel__filter-wrap">
          <button
            type="button"
            class="list-panel__filter"
            :aria-expanded="openFilter === f.key"
            aria-haspopup="listbox"
            @click="toggleFilter(f.key)"
          >
            {{ filterValue(f) }}
            <ChevronDown class="list-panel__caret" :size="16" :stroke-width="1.8" />
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

        <!-- 日期区间
             外层 div 是必要的：el-date-picker 的根元素不吃 scoped 作用域标记
             （拿到的是组件内部渲染的 .el-date-editor，Vue 不会给它挂 data-v-*），
             样式挂在外层 div 上再用 :deep() 往下打，才稳定命中。 -->
        <div class="list-panel__date">
          <el-date-picker
            v-model="dateRangeProxy"
            type="daterange"
            unlink-panels
            editable
            clearable
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            popper-class="bigscreen-el-date-panel"
          />
        </div>

        <!-- 查询 -->
        <button type="button" class="list-panel__query" @click="onQuery">查询</button>

        <!-- 批量导出 -->
        <button type="button" class="list-panel__export" @click="onExport">
          <SquareArrowOutUpRight class="list-panel__export-icon" :size="16" :stroke-width="1.8" />
          批量导出
        </button>
      </div>
    </div>

    <!-- ===== ② 表格：表头 sticky（随内容横向滚动，纵向不滚） ===== -->
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
            :class="[`is-${c.type ?? 'text'}`, { 'is-date': isDateColumn(c) }]"
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

            <!-- 操作：设计稿 110:20386 是一枚「查看」图标 -->
            <button
              v-else-if="c.type === 'action'"
              type="button"
              class="list-panel__act"
              title="查看"
              @click="onAction('查看')"
            >
              <Eye :size="16" :stroke-width="1.8" />
            </button>

            <template v-else>{{ row[c.key] }}</template>
          </span>
        </div>

        <span v-if="!rows.length" class="list-panel__empty">没有符合条件的记录</span>
      </div>
    </div>

    <!-- ===== ③ 分页：左侧「每页显示 + 共 N 条数据」，右侧页码按钮 ===== -->
    <div class="list-panel__foot">
      <div class="list-panel__foot-left">
        <span class="list-panel__foot-label">每页显示</span>
        <el-select
          v-model="pageSizeProxy"
          class="list-panel__size"
          popper-class="bigscreen-el-select-dropdown"
        >
          <el-option v-for="s in PAGE_SIZES" :key="s" :label="`${s} 条`" :value="s" />
        </el-select>
        <span class="list-panel__foot-label">共 {{ rows.length }} 条数据</span>
      </div>

      <el-pagination
        v-model:current-page="pageProxy"
        class="list-panel__pager"
        :page-size="pageSize"
        :total="rows.length"
        :pager-count="5"
        layout="prev, pager, next"
        prev-text="上一页"
        next-text="下一页"
        background
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
 * 主区列表面板（消防档案页 · 详细记录）
 *
 * 版式按设计稿 110:16923：筛选条 → 表格 → 分页条，三段纵向排在一张卡里。
 *   - 筛选条（110:20069）：搜索 + 若干筛选下拉 + 日期区间 + 查询；右侧「批量导出」。
 *   - 表格（110:16969）：表头底色 #003569、上下 1px 亮边；数据行 1px #0C3464 分隔线。
 *   - 分页条（117:20105）：左侧「每页显示 + 共 N 条数据」，右侧上一页 / 页码 / 下一页。
 *
 * 表格用 CSS Grid 而不是 flex：列宽由数据给出（`minmax(最小宽, 占比fr)`，
 * 「操作」列固定 156px），表头与数据行共用同一份 `grid-template-columns`，列必然对齐；
 * 窄视口时轨道按最小宽撑开、容器横向滚动，列不会被压扁（时间戳不折行）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, Eye, Search, SquareArrowOutUpRight } from 'lucide-vue-next'
import EbikeV2Card from './EbikeV2Card.vue'
import { STATUS_TONE } from './archive/archive-data'
import type {
  ArchiveColumn,
  ArchiveDateRange,
  ArchiveFilter,
  ArchiveRow,
  ArchiveTab,
  ArchiveTabKey,
} from './archive/archive-data'

const props = withDefaults(
  defineProps<{
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
    /** 当前 tab 的日期区间（null 表示不按日期过滤） */
    dateRange?: ArchiveDateRange
  }>(),
  { dateRange: null },
)

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:filterValues', value: Record<string, string>): void
  (e: 'update:dateRange', value: ArchiveDateRange): void
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

/**
 * 列宽模板：`minmax(最小宽, 占比fr)`；给了 `fixed` 的列按固定像素排。
 * 最小宽兜底窄视口不压列（宁可横向滚动，也不让时间戳折行）。
 */
const gridTemplate = computed(() =>
  columns.value
    .map((c) => (c.fixed ? `${c.fixed}px` : `minmax(${c.minWidth ?? 80}px, ${c.flex}fr)`))
    .join(' '),
)

/* ============================================================
 * 搜索
 * ============================================================ */

const searchProxy = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v),
})

/* ============================================================
 * 日期区间
 * ============================================================ */

const dateRangeProxy = computed({
  get: () => props.dateRange,
  set: (v: ArchiveDateRange) => {
    // EP 清空日期区间时给的是空数组 / null，统一归一成 null，
    // 否则下游会把「未选日期」当成一个空区间来比。
    const next: ArchiveDateRange =
      Array.isArray(v) && v.length === 2 && v[0] && v[1] ? [v[0], v[1]] : null
    emit('update:dateRange', next)
  },
})

/* ============================================================
 * 分页
 * ============================================================ */

const pageProxy = computed({
  get: () => safePage.value,
  set: (v: number) => emit('update:page', v),
})

const pageSizeProxy = computed({
  get: () => props.pageSize,
  set: (v: number) => {
    emit('update:pageSize', v)
    emit('update:page', 1)
  },
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

/**
 * 日期列：设计稿里「日期」列比其余正文大一号（15px / 14px）。
 * 只认纯日期列（type=text 且就是日期区间所筛的那一列），
 * 时间戳列（datetime）不跟着放大 —— 否则一列里两种字号更乱。
 */
function isDateColumn(c: ArchiveColumn): boolean {
  return c.type === 'text' && c.key === currentTab.value?.dateField
}

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

/** 查询：条件是实时的（选下拉即生效），此按钮负责回到第一页并回执条数 */
function onQuery() {
  emit('update:page', 1)
  flash(`已按当前条件查询，共 ${props.rows.length} 条`)
}

/** 操作列 / 批量导出：本期只落 mock 数据，点击给明示反馈，不静默无响应 */
function onAction(kind: string) {
  flash(`演示数据，暂未接入「${kind}」操作`)
}

function onExport() {
  flash('演示数据，暂未接入「批量导出」')
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
  /* 操作反馈条按卡片定位（卡片本身 overflow:hidden，浮层不会溢出卡外） */
  position: relative;
}

/* 卡片内容区纵向排列：工具条 / 表格 / 分页条依次落位 */
.list-panel :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== ① 工具条 ===== */
/* 整条压一层深蓝底（设计稿 110:16950：rgba(0,40,86,0.96)，内距 18/14） */
.list-panel__toolbar-wrap {
  flex-shrink: 0;
  padding: vh(18) vw(14);
  background: var(--fire-toolbar-bg);
}

.list-panel__toolbar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: vw(18);
}

/* 搜索框 */
.list-panel__search {
  display: inline-flex;
  align-items: center;
  gap: vw(12);
  width: vw(203);
  height: vh(36);
  padding: 0 vw(12);
  border: 1px solid var(--fire-input-line);
  border-radius: vw(8);
  background: transparent;
  flex-shrink: 0;
}

.list-panel__search-icon {
  flex-shrink: 0;
  color: var(--fire-text-dim);
}

.list-panel__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 16px;
  letter-spacing: -0.0094em;

  &::placeholder {
    color: var(--fire-text-label);
  }

  /* 去掉原生搜索框的清除按钮与大 Safari 的圆角 */
  &::-webkit-search-decoration,
  &::-webkit-search-cancel-button {
    display: none;
  }
}

/* 筛选下拉 */
.list-panel__filter-wrap {
  position: relative;
  flex-shrink: 0;
}

/* 下拉触发器 */
.list-panel__filter {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  width: vw(177);
  height: vh(36);
  padding: 0 vw(12);
  border: 1px solid var(--fire-input-line);
  border-radius: vw(8);
  background: transparent;
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 16px;
  letter-spacing: -0.0094em;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.list-panel__filter:hover {
  border-color: var(--fire-btn-primary);
  color: var(--fire-text-hero);
}

.list-panel__caret {
  flex-shrink: 0;
  opacity: 0.5;
  color: var(--fire-text-label);
}

/* 下拉浮层 */
.list-panel__menu {
  position: absolute;
  top: calc(100% + vh(6));
  left: 0;
  z-index: 20;
  min-width: vw(177);
  max-height: vh(280);
  overflow-y: auto;
  padding: vh(4) 0;
  border: 1px solid var(--fire-chip-border);
  border-radius: vw(4);
  background: var(--fire-menu-bg);
  box-shadow: 0 vh(6) vh(18) rgba(0, 10, 30, 0.45);
}

.list-panel__menu-item {
  display: block;
  width: 100%;
  padding: vh(7) vw(12);
  border: none;
  background: transparent;
  color: var(--fire-text-bright);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
}

.list-panel__menu-item:hover {
  background: var(--fire-chip);
}

.list-panel__menu-item.is-active {
  background: var(--fire-hover-blue);
  color: var(--fire-text-hero);
}

/* 日期区间
   嵌套在 .list-panel 下是为了压过大屏主题的 `.bigscreen .el-input__wrapper`
   —— 两者特异性相同（0,2,0），嵌套后变（0,4,0），不靠加载顺序赌。
   宽度给 min-width：设计稿按 1920 量，但正文有 14px 字号下限、不随视口缩，
   视口一窄按比例缩的盒子就装不下「10 条」这类短文案（会被截成「1...」）。 */
.list-panel {
  .list-panel__date {
    width: vw(380);
    min-width: 320px;
    flex: 0 0 auto;
  }

  .list-panel__date :deep(.el-date-editor) {
    width: 100%;
    flex: none;
    height: vh(36);
    padding: 0 vw(12);
    background: transparent;
    border: 1px solid var(--fire-input-line);
    border-radius: vw(8);
    box-shadow: none;
  }

  .list-panel__date :deep(.el-range-input) {
    width: auto;
    flex: 1;
    font-size: 16px;
    color: var(--fire-text-bright);
  }

  .list-panel__date :deep(input.el-range-input) {
    width: 100%;
  }

  .list-panel__date :deep(.el-range-separator) {
    width: auto;
    flex: 0 0 auto;
    padding: 0 vw(8);
    color: var(--fire-text-label);
    font-size: 14px;
  }

  .list-panel__date :deep(.el-range__icon) {
    color: var(--fire-text-dim);
  }
}

/* 查询按钮 */
.list-panel__query {
  flex-shrink: 0;
  height: vh(36);
  padding: 0 vw(18);
  border: none;
  border-radius: vw(8);
  background: var(--fire-btn-primary);
  color: var(--fire-text-hero);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.0094em;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}

.list-panel__query:hover {
  background: var(--fire-btn-primary);
}

/* 批量导出（靠右） */
.list-panel__export {
  display: inline-flex;
  align-items: center;
  gap: vw(10);
  flex-shrink: 0;
  height: vh(36);
  margin-left: auto;
  padding: 0 vw(12);
  border: 1px solid var(--fire-btn-outline);
  border-radius: vw(8);
  background: var(--fire-btn-ghost);
  color: var(--fire-table-head-text);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.list-panel__export:hover {
  background: var(--fire-hover-blue);
  border-color: var(--fire-btn-outline);
}

.list-panel__export-icon {
  flex-shrink: 0;
}

/* ===== ② 表格 ===== */
.list-panel__table {
  flex: 1;
  min-height: 0;
  padding: 0 vw(14);
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
  padding: vh(10) vw(12);
  gap: vw(6);
  background: var(--fire-table-head-bg);
  border-top: 1px solid var(--fire-line-soft);
  border-bottom: 1px solid var(--fire-line-soft);
}

.list-panel__th {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: var(--fire-table-head-text);
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
  padding: vh(12) vw(12);
  gap: vw(6);
  border-bottom: 1px solid var(--fire-table-line);
}

.list-panel__row:hover {
  background: var(--fire-row-hover);
}

.list-panel__td {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 日期列：设计稿里比其余正文大一号 */
.list-panel__td.is-date {
  font-size: 15px;
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
  border: 1px solid var(--fire-chip-border);
  background: var(--fire-tab-idle);
  color: var(--fire-text-label);
}

/* 标签小片（隐患类型 / 上报来源） */
.list-panel__tag {
  display: inline-flex;
  align-items: center;
  padding: vh(2) vw(7);
  border: 1px solid var(--fire-chip-border);
  border-radius: vw(2);
  background: var(--fire-chip);
  color: var(--fire-text-label);
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
}

/* 操作列图标（设计稿：一枚 22 见方的「查看」图标） */
.list-panel__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(22);
  height: vh(22);
  padding: 0;
  border: none;
  border-radius: vw(2);
  background: transparent;
  color: var(--fire-text-dim);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.list-panel__act:hover {
  background: var(--fire-hover-blue);
  color: var(--fire-text-hero);
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

/* ===== ③ 分页条 ===== */
.list-panel__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(12);
  padding: vh(12);
  border-top: 1px solid var(--fire-line-soft);
}

.list-panel__foot-left {
  display: flex;
  align-items: center;
  gap: vw(12);
}

.list-panel__foot-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-bright);
  white-space: nowrap;
}

/* 每页条数选择框
   同样给 min-width：正文有 14px 字号下限、不随视口缩，
   按比例缩的盒子在窄视口下装不下「10 条」，会被截成「1...」。 */
.list-panel {
  .list-panel__size {
    width: vw(82);
    min-width: 86px;
    flex-shrink: 0;
  }

  .list-panel__size :deep(.el-select__wrapper) {
    height: vh(36);
    padding: 0 vw(8);
    background: transparent;
    border: 1px solid var(--fire-btn-outline);
    border-radius: vw(8);
    box-shadow: none;
  }

  .list-panel__size :deep(.el-select__selected-item) {
    color: var(--fire-text-bright);
    font-size: 14px;
  }

  .list-panel__size :deep(.el-select__caret) {
    color: var(--fire-text-label);
    opacity: 0.5;
  }

  /* 页码按钮：设计稿 117:20116 —— 页码无描边，当前页填色。
     el-pagination 的根元素带 .list-panel__pager，:deep 从它的子元素起算。
     必须加 !important：全局 style.css 的 `.el-pagination.is-background .el-pager li`
     用 `background-color: var(--pagi-bg) !important`，而大屏页没有 html.dark，
     --pagi-bg 落到 :root 的浅色 #F0F1F6 —— 不压掉就会渲染成浅灰方块，
     与深蓝卡片割裂（且 important 之间比的是特异性，本选择器更具体才压得住）。 */
  .list-panel__pager {
    justify-content: flex-end;
    padding: 0;
  }

  .list-panel__pager :deep(.el-pager li) {
    min-width: vw(32);
    height: vh(32);
    border: none !important;
    background: transparent !important;
    color: var(--fire-pager-text) !important;
    font-size: 14px;
    font-weight: 500;
  }

  .list-panel__pager :deep(.el-pager li.is-active) {
    background: var(--fire-btn-ghost) !important;
    color: var(--fire-text-bright) !important;
  }

  .list-panel__pager :deep(.btn-prev),
  .list-panel__pager :deep(.btn-next) {
    height: vh(32);
    padding: 0 vw(10);
    border: none !important;
    border-radius: vw(8);
    background: var(--fire-btn-ghost) !important;
    color: var(--fire-text-hero) !important;
    font-size: 14px;
    font-weight: 500;
  }

  .list-panel__pager :deep(.btn-prev.is-disabled),
  .list-panel__pager :deep(.btn-next.is-disabled) {
    opacity: 0.35;
  }
}

/* ===== 操作反馈 ===== */
.list-panel__toast {
  position: absolute;
  left: 50%;
  bottom: vh(80);
  z-index: 30;
  transform: translateX(-50%);
  padding: vh(8) vw(16);
  border: 1px solid var(--fire-chip-border);
  border-radius: vw(4);
  background: var(--fire-menu-bg);
  color: var(--fire-text-bright);
  font-size: 14px;
  white-space: nowrap;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
