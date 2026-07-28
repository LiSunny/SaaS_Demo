<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="大屏名称" @keyup.enter="store.search()" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; store.search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>

          <div class="view-toggle">
            <button
              :class="['view-toggle-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
              title="列表视图"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button
              :class="['view-toggle-btn', { active: viewMode === 'card' }]"
              @click="viewMode = 'card'"
              title="卡片视图"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </button>
          </div>
        </div>

        <div class="filter-right">
          <button class="btn-outline-primary" @click="openCreate">
            <AppIcon name="plus" class="btn-add-icon" />新增大屏
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div v-if="viewMode === 'list'" class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-thumb"><span>缩略图</span></th>
              <th class="fi-th col-name"><span>大屏名称</span></th>
              <th class="fi-th col-type"><span>类型</span></th>
              <th class="fi-th col-scenario"><span>应用场景</span></th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-count"><span>关联企业</span></th>
              <th class="fi-th col-date"><span>创建时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-thumb">
                <div class="thumb-cell">
                  <img v-if="row.thumbnail" :src="row.thumbnail" class="thumb-img" alt="" />
                  <AppIcon v-else name="bigscreen" class="thumb-placeholder-icon" />
                </div>
              </td>
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-type">
                <StatusTag :status="typeStatus(row.type)" :label="typeLabel(row.type)" />
              </td>
              <td class="fi-td col-scenario">{{ row.scenario || '—' }}</td>
              <td class="fi-td col-status">
                <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="toggleStatus(row)" />
              </td>
              <td class="fi-td col-count">
                <button class="btn-link" @click="openEnterprises(row)">{{ row.enterpriseCount }} 家</button>
              </td>
              <td class="fi-td col-date">{{ row.createdAt.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-edit" title="编辑" @click="openEdit(row)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 卡片视图 ===== -->
      <div v-else class="card-grid" v-loading="store.loading">
        <div v-for="row in store.list" :key="row.id" class="bigscreen-card">
          <div class="card-thumb">
            <img v-if="row.thumbnail" :src="row.thumbnail" alt="" />
            <AppIcon v-else name="bigscreen" class="thumb-placeholder" />
          </div>
          <div class="card-body">
            <h4 class="card-name">{{ row.name }}</h4>
            <div class="card-meta">
              <StatusTag :status="typeStatus(row.type)" :label="typeLabel(row.type)" />
              <span class="card-scenario">{{ row.scenario || '未设置场景' }}</span>
            </div>
            <div class="card-footer">
              <button class="btn-link" @click="openEnterprises(row)">{{ row.enterpriseCount }} 家关联企业</button>
              <el-switch v-model="row.status" :active-value="1" :inactive-value="0" size="small" @change="toggleStatus(row)" />
            </div>
          </div>
          <div class="card-actions">
            <button class="act-btn act-edit" title="编辑" @click="openEdit(row)">
              <AppIcon name="edit" class="act-icon" />
            </button>
            <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
              <AppIcon name="delete" class="act-icon" />
            </button>
          </div>
        </div>
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

    <!-- ===== 新增/编辑抽屉 ===== -->
    <el-drawer v-model="showFormDrawer" size="480px" destroy-on-close @closed="handleFormClosed">
      <template #header>
        <div class="drawer-custom-header">
          <h3 class="drawer-custom-title">{{ formMode === 'create' ? '新增大屏' : '编辑大屏' }}</h3>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px" class="drawer-form">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="大屏名称" maxlength="50" show-word-limit clearable />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width:100%" placeholder="选择大屏类型">
            <el-option v-for="(label, val) in BIGSCREEN_TYPE_LABELS" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用场景">
          <el-select v-model="form.scenario" style="width:100%" filterable allow-create clearable placeholder="选择或输入场景">
            <el-option v-for="s in scenarioOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple filterable allow-create style="width:100%" placeholder="输入标签后回车" collapse-tags collapse-tags-tooltip>
          </el-select>
        </el-form-item>
        <el-form-item label="缩略图">
          <OssUpload v-model="form.thumbnail" folder="bigscreen-thumb" placeholder="上传缩略图" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="大屏描述（选填）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <button class="btn-default" @click="showFormDrawer = false">取消</button>
        <button class="btn-primary" :disabled="saving" @click="submitForm">{{ saving ? '保存中...' : '保存' }}</button>
      </template>
    </el-drawer>

    <!-- ===== 关联企业抽屉 ===== -->
    <el-drawer v-model="showEnterprisesDrawer" :title="enterpriseDrawerTitle" size="520px" destroy-on-close>
      <template v-if="store.enterprisesLoading">
        <el-skeleton :rows="4" animated />
      </template>
      <div v-else>
        <table v-if="store.enterprises.length > 0" class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th drawer-col-name"><span>企业名称</span></th>
              <th class="fi-th drawer-col-default"><span>默认大屏</span></th>
              <th class="fi-th drawer-col-date"><span>关联时间</span></th>
              <th class="fi-th drawer-col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in store.enterprises" :key="e.enterpriseId" class="fi-tbody-tr">
              <td class="fi-td drawer-col-name">{{ e.enterpriseName }}</td>
              <td class="fi-td drawer-col-default">
                <StatusTag v-if="e.isDefault" status="success" label="默认" />
                <span v-else class="text-muted">—</span>
              </td>
              <td class="fi-td drawer-col-date">{{ e.createdAt?.slice(0, 10) }}</td>
              <td class="fi-td drawer-col-actions">
                <div class="action-cell">
                  <button v-if="!e.isDefault" class="act-btn act-edit" title="设为默认" @click="handleSetDefault(e)">
                    <AppIcon name="check" class="act-icon" />
                  </button>
                  <button v-else class="act-btn" title="取消默认" @click="handleUnsetDefault(e)">
                    <AppIcon name="close" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="移除关联" @click="handleRemoveEnterprise(e)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="store.enterprises.length === 0" class="empty-cell">该大屏尚未关联任何企业</div>
      </div>

      <el-divider style="margin:var(--spacing-xxl) 0" />
      <h4 class="drawer-section-title">添加关联</h4>
      <el-form ref="addEnterpriseFormRef" :model="addEnterpriseForm" :rules="addEnterpriseRules" label-width="90px">
        <el-form-item label="选择企业" prop="enterpriseId">
          <el-select
            v-model="addEnterpriseForm.enterpriseId"
            filterable remote reserve-keyword
            placeholder="搜索企业名称"
            :remote-method="searchEnterprises"
            :loading="enterpriseSearching"
            style="width:100%"
            clearable
          >
            <el-option v-for="e in enterpriseSearchOptions" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认大屏">
          <el-switch v-model="addEnterpriseForm.isDefault" size="small" />
          <span class="switch-hint">设为该企业的默认大屏</span>
        </el-form-item>
        <div class="form-actions">
          <button class="btn-primary" :disabled="addingEnterprise" @click="submitAddEnterprise">{{ addingEnterprise ? '保存中...' : '保存' }}</button>
          <button class="btn-default" @click="resetAddEnterpriseForm">取消</button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useBigscreenStore } from '@/stores/bigscreen'
import { BIGSCREEN_TYPE_LABELS, BIGSCREEN_SCENARIO_OPTIONS } from '@/types/bigscreen'
import type { BigscreenItem, BigscreenEnterpriseItem, BigscreenForm } from '@/types/bigscreen'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import OssUpload from '@/components/business/OssUpload.vue'
import request from '@/utils/request'

const store = useBigscreenStore()
const query = store.query
const viewMode = ref<'list' | 'card'>('card')

// ===== 类型展示 =====
const scenarioOptions = BIGSCREEN_SCENARIO_OPTIONS

function typeLabel(type: string) {
  return BIGSCREEN_TYPE_LABELS[type as keyof typeof BIGSCREEN_TYPE_LABELS] || type
}
function typeStatus(type: string): string {
  if (type === 'landing') return 'info'
  return 'success'
}

// ===== 新增/编辑 =====
const showFormDrawer = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const defaultForm: BigscreenForm = {
  name: '', type: 'landing', scenario: '', thumbnail: '', description: '', tags: [], status: 1, sortOrder: 0,
}
const form = reactive<BigscreenForm>({ ...defaultForm })
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入大屏名称', trigger: 'blur' },
    { max: 50, message: '不超过 50 字', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

function openCreate() {
  formMode.value = 'create'; editingId.value = null
  Object.assign(form, defaultForm)
  showFormDrawer.value = true
}
function openEdit(row: BigscreenItem) {
  formMode.value = 'edit'; editingId.value = row.id
  Object.assign(form, {
    name: row.name, type: row.type, scenario: row.scenario,
    thumbnail: row.thumbnail, description: row.description,
    tags: [...row.tags], status: row.status, sortOrder: row.sortOrder,
  })
  showFormDrawer.value = true
}
function handleFormClosed() { formRef.value?.resetFields() }

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (formMode.value === 'create') await store.handleCreate({ ...form })
    else if (editingId.value) await store.handleUpdate(editingId.value, { ...form })
    showFormDrawer.value = false
    store.fetchList()
  } finally { saving.value = false }
}

