<template>
  <div class="step-pledge">
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

        <div class="pledge-doc-readonly" v-if="pledgeData?.title">
          <div class="pledge-doc-title">{{ pledgeData.title }}</div>
          <pre class="pledge-doc-content">{{ pledgeData.content }}</pre>
        </div>

        <div class="signer-section" v-if="pledgeData?.signers?.length">
          <span class="info-label">签署确认（{{ pledgedCount }}/{{ pledgeData.signers.length }}）</span>
          <table class="signer-table">
            <thead>
              <tr><th>姓名</th><th>岗位/工种</th><th>签署</th><th>日期</th></tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in pledgeData.signers" :key="i">
                <td>{{ s.name }}</td>
                <td>{{ s.role }}</td>
                <td><span :class="s.signed ? 'signed-yes' : 'signed-no'">{{ s.signed ? '✓ 已签署' : '待签署' }}</span></td>
                <td>{{ s.signedAt || '—' }}</td>
              </tr>
            </tbody>
          </table>
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

    <template v-else>
      <div class="drawer-form-body">
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">责任状名称</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.title" placeholder="如：2026年春节后安全生产责任状" maxlength="50" class="clean-input" />
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">责任状内容</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入责任状内容" class="clean-input" />
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">签署确认</span>
          </div>
          <div class="form-control">
            <table class="signer-table edit">
              <thead>
                <tr><th class="col-s-name">姓名</th><th class="col-s-role">岗位/工种</th><th class="col-s-check">签署</th><th class="col-s-date">日期</th><th class="col-s-op"></th></tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in form.signers" :key="i">
                  <td><el-input v-model="s.name" placeholder="姓名" maxlength="20" class="clean-input" /></td>
                  <td><el-input v-model="s.role" placeholder="工种" maxlength="20" class="clean-input" /></td>
                  <td class="td-center"><el-checkbox v-model="s.signed" /></td>
                  <td><el-input v-model="s.signedAt" placeholder="日期" class="clean-input" /></td>
                  <td class="td-center"><button class="btn-remove-row" @click="removeSigner(i)" :disabled="form.signers.length <= 1">✕</button></td>
                </tr>
              </tbody>
            </table>
            <button class="btn-add-row" @click="addSigner">+ 添加签署人</button>
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-text">备注</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" maxlength="200" class="clean-input" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { STEP_META } from '@/types/resumption'
import { DEFAULT_PLEDGE_CONTENT } from '@/api/adapters/resumption-dao'
import type { ResumptionStep, PledgeData } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean }>()
const stepMeta = STEP_META.find(m => m.type === props.step.stepType)

const pledgeData = computed<PledgeData | null>(() => props.step.formData as unknown as PledgeData || null)
const pledgedCount = computed(() => pledgeData.value?.signers.filter(s => s.signed).length ?? 0)

interface SignerForm { name: string; role: string; signed: boolean; signedAt: string }

const form = reactive<{ title: string; content: string; signers: SignerForm[]; remark: string }>({
  title: '', content: '', signers: [], remark: '',
})

function syncForm() {
  const fd = pledgeData.value
  form.title = fd?.title || '安全生产责任状'
  form.content = fd?.content || DEFAULT_PLEDGE_CONTENT
  form.signers = fd?.signers?.map(s => ({ ...s })) || []
  form.remark = props.step.remark
}
watch(() => props.editing, (val) => { if (val) syncForm() })

function addSigner() { form.signers.push({ name: '', role: '', signed: false, signedAt: '' }) }
function removeSigner(i: number) { if (form.signers.length > 1) form.signers.splice(i, 1) }

function getSaveData() {
  return {
    completedBy: form.signers.find(s => s.signed)?.name || '',
    remark: form.remark,
    status: 'done' as const,
    formData: { title: form.title, content: form.content, signers: form.signers, photoUrl: pledgeData.value?.photoUrl || '' } as PledgeData,
  }
}
defineExpose({ getSaveData })
</script>

<style scoped>
.step-pledge { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); }

.pledge-doc-readonly {
  background: var(--bg-sub-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px); padding: var(--spacing-lg, 12px); margin-top: 4px;
}
.pledge-doc-title { font-size: var(--font-body, 16px); font-weight: 600; color: var(--text-primary); margin-bottom: 8px; text-align: center; }
.pledge-doc-content { white-space: pre-wrap; font-size: var(--font-small, 14px); color: var(--text-secondary); line-height: 1.8; font-family: inherit; margin: 0; }

.signer-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
.signer-table th { text-align: left; font-size: var(--font-xs, 12px); color: var(--text-muted); padding: 6px 4px; border-bottom: 1px solid var(--border-low); }
.signer-table td { padding: 5px 4px; font-size: var(--font-small, 14px); border-bottom: 1px solid var(--border-low); }
.signer-table.edit td { padding: 3px 2px; border-bottom: none; }
.signed-yes { color: var(--success, #059669); font-weight: 500; }
.signed-no { color: var(--text-muted); }
.td-center { text-align: center; }
.col-s-name { min-width: 70px; }
.col-s-role { min-width: 80px; }
.col-s-check { width: 50px; text-align: center; }
.col-s-date { width: 90px; }
.col-s-op { width: 30px; }

/* ===== 编辑模式 ===== */
</style>

<style>
@import './shared-form.css';
</style>
