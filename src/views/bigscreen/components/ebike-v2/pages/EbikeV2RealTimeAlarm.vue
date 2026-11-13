<template>
  <div class="duty">
    <!-- ===== 顶部 KPI 行（设计稿 #140:25513） ===== -->
    <EbikeV2DutyKpi :kpi="kpi" @handover="handoverOpen = true" />

    <!-- ===== 主区：管理单元树 | 平面图（设计稿 #110:13336） ===== -->
    <div class="duty__main">
      <!-- 管理单元信息（园区 › 分区 › 建筑 › 部位 › 设备） -->
      <EbikeV2DutyTree v-model="selectedUnit" :tree="spaceTree" />

      <!-- 报警位置平面图：当前管理单元内的全部设备点位，报警的标红 -->
      <EbikeV2DutyPlan
        :devices="unitDevices"
        :scope-label="scopeLabel"
        :event-count="scopedEvents.length"
        @detail="openDetail"
      />
    </div>

    <!-- ===== 设备详情弹窗（设计稿 #165:26122「Dialog - 设备详情」） ===== -->
    <EbikeV2DeviceDetailDialog
      v-model="detailOpen"
      :device="detailDevice"
      :event="detailEvent"
      :initial-tab="detailTab"
    />

    <!-- ===== 交接班浮层（页内浮层，不跳路由） ===== -->
    <EbikeV2DutyHandover
      v-if="handoverOpen"
      :events="scopedEvents"
      :confirmed-today="confirmed.size"
      @close="handoverOpen = false"
      @confirm="confirmOne"
    />

    <!-- ===== 操作反馈 ===== -->
    <Transition name="toast">
      <div v-if="toast" class="duty__toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 实时警情页
 *
 * 版式按 Figma「智能安全管控平台/实时警情」节点 86:8287 重做：
 *
 *   上  KPI 行 #140:25513   三张计数卡 + 两张比率卡 + 交接班按钮
 *   下  主区 #110:13336     左「管理单元信息」树卡 368 宽 | 右「平面图」卡（自适应宽）
 *       列间距 16、页面内距 16（#140:25512）
 *
 * 相比重构前（云端「值守工作台」版式）移除了事件队列 / 告警详情 / 警情处理 /
 * 报警记录四块：设计稿的主区只有「树 + 平面图」两块，警情改由
 *   树（按园区空间收口）→ 平面图（消防 CRT 式描点：单元内全部设备都上图，
 *   报警的点标红）呈现 —— 一眼能看出报警设备在哪栋楼哪层。
 * 核实动作收进「交接班」浮层的未处置事项列表 —— 交接班本来就是把未处置事项
 * 交代给下一班，顺手核实是这条链路里最自然的位置，核实后 KPI 的
 * 「今日已核实事件」+1。
 *
 * 数据来源：组态画面（真值）+ 图元库点位绑定（真值）+ 确定性演示值，
 * 与本大屏既有的「实时警情 / 统计分析报表」同一份口径（scene-points.ts）。
 *
 * 左侧树的组织维度是**园区空间**（分区 / 建筑 / 部位），不是消防系统：
 * 建筑与楼层取校园三维模型的 POI 真值，设备落到哪栋楼由「设备空间归属表」
 * 按设备类型生成（平台暂无设备↔建筑的关联，见 config/duty-locations.ts）。
 */
import { computed, onMounted, ref, watch } from 'vue'
import { fetchSceneList } from '@/api/scene-config'
import { SYMBOL_SYSTEMS } from '@/symbols'
import { assignDeviceSpaces, loadCampusSpaces, type CampusSpaces } from '@/config/duty-locations'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2DutyKpi from '../duty/EbikeV2DutyKpi.vue'
import EbikeV2DutyTree from '../duty/EbikeV2DutyTree.vue'
import EbikeV2DutyPlan from '../duty/EbikeV2DutyPlan.vue'
import EbikeV2DutyHandover from '../duty/EbikeV2DutyHandover.vue'
import EbikeV2DeviceDetailDialog from '../device-detail/EbikeV2DeviceDetailDialog.vue'
import type { DeviceDetailTab } from '../device-detail/device-detail-data'
import {
  applyDeviceSpaces,
  attachDeviceSpaces,
  buildDutyEvents,
  buildDutySpaceTree,
  buildSceneDevices,
  deviceInUnit,
  dutyKpiOf,
  type DutyEvent,
  type DutySpaceNode,
  type SceneDevice,
} from '../duty/duty-data'

