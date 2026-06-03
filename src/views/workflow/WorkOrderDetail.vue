<template>
  <div class="detail-wrapper">
    <el-drawer
      :model-value="drawerVisible"
      size="860px"
      direction="rtl"
      :before-close="closeDetail"
      @open="onOpen"
    >
      <template #header>
        <span v-if="store.detail" class="drawer-header">
          <StatusTag :status="store.detail.priority" :label="priorityLabel(store.detail.priority)" size="small" />
          <span class="drawer-title-text">工单详情 — {{ store.detail.orderNo }}</span>
        </span>
      </template>

      <div v-if="store.detail" v-loading="store.detailLoading" class="detail-layout">

        <!-- ===== 左侧：流转时间线 ===== -->
        <div class="detail-left">
          <div class="tl-section">
            <div
              v-for="node in store.detail.nodes"
              :key="node.id"
              :class="['tl-item', `tl-${node.status}`]"
            >
              <div class="tl-dot" :class="`dot-${node.status}`"></div>
              <div class="tl-content">
                <div class="tl-row">
                  <span class="tl-node-name">{{ node.name }}</span>
                  <span v-if="node.assigneeName" class="tl-assignee">{{ node.assigneeName }}</span>
                  <span :class="['tl-badge', `badge-${node.status}`]">{{ nodeStatusText(node.status) }}</span>
                </div>
                <div class="tl-times">
                  <span v-if="node.startedAt" class="tl-time">
                    <span class="tl-time-label">开始</span>
                    <span class="tl-time-val">{{ fmt(node.startedAt) }}</span>
                  </span>
                  <span v-if="node.completedAt" class="tl-time">
                    <span class="tl-time-sep">|</span>
                    <span class="tl-time-label">完成</span>
                    <span class="tl-time-val">{{ fmt(node.completedAt) }}</span>
                  </span>
                  <span v-if="!node.startedAt" class="tl-time-na">—</span>
                </div>
              </div>
            </div>
            <!-- 流程结束标记 -->
            <div class="tl-item tl-end">
              <div class="tl-dot dot-end"></div>
              <span class="tl-end-label">流程结束</span>
            </div>
          </div>
        </div>

        <!-- ===== 右侧：基本信息 + 表单 + 操作 ===== -->
        <div class="detail-right">
          <!-- 基本信息卡片 -->
          <div class="info-card">
            <h4 class="section-title">基本信息</h4>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">工单状态</span>
                <span class="info-value">
                  <StatusTag :status="store.detail.status" :label="statusLabel(store.detail.status)" />
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">发起人</span>
                <span class="info-value">{{ store.detail.creatorName }} / {{ store.detail.creatorOrgName }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ store.detail.createdAt }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">优先级</span>
                <span class="info-value">
                  <StatusTag :status="store.detail.priority" :label="priorityLabel(store.detail.priority)" />
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">SLA 状态</span>
                <span class="info-value">
                  <span :class="['sla-dot', `sla-${store.detail.sla.slaStatus}`]" />
                  {{ slaLabel(store.detail.sla.slaStatus) }}
                  <span class="field-note">{{ slaRemain(store.detail) }}</span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">模板</span>
                <span class="info-value">{{ store.detail.templateName }} v{{ store.detail.templateVersion }}</span>
              </div>
            </div>
          </div>

          <!-- 表单卡片 -->
          <div v-if="currentFormFields.length > 0" class="form-card">
            <h4 class="section-title">表单数据</h4>
            <DynamicForm
              ref="detailFormRef"
              :fields="currentFormFields"
              :permissions="currentPermissions"
              :initial-data="store.detail.formData || {}"
              :readonly="isFormReadonly"
            />
          </div>

          <!-- SLA 指标（仅已关闭） -->
          <div v-if="store.detail.status === 'closed'" class="sla-card">
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

          <!-- 操作按钮（未关闭时显示） -->
          <div v-if="store.detail.status !== 'closed'" class="drawer-actions">
            <button class="btn-danger" @click="cancelDialogVisible = true">取消工单</button>
            <button
              v-if="store.detail.status === 'pending_accept' || store.detail.status === 'processing'"
              class="btn-default"
              @click="reassignDialogVisible = true"
            >强制改派</button>
          </div>
        </div>

      </div>
    </el-drawer>

    <!-- ===== 取消确认弹窗 ===== -->
    <el-dialog v-model="cancelDialogVisible" title="取消工单" width="480px" :close-on-click-modal="false">
      <div class="cancel-content">
        <p class="cancel-hint">确认取消工单 <strong>{{ store.detail?.orderNo }}</strong>？取消后工单将进入已关闭状态。</p>
        <el-input v-model="cancelReason" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入取消原因" />
      </div>
      <template #footer>
        <button class="btn-default" @click="cancelDialogVisible = false">关闭</button>
        <button class="btn-danger" :disabled="!cancelReason.trim()" @click="doCancel">确认取消</button>
      </template>
    </el-dialog>

    <!-- ===== 改派弹窗 ===== -->
    <el-dialog v-model="reassignDialogVisible" title="强制改派" width="480px" :close-on-click-modal="false">
      <div class="cancel-content">
        <p class="cancel-hint">将工单 <strong>{{ store.detail?.orderNo }}</strong> 改派给其他处理人。</p>
        <PersonSelector :selected-ids="reassignTargetId ? [reassignTargetId] : []" placeholder="请选择处理人" @confirm="reassignTargetId = $event[0] || 0" />
        <el-input v-model="reassignReason" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入改派原因" style="margin-top:12px" />
      </div>
      <template #footer>
        <button class="btn-default" @click="reassignDialogVisible = false">关闭</button>
        <button class="btn-primary" :disabled="!reassignTargetId" @click="doReassign">确认改派</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { InstanceStatus, Priority, SlaStatus } from '@/types/work-order'
