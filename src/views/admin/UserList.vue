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
              <td class="fi-td col-count">
                <button class="btn-link" @click="openEnterprises(row)">{{ row.enterpriseCount }} 家</button>
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
                </div>
              </td>
            </tr>
            <tr v-if="!store.loading && store.list.length === 0">
              <td colspan="7" class="fi-td" style="text-align:center;color:var(--text-muted);padding:48px 0">暂无用户</td>
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
        </el-form>
        <template #footer>
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="creating" @click="submitCreate">保存</el-button>
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
        </el-form>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
        </template>
      </el-dialog>

      <!-- ===== 关联企业抽屉 ===== -->
      <el-drawer v-model="showEnterprisesDrawer" title="关联企业" size="480px">
        <template v-if="store.enterprisesLoading">
          <el-skeleton :rows="4" animated />
        </template>
        <el-table v-else :data="store.enterprises" style="width:100%">
          <el-table-column prop="enterpriseName" label="企业名称" />
          <el-table-column label="岗位">
            <template #default="{ row: e }">
              <el-tag v-for="p in e.positions" :key="p" size="small" style="margin-right:4px">{{ positionMap[p] || p }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinedAt" label="加入时间" width="160">
            <template #default="{ row: e }">{{ e.joinedAt?.slice(0, 10) }}</template>
          </el-table-column>
        </el-table>
        <div v-if="!store.enterprisesLoading && store.enterprises.length === 0" style="text-align:center;color:var(--text-muted);padding:48px 0">
          该用户尚未加入任何企业
        </div>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserAdminStore } from '@/stores/user-admin'
import type { UserItem } from '@/types/user-admin'
import { ALL_POSITIONS } from '@/config/positions'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const store = useUserAdminStore()
const { confirmDisable, confirmResetPwd } = useConfirm()

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
const createForm = reactive({ phone: '', realName: '', password: '' })
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
  } catch { /* error handled by interceptor */ } finally { creating.value = false }
}

// ===== 编辑 =====
const showEditDialog = ref(false)
const saving = ref(false)
const editFormRef = ref<FormInstance>()
const editingId = ref(0)
const editForm = reactive({ phone: '', realName: '', email: '' })
const editRules: FormRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
}

function openEditDialog(row: UserItem) {
  editingId.value = row.id
  editForm.phone = row.phone
  editForm.realName = row.realName
  editForm.email = row.email
  showEditDialog.value = true
}

async function submitEdit() {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await store.handleUpdate(editingId.value, { realName: editForm.realName, email: editForm.email })
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
  ElMessage.success(`密码已重置为: ${newPwd}`)
}

// ===== 关联企业 =====
const showEnterprisesDrawer = ref(false)

async function openEnterprises(row: UserItem) {
  showEnterprisesDrawer.value = true
  await store.fetchEnterprises(row.id)
}
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: auto;
}

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
.col-status { width: 80px; }
.col-phone { min-width: 140px; }
.col-name { min-width: 120px; }
.col-email { min-width: 160px; }
.col-count { width: 100px; }
.col-date { min-width: 120px; }
.col-actions { width: 120px; white-space: nowrap; }

/* ===== 响应式 ===== */
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
