<template>
  <div class="scene-page">
    <!-- ===== 内容卡片 ===== -->
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <!-- 搜索输入框 -->
          <div class="search-input-wrap">
            <input
              v-model="query.name"
              class="fi-input"
              placeholder="画面名称"
              @keyup.enter="handleSearch"
            />
            <button v-if="query.name" class="fi-clear" @click="query.name='';handleSearch()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <!-- 状态下拉 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="query.status"
              placeholder="状态"
              clearable
              class="fi-select"
              :teleported="false"
              popper-class="fi-popper"
            >
              <el-option label="草稿" value="draft" />
              <el-option label="已发布" value="published" />
              <el-option label="已停用" value="disabled" />
            </el-select>
          </div>

          <!-- 归属系统下拉 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="query.systemKey"
              placeholder="归属系统"
              clearable
              class="fi-select"
              :teleported="false"
              popper-class="fi-popper"
            >
              <el-option v-for="s in SYSTEM_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>

          <!-- 查询按钮 -->
          <button class="btn-primary" @click="handleSearch">查询</button>
        </div>

        <!-- 新增按钮 -->
        <button class="btn-add" @click="handleAdd">
          <AppIcon name="plus" class="btn-add-icon" />
          新增组态
        </button>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-name"><span>画面名称</span></th>
              <th class="fi-th col-system"><span>归属系统</span></th>
              <th class="fi-th col-scope"><span>归属对象</span></th>
              <th class="fi-th col-nodes"><span>图元数</span></th>
              <th class="fi-th col-edges"><span>连线数</span></th>
              <th class="fi-th col-time"><span>更新时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-status" style="text-align:center">
                <StatusTag :status="statusKey(row.status)" :label="statusLabel(row.status)" />
              </td>
              <td class="fi-td col-name" style="text-align:center">
                <span class="type-link" title="打开组态编辑器" @click="openEditor(row)">{{ row.name }}</span>
              </td>
              <td class="fi-td col-system" style="text-align:center">{{ systemLabel(row.systemKey) }}</td>
              <td class="fi-td col-scope" style="text-align:center">{{ row.scope || '—' }}</td>
              <td class="fi-td col-nodes" style="text-align:center">{{ row.nodes.length }}</td>
              <td class="fi-td col-edges" style="text-align:center">{{ row.edges.length }}</td>
              <td class="fi-td col-time" style="text-align:center">{{ timeText(row.updatedAt) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-edit" @click="handleEdit(row)" title="编辑">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-preview" @click="handlePreview(row)" title="预览">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" @click="handleDelete(row)" title="删除">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                  <el-switch
                    :model-value="row.status !== 'disabled'"
                    @change="handleToggle(row)"
                  />
                </div>
              </td>
            </tr>
            <tr v-if="!store.list.length && !loading">
              <td class="fi-td" colspan="8" style="text-align:center;color:var(--text-muted)">
                暂无组态画面，点右上「新增组态」开始配置
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">
          共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{
            Math.ceil(store.total / store.query.size) || 1
          }} 页
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

      <!-- ===== 新增/编辑弹窗 ===== -->
      <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑组态画面' : '新增组态画面'"
        width="520px"
        :close-on-click-modal="false"
      >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" label-position="right">
          <el-form-item label="画面名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入画面名称" maxlength="50" />
          </el-form-item>
          <el-form-item label="归属系统" prop="systemKey">
            <el-select v-model="form.systemKey" placeholder="请选择归属系统" class="w-full">
              <el-option v-for="s in SYSTEM_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="归属对象" prop="scope">
            <el-input v-model="form.scope" placeholder="例：港南二中 3 号楼" maxlength="50" />
          </el-form-item>
          <el-form-item label="画布宽度" prop="width">
            <el-input-number v-model="form.width" :min="600" :max="4000" :step="100" class="w-full" />
          </el-form-item>
          <el-form-item label="画布高度" prop="height">
            <el-input-number v-model="form.height" :min="400" :max="3000" :step="100" class="w-full" />
          </el-form-item>
          <el-form-item label="图形风格" prop="style">
            <el-select v-model="form.style" placeholder="请选择图形风格" class="w-full">
              <el-option label="图片版（扁平拟物实物图）" value="image" />
              <el-option label="线框版（工程符号）" value="line" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-default" @click="dialogVisible = false">取消</button>
          <button class="btn-primary" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '提交中...' : '确定' }}
          </button>
        </template>
      </el-dialog>

      <!-- ===== 预览弹窗 ===== -->
      <el-dialog v-model="previewVisible" title="组态画面预览" width="960px" class="scene-preview">
        <div v-if="previewScene" class="scene-preview__body">
          <SceneCanvas
            :nodes="previewScene.nodes"
            :edges="previewScene.edges"
            :selection="null"
            :variant="previewScene.style"
            :width="previewScene.width"
            :height="previewScene.height"
            readonly
          />
        </div>
        <template #footer>
          <button class="btn-default" @click="previewVisible = false">关闭</button>
          <button class="btn-primary" @click="previewVisible = false; handleEdit(previewScene!)">
            编辑
          </button>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组态配置 — 画面列表
 *
 * 范式对齐 src/views/maintenance/PlanList.vue：筛选栏 + fi-table + btn-add + el-dialog(520px) + el-pagination。
 */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import StatusTag from '@/components/business/StatusTag.vue'
import SceneCanvas from '@/components/device-facility/SceneCanvas.vue'
import { useConfirm } from '@/composables/useConfirm'
import { useSceneConfigStore } from '@/stores/scene-config'
import type { SceneConfig, SceneStatus, SceneStyle } from '@/types/scene-config'

const router = useRouter()
const store = useSceneConfigStore()
const { query } = store
const loading = ref(false)

