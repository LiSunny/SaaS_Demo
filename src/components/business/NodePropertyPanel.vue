<template>
  <div class="prop-panel" v-if="node">
    <h3 class="prop-title">节点属性</h3>

    <el-tabs v-model="activeTab" class="prop-tabs">
      <!-- ===== Tab1: 节点设置 ===== -->
      <el-tab-pane label="节点设置" name="settings">
        <div class="prop-section">
          <p class="prop-section-title">节点名称</p>
          <div class="prop-field">
            <label class="prop-label"><span class="required">*</span>节点名称</label>
            <input class="prop-input" :value="local.name" :disabled="readonly"
              @input="onChange('name', ($event.target as HTMLInputElement).value)" />
          </div>
        </div>

        <!-- 指派策略 -->
        <div v-if="node.type === 'assign' || node.type === 'confirm'" class="prop-section">
          <p class="prop-section-title">指派策略
            <el-tooltip placement="top" effect="dark" raw-content>
              <template #content>
                <div style="max-width:260px;line-height:1.6">
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">静态指定</p>
                  <p style="margin:0 0 var(--spacing-lg, 12px);font-size:var(--font-xs, 12px);color:var(--text-muted)">模板配置时选定处理人，运行时自动指派。</p>
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">动态表单字段</p>
                  <p style="margin:0;font-size:var(--font-xs, 12px);color:var(--text-muted)">运行时从表单字段取值解析处理人。</p>
                </div>
              </template>
              <span class="prop-help-icon">?</span>
            </el-tooltip>
          </p>
          <el-radio-group :model-value="local.assignSource || 'static'" :disabled="readonly"
            @update:model-value="onChange('assignSource', $event)" style="margin-bottom:var(--spacing-lg, 12px)">
            <el-radio value="static">静态指定</el-radio>
            <el-radio value="dynamic">动态表单字段</el-radio>
          </el-radio-group>
          <template v-if="(local.assignSource || 'static') === 'static'">
            <div class="prop-field">
              <label class="prop-label">指派人员</label>
              <div class="tags-add-area" @click="!readonly && (personDialogVisible = true)">
                <el-tag v-for="id in (local.assignConfig?.targetIds || [])" :key="id"
                  :closable="!readonly" size="default" @close="removeTarget(id)">{{ getPersonName(id) }}</el-tag>
                <span v-if="!readonly" class="tags-add-btn">+ 选择人员</span>
              </div>
            </div>
            <div class="prop-field">
              <label class="prop-label">多人模式</label>
              <el-select :model-value="local.assignConfig?.multipleMode || 'anyone'" :disabled="readonly"
                @update:model-value="onAssign('multipleMode', $event)" style="width:100%">
                <el-option label="任一人接单" value="anyone" />
                <el-option label="每人处理" value="each" />
              </el-select>
            </div>
          </template>
          <template v-else>
            <div class="prop-field">
              <label class="prop-label">表单字段</label>
              <el-select :model-value="local.dynamicAssignFieldId || ''" :disabled="readonly"
                @update:model-value="onChange('dynamicAssignFieldId', $event)" placeholder="请选择表单字段" style="width:100%">
                <el-option v-for="f in formFields" :key="f.id" :label="f.label" :value="f.id" />
              </el-select>
            </div>
          </template>
        </div>

        <!-- confirm 节点：操作按钮 -->
        <div v-if="node.type === 'confirm'" class="prop-section">
          <p class="prop-section-title">操作按钮</p>
          <div v-for="(act, i) in (local.actions || [])" :key="i" class="prop-action-row">
            <input class="prop-input" style="flex:1" :value="act.name" :disabled="readonly"
              @input="onAction(i, 'name', ($event.target as HTMLInputElement).value)" placeholder="按钮名称" />
            <el-select :model-value="act.targetNodeId" :disabled="readonly"
              @update:model-value="onAction(i, 'targetNodeId', $event)" placeholder="目标节点" style="flex:1">
              <el-option v-for="n in allNodeNames" :key="n.id" :label="n.name" :value="n.id" />
            </el-select>
            <button v-if="!readonly" class="act-btn act-delete" @click="removeAction(i)" title="删除">
              <span class="act-icon">×</span>
            </button>
          </div>
          <button v-if="!readonly" class="btn-link" @click="addAction">+ 添加操作按钮</button>
        </div>

        <!-- condition 节点 -->
        <div v-if="node.type === 'condition'" class="prop-section">
          <p class="prop-section-title">条件表达式</p>
          <div class="prop-field">
            <el-input :model-value="local.conditionExpression || ''" :disabled="readonly"
              @update:model-value="onChange('conditionExpression', $event)"
              type="textarea" :rows="3" placeholder="例: $form.status === 'approved'" />
          </div>
        </div>

        <!-- SLA 覆盖 -->
        <div v-if="node.type !== 'close'" class="prop-section">
          <p class="prop-section-title">SLA 覆盖</p>
          <label class="prop-check" style="margin-bottom:8px">
            <input type="checkbox" :disabled="readonly" :checked="!useTemplateSla" @change="useTemplateSla = !useTemplateSla" /> 使用模板默认值
          </label>
          <template v-if="!useTemplateSla">
            <div class="prop-field">
              <label class="prop-label">TTR（分钟）</label>
              <el-input-number :model-value="local.slaLimits?.ttrMinutes" :disabled="readonly"
                @update:model-value="onSla('ttrMinutes', $event)" :min="1" :max="10080" style="width:100%" />
            </div>
            <div class="prop-field">
              <label class="prop-label">TTS（分钟）</label>
              <el-input-number :model-value="local.slaLimits?.ttsMinutes" :disabled="readonly"
                @update:model-value="onSla('ttsMinutes', $event)" :min="1" :max="10080" style="width:100%" />
            </div>
            <div class="prop-field">
              <label class="prop-label">黄灯阈值</label>
              <div class="slider-row">
                <el-slider :model-value="local.slaLimits?.amberThreshold ?? templateSla.amberThreshold" :disabled="readonly"
                  @update:model-value="onSla('amberThreshold', $event)" :min="0" :max="100" style="flex:1" />
                <span class="slider-val">{{ local.slaLimits?.amberThreshold ?? templateSla.amberThreshold }}%</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 消息通知 -->
        <div v-if="node.type !== 'close'" class="prop-section">
          <p class="prop-section-title">消息通知</p>
          <label class="prop-check">
            <input type="checkbox" :disabled="readonly" :checked="notifyNext" @change="notifyNext = !notifyNext" /> 节点完成通知下一节点
          </label>
        </div>
      </el-tab-pane>

      <!-- ===== Tab2: 字段权限 ===== -->
      <el-tab-pane label="字段权限" name="permissions">
        <div class="prop-section">
          <p class="prop-section-title">表单字段权限</p>
          <p class="prop-hint" style="margin-bottom:var(--spacing-lg, 12px)">
            隐藏：运行时不可见 &nbsp; 只读：可见不可改 &nbsp; 可编辑：可见可填<br>
            默认：发起节点字段对其默认可编辑，其他节点默认只读
          </p>
          <div v-if="formFields.length === 0" class="prop-empty">暂无表单字段，请先在步骤2中设计表单</div>
          <div v-for="f in formFields" :key="f.id" class="prop-perm-row">
            <span class="prop-perm-label">{{ f.label }}</span>
            <el-radio-group :model-value="getFieldMode(f.id)" :disabled="readonly"
              @update:model-value="setFieldMode(f.id, $event)" size="small">
              <el-radio value="hidden">隐藏</el-radio>
              <el-radio value="readonly">只读</el-radio>
              <el-radio value="editable">可编辑</el-radio>
            </el-radio-group>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 保存按钮 -->
    <button v-if="!readonly" class="btn-primary" style="width:100%;margin-top:12px" @click="emitUpdate">保存</button>
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
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', node: FlowNode): void
}>()

