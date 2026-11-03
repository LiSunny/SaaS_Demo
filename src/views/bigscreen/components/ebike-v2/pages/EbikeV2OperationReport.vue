<template>
  <div class="op-report bigscreen">
    <!-- ===== 左栏：报告分类（设计稿 117:21199） ===== -->
    <EbikeV2ReportSidebar
      class="op-report__side"
      :categories="categories"
      :active-category="activeCategory"
      @update:active-category="onCategoryChange"
    />

    <!-- ===== 右栏：详细记录（设计稿 117:21246） ===== -->
    <EbikeV2ReportListPanel
      class="op-report__main"
      :category="currentCategory"
      :records="filteredRecords"
      :page="currentPage"
      :page-size="currentPageSize"
      :search="currentSearch"
      :filter-values="currentFilters"
      :date-range="currentDateRange"
      @update:search="onSearch"
      @update:filter-values="onFilters"
      @update:date-range="onDateRange"
      @update:page="onPage"
      @update:page-size="onPageSize"
      @open="openReport"
    />

    <!-- 报告预览：页内浮层，不跳路由 -->
    <EbikeV2ReportPreview v-if="activeRecord" :report="activeRecord" @close="closeReport" />
  </div>
</template>

<script setup lang="ts">
/**
 * 运行报告页
 *
 * 版式按设计稿 110:11432（智能安全管控平台 / 运行报告）：
 *   左「报告分类」分区（280 宽，三类报告）+ 右「详细记录」分区（工具条 + 卡片列表 + 分页）。
 *
 * 分类从「三类分区纵向铺开」改成左栏侧栏：设计稿把分类做成侧栏，
 * 右侧主区因此能占满整屏宽度，一行放得下 5 张报告卡；
 * 三类同时可见的诉求由左栏承担（切分类不丢上下文）。
 *
 * 卡片上的「点击查看」打开页内浮层（值守场景不能跳路由、不开新标签页）。
 *
 * 数据：`report/report-data.ts` 的演示数据（基准日 2026-11-03，日期写死，
 * 班组 / 班次 / 值班人员沿用消防档案页同一套口径）。接口接入时只换该文件，组件不动。
 *
 * 根节点带 `bigscreen` class：项目的大屏 EP 深色主题（`styles/bigscreen-ep.scss`）
 * 以它为作用域，下拉框 / 日期面板 / 分页器用这套主题才是深色；不带就是
 * Element Plus 默认浅色样式，与全站大屏不一致。
 */
import { computed, ref } from 'vue'
import EbikeV2ReportListPanel from '../report/EbikeV2ReportListPanel.vue'
import EbikeV2ReportPreview from '../report/EbikeV2ReportPreview.vue'
import EbikeV2ReportSidebar from '../report/EbikeV2ReportSidebar.vue'
import {
  DEFAULT_REPORT_CATEGORY,
  REPORT_CATEGORIES,
  filterReportRecords,
} from '../report/report-data'
import type { ReportDateRange, ReportKind, ReportRecord } from '../report/report-data'

/** 三类报告（tab） */
const categories = REPORT_CATEGORIES

/** 当前分类 */
const activeCategory = ref<ReportKind>(DEFAULT_REPORT_CATEGORY)

/**
 * 每个分类各自记住搜索词、筛选值、日期区间与分页：切走再切回来不丢。
 * 筛选值默认取该维度的第一项（「全部」）。
 */
const searchMap = ref<Record<string, string>>(
  Object.fromEntries(categories.map((c) => [c.key, ''])),
)
const filterMap = ref<Record<string, Record<string, string>>>(
  Object.fromEntries(
    categories.map((c) => [
      c.key,
      Object.fromEntries(c.filters.map((f) => [f.key, f.options[0]])),
    ]),
  ),
)
const dateRangeMap = ref<Record<string, ReportDateRange>>(
  Object.fromEntries(categories.map((c) => [c.key, null])),
)

/** 每个分类各自的页码与每页条数 */
const pageMap = ref<Record<string, number>>(Object.fromEntries(categories.map((c) => [c.key, 1])))
const sizeMap = ref<Record<string, number>>(Object.fromEntries(categories.map((c) => [c.key, 10])))

/** 当前分类定义 */
const currentCategory = computed(
  () => categories.find((c) => c.key === activeCategory.value) ?? categories[0],
)

/** 当前分类的搜索词 */
const currentSearch = computed(() => searchMap.value[activeCategory.value] ?? '')

/** 当前分类的筛选值 */
const currentFilters = computed(() => filterMap.value[activeCategory.value] ?? {})

/** 当前分类的日期区间 */
const currentDateRange = computed(() => dateRangeMap.value[activeCategory.value] ?? null)

/** 当前分类的页码 / 每页条数 */
const currentPage = computed(() => pageMap.value[activeCategory.value] ?? 1)
const currentPageSize = computed(() => sizeMap.value[activeCategory.value] ?? 10)

/** 过滤后的记录：搜索词、筛选器与日期区间之间是 AND 关系 */
const filteredRecords = computed(() =>
  filterReportRecords(
    currentCategory.value,
    currentCategory.value.records,
    currentSearch.value,
    currentFilters.value,
    currentDateRange.value,
  ),
)

/** 当前打开的报告；null 表示预览浮层关闭 */
const activeRecord = ref<ReportRecord | null>(null)

/* ============================================================
 * 交互
 * ============================================================ */

/** 切换分类 */
function onCategoryChange(key: ReportKind) {
  activeCategory.value = key
}

/** 更新当前分类的搜索词（筛选条件变了，回到第一页） */
function onSearch(value: string) {
  searchMap.value = { ...searchMap.value, [activeCategory.value]: value }
  resetPage()
}

/** 更新当前分类的筛选值（同上，回到第一页） */
function onFilters(value: Record<string, string>) {
  filterMap.value = { ...filterMap.value, [activeCategory.value]: value }
  resetPage()
}

/** 更新当前分类的日期区间（同上，回到第一页） */
function onDateRange(value: ReportDateRange) {
  dateRangeMap.value = { ...dateRangeMap.value, [activeCategory.value]: value }
  resetPage()
}

/** 更新当前分类的页码 */
function onPage(value: number) {
  pageMap.value = { ...pageMap.value, [activeCategory.value]: value }
}

/** 更新当前分类的每页条数 */
function onPageSize(value: number) {
  sizeMap.value = { ...sizeMap.value, [activeCategory.value]: value }
  resetPage()
}

/** 当前分类回到第一页 */
function resetPage() {
  pageMap.value = { ...pageMap.value, [activeCategory.value]: 1 }
}

/** 打开报告预览 */
function openReport(record: ReportRecord) {
  activeRecord.value = record
}

/** 关闭报告预览 */
function closeReport() {
  activeRecord.value = null
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满；底色随大屏根节点（与总览页同源）。
   内距 16 / 间距 16 取自设计稿 117:21198。 */
.op-report {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: vw(16);
  padding: vh(16) vw(16);
}

/* 左栏：报告分类（设计稿固定 280 宽） */
.op-report__side {
  width: vw(280);
  flex-shrink: 0;
}

/* 右栏：详细记录（吃掉剩余宽度） */
.op-report__main {
  flex: 1;
  min-width: 0;
}
</style>
