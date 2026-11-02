<template>
  <div class="ebike-v2" :class="{ 'ebike-v2--clean': cleanMode }">
    <!-- ===== 最低层级：校园三维模型（全屏铺底，仅总览页需要） ===== -->
    <EbikeV2CampusModel v-if="!activePage" ref="campusRef" />

    <!-- ===== 大标题（浮于模型之上） ===== -->
    <EbikeV2Header v-show="!cleanMode" :active-index="activeNavIndex" @select="handleNavSelect" />

    <!-- ===== 导航页：实时警情 / 系统监测 / 消防档案 / 运行报告 ===== -->
    <component :is="activePage" v-if="activePage" />

    <!-- ===== 左右两列模块（浮于模型之上，中间留空展示模型） ===== -->
    <main v-else v-show="!cleanMode" class="ebike-v2__content">
      <div class="ebike-v2__cols">
        <!-- 左列：消防保障系统概况（上）/ 实时警情监控（下），顺序按设计稿 70:313 -->
        <div class="col col--left">
          <FireOverviewAssurancePanel class="col__item col__item--top" />
          <FireOverviewAlarmPanel class="col__item col__item--bottom" />
        </div>

        <!-- 右列：消防设备完好率（上）/ 被动安全与隐患概况（下） -->
        <div class="col col--right">
          <FireOverviewIntegrityPanel class="col__item col__item--top" />
          <FireOverviewPassivePanel class="col__item col__item--bottom" />
        </div>

        <!-- 模型区悬浮控件：设计稿把两枚控件分置模型区两端 ——
             左缘：场景光线切换（胶囊）+ 全屏查看入口（图标+文字）；
             右缘：建筑导航。
             两组顶边与左右模块列顶边齐平。 -->
        <div class="ebike-v2__scene-tools">
          <EbikeV2TimeSwitch />
          <EbikeV2CleanToggle :active="cleanMode" @toggle="toggleClean" />
        </div>
        <div class="ebike-v2__scene-tools-right">
          <EbikeV2PoiToggle />
        </div>
      </div>
    </main>

    <!-- ===== 全屏查看：右下角退出入口（Esc 同效） ===== -->
    <EbikeV2CleanToggle v-if="cleanMode" floating active @toggle="toggleClean" />

    <!-- ===== 小安助手：页内浮层（不跳转路由，深色工作台直接嵌在本页） ===== -->
    <EbikeV2AgentPanel v-if="agentOpen" @close="closeAgent" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import './components/ebike-v2/ebike-v2-fonts.css'
import EbikeV2Header from './components/ebike-v2/EbikeV2Header.vue'
import EbikeV2CampusModel from './components/ebike-v2/EbikeV2CampusModel.vue'
import FireOverviewAlarmPanel from './components/ebike-v2/fire/FireOverviewAlarmPanel.vue'
import FireOverviewIntegrityPanel from './components/ebike-v2/fire/FireOverviewIntegrityPanel.vue'
import FireOverviewAssurancePanel from './components/ebike-v2/fire/FireOverviewAssurancePanel.vue'
import FireOverviewPassivePanel from './components/ebike-v2/fire/FireOverviewPassivePanel.vue'
import EbikeV2TimeSwitch from './components/ebike-v2/EbikeV2TimeSwitch.vue'
import EbikeV2PoiToggle from './components/ebike-v2/EbikeV2PoiToggle.vue'
import EbikeV2CleanToggle from './components/ebike-v2/EbikeV2CleanToggle.vue'
import EbikeV2AgentPanel from './components/ebike-v2/EbikeV2AgentPanel.vue'
import EbikeV2RealTimeAlarm from './components/ebike-v2/pages/EbikeV2RealTimeAlarm.vue'
import EbikeV2SystemMonitor from './components/ebike-v2/pages/EbikeV2SystemMonitor.vue'
import EbikeV2FireArchive from './components/ebike-v2/pages/EbikeV2FireArchive.vue'
import EbikeV2OperationReport from './components/ebike-v2/pages/EbikeV2OperationReport.vue'
import { provideCampusModel, type CampusModelApi } from './components/ebike-v2/useCampusModel'

/** 模型实例：模型区悬浮控件（建筑导航 / 昼夜切换）通过 provide/inject 取用 */
const campusRef = ref<CampusModelApi | null>(null)
provideCampusModel(campusRef)

/** ===== 顶栏导航 ===== */
const activeNavIndex = ref(0)
const agentOpen = ref(false)

/**
 * 导航下标 → 页面组件
 *
 * 下标 0（校园总览）与 5（小安助手）不在此表：总览是本页默认内容，
 * 助手是页内浮层，都不占独立页面。
 */
const NAV_PAGES: Record<number, Component> = {
  1: EbikeV2RealTimeAlarm,
  2: EbikeV2SystemMonitor,
  3: EbikeV2FireArchive,
  4: EbikeV2OperationReport,
}

/** 当前导航页组件；为空表示停在总览页 */
const activePage = computed(() => NAV_PAGES[activeNavIndex.value] ?? null)

/** 打开助手前的导航项：关闭助手后回退到该项，保持大屏上下文 */
let navIndexBeforeAgent = 0

