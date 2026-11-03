<template>
  <div class="archive bigscreen">
    <!-- ===== 左栏：档案分类（设计稿 110:19099） ===== -->
    <EbikeV2ArchiveSidebar
      class="archive__side"
      :tabs="tabs"
      :active-tab="activeTab"
      @update:active-tab="onTabChange"
    />

    <!-- ===== 右栏：详细记录（设计稿 110:16923） ===== -->
    <EbikeV2ListPanel
      class="archive__main"
      :tabs="tabs"
      :active-tab="activeTab"
      :rows="filteredRows"
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
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 消防档案页
 *
 * 版式按设计稿 110:11265（智能安全管控平台 / 消防档案）：
 *   左「档案分类」分区（280 宽，纵向三个分类）+ 右「详细记录」分区（表格）。
 *
 * 分类 tab 从原来的「卡片内顶部横排」移到左栏（设计稿把分类做成侧栏，
 * 表格区因此能占满整屏宽度 —— 值班记录 7 列、巡查 9 列、隐患 10 列，
 * 窄表区会把长时间戳列压到截断）。
 *
 * 数据：`archive/archive-data.ts` 的演示数据（基准日 2026-11-03，日期写死，
 * 楼栋取校园三维模型 Z4 的真实 POI）。接口接入时只换该文件，组件不动。
 *
 * 状态色与平台截图不同：截图是浅底页、绿「已完成」橙「待认领」；本页是
 * 深蓝玻璃底，按本大屏口径改成「异常统一一个红 + 其余中性色阶」，避免
 * 深底上绿橙达不到 4.5:1 对比度。
 *
 * 根节点带 `bigscreen` class：项目的大屏 EP 深色主题（`styles/bigscreen-ep.scss`）
 * 以它为作用域，下拉框 / 日期面板 / 分页器用这套主题才是深色；不带就是
 * Element Plus 默认浅色样式，与全站大屏不一致。
 */
import { computed, ref } from 'vue'
import EbikeV2ArchiveSidebar from '../archive/EbikeV2ArchiveSidebar.vue'
import EbikeV2ListPanel from '../EbikeV2ListPanel.vue'
import { ARCHIVE_TABS, filterArchiveRows } from '../archive/archive-data'
import type { ArchiveDateRange, ArchiveTabKey } from '../archive/archive-data'

/** 三类记录（tab） */
const tabs = ARCHIVE_TABS

/** 当前 tab */
const activeTab = ref<ArchiveTabKey>('duty')

/**
 * 每个 tab 各自记住搜索词、筛选值、日期区间与分页：切走再切回来不丢。
 * 筛选值默认取该维度的第一项（「全部」）。
 */
const searchMap = ref<Record<string, string>>(
  Object.fromEntries(tabs.map((t) => [t.key, ''])),
)
const filterMap = ref<Record<string, Record<string, string>>>(
  Object.fromEntries(
    tabs.map((t) => [
      t.key,
      Object.fromEntries(t.filters.map((f) => [f.key, f.options[0]])),
    ]),
  ),
)
const dateRangeMap = ref<Record<string, ArchiveDateRange>>(
  Object.fromEntries(tabs.map((t) => [t.key, null])),
)

/** 每个 tab 各自的页码与每页条数 */
const pageMap = ref<Record<string, number>>(Object.fromEntries(tabs.map((t) => [t.key, 1])))
const sizeMap = ref<Record<string, number>>(Object.fromEntries(tabs.map((t) => [t.key, 10])))

/** 当前 tab 定义 */
const currentTab = computed(() => tabs.find((t) => t.key === activeTab.value) ?? tabs[0])

/** 当前 tab 的搜索词 */
const currentSearch = computed(() => searchMap.value[activeTab.value] ?? '')

/** 当前 tab 的筛选值 */
const currentFilters = computed(() => filterMap.value[activeTab.value] ?? {})

/** 当前 tab 的日期区间 */
const currentDateRange = computed(() => dateRangeMap.value[activeTab.value] ?? null)

/** 当前 tab 的页码 / 每页条数 */
const currentPage = computed(() => pageMap.value[activeTab.value] ?? 1)
const currentPageSize = computed(() => sizeMap.value[activeTab.value] ?? 10)

/** 过滤后的行：搜索词、筛选器与日期区间之间是 AND 关系 */
const filteredRows = computed(() =>
  filterArchiveRows(
    currentTab.value,
    currentTab.value.rows,
    currentSearch.value,
    currentFilters.value,
    currentDateRange.value,
  ),
)

/** 切换分类 */
function onTabChange(key: ArchiveTabKey) {
  activeTab.value = key
}

/** 更新当前 tab 的搜索词（筛选条件变了，回到第一页） */
function onSearch(value: string) {
  searchMap.value = { ...searchMap.value, [activeTab.value]: value }
  resetPage()
}

/** 更新当前 tab 的筛选值（同上，回到第一页） */
function onFilters(value: Record<string, string>) {
  filterMap.value = { ...filterMap.value, [activeTab.value]: value }
  resetPage()
}

/** 更新当前 tab 的日期区间（同上，回到第一页） */
function onDateRange(value: ArchiveDateRange) {
  dateRangeMap.value = { ...dateRangeMap.value, [activeTab.value]: value }
  resetPage()
}

/** 更新当前 tab 的页码 */
function onPage(value: number) {
  pageMap.value = { ...pageMap.value, [activeTab.value]: value }
}

/** 更新当前 tab 的每页条数 */
function onPageSize(value: number) {
  sizeMap.value = { ...sizeMap.value, [activeTab.value]: value }
  resetPage()
}

/** 当前 tab 回到第一页 */
function resetPage() {
  pageMap.value = { ...pageMap.value, [activeTab.value]: 1 }
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满；底色随大屏根节点（与总览页同源） */
.archive {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: vw(18);
  padding: vh(18) vw(16) vh(16);
}

/* 左栏：档案分类（设计稿固定 280 宽） */
.archive__side {
  width: vw(280);
  flex-shrink: 0;
}

/* 右栏：详细记录（吃掉剩余宽度） */
.archive__main {
  flex: 1;
  min-width: 0;
}
</style>
