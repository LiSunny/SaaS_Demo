<template>
  <div class="fc-roll-call">
    <!-- 左：在岗人员列表 -->
    <div class="fc-roll-call__left">
      <div class="fc-roll-call__section-title">在岗值班人员</div>
      <div class="fc-roll-call__personnel-list">
        <label
          v-for="p in personnel"
          :key="p.id"
          class="roll-call-person"
          :class="{ 'is-selected': selectedIds.includes(p.id) }"
        >
          <input
            type="checkbox"
            :checked="selectedIds.includes(p.id)"
            :disabled="calling"
            @change="toggleSelect(p.id)"
            class="roll-call-person__checkbox"
          />
          <span class="roll-call-person__status" />
          <span class="roll-call-person__name">{{ p.name }}</span>
          <span class="roll-call-person__room">{{ p.roomName }}</span>
        </label>
        <div v-if="personnel.length === 0" class="fc-roll-call__empty">
          暂无在岗人员
        </div>
      </div>
    </div>

    <!-- 右：点名操作 + 记录 -->
    <div class="fc-roll-call__right">
      <!-- 点名操作区 -->
      <div class="fc-roll-call__action">
        <div class="fc-roll-call__section-title">远程点名</div>

        <!-- 已选人员标签 -->
        <div class="selected-tags" v-if="selectedPersonnel.length > 0">
          <span v-for="p in selectedPersonnel" :key="p.id" class="selected-tag">
            {{ p.name }}
            <button class="selected-tag__remove" :disabled="calling" @click="toggleSelect(p.id)">×</button>
          </span>
        </div>
        <div v-else class="selected-tags--empty">
          请在左侧选择值班人员
        </div>

        <!-- 发起点名按钮 -->
        <button
          class="roll-call-btn"
          :disabled="selectedPersonnel.length === 0 || calling"
          @click="startRollCall"
        >
          <template v-if="calling">
            <span class="roll-call-btn__spinner"></span>
            点名进行中...
          </template>
          <template v-else>
            发起远程点名（{{ selectedPersonnel.length }}人）
          </template>
        </button>

        <!-- 点名结果反馈 -->
        <div v-if="callResults.length > 0" class="call-results">
          <div
            v-for="(result, idx) in callResults"
            :key="result.name"
            class="call-result"
            :class="`call-result--${result.status}`"
          >
            <span class="call-result__icon">{{ result.status === 'responded' ? '✅' : result.status === 'timeout' ? '❌' : '⏳' }}</span>
            <span class="call-result__name">{{ result.name }}</span>
            <span class="call-result__text">{{ result.text }}</span>
            <span v-if="result.status === 'responded' && result.method" class="call-result__method">
              {{ result.method === 'video' ? '📹 视频' : '🎤 语音' }}
            </span>
            <!-- 核验表单入口 -->
            <button
              v-if="result.status === 'responded' && !checkForms[idx]?.submitted"
              class="call-result__check-btn"
              @click="toggleCheckForm(idx)"
            >
              {{ checkForms[idx]?.open ? '收起核验' : '填写核验' }}
            </button>
            <span v-if="checkForms[idx]?.submitted" class="call-result__check-done">✅ 已核验</span>
          </div>
        </div>

        <!-- 核验表单（展开后显示） -->
        <div v-for="(result, idx) in callResults" :key="`check-${result.name}`">
          <div v-if="checkForms[idx]?.open && !checkForms[idx]?.submitted" class="check-form">
            <div class="check-form__title">现场核验 — {{ result.name }}</div>
            <div class="check-form__body">
              <label class="check-form__field">
                <span>① 消防主机状态</span>
                <select v-model="checkForms[idx].hostStatus" class="check-form__select">
                  <option value="">请选择</option>
                  <option value="正常">正常</option>
                  <option value="有火警">有火警</option>
                  <option value="有故障">有故障</option>
                  <option value="有屏蔽">有屏蔽</option>
                </select>
              </label>
              <div class="check-form__field">
                <span>② 联动设备状态</span>
                <label v-for="dev in linkageOptions" :key="dev" class="check-form__check">
                  <input type="checkbox" :value="dev" v-model="checkForms[idx].linkageDevices" />
                  {{ dev }}
                </label>
              </div>
              <div class="check-form__field">
                <span>③ 应急物资</span>
                <label v-for="gear in gearOptions" :key="gear" class="check-form__check">
                  <input type="checkbox" :value="gear" v-model="checkForms[idx].emergencyGear" />
                  {{ gear }}
                </label>
              </div>
              <label class="check-form__field">
                <span>④ 门窗监控</span>
                <select v-model="checkForms[idx].doorWindow" class="check-form__select">
                  <option value="">请选择</option>
                  <option value="正常">正常</option>
                  <option value="异常">异常</option>
                </select>
              </label>
              <label class="check-form__field">
                <span>⑤ 证件核验</span>
                <span class="check-form__cert-info">
                  证书编号：{{ selectedPersonnel[idx]?.certificationNo || '—' }}
                </span>
                <label class="check-form__check">
                  <input type="checkbox" v-model="checkForms[idx].certVerify" />
                  本人持证，核验通过
                </label>
              </label>
            </div>
            <button
              class="check-form__submit"
              :disabled="!canSubmitCheck(idx)"
              @click="submitCheck(idx)"
            >
              确认核验
            </button>
          </div>
        </div>
      </div>

      <!-- 点名记录表 -->
      <div class="fc-roll-call__history">
        <div class="fc-roll-call__section-title">点名记录</div>
        <!-- 点名模式筛选 -->
        <div class="fc-roll-call__filter">
          <button
            v-for="opt in modeOptions"
            :key="opt.key"
            class="fc-roll-call__filter-btn"
            :class="{ 'is-active': modeFilter === opt.key }"
            @click="modeFilter = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="fc-roll-call__table">
          <BigscreenListTable
            :columns="columns"
            :rows="sortedFilteredRecords"
            row-key="id"
          >
            <template #cell-status="{ row }">
              <span class="roll-call-status" :class="`roll-call-status--${row.status}`">
                {{ row.status === 'responded' ? '已应答' : '超时' }}
              </span>
            </template>
            <template #cell-responseMethod="{ row }">
              <span v-if="row.responseMethod === 'video'">📹 视频</span>
              <span v-else-if="row.responseMethod === 'voice'">🎤 语音</span>
              <span v-else class="text-muted">--</span>
            </template>
            <template #cell-callMode="{ row }">
              <span class="roll-call-mode" :class="`roll-call-mode--${row.callMode}`">
                {{ row.callMode === 'manual' ? '有感' : '无感' }}
              </span>
            </template>
            <template #cell-checkItems="{ row }">
              <span v-if="row.checkItems?.certVerify" class="roll-call-check-ok">✅ 已核验</span>
              <span v-else class="text-muted">--</span>
            </template>
          </BigscreenListTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BigscreenListTable, { type BsColumn } from '../BigscreenListTable.vue'

