<template>
  <div class="tree-panel">
    <!-- ===== 树工具栏 ===== -->
    <div class="tree-toolbar">
      <div class="search-input-wrap tree-search">
        <input v-model="innerSearch" class="fi-input" placeholder="搜索区域 / 层级" @keyup.enter="emitSearch" />
        <button v-if="innerSearch" class="fi-clear" @click="clearSearch">
          <AppIcon name="clear" />
        </button>
        <AppIcon name="search" class="fi-icon" />
      </div>
    </div>

    <div class="tree-toolbar tree-toolbar-row">
      <label class="tree-switch">
        <el-switch v-model="innerInclude" size="small" />
        <span class="switch-text">含下级</span>
      </label>
      <button class="btn-tree-manage" @click="$emit('open-node-manage')">
        <AppIcon name="setting" class="btn-icon" />
        层级管理
      </button>
    </div>

    <!-- ===== 树 ===== -->
    <div class="tree-body">
      <template v-if="treeData.length">
        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          :props="{ label: 'label', children: 'children' }"
          :expand-on-click-node="false"
          :default-expand-all="true"
          :current-node-key="selectedKey"
          highlight-current
          @node-click="onNodeClick"
        >
          <template #default="{ data }">
            <!-- 新增子级时的临时输入行 -->
            <div v-if="data.isTemp" class="tree-node tree-node-temp">
              <span class="tree-indent" />
              <input
                ref="tempInputRef"
                v-model="editingValue"
                class="tree-input"
                :placeholder="editingMode === 'addChild' ? '输入子级名称' : '输入同级名称'"
                @keyup.enter="commitEdit"
                @keyup.esc="cancelEdit"
                @blur="commitEdit"
              />
            </div>

            <!-- 正常节点 -->
            <div v-else class="tree-node" :class="{ 'is-selected': data.id === selectedNodeId }">
              <AppIcon :name="data.type === 'region' ? 'location' : 'folder'" class="tree-icon" :class="`tree-icon-${data.type}`" />
              <el-tooltip
                :content="`本级 ${data.ownUnits} / 含下级 ${data.totalUnits}`"
                placement="top"
                :show-after="300"
              >
                <span class="tree-name" :class="{ 'is-match': isMatch(data.name) }">{{ data.name }}</span>
              </el-tooltip>
              <span class="tree-count">{{ data.unitCount }}</span>

              <div class="tree-actions">
                <button class="tree-act" title="新增子级" @click.stop="startAdd('addChild', data.id)">
                  <AppIcon name="plus" />
                </button>
                <el-dropdown trigger="click" @command="onCommand($event, data.id)">
                  <button class="tree-act" title="更多操作" @click.stop>
                    <AppIcon name="more" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="addChild">新增子级</el-dropdown-item>
                      <el-dropdown-item command="addSibling">新增同级</el-dropdown-item>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="move">移动到</el-dropdown-item>
                      <el-dropdown-item v-if="data.type === 'region'" command="sync">同步下级区划</el-dropdown-item>
                      <el-dropdown-item command="up" divided>上移</el-dropdown-item>
                      <el-dropdown-item command="down">下移</el-dropdown-item>
                      <el-dropdown-item command="remove" divided>删除</el-dropdown-item>
                      <el-dropdown-item command="addUnit" divided>接入单位</el-dropdown-item>
                      <el-dropdown-item command="addDevice">添加设备</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </template>

      <!-- 空层级引导 -->
      <div v-else class="tree-empty">
        <p class="tree-empty-text">暂无层级</p>
        <button class="btn-outline-primary btn-sm" @click="$emit('open-node-manage')">初始化行政区划</button>
      </div>

      <!-- 未分配（树底部特殊节点，不可删除） -->
      <div
        class="tree-node tree-node-unassigned"
        :class="{ 'is-selected': selectedNodeId === UNASSIGNED_NODE_ID }"
        @click="selectNode(UNASSIGNED_NODE_ID)"
      >
        <AppIcon name="folder" class="tree-icon tree-icon-unassigned" />
        <span class="tree-name">未分配</span>
        <span class="tree-count">{{ unassignedCount }}</span>
      </div>
    </div>

    <!-- ===== 移动到：目标节点选择 ===== -->
    <el-dialog v-model="moveVisible" title="移动到" width="420px" append-to-body>
      <p class="dialog-tip">
        将「{{ moveSourceName }}」移动到目标节点下。不能在移动到自己的下级。
      </p>
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
        <button class="btn-primary" :disabled="!moveTargetId" @click="confirmMove">确认移动</button>
      </template>
    </el-dialog>

    <!-- ===== 删除节点：影响说明 ===== -->
    <el-dialog v-model="removeVisible" title="删除层级节点" width="460px" append-to-body>
      <template v-if="removeHasChildren">
        <p class="dialog-tip">该层级下还有子层级，请先删除或迁移子层级。</p>
      </template>
      <template v-else-if="removeStat && removeStat.totalUnits > 0">
        <p class="dialog-tip">
          该层级下有 <strong>{{ removeStat.totalUnits }}</strong> 个单位、<strong>{{ removeStat.totalDevices }}</strong> 台设备。
        </p>
        <p class="dialog-tip dialog-tip-muted">删除节点不会删除单位与设备，只会调整它们的归属层级。</p>
      </template>
      <template v-else>
        <p class="dialog-tip">该层级为空节点，可直接删除。</p>
      </template>
      <template #footer>
        <button class="btn-default" @click="removeVisible = false">取消</button>
        <button v-if="removeHasChildren" class="btn-primary" @click="gotoNodeManage">去管理</button>
        <template v-else-if="removeStat && removeStat.totalUnits > 0">
          <el-select v-model="removeMigrateTarget" class="migrate-select" placeholder="迁移目标节点" clearable>
            <el-option v-for="n in migrateTargets" :key="n.id" :label="n.name" :value="n.id" />
          </el-select>
          <button class="btn-default" @click="confirmRemove('migrate')">迁移后删除</button>
          <button class="btn-danger" @click="confirmRemove('unassign')">移至「未分配」并删除</button>
        </template>
        <button v-else class="btn-danger" @click="confirmRemove('unassign')">删除</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import AppIcon from '@/components/base/AppIcon.vue'
