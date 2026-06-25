<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 引导说明卡片（Figma 样式：左侧插图 + 右侧说明） ===== -->
      <div v-if="showHelp" class="help-card">
        <div class="help-illustration">
          <svg viewBox="0 0 242 156" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="242" height="156" rx="8" fill="var(--accent-primary10)"/>
            <circle cx="80" cy="78" r="40" fill="var(--accent-primary)" opacity="0.15"/>
            <circle cx="80" cy="78" r="28" fill="var(--accent-primary)" opacity="0.25"/>
            <rect x="60" y="60" width="40" height="36" rx="4" fill="var(--accent-primary)" opacity="0.5"/>
            <rect x="130" y="42" width="80" height="12" rx="6" fill="var(--accent-primary)" opacity="0.15"/>
            <rect x="130" y="62" width="96" height="8" rx="4" fill="var(--accent-primary)" opacity="0.12"/>
            <rect x="130" y="76" width="72" height="8" rx="4" fill="var(--accent-primary)" opacity="0.12"/>
            <rect x="130" y="96" width="80" height="8" rx="4" fill="var(--accent-primary)" opacity="0.1"/>
            <rect x="130" y="110" width="64" height="8" rx="4" fill="var(--accent-primary)" opacity="0.1"/>
          </svg>
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

          <div class="fi-select-wrap">
            <el-select v-model="query.dimALevel1" placeholder="管理角色" clearable class="fi-select" :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option label="监管方" value="supervisor" />
              <el-option label="管理方" value="manager" />
              <el-option label="社会单位" value="social_unit" />
              <el-option label="服务单位" value="service_unit" />
              <el-option label="平台运营方" value="platform_operator" />
            </el-select>
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>
        </div>

        <div class="filter-right">
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
              <th class="fi-th fi-th-sort col-status" @click="toggleSort">
                <span>状态</span>
                <svg class="th-sort-icon" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.25 6.75L9 3L12.75 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5.25 11.25L9 15L12.75 11.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </th>
              <th class="fi-th col-name"><span>企业名称</span></th>
              <th class="fi-th col-role"><span>管理角色</span></th>
              <th class="fi-th col-cat"><span>行业分类</span></th>
              <th class="fi-th col-admin"><span>管理员</span></th>
              <th class="fi-th col-phone"><span>账号</span></th>
              <th class="fi-th col-date"><span>创建日期</span></th>
              <th class="fi-th col-creator"><span>创建人</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-status">
                <StatusTag :status="entStatusKey(row.status)" :label="statusLabel(row.status)" />
              </td>
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-role dima-text">{{ dimALabel(row.dimA) }}</td>
              <td class="fi-td col-cat">{{ row.dimC.name || '—' }}</td>
              <td class="fi-td col-admin">{{ row.contactName }}</td>
              <td class="fi-td col-phone">{{ row.contactPhone }}</td>
              <td class="fi-td col-date">{{ row.createdAt.slice(0, 10) }}</td>
              <td class="fi-td col-creator">{{ row.creatorName || '—' }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="详情" @click="$router.push(`/admin/enterpriseManagement/detail?id=${row.id}`)">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                  <button v-if="row.status === 1" class="act-btn act-edit" title="编辑" @click="openEditDrawer(row.id)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button v-if="row.status === 1" class="act-btn" title="锁定" @click="handleLock(row)">
                    <AppIcon name="lock" class="act-icon" />
                  </button>
                  <button class="act-btn" title="个性化配置" @click="openBranding(row)">
                    <AppIcon name="setting" class="act-icon" />
                  </button>
                  <button class="act-btn" title="应用配置" @click="openAppConfig(row)">
                    <AppIcon name="operation" class="act-icon" />
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

    <!-- ===== 延期弹窗 ===== -->
    <el-dialog v-model="extendVisible" title="延期设置" width="400px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="有效期至">
          <el-date-picker v-model="extendDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-default" @click="extendVisible = false">取消</button>
        <button class="btn-primary" @click="confirmExtend">确定</button>
      </template>
    </el-dialog>

    <!-- ===== 个性化配置弹窗 ===== -->
    <el-dialog v-model="brandingVisible" title="个性化设置" width="500px" :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="域名"><el-input v-model="brandingForm.domain" placeholder="如 tenant.platform.com" /></el-form-item>
        <el-form-item label="版权公告"><el-input v-model="brandingForm.copyright" placeholder="如 © 2026 Company" /></el-form-item>
        <el-form-item label="ICP备案"><el-input v-model="brandingForm.icp" placeholder="如 京ICP备XXXXXXXX号" /></el-form-item>
        <el-form-item label="平台标题"><el-input v-model="brandingForm.title" placeholder="如 XX安全管理平台" /></el-form-item>
      </el-form>
      <template #footer>
        <button class="btn-default" @click="brandingVisible = false">取消</button>
        <button class="btn-primary" @click="brandingVisible = false">确认</button>
      </template>
    </el-dialog>

    <!-- ===== 应用配置弹窗 ===== -->
    <el-dialog v-model="appConfigVisible" title="应用设置" width="700px" :close-on-click-modal="false">
      <el-tabs v-model="appConfigTab">
        <el-tab-pane v-for="tab in moduleTabs" :key="tab.key" :label="tab.label" :name="tab.key">
          <el-tree :data="tab.children" show-checkbox node-key="key" default-expand-all :default-checked-keys="allModuleKeys" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <button class="btn-default" @click="appConfigVisible = false">取消</button>
        <button class="btn-primary" @click="appConfigVisible = false">确定</button>
      </template>
    </el-dialog>

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
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useEnterpriseStore } from '@/stores/enterprise'
import type { EnterpriseItem, DimA } from '@/types/enterprise'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import EnterpriseFormDrawer from '@/components/business/EnterpriseFormDrawer.vue'

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

