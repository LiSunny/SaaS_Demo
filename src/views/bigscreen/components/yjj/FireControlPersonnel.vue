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
        :class="{ 'is-off-duty': !p.onDuty }"
      >
        <div class="personnel-card__header">
          <span class="personnel-card__status" :class="{ off: !p.onDuty }" />
          <span class="personnel-card__name">{{ p.name }}</span>
          <span class="personnel-card__tag">{{ p.onDuty ? '在岗' : '离岗' }}</span>
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
        </div>
      </div>
      <div v-if="filteredPersonnel.length === 0" class="fc-personnel__empty">
        暂无人员数据
      </div>
    </div>
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
}

const props = defineProps<{
  personnel: DutyPersonnel[]
}>()

const statusFilter = ref<'all' | 'on-duty' | 'off-duty'>('all')

const filterOptions = [
  { key: 'all' as const, label: '全部' },
  { key: 'on-duty' as const, label: '在岗' },
  { key: 'off-duty' as const, label: '离岗' },
]

const filteredPersonnel = computed(() => {
  let list = props.personnel
  if (statusFilter.value === 'on-duty') list = list.filter(p => p.onDuty)
  if (statusFilter.value === 'off-duty') list = list.filter(p => !p.onDuty)
  // 在岗优先
  return [...list].sort((a, b) => (b.onDuty ? 1 : 0) - (a.onDuty ? 1 : 0))
})

function isExpiringSoon(expiry: string): boolean {
  const exp = new Date(expiry)
  const now = new Date()
  const diff = exp.getTime() - now.getTime()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000 // < 30 天
}
</script>

<style scoped>
.fc-personnel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--h));
}

.fc-personnel__filter {
  display: flex;
  gap: calc(8 * var(--w));
  flex-shrink: 0;
}

.fc-personnel__filter-btn {
  padding: calc(4 * var(--h)) calc(12 * var(--w));
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
  grid-template-columns: repeat(auto-fill, minmax(calc(220 * var(--w)), 1fr));
  gap: calc(10 * var(--w));
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
  padding: calc(10 * var(--h)) calc(10 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  transition: all 0.2s;
}
.personnel-card:hover {
  border-color: rgba(71, 132, 232, 0.45);
}
.personnel-card.is-off-duty {
  opacity: 0.65;
}

.personnel-card__header {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
}

.personnel-card__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  flex-shrink: 0;
}
.personnel-card__status.off {
  background: #6b7280;
  box-shadow: none;
}

.personnel-card__name {
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
  font-weight: 700;
  color: #ffffff;
}

.personnel-card__tag {
  margin-left: auto;
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  padding: 1px 8px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.is-off-duty .personnel-card__tag {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.3);
}

.personnel-card__body {
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.personnel-card__row {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
}

.personnel-card__label {
  flex-shrink: 0;
  width: calc(62 * var(--w));
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.6);
}

.personnel-card__value {
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: #eef3fa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-danger {
  color: #ef4444 !important;
  font-weight: 600;
}

.expiry-warn {
  display: inline-block;
  margin-left: 4px;
  font-size: clamp(9px, calc(10 * var(--min-scale)), 11px);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 0 4px;
  border-radius: 2px;
  animation: warn-blink 1s ease-in-out infinite;
}

@keyframes warn-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
