<template>
  <div class="detail-page">
    <div class="content-card">
      <!-- 面包屑 -->
      <div class="page-top">
        <button class="btn-link" @click="$router.back()">← 返回</button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/workflow/monitor' }">工单监控</el-breadcrumb-item>
          <el-breadcrumb-item>工单详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div v-loading="store.detailLoading">
        <template v-if="store.detail">
          <!-- 标题行 -->
          <div class="detail-header">
            <StatusTag :status="store.detail.status" :label="statusLabel(store.detail.status)" />
            <span class="detail-title">工单详情 — {{ store.detail.orderNo }}</span>
          </div>

          <!-- 基本信息 -->
          <div class="detail-section">
            <h4 class="section-title">基本信息</h4>
            <div class="info-grid info-grid-2col">
              <div class="info-col">
                <div class="info-row"><span class="info-label">工单编号</span><span class="info-value">{{ store.detail.orderNo }}</span></div>
                <div class="info-row"><span class="info-label">模板名称</span><span class="info-value">{{ store.detail.templateName }} v{{ store.detail.templateVersion }}</span></div>
                <div class="info-row"><span class="info-label">优先级</span><span class="info-value"><StatusTag :status="store.detail.priority" :label="priorityLabel(store.detail.priority)" /></span></div>
                <div class="info-row"><span class="info-label">实例状态</span><span class="info-value"><StatusTag :status="store.detail.status" :label="statusLabel(store.detail.status)" /></span></div>
                <div class="info-row"><span class="info-label">SLA状态</span><span class="info-value"><span :class="['sla-dot', `sla-${store.detail.sla.slaStatus}`]" />{{ slaLabel(store.detail.sla.slaStatus) }}<span class="field-note">{{ slaRemain(store.detail) }}</span></span></div>
              </div>
              <div class="info-col">
                <div class="info-row"><span class="info-label">发起人</span><span class="info-value">{{ store.detail.creatorName }}</span></div>
                <div class="info-row"><span class="info-label">创建时间</span><span class="info-value">{{ store.detail.createdAt }}</span></div>
                <div class="info-row"><span class="info-label">当前进度</span><span class="info-value">{{ store.detail.currentNodeIndex }}/{{ store.detail.totalNodes }}（{{ store.detail.currentNodeName || '—' }}）</span></div>
                <div class="info-row"><span class="info-label">当前处理人</span><span class="info-value">{{ store.detail.currentAssigneeName || '—' }}</span></div>
              </div>
            </div>
          </div>

          <!-- SLA 指标分析（仅已关闭） -->
          <div v-if="store.detail.status === 'closed'" class="detail-section">
            <h4 class="section-title">工单指标分析</h4>
            <div class="sla-metrics">
              <div class="sla-metric-card">
                <span class="sla-metric-label">TTR 响应</span>
                <span class="sla-metric-value">{{ slaMetrics.ttrText }}</span>
                <span :class="['sla-metric-badge', slaMetrics.ttrOk ? 'sla-badge-ok' : 'sla-badge-over']">{{ slaMetrics.ttrOk ? '✓ 达标' : '✗ 超时' }}</span>
              </div>
              <div class="sla-metric-card">
                <span class="sla-metric-label">TTS 解决</span>
                <span class="sla-metric-value">{{ slaMetrics.ttsText }}</span>
                <span :class="['sla-metric-badge', slaMetrics.ttsOk ? 'sla-badge-ok' : 'sla-badge-over']">{{ slaMetrics.ttsOk ? '✓ 达标' : '✗ 超时' }}</span>
              </div>
              <div class="sla-metric-card">
                <span class="sla-metric-label">总耗时</span>
                <span class="sla-metric-value">{{ slaMetrics.totalText }}</span>
                <span class="sla-metric-badge sla-badge-info">实际</span>
              </div>
              <div class="sla-metric-footer">
                <span>TTR 时限 {{ slaMetrics.ttrLimit }}min</span>
                <span class="sla-metric-sep">|</span>
                <span>TTS 时限 {{ slaMetrics.ttsLimit }}min</span>
                <span class="sla-metric-sep">|</span>
                <span>黄灯阈值 {{ slaMetrics.yellowPercent }}%</span>
              </div>
            </div>
          </div>

          <!-- 流转时间线 -->
          <div class="detail-section detail-section-timeline">
            <h4 class="section-title">流转时间线</h4>
            <div class="timeline-list">
              <div v-for="step in fusedTimeline" :key="step.key"
                :class="['timeline-item', `tl-${step.nodeStatus}`]">
                <div class="timeline-node" @click="step.records.length && step.nodeStatus !== 'pending' && toggleExpand(step.key)">
                  <StatusTag :status="step.nodeStatus === 'pending' ? 'node_pending' : step.nodeStatus" :label="step.nodeStatusText" size="small" />
                  <span class="tl-node-order">③{{ step.nodeOrder }}</span>
                  <span class="tl-node-name">{{ step.nodeName }}</span>
                  <span v-if="step.assigneeName" class="tl-assignee">{{ step.assigneeName }}</span>
                  <span class="tl-time">
                    <template v-if="step.nodeStatus === 'completed'">{{ step.completedAt }}</template>
                    <template v-else-if="step.nodeStatus === 'in_progress'">进行中</template>
                  </span>
                </div>
                <div v-if="expandedNodes.has(step.key) && step.nodeStatus !== 'pending'" class="timeline-records">
                  <div v-for="rec in step.records" :key="rec.id" class="tl-record">
                    <span class="tl-rec-operator">{{ rec.operatorName }} {{ rec.action }}</span>
                    <span class="tl-rec-time">{{ rec.createdAt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { InstanceStatus, Priority, SlaStatus } from '@/types/work-order'
import { useWorkOrderStore } from '@/stores/work-order'
import StatusTag from '@/components/business/StatusTag.vue'

const route = useRoute()
const store = useWorkOrderStore()

const STATUS_LABEL_MAP: Record<InstanceStatus, string> = {
  draft: '草稿', pending_assign: '待指派', pending_accept: '待接单',
  processing: '处置中', verifying: '验收中', closed: '已关闭',
}
const PRIORITY_LABEL_MAP: Record<Priority, string> = { urgent: '紧急', normal: '普通', low: '低优' }
const NODE_STATUS_TEXT: Record<string, string> = { completed: '已完成', in_progress: '进行中', pending: '待处理' }
const SLA_LABEL_MAP: Record<string, string> = { normal: '正常', warning: '预警', timeout: '超时' }

function statusLabel(s: InstanceStatus) { return STATUS_LABEL_MAP[s] || s }
function priorityLabel(p: Priority) { return PRIORITY_LABEL_MAP[p] || p }
function slaLabel(s: string) { return SLA_LABEL_MAP[s] || s }

function formatMinutes(m: number): string {
  if (m >= 1440) return `${Math.round(m / 1440)}天`
  if (m >= 60) return `${Math.round(m / 60)}h${m % 60}m`
  return `${m}分钟`
}

function slaRemain(row: { sla: { ttsMinutes: number; ttsProgress: number; slaStatus: SlaStatus } }) {
  const { ttsMinutes, ttsProgress, slaStatus } = row.sla
  const remain = Math.round(ttsMinutes * (1 - ttsProgress))
  if (slaStatus === 'timeout') {
    const over = Math.round(ttsMinutes * (ttsProgress - 1))
    return over > 60 ? `已超时 ${Math.round(over / 60)}h${over % 60}m` : `已超时 ${over}m`
  }
  if (remain <= 0) return '即将超时'
  if (remain >= 1440) return `剩余 ${Math.round(remain / 1440)}天`
  if (remain >= 60) return `剩余 ${Math.round(remain / 60)}h${remain % 60}m`
  return `剩余 ${remain}m`
}

// 时间线
const expandedNodes = ref(new Set<string>())

function toggleExpand(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key)
  else expandedNodes.value.add(key)
}

const fusedTimeline = computed(() => {
  if (!store.detail) return []
  const { nodes, records } = store.detail
  return nodes
    .filter((n: any) => n.type !== 'condition' && n.type !== 'external')
    .map((node: any, i: number) => {
      const filteredNodes = nodes.filter((n: any) => n.type !== 'condition' && n.type !== 'external')
      const recordsPerNode = Math.ceil(records.length / filteredNodes.length)
      const start = i * recordsPerNode
      const end = start + recordsPerNode
      const nodeRecords = records.filter((_: any, j: number) => j >= start && j < end)
      return {
        key: `node-${node.id}`,
        nodeOrder: node.order,
        nodeName: node.name,
        nodeStatus: node.status as string,
        nodeStatusText: NODE_STATUS_TEXT[node.status] || node.status,
        assigneeName: node.assigneeName,
        completedAt: node.completedAt || '',
        records: nodeRecords,
      }
    })
})

// SLA 指标
const slaMetrics = computed(() => {
  const sla = store.detail?.sla
  if (!sla) return { ttrText: '—', ttsText: '—', totalText: '—', ttrOk: true, ttsOk: true, ttrLimit: 0, ttsLimit: 0, yellowPercent: 0 }
  const ttrMinutes = sla.ttrMinutes || 0
  const ttsMinutes = sla.ttsMinutes || 0
  const ttrUsed = Math.round(ttrMinutes * sla.ttsProgress)
  const ttsUsed = Math.round(ttsMinutes * (sla.ttsProgress || 1))
  const total = ttrUsed + ttsUsed
  return {
    ttrText: formatMinutes(Math.max(ttrUsed, 0)),
    ttsText: formatMinutes(Math.max(ttsUsed, 0)),
    totalText: formatMinutes(Math.max(total, 0)),
    ttrOk: sla.slaStatus !== 'timeout',
    ttsOk: sla.slaStatus !== 'timeout',
    ttrLimit: ttrMinutes,
    ttsLimit: ttsMinutes,
    yellowPercent: Math.round((sla.yellowThreshold || 0) * 100),
  }
})

onMounted(() => {
  const id = Number(route.params.id)
  if (id) store.openDetail(id)
})
</script>

<style scoped>
.detail-page { height: 100%; }

.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xl, 16px);
  overflow: auto;
}

