<template>
  <div v-if="profile" class="tp">
    <!-- ============ 页头 ============ -->
    <header class="tp__head">
      <div class="tp__head-left">
        <span class="tp__head-icon"><AppIcon name="dashboard" /></span>
        <div>
          <h1 class="tp__title">消防管网组态总览</h1>
          <p class="tp__desc">
            按系统构成呈现管网运行态势——每个环节聚合其下监测点位，环节异常即标红，点击可查看具体异常点位。
          </p>
        </div>
      </div>
      <div class="tp__head-right">
        <span class="tp__live" :class="`tp__live--${refreshState}`">
          <span class="tp__live-dot" />
          {{ refreshText }}
        </span>
        <span class="tp__stamp">数据更新 {{ stampText }}</span>
        <button class="tp__live-btn" @click="toggleLive">
          <AppIcon :name="live ? 'pause' : 'play'" />
          {{ live ? '暂停' : '恢复' }}
        </button>
      </div>
    </header>

    <!-- ============ 总状态条 ============ -->
    <div class="tp__bar" :class="`tp__bar--${overallStatus}`">
      <span class="tp__bar-dot" />
      <span class="tp__bar-text">{{ overallText }}</span>
      <span class="tp__bar-sep" />
      <span class="tp__bar-stat">
        监测环节 <b>{{ aggregates.length }}</b> 个
      </span>
      <span class="tp__bar-stat">
        异常环节 <b :class="{ 'tp__bar-num--bad': abnormalStageCount > 0 }">{{ abnormalStageCount }}</b> 个
      </span>
      <span class="tp__bar-stat">
        异常点位 <b :class="{ 'tp__bar-num--bad': abnormalPointCount > 0 }">{{ abnormalPointCount }}</b> 个
      </span>
      <span class="tp__bar-stat">
        监测点位合计 <b>{{ totalPointCount }}</b> 个
      </span>
    </div>

    <div class="tp__body">
      <!-- ============ 组态图 ============ -->
      <section class="tp__canvas">
        <div class="tp__canvas-head">
          <h2 class="tp__section-title">系统组态</h2>
          <span class="tp__section-hint">按水力流向：自左向右，再向下分流 · 点击环节查看其下点位</span>
        </div>
        <TopologyDiagram
          title="消防管网"
          :stages="PIPELINE_STAGES"
          :links="PIPELINE_LINKS"
          :aggregates="aggregates"
          @select="onSelectStage"
        />

        <!-- 图例 -->
        <div class="tp__legend">
          <span v-for="l in legend" :key="l.key" class="tp__legend-item">
            <i class="tp__legend-dot" :class="`tp__legend-dot--${l.key}`" />
            {{ l.text }}
          </span>
          <span class="tp__legend-note">离线不单列状态——设备是否失联属"设备监测"页；此处用数据更新时间体现数据新鲜度</span>
        </div>
      </section>

      <!-- ============ 右侧面板 ============ -->
      <aside class="tp__panel">
        <!-- 态1：异常清单 -->
        <template v-if="!selectedStageAgg">
          <div class="tp__panel-head">
            <h2 class="tp__section-title">异常清单</h2>
            <span class="tp__panel-count">{{ abnormalPointCount }} 个异常点位</span>
          </div>

          <div v-if="abnormalStages.length === 0" class="tp__empty">
            <AppIcon name="check" class="tp__empty-icon" />
            <div class="tp__empty-title">管网运行正常</div>
            <div class="tp__empty-text">全部 {{ aggregates.length }} 个环节均无报警与故障</div>
          </div>

          <div v-else class="tp__panel-body">
            <div v-for="a in abnormalStages" :key="a.stage.id" class="tp__group">
              <button class="tp__group-head" @click="onSelectStage(a.stage.id)">
                <PointStatusDot :status="a.status === 'alarm' ? 'alarm' : 'fault'" size="sm" show-label />
                <span class="tp__group-name">{{ a.stage.name }}</span>
                <span class="tp__group-num">
                  {{ a.status === 'alarm' ? a.counts.alarm : a.counts.fault }} 个
                </span>
                <AppIcon name="chevron-right" class="tp__group-arrow" />
              </button>
              <div class="tp__group-points">
                <PointRow
                  v-for="p in abnormalPointsOf(a)"
                  :key="p.id"
                  :point="p"
                  :runtime="getRuntime(p.id)"
                  @open="openDetail"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- 态2：某环节的全部点位 -->
        <template v-else>
          <div class="tp__panel-head">
            <button class="tp__back" @click="selectedStage = null">
              <AppIcon name="chevron-left" />返回异常清单
            </button>
            <h2 class="tp__section-title">{{ selectedStageAgg.stage.name }}</h2>
          </div>
          <div class="tp__panel-sub">
            <span class="tp__panel-count">
              {{ selectedStageAgg.status === 'normal' ? '全部' : '异常' }}
              {{ selectedPoints.length }} / {{ selectedStageAgg.points.length }} 个点位
            </span>
            <span class="tp__panel-count">更新 {{ timeText(selectedStageAgg.updatedAt) }}</span>
          </div>
          <div class="tp__panel-body">
            <div v-if="!selectedPoints.length" class="tp__empty">
              <div class="tp__empty-title">无异常点位</div>
            </div>
            <PointRow
              v-for="p in selectedPoints"
              :key="p.id"
              :point="p"
              :runtime="getRuntime(p.id)"
              @open="openDetail"
            />
          </div>
        </template>
      </aside>
    </div>

    <!-- ============ 点位详情（复用现有抽屉） ============ -->
    <PointDetailDrawer
      v-model="drawerOpen"
      :point="activePoint"
      :runtime="activePoint ? getRuntime(activePoint.id) : undefined"
      :profile="activePoint ? findProfile(activePoint.typeKey) : undefined"
      :host-label="hostLabelOf(activePoint)"
      :siblings="drawerSiblings"
      :sibling-index="drawerSiblingIndex"
      @sibling="onSibling"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from '@/components/base/AppIcon.vue'
