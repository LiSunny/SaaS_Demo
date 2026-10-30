<template>
  <div class="ebike-v2">
    <!-- ===== 最低层级：校园三维模型（全屏铺底） ===== -->
    <EbikeV2CampusModel ref="campusRef" />

    <!-- ===== 大标题（浮于模型之上） ===== -->
    <EbikeV2Header :active-index="activeNavIndex" @select="handleNavSelect" />

    <!-- ===== 态势条 + 左右两列模块（浮于模型之上，中间留空展示模型） ===== -->
    <main class="ebike-v2__content">
      <!-- 通栏态势条：设备规模 / 完好率 / 预警 / 故障 / 离线 / 值班在岗 -->
      <FireOverviewStatusBar class="ebike-v2__statusbar" />

      <div class="ebike-v2__cols">
        <div class="col col--left">
          <FireOverviewAlarmPanel class="col__item col__item--top" />
          <FireOverviewAssurancePanel class="col__item col__item--bottom" />
        </div>

        <div class="col col--right">
          <FireOverviewIntegrityPanel class="col__item col__item--top" />
          <FireOverviewPassivePanel class="col__item col__item--bottom" />
        </div>

        <!-- 模型区悬浮控件：场景光线切换（上）+ 建筑导航（下）。
             顶边与右列首卡「消防设备完好率」对齐，右缘距该卡 16px。 -->
        <div class="ebike-v2__scene-tools">
          <EbikeV2TimeSwitch />
          <EbikeV2PoiToggle />
        </div>
      </div>
    </main>

    <!-- ===== 小安助手：页内浮层（不跳转路由，深色工作台直接嵌在本页） ===== -->
    <EbikeV2AgentPanel v-if="agentOpen" @close="closeAgent" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import './components/ebike-v2/ebike-v2-fonts.css'
import EbikeV2Header from './components/ebike-v2/EbikeV2Header.vue'
import EbikeV2CampusModel from './components/ebike-v2/EbikeV2CampusModel.vue'
import FireOverviewStatusBar from './components/ebike-v2/fire/FireOverviewStatusBar.vue'
import FireOverviewAlarmPanel from './components/ebike-v2/fire/FireOverviewAlarmPanel.vue'
import FireOverviewIntegrityPanel from './components/ebike-v2/fire/FireOverviewIntegrityPanel.vue'
import FireOverviewAssurancePanel from './components/ebike-v2/fire/FireOverviewAssurancePanel.vue'
import FireOverviewPassivePanel from './components/ebike-v2/fire/FireOverviewPassivePanel.vue'
import EbikeV2TimeSwitch from './components/ebike-v2/EbikeV2TimeSwitch.vue'
import EbikeV2PoiToggle from './components/ebike-v2/EbikeV2PoiToggle.vue'
import EbikeV2AgentPanel from './components/ebike-v2/EbikeV2AgentPanel.vue'
import { provideCampusModel, type CampusModelApi } from './components/ebike-v2/useCampusModel'

/** 模型实例：模型区悬浮控件（建筑导航 / 昼夜切换）通过 provide/inject 取用 */
const campusRef = ref<CampusModelApi | null>(null)
provideCampusModel(campusRef)

/** ===== 顶栏导航 ===== */
const activeNavIndex = ref(0)
const agentOpen = ref(false)

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

/* 态势条 + 两列模块；容器整体不吃指针事件，中间留空处可交互三维模型 */
.ebike-v2__content {
  position: absolute;
  top: vh(86); left: 0; right: 0; bottom: vh(16);
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 0 vw(16);
  pointer-events: none;
}

/* 通栏态势条 */
.ebike-v2__statusbar {
  flex-shrink: 0;
  height: vh(64);
  margin-bottom: vh(16);
  pointer-events: auto;
}

/* 两列 */
.ebike-v2__cols {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: space-between;
}

/* 模型区悬浮控件组（场景光线切换 + 建筑导航）。
   挂在两列容器上：top:0 即两列顶边，与右列首卡「消防设备完好率」顶边天然对齐，
   状态条高度变化时无需改数值；right 取「右列宽 468 + 间距 16」，落在模型区、紧贴该卡左侧。
   组宽固定 244（与下方建筑导航弹窗同宽）：开关与按钮左缘都对齐 1176，
   弹窗从按钮正下方展开时左右缘与本组完全重合。 */
.ebike-v2__scene-tools {
  position: absolute;
  top: 0;
  right: calc(vw(468) + vw(16));
  width: vw(244);
  z-index: 11;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: vh(12);
  pointer-events: auto;
}

.col {
  display: flex; flex-direction: column; gap: vh(16);
  min-height: 0;
  width: vw(468); flex-shrink: 0;
  pointer-events: auto;
}

/* 每列两个模块：上 52% / 下 48% */
.col__item { min-height: 0; }
.col__item--top { flex: 52 1 0; }
.col__item--bottom { flex: 48 1 0; }
</style>
