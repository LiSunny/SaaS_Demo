<template>
  <div class="fd-wrap">
    <!-- ===== 左/中：流程可视化区 ===== -->
    <div class="fd-flow">
      <div class="fd-chain">
        <template v-for="(node, i) in nodes" :key="node.id">
          <!-- ===== External node: transparent container ===== -->
          <template v-if="node.type === 'external' && node.crossEnterpriseConfig">
            <div
              class="fd-external-wrap"
              :class="{ 'fd-external-selected': selectedId === node.id }"
              @mouseenter="hoveredId = node.id"
              @mouseleave="hoveredId = null"
            >
              <!-- Container header: thin bar, not a node card -->
              <div
                class="fd-external-header"
                :class="{ 'fd-external-header-sel': selectedId === node.id }"
                @click="selectNode(node.id)"
              >
                <span class="fd-external-header-icon">{{ iconText(node.type) }}</span>
                <span class="fd-external-header-name">{{ node.name || typeLabel('external') }}</span>
                <span class="fd-external-header-hint">协作方执行区域 · 目标企业由上下文动态确定 · 零配置</span>
                <button
                  v-if="!readonly && hoveredId === node.id"
                  class="fd-node-del fd-cond-del"
                  @click.stop="removeNode(i)"
                  title="删除跨企业协同节点及其所有子节点"
                >×</button>
              </div>

              <!-- Container body: internal sub-flow -->
              <div class="fd-external-body">
                <!-- Internal start marker -->
                <div class="fd-external-sep">
                  <span class="fd-external-sep-text">子流程开始</span>
                </div>

                <!-- Connector: start marker → first child (always shows +) -->
                <div class="fd-connector">
                  <div class="fd-arrow"></div>
                  <button type="button" v-if="!readonly"
                    class="fd-add-btn" @click="openExternalChildDialog(node.id, -1)" title="添加子节点">+</button>
                  <div class="fd-arrow"></div>
                </div>
                <template v-for="(child, ci) in (node.crossEnterpriseConfig?.childNodes || [])" :key="child.id">
                  <!-- Child node card -->
                  <div
                    class="fd-node"
                    :class="{ selected: selectedId === child.id }"
                    @click="selectExternalChild(node.id, child.id)"
                    @mouseenter="hoveredId = child.id"
                    @mouseleave="hoveredId = null"
                  >
                    <button
                      v-if="!readonly && hoveredId === child.id"
                      class="fd-node-del"
                      @click.stop="removeExternalChild(node.id, ci)"
                      title="删除子节点"
                    >×</button>
                    <div class="fd-node-icon" :style="{ background: iconBg(child.type) }">
                      <span class="fd-node-icon-text">{{ iconText(child.type) }}</span>
                    </div>
                    <div class="fd-node-info">
                      <p class="fd-node-name">{{ child.name || typeLabel(child.type) }}</p>
                      <p class="fd-node-desc">{{ nodeSubtitle(child) }}</p>
                    </div>
                  </div>

                  <!-- SLA branches for child condition nodes -->
                  <div v-if="child.type === 'condition' && child.slaConditionConfig?.branches?.length" class="fd-sla-branches">
                    <div
                      v-for="br in child.slaConditionConfig.branches"
                      :key="br.threshold"
                      class="fd-sla-branch"
                      :class="`fd-sla-${br.threshold}`"
                    >
                      <span class="fd-sla-branch-label">{{ br.label }}</span>
                      <span class="fd-sla-branch-arrow">→</span>
                      <span class="fd-sla-branch-target">{{ getNodeNameAnywhere(node.id, br.targetNodeId) }}</span>
                    </div>
                  </div>

                  <!-- Connector after EACH child (including last → always shows +) -->
                  <div class="fd-connector">
                    <div class="fd-arrow"></div>
                    <button type="button" v-if="!readonly"
                      class="fd-add-btn" @click="openExternalChildDialog(node.id, ci)" title="插入子节点">+</button>
                    <div class="fd-arrow"></div>
                  </div>
                </template>

                <!-- Empty state hint -->
                <div v-if="!(node.crossEnterpriseConfig?.childNodes?.length)" class="fd-external-empty">
                  <span class="fd-external-empty-hint">暂无子节点，点击上方 + 添加</span>
                </div>

                <!-- Internal end marker -->
                <div class="fd-external-sep">
                  <span class="fd-external-sep-text">↩ 回流</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ===== Condition node with SLA branches → 容器模式（类比 external） ===== -->
          <template v-else-if="node.type === 'condition' && node.slaConditionConfig?.branches?.length">
            <div
              class="fd-condition-wrap"
              :class="{ 'fd-condition-selected': selectedId === node.id }"
              @mouseenter="hoveredId = node.id"
              @mouseleave="hoveredId = null"
            >
              <!-- 薄顶栏（复用 external header 样式） -->
              <div
                class="fd-condition-header"
                :class="{ 'fd-condition-header-sel': selectedId === node.id }"
                @click="selectNode(node.id)"
              >
                <span class="fd-external-header-icon">{{ iconText(node.type) }}</span>
                <span class="fd-external-header-name">{{ node.name || typeLabel('condition') }}</span>
                <span class="fd-external-header-hint">
                  SLA {{ node.slaConditionConfig.timer === 'ttr' ? 'TTR' : 'TTS' }} 阈值判断 · {{ node.slaConditionConfig.branches.length }} 个出口
                </span>
                <button
                  v-if="!readonly && hoveredId === node.id"
                  class="fd-node-del fd-cond-del"
                  @click.stop="removeNode(i)"
                  title="删除条件节点及其所有分支"
                >×</button>
              </div>

              <!-- 容器内部 -->
              <div class="fd-condition-body">
                <!-- 分叉分隔线 -->
                <div class="fd-external-sep">
                  <span class="fd-external-sep-text">条件分叉</span>
                </div>

                <!-- 分支通道行 -->
                <div class="fd-branch-lanes">
                  <div
                    v-for="br in node.slaConditionConfig.branches"
                    :key="br.threshold"
                    class="fd-branch-lane"
                  >
                    <!-- 通道头部：彩色标签 + 内联编辑 -->
                    <div class="fd-branch-header" :class="`fd-branch-${br.threshold}`">
                      <!-- 标签：点击可编辑 -->
                      <span
                        v-if="editingLabel !== `${node.id}-${br.threshold}`"
                        class="fd-branch-label"
                        @click.stop="startLabelEdit(node, br)"
                      >{{ br.label }}</span>
                      <input
                        v-else
                        class="fd-branch-label-input"
                        v-model="editLabelValue"
                        @blur="commitLabelEdit(node, br.threshold)"
                        @keyup.enter="commitLabelEdit(node, br.threshold)"
                      />
                      <!-- 阈值：点击弹 popover slider -->
                      <el-popover
                        placement="bottom"
                        :width="200"
                        trigger="click"
                        :visible="thresholdPopoverId === `${node.id}-${br.threshold}`"
                      >
                        <template #reference>
                          <span
                            class="fd-branch-threshold"
                            @click.stop="thresholdPopoverId = `${node.id}-${br.threshold}`"
                          >≥ {{ getThresholdText(node, br.threshold) }}%</span>
                        </template>
                        <div class="threshold-popover-body">
                          <p class="prop-section-title" style="margin:0 0 8px">{{ br.label }} 阈值</p>
                          <el-slider
                            :model-value="getThresholdValue(node, br.threshold)"
                            :min="0" :max="100"
                            :disabled="br.threshold !== 'yellow'"
                            @update:model-value="(v: number) => setThreshold(node, br.threshold, v)"
                          />
                          <p style="text-align:center;margin:4px 0 0;font-size:var(--font-xs,12px);color:var(--text-secondary)">
                            {{ getThresholdText(node, br.threshold) }}%{{ br.threshold !== 'yellow' ? '（固定）' : '' }}
                          </p>
                        </div>
                      </el-popover>
                    </div>

                    <!-- 通道内子节点列表 -->
                    <div class="fd-branch-body">
                      <template v-for="(child, ci) in getBranchChildren(node, br.threshold)" :key="child.id">
                        <div class="fd-connector">
                          <div class="fd-arrow"></div>
                          <button
                            v-if="!readonly"
                            type="button"
                            class="fd-add-btn"
                            @click="openBranchDialog(node.id, br.threshold, ci - 1)"
                            title="在上方插入节点"
                          >+</button>
                          <div class="fd-arrow"></div>
                        </div>
                        <div
                          class="fd-node"
                          :class="{ selected: selectedId === child.id }"
                          @click.stop="selectNode(child.id)"
                          @mouseenter="hoveredId = child.id"
                          @mouseleave="hoveredId = null"
                        >
                          <button
                            v-if="!readonly && hoveredId === child.id"
                            class="fd-node-del"
                            @click.stop="removeBranchChild(node.id, br.threshold, ci)"
                            title="删除子节点"
                          >×</button>
                          <div class="fd-node-icon" :style="{ background: iconBg(child.type) }">
                            <span class="fd-node-icon-text">{{ iconText(child.type) }}</span>
                          </div>
                          <div class="fd-node-info">
                            <p class="fd-node-name">{{ child.name || typeLabel(child.type) }}</p>
                            <p class="fd-node-desc">{{ nodeSubtitle(child) }}</p>
                          </div>
                        </div>
                      </template>
                      <!-- 空状态 / 底部 + -->
                      <div v-if="!getBranchChildren(node, br.threshold).length" class="fd-external-empty">
                        <span class="fd-external-empty-hint">点击下方 + 添加节点</span>
                      </div>
                      <div class="fd-connector">
                        <div class="fd-arrow"></div>
                        <button
                          v-if="!readonly"
                          type="button"
                          class="fd-add-btn"
                          @click="openBranchDialog(node.id, br.threshold, getBranchChildren(node, br.threshold).length - 1)"
                          title="添加节点"
                        >+</button>
                        <div class="fd-arrow"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 回流分隔线 -->
                <div class="fd-external-sep">
                  <span class="fd-external-sep-text">↩ 回流</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ===== Regular node (non-external, non-branching-condition) ===== -->
          <template v-else>
            <div
              class="fd-node"
              :class="{ selected: selectedId === node.id }"
              @click="selectNode(node.id)"
              @mouseenter="hoveredId = node.id"
              @mouseleave="hoveredId = null"
            >
              <button
                v-if="!readonly && hoveredId === node.id && node.type !== 'start' && node.type !== 'close'"
                class="fd-node-del"
                @click.stop="removeNode(i)"
                title="删除节点"
              >×</button>
              <div class="fd-node-icon" :style="{ background: iconBg(node.type) }">
                <span class="fd-node-icon-text">{{ iconText(node.type) }}</span>
              </div>
              <div class="fd-node-info">
                <p class="fd-node-name">{{ node.name || typeLabel(node.type) }}</p>
                <p class="fd-node-desc">{{ nodeSubtitle(node) }}</p>
              </div>
            </div>
          </template>

          <!-- Connector between main nodes -->
          <div v-if="i < nodes.length - 1" class="fd-connector">
            <div class="fd-arrow"></div>
            <button type="button" v-if="!readonly" class="fd-add-btn" @click="openDialog(i)" title="插入节点">+</button>
            <div class="fd-arrow"></div>
          </div>
        </template>

        <!-- 流程结束标签 -->
        <div v-if="nodes.length > 0" class="fd-end-tag">流程结束</div>
      </div>
    </div>

    <!-- ===== 右侧：节点属性面板 ===== -->
    <div class="fd-prop">
      <NodePropertyPanel
        :node="selectedNode"
        :form-fields="formFields"
        :template-sla="templateSla"
        :template-cc-position-names="templateSla.ccPositionNames || []"
        :all-node-names="allNodeNames"
        :readonly="readonly"
        @update="onPropUpdate"
      />
    </div>

    <!-- ===== 节点类型选择弹窗 ===== -->
    <el-dialog v-model="dialogVisible" title="选择节点类型" width="520px">
      <div class="fd-dialog-grid">
        <div
          v-for="opt in nodeTypeOptions"
          :key="opt.type"
          class="fd-dialog-card"
          @click="insertNode(opt.type)"
        >
          <div class="fd-dialog-icon" :style="{ background: iconBg(opt.type) }">
            <span class="fd-node-icon-text">{{ iconText(opt.type) }}</span>
          </div>
          <div class="fd-dialog-info">
            <p class="fd-node-name">{{ opt.label }}</p>
            <p class="fd-node-desc">{{ opt.desc }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FlowNode, FormField, FlowEdge, FlowDefinition, SlaConditionBranch, NodeType } from '@/types/workflow'