import PointStatusDot from '@/components/subsystem/PointStatusDot.vue'
import PointDetailDrawer from '@/components/subsystem/PointDetailDrawer.vue'
import TopologyDiagram from '@/components/subsystem/TopologyDiagram.vue'
import PointRow from '@/components/subsystem/PointRow.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import {
  PIPELINE_STAGES,
  PIPELINE_LINKS,
  aggregateStages,
  isStageAbnormal,
  type StageAggregate,
  type StageStatus,
} from '@/config/subsystem-topology'
import type { PointDef } from '@/types/subsystem'

const store = useSubsystemStore()
const { activeProfile: profile, points, lastUpdate, live, timerRunning } = storeToRefs(store)
const { getRuntime, findProfile, loadSubsystem, stopTimer, toggleLive } = store

/**
 * 刷新状态
 *
 * live=true 只说明"用户没手动暂停"，不代表定时器还活着。
 * 页面切换曾把定时器停掉、而 live 仍是 true，就会出现
 * "界面显示在刷新、数据却不动"的假象 —— 值守场景下这比报错更危险。
 * 所以这里显式区分 running / stopped / paused。
 */
const refreshState = computed<'running' | 'stopped' | 'paused'>(() => {
  if (!live.value) return 'paused'
  return timerRunning.value ? 'running' : 'stopped'
})
const refreshText = computed(
  () => ({ running: '实时刷新中', stopped: '刷新已停止', paused: '已暂停' })[refreshState.value],
)

const selectedStage = ref<string | null>(null)
const drawerOpen = ref(false)
const activePoint = ref<PointDef | undefined>()

/** 环节聚合结果 */
const aggregates = computed<StageAggregate[]>(() =>
  aggregateStages(PIPELINE_STAGES, points.value, getRuntime),
)

const abnormalStages = computed(() => aggregates.value.filter(a => isStageAbnormal(a.status)))
const abnormalStageCount = computed(() => abnormalStages.value.length)
const abnormalPointCount = computed(
  () => aggregates.value.reduce((n, a) => n + a.counts.alarm + a.counts.fault, 0),
)
const totalPointCount = computed(() => aggregates.value.reduce((n, a) => n + a.points.length, 0))

/** 总状态：任一环节异常即异常；全环节无数据则为无数据 */
const overallStatus = computed<StageStatus>(() => {
  if (abnormalStageCount.value > 0) return 'alarm'
  const hasData = aggregates.value.some(a => a.activeCount > 0)
  return hasData ? 'normal' : 'nodata'
})
const overallText = computed(() => {
  if (overallStatus.value === 'alarm') return '存在异常'
  if (overallStatus.value === 'nodata') return '暂无数据'
  return '全部正常'
})

const stampText = computed(() => timeText(lastUpdate.value))

