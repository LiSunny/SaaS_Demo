<template>
  <div class="step-training">
    <!-- 查看模式 -->
    <template v-if="!editing">
      <div class="view-body">
        <div class="info-row">
          <span class="info-label">培训主题</span>
          <span class="info-value">{{ data?.topic || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">培训地点</span>
          <span class="info-value">{{ data?.location || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">培训日期</span>
          <span class="info-value">{{ data?.trainDate || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">培训形式</span>
          <span class="info-value">{{ data?.format || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">参加人员</span>
          <span class="info-value">{{ data?.participants || '—' }}</span>
        </div>
        <div v-if="data?.photoUrls?.length" class="info-row">
          <span class="info-label">现场照片</span>
          <div class="photo-grid">
            <div v-for="(p, i) in data.photoUrls" :key="i" class="photo-thumb">
              <img :src="p" :alt="'培训照片' + (i + 1)" />
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">完成人</span>
          <span class="info-value">{{ step.completedBy || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ step.completedAt || '—' }}</span>
        </div>
      </div>
    </template>

    <!-- 编辑模式 -->
    <template v-else>
      <div class="drawer-form-body">
        <!-- 培训主题 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">培训主题</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.topic" placeholder="请输入培训主题" maxlength="50" class="clean-input" />
          </div>
        </div>

        <!-- 培训地点 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">培训地点</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.location" placeholder="请输入培训地点" maxlength="50" class="clean-input" />
          </div>
        </div>

        <!-- 培训日期 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">培训日期</span>
          </div>
          <div class="form-control">
            <el-date-picker
              v-model="form.trainDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              :teleported="false"
              popper-class="fi-popper"
              style="width:100%"
              class="clean-datepicker"
            />
          </div>
        </div>

        <!-- 培训形式 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">培训形式</span>
          </div>
          <div class="form-control">
            <el-select v-model="form.format" placeholder="请选择培训形式" :teleported="false" popper-class="fi-popper" class="clean-select">
              <el-option v-for="o in TRAIN_FORMATS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>
        </div>

        <!-- 参加人员 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">参加人员</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.participants" placeholder="请输入参加人员" maxlength="200" class="clean-input" />
          </div>
        </div>

        <!-- 现场照片 -->
        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">现场照片</span>
          </div>
          <div class="form-control">
            <div class="photo-grid edit">
              <div v-for="(_, i) in form.photoUrls" :key="i" class="photo-thumb edit">
                <span class="photo-placeholder">📷</span>
                <button class="photo-remove" @click="form.photoUrls.splice(i, 1)">✕</button>
              </div>
              <button class="photo-add" @click="form.photoUrls.push('')">
                <span class="photo-add-icon">+</span>
              </button>
            </div>
            <p class="photo-hint">light 阶段照片为占位符，standard 阶段接入真实上传</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { ResumptionStep, TrainingData } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean }>()
const data = computed<TrainingData | null>(() => props.step.formData as unknown as TrainingData || null)

const TRAIN_FORMATS = [
  { value: '视频学习', label: '视频学习' },
  { value: '图文阅读', label: '图文阅读' },
  { value: '现场授课', label: '现场授课' },
  { value: '实操演练', label: '实操演练' },
  { value: '其他', label: '其他' },
]

const form = reactive({
  topic: '',
  location: '',
  trainDate: '',
  format: '',
  participants: '',
  photoUrls: [] as string[],
})

function syncForm() {
  const d = data.value
  form.topic = d?.topic || ''
  form.location = d?.location || ''
  form.trainDate = d?.trainDate || ''
  form.format = d?.format || ''
  form.participants = d?.participants || ''
  form.photoUrls = d?.photoUrls?.length ? [...d.photoUrls] : []
}
watch(() => props.editing, (val) => { if (val) syncForm() })

function getSaveData() {
  return {
    completedBy: form.participants?.split('、')[0] || '',
    remark: `培训主题：${form.topic}；地点：${form.location}`,
    status: 'done' as const,
    formData: {
      topic: form.topic,
      location: form.location,
      trainDate: form.trainDate,
      format: form.format,
      participants: form.participants,
      photoUrls: form.photoUrls.filter(p => p.trim()),
    } as TrainingData,
  }
}

defineExpose({ getSaveData })
</script>

<style scoped>
/* 查看模式 */
.step-training { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); align-items: flex-start; }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); line-height: 1.6; }

.photo-grid { display: flex; gap: var(--spacing-md, 8px); flex-wrap: wrap; }
.photo-thumb { width: 91px; height: 92px; border-radius: var(--radius-md, 8px); overflow: hidden; background: var(--bg-sub-card); }
.photo-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* 照片上传 */
.photo-grid.edit { display: flex; gap: var(--spacing-md, 8px); flex-wrap: wrap; align-items: flex-start; }
.photo-thumb.edit {
  width: 91px; height: 92px; border-radius: var(--radius-md, 8px);
  background: var(--bg-sub-card); border: 1px dashed var(--border-high);
  display: flex; align-items: center; justify-content: center; position: relative;
}
.photo-placeholder { font-size: 28px; opacity: 0.4; }
.photo-remove {
  position: absolute; top: -6px; right: -6px;
  width: 20px; height: 20px; border-radius: 50%; border: none;
  background: var(--semantic-danger, #DC2626); color: #fff;
  font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.photo-add {
  width: 91px; height: 92px; border-radius: var(--radius-md, 8px);
  border: 1px dashed var(--border-high); background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.photo-add:hover { background: var(--bg-sub-card); border-color: var(--accent-primary); }
.photo-add-icon { font-size: 28px; color: var(--text-muted); }
.photo-hint { font-size: var(--font-xs, 12px); color: var(--text-muted); margin-top: var(--spacing-xs, 4px); }
</style>

<style>
@import './shared-form.css';
</style>
