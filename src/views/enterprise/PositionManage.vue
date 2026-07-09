<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 当前企业标识 ===== -->
      <div class="page-header">
        <h3 class="page-title">企业岗位管理</h3>
        <div class="enterprise-badge" v-if="enterpriseName">
          <span class="badge-label">当前企业：</span>
          <span class="badge-name">{{ enterpriseName }}</span>
        </div>
        <div class="enterprise-badge no-enterprise" v-if="!enterpriseName && enterpriseResolved">
          <span>未关联企业</span>
        </div>
      </div>

      <!-- ===== 空状态：无关联企业 ===== -->
      <div v-if="!enterpriseName && enterpriseResolved" class="empty-block">
        <p class="empty-title">暂无关联企业</p>
        <p class="empty-desc">当前账号未关联任何企业，请联系平台管理员分配企业</p>
      </div>

      <!-- ===== 筛选栏（有关联企业时显示） ===== -->
      <template v-if="enterpriseName">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input
              v-model="keyword"
              class="fi-input"
              placeholder="岗位名称 / Key"
              @keyup.enter="search()"
            />
            <button v-if="keyword" class="fi-clear" @click="keyword = ''; search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>
          <button class="btn-primary" @click="search()">查询</button>
        </div>
        <div class="filter-right">
          <button class="btn-outline-primary" @click="openCreateDialog">
            <AppIcon name="plus" class="btn-add-icon" />新增岗位
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-name"><span>岗位名称</span></th>
              <th class="fi-th col-key"><span>Key</span></th>
              <th class="fi-th col-source"><span>来源</span></th>
              <th class="fi-th col-count"><span>使用人数</span></th>
              <th class="fi-th col-date"><span>创建时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="loading">
            <tr v-for="row in list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-name">
                <span class="pos-name">{{ row.name }}</span>
              </td>
              <td class="fi-td col-key">
                <code class="key-code">{{ row.key }}</code>
              </td>
              <td class="fi-td col-source">
                <span v-if="row.enterpriseId === null" class="source-tag tag-platform">平台内置</span>
                <span v-else class="source-tag tag-custom">企业自定义</span>
              </td>
              <td class="fi-td col-count">{{ row.userCount }} 人</td>
              <td class="fi-td col-date">{{ row.createdAt?.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <!-- 平台内置：仅配置权限 -->
                  <template v-if="row.enterpriseId === null">
                    <button class="act-btn act-edit" title="配置权限" @click="handleConfigPermission(row)">
                      <AppIcon name="setting" class="act-icon" />
                    </button>
                  </template>
                  <!-- 企业自定义：编辑 + 配置权限 + 删除 -->
                  <template v-else>
                    <button class="act-btn act-edit" title="编辑" @click="openEditDialog(row)">
                      <AppIcon name="edit" class="act-icon" />
                    </button>
                    <button class="act-btn act-edit" title="配置权限" @click="handleConfigPermission(row)">
                      <AppIcon name="setting" class="act-icon" />
                    </button>
                    <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                      <AppIcon name="delete" class="act-icon" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && list.length === 0">
              <td colspan="6" class="fi-td" style="text-align:center;color:var(--text-muted);padding:48px 0">暂无岗位数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ page }}/{{ Math.ceil(total / size) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList()"
          @current-change="fetchList()"
        />
      </div>

      <!-- ===== 新增/编辑岗位弹窗 ===== -->
      <el-dialog
        v-model="showFormDialog"
        :title="isEdit ? '编辑岗位' : '新增企业岗位'"
        width="520px"
        destroy-on-close
        :close-on-click-modal="false"
        @closed="formRef?.resetFields()"
      >
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
          <el-form-item label="岗位名称" prop="name">
            <el-input
              v-model="form.name"
              placeholder="请输入岗位名称"
              maxlength="20"
              @blur="onNameBlur"
            />
          </el-form-item>
          <el-form-item v-if="!isEdit" label="Key" prop="key">
            <el-input
              v-model="form.key"
              placeholder="自动生成或手动输入，如 custom-role"
              maxlength="40"
            >
              <template #prepend>
                <span class="key-prefix">{{ keyPrefix }}</span>
              </template>
            </el-input>
            <div class="form-extra">根据名称自动生成拼音 slug，可手动修改。保存后不可修改。</div>
          </el-form-item>
          <el-form-item v-else label="Key">
            <el-input :model-value="form.key" disabled>
              <template #prepend>
                <span class="key-prefix">ent:{{ enterpriseId }}:</span>
              </template>
            </el-input>
            <div class="form-extra">Key 不可修改</div>
          </el-form-item>
          <el-form-item label="岗位说明" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="描述岗位职责，分配岗位时企业管理员可见"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showFormDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
        </template>
      </el-dialog>

      <!-- ===== 权限配置抽屉 ===== -->
      <PermissionConfigDrawer
        v-model:visible="showPermissionDrawer"
        :position-id="permissionPositionId"
        :position-name="permissionPositionName"
        :enterprise-id="enterpriseId"
        @saved="onPermissionsSaved"
      />

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import type { FormInstance, FormRules } from 'element-plus'
import type { PositionItem } from '@/types/position-admin'
import { nameToKey } from '@/types/position-admin'
import {
  getEnterprisePositionList,
  createEnterprisePosition,
  updateEnterprisePosition,
  deleteEnterprisePosition,
} from '@/api/enterprise-positions'

import request from '@/utils/request'
import AppIcon from '@/components/base/AppIcon.vue'
import PermissionConfigDrawer from '@/components/business/PermissionConfigDrawer.vue'

const { confirm } = useConfirm()

// ===== 企业 ID 与名称获取 =====
const enterpriseId = ref(1)
const enterpriseName = ref('')
const enterpriseResolved = ref(false)

async function resolveEnterprise() {
  const q = new URLSearchParams(window.location.search)
  const eid = q.get('enterpriseId')
  if (eid) {
    enterpriseId.value = +eid
  } else {
    try {
      const res = await request.get('/admin/users/me/enterprises')
      const data = (res as any).data
      if (data?.length) {
        enterpriseId.value = data[0].enterpriseId
        enterpriseName.value = data[0].enterpriseName || ''
      }
    } catch { /* fallthrough */ }
    if (enterpriseId.value === 1) {
      const storedId = localStorage.getItem('demo-enterprise-id')
      if (storedId) enterpriseId.value = +storedId
    }
  }
  if (!enterpriseName.value) {
    try {
      const res = await request.get(`/enterprise/${enterpriseId.value}`)
      const data = (res as any).data
      enterpriseName.value = data?.name || ''
    } catch { /* ignore */ }
  }
  enterpriseResolved.value = true
}

// ===== 列表 =====
const list = ref<PositionItem[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const size = ref(20)
const total = ref(0)

async function fetchList() {
  loading.value = true
  try {
    const res = await getEnterprisePositionList(enterpriseId.value, {
      page: page.value,
      size: size.value,
      keyword: keyword.value || undefined,
    })
    list.value = res.data
    total.value = res.total
  } catch { /* error handled by interceptor */ } finally { loading.value = false }
}

function search() { page.value = 1; fetchList() }

// ===== 新增/编辑弹窗 =====
const showFormDialog = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', key: '', description: '' })

const keyPrefix = `ent:${enterpriseId.value}:`

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
    { max: 20, message: '最多 20 个字符', trigger: 'blur' },
  ],
}

function resetForm() {
  form.name = ''
  form.key = ''
  form.description = ''
  formRef.value?.resetFields()
}

function onNameBlur() {
  if (!isEdit.value && !form.key) {
    form.key = nameToKey(form.name)
  }
}

function openCreateDialog() {
  isEdit.value = false
  editingId.value = 0
  resetForm()
  showFormDialog.value = true
}

function openEditDialog(row: PositionItem) {
  isEdit.value = true
  editingId.value = row.id
  form.name = row.name
  form.key = row.key
  form.description = row.description
  showFormDialog.value = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      name: form.name,
      key: isEdit.value ? form.key : (form.key || nameToKey(form.name)),
      description: form.description,
    }
    if (isEdit.value) {
      await updateEnterprisePosition(enterpriseId.value, editingId.value, payload)
      ElMessage.success('保存成功')
    } else {
      await createEnterprisePosition(enterpriseId.value, payload)
      ElMessage.success('创建成功')
    }
    showFormDialog.value = false
    resetForm()
    fetchList()
  } catch { /* error handled by interceptor */ } finally { submitting.value = false }
}