import { UNASSIGNED_NODE_ID, useProjectOpsStore } from '@/stores/project-ops'
import type { HierarchyNode, NodeStat } from '@/types/project-ops'

/**
 * ProjectTree.vue — 项目层级树
 *
 * 口径见 docs/项目管理/product-design.md §6.2（组织管理层级）、§6.3（按层级查看）、§8.1（层级规则）
 *   深度 ≤ 6；同级重名禁止；不能移动到自己的子孙下
 *   树徽标默认含下级总数，tooltip 显示「本级 / 含下级」
 *   搜索只过滤显示，不改变选中节点和数据范围
 */

interface TreeNodeData {
  id: string
  label: string
  name: string
  type: 'region' | 'custom'
  ownUnits: number
  totalUnits: number
  unitCount: number
  deviceCount: number
  children: TreeNodeData[]
  isTemp?: boolean
}

const props = defineProps<{
  projectId: string
  selectedNodeId: string | null
  search: string
  includeChildren: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedNodeId', id: string | null): void
  (e: 'update:search', val: string): void
  (e: 'update:includeChildren', val: boolean): void
  (e: 'open-node-manage'): void
  (e: 'add-unit', nodeId: string | null): void
  (e: 'add-device', nodeId: string): void
}>()

const store = useProjectOpsStore()

// ===== 工具栏双向绑定 =====
const innerSearch = ref(props.search)
const innerInclude = ref(props.includeChildren)

watch(() => props.search, v => { innerSearch.value = v })
watch(() => props.includeChildren, v => { innerInclude.value = v })

function emitSearch() {
  emit('update:search', innerSearch.value)
}
function clearSearch() {
  innerSearch.value = ''
  emit('update:search', '')
}
watch(innerInclude, v => emit('update:includeChildren', v))

// ===== 树数据 =====
const selectedKey = computed(() => props.selectedNodeId ?? '')
const unassignedCount = computed(() => store.unassignedCount(props.projectId))

function buildTree(parentId: string | null): TreeNodeData[] {
  return store.childrenOf(props.projectId, parentId).map((n: HierarchyNode) => {
    const stat = store.statOf(props.projectId, n.id)
    return {
      id: n.id,
      label: n.name,
      name: n.name,
      type: n.type,
      ownUnits: stat.ownUnits,
      totalUnits: stat.totalUnits,
      unitCount: props.includeChildren ? stat.totalUnits : stat.ownUnits,
      deviceCount: props.includeChildren ? stat.totalDevices : stat.ownDevices,
      children: buildTree(n.id),
    }
  })
}

function filterTree(list: TreeNodeData[], q: string): TreeNodeData[] {
  const out: TreeNodeData[] = []
  for (const n of list) {
    const matched = n.name.includes(q)
    const children = matched ? n.children : filterTree(n.children, q)
    if (matched || children.length) out.push({ ...n, children })
  }
  return out
}

// ===== 内联编辑 =====
type EditMode = 'rename' | 'addChild' | 'addSibling'
const editingId = ref<string | null>(null)
const editingMode = ref<EditMode>('rename')
const editingValue = ref('')
const editingParentId = ref<string | null>(null)
const tempInputRef = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

