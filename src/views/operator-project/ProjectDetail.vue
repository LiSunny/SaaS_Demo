<template>
  <div class="detail-page">
    <div class="content-card">
      <!-- ===== 顶部操作栏 ===== -->
      <div class="action-bar">
        <div class="action-bar-left">
          <button class="btn-link" @click="goBack">
            <AppIcon name="arrow-left" class="btn-link-icon" />
            返回列表
          </button>
        </div>
        <div class="action-bar-right">
          <button class="btn-outline-primary" @click="visualVisible = true">
            <AppIcon name="dashboard" class="btn-icon" />
            项目可视化
          </button>
          <button class="btn-outline-primary" @click="editVisible = true">
            <AppIcon name="edit" class="btn-icon" />
            编辑
          </button>
          <button class="btn-outline-danger" @click="handleDelete">
            <AppIcon name="delete" class="btn-icon" />
            删除
          </button>
        </div>
      </div>

      <template v-if="project">
        <!-- ===== 头部 KPI ===== -->
        <ProjectHeader :project="project" />

        <!-- ===== 页签 ===== -->
        <div class="tab-bar">
          <button
            class="tab-item"
            :class="{ active: activeTab === 'unit' }"
            @click="activeTab = 'unit'"
          >
            接入单位
          </button>
          <button
            class="tab-item"
            :class="{ active: activeTab === 'device' }"
            @click="activeTab = 'device'"
          >
            接入设备
          </button>
        </div>

        <!-- ===== 主体：左树右表 ===== -->
        <div class="detail-body">
          <ProjectTree
            v-model:selected-node-id="selectedNodeId"
            v-model:search="treeSearch"
            v-model:include-children="includeChildren"
            :project-id="projectId"
            @open-node-manage="nodeManageVisible = true"
            @add-unit="openAddUnit"
            @add-device="openAddDeviceAtNode"
          />

          <div class="table-panel">
            <!-- 当前范围条 -->
            <div class="scope-bar">
              <span class="scope-name">{{ scopeName }}</span>
              <span class="scope-sep">·</span>
              <span class="scope-item">单位 {{ scopeUnitCount }}</span>
              <span class="scope-sep">·</span>
              <span class="scope-item">设备 {{ scopeDeviceCount }}</span>
              <span class="scope-sep">·</span>
              <span class="scope-item">在线 {{ scopeOnlineCount }}</span>
            </div>

            <ProjectUnitTable
              v-if="activeTab === 'unit'"
              :project-id="projectId"
              :selected-node-id="selectedNodeId"
              :include-children="includeChildren"
              @add-unit="openAddUnit"
              @view-unit="openUnitDetail"
              @edit-unit="openUnitEdit"
              @add-device="openAddDevice"
            />

            <ProjectDeviceTable
              v-else
              :project-id="projectId"
              :selected-node-id="selectedNodeId"
              :include-children="includeChildren"
              :unit-filter="deviceUnitFilter"
              @add-device="openAddDevice"
              @clear-unit-filter="deviceUnitFilter = null"
              @edit-device="openDeviceEdit"
              @view-device="openDeviceDetail"
            />
          </div>
        </div>
      </template>

      <!-- ===== 项目不存在 ===== -->
      <div v-else class="not-found">
        <p class="not-found-text">项目不存在或已被删除</p>
        <button class="btn-primary" @click="goBack">返回项目档案</button>
      </div>
    </div>

    <!-- ===== 抽屉 ===== -->
    <AddUnitDrawer
      v-model:visible="addUnitVisible"
      :project-id="projectId"
      :default-node-id="selectedNodeId"
      @saved="onUnitsSaved"
    />
    <AddDeviceDrawer
      v-model:visible="addDeviceVisible"
      :project-id="projectId"
      :preset-unit-id="presetUnitId"
      :scope-node-id="scopeNodeId"
      :edit-device-id="editDeviceId"
      @saved="onDeviceSaved"
    />
    <UnitDetailDrawer
      v-model:visible="unitDetailVisible"
      :project-id="projectId"
      :unit-id="viewUnitId"
    />
    <ProjectUnitEditDrawer
      v-model:visible="unitEditVisible"
      :project-id="projectId"
      :unit-id="editUnitId"
    />
    <DeviceDetailDrawer
      v-model:visible="deviceDetailVisible"
      :project-id="projectId"
      :device-id="viewDeviceId"
    />
    <NodeManageDrawer v-model:visible="nodeManageVisible" :project-id="projectId" />
    <ProjectVisualDrawer v-model:visible="visualVisible" :project-id="projectId" />
    <ProjectFormDrawer
      v-model:visible="editVisible"
      mode="edit"
      :edit-id="projectId"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import ProjectHeader from './components/ProjectHeader.vue'
