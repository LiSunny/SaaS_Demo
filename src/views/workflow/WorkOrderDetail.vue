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
              v-for="(node, idx) in store.detail.nodes"
              :key="node.id"
              :class="[
                'tl-item',
                `tl-${node.status}`,
                { 'tl-current': isCurrentNode(node) },
              ]"
            >
              <!-- 连线（除第一个节点） -->
              <div v-if="idx > 0" class="tl-connector" :class="node.status === 'completed' ? 'line-done' : 'line-pending'"></div>
              <div class="tl-dot" :class="[`dot-${node.status}`, { 'dot-current': isCurrentNode(node) }]">
                <span v-if="node.status === 'in_progress'" class="dot-pulse"></span>
              </div>
              <div class="tl-content">
                <div class="tl-row">
                  <span class="tl-node-name">{{ node.name }}</span>
                  <span :class="['tl-badge', `badge-${node.status}`]">{{ nodeStatusText(node.status) }}</span>
                </div>
                <div v-if="node.assigneeName" class="tl-assignee-row">
                  <span class="tl-assignee">{{ node.assigneeName }}</span>
                </div>
                <div class="tl-times">
                  <div v-if="node.startedAt" class="tl-time-row">
                    <span class="tl-time-label">开始</span>
                    <span class="tl-time-val">{{ fmt(node.startedAt) }}</span>
                  </div>
                  <div v-if="node.completedAt" class="tl-time-row">
                    <span class="tl-time-label">完成</span>
                    <span class="tl-time-val">{{ fmt(node.completedAt) }}</span>
                  </div>
                  <div v-if="!node.startedAt" class="tl-time-na">—</div>
                </div>
              </div>
            </div>
            <!-- 流程结束标记 -->
            <div class="tl-item tl-end">
              <div class="tl-connector" :class="store.detail.status === 'closed' ? 'line-done' : 'line-pending'"></div>
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

          <!-- 表单卡片（按节点动态显示） -->
          <div v-if="currentFormFields.length > 0" class="form-card">
            <h4 class="section-title">
              {{ currentNodeInfo.label }}
              <span v-if="isFormReadonly" class="section-title-tag">只读</span>
            </h4>
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

          <!-- 动态操作按钮（未关闭时显示） -->
          <div v-if="showActions" class="drawer-actions">
            <!-- 当前节点主操作 -->
            <template v-if="currentNodeActions.length > 0">
              <button
                v-for="act in currentNodeActions"
                :key="act.name"
                :class="act.type === 'primary' ? 'btn-primary' : 'btn-default'"
                @click="handleNodeAction(act)"
              >{{ act.name }}</button>
            </template>
            <!-- execute 节点：提交处置 -->
            <button v-if="currentNodeType === 'execute'" class="btn-primary" @click="handleSubmitNode">提交处置</button>
            <!-- assign 节点：接单 -->
            <button v-if="currentNodeType === 'assign' && store.detail.status === 'pending_accept'" class="btn-primary" @click="handleAccept">接单</button>
            <!-- 管理操作 -->
            <div class="drawer-actions-secondary">
              <button
                v-if="store.detail.status === 'pending_accept' || store.detail.status === 'processing'"
                class="btn-default btn-sm"
                @click="reassignDialogVisible = true"
              >强制改派</button>
              <button class="btn-danger btn-sm" @click="cancelDialogVisible = true">取消工单</button>
            </div>
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
import { ElMessage } from 'element-plus'
import type { InstanceStatus, Priority, SlaStatus, WorkOrderNode } from '@/types/work-order'
import type { FormField, FieldPermission, NodeAction } from '@/types/workflow'
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
const NODE_TYPE_LABEL: Record<string, string> = {
  start: '发起信息', assign: '指派信息', execute: '处置表单',
  confirm: '审核表单', close: '关闭信息', condition: '条件判断', external: '外部回调',
}

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

// ===== 当前节点 =====
const currentNodeDef = computed(() => {
  const td = store.templateDetail
  if (!td || !store.detail) return null
  const nodeId = String(store.detail.currentNodeId ?? '')
  return td.flowDefinition.nodes.find(n => n.id === nodeId) || null
})

const currentNodeType = computed(() => currentNodeDef.value?.type || '')

const currentNodeInfo = computed(() => {
  const type = currentNodeType.value
  return {
    label: NODE_TYPE_LABEL[type] || '表单数据',
    type,
  }
})

function isCurrentNode(node: WorkOrderNode) {
  return store.detail?.currentNodeId === node.id
}

// ===== 表单数据 =====
const detailFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)

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
  // 非当前节点 → 只读
  if (currentNodeType.value === 'start' || currentNodeType.value === 'close') return true
  return false
})

// ===== 动态操作按钮 =====
const showActions = computed(() => {
  if (!store.detail) return false
  return store.detail.status !== 'closed'
})

interface ActionItem {
  name: string
  type: 'primary' | 'default'
  action: NodeAction
}

const currentNodeActions = computed<ActionItem[]>(() => {
  if (!currentNodeDef.value?.actions?.length) return []
  return currentNodeDef.value.actions.map(a => ({
    name: a.name,
    type: a.name.includes('通过') || a.name.includes('确认') ? 'primary' as const : 'default' as const,
    action: a,
  }))
})

