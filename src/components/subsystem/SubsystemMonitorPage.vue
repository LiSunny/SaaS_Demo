<template>
  <div v-if="profile" class="smp">
    <!-- ============ 页头 ============ -->
    <header class="smp__head" :style="{ '--accent': profile.accent }">
      <div class="smp__head-left">
        <span class="smp__head-icon"><AppIcon :name="profile.icon" /></span>
        <div class="smp__head-main">
          <div class="smp__title-row">
            <h1 class="smp__title">{{ profile.name }}</h1>
            <span class="smp__demo-tag" title="当前为 POC 演示数据，数据由本地引擎模拟，尚未接入真实消防设施">
              演示数据
            </span>
          </div>
          <p class="smp__desc">{{ profile.description }}{{ scaleText }}</p>
        </div>
      </div>

      <div class="smp__head-right">
        <span
          class="smp__live"
          :class="{ 'smp__live--on': live && timerRunning, 'smp__live--off': live && !timerRunning }"
        >
          <span class="smp__live-dot" />
          {{ live ? (timerRunning ? '实时刷新中' : '刷新已停止') : '已暂停' }}
        </span>
        <span class="smp__stamp">更新 {{ stampText }}</span>
        <button class="smp__live-btn" @click="toggleLive">
          <AppIcon :name="live ? 'pause' : 'play'" />
          {{ live ? '暂停' : '恢复' }}
        </button>
      </div>
    </header>

    <!-- ============ 工具条：全局搜索 + 当前筛选 ============ -->
    <div class="smp__toolbar">
      <el-input
        v-model="keyword"
        size="small"
        placeholder="搜索编号 / 位置 / 设备类型（跨全部分区）"
        clearable
        class="smp__search"
      >
        <template #prefix><AppIcon name="search" /></template>
      </el-input>

      <div v-if="statusFilter" class="smp__filter">
        <span class="smp__filter-text">已筛选：{{ statusLabel(statusFilter) }}</span>
        <span class="smp__filter-count">{{ filteredTotal }} 个</span>
        <button class="smp__filter-clear" @click="statusFilter = null">
          <AppIcon name="clear" />清除筛选
        </button>
      </div>
      <span v-else class="smp__toolbar-hint">
        共 {{ points.length }} 个点位 · 点击上方汇总卡可按状态快速筛选
      </span>
    </div>

    <!-- ============ 汇总 KPI（可点击下钻） ============ -->
    <SubsystemSummaryBar
      :cards="profile.summaryCards"
      :status-count="statusCount"
      :total="points.length"
      :active="statusFilter ?? 'total'"
      @select="onSummarySelect"
    />

    <!-- ============ 主机 / 分机状态 ============ -->
    <section class="smp__section">
      <div class="smp__section-head">
        <h2 class="smp__section-title">主机与分机状态</h2>
        <span class="smp__section-hint">{{ hosts.length }} 台 · 数据延迟 &lt; 3s</span>
      </div>
      <div class="smp__hosts">
        <div v-for="h in hosts" :key="h.point.id" class="smp__host" :class="`smp__host--${h.status}`">
          <PointStatusDot :status="h.status" size="md" :show-label="isAbnormal(h.status)" />
          <div class="smp__host-body">
            <div class="smp__host-code">{{ h.point.code }}</div>
            <div class="smp__host-name">
              {{ h.profile?.name ?? '未知' }} · {{ h.point.location }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 各分区实时监测 ============ -->
    <section
      v-for="g in groupedBySection"
      :key="g.section.key"
      class="smp__section"
    >
      <div class="smp__section-head">
        <h2 class="smp__section-title">{{ g.section.title }}</h2>
        <span class="smp__section-hint">{{ sectionHint(g) }}</span>
      </div>

      <!-- 模拟量卡片区 -->
      <div v-if="g.section.layout === 'cards'" class="smp__cards">
        <PointCard
          v-for="pt in rendered(g.points)"
          :key="pt.id"
          :point="pt"
          :runtime="getRuntime(pt.id)"
          :on-select="openDetail"
        />
        <el-empty
          v-if="!rendered(g.points).length"
          :description="emptyText"
          :image-size="60"
        />
      </div>

      <!-- 开关量网格区 -->
      <div v-else class="smp__grid">
        <PointTile
          v-for="pt in rendered(g.points)"
          :key="pt.id"
          :point="pt"
          :runtime="getRuntime(pt.id)"
          :on-select="openDetail"
        />
        <el-empty
          v-if="!rendered(g.points).length"
          :description="emptyText"
          :image-size="60"
        />
      </div>

      <!-- 渲染上限提示（必须说明被藏起来的有多少异常） -->
      <div v-if="truncInfo(g)" class="smp__more">
        <AppIcon name="tips" />
        <span>{{ truncInfo(g)!.text }}</span>
        <button type="button" class="smp__more-link" @click="exportCsv(g)">导出 CSV</button>
      </div>
    </section>

    <!-- ============ 点位详情 ============ -->
    <PointDetailDrawer
      v-model="drawerOpen"
      :point="activePoint"
      :runtime="activePoint ? getRuntime(activePoint.id) : undefined"
      :profile="activePoint ? findProfile(activePoint.typeKey) : undefined"
      :host-label="hostLabelOf(activePoint)"
      :siblings="abnormalPoints"
      :sibling-index="activeSiblingIndex"
      @control="handleControl"
      @sibling="gotoSibling"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { useSubsystemStore } from '@/stores/subsystem'
import type { PointDef, SubsystemSection, PointStatus } from '@/types/subsystem'
import PointStatusDot from './PointStatusDot.vue'
import PointCard from './PointCard.vue'
import PointTile from './PointTile.vue'
import SubsystemSummaryBar from './SubsystemSummaryBar.vue'
import PointDetailDrawer from './PointDetailDrawer.vue'
import { STATUS_LABELS, STATUS_ORDER, isAbnormalStatus } from './status-labels'

const props = defineProps<{
  /** 子系统 key，对应 config/subsystem-profiles.ts */
  subsystemKey: string
}>()

const MAX_RENDER = 240

const store = useSubsystemStore()

/**
 * state/getter 用 storeToRefs 解构（模板中自动解包，无需 .value）；
 * action 直接挂在 store 上调用。
 */
const {
  activeProfile: profile,
  points,
  statusCount,
  hosts,
  groupedBySection,
  live,
  lastUpdate,
  timerRunning,
} = storeToRefs(store)

/** actions 不参与响应式，直接转发 */
const { getRuntime, findProfile, loadSubsystem, toggleLive, stopTimer } = store

const keyword = ref('')
/** 状态筛选：由汇总卡点击驱动，null = 不筛选 */
const statusFilter = ref<PointStatus | null>(null)
const drawerOpen = ref(false)
const activePoint = ref<PointDef | undefined>()

// ===== 派生 =====

const stampText = computed(() => {
  const ts = lastUpdate.value
  if (!ts) return '--'
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
})

/** 规模说明由 scale 实时计算，避免手写数字与实际点位对不上 */
const scaleText = computed(() => {
  const p = profile.value
  if (!p) return ''
  const devices = p.scale.devices.reduce((sum, d) => sum + d.count, 0)
  return `共 ${p.scale.host} 处主机、${p.scale.slave} 台分机、${devices} 个采集点位。`
})

function statusOf(p: PointDef): PointStatus {
  return getRuntime(p.id)?.status ?? 'unknown'
}

function statusLabel(s: PointStatus): string {
  return STATUS_LABELS[s] ?? '未知'
}

function isAbnormal(s: PointStatus): boolean {
  return isAbnormalStatus(s)
}

/** 空态文案要说明"为什么空" */
const emptyText = computed(() => {
  if (statusFilter.value) return `当前筛选「${statusLabel(statusFilter.value)}」下无点位`
  if (keyword.value.trim()) return '没有匹配的点位'
  return '暂无点位'
})

/**
 * 过滤 + 排序。
 * 排序规则：异常优先（报警 > 故障 > 离线 > 未知 > 屏蔽 > 正常），同状态内按编号。
 * 值班员的动作是"先找异常"，不是"从第一个编号往下翻"。
 */
function filtered(list: PointDef[]): PointDef[] {
  let out = list
  if (statusFilter.value) {
    const want = statusFilter.value
    out = out.filter(p => statusOf(p) === want)
  }
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    out = out.filter(p =>
      p.code.toLowerCase().includes(kw) ||
      p.location.toLowerCase().includes(kw) ||
      (findProfile(p.typeKey)?.name ?? '').toLowerCase().includes(kw),
    )
  }
  return [...out].sort((a, b) => {
    const d = STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)]
    return d !== 0 ? d : a.code.localeCompare(b.code)
  })
}

