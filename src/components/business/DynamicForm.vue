<template>
  <div class="dynamic-form">
    <el-form ref="formRef" :model="formData" label-position="top" class="dyn-form">
      <el-row :gutter="16">
        <template v-for="f in visibleFields" :key="f.id">
          <el-col :span="f.span || 24">
            <el-form-item
              :label="f.label"
              :prop="f.id"
              :rules="getRules(f)"
              class="dyn-form-item"
            >
              <!-- input -->
              <el-input
                v-if="f.type === 'input'"
                v-model="formData[f.id]"
                :disabled="isReadonly(f)"
                :placeholder="isReadonly(f) ? '' : '请输入' + f.label"
              />
              <!-- textarea -->
              <el-input
                v-else-if="f.type === 'textarea'"
                v-model="formData[f.id]"
                type="textarea"
                :rows="3"
                :disabled="isReadonly(f)"
                :placeholder="isReadonly(f) ? '' : '请输入' + f.label"
              />
              <!-- radio -->
              <el-radio-group v-else-if="f.type === 'radio'" v-model="formData[f.id]" :disabled="isReadonly(f)">
                <el-radio v-for="opt in (f.options || [])" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </el-radio>
              </el-radio-group>
              <!-- checkbox -->
              <el-checkbox-group v-else-if="f.type === 'checkbox'" v-model="formData[f.id]" :disabled="isReadonly(f)">
                <el-checkbox v-for="opt in (f.options || [])" :key="opt.value" :label="opt.value">
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>
              <!-- select -->
              <el-select
                v-else-if="f.type === 'select'"
                v-model="formData[f.id]"
                :disabled="isReadonly(f)"
                :placeholder="isReadonly(f) ? '' : '请选择' + f.label"
                :loading="callbackLoading[f.id]"
                style="width:100%"
                clearable
              >
                <el-option
                  v-for="opt in getFieldOptions(f)"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <!-- switch -->
              <el-switch
                v-else-if="f.type === 'switch'"
                v-model="formData[f.id]"
                :disabled="isReadonly(f)"
              />
              <!-- date-picker -->
              <el-date-picker
                v-else-if="f.type === 'date' || f.type === 'date-picker'"
                v-model="formData[f.id]"
                type="date"
                :disabled="isReadonly(f)"
                placeholder="选择日期"
                style="width:100%"
              />
              <!-- input-number -->
              <el-input-number
                v-else-if="f.type === 'number' || f.type === 'input-number'"
                v-model="formData[f.id]"
                :disabled="isReadonly(f)"
                :min="0"
                style="width:100%"
              />
              <!-- upload -->
              <el-upload
                v-else-if="f.type === 'upload'"
                :disabled="isReadonly(f)"
                :auto-upload="false"
                :file-list="getUploadFileList(f.id)"
                :on-change="(file: any, fileList: any[]) => onUploadChange(f.id, file, fileList)"
                list-type="picture"
                class="dyn-upload"
              >
                <div class="upload-card">
                  <div class="upload-icon-wrap">
                    <svg class="upload-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.6 21.6V9.208a1.8 1.8 0 0 1 3.073-1.273L23.4 15.662a.9.9 0 0 1 0 1.273l-7.727 7.727a1.8 1.8 0 0 1-3.073-1.273V21.6Z" fill="#D9D9D9"/>
                      <path d="M7.2 28.8h21.6" stroke="#D9D9D9" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <button type="button" class="upload-btn">选择文件</button>
                  <p class="upload-hint">支持上传PDF、word</p>
                </div>
              </el-upload>
              <!-- fallback -->
              <el-input
                v-else
                v-model="formData[f.id]"
                :disabled="isReadonly(f)"
                :placeholder="isReadonly(f) ? '' : '请输入' + f.label"
              />
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, shallowRef, onMounted } from 'vue'
import type { UploadFile, UploadFiles } from 'element-plus'
import type { ElForm } from 'element-plus'
import type { FormField, FieldPermission } from '@/types/workflow'
import { resolveCallbackOptions } from '@/utils/org-data'

const props = withDefaults(defineProps<{
  fields: FormField[]
  permissions?: FieldPermission[]
  initialData?: Record<string, any>
  readonly?: boolean
}>(), {
  permissions: () => [],
  initialData: () => ({}),
  readonly: false,
})

const formRef = ref<InstanceType<typeof ElForm>>()

// 内部表单数据
const formData = reactive<Record<string, any>>({})

// 初始化/重置 formData
function initData() {
  const data: Record<string, any> = {}
  for (const f of props.fields) {
    data[f.id] = props.initialData?.[f.id] ?? f.defaultValue ?? ''
  }
  Object.assign(formData, data)
}
initData()

// initialData 变化时刷新
watch(() => props.initialData, () => initData(), { deep: true })
watch(() => props.fields, () => initData(), { deep: true })

// ===== 动态选项加载（source === 'callback' 的 select 字段） =====

/** 按 fieldId 存储动态加载的选项 */
const callbackOptions = reactive<Record<string, { value: string; label: string }[]>>({})

/** 按 fieldId 跟踪加载状态 */
const callbackLoading = reactive<Record<string, boolean>>({})

