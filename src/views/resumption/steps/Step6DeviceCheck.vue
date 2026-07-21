<template>
  <div class="step-device">
    <template v-if="!editing">
      <div class="view-body">
        <div class="info-row"><span class="info-label">执行角色</span><span class="info-value">{{ stepMeta?.executor || '—' }}</span></div>
        <div v-if="stepMeta?.sixOneLabel" class="info-row"><span class="info-label">法规依据</span><span class="info-value">{{ stepMeta.sixOneLabel }}</span></div>

        <div class="stat-row" v-if="devices.length">
          <div class="stat-item"><span class="stat-num">{{ devices.length }}</span><span class="stat-label">设备总数</span></div>
          <div class="stat-item"><span class="stat-num checked">{{ checkedCount }}</span><span class="stat-label">已检查</span></div>
          <div class="stat-item"><span class="stat-num" :class="abnormalCount > 0 ? 'abnormal' : ''">{{ abnormalCount }}</span><span class="stat-label">异常</span></div>
        </div>

        <div class="info-row" v-if="devices.length">
          <span class="info-label">设备清单</span>
          <div class="device-list-readonly">
            <div v-for="d in devices" :key="d.id" class="device-row-readonly" @click="viewDevice(d)" :class="{ 'has-issue': d.result !== 'normal' }">
              <span class="d-name">{{ d.deviceName }}</span>
              <span class="d-loc">{{ d.location }}</span>
              <span class="d-checker">{{ d.checker }}</span>
              <span class="d-time">{{ d.checkTime }}</span>
              <span class="d-result" :class="'result-' + d.result">{{ resultLabel(d.result) }}</span>
              <span class="d-view">查看 ▸</span>
            </div>
          </div>
        </div>
        <div v-else class="info-row"><span class="info-label">设备清单</span><span class="info-value" style="color:var(--text-muted)">暂无设备检查记录</span></div>

        <div class="info-row"><span class="info-label">完成人</span><span class="info-value">{{ step.completedBy || '—' }}</span></div>
        <div class="info-row"><span class="info-label">完成时间</span><span class="info-value">{{ step.completedAt || '—' }}</span></div>
      </div>
    </template>

    <template v-else>
      <div class="drawer-form-body">
        <div class="stat-row" v-if="form.devices.length">
          <div class="stat-item"><span class="stat-num">{{ form.devices.length }}</span><span class="stat-label">设备总数</span></div>
          <div class="stat-item"><span class="stat-num checked">{{ form.devices.filter(d => d.checkTime).length }}</span><span class="stat-label">已检查</span></div>
          <div class="stat-item"><span class="stat-num abnormal">{{ form.devices.filter(d => d.result !== 'normal').length }}</span><span class="stat-label">异常</span></div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label"><span class="label-text">设备清单</span></div>
          <div class="form-control">
            <table class="device-table-edit">
              <thead><tr><th>设备名称</th><th>位置</th><th>检查人</th><th>检查时间</th><th></th></tr></thead>
              <tbody>
                <tr v-for="(d, i) in form.devices" :key="i">
                  <td><el-input v-model="d.deviceName" placeholder="设备名称/编号" maxlength="30" class="clean-input" /></td>
                  <td><el-input v-model="d.location" placeholder="位置" maxlength="30" class="clean-input" /></td>
                  <td><el-input v-model="d.checker" placeholder="检查人" maxlength="20" class="clean-input" /></td>
                  <td><el-input v-model="d.checkTime" placeholder="如：02-05" class="clean-input" /></td>
                  <td class="td-center"><button class="btn-remove-row" @click="form.devices.splice(i,1)" :disabled="form.devices.length<=1">✕</button></td>
                </tr>
              </tbody>
            </table>
            <button class="btn-add-row" @click="form.devices.push({ id: Date.now(), deviceName:'', location:'', checker:'', checkTime:'', result:'normal', checkItems: DEFAULT_CHECK_ITEMS.map(l=>({label:l,checked:false})), handling:'', photos:[] })">+ 添加设备</button>
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label"><span class="label-text">备注</span></div>
          <div class="form-control"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" maxlength="200" class="clean-input" /></div>
        </div>
      </div>
    </template>

    <!-- 设备详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="viewingDevice?.deviceName || '设备详情'" width="700px" :close-on-click-modal="false">
      <template v-if="viewingDevice">
        <div class="detail-stat-row">
          <div class="d-stat-item">
            <span class="d-stat-val" :class="viewingDevice.result === 'normal' ? 'text-green' : 'text-red'">{{ resultLabel(viewingDevice.result) }}</span>
            <span class="d-stat-lbl">检查结果</span>
          </div>
        </div>

        <div class="detail-tabs">
          <span class="d-tab active">设备信息</span>
          <span class="d-tab">本次检查</span>
          <span class="d-tab">历史记录</span>
        </div>

        <div class="detail-section">
          <div class="section-title">基本信息</div>
          <div class="info-grid-2col">
            <div class="info-item-d"><span class="d-lbl">设备名称</span><span class="d-val">{{ viewingDevice.deviceName }}</span></div>
            <div class="info-item-d"><span class="d-lbl">安装位置</span><span class="d-val">{{ viewingDevice.location }}</span></div>
            <div class="info-item-d"><span class="d-lbl">检查人</span><span class="d-val">{{ viewingDevice.checker }}</span></div>
            <div class="info-item-d"><span class="d-lbl">检查时间</span><span class="d-val">{{ viewingDevice.checkTime }}</span></div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">检查项</div>
          <div class="check-items-grid">
            <div v-for="(ci, i) in viewingDevice.checkItems" :key="i" class="ci-row">
              <span :class="ci.checked ? 'ci-checked' : 'ci-unchecked'">{{ ci.checked ? '☑' : '☐' }}</span>
              <span>{{ ci.label }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">处理情况</div>
          <div class="info-item-d"><span class="d-lbl">处理措施</span><span class="d-val">{{ viewingDevice.handling || '—' }}</span></div>
        </div>

        <div class="detail-section">
          <div class="section-title">检查照片</div>
          <div v-if="viewingDevice.photos.length" class="photo-chips">
            <span v-for="(_, i) in viewingDevice.photos" :key="i" class="photo-chip">📷 照片 {{ i + 1 }}</span>
          </div>
          <span v-else style="color:var(--text-muted);font-size:var(--font-small, 14px)">暂无照片</span>
        </div>
      </template>
      <template #footer>
        <button class="btn-default" @click="detailVisible = false">关闭</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
import { STEP_META } from '@/types/resumption'
import type { ResumptionStep, DeviceCheckItem } from '@/types/resumption'

const props = defineProps<{ step: ResumptionStep; editing: boolean }>()
const stepMeta = STEP_META.find(m => m.type === props.step.stepType)

const DEFAULT_CHECK_ITEMS = ['外观无异常', '运行无异响', '安全防护到位', '线路无老化', '润滑正常', '温度正常']

interface DeviceFormData { devices: DeviceCheckItem[] }
const data = computed<DeviceFormData | null>(() => props.step.formData as unknown as DeviceFormData || null)
const devices = computed<DeviceCheckItem[]>(() => data.value?.devices || [])
const checkedCount = computed(() => devices.value.filter(d => d.checkTime).length)
const abnormalCount = computed(() => devices.value.filter(d => d.result !== 'normal').length)
const resultLabels: Record<string, string> = { normal: '正常', needs_repair: '需维修', disabled: '已停用' }
function resultLabel(v: string) { return resultLabels[v] || v }

const form = reactive<{ devices: DeviceCheckItem[]; remark: string }>({ devices: [], remark: '' })

function syncForm() {
  form.devices = data.value?.devices?.map(d => ({
    ...d, checkItems: d.checkItems?.map(ci => ({ ...ci })) || DEFAULT_CHECK_ITEMS.map(l => ({ label: l, checked: false })),
  })) || []
  form.remark = props.step.remark
}
watch(() => props.editing, (val) => { if (val) syncForm() })

function getSaveData() {
  const hasDone = form.devices.some(d => d.deviceName.trim())
  return {
    completedBy: form.devices.find(d => d.checker)?.checker || '',
    remark: form.remark,
    status: hasDone ? 'done' as const : 'pending' as const,
    formData: { devices: form.devices.filter(d => d.deviceName.trim()) },
  }
}

const detailVisible = ref(false)
const viewingDevice = ref<DeviceCheckItem | null>(null)
function viewDevice(d: DeviceCheckItem) { viewingDevice.value = d; detailVisible.value = true }

defineExpose({ getSaveData })
</script>

<style scoped>
.step-device { display: flex; flex-direction: column; flex: 1; }
.view-body { display: flex; flex-direction: column; gap: var(--spacing-lg, 12px); }
.info-row { display: flex; gap: var(--spacing-lg, 12px); }
.info-label { font-size: var(--font-body, 16px); color: var(--text-tertiary, #454545); min-width: 70px; flex-shrink: 0; }
.info-value { font-size: var(--font-body, 16px); color: var(--text-primary); }

.stat-row { display: flex; gap: 24px; padding: 12px 0; }
.stat-item { display: flex; flex-direction: column; gap: 2px; align-items: center; min-width: 80px; }
.stat-num { font-size: 28px; font-weight: 600; color: var(--text-primary); }
.stat-num.checked { color: var(--accent-primary); }
.stat-num.abnormal { color: var(--danger, #dc2626); }
.stat-label { font-size: var(--font-xs, 12px); color: var(--text-muted); }

.device-list-readonly { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.device-row-readonly {
  display: flex; gap: 12px; align-items: center; padding: 8px 12px;
  border-radius: var(--radius-sm, 6px); background: var(--bg-sub-card); cursor: pointer; transition: background .15s;
  font-size: var(--font-small, 14px);
}
.device-row-readonly:hover { background: var(--accent-primary08); }
.device-row-readonly.has-issue { border-left: 3px solid var(--warning, #D97706); }
.d-name { font-weight: 500; color: var(--text-primary); min-width: 120px; }
.d-loc { color: var(--text-secondary); min-width: 80px; }
.d-checker { color: var(--text-secondary); min-width: 60px; }
.d-time { color: var(--text-muted); min-width: 70px; }
.d-result { padding: 2px 8px; border-radius: 4px; font-size: var(--font-xs, 12px); }
.result-normal { background: var(--success-bg, rgba(5,150,105,0.1)); color: var(--success, #059669); }
.result-needs_repair { background: var(--warning-bg); color: var(--warning, #D97706); }
.result-disabled { background: var(--danger-bg); color: var(--danger, #dc2626); }
.d-view { color: var(--accent-primary); margin-left: auto; }

.device-table-edit { width: 100%; border-collapse: collapse; }
.device-table-edit th { text-align: left; font-size: var(--font-xs, 12px); color: var(--text-muted); padding: 4px 2px; border-bottom: 1px solid var(--border-low); }
.device-table-edit td { padding: 3px 2px; }
.td-center { text-align: center; }

/* ===== 设备详情 ===== */
.detail-stat-row { display: flex; gap: 24px; padding: 8px 0 16px; }
.d-stat-item { display: flex; flex-direction: column; gap: 2px; }
.d-stat-val { font-size: 24px; font-weight: 600; }
.text-green { color: var(--success, #059669); }
.text-red { color: var(--danger, #dc2626); }
.d-stat-lbl { font-size: var(--font-xs, 12px); color: var(--text-muted); }

.detail-tabs {
  display: flex; gap: 0; border-bottom: 1px solid var(--border-default); margin-bottom: 16px;
}
.d-tab {
  padding: 8px 24px; font-size: var(--font-small, 14px); color: var(--text-secondary);
  cursor: pointer; border-bottom: 2px solid transparent;
}
.d-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); font-weight: 500; }

.detail-section { margin-bottom: 16px; }
.section-title {
  background: var(--accent-primary06, rgba(24,144,255,0.06)); padding: 8px 12px;
  border-radius: var(--radius-sm, 6px); font-size: var(--font-body, 16px);
  font-weight: 500; color: var(--text-primary); margin-bottom: 10px;
}

.info-grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-item-d { display: flex; gap: 12px; align-items: baseline; }
.d-lbl { font-size: var(--font-small, 14px); color: var(--text-muted); min-width: 70px; }
.d-val { font-size: var(--font-body, 16px); color: var(--text-primary); }

.check-items-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.ci-row { display: flex; gap: 6px; align-items: center; font-size: var(--font-small, 14px); }
.ci-checked { color: var(--success, #059669); }
.ci-unchecked { color: var(--text-muted); }

.photo-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.photo-chip {
  padding: 6px 12px; background: var(--bg-sub-card); border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px); color: var(--text-secondary);
}
</style>

<style>
@import './shared-form.css';
</style>
