<template>
  <el-drawer
    :model-value="visible"
    title="接入单位"
    size="760px"
    direction="rtl"
    class="add-unit-drawer"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
  >
    <!-- ===== 入口切换 ===== -->
    <div class="entry-tabs">
      <button
        class="entry-tab"
        :class="{ active: mode === 'select' }"
        @click="mode = 'select'"
      >从台账选择</button>
      <button
        class="entry-tab"
        :class="{ active: mode === 'create' }"
        @click="mode = 'create'"
      >新建并接入</button>
    </div>

    <!-- ================= 模式一：从台账选择 ================= -->
    <template v-if="mode === 'select'">
      <!-- 第 1 步 -->
      <div v-if="step === 1" class="drawer-body">
        <div class="filter-bar">
          <div class="filter-left">
            <div class="search-input-wrap">
              <input v-model="filter.keyword" class="fi-input" placeholder="单位名称" />
              <button v-if="filter.keyword" class="fi-clear" @click="filter.keyword = ''">
                <AppIcon name="clear" />
              </button>
              <AppIcon name="search" class="fi-icon" />
            </div>
            <el-select v-model="filter.nature" class="fi-select-wrap narrow" placeholder="性质" clearable>
              <el-option v-for="n in UNIT_NATURE_OPTIONS" :key="n" :label="n" :value="n" />
            </el-select>
            <el-input v-model="filter.region" class="fi-input region-input" placeholder="区域" />
          </div>
        </div>

        <div class="table-wrap ledger-table">
          <table class="fi-table">
            <thead>
              <tr class="fi-thead-tr">
                <th class="fi-th col-check">
                  <el-checkbox :model-value="allChecked" :indeterminate="someChecked" @change="toggleAll" />
                </th>
                <th class="fi-th col-name"><span>单位名称</span></th>
                <th class="fi-th col-nature"><span>性质</span></th>
                <th class="fi-th col-region"><span>所属区域</span></th>
                <th class="fi-th col-state"><span>状态</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pageRows" :key="row.id" class="fi-tbody-tr">
                <td class="fi-td col-check">
                  <el-checkbox
                    :model-value="checked.includes(row.id)"
                    :disabled="linkedIds.includes(row.id)"
                    @change="(v: boolean | string | number) => toggleRow(row.id, v)"
                  />
                </td>
                <td class="fi-td col-name">{{ row.name }}</td>
                <td class="fi-td col-nature">{{ row.nature }}</td>
                <td class="fi-td col-region">{{ row.region || '—' }}</td>
                <td class="fi-td col-state">
                  <span v-if="linkedIds.includes(row.id)" class="state-tag is-linked">已接入</span>
                  <span v-else-if="otherProjectsOf(row.id).length" class="state-tag is-other">
                    已在{{ otherProjectsOf(row.id)[0] }}
                  </span>
                  <span v-else class="state-tag">可接入</span>
                </td>
              </tr>
              <tr v-if="!ledgerRows.length">
                <td class="fi-td empty-cell" colspan="5">
                  没找到符合条件的单位
                  <button class="btn-link empty-link" @click="mode = 'create'">新建并接入</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ===== 分页（勾选集合跨页保留，design.md §6.4.2） ===== -->
        <div v-if="ledgerTotal > pageSize" class="pagination-wrap">
          <span class="pagi-total">共 {{ ledgerTotal }} 条 第 {{ page }}/{{ ledgerPages }} 页</span>
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="ledgerTotal"
            layout="prev, pager, next"
            background
          />
        </div>

        <div class="drawer-footer-bar">
          <span class="foot-text">已选 {{ checked.length }} 个{{ checked.length >= MAX_LINK_UNITS ? '（单次上限 50 个，请分批接入）' : '' }}</span>
          <div class="foot-actions">
            <button class="btn-default" @click="$emit('update:visible', false)">取消</button>
            <button class="btn-primary" :disabled="!checked.length" @click="step = 2">下一步</button>
          </div>
        </div>
      </div>

      <!-- 第 2 步 -->
      <div v-else class="drawer-body">
        <p class="step-desc">
          将 {{ checked.length }} 个单位接入到指定层级。单位必须落在层级节点上；不选则进入「未分配」。
        </p>
        <div class="node-search">
          <div class="search-input-wrap">
            <input v-model="nodeKeyword" class="fi-input" placeholder="搜索层级" />
            <AppIcon name="search" class="fi-icon" />
          </div>
        </div>
        <div class="node-tree-wrap">
          <el-tree
            :data="nodeTree"
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            :default-expand-all="true"
            highlight-current
            :current-node-key="targetNodeId"
            @node-click="onNodeClick"
          />
        </div>

        <div class="drawer-footer-bar">
          <span class="foot-text">将接入到：<strong>{{ targetNodeLabel }}</strong></span>
          <div class="foot-actions">
            <button class="btn-default" @click="step = 1">上一步</button>
            <button class="btn-primary" @click="confirmLink">确认接入（{{ checked.length }} 个）</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ================= 模式二：新建并接入 ================= -->
    <div v-else class="drawer-body">
      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">单位类型</span></div>
        <div class="form-control">
          <el-radio-group v-model="form.kind">
            <el-radio value="enterprise">企业</el-radio>
            <el-radio value="family">家庭</el-radio>
            <el-radio value="venue">九小场所</el-radio>
            <el-radio value="other">其它</el-radio>
          </el-radio-group>
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">名称</span></div>
        <div class="form-control">
          <el-input v-model="form.name" :placeholder="namePlaceholder" maxlength="50" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">单位性质</span></div>
        <div class="form-control">
          <el-select v-model="form.nature" placeholder="请选择单位性质" class="w-full">
            <el-option v-for="n in UNIT_NATURE_OPTIONS" :key="n" :label="n" :value="n" />
          </el-select>
        </div>
      </div>

      <div v-if="form.kind === 'venue'" class="form-row">
        <div class="form-label"><span class="label-text">场所类型</span></div>
        <div class="form-control">
          <el-select v-model="form.venueType" placeholder="请选择场所类型" class="w-full">
            <el-option v-for="t in VENUE_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">所属区域</span></div>
        <div class="form-control">
          <el-input v-model="form.region" placeholder="如：海港区" />
          <div class="form-tip">用于自动匹配归属层级，保存前可手动调整。</div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-text">地址</span></div>
        <div class="form-control">
          <el-input v-model="form.address" placeholder="详细地址" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-text">{{ contactLabel }}</span></div>
        <div class="form-control">
          <el-input v-model="form.contact" :placeholder="contactLabel" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-text">联系方式</span></div>
        <div class="form-control">
          <el-input v-model="form.phone" placeholder="手机号" maxlength="11" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-text">标签</span></div>
        <div class="form-control">
          <el-select v-model="form.tags" multiple filterable allow-create default-first-option placeholder="回车创建标签" class="w-full" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">归属层级</span></div>
        <div class="form-control">
          <el-tree
            :data="nodeTree"
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            :default-expand-all="true"
            highlight-current
            :current-node-key="targetNodeId"
            @node-click="onNodeClick"
          />
        </div>
      </div>

      <div v-if="form.kind === 'enterprise'" class="form-row">
        <div class="form-label"><span class="label-text">重点单位</span></div>
        <div class="form-control">
          <el-switch v-model="form.isKeyUnit" />
          <span class="form-tip inline-tip">同时加入重点单位台账</span>
        </div>
      </div>

      <div class="drawer-footer-bar">
        <span class="foot-text">保存后单位进入台账，并接入到「{{ targetNodeLabel }}」</span>
        <div class="foot-actions">
          <button class="btn-default" @click="$emit('update:visible', false)">取消</button>
          <button class="btn-default" @click="saveAndContinue">保存并继续</button>
          <button class="btn-primary" @click="saveAndClose">保存并接入</button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import {
  MAX_LINK_UNITS,
  UNIT_NATURE_OPTIONS,
  UNASSIGNED_NODE_ID,
  VENUE_TYPE_OPTIONS,
  useProjectOpsStore,
} from '@/stores/project-ops'
import type { UnitKind, UnitNature } from '@/types/project-ops'

