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
            v-for="result in callResults"
            :key="result.name"
            class="call-result"
            :class="`call-result--${result.status}`"
          >
            <span class="call-result__icon">{{ result.status === 'responded' ? '✅' : result.status === 'timeout' ? '❌' : '⏳' }}</span>
            <span class="call-result__name">{{ result.name }}</span>
            <span class="call-result__text">{{ result.text }}</span>
            <span v-if="result.status === 'responded' && result.method" class="call-result__method">
              {{ result.method === 'video' ? '📹 视频应答' : '🎤 语音应答' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 点名记录表 -->
      <div class="fc-roll-call__history">
        <div class="fc-roll-call__section-title">点名记录</div>
        <div class="fc-roll-call__table">
          <BigscreenListTable
            :columns="columns"
            :rows="sortedRecords"
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
const callResults = ref<Array<{
  name: string
  status: 'calling' | 'responded' | 'timeout'
  text: string
  method?: 'video' | 'voice' | null
}>>([])

const columns: BsColumn[] = [
  { key: 'callTime', label: '点名时间', width: 'calc(130 * var(--w))' },
  { key: 'personnelName', label: '被点名人', width: 'calc(80 * var(--w))' },
  { key: 'initiator', label: '发起人', width: 'calc(100 * var(--w))' },
  { key: 'responseTime', label: '响应时间', width: 'calc(130 * var(--w))' },
  { key: 'status', label: '状态', width: 'calc(70 * var(--w))' },
  { key: 'responseMethod', label: '应答方式', width: 'calc(80 * var(--w))' },
]

const selectedPersonnel = computed(() =>
  props.personnel.filter(p => selectedIds.value.includes(p.id))
)

const sortedRecords = computed(() =>
  [...props.records].sort((a, b) => b.callTime.localeCompare(a.callTime))
)

function toggleSelect(id: number) {
  if (calling.value) return
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
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

  const callTime = nowStr()
  const methods: Array<'video' | 'voice'> = ['video', 'voice', 'voice', 'video', 'voice']

  for (let i = 0; i < selectedPersonnel.value.length; i++) {
    const p = selectedPersonnel.value[i]
    const delay = 1500 + Math.random() * 3000 // 1.5~4.5 秒随机延迟
    await sleep(delay)

    // 90% 概率应答成功
    const responded = Math.random() > 0.1
    const method = responded ? methods[i % methods.length] : null

    callResults.value[i] = {
      name: p.name,
      status: responded ? 'responded' : 'timeout',
      text: responded ? '已应答' : '超时未应答',
      method,
    }

    // 记录到点名记录
    const responseTime = responded ? nowStr() : null
    emit('add-record', {
      enterpriseId: props.enterpriseId,
      personnelName: p.name,
      initiator: '应急局监管员-张华',
      callTime,
      responseTime,
      status: responded ? 'responded' : 'timeout',
      responseMethod: method,
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

.roll-call-person__checkbox {
  accent-color: #3cd3d7;
  flex-shrink: 0;
}

.roll-call-person__status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
  flex-shrink: 0;
}

.roll-call-person__name {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: #f2fbff;
  font-weight: 500;
  flex-shrink: 0;
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

/* ===== 右侧：点名操作 + 历史 ===== */
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
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: #ffffff;
  background: rgba(71, 132, 232, 0.3);
  border: 1px solid rgba(71, 132, 232, 0.5);
  border-radius: 4px;
}

.selected-tag__remove {
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
}
.selected-tag__remove:hover {
  color: #ef4444;
}
.selected-tag__remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.selected-tags--empty {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.35);
  padding: calc(6 * var(--h)) 0;
}

.roll-call-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: calc(8 * var(--h)) calc(16 * var(--w));
  border: 1px solid rgba(60, 211, 215, 0.5);
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(60, 211, 215, 0.2) 0%, rgba(60, 211, 215, 0.1) 100%);
  color: #3cd3d7;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(13px, calc(14 * var(--min-scale)), 16px);
  font-weight: 600;
  transition: all 0.2s;
}
.roll-call-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(60, 211, 215, 0.35) 0%, rgba(60, 211, 215, 0.2) 100%);
  border-color: rgba(60, 211, 215, 0.7);
}
.roll-call-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.roll-call-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(60, 211, 215, 0.3);
  border-top-color: #3cd3d7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 点名反馈 */
.call-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.call-result {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: calc(4 * var(--h)) calc(8 * var(--w));
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  border-radius: 4px;
}

.call-result--calling {
  color: #89b5ff;
  background: rgba(71, 132, 232, 0.1);
}

.call-result--responded {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.call-result--timeout {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.call-result__icon {
  flex-shrink: 0;
}

.call-result__name {
  font-weight: 600;
  flex-shrink: 0;
}

.call-result__text {
  flex: 1;
}

.call-result__method {
  color: rgba(137, 181, 255, 0.7);
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
}

/* 点名记录 */
.fc-roll-call__history {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
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

.text-muted {
  color: rgba(137, 181, 255, 0.35);
}
</style>