interface DutyPersonnel {
  id: number
  enterpriseId: number
  name: string
  roomName: string
  position: string
  certificationNo: string
  certificationExpiry: string
  phone: string
  onDuty: boolean
}

interface RollCallRecord {
  id: number
  enterpriseId: number
  personnelName: string
  initiator: string
  callTime: string
  responseTime: string | null
  status: 'responded' | 'timeout'
  responseMethod: 'video' | 'voice' | null
  callMode: 'manual' | 'auto'
  checkItems: {
    hostStatus?: string
    linkageDevices?: string[]
    emergencyGear?: string[]
    doorWindow?: string
    certVerify?: boolean
  } | null
}

const props = defineProps<{
  enterpriseId: number
  personnel: DutyPersonnel[]
  records: RollCallRecord[]
}>()

const emit = defineEmits<{
  (e: 'add-record', record: Omit<RollCallRecord, 'id'>): void
}>()

const selectedIds = ref<number[]>([])
const calling = ref(false)
const modeFilter = ref<string>('all')
const callResults = ref<Array<{
  name: string
  status: 'calling' | 'responded' | 'timeout'
  text: string
  method?: 'video' | 'voice' | null
}>>([])

interface CheckForm {
  open: boolean
  submitted: boolean
  hostStatus: string
  linkageDevices: string[]
  emergencyGear: string[]
  doorWindow: string
  certVerify: boolean
}
const checkForms = ref<CheckForm[]>([])

