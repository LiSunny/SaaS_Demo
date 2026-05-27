<template>
  <div class="config-page">
    <!-- ===== 顶部栏：面包屑 + 模板名称 ===== -->
    <div class="config-topbar">
      <div class="topbar-left">
        <button class="btn-link" @click="handleBack">
          <AppIcon name="arrow-left" class="btn-link-icon" />
          返回列表
        </button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/workflow/template' }">工作流管理</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/workflow/template' }">流程模板</el-breadcrumb-item>
          <el-breadcrumb-item>
            {{ isEdit ? templateName : '新建模板' }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <span v-if="isEdit && templateName" class="topbar-template-name">{{ templateName }}</span>
      </div>

      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" align-center class="config-steps">
        <el-step v-for="(s, i) in steps" :key="s.key" :title="s.label" />
      </el-steps>

      <div class="topbar-right" />
    </div>

    <!-- ===== 步骤内容 ===== -->
    <div class="config-body">
      <!-- 步骤 1：基础设置 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-card shadow="never" class="step-card">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="base-form">
            <!-- 模板名称 -->
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入模板名称" maxlength="50" />
            </el-form-item>

            <!-- 模板编号 -->
            <el-form-item label="模板编号" prop="code">
              <el-input v-model="form.code" placeholder="不填则自动生成（如 GD-20260527-0001）" maxlength="20" />
            </el-form-item>

            <!-- 工单说明 -->
            <el-form-item label="工单说明" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="描述模板用途和适用场景"
                maxlength="200"
              />
            </el-form-item>

            <!-- 谁可发起工单 -->
            <el-form-item label="谁可发起工单" prop="initiatorScope">
              <el-radio-group v-model="form.initiatorScope">
                <el-radio value="all">全部</el-radio>
                <el-radio value="specified">指定人员</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              v-if="form.initiatorScope === 'specified'"
              label="指定人员"
              prop="initiatorUserIds"
            >
              <el-select
                v-model="form.initiatorUserIds"
                multiple
                filterable
                placeholder="请选择人员"
                style="width: 100%"
              >
                <el-option
                  v-for="u in mockUsers"
                  :key="u.id"
                  :label="u.name"
                  :value="u.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- SLA 默认配置 -->
        <el-card shadow="never" class="step-card sla-card">
          <el-collapse v-model="slaActiveNames">
            <el-collapse-item title="SLA 默认配置" name="sla">
              <el-form
                ref="slaFormRef"
                :model="form"
                label-width="120px"
                class="base-form"
              >
                <el-form-item label="优先级">
                  <el-radio-group v-model="form.slaPriority">
                    <el-radio value="urgent">紧急</el-radio>
                    <el-radio value="normal">普通</el-radio>
                    <el-radio value="low">低优</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="默认 TTR（分钟）">
                  <el-input-number
                    v-model="form.defaultTtrMinutes"
                    :min="1"
                    :max="10080"
                    placeholder="请输入默认 TTR"
                  />
                </el-form-item>

                <el-form-item label="默认 TTS（分钟）">
                  <el-input-number
                    v-model="form.defaultTtsMinutes"
                    :min="1"
                    :max="10080"
                    placeholder="请输入默认 TTS"
                  />
                </el-form-item>

                <el-form-item label="黄灯阈值">
                  <div class="slider-wrap">
                    <el-slider
                      v-model="form.amberThreshold"
                      :min="0"
                      :max="100"
                      :format-tooltip="(val: number) => val + '%'"
                      style="flex: 1"
                    />
                    <span class="slider-value">{{ form.amberThreshold }}%</span>
                  </div>
                </el-form-item>
              </el-form>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </div>

      <!-- 步骤 2：表单设计 -->
      <div v-show="currentStep === 1" class="step-content">
        <FormDesigner ref="formDesignerRef" :initialFields="loadedFormFields" />
      </div>

      <!-- 步骤 3：流程设计 -->
      <div v-show="currentStep === 2" class="step-content">
        <FlowDesigner
          ref="flowDesignerRef"
          v-model="flowNodes"
          :form-fields="formDesignerRef?.getFields() || []"
          :template-sla="templateSlaDefaults"
        />
      </div>
    </div>

    <!-- ===== 底部操作栏 ===== -->
    <div class="config-footer">
      <button class="btn-default" @click="handleCancel">取消</button>
      <button class="btn-default" @click="handleSaveDraft">保存草稿</button>
      <button v-if="currentStep > 0" class="btn-default" @click="currentStep--">上一步</button>
      <button v-if="currentStep < 2" class="btn-primary" @click="handleNext">下一步</button>
      <button v-if="currentStep === 2" class="btn-primary" @click="handlePublish">发布</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getTemplate, getTemplateDetail, saveTemplateDraft, publishTemplate } from '@/api/workflow'
