<template>
  <el-drawer
    :model-value="visible"
    title="发起流程"
    size="800px"
    direction="rtl"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @closed="resetForm"
  >
    <!-- 步骤指示器 -->
    <p class="step-indicator">1. 选择流程 &nbsp;&gt;&nbsp; 2. 填写信息</p>

    <div class="drawer-content">
      <!-- 卡片1：流程模版 -->
      <div class="form-card">
        <p class="card-title">流程模版</p>
        <div class="form-row">
          <span class="required-star">*</span>
          <span class="field-label">流程模版</span>
          <el-select
            v-model="selectedTemplateId"
            filterable
            placeholder="请选择流程模版"
            class="field-control"
            @change="onTemplateSelect"
          >
            <el-option
              v-for="tpl in templateList"
              :key="tpl.id"
              :label="tpl.name + '（' + tpl.nodeCount + '节点 · ' + tpl.fieldCount + '字段）'"
              :value="tpl.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 卡片2：基本信息（始终显示） -->
      <div class="form-card">
        <p class="card-title">基本信息</p>

        <!-- 工单标题 -->
        <div class="form-row">
          <span class="required-star">*</span>
          <span class="field-label">工单标题</span>
          <el-input
            v-model="orderTitle"
            placeholder="请输入工单标题"
            class="field-control"
          />
        </div>

        <!-- 优先级 -->
        <div class="form-row priority-row">
          <span class="required-star">*</span>
          <span class="field-label">优先级</span>
          <div class="priority-options">
            <label
              v-for="opt in priorityOptions"
              :key="opt.value"
              :class="['priority-item', { active: priority === opt.value }]"
              @click="priority = opt.value"
            >
              <span :class="['priority-radio', { checked: priority === opt.value }]" />
              <span class="priority-text">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- 备注 -->
        <div class="form-row">
          <span class="field-label">备注</span>
          <el-input
            v-model="remark"
            type="textarea"
            :rows="3"
            placeholder="请录入备注信息"
            class="field-control"
          />
        </div>
      </div>

      <!-- 卡片3：表单信息（模板选中后显示） -->
      <div v-if="templateDetail && formFields.length > 0" class="form-card form-card-grow">
        <p class="card-title">表单信息</p>
        <DynamicForm
          ref="dynamicFormRef"
          :fields="formFields"
          :permissions="formPermissions"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <button class="btn-cancel" @click="cancel">取消</button>
      <button class="btn-save-draft" :disabled="!selectedTemplateId || submitting" @click="handleSaveDraft">
        {{ submitting ? '保存中...' : '保存草稿' }}
      </button>
      <button
        class="btn-submit"
        :disabled="!selectedTemplateId || submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '立即发起' }}
      </button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useWorkOrderStore } from '@/stores/work-order'
import { useWorkflowStore } from '@/stores/workflow'
import { getTemplateDetail } from '@/api/workflow'
import type { FormField, FieldPermission } from '@/types/workflow'
import type { TemplateItem } from '@/types/workflow'
import type { Priority } from '@/types/work-order'
import DynamicForm from './DynamicForm.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'created': []
  'draft-saved': []
}>()

const workOrderStore = useWorkOrderStore()
const workflowStore = useWorkflowStore()
const submitting = ref(false)

// 步骤指示器
// （纯展示文本，无逻辑）

// 流程模版选择
const selectedTemplateId = ref<number>()
const templateDetail = ref<import('@/types/workflow').TemplateDetail | null>(null)
const formFields = ref<FormField[]>([])
const formPermissions = ref<FieldPermission[]>([])

const dynamicFormRef = ref<InstanceType<typeof DynamicForm>>()

// 基本信息（静态字段）
const orderTitle = ref('')
const priority = ref<Priority>('normal')
const remark = ref('')

// 优先级选项（Figma 设计：低/普通/高/紧急）
const priorityOptions = [
  { label: '低', value: 'low' as Priority },
  { label: '普通', value: 'normal' as Priority },
  { label: '高', value: 'high' as Priority },
  { label: '紧急', value: 'urgent' as Priority },
]

// 从 workflow store 获取已发布的模板列表
const templateList = computed(() =>
  workflowStore.list.filter((t: TemplateItem) => t.status === 1),
)

// 选中模板 → 获取详情
async function onTemplateSelect(templateId: number) {
  if (!templateId) return
  dynamicFormRef.value?.reset()
  formFields.value = []
  formPermissions.value = []
  try {
    const detail = await getTemplateDetail(templateId)
    if (!detail) {
      ElMessage.warning('模板数据异常')
      return
    }
    templateDetail.value = detail

    // 从流程定义中找到发起节点（type === 'start'）
    const startNode = detail.flowDefinition.nodes.find(n => n.type === 'start')
    if (startNode) {
      formFields.value = detail.formSchema[startNode.id]?.fields || []
      formPermissions.value = startNode.formFields?.map(f => ({
        fieldId: f.fieldId,
        mode: f.mode || 'editable' as const,
      })) || []
    } else {
      formFields.value = []
      formPermissions.value = []
    }
  } catch {
    ElMessage.error('获取模板详情失败')
  }
}