/**
 * AddUnitDrawer.vue — 接入单位抽屉
 *
 * 口径见 docs/项目管理/product-design.md §6.4
 *   主路径：从台账选择（已接入置灰跳过）→ 选择归属层级 → 确认接入
 *   备路径：新建并接入（表单按性质切换，支持保存并继续）
 *   单次接入上限 50 个（§8.2）
 */

const props = defineProps<{
  visible: boolean
  projectId: string
  defaultNodeId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved', result: { success: number; skipped: number; nodeId: string | null }): void
}>()

const store = useProjectOpsStore()

const mode = ref<'select' | 'create'>('select')
const step = ref(1)
const filter = ref({ keyword: '', nature: '', region: '' })
const checked = ref<string[]>([])
const nodeKeyword = ref('')
const targetNodeId = ref<string | null>(null)

const form = ref({
  kind: 'enterprise' as UnitKind | 'other',
  name: '',
  nature: '社会单位' as UnitNature,
  venueType: '',
  region: '',
  address: '',
  contact: '',
  phone: '',
  tags: [] as string[],
  isKeyUnit: true,
})

watch(
  () => props.visible,
  val => {
    if (!val) return
    mode.value = 'select'
    step.value = 1
    checked.value = []
    page.value = 1
    filter.value = { keyword: '', nature: '', region: '' }
    nodeKeyword.value = ''
    targetNodeId.value = props.defaultNodeId ?? null
    resetForm()
  },
)