/** 把临时输入行插入到树数据里（深度优先，找到目标即插入） */
function injectTemp(list: TreeNodeData[]): TreeNodeData[] {
  if (!editingId.value) return list
  const temp: TreeNodeData = {
    id: '__editing__',
    label: '',
    name: '',
    type: 'custom',
    ownUnits: 0,
    totalUnits: 0,
    unitCount: 0,
    deviceCount: 0,
    children: [],
    isTemp: true,
  }
  const idx = list.findIndex(n => n.id === editingId.value)
  if (idx !== -1) {
    if (editingMode.value === 'addChild') {
      list[idx].children = [temp, ...list[idx].children]
    } else {
      list.splice(idx + 1, 0, temp)
    }
    return list
  }
  for (const n of list) injectTemp(n.children)
  return list
}

const treeData = computed<TreeNodeData[]>(() => {
  const all = buildTree(null)
  const q = props.search.trim()
  const filtered = q ? filterTree(all, q) : all
  return injectTemp(filtered)
})

function isMatch(name: string): boolean {
  const q = props.search.trim()
  return !!q && name.includes(q)
}

watch(
  () => [editingId.value, editingMode.value],
  async () => {
    if (!editingId.value) return
    await nextTick()
    const raw = tempInputRef.value
    const el = Array.isArray(raw) ? raw[0] : raw
    el?.focus()
  },
)

function onNodeClick(data: TreeNodeData) {
  if (data.isTemp) return
  selectNode(data.id)
}

function selectNode(id: string | null) {
  emit('update:selectedNodeId', id)
}

// ===== 节点操作 =====
function startAdd(mode: 'addChild' | 'addSibling', nodeId: string) {
  editingMode.value = mode
  editingId.value = nodeId
  editingValue.value = ''
  editingParentId.value = mode === 'addChild' ? nodeId : store.nodeById(nodeId)?.parentId ?? null
}

function startRename(nodeId: string) {
  editingMode.value = 'rename'
  editingId.value = nodeId
  editingValue.value = store.nodeById(nodeId)?.name ?? ''
}

function cancelEdit() {
  editingId.value = null
  editingValue.value = ''
}

function commitEdit() {
  if (!editingId.value) return
  const mode = editingMode.value
  const value = editingValue.value.trim()
  const targetId = editingId.value

  if (!value) {
    cancelEdit()
    return
  }
  if (mode === 'rename') {
    const r = store.renameNode(targetId, value)
    if (!r.ok) ElMessage.warning(r.msg)
    cancelEdit()
    return
  }
  const parentId = editingParentId.value
  const r = store.addNode(props.projectId, parentId, value, 'custom')
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  cancelEdit()
  ElMessage.success(mode === 'addChild' ? '新增子级成功' : '新增同级成功')
}

// ===== 更多操作菜单 =====
function onCommand(command: string, nodeId: string) {
  switch (command) {
    case 'addChild':
      startAdd('addChild', nodeId)
      break
    case 'addSibling':
      startAdd('addSibling', nodeId)
      break
    case 'rename':
      startRename(nodeId)
      break
    case 'move':
      openMove(nodeId)
      break
    case 'sync':
      doSync(nodeId)
      break
    case 'up':
    case 'down': {
      const r = store.reorderNode(props.projectId, nodeId, command)
      if (!r.ok) ElMessage.warning(r.msg)
      break
    }
    case 'remove':
      openRemove(nodeId)
      break
    case 'addUnit':
      emit('add-unit', nodeId)
      break
    case 'addDevice':
      emit('add-device', nodeId)
      break
  }
}

function doSync(nodeId: string) {
  const r = store.syncChildRegions(props.projectId, nodeId)
  if (r.ok) ElMessage.success(r.msg)
  else ElMessage.warning(r.msg)
}

// ===== 移动到 =====
const moveVisible = ref(false)
const moveSourceId = ref<string | null>(null)
const moveTargetId = ref<string | null>(null)

const moveSourceName = computed(() => store.nodeById(moveSourceId.value ?? '')?.name ?? '')
const moveTreeData = computed(() => buildTree(null))

/** 可作为迁移目标的节点（排除自身与自己的子孙） */
const migrateTargets = computed(() => {
  const source = moveSourceId.value
  if (!source) return []
  const excluded = new Set([source, ...store.descendantIds(source)])
  const out: { id: string; name: string }[] = []
  const walk = (parentId: string | null) => {
    for (const n of store.childrenOf(props.projectId, parentId)) {
      if (!excluded.has(n.id)) {
        out.push({ id: n.id, name: store.nodePathText(n.id) })
        walk(n.id)
      }
    }
  }
  walk(null)
  return out
})

