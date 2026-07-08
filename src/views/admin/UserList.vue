<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input
              v-model="store.query.keyword"
              class="fi-input"
              placeholder="手机号 / 姓名"
              @keyup.enter="store.search()"
            />
            <button v-if="store.query.keyword" class="fi-clear" @click="store.query.keyword = ''; store.search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <button class="btn-primary" @click="store.search()">查询</button>
        </div>

        <div class="filter-right">
          <button class="btn-outline-primary" @click="showCreateDialog = true">
            <AppIcon name="plus" class="btn-add-icon" />新增用户
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-phone"><span>手机号</span></th>
              <th class="fi-th col-name"><span>真实姓名</span></th>
              <th class="fi-th col-email"><span>邮箱</span></th>
              <th class="fi-th col-system-role"><span>系统角色</span></th>
              <th class="fi-th col-count"><span>关联企业</span></th>
              <th class="fi-th col-date"><span>创建时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-status">
                <StatusTag :status="userStatusKey(row.status)" :label="statusLabel(row.status)" />
              </td>
              <td class="fi-td col-phone">{{ row.phone }}</td>
              <td class="fi-td col-name">{{ row.realName }}</td>
              <td class="fi-td col-email">{{ row.email || '—' }}</td>
              <td class="fi-td col-system-role">
                <StatusTag :status="row.systemRole || 'platform-user'" />
              </td>
              <td class="fi-td col-count">
                <template v-if="row.systemRole">—</template>
                <button v-else class="btn-link" @click="openEnterprises(row)">{{ row.enterpriseCount }} 家</button>
              </td>
              <td class="fi-td col-date">{{ row.createdAt.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-edit" title="编辑" @click="openEditDialog(row)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button v-if="row.status === 1" class="act-btn" title="停用" @click="handleToggle(row)">
                    <AppIcon name="lock-on" class="act-icon" />
                  </button>
                  <button v-else class="act-btn" title="启用" @click="handleToggle(row)">
                    <AppIcon name="lock-off" class="act-icon" />
                  </button>
                  <button class="act-btn" title="重置密码" @click="handleResetPwd(row)">
                    <AppIcon name="refresh" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!store.loading && store.list.length === 0">
              <td colspan="8" class="fi-td empty-cell">暂无用户</td>
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
          :page-sizes="[10, 20, 50]"
          :total="store.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="store.fetchList()"
          @current-change="store.fetchList()"
        />
      </div>

      <!-- ===== 新增用户弹窗 ===== -->
      <el-dialog v-model="showCreateDialog" title="新增用户" width="480px" destroy-on-close @closed="createFormRef?.resetFields()">
        <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="createForm.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="createForm.realName" placeholder="请输入真实姓名" maxlength="20" />
          </el-form-item>
          <el-form-item label="初始密码" prop="password">
            <el-input v-model="createForm.password" type="password" show-password placeholder="至少6位" maxlength="20" />
          </el-form-item>
          <el-form-item v-if="isOpsAdmin" label="系统角色">
            <el-select v-model="createForm.systemRole" placeholder="普通用户" style="width:100%">
              <el-option label="普通用户" :value="null" />
              <el-option label="运营管理" value="platform-ops" />
              <el-option label="技术管理" value="platform-admin" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-default" @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" :disabled="creating" @click="submitCreate">{{ creating ? '保存中...' : '保存' }}</button>
        </template>
      </el-dialog>

      <!-- ===== 编辑用户弹窗 ===== -->
      <el-dialog v-model="showEditDialog" title="编辑用户" width="480px" destroy-on-close>
        <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
          <el-form-item label="手机号">
            <el-input :model-value="editForm.phone" disabled />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="editForm.realName" placeholder="请输入真实姓名" maxlength="20" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="editForm.email" placeholder="请输入邮箱（选填）" />
          </el-form-item>
          <el-form-item v-if="isOpsAdmin" label="系统角色">
            <el-select v-model="editForm.systemRole" placeholder="普通用户" style="width:100%">
              <el-option label="普通用户" :value="null" />
              <el-option label="运营管理" value="platform-ops" />
              <el-option label="技术管理" value="platform-admin" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-default" @click="showEditDialog = false">取消</button>
          <button class="btn-primary" :disabled="saving" @click="submitEdit">{{ saving ? '保存中...' : '保存' }}</button>
        </template>
      </el-dialog>

      <!-- ===== 关联企业抽屉 ===== -->
      <el-drawer v-model="showEnterprisesDrawer" title="关联企业" size="520px">
        <!-- 现有企业列表 -->
        <template v-if="store.enterprisesLoading">
          <el-skeleton :rows="4" animated />
        </template>
        <div v-else>
          <table v-if="store.enterprises.length > 0" class="fi-table">
            <thead>
              <tr class="fi-thead-tr">
                <th class="fi-th drawer-col-left"><span>企业名称</span></th>
                <th class="fi-th drawer-col-left"><span>岗位</span></th>
                <th class="fi-th drawer-col-center"><span>加入时间</span></th>
                <th class="fi-th drawer-col-narrow"><span>操作</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in store.enterprises" :key="e.enterpriseId" class="fi-tbody-tr">
                <td class="fi-td drawer-col-left">{{ e.enterpriseName }}</td>
                <td class="fi-td drawer-col-left">
                  <span class="position-tags">
                    <StatusTag v-for="p in e.positions" :key="p" status="in_progress" :label="positionMap[p] || p" />
                  </span>
                </td>
                <td class="fi-td drawer-col-center">{{ e.joinedAt?.slice(0, 10) }}</td>
                <td class="fi-td drawer-col-narrow">
                  <button class="act-btn act-delete" title="移除关联" @click="handleRemoveEnterprise(e)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="store.enterprises.length === 0" class="empty-cell">
            该用户尚未加入任何企业
          </div>
        </div>

        <!-- 添加关联区域 -->
        <el-divider style="margin:var(--spacing-xxl) 0" />
        <h4 class="drawer-section-title">添加关联</h4>
        <el-form ref="addEnterpriseFormRef" :model="addEnterpriseForm" :rules="addEnterpriseRules" label-width="80px" size="default">
          <el-form-item label="选择企业" prop="enterpriseId">
            <el-select
              v-model="addEnterpriseForm.enterpriseId"
              filterable
              remote
              reserve-keyword
              placeholder="搜索企业名称"
              :remote-method="searchEnterprises"
              :loading="enterpriseSearching"
              style="width:100%"
              clearable
              @change="onEnterpriseSelected"
            >
              <el-option
                v-for="e in enterpriseSearchOptions"
                :key="e.id"
                :label="e.name"
                :value="e.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分配岗位" prop="positions">
            <el-select
              v-model="addEnterpriseForm.positions"
              multiple
              placeholder="选择岗位"
              style="width:100%"
            >
              <el-option
                v-for="p in positionOptions"
                :key="p.key"
                :label="p.name"
                :value="p.key"
              />
            </el-select>
          </el-form-item>
          <div class="form-actions">
            <button class="btn-primary" :disabled="addingEnterprise" @click="submitAddEnterprise">{{ addingEnterprise ? '保存中...' : '保存' }}</button>
            <button class="btn-default" @click="resetAddEnterpriseForm">取消</button>
          </div>
        </el-form>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserAdminStore } from '@/stores/user-admin'
import { useUserStore } from '@/stores/user'
import type { UserItem } from '@/types/user-admin'
import { ALL_POSITIONS } from '@/config/positions'
import { getPositionList } from '@/api/position-admin'
import request from '@/utils/request'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const store = useUserAdminStore()
const userStore = useUserStore()
const { confirmDisable, confirmResetPwd } = useConfirm()

// 仅运营管理员可见系统角色选择
const isOpsAdmin = computed(() => userStore.systemRole === 'platform-ops')

// ===== 岗位名称映射 =====
const positionMap: Record<string, string> = {}
for (const p of ALL_POSITIONS) {
  positionMap[p.key] = p.name
  positionMap[`platform:${p.key}`] = p.name
}

// ===== 状态映射 =====
function userStatusKey(s: number): string {
  return s === 1 ? 'ent_active' : 'stopped'
}

function statusLabel(s: number): string {
  return s === 1 ? '启用' : '停用'
}

onMounted(() => store.fetchList())

// ===== 新增 =====
const showCreateDialog = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive<{ phone: string; realName: string; password: string; systemRole: string | null }>({ phone: '', realName: '', password: '', systemRole: null })
const createRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 位', trigger: 'blur' },
  ],
}