function openEditDrawer(id: string) {
  drawerMode.value = 'edit'
  drawerEditId.value = id
  drawerVisible.value = true
}

function onDrawerSaved() {
  store.fetchList()
}

// ===== 引导说明 =====
const showHelp = ref(true)

// ===== 排序 =====
const sortAsc = ref(true)
function toggleSort() {
  sortAsc.value = !sortAsc.value
  store.list.sort((a, b) => sortAsc.value ? a.status - b.status : b.status - a.status)
}

// ===== 维度 A 标签（Figma 样式：监管方>消防救援机构） =====
const DIM_A_MAP: Record<string, string> = {
  supervisor: '监管方', manager: '管理方', social_unit: '社会单位', service_unit: '服务单位', platform_operator: '平台运营方',
}
const DIM_A_L2_MAP: Record<string, string> = {
  space_manager: '空间管理', group_manager: '集团管理',
}
const DIM_A_L3_MAP: Record<string, string> = {
  fire_rescue: '消防救援机构', emergency_mgmt: '应急管理部门', local_gov: '属地政府',
  industry_supervisor: '行业主管部门', property_mgr: '物业管理方', park_mgr: '园区管理方',
  market_mgr: '市场管理方', complex_mgr: '综合体管理方', commercial_street_mgr: '商业街管理方',
  fire_tech_service: '消防技术服务机构',
}
function dimALabel(dimA: DimA): string {
  const parts: string[] = [DIM_A_MAP[dimA.level1] || dimA.level1]
  if (dimA.level2) parts.push(DIM_A_L2_MAP[dimA.level2] || dimA.level2)
  if (dimA.level3) parts.push(DIM_A_L3_MAP[dimA.level3] || dimA.level3)
  return parts.join('>')
}

// ===== 企业状态键映射（StatusTag 通过专用 key 定位颜色） =====
function entStatusKey(s: number): string {
  if (s === 1) return 'ent_active'
  if (s === 0) return 'ent_locked'
  return 'ent_expired'
}

function statusLabel(s: number): string {
  if (s === 1) return '有效'
  if (s === 0) return '已锁定'
  return '已过期'
}

