<template>
  <div class="test-data-page">
    <div class="page-header">
      <h2>测试数据管理</h2>
      <span class="page-desc">Agent 数据链测试工具：告警 / 隐患 / 设备 数据的查看与录入（免登录，仅本地 Demo 开放）</span>
    </div>

    <el-tabs v-model="activeTab" class="data-tabs" @tab-change="onTabChange">
      <!-- ===== 告警 ===== -->
      <el-tab-pane label="告警" name="alarms">
        <div class="filter-bar">
          <el-input v-model="alarms.q.keyword" placeholder="点位关键词" clearable class="fi-kw" @keyup.enter="loadAlarms(1)" />
          <el-select v-model="alarms.q.enterpriseId" placeholder="所属企业" clearable filterable class="fi-ent">
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
          <el-select v-model="alarms.q.status" placeholder="状态" clearable class="fi-st">
            <el-option v-for="s in ALARM_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button type="primary" @click="loadAlarms(1)">查询</el-button>
          <el-button @click="resetFilter('alarms')">重置</el-button>
          <div class="spacer" />
          <el-button type="primary" plain @click="openAlarmDialog()">新增告警</el-button>
        </div>
        <el-table :data="alarms.list" v-loading="alarms.loading" border stripe>
          <el-table-column prop="point" label="点位" min-width="180" />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column prop="level" label="等级" width="90">
            <template #default="{ row }"><span :class="levelClass(row.level)">{{ row.level }}</span></template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" />
          <el-table-column prop="enterpriseName" label="所属企业" min-width="140" />
          <el-table-column prop="occurredAt" label="发生时间" width="150">
            <template #default="{ row }">{{ fmtTime(row.occurredAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openAlarmDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeAlarm(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="alarms.q.page"
          :page-size="alarms.q.size"
          :total="alarms.total"
          layout="total, prev, pager, next"
          class="fi-pager"
          @current-change="loadAlarms()"
        />
      </el-tab-pane>

      <!-- ===== 隐患 ===== -->
      <el-tab-pane label="隐患" name="hazards">
        <div class="filter-bar">
          <el-input v-model="hazards.q.keyword" placeholder="位置关键词" clearable class="fi-kw" @keyup.enter="loadHazards(1)" />
          <el-select v-model="hazards.q.enterpriseId" placeholder="所属企业" clearable filterable class="fi-ent">
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
          <el-select v-model="hazards.q.status" placeholder="整改状态" clearable class="fi-st">
            <el-option v-for="s in HAZARD_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button type="primary" @click="loadHazards(1)">查询</el-button>
          <el-button @click="resetFilter('hazards')">重置</el-button>
          <div class="spacer" />
          <el-button type="primary" plain @click="openHazardDialog()">新增隐患</el-button>
        </div>
        <el-table :data="hazards.list" v-loading="hazards.loading" border stripe>
          <el-table-column prop="location" label="位置" min-width="180" />
          <el-table-column prop="category" label="类别" width="110" />
          <el-table-column prop="level" label="等级" width="90">
            <template #default="{ row }"><span :class="levelClass(row.level)">{{ row.level }}</span></template>
          </el-table-column>
          <el-table-column prop="status" label="整改状态" width="100" />
          <el-table-column prop="enterpriseName" label="所属企业" min-width="140" />
          <el-table-column prop="foundAt" label="发现日期" width="130">
            <template #default="{ row }">{{ fmtTime(row.foundAt, true) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openHazardDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeHazard(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="hazards.q.page"
          :page-size="hazards.q.size"
          :total="hazards.total"
          layout="total, prev, pager, next"
          class="fi-pager"
          @current-change="loadHazards()"
        />
      </el-tab-pane>

      <!-- ===== 设备 ===== -->
      <el-tab-pane label="设备" name="devices">
        <div class="filter-bar">
          <el-input v-model="devices.q.keyword" placeholder="设备名称关键词" clearable class="fi-kw" @keyup.enter="loadDevices(1)" />
          <el-select v-model="devices.q.enterpriseId" placeholder="所属企业" clearable filterable class="fi-ent">
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
          <el-select v-model="devices.q.status" placeholder="状态" clearable class="fi-st">
            <el-option v-for="s in DEVICE_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button type="primary" @click="loadDevices(1)">查询</el-button>
          <el-button @click="resetFilter('devices')">重置</el-button>
          <div class="spacer" />
          <el-button type="primary" plain @click="openDeviceDialog()">新增设备</el-button>
        </div>
        <el-table :data="devices.list" v-loading="devices.loading" border stripe>
          <el-table-column prop="name" label="设备名称" min-width="180" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }"><span :class="deviceStatusClass(row.status)">{{ row.status }}</span></template>
          </el-table-column>
          <el-table-column prop="location" label="位置" min-width="130" />
          <el-table-column prop="enterpriseName" label="所属企业" min-width="140" />
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDeviceDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="removeDevice(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="devices.q.page"
          :page-size="devices.q.size"
          :total="devices.total"
          layout="total, prev, pager, next"
          class="fi-pager"
          @current-change="loadDevices()"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- ===== 告警弹窗 ===== -->
    <el-dialog v-model="alarmDialog.visible" :title="alarmDialog.form.id ? '编辑告警' : '新增告警'" width="520px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="点位" required>
          <el-input v-model="alarmDialog.form.point" placeholder="如：教学楼烟感 A-101" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="alarmDialog.form.type" class="full">
            <el-option v-for="t in ALARM_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级" required>
          <el-select v-model="alarmDialog.form.level" class="full">
            <el-option v-for="l in ALARM_LEVELS" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="alarmDialog.form.status" class="full">
            <el-option v-for="s in ALARM_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="发生时间" required>
          <el-date-picker v-model="alarmDialog.form.occurredAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="full" placeholder="选择时间" />
        </el-form-item>
        <el-form-item label="所属企业" required>
          <el-select v-model="alarmDialog.form.enterpriseId" filterable class="full" placeholder="选择企业">
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="alarmDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="alarmDialog.saving" @click="saveAlarm">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 隐患弹窗 ===== -->
    <el-dialog v-model="hazardDialog.visible" :title="hazardDialog.form.id ? '编辑隐患' : '新增隐患'" width="520px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="位置" required>
          <el-input v-model="hazardDialog.form.location" placeholder="如：教学楼 1F 灭火器箱" />
        </el-form-item>
        <el-form-item label="类别" required>
          <el-select v-model="hazardDialog.form.category" class="full">
            <el-option v-for="c in HAZARD_CATEGORIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="等级" required>
          <el-select v-model="hazardDialog.form.level" class="full">
            <el-option v-for="l in HAZARD_LEVELS" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改状态" required>
          <el-select v-model="hazardDialog.form.status" class="full">
            <el-option v-for="s in HAZARD_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="发现日期" required>
          <el-date-picker v-model="hazardDialog.form.foundAt" type="date" value-format="YYYY-MM-DD" class="full" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="hazardDialog.form.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="所属企业" required>
          <el-select v-model="hazardDialog.form.enterpriseId" filterable class="full" placeholder="选择企业">
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="hazardDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="hazardDialog.saving" @click="saveHazard">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 设备弹窗 ===== -->
    <el-dialog v-model="deviceDialog.visible" :title="deviceDialog.form.id ? '编辑设备' : '新增设备'" width="520px" :close-on-click-modal="false">
      <el-form label-width="90px">
        <el-form-item label="设备名称" required>
          <el-input v-model="deviceDialog.form.name" placeholder="如：教学楼烟感 A-101" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="deviceDialog.form.type" class="full">
            <el-option v-for="t in DEVICE_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-select v-model="deviceDialog.form.status" class="full">
            <el-option v-for="s in DEVICE_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="deviceDialog.form.location" placeholder="可选" />
        </el-form-item>
        <el-form-item label="所属企业" required>
          <el-select v-model="deviceDialog.form.enterpriseId" filterable class="full" placeholder="选择企业">
            <el-option v-for="e in enterprises" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="deviceDialog.saving" @click="saveDevice">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getEnterprises,
  getAlarms,
  createAlarm,
  updateAlarm,
  deleteAlarm,
  getHazards,
  createHazard,
  updateHazard,
  deleteHazard,
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} from '@/api/test-data'

