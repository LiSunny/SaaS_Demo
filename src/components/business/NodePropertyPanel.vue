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
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">静态指派</p>
                  <p style="margin:0 0 var(--spacing-lg, 12px);font-size:var(--font-xs, 12px);color:var(--text-secondary)">模板配置时选定处理人，运行时自动指派。</p>
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">动态表单字段</p>
                  <p style="margin:0 0 var(--spacing-lg, 12px);font-size:var(--font-xs, 12px);color:var(--text-secondary)">运行时从表单字段取值解析处理人。</p>
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">指派给发起人</p>
                  <p style="margin:0;font-size:var(--font-xs, 12px);color:var(--text-secondary)">运行时自动将任务指派给流程发起人。</p>
                </div>
              </template>
              <span class="prop-help-icon">?</span>
            </el-tooltip>
          </p>
          <el-radio-group :model-value="local.assignSource || 'static'" :disabled="readonly"
            @update:model-value="onChange('assignSource', $event)" style="margin-bottom:var(--spacing-lg, 12px)">
            <el-radio value="static">静态指派</el-radio>
            <el-radio value="dynamic">动态表单字段</el-radio>
            <el-radio value="initiator">指派给发起人</el-radio>
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
          <template v-else-if="(local.assignSource || 'static') === 'dynamic'">
            <div class="prop-field">
              <label class="prop-label">表单字段</label>
              <el-select :model-value="local.dynamicAssignFieldId || ''" :disabled="readonly"
                @update:model-value="onChange('dynamicAssignFieldId', $event)" placeholder="请选择表单字段" style="width:100%">
                <el-option v-for="f in formFields" :key="f.id" :label="f.label" :value="f.id" />
              </el-select>
            </div>
          </template>
          <template v-else>
            <p class="prop-hint" style="margin:0">运行时自动将任务指派给流程发起人，无需额外配置。</p>
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

        <!-- SLA 覆盖（仅产生任务的节点） -->
        <div v-if="['assign', 'execute', 'confirm', 'external'].includes(node.type)" class="prop-section">
          <p class="prop-section-title">SLA 覆盖
            <el-tooltip placement="top" effect="dark" raw-content>
              <template #content>
                <div style="max-width:260px;line-height:1.6">
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">响应时限（TTR）</p>
                  <p style="margin:0 0 var(--spacing-lg, 12px);font-size:var(--font-xs, 12px);color:var(--text-secondary)">任务到达 → 接单，衡量响应速度。无指派节点时不适用。</p>
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">解决时限（TTS）</p>
                  <p style="margin:0 0 var(--spacing-lg, 12px);font-size:var(--font-xs, 12px);color:var(--text-secondary)">接单 → 工单关闭，衡量端到端解决时效。无指派节点时起点为执行节点到达。</p>
                  <p style="margin:0 0 var(--spacing-sm, 6px);font-weight:500">黄灯阈值</p>
                  <p style="margin:0;font-size:var(--font-xs, 12px);color:var(--text-secondary)">达到时限的该百分比时，SLA 状态变为"预警"。默认 80%，可下调以更早预警。</p>
                </div>
              </template>
              <span class="prop-help-icon">?</span>
            </el-tooltip>
          </p>
          <label class="prop-check" style="margin-bottom:8px">
            <input type="checkbox" :disabled="readonly" :checked="useTemplateSla" @change="useTemplateSla = !useTemplateSla" /> 使用模板默认值
          </label>
          <template v-if="!useTemplateSla">
            <div class="prop-field">
              <label class="prop-label">TTR（分钟）</label>
              <el-input-number :model-value="local.slaLimits?.ttrMinutes" :disabled="readonly"
                @update:model-value="onSla('ttrMinutes', $event)" :min="1" :max="10080" style="width:100%" placeholder="例：30" />
            </div>
            <div class="prop-field">
              <label class="prop-label">TTS（分钟）</label>
              <el-input-number :model-value="local.slaLimits?.ttsMinutes" :disabled="readonly"
                @update:model-value="onSla('ttsMinutes', $event)" :min="1" :max="10080" style="width:100%" placeholder="例：480" />
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
        <div class="prop-section">
          <p class="prop-section-title">消息通知</p>

          <!-- 节点完成通知 -->
          <label class="prop-check" style="margin-bottom: var(--spacing-lg, 12px)">
            <input type="checkbox" :disabled="readonly" :checked="notifyNext" @change="notifyNext = !notifyNext" /> 节点完成时通知下一节点处理人
          </label>

          <!-- SLA 超时通知 -->
          <div class="prop-subsection">
            <p class="prop-subsection-title">SLA 超时通知
              <el-tooltip placement="top" effect="dark" raw-content>
                <template #content>
                  <div style="max-width:240px;line-height:1.6">
                    <p style="margin:0;font-size:var(--font-xs, 12px);color:var(--text-secondary)">当前节点 SLA 超时（黄灯或红灯）时，按所选渠道通知抄送岗位的人员。运行时按实例所属企业组织树匹配岗位名称。</p>
                  </div>
                </template>
                <span class="prop-help-icon">?</span>
              </el-tooltip>
            </p>
            <label class="prop-check" style="margin-bottom:12px">
              <input type="checkbox" :disabled="readonly" :checked="slaNotifyEnabled" @change="slaNotifyEnabled = !slaNotifyEnabled" /> 启用超时通知
            </label>

            <template v-if="slaNotifyEnabled">
              <!-- 推送方式 -->
              <div class="prop-field">
                <label class="prop-label">推送方式</label>
                <div class="channel-check-row">
                  <label class="prop-check" v-for="ch in (['in_app','sms','voice'] as const)" :key="ch">
                    <input type="checkbox" :disabled="readonly"
                      :checked="slaNotifyChannels.has(ch)"
                      @change="toggleSlaChannel(ch)" />
                    {{ channelLabel(ch) }}
                  </label>
                </div>
              </div>

              <!-- 抄送来源 -->
              <div class="prop-field">
                <label class="prop-label">抄送来源</label>
                <el-radio-group :model-value="slaNotifyUseTemplate ? 'template' : 'custom'" :disabled="readonly"
                  @update:model-value="slaNotifyUseTemplate = ($event === 'template')">
                  <el-radio value="template">使用模板默认</el-radio>
                  <el-radio value="custom">自定义</el-radio>
                </el-radio-group>
              </div>

              <!-- 抄送岗位 -->
              <div class="prop-field">
                <label class="prop-label">{{ slaNotifyUseTemplate ? '模板抄送岗位（只读）' : '抄送岗位' }}</label>
                <div class="cc-tags-wrap">
                  <el-tag
                    v-for="name in effectiveCcNames"
                    :key="name"
                    :closable="!readonly && !slaNotifyUseTemplate"
                    size="default"
                    @close="removeSlaCc(name)"
                  >{{ name }}</el-tag>
                  <span v-if="effectiveCcNames.length === 0" class="prop-hint" style="margin:0">（未配置）</span>

                  <!-- 自定义模式下显示添加按钮 -->
                  <template v-if="!readonly && !slaNotifyUseTemplate">
                    <el-popover placement="bottom-start" :width="220" trigger="click">
                      <template #reference>
                        <button type="button" class="tags-add-btn">+ 添加岗位</button>
                      </template>
                      <div class="cc-popover">
                        <p class="cc-popover-title">预设岗位</p>
                        <div class="cc-presets">
                          <el-tag
                            v-for="preset in ccPresets"
                            :key="preset"
                            size="small"
                            :type="slaNotifyCcNames.includes(preset) ? 'primary' : 'info'"
                            class="cc-preset-tag"
                            @click="addSlaCcPreset(preset)"
                          >{{ preset }}</el-tag>
                        </div>
                        <el-divider style="margin: 8px 0" />
                        <div class="cc-custom">
                          <el-input
                            v-model="slaCcCustomInput"
                            placeholder="输入自定义岗位名称，回车添加"
                            size="small"
                            @keyup.enter="addSlaCcCustom"
                          />
                        </div>
                      </div>
                    </el-popover>
                  </template>
                </div>
              </div>
            </template>
          </div>
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
import { ref, watch, reactive, computed } from 'vue'
import type { FlowNode, FormField } from '@/types/workflow'
import PersonSelector from './PersonSelector.vue'