async function handleSaveDraft() {
  await doCreate('draft')
}

async function handleSubmit() {
  await doCreate('active')
}

async function doCreate(status: string) {
  if (!selectedTemplateId.value || !templateDetail.value) return

  // 校验基本信息的必填字段
  if (!orderTitle.value.trim()) {
    ElMessage.warning('请输入工单标题')
    return
  }

  // 校验动态表单
  if (dynamicFormRef.value) {
    const valid = await dynamicFormRef.value.validate()
    if (!valid) return
  }

  submitting.value = true
  try {
    const formData = dynamicFormRef.value
      ? dynamicFormRef.value.getFormData()
      : {}
    const detail = templateDetail.value

    await workOrderStore.createOrder({
      templateId: selectedTemplateId.value,
      templateName: detail.baseInfo.name,
      templateVersion: 1,
      title: orderTitle.value.trim(),
      priority: priority.value,
      remark: remark.value.trim() || undefined,
      creatorName: '张三',
      formData,
      totalNodes: detail.flowDefinition.nodes.length,
      ttrMinutes: detail.baseInfo.defaultTtrMinutes ?? null,
      ttsMinutes: detail.baseInfo.defaultTtsMinutes || 1440,
      status: status as any,
    })
    emit('update:visible', false)
    if (status === 'active') {
      emit('created')
    } else {
      emit('draft-saved')
    }
    resetForm()
  } catch {
    ElMessage.error('创建失败，请重试')
  } finally {
    submitting.value = false
  }
}

function cancel() {
  emit('update:visible', false)
  resetForm()
}

function resetForm() {
  selectedTemplateId.value = 0
  templateDetail.value = null
  formFields.value = []
  formPermissions.value = []
  orderTitle.value = ''
  priority.value = 'normal'
  remark.value = ''
  dynamicFormRef.value?.reset()
}

// 组件挂载时预加载模板列表
onMounted(() => {
  workflowStore.fetchList()
})
</script>

<style scoped>
/* ===== 步骤指示器 ===== */
.step-indicator {
  margin: 0 0 var(--spacing-xl, 16px);
  font-size: var(--font-body, 16px);
  color: var(--text-secondary);
}

/* ===== 内容区 ===== */
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl, 16px);
  flex: 1;
  overflow-y: auto;
}

/* ===== 卡片 ===== */
.form-card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-lg, 12px);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 12px);
  flex-shrink: 0;
}

.form-card-grow {
  flex: 1;
  min-height: 0;
}

.card-title {
  margin: 0;
  font-size: var(--font-h3, 18px);
  font-weight: 500;
  color: var(--text-secondary);
}

/* ===== 表单行 ===== */
.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 45px;
}

.required-star {
  font-size: 18px;
  font-weight: 500;
  color: var(--semantic-danger);
  flex-shrink: 0;
  line-height: 1;
}

.field-label {
  font-size: var(--font-body, 16px);
  color: var(--text-primary);
  flex-shrink: 0;
  white-space: nowrap;
}

.field-control {
  flex: 1;
  min-width: 0;
}

/* ===== 优先级 Radio 自定义样式 ===== */
.priority-row {
  min-height: 49px;
}

.priority-options {
  display: flex;
  gap: var(--spacing-xxl, 24px);
  align-items: center;
  flex: 1;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl, 16px);
  cursor: pointer;
  user-select: none;
}

.priority-radio {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--border-high);
  background: var(--bg-sub-card);
  flex-shrink: 0;
  transition: border-color .15s, background .15s;
}

.priority-radio.checked {
  border-color: var(--accent-primary);
  background: var(--accent-primary);
}

.priority-text {
  font-size: var(--font-body, 16px);
  color: var(--text-secondary);
}

/* ===== 底部按钮 ===== */
.btn-cancel {
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  border: none;
  background: var(--semantic-danger);
  color: #fff;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  cursor: pointer;
  min-width: 107px;
  font-family: inherit;
  transition: opacity .15s;
}

.btn-cancel:hover {
  opacity: 0.85;
}

.btn-save-draft {
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--accent-primary);
  background: transparent;
  color: var(--accent-primary);
  font-size: var(--font-small, 14px);
  font-weight: 500;
  cursor: pointer;
  min-width: 107px;
  font-family: inherit;
  transition: opacity .15s;
  margin-left: var(--spacing-xl, 16px);
}

.btn-save-draft:hover {
  opacity: 0.85;
}

.btn-save-draft:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-submit {
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  border: none;
  background: var(--accent-primary);
  color: #fff;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  cursor: pointer;
  min-width: 107px;
  font-family: inherit;
  transition: opacity .15s;
  margin-left: var(--spacing-xl, 16px);
}

.btn-submit:hover {
  opacity: 0.85;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== el-drawer body flex 布局 ===== */
:deep(.el-drawer__body) {
  display: flex !important;
  flex-direction: column;
  overflow: hidden !important;
  padding: var(--spacing-lg, 12px) var(--spacing-xl, 16px) !important;
}
</style>
