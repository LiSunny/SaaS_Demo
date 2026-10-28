<template>
  <div class="fwat">
    <div class="fwat__toolbar">
      <span class="fwat__count">
        共 <b>{{ records.length }}</b> 条报警记录
      </span>
      <span class="fwat__count" :class="{ 'fwat__count--bad': unhandledCount > 0 }">
        <b>{{ unhandledCount }}</b> 条未处理
      </span>
      <div class="fwat__filters">
        <button
          type="button"
          class="fwat__filter"
          :class="{ 'fwat__filter--on': levelFilter === '' }"
          @click="levelFilter = ''"
        >
          全部
        </button>
        <button
          v-for="l in LEVELS"
          :key="l.key"
          type="button"
          class="fwat__filter"
          :class="{ 'fwat__filter--on': levelFilter === l.key }"
          @click="levelFilter = l.key"
        >
          {{ l.label }}
        </button>
      </div>
    </div>

    <div class="fwat__wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th col-time"><span>时间</span></th>
            <th class="fi-th col-loc"><span>位置</span></th>
            <th class="fi-th col-code"><span>点位编号</span></th>
            <th class="fi-th col-reason"><span>报警内容</span></th>
            <th class="fi-th col-level"><span>等级</span></th>
            <th class="fi-th col-status"><span>状态</span></th>
            <th class="fi-th col-actions"><span>操作</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in visible" :key="r.id" class="fi-tbody-tr">
            <td class="fi-td col-time">{{ timeText(r.occurredAt) }}</td>
            <td class="fi-td col-loc">{{ r.location }}</td>
            <td class="fi-td col-code">{{ r.code }}</td>
            <td class="fi-td col-reason">{{ r.reason }}</td>
            <td class="fi-td col-level">
              <StatusTag :status="r.level" />
            </td>
            <td class="fi-td col-status">
              <StatusTag :status="r.status" />
            </td>
            <td class="fi-td col-actions">
              <button
                v-if="r.status === 'unhandled'"
                type="button"
                class="act-btn"
                title="标记为已处理"
                @click="emit('handle', r.id)"
              >
                <AppIcon name="icon-check" class="act-icon" />处理
              </button>
              <span v-else class="fwat__done">—</span>
            </td>
          </tr>
          <tr v-if="!visible.length">
            <td class="fi-td" colspan="7">
              <el-empty description="暂无报警记录" :image-size="60" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报警记录表
 *
 * 记录来源见 stores/firewater-alarm.ts：当前异常点位实时累积 + 首次加载补的历史。
 * 表格用项目标准 fi-table（表头 sticky，仅表体滚动）。
 */
import { computed, ref } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import StatusTag from '@/components/business/StatusTag.vue'
import type { FireAlarmLevel, FireAlarmRecord } from '@/types/firewater'

const props = defineProps<{
  records: FireAlarmRecord[]
  unhandledCount: number
}>()

const emit = defineEmits<{
  /** 标记已处理 */
  handle: [id: string]
}>()

const LEVELS: Array<{ key: FireAlarmLevel; label: string }> = [
  { key: 'critical', label: '紧急' },
  { key: 'important', label: '重要' },
  { key: 'general', label: '一般' },
]

const levelFilter = ref<FireAlarmLevel | ''>('')

const visible = computed(() =>
  levelFilter.value ? props.records.filter(r => r.level === levelFilter.value) : props.records,
)

function timeText(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
</script>

<style scoped>
.fwat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.fwat__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}
.fwat__count {
  font-size: var(--font-xs);
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.fwat__count b { color: var(--text-primary); }
.fwat__count--bad b { color: var(--danger-text); }

.fwat__filters {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.fwat__filter {
  padding: 3px 10px;
  font: inherit;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease, background .2s ease;
}
.fwat__filter:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.fwat__filter--on {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
  color: var(--accent-primary);
  font-weight: 600;
}

/* 固定表头 —— 仅表体滚动 */
.fwat__wrap {
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
}
.fi-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-time { width: 160px; }
.col-loc { min-width: 150px; }
.col-code { width: 110px; }
.col-reason { min-width: 220px; white-space: normal; text-align: left; }
.col-level { width: 80px; }
.col-status { width: 90px; }
.col-actions { width: 90px; }

.fwat__done { color: var(--text-muted); }
</style>