/**
 * 渲染上限：异常点全部展示，剩余额度才给正常点。
 * 原实现直接 slice(0, 240)，把 791 个阀门里的报警一起截掉 —— 值班员永远看不到。
 */
function rendered(list: PointDef[]): PointDef[] {
  const f = filtered(list)
  const abnormal = f.filter(p => statusOf(p) !== 'normal')
  const normal = f.filter(p => statusOf(p) === 'normal')
  const room = Math.max(0, MAX_RENDER - abnormal.length)
  return [...abnormal, ...normal.slice(0, room)]
}

/** 截断提示：必须说清"藏起来的有多少异常"，否则用户会以为页面就是全部 */
function truncInfo(g: { section: SubsystemSection; points: PointDef[] }) {
  const all = filtered(g.points)
  const shown = rendered(g.points)
  if (all.length <= shown.length) return null
  const hidden = all.length - shown.length
  const abnormalAll = all.filter(p => statusOf(p) !== 'normal').length
  const abnormalShown = shown.filter(p => statusOf(p) !== 'normal').length
  const hiddenAbnormal = abnormalAll - abnormalShown
  let text: string
  if (hiddenAbnormal > 0) {
    text = `为保证渲染性能，此处展示 ${shown.length} 条（共 ${all.length} 条），其中 ${hiddenAbnormal} 个异常点位未展示，请先按状态筛选或导出 CSV。`
  } else if (abnormalShown > 0) {
    text = `为保证渲染性能，此处展示 ${shown.length} 条（共 ${all.length} 条），已包含全部 ${abnormalShown} 个异常点位，其余为正常点位。完整数据请使用导出 CSV 查看。`
  } else {
    text = `为保证渲染性能，此处展示 ${shown.length} 条（共 ${all.length} 条），均为正常点位。完整数据请使用导出 CSV 查看。`
  }
  return { hidden, hiddenAbnormal, abnormalShown, text }
}