import type { TemplateForm, SlaPriority, InitiatorScope, FormField, FormSchema, FlowNode, FlowDefinition } from '@/types/workflow'
import AppIcon from '@/components/base/AppIcon.vue'
import FormDesigner from '@/components/business/FormDesigner.vue'
import FlowDesigner from '@/components/business/FlowDesigner.vue'

const route = useRoute()
const router = useRouter()
const isEdit = ref(false)
const templateName = ref('')
const currentStep = ref(0)
const formRef = ref<FormInstance>()
const slaFormRef = ref<FormInstance>()
const slaActiveNames = ref<string[]>([])
const saving = ref(false)
const formDesignerRef = ref<InstanceType<typeof FormDesigner>>()
const flowDesignerRef = ref<InstanceType<typeof FlowDesigner>>()
const loadedFormFields = ref<FormField[]>([])
const flowNodes = ref<FlowNode[]>(defaultFlowNodes())

function defaultFlowNodes(): FlowNode[] {
  return [
    { id: 'start_1', type: 'start', name: '开始' },
    { id: 'close_1', type: 'close', name: '结束' },
  ]
}

const templateSlaDefaults = computed(() => ({
  amberThreshold: form.amberThreshold,
  ttrMinutes: form.defaultTtrMinutes,
  ttsMinutes: form.defaultTtsMinutes,
}))

const steps = [
  { key: 'basic', label: '基础设置' },
  { key: 'form', label: '表单设计' },
  { key: 'flow', label: '流程设计' },
]

const mockUsers = [
  { id: 1, name: '杨婷彤' },
  { id: 2, name: '谢东' },
  { id: 3, name: '陈洪燕' },
  { id: 4, name: '梁冬' },
  { id: 5, name: '马达' },
  { id: 6, name: '杨伟' },
  { id: 7, name: '高楠' },
]

const form = reactive<TemplateForm>({
  name: '',
  code: '',
  description: '',
  initiatorScope: 'all' as InitiatorScope,
  initiatorUserIds: [],
  slaPriority: 'normal' as SlaPriority,
  defaultTtrMinutes: undefined,
  defaultTtsMinutes: undefined,
  amberThreshold: 80,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
}

function buildFlowDef(): FlowDefinition {
  const nodes = flowNodes.value
  const edges = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id })
  }
  return { nodes, edges }
}

// 模板编号自动生成
function generateCode(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `GD-${today}-${String(Date.now() % 10000).padStart(4, '0')}`
}

const id = Number(route.params.id)
isEdit.value = !!id

