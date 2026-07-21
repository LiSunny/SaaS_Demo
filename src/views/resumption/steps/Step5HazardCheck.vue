<template>
  <div class="step-hazard">
    <template v-if="!editing">
      <div class="view-body">
        <div class="info-row"><span class="info-label">执行角色</span><span class="info-value">{{ stepMeta?.executor || '—' }}</span></div>
        <div v-if="stepMeta?.sixOneLabel" class="info-row"><span class="info-label">法规依据</span><span class="info-value">{{ stepMeta.sixOneLabel }}</span></div>
        <div class="info-row"><span class="info-label">排查日期</span><span class="info-value">{{ data?.foundAt || '—' }}</span></div>
        <div class="info-row"><span class="info-label">排查人员</span><span class="info-value">{{ data?.foundBy || step.completedBy || '—' }}</span></div>

        <div class="info-row" v-if="data?.hazards?.length">
          <span class="info-label">隐患清单</span>
          <div class="hazard-list-readonly">
            <div v-for="h in data.hazards" :key="h.id" class="hazard-card-readonly" :class="'level-' + h.level">
              <div class="h-card-top">
                <span class="h-level-tag">{{ h.level === 'major' ? '重大' : '一般' }}</span>
                <span class="h-status-tag">{{ hazardStatusLabel(h.status) }}</span>
              </div>
              <p class="h-desc">{{ h.description }}</p>
              <div class="h-meta" v-if="h.foundBy">排查人：{{ h.foundBy }} | {{ h.foundAt }}</div>
            </div>
          </div>
        </div>
        <div v-else class="info-row"><span class="info-label">隐患清单</span><span class="info-value" style="color:var(--text-muted)">无隐患记录</span></div>

        <div class="info-row"><span class="info-label">完成人</span><span class="info-value">{{ step.completedBy || '—' }}</span></div>
        <div class="info-row"><span class="info-label">完成时间</span><span class="info-value">{{ step.completedAt || '—' }}</span></div>
      </div>
    </template>

    <template v-else>
      <div class="drawer-form-body">
        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">排查日期</span></div>
          <div class="form-control"><el-input v-model="form.foundAt" placeholder="如：2026-02-05" class="clean-input" /></div>
        </div>
        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">排查人员</span></div>
          <div class="form-control"><el-input v-model="form.foundBy" placeholder="排查人员姓名" maxlength="50" class="clean-input" /></div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label"><span class="label-text">隐患清单</span><span class="label-count">{{ form.hazards.length }} 条</span></div>
          <div class="form-control">
            <div v-for="(h, i) in form.hazards" :key="i" class="hazard-edit-card">
              <div class="h-edit-row">
                <el-select v-model="h.level" style="width:90px" :teleported="false" popper-class="fi-popper" class="clean-select">
                  <el-option label="一般" value="general" />
                  <el-option label="重大" value="major" />
                </el-select>
                <el-input v-model="h.description" placeholder="隐患描述" maxlength="200" class="clean-input flex-1" />
                <button class="btn-remove-row" @click="form.hazards.splice(i,1)" :disabled="form.hazards.length<=1">✕</button>
              </div>
            </div>
            <button class="btn-add-row" @click="form.hazards.push({ id: Date.now(), description:'', level:'general', photos:[], status:'found' as const, foundAt: form.foundAt, foundBy: form.foundBy })">+ 添加隐患</button>
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
import type { ResumptionStep, HazardRecord } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean }>()
const stepMeta = STEP_META.find(m => m.type === props.step.stepType)

interface HazardFormData { foundAt: string; foundBy: string; hazards: HazardRecord[] }
const data = computed<HazardFormData | null>(() => props.step.formData as unknown as HazardFormData || null)

const hazardStatusLabels: Record<string, string> = { found:'待处置', disposed:'已处置', rectified:'已整改', accepted:'已验收', archived:'已归档' }
function hazardStatusLabel(s: string) { return hazardStatusLabels[s] || s }

const form = reactive<{ foundAt: string; foundBy: string; hazards: HazardRecord[]; remark: string }>({
  foundAt: '', foundBy: '', hazards: [], remark: '',
})

function syncForm() {
  const d = data.value
  form.foundAt = d?.foundAt || props.step.completedAt?.slice(0, 10) || ''
  form.foundBy = d?.foundBy || props.step.completedBy || ''
  form.hazards = d?.hazards?.map(h => ({ ...h })) || [{ id: Date.now(), description:'', level:'general', photos:[], status:'found', foundAt:'', foundBy:'' }]
  form.remark = props.step.remark
}
watch(() => props.editing, (val) => { if (val) syncForm() })

function getSaveData() {
  return {
    completedBy: form.foundBy, remark: form.remark,
    status: form.hazards.some(h => h.description.trim()) ? 'done' as const : 'pending' as const,
    formData: { foundAt: form.foundAt, foundBy: form.foundBy, hazards: form.hazards.filter(h => h.description.trim()) },
  }
}
defineExpose({ getSaveData })
</script>

<style scoped>
.step-hazard { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); }

.hazard-list-readonly { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.hazard-card-readonly { padding: 10px; border-radius: var(--radius-md, 8px); background: var(--bg-sub-card); border-left: 3px solid var(--border-default); }
.hazard-card-readonly.level-major { border-left-color: var(--danger, #dc2626); background: var(--danger-bg, rgba(220,38,38,0.05)); }
.h-card-top { display: flex; gap: 8px; align-items: center; margin-bottom: 6px; }
.h-level-tag { padding: 1px 8px; border-radius: 4px; font-size: var(--font-xs, 12px); font-weight: 500; }
.level-general .h-level-tag { background: var(--warning-bg); color: var(--warning, #D97706); }
.level-major .h-level-tag { background: var(--danger-bg); color: var(--danger, #dc2626); }
.h-status-tag { font-size: var(--font-xs, 12px); color: var(--text-muted); }
.h-desc { font-size: var(--font-small, 14px); color: var(--text-primary); margin: 0 0 4px; }
.h-meta { font-size: var(--font-xs, 12px); color: var(--text-muted); }

.label-count { font-size: var(--font-xs, 12px); color: var(--text-muted); }
.flex-1 { flex: 1; }

.hazard-edit-card { padding: 8px; background: var(--bg-sub-card); border-radius: var(--radius-sm, 6px); margin-bottom: 4px; }
.h-edit-row { display: flex; gap: 8px; align-items: center; }

</style>

<style>
@import './shared-form.css';
</style>
