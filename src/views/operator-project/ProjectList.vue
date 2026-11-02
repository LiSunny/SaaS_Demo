<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input
              v-model="keyword"
              class="fi-input"
              placeholder="项目名称或编号"
              @keyup.enter="handleSearch"
            />
            <AppIcon v-if="keyword" name="clear" class="fi-clear" @click="handleClear" />
            <AppIcon name="search" class="fi-icon" />
          </div>

          <button class="btn-primary" @click="handleSearch">查询</button>
        </div>

        <div class="filter-right">
          <button class="btn-outline-primary" @click="openCreate">
            <AppIcon name="plus" class="btn-add-icon" />新增
          </button>
          <button class="btn-outline-default" @click="handleExport">
            <AppIcon name="download" class="btn-add-icon" />导出全部
          </button>
          <button
            class="btn-outline-danger"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            <AppIcon name="delete" class="btn-add-icon" />批量删除
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-check">
                <el-checkbox
                  :model-value="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="handleToggleAll"
                />
              </th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-code"><span>项目编号</span></th>
              <th class="fi-th col-name"><span>项目名称</span></th>
              <th class="fi-th col-owner"><span>负责人</span></th>
              <th class="fi-th fi-th-sort col-date" @click="toggleDateSort">
                <span>创建时间</span>
                <TableSortIcon :direction="dateSortDir" />
              </th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-check">
                <el-checkbox
                  :model-value="selectedIds.includes(row.id)"
                  @change="() => toggleSelect(row.id)"
                />
              </td>
              <td class="fi-td col-status">
                <span class="proj-tag" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
              </td>
              <td class="fi-td col-code">{{ row.code }}</td>
              <td class="fi-td col-name" :title="row.name">{{ row.name }}</td>
              <td class="fi-td col-owner">{{ row.owner || '—' }}</td>
              <td class="fi-td col-date">{{ row.createdAt.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="查看详情" @click="handleView(row)">
                    <AppIcon name="browse" class="act-icon" />
                  </button>
                  <button class="act-btn act-edit" title="编辑" @click="openEdit(row)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- 空态 -->
            <tr v-if="!pageRows.length">
              <td colspan="7" class="fi-td empty-cell">暂无项目，点击右上角「新增」创建</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ page }}/{{ pageCount }} 页</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @change="handlePageChange"
        />
      </div>

    </div>

    <!-- ===== 新增 / 编辑项目抽屉 ===== -->
    <ProjectFormDrawer
      v-model:visible="drawerVisible"
      :mode="drawerMode"
      :edit-id="drawerEditId"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ProjectList.vue — 项目档案列表页（运营商侧）
 *
 * 依据 docs/项目管理/product-design.md：
 *   §7.1  项目档案列表：查询 / 新增 / 编辑 / 删除 / 导出 / 批量删除
 *   §6.7  项目编辑 / 删除（删除确认需说明单位与设备的影响）
 *   §9    状态设计（待启动 / 进行中 / 已完成）
 *   §10.2 复用现有 UI（列表骨架照 DeviceList.vue，分页覆盖照抄其样式）
 *
 * 数据源：Pinia store `useProjectOpsStore`（src/stores/project-ops.ts）
 */
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectOpsStore, PROJECT_STATUS_LABEL } from '@/stores/project-ops'
import type { Project, ProjectStatus } from '@/types/project-ops'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import ProjectFormDrawer from './ProjectFormDrawer.vue'

const store = useProjectOpsStore()
const router = useRouter()

// ===== 查询 =====
const keyword = ref('')
/** 已生效的查询词（点「查询」/ 回车时才生效） */
const appliedKeyword = ref('')

function handleSearch() {
  appliedKeyword.value = keyword.value
  page.value = 1
}

function handleClear() {
  keyword.value = ''
  appliedKeyword.value = ''
  page.value = 1
}