function handleNavSelect(item: { key?: string }, index: number) {
  if (item.key === 'agent') {
    // 再次点击同一项 = 收起助手浮层
    if (agentOpen.value) {
      closeAgent()
      return
    }
    navIndexBeforeAgent = activeNavIndex.value
    agentOpen.value = true
    activeNavIndex.value = index
    return
  }
  // 切换到其他导航项：关闭助手浮层
  agentOpen.value = false
  activeNavIndex.value = index
}

function closeAgent() {
  agentOpen.value = false
  activeNavIndex.value = navIndexBeforeAgent
}

/** ===== 全屏查看（内部 cleanMode）：只留三维模型 ===== */

/** 全屏态：隐藏顶栏、左右模块列与悬浮控件组，只保留三维模型 */
const cleanMode = ref(false)

function toggleClean() {
  cleanMode.value = !cleanMode.value
  if (!cleanMode.value) return
  // 进入全屏：收起助手浮层与建筑导航面板，画面上不留任何浮层
  agentOpen.value = false
  campusRef.value?.togglePoiPanel(false)
}

/** Esc 退出清屏 */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !cleanMode.value) return
  cleanMode.value = false
}

/**
 * 全局悬浮小安机器人挂在 StandaloneLayout 里（Teleport 到 body），
 * 组件样式够不到它；用 body 类跨层隐藏。
 */
watch(cleanMode, (v) => {
  document.body.classList.toggle('ebike-clean-mode', v)
})

onMounted(() => window.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('ebike-clean-mode')
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./components/ebike-v2/fire/fire-common.scss" as fire;

.ebike-v2 {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden;
  background: #00437A;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  /* 消防面板的主题变量：文字色阶 + 异常红，各面板与内联 style 共用同一份 */
  @include fire.fire-theme;
}

/* 两列模块；容器整体不吃指针事件，中间留空处可交互三维模型 */
.ebike-v2__content {
  position: absolute;
  top: vh(86); left: 0; right: 0; bottom: vh(16);
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 0 vw(16);
  pointer-events: none;
}

/* 两列 */
.ebike-v2__cols {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: space-between;
}

/* 模型区悬浮控件组（场景光线切换 + 清屏入口）。
   两枚控件贴在模型区左缘（绝对 x=561 = 左列右缘 538 + 23），纵向堆叠、间距 8；
   建筑导航另置模型区右缘（右缘 1362 = 右列左缘 1382 − 20）。
   本组 left 的定位基准是列容器（`.ebike-v2__cols`，自身左缘 x=16），
   故 561 − 16 = 545；右组用 right 锚右缘，不受该基准影响。
   两组都挂在两列容器上：top:0 即两列顶边，与右列首卡「消防设备完好率」顶边对齐，
   状态条高度变化时无需改数值。 */
.ebike-v2__scene-tools {
  position: absolute;
  top: 0;
  left: vw(545);
  z-index: 11;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* 两枚控件尺寸已固定 px（见 EbikeV2TimeSwitch / EbikeV2CleanToggle），
     间距同样固定 8px；用 vh(8) 会随视口高度缩放（1443→7、2560→10），
     与固定尺寸的控件对不上。 */
  gap: 8px;
  pointer-events: auto;
}

/* 模型区右缘：建筑导航。
   锚按钮右缘而非左缘 —— 按钮宽是内容驱动的（字号有 14px 下限，视口变窄时
   按钮不会等比缩），锚右缘才能让按钮与下方弹窗在任意视口都同宽对齐。
   右缘 1362 = 右列左缘 1382 − 20。 */
.ebike-v2__scene-tools-right {
  position: absolute;
  top: 0;
  right: calc(vw(522) + vw(20));
  z-index: 11;
  display: flex;
  pointer-events: auto;
}

.col {
  display: flex; flex-direction: column; gap: vh(16);
  min-height: 0;
  flex-shrink: 0;
  pointer-events: auto;
}

/* 列宽：左右等宽 522（x=16→538 / 1382→1904），模型可视区 = 538→1382（844）。
   比例 1 : φ : 1 —— 单列宽 522，模型区 844 = 522 × φ（φ=1.618），两侧对称。
   设计稿 70:313 原为左 468 / 模型 1024 / 右 396；此处按用户定的黄金分割口径重分。 */
.col--left { width: vw(522); }
.col--right { width: vw(522); }

/* 卡片高配比：设计稿按内容分配 —— 左 462:500、右 500:462。
   462/962 ≈ 48.0%、500/962 ≈ 52.0%，故折成 48:52 / 52:48。 */
.col__item { min-height: 0; }
.col--left .col__item--top { flex: 48 1 0; }
.col--left .col__item--bottom { flex: 52 1 0; }
.col--right .col__item--top { flex: 52 1 0; }
.col--right .col__item--bottom { flex: 48 1 0; }
</style>

<!-- 清屏态：全局悬浮小安机器人挂在 StandaloneLayout（Teleport 到 body），
     scoped 样式够不到，改由 body 类跨层隐藏。 -->
<style lang="scss">
body.ebike-clean-mode .agent-floating-chat {
  display: none !important;
}
</style>