async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  creating.value = true
  try {
    await store.handleCreate({ ...createForm })
    showCreateDialog.value = false
    createForm.phone = ''
    createForm.realName = ''
    createForm.password = ''
    createForm.systemRole = null
  } catch { /* error handled by interceptor */ } finally { creating.value = false }
}

// ===== 编辑 =====
const showEditDialog = ref(false)
const saving = ref(false)
const editFormRef = ref<FormInstance>()
const editingId = ref(0)
const editForm = reactive<{ phone: string; realName: string; email: string; systemRole: string | null }>({ phone: '', realName: '', email: '', systemRole: null })
const editRules: FormRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
}

function openEditDialog(row: UserItem) {
  editingId.value = row.id
  editForm.phone = row.phone
  editForm.realName = row.realName
  editForm.email = row.email
  editForm.systemRole = row.systemRole
  showEditDialog.value = true
}

async function submitEdit() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await store.handleUpdate(editingId.value, { realName: editForm.realName, email: editForm.email, systemRole: editForm.systemRole })
    showEditDialog.value = false
  } catch { /* */ } finally { saving.value = false }
}

// ===== 停用/启用 =====
async function handleToggle(row: UserItem) {
  if (row.status === 1) {
    try {
      await confirmDisable('该用户')
    } catch { return }
  }
  await store.handleToggleStatus(row.id)
}

