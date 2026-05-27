<template>
  <div class="prop-panel" v-if="node">
    <h3 class="prop-title">节点属性</h3>

    <!-- 节点配置 -->
    <div class="prop-section">
      <p class="prop-section-title">节点配置</p>
      <div class="prop-field">
        <label class="prop-label"><span class="required">*</span>节点名称</label>
        <input
          class="prop-input"
          :value="local.name"
          @input="onChange('name', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- assign 节点：指派策略 -->
    <div v-if="node.type === 'assign'" class="prop-section">
      <p class="prop-section-title">指派策略</p>
      <div class="prop-field">
        <label class="prop-label">策略</label>
        <el-select :model-value="local.assignConfig?.strategy || 'user'" @update:model-value="onAssign('strategy', $event)" style="width:100%">
          <el-option label="指定人员" value="user" />
          <el-option label="指定职位" value="position" />
          <el-option label="指定角色" value="role" />
          <el-option label="指定部门" value="dept" />
          <el-option label="外部人员" value="external" />
        </el-select>
      </div>
      <div class="prop-field">
        <label class="prop-label">目标</label>
        <el-select :model-value="local.assignConfig?.targetIds || []" @update:model-value="onAssign('targetIds', $event)" multiple filterable placeholder="请选择" style="width:100%">
          <el-option v-for="u in mockUsers" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </div>
      <div class="prop-field">
        <label class="prop-label">多人模式</label>
        <el-select :model-value="local.assignConfig?.multipleMode || 'anyone'" @update:model-value="onAssign('multipleMode', $event)" style="width:100%">
          <el-option label="任一人接单" value="anyone" />
          <el-option label="每人处理" value="each" />
        </el-select>
      </div>
    </div>

    <!-- confirm 节点：操作按钮 -->
    <div v-if="node.type === 'confirm'" class="prop-section">
      <p class="prop-section-title">操作按钮</p>
      <div v-for="(act, i) in (local.actions || [])" :key="i" class="prop-action-row">
        <input class="prop-input" style="flex:1" :value="act.name" @input="onAction(i, 'name', ($event.target as HTMLInputElement).value)" placeholder="按钮名称" />
        <el-select :model-value="act.targetNodeId" @update:model-value="onAction(i, 'targetNodeId', $event)" placeholder="目标节点" style="flex:1">
          <el-option v-for="n in allNodeNames" :key="n.id" :label="n.name" :value="n.id" />
        </el-select>
        <button class="act-btn act-delete" @click="removeAction(i)" title="删除">
          <span class="act-icon">×</span>
        </button>
      </div>
      <button class="btn-link" @click="addAction">+ 添加操作按钮</button>
    </div>

    <!-- condition 节点：条件表达式 -->
    <div v-if="node.type === 'condition'" class="prop-section">
      <p class="prop-section-title">条件表达式</p>
      <div class="prop-field">
        <el-input
          :model-value="local.conditionExpression || ''"
          @update:model-value="onChange('conditionExpression', $event)"
          type="textarea"
          :rows="3"
          placeholder="例: $form.status === 'approved'"
        />
      </div>
    </div>

    <!-- 表单字段权限（start/close 除外） -->
    <div v-if="node.type !== 'start' && node.type !== 'close'" class="prop-section">
      <p class="prop-section-title">表单字段权限</p>
      <div v-if="formFields.length === 0" class="prop-empty">暂无表单字段，请先在步骤2中设计表单</div>
      <div v-for="f in formFields" :key="f.id" class="prop-perm-row">
        <span class="prop-perm-label">{{ f.label }}</span>
        <label class="prop-check"><input type="checkbox" :checked="hasPerm(f.id, 'edit')" @change="togglePerm(f.id, 'edit')" /> 编辑</label>
        <label class="prop-check"><input type="checkbox" :checked="hasPerm(f.id, 'view')" @change="togglePerm(f.id, 'view')" /> 查看</label>
      </div>
    </div>

    <!-- SLA 覆盖（start/close 除外） -->
    <div v-if="node.type !== 'start' && node.type !== 'close'" class="prop-section">
      <p class="prop-section-title">SLA 覆盖</p>
      <label class="prop-check" style="margin-bottom:8px">
        <input type="checkbox" :checked="!useTemplateSla" @change="useTemplateSla = !useTemplateSla" /> 使用模板默认值
      </label>
      <template v-if="!useTemplateSla">
        <div class="prop-field">
          <label class="prop-label">TTR（分钟）</label>
          <el-input-number :model-value="local.slaLimits?.ttrMinutes" @update:model-value="onSla('ttrMinutes', $event)" :min="1" :max="10080" style="width:100%" />
        </div>
        <div class="prop-field">
          <label class="prop-label">TTS（分钟）</label>
          <el-input-number :model-value="local.slaLimits?.ttsMinutes" @update:model-value="onSla('ttsMinutes', $event)" :min="1" :max="10080" style="width:100%" />
        </div>
        <div class="prop-field">
          <label class="prop-label">黄灯阈值</label>
          <div class="slider-row">
            <el-slider :model-value="local.slaLimits?.amberThreshold ?? templateSla.amberThreshold" @update:model-value="onSla('amberThreshold', $event)" :min="0" :max="100" style="flex:1" />
            <span class="slider-val">{{ local.slaLimits?.amberThreshold ?? templateSla.amberThreshold }}%</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 消息通知（start/close 除外） -->
    <div v-if="node.type !== 'close'" class="prop-section">
      <p class="prop-section-title">消息通知</p>
      <label class="prop-check">
        <input type="checkbox" :checked="notifyNext" @change="notifyNext = !notifyNext" /> 节点完成通知下一节点
      </label>
    </div>

    <!-- 保存按钮 -->
    <button class="btn-primary" style="width:100%;margin-top:12px" @click="emitUpdate">保存</button>
  </div>

  <!-- 未选中节点 -->
  <div v-else class="prop-panel prop-empty-state">
    <p class="prop-empty">点击左侧节点卡片进行配置</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { FlowNode, FormField } from '@/types/workflow'