import ProjectTree from './components/ProjectTree.vue'
import ProjectUnitTable from './components/ProjectUnitTable.vue'
import ProjectDeviceTable from './components/ProjectDeviceTable.vue'
import AddUnitDrawer from './components/AddUnitDrawer.vue'
import AddDeviceDrawer from './components/AddDeviceDrawer.vue'
import UnitDetailDrawer from './components/UnitDetailDrawer.vue'
import ProjectUnitEditDrawer from './components/ProjectUnitEditDrawer.vue'
import DeviceDetailDrawer from './components/DeviceDetailDrawer.vue'
import NodeManageDrawer from './components/NodeManageDrawer.vue'
import ProjectVisualDrawer from './components/ProjectVisualDrawer.vue'
import ProjectFormDrawer from './ProjectFormDrawer.vue'
import { UNASSIGNED_NODE_ID, useProjectOpsStore } from '@/stores/project-ops'

/**
 * ProjectDetail.vue — 项目详情
 *
 * 口径见 docs/项目管理/product-design.md §7.2、§6.3、§8.5
 *   头部 KPI（项目级）+ 页签（接入单位 / 接入设备）+ 左树右表
 *   树选中节点贯穿两个页签，切换页签不重置
 *   头部 KPI 不随节点变化；节点级数据看「当前范围」条和树徽标
 */

const route = useRoute()
const router = useRouter()
const store = useProjectOpsStore()

const projectId = computed(() => String(route.params.id ?? ''))
const project = computed(() => store.projectById(projectId.value))

const activeTab = ref<'unit' | 'device'>('unit')
const selectedNodeId = ref<string | null>(null)
const treeSearch = ref('')
const includeChildren = ref(true)

const addUnitVisible = ref(false)
const addDeviceVisible = ref(false)
const unitDetailVisible = ref(false)
const unitEditVisible = ref(false)
const deviceDetailVisible = ref(false)
const nodeManageVisible = ref(false)
const visualVisible = ref(false)
const editVisible = ref(false)
const viewUnitId = ref<string | null>(null)
const editUnitId = ref<string | null>(null)
const viewDeviceId = ref<string | null>(null)
const editDeviceId = ref<string | null>(null)
const presetUnitId = ref<string | null>(null)
/** 树节点 → 添加设备时限定单位范围（design.md §6.5.1 入口 3） */
const scopeNodeId = ref<string | null>(null)
const deviceUnitFilter = ref<string | null>(null)

// 切换项目时重置视图状态
watch(projectId, () => {
  activeTab.value = 'unit'
  selectedNodeId.value = null
  treeSearch.value = ''
  includeChildren.value = true
  deviceUnitFilter.value = null
})

function goBack() {
  router.push('/projects')
}

// ===== 当前范围 =====
const scopeName = computed(() => {
  if (!selectedNodeId.value) return '全部'
  if (selectedNodeId.value === UNASSIGNED_NODE_ID) return '未分配'
  return store.nodePathText(selectedNodeId.value)
})

const scopeUnitCount = computed(
  () => store.unitsOfNode(projectId.value, selectedNodeId.value, includeChildren.value).length,
)

const scopeDevices = computed(
  () => store.devicesOfNode(projectId.value, selectedNodeId.value, includeChildren.value),
)
const scopeDeviceCount = computed(() => scopeDevices.value.length)
const scopeOnlineCount = computed(() => scopeDevices.value.filter(d => d.online).length)

// ===== 抽屉入口 =====
function openAddUnit() {
  addUnitVisible.value = true
}

/** 设备抽屉：三种入口（design.md §6.5.1） */
function openAddDevice(unitId?: string) {
  presetUnitId.value = unitId ?? null
  scopeNodeId.value = null
  editDeviceId.value = null
  addDeviceVisible.value = true
}