import NodePropertyPanel from './NodePropertyPanel.vue'

const props = defineProps<{
  modelValue: FlowNode[]
  formFields: FormField[]
  templateSla: { amberThreshold: number; ttrMinutes?: number; ttsMinutes?: number; ccPositionNames?: string[] }
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', nodes: FlowNode[]): void
}>()

// ===== 内部状态 =====
const nodes = ref<FlowNode[]>([...props.modelValue])
const selectedId = ref<string | null>(null)
const hoveredId = ref<string | null>(null)
const dialogVisible = ref(false)
const insertIndex = ref(-1)
/** 当前正在添加子节点的 external 节点 ID（非 null 时 + 按钮将子节点加入该容器） */
const currentExternalNodeId = ref<string | null>(null)
/** 当前正在添加子节点的条件分支信息（非 null 时 + 按钮将子节点加入该分支通道） */
const branchInsertTarget = ref<{ nodeId: string; threshold: string; childIdx: number } | null>(null)
/** 内联编辑：正在编辑的标签 key = `${nodeId}-${threshold}` */
const editingLabel = ref<string | null>(null)
const editLabelValue = ref('')
/** 内联编辑：当前打开的阈值 popover key */
const thresholdPopoverId = ref<string | null>(null)

// 同步外部 modelValue → nodes
watch(() => props.modelValue, (val) => {
  nodes.value = [...val]
}, { deep: true })