/* ============================================================
 * 数据
 * ============================================================ */

const scenes = ref<SceneConfig[]>([])
/** 园区空间真值（校园三维模型 POI） */
const spaces = ref<CampusSpaces | null>(null)
/** 全部待核实事件（含已核实的，用于统计口径） */
const allEvents = ref<DutyEvent[]>([])
/** 画面里的全部设备（含未报警的）—— 平面图描点用 */
const allDevices = ref<SceneDevice[]>([])
/** 已核实事件 id —— 确认核实处置后从待核实队列移出 */
const confirmed = ref<Set<string>>(new Set())

/** 当前选中的树节点 key（root = 不筛） */
const selectedUnit = ref('root')
/** 是否已经做过默认选中（避免用户手动选择后被覆盖） */
const selectionReady = ref(false)
/** 交接班浮层是否打开 */
const handoverOpen = ref(false)

/** 设备详情弹窗是否打开 */
const detailOpen = ref(false)
/** 正在查看的设备 */
const detailDevice = ref<(SceneDevice & { event?: DutyEvent }) | null>(null)
/** 正在查看的设备的当前警情 */
const detailEvent = computed(() => detailDevice.value?.event)
/**
 * 详情抽屉打开时落在哪个分区
 *
 * 'alarm' = 告警日志（事件）：从平面图点位或清单「查看」进来，
 *   值班员要看的是这台设备出过什么事；
 * 'basic' = 基础信息：点清单整行进来，先看这台设备是什么。
 */
const detailTab = ref<DeviceDetailTab>('basic')

/** 操作反馈 */
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function flash(text: string) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
    toastTimer = null
  }, 2600)
}

/* ============================================================
 * 派生
 * ============================================================ */

/** 待核实（未核实）事件 */
const pendingEvents = computed(() => allEvents.value.filter((e) => !confirmed.value.has(e.id)))

/** 按树节点筛选后的事件 */
const scopedEvents = computed(() =>
  pendingEvents.value.filter((e) => deviceInUnit(e.deviceKey, e.space, selectedUnit.value)),
)

/**
 * 当前管理单元内的全部设备（含未报警的），叠加警情状态
 *
 * 消防 CRT 的平面图描点口径：图上摆的是这个单元的**全部设备点位**，
 * 报警的那几个标红 —— 不是只画报警的设备。
 */
const unitDevices = computed(() => {
  const alarmed = new Map(pendingEvents.value.map((e) => [e.deviceKey, e]))
  return allDevices.value
    .filter((d) => deviceInUnit(d.key, d.space, selectedUnit.value))
    .map((d) => ({ ...d, event: alarmed.get(d.key) }))
})

/** 系统 key → 名称 */
const systemNames = computed(() => {
  const m = new Map<string, string>()
  for (const s of SYMBOL_SYSTEMS) m.set(s.key, s.name)
  return m
})

/** 园区空间树 */
const spaceTree = computed(() =>
  buildDutySpaceTree(
    spaces.value ?? { zones: [], buildings: [], buildingById: new Map(), zoneNameById: new Map() },
    allDevices.value,
    pendingEvents.value,
  ),
)

/** 当前选中节点的名称（平面图标题条右侧用） */
const scopeLabel = computed(() => {
  const key = selectedUnit.value
  if (key === 'root') return '全部管理单元'
  const found = findNode(spaceTree.value, key)
  return found?.label ?? '全部管理单元'
})

/** 按 key 在树里找节点 */
function findNode(node: DutySpaceNode, key: string): DutySpaceNode | null {
  if (node.key === key) return node
  for (const c of node.children) {
    const hit = findNode(c, key)
    if (hit) return hit
  }
  return null
}

/** KPI */
const kpi = computed(() => dutyKpiOf(pendingEvents.value, confirmed.value.size))

/* ============================================================
 * 操作
 * ============================================================ */

/** 核实一条警情 */
function confirmOne(id: string) {
  const e = pendingEvents.value.find((x) => x.id === id)
  if (!e) return
  confirmed.value = new Set(confirmed.value).add(id)
  flash(`已核实「${e.source}」`)
}

