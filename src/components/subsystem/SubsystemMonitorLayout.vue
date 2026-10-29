<template>
  <div class="sm">
    <!-- ============ 统计区（常驻，固定高度） ============ -->
    <section class="sm__stats">
      <div class="sm__stats-head">
        <div class="sm__stats-left">
          <h1 class="sm__title">{{ title }}</h1>
        </div>
        <div class="sm__stats-right">
          <span class="sm__live" :class="`sm__live--${refreshState}`">
            <span class="sm__live-dot" />
            {{ refreshText }}
          </span>
          <span class="sm__stamp">更新 {{ stampText }}</span>
          <button class="sm__live-btn" @click="toggleLive">
            <AppIcon :name="live ? 'pause' : 'play'" />
            {{ live ? '暂停' : '恢复' }}
          </button>
        </div>
      </div>

      <SubsystemCoreCards :cards="cards" @select="openCard" />
    </section>

    <!-- ============ 视图切换 ============ -->
    <SubsystemTabs v-model="tab" :tabs="tabs" :system-label="title" />

    <!-- ============ 主体区（填满剩余高度） ============ -->
    <section class="sm__panel">
      <!-- 系统总览 -->
      <template v-if="tab === 'overview'">
        <SubsystemScene :adapter="scene" @select="openGroup" />
      </template>

      <!-- 报警记录 -->
      <template v-else-if="tab === 'alarm'">
        <SubsystemAlarmTable
          :records="alarmRecords"
          :unhandled-count="alarmUnhandled"
          :type-name-of="typeNameOf"
          :units="units"
          :alarm-label="alarmLabel"
          :export-name="`${title}报警记录`"
          @handle="emit('handle-alarm', $event)"
          @preview="openPointById"
        />
      </template>

      <!-- 设备台帐 -->
      <template v-else>
        <SubsystemLedgerTable
          :points="points"
          :type-name-of="typeNameOf"
          :status-of="statusOfPoint"
          :export-name="`${title}设备台帐`"
          @preview="openPoint"
          @group="openPointGroup"
          @config="emit('config', $event)"
        />
      </template>
    </section>

    <!-- ============ 下钻抽屉 ============ -->
    <SubsystemPointDrawer
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
      @control="emit('control', $event)"
      @sibling="gotoSibling"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 子系统监测页 · 页面骨架（三系统共用）
 *
 * 版式（设计稿）：
 *   顶部统计区常驻且高度固定 → 视图切换条 → 主体区填满窗口剩余高度
 *   主体区三视图：系统总览（组态）/ 报警记录 / 设备台帐
 *
 * 页面整体不出现垂直滚动条：根容器 height:100% + overflow:hidden，
 * 溢出只发生在表格体内部。
 *
 * 各系统只提供数据与口径：标题、统计卡、组态画面适配器、报警记录；
 * 下钻、抽屉、实时刷新状态机都在这里，三页完全一致。
 */
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import type { PointDef, PointStatus } from '@/types/subsystem'
import type {
  SubsystemAlarmRecord,
  SubsystemCardValue,
  SubsystemPointGroup,
  SubsystemSceneAdapter,
  SubsystemTabKey,
} from '@/types/subsystem-scene'
import SubsystemCoreCards from '@/components/subsystem/SubsystemCoreCards.vue'
import SubsystemTabs from '@/components/subsystem/SubsystemTabs.vue'
import SubsystemScene from '@/components/subsystem/SubsystemScene.vue'
import SubsystemAlarmTable from '@/components/subsystem/SubsystemAlarmTable.vue'
import SubsystemLedgerTable from '@/components/subsystem/SubsystemLedgerTable.vue'
import SubsystemPointDrawer from '@/components/subsystem/SubsystemPointDrawer.vue'
import PointDetailDrawer from '@/components/subsystem/PointDetailDrawer.vue'

const props = withDefaults(
  defineProps<{
    /** 页面标题（统计区左上角） */
    title: string
    /** 顶部统计卡 */
    cards: SubsystemCardValue[]
    /** 视图切换项 */
    tabs: Array<{ key: SubsystemTabKey; label: string }>
    /** 组态画面适配器 */
    scene: SubsystemSceneAdapter
    /** 报警记录 */
    alarmRecords: SubsystemAlarmRecord[]
    /** 未处理报警数 */
    alarmUnhandled: number
    /** 越限事件在「事件类型」列的叫法 */
    alarmLabel?: string
  }>(),
  { alarmLabel: '报警' },
)

const emit = defineEmits<{
  /** 标记报警已处理 */
  'handle-alarm': [id: string]
  /** 联动控制 */
  control: [payload: { point: PointDef; action: string }]
  /** 设备配置 */
  config: [point: PointDef]
}>()

const store = useSubsystemStore()
const { points, live, lastUpdate, timerRunning } = storeToRefs(store)
const { getRuntime, findProfile, toggleLive } = store

// ===== 视图切换 =====
const tab = ref<SubsystemTabKey>('overview')

// ===== 抽屉 =====
const groupOpen = ref(false)
const group = ref<SubsystemPointGroup | undefined>()
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

function openGroup(g: SubsystemPointGroup): void {
  group.value = g
  groupOpen.value = true
}

/** 统计卡下钻：卡片所辖点位就是该卡数值的来源集合 */
function openCard(card: SubsystemCardValue): void {
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
  const owner = props.scene.findOwnerNode(p.id, points.value)
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

function gotoSibling(p: PointDef): void {
  activePoint.value = p
}

function hostLabelOf(pt?: PointDef): string {
  if (!pt?.hostId) return '—'
  const h = points.value.find(x => x.id === pt.hostId)
  return h ? h.code : pt.hostId
}
</script>

<style scoped>
.sm {
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
.sm__stats {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sm__stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.sm__stats-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.sm__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}
.sm__stats-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.sm__live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 10px;
  background: var(--normal-bg);
}
.sm__live--running { color: var(--success-text); background: var(--success-bg); }
/* 定时器没在跑但用户没手动暂停：数据是静止的，必须显式说破 */
.sm__live--stopped { color: var(--danger-text); background: var(--danger-bg); font-weight: 600; }
.sm__live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.sm__live--running .sm__live-dot { animation: sm-blink 1.6s ease-in-out infinite; }
@keyframes sm-blink { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
.sm__stamp { font-size: var(--font-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.sm__live-btn {
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
.sm__live-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

/* ===== 主体区（填满剩余高度） ===== */
.sm__panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.sm__panel > * {
  flex: 1;
  min-height: 0;
}
</style>