const SYSTEM_OPTIONS = [
  { value: 'pipeline', label: '消防管网' },
  { value: 'gas', label: '气体灭火' },
  { value: 'smoke', label: '消防防排烟' },
  { value: 'custom', label: '自定义' },
]

const systemLabel = (key: string) => SYSTEM_OPTIONS.find((s) => s.value === key)?.label || key

/** 状态 → StatusTag 的既有状态键（复用组件内已定义的映射，不新增样式） */
const statusKey = (status: SceneStatus) =>
  ({ draft: 'draft', published: 'on', disabled: 'stopped' })[status]

const statusLabel = (status: SceneStatus) =>
  ({ draft: '草稿', published: '已发布', disabled: '已停用' })[status]

function timeText(ts: number): string {
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function handleSearch() {
  query.page = 1
  store.fetchList()
}

// ===== 新增/编辑弹窗 =====
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<string | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const defaultForm = () => ({
  name: '',
  systemKey: 'pipeline' as string,
  scope: '',
  width: 1200,
  height: 700,
  style: 'image' as SceneStyle,
})
const form = reactive(defaultForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入画面名称', trigger: 'blur' }],
  systemKey: [{ required: true, message: '请选择归属系统', trigger: 'change' }],
}

const handleAdd = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

const handleEdit = (row: SceneConfig) => {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.systemKey = row.systemKey
  form.scope = row.scope
  form.width = row.width
  form.height = row.height
  form.style = row.style
  dialogVisible.value = true
}

/** 打开组态编辑器 */
const openEditor = (row: SceneConfig) => {
  router.push(`/device-facility/rule/scene-config/${row.id}/editor`)
}

const handleSubmit = async () => {
  await formRef.value!.validate()
  submitting.value = true
  try {
    if (isEdit.value && editId.value) {
      store.updateSceneMeta(editId.value, { ...form })
      ElMessage.success('编辑成功')
      dialogVisible.value = false
    } else {
      const scene = store.createScene({ ...form })
      ElMessage.success('新增成功')
      dialogVisible.value = false
      router.push(`/device-facility/rule/scene-config/${scene.id}/editor`)
      return
    }
    store.fetchList()
  } finally {
    submitting.value = false
  }
}

// ===== 预览 =====
const previewVisible = ref(false)
const previewScene = ref<SceneConfig | null>(null)

const handlePreview = (row: SceneConfig) => {
  previewScene.value = row
  previewVisible.value = true
}

// ===== 删除 / 启停 =====
const { confirmDelete } = useConfirm()

const handleDelete = async (row: SceneConfig) => {
  await confirmDelete(row.name, '删除后不可恢复。')
  store.removeScene(row.id)
  store.fetchList()
  ElMessage.success('删除成功')
}

const handleToggle = (row: SceneConfig) => {
  store.toggleStatus(row)
  store.fetchList()
}

onMounted(() => {
  loading.value = true
  store.fetchList()
  loading.value = false
})
</script>

<style scoped>
/* ===== 布局 ===== */
.scene-page { height: 100%; }

.content-card {
  background: var(--bg-card);
  border-radius: 4px;
  padding: var(--spacing-lg, 12px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xxl, 24px);
}

/* -- 新增按钮（与 PlanList 一致） -- */
.btn-add {
  height: var(--btn-height, 37px);
  background: var(--accent-primary10);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-md, 8px) var(--spacing-lg, 12px);
  font-size: var(--font-small, 14px);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  white-space: nowrap;
}
.btn-add:hover { filter: brightness(0.95); }

.col-status { width: 110px; min-width: 90px; }
.col-name { min-width: 160px; }
.col-system { width: 110px; }
.col-scope { width: 160px; }
.col-nodes { width: 90px; }
.col-edges { width: 90px; }
.col-time { width: 180px; }
.col-actions { width: 180px; min-width: 170px; white-space: nowrap; }

@media (max-width: 1550px) { .col-scope { display: none !important; } }
@media (max-width: 1250px) { .col-system { display: none !important; } }
@media (max-width: 1050px) {
  .col-time { display: none !important; }
  .col-actions { width: 160px; min-width: 160px; }
  .action-cell { gap: var(--spacing-sm, 6px); }
}
@media (max-width: 1280px) { .filter-left { gap: var(--spacing-xl, 16px); flex-wrap: wrap; } }
@media (max-width: 800px) { .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; } .filter-left { flex-wrap: wrap; } .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; } }

.type-link { color: var(--accent-primary); cursor: pointer; font-size: var(--font-body, 16px); }
:deep(.el-loading-mask .el-loading-text) { color: var(--text-secondary); }

/* switch 开关 */
:deep(.el-switch__core) { background-color: var(--border-high); }
:deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--accent-primary); border-color: var(--accent-primary);
}

/* 分页器 */
:deep(.el-pagination .el-pager li) {
  background-color: var(--pagi-bg); color: var(--pagi-text);
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary); color: #fff;
  border-color: var(--accent-primary);
}
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important;
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .btn-prev.is-disabled),
:deep(.el-pagination .btn-next.is-disabled) {
  color: var(--text-muted) !important; background-color: var(--pagi-bg) !important;
}

/* 每页条数选择器 */
:deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: var(--bg-card) !important; color: var(--text-secondary);
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-select .el-select__placeholder) { color: var(--text-secondary); }

/* 前往页面输入框 */
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: var(--text-primary) !important;
  background-color: var(--bg-card);
}

/* ===== 弹窗 ===== */
.w-full { width: 100%; }

.scene-preview__body {
  height: 560px;
  display: flex;
  flex-direction: column;
}
.scene-preview__body :deep(.scene-canvas) {
  height: 100%;
}
</style>