function openMove(nodeId: string) {
  moveSourceId.value = nodeId
  moveTargetId.value = null
  moveVisible.value = true
}

function onMoveTarget(data: TreeNodeData) {
  moveTargetId.value = data.id
}

function confirmMove() {
  if (!moveSourceId.value || !moveTargetId.value) return
  const r = store.moveNode(props.projectId, moveSourceId.value, moveTargetId.value)
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  moveVisible.value = false
  ElMessage.success('移动成功')
}

// ===== 删除节点 =====
const removeVisible = ref(false)
const removeTargetId = ref<string | null>(null)
const removeHasChildren = ref(false)
const removeStat = ref<NodeStat | null>(null)
const removeMigrateTarget = ref<string | null>(null)

function openRemove(nodeId: string) {
  const check = store.checkRemoveNode(props.projectId, nodeId)
  removeTargetId.value = nodeId
  removeHasChildren.value = !check.ok
  removeStat.value = check.stat ?? null
  removeMigrateTarget.value = null
  removeVisible.value = true
}

function gotoNodeManage() {
  removeVisible.value = false
  emit('open-node-manage')
}

function confirmRemove(strategy: 'unassign' | 'migrate') {
  if (!removeTargetId.value) return
  if (strategy === 'migrate' && !removeMigrateTarget.value) {
    ElMessage.warning('请选择迁移目标节点')
    return
  }
  const r = store.removeNode(props.projectId, removeTargetId.value, strategy, removeMigrateTarget.value ?? undefined)
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  removeVisible.value = false
  if (props.selectedNodeId === removeTargetId.value) {
    emit('update:selectedNodeId', null)
  }
  ElMessage.success('删除成功')
}

// ===== 供外部调用：接入单位入口 =====
defineExpose({
  /** 从详情页在指定节点下接入单位 */
  addUnitAt(nodeId: string | null) {
    emit('add-unit', nodeId)
  },
})
</script>

<style scoped>
.tree-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tree-toolbar {
  padding: 12px 12px 0;
}
.tree-toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
}
.tree-search { width: 100%; }
.tree-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.switch-text {
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
}
.btn-tree-manage {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--accent-primary);
  background: var(--accent-primary10);
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}
.btn-tree-manage:hover { background: rgba(54, 120, 227, 0.18); }
.btn-icon { font-size: 13px; }

.tree-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 8px 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  position: relative;
}
.tree-node:hover { background: var(--bg-sub-card, #FBFBFB); }
.tree-node.is-selected { background: var(--accent-primary10); }
.tree-node.is-selected .tree-name { color: var(--accent-primary); font-weight: 500; }
.tree-node-unassigned {
  margin-top: 8px;
  border-top: 1px solid var(--border-low);
  border-radius: 0;
  padding-top: 6px;
}

.tree-icon { font-size: 14px; flex-shrink: 0; }
.tree-icon-region { color: var(--accent-primary); }
.tree-icon-custom { color: var(--text-muted); }
.tree-icon-unassigned { color: var(--text-muted); }

.tree-name {
  flex: 1;
  min-width: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-name.is-match { color: var(--accent-primary); font-weight: 600; }

.tree-count {
  flex-shrink: 0;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  color: var(--text-muted);
  background: var(--normal-bg);
  border-radius: 9px;
}

.tree-actions {
  display: none;
  align-items: center;
  gap: 2px;
}
.tree-node:hover .tree-actions { display: flex; }
.tree-node:hover .tree-count { display: none; }
.tree-act {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.tree-act:hover { color: var(--accent-primary); background: var(--accent-primary10); }

.tree-input {
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0 6px;
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
  background: var(--bg-card);
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  outline: none;
}
.tree-node-temp { cursor: default; }

.tree-empty {
  padding: 32px 12px;
  text-align: center;
}
.tree-empty-text {
  margin: 0 0 12px;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
.btn-outline-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  font-size: var(--font-small, 14px);
  color: var(--accent-primary);
  background: var(--info-bg);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}
.btn-sm { height: 30px; }

/* ===== 弹窗 ===== */
.dialog-tip {
  margin: 0 0 10px;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  line-height: 1.6;
}
.dialog-tip-muted { color: var(--text-muted); font-size: 12px; }
.move-tree-wrap {
  max-height: 320px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px;
}
.migrate-select { width: 160px; margin-right: 8px; }

:deep(.el-tree-node__content) { height: 32px; border-radius: var(--radius-sm, 6px); }
:deep(.el-tree-node__content:hover) { background: var(--bg-sub-card, #FBFBFB); }
</style>
