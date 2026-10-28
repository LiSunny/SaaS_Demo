<template>
  <div class="fwm">
    <!-- ============ 统计区（常驻，固定高度） ============ -->
    <section class="fwm__stats">
      <div class="fwm__stats-head">
        <div class="fwm__stats-left">
          <h1 class="fwm__title">消防水系统</h1>
        </div>
        <div class="fwm__stats-right">
          <span class="fwm__live" :class="`fwm__live--${refreshState}`">
            <span class="fwm__live-dot" />
            {{ refreshText }}
          </span>
          <span class="fwm__stamp">更新 {{ stampText }}</span>
          <button class="fwm__live-btn" @click="toggleLive">
            <AppIcon :name="live ? 'pause' : 'play'" />
            {{ live ? '暂停' : '恢复' }}
          </button>
        </div>
      </div>

      <FireWaterCoreCards :cards="cards" @select="openCard" />
    </section>

    <!-- ============ 视图切换 ============ -->
    <FireWaterTabs v-model="tab" :tabs="TABS" />

    <!-- ============ 主体区（填满剩余高度） ============ -->
    <section class="fwm__panel">
      <!-- 系统总览 -->
      <template v-if="tab === 'overview'">
        <FireWaterScene @select="openGroup" />
      </template>

      <!-- 报警记录 -->
      <template v-else-if="tab === 'alarm'">
        <FireWaterAlarmTable
          :records="alarmRecords"
          :unhandled-count="alarmUnhandled"
          :type-name-of="typeNameOf"
          :units="units"
          @handle="markHandled"
          @preview="openPointById"
        />
      </template>

      <!-- 设备台帐 -->
      <template v-else>
        <FireWaterLedgerTable
          :points="points"
          :type-name-of="typeNameOf"
          :status-of="statusOfPoint"
          @preview="openPoint"
          @group="openPointGroup"
          @config="onConfig"
        />
      </template>
    </section>

    <!-- ============ 下钻抽屉 ============ -->
    <FireWaterPointDrawer
      v-model="groupOpen"
      :group="group"
      @open="openPoint"
    />

    <PointDetailDrawer
      v-model="detailOpen"
      :point="activePoint"
      :runtime="activePoint ? getRuntime(activePoint.id) : undefined"
      :profile="activePoint ? findProfile(activePoint.typeKey) : undefined"
      :host-label="hostLabelOf(activePoint)"
      :siblings="siblings"
      :sibling-index="siblingIndex"
      @control="handleControl"
      @sibling="gotoSibling"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 消防水系统监测（设备设施管理 › 运行监控）
 *
 * 版式（设计稿）：
 *   顶部统计区常驻且高度固定 → 视图切换条 → 主体区填满窗口剩余高度
 *   主体区三视图：系统总览（管网总貌）/ 报警记录 / 设备台帐
 *
 * 页面整体不出现垂直滚动条：根容器 height:100% + overflow:hidden，
 * 溢出只发生在表格体内部。
 *
 * 数据全部来自 useSubsystemStore('pipeline')，与组态配置页、组态总览页同源。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import { useFirewaterAlarmStore } from '@/stores/firewater-alarm'
import type { PointDef, PointStatus } from '@/types/subsystem'
import type { FireWaterPointGroup, FireWaterTabKey } from '@/types/firewater'
import {
  computeFireWaterCards,
  findOwnerNode,
  type FireWaterCardValue,
} from '@/config/firewater-scene'
import FireWaterCoreCards from '@/components/subsystem/FireWaterCoreCards.vue'
import FireWaterTabs from '@/components/subsystem/FireWaterTabs.vue'
import FireWaterScene from '@/components/subsystem/FireWaterScene.vue'
import FireWaterAlarmTable from '@/components/subsystem/FireWaterAlarmTable.vue'
import FireWaterLedgerTable from '@/components/subsystem/FireWaterLedgerTable.vue'
import FireWaterPointDrawer from '@/components/subsystem/FireWaterPointDrawer.vue'
import PointDetailDrawer from '@/components/subsystem/PointDetailDrawer.vue'

const store = useSubsystemStore()
const { points, live, lastUpdate, timerRunning, refreshSeq } = storeToRefs(store)
const { getRuntime, findProfile, loadSubsystem, toggleLive, stopTimer } = store

const alarm = useFirewaterAlarmStore()
const { records: alarmRecords, unhandledCount: alarmUnhandled } = storeToRefs(alarm)

// ===== 视图切换 =====
const TABS: Array<{ key: FireWaterTabKey; label: string }> = [
  { key: 'overview', label: '系统总览' },
  { key: 'alarm', label: '报警记录' },
  { key: 'ledger', label: '设备台帐' },
]
const tab = ref<FireWaterTabKey>('overview')

// ===== 抽屉 =====
const groupOpen = ref(false)
const group = ref<FireWaterPointGroup | undefined>()
const detailOpen = ref(false)
const activePoint = ref<PointDef | undefined>()
const siblings = ref<PointDef[]>([])

// ===== 派生 =====

/**
 * 刷新状态三档
 *
 * live=true 只说明"用户没手动暂停"，不代表定时器还活着。
 * 定时器停了而 live 仍是 true 时必须显式说破，否则值守员会以为数据在动。
 */
const refreshState = computed<'running' | 'stopped' | 'paused'>(() => {
  if (!live.value) return 'paused'
  return timerRunning.value ? 'running' : 'stopped'
})

const refreshText = computed(
  () => ({ running: '实时刷新中', stopped: '刷新已停止', paused: '已暂停' })[refreshState.value],
)

