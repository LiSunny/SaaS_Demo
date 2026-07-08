<template>
  <div class="fc-personnel">
    <!-- 状态筛选 -->
    <div class="fc-personnel__filter">
      <button
        v-for="opt in filterOptions"
        :key="opt.key"
        class="fc-personnel__filter-btn"
        :class="{ 'is-active': statusFilter === opt.key }"
        @click="statusFilter = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 人员卡片网格 -->
    <div class="fc-personnel__grid">
      <div
        v-for="p in filteredPersonnel"
        :key="p.id"
        class="personnel-card"
        :class="{
          'is-off-duty': p.leaveStatus === 'off-duty',
          'is-on-leave': p.leaveStatus === 'on-leave',
          'is-overtime': isOvertime(p),
        }"
      >
        <div class="personnel-card__header">
          <span class="personnel-card__status" :class="statusClass(p)" />
          <span class="personnel-card__name">{{ p.name }}</span>
          <span class="personnel-card__tag">{{ leaveLabel(p) }}</span>
        </div>
        <div class="personnel-card__body">
          <div class="personnel-card__row">
            <span class="personnel-card__label">所属消控室</span>
            <span class="personnel-card__value">{{ p.roomName }}</span>
          </div>
          <div class="personnel-card__row">
            <span class="personnel-card__label">岗位</span>
            <span class="personnel-card__value">{{ p.position }}</span>
          </div>
          <div class="personnel-card__row">
            <span class="personnel-card__label">持证编号</span>
            <span class="personnel-card__value">{{ p.certificationNo }}</span>
          </div>
          <div class="personnel-card__row">
            <span class="personnel-card__label">证书到期</span>
            <span
              class="personnel-card__value"
              :class="{ 'text-danger': isExpiringSoon(p.certificationExpiry) }"
            >
              {{ p.certificationExpiry }}
              <span v-if="isExpiringSoon(p.certificationExpiry)" class="expiry-warn">即将到期</span>
            </span>
          </div>
          <div class="personnel-card__row">
            <span class="personnel-card__label">联系电话</span>
            <span class="personnel-card__value">{{ p.phone }}</span>
          </div>
          <!-- 离岗信息 -->
          <div v-if="p.leaveStatus === 'on-leave'" class="personnel-card__leave-info">
            <span>补岗人：{{ p.replacementName || '—' }}</span>
            <span v-if="p.leaveEndTime">预计返回：{{ formatTime(p.leaveEndTime) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="personnel-card__actions">
          <!-- 在岗：报备离岗 -->
          <button
            v-if="p.leaveStatus === 'in-post'"
            class="personnel-card__btn personnel-card__btn--leave"
            @click="openLeaveForm(p)"
          >
            报备离岗
          </button>
          <!-- 离岗中：返岗核销 -->
          <button
            v-if="p.leaveStatus === 'on-leave'"
            class="personnel-card__btn personnel-card__btn--return"
            @click="confirmReturn(p)"
          >
            返岗核销
          </button>
        </div>
      </div>
      <div v-if="filteredPersonnel.length === 0" class="fc-personnel__empty">
        暂无人员数据
      </div>
    </div>

    <!-- 离岗报备弹窗 -->
    <Teleport to="body">
      <div v-if="leaveFormVisible" class="leave-overlay" @click.self="leaveFormVisible = false">
        <div class="leave-dialog">
          <h3 class="leave-dialog__title">离岗报备</h3>
          <div class="leave-dialog__body">
            <label class="leave-dialog__field">
              <span>离岗人员</span>
              <span class="leave-dialog__value">{{ leaveFormTarget?.name }}</span>
            </label>
            <label class="leave-dialog__field">
              <span>离岗事由 <em class="required">*</em></span>
              <input v-model="leaveForm.reason" class="leave-dialog__input" placeholder="如厕 / 取水 / 取物…" />
            </label>
            <label class="leave-dialog__field">
              <span>预计返回时间 <em class="required">*</em></span>
              <input v-model="leaveForm.expectedReturn" class="leave-dialog__input" placeholder="例如 10:30" />
            </label>
            <label class="leave-dialog__field">
              <span>补岗人员 <em class="required">*</em></span>
              <select v-model="leaveForm.replacementId" class="leave-dialog__select">
                <option :value="0" disabled>请选择补岗人员</option>
                <option
                  v-for="r in availableReplacements"
                  :key="r.id"
                  :value="r.id"
                >
                  {{ r.name }}（{{ r.roomName }}）
                </option>
              </select>
            </label>
          </div>
          <!-- 约束提示 -->
          <div v-if="availableReplacements.length === 0" class="leave-dialog__warn">
            ⚠️ 当前无其他在岗人员可补岗，离岗报备无法提交。消控室不能无人值守。
          </div>
          <div class="leave-dialog__actions">
            <button class="leave-dialog__btn leave-dialog__btn--cancel" @click="leaveFormVisible = false">取消</button>
            <button
              class="leave-dialog__btn leave-dialog__btn--confirm"
              :disabled="!canSubmitLeave"
              @click="submitLeave"
            >
              确认报备
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

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
  leaveStatus: 'in-post' | 'on-leave' | 'off-duty'
  leaveEndTime?: string
  replacementName?: string
}

const props = defineProps<{
  personnel: DutyPersonnel[]
}>()

const statusFilter = ref<'all' | 'in-post' | 'on-leave' | 'off-duty'>('all')

const filterOptions = [
  { key: 'all' as const, label: '全部' },
  { key: 'in-post' as const, label: '在岗' },
  { key: 'on-leave' as const, label: '离岗中' },
  { key: 'off-duty' as const, label: '已下班' },
]

// 离岗报备
const leaveFormVisible = ref(false)
const leaveFormTarget = ref<DutyPersonnel | null>(null)
const leaveForm = ref({
  reason: '',
  expectedReturn: '',
  replacementId: 0,
})

const availableReplacements = computed(() =>
  props.personnel.filter(p =>
    p.id !== leaveFormTarget.value?.id &&
    p.leaveStatus === 'in-post'
  )
)

const canSubmitLeave = computed(() =>
  leaveForm.value.reason.trim() !== '' &&
  leaveForm.value.expectedReturn.trim() !== '' &&
  leaveForm.value.replacementId > 0 &&
  availableReplacements.value.length > 0
)

const filteredPersonnel = computed(() => {
  let list = props.personnel
  if (statusFilter.value === 'in-post') list = list.filter(p => p.leaveStatus === 'in-post')
  if (statusFilter.value === 'on-leave') list = list.filter(p => p.leaveStatus === 'on-leave')
  if (statusFilter.value === 'off-duty') list = list.filter(p => p.leaveStatus === 'off-duty')
  return [...list].sort((a, b) => {
    const order = { 'in-post': 0, 'on-leave': 1, 'off-duty': 2 }
    return (order[a.leaveStatus] ?? 0) - (order[b.leaveStatus] ?? 0)
  })
})

function statusClass(p: DutyPersonnel) {
  if (p.leaveStatus === 'off-duty') return 'off'
  if (p.leaveStatus === 'on-leave') return 'leave'
  return ''
}

function leaveLabel(p: DutyPersonnel): string {
  if (p.leaveStatus === 'off-duty') return '已下班'
  if (p.leaveStatus === 'on-leave') return '离岗中'
  return '在岗'
}

function isOvertime(p: DutyPersonnel): boolean {
  if (p.leaveStatus !== 'on-leave' || !p.leaveEndTime) return false
  return new Date() > new Date(p.leaveEndTime)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isExpiringSoon(expiry: string): boolean {
  const exp = new Date(expiry)
  const now = new Date()
  const diff = exp.getTime() - now.getTime()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

function openLeaveForm(p: DutyPersonnel) {
  leaveFormTarget.value = p
  leaveForm.value = { reason: '', expectedReturn: '', replacementId: 0 }
  leaveFormVisible.value = true
}

function submitLeave() {
  if (!canSubmitLeave.value || !leaveFormTarget.value) return
  const target = props.personnel.find(pp => pp.id === leaveFormTarget.value!.id)
  if (target) {
    const rep = props.personnel.find(pp => pp.id === leaveForm.value.replacementId)
    // Mock: 将人员状态改为离岗
    const today = new Date()
    const [h, m] = leaveForm.value.expectedReturn.split(':').map(Number)
    const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h || 10, m || 0)
    ;(target as any).leaveStatus = 'on-leave'
    ;(target as any).leaveEndTime = endTime.toISOString()
    ;(target as any).replacementName = rep?.name || ''
  }
  leaveFormVisible.value = false
}

function confirmReturn(p: DutyPersonnel) {
  const target = props.personnel.find(pp => pp.id === p.id)
  if (target) {
    ;(target as any).leaveStatus = 'in-post'
    ;(target as any).leaveEndTime = undefined
    ;(target as any).replacementName = undefined
  }
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.fc-personnel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(10);
}

.fc-personnel__filter {
  display: flex;
  gap: vw(8);
  flex-shrink: 0;
}

.fc-personnel__filter-btn {
  padding: vh(4) vw(12);
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.55);
  color: #89b5ff;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  transition: all 0.2s;
}
.fc-personnel__filter-btn:hover {
  border-color: rgba(71, 132, 232, 0.65);
  background: rgba(71, 132, 232, 0.15);
}
.fc-personnel__filter-btn.is-active {
  border-color: rgba(71, 132, 232, 0.7);
  background: rgba(71, 132, 232, 0.25);
  color: #ffffff;
}

.fc-personnel__grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(vw(220), 1fr));
  gap: vw(10);
  align-content: start;
}
.fc-personnel__grid::-webkit-scrollbar { width: 3px; }
.fc-personnel__grid::-webkit-scrollbar-track { background: transparent; }
.fc-personnel__grid::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.25); border-radius: 2px; }