const props = defineProps<{
  node: FlowNode | null
  formFields: FormField[]
  templateSla: { amberThreshold: number; ttrMinutes?: number; ttsMinutes?: number }
  allNodeNames: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  (e: 'update', node: FlowNode): void
}>()

const local = reactive<FlowNode>({ id: '', type: 'start', name: '' })
const useTemplateSla = ref(true)
const notifyNext = ref(true)

const mockUsers = [
  { id: 1, name: '杨婷彤' }, { id: 2, name: '谢东' }, { id: 3, name: '陈洪燕' },
  { id: 4, name: '梁冬' }, { id: 5, name: '马达' }, { id: 6, name: '杨伟' }, { id: 7, name: '高楠' },
]

watch(() => props.node, (n) => {
  if (n) {
    Object.assign(local, JSON.parse(JSON.stringify(n)))
    useTemplateSla.value = !n.slaLimits
    notifyNext.value = true // 默认开启
  }
}, { immediate: true })

function onChange(key: string, val: any) { (local as any)[key] = val }
function onAssign(key: string, val: any) {
  local.assignConfig = local.assignConfig || { strategy: 'user', targetIds: [], multipleMode: 'anyone' }
  ;(local.assignConfig as any)[key] = val
}
function onAction(i: number, key: string, val: any) {
  if (!local.actions) local.actions = []
  ;(local.actions[i] as any)[key] = val
}
function addAction() {
  local.actions = [...(local.actions || []), { name: '', targetNodeId: '' }]
}
function removeAction(i: number) {
  local.actions = (local.actions || []).filter((_, idx) => idx !== i)
}
function onSla(key: string, val: any) {
  local.slaLimits = local.slaLimits || {}
  ;(local.slaLimits as any)[key] = val
}

function hasPerm(_fieldId: string, _type: 'edit' | 'view'): boolean {
  // 简化：用 formFields 数据判断，默认全部有编辑权限
  return true
}
function togglePerm(_fieldId: string, _type: 'edit' | 'view') { /* 占位 */ }

function emitUpdate() {
  const result: FlowNode = JSON.parse(JSON.stringify(local))
  if (useTemplateSla.value) delete result.slaLimits
  emit('update', result)
}
</script>

<style scoped>
.prop-panel {
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 18px;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.prop-title {
  font-size: var(--font-h3, 18px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.prop-section {
  margin-bottom: 18px;
}
.prop-section-title {
  font-size: var(--font-body, 16px);
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.prop-field {
  margin-bottom: 8px;
}
.prop-label {
  font-size: var(--font-body, 16px);
  color: var(--text-primary);
  margin-bottom: 4px;
  display: block;
}
.required { color: var(--danger); }
.prop-input {
  width: 100%;
  height: 37px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  padding: 0 12px;
  font-size: var(--font-body, 16px);
  background: var(--bg-card);
  color: var(--text-primary);
}
.prop-input::placeholder { color: var(--text-placeholder); }
.prop-action-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.prop-perm-row {
  display: flex; align-items: center; gap: 16px;
  padding: 6px 0; border-bottom: 1px solid var(--border-low);
  justify-content: space-between;
}
.prop-perm-label { flex: 1; font-size: var(--font-body, 16px); color: var(--text-primary); }
.prop-check {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--font-body, 16px); color: var(--text-secondary); cursor: pointer;
}
.prop-empty { color: var(--text-muted); font-size: var(--font-small, 14px); text-align: center; padding: 24px 0; }
.prop-empty-state { justify-content: center; align-items: center; }
.slider-row { display: flex; align-items: center; gap: 12px; }
.slider-val { font-size: var(--font-small, 14px); color: var(--text-muted); min-width: 40px; text-align: right; }
</style>