// ===== 排序 =====
const dateSortDir = ref<'none' | 'asc' | 'desc'>('desc')

function toggleDateSort() {
  if (dateSortDir.value === 'none') dateSortDir.value = 'desc'
  else if (dateSortDir.value === 'desc') dateSortDir.value = 'asc'
  else dateSortDir.value = 'none'
  page.value = 1
}

/** 筛选 + 排序后的全部数据（导出「全部」用的就是这一份） */
const filteredProjects = computed<Project[]>(() => {
  const kw = appliedKeyword.value.trim().toLowerCase()
  const list = kw
    ? store.projects.filter(
        p => p.name.toLowerCase().includes(kw) || p.code.toLowerCase().includes(kw),
      )
    : [...store.projects]
  if (dateSortDir.value === 'asc') list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  else if (dateSortDir.value === 'desc') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return list
})

// ===== 分页 =====
const page = ref(1)
const size = ref(10)
const total = computed(() => filteredProjects.value.length)
const pageCount = computed(() => Math.ceil(total.value / size.value) || 1)
const pageRows = computed(() => {
  const start = (page.value - 1) * size.value
  return filteredProjects.value.slice(start, start + size.value)
})

function handleSizeChange() {
  page.value = 1
}

function handlePageChange() {
  if (page.value > pageCount.value) page.value = pageCount.value
}

// 筛选 / 删除后总页数变少时，回收越界页码
watch([total, size], () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})

// ===== 勾选 =====
const selectedIds = ref<string[]>([])

const isAllSelected = computed(
  () => pageRows.value.length > 0 && pageRows.value.every(r => selectedIds.value.includes(r.id)),
)
const isIndeterminate = computed(() => {
  const count = pageRows.value.filter(r => selectedIds.value.includes(r.id)).length
  return count > 0 && count < pageRows.value.length
})

function toggleSelect(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(x => x !== id)
    : [...selectedIds.value, id]
}

/** 表头全选：作用于当前页 */
function handleToggleAll(value: boolean) {
  const ids = pageRows.value.map(r => r.id)
  if (value) selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
  else selectedIds.value = selectedIds.value.filter(id => !ids.includes(id))
}

// ===== 状态字典（§7.1：待启动灰 / 进行中蓝 / 已完成绿） =====
const STATUS_CLASS: Record<ProjectStatus, string> = {
  pending: 'normal',
  running: 'info',
  done: 'success',
}

function statusClass(status: ProjectStatus): string {
  return STATUS_CLASS[status]
}

function statusLabel(status: ProjectStatus): string {
  return PROJECT_STATUS_LABEL[status]
}

// ===== 抽屉 =====
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')
const drawerEditId = ref('')

function openCreate() {
  drawerMode.value = 'create'
  drawerEditId.value = ''
  drawerVisible.value = true
}

function openEdit(row: Project) {
  drawerMode.value = 'edit'
  drawerEditId.value = row.id
  drawerVisible.value = true
}

/** 抽屉保存成功后清空勾选；新建时回到第一页（§8.5 批量操作后清空勾选） */
function handleSaved() {
  if (drawerMode.value === 'create') page.value = 1
  selectedIds.value = []
}

// ===== 行操作 =====
/** 详情页路由由壳层统一登记（/projects/:id） */
function handleView(row: Project) {
  router.push(`/projects/${row.id}`).catch(() => {
    /* 详情路由未登记时忽略 */
  })
}

/** 转义后拼进确认弹窗的 HTML 文案 */
const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => HTML_ESCAPE[c] ?? c)
}

/** 项目下的单位数 / 设备数（口径与项目 KPI 一致，design.md §8.4） */
function impactOf(projectId: string): { units: number; devices: number } {
  return {
    units: store.unitRows(projectId).length,
    devices: store.devices.filter(d => d.projectId === projectId).length,
  }
}

