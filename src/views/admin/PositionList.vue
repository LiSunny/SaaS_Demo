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
              placeholder="岗位名称 / Key"
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
              <th class="fi-th col-desc"><span>岗位说明</span></th>
              <th class="fi-th col-count"><span>使用人数</span></th>
              <th class="fi-th col-date"><span>创建时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-key"><code class="key-code">{{ row.key }}</code></td>
              <td class="fi-td col-desc">
                <span class="desc-text">{{ row.description || '—' }}</span>
              </td>
              <td class="fi-td col-count">{{ row.userCount }} 人</td>
              <td class="fi-td col-date">{{ row.createdAt?.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-edit" title="配置权限" @click="handleConfigPermission(row)">
                    <AppIcon name="setting" class="act-icon" />
                  </button>
                  <button class="act-btn act-edit" title="编辑" @click="openEditDialog(row)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!store.loading && store.list.length === 0">
              <td colspan="6" class="fi-td" style="text-align:center;color:var(--text-muted);padding:48px 0">暂无内置岗位</td>
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

      <!-- ===== 新增/编辑岗位弹窗 ===== -->
      <el-dialog
        v-model="showFormDialog"
        :title="isEdit ? '编辑内置岗位' : '新增内置岗位'"
        width="480px"
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
            />
          </el-form-item>
          <el-form-item v-if="!isEdit" label="Key">
            <div class="key-auto-preview">
              <code class="key-code">platform:{{ nameToKey(form.name) || '...' }}</code>
              <span class="key-hint">根据名称自动生成，保存后不可修改</span>
            </div>
          </el-form-item>
          <el-form-item v-else label="Key">
            <div class="key-auto-preview">
              <code class="key-code">platform:{{ form.key }}</code>
              <span class="key-hint">Key 不可修改</span>
            </div>
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

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { usePositionStore } from '@/stores/position-admin'
import type { PositionItem } from '@/types/position-admin'
import { nameToKey } from '@/types/position-admin'
import AppIcon from '@/components/base/AppIcon.vue'

const store = usePositionStore()

onMounted(() => store.fetchList())

// ===== 新增/编辑弹窗 =====
const showFormDialog = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', key: '', description: '' })

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
      key: isEdit.value ? form.key : nameToKey(form.name),
      description: form.description,
    }
    if (isEdit.value) {
      await store.handleUpdate(editingId.value, payload)
    } else {
      await store.handleCreate(payload)
    }
    showFormDialog.value = false
    resetForm()
  } catch { /* error handled by interceptor */ } finally { submitting.value = false }
}

// ===== 删除 =====
async function handleDelete(row: PositionItem) {
  try {
    await ElMessageBox.confirm(
      '确定删除该岗位吗？删除后已分配此岗位的用户将失去对应权限，且不可恢复。',
      '删除确认',
      { type: 'warning' },
    )
  } catch { return }
  await store.handleDelete(row.id)
}

// ===== 配置权限（占位，后续对接权限配置抽屉） =====
function handleConfigPermission(row: PositionItem) {
  ElMessage.info(`权限配置（待实现）: ${row.name}`)
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

/* ===== Key code 样式 ===== */
.key-code {
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: var(--font-xs, 12px);
  background: var(--normal-bg);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
}

/* ===== Key 自动生成预览 ===== */
.key-auto-preview {
  display: flex; flex-direction: column; gap: 4px;
}
.key-auto-preview .key-code {
  width: fit-content;
  font-size: var(--font-body, 16px);
  padding: 4px 8px;
}
.key-hint {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
}

/* ===== 岗位说明截断 ===== */
.desc-text {
  display: block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 列宽 ===== */
.col-name { min-width: 160px; }
.col-key { min-width: 180px; }
.col-desc { min-width: 140px; }
.col-count { width: 90px; }
.col-date { min-width: 120px; }
.col-actions { width: 140px; white-space: nowrap; }

/* ===== 响应式 ===== */
@media (max-width: 1250px) { .col-desc { display: none !important; } }
@media (max-width: 1050px) { .col-key, .col-count { display: none !important; } }
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
