<template>
  <div class="partner-tab">
    <!-- ===== 筛选栏 ===== -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="search-input-wrap">
          <input
            v-model="query.keyword"
            class="fi-input"
            placeholder="企业名称"
            @keyup.enter="handleSearch"
          />
          <button v-if="query.keyword" class="fi-clear" @click="query.keyword='';handleSearch()">
            <AppIcon name="clear" />
          </button>
          <AppIcon name="search" class="fi-icon" />
        </div>

        <div class="fi-select-wrap">
          <el-select
            v-model="query.role"
            placeholder="关系角色"
            clearable
            class="fi-select"
            :teleported="false"
            popper-class="fi-popper"
          >
            <el-option
              v-for="r in roleOptions"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </div>

        <button class="btn-primary" @click="handleSearch">查询</button>
      </div>

      <div class="filter-right">
        <button class="btn-outline-primary" @click="openBindDialog()">
          <AppIcon name="plus" class="btn-icon" />
          关联相关方
        </button>
        <button
          class="btn-outline-danger"
          :disabled="selectedIds.size === 0"
          @click="handleBatchRemove"
        >
          <AppIcon name="delete" class="btn-icon" />
          关系解除
        </button>
      </div>
    </div>

    <!-- ===== 数据表格 ===== -->
    <div class="table-wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th col-check">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>
            <th class="fi-th col-name"><span>企业名称</span></th>
            <th class="fi-th col-role"><span>关系角色</span></th>
            <th class="fi-th col-tags"><span>标签</span></th>
            <th class="fi-th col-contact"><span>负责人</span></th>
            <th class="fi-th col-phone"><span>联系方式</span></th>
            <th class="fi-th fi-th-sort col-date" @click="handleSortChange()">
              <span>关联日期</span>
              <AppIcon name="sort" class="th-sort-icon" />
            </th>
            <th class="fi-th col-operator"><span>操作人</span></th>
            <th class="fi-th col-actions"><span>操作</span></th>
          </tr>
        </thead>
        <tbody v-loading="loading">
          <tr
            v-for="row in list"
            :key="row.id"
            class="fi-tbody-tr"
          >
            <td class="fi-td col-check">
              <input
                type="checkbox"
                :checked="selectedIds.has(row.id)"
                @change="toggleSelect(row.id)"
              />
            </td>
            <td class="fi-td col-name">{{ row.enterpriseName }}</td>
            <td class="fi-td col-role">
              <StatusTag :status="row.role" :label="row.roleLabel" />
            </td>
            <td class="fi-td col-tags">
              <span v-if="row.tags.length">{{ row.tags.join('、') }}</span>
              <span v-else class="text-muted">--</span>
            </td>
            <td class="fi-td col-contact">{{ row.contactName || '--' }}</td>
            <td class="fi-td col-phone">{{ row.contactPhone || '--' }}</td>
            <td class="fi-td col-date">{{ row.relatedAt?.slice(0, 10) || '--' }}</td>
            <td class="fi-td col-operator">{{ row.operatorName || '--' }}</td>
            <td class="fi-td col-actions">
              <div class="action-cell">
                <button class="act-btn act-edit" title="编辑关联" @click="openBindDialog(row)">
                  <AppIcon name="edit" class="act-icon" />
                </button>
                <button class="act-btn act-lock" title="数据授权" @click="openAuthDialog(row)">
                  <AppIcon name="lock-on" class="act-icon" />
                </button>
                <button class="act-btn act-delete" title="关系解除" @click="handleRemoveSingle(row)">
                  <AppIcon name="delete" class="act-icon" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && list.length === 0">
            <td :colspan="9" class="fi-td empty-cell">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 分页 ===== -->
    <div class="pagination-wrap">
      <span class="pagi-total">
        共 {{ total }} 条记录 第 {{ query.page }}/{{ Math.ceil(total / query.size) || 1 }} 页
      </span>
      <el-pagination
        v-model:current-page="query.page"
        :total="total"
        :page-size="query.size"
        :pager-count="5"
        layout="prev, pager, next"
        background
        @current-change="fetch"
      />
    </div>

    <!-- ===== 关联弹窗 ===== -->
    <el-dialog
      v-model="bindVisible"
      title="关系绑定"
      width="600px"
      :close-on-click-modal="false"
      @closed="resetBindForm"
    >
      <div class="dialog-form">
        <div class="dialog-field">
          <label class="dialog-label required">企业名称</label>
          <el-select
            v-model="bindForm.enterpriseId"
            placeholder="输入企业名称模糊搜索"
            filterable
            remote
            :remote-method="searchEnterprises"
            :loading="searchLoading"
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
            clearable
          >
            <el-option
              v-for="e in searchResults"
              :key="e.id"
              :label="e.name"
              :value="e.id"
            />
          </el-select>
        </div>

        <div class="dialog-field">
          <label class="dialog-label required">
            关系角色
            <el-tooltip placement="right" :teleported="true" popper-class="role-tooltip" :show-after="200">
              <template #content>
                <div class="role-help">
                  <p class="role-help-title">定义企业在平台中的管理角色层级</p>
                  <div class="role-help-item">
                    <p class="role-help-name">我的监管方</p>
                    <p class="role-help-desc">消防救援机构/应急管理部门/属地政府（街道/社区等）/行业主管部门</p>
                  </div>
                  <div class="role-help-item">
                    <p class="role-help-name">我的管理方</p>
                    <p class="role-help-desc">空间管理方（物业/园区/市场/综合体/商业街等）</p>
                    <p class="role-help-desc">集团管理方</p>
                  </div>
                  <div class="role-help-item">
                    <p class="role-help-name">社会单位</p>
                    <p class="role-help-desc">落实消防安全主体责任企业</p>
                  </div>
                  <div class="role-help-item">
                    <p class="role-help-name">我的服务单位</p>
                    <p class="role-help-desc">消防技术服务机构（维保、检测、评估、工程安装等）</p>
                  </div>
                  <div class="role-help-item">
                    <p class="role-help-name">我的运营方</p>
                    <p class="role-help-desc">运营管理方</p>
                  </div>
                </div>
              </template>
              <AppIcon name="help-circle" class="help-icon" />
            </el-tooltip>
          </label>
          <el-cascader
            v-model="bindForm.rolePath"
            :options="roleOptions"
            :props="{ expandTrigger: 'hover', value: 'value', label: 'label', children: 'children', checkStrictly: false }"
            placeholder="请标注关联企业与我的关系角色"
            clearable
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
          />
        </div>

        <div class="dialog-field">
          <label class="dialog-label">企业标签</label>
          <el-select
            v-model="bindForm.tags"
            placeholder="现有标签"
            multiple
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
          >
            <el-option
              v-for="t in tagOptions"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <button class="btn-default" @click="bindVisible = false">取消</button>
        <button class="btn-primary" :disabled="bindSubmitting" @click="handleBindConfirm">
          {{ bindSubmitting ? '保存中...' : '保存' }}
        </button>
      </template>
    </el-dialog>

    <!-- ===== 数据授权弹窗 ===== -->
    <el-dialog
      v-model="authVisible"
      :title="`数据授权 — ${authTarget?.enterpriseName || ''}`"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="dialog-form">
        <div class="dialog-field">
          <label class="dialog-label">管理单元</label>
          <el-select
            v-model="authForm.authUnits"
            placeholder="选择可访问的管理单元"
            multiple
            class="dialog-select"
            :teleported="false"
            popper-class="fi-popper"
          >
            <el-option label="全部管理单元" value="all" />
          </el-select>
        </div>

        <div class="dialog-field">
          <label class="dialog-label">操作权限</label>
          <div class="switch-row">
            <el-switch v-model="authForm.allowOperation" />
            <span class="switch-text">{{ authForm.allowOperation ? '允许操作' : '不允许操作' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-default" @click="authVisible = false">取消</button>
        <button class="btn-primary" :disabled="authSubmitting" @click="handleAuthConfirm">
          {{ authSubmitting ? '保存中...' : '保存' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import {
  getPartners,
  addPartner,
  updatePartner,
  removePartners,
  savePartnerAuth,
  getPartnerAuth,
  searchEnterprises as searchEntReq,
  getRelationRoleDict,
  getTagDict,
} from '@/api/enterprise'
import type {
  PartnerItem,
  PartnerQuery,
} from '@/types/enterprise'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps<{
  enterpriseId: string
}>()

const { confirmRemove, confirmBatchRemove } = useConfirm()

// ===== 列表 =====
const query = reactive<PartnerQuery & { keyword: string; role: string }>({
  keyword: '',
  role: '',
  page: 1,
  size: 10,
  sortBy: 'relatedAt',
  sortOrder: 'desc',
})

const list = ref<PartnerItem[]>([])
const total = ref(0)
const loading = ref(false)

async function fetch() {
  loading.value = true
  try {
    const res = await getPartners(props.enterpriseId, query)
    list.value = res.data
    total.value = res.total
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetch()
}

function handleSortChange() {
  query.sortOrder = query.sortOrder === 'asc' ? 'desc' : 'asc'
  fetch()
}

// ===== 复选框 =====
const selectedIds = ref(new Set<string>())

const isAllSelected = computed(() =>
  list.value.length > 0 && list.value.every(r => selectedIds.value.has(r.id))
)
const isIndeterminate = computed(() =>
  list.value.some(r => selectedIds.value.has(r.id)) && !isAllSelected.value
)

function toggleSelectAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    list.value.forEach(r => selectedIds.value.add(r.id))
  } else {
    list.value.forEach(r => selectedIds.value.delete(r.id))
  }
  // trigger reactivity
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// ===== 关联弹窗 =====
const bindVisible = ref(false)
const bindSubmitting = ref(false)
const isBindEdit = ref(false)
const editingPartnerId = ref('')

interface BindForm {
  enterpriseId: string
  rolePath: string[]
  tags: string[]
}
const bindForm = reactive<BindForm>({
  enterpriseId: '',
  rolePath: [],
  tags: [],
})

const searchLoading = ref(false)
const searchResults = ref<{ id: string; name: string; tags: string[] }[]>([])

async function searchEnterprises(kw: string) {
  if (!kw || kw.length < 1) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  try {
    const res = await searchEntReq(props.enterpriseId, kw)
    searchResults.value = res
  } finally {
    searchLoading.value = false
  }
}

function openBindDialog(row?: PartnerItem) {
  if (row) {
    isBindEdit.value = true
    editingPartnerId.value = row.id
    bindForm.enterpriseId = row.enterpriseId
    bindForm.rolePath = (row.role || '').split('/').filter(Boolean)
    bindForm.tags = [...row.tags]
  } else {
    isBindEdit.value = false
    editingPartnerId.value = ''
    bindForm.enterpriseId = ''
    bindForm.rolePath = []
    bindForm.tags = []
  }
  bindVisible.value = true
}

function resetBindForm() {
  bindForm.enterpriseId = ''
  bindForm.rolePath = []
  bindForm.tags = []
  searchResults.value = []
  isBindEdit.value = false
  editingPartnerId.value = ''
}

async function handleBindConfirm() {
  if (!bindForm.enterpriseId) {
    ElMessage.warning('请选择企业')
    return
  }
  if (!bindForm.rolePath || bindForm.rolePath.length === 0) {
    ElMessage.warning('请选择关系角色')
    return
  }
  const role = bindForm.rolePath.join('/')
  bindSubmitting.value = true
  try {
    if (isBindEdit.value) {
      await updatePartner(props.enterpriseId, editingPartnerId.value, {
        role,
        tags: bindForm.tags,
      })
      ElMessage.success('关联已更新')
    } else {
      await addPartner(props.enterpriseId, {
        enterpriseId: bindForm.enterpriseId,
        role,
        tags: bindForm.tags,
      })
      ElMessage.success('关联成功')
    }
    bindVisible.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    bindSubmitting.value = false
  }
}

// ===== 删除 =====
async function handleRemoveSingle(row: PartnerItem) {
  try {
    await confirmRemove(row.enterpriseName)
    await removePartners(props.enterpriseId, [row.id])
    ElMessage.success('已解除关联')
    fetch()
  } catch { /* 取消 */ }
}

async function handleBatchRemove() {
  if (selectedIds.value.size === 0) {
    ElMessage.warning('请先选择相关方')
    return
  }
  const ids = [...selectedIds.value]
  const names = list.value
    .filter(r => ids.includes(r.id))
    .map(r => r.enterpriseName)
    .join('、')
  try {
    await confirmBatchRemove(names)
    await removePartners(props.enterpriseId, ids)
    ElMessage.success('已解除关联')
    selectedIds.value = new Set()
    fetch()
  } catch { /* 取消 */ }
}

// ===== 数据授权弹窗 =====
const authVisible = ref(false)
const authSubmitting = ref(false)
const authTarget = ref<PartnerItem | null>(null)

const authForm = reactive({
  authUnits: [] as string[],
  allowOperation: false,
})

async function openAuthDialog(row: PartnerItem) {
  authTarget.value = row
  try {
    const detail = await getPartnerAuth(row.id, props.enterpriseId)
    authForm.authUnits = detail.authUnits || []
    authForm.allowOperation = detail.allowOperation
  } catch {
    authForm.authUnits = []
    authForm.allowOperation = false
  }
  authVisible.value = true
}

async function handleAuthConfirm() {
  if (!authTarget.value) return
  authSubmitting.value = true
  try {
    await savePartnerAuth(authTarget.value.id, props.enterpriseId, {
      authUnits: authForm.authUnits,
      allowOperation: authForm.allowOperation,
    })
    ElMessage.success('数据授权已保存')
    authVisible.value = false
    fetch()
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    authSubmitting.value = false
  }
}

// ===== 字典 =====
const roleOptions = ref<any[]>([])
const tagOptions = ref<{ value: string; label: string }[]>([])

async function loadDicts() {
  try {
    const res = await getRelationRoleDict()
    roleOptions.value = res.data
  } catch (e: any) {
    console.error('加载关系角色字典失败', e)
  }
  try {
    const res = await getTagDict()
    tagOptions.value = res.data
  } catch (e: any) {
    console.error('加载标签字典失败', e)
  }
}

// ===== 初始加载 =====
onMounted(() => {
  loadDicts()
  fetch()
})

// 当 enterpriseId 变化时重新加载
watch(() => props.enterpriseId, () => {
  query.page = 1
  fetch()
})
</script>

<style scoped>
/* ========== Tab 容器 ========== */
.partner-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl, 16px);
  height: 100%;
}

/* ========== 轮廓按钮（在 EnterpriseDetail 中已定义，此处保持一致） ========== */
.btn-outline-primary,
.btn-outline-danger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: var(--btn-height);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, opacity 0.2s;
}

.btn-outline-primary {
  background: var(--accent-primary10);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.btn-outline-primary:hover {
  background: rgba(54, 120, 227, 0.15);
}

.btn-outline-danger {
  background: var(--semantic-danger-bg);
  color: var(--danger);
  border: 1px solid rgba(220, 38, 38, 0.2);
}
.btn-outline-danger:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.18);
}
.btn-outline-danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ========== 表格列宽 ========== */
.col-check { width: 50px; min-width: 50px; }
.col-name { min-width: 140px; }
.col-role { width: 200px; min-width: 140px; }
.col-tags { width: 123px; min-width: 100px; }
.col-contact { width: 125px; min-width: 80px; }
.col-phone { width: 148px; min-width: 120px; }
.col-date { width: 183px; min-width: 120px; cursor: pointer; }
.col-operator { width: 110px; min-width: 80px; }
.col-actions { width: 150px; min-width: 150px; white-space: nowrap; }

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 48px 0;
}