// 同步 nodes → modelValue
function sync() {
  emit('update:modelValue', [...nodes.value])
}

// 进入页面默认选中第一个节点
onMounted(() => {
  if (nodes.value.length > 0) {
    selectedId.value = nodes.value[0].id
  }
})

// ===== 选中节点（支持主节点和 external 容器内的子节点） =====
function findNodeById(id: string): FlowNode | null {
  const main = nodes.value.find(n => n.id === id)
  if (main) return main
  for (const n of nodes.value) {
    if (n.type === 'external' && n.crossEnterpriseConfig?.childNodes) {
      const child = n.crossEnterpriseConfig.childNodes.find(c => c.id === id)
      if (child) return child
    }
    if (n.type === 'condition' && n.slaConditionConfig?.branchChildNodes) {
      for (const children of Object.values(n.slaConditionConfig.branchChildNodes)) {
        const child = children.find(c => c.id === id)
        if (child) return child
      }
    }
  }
  return null
}

const selectedNode = computed(() => selectedId.value ? findNodeById(selectedId.value) : null)

const allNodeNames = computed(() => nodes.value.map(n => ({ id: n.id, name: n.name })))

function selectNode(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

// ===== 节点类型选项（容器内不允许再嵌套 external） =====
const nodeTypeOptions = computed(() => {
  const all: { type: NodeType; label: string; desc: string }[] = [
    { type: 'assign', label: '指派', desc: '分配任务给指定人员处理' },
    { type: 'execute', label: '执行', desc: '执行任务并记录执行情况' },
    { type: 'confirm', label: '审批', desc: '需要审核人员审核通过' },
    { type: 'condition', label: '条件判断', desc: '根据条件分支流转' },
  ]
  // 只有主流程才能插入跨企业协同容器（容器内 / 分支通道内不允许）
  if (!currentExternalNodeId.value && !branchInsertTarget.value) {
    all.push({ type: 'external', label: '跨企业协同', desc: '插入跨企业协同容器' })
  }
  return all
})

function typeLabel(type: string) {
  const map: Record<string, string> = { start: '开始', close: '结束', assign: '指派', execute: '执行', confirm: '审批', condition: '条件判断', external: '跨企业协同' }
  return map[type] || type
}

function typeDesc(type: string) {
  const map: Record<string, string> = { start: '流程起点', close: '流程终点', assign: '分配任务给指定人员处理', execute: '执行任务并记录执行情况', confirm: '需要审核人员审核通过', condition: '根据条件分支流转', external: '流入指定企业并返回状态' }
  return map[type] || ''
}

/** 节点副标题：condition 显示条件类型，external 显示协作方执行区域 */
function nodeSubtitle(node: FlowNode): string {
  if (node.type === 'condition' && node.slaConditionConfig?.branches?.length) {
    const timerLabel = node.slaConditionConfig.timer === 'ttr' ? 'TTR' : 'TTS'
    return `SLA ${timerLabel} 阈值判断 · ${node.slaConditionConfig.branches.length} 个出口`
  }
  if (node.type === 'external' && node.crossEnterpriseConfig?.childNodes) {
    return `协作方执行区域 · ${node.crossEnterpriseConfig.childNodes.length} 个子节点`
  }
  return typeDesc(node.type)
}

/** 按节点 ID 全局查找（主节点 + external 容器内子节点） */
function getNodeNameAnywhere(externalNodeId: string, nodeId: string): string {
  if (!nodeId) return '（未指定）'
  // Search in external child nodes first
  const parent = nodes.value.find(n => n.id === externalNodeId)
  if (parent?.crossEnterpriseConfig?.childNodes) {
    const child = parent.crossEnterpriseConfig.childNodes.find(c => c.id === nodeId)
    if (child) return child.name || typeLabel(child.type)
  }
  // Fall back to main nodes
  const found = nodes.value.find(n => n.id === nodeId)
  if (found) return found.name || typeLabel(found.type)
  // Check for special targets
  if (nodeId === 'return') return '回流'
  return '（未指定）'
}

function iconBg(type: string) {
  const map: Record<string, string> = { start: 'var(--success-bg)', close: 'var(--normal-bg)', assign: 'var(--info-bg)', execute: 'var(--success-bg)', confirm: 'var(--warning-bg)', condition: 'var(--notice-bg)', external: 'var(--accent-primary10)' }
  return map[type] || 'var(--normal-bg)'
}

function iconText(type: string) {
  const map: Record<string, string> = { start: '▶', close: '■', assign: '👤', execute: '✓', confirm: '◉', condition: '⑂', external:'↗' }
  return map[type] || '?'
}

// ===== 插入节点 =====
function openDialog(idx: number) {
  insertIndex.value = idx
  dialogVisible.value = true
}

function insertNode(type: string) {
  const newNode: FlowNode = {
    id: `${type}_${Date.now()}`,
    type: type as FlowNode['type'],
    name: typeLabel(type),
  }
  // confirm 节点预填默认操作按钮
  if (type === 'confirm') {
    newNode.actions = [
      { name: '通过', targetNodeId: '' },
      { name: '驳回', targetNodeId: '' },
    ]
  }
  // external 节点初始化空容器，才能渲染为透明容器样式
  if (type === 'external') {
    newNode.crossEnterpriseConfig = { childNodes: [] }
  }
  // condition 节点自动初始化默认 SLA 三分支，插入即自动分叉
  if (type === 'condition') {
    newNode.slaConditionConfig = {
      timer: 'tts',
      branches: [
        { threshold: 'normal', targetNodeId: '', label: '正常' },
        { threshold: 'yellow', targetNodeId: '', label: '黄灯预警' },
        { threshold: 'red', targetNodeId: '', label: '红灯超时' },
      ],
    }
  }

  if (branchInsertTarget.value) {
    // 插入到条件分支通道内
    const { nodeId, threshold, childIdx } = branchInsertTarget.value
    const parent = nodes.value.find(n => n.id === nodeId)
    if (parent?.slaConditionConfig) {
      const bcn = { ...(parent.slaConditionConfig.branchChildNodes || {}) }
      const list = [...(bcn[threshold] || [])]
      if (childIdx < 0) {
        list.unshift(newNode)
      } else {
        list.splice(childIdx + 1, 0, newNode)
      }
      parent.slaConditionConfig = {
        ...parent.slaConditionConfig,
        branchChildNodes: { ...bcn, [threshold]: list },
      }
    }
    branchInsertTarget.value = null
  } else if (currentExternalNodeId.value) {
    // 插入到 external 容器内的子节点区域（不允许嵌套 external）
    const parent = nodes.value.find(n => n.id === currentExternalNodeId.value)
    if (parent?.crossEnterpriseConfig) {
      if (insertIndex.value < 0) {
        // 第一个 + 按钮：插入到子节点列表最前面；空容器时同样生效
        parent.crossEnterpriseConfig.childNodes.unshift(newNode)
      } else {
        parent.crossEnterpriseConfig.childNodes.splice(insertIndex.value + 1, 0, newNode)
      }
    }
    currentExternalNodeId.value = null
  } else {
    // 插入到主流程
    nodes.value.splice(insertIndex.value + 1, 0, newNode)
  }
  dialogVisible.value = false
  selectedId.value = newNode.id
  sync()
}

// ===== 删除节点（开始/结束节点不可删除） =====
function removeNode(idx: number) {
  const node = nodes.value[idx]
  if (!node || node.type === 'start' || node.type === 'close') return
  if (selectedId.value === node.id) selectedId.value = null
  nodes.value.splice(idx, 1)
  sync()
}

// ===== External 容器内子节点操作 =====
function selectExternalChild(_parentId: string, childId: string) {
  selectedId.value = childId
}

function removeExternalChild(parentId: string, childIdx: number) {
  const parent = nodes.value.find(n => n.id === parentId)
  if (!parent?.crossEnterpriseConfig?.childNodes) return
  const child = parent.crossEnterpriseConfig.childNodes[childIdx]
  if (selectedId.value === child.id) selectedId.value = null
  parent.crossEnterpriseConfig.childNodes.splice(childIdx, 1)
  sync()
}

function openExternalChildDialog(parentId: string, childIdx: number) {
  currentExternalNodeId.value = parentId
  insertIndex.value = childIdx
  dialogVisible.value = true
}

// ===== 条件分支通道子节点操作 =====
function openBranchDialog(nodeId: string, threshold: string, childIdx: number) {
  branchInsertTarget.value = { nodeId, threshold, childIdx }
  dialogVisible.value = true
}

function getBranchChildren(node: FlowNode, threshold: string): FlowNode[] {
  return node.slaConditionConfig?.branchChildNodes?.[threshold] || []
}

function removeBranchChild(conditionNodeId: string, threshold: string, childIdx: number) {
  const parent = nodes.value.find(n => n.id === conditionNodeId)
  if (!parent?.slaConditionConfig?.branchChildNodes) return
  const bcn = { ...parent.slaConditionConfig.branchChildNodes }
  const list = [...(bcn[threshold] || [])]
  const child = list[childIdx]
  if (selectedId.value === child?.id) selectedId.value = conditionNodeId
  list.splice(childIdx, 1)
  parent.slaConditionConfig = {
    ...parent.slaConditionConfig,
    branchChildNodes: { ...bcn, [threshold]: list },
  }
  sync()
}

// ===== 内联编辑（分支标签 + 阈值） =====
function startLabelEdit(node: FlowNode, br: SlaConditionBranch) {
  editLabelValue.value = br.label
  editingLabel.value = `${node.id}-${br.threshold}`
}

function commitLabelEdit(node: FlowNode, threshold: string) {
  if (editingLabel.value !== `${node.id}-${threshold}`) return
  if (!node.slaConditionConfig) return
  const mainIdx = nodes.value.findIndex(n => n.id === node.id)
  if (mainIdx < 0) return
  const updated = { ...nodes.value[mainIdx] }
  if (!updated.slaConditionConfig) return
  updated.slaConditionConfig = {
    ...updated.slaConditionConfig,
    branches: updated.slaConditionConfig.branches.map(
      b => b.threshold === threshold ? { ...b, label: editLabelValue.value } : b
    ),
  }
  nodes.value[mainIdx] = updated
  editingLabel.value = null
  sync()
}

function getThresholdText(node: FlowNode, threshold: string): number {
  if (threshold === 'normal') return 0
  if (threshold === 'yellow') return node.slaLimits?.amberThreshold ?? props.templateSla.amberThreshold
  return 100 // red
}

function getThresholdValue(node: FlowNode, threshold: string): number {
  return getThresholdText(node, threshold)
}

function setThreshold(node: FlowNode, threshold: string, val: number) {
  if (threshold !== 'yellow') return
  const mainIdx = nodes.value.findIndex(n => n.id === node.id)
  if (mainIdx < 0) return
  nodes.value[mainIdx] = {
    ...nodes.value[mainIdx],
    slaLimits: { ...(nodes.value[mainIdx].slaLimits || {}), amberThreshold: val },
  }
  sync()
}

// ===== 构建 FlowDefinition（含分支子节点展平） =====
function buildFlowDef(): FlowDefinition {
  const flatNodes: FlowNode[] = []
  const edges: FlowEdge[] = []

  for (let i = 0; i < nodes.value.length; i++) {
    const node = nodes.value[i]
    flatNodes.push(node)

    // 条件节点：展平分支子节点 + 生成分支边
    if (node.type === 'condition' && node.slaConditionConfig?.branchChildNodes) {
      const bcn = node.slaConditionConfig.branchChildNodes
      for (const [th, children] of Object.entries(bcn)) {
        if (!children.length) continue
        // condition → 分支第一个节点
        edges.push({ from: node.id, to: children[0].id, condition: `sla.${th}` })
        // 分支内部顺序连接
        for (let j = 0; j < children.length - 1; j++) {
          edges.push({ from: children[j].id, to: children[j + 1].id })
        }
        // 展平到节点列表
        flatNodes.push(...children)
      }
    }
  }

  return { nodes: flatNodes, edges }
}

defineExpose({ buildFlowDef })

// ===== 属性更新 =====
function onPropUpdate(updated: FlowNode) {
  // Try main nodes
  const mainIdx = nodes.value.findIndex(n => n.id === updated.id)
  if (mainIdx > -1) {
    nodes.value[mainIdx] = updated
    sync()
    return
  }
  // Try external child nodes
  for (const n of nodes.value) {
    if (n.type === 'external' && n.crossEnterpriseConfig?.childNodes) {
      const childIdx = n.crossEnterpriseConfig.childNodes.findIndex(c => c.id === updated.id)
      if (childIdx > -1) {
        n.crossEnterpriseConfig.childNodes[childIdx] = updated
        sync()
        return
      }
    }
  }
  // Try condition branch child nodes
  for (const n of nodes.value) {
    if (n.type === 'condition' && n.slaConditionConfig?.branchChildNodes) {
      for (const [th, children] of Object.entries(n.slaConditionConfig.branchChildNodes)) {
        const childIdx = children.findIndex(c => c.id === updated.id)
        if (childIdx > -1) {
          n.slaConditionConfig.branchChildNodes[th][childIdx] = updated
          sync()
          return
        }
      }
    }
  }
}
</script>

<style scoped>
.fd-wrap {
  display: flex;
  gap: var(--spacing-xl, 16px);
  height: 100%;
}

/* ===== 流程可视化区 ===== */
.fd-flow {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl, 16px);
  overflow: auto;
}

