<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 顶部帮助说明（流程编排特有） ===== -->
      <div class="help-card">
        <img class="help-illustration" src="/illustrations/workflow-help.png" alt="流程编排配置示意图" />
        <div class="help-content">
          <div class="help-section">
            <h3 class="help-title">什么是流程编排配置？</h3>
            <p class="help-text">自定义业务流转标准的工具，通过定义表单与流程，实现业务处理的标准化。</p>
          </div>
          <div class="help-section">
            <h3 class="help-title">如何使用流程编排配置？</h3>
            <ul class="help-list">
              <li><strong>基础设置</strong>：定义工单类型名称、唯一识别码及通知规则，赋予工单业务身份。</li>
              <li><strong>表单设计</strong>：拖拽组件构建申请页面，自定义必填字段以规范业务数据收集。</li>
              <li><strong>流程设计</strong>：编排节点逻辑与处理人，建立自动化流转路径以驱动业务运转。</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input
              v-model="query.keyword"
              class="fi-input"
              placeholder="名称"
              @keyup.enter="handleSearch"
            />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword='';handleSearch()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select
              v-model="query.status"
              placeholder="状态"
              clearable
              class="fi-select"
              :teleported="false"
              popper-class="fi-popper"
              @change="handleSearch"
            >
              <el-option label="已启用" :value="1" />
              <el-option label="未启用" :value="0" />
            </el-select>
          </div>

          <div class="fi-select-wrap">
            <el-select
              v-model="queryCycle"
              placeholder="周期"
              clearable
              class="fi-select"
              :teleported="false"
              popper-class="fi-popper"
              @change="handleSearch"
            >
              <el-option label="日" value="day" />
              <el-option label="周" value="week" />
              <el-option label="月" value="month" />
              <el-option label="季" value="season" />
              <el-option label="年" value="year" />
            </el-select>
          </div>

          <button class="btn-primary" @click="handleSearch">查询</button>
          <button class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <button class="system-tpl-btn" @click="handleCloneTemplate">
            <span>克隆模版快速开始</span>
          </button>
          <button class="btn-primary" @click="handleAdd">
            <AppIcon name="plus" class="btn-add-icon" />
            新建工作流
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th fi-th-sort col-code" @click="handleSort('code')">
                <span>模版编号</span><TableSortIcon :direction="sortDir" />
              </th>
              <th class="fi-th col-name"><span>模版名称</span></th>
              <th class="fi-th col-desc"><span>描述</span></th>
              <th class="fi-th fi-th-sort col-cross" @click="handleSort('cross')">
                <span>协同方式</span><TableSortIcon :direction="sortDir" />
              </th>
              <th class="fi-th col-creator"><span>创建人</span></th>
              <th class="fi-th fi-th-sort col-time" @click="handleSort('time')">
                <span>最近更新时间</span><TableSortIcon :direction="sortDir" />
              </th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <!-- 状态 -->
              <td class="fi-td col-status">
                <StatusTag :status="row.status === 1 ? 'on' : 'off'" />
              </td>
              <!-- 模板编号 -->
              <td class="fi-td col-code">{{ row.code }}</td>
              <!-- 模板名称 -->
              <td class="fi-td col-name">{{ row.name }}</td>
              <!-- 描述 -->
              <td class="fi-td col-desc cell-ellipsis" :title="rowDesc(row)">
                {{ rowDesc(row) || '—' }}
              </td>
              <!-- 协同方式 -->
              <td class="fi-td col-cross">
                <span :class="['tag-cross', rowCross(row) === 1 ? 'is-warning' : 'is-normal']">
                  {{ rowCross(row) === 1 ? '跨企业协同' : '企业内协同' }}
                </span>
              </td>
              <!-- 创建人 -->
              <td class="fi-td col-creator">{{ row.creator }}</td>
              <!-- 最近更新时间 -->
              <td class="fi-td col-time">{{ row.updatedAt }}</td>
              <!-- 操作 -->
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="查看" @click="handleView(row)">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                  <button class="act-btn act-edit" title="编辑" @click="handleEdit(row)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                  <button class="act-btn act-copy" title="复制" @click="handleCopy(row)">
                    <AppIcon name="copy" class="act-icon" />
                  </button>
                  <el-switch
                    :model-value="row.status === 1"
                    class="row-switch"
                    inline-prompt
                    active-text="启用"
                    inactive-text="停用"
                    :active-color="'#059669'"
                    :inactive-color="'#d9d9d9'"
                    @change="handleToggle(row)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!store.loading && store.list.length === 0">
              <td colspan="8" class="grid-empty">暂无工作流</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">
          共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{ Math.ceil(store.total / store.query.size) || 1 }} 页
        </span>
        <el-pagination
          v-model:current-page="store.query.page"
          v-model:page-size="store.query.size"
          :total="store.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @change="store.fetchList()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import { useWorkflowStore } from '@/stores/workflow'