const linkageOptions = ['喷淋泵', '消火栓泵', '排烟风机', '防火卷帘']
const gearOptions = ['对讲机', '灭火器', '应急灯', '消防电话']

const modeOptions = [
  { key: 'all', label: '全部' },
  { key: 'manual', label: '有感点名' },
  { key: 'auto', label: '无感点名' },
]

const columns: BsColumn[] = [
  { key: 'callTime', label: '点名时间' },
  { key: 'personnelName', label: '被点名人' },
  { key: 'callMode', label: '模式', width: 'calc(56 * var(--w))' },
  { key: 'initiator', label: '发起人' },
  { key: 'responseTime', label: '响应时间' },
  { key: 'status', label: '状态', width: 'calc(64 * var(--w))' },
  { key: 'responseMethod', label: '应答', width: 'calc(56 * var(--w))' },
  { key: 'checkItems', label: '核验' },
]

const selectedPersonnel = computed(() =>
  props.personnel.filter(p => selectedIds.value.includes(p.id))
)

const sortedFilteredRecords = computed(() => {
  let list = props.records
  if (modeFilter.value !== 'all') {
    list = list.filter(r => r.callMode === modeFilter.value)
  }
  return [...list].sort((a, b) => b.callTime.localeCompare(a.callTime))
})

function toggleSelect(id: number) {
  if (calling.value) return
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleCheckForm(idx: number) {
  checkForms.value[idx].open = !checkForms.value[idx].open
}

function canSubmitCheck(idx: number): boolean {
  const f = checkForms.value[idx]
  return !!(f.hostStatus && f.doorWindow && f.certVerify)
}

function submitCheck(idx: number) {
  checkForms.value[idx].submitted = true
  checkForms.value[idx].open = false
}

function nowStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
}

async function startRollCall() {
  if (calling.value || selectedPersonnel.value.length === 0) return

  calling.value = true
  callResults.value = selectedPersonnel.value.map(p => ({
    name: p.name,
    status: 'calling' as const,
    text: '等待应答...',
  }))
  checkForms.value = selectedPersonnel.value.map(() => ({
    open: false,
    submitted: false,
    hostStatus: '',
    linkageDevices: [] as string[],
    emergencyGear: [] as string[],
    doorWindow: '',
    certVerify: false,
  }))

  const callTime = nowStr()
  const methods: Array<'video' | 'voice'> = ['video', 'voice', 'voice', 'video', 'voice']

  for (let i = 0; i < selectedPersonnel.value.length; i++) {
    const delay = 1500 + Math.random() * 3000
    await sleep(delay)

    const responded = Math.random() > 0.1
    const method = responded ? methods[i % methods.length] : null

    callResults.value[i] = {
      name: selectedPersonnel.value[i].name,
      status: responded ? 'responded' : 'timeout',
      text: responded ? '已应答' : '超时未应答',
      method,
    }

    const responseTime = responded ? nowStr() : null

    const cf = checkForms.value[i]
    emit('add-record', {
      enterpriseId: props.enterpriseId,
      personnelName: selectedPersonnel.value[i].name,
      initiator: '应急局监管员-张华',
      callTime,
      responseTime,
      status: responded ? 'responded' : 'timeout',
      responseMethod: method,
      callMode: 'manual',
      checkItems: responded && cf?.submitted ? {
        hostStatus: cf.hostStatus,
        linkageDevices: cf.linkageDevices,
        emergencyGear: cf.emergencyGear,
        doorWindow: cf.doorWindow,
        certVerify: cf.certVerify,
      } : null,
    })
  }

  calling.value = false
  selectedIds.value = []
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style scoped>
.fc-roll-call {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: calc(12 * var(--w));
}

/* ===== 左侧：人员列表 ===== */
.fc-roll-call__left {
  flex: 0 0 calc(240 * var(--w));
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  min-height: 0;
}

.fc-roll-call__section-title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
  font-weight: 700;
  color: #89b5ff;
  flex-shrink: 0;
}