const ALARM_TYPES = ['火警', '电气故障', '烟感预警', '燃气预警']
const ALARM_LEVELS = ['紧急', '重要', '一般']
const ALARM_STATUS = ['未处理', '已处理']
const HAZARD_CATEGORIES = ['消防设施', '消防通道', '燃气安全', '电气安全']
const HAZARD_LEVELS = ['重大', '重要', '一般']
const HAZARD_STATUS = ['未整改', '整改中', '已整改']
const DEVICE_TYPES = ['烟感', '电气', '摄像头', '燃气', '手动']
const DEVICE_STATUS = ['在线', '离线', '故障']

const activeTab = ref('alarms')
const enterprises = ref<{ id: number; name: string }[]>([])

const makeQuery = () => ({ page: 1, size: 10, keyword: '', enterpriseId: undefined as number | undefined, status: '' })

const alarms = reactive({ q: makeQuery(), list: [] as any[], total: 0, loading: false })
const hazards = reactive({ q: makeQuery(), list: [] as any[], total: 0, loading: false })
const devices = reactive({ q: makeQuery(), list: [] as any[], total: 0, loading: false })

async function loadAlarms(page?: number) {
  if (page) alarms.q.page = page
  alarms.loading = true
  try {
    const r = await getAlarms({ ...alarms.q, status: alarms.q.status || undefined })
    alarms.list = r.data
    alarms.total = r.total
  } finally {
    alarms.loading = false
  }
}
async function loadHazards(page?: number) {
  if (page) hazards.q.page = page
  hazards.loading = true
  try {
    const r = await getHazards({ ...hazards.q, status: hazards.q.status || undefined })
    hazards.list = r.data
    hazards.total = r.total
  } finally {
    hazards.loading = false
  }
}
async function loadDevices(page?: number) {
  if (page) devices.q.page = page
  devices.loading = true
  try {
    const r = await getDevices({ ...devices.q, status: devices.q.status || undefined })
    devices.list = r.data
    devices.total = r.total
  } finally {
    devices.loading = false
  }
}

