<template>
  <EbikeV2Card title="详细记录" class="report-panel">
    <!-- ===== ① 工具条：搜索 + 筛选下拉 + 日期区间 + 查询（设计稿 117:21260） ===== -->
    <div class="report-panel__toolbar-wrap">
      <div ref="toolbarRef" class="report-panel__toolbar">
        <!-- 搜索 -->
        <label class="report-panel__search">
          <span class="report-panel__search-icon" aria-hidden="true" />
          <input
            v-model="searchProxy"
            class="report-panel__search-input"
            type="search"
            :placeholder="category.searchPlaceholder"
          />
        </label>

        <!-- 筛选下拉（维度随分类走：告警/值守按班组·班次，设备按系统·区域） -->
        <div v-for="f in filters" :key="f.key" class="report-panel__filter-wrap">
          <button
            type="button"
            class="report-panel__filter"
            :aria-expanded="openFilter === f.key"
            aria-haspopup="listbox"
            @click="toggleFilter(f.key)"
          >
            {{ filterValue(f) }}
            <span class="report-panel__caret" aria-hidden="true" />
          </button>

          <div v-if="openFilter === f.key" class="report-panel__menu" role="listbox">
            <button
              v-for="opt in f.options"
              :key="opt"
              type="button"
              role="option"
              class="report-panel__menu-item"
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
             样式挂在外层 div 上再用 :deep() 往下打，才稳定命中。
             日历图标用 Figma 导出的原始素材（设计稿 117:21279），
             EP 自带的日历图标隐藏掉，避免两个图标叠在一起。 -->
        <div class="report-panel__date">
          <span class="report-panel__calendar" aria-hidden="true" />
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
        <button type="button" class="report-panel__query" @click="onQuery">查询</button>
      </div>
    </div>

    <!-- ===== ② 卡片列表：设计稿 117:21295，一行 5 张 ===== -->
    <div class="report-panel__list">
      <div class="report-panel__grid">
        <EbikeV2ReportRecordCard
          v-for="r in pageRecords"
          :key="r.id"
          :record="r"
          @open="emit('open', $event)"
        />
      </div>

      <p v-if="!pageRecords.length" class="report-panel__empty">没有符合条件的记录</p>
    </div>

    <!-- ===== ③ 分页条：设计稿 117:21448 ===== -->
    <div class="report-panel__foot">
      <div class="report-panel__foot-left">
        <span class="report-panel__foot-label">每页显示</span>
        <el-select
          v-model="pageSizeProxy"
          class="report-panel__size"
          popper-class="bigscreen-el-select-dropdown"
        >
          <el-option v-for="s in PAGE_SIZES" :key="s" :label="`${s} 条`" :value="s" />
        </el-select>
        <span class="report-panel__foot-label">共 {{ records.length }} 条数据</span>
      </div>

      <el-pagination
        v-model:current-page="pageProxy"
        class="report-panel__pager"
        :page-size="pageSize"
        :total="records.length"
        :pager-count="5"
        layout="prev, pager, next"
        prev-text="上一页"
        next-text="下一页"
        background
      />
    </div>

    <!-- ===== 操作反馈 ===== -->
    <Transition name="toast">
      <div v-if="toast" class="report-panel__toast">{{ toast }}</div>
    </Transition>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 运行报告页 · 右栏「详细记录」
 *
 * 版式按设计稿 110:11432 / 117:21246：工具条 → 卡片列表 → 分页条，
 * 三段纵向排在一张卡里。
 *   - 工具条（117:21260）：搜索 + 筛选下拉 + 日期区间 + 查询。
 *   - 卡片列表（117:21295）：一行 5 张报告卡，间距 12。
 *   - 分页条（117:21448）：左侧「每页显示 + 共 N 条数据」，右侧上一页 / 页码 / 下一页。
 *
 * 控件与消防档案页（同一平台的姊妹页）共用同一套大屏深色主题：
 * Element Plus 控件挂 `.bigscreen` 作用域（页面根节点带这个 class），
 * 由 `styles/bigscreen-ep.scss` 提供深色覆盖。
 *
 * 图标全部取自 Figma 原始导出（搜索 117:21264、下拉箭头 117:21271、日历 117:21279），
 * 用 CSS mask 渲染：形状来自设计稿，颜色跟随大屏的 --fire-text-dim 令牌 ——
 * 设计稿把这几枚图标画成浅底版的 #4E627A，落到深蓝底上只有 1.25:1，看不见。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import EbikeV2ReportRecordCard from './EbikeV2ReportRecordCard.vue'
import type { ReportCategory, ReportDateRange, ReportFilter, ReportRecord } from './report-data'