const props = defineProps<{
  node: FlowNode | null
  formFields: FormField[]
  templateSla: { amberThreshold: number; ttrMinutes?: number; ttsMinutes?: number }
  templateCcPositionNames: string[]
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
const slaNotifyEnabled = ref(false)
const slaNotifyUseTemplate = ref(true)
const slaNotifyChannels = ref<Set<'in_app' | 'sms' | 'voice'>>(new Set(['in_app', 'sms']))
const slaNotifyCcNames = ref<string[]>([])
const slaCcCustomInput = ref('')
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

// ===== SLA 抄送岗位 =====
const ccPresets = ['安全主管', '部门负责人', '值班经理', '区域经理', '项目负责人']
function addSlaCcPreset(name: string) {
  if (!slaNotifyCcNames.value.includes(name)) {
    slaNotifyCcNames.value = [...slaNotifyCcNames.value, name]
  }
}
function removeSlaCc(name: string) {
  slaNotifyCcNames.value = slaNotifyCcNames.value.filter(n => n !== name)
}
function addSlaCcCustom() {
  const name = slaCcCustomInput.value.trim()
  if (!name) return
  if (!slaNotifyCcNames.value.includes(name)) {
    slaNotifyCcNames.value = [...slaNotifyCcNames.value, name]
  }
  slaCcCustomInput.value = ''
}
function toggleSlaChannel(ch: 'in_app' | 'sms' | 'voice') {
  const next = new Set(slaNotifyChannels.value)
  if (next.has(ch)) {
    if (next.size <= 1) return // 至少保留一个渠道
    next.delete(ch)
  } else {
    next.add(ch)
  }
  slaNotifyChannels.value = next
}

watch(() => props.node, (n) => {
  if (n) {
    Object.assign(local, JSON.parse(JSON.stringify(n)))
    useTemplateSla.value = !n.slaLimits
    notifyNext.value = n.notifyOnComplete !== false
    const sn = n.slaNotification
    if (sn) {
      slaNotifyEnabled.value = sn.enabled
      slaNotifyUseTemplate.value = sn.ccSource === 'template'
      slaNotifyChannels.value = new Set(sn.channels || ['in_app', 'sms'])
      slaNotifyCcNames.value = sn.ccPositionNames || []
    } else {
      slaNotifyEnabled.value = false
      slaNotifyUseTemplate.value = true
      slaNotifyChannels.value = new Set(['in_app', 'sms'])
      slaNotifyCcNames.value = []
    }
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

function channelLabel(ch: string) {
  const map: Record<string, string> = { in_app: '站内消息', sms: '短信', voice: '语音' }
  return map[ch] || ch
}

const effectiveCcNames = computed(() => {
  if (slaNotifyUseTemplate.value) {
    return props.templateCcPositionNames
  }
  return slaNotifyCcNames.value
})

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
  result.notifyOnComplete = notifyNext.value
  if (slaNotifyEnabled.value) {
    result.slaNotification = {
      enabled: true,
      channels: [...slaNotifyChannels.value] as ('in_app' | 'sms' | 'voice')[],
      ccSource: slaNotifyUseTemplate.value ? 'template' : 'custom',
      ccPositionNames: slaNotifyUseTemplate.value ? undefined : [...slaNotifyCcNames.value],
    }
  } else {
    delete result.slaNotification
  }
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

/* 消息通知子区域 */
.prop-subsection {
  margin-top: var(--spacing-lg, 12px);
  padding-top: var(--spacing-lg, 12px);
  border-top: 1px solid var(--border-low);
}
.prop-subsection-title {
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md, 8px);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 6px);
}
.channel-check-row {
  display: flex;
  gap: var(--spacing-xl, 16px);
}
.cc-tags-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm, 6px);
}
.tags-add-btn {
  height: 32px;
  padding: 0 var(--spacing-lg, 12px);
  border: 1px dashed var(--border-high);
  border-radius: var(--radius-md, 8px);
  background: var(--bg-sub-card);
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
  cursor: pointer;
}
.tags-add-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.cc-popover-title {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm, 6px);
}
.cc-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cc-preset-tag {
  cursor: pointer;
}
.cc-custom {
  margin-top: var(--spacing-sm, 6px);
}
</style>