// ===== 删除 =====
async function handleDelete(row: PositionItem) {
  try {
    await confirm(
      '确定删除该岗位吗？删除后已分配此岗位的用户将失去对应权限，且不可恢复。',
      '删除确认',
      { type: 'error' },
    )
  } catch { return }
  try {
    await deleteEnterprisePosition(enterpriseId.value, row.id)
    ElMessage.success('已删除')
    fetchList()
  } catch { /* error handled by interceptor */ }
}

// ===== 权限配置抽屉 =====
const showPermissionDrawer = ref(false)
const permissionPositionId = ref(0)
const permissionPositionName = ref('')

function handleConfigPermission(row: PositionItem) {
  permissionPositionId.value = row.id
  permissionPositionName.value = row.name
  showPermissionDrawer.value = true
}

function onPermissionsSaved() {
  showPermissionDrawer.value = false
  ElMessage.success('权限配置已保存')
  fetchList()
}

onMounted(async () => {
  await resolveEnterprise()
  if (enterpriseName.value) fetchList()
})
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: hidden;
}

/* 固定表头 —— 仅 table-wrap 内滚动 */
.fi-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
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

/* ===== 页头 ===== */
.page-header {
  display: flex; align-items: center; gap: 16px;
  padding-bottom: 12px; border-bottom: 1px solid var(--border-default);
}
.page-title {
  margin: 0; font-size: var(--font-lg, 18px); font-weight: 600;
  color: var(--text-primary);
}
.enterprise-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 6px;
  background: var(--info-bg); color: var(--accent-primary);
  font-size: var(--font-small, 14px);
}
.badge-label { color: var(--text-muted); }
.badge-name { font-weight: 500; }
.enterprise-badge.no-enterprise {
  background: var(--warning-bg); color: var(--warning);
}