async function handleNodeAction(act: ActionItem) {
  if (!store.detail) return
  try {
    // confirm 节点操作：通过/退回
    await ElMessage.success(`${act.name}操作成功`)
    // 刷新详情
    store.openDetail(store.detail.id)
  } catch {
    // silent
  }
}

async function handleSubmitNode() {
  if (!store.detail || !detailFormRef.value) return
  try {
    const valid = await detailFormRef.value.validate()
    if (!valid) return
    const formData = detailFormRef.value.getFormData()
    // 调用提交处置接口
    await ElMessage.success('处置结果已提交')
    store.openDetail(store.detail.id)
  } catch {
    // silent
  }
}

async function handleAccept() {
  if (!store.detail) return
  try {
    await ElMessage.success('已接单')
    store.openDetail(store.detail.id)
  } catch {
    // silent
  }
}

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
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding-right: var(--spacing-md, 8px);
  border-right: 1px solid var(--border-low);
}

.detail-right {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

/* ===== 时间线 ===== */
.tl-section {
  display: flex;
  flex-direction: column;
  position: relative;
}
.tl-item {
  display: flex;
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-sm, 6px) 0;
  position: relative;
}
.tl-item:last-child { margin-bottom: 0; }

/* 当前节点高亮 */
.tl-current {
  background: var(--accent-primary10, rgba(0, 122, 255, 0.06));
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-sm, 6px) var(--spacing-md, 8px);
  margin: 0 calc(-1 * var(--spacing-md, 8px));
}

/* 连线 */
.tl-connector {
  position: absolute;
  left: 5px;
  top: -4px;
  width: 2px;
  height: 8px;
}
.line-done { background: var(--success, #52c41a); }
.line-pending { background: var(--border-high, #d9d9d9); }

.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
  border: 2px solid var(--border-high);
  background: var(--bg-card);
  position: relative;
}
.dot-completed { border-color: var(--success); background: var(--success); }
.dot-in_progress { border-color: var(--accent-primary); background: var(--accent-primary); }
.dot-pending { border-color: var(--border-high); background: var(--bg-card); }
.dot-end { border-color: var(--text-muted); background: var(--text-muted); width: 10px; height: 10px; margin-top: 4px; }

/* 当前节点脉冲动画 */
.dot-current {
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
}
.dot-pulse {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 50%;
  border: 2px solid var(--accent-primary);
  animation: pulse-ring 2s ease-out infinite;
}
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.8); opacity: 0; }
}

.tl-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.tl-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
  flex-wrap: wrap;
}
.tl-node-name {
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-primary);
}
.tl-assignee-row {
  display: flex;
  align-items: center;
}
.tl-assignee {
  font-size: var(--font-xs, 12px);
  color: var(--text-secondary);
  background: var(--bg-sub-card);
  padding: 0 6px;
  border-radius: var(--radius-sm, 6px);
  line-height: 1.6;
}
.tl-badge {
  font-size: var(--font-xs, 12px);
  padding: 0 5px;
  border-radius: 8px;
  line-height: 1.5;
}
.badge-completed { background: var(--success-bg); color: var(--success); }
.badge-in_progress { background: var(--accent-primary10); color: var(--accent-primary); }
.badge-pending { background: var(--bg-sub-card); color: var(--text-muted); }

/* 时间垂直布局 */
.tl-times {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: var(--font-xs, 12px);
  color: var(--text-secondary);
}
.tl-time-row {
  display: flex;
  gap: var(--spacing-xs, 4px);
}
.tl-time-label { color: var(--text-muted); }
.tl-time-val { color: var(--text-secondary); }
.tl-time-na { color: var(--text-muted); font-size: var(--font-xs, 12px); }
.tl-end {
  padding-top: var(--spacing-sm, 6px);
  align-items: center;
  gap: var(--spacing-md, 8px);
}
.tl-end-label {
  font-size: var(--font-xs, 12px);
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
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
}
.section-title-tag {
  font-size: var(--font-xs, 12px);
  font-weight: 400;
  color: var(--text-muted);
  background: var(--bg-sub-card);
  padding: 1px 6px;
  border-radius: var(--radius-sm, 6px);
  border-left: none;
  margin: 0;
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

/* ===== 操作按钮 ===== */
.drawer-actions {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md, 8px);
  padding-top: var(--spacing-lg, 12px);
  border-top: 1px solid var(--border-low);
  flex-wrap: wrap;
}
.drawer-actions-secondary {
  display: flex;
  gap: var(--spacing-sm, 6px);
  margin-left: auto;
}
.btn-sm {
  font-size: var(--font-xs, 12px);
  padding: 4px 12px;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  font-size: var(--font-small, 14px);
  border-radius: var(--radius-sm, 6px);
  border: none;
  cursor: pointer;
  background: var(--accent-primary);
  color: #fff;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-default {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  font-size: var(--font-small, 14px);
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--border-high);
  cursor: pointer;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: border-color 0.2s;
}
.btn-default:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  font-size: var(--font-small, 14px);
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--danger, #ff4d4f);
  cursor: pointer;
  background: transparent;
  color: var(--danger, #ff4d4f);
  transition: opacity 0.2s;
}
.btn-danger:hover { background: var(--danger-bg); }

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
