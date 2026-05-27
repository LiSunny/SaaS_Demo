<template>
  <div class="list-page">
    <div class="content-card">
      <!-- ===== 帮助说明 ===== -->
      <div class="help-box">
        <div class="help-left">
          <div class="help-icon" />
        </div>
        <div class="help-right">
          <h3 class="help-title">什么是流程编排配置？</h3>
          <p class="help-desc">自定义业务流转标准的工具，通过定义表单与流程，实现业务处理的标准化。</p>
          <h3 class="help-title">如何使用流程编排配置？</h3>
          <p class="help-desc">基础设置：定义工单类型名称、唯一识别码及通知规则，赋予工单业务身份。表单设计：拖拽组件构建申请页面，自定义必填字段以规范业务数据收集。流程设计：编排节点逻辑与处理人，建立自动化流转路径以驱动业务运转。</p>
        </div>
      </div>

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="模板名称" @keyup.enter="handleSearch" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword='';handleSearch()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.status" placeholder="状态" clearable class="fi-select" :teleported="false" popper-class="fi-popper">
              <el-option label="全部" value="" />
              <el-option label="待生效" :value="0" />
              <el-option label="执行中" :value="1" />
              <el-option label="已停用" :value="2" />
              <el-option label="已过期" :value="3" />
            </el-select>
          </div>

          <button class="btn-primary" @click="handleSearch">查询</button>
          <button class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <button class="btn-primary" @click="handleAdd">
            <AppIcon name="plus" class="btn-add-icon" />
            新建模板
          </button>
          <button class="btn-danger" :disabled="store.selected.length === 0" @click="handleBatchDelete">批量删除</button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-check"><input type="checkbox" :checked="allChecked" @change="toggleAll" /></th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-name"><span>模板名称</span></th>
              <th class="fi-th fi-th-sort col-progress"><span>配置进度</span></th>
              <th class="fi-th col-code"><span>模板编号</span></th>
              <th class="fi-th col-creator"><span>创建人</span></th>
              <th class="fi-th fi-th-sort col-time"><span>最近更新时间</span><AppIcon name="sort" class="th-sort-icon" /></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-check"><input type="checkbox" :checked="store.selected.includes(row)" @change="toggleRow(row)" /></td>
              <td class="fi-td col-status">
                <StatusTag :status="row.status" />
              </td>
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-progress">
                <span class="progress-num">{{ row.nodeCount }}</span> 节点 · <span class="progress-num">{{ row.fieldCount }}</span> 字段
              </td>
              <td class="fi-td col-code">{{ row.code }}</td>
              <td class="fi-td col-creator">{{ row.creator }}</td>
              <td class="fi-td col-time">{{ row.updatedAt }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" @click="handleView(row)" title="查看"><AppIcon name="preview" class="act-icon" /></button>
                  <button class="act-btn act-edit" @click="handleEdit(row)" title="编辑"><AppIcon name="edit" class="act-icon" /></button>
                  <button class="act-btn act-delete" @click="handleDelete(row)" title="删除"><AppIcon name="delete" class="act-icon" /></button>
                  <el-switch :model-value="row.status === 1" :disabled="row.status === 3" @change="handleToggle(row)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{ Math.ceil(store.total / store.query.size) || 1 }} 页</span>
        <el-pagination v-model:current-page="store.query.page" v-model:page-size="store.query.size" :total="store.total" :page-sizes="[10,20,50,100]" layout="sizes, prev, pager, next, jumper" background @change="store.fetchList()" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useWorkflowStore } from '@/stores/workflow'
import type { TemplateItem } from '@/types/workflow'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const router = useRouter()
const store = useWorkflowStore()
const { query } = store

const handleSearch = () => { query.page = 1; store.fetchList() }
const handleReset = () => { query.keyword = ''; query.status = ''; handleSearch() }
const handleAdd = () => { router.push('/workflow/template/config') }
const handleView = (row: TemplateItem) => { router.push(`/workflow/template/config/${row.id}`) }
const handleEdit = (row: TemplateItem) => { router.push(`/workflow/template/config/${row.id}`) }
const handleDelete = async (row: TemplateItem) => {
  await ElMessageBox.confirm(`确认删除模板「${row.name}」？`, '提示', { type: 'warning' })
  store.remove(row.id)
}
const handleBatchDelete = async () => {
  if (store.selected.length === 0) return
  await ElMessageBox.confirm(`确认删除选中的 ${store.selected.length} 个模板？`, '批量删除', { type: 'warning' })
  store.batchRemove()
}

const toggleRow = (row: TemplateItem) => {
  const idx = store.selected.indexOf(row)
  if (idx > -1) store.selected.splice(idx, 1)
  else store.selected.push(row)
}
const allChecked = computed(() => store.list.length > 0 && store.selected.length === store.list.length)
const handleToggle = async (row: TemplateItem) => {
  const newLabel = row.status === 2 ? '启用' : '停用'
  await ElMessageBox.confirm(`确认${newLabel}模板「${row.name}」？`, '提示', { type: 'warning' })
  store.toggleStatus(row)
}

const toggleAll = () => {
  if (allChecked.value) store.selected = []
  else store.selected = [...store.list]
}