.text-muted {
  color: var(--text-muted);
}

/* ========== 弹窗表单 ========== */
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxl, 24px);
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 8px);
  align-items: stretch;
}

.dialog-label {
  font-size: var(--font-body);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.dialog-label.required::before {
  content: '*';
  color: var(--danger);
  font-weight: 500;
  font-size: var(--font-h3);
}

.dialog-select {
  width: 100%;
}

.help-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  cursor: help;
}

/* ========== 角色下拉选项 ========== */
.role-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.role-option-label {
  font-size: var(--font-small);
  font-weight: 500;
  color: var(--text-primary);
}
.role-option-desc {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}


/* ========== Switch 行 ========== */
.switch-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}
.switch-text {
  font-size: var(--font-small);
  color: var(--text-secondary);
}

/* ========== Data-lock 操作按钮 ========== */
.act-lock {
  color: var(--text-tertiary);
}
.act-lock:hover {
  color: var(--accent-primary);
}

/* ========== 响应式列隐藏 ========== */
@media (max-width: 1550px) {
  .resp-hide-1550 { display: none !important; }
}
@media (max-width: 1280px) {
  .col-tags { display: none !important; }
}
@media (max-width: 800px) {
  .filter-bar {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: stretch;
  }
  .pagination-wrap {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: flex-start;
  }
}
</style>

<style>
/* ========== 角色 tooltip 全局样式（Teleport，100% 对齐 Figma 4895-14121） ========== */
.role-tooltip {
  max-width: 440px !important;
  padding: 23px 16px 16px 16px !important;
  background: var(--bg-card) !important;
  border: none !important;
  border-radius: var(--radius-md, 8px) !important;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.25) !important;
}

.role-tooltip .el-popper__arrow {
  display: none !important;
}

.role-help {
  max-width: 389px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
}
.role-help-title {
  font-size: var(--font-small, 14px);
  font-weight: 400;
  color: var(--text-tertiary, #454545);
  line-height: 20px;
  margin: 0 0 4px 0;
}
.role-help-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 0;
}
.role-help-name {
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-secondary, #2E2E2E);
  line-height: normal;
}
.role-help-desc {
  font-size: var(--font-small, 14px);
  font-weight: 400;
  color: var(--text-tertiary, #454545);
  line-height: normal;
}
.role-help-desc + .role-help-desc {
  margin-top: 2px;
}
</style>
