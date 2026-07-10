<template>
  <div class="oss-upload" :class="{ 'is-disabled': disabled }">
    <!-- 已上传：图片预览 -->
    <div v-if="modelValue && preview" class="oss-preview">
      <img :src="modelValue" class="oss-preview-img" alt="预览" />
      <div class="oss-preview-actions">
        <button type="button" class="act-btn act-edit" title="重新上传" @click="triggerInput">替换</button>
        <button type="button" class="act-btn act-delete" title="移除" @click="handleRemove">删除</button>
      </div>
    </div>

    <!-- 上传中 -->
    <div v-else-if="uploading" class="oss-uploading">
      <div class="oss-progress-bar">
        <div class="oss-progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <span class="oss-progress-text">上传中 {{ progress }}%</span>
    </div>

    <!-- 未上传：选择文件区域 -->
    <div v-else class="oss-upload-area" @click="triggerInput">
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        class="oss-file-input"
        @change="handleFileChange"
      />
      <AppIcon name="upload" class="oss-upload-icon" />
      <span class="oss-upload-text">{{ placeholder }}</span>
      <span class="oss-upload-hint">{{ hintText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile } from '@/api/upload'
import AppIcon from '@/components/base/AppIcon.vue'

const props = withDefaults(defineProps<{
  /** v-model 绑定的 OSS URL */
  modelValue: string
  /** 允许的文件类型（HTML accept 属性值） */
  accept?: string
  /** 最大文件大小（MB） */
  maxSize?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示图片预览 */
  preview?: boolean
  /** 上传区域占位文字 */
  placeholder?: string
  /** OSS 存储目录分类 */
  folder?: string
}>(), {
  modelValue: '',
  accept: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
  maxSize: 5,
  disabled: false,
  preview: true,
  placeholder: '点击上传图片',
  folder: 'general',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'start': []
  'success': [url: string]
  'error': [err: Error]
}>()

const fileInputRef = ref<HTMLInputElement>()
const uploading = ref(false)
const progress = ref(0)

/** 根据 accept 生成可读提示 */
const hintText = computed(() => {
  const parts = props.accept.split(',').map(s => s.replace('image/', '').toUpperCase())
  return `支持 ${parts.join(' / ')}，最大 ${props.maxSize}MB`
})

function triggerInput(): void {
  if (props.disabled) return
  fileInputRef.value?.click()
}

/** 文件选择后自动上传 */
async function handleFileChange(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 类型校验
  const allowedTypes = props.accept.split(',').map(s => s.trim())
  const matched = allowedTypes.some(t => {
    if (t.includes('*')) {
      const prefix = t.split('/')[0]
      return file.type.startsWith(prefix)
    }
    return file.type === t || t === `.${file.name.split('.').pop()}`
  })
  if (!matched) {
    ElMessage.warning('不支持的文件格式')
    resetInput()
    return
  }

  // 大小校验
  if (file.size > props.maxSize * 1024 * 1024) {
    ElMessage.warning(`文件大小不能超过 ${props.maxSize}MB`)
    resetInput()
    return
  }

  uploading.value = true
  progress.value = 0
  emit('start')

  try {
    const result = await uploadFile(file, props.folder, (pct) => {
      progress.value = pct
    })
    emit('update:modelValue', result.url)
    emit('success', result.url)
  } catch (err: any) {
    ElMessage.error(err?.message || '上传失败，请重试')
    emit('error', err)
  } finally {
    uploading.value = false
    resetInput()
  }
}

function handleRemove(): void {
  emit('update:modelValue', '')
}

function resetInput(): void {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<style lang="scss" scoped>
/* ===== 上传区域 ===== */
.oss-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100px;
  padding: var(--spacing-lg, 20px);
  border: 1px dashed var(--border-default, #e0e0e0);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  position: relative;
}

.oss-upload-area:hover {
  border-color: var(--color-primary, #409EFF);
  background: var(--color-primary-light-9, rgba(64, 158, 255, 0.06));
}

.oss-file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

.oss-upload-icon {
  color: var(--text-disabled, #c0c4cc);
}

.oss-upload-text {
  color: var(--text-regular, #606266);
  white-space: nowrap;
}

.oss-upload-hint {
  color: var(--text-secondary, #909399);
}

/* ===== 预览区域 ===== */
.oss-preview {
  position: relative;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  max-width: 240px;
}

.oss-preview-img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.oss-preview-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  opacity: 0;
  transition: opacity 0.2s;
}

.oss-preview:hover .oss-preview-actions {
  opacity: 1;
}

.oss-preview-actions .act-btn {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.6);
}

.oss-preview-actions .act-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #fff;
}

/* ===== 上传中 ===== */
.oss-uploading {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: var(--spacing-lg, 20px);
}

.oss-progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-secondary, #f0f0f0);
  border-radius: 3px;
  overflow: hidden;
}

.oss-progress-fill {
  height: 100%;
  background: var(--color-primary, #409EFF);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.oss-progress-text {
  color: var(--text-secondary, #909399);
}

/* ===== 禁用态 ===== */
.oss-upload.is-disabled .oss-upload-area {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
