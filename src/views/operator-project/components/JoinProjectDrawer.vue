<template>
  <el-drawer
    :model-value="visible"
    title="加入项目"
    size="560px"
    direction="rtl"
    class="join-project-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="unit" class="drawer-body">
      <p class="step-desc">
        将「{{ unit.name }}」接入项目：先选项目，再选归属层级。
      </p>

      <!-- ===== 第 1 步：选项目 ===== -->
      <div class="step-block">
        <div class="step-label">1. 选择项目</div>
        <div class="project-list">
          <button
            v-for="p in projectOptions"
            :key="p.id"
            class="project-option"
            :class="{ 'is-selected': targetProjectId === p.id }"
            @click="pickProject(p.id)"
          >
            <div class="option-main">
              <span class="option-name">{{ p.name }}</span>
              <span class="option-path">{{ p.code }} · {{ p.region || '未设范围' }}</span>
            </div>
            <span v-if="linkedProjectIds.includes(p.id)" class="state-tag is-linked">已接入</span>
          </button>
        </div>
        <p v-if="!projectOptions.length" class="empty-tip">还没有项目，请先在「项目档案」创建项目。</p>
      </div>

      <!-- ===== 第 2 步：选层级 ===== -->
      <div class="step-block">
        <div class="step-label">2. 选择归属层级</div>
        <div v-if="!targetProjectId" class="empty-tip">请先选择项目</div>
        <template v-else>
          <div class="search-input-wrap node-search">
            <input v-model="nodeKeyword" class="fi-input" placeholder="搜索层级" />
            <AppIcon name="search" class="fi-icon" />
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
        </template>
      </div>

      <div class="drawer-footer-bar">
        <span class="foot-text">
          将接入到：<strong>{{ targetNodeLabel }}</strong>
        </span>
        <div class="foot-actions">
          <button class="btn-default" @click="$emit('update:visible', false)">取消</button>
          <button class="btn-primary" :disabled="!targetProjectId" @click="confirmJoin">确认接入</button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { UNASSIGNED_NODE_ID, useProjectOpsStore } from '@/stores/project-ops'
import type { ManagedUnit } from '@/types/project-ops'

/**
 * JoinProjectDrawer.vue — 台账 → 加入项目（反向入口）
 *
 * 口径见 docs/项目管理/product-design.md §6.4.1 入口 3、§6.4.2
 *   台账行操作「加入项目」：先选项目 → 再选归属层级 → 确认接入
 *   已在该项目的单位仍可选（跨项目允许，§8.2），接入时按跳过处理
 */

const props = defineProps<{
  visible: boolean
  unit: ManagedUnit | null
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const store = useProjectOpsStore()

const targetProjectId = ref<string | null>(null)
const targetNodeId = ref<string | null>(null)
const nodeKeyword = ref('')

watch(
  () => props.visible,
  val => {
    if (!val) return
    targetProjectId.value = null
    targetNodeId.value = null
    nodeKeyword.value = ''
  },
)

/** 可选项目：全部项目（不含已删除） */
const projectOptions = computed(() => store.projects)

/** 该单位已接入的项目 id */
const linkedProjectIds = computed(() => {
  if (!props.unit) return []
  return store.projectUnits.filter(pu => pu.unitId === props.unit!.id).map(pu => pu.projectId)
})

function pickProject(projectId: string) {
  targetProjectId.value = projectId
  // 换项目时层级重置，避免沿用上一个项目的节点
  targetNodeId.value = null
}

// ===== 层级树 =====
interface NodeData {
  id: string
  label: string
  children: NodeData[]
}

const nodeTree = computed<NodeData[]>(() => {
  if (!targetProjectId.value) return []
  const build = (parentId: string | null): NodeData[] =>
    store.childrenOf(targetProjectId.value!, parentId).map(n => ({
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
function confirmJoin() {
  if (!props.unit || !targetProjectId.value) return
  const result = store.linkUnits(targetProjectId.value, [props.unit.id], targetNodeId.value)
  const projectName = store.projectById(targetProjectId.value)?.name ?? ''
  if (result.success > 0) {
    ElMessage.success(`已把「${props.unit.name}」接入 ${projectName}`)
  } else {
    ElMessage.warning(`「${props.unit.name}」已在 ${projectName} 中，跳过`)
  }
  emit('update:visible', false)
}
</script>

<style scoped>
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.step-desc {
  margin: 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  line-height: 1.6;
}

.step-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step-label {
  font-size: var(--font-small, 14px);
  font-weight: 600;
  color: var(--text-secondary);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow: auto;
}
.project-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}
.project-option:hover { border-color: var(--accent-primary); background: var(--accent-primary10); }
.project-option.is-selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary10);
}
.option-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.option-name { font-size: var(--font-small, 14px); color: var(--text-primary); }
.option-path { font-size: 12px; color: var(--text-muted); }

.state-tag {
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
}
.state-tag.is-linked { color: var(--warning-text); background: var(--warning-bg); }

.node-search { width: 100%; }
.node-tree-wrap {
  max-height: 240px;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  padding: 6px;
}

.empty-tip {
  margin: 0;
  padding: 16px 0;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
  text-align: center;
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
</style>