.fc-roll-call__personnel-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}
.fc-roll-call__personnel-list::-webkit-scrollbar { width: 3px; }
.fc-roll-call__personnel-list::-webkit-scrollbar-track { background: transparent; }
.fc-roll-call__personnel-list::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.25); border-radius: 2px; }

.roll-call-person {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: calc(7 * var(--h)) calc(8 * var(--w));
  border: 1px solid transparent;
  border-radius: 4px;
  background: rgba(13, 33, 55, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}
.roll-call-person:hover {
  background: rgba(71, 132, 232, 0.15);
}
.roll-call-person.is-selected {
  background: rgba(71, 132, 232, 0.2);
  border-color: rgba(71, 132, 232, 0.45);
}

.roll-call-person__checkbox { accent-color: #3cd3d7; flex-shrink: 0; }
.roll-call-person__status {
  width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
  flex-shrink: 0;
}
.roll-call-person__name {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: #f2fbff; font-weight: 500; flex-shrink: 0;
}
.roll-call-person__room {
  margin-left: auto;
  font-size: clamp(9px, calc(10 * var(--min-scale)), 12px);
  color: rgba(137, 181, 255, 0.5);
}
.fc-roll-call__empty {
  padding: 20px 10px;
  text-align: center;
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
}

/* ===== 右侧 ===== */
.fc-roll-call__right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--h));
  min-height: 0;
}

/* 点名操作区 */
.fc-roll-call__action {
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  flex-shrink: 0;
  padding: calc(10 * var(--h)) calc(10 * var(--w));
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.7) 0%, rgba(8, 22, 42, 0.7) 100%);
  border: 1px solid rgba(71, 132, 232, 0.2);
  border-radius: 6px;
  max-height: calc(340 * var(--h));
  overflow-y: auto;
}

.selected-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.selected-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: #ffffff;
  background: rgba(71, 132, 232, 0.3);
  border: 1px solid rgba(71, 132, 232, 0.5);
  border-radius: 4px;
}
.selected-tag__remove {
  border: none; background: none; color: rgba(255, 255, 255, 0.6);
  cursor: pointer; padding: 0; font-size: 14px; line-height: 1;
}
.selected-tag__remove:hover { color: #ef4444; }
.selected-tag__remove:disabled { opacity: 0.3; cursor: not-allowed; }
.selected-tags--empty {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.35);
  padding: calc(6 * var(--h)) 0;
}

.roll-call-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: calc(8 * var(--h)) calc(16 * var(--w));
  border: 1px solid rgba(60, 211, 215, 0.5); border-radius: 4px;
  background: linear-gradient(135deg, rgba(60, 211, 215, 0.2) 0%, rgba(60, 211, 215, 0.1) 100%);
  color: #3cd3d7; cursor: pointer; font-family: inherit;
  font-size: clamp(13px, calc(14 * var(--min-scale)), 16px);
  font-weight: 600; transition: all 0.2s;
}
.roll-call-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(60, 211, 215, 0.35) 0%, rgba(60, 211, 215, 0.2) 100%);
  border-color: rgba(60, 211, 215, 0.7);
}
.roll-call-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.roll-call-btn__spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(60, 211, 215, 0.3);
  border-top-color: #3cd3d7; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 点名反馈 */
