<template>
  <div class="archive bigscreen">
    <EbikeV2ListPanel
      title="消防档案"
      :tabs="tabs"
      :active-tab="activeTab"
      :rows="filteredRows"
      :page="currentPage"
      :page-size="currentPageSize"
      :search="currentSearch"
      :filter-values="currentFilters"
      search-placeholder="搜索名称 / 位置 / 人员"
      empty-text="没有符合条件的记录"
      @update:active-tab="activeTab = $event"
      @update:search="onSearch"
      @update:filter-values="onFilters"
      @update:page="onPage"
      @update:page-size="onPageSize"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 消防档案页
 *
 * 台账与留档的检索入口：页内用 tab 分类三类记录，各自一张列表：
 *   值班记录 / 巡查记录 / 隐患台账。
 *
 * 版式：满宽单卡（不用共享的 `EbikeV2PageShell`）。
 *   那个外壳强制「右列 520 + 底部三模块」，主区只剩 1352px，而这三张表
 *   各有 9~10 列且含「2026-11-03 09:41:30」这类长值，主区被压到
 *   1352px 后长时间戳列只能截断。此页的信息就是「列表」本身，没有第二个
 *   模块要放，故整页给列表。
 *
 * 数据：`archive/archive-data.ts` 的演示数据（基准日 2026-11-03，日期写死，
 * 楼栋取校园三维模型 Z4 的真实 POI）。接口接入时只换该文件，组件不动。
 *
 * 状态色与平台截图不同：截图是浅底页、绿「已完成」橙「待认领」；本页是
 * 深蓝玻璃底，按本大屏口径改成「异常统一一个红 + 其余中性色阶」，避免
 * 深底上绿橙达不到 4.5:1 对比度。
 *
 * 根节点带 `bigscreen` class：项目的大屏 EP 深色主题（`styles/bigscreen-ep.scss`）
 * 以它为作用域，分页器（el-pagination）用这套主题才是深色；不带就是
 * Element Plus 默认浅色样式，与全站大屏不一致。
 */
import { computed, ref } from 'vue'
import EbikeV2ListPanel from '../EbikeV2ListPanel.vue'
import { ARCHIVE_TABS, filterArchiveRows } from '../archive/archive-data'
import type { ArchiveTabKey } from '../archive/archive-data'

/** 三类记录（tab） */
const tabs = ARCHIVE_TABS

/** 当前 tab */
const activeTab = ref<ArchiveTabKey>('duty')

/**
 * 每个 tab 各自记住搜索词与筛选值：切走再切回来不丢。
 * 筛选值默认取该维度的第一项（「全部」）。
 */
const searchMap = ref<Record<string, string>>(
  Object.fromEntries(tabs.map((t) => [t.key, ''])),
)
const filterMap = ref<Record<string, Record<string, string>>>(
  Object.fromEntries(
    tabs.map((t) => [t.key, Object.fromEntries(t.filters.map((f) => [f.key, f.options[0]]))]),
  ),
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

/** 当前 tab 的页码 / 每页条数 */
const currentPage = computed(() => pageMap.value[activeTab.value] ?? 1)
const currentPageSize = computed(() => sizeMap.value[activeTab.value] ?? 10)

/** 过滤后的行：搜索词与各筛选器之间是 AND 关系 */
const filteredRows = computed(() =>
  filterArchiveRows(currentTab.value, currentTab.value.rows, currentSearch.value, currentFilters.value),
)

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
  flex-direction: column;
  padding: vh(18) vw(16) vh(16);
}

/* 列表面板占满整页 */
.archive :deep(.list-panel) {
  flex: 1;
  min-height: 0;
  height: auto;
}
</style>