.page-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  flex-shrink: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 8px);
  flex-shrink: 0;
}
.detail-title {
  font-size: var(--font-h3, 18px);
  font-weight: 500;
  color: var(--text-primary);
}

.detail-section {
  margin-top: var(--spacing-lg, 12px);
}
.detail-section-timeline {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.detail-section-timeline .timeline-list {
  flex: 1;
  overflow-y: auto;
}

/* 基本信息 Grid */
.info-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
}
.info-col {
  display: flex;
  flex-direction: column;
}
.info-col:first-child {
  border-right: 1px solid var(--border-default);
}
.info-row {
  display: flex;
  border-bottom: 1px solid var(--border-low);
  min-height: 40px;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  width: 80px;
  flex-shrink: 0;
  padding: var(--spacing-md, 8px) var(--spacing-lg, 12px);
  font-size: var(--font-body, 16px);
  color: var(--text-secondary);
  background: var(--bg-sub-card);
  font-weight: 500;
  display: flex;
  align-items: center;
}
.info-value {
  flex: 1;
  padding: var(--spacing-md, 8px) var(--spacing-lg, 12px);
  font-size: var(--font-body, 16px);
  color: var(--text-primary);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}

/* SLA 指标 */
.sla-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md, 8px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-lg, 12px);
  background: var(--bg-card);
}
.sla-metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs, 4px);
  padding: var(--spacing-lg, 12px) var(--spacing-md, 8px);
  background: var(--bg-sub-card);
  border-radius: var(--radius-sm, 6px);
}
.sla-metric-label { font-size: var(--font-small, 14px); color: var(--text-muted); }
.sla-metric-value { font-size: var(--font-h2, 20px); font-weight: 600; color: var(--text-primary); }
.sla-metric-badge { font-size: var(--font-xs, 12px); padding: 2px 8px; border-radius: 10px; }
.sla-badge-ok { background: var(--success-bg); color: var(--success); }
.sla-badge-over { background: var(--danger-bg); color: var(--danger); }
.sla-badge-info { background: var(--info-bg); color: var(--info); }
.sla-metric-footer {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  gap: var(--spacing-md, 8px);
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  padding-top: var(--spacing-md, 8px);
  border-top: 1px solid var(--border-low);
}
.sla-metric-sep { color: var(--border-high); }