/** 分区提示里的 {n} 替换为实际数量 */
function sectionHint(g: { section: SubsystemSection; points: PointDef[] }): string {
  const hint = g.section.hint ?? ''
  return hint.replace('{n}', String(g.points.length))
}

const filteredTotal = computed(() =>
  groupedBySection.value.reduce((sum, g) => sum + filtered(g.points).length, 0),
)

/** 全局异常清单（不套用搜索词），供抽屉"上一条/下一条异常"导航 */
const abnormalPoints = computed<PointDef[]>(() => {
  const out: PointDef[] = []
  for (const g of groupedBySection.value) {
    for (const p of g.points) {
      if (statusOf(p) !== 'normal') out.push(p)
    }
  }
  return out
})

const activeSiblingIndex = computed(() =>
  activePoint.value ? abnormalPoints.value.findIndex(p => p.id === activePoint.value!.id) : -1,
)

function hostLabelOf(pt?: PointDef) {
  if (!pt?.hostId) return '—'
  const h = points.value.find(x => x.id === pt.hostId)
  return h ? `${h.code}` : pt.hostId
}

function openDetail(p: PointDef) {
  activePoint.value = p
  drawerOpen.value = true
}

function gotoSibling(p: PointDef) {
  activePoint.value = p
}

/** 汇总卡点击 = 按状态下钻；再次点击同一张卡 = 取消筛选 */
function onSummarySelect(key: string) {
  if (key === 'total') {
    statusFilter.value = null
    return
  }
  const s = key as PointStatus
  statusFilter.value = statusFilter.value === s ? null : s
}