.fd-chain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 320px;
  max-width: 600px;
  width: 100%;
}

/* 节点卡片 */
.fd-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  padding: var(--spacing-lg, 12px);
  background: var(--bg-card);
  border: 1px solid var(--border-low);
  border-radius: var(--radius-md, 8px);
  width: 100%;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.fd-node:hover {
  border-color: var(--border-high);
}
.fd-node.selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary10);
}

.fd-node-del {
  position: absolute;
  top: calc(-1 * var(--spacing-md, 8px));
  right: calc(-1 * var(--spacing-md, 8px));
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--danger);
  background: var(--bg-card);
  color: var(--danger);
  cursor: pointer;
  font-size: var(--font-small, 14px);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fd-node-del:hover {
  background: var(--danger);
  color: var(--bg-card);
}

.fd-node-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fd-node-icon-text {
  font-size: var(--font-h1, 24px);
  line-height: 1;
}

.fd-node-info {
  flex: 1;
  min-width: 0;
}

.fd-node-name {
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-primary);
}

.fd-node-desc {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  margin-top: var(--spacing-xs, 4px);
}

/* ===== External 透明容器（边框/选中样式与普通节点一致） ===== */
.fd-external-wrap {
  border: 1px solid var(--border-low);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card);
  width: 100%;
  transition: border-color .15s, box-shadow .15s;
}
.fd-external-wrap:hover { border-color: var(--border-high); }
.fd-external-wrap.fd-external-selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary10);
}

