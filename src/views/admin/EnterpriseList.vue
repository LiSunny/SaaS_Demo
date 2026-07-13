<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 引导说明卡片 ===== -->
      <div v-if="showHelp" class="help-card">
        <div class="help-illustration">
          <img :src="zhuhuImg" alt="租户管理说明" class="help-img" />
        </div>
        <div class="help-content">
          <div class="help-section">
            <h3 class="help-title">什么是租户？</h3>
            <p class="help-text">租户是指使用平台服务、拥有独立数据与权限的企业 / 组织，租户管理是平台对其生命周期、资源与权限进行统一管控的核心能力。</p>
          </div>
          <div class="help-section">
            <h3 class="help-subtitle">如何使用租户管理？</h3>
            <ul class="help-list">
              <li><strong>新增租户：</strong>平台管理员填写企业信息、配置基础资源，为企业开通独立服务实例。</li>
              <li><strong>租户授权：</strong>平台为租户分配功能与数据权限，租户可向下精细化授权子租户 / 成员。</li>
              <li><strong>租户关系管理：</strong>维护租户层级，支持上下级调整归属、变更状态。</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="企业名称" @keyup.enter="store.search()" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; store.search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>
        </div>

        <div class="filter-right">
          <label class="toggle-label">
            <el-switch v-model="showDeleted" size="small" @change="onToggleDeleted" />
            <span class="toggle-text">显示已删除</span>
          </label>
          <button class="btn-outline-primary" @click="openCreateDrawer">
            <AppIcon name="plus" class="btn-add-icon" />新增租户
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th fi-th-sort col-status" @click="toggleStatusSort">
                <span>状态</span>
                <TableSortIcon :direction="statusSortDir" />
                <TableFilterPopover v-model="statusFilter" :options="statusFilterOptions" />
              </th>
              <th class="fi-th col-name"><span>企业名称</span></th>
              <th class="fi-th col-cat"><span>行业分类</span></th>
              <th class="fi-th col-fire"><span>消防类别</span></th>
              <th class="fi-th col-admin"><span>管理员</span></th>
              <th class="fi-th col-phone"><span>账号</span></th>
              <th class="fi-th fi-th-sort col-date" @click="toggleDateSort"><span>创建日期</span><TableSortIcon :direction="dateSortDir" /></th>
              <th class="fi-th col-creator"><span>创建人</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-status">
                <StatusTag :status="entStatusKey(row)" :label="statusLabel(row)" />
              </td>
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-cat">{{ dimCFullLabel(row.dimC) }}</td>
              <td class="fi-td col-fire">{{ dimBLabel(row.dimB) }}</td>
              <td class="fi-td col-admin">{{ row.contactName }}</td>
              <td class="fi-td col-phone">{{ row.contactPhone }}</td>
              <td class="fi-td col-date">{{ row.createdAt.slice(0, 10) }}</td>
              <td class="fi-td col-creator">{{ row.creatorName || '—' }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="查看详情" @click="$router.push(`/admin/enterpriseManagement/detail?id=${row.id}`)">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{ Math.ceil(store.total / store.query.size) || 1 }} 页</span>
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

    <!-- ===== 新增/编辑租户 Drawer ===== -->
    <EnterpriseFormDrawer
      v-model:visible="drawerVisible"
      :mode="drawerMode"
      :edit-id="drawerEditId"
      @saved="onDrawerSaved"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useEnterpriseStore } from '@/stores/enterprise'
import type { EnterpriseItem, DimC } from '@/types/enterprise'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'
import TableFilterPopover from '@/components/base/TableFilterPopover.vue'
import EnterpriseFormDrawer from '@/components/business/EnterpriseFormDrawer.vue'
import zhuhuImg from '@/assets/zhuhu.png'

const store = useEnterpriseStore()
const query = store.query

// ===== 新增/编辑 Drawer =====
const drawerVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')
const drawerEditId = ref('')

function openCreateDrawer() {
  drawerMode.value = 'create'
  drawerEditId.value = ''
  drawerVisible.value = true
}

function onDrawerSaved() {
  store.fetchList()
}

// ===== 引导说明 =====
const showHelp = ref(true)

// ===== 已删除筛选 =====
const showDeleted = ref(false)
function onToggleDeleted() {
  query.includeDeleted = showDeleted.value ? true : undefined
  store.search()
}

