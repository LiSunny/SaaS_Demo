<template>
  <div class="monitor-page">
    <div class="content-card">

      <!-- ===== 统计卡片行 ===== -->
      <div class="stat-row">
        <button
          v-for="card in statCards"
          :key="card.key"
          :class="['stat-card', { active: store.activeStatFilter === card.statusValue }]"
          @click="store.toggleStatFilter(card.statusValue)"
        >
          <span class="stat-num">{{ card.value }}</span>
          <span class="stat-label">{{ card.label }}</span>
        </button>
      </div>

      <!-- ===== 筛选栏（5 个条件，无状态下拉 — 已由统计卡片覆盖） ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="工单编号 / 发起人" @keyup.enter="store.search()" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword = ''; store.search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.templateId" placeholder="模板名称" clearable class="fi-select" :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option v-for="t in templateOptions" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.priority" placeholder="优先级" clearable class="fi-select" :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option label="紧急" value="urgent" />
              <el-option label="普通" value="normal" />
              <el-option label="低优" value="low" />
            </el-select>
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.slaStatus" placeholder="SLA状态" clearable class="fi-select" :teleported="false" popper-class="fi-popper" @change="store.search()">
              <el-option label="正常" value="normal" />
              <el-option label="预警" value="warning" />
              <el-option label="超时" value="timeout" />
            </el-select>
          </div>

          <div class="fi-date-range-wrap">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :teleported="false" popper-class="fi-popper" :shortcuts="dateShortcuts" @change="onDateChange" />
          </div>
          <button class="btn-primary" @click="store.search()">查询</button>
          <button class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <button class="btn-primary" @click="router.push('/workflow/template')">发起工单</button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-order"><span>工单编号</span></th>
              <th class="fi-th col-tpl"><span>工单名称</span></th>
              <th class="fi-th col-progress"><span>工单进度</span></th>
              <th class="fi-th col-status"><span>工单状态</span></th>
              <th class="fi-th col-pri"><span>优先级</span></th>
              <th class="fi-th col-sla"><span>SLA状态</span></th>
              <th class="fi-th col-assignee"><span>当前处理人</span></th>
              <th class="fi-th col-creator"><span>发起人</span></th>
              <th class="fi-th col-time"><span>发起时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr
              v-for="row in store.list"
              :key="row.id"
              class="fi-tbody-tr"
            >
              <td class="fi-td col-order">
                <button class="btn-link" @click="store.openDetail(row.id)">{{ row.orderNo }}</button>
              </td>
              <td class="fi-td col-tpl">{{ row.templateName }}</td>
              <td class="fi-td col-progress">
                <span class="progress-text">{{ row.currentNodeIndex }}/{{ row.totalNodes }}</span>
              </td>
              <td class="fi-td col-status">
                <StatusTag :status="row.status" :label="statusLabel(row.status)" />
              </td>
              <td class="fi-td col-pri">
                <StatusTag :status="row.priority" :label="priorityLabel(row.priority)" />
              </td>
              <td class="fi-td col-sla">
                <template v-if="row.status === 'draft' || row.status === 'closed'">—</template>
                <el-tooltip v-else placement="top" :teleported="false" popper-class="fi-popper">
                  <template #content>
                    <div class="sla-tooltip">
                      <div v-if="row.sla.ttrMinutes">TTR 响应时限：{{ row.sla.ttrMinutes }}分钟</div>
                      <div>TTS 解决时限：{{ row.sla.ttsMinutes }}分钟</div>
                      <div>黄灯阈值：{{ Math.round(row.sla.yellowThreshold * 100) }}%</div>
                      <div>当前 TTS 进度：{{ Math.round(row.sla.ttsProgress * 100) }}%</div>
                    </div>
                  </template>
                  <span :class="['sla-text', `sla-text-${row.sla.slaStatus}`]">
                    <span :class="['sla-dot', `sla-${row.sla.slaStatus}`]" />{{ slaRemain(row) }}
                  </span>
                </el-tooltip>
              </td>
              <td class="fi-td col-assignee">{{ row.currentAssigneeName || '—' }}</td>
              <td class="fi-td col-creator">{{ row.creatorName }}</td>
              <td class="fi-td col-time">{{ row.createdAt }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="btn-link" @click="store.openDetail(row.id)">详情</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ store.total }} 条记录 第 {{ store.query.page }}/{{ Math.ceil(store.total / store.query.size) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="store.query.page"
          v-model:page-size="store.query.size"
          :total="store.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @change="store.fetchList()"
        />
      </div>

    </div>

    <!-- ===== 详情抽屉 ===== -->
    <el-drawer
      v-model="store.detailVisible"
      size="720px"
      direction="rtl"
      :before-close="store.closeDetail"
    >
      <template #title>
        <div class="drawer-title">
          <StatusTag v-if="store.detail" :status="store.detail.status" :label="statusLabel(store.detail.status)" />
          <span class="drawer-title-text">工单详情 — {{ store.detail?.orderNo || '' }}</span>
        </div>
      </template>

      <div v-loading="store.detailLoading" class="drawer-body">
        <template v-if="store.detail">
          <!-- 基本信息 — 左右两列 -->
          <div class="drawer-section drawer-section-info">

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
            <button v-if="store.detail.status === 'closed'" class="btn-link" style="margin-top:8px" @click="router.push('/workflow/order/' + store.detail!.id)">查看完整工单 →</button>

          <!-- SLA 工单指标分析（仅已关闭工单） -->
          <div v-if="store.detail.status === 'closed'" class="drawer-section">
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
          <div class="drawer-section drawer-section-timeline">
            <h4 class="section-title">流转时间线</h4>
            <div class="timeline-list">
              <div v-for="step in fusedTimeline" :key="step.key"
                :class="['timeline-item', `tl-${step.nodeStatus}`]">
                <div class="timeline-node" @click="step.records.length && step.nodeStatus !== 'pending' && toggleExpand(step.key)">
                  <StatusTag :status="step.nodeStatus === 'pending' ? 'node_pending' : step.nodeStatus" :label="step.nodeStatusText" size="small" />
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

          <!-- 操作按钮（已关闭隐藏） -->
          <div v-if="store.detail.status !== 'closed'" class="drawer-actions">
            <button class="btn-danger" @click="cancelDialogVisible = true">取消工单</button>
            <button
              v-if="store.detail.status === 'pending_accept' || store.detail.status === 'processing'"
              class="btn-default"
              @click="reassignDialogVisible = true"
            >强制改派</button>
          </div>
        </template>
      </div>
    </el-drawer>

    <!-- ===== 取消确认弹窗 ===== -->
    <el-dialog v-model="cancelDialogVisible" title="取消工单" width="480px" :close-on-click-modal="false">
      <div class="cancel-content">
        <p class="cancel-hint">确认取消工单 <strong>{{ store.detail?.orderNo }}</strong>？取消后工单将进入已关闭状态，且不触发归档回调。</p>
        <el-input
          v-model="cancelReason"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请输入取消原因"
        />
      </div>
      <template #footer>
        <button class="btn-default" @click="cancelDialogVisible = false">取消</button>
        <button class="btn-danger" :disabled="!cancelReason.trim() || cancelSubmitting" @click="handleCancel">
          {{ cancelSubmitting ? '提交中...' : '确认取消' }}
        </button>
      </template>
    </el-dialog>

    <!-- ===== 改派弹窗 ===== -->
    <el-dialog v-model="reassignDialogVisible" title="强制改派" width="520px" :close-on-click-modal="false">
      <div class="reassign-content">
        <el-form label-width="100px">
          <el-form-item label="目标处理人" required>
            <PersonSelector :selected-ids="reassignTargetId ? [reassignTargetId] : []" placeholder="请选择处理人" @confirm="reassignTargetId = $event[0] || 0" />
          </el-form-item>
          <el-form-item label="改派原因" required>
            <el-input
              v-model="reassignReason"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="请输入改派原因"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button class="btn-default" @click="reassignDialogVisible = false">取消</button>
        <button class="btn-primary" :disabled="!canReassign || reassignSubmitting" @click="handleReassign">
          {{ reassignSubmitting ? '提交中...' : '确认改派' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { InstanceStatus, Priority, SlaStatus } from '@/types/work-order'
import { useWorkOrderStore } from '@/stores/work-order'
import StatusTag from '@/components/business/StatusTag.vue'
import PersonSelector from '@/components/business/PersonSelector.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const store = useWorkOrderStore()
const router = useRouter()
const query = store.query

// ===== 统计卡片 =====
const statCards = computed(() => {
  const s = store.stats
  return [
    { key: 'all', label: '全部', value: s.all, statusValue: '' },
    { key: 'draft', label: '草稿', value: s.draft, statusValue: 'draft' },
    { key: 'pending_assign', label: '待指派', value: s.pendingAssign, statusValue: 'pending_assign' },
    { key: 'pending_accept', label: '待接单', value: s.pendingAccept, statusValue: 'pending_accept' },
    { key: 'processing', label: '处置中', value: s.processing, statusValue: 'processing' },
    { key: 'verifying', label: '验收中', value: s.verifying, statusValue: 'verifying' },
    { key: 'closed', label: '已关闭', value: s.closed, statusValue: 'closed' },
  ]
})

// ===== 筛选 =====
const templateOptions = [
  { label: '设备维修工单模板', value: 1 },
  { label: '安全生产督办流程', value: 2 },
  { label: '日常巡检工单模板', value: 3 },
  { label: '故障报修流程', value: 4 },
]

const dateShortcuts = [
  { text: '今天', value: () => { const d = new Date(); return [d, d] as [Date, Date] } },
  { text: '本周', value: () => { const d = new Date(); const s = new Date(d); s.setDate(d.getDate() - d.getDay() + 1); return [s, d] as [Date, Date] } },
  { text: '本月', value: () => { const d = new Date(); const s = new Date(d.getFullYear(), d.getMonth(), 1); return [s, d] as [Date, Date] } },
  { text: '近30天', value: () => { const d = new Date(); const s = new Date(d.getTime() - 30 * 86400000); return [s, d] as [Date, Date] } },
]

// 默认近30天
function last30Days(): [Date, Date] {
  const d = new Date()
  const s = new Date(d.getTime() - 30 * 86400000)
  return [s, d]
}
const dateRange = ref<[Date, Date] | null>(last30Days())
function onDateChange(v: [Date, Date] | null) {
  if (v) {
    query.startDate = v[0].toISOString().slice(0, 10)
    query.endDate = v[1].toISOString().slice(0, 10)
  } else {
    query.startDate = ''
    query.endDate = ''
  }
  store.search()
}

function handleReset() {
  dateRange.value = last30Days()
  store.reset()
  if (dateRange.value) {
    query.startDate = dateRange.value[0].toISOString().slice(0, 10)
    query.endDate = dateRange.value[1].toISOString().slice(0, 10)
  }
  store.search()
}

// ===== 表格标签映射 =====
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

// ===== 融合时间线（完整节点 + 操作记录关联） =====
const expandedNodes = ref(new Set<string>())

function toggleExpand(key: string) {
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key)
  } else {
    expandedNodes.value.add(key)
  }
}

const fusedTimeline = computed(() => {
  if (!store.detail) return []
  const { nodes, records } = store.detail

  return nodes
    .filter(n => n.type !== 'condition' && n.type !== 'external')
    .map((node, i) => {
      // 按节点 index 分配操作记录（后续可改为记录带 nodeId 真实关联）
      const recordsPerNode = Math.ceil(records.length / nodes.filter(n => n.type !== 'condition' && n.type !== 'external').length)
      const start = i * recordsPerNode
      const end = start + recordsPerNode
      const nodeRecords = records.filter((_, j) => j >= start && j < end)
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

// ===== SLA 指标分析（已关闭工单） =====
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

// ===== 取消工单 =====
const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const cancelSubmitting = ref(false)

async function handleCancel() {
  if (!cancelReason.value.trim()) return
  cancelSubmitting.value = true
  try {
    await store.cancel(store.detail!.id, cancelReason.value)
    ElMessage.success('工单已取消')
    cancelDialogVisible.value = false
    cancelReason.value = ''
  } catch {
    ElMessage.error('取消失败')
  } finally {
    cancelSubmitting.value = false
  }
}

// ===== 强制改派 =====
const reassignDialogVisible = ref(false)
const reassignTargetId = ref<number | null>(null)
const reassignReason = ref('')
const reassignSubmitting = ref(false)

const canReassign = computed(() => reassignTargetId.value !== null && reassignReason.value.trim())

async function handleReassign() {
  if (!canReassign.value) return
  reassignSubmitting.value = true
  try {
    const res = await store.reassign(store.detail!.id, reassignTargetId.value!, reassignReason.value)
    ElMessage.success(`已改派给 ${res.currentAssigneeName}`)
    reassignDialogVisible.value = false
    reassignTargetId.value = null
    reassignReason.value = ''
  } catch {
    ElMessage.error('改派失败')
  } finally {
    reassignSubmitting.value = false
  }
}

// ===== 定时刷新 SLA =====
let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 初始化默认近30天
  if (dateRange.value) {
    query.startDate = dateRange.value[0].toISOString().slice(0, 10)
    query.endDate = dateRange.value[1].toISOString().slice(0, 10)
  }
  store.fetchList()
  refreshTimer = setInterval(() => { store.fetchList() }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.monitor-page { height: 100%; }

.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-lg, 12px);
  overflow: auto;
}

/* ===== 统计卡片行 ===== */
.stat-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-md, 8px);
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs, 4px);
  padding: var(--spacing-lg, 12px) var(--spacing-md, 8px);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  cursor: pointer;
  transition: border-color .15s;
  font-family: inherit;
}
.stat-card:hover { border-color: var(--accent-primary); }
.stat-card.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.stat-num {
  font-size: var(--font-h1, 24px);
  font-weight: var(--font-weight-blod, 900);
  color: var(--text-primary);
  line-height: 1.2;
}
.stat-label {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}

/* ===== 筛选栏 ===== */
.filter-left .fi-select-wrap { width: 150px; flex-shrink: 0; }
.filter-left .search-input-wrap { width: 200px; flex-shrink: 0; }
.filter-left .fi-date-range-wrap { width: 270px; flex-shrink: 0; }

/* ===== 响应式 ===== */
@media (max-width: 1550px) { .col-creator { display: none !important; } }
@media (max-width: 1250px) { .col-assignee { display: none !important; } }
@media (max-width: 1050px) { .col-time { display: none !important; } }

/* ===== 表格列宽 ===== */
.col-order { min-width: 180px; }
.col-tpl { min-width: 170px; }
.col-progress { min-width: 130px; }
.col-status { width: 100px; }
.col-pri { width: 80px; }
.col-sla { width: 160px; }
.col-assignee { min-width: 100px; }
.col-creator { min-width: 100px; }
.col-time { min-width: 170px; }
.col-actions { width: 80px; }

/* 工单进度列 */
.progress-text {
  font-weight: 600;
  color: var(--accent-primary);
  margin-right: 6px;
}
.progress-node {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}

/* ===== SLA 圆点 ===== */
.sla-dot {
  display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; vertical-align: middle; margin-right: 6px;
}
.sla-normal { background: var(--success); }
.sla-warning { background: var(--warning); }
.sla-timeout { background: var(--danger); }
.sla-text { font-size: var(--font-small, 14px); }
.sla-text-normal { color: var(--success); }
.sla-text-warning { color: var(--warning); }
.sla-text-timeout { color: var(--danger); }
.sla-tooltip { font-size: var(--font-small, 14px); line-height: 1.6; }

/* ===== 详情抽屉 ===== */
.drawer-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 8px);
}
.drawer-title-text {
  font-size: var(--font-h3, 18px);
  font-weight: 500;
}
.drawer-body {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-section {
  margin-top: var(--spacing-lg, 12px);
}
.drawer-section-info {
  flex-shrink: 0;
}
.drawer-section-timeline {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.drawer-section-timeline .timeline-list {
  flex: 1;
  overflow-y: auto;
}

/* 基本信息 — 左右两列 */
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
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  width: 96px;
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

/* SLA 指标分析卡片 */
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
.sla-metric-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
.sla-metric-value {
  font-size: var(--font-h2, 20px);
  font-weight: 600;
  color: var(--text-primary);
}
.sla-metric-badge {
  font-size: var(--font-xs, 12px);
  padding: 2px 8px;
  border-radius: 10px;
}
.sla-badge-ok {
  background: var(--success-bg);
  color: var(--success);
}
.sla-badge-over {
  background: var(--danger-bg);
  color: var(--danger);
}
.sla-badge-info {
  background: var(--info-bg);
  color: var(--info);
}
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
.sla-metric-sep {
  color: var(--border-high);
}

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

.drawer-actions {
  display: flex;
  gap: var(--spacing-md, 8px);
  margin-top: var(--spacing-xl, 24px);
  padding-top: var(--spacing-lg, 12px);
  border-top: 1px solid var(--border-low);
  justify-content: flex-end;
  flex-shrink: 0;
}

/* ===== 流转时间线 ===== */
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
.timeline-item:not(.tl-pending) .timeline-node {
  cursor: pointer;
}
.tl-node-order {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  flex-shrink: 0;
}
.tl-node-name {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary);
}
.tl-assignee {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  background: var(--bg-sub-card);
  padding: 1px 8px;
  border-radius: var(--radius-sm, 6px);
}
.tl-time {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  margin-left: auto;
}

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

/* 节点状态变体 */
.timeline-item.tl-in_progress {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
  box-shadow: 0 0 0 1px var(--accent-primary) inset;
}
.timeline-item.tl-pending {
  opacity: 0.4;
}

/* 取消弹窗 */
.cancel-hint { margin: 0 0 var(--spacing-lg, 12px); color: var(--text-secondary); line-height: 1.6; }
.cancel-hint strong { color: var(--text-primary); }

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) {
  background-color: var(--pagi-bg); color: var(--pagi-text);
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary); color: var(--btn-primary-color);
  border-color: var(--accent-primary);
}
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important;
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .btn-prev.is-disabled),
:deep(.el-pagination .btn-next.is-disabled) {
  color: var(--text-muted) !important; background-color: var(--pagi-bg) !important;
}
:deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: var(--bg-card) !important; color: var(--text-secondary);
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-high) !important;
  box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: var(--text-primary) !important;
  background-color: var(--bg-card);
}
:deep(.el-loading-mask .el-loading-text) { color: var(--text-secondary); }
</style>
