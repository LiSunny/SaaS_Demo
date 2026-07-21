<template>
  <div class="step-disclosure">
    <template v-if="!editing">
      <div class="view-body">
        <div class="info-row"><span class="info-label">执行角色</span><span class="info-value">{{ stepMeta?.executor || '—' }}</span></div>
        <div v-if="stepMeta?.sixOneLabel" class="info-row"><span class="info-label">法规依据</span><span class="info-value">{{ stepMeta.sixOneLabel }}</span></div>
        <template v-if="data">
          <div class="info-row"><span class="info-label">交底日期</span><span class="info-value">{{ data.discloseDate || '—' }}</span></div>
          <div class="info-row"><span class="info-label">交底人</span><span class="info-value">{{ data.discloser || '—' }}</span></div>
          <div class="info-row" v-if="data.records?.length">
            <span class="info-label">交底记录</span>
            <div class="disclosure-list">
              <div v-for="(r, i) in data.records" :key="i" class="d-record">
                <span class="d-pos">{{ r.position }}</span>
                <span class="d-proc">{{ r.procedureName }}</span>
                <span class="d-people">→ {{ r.assignees }}</span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="info-row"><span class="info-value" style="color:var(--text-muted)">暂无交底记录</span></div>
        <div class="info-row"><span class="info-label">完成人</span><span class="info-value">{{ step.completedBy || '—' }}</span></div>
        <div class="info-row"><span class="info-label">完成时间</span><span class="info-value">{{ step.completedAt || '—' }}</span></div>
      </div>
    </template>

    <template v-else>
      <div class="drawer-form-body">
        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">交底日期</span></div>
          <div class="form-control"><el-input v-model="form.discloseDate" placeholder="如：2026-02-05" class="clean-input" /></div>
        </div>
        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">交底人</span></div>
          <div class="form-control"><el-input v-model="form.discloser" placeholder="交底人姓名" maxlength="20" class="clean-input" /></div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">交底记录</span></div>
          <div class="form-control">
            <table class="d-table">
              <thead><tr><th class="col-d-pos">岗位/工种</th><th class="col-d-proc">规程名称</th><th class="col-d-people">被交底人</th><th class="col-d-op"></th></tr></thead>
              <tbody>
                <tr v-for="(r, i) in form.records" :key="i">
                  <td><el-input v-model="r.position" placeholder="岗位" maxlength="20" class="clean-input" /></td>
                  <td><el-input v-model="r.procedureName" placeholder="规程名称" maxlength="50" class="clean-input" /></td>
                  <td><el-input v-model="r.assignees" placeholder="姓名（多人用、分隔）" maxlength="100" class="clean-input" /></td>
                  <td class="td-center"><button class="btn-remove-row" @click="form.records.splice(i,1)" :disabled="form.records.length<=1">✕</button></td>
                </tr>
              </tbody>
            </table>
            <button class="btn-add-row" @click="form.records.push({ position:'', procedureName:'', assignees:'' })">+ 添加交底记录</button>
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label"><span class="label-text">备注</span></div>
          <div class="form-control"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" maxlength="200" class="clean-input" /></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { STEP_META } from '@/types/resumption'
import type { ResumptionStep, TechDisclosureData } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean }>()
const stepMeta = STEP_META.find(m => m.type === props.step.stepType)
const data = computed<TechDisclosureData | null>(() => props.step.formData as unknown as TechDisclosureData || null)

const form = reactive<{
  discloseDate: string; discloser: string;
  records: { position: string; procedureName: string; assignees: string }[]; remark: string
}>({ discloseDate: '', discloser: '', records: [{ position: '', procedureName: '', assignees: '' }], remark: '' })

function syncForm() {
  const d = data.value
  form.discloseDate = d?.discloseDate || ''
  form.discloser = d?.discloser || ''
  form.records = d?.records?.map(r => ({ ...r })) || [{ position: '', procedureName: '', assignees: '' }]
  form.remark = props.step.remark
}
watch(() => props.editing, (val) => { if (val) syncForm() })

function getSaveData() {
  return {
    completedBy: form.discloser,
    remark: form.remark,
    status: 'done' as const,
    formData: { records: form.records.filter(r => r.position.trim()), discloseDate: form.discloseDate, discloser: form.discloser, photoUrls: data.value?.photoUrls || [] } as TechDisclosureData,
  }
}
defineExpose({ getSaveData })
</script>

<style scoped>
.step-disclosure { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); }
.disclosure-list { display: flex; flex-direction: column; gap: 6px; }
.d-record { display: flex; gap: 8px; align-items: center; padding: 6px 10px; background: var(--bg-sub-card); border-radius: var(--radius-sm, 6px); font-size: var(--font-small, 14px); }
.d-pos { color: var(--accent-primary); font-weight: 500; min-width: 80px; }
.d-proc { color: var(--text-primary); flex: 1; }
.d-people { color: var(--text-muted); }

.d-table { width: 100%; border-collapse: collapse; }
.d-table th { text-align: left; font-size: var(--font-xs, 12px); color: var(--text-muted); padding: 4px 2px; border-bottom: 1px solid var(--border-low); }
.d-table td { padding: 3px 2px; }
.col-d-pos { width: 100px; }
.col-d-proc { flex: 1; }
.col-d-people { width: 160px; }
.col-d-op { width: 30px; }
.td-center { text-align: center; }

</style>

<style>
@import './shared-form.css';
</style>