import type { FormField, FieldPermission } from '@/types/workflow'
import { useWorkOrderStore } from '@/stores/work-order'
import StatusTag from '@/components/business/StatusTag.vue'
import PersonSelector from '@/components/business/PersonSelector.vue'
import DynamicForm from '@/components/business/DynamicForm.vue'

const route = useRoute()
const router = useRouter()
const store = useWorkOrderStore()

const STATUS_LABEL: Record<InstanceStatus, string> = {
  draft: '草稿', pending_assign: '待指派', pending_accept: '待接单',
  processing: '处置中', verifying: '验收中', closed: '已关闭',
}
const PRIORITY_LABEL: Record<Priority, string> = { urgent: '紧急', normal: '普通', low: '低优' }
const SLA_LABEL: Record<string, string> = { normal: '正常', warning: '预警', timeout: '超时' }
const NODE_TEXT: Record<string, string> = { completed: '已完成', in_progress: '进行中', pending: '待处理' }

function statusLabel(s: InstanceStatus) { return STATUS_LABEL[s] || s }
function priorityLabel(p: Priority) { return PRIORITY_LABEL[p] || p }
function slaLabel(s: string) { return SLA_LABEL[s] || s }
function nodeStatusText(s: string) { return NODE_TEXT[s] || s }
function fmt(t: string | null) { return t ? (t.length >= 16 ? t.slice(0, 16) : t) : '—' }

// ===== 抽屉控制 =====
const drawerVisible = ref(true)

function closeDetail() {
  drawerVisible.value = false
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/system/monitor')
  }
}

function onOpen() {
  drawerVisible.value = true
}

// ===== 数据加载 =====
onMounted(() => {
  const id = Number(route.params.id)
  if (id) store.openDetail(id)
})

// ===== 表单数据 =====
// 表单 ref（模板中使用 ref="detailFormRef"）
const detailFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)
detailFormRef satisfies object | null

const currentFormFields = computed<FormField[]>(() => {
  const td = store.templateDetail
  if (!td || !store.detail) return []
  const nodeId = String(store.detail.currentNodeId ?? '')
  if (nodeId && td.formSchema[nodeId]) return td.formSchema[nodeId].fields || []
  const keys = Object.keys(td.formSchema)
  if (keys.length > 0) return td.formSchema[keys[0]].fields || []
  return []
})

const currentPermissions = computed<FieldPermission[]>(() => {
  const td = store.templateDetail
  if (!td || !store.detail) return []
  const nodeId = String(store.detail.currentNodeId ?? '')
  if (nodeId) {
    const node = td.flowDefinition.nodes.find(n => n.id === nodeId)
    if (node?.formFields) return node.formFields
  }
  return []
})

const isFormReadonly = computed(() => {
  if (!store.detail) return true
  if (store.detail.status === 'closed') return true
  return false
})

// ===== SLA 指标 =====
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