const props = withDefaults(
  defineProps<{
    /** 当前分类（决定筛选维度与搜索提示） */
    category: ReportCategory
    /** 当前分类过滤后的记录 */
    records: ReportRecord[]
    /** 当前页码（1 起） */
    page: number
    /** 每页条数 */
    pageSize: number
    /** 当前搜索词 */
    search: string
    /** 各筛选维度的选中值 */
    filterValues: Record<string, string>
    /** 日期区间（null 表示不按日期过滤） */
    dateRange?: ReportDateRange
  }>(),
  { dateRange: null },
)

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:filterValues', value: Record<string, string>): void
  (e: 'update:dateRange', value: ReportDateRange): void
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'open', record: ReportRecord): void
}>()

/** 每页条数可选值 */
const PAGE_SIZES = [10, 20, 50]

/** 当前分类的筛选维度 */
const filters = computed<ReportFilter[]>(() => props.category?.filters ?? [])

/** 总页数 */
const totalPages = computed(() => Math.max(1, Math.ceil(props.records.length / props.pageSize)))

/** 实际使用的页码：越界时收敛（切分类后上一页码可能超出该分类页数） */
const safePage = computed(() => Math.min(Math.max(1, props.page), totalPages.value))

/** 当前页显示的卡片 */
const pageRecords = computed(() => {
  const start = (safePage.value - 1) * props.pageSize
  return props.records.slice(start, start + props.pageSize)
})

/* ============================================================
 * 搜索 / 日期 / 分页代理
 * ============================================================ */

const searchProxy = computed({
  get: () => props.search,
  set: (v: string) => emit('update:search', v),
})

const dateRangeProxy = computed({
  get: () => props.dateRange,
  set: (v: ReportDateRange) => {
    // EP 清空日期区间时给的是空数组 / null，统一归一成 null，
    // 否则下游会把「未选日期」当成一个空区间来比。
    const next: ReportDateRange =
      Array.isArray(v) && v.length === 2 && v[0] && v[1] ? [v[0], v[1]] : null
    emit('update:dateRange', next)
  },
})

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
function filterValue(f: ReportFilter): string {
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

/** 切分类时收起下拉 */
watch(
  () => props.category?.key,
  () => {
    openFilter.value = ''
  },
)

/**
 * 查询：条件是实时的（选下拉即生效），此按钮负责回到第一页并回执条数。
 */
function onQuery() {
  emit('update:page', 1)
  flash(`已按当前条件查询，共 ${props.records.length} 条`)
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

.report-panel {
  height: 100%;
  position: relative;
}

/* 卡片内容区纵向排列：工具条 / 卡片列表 / 分页条依次落位 */
.report-panel :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== ① 工具条 ===== */
/* 整条压一层深蓝底（设计稿 117:21260：rgba(0,40,86,0.96)，内距 18/14） */
.report-panel__toolbar-wrap {
  flex-shrink: 0;
  padding: vh(18) vw(14);
  background: var(--fire-toolbar-bg);
}

.report-panel__toolbar {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: vw(18);
}

/* 搜索框：设计稿 203×36、圆角 8、描边 #1A4573 */
.report-panel__search {
  display: inline-flex;
  align-items: center;
  gap: vw(12);
  width: vw(203);
  min-width: 180px;
  height: vh(36);
  padding: 0 vw(12);
  border: 1px solid var(--fire-input-line);
  border-radius: vw(8);
  background: transparent;
  flex-shrink: 0;
}

/* 搜索图标：Figma 117:21264，用 mask 渲染，形状取自设计稿、颜色取大屏令牌 */
.report-panel__search-icon {
  flex-shrink: 0;
  width: vw(16);
  height: vh(16);
  background-color: var(--fire-text-dim);
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/report/report-search-icon.svg') center / contain no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/report/report-search-icon.svg') center / contain no-repeat;
}

.report-panel__search-input {
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
.report-panel__filter-wrap {
  position: relative;
  flex-shrink: 0;
}

/* 下拉触发器：设计稿 177×36 */
.report-panel__filter {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  width: vw(177);
  min-width: 150px;
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

.report-panel__filter:hover {
  border-color: var(--fire-btn-primary);
  color: var(--fire-text-hero);
}

/* 下拉箭头：Figma 117:21271（设计稿 opacity 0.5，与消防档案页同一档） */
.report-panel__caret {
  flex-shrink: 0;
  width: vw(16);
  height: vh(16);
  opacity: 0.5;
  background-color: var(--fire-text-dim);
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/report/report-caret-down.svg') center / contain no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/report/report-caret-down.svg') center / contain no-repeat;
}

/* 下拉浮层 */
.report-panel__menu {
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

.report-panel__menu-item {
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

.report-panel__menu-item:hover {
  background: var(--fire-chip);
}

.report-panel__menu-item.is-active {
  background: var(--fire-hover-blue);
  color: var(--fire-text-hero);
}

/* 日期区间：设计稿 380×36，左侧一枚日历图标 */
.report-panel {
  .report-panel__date {
    position: relative;
    width: vw(380);
    min-width: 320px;
    flex: 0 0 auto;
  }

  .report-panel__date :deep(.el-date-editor) {
    width: 100%;
    flex: none;
    height: vh(36);
    padding: 0 vw(12);
    background: transparent;
    border: 1px solid var(--fire-input-line);
    border-radius: vw(8);
    box-shadow: none;
  }

  .report-panel__date :deep(.el-range-input) {
    width: auto;
    flex: 1;
    font-size: 16px;
    color: var(--fire-text-bright);
  }

  .report-panel__date :deep(input.el-range-input) {
    width: 100%;
  }

  .report-panel__date :deep(.el-range-separator) {
    width: auto;
    flex: 0 0 auto;
    padding: 0 vw(8);
    color: var(--fire-text-label);
    font-size: 14px;
  }

  /* EP 自带的日历图标换成 Figma 素材 */
  .report-panel__date :deep(.el-range__icon) {
    display: none;
  }
}

/* 日历图标：Figma 117:21279 */
.report-panel__calendar {
  position: absolute;
  left: vw(12);
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  width: vw(20);
  height: vh(20);
  pointer-events: none;
  background-color: var(--fire-text-dim);
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/report/report-calendar-icon.svg') center / contain no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/report/report-calendar-icon.svg') center / contain no-repeat;
}

/* 查询按钮 */
.report-panel__query {
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

.report-panel__query:hover {
  background: rgba(0, 134, 228, 1);
}

/* ===== ② 卡片列表 ===== */
.report-panel__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 vw(14);
}

/* 一行 5 张：卡宽 302（设计稿 5×302 + 4×12 = 1558），
   卡片是固定比例的对象，宽度不随容器压缩 —— 窄视口宁可横向滚动。 */
.report-panel__grid {
  display: grid;
  grid-template-columns: repeat(5, calc(302 * var(--min-scale)));
  gap: calc(12 * var(--min-scale));
  justify-content: space-between;
  padding: vh(4) 0 vh(12);
}

/* 空态 */
.report-panel__empty {
  display: block;
  margin: auto;
  padding: vh(60) 0;
  font-size: 14px;
  color: var(--fire-text-dim);
  letter-spacing: 1px;
  text-align: center;
}

/* ===== ③ 分页条 ===== */
.report-panel__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(12);
  padding: vh(12);
  border-top: 1px solid var(--fire-line-soft);
}

.report-panel__foot-left {
  display: flex;
  align-items: center;
  gap: vw(12);
}

.report-panel__foot-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-bright);
  white-space: nowrap;
}

