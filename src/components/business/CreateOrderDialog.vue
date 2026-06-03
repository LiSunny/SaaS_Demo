<template>
  <el-drawer :model-value="visible" title="发起工单" size="640px" direction="rtl" :close-on-click-modal="false" @update:model-value="$emit('update:visible', $event)" @closed="resetForm">
    <!-- 固定区域：模板选择 + 优先级 -->
    <div class="drawer-fixed">

      <!-- 1. 模板选择 -->
      <p class="create-step-label">选择模板 <span class="text-muted">（已发布的流程模板）</span></p>
      <el-select
        v-model="selectedTemplateId"
        filterable
        placeholder="请选择工单模板，支持模糊搜索"
        style="width:100%"
        @change="onTemplateSelect"
      >
        <el-option
          v-for="tpl in templateList"
          :key="tpl.id"
          :label="tpl.name + '（' + tpl.nodeCount + '节点 · ' + tpl.fieldCount + '字段）'"
          :value="tpl.id"
        />
      </el-select>

      <!-- 2. 优先级（放到模板选择下方、表单上方） -->
      <template v-if="selectedTemplateId">
        <p class="create-step-label">优先级</p>
        <el-radio-group v-model="priority" class="priority-group">
          <el-radio value="normal">普通</el-radio>
          <el-radio value="urgent">紧急</el-radio>
          <el-radio value="low">低优</el-radio>
        </el-radio-group>
      </template>

    </div>

    <!-- 滚动区域：表单信息 -->
    <div class="drawer-scroll" v-if="templateDetail && formFields.length > 0">
      <p class="create-step-label">工单信息</p>
      <DynamicForm
        ref="dynamicFormRef"
        :fields="formFields"
        :permissions="formPermissions"
      />
    </div>

    <!-- 底部按钮（固定） -->
    <template #footer>
      <button class="btn-default" @click="cancel">取消</button>
      <button class="btn-primary" :disabled="!selectedTemplateId || submitting" @click="handleCreate">
        {{ submitting ? '提交中...' : '确认发起' }}
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
import DynamicForm from './DynamicForm.vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'created': []
}>()

const workOrderStore = useWorkOrderStore()
const workflowStore = useWorkflowStore()
const submitting = ref(false)
const priority = ref('normal')

// 模板选择
const selectedTemplateId = ref<number>(0)
const templateDetail = ref<import('@/types/workflow').TemplateDetail | null>(null)
const formFields = ref<FormField[]>([])
const formPermissions = ref<FieldPermission[]>([])

const dynamicFormRef = ref<InstanceType<typeof DynamicForm>>()

// 从 workflow store 获取已发布的模板列表
const templateList = computed(() =>
  workflowStore.list.filter((t: TemplateItem) => t.status === 1),
)

// 选中模板 → 获取详情（支持二次切换）
async function onTemplateSelect(templateId: number) {
  if (!templateId) return
  // 切换模板时先重置表单
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

    // 提取第一个节点的表单字段
    const nodeIds = Object.keys(detail.formSchema)
    if (nodeIds.length > 0) {
      const firstNodeId = nodeIds[0]
      formFields.value = detail.formSchema[firstNodeId].fields || []
      // 提取字段权限（如有）
      const firstNode = detail.flowDefinition.nodes.find(n => n.id === firstNodeId)
      formPermissions.value = firstNode?.formFields?.map(f => ({
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

async function handleCreate() {
  if (!selectedTemplateId.value || !templateDetail.value) return

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
      priority: priority.value,
      creatorName: '张三',
      formData,
      totalNodes: detail.flowDefinition.nodes.length,
      ttrMinutes: detail.baseInfo.defaultTtrMinutes ?? null,
      ttsMinutes: detail.baseInfo.defaultTtsMinutes || 1440,
    })
    emit('update:visible', false)
    emit('created')
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
  priority.value = 'normal'
  dynamicFormRef.value?.reset()
}

// 组件挂载时预加载模板列表
onMounted(() => {
  workflowStore.fetchList()
})

// 抽屉已通过 @closed 事件调用 resetForm
</script>

<style scoped>
.drawer-fixed {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 12px);
  padding: var(--spacing-sm, 6px) 0;
  flex-shrink: 0;
}
.drawer-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm, 6px) 0;
}
.create-step-label {
  margin: 0;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-primary);
}
.text-muted {
  color: var(--text-secondary);
  font-weight: 400;
}
.priority-group {
  display: flex;
  gap: var(--spacing-xl, 16px);
}
/* el-drawer body flex 布局，让固定区+滚动区正确排列 */
:deep(.el-drawer__body) {
  display: flex !important;
  flex-direction: column;
  overflow: hidden !important;
  padding: var(--spacing-lg, 12px) var(--spacing-xl, 16px) !important;
}
</style>