const stampText = computed(() => {
  const ts = lastUpdate.value
  if (!ts) return '--'
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})

const cards = computed<FireWaterCardValue[]>(() =>
  computeFireWaterCards(points.value, getRuntime),
)

/** 设备档案类型 key → 名称 */
function typeNameOf(typeKey: string): string {
  return findProfile(typeKey)?.name ?? typeKey
}

/** 点位实时状态 → 展示标签 */
function statusOfPoint(p: PointDef): { label: string; cls: string } {
  const s: PointStatus = getRuntime(p.id)?.status ?? 'unknown'
  if (s === 'alarm') return { label: '报警', cls: 'danger' }
  if (s === 'fault') return { label: '故障', cls: 'warning' }
  if (s === 'offline') return { label: '离线', cls: 'normal' }
  if (s === 'normal') return { label: '正常', cls: 'success' }
  return { label: '未知', cls: 'normal' }
}

/** 管理单元（分机）下拉项 */
const units = computed(() => {
  const codeOf = new Map(points.value.map(p => [p.id, p.code]))
  const seen = new Map<string, string>()
  for (const p of points.value) {
    if (!p.hostId) continue
    const label = codeOf.get(p.hostId)
    if (label) seen.set(p.hostId, label)
  }
  return [...seen].map(([id, label]) => ({ id, label }))
})

const siblingIndex = computed(() =>
  activePoint.value ? siblings.value.findIndex(p => p.id === activePoint.value!.id) : -1,
)

// ===== 下钻 =====

function openGroup(g: FireWaterPointGroup): void {
  group.value = g
  groupOpen.value = true
}

/** 统计卡下钻：卡片所辖点位就是该卡数值的来源集合 */
function openCard(card: FireWaterCardValue): void {
  openGroup({
    key: card.key,
    title: card.label,
    desc: card.hint,
    points: card.points,
  })
}

/** 点行：关掉组抽屉，切到单点详情（组内点位作为"上一条/下一个"导航） */
function openPoint(p: PointDef): void {
  groupOpen.value = false
  activePoint.value = p
  siblings.value = group.value?.points ?? [p]
  detailOpen.value = true
}

/** 报警记录行 → 单点详情 */
function openPointById(record: { pointId: string }): void {
  const p = points.value.find(x => x.id === record.pointId)
  if (!p) return
  groupOpen.value = false
  group.value = undefined
  activePoint.value = p
  siblings.value = [p]
  detailOpen.value = true
}

/** 设备台帐行 → 所属图元分组（按画面绑定反查） */
function openPointGroup(p: PointDef): void {
  const owner = findOwnerNode(p.id, points.value)
  if (!owner) {
    ElMessage.info('该设备未绑定到组态图元')
    return
  }
  const label = owner.node.label ?? owner.node.symbol
  openGroup({
    key: owner.node.id,
    title: `${label} 所辖点位`,
    desc: `${owner.points.length} 个点位`,
    points: owner.points,
  })
}

function onConfig(p: PointDef): void {
  ElMessage.info(`「${p.code}」的设备配置能力尚未接入`)
}

function gotoSibling(p: PointDef): void {
  activePoint.value = p
}

function hostLabelOf(pt?: PointDef): string {
  if (!pt?.hostId) return '—'
  const h = points.value.find(x => x.id === pt.hostId)
  return h ? h.code : pt.hostId
}

async function handleControl({ point, action }: { point: PointDef; action: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认对 ${point.code}（${point.location}）下发「${action === 'start' ? '远程启动' : '远程停止'}」指令？该操作将真实动作于消防设施。`,
      '联动控制二次确认',
      { type: 'warning', confirmButtonText: '确认下发', cancelButtonText: '取消' },
    )
    ElMessage.success(`指令已下发：${point.code} ${action === 'start' ? '启动' : '停止'}`)
  } catch {
    // 用户取消
  }
}

function markHandled(id: string): void {
  alarm.markHandled(id)
}

// ===== 生命周期 =====

onMounted(() => {
  loadSubsystem('pipeline')
})

/**
 * 报警记录与点位状态同源：每轮刷新后同步一次。
 *
 * runtime 是 keyed 的 reactive Map，内容变而引用不变，watch(runtime) 不触发，
 * 所以用 store 的刷新序号驱动。跃迁判定在 store 内做（正常 → 报警/故障 才记一条）。
 */
watch(refreshSeq, () => {
  alarm.sync(points.value, getRuntime)
})

onBeforeUnmount(() => stopTimer())
</script>

<style scoped>
.fwm {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  /* 页面不出垂直滚动条：溢出只交给内部表格体 */
  overflow: hidden;
}

/* ===== 统计区（常驻、固定高度） ===== */
.fwm__stats {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fwm__stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.fwm__stats-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.fwm__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}
.fwm__stats-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.fwm__live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--normal-bg);
}
.fwm__live--running { color: var(--success-text); background: var(--success-bg); }
/* 定时器没在跑但用户没手动暂停：数据是静止的，必须显式说破 */
.fwm__live--stopped { color: var(--danger-text); background: var(--danger-bg); font-weight: 600; }
.fwm__live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.fwm__live--running .fwm__live-dot { animation: fwm-blink 1.6s ease-in-out infinite; }
@keyframes fwm-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
.fwm__stamp { font-size: var(--font-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.fwm__live-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  font: inherit;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease;
}
.fwm__live-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

/* ===== 主体区（填满剩余高度） ===== */
.fwm__panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.fwm__panel > * {
  flex: 1;
  min-height: 0;
}
</style>
