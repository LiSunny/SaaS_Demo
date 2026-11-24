<!--
  NotificationTable.vue — 消息通知「全部列表」内容（筛选行 + 表格 + 分页）

  视觉基准：Figma 节点 6591:6743「消息通知列表」
    筛选行：搜索框（166×36）+ 状态下拉（132×36）+ 查询按钮（72×36）
    表格 4 列：序号 / 状态 / 标题 / 接收时间（接收时间可排序）
    分页：「共 N 条记录 第 x/y 页」+ 页码器

  两处复用（同一份组件、同一份数据，避免两套实现漂移）：
    - 消息通知抽屉的「全部列表」态（顶栏「全部」/「查看全部消息」进入）
    - 独立列表页 /notifications

  与全局 .fi-table 的差异（组件内覆写）：
    - 设计稿数据行为纯白（无隔行底色），行与行之间留 6px 间距
    - 表头文字与数据字号按设计稿放大到 16px

  点行不在组件内开抽屉，只抛事件，由外层决定如何呈现详情。
-->

<template>
  <div class="nt-wrap">
    <!-- ===== 筛选行 ===== -->
    <div class="nf-filter">
      <div class="nf-search">
        <input
          v-model="store.query.keyword"
          class="nf-search-input"
          placeholder="标题名称"
          @keyup.enter="handleSearch"
        />
        <AppIcon name="search" class="nf-search-icon" />
      </div>

      <el-select
        v-model="store.query.readStatus"
        class="nf-select"
        placeholder="全部"
        @change="handleSearch"
      >
        <template #suffix>
          <AppIcon name="down" class="nf-select-arrow" />
        </template>
        <el-option label="全部" value="all" />
        <el-option label="未读" value="unread" />
        <el-option label="已读" value="read" />
      </el-select>

      <button class="nf-search-btn" type="button" @click="handleSearch">查询</button>
    </div>

    <!-- ===== 表格 ===== -->
    <div class="table-wrap">
      <table class="fi-table nf-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th nf-col-index"><span>序号</span></th>
            <th class="fi-th nf-col-status"><span>状态</span></th>
            <th class="fi-th nf-col-title"><span>标题</span></th>
            <th class="fi-th fi-th-sort nf-col-time" @click="toggleTimeSort">
              <span>接收时间</span>
              <TableSortIcon :direction="sortDirection" />
            </th>
          </tr>
        </thead>
        <tbody v-loading="store.loading">
          <tr
            v-for="(row, index) in store.list"
            :key="row.id"
            class="fi-tbody-tr nf-row"
            @click="emit('open-detail', row.id)"
          >
            <td class="fi-td nf-col-index">{{ (store.query.page - 1) * store.query.size + index + 1 }}</td>
            <td class="fi-td nf-col-status">
              <span :class="['nf-tag', row.read ? 'is-read' : 'is-unread']">
                {{ row.read ? '已读' : '未读' }}
              </span>
            </td>
            <td class="fi-td nf-col-title">{{ row.title }}</td>
            <td class="fi-td nf-col-time">{{ row.receivedAt }}</td>
          </tr>

          <tr v-if="!store.loading && store.list.length === 0" class="fi-tbody-tr">
            <td colspan="4" class="nf-empty">暂无消息</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 分页 ===== -->
    <div class="pagination-wrap nf-pagination">
      <span class="pagi-total">
        共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{ totalPages }} 页
      </span>
      <el-pagination
        v-model:current-page="store.query.page"
        :page-size="store.query.size"
        :total="store.total"
        layout="prev, pager, next"
        background
        @current-change="store.fetchList()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import { useNotificationStore } from '@/stores/notification'

const emit = defineEmits<{
  /** 点表格行 → 通知外层呈现详情（抽屉内切详情态） */
  'open-detail': [id: number]
}>()

const store = useNotificationStore()

const totalPages = computed(() => Math.ceil(store.total / store.query.size) || 1)

/** 表头排序方向（none → asc → desc 循环） */
const sortDirection = computed<'none' | 'asc' | 'desc'>(
  () => store.query.sortOrder ?? 'desc',
)

function toggleTimeSort() {
  const current = store.query.sortOrder ?? 'desc'
  store.query.sortOrder = current === 'desc' ? 'asc' : 'desc'
  store.search()
}

/** 查询（回到第一页） */
function handleSearch() {
  store.search()
}

onMounted(() => {
  store.fetchList()
})
</script>

<style scoped>
/* ===== 筛选行 ===== */
.nf-filter {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px;
}

/* 搜索框 166×36 */
.nf-search {
  position: relative;
  width: 166px;
  height: 36px;
  background: var(--bg-sub-card);
  border: 1px solid var(--border-high);
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  padding: 0 16px;
  transition: border-color .15s;
}
.nf-search:focus-within {
  border-color: var(--accent-primary);
}
.nf-search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 16px;
  color: var(--text-primary);
  padding: 0;
}
.nf-search-input::placeholder {
  color: var(--text-placeholder);
}
.nf-search-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--text-placeholder);
}

/* 状态下拉 132×36 */
.nf-select {
  width: 132px;
}
.nf-select :deep(.el-select__wrapper) {
  min-height: 36px;
  padding: 0 12px 0 16px;
  background: var(--bg-sub-card);
  border: 1px solid var(--border-high);
  border-radius: var(--radius-md, 8px);
  box-shadow: none;
}
.nf-select :deep(.el-select__wrapper.is-focused) {
  border-color: var(--accent-primary);
}
.nf-select :deep(.el-select__selected-item) {
  font-size: 16px;
  color: var(--text-primary);
}
.nf-select :deep(.el-select__placeholder) {
  font-size: 16px;
  color: var(--text-placeholder);
}
.nf-select-arrow {
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}

/* 查询按钮 72×36 */
.nf-search-btn {
  height: 36px;
  min-width: 72px;
  padding: 8px 12px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: var(--accent-primary);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
}
.nf-search-btn:hover { background: var(--el-color-primary-dark-2); }

/* ===== 表格 ===== */
.nf-table {
  table-layout: fixed;
}
/* 设计稿数据行纯白，与全局的隔行底色不同 */
.nf-table :deep(.fi-tbody-tr:nth-child(even)) {
  background: transparent;
}
.nf-table :deep(.fi-tbody-tr) {
  border-bottom: none;
}
.nf-row {
  cursor: pointer;
}
.nf-row:hover {
  background: var(--table-row-hover) !important;
}
.nf-table :deep(.fi-th) {
  font-size: 16px;
  color: var(--table-header-text);
  padding: 10px;
}
.nf-table :deep(.fi-td) {
  font-size: 16px;
  padding: 10px;
}

.nf-col-index { width: 86px; }
.nf-col-status { width: 98px; }
.nf-col-time { width: 225px; }
.nf-col-title { width: auto; }

/* 标题列左对齐且允许换行 */
.nf-table :deep(.nf-col-title) {
  text-align: left;
  white-space: normal;
  word-break: break-word;
}

/* 状态标签（tag/big） */
.nf-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}
.nf-tag.is-read {
  background: var(--success-bg);
  color: var(--success-text);
}
.nf-tag.is-unread {
  background: var(--danger-bg);
  color: var(--danger-text);
}

.nf-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
}

/* ===== 分页 ===== */
.nf-pagination {
  padding: 16px 0 8px;
}
.nf-pagination :deep(.pagi-total) {
  font-size: 16px;
}
</style>
