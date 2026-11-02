<template>
  <div class="project-header">
    <!-- ===== 左侧：项目标识与基础信息 ===== -->
    <div class="header-left">
      <div class="project-logo">{{ initial }}</div>
      <div class="project-info">
        <div class="project-title-row">
          <h2 class="project-name" :title="project.name">{{ project.name }}</h2>
          <span class="status-pill" :class="statusClass">{{ statusLabel }}</span>
        </div>
        <div class="project-meta">
          <span class="meta-line">添加日期：{{ project.createdAt }}</span>
          <span class="meta-line">负责人：{{ project.owner }}</span>
        </div>
        <div class="project-sub">
          <span class="sub-item">项目编号：{{ project.code }}</span>
          <span class="sub-item">项目类型：{{ project.type }}</span>
          <span class="sub-item">所属区域：{{ project.region }}</span>
        </div>
      </div>
    </div>

    <!-- ===== 中间：接入设备 KPI ===== -->
    <div class="stat-divider" />

    <div class="kpi-block">
      <div class="kpi-head">
        <AppIcon name="layers" class="kpi-icon" />
        <span class="kpi-label">接入设备</span>
        <el-tooltip content="项目级统计，不随层级筛选变化" placement="top">
          <AppIcon name="info-circle" class="kpi-info" />
        </el-tooltip>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">
          {{ formatNumber(kpi.deviceCount) }} <small>台</small>
        </div>
        <div class="ring-wrap">
          <VChart class="ring-chart" :option="deviceOption" autoresize />
          <div class="ring-center">
            <span class="ring-rate">{{ onlineRate }}%</span>
            <span class="ring-sub">在线</span>
          </div>
        </div>
      </div>
      <div class="kpi-legend">
        <span class="legend-item"><i class="legend-dot dot-online" />在线 {{ kpi.onlineCount }}</span>
        <span class="legend-item"><i class="legend-dot dot-offline" />离线 {{ kpi.offlineCount }}</span>
      </div>
    </div>

    <div class="stat-divider" />

    <!-- ===== 右侧：接入单位 KPI ===== -->
    <div class="kpi-block">
      <div class="kpi-head">
        <AppIcon name="home" class="kpi-icon" />
        <span class="kpi-label">接入单位</span>
        <el-tooltip content="项目级统计，不随层级筛选变化" placement="top">
          <AppIcon name="info-circle" class="kpi-info" />
        </el-tooltip>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">
          {{ formatNumber(kpi.unitCount) }} <small>家</small>
        </div>
        <div class="ring-wrap">
          <VChart class="ring-chart" :option="natureOption" autoresize />
        </div>
      </div>
      <div class="kpi-legend legend-col">
        <span v-for="item in kpi.natureDist" :key="item.name" class="legend-item">
          <i class="legend-dot" :style="{ background: colorOf(item.name) }" />{{ item.name }} {{ item.value }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import AppIcon from '@/components/base/AppIcon.vue'
import { useProjectOpsStore } from '@/stores/project-ops'
import type { Project } from '@/types/project-ops'

use([PieChart, TooltipComponent, CanvasRenderer])

/**
 * ProjectHeader.vue — 项目详情头部
 *
 * 口径见 docs/项目管理/product-design.md §7.2.1
 *   接入设备 KPI：图标 + 数字（千分位）+「台」+ 环形图（在线 / 离线）+ 图例
 *   接入单位 KPI：数字 +「家」+ 环形图（6 种性质，图例两列）
 *   头部 KPI 始终是项目级，不随节点变化（§8.4）
 */

const props = defineProps<{ project: Project }>()

const store = useProjectOpsStore()

/** 与 style.css 中的语义色保持一致的取色 */
const COLOR_ONLINE = '#059669'
const COLOR_OFFLINE = '#DC2626'
const NATURE_COLORS: Record<string, string> = {
  党政机关: '#3678E3',
  社会单位: '#059669',
  技术服务机构: '#8B5CF6',
  '九小场所·个人': '#D97706',
  家庭: '#CA8A04',
  其它: '#5E5E5E',
}

function colorOf(nature: string): string {
  return NATURE_COLORS[nature] ?? '#5E5E5E'
}

const kpi = computed(() => store.projectKpi(props.project.id))

const statusLabel = computed(
  () => ({ pending: '待启动', running: '进行中', done: '已完成' })[props.project.status],
)
const statusClass = computed(() => `status-${props.project.status}`)

const initial = computed(() => props.project.name.slice(0, 1))

const onlineRate = computed(() => {
  if (!kpi.value.deviceCount) return 0
  return Math.round((kpi.value.onlineCount / kpi.value.deviceCount) * 100)
})

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

const deviceOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 台（{d}%）' },
  series: [
    {
      type: 'pie',
      radius: ['64%', '88%'],
      center: ['50%', '50%'],
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      data: [
        { value: kpi.value.onlineCount, name: '在线', itemStyle: { color: COLOR_ONLINE } },
        { value: kpi.value.offlineCount, name: '离线', itemStyle: { color: COLOR_OFFLINE } },
      ],
    },
  ],
}))

const natureOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} 家（{d}%）' },
  series: [
    {
      type: 'pie',
      radius: ['64%', '88%'],
      center: ['50%', '50%'],
      silent: true,
      label: { show: false },
      labelLine: { show: false },
      data: kpi.value.natureDist.map(i => ({
        value: i.value,
        name: i.name,
        itemStyle: { color: colorOf(i.name) },
      })),
    },
  ],
}))
</script>

<style scoped>
.project-header {
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 20px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.project-logo {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
}

.project-info { min-width: 0; }

.project-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.project-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill {
  flex-shrink: 0;
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 10px;
}
.status-pending { color: var(--normal); background: var(--normal-bg); }
.status-running { color: var(--accent-primary); background: var(--info-bg); }
.status-done { color: var(--success-text); background: var(--success-bg); }

.project-meta {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}
.meta-line {
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
}

.project-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 6px;
}
.sub-item {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  background: var(--border-default);
  flex-shrink: 0;
}

.kpi-block {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kpi-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi-icon { font-size: 15px; color: var(--accent-primary); }
.kpi-label {
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
}
.kpi-info { font-size: 13px; color: var(--text-muted); cursor: help; }

.kpi-body {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kpi-value {
  font-size: 26px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
  white-space: nowrap;
}
.kpi-value small {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 2px;
}

.ring-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}
.ring-chart { width: 100%; height: 100%; }
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.ring-rate { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.2; }
.ring-sub { font-size: 10px; color: var(--text-muted); }

.kpi-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.kpi-legend.legend-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 10px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-online { background: #059669; }
.dot-offline { background: #dc2626; }

@media (max-width: 1366px) {
  .kpi-block { width: 180px; }
  .project-sub { display: none; }
}
</style>