async function handleDelete(row: Project) {
  const { units, devices } = impactOf(row.id)
  const impact =
    units || devices
      ? `项目下的 ${units} 个单位、${devices} 台设备仍保留在台账，仅解除与本项目的关联。项目的可视化配置将一并删除。`
      : '该项目暂无接入单位与设备，删除后不可恢复。'
  try {
    await ElMessageBox.confirm(
      `删除项目「${escapeHtml(row.name)}」？<br>${impact}`,
      '删除项目',
      {
        dangerouslyUseHTMLString: true,
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }
  store.deleteProject(row.id)
  selectedIds.value = selectedIds.value.filter(id => id !== row.id)
  ElMessage.success('删除成功')
}

async function handleBatchDelete() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${ids.length} 个项目？<br>项目下的单位与设备仍保留在台账，仅解除与本项目的关联。项目的可视化配置将一并删除。`,
      '批量删除',
      {
        dangerouslyUseHTMLString: true,
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }
  let success = 0
  let failed = 0
  for (const id of ids) {
    try {
      store.deleteProject(id)
      success += 1
    } catch {
      failed += 1
    }
  }
  selectedIds.value = []
  if (failed) ElMessage.warning(`成功删除 ${success} 个项目，${failed} 个删除失败`)
  else ElMessage.success(`成功删除 ${success} 个项目`)
}

// ===== 导出全部（当前筛选结果的全部数据） =====
function handleExport() {
  const rows = filteredProjects.value
  if (!rows.length) {
    ElMessage.warning('没有可导出的项目档案')
    return
  }
  const head = [
    '项目编号',
    '项目名称',
    '项目类型',
    '状态',
    '管理范围',
    '负责人',
    '开始日期',
    '结束日期',
    '创建人',
    '创建时间',
  ]
  const body = rows.map(p => [
    p.code,
    p.name,
    p.type,
    statusLabel(p.status),
    p.region,
    p.owner,
    p.startDate,
    p.endDate,
    p.creator,
    p.createdAt,
  ])
  const csv = [head, ...body]
    .map(cols => cols.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  // 带 BOM，避免 Excel 打开中文乱码
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `项目档案_${todayStamp()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.length} 条项目档案`)
}

/** 今天的日期戳 YYYYMMDD */
function todayStamp(): string {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: auto;
}

/* 描边按钮：新增 / 导出 / 批量删除 */
.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

.btn-outline-default {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border-high); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-default:hover { background: var(--accent-primary10); color: var(--accent-primary); }

.btn-outline-danger {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: transparent; color: var(--danger);
  border: 1px solid var(--danger); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-danger:hover:not(:disabled) { background: var(--danger-bg); }
.btn-outline-danger:disabled { opacity: .5; cursor: not-allowed; }

/* 项目状态标签 */
.proj-tag {
  display: inline-flex; align-items: center; justify-content: center;
  padding: var(--spacing-xs, 4px) var(--spacing-lg, 12px);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px); font-weight: 400; line-height: normal;
  white-space: nowrap;
}
.proj-tag.info { background: var(--info-bg); color: var(--accent-primary); }
.proj-tag.success { background: var(--success-bg); color: var(--success-text); }
.proj-tag.normal { background: var(--normal-bg); color: var(--normal); }

/* 列宽 */
.col-check { width: 48px; }
.col-status { width: 96px; }
.col-code { min-width: 150px; }
.col-name { min-width: 180px; max-width: 280px; overflow: hidden; text-overflow: ellipsis; }
.col-owner { min-width: 96px; }
.col-date { min-width: 120px; }
.col-actions { width: 120px; min-width: 120px; white-space: nowrap; }

/* 空态 */
.fi-td.empty-cell {
  color: var(--text-muted); text-align: center;
  padding: var(--spacing-xl, 16px) 0; white-space: normal;
}

@media (max-width: 1250px) { .col-code { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}

/* 分页：覆盖 Element Plus 默认样式（与 DeviceList.vue 一致） */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }
</style>