function exportCsv(g: { section: SubsystemSection; points: PointDef[] }) {
  const rows = filtered(g.points)
  const headers = ['编号', '位置', '类型', '状态', ...(g.points[0]?.metrics.map(m => `${m.label}${m.unit ? `(${m.unit})` : ''}`) ?? [])]
  const lines = [headers.join(',')]
  for (const p of rows) {
    const r = getRuntime(p.id)
    const cells = [
      p.code,
      p.location,
      findProfile(p.typeKey)?.name ?? p.typeKey,
      statusLabel(r?.status ?? 'unknown'),
      ...(p.metrics.map(m => String(r?.values?.[m.key] ?? ''))),
    ]
    lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
  }
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${profile.value?.shortName ?? 'subsystem'}_${g.section.title}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.length} 条记录`)
}

async function handleControl({ point, action }: { point: PointDef; action: string }) {
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

// ===== 生命周期 =====

onMounted(() => {
  loadSubsystem(props.subsystemKey)
})

watch(() => props.subsystemKey, (k) => {
  keyword.value = ''
  statusFilter.value = null
  drawerOpen.value = false
  activePoint.value = undefined
  loadSubsystem(k)
})

onBeforeUnmount(() => stopTimer())
</script>

<style scoped>
.smp {
  display: flex; flex-direction: column; gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  min-height: 100%;
}

/* 页头 */
.smp__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--spacing-xl); flex-wrap: wrap;
  padding: var(--spacing-xl);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  border-left: 3px solid var(--accent, var(--accent-primary));
}
.smp__head-left { display: flex; align-items: flex-start; gap: var(--spacing-lg); min-width: 0; }
.smp__head-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: var(--radius-md);
  background: var(--accent-primary10); color: var(--accent, var(--accent-primary));
  font-size: 22px; flex-shrink: 0;
}
.smp__head-main { min-width: 0; }
.smp__title-row { display: flex; align-items: center; gap: var(--spacing-md); flex-wrap: wrap; }
.smp__title { margin: 0 0 4px; font-size: var(--font-h3); font-weight: 600; color: var(--text-primary); }
.smp__demo-tag {
  margin-bottom: 4px;
  padding: 1px 8px; border-radius: 10px;
  font-size: var(--font-xs); font-weight: 500;
  color: var(--warning-text); background: var(--warning-bg);
  border: 1px solid var(--warning-bg);
}
.smp__desc { margin: 0; font-size: var(--font-xs); color: var(--text-muted); line-height: 1.6; max-width: 760px; }

.smp__head-right { display: flex; align-items: center; gap: var(--spacing-md); flex-shrink: 0; }
.smp__live {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: var(--font-xs); color: var(--text-muted);
  padding: 3px 8px; border-radius: 10px; background: var(--normal-bg);
}
.smp__live--on { color: var(--success-text); background: var(--success-bg); }
/* 定时器没在跑但用户没手动暂停：数据是静止的，必须显式说破 */
.smp__live--off { color: var(--danger-text); background: var(--danger-bg); font-weight: 600; }
.smp__live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.smp__live--on .smp__live-dot { animation: smp-blink 1.6s ease-in-out infinite; }
@keyframes smp-blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
.smp__stamp { font-size: var(--font-xs); color: var(--text-muted); font-variant-numeric: tabular-nums; }
.smp__live-btn {
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
.smp__live-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

/* 工具条 */
.smp__toolbar {
  display: flex; align-items: center; gap: var(--spacing-lg); flex-wrap: wrap;
}
.smp__search { width: 320px; }
.smp__toolbar-hint { font-size: var(--font-xs); color: var(--text-muted); }
.smp__filter {
  display: inline-flex; align-items: center; gap: var(--spacing-md);
  padding: 4px 8px 4px 12px;
  border-radius: var(--radius-sm);
  background: var(--accent-primary10);
  border: 1px solid var(--accent-primary10);
  font-size: var(--font-xs);
}
.smp__filter-text { color: var(--accent-primary); font-weight: 600; }
.smp__filter-count { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.smp__filter-clear {
  display: inline-flex; align-items: center; gap: 3px;
  font: inherit; font-size: var(--font-xs);
  color: var(--text-secondary);
  background: none; border: none; cursor: pointer; padding: 2px 4px;
}
.smp__filter-clear:hover { color: var(--accent-primary); }

/* 分区 */
.smp__section { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.smp__section-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--spacing-lg); flex-wrap: wrap;
}
.smp__section-title {
  margin: 0; font-size: var(--font-h4); font-weight: 600; color: var(--text-primary);
  display: flex; align-items: center; gap: 6px;
}
.smp__section-title::before {
  content: ''; width: 3px; height: 14px; border-radius: 2px;
  background: var(--accent, var(--accent-primary));
}
.smp__section-hint { font-size: var(--font-xs); color: var(--text-muted); }

/* 主机卡 */
.smp__hosts { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: var(--spacing-md); }
.smp__host {
  display: flex; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card); border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.smp__host--fault { border-color: var(--warning); background: var(--warning-bg); }
.smp__host-body { min-width: 0; }
.smp__host-code {
  font-size: var(--font-small); font-weight: 600; color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.smp__host-name {
  font-size: var(--font-xs); color: var(--text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 卡片网格 */
.smp__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--spacing-md); }
.smp__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(212px, 1fr)); gap: 6px; }

.smp__more {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: var(--font-xs); color: var(--text-muted);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--warning-bg); border-radius: var(--radius-sm);
}
/* 提示条底色偏暖，链接用深主色才够对比度（accent-primary 在此底上仅 3.57:1） */
.smp__more-link {
  font: inherit; font-size: var(--font-xs); font-weight: 500;
  color: var(--accent-dark);
  background: none; border: none; padding: 0 2px; cursor: pointer;
  text-decoration: underline; text-underline-offset: 2px;
}
.smp__more-link:hover { color: var(--accent-primary); }
</style>