// ===== 重置密码 =====
async function handleResetPwd(row: UserItem) {
  try {
    await confirmResetPwd()
  } catch { return }
  const newPwd = await store.handleResetPassword(row.id)
  await ElMessageBox.alert(
    h('div', { class: 'reset-pwd-dialog' }, [
      h('p', null, `「${row.realName}」的密码已重置，新密码为：`),
      h('div', { class: 'reset-pwd-card' }, [
        h('span', { class: 'reset-pwd-value' }, newPwd),
        h('button', {
          class: 'reset-pwd-copy',
          onClick: () => {
            navigator.clipboard.writeText(newPwd)
            ElMessage.success('已复制到剪贴板')
          },
        }, '复制'),
      ]),
      h('p', { class: 'reset-pwd-hint' }, '请将新密码告知用户，首次登录后建议修改密码。'),
    ]),
    '密码重置成功',
    {
      confirmButtonText: '我知道了',
      type: 'success',
    },
  )
}

// ===== 删除用户 =====
async function handleDelete(row: UserItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.realName}」吗？删除后可在数据库中恢复。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch { return }
  await store.handleDelete(row.id)
}

// ===== 移除关联企业 =====
async function handleRemoveEnterprise(e: { enterpriseId: number; enterpriseName: string }) {
  try {
    await ElMessageBox.confirm(
      `确定移除「${e.enterpriseName}」的关联吗？`,
      '移除确认',
      { confirmButtonText: '确定移除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch { return }
  await store.handleRemoveEnterprise(currentViewUserId.value, e.enterpriseId)
}

// ===== 关联企业 =====
const showEnterprisesDrawer = ref(false)

async function openEnterprises(row: UserItem) {
  showEnterprisesDrawer.value = true
  // 记录当前查看的用户 ID，供添加关联使用
  currentViewUserId.value = row.id
  resetAddEnterpriseForm()
  await store.fetchEnterprises(row.id)
}

// ===== 添加关联企业 =====
const currentViewUserId = ref(0)
const addEnterpriseFormRef = ref<FormInstance>()
const addingEnterprise = ref(false)
const enterpriseSearching = ref(false)
const enterpriseSearchOptions = ref<{ id: number; name: string }[]>([])
const positionOptions = ref<{ key: string; name: string }[]>([])

const addEnterpriseForm = reactive<{ enterpriseId: number | null; positions: string[] }>({
  enterpriseId: null,
  positions: [],
})

const addEnterpriseRules: FormRules = {
  enterpriseId: [{ required: true, message: '请选择企业', trigger: 'change' }],
  positions: [{ required: true, message: '请至少选择一个岗位', trigger: 'change' }],
}

async function loadPositionOptions(enterpriseId?: number) {
  try {
    const r = await getPositionList({ page: 1, size: 100, enterpriseId })
    positionOptions.value = r.data.map((p: any) => ({ key: p.key, name: p.name }))
  } catch { /* ignore */ }
}

async function searchEnterprises(keyword: string) {
  if (!keyword) { enterpriseSearchOptions.value = []; return }
  enterpriseSearching.value = true
  try {
    const res: any = await request.get('/enterprise/search', { params: { keyword } })
    const list = res.data || res
    enterpriseSearchOptions.value = Array.isArray(list) ? list.map((e: any) => ({ id: e.id, name: e.name })) : []
  } catch { enterpriseSearchOptions.value = [] }
  finally { enterpriseSearching.value = false }
}

function onEnterpriseSelected(val: any) {
  // 切换企业时重新加载该企业可用的岗位（系统级 + 企业自定义）
  addEnterpriseForm.positions = []
  if (val) {
    loadPositionOptions(Number(val))
  } else {
    positionOptions.value = []
  }
}

function resetAddEnterpriseForm() {
  addEnterpriseForm.enterpriseId = null
  addEnterpriseForm.positions = []
  enterpriseSearchOptions.value = []
  addEnterpriseFormRef.value?.resetFields()
}

async function submitAddEnterprise() {
  const valid = await addEnterpriseFormRef.value?.validate().catch(() => false)
  if (!valid) return
  addingEnterprise.value = true
  try {
    await store.handleAddEnterprise(currentViewUserId.value, {
      enterpriseId: addEnterpriseForm.enterpriseId!,
      positions: [...addEnterpriseForm.positions],
    })
    resetAddEnterpriseForm()
  } catch { /* error handled by interceptor */ }
  finally { addingEnterprise.value = false }
}
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

.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-md);
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

/* ===== 列宽 ===== */
.col-status { width: 80px; }
.col-phone { min-width: 140px; }
.col-name { min-width: 120px; }
.col-email { min-width: 160px; }
.col-system-role { width: 100px; }
.col-count { width: 100px; }
.col-date { min-width: 120px; }
.col-actions { width: 120px; white-space: nowrap; }

.text-muted { color: var(--text-muted); }

/* ===== 空数据 ===== */
.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: var(--spacing-xxl) 0;
}

/* ===== 响应式 ===== */
@media (max-width: 1350px) { .col-system-role { display: none !important; } }
@media (max-width: 1250px) { .col-date { display: none !important; } }
@media (max-width: 1050px) { .col-email { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
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

<style>
/* 重置密码弹窗（ElMessageBox teleport 到 body，需全局样式） */
.reset-pwd-dialog p {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-small);
  color: var(--text-primary);
}
.reset-pwd-card {
  display: flex; align-items: center; gap: var(--spacing-lg);
  background: var(--bg-sub-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md); padding: var(--spacing-lg) var(--spacing-xl); margin-bottom: var(--spacing-lg);
}
.reset-pwd-value {
  font-size: var(--font-h1); font-weight: 700; font-family: monospace;
  color: var(--accent-primary); letter-spacing: 4px; user-select: all;
}
.reset-pwd-copy {
  flex-shrink: 0; padding: var(--spacing-xs) var(--spacing-lg);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm); background: transparent; color: var(--accent-primary);
  font-size: var(--font-small); cursor: pointer; transition: all .2s;
}
.reset-pwd-copy:hover { background: var(--accent-primary10); }
.reset-pwd-hint {
  margin: 0 !important; font-size: var(--font-xs) !important; color: var(--text-muted) !important;
}

/* ===== 抽屉区域标题 ===== */
.drawer-section-title {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== 抽屉表格列：头尾同策略 ===== */
.drawer-col-left.fi-th,
.drawer-col-left.fi-td { text-align: left; }
.drawer-col-center.fi-th,
.drawer-col-center.fi-td { text-align: center; white-space: nowrap; }
.drawer-col-narrow.fi-th,
.drawer-col-narrow.fi-td { width: 1%; text-align: center; white-space: nowrap; }

/* ===== 岗位标签行 ===== */
.position-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

/* ===== 表单/弹窗按钮区：右对齐 + 按钮间距 ===== */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-lg);
  width: 100%;
}
:deep(.el-dialog__footer) {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-lg);
}
</style>