function timeText(ts: number): string {
  if (!ts) return '--:--:--'
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

const legend = [
  { key: 'normal', text: '正常' },
  { key: 'alarm', text: '报警' },
  { key: 'fault', text: '故障' },
  { key: 'nodata', text: '无数据' },
]

/** 环节下的异常点位（异常优先） */
function abnormalPointsOf(a: StageAggregate): PointDef[] {
  return a.points
    .filter(p => {
      const s = getRuntime(p.id)?.status
      return s === 'alarm' || s === 'fault'
    })
    .sort((x, y) => {
      const rank = (id: string) => {
        const s = getRuntime(id)?.status
        return s === 'alarm' ? 0 : s === 'fault' ? 1 : 2
      }
      return rank(x.id) - rank(y.id) || x.code.localeCompare(y.code)
    })
}

/** 选中的环节：异常时只列异常点位，正常时列全部 */
const selectedStageAgg = computed(() =>
  selectedStage.value ? aggregates.value.find(a => a.stage.id === selectedStage.value) ?? null : null,
)
const selectedPoints = computed<PointDef[]>(() => {
  const a = selectedStageAgg.value
  if (!a) return []
  if (isStageAbnormal(a.status)) return abnormalPointsOf(a)
  return [...a.points].sort((x, y) => x.code.localeCompare(y.code))
})

function onSelectStage(stageId: string) {
  selectedStage.value = selectedStage.value === stageId ? null : stageId
}

/**
 * 当前右侧面板正在展示的点位集合 —— 抽屉的"上一条/下一条"就在这个集合里走，
 * 值班员处理几十个异常时不用关抽屉回列表重找。
 */
const visiblePoints = computed<PointDef[]>(() => {
  if (selectedStageAgg.value) return selectedPoints.value
  return abnormalStages.value.flatMap(a => abnormalPointsOf(a))
})

const drawerSiblings = ref<PointDef[]>([])
const drawerSiblingIndex = ref(-1)

function openDetail(p: PointDef) {
  const list = visiblePoints.value
  const idx = list.findIndex(x => x.id === p.id)
  drawerSiblings.value = idx >= 0 ? list : []
  drawerSiblingIndex.value = idx
  activePoint.value = p
  drawerOpen.value = true
}

function onSibling(p: PointDef) {
  drawerSiblingIndex.value = drawerSiblings.value.findIndex(x => x.id === p.id)
  activePoint.value = p
}

function hostLabelOf(pt?: PointDef) {
  if (!pt?.hostId) return '—'
  const h = points.value.find(x => x.id === pt.hostId)
  return h ? h.code : pt.hostId
}

loadSubsystem('pipeline')

// 离开本页面时停掉后台刷新；store 的 loadSubsystem 会在同子系统换页时把它续上
onBeforeUnmount(() => stopTimer())
</script>

<style scoped>
.tp {
  display: flex; flex-direction: column; gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  height: 100%; min-height: 620px;
}

/* 页头 */
.tp__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--spacing-lg); flex-wrap: wrap;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.tp__head-left { display: flex; align-items: flex-start; gap: var(--spacing-lg); min-width: 0; }
.tp__head-right { display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap; }
.tp__head-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: var(--radius-md);
  background: var(--accent-primary10); color: var(--accent-primary);
  font-size: 20px; flex-shrink: 0;
}
.tp__title { margin: 0 0 3px; font-size: var(--font-h4); font-weight: 600; color: var(--text-primary); }
.tp__desc { margin: 0; font-size: var(--font-xs); color: var(--text-muted); line-height: 1.6; }
.tp__stamp { font-size: var(--font-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }

/* 刷新状态指示：必须能区分"在刷新 / 已停 / 用户暂停"，
   否则值守员看到静止的数据却以为系统在实时更新 */
.tp__live {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: var(--font-xs); color: var(--text-muted);
  padding: 3px 8px; border-radius: 10px; background: var(--normal-bg);
}
.tp__live--running { color: var(--success-text); background: var(--success-bg); }
.tp__live--stopped { color: var(--danger-text); background: var(--danger-bg); font-weight: 600; }
.tp__live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tp__live--running .tp__live-dot { animation: tp-blink 1.6s ease-in-out infinite; }
.tp__live-btn {
  display: inline-flex; align-items: center; gap: 4px;
  height: 28px; padding: 0 10px;
  font: inherit; font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color .2s ease, color .2s ease;
}
.tp__live-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

/* 总状态条 */
.tp__bar {
  display: flex; align-items: center; gap: var(--spacing-lg); flex-wrap: wrap;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
}
.tp__bar--alarm { border-color: var(--danger); background: var(--danger-bg); }
.tp__bar--normal { border-color: var(--success); background: var(--success-bg); }
.tp__bar--nodata { border-color: var(--border-high); background: var(--normal-bg); }
.tp__bar-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--text-muted); flex-shrink: 0;
}
.tp__bar--alarm .tp__bar-dot { background: var(--danger); animation: tp-blink 1.8s ease-in-out infinite; }
.tp__bar--normal .tp__bar-dot { background: var(--success); }
@keyframes tp-blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
.tp__bar-text { font-size: var(--font-h4); font-weight: 600; color: var(--text-primary); }
.tp__bar-sep { width: 1px; height: 20px; background: var(--border-default); }
.tp__bar-stat { font-size: var(--font-xs); color: var(--text-secondary); }
.tp__bar-stat b { font-size: var(--font-small); color: var(--text-primary); font-variant-numeric: tabular-nums; }
.tp__bar-num--bad { color: var(--danger-text) !important; }

