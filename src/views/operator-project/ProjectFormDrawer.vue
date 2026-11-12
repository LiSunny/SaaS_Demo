<template>
  <el-drawer
    :model-value="visible"
    :title="mode === 'edit' ? '编辑项目' : '新增项目'"
    size="520px"
    direction="rtl"
    :close-on-click-modal="false"
    class="project-form-drawer"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
  >
    <div class="drawer-form-body">
      <!-- ===== 步骤指示 ===== -->
      <el-steps :active="step - 1" align-center finish-status="success" class="form-steps">
        <el-step title="基本信息" />
        <el-step title="初始化层级" :description="mode === 'edit' ? '编辑时不可修改' : '选择层级来源'" />
      </el-steps>

      <!-- ===== 第 1 步：基本信息 ===== -->
      <template v-if="step === 1">
        <!-- 项目编号（编辑时只读） -->
        <div v-if="mode === 'edit'" class="form-row">
          <div class="form-label">
            <span class="label-text">项目编号</span>
          </div>
          <div class="form-control">
            <el-input :model-value="currentCode" readonly class="pf-input" />
            <div class="form-tip">项目编号自动生成，不可修改。</div>
          </div>
        </div>

        <!-- 项目名称 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">项目名称</span>
          </div>
          <div class="form-control">
            <el-input
              v-model="form.name"
              placeholder="请输入项目名称"
              maxlength="50"
              class="pf-input"
            />
          </div>
        </div>

        <!-- 项目类型 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">项目类型</span>
          </div>
          <div class="form-control">
            <el-select
              v-model="form.type"
              placeholder="请选择项目类型"
              filterable
              clearable
              class="pf-select"
            >
              <el-option v-for="t in PROJECT_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
            </el-select>
          </div>
        </div>

        <!-- 管理范围 -->
        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">管理范围</span>
          </div>
          <div class="form-control">
            <el-cascader
              v-model="regionPath"
              :options="REGION_TREE"
              :props="{ expandTrigger: 'hover', value: 'value', label: 'label', children: 'children' }"
              placeholder="请选择管理范围（省 / 市 / 区）"
              filterable
              clearable
              class="pf-cascader"
              :teleported="false"
            />
            <div v-if="regionChanged" class="form-tip form-tip-warning">
              修改管理范围不会自动重建已有层级，如需调整请到项目详情的「层级管理」中操作。
            </div>
          </div>
        </div>

        <!-- 负责人 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">负责人</span>
          </div>
          <div class="form-control">
            <el-input
              v-model="form.owner"
              placeholder="请输入项目负责人"
              maxlength="20"
              class="pf-input"
            />
          </div>
        </div>

        <!-- 起止时间 -->
        <div class="form-row">
          <div class="form-label">
            <span class="label-text">起止时间</span>
          </div>
          <div class="form-control">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="pf-datepicker"
            />
          </div>
        </div>

        <!-- 备注 -->
        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-text">备注</span>
          </div>
          <div class="form-control">
            <el-input
              v-model="form.remark"
              type="textarea"
              placeholder="请输入备注信息"
              maxlength="200"
              :rows="3"
              class="pf-textarea"
            />
          </div>
        </div>
      </template>

      <!-- ===== 第 2 步：初始化层级 ===== -->
      <template v-else>
        <div v-if="mode === 'create'" class="form-tip">
          确认层级初始化方式后点击「保存」完成建项。
        </div>

        <!-- 编辑模式：层级不可在此调整 -->
        <div v-if="mode === 'edit'" class="form-row form-row-top">
          <div class="form-label">
            <span class="label-text">初始化层级</span>
          </div>
          <div class="form-control">
            <div class="form-tip">层级请在项目详情的「层级管理」中调整。</div>
          </div>
        </div>

        <template v-else>
          <!-- 初始化方式 -->
          <div class="form-row form-row-top">
            <div class="form-label">
              <span class="label-text">初始化方式</span>
            </div>
            <div class="form-control">
              <el-radio-group v-model="initMode" class="pf-radio-group">
                <el-radio value="region">按行政区划（推荐）</el-radio>
                <el-radio value="blank">空白层级</el-radio>
                <el-radio value="copy">复制已有项目</el-radio>
              </el-radio-group>
              <div class="form-tip">
                按行政区划：以「管理范围」为根节点，按所选深度生成下级区划节点。
              </div>
            </div>
          </div>

          <!-- 按行政区划：深度 + 预览 -->
          <div v-if="initMode === 'region'" class="form-row form-row-top">
            <div class="form-label">
              <span class="label-text">区划深度</span>
            </div>
            <div class="form-control">
              <el-radio-group v-model="initDepth" class="pf-radio-group pf-radio-inline">
                <el-radio value="city">到市</el-radio>
                <el-radio value="district">到区</el-radio>
                <el-radio value="street">到街道</el-radio>
              </el-radio-group>
              <div class="preview-box">
                <div class="preview-title">
                  将生成 {{ previewNodes.length }} 个层级节点
                  <span v-if="previewNodes.length" class="preview-sub">（仅管理范围内）</span>
                </div>
                <div v-for="(name, i) in previewNodes" :key="i" class="preview-node">{{ name }}</div>
                <div v-if="!previewNodes.length" class="preview-empty">请先在第 1 步选择管理范围</div>
              </div>
            </div>
          </div>

          <!-- 空白层级 -->
          <div v-else-if="initMode === 'blank'" class="form-row form-row-top">
            <div class="form-label">
              <span class="label-text">空白层级</span>
            </div>
            <div class="form-control">
              <div class="form-tip">
                创建后手动加节点，空白层级下不能直接接入单位。
              </div>
            </div>
          </div>

          <!-- 复制已有项目 -->
          <div v-else class="form-row form-row-top">
            <div class="form-label">
              <span class="label-text">来源项目</span>
            </div>
            <div class="form-control">
              <el-select
                v-model="copyFromProjectId"
                placeholder="请选择要复制的来源项目"
                filterable
                clearable
                class="pf-select"
              >
                <el-option
                  v-for="p in copyCandidates"
                  :key="p.id"
                  :label="p.name"
                  :value="p.id"
                />
              </el-select>
              <div class="form-tip">复制来源项目的层级结构，不复制单位与设备。</div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- ===== 底部操作栏 ===== -->
    <div class="drawer-footer">
      <button type="button" class="btn-cancel" @click="handleCancel">取消</button>
      <button v-if="step === 2" type="button" class="btn-outline" @click="step = 1">上一步</button>
      <button v-if="step === 1" type="button" class="btn-outline" @click="handleNext">下一步</button>
      <button
        v-if="mode === 'create' && step === 2"
        type="button"
        class="btn-outline"
        :disabled="submitting"
        @click="handleSave(true)"
      >
        保存并继续
      </button>
      <button type="button" class="btn-save" :disabled="submitting" @click="handleSave(false)">
        {{ submitting ? '保存中...' : '保存' }}
      </button>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * ProjectFormDrawer.vue — 新增 / 编辑项目抽屉（运营商侧）
 *
 * 依据 docs/项目管理/product-design.md：
 *   §6.1  建项与层级初始化（两步：基本信息 → 初始化层级）
 *   §6.7  项目编辑 / 删除（编号只读、改管理范围给警告）
 *   §7.1  新增 / 编辑抽屉（520px）
 *
 * 层级初始化三选一：按行政区划 / 空白层级 / 复制已有项目；
 * 区划预览由本文件的纯函数 previewRegionNodes 推导，不依赖 store 私有实现。
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import { useProjectOpsStore, REGION_TREE, PROJECT_TYPE_OPTIONS } from '@/stores/project-ops'
import type { HierarchyInitMode, Project } from '@/types/project-ops'

