<template>
  <el-drawer
    :model-value="visible"
    :title="isEdit ? '编辑设备' : '新增设备'"
    size="640px"
    direction="rtl"
    class="add-device-drawer"
    @update:model-value="$emit('update:visible', $event)"
    @closed="$emit('update:visible', false)"
  >
    <div class="drawer-body">
      <!-- ===== 第 1 步：选择归属单位 ===== -->
      <template v-if="step === 1">
        <p class="step-desc">
          设备必须挂在项目内的单位下，选择归属单位后录入设备信息。<span v-if="scopeNodeLabel">当前仅显示「{{ scopeNodeLabel }}」下的单位。</span>
        </p>
        <div class="search-input-wrap unit-search">
          <input v-model="unitKeyword" class="fi-input" placeholder="搜索单位名称" />
          <button v-if="unitKeyword" class="fi-clear" @click="unitKeyword = ''">
            <AppIcon name="clear" />
          </button>
          <AppIcon name="search" class="fi-icon" />
        </div>

        <div v-if="unitOptions.length" class="unit-list">
          <button
            v-for="opt in unitOptions"
            :key="opt.id"
            class="unit-option"
            @click="pickUnit(opt.id)"
          >
            <div class="option-main">
              <span class="option-name">{{ opt.name }}</span>
              <span class="option-path">{{ opt.path }}</span>
            </div>
            <span class="option-count">已有设备 {{ opt.deviceCount }} 台</span>
          </button>
        </div>
        <div v-else class="unit-empty">
          <p class="empty-text">{{ unitKeyword ? '没有匹配的单位' : '本项目还没有接入单位' }}</p>
          <p v-if="!unitKeyword" class="empty-tip">先去「接入单位」接入单位，再来添加设备。</p>
        </div>

        <div class="drawer-footer-bar">
          <span class="foot-text">设备不允许项目直属，必须挂在单位下</span>
          <div class="foot-actions">
            <button class="btn-default" @click="$emit('update:visible', false)">取消</button>
          </div>
        </div>
      </template>

      <!-- ===== 第 2 步：设备信息 ===== -->
      <template v-else>
        <div class="chosen-unit">
          <span class="chosen-label">归属单位</span>
          <span class="chosen-name">{{ chosenUnitName }}</span>
          <button v-if="!isEdit" class="btn-link change-btn" @click="step = 1">更换</button>
          <span v-else class="edit-hint">编辑时不可更换归属单位</span>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">设备名称</span></div>
          <div class="form-control">
            <el-input v-model="form.name" placeholder="请输入设备名称" maxlength="50" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">设备类型</span></div>
          <div class="form-control">
            <el-radio-group v-model="form.type" class="type-group">
              <el-radio-button v-for="t in DEVICE_TYPE_OPTIONS" :key="t" :value="t">{{ t }}</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-required">*</span><span class="label-text">设备编码</span></div>
          <div class="form-control">
            <div class="code-row">
              <el-input v-model="form.code" placeholder="请输入设备编码" maxlength="32" />
              <button class="btn-default scan-btn" @click="scanPlaceholder">
                <AppIcon name="camera" class="btn-icon" />扫码
              </button>
            </div>
            <div v-if="codeError" class="form-error">{{ codeError }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-text">安装位置</span></div>
          <div class="form-control">
            <el-input v-model="form.location" placeholder="默认带出单位地址" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-text">在线状态</span></div>
          <div class="form-control">
            <el-switch v-model="form.online" active-text="在线" inactive-text="离线" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-text">接入时间</span></div>
          <div class="form-control">
            <el-date-picker v-model="form.connectedAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label"><span class="label-text">备注</span></div>
          <div class="form-control">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
          </div>
        </div>

        <div class="drawer-footer-bar">
          <span class="foot-text">保存后单位设备数、树徽标与头部 KPI 会同步更新</span>
          <div class="foot-actions">
            <button v-if="!isEdit" class="btn-default" @click="step = 1">上一步</button>
            <button v-if="!isEdit" class="btn-default" @click="save(true)">保存并继续</button>
            <button class="btn-primary" @click="save(false)">保存</button>
          </div>
        </div>
      </template>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import AppIcon from '@/components/base/AppIcon.vue'
import { DEVICE_TYPE_OPTIONS, useProjectOpsStore } from '@/stores/project-ops'
import type { DeviceType } from '@/types/project-ops'

/**
 * AddDeviceDrawer.vue — 新增 / 编辑设备抽屉（两步）
 *
 * 口径见 docs/项目管理/product-design.md §6.5、§7.2.4
 *   第 1 步：选择归属单位（按层级分组，展示单位名称 + 节点路径 + 已有设备数）
 *   第 2 步：设备信息（名称 / 类型 / 编码必填，编码重复红字提示）
 *   保存并继续：保留单位、清空设备字段
 *   编辑模式：跳过单位选择、归属单位不可改，只改设备自身字段
 *   scopeNodeId：入口限定单位范围（树节点 → 添加设备，design.md §6.5.1 入口 3）
 */

const props = defineProps<{
  visible: boolean
  projectId: string
  presetUnitId?: string | null
  /** 限定可选单位所在的层级节点（含下级） */
  scopeNodeId?: string | null
  /** 编辑模式：待编辑设备 id */
  editDeviceId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved', payload: { unitId: string; unitName: string; deviceId?: string }): void
}>()

const store = useProjectOpsStore()

const isEdit = computed(() => !!props.editDeviceId)
const step = ref(1)
const unitKeyword = ref('')
const unitId = ref<string | null>(null)
const codeError = ref('')

const form = ref({
  name: '',
  type: '烟感' as DeviceType,
  code: '',
  location: '',
  online: true,
  connectedAt: '',
  remark: '',
})

watch(
  () => props.visible,
  val => {
    if (!val) return
    codeError.value = ''
    unitKeyword.value = ''
    if (props.editDeviceId) {
      // 编辑模式：直接进第 2 步，回填设备字段
      const d = store.devices.find(x => x.id === props.editDeviceId)
      unitId.value = d?.unitId ?? null
      step.value = 2
      form.value = {
        name: d?.name ?? '',
        type: d?.type ?? '烟感',
        code: d?.code ?? '',
        location: d?.location ?? '',
        online: d?.online ?? true,
        connectedAt: d?.connectedAt ?? '',
        remark: d?.remark ?? '',
      }
      return
    }
    if (props.presetUnitId) {
      unitId.value = props.presetUnitId
      step.value = 2
      resetDeviceForm()
      prefillLocation()
    } else {
      unitId.value = null
      step.value = 1
    }
  },
)

// ===== 第 1 步：单位选项 =====
interface UnitOption {
  id: string
  name: string
  path: string
  deviceCount: number
}

/** 入口限定的层级节点名称（树节点 → 添加设备） */
const scopeNodeLabel = computed(() =>
  props.scopeNodeId ? store.nodePathText(props.scopeNodeId) : '',
)

const unitOptions = computed<UnitOption[]>(() => {
  const kw = unitKeyword.value.trim()
  // 有 scopeNodeId 时只列该节点（含下级）下的单位（design.md §6.5.1 入口 3）
  const rows = props.scopeNodeId
    ? store.unitsOfNode(props.projectId, props.scopeNodeId, true)
    : store.unitRows(props.projectId)
  return rows
    .map(r => ({
      id: r.id,
      name: r.name,
      path: store.nodePathText(r.nodeId),
      deviceCount: r.deviceCount,
    }))
    .filter(o => (kw ? o.name.includes(kw) : true))
    .sort((a, b) => a.path.localeCompare(b.path))
})

function pickUnit(id: string) {
  unitId.value = id
  resetDeviceForm()
  prefillLocation()
  step.value = 2
}

function prefillLocation() {
  const unit = store.units.find(u => u.id === unitId.value)
  form.value.location = unit?.address ?? ''
}

const chosenUnitName = computed(() => {
  const row = store.unitRows(props.projectId).find(r => r.id === unitId.value)
  return row?.name ?? '—'
})

function resetDeviceForm() {
  form.value = {
    name: '',
    type: '烟感',
    code: '',
    location: form.value.location,
    online: true,
    connectedAt: '',
    remark: '',
  }
  codeError.value = ''
}

function scanPlaceholder() {
  ElMessage.info('扫码枪接入为后续迭代，本期请手动输入设备编码')
}

// ===== 第 2 步：保存 =====
function save(keepUnit: boolean) {
  if (!unitId.value) {
    ElMessage.warning('请选择归属单位')
    return
  }
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入设备名称')
    return
  }
  if (!form.value.code.trim()) {
    ElMessage.warning('请输入设备编码')
    return
  }

  if (props.editDeviceId) {
    // 编辑：只改设备自身字段，归属单位不变
    const r = store.updateDevice(props.editDeviceId, {
      name: form.value.name,
      type: form.value.type,
      code: form.value.code,
      location: form.value.location,
      online: form.value.online,
      remark: form.value.remark,
    })
    if (!r.ok) {
      codeError.value = r.msg === '设备编码重复' ? r.msg : ''
      ElMessage.warning(r.msg)
      return
    }
    codeError.value = ''
    ElMessage.success('保存成功')
    emit('saved', { unitId: unitId.value, unitName: chosenUnitName.value, deviceId: props.editDeviceId })
    emit('update:visible', false)
    return
  }

  const duplicated = store.devices.some(
    d => d.projectId === props.projectId && d.code === form.value.code.trim(),
  )
  if (duplicated) {
    codeError.value = '设备编码重复'
    return
  }
  codeError.value = ''

  const r = store.addDevice({
    projectId: props.projectId,
    unitId: unitId.value,
    name: form.value.name,
    type: form.value.type,
    code: form.value.code,
    location: form.value.location,
    online: form.value.online,
    remark: form.value.remark,
  })
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  ElMessage.success('保存成功')
  emit('saved', { unitId: unitId.value, unitName: chosenUnitName.value, deviceId: r.deviceId })
  if (keepUnit) {
    resetDeviceForm()
    prefillLocation()
  } else {
    emit('update:visible', false)
  }
}
</script>

