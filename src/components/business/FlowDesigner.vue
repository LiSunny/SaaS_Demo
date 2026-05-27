<template>
  <div class="fd-wrap">
    <!-- ===== 左/中：流程可视化区 ===== -->
    <div class="fd-flow">
      <div class="fd-chain">
        <template v-for="(node, i) in nodes" :key="node.id">
          <!-- 节点卡片 -->
          <div
            class="fd-node"
            :class="{ selected: selectedId === node.id }"
            @click="selectNode(node.id)"
            @mouseenter="hoveredId = node.id"
            @mouseleave="hoveredId = null"
          >
            <!-- 删除按钮 -->
            <button
              v-if="hoveredId === node.id && nodes.length > 2"
              class="fd-node-del"
              @click.stop="removeNode(i)"
              title="删除节点"
            >×</button>

            <div class="fd-node-icon" :style="{ background: iconBg(node.type) }">
              <span class="fd-node-icon-text">{{ iconText(node.type) }}</span>
            </div>
            <div class="fd-node-info">
              <p class="fd-node-name">{{ node.name || typeLabel(node.type) }}</p>
              <p class="fd-node-desc">{{ typeDesc(node.type) }}</p>
            </div>
          </div>

          <!-- 节点间：箭头 + + 按钮（最后一项后面不显示） -->
          <div v-if="i < nodes.length - 1" class="fd-connector">
            <div class="fd-arrow"></div>
            <button class="fd-add-btn" @click="openDialog(i)" title="插入节点">+</button>
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
        :all-node-names="allNodeNames"
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
import { ref, computed, watch } from 'vue'
import type { FlowNode, FormField } from '@/types/workflow'
import NodePropertyPanel from './NodePropertyPanel.vue'

const props = defineProps<{
  modelValue: FlowNode[]
  formFields: FormField[]
  templateSla: { amberThreshold: number; ttrMinutes?: number; ttsMinutes?: number }
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

// 同步外部 modelValue → nodes
watch(() => props.modelValue, (val) => {
  nodes.value = [...val]
}, { deep: true })

// 同步 nodes → modelValue
function sync() {
  emit('update:modelValue', [...nodes.value])
}

// ===== 选中节点 =====
const selectedNode = computed(() => nodes.value.find(n => n.id === selectedId.value) || null)

const allNodeNames = computed(() => nodes.value.map(n => ({ id: n.id, name: n.name })))

function selectNode(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

// ===== 节点类型选项 =====
const nodeTypeOptions = [
  { type: 'assign', label: '指派', desc: '分配任务给指定人员处理' },
  { type: 'execute', label: '执行', desc: '执行任务并记录执行情况' },
  { type: 'confirm', label: '审批', desc: '需要审核人员审核通过' },
  { type: 'condition', label: '条件判断', desc: '根据条件分支流转' },
  { type: 'external', label: '跨企业协同', desc: '流入指定企业并返回状态' },
] as const

function typeLabel(type: string) {
  const map: Record<string, string> = { start: '开始', close: '结束', assign: '指派', execute: '执行', confirm: '审批', condition: '条件判断', external: '跨企业协同' }
  return map[type] || type
}

function typeDesc(type: string) {
  const map: Record<string, string> = { start: '流程起点', close: '流程终点', assign: '分配任务给指定人员处理', execute: '执行任务并记录执行情况', confirm: '需要审核人员审核通过', condition: '根据条件分支流转', external: '流入指定企业并返回状态' }
  return map[type] || ''
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
  nodes.value.splice(insertIndex.value + 1, 0, newNode)
  dialogVisible.value = false
  selectedId.value = newNode.id
  sync()
}

// ===== 删除节点 =====
function removeNode(idx: number) {
  if (nodes.value.length <= 2) return
  if (selectedId.value === nodes.value[idx].id) selectedId.value = null
  nodes.value.splice(idx, 1)
  sync()
}

// ===== 属性更新 =====
function onPropUpdate(updated: FlowNode) {
  const idx = nodes.value.findIndex(n => n.id === updated.id)
  if (idx > -1) {
    nodes.value[idx] = updated
    sync()
  }
}
</script>

<style scoped>
.fd-wrap {
  display: flex;
  gap: 16px;
  height: 100%;
}

/* ===== 流程可视化区 ===== */
.fd-flow {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 18px;
  overflow: auto;
}

.fd-chain {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 320px;
  max-width: 440px;
  width: 100%;
}

/* 节点卡片 */
.fd-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
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
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--danger);
  background: var(--bg-card);
  color: var(--danger);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fd-node-del:hover {
  background: var(--danger);
  color: #fff;
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
  font-size: 22px;
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
  margin-top: 4px;
}

/* 连接器区域 */
.fd-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
  gap: 2px;
}

.fd-arrow {
  width: 2px;
  height: 24px;
  background: var(--border-default);
  position: relative;
}

.fd-arrow::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: -4px;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--border-default);
}

.fd-add-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px dashed var(--border-high);
  background: var(--bg-sub-card);
  color: var(--text-muted);
  font-size: 18px;
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
  padding: 6px 16px;
  border-radius: 18px;
  text-align: center;
  margin-top: 8px;
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
  gap: 12px;
}

.fd-dialog-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
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
</style>
