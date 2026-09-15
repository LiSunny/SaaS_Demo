<template>
  <div class="detail-page" v-loading="store.detailLoading">
    <!-- ===== 面包屑 + 上一条/下一条（仅已关闭状态显示按钮） ===== -->
    <div class="top-bar">
      <nav class="breadcrumb">
        <button class="breadcrumb-link" @click="goBack">工单监控</button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">{{ store.detail?.orderNo || '工单详情' }}</span>
      </nav>
      <!-- 上一条/下一条：仅已关闭工单在顶部显示（对齐设计稿） -->
      <div v-if="store.detail?.status === 'closed'" class="top-bar-actions">
        <button class="btn-nav" :disabled="!prevId" @click="goPrev">
          <span class="nav-arrow">‹</span> 上一条
        </button>
        <button class="btn-nav" :disabled="!nextId" @click="goNext">
          下一条 <span class="nav-arrow">›</span>
        </button>
      </div>
    </div>

    <template v-if="store.detail">
      <!-- ===== 页面头部：仅未关闭状态显示（已关闭对齐设计稿：精简布局，无页面头） ===== -->
      <div v-if="store.detail.status !== 'closed'" class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <span class="header-icon-text">📋</span>
          </div>
          <div class="header-info">
            <div class="header-title-row">
              <div class="priority-display">
                <StatusTag :status="store.detail.priority" :label="priorityLabel(store.detail.priority)" />
                <span v-if="store.detail.escalatedFrom" class="escalated-badge" :title="'原优先级：' + priorityLabel(store.detail.escalatedFrom)">↑ 已升级</span>
                <button
                  v-if="(store.detail.status as string) !== 'closed'"
                  class="priority-edit-btn"
                  title="修改优先级"
                  @click="openPriorityDialog"
                >✎</button>
              </div>
              <span class="header-title">{{ store.detail.title }}</span>
            </div>
            <p class="header-subtitle">
              {{ store.detail.templateName }} · 发起人：{{ store.detail.creatorName }}
            </p>
          </div>
        </div>
        <div class="header-right">
          <!-- 草稿状态 → 发起按钮 -->
          <button
            v-if="store.detail.status === 'draft'"
            class="btn-primary btn-submit-draft"
            @click="handleSubmitDraft"
          >
            发起
          </button>
          <!-- 注：上一条/下一条按钮已搬到顶部 .top-bar，仅已关闭状态显示 -->
        </div>
      </div>

      <!-- ===== 已关闭状态：双栏布局（对齐设计稿：左主内容 + 右流转记录） ===== -->
      <template v-if="store.detail.status === 'closed'">
        <div class="closed-layout">

          <!-- 左主内容：3 张主卡 + 节点区块（节点区块下轮决定是否合并到表单详情卡） -->
          <div class="closed-main">

            <!-- ===== 指标分析（对齐设计稿：4px 圆角竖线小标题 + 横向 3 卡 = icon + 标题/ⓘ弹窗 + 数字 + 单位 + 右侧 tip） ===== -->
            <div class="sla-card">
              <h4 class="section-title">指标分析</h4>
              <div class="sla-metrics">
                <!-- TTR响应 -->
                <div class="sla-metric-card">
                  <span class="sla-metric-icon">
                    <svg class="sla-metric-svg" aria-hidden="true"><use href="/sprite.svg#icon-right-user" /></svg>
                  </span>
                  <div class="sla-metric-body">
                    <div class="sla-metric-label-row">
                      <span class="sla-metric-label">TTR响应</span>
                      <el-popover
                        placement="top"
                        :width="220"
                        trigger="hover"
                        :show-after="100"
                        popper-class="sla-tip-popover"
                      >
                        <template #reference>
                          <AppIcon name="info-circle" class="sla-metric-info" />
                        </template>
                        <div class="sla-popover-content">
                          <p class="sla-popover-title">TTR 响应时效</p>
                          <p class="sla-popover-desc">从发起，到流转至首个执行节点的间隔时间</p>
                          <p class="sla-popover-row">
                            <span>SLA 阈值：</span>
                            <strong>{{ formatMinutes(slaMetrics.ttrLimit) }}</strong>
                          </p>
                          <p class="sla-popover-row">
                            <span>实际耗时：</span>
                            <strong>{{ formatMinutes(Math.round((store.detail?.sla?.ttrMinutes || 0) * (store.detail?.sla?.ttrProgress || 0))) }}</strong>
                          </p>
                          <p v-if="!slaMetrics.ttrOk" class="sla-popover-status sla-popover-status-timeout">状态：超时</p>
                          <p v-else class="sla-popover-status sla-popover-status-ok">状态：正常</p>
                        </div>
                      </el-popover>
                    </div>
                    <div class="sla-metric-value-row">
                      <span v-if="!slaMetrics.ttrOk" class="sla-metric-value sla-metric-value-timeout">超时</span>
                      <template v-else>
                        <span class="sla-metric-value">{{ slaMetrics.ttrText }}</span>
                        <span class="sla-metric-unit">{{ slaMetrics.ttrUnit }}</span>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- TTS解决 -->
                <div class="sla-metric-card">
                  <span class="sla-metric-icon">
                    <svg class="sla-metric-svg" aria-hidden="true"><use href="/sprite.svg#icon-inbox-success" /></svg>
                  </span>
                  <div class="sla-metric-body">
                    <div class="sla-metric-label-row">
                      <span class="sla-metric-label">TTS解决</span>
                      <el-popover
                        placement="top"
                        :width="220"
                        trigger="hover"
                        :show-after="100"
                        popper-class="sla-tip-popover"
                      >
                        <template #reference>
                          <AppIcon name="info-circle" class="sla-metric-info" />
                        </template>
                        <div class="sla-popover-content">
                          <p class="sla-popover-title">TTS 解决时效</p>
                          <p class="sla-popover-desc">从流转到首个执行节点到最后一个执行人提交结果的间隔时间</p>
                          <p class="sla-popover-row">
                            <span>SLA 阈值：</span>
                            <strong>{{ formatMinutes(slaMetrics.ttsLimit) }}</strong>
                          </p>
                          <p class="sla-popover-row">
                            <span>实际耗时：</span>
                            <strong>{{ formatMinutes(Math.round((store.detail?.sla?.ttsMinutes || 0) * (store.detail?.sla?.ttsProgress || 1))) }}</strong>
                          </p>
                          <p v-if="!slaMetrics.ttsOk" class="sla-popover-status sla-popover-status-timeout">状态：超时</p>
                          <p v-else class="sla-popover-status sla-popover-status-ok">状态：正常</p>
                        </div>
                      </el-popover>
                    </div>
                    <div class="sla-metric-value-row">
                      <span v-if="!slaMetrics.ttsOk" class="sla-metric-value sla-metric-value-timeout">超时</span>
                      <template v-else>
                        <span class="sla-metric-value">{{ slaMetrics.ttsText }}</span>
                        <span class="sla-metric-unit">{{ slaMetrics.ttsUnit }}</span>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- 总耗时（始终显示数字 + 单位） -->
                <div class="sla-metric-card">
                  <span class="sla-metric-icon">
                    <svg class="sla-metric-svg" aria-hidden="true"><use href="/sprite.svg#icon-timer" /></svg>
                  </span>
                  <div class="sla-metric-body">
                    <div class="sla-metric-label-row">
                      <span class="sla-metric-label">总耗时</span>
                      <el-popover
                        placement="top"
                        :width="220"
                        trigger="hover"
                        :show-after="100"
                        popper-class="sla-tip-popover"
                      >
                        <template #reference>
                          <AppIcon name="info-circle" class="sla-metric-info" />
                        </template>
                        <div class="sla-popover-content">
                          <p class="sla-popover-title">总耗时</p>
                          <p class="sla-popover-desc">从流程发起到流程关闭的时间间隔</p>
                          <p class="sla-popover-row">
                            <span>实际耗时：</span>
                            <strong>{{ slaMetrics.totalText }}{{ slaMetrics.totalUnit }}</strong>
                          </p>
                        </div>
                      </el-popover>
                    </div>
                    <div class="sla-metric-value-row">
                      <span class="sla-metric-value">{{ slaMetrics.totalText }}</span>
                      <span class="sla-metric-unit">{{ slaMetrics.totalUnit }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ===== 基本信息（对齐设计稿：标题/优先级/发起人/工单状态/发起时间/关闭时间 + 关闭人） ===== -->
            <div class="info-card">
              <h4 class="section-title">基本信息</h4>
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">标题</span>
                  <span class="info-value">{{ store.detail.title || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">优先级</span>
                  <span class="info-value"><StatusTag :status="store.detail.priority" :label="priorityLabel(store.detail.priority)" /></span>
                </div>
                <div class="info-row">
                  <span class="info-label">发起人</span>
                  <span class="info-value">{{ store.detail.creatorName }} / {{ store.detail.creatorOrgName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">工单状态</span>
                  <span class="info-value"><StatusTag :status="store.detail.status" :label="statusLabel(store.detail.status)" /></span>
                </div>
                <div class="info-row">
                  <span class="info-label">发起时间</span>
                  <span class="info-value">{{ store.detail.createdAt }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">关闭时间</span>
                  <span class="info-value">{{ store.detail.closedAt || '—' }}</span>
                </div>
              </div>
            </div>

            <!-- ===== 处理记录（对齐设计稿 5685-11944：完整工单表单展示 + 父容器固定高度 + 内部滚动） ===== -->
            <div class="process-records-card">
              <div class="process-records-header">
                <h4 class="section-title">表单信息</h4>
                <button class="btn-link-export" :title="'导出表单'" :disabled="exporting" @click="exportProcessRecords">
                  {{ exporting ? '导出中...' : '导出' }}
                </button>
              </div>

              <!-- 空态 -->
              <div v-if="mergedFormData.fieldCount === 0" class="process-records-empty">
                暂无表单数据
              </div>

              <!-- 完整表单（按 Figma 设计稿：5 字段顺序渲染） -->
              <div v-else class="process-records-list">
                <div class="form-card">
                  <!-- 字段 1：故障描述（input：label + value 横排 45px） -->
                  <div class="form-row form-row-inline">
                    <span class="form-label">{{ formFieldMeta.Feqcmpz7ldykabc.label }}</span>
                    <div class="form-value-box">
                      <span class="form-value-text">{{ mergedFormData.desc || '—' }}</span>
                    </div>
                  </div>

                  <!-- 字段 2：故障照片（upload：label + 128×134 图片 垂直布局） -->
                  <div class="form-row form-row-block">
                    <span class="form-label">{{ formFieldMeta.F4pumpz7ll1uaec.label }}</span>
                    <div class="form-image-box">
                      <img v-if="mergedFormData.beforePhoto" :src="mergedFormData.beforePhoto" class="form-image" alt="故障照片" />
                      <span v-else class="form-image-placeholder">暂无照片</span>
                    </div>
                  </div>

                  <!-- 字段 3：维修结果（radio：label + 2 个 checkbox 横排 45px） -->
                  <div class="form-row form-row-inline">
                    <span class="form-label">{{ formFieldMeta.Fskkmpz7m3jjanc.label }}</span>
                    <div class="form-radio-group">
                      <label
                        v-for="opt in formFieldMeta.Fskkmpz7m3jjanc.options"
                        :key="opt.value"
                        class="form-radio-item"
                      >
                        <span :class="['form-checkbox', mergedFormData.repairResult === opt.value ? 'form-checkbox-checked' : '']">
                          <svg v-if="mergedFormData.repairResult === opt.value" class="form-checkbox-svg" aria-hidden="true">
                            <use href="/sprite.svg#icon-check" />
                          </svg>
                        </span>
                        <span class="form-radio-label">{{ opt.label }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- 字段 4：维修后照片（upload：label + 128×134 图片 垂直布局） -->
                  <div class="form-row form-row-block">
                    <span class="form-label">{{ formFieldMeta.F9ltmpz7mn57aqc.label }}</span>
                    <div class="form-image-box">
                      <img v-if="mergedFormData.afterPhoto" :src="mergedFormData.afterPhoto" class="form-image" alt="维修后照片" />
                      <span v-else class="form-image-placeholder">暂无照片</span>
                    </div>
                  </div>

                  <!-- 字段 5：验收审核（radio：label + 2 个 checkbox 横排 45px） -->
                  <div class="form-row form-row-inline">
                    <span class="form-label">{{ formFieldMeta.Foewmpz7mv4catc.label }}</span>
                    <div class="form-radio-group">
                      <label
                        v-for="opt in formFieldMeta.Foewmpz7mv4catc.options"
                        :key="opt.value"
                        class="form-radio-item"
                      >
                        <span :class="['form-checkbox', mergedFormData.approval === opt.value ? 'form-checkbox-checked' : '']">
                          <svg v-if="mergedFormData.approval === opt.value" class="form-checkbox-svg" aria-hidden="true">
                            <use href="/sprite.svg#icon-check" />
                          </svg>
                        </span>
                        <span class="form-radio-label">{{ opt.label }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- 右流转记录：固定 447px（设计稿值） -->
          <div class="closed-sidebar">
            <FlowRecords :records="store.detail.records || []" />
          </div>

        </div>
      </template>

      <!-- ===== 未关闭状态：双栏布局 ===== -->
      <template v-else>
        <div class="detail-body">
          <!-- 左栏 -->
          <div class="detail-main">
            <!-- 流程进度 -->
            <OrderProgress
              :flow-nodes="store.templateDetail?.flowDefinition?.nodes || []"
              :runtime-nodes="store.detail.nodes"
              @select="scrollToNode"
            />

            <!-- 工单信息（只读） -->
            <div class="readonly-card">
              <div class="card-header">
                <p class="card-title">工单信息（只读）</p>
              </div>
              <div class="readonly-body">
                <template v-if="readonlyFormItems.length === 0">
                  <p class="readonly-empty">暂无数据</p>
                </template>
                <template v-else>
                  <div
                    v-for="item in readonlyFormItems"
                    :key="item.fieldId"
                    class="readonly-row"
                  >
                    <span class="readonly-label">{{ item.label }}</span>
                    <!-- 图片类型 -->
                    <div v-if="item.type === 'upload' && item.value" class="readonly-value readonly-image">
                      <!-- 新格式：文件对象数组 [{name,url,...}] -->
                      <template v-if="Array.isArray(item.value)">
                        <div v-for="(f, fi) in item.value" :key="fi" class="upload-file-item">
                          <img v-if="isImageFile(f)" :src="getFileUrl(f)" class="readonly-thumb" alt="" />
                          <a v-else :href="getFileUrl(f)" target="_blank" class="upload-file-link">{{ f.name || '附件' + (fi + 1) }}</a>
                        </div>
                      </template>
                      <!-- 旧格式：纯字符串 URL -->
                      <img v-else :src="item.value" class="readonly-thumb" alt="" />
                    </div>
                    <!-- 普通值 -->
                    <div v-else class="readonly-value">
                      <span class="readonly-text">{{ item.value || '—' }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 当前节点操作 -->
            <div v-if="currentNode" class="action-card">
              <div class="card-header">
                <p class="card-title">{{ currentNode.name }}</p>
              </div>

              <!-- 指派节点 -->
              <template v-if="currentNode.type === 'assign'">
                <!-- 多人抢单：接单按钮 -->
                <div v-if="showAccept" class="action-accept">
                  <button class="btn-primary btn-accept" @click="handleAccept">接单</button>
                  <p class="action-accept-hint">多人可接单，先接单者获得该任务</p>
                </div>

                <!-- 可编辑表单字段 -->
                <div v-if="editableFormFields.length > 0" class="action-form">
                  <DynamicForm
                    :ref="el => setFormRef(currentNodeId, el)"
                    :fields="editableFormFields"
                    :permissions="editablePermissions"
                    :initial-data="getNodeInitialData(currentNode)"
                    :readonly="false"
                  />
                   <div class="action-buttons">
                    <button class="btn-primary" @click="handleAssignSubmit">保存</button>
                  </div>
                </div>

              </template>

              <!-- 执行 / 确认 节点 → DynamicForm + 操作按钮 -->
              <template v-else-if="currentNode.type === 'execute' || currentNode.type === 'confirm'">
                <div v-if="editableFormFields.length > 0" class="action-form">
                  <DynamicForm
                    :ref="el => setFormRef(currentNodeId, el)"
                    :fields="editableFormFields"
                    :permissions="editablePermissions"
                    :initial-data="getNodeInitialData(currentNode)"
                    :readonly="false"
                  />
                </div>

                <!-- 操作按钮 -->
                <div v-if="hasNodeActions" class="action-buttons">
                  <template v-if="currentNode.type === 'confirm'">
                    <button
                      v-for="act in getNodeActions(currentNode)"
                      :key="act.name"
                      :class="act.type === 'primary' ? 'btn-primary' : 'btn-danger-outline'"
                      @click="handleNodeAction(currentNode, act)"
                    >{{ act.name }}</button>
                  </template>
                  <template v-else-if="editableFormFields.length > 0">
                    <button class="btn-primary" @click="handleSubmitNode(currentNode)">保存</button>
                  </template>
                </div>
                <div v-if="!hasNodeActions && editableFormFields.length === 0" class="action-empty">
                  当前节点无待填写字段
                </div>
              </template>

              <!-- 其他节点类型 -->
              <div v-else class="action-empty">
                当前节点无操作项
              </div>
            </div>

            <!-- 无当前节点 -->
            <div v-else class="action-card">
              <div class="card-header">
                <p class="card-title">当前状态</p>
              </div>
              <div class="action-empty">无进行中的节点</div>
            </div>
          </div>

          <!-- 右栏：流转记录 -->
          <div class="detail-sidebar">
            <FlowRecords :records="store.detail.records || []" />
          </div>
        </div>

        <!-- 底部操作栏（工单级操作） -->
        <div class="page-actions">
          <button
            v-if="store.detail.status === 'active' && store.detail.currentAssigneeId != null"
            class="btn-default"
            @click="reassignDialogVisible = true"
          >强制改派</button>
          <button
            v-if="(store.detail.status as string) !== 'closed'"
            class="btn-danger"
            @click="cancelDialogVisible = true"
          >取消工单</button>
        </div>
      </template> 
    </template>

    <!-- ===== 取消确认弹窗 ===== -->
    <el-dialog v-model="cancelDialogVisible" title="取消工单" width="480px" :close-on-click-modal="false">
      <div class="dialog-content">
        <p class="dialog-hint">确认取消工单 <strong>{{ store.detail?.orderNo }}</strong>？取消后工单将进入已关闭状态。</p>
        <el-input v-model="cancelReason" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入取消原因" />
      </div>
      <template #footer>
        <button class="btn-default" @click="cancelDialogVisible = false">关闭</button>
        <button class="btn-danger" :disabled="!cancelReason.trim()" @click="doCancel">确认取消</button>
      </template>
    </el-dialog>

    <!-- ===== 改派弹窗 ===== -->
    <el-dialog v-model="reassignDialogVisible" title="强制改派" width="480px" :close-on-click-modal="false">
      <div class="dialog-content">
        <p class="dialog-hint">将工单 <strong>{{ store.detail?.orderNo }}</strong> 改派给其他处理人。</p>
        <PersonSelector :selected-ids="reassignTargetId ? [reassignTargetId] : []" placeholder="请选择处理人" @confirm="reassignTargetId = $event[0] || 0" />
        <el-input v-model="reassignReason" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入改派原因" style="margin-top:12px" />
      </div>
      <template #footer>
        <button class="btn-default" @click="reassignDialogVisible = false">关闭</button>
        <button class="btn-primary" :disabled="!reassignTargetId" @click="doReassign">确认改派</button>
      </template>
    </el-dialog>

    <!-- ===== 修改优先级弹窗 ===== -->
    <el-dialog v-model="priorityDialogVisible" title="修改优先级" width="480px" :close-on-click-modal="false">
      <div class="dialog-content">
        <p class="dialog-hint">修改工单 <strong>{{ store.detail?.orderNo }}</strong> 的优先级。</p>
        <div class="priority-options-dialog">
          <label
            v-for="opt in priorityOptionList"
            :key="opt.value"
            :class="['priority-item-dialog', { active: newPriority === opt.value }]"
            @click="newPriority = opt.value"
          >
            <span :class="['priority-radio-dialog', { checked: newPriority === opt.value }]" />
            <span class="priority-text-dialog">{{ opt.label }}</span>
          </label>
        </div>
        <el-input v-model="priorityReason" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入修改原因" style="margin-top:12px" />
      </div>
      <template #footer>
        <button class="btn-default" @click="priorityDialogVisible = false">关闭</button>
        <button class="btn-primary" :disabled="!newPriority || newPriority === store.detail?.priority" @click="doChangePriority">确认修改</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { InstanceStatus, Priority, WorkOrderNode } from '@/types/work-order'
import type { FormField, FieldPermission, NodeAction } from '@/types/workflow'
import { useWorkOrderStore } from '@/stores/work-order'
import StatusTag from '@/components/business/StatusTag.vue'
import PersonSelector from '@/components/business/PersonSelector.vue'
import DynamicForm from '@/components/business/DynamicForm.vue'
import OrderProgress from '@/components/business/OrderProgress.vue'
import FlowRecords from '@/components/business/FlowRecords.vue'
import { exportWorkOrderToPDF } from '@/utils/work-order-export'

const route = useRoute()
const router = useRouter()
const store = useWorkOrderStore()

const STATUS_LABEL: Record<InstanceStatus, string> = {
  draft: '草稿', active: '进行中', closed: '已关闭',
}
const PRIORITY_LABEL: Record<Priority, string> = { urgent: '紧急', high: '高', normal: '普通', low: '低' }

function statusLabel(s: InstanceStatus) { return STATUS_LABEL[s] || s }
function priorityLabel(p: Priority) { return PRIORITY_LABEL[p] || p }

// ===== 导航 =====
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/system/monitor')
  }
}

// ===== 草稿发起 =====
const submittingDraft = ref(false)
async function handleSubmitDraft() {
  if (!store.detail) return
  submittingDraft.value = true
  try {
    await store.submitDraft(store.detail.id)
  } catch (e: any) {
    ElMessage.error(e.message || '发起失败')
  } finally {
    submittingDraft.value = false
  }
}

// ===== 数据加载 =====
// 监听路由 id 变化：上一条/下一条跳转时不刷新会导致详情数据残留
onMounted(() => {
  const id = Number(route.params.id)
  if (id) store.openDetail(id)
})
watch(
  () => route.params.id,
  (newId) => {
    const id = Number(newId)
    if (id && id !== store.detail?.id) {
      store.openDetail(id)
    }
  },
)

// ===== 处理记录（已关闭工单：合并各节点表单，渲染完整工单表单） =====
// 字段元数据（设计稿 5685-11944）：字段 ID → 中文 label / 选项
interface FormFieldMeta {
  label: string
  options?: { value: string; label: string }[]
}
const formFieldMeta: Record<string, FormFieldMeta> = {
  Feqcmpz7ldykabc: { label: '故障描述' },
  F4pumpz7ll1uaec: { label: '故障照片' },
  Fskkmpz7m3jjanc: {
    label: '维修结果',
    options: [
      { value: 'repaired',   label: '已完成' },
      { value: 'unrepaired', label: '未完成' },
    ],
  },
  F9ltmpz7mn57aqc: { label: '维修后照片' },
  Foewmpz7mv4catc: {
    label: '验收审核',
    options: [
      { value: 'approved', label: '通过' },
      { value: 'rejected', label: '驳回' },
    ],
  },
}

// 合并后的完整表单数据：把 start/execute/confirm 各节点的 data 合并成一张完整表单
const mergedFormData = computed(() => {
  // 优先用 formData（start 节点的 data），再叠加 nodeRecords 后出现的字段（覆盖前面的值）
  const merged: Record<string, any> = { ...(store.detail?.formData || {}) }
  for (const nr of store.detail?.nodeRecords || []) {
    Object.assign(merged, nr.data || {})
  }
  const beforePhoto = merged.F4pumpz7ll1uaec
  const afterPhoto = merged.F9ltmpz7mn57aqc
  const repairResult = merged.Fskkmpz7m3jjanc
  const approval = merged.Foewmpz7mv4catc
  const desc = merged.Feqcmpz7ldykabc
  const fieldCount = [desc, beforePhoto, repairResult, afterPhoto, approval]
    .filter(v => v !== undefined && v !== null && v !== '').length
  return { desc, beforePhoto, afterPhoto, repairResult, approval, fieldCount }
})

// 导出（设计稿右上角「导出」按钮：调用 work-order-export 生成制式 PDF）
const exporting = ref(false)
async function exportProcessRecords() {
  if (!store.detail || exporting.value) return
  exporting.value = true
  try {
    await exportWorkOrderToPDF({
      orderNo: store.detail.orderNo,
      title: store.detail.title || null,
      templateName: store.detail.templateName,
      priority: store.detail.priority,
      status: store.detail.status,
      creatorName: store.detail.creatorName,
      creatorOrgName: store.detail.creatorOrgName,
      createdAt: store.detail.createdAt,
      closedAt: store.detail.closedAt,
      formData: store.detail.formData,
      nodeRecords: store.detail.nodeRecords,
      records: store.detail.records,
    })
    ElMessage.success('导出成功')
  } catch (e: any) {
    console.error('[PDF Export]', e)
    ElMessage.error(`导出失败：${e?.message || '未知错误'}`)
  } finally {
    exporting.value = false
  }
}
const currentNode = computed(() =>
  store.detail?.nodes.find(n => n.status === 'in_progress')
)

const currentNodeId = computed(() =>
  currentNode.value ? String(currentNode.value.id) : ''
)

const currentFlowNode = computed(() =>
  store.templateDetail?.flowDefinition.nodes.find(
    n => String(n.id) === String(currentNode.value?.id)
  )
)

// ===== 查找字段定义 =====
function findFieldDefinition(fieldId: string): FormField | undefined {
  const td = store.templateDetail
  if (!td) return undefined
  for (const nodeId of Object.keys(td.formSchema)) {
    const fields = td.formSchema[nodeId]?.fields || []
    const found = fields.find(f => f.id === fieldId)
    if (found) return found
  }
  return undefined
}

// ===== 只读区：聚合已完成节点数据，排除当前节点 editable/hidden 字段 =====
interface ReadonlyFormItem {
  fieldId: string
  label: string
  value: any
  type: string
}

const readonlyFormItems = computed<ReadonlyFormItem[]>(() => {
  const records = store.detail?.nodeRecords || []
  const permFields = currentFlowNode.value?.formFields || []
  const editableIds = new Set(permFields.filter(p => p.mode === 'editable').map(p => p.fieldId))
  const hiddenIds = new Set(permFields.filter(p => p.mode === 'hidden').map(p => p.fieldId))

  const items: ReadonlyFormItem[] = []
  const seenIds = new Set<string>()

  // 倒序遍历 records（后面的记录可能覆盖前面的值）
  for (const record of [...records].reverse()) {
    for (const [fieldId, value] of Object.entries(record.data)) {
      if (seenIds.has(fieldId)) continue
      if (editableIds.has(fieldId)) continue
      if (hiddenIds.has(fieldId)) continue
      if (value === undefined || value === null || value === '') continue

      const fieldDef = findFieldDefinition(fieldId)
      if (!fieldDef) continue

      seenIds.add(fieldId)
      items.push({
        fieldId,
        label: fieldDef.label,
        value,
        type: fieldDef.type,
      })
    }
  }

  return items
})

// ===== 可编辑区：当前节点权限为 editable 的字段 =====
const editableFormFields = computed<FormField[]>(() => {
  const nodeId = String(currentNode.value?.id)
  const schema = store.templateDetail?.formSchema
  // 优先取当前节点专属字段；无则汇总全部节点字段（模板配置时表单设计器只生成 start 节点字段）
  let allFields = schema?.[nodeId]?.fields || []
  if (allFields.length === 0 && schema) {
    allFields = Object.values(schema).flatMap(s => s.fields || [])
  }
  const permFields = currentFlowNode.value?.formFields || []

  return allFields.filter(f => {
    const perm = permFields.find(p => p.fieldId === f.id)
    return perm?.mode === 'editable'
  })
})

const editablePermissions = computed<FieldPermission[]>(() =>
  editableFormFields.value.map(f => ({ fieldId: f.id, mode: 'editable' as const }))
)

// ===== 节点表单字段（已关闭时用） =====
function getNodeFormFields(node: WorkOrderNode): FormField[] {
  const td = store.templateDetail
  if (!td) return []
  const nodeId = String(node.id)

  // 优先取当前节点专属字段；无则汇总全部节点字段
  // （模板配置时表单设计器只生成 start 节点字段，execute/confirm 节点通过 formFields 引用）
  let schemaFields = td.formSchema[nodeId]?.fields || []
  if (schemaFields.length === 0 && td.formSchema) {
    schemaFields = Object.values(td.formSchema).flatMap(s => s.fields || [])
  }

  // 找到对应流程节点，获取字段权限配置
  const flowNode = td.flowDefinition.nodes.find(n => n.id === nodeId)
  if (!flowNode?.formFields?.length) return schemaFields

  // 只展示 editable 的字段
  if (node.type === 'start') {
    // start 节点：非 hidden 即 editable（用户填写初始表单）
    const hiddenIds = new Set(
      flowNode.formFields.filter(p => p.mode === 'hidden').map(p => p.fieldId)
    )
    return schemaFields.filter(f => !hiddenIds.has(f.id))
  }

  // 其他节点：只展示显式 mode === 'editable' 的字段
  const editableIds = new Set(
    flowNode.formFields.filter(p => p.mode === 'editable').map(p => p.fieldId)
  )
  return schemaFields.filter(f => editableIds.has(f.id))
}

function getNodePermissions(node: WorkOrderNode): FieldPermission[] {
  const td = store.templateDetail
  if (!td) return []
  const nodeId = String(node.id)
  const flowNode = td.flowDefinition.nodes.find(n => n.id === nodeId)
  return flowNode?.formFields || []
}

function getNodeInitialData(node: WorkOrderNode): Record<string, any> {
  if (store.detail?.nodeRecords) {
    const record = store.detail.nodeRecords.find(r => String(r.nodeId) === String(node.id))
    if (record) return record.data
  }
  if (store.detail?.formData) return store.detail.formData
  return {}
}

// ===== 上传文件显示辅助 =====
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i
function isImageFile(f: any): boolean {
  const name = f?.name || f?.url || ''
  return IMAGE_EXTENSIONS.test(name)
}
function getFileUrl(f: any): string {
  return f?.url || (f?.raw ? URL.createObjectURL(f.raw) : '')
}

// ===== 节点操作按钮 =====
interface ActionItem { name: string; type: 'primary' | 'default'; action: NodeAction }

function getNodeActions(node: WorkOrderNode): ActionItem[] {
  const td = store.templateDetail
  if (!td) return []
  const nodeId = String(node.id)
  const flowNode = td.flowDefinition.nodes.find(n => n.id === nodeId)
  if (!flowNode?.actions?.length) return []
  return flowNode.actions.map(a => ({
    name: a.name,
    type: a.name.includes('通过') || a.name.includes('确认') ? 'primary' as const : 'default' as const,
    action: a,
  }))
}

const hasNodeActions = computed(() => {
  if (!currentNode.value) return false
  if (currentNode.value.type === 'confirm') return getNodeActions(currentNode.value).length > 0
  if (currentNode.value.type === 'execute') return editableFormFields.value.length > 0
  return false
})

// ===== 接单按钮（节点级操作） =====
// 仅指派节点 + 多人抢单模式 + 尚未被认领时显示
const showAccept = computed(() => {
  if (!currentNode.value || !store.detail) return false
  if (currentNode.value.type !== 'assign') return false
  const flowNode = currentFlowNode.value
  if (!flowNode?.assignConfig) return false
  return flowNode.assignConfig.multipleMode === 'anyone'
    && store.detail.currentAssigneeId == null
})

// ===== 表单引用 =====
const formRefs: Record<string, any> = {}

function setFormRef(nodeId: string, el: any) {
  if (el) formRefs[nodeId] = el
}

// ===== 滚动到节点 =====
function scrollToNode(node: WorkOrderNode) {
  // 在双栏布局中，进度点击可高亮对应区域
  const el = document.querySelector(`[data-node-id="${node.id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ===== SLA 指标 =====
// 文本拆成"值"+"单位"两部分（设计稿横向布局：大数字 + 右侧小字单位）
function splitValueAndUnit(m: number): { value: string; unit: string } {
  if (m >= 1440) return { value: `${Math.round(m / 1440)}`, unit: '天' }
  if (m >= 60) return { value: `${Math.round(m / 60)}h${m % 60}m`, unit: '' }
  return { value: `${m}`, unit: '分钟' }
}

function formatMinutes(m: number): string {
  if (m >= 1440) return `${Math.round(m / 1440)}天`
  if (m >= 60) return `${Math.round(m / 60)}h${m % 60}m`
  return `${m}分钟`
}

const slaMetrics = computed(() => {
  const sla = store.detail?.sla
  if (!sla) {
    return {
      ttrText: '—', ttsText: '—', totalText: '—',
      ttrUnit: '', ttsUnit: '', totalUnit: '',
      ttrOk: true, ttsOk: true,
      ttrTip: '', ttsTip: '',
      ttrLimit: 0, ttsLimit: 0, yellowPercent: 0,
    }
  }
  const ttrMinutes = sla.ttrMinutes || 0
  const ttsMinutes = sla.ttsMinutes || 0
  const ttrUsed = Math.round(ttrMinutes * (sla.ttrProgress || 0))
  const ttsUsed = Math.round(ttsMinutes * (sla.ttsProgress || 1))
  const total = ttrUsed + ttsUsed
  const ttrSplit = splitValueAndUnit(Math.max(ttrUsed, 0))
  const ttsSplit = splitValueAndUnit(Math.max(ttsUsed, 0))
  const totalSplit = splitValueAndUnit(Math.max(total, 0))

  // 超时规则说明（设计稿示例：「紧急响应时效为 45 分钟，实际响应时效为 55 分钟，故判定超时」）
  const ttrOk = sla.slaStatus !== 'timeout' || (ttrUsed <= ttrMinutes)
  const ttsOk = sla.slaStatus !== 'timeout' || (ttsUsed <= ttsMinutes)
  const ttrTip = !ttrOk && ttrMinutes > 0
    ? `紧急响应时效为 ${formatMinutes(ttrMinutes)}，实际响应时效为 ${formatMinutes(ttrUsed)}，故判定超时`
    : ''
  const ttsTip = !ttsOk && ttsMinutes > 0
    ? `解决时效要求为 ${formatMinutes(ttsMinutes)}，实际耗时 ${formatMinutes(ttsUsed)}，故判定超时`
    : ''

  return {
    ttrText: ttrSplit.value,
    ttsText: ttsSplit.value,
    totalText: totalSplit.value,
    ttrUnit: ttrSplit.unit,
    ttsUnit: ttsSplit.unit,
    totalUnit: totalSplit.unit,
    ttrOk,
    ttsOk,
    ttrTip,
    ttsTip,
    ttrLimit: ttrMinutes,
    ttsLimit: ttsMinutes,
    yellowPercent: Math.round((sla.yellowThreshold || 0) * 100),
  }
})

// ===== 操作处理 =====

/** 将字符串值转为正整数（mock 场景的简单映射） */
function hashToId(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) + 1
}

async function handleAccept() {
  if (!store.detail) return
  try { await store.acceptOrder(store.detail.id) } catch (e: any) { ElMessage.error(e?.message || '接单失败') }
}

async function handleAssignSubmit() {
  if (!store.detail) return
  try {
    // 校验表单（如有可编辑字段）
    const formRef = formRefs[currentNodeId.value]
    if (formRef && editableFormFields.value.length > 0) {
      const valid = await formRef.validate()
      if (!valid) return
    }
    // 收集指派节点的表单数据
    const formData: Record<string, any> = formRef && editableFormFields.value.length > 0
      ? formRef.getFormData()
      : {}
    // 从 dynamicAssignFieldId 解析指派人
    const dynFieldId = currentFlowNode.value?.dynamicAssignFieldId
    if (dynFieldId) {
      const value = formData[dynFieldId]
      if (value !== undefined && value !== null && value !== '') {
        // 转换字段值为数值型 assigneeId（mock 用简单 hash）
        formData.assigneeId = typeof value === 'number' ? value : hashToId(String(value))
      }
    }
    if (!formData.assigneeId) {
      ElMessage.warning('请选择指派人')
      return
    }
    await store.submitForm(store.detail.id, formData)
  } catch (e: any) { ElMessage.error(e?.message || '指派失败') }
}

async function handleSubmitNode(node: WorkOrderNode) {
  if (!store.detail) return
  const formRef = formRefs[String(node.id)]
  if (!formRef) return
  try {
    const valid = await formRef.validate()
    if (!valid) return
    const formData = formRef.getFormData()
    await store.submitForm(store.detail.id, formData)
  } catch (e: any) { ElMessage.error(e?.message || '提交失败') }
}

async function handleNodeAction(_node: WorkOrderNode, act: ActionItem) {
  if (!store.detail) return
  try { await store.executeNodeAction(store.detail.id, act.action) } catch (e: any) { ElMessage.error(e?.message || '操作失败') }
}

const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const reassignDialogVisible = ref(false)
const reassignReason = ref('')
const reassignTargetId = ref(0)
const priorityDialogVisible = ref(false)
const newPriority = ref<Priority>('normal')
const priorityReason = ref('')
const priorityOptionList = [
  { label: '紧急', value: 'urgent' as Priority },
  { label: '高', value: 'high' as Priority },
  { label: '普通', value: 'normal' as Priority },
  { label: '低', value: 'low' as Priority },
]

function openPriorityDialog() {
  if (store.detail) {
    newPriority.value = store.detail.priority
  }
  priorityReason.value = ''
  priorityDialogVisible.value = true
}

async function doChangePriority() {
  if (!store.detail || !newPriority.value) return
  if (newPriority.value === store.detail.priority) return
  try {
    await store.changePriority(store.detail.id, newPriority.value, '张三', priorityReason.value)
    priorityDialogVisible.value = false
    priorityReason.value = ''
  } catch (e: any) {
    ElMessage.error(e?.message || '修改优先级失败')
  }
}

async function doCancel() {
  if (!store.detail) return
  await store.cancel(store.detail.id, cancelReason.value)
  cancelReason.value = ''
  cancelDialogVisible.value = false
  goBack()
}

async function doReassign() {
  if (!store.detail || !reassignTargetId.value) return
  await store.reassign(store.detail.id, reassignTargetId.value, reassignReason.value)
  reassignReason.value = ''
  reassignTargetId.value = 0
  reassignDialogVisible.value = false
}

// ===== 上一条/下一条（仅已关闭状态在用） =====
// 数据源：store.list（已包含当前岗位过滤后的所有工单）
// 若 list 未加载（直接访问详情 URL）→ 按钮自然 disabled
const prevId = computed(() => {
  const id = Number(route.params.id)
  const idx = store.list.findIndex(w => w.id === id)
  return idx > 0 ? store.list[idx - 1].id : null
})
const nextId = computed(() => {
  const id = Number(route.params.id)
  const idx = store.list.findIndex(w => w.id === id)
  return idx >= 0 && idx < store.list.length - 1 ? store.list[idx + 1].id : null
})
function goPrev() {
  if (prevId.value) router.push(`/system/order/${prevId.value}`)
}
function goNext() {
  if (nextId.value) router.push(`/system/order/${nextId.value}`)
}
</script>

<style scoped>
/* ===== 根容器：白底卡片，对应 Figma bg-card + rounded-[4px] + p-[12px] ===== */
.detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-card, #fff);
  border-radius: 4px;
  padding: var(--spacing-md, 12px);
}

/* ===== 面包屑 ===== */
.top-bar {
  flex-shrink: 0;
  padding-bottom: var(--spacing-sm, 8px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md, 12px);
}

/* ===== 顶部右侧按钮组（已关闭专用，对齐 Figma） ===== */
.top-bar-actions {
  display: flex;
  gap: var(--spacing-md, 12px);
  flex-shrink: 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
}

.breadcrumb-link {
  background: none;
  border: none;
  padding: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-muted, #5e5e5e);
  cursor: pointer;
  transition: color 0.2s;
}
.breadcrumb-link:hover { color: var(--accent-primary, #3678e3); }

.breadcrumb-sep {
  font-size: var(--font-small, 14px);
  color: var(--text-muted, #5e5e5e);
  user-select: none;
}

.breadcrumb-current {
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-primary, #101010);
}

/* ===== 页面头部 ===== */
.page-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm, 8px) 0;
  margin-bottom: var(--spacing-md, 12px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: var(--accent-primary10, rgba(54, 120, 227, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon-text {
  font-size: 28px;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ===== 优先级显示区 ===== */
.priority-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.escalated-badge {
  font-size: var(--font-xs, 12px);
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--danger-bg, rgba(220,38,38,0.1));
  color: var(--danger, #dc2626);
  white-space: nowrap;
  cursor: help;
}

.priority-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-default, #e9e9e9);
  border-radius: 4px;
  background: var(--bg-card, #fff);
  color: var(--text-muted, #5e5e5e);
  font-size: 14px;
  cursor: pointer;
  transition: color .15s, border-color .15s;
  padding: 0;
  line-height: 1;
}
.priority-edit-btn:hover {
  color: var(--accent-primary, #3678e3);
  border-color: var(--accent-primary, #3678e3);
}

/* ===== 优先级修改弹窗 ===== */
.priority-options-dialog {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 12px 0;
}

.priority-item-dialog {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.priority-radio-dialog {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--border-high, #d9d9d9);
  background: var(--bg-sub-card, #fbfbfb);
  flex-shrink: 0;
  transition: border-color .15s, background .15s;
}

.priority-radio-dialog.checked {
  border-color: var(--accent-primary, #3678e3);
  background: var(--accent-primary, #3678e3);
}

.priority-text-dialog {
  font-size: var(--font-body, 16px);
  color: var(--text-secondary, #2e2e2e);
}

.header-title {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary, #101010);
}

.header-subtitle {
  font-size: var(--font-body, 16px);
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
}

.btn-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  border: 1px solid var(--accent-primary, #3678e3);
  border-radius: 8px;
  background: var(--accent-primary10, rgba(54, 120, 227, 0.1));
  color: var(--accent-primary, #3678e3);
  cursor: pointer;
}
.btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.nav-arrow { font-size: 18px; }

/* ===== 双栏布局（未关闭状态） ===== */
.closed-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.detail-body {
  flex: 1;
  display: flex;
  gap: var(--spacing-md, 12px);
  min-height: 0;
  overflow: hidden;
}

/* 左栏 */
.detail-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
  min-width: 0;
  overflow-y: auto;
}

/* 右栏（流转记录：紧凑型） */
.detail-sidebar {
  width: 320px;
  flex-shrink: 0;
  border: 1px solid var(--border-default, #e9e9e9);
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-md, 12px);
  background: var(--bg-card, #fff);
  overflow-y: auto;
}

/* ===== 卡片通用 ===== */
.readonly-card,
.action-card {
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-default, #e9e9e9);
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-md, 12px);
}

.card-header {
  margin-bottom: var(--spacing-md, 12px);
}

.card-title {
  font-size: var(--font-h4, 16spx);
  font-weight: 500;
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
}

/* ===== 只读区 ===== */
.readonly-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
}

.readonly-empty {
  color: var(--text-muted, #5e5e5e);
  font-size: var(--font-small, 14px);
  text-align: center;
  padding: var(--spacing-lg, 16px) 0;
}

.readonly-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 45px;
}

.readonly-label {
  font-size: var(--font-body, 16px);
  color: var(--text-primary, #101010);
  white-space: nowrap;
  flex-shrink: 0;
}

.readonly-value {
  flex: 1;
  background: var(--bg-sub-card, #fbfbfb);
  border-radius: 8px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.readonly-image {
  padding: 8px;
}

.readonly-thumb {
  max-width: 128px;
  max-height: 134px;
  border-radius: 8px;
  border: 1px solid var(--border-default, #e9e9e9);
  object-fit: cover;
}

.upload-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.upload-file-link {
  font-size: var(--font-body, 16px);
  color: var(--accent-primary);
  text-decoration: none;
}
.upload-file-link:hover {
  text-decoration: underline;
}

.readonly-text {
  font-size: var(--font-body, 16px);
  color: var(--text-muted, #5e5e5e);
}

/* ===== 操作区 ===== */
.action-accept {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  padding: var(--spacing-lg, 16px) 0;
}

.btn-accept {
  padding: 10px 32px;
  font-size: var(--font-h4, 16px);
}

.action-accept-hint {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted, #5e5e5e);
  margin: 0;
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
}

.action-form-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 45px;
}

.required-star {
  font-size: 18px;
  font-weight: 500;
  color: var(--semantic-danger, #dc2626);
}

.action-form-label {
  font-size: var(--font-body, 16px);
  color: var(--text-primary, #101010);
  white-space: nowrap;
}

.action-form-control {
  flex: 1;
  min-width: 0;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md, 12px);
  padding-top: var(--spacing-sm, 8px);
}

.action-empty {
  text-align: center;
  color: var(--text-muted, #5e5e5e);
  font-size: var(--font-small, 14px);
  padding: var(--spacing-lg, 16px) 0;
}

/* ===== 已关闭：信息卡片 ===== */
.info-card, .sla-card {
  background: var(--bg-card, #fff);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-low, #f0f0f0);
  padding: var(--spacing-lg, 16px);
  flex-shrink: 0;  /* 自然高度，不被压缩；间距由 .closed-main 的 gap 控制 */
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary, #101010);
  margin: 0 0 var(--spacing-md, 12px);
  line-height: 1;
}

/* 4px 圆角竖线（设计稿 5685:12002） */
.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  border-radius: var(--radius-sm, 6px);
  background: var(--accent-primary, #3678e3);
  flex-shrink: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.info-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-low, #f0f0f0);
  min-height: 36px;
  padding: var(--spacing-xs, 4px) 0;
}
/* 最后一行（发起时间/关闭时间）去底部分割线 */
.info-row:nth-last-child(-n+2) { border-bottom: none; }

.info-label {
  width: 90px;
  flex-shrink: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary, #2e2e2e);
  font-weight: 500;
}

.info-value {
  font-size: var(--font-small, 14px);
  color: var(--text-primary, #101010);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
}

/* ===== 已关闭：节点区块（已移除：表单数据已聚合到「处理记录」卡） ===== */

/* ===== SLA 指标（对齐设计稿：横向 3 卡 + 4px 竖线小标题） ===== */
.sla-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.sla-normal { background: var(--success, #22c55e); }
.sla-warning { background: var(--warning, #f59e0b); }
.sla-timeout { background: var(--danger, #dc2626); }

/* 3 列横向卡片：设计稿 gap-[8px] */
.sla-metrics {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

/* 单卡：左 icon(36) + 中 body(flex) + 右 tip(可选) */
.sla-metric-card {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-md, 12px);
  padding: var(--spacing-md, 12px);
  background: var(--bg-sub-card, #fbfbfb);
  border-radius: 10px;
  min-height: 64px;
}

.sla-metric-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(54, 120, 227, 0.05);
  color: var(--accent-primary, #3678e3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sla-metric-svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
  display: block;
}

/* 占位 emoji（在设计稿图标替换前临时显示） */
.sla-icon-placeholder {
  font-size: 18px;
  line-height: 1;
  user-select: none;
}

.sla-metric-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;  /* 防止 text 撑爆 flex */
}

.sla-metric-label-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sla-metric-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted, #5e5e5e);
  line-height: 1;
}

/* 数据指标标题右侧说明悬浮窗触发器（设计稿 Attention 图标位） */
.sla-metric-info {
  width: 12px;
  height: 12px;
  color: var(--text-muted, #5e5e5e);
  cursor: help;
  transition: color .15s;
}
.sla-metric-info:hover {
  color: var(--accent-primary, #3678e3);
}

.sla-metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sla-metric-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #101010);
  line-height: 1.2;
  letter-spacing: 0.07px;
}

/* 设计稿超时态：只显示"超时"二字（数字 hidden），颜色用 danger 醒目 */
.sla-metric-value-timeout {
  font-size: 24px;
  font-weight: 600;
  color: var(--danger, #dc2626);
  line-height: 1.2;
}

.sla-metric-unit {
  font-size: 10px;
  color: var(--text-muted, #5e5e5e);
  line-height: 1.2;
}

/* 右侧 tip 已移除：详细信息见悬浮窗（el-popover） */

/* ===== 底部操作栏 ===== */
.page-actions {
  flex-shrink: 0;
  display: flex;
  gap: var(--spacing-md, 12px);
  padding: var(--spacing-lg, 16px) 0;
  background: var(--bg-card, #fff);
  border-top: 1px solid var(--border-low, #f0f0f0);
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
  margin-top: var(--spacing-md, 12px);
}

/* ===== 按钮 ===== */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: var(--accent-primary, #3678e3);
  color: #fff;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.btn-primary:hover { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-default {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  font-size: var(--font-small, 14px);
  border-radius: 6px;
  border: 1px solid var(--border-high, #d9d9d9);
  cursor: pointer;
  background: var(--bg-card, #fff);
  color: var(--text-primary, #101010);
  transition: border-color 0.2s;
}
.btn-default:hover { border-color: var(--accent-primary, #3678e3); color: var(--accent-primary, #3678e3); }

.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  font-size: var(--font-small, 14px);
  border-radius: 6px;
  border: 1px solid var(--danger, #dc2626);
  cursor: pointer;
  background: transparent;
  color: var(--danger, #dc2626);
  transition: opacity 0.2s;
}
.btn-danger:hover { background: var(--danger-bg, rgba(220,38,38,0.1)); }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: var(--semantic-danger, #dc2626);
  color: #fff;
  transition: opacity 0.2s;
  white-space: nowrap;
}
.btn-danger-outline:hover { opacity: 0.85; }

/* ===== 弹窗 ===== */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 8px);
}
.dialog-hint {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
}

/* ===== 响应式：小屏幕折叠右栏 ===== */
@media (max-width: 1280px) {
  .detail-body {
    flex-direction: column;
  }
  .detail-sidebar {
    width: 100%;
    max-height: 300px;
  }
}

/* ===== 已关闭：双栏布局（对齐 Figma 设计稿：左 flex:1 + 右 447px） ===== */
.closed-layout {
  flex: 1;
  display: flex;
  gap: var(--spacing-md, 12px);
  min-height: 0;
  overflow: hidden;
}

.closed-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
  min-width: 0;
  min-height: 0;  /* flex 子项撑满剩余高度必备 */
  overflow: hidden;  /* 父容器不滚；子卡内各自管滚动 */
}

.closed-sidebar {
  width: 447px; /* 对齐 Figma 设计稿：右栏固定 447px */
  flex-shrink: 0;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-low, #f3f3f3);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-md, 12px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 让 FlowRecords 在 closed-sidebar 内铺满 */
.closed-sidebar :deep(.flow-records) {
  flex: 1;
  min-height: 0;
}

/* ===== 第 3 张卡：处理记录（对齐 Figma 5685-11944：完整工单表单 + 父容器固定高度 + 内部滚动） ===== */
.process-records-card {
  background: var(--bg-card, #fff);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--border-low, #f3f3f3);
  padding: var(--spacing-md, 12px);
  flex: 1 1 0;       /* 撑满 .closed-main 剩余高度（父容器高度固定） */
  min-height: 0;     /* flex 子项可压缩至 0，内部才能滚动 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.process-records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  margin-bottom: var(--spacing-md, 12px);
  flex-shrink: 0;
}

.process-records-header .section-title { margin-bottom: 0; }

/* 「导出」蓝字按钮（设计稿：标题右侧 蓝字 14px Medium） */
.btn-link-export {
  background: none;
  border: none;
  padding: 4px 12px 4px 8px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--accent-primary, #3678e3);
  cursor: pointer;
  line-height: 1;
  border-radius: var(--radius-sm, 6px);
  transition: background .15s, opacity .15s;
}
.btn-link-export:hover:not(:disabled) {
  background: var(--accent-primary10, rgba(54, 120, 227, 0.08));
}
.btn-link-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.process-records-empty {
  background: var(--bg-sub-card, #fbfbfb);
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-xl, 32px) var(--spacing-lg, 16px);
  text-align: center;
  color: var(--text-muted, #5e5e5e);
  font-size: var(--font-small, 14px);
}

/* 滚动容器：flex: 1 占据卡片剩余高度；溢出滚动 */
.process-records-list {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 内层表单卡片（设计稿：bg-card #fbfbfb + 圆角 6px + padding 24px + gap 16） */
.form-card {
  background: var(--bg-sub-card, #fbfbfb);
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-xl, 24px);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 16px);
}

/* ===== 表单行：内联（label + value 横排 45px）===== */
.form-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 12px);
  width: 100%;
}
.form-row-inline { min-height: 45px; }

/* ===== 表单行：块级（label + 图片 垂直布局）===== */
.form-row-block {
  align-items: flex-start;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
}

.form-label {
  font-size: var(--font-body, 16px);
  color: var(--text-primary, #101010);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 80px;
}

/* 值展示胶囊：bg-sub-card #fff + 圆角 8px + padding 10/18 */
.form-value-box {
  flex: 1;
  min-width: 0;
  background: var(--bg-card, #fff);
  border-radius: 8px;
  padding: 10px 18px;
  display: flex;
  align-items: center;
  height: 45px;
}
.form-value-text {
  flex: 1;
  min-width: 0;
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-muted, #5e5e5e);
  word-break: break-all;
  line-height: 1.4;
}

/* 图片展示框：128×134 + 圆角 8px + border #dedede */
.form-image-box {
  width: 128px;
  height: 134px;
  border-radius: 8px;
  border: 1px solid var(--border-default, #dedede);
  background: var(--bg-card, #fff);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.form-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.form-image-placeholder {
  font-size: var(--font-xs, 12px);
  color: var(--text-placeholder, #a9b8cc);
}

/* radio 行右侧：flex: 1 + 内部 gap 24 横向居右 */
.form-radio-group {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-xl, 24px);
  min-width: 0;
}

.form-radio-item {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  cursor: default;
  user-select: none;
}

/* 复选框：18×18 + 圆角 4px */
.form-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-default, #dedede);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}
.form-checkbox-checked {
  background: var(--accent-primary, #3678e3);
  border-color: rgba(54, 120, 227, 0.2);
}
.form-checkbox-svg {
  width: 15px;
  height: 15px;
  color: #fff;
  fill: none;
  stroke: currentColor;
  display: block;
}

.form-radio-label {
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-secondary, #2e2e2e);
  white-space: nowrap;
}

/* ===== 已关闭布局响应式（窄屏折叠为单栏） ===== */

/* ===== 已关闭布局响应式（窄屏折叠为单栏） ===== */
@media (max-width: 1280px) {
  .closed-layout {
    flex-direction: column;
  }
  .closed-sidebar {
    width: 100%;
    max-height: 400px;
  }
}
</style>

<!-- ===== 指标分析悬浮窗（el-popover 渲染到 body，scoped 失效，必须非 scoped） ===== -->
<style>
.sla-tip-popover.el-popper {
  padding: 0 !important;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.sla-tip-popover .el-popper__arrow::before {
  border: 1px solid #e9e9e9;
}
.sla-popover-content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}
.sla-popover-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #101010;
  line-height: 1.4;
}
.sla-popover-desc {
  margin: 0;
  font-size: 12px;
  color: #5e5e5e;
  line-height: 1.5;
}
.sla-popover-row {
  margin: 0;
  font-size: 12px;
  color: #5e5e5e;
  line-height: 1.5;
  display: flex;
  gap: 4px;
}
.sla-popover-row strong {
  color: #101010;
  font-weight: 600;
}
.sla-popover-status {
  margin: 4px 0 0;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  line-height: 1.5;
}
.sla-popover-status-ok { color: #16a34a; }
.sla-popover-status-timeout { color: #dc2626; }
</style>