/* ===== 无企业空状态 ===== */
.empty-block {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 64px 0; text-align: center;
}
.empty-title {
  font-size: var(--font-lg, 18px); font-weight: 500;
  color: var(--text-primary); margin: 0 0 8px;
}
.empty-desc {
  font-size: var(--font-small, 14px); color: var(--text-muted); margin: 0;
}

/* ===== 来源标签 ===== */
.source-tag {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 4px;
  font-size: var(--font-xs, 12px);
  white-space: nowrap;
}
.tag-platform {
  background: var(--info-bg); color: var(--accent-primary);
}
.tag-custom {
  background: var(--success-bg); color: var(--success);
}

/* ===== 岗位名称 ===== */
.pos-name {
  font-weight: 500;
}

/* ===== Key code ===== */
.key-code {
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: var(--font-xs, 12px);
  background: var(--normal-bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

/* ===== Key prepend 前缀 ===== */
.key-prefix {
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  color: var(--text-muted);
}

/* ===== 表单辅助提示 ===== */
.form-extra {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  margin-top: 4px;
}

.info-text {
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
}

/* ===== 列宽 ===== */
.col-name { min-width: 140px; }
.col-key { min-width: 180px; }
.col-source { width: 100px; }
.col-count { width: 90px; }
.col-date { min-width: 110px; }
.col-actions { width: 130px; white-space: nowrap; }

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }

/* ===== 响应式 ===== */
@media (max-width: 1250px) { .col-key { display: none !important; } }
@media (max-width: 1050px) { .col-date { display: none !important; } }
@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}
</style>