<style scoped>
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.step-desc {
  margin: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
  line-height: 1.6;
}

.unit-search { width: 260px; }
.unit-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 420px;
  overflow: auto;
}
.unit-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}
.unit-option:hover { border-color: var(--accent-primary); background: var(--accent-primary10); }
.option-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.option-name { font-size: var(--font-small, 14px); color: var(--text-primary); }
.option-path { font-size: 12px; color: var(--text-muted); }
.option-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

.unit-empty { padding: 40px 0; text-align: center; }
.empty-text { margin: 0 0 6px; font-size: var(--font-small, 14px); color: var(--text-muted); }
.empty-tip { margin: 0; font-size: 12px; color: var(--text-muted); }

.chosen-unit {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--accent-primary10);
  border-radius: var(--radius-sm, 6px);
}
.chosen-label { font-size: 12px; color: var(--text-muted); }
.chosen-name { font-size: var(--font-small, 14px); color: var(--accent-primary); font-weight: 500; }
.change-btn { margin-left: auto; font-size: var(--font-small, 14px); }
.edit-hint { margin-left: auto; font-size: 12px; color: var(--text-muted); }

.form-row { display: flex; align-items: center; gap: 16px; min-height: 36px; }
.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 100px;
  justify-content: flex-end;
}
.label-required { font-size: 18px; font-weight: 500; color: var(--semantic-danger, #DC2626); line-height: 1; flex-shrink: 0; }
.label-text { font-size: var(--font-body, 16px); font-weight: 400; color: var(--text-tertiary); white-space: nowrap; line-height: 1; }
.form-control { flex: 1; min-width: 0; position: relative; }
.form-error { font-size: 12px; color: var(--danger); margin-top: 4px; }
.w-full { width: 100% !important; }
.code-row { display: flex; gap: 8px; align-items: center; }
.scan-btn { height: 32px; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
.btn-icon { font-size: 13px; }
.type-group { flex-wrap: wrap; }

.drawer-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}
.foot-text { font-size: var(--font-small, 14px); color: var(--text-tertiary); }
.foot-actions { display: flex; gap: 8px; }
</style>