onMounted(async () => {
  if (id) {
    const detail = await getTemplateDetail(id)
    if (detail) {
      templateName.value = detail.baseInfo.name
      form.name = detail.baseInfo.name
      form.code = detail.baseInfo.code || ''
      form.description = detail.baseInfo.description || ''
      form.initiatorScope = detail.baseInfo.initiatorScope
      form.initiatorUserIds = detail.baseInfo.initiatorUserIds || []
      form.slaPriority = detail.baseInfo.slaPriority
      form.defaultTtrMinutes = detail.baseInfo.defaultTtrMinutes
      form.defaultTtsMinutes = detail.baseInfo.defaultTtsMinutes
      form.amberThreshold = detail.baseInfo.amberThreshold
      // 加载表单设计字段（取第一个节点的字段列表）
      const nodeIds = Object.keys(detail.formSchema)
      if (nodeIds.length > 0) {
        loadedFormFields.value = detail.formSchema[nodeIds[0]].fields || []
      }
      // 加载流程定义
      if (detail.flowDefinition?.nodes?.length > 0) {
        flowNodes.value = detail.flowDefinition.nodes
      }
    } else {
      // 降级：找不到 detail 时用列表接口
      const data = await getTemplate(id)
      if (data) {
        templateName.value = data.name
        form.name = data.name
        form.code = data.code
      }
    }
  } else {
    form.code = generateCode()
  }
})

async function validateStep0(): Promise<boolean> {
  try {
    await formRef.value!.validate()
    return true
  } catch {
    return false
  }
}

const handleNext = async () => {
  if (currentStep.value === 0) {
    const ok = await validateStep0()
    if (!ok) return
  }
  currentStep.value++
}

const handleBack = () => {
  router.back()
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('内容未保存，是否离开？', '提示', {
      confirmButtonText: '确认离开',
      cancelButtonText: '继续编辑',
      type: 'warning',
    })
    router.push('/workflow/template')
  } catch {
    // 用户取消
  }
}

const handleSaveDraft = async () => {
  if (saving.value) return
  saving.value = true
  try {
    // 从表单设计器获取当前字段
    const fields = formDesignerRef.value?.getFields() || []
    const formSchema: FormSchema = fields.length > 0
      ? { start: { fields } }
      : {}
    const flowDefinition = buildFlowDef()
    const result = await saveTemplateDraft({
      baseInfo: { ...form },
      formSchema,
      flowDefinition,
    })
    if (!isEdit.value) {
      isEdit.value = true
      templateName.value = form.name
      router.replace(`/workflow/template/config/${result.id}`)
    }
    ElMessage.success('已保存草稿')
  } finally {
    saving.value = false
  }
}

const handlePublish = async () => {
  let publishId = id
  const fields = formDesignerRef.value?.getFields() || []
  const formSchema: FormSchema = fields.length > 0
    ? { start: { fields } }
    : {}
  const flowDefinition = buildFlowDef()
  if (!publishId) {
    const result = await saveTemplateDraft({
      baseInfo: { ...form },
      formSchema,
      flowDefinition,
    })
    publishId = result.id
    isEdit.value = true
    templateName.value = form.name
    router.replace(`/workflow/template/config/${publishId}`)
  }
  await publishTemplate(publishId)
  ElMessage.success('模板已发布')
  router.push('/workflow/template')
}
</script>

<style scoped>
.config-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ===== 顶部栏 ===== */
.config-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg, 12px) var(--spacing-xl, 16px);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
  gap: var(--spacing-xxl, 24px);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  flex-shrink: 0;
}

.topbar-template-name {
  font-size: var(--font-h3, 18px);
  font-weight: 500;
  color: var(--text-primary);
  margin-left: var(--spacing-md, 8px);
}

.topbar-right {
  flex-shrink: 0;
}

/* 步骤指示器 */
.config-steps {
  flex: 1;
  max-width: 480px;
  min-width: 320px;
}

/* ===== 内容区 ===== */
.config-body {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-xl, 16px);
}

.step-content {
  height: 100%;
}

.step-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
}

.step-card + .step-card {
  margin-top: var(--spacing-xl, 16px);
}

.base-form {
  max-width: 600px;
  padding-top: var(--spacing-md, 8px);
}

/* SLA 折叠面板 */
.sla-card :deep(.el-card__body) {
  padding-top: 0;
}