function handleClosed() {
  emit('update:visible', false)
}

function resetForm() {
  form.value = {
    kind: 'enterprise',
    name: '',
    nature: '社会单位',
    venueType: '',
    region: '',
    address: '',
    contact: '',
    phone: '',
    tags: [],
    isKeyUnit: true,
  }
}

// ===== 台账列表 =====
const linkedIds = computed(() =>
  store.projectUnits.filter(pu => pu.projectId === props.projectId).map(pu => pu.unitId),
)

const ledgerRows = computed(() => {
  const kw = filter.value.keyword.trim()
  return store.units.filter(u => {
    if (kw && !u.name.includes(kw)) return false
    if (filter.value.nature && u.nature !== filter.value.nature) return false
    if (filter.value.region && !u.region.includes(filter.value.region.trim())) return false
    return true
  })
})

// ===== 分页（勾选集合 checked 跨页保留） =====
const page = ref(1)
const pageSize = 10
const ledgerTotal = computed(() => ledgerRows.value.length)
const ledgerPages = computed(() => Math.ceil(ledgerTotal.value / pageSize) || 1)
const pageRows = computed(() =>
  ledgerRows.value.slice((page.value - 1) * pageSize, page.value * pageSize),
)

// 筛选条件变化 → 回到第 1 页
watch(
  () => [filter.value.keyword, filter.value.nature, filter.value.region],
  () => { page.value = 1 },
)

function otherProjectsOf(unitId: string): string[] {
  return store
    .projectUnits.filter(pu => pu.unitId === unitId && pu.projectId !== props.projectId)
    .map(pu => store.projectById(pu.projectId)?.name ?? '')
    .filter(Boolean)
}

const allChecked = computed(
  () => pageRows.value.length > 0 && pageRows.value.every(r => checked.value.includes(r.id)),
)
const someChecked = computed(
  () => !allChecked.value && pageRows.value.some(r => checked.value.includes(r.id)),
)

function toggleAll(val: boolean | string | number) {
  const isChecked = Boolean(val)
  // 只作用于当前页；勾选集合跨页保留（design.md §6.4.2）
  const selectable = pageRows.value.filter(r => !linkedIds.value.includes(r.id))
  if (isChecked) {
    const merged = Array.from(new Set([...checked.value, ...selectable.map(r => r.id)]))
    checked.value = merged.slice(0, MAX_LINK_UNITS)
    if (merged.length > MAX_LINK_UNITS) {
      ElMessage.warning(`单次最多接入 ${MAX_LINK_UNITS} 个单位，请分批接入`)
    }
  } else {
    const ids = new Set(selectable.map(r => r.id))
    checked.value = checked.value.filter(id => !ids.has(id))
  }
}

function toggleRow(id: string, val: boolean | string | number) {
  if (val) {
    if (checked.value.includes(id)) return
    if (checked.value.length >= MAX_LINK_UNITS) {
      ElMessage.warning(`单次最多接入 ${MAX_LINK_UNITS} 个单位，请分批接入`)
      return
    }
    checked.value = [...checked.value, id]
  } else {
    checked.value = checked.value.filter(x => x !== id)
  }
}

// ===== 层级选择 =====
interface NodeData {
  id: string
  label: string
  children: NodeData[]
}

const nodeTree = computed<NodeData[]>(() => {
  const build = (parentId: string | null): NodeData[] =>
    store.childrenOf(props.projectId, parentId).map(n => ({
      id: n.id,
      label: n.name,
      children: build(n.id),
    }))
  const kw = nodeKeyword.value.trim()
  const filterTree = (list: NodeData[]): NodeData[] => {
    if (!kw) return list
    const out: NodeData[] = []
    for (const n of list) {
      const matched = n.label.includes(kw)
      const children = matched ? n.children : filterTree(n.children)
      if (matched || children.length) out.push({ ...n, children })
    }
    return out
  }
  return [
    ...filterTree(build(null)),
    { id: UNASSIGNED_NODE_ID, label: '未分配', children: [] },
  ]
})

function onNodeClick(data: NodeData) {
  targetNodeId.value = data.id
}

const targetNodeLabel = computed(() => {
  if (!targetNodeId.value) return '未分配'
  if (targetNodeId.value === UNASSIGNED_NODE_ID) return '未分配'
  return store.nodePathText(targetNodeId.value)
})