/* 每页条数选择框（与消防档案页同一套深色覆盖） */
.report-panel {
  .report-panel__size {
    width: vw(82);
    min-width: 86px;
    flex-shrink: 0;
  }

  .report-panel__size :deep(.el-select__wrapper) {
    height: vh(36);
    padding: 0 vw(8);
    background: transparent;
    border: 1px solid var(--fire-btn-outline);
    border-radius: vw(8);
    box-shadow: none;
  }

  .report-panel__size :deep(.el-select__selected-item) {
    color: var(--fire-text-bright);
    font-size: 14px;
  }

  .report-panel__size :deep(.el-select__caret) {
    color: var(--fire-text-label);
    opacity: 0.5;
  }

  /* 页码按钮：设计稿 117:20116 —— 页码无描边，当前页填色。
     必须加 !important：全局 style.css 的 `.el-pagination.is-background .el-pager li`
     用 `background-color: var(--pagi-bg) !important`，大屏页没有 html.dark，
     --pagi-bg 落到 :root 的浅色 #F0F1F6，不压掉就会渲染成浅灰方块。 */
  .report-panel__pager {
    justify-content: flex-end;
    padding: 0;
  }

  .report-panel__pager :deep(.el-pager li) {
    min-width: vw(32);
    height: vh(32);
    border: none !important;
    background: transparent !important;
    color: var(--fire-pager-text) !important;
    font-size: 14px;
    font-weight: 500;
  }

  .report-panel__pager :deep(.el-pager li.is-active) {
    background: var(--fire-btn-ghost) !important;
    color: var(--fire-text-bright) !important;
  }

  .report-panel__pager :deep(.btn-prev),
  .report-panel__pager :deep(.btn-next) {
    height: vh(32);
    padding: 0 vw(10);
    border: none !important;
    border-radius: vw(8);
    background: var(--fire-btn-ghost) !important;
    color: var(--fire-text-hero) !important;
    font-size: 14px;
    font-weight: 500;
  }

  .report-panel__pager :deep(.btn-prev.is-disabled),
  .report-panel__pager :deep(.btn-next.is-disabled) {
    opacity: 0.35;
  }
}

/* ===== 操作反馈 ===== */
.report-panel__toast {
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