/* Thin header bar (~36px), not a node card */
.fd-external-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-sm, 6px) var(--spacing-lg, 12px);
  background: var(--bg-sub-card);
  border-bottom: 1px solid var(--border-low);
  cursor: pointer;
  user-select: none;
  transition: background .15s;
}
.fd-external-header:hover { background: var(--border-low); }
.fd-external-header-sel { background: var(--accent-primary5, rgba(64, 128, 255, 0.04)) !important; }

.fd-external-header-icon {
  font-size: var(--font-body, 16px);
  line-height: 1;
  flex-shrink: 0;
}
.fd-external-header-name {
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}
.fd-external-header-hint {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Container body */
.fd-external-body {
  padding: 0 var(--spacing-lg, 12px) var(--spacing-sm, 6px);
}

/* Internal flow separators (子流程开始 / ↩ 回流) */
.fd-external-sep {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md, 8px) 0;
}
.fd-external-sep::before,
.fd-external-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default);
}
.fd-external-sep-text {
  padding: 0 var(--spacing-lg, 12px);
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
  white-space: nowrap;
}

.fd-external-empty {
  display: flex;
  justify-content: center;
  padding: var(--spacing-lg, 12px);
}
.fd-external-empty-hint {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted);
}

/* 连接器区域 */
.fd-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xs, 4px) 0;
}

