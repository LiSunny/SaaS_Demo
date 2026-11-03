<template>
  <div class="monitor">
    <!-- ===== 设备检测指标概览（设计稿 117:22647）===== -->
    <EbikeV2MonitorMetrics
      :systems="systems"
      :system-key="activeSystemKey"
      :metrics="metrics"
      @update:system-key="activeSystemKey = $event"
    />

    <!-- ===== 主区：组态画布 + 右列两模块 ===== -->
    <div class="monitor__body">
      <!-- 组态画布（设计稿 117:22393） -->
      <section class="monitor__canvas">
        <EbikeV2SceneCanvas
          :scene="currentScene"
          :system-key="activeSystemKey"
          empty-text="该系统暂无组态画面"
          @select="openDeviceDrawer"
        />
      </section>

      <!-- 右列：实时警情（上）/ 多发故障排名（下），设计稿 110:16122 -->
      <div class="monitor__side">
        <EbikeV2MonitorAlarm class="monitor__side-item" :rows="alarms" />
        <EbikeV2FaultRank class="monitor__side-item" :ranks="ranks" />
      </div>
    </div>

    <!-- ===== 点图元下钻：这批设备的清单（深色抽屉） ===== -->
    <EbikeV2MonitorDeviceDrawer v-model="drawerOpen" :node="activeNode" :alarm-records="alarmRecords" />
  </div>
</template>

<script setup lang="ts">
/**
 * 系统监测页
 *
 * 版式按 Figma「智能安全管控平台/系统监测」节点 110:10889：
 *   上：设备检测指标概览横条（当前系统 + 四项指标）
 *   下：左「组态画布」1352 宽 + 右列 520 宽（实时警情 / 多发故障排名），列间距 16
 *
 * 画面内容走平台既有组态配置链路（/api/scenes → EbikeV2SceneCanvas 渲染），
 * 不在本页另手绘一套画面或点位配置。
 *
 * 数据源与「设备设施管理 → 运行监控」的三个系统主页**完全同源**：
 *   useSubsystemStore 的设备档案 + 3s 刷新的运行时值，
 *   画布节点的设备归属沿用各系统自己的绑定表（config/*-scene.ts）。
 * 所以同一类设备在大屏画布上闪的角标、在右列排名里占的位、
 * 在后台组态页里点的那个图元，指的都是同一批设备。
 *
 * 下钻：点画布上的图元 → 右侧滑出深色抽屉（这批设备的清单）→ 点行看单台详情。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { fetchSceneList } from '@/api/scene-config'
import { getSubsystemProfile } from '@/config/subsystem-profiles'
import { SYMBOL_SYSTEMS } from '@/symbols'
import { useSubsystemStore } from '@/stores/subsystem'
import { useFirewaterAlarmStore } from '@/stores/firewater-alarm'
import { useGasAlarmStore } from '@/stores/gas-alarm'
import { useSmokeAlarmStore } from '@/stores/smoke-alarm'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2SceneCanvas from './EbikeV2SceneCanvas.vue'
import EbikeV2MonitorMetrics from '../EbikeV2MonitorMetrics.vue'
import EbikeV2MonitorAlarm from '../EbikeV2MonitorAlarm.vue'
import EbikeV2FaultRank from '../EbikeV2FaultRank.vue'
import EbikeV2MonitorDeviceDrawer from '../EbikeV2MonitorDeviceDrawer.vue'
import { pickOverviewScene } from '../scene-picker'
import {
  monitorAlarmsOf,
  monitorFaultRanksOf,
  monitorMetricsOf,
  type MonitorNodeView,
} from '../monitor-data'

const scenes = ref<SceneConfig[]>([])
const activeSystemKey = ref('')

/** 有画面的系统（按图元库的一级分类命名） */
const systems = computed(() => {
  const keys = [...new Set(scenes.value.map((s) => s.systemKey))]
  return keys
    // 只有接了设备档案的系统才有实时数据；没有档案的系统列进来也是四项 0
    .filter((key) => !!getSubsystemProfile(key))
    .map((key) => ({
      key,
      name: SYMBOL_SYSTEMS.find((s) => s.key === key)?.name ?? key,
    }))
})

/** 取该系统要展示的画面（挑选规则见 scene-picker） */
const currentScene = computed(() =>
  pickOverviewScene(scenes.value, activeSystemKey.value),
)

