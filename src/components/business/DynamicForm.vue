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
                style="width:100%"
                clearable
              >
                <el-option v-for="opt in (f.options || [])" :key="opt.value" :label="opt.label" :value="opt.value" />
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
                list-type="picture"
              >
                <el-button size="small" type="primary" :disabled="isReadonly(f)">点击上传</el-button>
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
import { ref, reactive, computed, watch } from 'vue'
import type { ElForm } from 'element-plus'
import type { FormField, FieldPermission } from '@/types/workflow'

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
</style>