.fd-arrow {
  width: 2px;
  height: var(--spacing-xxl, 24px);
  background: var(--border-default);
  position: relative;
}

.fd-arrow::after {
  content: '';
  position: absolute;
  bottom: calc(-1 * var(--spacing-xs, 4px));
  left: calc(-1 * var(--spacing-xs, 4px));
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: var(--spacing-sm, 6px) solid var(--border-default);
}

.fd-add-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px dashed var(--border-high);
  background: var(--bg-sub-card);
  color: var(--text-muted);
  font-size: var(--font-h3, 18px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}
.fd-add-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-primary10);
}

/* 流程结束标签 */
.fd-end-tag {
  background: var(--bg-main);
  color: var(--text-primary);
  font-size: var(--font-body, 16px);
  padding: var(--spacing-sm, 6px) var(--spacing-xl, 16px);
  border-radius: var(--radius-xl, 14px);
  text-align: center;
  margin-top: var(--spacing-md, 8px);
}

/* ===== 右侧属性面板 ===== */
.fd-prop {
  width: 548px;
  flex-shrink: 0;
}

/* ===== 弹窗 ===== */
.fd-dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg, 12px);
}

/* ===== SLA 条件分支指示器 ===== */
.fd-sla-branches {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs, 4px);
  padding: 0 0 var(--spacing-sm, 6px) 68px;
}

