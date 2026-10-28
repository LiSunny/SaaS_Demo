<template>
  <div class="fwm">
    <!-- ============ 页头 ============ -->
    <header class="fwm__head">
      <div class="fwm__head-left">
        <span class="fwm__head-icon"><AppIcon name="vehicle" /></span>
        <div class="fwm__head-main">
          <div class="fwm__title-row">
            <h1 class="fwm__title">消防水系统监测</h1>
            <span class="fwm__demo-tag" title="当前为 POC 演示数据，数据由本地引擎模拟，尚未接入真实消防设施">
              演示数据
            </span>
          </div>
          <p class="fwm__desc">
            消防给水系统总貌实时监测——{{ scaleText }}
          </p>
        </div>
      </div>

      <div class="fwm__head-right">
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
    </header>

    <!-- ============ ① 核心数据 ============ -->
    <section class="fwm__section">
      <div class="fwm__section-head">
        <h2 class="fwm__section-title">核心数据</h2>
        <span class="fwm__section-hint">供水压力取管网最不利点 · 供水流量取测点均值 · 水池水位取最低值</span>
      </div>
      <FireWaterCoreCards :cards="cards" @select="openCard" />
    </section>

    <!-- ============ ② 组态 ============ -->
    <section class="fwm__section">
      <div class="fwm__section-head">
        <h2 class="fwm__section-title">消防给水系统总貌</h2>
        <span class="fwm__section-hint">按水力流向：水池 → 水箱 → 泵组 → 各末端支路 · 点击图元查看其下点位</span>
      </div>
      <FireWaterScene @select="openGroup" />
    </section>

    <!-- ============ ③ 报警记录 ============ -->
    <section class="fwm__section">
      <div class="fwm__section-head">
        <h2 class="fwm__section-title">报警记录</h2>
        <span class="fwm__section-hint">状态跃迁实时累积 · 与组态状态同源</span>
      </div>
      <FireWaterAlarmTable
        :records="alarmRecords"
        :unhandled-count="alarmUnhandled"
        @handle="markHandled"
      />
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
 * 垂直三段：① 核心数据 → ② 组态 → ③ 报警记录
 * 数据全部来自 useSubsystemStore('pipeline')，与组态配置页、组态总览页同源。
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import { useFirewaterAlarmStore } from '@/stores/firewater-alarm'
import type { PointDef } from '@/types/subsystem'
import type { FireWaterPointGroup } from '@/types/firewater'
import { computeFireWaterCards, type FireWaterCardValue } from '@/config/firewater-scene'
import FireWaterCoreCards from '@/components/subsystem/FireWaterCoreCards.vue'
import FireWaterScene from '@/components/subsystem/FireWaterScene.vue'
import FireWaterAlarmTable from '@/components/subsystem/FireWaterAlarmTable.vue'
import FireWaterPointDrawer from '@/components/subsystem/FireWaterPointDrawer.vue'
import PointDetailDrawer from '@/components/subsystem/PointDetailDrawer.vue'

const store = useSubsystemStore()
const { points, runtime, live, lastUpdate, timerRunning } = storeToRefs(store)
const { getRuntime, findProfile, loadSubsystem, toggleLive, stopTimer } = store

const alarm = useFirewaterAlarmStore()
const { records: alarmRecords, unhandledCount: alarmUnhandled } = storeToRefs(alarm)

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

/**
 * 规模说明运行时计算，避免手写数字与实际点位对不上。
 * 点位数取 points 全量（主机 + 分机 + 采集设备），
 * 与「系统状态」卡的口径一致；scale.devices 的和只是设备数，不等于点位数。
 */
const scaleText = computed(() => {
  const p = store.activeProfile
  if (!p) return ''
  return `共 ${p.scale.host} 处主机、${p.scale.slave} 台分机、${points.value.length} 个采集点位。`
})

const cards = computed<FireWaterCardValue[]>(() =>
  computeFireWaterCards(points.value, getRuntime),
)

const siblingIndex = computed(() =>
  activePoint.value ? siblings.value.findIndex(p => p.id === activePoint.value!.id) : -1,
)

// ===== 下钻 =====

function openGroup(g: FireWaterPointGroup): void {
  group.value = g
  groupOpen.value = true
}

/** 核心数据卡下钻：卡片所辖点位就是该卡数值的来源集合 */
function openCard(card: FireWaterCardValue): void {
  openGroup({
    key: card.key,
    title: card.label,
    desc: `${card.sub}${card.normalRange ? ` · ${card.normalRange}` : ''}`,
    points: card.points,
  })
}

/** 点行：关掉组抽屉，切到单点详情（组内点位作为"上一条/下一个"导航） */
function openPoint(p: PointDef): void {
  groupOpen.value = false
  activePoint.value = p
  siblings.value = group.value?.points ?? []
  detailOpen.value = true
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
 * 报警记录与点位状态同源：runtime 每次被整体替换即触发一次同步。
 * 跃迁判定在 store 内做（正常 → 报警/故障 才记一条）。
 */
watch(runtime, () => {
  alarm.sync(points.value, getRuntime)
})

onBeforeUnmount(() => stopTimer())
</script>

<style scoped>
.fwm {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  min-height: 100%;
}

/* 页头 */
.fwm__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-xl);
  flex-wrap: wrap;
  padding: var(--spacing-xl);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--accent-primary);
}
.fwm__head-left { display: flex; align-items: flex-start; gap: var(--spacing-lg); min-width: 0; }
.fwm__head-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--accent-primary10);
  color: var(--accent-primary);
  font-size: 22px;
  flex-shrink: 0;
}
.fwm__head-main { min-width: 0; }
.fwm__title-row { display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap; }
.fwm__title { margin: 0 0 4px; font-size: var(--font-h3); font-weight: 600; color: var(--text-primary); }
.fwm__demo-tag {
  margin-bottom: 4px;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: var(--font-xs);
  font-weight: 500;
  color: var(--warning-text);
  background: var(--warning-bg);
}
.fwm__desc { margin: 0; font-size: var(--font-xs); color: var(--text-muted); line-height: 1.6; max-width: 760px; }

.fwm__head-right { display: flex; align-items: center; gap: var(--spacing-md); flex-shrink: 0; }
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

/* 分区 */
.fwm__section { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.fwm__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}
.fwm__section-title {
  margin: 0;
  font-size: var(--font-h4);
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}
.fwm__section-title::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--accent-primary);
}
.fwm__section-hint { font-size: var(--font-xs); color: var(--text-muted); }
</style>
