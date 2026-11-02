<template>
  <el-drawer
    :model-value="visible"
    title="层级管理"
    size="880px"
    direction="rtl"
    class="node-manage-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="manage-body">
      <!-- ===== 顶部操作 ===== -->
      <div class="manage-toolbar">
        <button class="btn-outline-primary btn-sm" @click="initVisible = true">
          <AppIcon name="refresh" class="btn-icon" />初始化行政区划
        </button>
        <button class="btn-outline-primary btn-sm" @click="addRootNode">
          <AppIcon name="plus" class="btn-icon" />新增一级节点
        </button>
        <button class="btn-outline-primary btn-sm is-disabled" disabled title="P1 迭代">层级设置</button>
      </div>

      <!-- ===== 左侧：完整树 ===== -->
      <div class="manage-main">
        <div class="manage-tree">
          <div class="search-input-wrap tree-search">
            <input v-model="keyword" class="fi-input" placeholder="搜索层级" />
            <button v-if="keyword" class="fi-clear" @click="keyword = ''">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="tree-body">
            <el-tree
              v-if="treeData.length"
              ref="treeRef"
              :data="treeData"
              node-key="id"
              :props="{ label: 'label', children: 'children' }"
              :default-expand-all="true"
              highlight-current
              :current-node-key="selectedId"
              @node-click="onSelect"
            >
              <template #default="{ data }">
                <div class="tree-node">
                  <AppIcon :name="data.type === 'region' ? 'location' : 'folder'" class="tree-icon" />
                  <span class="tree-name">{{ data.label }}</span>
                  <span class="tree-type">{{ data.type === 'region' ? '区划' : '自定义' }}</span>
                </div>
              </template>
            </el-tree>
            <p v-else class="tree-empty">暂无层级，可先「初始化行政区划」</p>
          </div>
        </div>

        <!-- ===== 右侧：节点详情 ===== -->
        <div class="manage-detail">
          <template v-if="detail">
            <h3 class="detail-title">{{ detail.label }}</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">层级类型</span>
                <span class="detail-value">{{ detail.type === 'region' ? '区划节点' : '自定义节点' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">父节点</span>
                <span class="detail-value">{{ parentName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">直属单位数</span>
                <span class="detail-value">{{ detail.ownUnits }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">设备数</span>
                <span class="detail-value">{{ detail.totalDevices }}</span>
              </div>
            </div>

            <div class="detail-actions">
              <button class="btn-default btn-sm" @click="promptAdd('child')">新增子级</button>
              <button class="btn-default btn-sm" @click="promptAdd('sibling')">新增同级</button>
              <button class="btn-default btn-sm" @click="promptRename">重命名</button>
              <button class="btn-default btn-sm" @click="moveVisible = true">移动到</button>
              <button class="btn-default btn-sm btn-danger-text" @click="confirmRemove">删除</button>
            </div>

            <p class="detail-tip">
              区划节点重命名只改显示名称，不改变区划来源；删除节点时单位与设备会跟随处理。
            </p>
          </template>
          <p v-else class="detail-empty">在左侧选择一个层级节点查看详情</p>
        </div>
      </div>

      <!-- ===== 底部 ===== -->
      <div class="manage-footer">
        <span class="foot-text">改动即时生效，关闭后树与统计同步刷新</span>
        <button class="btn-primary" @click="$emit('update:visible', false)">完成</button>
      </div>
    </div>

    <!-- ===== 初始化行政区划 ===== -->
    <el-dialog v-model="initVisible" title="初始化行政区划" width="460px" append-to-body>
      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">管理范围</span></div>
        <div class="form-control">
          <el-cascader
            v-model="initRegion"
            :options="REGION_TREE"
            :props="{ expandTrigger: 'hover', value: 'value', label: 'label', children: 'children' }"
            placeholder="请选择管理范围"
            filterable
            clearable
            class="w-full"
          />
        </div>
      </div>
      <div class="form-row">
        <div class="form-label"><span class="label-required">*</span><span class="label-text">生成深度</span></div>
        <div class="form-control">
          <el-radio-group v-model="initDepth">
            <el-radio value="city">到市</el-radio>
            <el-radio value="district">到区</el-radio>
            <el-radio value="street">到街道</el-radio>
          </el-radio-group>
        </div>
      </div>
      <p class="dialog-tip">只生成管理范围内的节点；社区 / 村默认不生成，可在区划节点上执行「同步下级区划」。</p>
      <template #footer>
        <button class="btn-default" @click="initVisible = false">取消</button>
        <button class="btn-primary" @click="doInit">生成</button>
      </template>
    </el-dialog>

    <!-- ===== 移动到 ===== -->
    <el-dialog v-model="moveVisible" title="移动到" width="420px" append-to-body>
      <p class="dialog-tip">将「{{ detail?.label }}」移动到目标节点下，不能移动到自己的下级。</p>
      <div class="move-tree-wrap">
        <el-tree
          :data="moveTreeData"
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          :default-expand-all="true"
          highlight-current
          :current-node-key="moveTargetId"
          @node-click="onMoveTarget"
        />
      </div>
      <template #footer>
        <button class="btn-default" @click="moveVisible = false">取消</button>
        <button class="btn-primary" :disabled="!moveTargetId" @click="doMove">确认移动</button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { REGION_TREE, useProjectOpsStore } from '@/stores/project-ops'

/**
 * NodeManageDrawer.vue — 层级管理抽屉
 *
 * 口径见 docs/项目管理/product-design.md §6.2.2
 *   左侧完整树（展开 / 收起 / 搜索），右侧节点详情与操作
 *   顶部：初始化行政区划、新增一级节点、层级设置（P1）
 *   底部：完成
 *   抽屉内改动即时生效，关闭后树与统计同步刷新
 */

const props = defineProps<{
  visible: boolean
  projectId: string
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const store = useProjectOpsStore()

const keyword = ref('')
const selectedId = ref<string | null>(null)

interface ManageNodeData {
  id: string
  label: string
  type: 'region' | 'custom'
  ownUnits: number
  totalUnits: number
  totalDevices: number
  children: ManageNodeData[]
}

function buildTree(parentId: string | null): ManageNodeData[] {
  return store.childrenOf(props.projectId, parentId).map(n => {
    const stat = store.statOf(props.projectId, n.id)
    return {
      id: n.id,
      label: n.name,
      type: n.type,
      ownUnits: stat.ownUnits,
      totalUnits: stat.totalUnits,
      totalDevices: stat.totalDevices,
      children: buildTree(n.id),
    }
  })
}

const treeData = computed<ManageNodeData[]>(() => {
  const all = buildTree(null)
  const q = keyword.value.trim()
  if (!q) return all
  const filter = (list: ManageNodeData[]): ManageNodeData[] => {
    const out: ManageNodeData[] = []
    for (const n of list) {
      const matched = n.label.includes(q)
      const children = matched ? n.children : filter(n.children)
      if (matched || children.length) out.push({ ...n, children })
    }
    return out
  }
  return filter(all)
})

const detail = computed(() => (selectedId.value ? treeData.value.find(n => n.id === selectedId.value) ?? null : null))

const parentName = computed(() => {
  if (!selectedId.value) return '—'
  const parent = store.nodeById(selectedId.value)?.parentId
  return parent ? store.nodePathText(parent) : '根节点'
})

watch(
  () => props.visible,
  val => {
    if (!val) return
    keyword.value = ''
    selectedId.value = store.childrenOf(props.projectId, null)[0]?.id ?? null
  },
)

function onSelect(data: ManageNodeData) {
  selectedId.value = data.id
}

// ===== 初始化行政区划 =====
const initVisible = ref(false)
const initRegion = ref<string[]>([])
const initDepth = ref<'city' | 'district' | 'street'>('street')

function doInit() {
  if (!initRegion.value.length) {
    ElMessage.warning('请选择管理范围')
    return
  }
  const r = store.initRegionNodes(props.projectId, initRegion.value, initDepth.value)
  ElMessage.success(r.msg)
  initVisible.value = false
}

// ===== 新增 =====
async function promptAdd(mode: 'child' | 'sibling') {
  if (!selectedId.value) {
    ElMessage.warning('请先选择节点')
    return
  }
  const parentId = mode === 'child'
    ? selectedId.value
    : store.nodeById(selectedId.value)?.parentId ?? null
  try {
    const { value } = await ElMessageBox.prompt('请输入节点名称', mode === 'child' ? '新增子级' : '新增同级', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValidator: v => (v && v.trim() ? true : '请输入节点名称'),
    })
    const r = store.addNode(props.projectId, parentId, value, 'custom')
    if (!r.ok) {
      ElMessage.warning(r.msg)
      return
    }
    ElMessage.success('新增成功')
  } catch {
    // 取消
  }
}

async function addRootNode() {
  try {
    const { value } = await ElMessageBox.prompt('请输入节点名称', '新增一级节点', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValidator: v => (v && v.trim() ? true : '请输入节点名称'),
    })
    const r = store.addNode(props.projectId, null, value, 'custom')
    if (!r.ok) {
      ElMessage.warning(r.msg)
      return
    }
    ElMessage.success('新增成功')
  } catch {
    // 取消
  }
}

async function promptRename() {
  if (!selectedId.value) return
  const current = store.nodeById(selectedId.value)?.name ?? ''
  try {
    const { value } = await ElMessageBox.prompt('请输入新的名称', '重命名', {
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValue: current,
      inputValidator: v => (v && v.trim() ? true : '请输入节点名称'),
    })
    const r = store.renameNode(selectedId.value, value)
    if (!r.ok) {
      ElMessage.warning(r.msg)
      return
    }
    ElMessage.success('重命名成功')
  } catch {
    // 取消
  }
}

// ===== 移动 =====
const moveVisible = ref(false)
const moveTargetId = ref<string | null>(null)

const moveTreeData = computed<ManageNodeData[]>(() => buildTree(null))

function onMoveTarget(data: ManageNodeData) {
  moveTargetId.value = data.id
}

function doMove() {
  if (!selectedId.value || !moveTargetId.value) return
  const r = store.moveNode(props.projectId, selectedId.value, moveTargetId.value)
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  moveVisible.value = false
  ElMessage.success('移动成功')
}

// ===== 删除 =====
async function confirmRemove() {
  if (!selectedId.value) return
  const check = store.checkRemoveNode(props.projectId, selectedId.value)
  if (!check.ok) {
    ElMessage.warning(check.msg)
    return
  }
  const stat = check.stat
  const impact = stat && stat.totalUnits > 0
    ? `该层级下有 ${stat.totalUnits} 个单位、${stat.totalDevices} 台设备。<br/>单位与设备会移至「未分配」后删除该层级。`
    : '该层级为空节点，可直接删除。'
  try {
    await ElMessageBox.confirm(impact, '删除层级节点', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
    })
  } catch {
    return
  }
  const r = store.removeNode(props.projectId, selectedId.value, 'unassign')
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  selectedId.value = null
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.manage-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.manage-toolbar {
  display: flex;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-default);
}

.btn-outline-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 4px 12px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  background: var(--info-bg);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  cursor: pointer;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }
.btn-outline-primary.is-disabled { opacity: .5; cursor: not-allowed; }
.btn-icon { font-size: 13px; }

.manage-main {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
}

.manage-tree {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
}
.tree-search { margin: 10px; width: auto; }
.tree-body { flex: 1; min-height: 0; overflow: auto; padding: 0 8px 10px; }

.tree-node { display: flex; align-items: center; gap: 6px; height: 30px; }
.tree-icon { font-size: 13px; color: var(--accent-primary); }
.tree-name { font-size: var(--font-small, 14px); color: var(--text-secondary); }
.tree-type {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--normal-bg);
  padding: 1px 5px;
  border-radius: 4px;
}
.tree-empty { padding: 24px 0; text-align: center; font-size: var(--font-small, 14px); color: var(--text-muted); }

.manage-detail {
  flex: 1;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-sub-card, #FBFBFB);
}
.detail-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: 12px; color: var(--text-muted); }
.detail-value { font-size: var(--font-small, 14px); color: var(--text-primary); }

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.btn-sm { height: 30px; }
.btn-danger-text { color: var(--danger); }

.detail-tip {
  margin: 18px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}
.detail-empty {
  margin: 0;
  padding: 40px 0;
  text-align: center;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

.manage-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--border-default);
}
.foot-text { font-size: var(--font-small, 14px); color: var(--text-tertiary); }

.form-row { display: flex; align-items: center; gap: 16px; min-height: 36px; margin-bottom: 8px; }
.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 90px;
  justify-content: flex-end;
}
.label-required { font-size: 18px; font-weight: 500; color: var(--semantic-danger, #DC2626); line-height: 1; flex-shrink: 0; }
.label-text { font-size: var(--font-body, 16px); color: var(--text-tertiary); white-space: nowrap; line-height: 1; }
.form-control { flex: 1; min-width: 0; }
.w-full { width: 100% !important; }

.dialog-tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}
.move-tree-wrap {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px;
}
</style>