function formatMinutes(m: number): string {
  if (m >= 1440) return `${Math.round(m / 1440)}天`
  if (m >= 60) return `${Math.round(m / 60)}h${m % 60}m`
  return `${m}分钟`
}

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

// ===== 操作 =====
const cancelDialogVisible = ref(false)
const cancelReason = ref('')

const reassignDialogVisible = ref(false)
const reassignReason = ref('')
const reassignTargetId = ref(0)

async function doCancel() {
  if (!store.detail) return
  await store.cancel(store.detail.id, cancelReason.value)
  cancelReason.value = ''
  cancelDialogVisible.value = false
}

async function doReassign() {
  if (!store.detail || !reassignTargetId.value) return
  await store.reassign(store.detail.id, reassignTargetId.value, reassignReason.value)
  reassignReason.value = ''
  reassignTargetId.value = 0
  reassignDialogVisible.value = false
}
</script>

<style scoped>
.detail-wrapper {
  height: 0;
}
.drawer-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
}
.drawer-title-text {
  font-size: var(--font-h4, 16px);
  font-weight: 600;
  color: var(--text-primary);
}

/* ===== 左右分栏 ===== */
.detail-layout {
  display: flex;
  gap: var(--spacing-xl, 16px);
  height: 100%;
}

.detail-left {
  flex: 1;
  overflow-y: auto;
}

.detail-right {
  flex: 1;
  overflow-y: auto;
}

/* ===== 时间线 ===== */
.tl-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.tl-item {
  display: flex;
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-md, 8px) 0;
  position: relative;
}
.tl-item:last-child { margin-bottom: 0; }

.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  border: 2px solid var(--border-high);
  background: var(--bg-card);
}
.dot-completed { border-color: var(--success); background: var(--success); }
.dot-in_progress { border-color: var(--accent-primary); background: var(--accent-primary); }
.dot-pending { border-color: var(--border-high); background: var(--bg-card); }
.dot-end { border-color: var(--text-muted); background: var(--text-muted); }

.tl-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 4px);
}
.tl-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
  flex-wrap: wrap;
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
.tl-badge {
  font-size: var(--font-xs, 12px);
  padding: 0 6px;
  border-radius: 8px;
  line-height: 1.6;
}
.badge-completed { background: var(--success-bg); color: var(--success); }
.badge-in_progress { background: var(--accent-primary10); color: var(--accent-primary); }
.badge-pending { background: var(--bg-sub-card); color: var(--text-muted); }

.tl-times {
  display: flex;
  gap: var(--spacing-md, 8px);
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}
.tl-time-label { margin-right: var(--spacing-xs, 4px); color: var(--text-muted); }
.tl-time-sep { color: var(--border-high); }
.tl-time-na { color: var(--text-muted); }
.tl-end {
  padding-top: var(--spacing-md, 8px);
  align-items: center;
  gap: var(--spacing-md, 8px);
}
.tl-end-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

/* ===== 基本信息 ===== */
.info-card, .form-card, .sla-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-low);
  padding: var(--spacing-lg, 12px);
  margin-bottom: var(--spacing-md, 8px);
}
.section-title {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-md, 8px);
  padding-left: 10px;
  border-left: 3px solid var(--accent-primary);
}
.info-grid {
  display: flex;
  flex-direction: column;
}
.info-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-low);
  min-height: 36px;
}
.info-row:last-child { border-bottom: none; }
.info-label {
  width: 80px;
  flex-shrink: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  padding: var(--spacing-xs, 4px) var(--spacing-md, 8px);
  font-weight: 500;
}
.info-value {
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
  padding: var(--spacing-xs, 4px) var(--spacing-md, 8px);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}

/* ===== SLA ===== */
.sla-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.sla-normal { background: var(--success); }
.sla-warning { background: var(--warning); }
.sla-timeout { background: var(--danger); }
.field-note { font-size: var(--font-xs, 12px); color: var(--text-muted); margin-left: 6px; }
.sla-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-md, 8px);
  background: var(--bg-sub-card);
  border-radius: var(--radius-sm, 6px);
}
.sla-metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs, 4px);
  padding: var(--spacing-md, 8px);
  background: var(--bg-card);
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

/* ===== 操作 ===== */
.drawer-actions {
  display: flex;
  gap: var(--spacing-md, 8px);
  padding-top: var(--spacing-md, 8px);
  border-top: 1px solid var(--border-low);
}
.cancel-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 8px);
}
.cancel-hint {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  margin: 0;
}
</style>