.fd-sla-branch {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
  padding: var(--spacing-xs, 4px) var(--spacing-md, 8px);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-xs, 12px);
  line-height: 1.4;
}

.fd-sla-normal {
  background: var(--success-bg);
  color: var(--success);
}

.fd-sla-yellow {
  background: var(--warning-bg);
  color: var(--warning);
}

.fd-sla-red {
  background: var(--danger-bg);
  color: var(--danger);
}

.fd-sla-branch-label {
  font-weight: 500;
  min-width: 60px;
}

.fd-sla-branch-arrow {
  opacity: 0.6;
}

.fd-sla-branch-target {
  font-weight: 400;
  opacity: 0.85;
}

.fd-dialog-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 12px);
  padding: var(--spacing-lg, 12px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: border-color .15s;
  background: var(--bg-sub-card);
}
.fd-dialog-card:hover {
  border-color: var(--accent-primary);
}

.fd-dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fd-dialog-info {
  flex: 1;
  min-width: 0;
}

/* Dark 模式：el-dialog 节点选择弹窗 */
:deep(.el-dialog) { background: var(--bg-card); }
:deep(.el-dialog__header) { background: var(--bg-card); }
:deep(.el-dialog__title) { color: var(--text-primary); }
:deep(.el-dialog__body) { background: var(--bg-card); }
:deep(.el-select-dropdown) { background: var(--bg-card); }
:deep(.el-select-dropdown__item) { color: var(--text-primary); }
:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) { background: var(--accent-primary10); }
:deep(.el-tooltip__content) { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-default); }