/**
 * 打开设备详情弹窗
 *
 * 入口有三条，指向同一个抽屉，但落点不同：
 *   1. 平面图上点设备点位 —— 图上那个点就是这台设备，详情落在告警日志；
 *   2. 设备列表操作列点「查看」 —— 同上，先在图上标识再弹详情，落在告警日志；
 *   3. 设备列表点整行 —— 只是"打开这张设备卡片看看"，落在基础信息。
 */
function openDetail(device: SceneDevice & { event?: DutyEvent }, tab: DeviceDetailTab = 'basic') {
  detailDevice.value = device
  detailTab.value = tab
  detailOpen.value = true
}

/* ============================================================
 * 装载
 * ============================================================ */

onMounted(async () => {
  const [sceneRes, campusSpaces] = await Promise.all([
    fetchSceneList({ page: 1, size: 100 }).catch(() => null),
    loadCampusSpaces(),
  ])

  scenes.value = sceneRes?.data ?? []
  spaces.value = campusSpaces

  // 画面里的全部设备（含未报警的）—— 平面图描点用
  const devices = buildSceneDevices(scenes.value)

  // 设备 → 园区空间的归属：事件与设备共用同一张表，
  // 保证平面图上的点位与树里的分支永远指同一栋楼同一层
  const table = assignDeviceSpaces(
    campusSpaces,
    devices.map((d) => ({ key: d.key, label: d.label, symbol: d.symbol })),
  )
  attachDeviceSpaces(devices, table)

  const events = buildDutyEvents(scenes.value, systemNames.value)
  applyDeviceSpaces(events, table)

  allDevices.value = devices
  allEvents.value = events
})

/**
 * 默认选中：挑一个"点得下去"的单元
 *
 * 设计稿的树默认停在建筑层（生产A楼），平面图随之显示那一栋的设备点位。
 * 本页的单元要同时满足两件事才有意义：
 *   1. 单元下有设备 —— 否则平面图是空的；
 *   2. 单元下有警情 —— 否则看不到"报警的点标红"这个核心动作。
 * 所以候选限定在分区 / 建筑两层，按「有警情优先、其次设备多」取第一个。
 *
 * 注意：必须在数据装载完成后才算 —— 树在装载前是空的，
 * 早一步执行会把选中态落在 root（= 全部管理单元），平面图变成全园区的点位墙。
 */
function pickDefaultUnit(tree: DutySpaceNode): string {
  const candidates: DutySpaceNode[] = []
  const walk = (n: DutySpaceNode, depth: number) => {
    if (depth === 1 || depth === 2) candidates.push(n)
    n.children.forEach((c) => walk(c, depth + 1))
  }
  walk(tree, 0)

  let bestKey = 'root'
  let bestHasAlarm = -1
  let bestDevices = -1

  for (const c of candidates) {
    const devices = allDevices.value.filter((d) => deviceInUnit(d.key, d.space, c.key)).length
    if (!devices) continue
    const hasAlarm = c.count > 0 ? 1 : 0
    if (
      hasAlarm > bestHasAlarm ||
      (hasAlarm === bestHasAlarm && devices > bestDevices)
    ) {
      bestKey = c.key
      bestHasAlarm = hasAlarm
      bestDevices = devices
    }
  }
  return bestKey
}

/** 数据装载完成 → 做一次默认选中（只做一次，用户手动选过就不覆盖） */
watch(
  [allDevices, allEvents],
  ([devices, events]) => {
    if (selectionReady.value) return
    if (!devices.length || !events.length) return
    selectedUnit.value = pickDefaultUnit(spaceTree.value)
    selectionReady.value = true
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满，底色随大屏根节点
   内距与间距按设计稿 #140:25512（padding 16 / gap 16） */
.duty {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
  padding: vh(16) vw(16);
}

/* 主区两段：管理单元树 | 平面图（设计稿 #110:13336） */
.duty__main {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: vw(16);
}

/* ===== 操作反馈 ===== */
.duty__toast {
  position: fixed;
  left: 50%;
  top: vh(84);
  transform: translateX(-50%);
  z-index: 10020;
  padding: vh(9) vw(18);
  border: 1px solid rgba(96, 200, 255, 0.5);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.96);
  color: #cfe4ff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.24s, transform 0.24s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