const activeTab = ref('settings')
const local = reactive<FlowNode>({ id: '', type: 'start', name: '' })
const useTemplateSla = ref(true)
const notifyNext = ref(true)
const personDialogVisible = ref(false)

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
  if (!local.assignConfig) local.assignConfig = { strategy: 'user', targetIds: [], multipleMode: 'anyone' }
  local.assignConfig.targetIds = ids
}

watch(() => props.node, (n) => {
  if (n) {
    Object.assign(local, JSON.parse(JSON.stringify(n)))
    useTemplateSla.value = !n.slaLimits
    notifyNext.value = true
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
function addAction() { local.actions = [...(local.actions || []), { name: '', targetNodeId: '' }] }
function removeAction(i: number) { local.actions = (local.actions || []).filter((_, idx) => idx !== i) }
function onSla(key: string, val: any) {
  local.slaLimits = local.slaLimits || {}
  ;(local.slaLimits as any)[key] = val
}

// ===== 三态字段权限 =====
function getFieldMode(fieldId: string): string {
  const perms = local.formFields
  if (!perms || perms.length === 0) return fieldDefault(fieldId)
  const perm = perms.find(p => p.fieldId === fieldId)
  if (!perm) return fieldDefault(fieldId)
  return (perm as any).mode || 'readonly'
}
function setFieldMode(fieldId: string, mode: string) {
  const perms = local.formFields || []
  const idx = perms.findIndex(p => p.fieldId === fieldId)
  const updated = idx > -1
    ? { ...perms[idx], mode }
    : { fieldId, mode }
  if (idx > -1) {
    local.formFields = [...perms.slice(0, idx), updated, ...perms.slice(idx + 1)]
  } else {
    local.formFields = [...perms, updated]
  }
}
function fieldDefault(_fieldId: string): string {
  // 发起节点：字段默认可编辑
  if (local.type === 'start') return 'editable'
  // 其他节点：默认只读
  return 'readonly'
}

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
  padding: var(--spacing-xl, 16px);
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.prop-title {
  font-size: var(--font-h3, 18px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg, 12px);
}
.prop-tabs { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
:deep(.el-tabs__header) { margin-bottom: var(--spacing-lg, 12px); flex-shrink: 0; }
:deep(.el-tabs__content) { flex: 1; overflow: auto; }
:deep(.el-tab-pane) { padding: 0; }

.prop-section {
  margin-bottom: var(--spacing-xl, 16px);
}
.prop-section-title {
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg, 12px);
  padding-left: var(--spacing-lg, 12px);
  border-left: 3px solid var(--accent-primary);
  line-height: 1.3;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
}
.prop-help-icon {
  display: inline-flex;
  align-items: center; justify-content: center;
  width: var(--spacing-xl, 16px); height: var(--spacing-xl, 16px);
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
  font-size: var(--font-xs, 12px);
  font-weight: 600;
  cursor: help; flex-shrink: 0;
}
.prop-help-icon:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

.prop-field { margin-bottom: var(--spacing-md, 8px); }
.prop-label {
  font-size: var(--font-small, 14px); color: var(--text-secondary);
  margin-bottom: var(--spacing-xs, 4px); display: block;
}
.required { color: var(--danger); }
.prop-input {
  width: 100%; height: var(--btn-height, 37px);
  border: 1px solid var(--border-default); border-radius: var(--radius-md, 8px);
  padding: 0 var(--spacing-lg, 12px);
  font-size: var(--font-body, 16px);
  background: var(--bg-card); color: var(--text-primary);
}
.prop-input::placeholder { color: var(--text-placeholder); }
.prop-input:disabled { opacity: 0.6; background: var(--border-low); }

.prop-action-row { display: flex; gap: var(--spacing-md, 8px); margin-bottom: var(--spacing-md, 8px); align-items: center; }

.prop-perm-row {
  display: flex; align-items: center; gap: var(--spacing-lg, 12px);
  padding: var(--spacing-md, 8px) 0; border-bottom: 1px solid var(--border-low);
}
.prop-perm-label { flex: 1; font-size: var(--font-body, 16px); color: var(--text-primary); min-width: 0; }

.prop-check {
  display: flex; align-items: center; gap: var(--spacing-sm, 6px);
  font-size: var(--font-body, 16px); color: var(--text-secondary); cursor: pointer;
}
.prop-hint { color: var(--text-muted); font-size: var(--font-xs, 12px); margin-top: var(--spacing-xs, 4px); }
.prop-empty { color: var(--text-muted); font-size: var(--font-small, 14px); text-align: center; padding: var(--spacing-xxl, 24px) 0; }
.prop-empty-state { justify-content: center; align-items: center; }

.slider-row { display: flex; align-items: center; gap: var(--spacing-lg, 12px); }
.slider-val { font-size: var(--font-small, 14px); color: var(--text-muted); min-width: 40px; text-align: right; }
</style>