// ===== Props & Emits =====
const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  editId?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'saved': []
}>()

// ===== Store =====
const store = useProjectOpsStore()
const submitting = ref(false)

// ===== 步骤 =====
const step = ref(1)

function handleNext() {
  step.value = 2
}

// ===== 表单 =====
const form = reactive({
  name: '',
  type: '',
  regionPath: [] as string[],
  owner: '',
  dateRange: [] as string[],
  remark: '',
})

/** 编辑时的原始管理范围，用于判断是否被改动 */
const originalRegionPath = ref<string[]>([])

/**
 * 管理范围：级联清空时组件可能回传 undefined，这里统一成数组
 */
const regionPath = computed<string[]>({
  get: () => (Array.isArray(form.regionPath) ? form.regionPath : []),
  set: v => {
    form.regionPath = Array.isArray(v) ? v : []
  },
})

/** 起止时间：日期区间清空时同样可能是 null */
const dateRange = computed<string[]>({
  get: () => (Array.isArray(form.dateRange) ? form.dateRange : []),
  set: v => {
    form.dateRange = Array.isArray(v) ? v : []
  },
})

const regionChanged = computed(
  () =>
    props.mode === 'edit' &&
    originalRegionPath.value.join('/') !== regionPath.value.join('/'),
)

/** 编辑时回填的项目编号（只读） */
const currentCode = computed(() => {
  if (props.mode !== 'edit' || !props.editId) return ''
  return store.projectById(props.editId)?.code ?? ''
})

