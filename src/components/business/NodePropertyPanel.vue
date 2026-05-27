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

    <!-- assign / confirm 节点：指派策略 -->
    <div v-if="node.type === 'assign' || node.type === 'confirm'" class="prop-section">
      <p class="prop-section-title">
        指派策略
        <el-tooltip placement="top" effect="dark" raw-content>
          <template #content>
            <div style="max-width:260px;line-height:1.6">
              <p style="margin:0 0 6px;font-weight:500">静态指定</p>
              <p style="margin:0 0 10px;font-size:12px;color:#bbb">模板配置时选定处理人，运行时自动指派。适用于企业内流程，审核人固定。</p>
              <p style="margin:0 0 6px;font-weight:500">动态表单字段</p>
              <p style="margin:0;font-size:12px;color:#bbb">运行时从表单字段取值解析处理人。适用于跨企业流程，接收方自行指派。</p>
            </div>
          </template>
          <span class="prop-help-icon">?</span>
        </el-tooltip>
      </p>
      <el-radio-group :model-value="local.assignSource || 'static'" @update:model-value="onChange('assignSource', $event)" style="margin-bottom:12px">
        <el-radio value="static">静态指定</el-radio>
        <el-radio value="dynamic">动态表单字段</el-radio>
      </el-radio-group>
      <!-- 静态模式 -->
      <template v-if="(local.assignSource || 'static') === 'static'">
        <div class="prop-field">
          <label class="prop-label">指派人员</label>
          <div class="assign-target-tags" @click="personDialogVisible = true">
            <el-tag
              v-for="id in (local.assignConfig?.targetIds || [])"
              :key="id"
              closable
              size="default"
              @close="removeTarget(id)"
            >
              {{ getPersonName(id) }}
            </el-tag>
            <span class="assign-target-add">+ 选择人员</span>
          </div>
        </div>
        <div class="prop-field">
          <label class="prop-label">多人模式</label>
          <el-select :model-value="local.assignConfig?.multipleMode || 'anyone'" @update:model-value="onAssign('multipleMode', $event)" style="width:100%">
            <el-option label="任一人接单" value="anyone" />
            <el-option label="每人处理" value="each" />
          </el-select>
          <p class="prop-hint" v-if="(local.assignConfig?.multipleMode || 'anyone') === 'anyone'">任务进入公共池，群内通知，先接先得</p>
          <p class="prop-hint" v-else>每人生成独立任务，各自处理</p>
        </div>
      </template>
      <!-- 动态模式 -->
      <template v-else>
        <div class="prop-field">
          <label class="prop-label">表单字段</label>
          <el-select :model-value="local.dynamicAssignFieldId || ''" @update:model-value="onChange('dynamicAssignFieldId', $event)" placeholder="请选择表单字段" style="width:100%">
            <el-option v-for="f in formFields" :key="f.id" :label="f.label" :value="f.id" />
          </el-select>
        </div>
        <p class="prop-hint">运行时将从该字段取值，自动指派给对应人员</p>
      </template>
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

  <!-- 人员选择弹窗 -->
  <PersonSelector
    v-if="personDialogVisible && node"
    :selected-ids="local.assignConfig?.targetIds || []"
    @confirm="onPersonConfirm"
    @close="personDialogVisible = false"
  />
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { FlowNode, FormField } from '@/types/workflow'
import PersonSelector from './PersonSelector.vue'

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
const personDialogVisible = ref(false)

// 人员名称查找（与 PersonSelector 数据一致）
const allPersons: Record<number, string> = {
  1: '黎世雨', 2: '李磊', 3: '李熙', 4: '高江云', 5: '李浩敏',
  6: '杨婷彤', 7: '谢东', 8: '陈洪燕', 9: '梁冬', 10: '马达', 11: '杨伟', 12: '高楠',
}
function getPersonName(id: number) { return allPersons[id] || `人员${id}` }
function removeTarget(id: number) {
  if (!local.assignConfig) return
  local.assignConfig.targetIds = local.assignConfig.targetIds.filter(uid => uid !== id)
}
function onPersonConfirm(ids: number[]) {
  if (!local.assignConfig) {
    local.assignConfig = { strategy: 'user', targetIds: [], multipleMode: 'anyone' }
  }
  local.assignConfig.targetIds = ids
}

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
  margin-top: 6px;
}
.prop-section-title {
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--accent-primary);
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: 6px;
}
.prop-help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  cursor: help;
  flex-shrink: 0;
}
.prop-help-icon:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
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
.prop-hint { color: var(--text-muted); font-size: var(--font-xs, 12px); margin-top: 4px; }
.prop-empty { color: var(--text-muted); font-size: var(--font-small, 14px); text-align: center; padding: 24px 0; }
.prop-empty-state { justify-content: center; align-items: center; }
.slider-row { display: flex; align-items: center; gap: 12px; }
.slider-val { font-size: var(--font-small, 14px); color: var(--text-muted); min-width: 40px; text-align: right; }

/* 人员选择触发区 */
.assign-target-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 0;
}
.assign-target-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 10px;
  border: 1px dashed var(--border-high);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  transition: all .15s;
}
.assign-target-add:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
