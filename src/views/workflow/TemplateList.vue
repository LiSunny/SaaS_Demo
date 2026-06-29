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
              <th class="fi-th fi-th-sort col-progress"><span>模版概览</span></th>
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
              <td class="fi-td col-name">
                {{ row.name }}
                <span v-if="isSeed(row)" class="seed-badge" title="种子模版">⭐</span>
              </td>
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
                  <button v-if="!isSeed(row)" class="act-btn act-seed" @click="handleWriteSeedFromList(row)" title="写入种子">📌</button>
                  <button v-if="isSeed(row)" class="act-btn act-seed" @click="handleUpdateSeedFromList(row)" title="更新种子">🔄</button>
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
import { onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import { useWorkflowStore } from '@/stores/workflow'
import type { TemplateItem } from '@/types/workflow'
import { isSeedTemplate, saveAsSeed } from '@/api/workflow'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const router = useRouter()
const store = useWorkflowStore()
const { confirmDelete, confirmBatchDelete, confirmToggle } = useConfirm()
const { query } = store

/** 种子模板状态映射 id → boolean */
const seedMap = reactive<Record<number, boolean>>({})

/** 拉取列表并注入种子标记 */
const fetchListWithSeed = async () => {
  await store.fetchList()
  for (const item of store.list) {
    seedMap[item.id] = await isSeedTemplate(item.id)
  }
}

/** 判断某行是否为种子模板 */
const isSeed = (row: TemplateItem) => seedMap[row.id] ?? false

const handleSearch = () => { query.page = 1; fetchListWithSeed() }
const handleReset = () => { query.keyword = ''; query.status = ''; handleSearch() }
const handleAdd = () => { router.push('/system/template/config') }
const handleView = (row: TemplateItem) => { router.push(`/system/template/config/${row.id}?mode=view`) }
const handleEdit = (row: TemplateItem) => { router.push(`/system/template/config/${row.id}`) }
const handleDelete = async (row: TemplateItem) => {
  await confirmDelete(row.name)
  store.remove(row.id)
}
const handleBatchDelete = async () => {
  if (store.selected.length === 0) return
  await confirmBatchDelete(store.selected.length, '个模板')
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
  await confirmToggle(row.name, newLabel)
  store.toggleStatus(row)
}

const toggleAll = () => {
  if (allChecked.value) store.selected = []
  else store.selected = [...store.list]
}

const handleWriteSeedFromList = async (row: TemplateItem) => {
  try {
    await saveAsSeed(row.id)
    seedMap[row.id] = true
    ElMessage.success(`「${row.name}」已保存为种子模版`)
  } catch (e: any) {
    ElMessage.error(e?.message || '写入种子失败')
  }
}

const handleUpdateSeedFromList = async (row: TemplateItem) => {
  try {
    await saveAsSeed(row.id)
    ElMessage.success(`「${row.name}」种子已更新`)
  } catch (e: any) {
    ElMessage.error(e?.message || '更新种子失败')
  }
}

onMounted(() => fetchListWithSeed())
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
.help-title { font-size: var(--font-h4, 16px); font-weight: 500; color: var(--text-primary); margin-bottom: var(--spacing-sm, 6px); }
.help-desc { font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--spacing-lg, 12px); }

.col-check { width: 50px; }
.col-status { width: 125px; min-width: 100px; }
.col-name { min-width: 140px; }
.col-progress { width: 140px; }
.col-code { width: 130px; }
.col-creator { width: 100px; }
.col-time { width: 180px; }
.col-actions { width: 210px; min-width: 190px; white-space: nowrap; }
.progress-num { font-weight: 500; color: var(--accent-primary); }

@media (max-width: 1550px) { .col-creator { display: none !important; } }
@media (max-width: 1250px) { .col-code { display: none !important; } }
@media (max-width: 1050px) { .col-time { display: none !important; } }
@media (max-width: 800px) { .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; } .filter-left { flex-wrap: wrap; } .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; } }

:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: var(--bg-card); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; }
</style>