// ===== 状态切换 =====
async function toggleStatus(row: BigscreenItem) {
  await store.handleUpdate(row.id, { status: row.status })
  ElMessage.success(`已${row.status === 1 ? '启用' : '停用'}`)
}

// ===== 删除 =====
async function handleDelete(row: BigscreenItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除大屏 "${row.name}" 吗？关联企业也会被清除。`,
      '删除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch { return }
  const ok = await store.handleDelete(row.id)
  if (ok) store.fetchList()
}

// ===== 关联企业 =====
const showEnterprisesDrawer = ref(false)
const enterpriseTarget = ref<BigscreenItem | null>(null)
const enterpriseDrawerTitle = computed(() => `关联企业 — "${enterpriseTarget.value?.name}"`)
const addingEnterprise = ref(false)
const addEnterpriseFormRef = ref<FormInstance>()
const addEnterpriseForm = reactive({ enterpriseId: null as number | null, isDefault: false })
const addEnterpriseRules: FormRules = {
  enterpriseId: [{ required: true, message: '请选择企业', trigger: 'change' }],
 }
const enterpriseSearchOptions = ref<{ id: number; name: string }[]>([])
const enterpriseSearching = ref(false)

async function searchEnterprises(keyword: string) {
  if (!keyword) { enterpriseSearchOptions.value = []; return }
  enterpriseSearching.value = true
  try {
    const res = await request.get('/enterprise/search', { params: { keyword } })
    const data = (res as any).data || res
    const list = Array.isArray(data) ? data : (data?.data || [])
    enterpriseSearchOptions.value = list.map((e: any) => ({ id: Number(e.id), name: e.name }))
  } catch { enterpriseSearchOptions.value = [] }
  finally { enterpriseSearching.value = false }
}

function openEnterprises(row: BigscreenItem) {
  enterpriseTarget.value = row
  store.fetchEnterprises(row.id)
  showEnterprisesDrawer.value = true
}

async function submitAddEnterprise() {
  const valid = await addEnterpriseFormRef.value?.validate().catch(() => false)
  if (!valid || !addEnterpriseForm.enterpriseId || !enterpriseTarget.value) return
  addingEnterprise.value = true
  try {
    await store.handleAddEnterprise(enterpriseTarget.value.id, {
      enterpriseId: addEnterpriseForm.enterpriseId,
      isDefault: addEnterpriseForm.isDefault,
    })
    await store.fetchEnterprises(enterpriseTarget.value.id)
    store.fetchList()
    resetAddEnterpriseForm()
  } finally { addingEnterprise.value = false }
}

function resetAddEnterpriseForm() {
  addEnterpriseForm.enterpriseId = null; addEnterpriseForm.isDefault = false
  addEnterpriseFormRef.value?.resetFields()
}

async function handleSetDefault(e: BigscreenEnterpriseItem) {
  if (!enterpriseTarget.value) return
  await store.handleUpdateEnterprise(enterpriseTarget.value.id, e.enterpriseId, { isDefault: true })
  await store.fetchEnterprises(enterpriseTarget.value.id)
}
async function handleUnsetDefault(e: BigscreenEnterpriseItem) {
  if (!enterpriseTarget.value) return
  await store.handleUpdateEnterprise(enterpriseTarget.value.id, e.enterpriseId, { isDefault: false })
  await store.fetchEnterprises(enterpriseTarget.value.id)
}
async function handleRemoveEnterprise(e: BigscreenEnterpriseItem) {
  if (!enterpriseTarget.value) return
  try {
    await ElMessageBox.confirm(
      `确定要移除企业 "${e.enterpriseName}" 的关联吗？`,
      '移除确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
  } catch { return }
  await store.handleRemoveEnterprise(enterpriseTarget.value.id, e.enterpriseId)
  await store.fetchEnterprises(enterpriseTarget.value.id)
  store.fetchList()
}

onMounted(async () => { await store.fetchList() })
</script>

<style scoped>
/* ===== 列表页布局（与 EnterpriseList.vue 同模式） ===== */
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

/* ===== 新增大屏按钮 ===== */
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
.col-thumb { width: 72px; }
.col-name { min-width: 160px; }
.col-type { width: 110px; }
.col-scenario { min-width: 100px; }
.col-status { width: 80px; }
.col-count { width: 90px; }
.col-date { min-width: 110px; }
.col-actions { width: 80px; min-width: 80px; white-space: nowrap; }

/* ===== 操作按钮颜色变体 ===== */
.act-delete { color: var(--danger, #DC2626); }

/* ===== 缩略图 ===== */
.thumb-cell {
  width: 48px; height: 27px; border-radius: var(--radius-sm, 6px); overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.thumb-img { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder-icon { width: 20px; height: 20px; color: var(--text-tertiary); }

/* ===== 抽屉 ===== */
.drawer-custom-header { display: flex; align-items: center; height: 100%; }
.drawer-custom-title { margin: 0; font-size: var(--font-h4, 16px); font-weight: 600; color: var(--text-primary); }
.drawer-form { padding-right: var(--spacing-xl, 16px); }
.drawer-section-title {
  font-size: var(--font-h4, 16px); font-weight: 600;
  margin: 0 0 var(--spacing-md, 8px) 0; color: var(--text-primary);
}

.switch-hint { margin-left: var(--spacing-md, 8px); color: var(--text-secondary); font-size: var(--font-xs, 12px); }
.text-muted { color: var(--text-tertiary); }

/* ===== 关联企业抽屉表格列 ===== */
.drawer-col-name { text-align: left; }
.drawer-col-default { width: 90px; }
.drawer-col-date { width: 110px; }
.drawer-col-actions { width: 100px; }

/* ===== 分页器（必须全部覆盖，各页面保持一致） ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }

/* ===== 视图切换按钮 ===== */
.view-toggle {
  display: flex;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.view-toggle-btn.active {
  background: var(--accent-primary);
  color: #fff;
}

/* ===== 卡片网格 ===== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg, 16px);
  padding: 4px 0;
  flex: 1;
  overflow-y: auto;
}

/* ===== 单个卡片 ===== */
.bigscreen-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  overflow: hidden;
  transition: box-shadow 0.2s;
  position: relative;
  height: fit-content;
}
.bigscreen-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--bg-main);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-thumb .thumb-placeholder {
  width: 40px;
  height: 40px;
  color: var(--text-tertiary);
}

.card-body {
  padding: var(--spacing-md, 12px);
}

.card-name {
  margin: 0 0 8px;
  font-size: var(--font-medium, 15px);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  min-width: 0;
  overflow: hidden;
}

.card-meta > * {
  flex-shrink: 0;
}

.card-scenario {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  font-size: var(--font-xs, 12px);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-footer .btn-link {
  padding: 0;
  font-size: var(--font-xs, 12px);
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.bigscreen-card:hover .card-actions {
  opacity: 1;
}
.card-actions .act-btn {
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-sm, 4px);
  width: 28px;
  height: 28px;
}

/* ===== 响应式 ===== */
@media (max-width: 1250px) { .col-scenario { display: none !important; } }
@media (max-width: 1050px) { .col-date { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}
</style>
