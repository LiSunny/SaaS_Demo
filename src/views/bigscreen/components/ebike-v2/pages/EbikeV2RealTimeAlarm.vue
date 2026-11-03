<template>
  <div class="duty">
    <!-- ===== 顶部 KPI 行 ===== -->
    <EbikeV2DutyKpi :kpi="kpi" />

    <!-- ===== 主区：园区空间树 | 事件队列 | 详情与处置 ===== -->
    <div class="duty__main">
      <!-- 管理单元信息（园区 › 分区 › 建筑 › 部位 › 设备） -->
      <EbikeV2DutyTree v-model="selectedUnit" :tree="spaceTree" class="duty__tree" />

      <!-- 待核实事件队列 -->
      <EbikeV2DutyQueue
        v-model="selectedEventId"
        :events="scopedEvents"
        class="duty__queue"
        @batch="batchConfirm"
      />

      <!-- 详情与处置 -->
      <section class="duty__detail">
        <!-- 告警详情（字段 + 报警位置合成一个区域） | 曲线 + 实时画面 -->
        <div class="duty__row duty__row--top">
          <EbikeV2DutyDetail
            class="duty__detail-card"
            :event="currentEvent"
            :scene="currentScene"
          />
          <div class="duty__col">
            <EbikeV2DutyTrend :event="currentEvent" />
            <EbikeV2DutyMedia />
          </div>
        </div>

        <!-- 处置区：警情处理 | 报警记录 -->
        <div class="duty__row duty__row--action">
          <EbikeV2DutyHandle
            class="duty__handle"
            @submit="confirmOne"
            @mute="onMute"
            @refresh="onRefresh"
          />
          <EbikeV2DutyTimeline class="duty__timeline" :event="currentEvent" />
        </div>
      </section>
    </div>

    <!-- ===== 操作反馈 ===== -->
    <Transition name="toast">
      <div v-if="toast" class="duty__toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 实时警情页（值守工作台）
 *
 * 版式按云端「值守监控 › 值守工作台」重排。云端是后台工作台（4 个等宽平铺列 +
 * 1 条窄列），大屏是满屏看板，两者的骨架不能照抄：
 *
 *   云端   树 295 │ 队列 279 │ 2×2 详情区 590 │ 右列 428   （el-col 4/4/4/4/6）
 *   这里   树 280 │ 队列 1fr │ 详情处置区 1.85fr              （4/7/13 的比例关系）
 *
 * 改动的原因（云端布局的实测问题）：
 *   1. 队列只有 279px，事件卡 216px 高，一屏 2.6 条 —— 队列改为紧凑 meta 卡
 *      （88px/条），同样高度能看 6 条。
 *   2. 告警详情是 291×359 的方块、7 行字段竖排；改成 4 列字段网格的横条，
 *      省下的高度给地图与曲线。
 *   3. 警情处理表单体只有 118px 高，看到底要内部滚动；改成横向 chip 组 +
 *      定高说明框 + 主按钮贴底。
 *   4. 设备控制整块 236px 只有一个「消音」按钮；压成处置区底部的矮条。
 *   5. 「告警详情」与「报警位置」原本是两张卡，同一件事被两个标题隔开；
 *      合成一张「告警详情」卡：上半字段、下半组态画面。
 *
 * 数据来源：组态画面（真值）+ 图元库点位绑定（真值）+ 确定性演示值，
 * 与本大屏既有的「实时警情 / 统计分析报表」同一份口径（scene-points.ts）。
 *
 * 左侧树的组织维度是**园区空间**（分区 / 建筑 / 部位），不是消防系统：
 * 建筑与楼层取校园三维模型的 POI 真值，设备落到哪栋楼由「设备空间归属表」
 * 按设备类型生成（平台暂无设备↔建筑的关联，见 config/duty-locations.ts）。
 */
import { computed, onMounted, ref } from 'vue'
import { fetchSceneList } from '@/api/scene-config'
import { SYMBOL_SYSTEMS } from '@/symbols'
import { assignDeviceSpaces, loadCampusSpaces, type CampusSpaces, type SpaceDevice } from '@/config/duty-locations'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2DutyKpi from '../duty/EbikeV2DutyKpi.vue'
import EbikeV2DutyTree from '../duty/EbikeV2DutyTree.vue'
import EbikeV2DutyQueue from '../duty/EbikeV2DutyQueue.vue'
import EbikeV2DutyDetail from '../duty/EbikeV2DutyDetail.vue'
import EbikeV2DutyTrend from '../duty/EbikeV2DutyTrend.vue'
import EbikeV2DutyMedia from '../duty/EbikeV2DutyMedia.vue'
import EbikeV2DutyHandle from '../duty/EbikeV2DutyHandle.vue'
import EbikeV2DutyTimeline from '../duty/EbikeV2DutyTimeline.vue'
import {
  applyDeviceSpaces,
  buildDutyEvents,
  buildDutySpaceTree,
  dutyKpiOf,
  type DutyEvent,
} from '../duty/duty-data'

/* ============================================================
 * 数据
 * ============================================================ */