/* ===== 条件判断容器（复用 external 容器模式） ===== */
.fd-condition-wrap {
  border: 1px solid var(--border-low);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-card);
  width: 100%;
  transition: border-color .15s, box-shadow .15s;
}
.fd-condition-wrap:hover { border-color: var(--border-high); }
.fd-condition-selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary10);
}

.fd-condition-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 8px);
  padding: var(--spacing-sm, 6px) var(--spacing-lg, 12px);
  background: var(--bg-sub-card);
  border-bottom: 1px solid var(--border-low);
  cursor: pointer;
  user-select: none;
  transition: background .15s;
}
.fd-cond-del {
  position: absolute;
  top: -8px;
  right: -8px;
}
.fd-condition-header:hover { background: var(--border-low); }
.fd-condition-header-sel { background: var(--accent-primary5, rgba(64, 128, 255, 0.04)) !important; }

.fd-condition-body {
  padding: 0 var(--spacing-lg, 12px) var(--spacing-sm, 6px);
}

/* 分支通道行：水平多列布局 */
.fd-branch-lanes {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-sm, 6px);
  padding: var(--spacing-sm, 6px) 0;
}

.fd-branch-lane {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

/* 通道头部：彩色标签 + 阈值 */
.fd-branch-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  border-radius: var(--radius-sm, 6px);
  margin-bottom: var(--spacing-xs, 4px);
  font-size: var(--font-xs, 12px);
  gap: 2px;
}
.fd-branch-normal  { background: var(--success-bg); color: var(--success); }
.fd-branch-yellow  { background: var(--warning-bg); color: var(--warning); }
.fd-branch-red     { background: var(--danger-bg);  color: var(--danger); }

.fd-branch-label {
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.fd-branch-label:hover { text-decoration: underline; }

.fd-branch-threshold {
  cursor: pointer;
  opacity: 0.8;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.fd-branch-threshold:hover { opacity: 1; }

.fd-branch-label-input {
  width: 70px;
  padding: 1px 4px;
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  font-size: var(--font-xs, 12px);
  background: var(--bg-card);
  color: inherit;
  outline: none;
}

/* 通道内部 */
.fd-branch-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 阈值 popover 内部 */
.threshold-popover-body {
  padding: var(--spacing-xs, 4px) 0;
}
</style>