.section-title {
  font-size: var(--font-h3, 18px);
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xl, 24px);
  padding-left: 10px;
  border-left: 3px solid var(--accent-primary);
}
.field-note {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  margin-left: 6px;
}
.sla-dot {
  display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; vertical-align: middle; margin-right: 6px;
}
.sla-normal { background: var(--success); }
.sla-warning { background: var(--warning); }
.sla-timeout { background: var(--danger); }

/* 时间线 */
.timeline-list { display: flex; flex-direction: column; gap: 2px; }
.timeline-item {
  padding: var(--spacing-md, 8px) var(--spacing-lg, 12px);
  background: var(--bg-card);
  border: 1px solid var(--border-low);
  border-radius: var(--radius-md, 8px);
  transition: background .15s, border-color .15s, opacity .15s;
}
.timeline-node {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 8px);
  cursor: default;
}
.timeline-item:not(.tl-pending) .timeline-node { cursor: pointer; }
.tl-node-order { font-size: var(--font-small, 14px); color: var(--text-muted); flex-shrink: 0; }
.tl-node-name { font-size: var(--font-h4, 16px); font-weight: 500; color: var(--text-primary); }
.tl-assignee {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  background: var(--bg-sub-card);
  padding: 1px 8px;
  border-radius: var(--radius-sm, 6px);
}
.tl-time { font-size: var(--font-small, 14px); color: var(--text-secondary); margin-left: auto; }

.timeline-records {
  margin-top: var(--spacing-md, 8px);
  padding-left: 28px;
}
.tl-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs, 4px) 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}
.tl-record::before {
  content: '└';
  margin-right: 6px;
  color: var(--border-high);
}

.timeline-item.tl-in_progress {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
  box-shadow: 0 0 0 1px var(--accent-primary) inset;
}
.timeline-item.tl-pending { opacity: 0.4; }
</style>