// ===== 排序 =====
const statusSortDir = ref<'none' | 'asc' | 'desc'>('none')
const dateSortDir = ref<'none' | 'asc' | 'desc'>('desc')
function applyDateSort() {
  store.list.sort((a, b) => dateSortDir.value === 'asc'
    ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
function toggleStatusSort() {
  if (statusSortDir.value === 'none') statusSortDir.value = 'desc'
  else if (statusSortDir.value === 'desc') statusSortDir.value = 'asc'
  else statusSortDir.value = 'none'
  dateSortDir.value = 'none'
  if (statusSortDir.value === 'none') {
    store.fetchList()
  } else {
    store.list.sort((a, b) => statusSortDir.value === 'asc' ? a.status - b.status : b.status - a.status)
  }
}
function toggleDateSort() {
  if (dateSortDir.value === 'none') dateSortDir.value = 'desc'
  else if (dateSortDir.value === 'desc') dateSortDir.value = 'asc'
  else dateSortDir.value = 'none'
  statusSortDir.value = 'none'
  if (dateSortDir.value === 'none') {
    store.fetchList()
  } else {
    applyDateSort()
  }
}

// ===== 筛选 =====
const statusFilter = ref<string[]>([])
const statusFilterOptions = [
  { label: '有效', value: 'active' },
  { label: '已锁定', value: 'locked' },
  { label: '已过期', value: 'expired' },
]

watch(statusFilter, (val) => {
  query.status = val.length > 0 ? val.join(',') : undefined
  store.search()
})

// ===== 维度 B 字典 =====
const DIM_B_MAP: Record<string, string> = {
  '01': '商场市场', '02': '宾馆饭店', '03': '公共娱乐场所', '04': '餐饮场所',
  '05': '医院', '06': '学校', '07': '养老福利机构', '08': '体育场馆',
  '09': '交通枢纽', '10': '劳动密集型企业', '11': '易燃易爆场所', '12': '高层公共建筑',
  '13': '地下建筑', '14': '大型商业综合体', '15': '文物古建筑', '16': '仓储物流',
  '17': '金融机构', '18': '通信枢纽', '19': '广播电视', '20': '发电厂/变电站',
  '21': '博物馆/展览馆', '22': '图书馆/档案馆', '23': '科研机构', '24': '旅游景区',
  '25': '宗教活动场所', '26': '住宅小区', '27': '党政机关', '28': '其他重点单位',
}
function dimBLabel(code: string): string {
  return DIM_B_MAP[code] || code || '—'
}

function dimCFullLabel(dimC?: DimC | null): string {
  if (!dimC?.code) return '—'
  const parts = [dimC.sectionName, dimC.name].filter(Boolean)
  return parts.join(' > ') || '—'
}

// ===== 企业状态键映射 =====
function entStatusKey(row: EnterpriseItem): string {
  if (row.deletedAt) return 'ent_deleted'
  if (row.status === 1) return 'ent_active'
  if (row.status === 0) return 'ent_locked'
  return 'ent_expired'
}

function statusLabel(row: EnterpriseItem): string {
  if (row.deletedAt) return '已删除'
  if (row.status === 1) return '有效'
  if (row.status === 0) return '已锁定'
  return '已过期'
}

onMounted(async () => { await store.fetchList(); applyDateSort() })
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: hidden;
}

/* 固定表头 —— 仅 table-wrap 内滚动，thead 吸附在顶部 */
.fi-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* ===== 引导说明卡片 ===== */
.help-card {
  background: var(--bg-sub-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px); padding: var(--spacing-lg, 12px);
  display: flex; gap: 10px; align-items: center; flex-shrink: 0;
}
.help-illustration {
  width: 242px; height: 156px; border-radius: 8px; flex-shrink: 0; overflow: hidden;
}
.help-illustration img { display: block; width: 100%; height: 100%; object-fit: cover; }
.help-content {
  display: flex; flex-direction: column; gap: 10px;
  padding: 0 var(--spacing-lg, 12px); flex: 1; min-width: 0;
}
.help-section { display: flex; flex-direction: column; gap: 6px; }
.help-title { font-size:  var(--font-h4, 16px); font-weight: 600; color: var(--text-primary); margin: 0; }
.help-subtitle { font-size:  var(--font-body, 16px); font-weight: 500; color: var(--text-primary); margin: 0; }
.help-text { font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.6; margin: 0; }
.help-list { margin: 0; padding-left: 20px; font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.8; }
.help-list li { margin-bottom: 0; }
.help-list li strong { color: var(--text-primary); }

.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

/* ===== 列宽 ===== */
.col-status { width: 90px; }
.col-name { min-width: 140px; }
.col-cat { min-width: 120px; }
.col-fire { min-width: 140px; }
.col-admin { min-width: 80px; }
.col-phone { min-width: 130px; }
.col-date { min-width: 110px; }
.col-creator { min-width: 80px; }
.col-actions { width: 70px; min-width: 70px; white-space: nowrap; }

/* ===== 操作按钮颜色变体 ===== */
.act-delete { color: var(--danger, #DC2626); }
.act-recover { color: var(--success, #059669); }

/* ===== 已删除切换 ===== */
.toggle-label {
  display: inline-flex; align-items: center; gap: 6px;
  cursor: pointer; user-select: none; white-space: nowrap;
}
.toggle-text {
  font-size: var(--font-small, 14px); color: var(--text-secondary);
}

/* ===== 响应式 ===== */
@media (max-width: 1550px) { .col-cat { display: none !important; } }
@media (max-width: 1250px) { .col-phone, .col-creator { display: none !important; } }
@media (max-width: 1050px) { .col-date, .col-fire { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
  .help-card { flex-direction: column; }
  .help-illustration { width: 100%; }
}

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }
</style>