.fc-personnel__empty {
  grid-column: 1 / -1;
  padding: 40px 10px;
  text-align: center;
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(12px, calc(14 * var(--min-scale)), 16px);
}

/* ===== 人员卡片 ===== */
.personnel-card {
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.85) 0%, rgba(8, 22, 42, 0.85) 100%);
  border: 1px solid rgba(71, 132, 232, 0.25);
  border-radius: 6px;
  padding: vh(10) vw(10);
  display: flex;
  flex-direction: column;
  gap: vh(8);
  transition: all 0.2s;
}
.personnel-card:hover { border-color: rgba(71, 132, 232, 0.45); }
.personnel-card.is-off-duty { opacity: 0.55; }
.personnel-card.is-on-leave { border-color: rgba(245, 158, 11, 0.4); }
.personnel-card.is-overtime {
  border-color: rgba(239, 68, 68, 0.6);
  animation: overtime-flash 1s ease-in-out infinite;
}

@keyframes overtime-flash {
  0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.3); }
  50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.6); }
}

.personnel-card__header {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.personnel-card__status {
  width: 8px; height: 8px; border-radius: 50%;
  background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  flex-shrink: 0;
}
.personnel-card__status.off { background: #6b7280; box-shadow: none; }
.personnel-card__status.leave { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.5); }

.personnel-card__name {
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
  font-weight: 700; color: #ffffff;
}

.personnel-card__tag {
  margin-left: auto;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  padding: 1px 8px; border-radius: 8px;
  background: rgba(34, 197, 94, 0.15); color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.is-on-leave .personnel-card__tag {
  background: rgba(245, 158, 11, 0.15); color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}
.is-off-duty .personnel-card__tag {
  background: rgba(107, 114, 128, 0.15); color: #6b7280;
  border-color: rgba(107, 114, 128, 0.3);
}

.personnel-card__body { display: flex; flex-direction: column; gap: vh(4); }
.personnel-card__row { display: flex; align-items: center; gap: vw(6); }
.personnel-card__label {
  flex-shrink: 0; width: vw(62);
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.6);
}
.personnel-card__value {
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: #eef3fa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.text-danger { color: #ef4444 !important; font-weight: 600; }
.expiry-warn {
  display: inline-block; margin-left: 4px;
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 0 4px; border-radius: 2px;
  animation: warn-blink 1s ease-in-out infinite;
}
@keyframes warn-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.personnel-card__leave-info {
  display: flex; flex-direction: column; gap: 2px;
  padding: vh(4) vw(8);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 4px;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  color: rgba(245, 158, 11, 0.8);
}

.personnel-card__actions {
  display: flex; gap: vw(6);
}
.personnel-card__btn {
  flex: 1;
  padding: vh(3) vw(8);
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  font-weight: 500;
  transition: all 0.2s;
}
.personnel-card__btn--leave {
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}
.personnel-card__btn--leave:hover {
  background: rgba(245, 158, 11, 0.2);
}
.personnel-card__btn--return {
  border: 1px solid rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
.personnel-card__btn--return:hover {
  background: rgba(34, 197, 94, 0.2);
}

/* 离岗报备弹窗 */
.leave-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.leave-dialog {
  width: 420px; max-width: 90vw;
  background: linear-gradient(135deg, #0d2137 0%, #08162a 100%);
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 8px;
  padding: vh(16) vw(16);
  display: flex; flex-direction: column; gap: vh(12);
}
.leave-dialog__title {
  margin: 0;
  font-size: clamp(15px, calc(18 * var(--min-scale)), 20px);
  font-weight: 700;
  color: #ffffff;
}
.leave-dialog__body {
  display: flex; flex-direction: column; gap: vh(10);
}
.leave-dialog__field {
  display: flex; flex-direction: column; gap: vh(4);
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  color: #89b5ff;
}
.leave-dialog__field .required { color: #ef4444; font-style: normal; }
.leave-dialog__value {
  color: #ffffff; font-weight: 600;
  padding: vh(6) vw(10);
  background: rgba(71, 132, 232, 0.15);
  border-radius: 4px;
  font-size: clamp(12px, calc(14 * var(--min-scale)), 16px);
}
.leave-dialog__input, .leave-dialog__select {
  padding: vh(6) vw(10);
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.55);
  color: #ffffff;
  font-family: inherit;
  font-size: clamp(12px, calc(14 * var(--min-scale)), 16px);
  outline: none;
}
.leave-dialog__input::placeholder { color: rgba(137, 181, 255, 0.35); }
.leave-dialog__select option { background: #0d2137; color: #ffffff; }
.leave-dialog__warn {
  padding: vh(8) vw(10);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: #ef4444;
}
.leave-dialog__actions {
  display: flex; gap: vw(8); justify-content: flex-end;
}
.leave-dialog__btn {
  padding: vh(6) vw(16);
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(12px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  transition: all 0.2s;
}
.leave-dialog__btn--cancel {
  border: 1px solid rgba(107, 114, 128, 0.4);
  background: transparent;
  color: #6b7280;
}
.leave-dialog__btn--cancel:hover { border-color: rgba(107, 114, 128, 0.7); color: #9ca3af; }
.leave-dialog__btn--confirm {
  border: 1px solid rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.leave-dialog__btn--confirm:hover:not(:disabled) { background: rgba(245, 158, 11, 0.25); }
.leave-dialog__btn--confirm:disabled { opacity: 0.35; cursor: not-allowed; }
</style>