function resetFilter(kind: 'alarms' | 'hazards' | 'devices') {
  const sec = kind === 'alarms' ? alarms : kind === 'hazards' ? hazards : devices
  sec.q = makeQuery()
  if (kind === 'alarms') loadAlarms(1)
  else if (kind === 'hazards') loadHazards(1)
  else loadDevices(1)
}

/** Tab 切换：首次进入该 Tab 才加载对应数据 */
function onTabChange(name: string | number) {
  if (name === 'hazards' && hazards.total === 0 && hazards.list.length === 0) loadHazards()
  else if (name === 'devices' && devices.total === 0 && devices.list.length === 0) loadDevices()
  else if (name === 'alarms' && alarms.total === 0 && alarms.list.length === 0) loadAlarms()
}

// ===== 告警弹窗 =====
const alarmDialog = reactive({
  visible: false,
  saving: false,
  form: {} as any,
})
function openAlarmDialog(row?: any) {
  alarmDialog.form = row
    ? { ...row }
    : { id: 0, point: '', type: '火警', level: '一般', status: '未处理', occurredAt: new Date().toISOString().slice(0, 19).replace('T', ' '), enterpriseId: undefined }
  alarmDialog.visible = true
}
async function saveAlarm() {
  const f = alarmDialog.form
  if (!f.point || !f.enterpriseId) return ElMessage.warning('请填写点位和所属企业')
  alarmDialog.saving = true
  try {
    const payload = { point: f.point, type: f.type, level: f.level, status: f.status, occurredAt: f.occurredAt, enterpriseId: f.enterpriseId }
    if (f.id) await updateAlarm(f.id, payload)
    else await createAlarm(payload)
    ElMessage.success('保存成功')
    alarmDialog.visible = false
    loadAlarms()
  } finally {
    alarmDialog.saving = false
  }
}
async function removeAlarm(row: any) {
  await ElMessageBox.confirm(`确认删除告警「${row.point}」？`, '提示', { type: 'warning' })
  await deleteAlarm(row.id)
  ElMessage.success('已删除')
  loadAlarms()
}

