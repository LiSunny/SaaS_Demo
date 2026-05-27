<template>
  <div class="form-designer-wrap">
    <fc-designer ref="designerRef" :config="designerConfig" class="form-designer" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, markRaw } from 'vue'
import type { FormField, FieldSource } from '@/types/workflow'

const props = defineProps<{
  initialFields?: FormField[]
}>()

const designerRef = ref()
const isReady = ref(false)

// ===== 设计器配置 =====
const designerConfig = markRaw({
  // 自定义属性面板配置：在组件属性面板中注入字段来源下拉框
  menu: {
    customMenu: [
      {
        type: 'select',
        field: '_source',
        title: '字段来源',
        value: 'manual',
        props: {
          placeholder: '请选择字段来源',
        },
        options: [
          { value: 'manual', label: '手动录入' },
          { value: 'auto', label: '自动生成' },
          { value: 'inherited', label: '继承字段' },
          { value: 'callback', label: '回调获取' },
        ],
      },
    ],
  },
})

// ===== 数据转换 =====

function formFieldToFcRule(f: FormField): Record<string, any> {
  const rule: Record<string, any> = {
    type: f.type,
    field: f.id,
    title: f.label,
    props: {},
  }

  if (f.required) {
    rule.props.required = true
    rule.validate = rule.validate || []
    rule.validate.push({ required: true, message: `请输入${f.label}` })
  }

  if (f.defaultValue !== undefined) {
    rule.props.defaultValue = f.defaultValue
  }

  if (f.span !== undefined) {
    rule.col = rule.col || {}
    rule.col.span = f.span
  }

  if (f.source) {
    rule.props._source = f.source
  }

  if (f.validationRules && Object.keys(f.validationRules).length > 0) {
    const rules = f.validationRules
    rule.validate = rule.validate || []
    if (rules.min !== undefined) rule.validate.push({ min: rules.min, message: rules.minMessage || `最小值为${rules.min}` })
    if (rules.max !== undefined) rule.validate.push({ max: rules.max, message: rules.maxMessage || `最大值为${rules.max}` })
    if (rules.pattern) rule.validate.push({ pattern: rules.pattern, message: rules.patternMessage || '格式不正确' })
  }

  return rule
}

function fcRuleToFormField(r: Record<string, any>): FormField {
  const field: FormField = {
    id: r.field || `field_${Date.now()}`,
    type: r.type || 'input',
    label: r.title || '',
    required: r.props?.required === true || r.validate?.some((v: any) => v.required),
    source: (r.props?._source as FieldSource) || 'manual',
  }

  if (r.props?.defaultValue !== undefined) {
    field.defaultValue = r.props.defaultValue
  }

  if (r.col?.span !== undefined) {
    field.span = r.col.span
  }

  if (r.validate && Array.isArray(r.validate) && r.validate.length > 0) {
    const rules: Record<string, any> = {}
    for (const v of r.validate) {
      if (v.min !== undefined) { rules.min = v.min; if (v.message) rules.minMessage = v.message }
      if (v.max !== undefined) { rules.max = v.max; if (v.message) rules.maxMessage = v.message }
      if (v.pattern) { rules.pattern = v.pattern; if (v.message) rules.patternMessage = v.message }
    }
    if (Object.keys(rules).length > 0) {
      field.validationRules = rules
    }
  }

  return field
}

// ===== 公开方法 =====

function getFields(): FormField[] {
  if (!designerRef.value) return []
  const rules = designerRef.value.getRule() || []
  return rules.map(fcRuleToFormField)
}

function setFields(fields: FormField[]) {
  if (!designerRef.value) return
  designerRef.value.clear()
  const rules = fields.map(formFieldToFcRule)
  designerRef.value.setRule(rules)
}

onMounted(() => {
  isReady.value = true
  if (props.initialFields && props.initialFields.length > 0) {
    setFields(props.initialFields)
  }
})

// 编辑模式下异步加载字段时触发
watch(
  () => props.initialFields,
  (fields) => {
    if (isReady.value && fields && fields.length > 0) {
      setFields(fields)
    }
  },
)

defineExpose({ getFields, setFields })
</script>

<style scoped>
.form-designer-wrap {
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg, 10px);
  border: 1px solid var(--border-default);
}

.form-designer {
  height: 100%;
}
</style>