.sla-card :deep(.el-collapse) {
  border: none;
}

.sla-card :deep(.el-collapse-item__header) {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary);
  border-bottom: none;
  height: auto;
  padding: var(--spacing-lg, 12px) 0;
}

.sla-card :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  width: 100%;
}

.slider-value {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  min-width: 40px;
  text-align: right;
}

/* 设计器占位 */
.designer-layout {
  display: flex;
  gap: var(--spacing-xl, 16px);
  height: 100%;
}

.designer-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
}

.panel-left {
  width: 280px;
  flex-shrink: 0;
}

.panel-center {
  flex: 1;
}

.flow-center {
  flex: 1;
}

.panel-right {
  width: 320px;
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg, 12px);
}

.panel-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md, 8px);
  gap: var(--spacing-xs, 4px);
}

.panel-hint {
  font-size: var(--font-xs, 12px);
  color: var(--text-placeholder);
}

/* ===== 底部操作栏 ===== */
.config-footer {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-lg, 12px) var(--spacing-xl, 16px);
  background: var(--bg-card);
  border-top: 1px solid var(--border-default);
  flex-shrink: 0;
}

/* ===== Element Plus 深色适配 ===== */
:deep(.el-breadcrumb__inner) {
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--text-primary);
  font-weight: 500;
}

:deep(.el-step__title) {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

:deep(.el-step__title.is-process) {
  color: var(--accent-primary);
  font-weight: 500;
}

:deep(.el-card__body) {
  color: var(--text-primary);
}

:deep(.el-input__wrapper) {
  background: var(--bg-card) !important;
  border-color: var(--border-default);
  box-shadow: none !important;
}

:deep(.el-textarea__inner) {
  background: var(--bg-card);
  border-color: var(--border-default);
  color: var(--text-primary);
}

:deep(.el-form-item__label) {
  color: var(--text-primary);
}

:deep(.el-radio) {
  color: var(--text-primary);
}

:deep(.el-input-number) {
  --el-input-number-bg-color: var(--bg-card);
}

:deep(.el-input-number .el-input__wrapper) {
  background: var(--bg-card) !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  background: var(--bg-sub-card);
  color: var(--text-primary);
  border-color: var(--border-default);
}

:deep(.el-slider__runway) {
  background: var(--border-default);
}

:deep(.el-slider__bar) {
  background: var(--accent-primary);
}

:deep(.el-collapse-item__header) {
  background: transparent;
  color: var(--text-primary);
}

:deep(.el-collapse-item__content) {
  color: var(--text-primary);
}

/* ===== FormCreate 设计器深色适配 ===== */
:deep(._fc-designer) {
  background: var(--bg-card);
}

:deep(._fc-l-menu) {
  background: var(--bg-sub-card);
  border-right-color: var(--border-default);
}

:deep(._fc-l-menu-item) {
  color: var(--text-muted);
}

:deep(._fc-l-menu-item:hover),
:deep(._fc-l-menu-item.active) {
  color: var(--accent-primary);
  background: var(--accent-primary10);
}

:deep(._fc-l) {
  background: var(--bg-card);
  border-right-color: var(--border-default);
}

:deep(._fc-l-tab) {
  color: var(--text-muted);
}

:deep(._fc-l-tab.active) {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

:deep(._fc-l-close) {
  color: var(--text-muted);
}

:deep(._fc-l-close:hover) {
  color: var(--text-primary);
  background: var(--accent-primary10);
}

:deep(.fc-draggable-item) {
  background: var(--bg-sub-card);
  border-color: var(--border-default);
  color: var(--text-primary);
}

:deep(.fc-draggable-item:hover) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

:deep(.el-aside) {
  background: var(--bg-card);
}

:deep(.el-main) {
  background: var(--bg-card);
}

:deep(.el-header) {
  background: var(--bg-sub-card);
  border-bottom-color: var(--border-default);
}
</style>