/** 异步加载 callback 类型字段的选项 */
async function loadCallbackOptions() {
  for (const f of props.fields) {
    if (f.type === 'select' && f.source === 'callback' && f.callbackConfig) {
      callbackLoading[f.id] = true
      try {
        // 模拟异步延迟（后续可替换为真实 API 调用）
        await new Promise(r => setTimeout(r, 150))
        callbackOptions[f.id] = resolveCallbackOptions(f.callbackConfig.type)
      } catch (e) {
        console.warn(`[DynamicForm] 加载动态选项失败 (field=${f.id}):`, e)
        callbackOptions[f.id] = []
      } finally {
        callbackLoading[f.id] = false
      }
    }
  }
}

/** 获取字段的下拉选项（合并静态 options 与动态 callbackOptions） */
function getFieldOptions(field: FormField): { value: string; label: string }[] {
  if (field.source === 'callback') {
    return callbackOptions[field.id] || []
  }
  return field.options || []
}

// fields 变化时重新加载
watch(() => props.fields, () => loadCallbackOptions(), { deep: true })

onMounted(() => loadCallbackOptions())

// ===== 权限计算 =====

/** 获取字段权限 mode */
function getFieldMode(field: FormField): 'hidden' | 'readonly' | 'editable' {
  // 全局只读优先
  if (props.readonly) return 'readonly'
  // 显式配置的权限
  const perm = props.permissions.find(p => p.fieldId === field.id)
  if (perm && perm.mode) return perm.mode as 'hidden' | 'readonly' | 'editable'
  // 默认 editable
  return 'editable'
}

/** 可见字段（过滤 hidden） */
const visibleFields = computed(() =>
  props.fields.filter(f => getFieldMode(f) !== 'hidden'),
)

/** 当前字段是否只读 */
function isReadonly(field: FormField): boolean {
  return getFieldMode(field) === 'readonly'
}

// ===== 上传字段文件列表管理 =====

/** 上传字段的实际文件列表（el-upload 需要文件对象，不能直接放 formData） */
const uploadFileLists = shallowRef<Record<string, UploadFiles>>({})

/** 初始化/清理上传文件列表 */
function initUploadLists() {
  const map: Record<string, UploadFiles> = {}
  for (const f of props.fields) {
    if (f.type === 'upload') {
      // 从 formData 恢复已有的文件信息（编辑/回显场景）
      const stored = formData[f.id]
      map[f.id] = Array.isArray(stored) ? stored : (stored ? [{ name: String(stored), url: String(stored), uid: Number(f.id.replace(/\D/g, '') || 0), status: 'success' as const }] : [])
    }
  }
  uploadFileLists.value = map
}
initUploadLists()
watch(() => props.fields, () => initUploadLists(), { deep: true })

function getUploadFileList(fieldId: string): UploadFiles {
  return uploadFileLists.value[fieldId] || []
}

function onUploadChange(fieldId: string, _file: UploadFile, fileList: UploadFiles) {
  // 更新内部文件列表
  uploadFileLists.value = { ...uploadFileLists.value, [fieldId]: [...fileList] }
  // 同步可序列化的文件元数据到 formData
  formData[fieldId] = fileList.map(f => ({
    name: f.name,
    size: f.size,
    uid: f.uid,
    // auto-upload=false 时，生成本地预览 URL
    url: f.raw ? URL.createObjectURL(f.raw) : f.url || '',
  }))
}

// ===== 校验规则 =====

function getRules(field: FormField) {
  if (isReadonly(field)) return []
  const rules: any[] = []
  if (field.required) {
    rules.push({ required: true, message: `${field.label}为必填项`, trigger: 'blur' })
  }
  if (field.validationRules) {
    const vr = field.validationRules
    if (vr.min !== undefined) rules.push({ min: vr.min, message: vr.minMessage || `最小值为${vr.min}`, trigger: 'blur' })
    if (vr.max !== undefined) rules.push({ max: vr.max, message: vr.maxMessage || `最大值为${vr.max}`, trigger: 'blur' })
    if (vr.pattern) rules.push({ pattern: vr.pattern, message: vr.patternMessage || '格式不正确', trigger: 'blur' })
  }
  return rules
}

// ===== 暴露方法 =====

function getFormData(): Record<string, any> {
  const data: Record<string, any> = {}
  for (const f of props.fields) {
    if (getFieldMode(f) !== 'hidden') {
      data[f.id] = formData[f.id]
    }
  }
  return data
}

async function validate(): Promise<boolean> {
  if (!formRef.value) return true
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

function reset() {
  initData()
  initUploadLists()
  formRef.value?.resetFields()
}

defineExpose({ getFormData, validate, reset })
</script>

<style scoped>
.dynamic-form {
  width: 100%;
}
.dyn-form {
  padding: 4px 0;
}
.dyn-form-item {
  margin-bottom: 14px;
}

/* ===== 上传大卡片样式 ===== */
.dyn-upload :deep(.el-upload) {
  width: 100%;
}
.upload-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm, 6px);
  padding: var(--spacing-xl, 16px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color .15s;
}
.upload-card:hover {
  border-color: var(--accent-primary);
}
.upload-icon-wrap {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-icon {
  width: 36px;
  height: 36px;
}
.upload-btn {
  padding: 8px 12px;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-default);
  background: var(--bg-sub-card);
  color: var(--text-tertiary);
  font-size: var(--font-small, 14px);
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  min-width: 107px;
  transition: border-color .15s, background .15s;
}
.upload-btn:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.upload-hint {
  margin: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-placeholder);
  white-space: nowrap;
}
</style>