// ===== 层级初始化 =====
const initMode = ref<HierarchyInitMode>('region')
const initDepth = ref<'city' | 'district' | 'street'>('street')
const copyFromProjectId = ref('')

/** 复制来源候选：排除当前编辑的项目 */
const copyCandidates = computed<Project[]>(() =>
  store.projects.filter(p => p.id !== props.editId),
)

/** 取某个区划的下级（本地实现，不依赖 store 私有函数） */
function regionChildrenOf(label: string) {
  const stack = [...REGION_TREE]
  while (stack.length) {
    const node = stack.shift()!
    if (node.value === label) return node.children ?? []
    if (node.children?.length) stack.push(...node.children)
  }
  return []
}

/**
 * 按行政区划预览将要生成的层级节点名（缩进表示层级）
 * 与 store.buildRegionNodes 同口径：根节点 = 管理范围选中的那一级，
 * 根按「深度」下探，下级再各下探一级。
 */
function previewRegionNodes(regionPath: string[], depth: 'city' | 'district' | 'street'): string[] {
  const scope = regionPath[regionPath.length - 1]
  if (!scope) return []
  const levelInPath = regionPath.indexOf(scope)
  const rootLevel = levelInPath >= 0 ? levelInPath : 1
  const out: string[] = []
  const walk = (label: string, level: number, indent: string, isRoot: boolean) => {
    out.push(`${indent}${label}`)
    const wantKids = isRoot
      ? (depth === 'district' && level <= 1) || (depth === 'street' && level <= 2)
      : (depth === 'district' && level <= 2) || (depth === 'street' && level <= 3)
    if (!wantKids) return
    for (const kid of regionChildrenOf(label)) {
      walk(kid.label, level + 1, `${indent}　`, false)
    }
  }
  walk(scope, rootLevel, '', true)
  return out
}

const previewNodes = computed(() => previewRegionNodes(regionPath.value, initDepth.value))

// ===== 校验 =====
function validateForm(): boolean {
  if (!form.name.trim()) {
    ElMessage.warning('请输入项目名称')
    return false
  }
  if (!form.type) {
    ElMessage.warning('请选择项目类型')
    return false
  }
  if (!regionPath.value.length) {
    ElMessage.warning('请选择管理范围')
    return false
  }
  if (!form.owner.trim()) {
    ElMessage.warning('请输入负责人')
    return false
  }
  return true
}