const scenes = ref<SceneConfig[]>([])
/** 园区空间真值（校园三维模型 POI） */
const spaces = ref<CampusSpaces | null>(null)
/** 全部待核实事件（含已核实的，用于统计口径） */
const allEvents = ref<DutyEvent[]>([])
/** 已核实事件 id —— 确认核实处置后从待核实队列移出 */
const confirmed = ref<Set<string>>(new Set())

/** 当前选中的树节点 key（root = 不筛） */
const selectedUnit = ref('root')
/** 当前选中的事件 id */
const selectedEventId = ref('')

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
const scopedEvents = computed(() => {
  const key = selectedUnit.value
  if (key === 'root') return pendingEvents.value
  if (key.startsWith('zone-')) {
    const zoneId = key.slice(5)
    return pendingEvents.value.filter((e) => e.space?.zoneId === zoneId)
  }
  if (key.startsWith('bld-')) {
    const buildingId = key.slice(4)
    return pendingEvents.value.filter((e) => e.space?.buildingId === buildingId)
  }
  if (key.startsWith('part-')) {
    const [buildingId, part] = key.slice(5).split('::')
    return pendingEvents.value.filter((e) => e.space?.buildingId === buildingId && e.space?.part === part)
  }
  if (key.startsWith('dev-')) {
    const deviceKey = key.slice(4)
    return pendingEvents.value.filter((e) => e.deviceKey === deviceKey)
  }
  return pendingEvents.value
})

/** 当前选中事件：优先用户在当前筛选范围内选中的，否则取范围里的第一条 */
const currentEvent = computed<DutyEvent | null>(
  () => scopedEvents.value.find((e) => e.id === selectedEventId.value) ?? scopedEvents.value[0] ?? null,
)

/** 当前事件所在画面 —— 报警位置用它渲染组态图 */
const currentScene = computed<SceneConfig | null>(
  () => scenes.value.find((s) => s.id === currentEvent.value?.sceneId) ?? null,
)

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
    pendingEvents.value,
  ),
)

/** KPI */
const kpi = computed(() => dutyKpiOf(pendingEvents.value, confirmed.value.size))

/* ============================================================
 * 操作
 * ============================================================ */

/** 确认核实处置 */
function confirmOne(payload: { verify: string; handle: string; note: string }) {
  const e = currentEvent.value
  if (!e) return
  confirmed.value = new Set(confirmed.value).add(e.id)
  selectedEventId.value = ''
  flash(`已核实「${e.source}」：${payload.verify}${payload.handle ? ` · ${payload.handle}` : ''}`)
}

/** 批量核实 */
function batchConfirm(ids: string[]) {
  if (!ids.length) return
  const next = new Set(confirmed.value)
  ids.forEach((id) => next.add(id))
  confirmed.value = next
  flash(`已批量核实 ${ids.length} 条事件`)
}

function onMute() {
  const e = currentEvent.value
  flash(e ? `已对「${e.source}」下发消音` : '请先选择一条事件')
}

function onRefresh() {
  flash('设备状态已刷新')
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

  const events = buildDutyEvents(scenes.value, systemNames.value)

  // 设备 → 园区空间的归属：同一台设备只算一次（跨画面共用一个 deviceKey）
  if (campusSpaces.buildings.length) {
    const seen = new Map<string, SpaceDevice>()
    for (const e of events) {
      if (!seen.has(e.deviceKey)) {
        seen.set(e.deviceKey, { key: e.deviceKey, label: e.source, symbol: e.symbol })
      }
    }
    applyDeviceSpaces(events, assignDeviceSpaces(campusSpaces, [...seen.values()]))
  }

  allEvents.value = events
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满，底色随大屏根节点 */
.duty {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
  padding: vh(18) vw(16) vh(16);
}

/* 主区三段：园区空间树 | 事件队列 | 详情与处置 */
.duty__main {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: vw(16);
}

/* 树：固定宽，5 层缩进不随内容变化 */
.duty__tree {
  flex-shrink: 0;
  width: vw(280);
}

/* 事件队列：拿主宽度 */
.duty__queue {
  flex: 1;
  min-width: 0;
}

/* 详情与处置 */
.duty__detail {
  flex: 1.85;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

/* 证据区 / 处置区 */
.duty__row {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: vw(12);
}

/* 告警详情区（含平面图）比处置区多给一点高度 */
.duty__row--top {
  flex: 1.25;
}

/* 告警详情卡占主位，右侧上下叠曲线与实时画面。
   卡要比右列宽：8 个字段里最宽的是完整时间戳（2026-11-02 19:40:54），
   4 列并排时每列要留够 140px，窄了时间戳就会被截断。 */
.duty__row--top > .duty__detail-card {
  flex: 1.7;
  min-width: 0;
}

/* 处置区：警情处理占主位，右侧报警记录 */
.duty__row--action > .duty__handle {
  flex: 1.45;
  min-width: 0;
}

.duty__row--action > .duty__timeline {
  flex: 1;
  min-width: 0;
}

/* 右列：上下两块 */
.duty__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

.duty__col > * {
  flex: 1;
  min-height: 0;
}

/* 证据区右列：曲线多给一点高度 */
.duty__col > *:first-child {
  flex: 1.2;
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