// ===== 隐患弹窗 =====
const hazardDialog = reactive({
  visible: false,
  saving: false,
  form: {} as any,
})
function openHazardDialog(row?: any) {
  hazardDialog.form = row
    ? { ...row }
    : { id: 0, location: '', category: '消防设施', level: '一般', status: '未整改', foundAt: new Date().toISOString().slice(0, 10), description: '', enterpriseId: undefined }
  hazardDialog.visible = true
}
async function saveHazard() {
  const f = hazardDialog.form
  if (!f.location || !f.enterpriseId) return ElMessage.warning('请填写位置和所属企业')
  hazardDialog.saving = true
  try {
    const payload = { location: f.location, category: f.category, level: f.level, status: f.status, foundAt: f.foundAt, description: f.description || '', enterpriseId: f.enterpriseId }
    if (f.id) await updateHazard(f.id, payload)
    else await createHazard(payload)
    ElMessage.success('保存成功')
    hazardDialog.visible = false
    loadHazards()
  } finally {
    hazardDialog.saving = false
  }
}
async function removeHazard(row: any) {
  await ElMessageBox.confirm(`确认删除隐患「${row.location}」？`, '提示', { type: 'warning' })
  await deleteHazard(row.id)
  ElMessage.success('已删除')
  loadHazards()
}

// ===== 设备弹窗 =====
const deviceDialog = reactive({
  visible: false,
  saving: false,
  form: {} as any,
})
function openDeviceDialog(row?: any) {
  deviceDialog.form = row
    ? { ...row }
    : { id: 0, name: '', type: '烟感', status: '在线', location: '', enterpriseId: undefined }
  deviceDialog.visible = true
}
async function saveDevice() {
  const f = deviceDialog.form
  if (!f.name || !f.enterpriseId) return ElMessage.warning('请填写设备名称和所属企业')
  deviceDialog.saving = true
  try {
    const payload = { name: f.name, type: f.type, status: f.status, location: f.location || '', enterpriseId: f.enterpriseId }
    if (f.id) await updateDevice(f.id, payload)
    else await createDevice(payload)
    ElMessage.success('保存成功')
    deviceDialog.visible = false
    loadDevices()
  } finally {
    deviceDialog.saving = false
  }
}
async function removeDevice(row: any) {
  await ElMessageBox.confirm(`确认删除设备「${row.name}」？`, '提示', { type: 'warning' })
  await deleteDevice(row.id)
  ElMessage.success('已删除')
  loadDevices()
}

// ===== 展示辅助 =====
function fmtTime(t: string, dateOnly = false) {
  if (!t) return '—'
  const s = t.replace('T', ' ').slice(0, dateOnly ? 10 : 16)
  return s
}
function levelClass(level: string) {
  if (level === '紧急' || level === '重大') return 'lv lv-high'
  if (level === '重要') return 'lv lv-mid'
  return 'lv'
}
function deviceStatusClass(status: string) {
  if (status === '在线') return 'ds ds-on'
  if (status === '离线') return 'ds ds-off'
  return 'ds ds-fault'
}

onMounted(async () => {
  enterprises.value = await getEnterprises()
  loadAlarms()
})
</script>

<style scoped>
.test-data-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fb;
  box-sizing: border-box;
}
.page-header {
  margin-bottom: 16px;
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1e293b;
}
.page-desc {
  font-size: 13px;
  color: #64748b;
}
.data-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 8px 16px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}
.fi-kw {
  width: 200px;
}
.fi-ent {
  width: 180px;
}
.fi-st {
  width: 120px;
}
.spacer {
  flex: 1;
}
.fi-pager {
  margin-top: 12px;
  justify-content: flex-end;
}
.full {
  width: 100%;
}
.lv {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #f1f5f9;
  color: #475569;
}
.lv-high {
  background: #fee2e2;
  color: #b91c1c;
}
.lv-mid {
  background: #fef3c7;
  color: #92400e;
}
.ds {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.ds-on {
  background: #dcfce7;
  color: #1e7a45;
}
.ds-off {
  background: #f1f5f9;
  color: #475569;
}
.ds-fault {
  background: #fef3c7;
  color: #92400e;
}
</style>
