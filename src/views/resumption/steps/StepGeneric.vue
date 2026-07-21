<template>
  <div class="step-generic">
    <template v-if="!editing">
      <div class="view-body">
        <div class="info-row">
          <span class="info-label">执行角色</span>
          <span class="info-value">{{ stepMeta?.executor || '—' }}</span>
        </div>
        <div v-if="stepMeta?.sixOneLabel" class="info-row">
          <span class="info-label">法规依据</span>
          <span class="info-value">{{ stepMeta.sixOneLabel }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成人</span>
          <span class="info-value">{{ step.completedBy || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">完成时间</span>
          <span class="info-value">{{ step.completedAt || '—' }}</span>
        </div>
        <div v-if="step.remark" class="info-row">
          <span class="info-label">备注</span>
          <span class="info-value remark-text">{{ step.remark }}</span>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="drawer-form-body">
        <div class="form-row">
          <div class="form-label">
            <span class="label-text">完成人</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.completedBy" placeholder="请输入完成人姓名" maxlength="20" class="clean-input" />
          </div>
        </div>
        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-text">备注</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="记录操作摘要" maxlength="200" class="clean-input" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { STEP_META } from '@/types/resumption'
import type { ResumptionStep } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean }>()
const stepMeta = STEP_META.find(m => m.type === props.step.stepType)

const form = reactive({ completedBy: '', remark: '' })

watch(() => props.editing, (val) => {
  if (val) {
    form.completedBy = props.step.completedBy
    form.remark = props.step.remark
  }
})

function getSaveData() {
  return {
    completedBy: form.completedBy,
    remark: form.remark,
    status: 'done' as const,
  }
}

defineExpose({ getSaveData })
</script>

<style scoped>
.step-generic { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); }
.remark-text { line-height: 1.6; color: var(--text-secondary); }

</style>

<style>
@import './shared-form.css';
</style>
