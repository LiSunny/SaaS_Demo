<template>
  <div class="data-panel">
    <!-- ===== 左右分栏 ===== -->
    <div class="content-area">
      <!-- ===== 左侧面板 ===== -->
      <div class="left-panel">
        <!-- 数据概览 -->
        <div class="panel-section">
          <div class="section-title">
            <div class="title-bar" />
            <span class="title-text">数据概览</span>
          </div>
          <slot name="overview" />
        </div>

        <!-- 排行榜（可选） -->
        <div v-if="$slots.ranking" class="panel-section">
          <slot name="ranking" />
        </div>

        <!-- 实时动态（时间轴） -->
        <div class="panel-section panel-section--grow">
          <div class="section-title">
            <div class="title-bar" />
            <span class="title-text">{{ timelineTitle }}</span>
          </div>
          <slot name="timeline" />
        </div>
      </div>

      <!-- ===== 右侧面板 ===== -->
      <div class="right-panel">
        <!-- 搜索/筛选栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchText"
            :placeholder="searchPlaceholder"
            class="search-input-el"
          >
            <template #prefix>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#c1c1c1" stroke-width="1.5">
                <circle cx="7" cy="7" r="5" />
                <line x1="11" y1="11" x2="14" y2="14" />
              </svg>
            </template>
          </el-input>
          <el-select
            v-model="filterValue"
            :placeholder="filterPlaceholder"
            class="filter-select-el"
            popper-class="bigscreen-el-select-dropdown"
          >
            <el-option
              v-for="opt in filterOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-button type="primary" class="query-btn-el" @click="$emit('query', { search: searchText, filter: filterValue })">
            查询
          </el-button>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrap">
          <el-table
            :data="paginatedRows"
            :header-cell-style="headerCellStyle"
            stripe
          >
            <slot name="table-columns" />
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-bar">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="currentPageSize"
            :page-sizes="[10, 20, 50]"
            :total="tableRows.length"
            layout="total, sizes, prev, pager, next"
            :pager-count="5"
            background
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface FilterOption {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  searchPlaceholder?: string
  filterPlaceholder?: string
  filterOptions?: FilterOption[]
  tableRows?: Record<string, any>[]
  pageSize?: number
  timelineTitle?: string
}>(), {
  searchPlaceholder: '搜索...',
  filterPlaceholder: '全部',
  filterOptions: () => [],
  tableRows: () => [],
  pageSize: 10,
  timelineTitle: '实时动态',
})

defineEmits<{
  query: [params: { search: string; filter: string }]
}>()

const searchText = ref('')
const filterValue = ref('')
const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * currentPageSize.value
  return props.tableRows.slice(start, start + currentPageSize.value)
})

const headerCellStyle = {
  background: '#0457a7',
  color: '#bcd9ff',
  border: 'none',
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 容器 ===== */
.data-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 内容区：左右分栏 ===== */
.content-area {
  width: 100%;
  flex: 1;
  display: flex;
  gap: vw(48);
  min-height: 0;
  overflow: hidden;
  padding: vh(18) vw(18);
}

/* ===== 左侧面板 ===== */
.left-panel {
  flex-shrink: 0;
  width: vw(423);
  display: flex;
  flex-direction: column;
  gap: vh(32);
  padding: vh(12) 0;
  height: 100%;
  min-height: 0;
  overflow: hidden auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  flex-shrink: 0;
}

.panel-section--grow {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ===== 小节标题 ===== */
.section-title {
  display: flex;
  align-items: center;
  gap: vw(12);
  flex-shrink: 0;
}

.title-bar {
  width: 4px;
  height: 18px;
  background: #2584ab;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(37, 132, 171, 0.36);
  flex-shrink: 0;
}

.title-text {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 20px);
  font-weight: 500;
  color: #ffffff;
  line-height: normal;
  white-space: nowrap;
}

/* ===== 右侧面板 ===== */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: vh(12);
  padding: vh(12) 0;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/* ===== 搜索栏 ===== */
.search-bar {
  display: flex;
  align-items: center;
  gap: vw(18);
  flex-shrink: 0;
}

.search-input-el {
  width: vw(203);
  flex-shrink: 0;
}

.filter-select-el {
  width: vw(140);
  flex-shrink: 0;
}

.query-btn-el {
  flex-shrink: 0;
}

/* ===== 表格容器 ===== */
.table-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.table-wrap :deep(.el-table) {
  flex: 1;
}

.table-wrap :deep(.el-table__body-wrapper) {
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }
}

/* ===== 分页栏 ===== */
.pagination-bar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
</style>