// ===== 锁定 =====
async function handleLock(row: EnterpriseItem) {
  const action = row.status === 1 ? '锁定' : '解锁'
  try {
    await ElMessageBox.confirm(`确认${action}「${row.name}」？`, '提示', { type: 'warning' })
    await store.handleLock(row.id)
  } catch { /* 取消 */ }
}

// ===== 延期 =====
const extendVisible = ref(false)
const extendDate = ref('')
const extendTarget = ref<EnterpriseItem | null>(null)

// ===== 个性化配置 =====
const brandingVisible = ref(false)
const brandingForm = reactive({ domain: '', copyright: '', icp: '', title: '' })
function openBranding(_row: EnterpriseItem) { brandingVisible.value = true }

// ===== 应用配置 =====
const appConfigVisible = ref(false)
const appConfigTab = ref('设备管理')
const allModuleKeys = ['device-ledger', 'maintenance', 'monitor']
const moduleTabs: { key: string; label: string; children: { key: string; label: string }[] }[] = [
  { key: '设备管理', label: '设备管理', children: [
    { key: 'device-ledger', label: '设备台账' }, { key: 'maintenance', label: '保养管理' }, { key: 'monitor', label: '运行监控' },
  ]},
  { key: 'IOT', label: 'IOT', children: [] },
  { key: '远程值守', label: '远程值守', children: [{ key: 'alarm-center', label: '告警中心' }] },
  { key: '巡查检查', label: '巡查检查', children: [] },
  { key: '维保应用', label: '维保应用', children: [] },
  { key: '数据可视化', label: '数据可视化', children: [] },
]
function openAppConfig(_row: EnterpriseItem) { appConfigVisible.value = true }

// ===== 延期确认 =====
async function confirmExtend() {
  if (!extendDate.value) { ElMessage.warning('请选择有效期'); return }
  if (extendTarget.value) await store.handleExtend(extendTarget.value.id, extendDate.value)
  extendVisible.value = false
}

onMounted(() => { store.fetchList() })
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: auto;
}

/* ===== 引导说明卡片（Figma 样式：左侧插图 + 右侧说明） ===== */
.help-card {
  background: var(--bg-sub-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px); padding: var(--spacing-lg, 12px);
  display: flex; gap: 10px; align-items: center; flex-shrink: 0;
}
.help-illustration {
  width: 242px; height: 156px; border-radius: 8px; flex-shrink: 0; overflow: hidden;
}
.help-illustration svg { display: block; width: 100%; height: 100%; }
.help-content {
  display: flex; flex-direction: column; gap: 10px;
  padding: 0 var(--spacing-lg, 12px); flex: 1; min-width: 0;
}
.help-section { display: flex; flex-direction: column; gap: 6px; }
.help-title { font-size: 18px; font-weight: 500; color: var(--text-primary); margin: 0; }
.help-subtitle { font-size: 18px; font-weight: 500; color: var(--text-primary); margin: 0; }
.help-text { font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.6; margin: 0; }
.help-list { margin: 0; padding-left: 20px; font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.8; }
.help-list li { margin-bottom: 0; }
.help-list li strong { color: var(--text-primary); }

/* ===== Outline Primary 按钮（Figma 样式：蓝色边框 + 浅蓝底 + 蓝色文字） ===== */
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
.col-role { min-width: 160px; }
.col-cat { min-width: 120px; }
.col-admin { min-width: 80px; }
.col-phone { min-width: 130px; }
.col-date { min-width: 110px; }
.col-creator { min-width: 80px; }
.col-actions { width: 160px; min-width: 150px; white-space: nowrap; }

/* 管理角色列文字样式 */
.dima-text { font-size: var(--font-small, 14px); }

/* ===== 响应式 ===== */
@media (max-width: 1550px) { .col-cat { display: none !important; } }
@media (max-width: 1250px) { .col-phone, .col-creator { display: none !important; } }
@media (max-width: 1050px) { .col-date { display: none !important; } }
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