.call-results { display: flex; flex-direction: column; gap: 4px; }
.call-result {
  display: flex; align-items: center; gap: 6px;
  padding: calc(4 * var(--h)) calc(8 * var(--w));
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  border-radius: 4px;
}
.call-result--calling { color: #89b5ff; background: rgba(71, 132, 232, 0.1); }
.call-result--responded { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
.call-result--timeout { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
.call-result__icon { flex-shrink: 0; }
.call-result__name { font-weight: 600; flex-shrink: 0; }
.call-result__text { flex: 1; }
.call-result__method {
  color: rgba(137, 181, 255, 0.7);
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
}
.call-result__check-btn {
  padding: 2px 8px;
  border: 1px solid rgba(60, 211, 215, 0.4);
  border-radius: 3px;
  background: rgba(60, 211, 215, 0.1);
  color: #3cd3d7; cursor: pointer;
  font-family: inherit;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  transition: all 0.2s;
}
.call-result__check-btn:hover {
  background: rgba(60, 211, 215, 0.2);
  border-color: rgba(60, 211, 215, 0.7);
}
.call-result__check-done {
  color: #22c55e;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  flex-shrink: 0;
}

/* 核验表单 */
.check-form {
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  padding: calc(10 * var(--h)) calc(10 * var(--w));
  background: rgba(13, 33, 55, 0.5);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 4px;
}
.check-form__title {
  font-size: clamp(12px, calc(13 * var(--min-scale)), 15px);
  font-weight: 600;
  color: #3cd3d7;
}
.check-form__body {
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
}
.check-form__field {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
  flex-wrap: wrap;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.8);
}
.check-form__field > span:first-child {
  flex-shrink: 0;
  min-width: calc(110 * var(--w));
}
.check-form__select {
  padding: 2px 8px;
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 3px;
  background: rgba(2, 20, 50, 0.55);
  color: #89b5ff;
  font-family: inherit;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  outline: none;
}
.check-form__check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: #89b5ff;
}
.check-form__check input { accent-color: #3cd3d7; }
.check-form__cert-info {
  color: rgba(137, 181, 255, 0.5);
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
}
.check-form__submit {
  align-self: flex-start;
  padding: calc(4 * var(--h)) calc(14 * var(--w));
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 3px;
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  font-weight: 600;
  transition: all 0.2s;
}
.check-form__submit:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.2);
}
.check-form__submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 点名记录 */
.fc-roll-call__history {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
}
.fc-roll-call__filter {
  display: flex;
  gap: calc(8 * var(--w));
  flex-shrink: 0;
}
.fc-roll-call__filter-btn {
  padding: calc(3 * var(--h)) calc(10 * var(--w));
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.55);
  color: #89b5ff;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  transition: all 0.2s;
}
.fc-roll-call__filter-btn:hover {
  border-color: rgba(71, 132, 232, 0.65);
  background: rgba(71, 132, 232, 0.15);
}
.fc-roll-call__filter-btn.is-active {
  border-color: rgba(71, 132, 232, 0.7);
  background: rgba(71, 132, 232, 0.25);
  color: #ffffff;
}
.fc-roll-call__table {
  flex: 1;
  min-height: 0;
}

/* 状态标签 */
.roll-call-status {
  display: inline-block;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}
.roll-call-status--responded {
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.1);
}
.roll-call-status--timeout {
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
}

/* 点名模式标签 */
.roll-call-mode {
  display: inline-block;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}
.roll-call-mode--manual {
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
}
.roll-call-mode--auto {
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.1);
}

.roll-call-check-ok {
  color: #22c55e;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
}
.text-muted { color: rgba(137, 181, 255, 0.35); }
</style>