// ===== 保存 =====
function handleSave(continueCreate: boolean) {
  if (!validateForm()) {
    step.value = 1
    return
  }

  const [startDate = '', endDate = ''] = dateRange.value

  if (props.mode === 'edit' && props.editId) {
    store.updateProject(props.editId, {
      name: form.name.trim(),
      type: form.type ?? '',
      regionPath: [...regionPath.value],
      owner: form.owner.trim(),
      startDate,
      endDate,
      remark: form.remark,
    })
    ElMessage.success('保存成功')
    emit('saved')
    emit('update:visible', false)
    return
  }

  // 新增：第 1 步先确认层级初始化方式，再落库
  if (step.value === 1) {
    step.value = 2
    return
  }
  if (initMode.value === 'copy' && !copyFromProjectId.value) {
    ElMessage.warning('请选择来源项目')
    return
  }

  submitting.value = true
  try {
    store.createProject(
      {
        name: form.name.trim(),
        type: form.type ?? '',
        regionPath: [...regionPath.value],
        owner: form.owner.trim(),
        startDate,
        endDate,
        remark: form.remark,
      },
      {
        mode: initMode.value,
        depth: initDepth.value,
        copyFromProjectId: copyFromProjectId.value || null,
      },
    )
    ElMessage.success('创建成功')
    emit('saved')
    if (continueCreate) {
      // 保存并继续：清空表单，留在当前页继续建项
      resetForm()
      step.value = 1
    } else {
      emit('update:visible', false)
    }
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('update:visible', false)
}

// ===== 重置 =====
function resetForm() {
  Object.assign(form, {
    name: '',
    type: '',
    regionPath: [],
    owner: '',
    dateRange: [],
    remark: '',
  })
  originalRegionPath.value = []
  initMode.value = 'region'
  initDepth.value = 'street'
  copyFromProjectId.value = ''
  step.value = 1
}

function handleClosed() {
  resetForm()
}

// ===== 打开时回填 =====
watch(
  () => props.visible,
  (v) => {
    if (!v) return
    resetForm()
    if (props.mode === 'edit' && props.editId) {
      const p = store.projectById(props.editId)
      if (p) {
        form.name = p.name
        form.type = p.type
        form.regionPath = [...p.regionPath]
        form.owner = p.owner
        form.dateRange = p.startDate && p.endDate ? [p.startDate, p.endDate] : []
        form.remark = p.remark
        originalRegionPath.value = [...p.regionPath]
      }
    }
  },
)
</script>

<style scoped>
/* ===== Drawer 结构 ===== */
:deep(.el-drawer__header) {
  margin-bottom: 0 !important;
  padding: 28px 28px 18px !important;
  border-bottom: 1px solid var(--border-default);
}
:deep(.el-drawer__body) {
  display: flex !important; flex-direction: column; overflow: hidden !important;
  padding: 18px 28px !important; height: 100%; box-sizing: border-box;
}

.drawer-form-body {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 18px; padding-bottom: 8px;
}

.form-steps { margin-bottom: var(--spacing-md, 8px); }

/* ===== 表单行（照抄 EnterpriseFormDrawer 的写法） ===== */
.form-row { display: flex; align-items: center; gap: 16px; min-height: 36px; }
.form-row-top { align-items: flex-start; }

.form-label {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0; width: 110px; justify-content: flex-end; padding-top: 2px;
}
.label-required { font-size: 18px; font-weight: 500; color: var(--danger); line-height: 1; flex-shrink: 0; }
.label-text { font-size: var(--font-body, 16px); font-weight: 400; color: var(--text-tertiary); white-space: nowrap; line-height: 1; }

.form-control { flex: 1; min-width: 0; position: relative; }
.form-tip { font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-top: 4px; }
.form-tip-warning { color: var(--warning); }

/* ===== 表单控件 ===== */
.pf-input, .pf-select, .pf-cascader, .pf-datepicker { width: 100% !important; }

.pf-input :deep(.el-input__wrapper),
.pf-select :deep(.el-select__wrapper) {
  min-height: 36px; height: 36px; border: 1px solid var(--border-high); border-radius: var(--radius-md, 8px);
  box-shadow: none; background: var(--bg-card); padding: 0 12px;
  display: flex; align-items: center; box-sizing: border-box;
}
.pf-input :deep(.el-input__wrapper:hover),
.pf-select :deep(.el-select__wrapper:hover) { border-color: var(--accent-primary); }
.pf-input :deep(.el-input__wrapper.is-focus),
.pf-select :deep(.el-select__wrapper.is-focus) { border-color: var(--accent-primary); box-shadow: none; }

.pf-input :deep(.el-input__inner),
.pf-select :deep(.el-select__input),
.pf-cascader :deep(.el-input__inner) {
  font-size: var(--font-small, 14px); color: var(--text-primary); line-height: 36px; height: auto;
}

/* 级联：边框画在根节点上，内层输入框去边框 */
.pf-cascader {
  min-height: 36px; height: 36px; border: 1px solid var(--border-high); border-radius: var(--radius-md, 8px);
  box-shadow: none; background: var(--bg-card); padding: 0 12px;
  display: flex; align-items: center; box-sizing: border-box;
}
.pf-cascader:hover { border-color: var(--accent-primary); }
.pf-cascader :deep(.el-input__wrapper) {
  box-shadow: none !important; background: transparent; border: none; padding: 0; height: auto; border-radius: 0;
}
.pf-cascader :deep(.el-cascader-menu) { min-width: 170px; flex-shrink: 0; }
.pf-cascader :deep(.el-cascader__dropdown) { left: 0 !important; }

/* 日期区间：根节点就是输入框 */
.pf-datepicker {
  min-height: 36px; height: 36px; border: 1px solid var(--border-high); border-radius: var(--radius-md, 8px);
  box-shadow: none !important; background: var(--bg-card); padding: 0 12px;
  display: flex; align-items: center; box-sizing: border-box;
}
.pf-datepicker:hover { border-color: var(--accent-primary); }
.pf-datepicker :deep(.el-range-input),
.pf-datepicker :deep(.el-range-separator) { font-size: var(--font-small, 14px); color: var(--text-primary); }

.pf-textarea :deep(.el-textarea__inner) { font-size: var(--font-small, 14px); border-radius: var(--radius-md, 8px); }

/* ===== 单选组 ===== */
.el-radio-group.pf-radio-group { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.el-radio-group.pf-radio-inline { flex-direction: row; align-items: center; gap: 18px; }

/* ===== 层级预览 ===== */
.preview-box {
  margin-top: var(--spacing-md, 8px); padding: 12px;
  border: 1px solid var(--border-low); border-radius: var(--radius-md, 8px);
  background: var(--bg-main); max-height: 220px; overflow-y: auto;
}
.preview-title { font-size: var(--font-small, 14px); color: var(--text-secondary); margin-bottom: 8px; }
.preview-sub { color: var(--text-muted); }
.preview-node { font-size: var(--font-small, 14px); color: var(--text-primary); line-height: 1.8; }
.preview-empty { font-size: var(--font-small, 14px); color: var(--text-muted); }

/* ===== 底部操作栏 ===== */
.drawer-footer {
  display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;
  padding: 12px 0 0; border-top: 1px solid var(--border-default); margin-top: auto;
}

.btn-cancel {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px;
  height: 37px; border: 1px solid var(--border-high); border-radius: 8px; background: var(--bg-card);
  color: var(--text-secondary); font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; white-space: nowrap; transition: all .15s;
}
.btn-cancel:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

.btn-outline {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px;
  height: 37px; border: 1px solid var(--accent-primary); border-radius: 8px; background: transparent;
  color: var(--accent-primary); font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; white-space: nowrap; transition: all .15s;
}
.btn-outline:hover:not(:disabled) { background: var(--accent-primary10); }
.btn-outline:disabled { opacity: .5; cursor: not-allowed; }

.btn-save {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px;
  min-width: 88px; height: 37px; border: none; border-radius: 8px;
  background: var(--accent-primary); color: #fff;
  font-size: var(--font-small, 14px); font-weight: 500; font-family: inherit;
  cursor: pointer; white-space: nowrap; transition: opacity .15s;
}
.btn-save:hover { opacity: .85; }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
</style>