// ===== 确认接入 =====
function confirmLink() {
  const result = store.linkUnits(props.projectId, checked.value, targetNodeId.value)
  emit('update:visible', false)
  emit('saved', { success: result.success, skipped: result.skipped, nodeId: targetNodeId.value })
  if (result.skipped > 0) {
    ElMessage.success(`成功 ${result.success} 个，跳过 ${result.skipped} 个（已在本项目）`)
  } else {
    ElMessage.success(`已接入 ${result.success} 个单位到 ${targetNodeLabel.value}`)
  }
}

// ===== 新建并接入 =====
const namePlaceholder = computed(() => {
  if (form.value.kind === 'family') return '家庭名称 / 户主'
  if (form.value.kind === 'venue') return '场所名称'
  return '单位名称'
})

const contactLabel = computed(() => {
  if (form.value.kind === 'family') return '户主 / 联系人'
  return '负责人'
})

/** 按区域自动匹配归属层级 */
function matchNodeByRegion(): void {
  const region = form.value.region.trim()
  if (!region) return
  const hit = store.nodesOf(props.projectId).find(n => n.name === region)
  if (hit) targetNodeId.value = hit.id
}

watch(() => form.value.region, matchNodeByRegion)

function buildUnitPayload() {
  const kind: UnitKind = form.value.kind === 'other' ? 'enterprise' : form.value.kind
  return {
    name: form.value.name,
    kind,
    nature: form.value.nature,
    region: form.value.region,
    address: form.value.address,
    contact: form.value.contact,
    phone: form.value.phone,
    tags: form.value.tags,
    venueType: form.value.venueType,
    isKeyUnit: form.value.kind === 'enterprise' ? form.value.isKeyUnit : false,
  }
}

function saveUnit(): boolean {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入名称')
    return false
  }
  if (!form.value.region.trim()) {
    ElMessage.warning('请输入所属区域')
    return false
  }
  if (!targetNodeId.value) {
    ElMessage.warning('请选择归属层级')
    return false
  }
  const dup = store.unitRows(props.projectId).some(r => r.name === form.value.name.trim() && r.region === form.value.region.trim())
  if (dup) {
    ElMessage.warning('项目内已存在同名同区域单位')
    return false
  }
  const r = store.createUnit(buildUnitPayload(), { projectId: props.projectId, nodeId: targetNodeId.value })
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return false
  }
  return true
}

function saveAndClose() {
  if (!saveUnit()) return
  emit('update:visible', false)
  emit('saved', { success: 1, skipped: 0, nodeId: targetNodeId.value })
  ElMessage.success('已保存并接入')
}

function saveAndContinue() {
  if (!saveUnit()) return
  emit('saved', { success: 1, skipped: 0, nodeId: targetNodeId.value })
  ElMessage.success('已保存，可继续录入下一个单位')
  resetForm()
}
</script>

<style scoped>
.entry-tabs {
  display: flex;
  gap: 4px;
  padding: 0 0 12px;
  border-bottom: 1px solid var(--border-default);
  margin-bottom: 14px;
}
.entry-tab {
  padding: 6px 14px;
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}
.entry-tab.active {
  color: var(--accent-primary);
  background: var(--accent-primary10);
  font-weight: 500;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.filter-left { display: flex; align-items: center; gap: 10px; }
.narrow { width: 130px; }
.region-input { width: 130px; }

.ledger-table {
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
}

.col-check { width: 44px; }
.col-name { min-width: 180px; }
.col-nature { width: 110px; }
.col-region { width: 100px; }
.col-state { width: 120px; }

.state-tag {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--normal-bg);
  border-radius: 4px;
  white-space: nowrap;
}
.state-tag.is-linked { color: var(--normal); background: var(--normal-bg); }
.state-tag.is-other { color: var(--notice); background: var(--notice-bg); }

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 28px 0 !important;
}
.empty-link { font-size: var(--font-small, 14px); margin-left: 6px; }

.step-desc {
  margin: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
  line-height: 1.6;
}
.node-search { width: 220px; }
.node-tree-wrap {
  max-height: 380px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px;
}

.drawer-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}
.foot-text { font-size: var(--font-small, 14px); color: var(--text-tertiary); }
.foot-actions { display: flex; gap: 8px; }

.form-row { display: flex; align-items: center; gap: 16px; min-height: 36px; }
.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 100px;
  justify-content: flex-end;
}
.label-required { font-size: 18px; font-weight: 500; color: var(--semantic-danger, #DC2626); line-height: 1; flex-shrink: 0; }
.label-text { font-size: var(--font-body, 16px); font-weight: 400; color: var(--text-tertiary); white-space: nowrap; line-height: 1; }
.form-control { flex: 1; min-width: 0; position: relative; }
.form-tip { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
.inline-tip { margin-left: 10px; margin-top: 0; }
.w-full { width: 100% !important; }
</style>