import type { TemplateItem } from '@/types/workflow'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import StatusTag from '@/components/business/StatusTag.vue'

const router = useRouter()
const store = useWorkflowStore()
const { confirmDelete } = useConfirm()
const { query } = store

const queryCycle = ref<string>('')

const rowDesc = (row: TemplateItem & Record<string, any>) =>
  row.desc ?? row.description ?? row.remarks ?? ''
const rowCross = (row: TemplateItem & Record<string, any>) => {
  const v = row.crossEnt ?? row.cross_ent ?? row.crossEnterprise
  return v === 1 ? 1 : 0
}

const handleSearch = () => { query.page = 1; store.fetchList() }
const handleReset = () => { query.keyword = ''; query.status = ''; queryCycle.value = ''; handleSearch() }
const handleAdd = () => { router.push('/system/template/config') }
const handleView = (row: TemplateItem) => { router.push(`/system/template/config/${row.id}?mode=view`) }
const handleEdit = (row: TemplateItem) => { router.push(`/system/template/config/${row.id}`) }
const handleDelete = async (row: TemplateItem) => {
  await confirmDelete(row.name)
  store.remove(row.id)
}
const handleCopy = (row: TemplateItem) => {
  ElMessage.info(`「${row.name}」已复制（仅 UI 演示）`)
}
const handleToggle = async (row: TemplateItem) => {
  await store.toggleStatus(row)
}
const handleCloneTemplate = () => {
  ElMessage.info('克隆模版快速开始（仅 UI 演示）')
}

const sortDir = ref<'none' | 'asc' | 'desc'>('none')
const handleSort = (_field: string) => {
  if (sortDir.value === 'none') sortDir.value = 'desc'
  else if (sortDir.value === 'desc') sortDir.value = 'asc'
  else sortDir.value = 'none'
  store.fetchList()
}

onMounted(() => store.fetchList())
</script>

<style scoped>
/* ===== 布局 ===== */
.list-page { height: 100%; }

.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xl, 16px);
  overflow: auto;
}

/* ===== 顶部帮助卡片（流程编排特有，类名不带业务专有名词） ===== */
.help-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg, 12px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  background-color: var(--bg-sub-card);
  gap: var(--spacing-md, 10px);
  flex-shrink: 0;
}
.help-illustration {
  width: 242px;
  height: 156px;
  flex-shrink: 0;
  border-radius: var(--radius-md, 8px);
  object-fit: cover;
  display: block;
}
.help-content {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-lg, 12px);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 10px);
}
.help-section { display: flex; flex-direction: column; gap: var(--spacing-sm, 6px); }
.help-title {
  margin: 0;
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  line-height: 1.5;
  color: var(--accent-primary);
}
.help-text {
  margin: 0;
  font-size: var(--font-small, 14px);
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-tertiary);
}
.help-list {
  margin: 0;
  list-style: disc;
  padding-left: 21px;
  font-size: var(--font-small, 14px);
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-tertiary);
}
.help-list strong { color: var(--accent-primary); font-weight: 500; }