/* ============================================================
 * 实时设备数据（与设备设施管理三个系统主页同源）
 * ============================================================ */

const subsystem = useSubsystemStore()
const { points, refreshSeq } = storeToRefs(subsystem)
const { getRuntime } = subsystem

/* ============================================================
 * 报警记录（供抽屉里的「报警/故障」筛选）
 *
 * 与后台三个系统监测页共用同一批 store —— 同一份报警台账，
 * 大屏上筛出来的「有未处理报警」与后台看到的是同一批设备。
 * ============================================================ */

const firewaterAlarm = useFirewaterAlarmStore()
const gasAlarm = useGasAlarmStore()
const smokeAlarm = useSmokeAlarmStore()

/** 当前系统的报警记录 */
const alarmRecords = computed(() => {
  if (activeSystemKey.value === 'gas') return gasAlarm.records
  if (activeSystemKey.value === 'smoke') return smokeAlarm.records
  return firewaterAlarm.records
})

/** 把当前系统的报警台账同步到运行时状态（跃迁判定在 store 内） */
function syncAlarms() {
  const key = activeSystemKey.value
  if (!key || !points.value.length) return
  const store =
    key === 'gas' ? gasAlarm : key === 'smoke' ? smokeAlarm : firewaterAlarm
  store.sync(points.value, getRuntime)
}

/** 四项指标：按设备台数统计 */
const metrics = computed(() => monitorMetricsOf(points.value, getRuntime))

/** 实时警情：每个异常设备一条 */
const alarms = computed(() =>
  monitorAlarmsOf(points.value, getRuntime, activeSystemKey.value),
)

/** 多发故障排名：按设备类型聚合异常台数 */
const ranks = computed(() =>
  monitorFaultRanksOf(points.value, getRuntime, activeSystemKey.value),
)

/**
 * 切换系统：换设备档案 + 换画面
 *
 * loadSubsystem 内部会重建点位清单并起 3s 刷新；同一系统重复进入只续上定时器。
 */
watch(activeSystemKey, (key) => {
  if (!key) return
  subsystem.loadSubsystem(key)
  drawerOpen.value = false
  syncAlarms()
})

/**
 * 报警台账与点位状态同源：每轮刷新后同步一次。
 *
 * runtime 是 keyed 的 reactive Map，内容变而引用不变，watch(runtime) 不触发，
 * 所以用 store 的刷新序号驱动（与后台三个系统监测页同一套做法）。
 */
watch(refreshSeq, () => syncAlarms())

onMounted(async () => {
  try {
    const res = await fetchSceneList({ page: 1, size: 100 })
    scenes.value = res.data ?? []
    // 默认停在第一个有画面的系统
    const first = systems.value[0]
    if (first) activeSystemKey.value = first.key
  } catch {
    scenes.value = []
  }
})

/* ============================================================
 * 下钻抽屉
 * ============================================================ */

const drawerOpen = ref(false)
/** 当前下钻的图元（其 members 即这批设备） */
const activeNode = ref<MonitorNodeView | null>(null)

function openDeviceDrawer(node: MonitorNodeView) {
  activeNode.value = node
  drawerOpen.value = true
}

// 离开本页时停掉实时刷新（store 是全局的，不停会一直空转）
onBeforeUnmount(() => {
  subsystem.stopTimer()
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满；底色随大屏根节点（与总览页同源） */
.monitor {
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

/* ===== 主区：画布 + 右列 ===== */
.monitor__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: vw(16);
}

/* 组态画布（设计稿 #117:22393）：
   底纹用项目既有的田字格素材（40px 见方 / 80px 平铺），
   玻璃底与描边与大屏其它卡片同一套。 */
.monitor__canvas {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: 3px;
  background-color: rgba(0, 44, 94, 0.72);
  background-image: url('@/assets/bigscreen/ebike-v2/canvas-grid-bg.svg');
  background-size: vw(80) vw(80);
  background-repeat: repeat;
  backdrop-filter: blur(9px) saturate(125%);
  -webkit-backdrop-filter: blur(9px) saturate(125%);
  overflow: hidden;
}

/* 右列（设计稿 #110:16122，宽 520） */
.monitor__side {
  flex-shrink: 0;
  width: vw(520);
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* 两个模块高度等分父容器（flex-basis: 0，各占一半，与内容多少无关） */
.monitor__side > :deep(*) {
  flex: 1 1 0;
  min-height: 0;
}
</style>