onMounted(() => store.fetchList())
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-xl, 16px); overflow: auto;
}

/* ===== 帮助说明 ===== */
.help-box {
  display: flex; gap: var(--spacing-xl, 16px);
  background: var(--bg-sub-card); border-radius: var(--radius-lg, 10px);
  padding: var(--spacing-xl, 16px);
}
.help-icon {
  width: 242px; height: 156px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent-primary10), var(--bg-sub-card));
  border-radius: var(--radius-md, 8px);
}
.help-right { flex: 1; min-width: 0; }
.help-title { font-size: var(--font-h4, 16px); font-weight: 500; color: var(--text-primary); margin-bottom: 6px; }
.help-desc { font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.6; margin-bottom: 10px; }

/* ===== 筛选栏 ===== */
.filter-bar { display: flex; align-items: center; justify-content: space-between; }
.filter-left { display: flex; align-items: center; gap: 26px; }
.search-input-wrap { position: relative; width: 208px; }
.fi-input {
  width: 100%; height: 36px; border: 1px solid var(--border-high);
  border-radius: var(--radius-md, 8px); padding: 8px 32px 8px var(--spacing-xl, 16px);
  font-size: var(--font-small, 14px); color: var(--text-primary); background: var(--bg-card); outline: none;
}
.fi-input::placeholder { color: var(--text-placeholder); }
.fi-input:focus { border-color: var(--accent-primary); }
.fi-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; opacity: .4; pointer-events: none; color: var(--text-muted); }
.fi-clear { position: absolute; right: 30px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; padding: 0; color: var(--text-muted); }
.fi-select-wrap { width: 193px; }
.fi-select-wrap :deep(.el-select) { width: 100%; }
.fi-select-wrap :deep(.el-select__wrapper) { border: 1px solid var(--border-high) !important; border-radius: var(--radius-md, 8px); padding: 8px var(--spacing-xl, 16px); box-shadow: none !important; background: var(--bg-card) !important; height: 36px; }
.fi-select-wrap :deep(.el-select__wrapper:hover), .fi-select-wrap :deep(.el-select__wrapper.is-focus) { border-color: var(--accent-primary) !important; box-shadow: none !important; }
.fi-select-wrap :deep(.el-select__placeholder) { color: var(--text-placeholder); }
.fi-select-wrap :deep(.el-select__caret) { color: var(--text-placeholder); }

.filter-right { display: flex; gap: var(--spacing-md, 8px); align-items: center; }

.btn-add-icon { width: 20px; height: 20px; }

/* 表格 + 分页 */
.table-wrap { flex: 1; overflow: auto; -webkit-overflow-scrolling: touch; }
.fi-table { width: 100%; border-collapse: collapse; table-layout: auto; }
.col-check { width: 50px; }
.col-status { width: 125px; min-width: 100px; }
.col-name { min-width: 140px; }
.col-progress { width: 140px; }
.col-code { width: 130px; }
.col-creator { width: 100px; }
.col-time { width: 180px; }
.col-actions { width: 210px; min-width: 190px; white-space: nowrap; }

@media (max-width: 1550px) { .col-creator { display: none !important; } }
@media (max-width: 1250px) { .col-code { display: none !important; } }
@media (max-width: 1050px) { .col-time { display: none !important; } }
@media (max-width: 800px) { .filter-bar { flex-direction: column; gap: 12px; align-items: stretch; } .filter-left { flex-wrap: wrap; } .pagination-wrap { flex-direction: column; gap: 12px; align-items: flex-start; } }

.fi-thead-tr { background: var(--table-header-bg); }
.fi-th { border-bottom: 1px solid var(--border-low); padding: 10px; font-size: var(--font-h4, 16px); font-weight: 400; color: var(--table-header-text); text-align: center; white-space: nowrap; }
.fi-th-sort { cursor: pointer; user-select: none; }
.fi-th-sort span { vertical-align: middle; }
.th-sort-icon { width: 18px; height: 18px; margin-left: 2px; vertical-align: middle; opacity: .5; color: var(--table-header-text); }
.fi-tbody-tr { border-bottom: 1px solid var(--border-low); }
.fi-tbody-tr:nth-child(even) { background: var(--bg-sub-card); }
.fi-tbody-tr:hover { background: var(--table-row-hover); }
.fi-td { padding: 10px; font-size: var(--font-body, 16px); color: var(--text-primary); white-space: nowrap; text-align: center; }
.progress-num { font-weight: 500; color: var(--accent-primary); }
.action-cell { display: flex; align-items: center; gap: 10px; }

.pagination-wrap { display: flex; align-items: center; justify-content: space-between; }
.pagi-total { color: var(--pagi-text); font-size: var(--font-small, 14px); }

/* EL 组件 Dark 适配 */
:deep(.el-loading-mask) { background-color: var(--bg-card); }
:deep(.el-loading-mask .path) { stroke: var(--accent-primary); }
:deep(.el-switch__core) { background-color: var(--border-high); }
:deep(.el-switch.is-checked .el-switch__core) { background-color: var(--accent-primary); border-color: var(--accent-primary); }
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; }
</style>