/* ===== "克隆模版快速开始" 渐变文字按钮（Figma 特有） ===== */
.system-tpl-btn {
  position: relative;
  overflow: hidden;
  height: 32px;
  padding: 0 var(--spacing-lg, 12px);
  border-radius: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.system-tpl-btn:hover { transform: translateY(-1px); }
.system-tpl-btn span {
  position: relative;
  z-index: 1;
  font-family: 'YouSheBiaoTiHei', 'AlibabaPuHuiTi', sans-serif;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 1px;
  line-height: 17px;
  background-image:
    linear-gradient(148.12deg, transparent 41.235%, rgba(255, 255, 255, 0.95) 50%, transparent 58.765%),
    linear-gradient(180deg, #95baff 0%, #4186fe 100%);
  background-size: 200% 100%, 100% 100%;
  background-position: 200% 0, 0 0;
  background-clip: text, text;
  -webkit-background-clip: text, text;
  color: transparent;
  background-repeat: no-repeat;
  animation: shine-text 2.5s ease-in-out infinite;
  transition: filter 0.2s ease;
}
.system-tpl-btn:hover span { filter: brightness(1.15); }
@keyframes shine-text {
  0%   { background-position: 200% 0, 0 0; }
  60%  { background-position: -100% 0, 0 0; }
  100% { background-position: -100% 0, 0 0; }
}

/* 新建按钮里的加号图标 */
.btn-add-icon { width: 20px; height: 20px; }

/* ===== 列宽（严格对齐 Figma） ===== */
.col-status  { width: 125px; }
.col-code    { width: 194px; }
.col-name    { flex: 1; min-width: 140px; }
.col-desc    { flex: 1.5; min-width: 200px; }
.col-cross   { width: 133px; }
.col-creator { width: 116px; }
.col-time    { width: 178px; }
.col-actions { width: 237px; white-space: nowrap; }

/* 描述列省略号 */
.cell-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 100%;
}

/* ===== 协同方式 tag（Figma 特有 2 状态，含业务名词"协同"放页面内） ===== */
.tag-cross {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs, 2px) var(--spacing-sm, 6px);
  border-radius: var(--radius-sm, 4px);
  font-size: var(--font-xs, 12px);
  font-weight: 400;
  white-space: nowrap;
  font-family: 'AlibabaPuHuiTi', sans-serif;
}
.tag-cross.is-warning { background: var(--warning-bg); color: var(--warning); }
.tag-cross.is-normal  { background: var(--normal-bg);  color: var(--normal); }

/* ===== 操作列 ===== */
.row-switch { margin-left: 0; }
.action-cell { gap: 8px; }

/* ===== 空 ===== */
.grid-empty {
  padding: 48px 0;
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-small, 14px);
}

/* ===== 分页（el-pagination 全局覆盖） ===== */
:deep(.el-pagination .el-pager li) {
  background-color: var(--pagi-bg);
  color: var(--pagi-text);
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: var(--pagi-bg) !important;
  color: var(--pagi-text) !important;
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .btn-prev.is-disabled),
:deep(.el-pagination .btn-next.is-disabled) {
  color: var(--text-muted) !important;
  background-color: var(--pagi-bg) !important;
}
:deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: var(--bg-card) !important;
  color: var(--text-secondary);
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-select .el-select__placeholder) { color: var(--text-secondary); }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: var(--text-primary) !important;
  background-color: var(--bg-card);
}

/* ===== 响应式 ===== */
@media (max-width: 1500px) { .col-creator { display: none; } }
@media (max-width: 1300px) { .col-code { display: none; } }
@media (max-width: 1100px) { .col-time { display: none; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .filter-left { flex-wrap: wrap; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
  .help-card { flex-direction: column; }
  .help-illustration { width: 100%; height: 156px; }
}
</style>