/* 主体 */
.tp__body {
  display: flex; gap: var(--spacing-lg); align-items: stretch;
  flex: 1; min-height: 0;
}
.tp__canvas {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.tp__canvas-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--spacing-md); }
.tp__section-title { margin: 0; font-size: var(--font-h4); font-weight: 600; color: var(--text-primary); }
.tp__section-hint { font-size: var(--font-xs); color: var(--text-muted); }

/* 图例 */
.tp__legend {
  display: flex; align-items: center; gap: var(--spacing-lg); flex-wrap: wrap;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-low);
  font-size: var(--font-xs); color: var(--text-secondary);
}
.tp__legend-item { display: inline-flex; align-items: center; gap: 5px; }
.tp__legend-dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
.tp__legend-dot--normal { background: var(--success); }
.tp__legend-dot--alarm { background: var(--danger); }
.tp__legend-dot--fault { background: var(--warning); }
.tp__legend-dot--nodata { background: var(--border-high); }
.tp__legend-note { color: var(--text-muted); margin-left: auto; }

/* 右侧面板 */
.tp__panel {
  width: 380px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  min-height: 0;
}
.tp__panel-head { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-sm); }
.tp__panel-sub { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-sm); }
.tp__panel-count { font-size: var(--font-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.tp__panel-body {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--spacing-sm);
  padding-right: 2px;
}
.tp__back {
  display: inline-flex; align-items: center; gap: 2px;
  font: inherit; font-size: var(--font-xs);
  color: var(--accent-primary); background: none; border: none;
  cursor: pointer; padding: 2px 4px;
}

/* 异常分组 */
/* flex-shrink:0 必须加：面板是列向 flex + 内部滚动，不加的话分组会被压扁成 0 高，
   点位行直接消失（表现为"分组写着 3 个，下面一条都没有"） */
.tp__group {
  flex-shrink: 0;
  border: 1px solid var(--border-low); border-radius: var(--radius-md); overflow: hidden;
}
.tp__group-head {
  display: flex; align-items: center; gap: var(--spacing-sm); width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font: inherit; text-align: left;
  background: var(--bg-sub-card);
  border: none; border-bottom: 1px solid var(--border-low);
  cursor: pointer;
}
.tp__group-head:hover { background: var(--accent-primary10); }
.tp__group-name { flex: 1; font-size: var(--font-xs); font-weight: 600; color: var(--text-primary); }
.tp__group-num { font-size: var(--font-xs); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.tp__group-arrow { color: var(--text-muted); font-size: 13px; }
.tp__group-points { padding: 2px var(--spacing-sm) var(--spacing-sm); }

/* 空态 */
.tp__empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: var(--spacing-xl) 0; text-align: center;
}
.tp__empty-icon { font-size: 30px; color: var(--success-text); }
.tp__empty-title { font-size: var(--font-small); font-weight: 600; color: var(--text-primary); }
.tp__empty-text { font-size: var(--font-xs); color: var(--text-muted); }

/**
 * 窄屏 / 矮屏兜底
 *
 * 「组态图 + 右侧清单」并排时，1440px 窗口下图元缩放比只有 0.76，图内文字剩 10.3px；
 * 1366px 更会被压到 128px 宽、缩放比 0.14，文字只剩 2px，完全读不出。
 * 所以窗口宽度或高度不足时，让清单落到组态图下方，把整幅宽度让给组态图，
 * 并把纵向空间交还给页面滚动（值守大屏优先保证组态图可读）。
 */
@media (max-width: 1366px), (max-height: 900px) {
  .tp { height: auto; min-height: 100%; }
  .tp__body { flex-direction: column; }
  .tp__canvas { flex: none; }
  .tp__panel { width: 100%; max-height: none; }
  .tp__panel-body { max-height: 480px; }
}
</style>