/** 树节点 → 添加设备：单位选择范围限定在该节点下 */
function openAddDeviceAtNode(nodeId: string) {
  presetUnitId.value = null
  scopeNodeId.value = nodeId
  editDeviceId.value = null
  addDeviceVisible.value = true
}

function openUnitDetail(unitId: string) {
  viewUnitId.value = unitId
  unitDetailVisible.value = true
}

function openUnitEdit(unitId: string) {
  editUnitId.value = unitId
  unitEditVisible.value = true
}

function openDeviceDetail(deviceId: string) {
  viewDeviceId.value = deviceId
  deviceDetailVisible.value = true
}

function openDeviceEdit(deviceId: string) {
  editDeviceId.value = deviceId
  presetUnitId.value = null
  scopeNodeId.value = null
  addDeviceVisible.value = true
}

function onUnitsSaved(result: { success: number; skipped: number; nodeId: string | null }) {
  // 接入节点与当前选中不一致时，自动切换树选中
  if (result.nodeId && result.nodeId !== selectedNodeId.value) {
    selectedNodeId.value = result.nodeId
  }
}

/**
 * 保存设备后的联动（design.md §6.5.3）
 *   在「接入单位」页签保存时，toast 带「查看设备」→ 切到设备页签并按该单位筛选
 */
function onDeviceSaved(payload: { unitId: string; unitName: string }) {
  if (activeTab.value !== 'unit') {
    ElMessage.success(`已为「${payload.unitName}」新增设备`)
    return
  }
  ElMessage({
    message: h('span', { class: 'device-saved-msg' }, [
      `已为「${payload.unitName}」新增设备`,
      h(
        'a',
        {
          class: 'device-saved-msg__link',
          onClick: () => {
            deviceUnitFilter.value = payload.unitId
            activeTab.value = 'device'
          },
        },
        '查看设备',
      ),
    ]),
    type: 'success',
    duration: 5000,
    showClose: true,
  })
}

// ===== 删除项目 =====
async function handleDelete() {
  if (!project.value) return
  const unitCount = store.unitRows(projectId.value).length
  const deviceCount = store.devices.filter(d => d.projectId === projectId.value).length
  const impact = unitCount > 0
    ? `项目下的 ${unitCount} 个单位、${deviceCount} 台设备仍保留在台账，仅解除与本项目的关联。<br/>项目的可视化配置将一并删除。`
    : '该项目下没有单位和设备，删除后不可恢复。'
  try {
    await ElMessageBox.confirm(
      `删除项目「${project.value.name}」？<br/>${impact}`,
      '删除项目',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消', dangerouslyUseHTMLString: true },
    )
  } catch {
    return
  }
  store.deleteProject(projectId.value)
  ElMessage.success('删除成功')
  router.push('/projects')
}
</script>

<style scoped>
.detail-page { height: 100%; }
.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-lg, 12px);
  overflow: hidden;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.action-bar-left { display: flex; align-items: center; gap: 12px; }
.action-bar-right { display: flex; align-items: center; gap: 8px; }

.btn-outline-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  background: var(--info-bg);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }
.btn-outline-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: var(--font-small, 14px);
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
  cursor: pointer;
  white-space: nowrap;
}
.btn-icon { font-size: 13px; }

.tab-bar {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-default);
}
.tab-item {
  padding: 8px 18px;
  font-size: var(--font-body, 16px);
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}
.tab-item.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  font-weight: 500;
}

.detail-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
}

.table-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.scope-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-sub-card, #FBFBFB);
  border: 1px solid var(--border-low);
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
}
.scope-name { color: var(--text-primary); font-weight: 500; }
.scope-sep { color: var(--text-muted); }

.not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.not-found-text { margin: 0; font-size: var(--font-body, 16px); color: var(--text-muted); }

@media (max-width: 1366px) {
  .detail-body :deep(.tree-panel) { width: 240px; }
}
</style>

<!-- toast 挂在 body 上，样式不能 scoped -->
<style>
.device-saved-msg__link {
  margin-left: 8px;
  color: var(--accent-primary);
  text-decoration: underline;
  cursor: pointer;
}
</style>
