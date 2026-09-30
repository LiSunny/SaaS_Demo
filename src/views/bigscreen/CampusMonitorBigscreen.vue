<!--
  CampusMonitorBigscreen
  港南教育局"人工智能+平安校园"监管平台
  设计稿节点：666:3550（页面根），666:3889（顶部），666:3643（三列内容）

  Tab 内容：
    overview  - 辖区态势概览（设计稿唯一完整稿）
    device    - 感知设备监测（待补稿）
    duty      - 履职态势感知（待补稿）
    supervise - 平安联勤督办（待补稿）
    report    - 平安校园报告（待补稿）
-->
<template>
  <div class="cm-bigscreen">
    <!-- 顶部栏 -->
    <CampusMonitorHeader v-model="activeTab" />

    <!-- 内容区：地图铺满底层，左右模块悬浮在上层 -->
    <main class="cm-content">
      <!-- ===== 底层：地图填满整个内容区 ===== -->
      <div class="cm-map-layer">
        <CampusMonitorMap />
      </div>

      <!-- ===== 左列悬浮层 ===== -->
      <div class="cm-col cm-col--left">
        <CampusMonitorSection title="安全态势感知" bg-variant="ov">
          <SafetyPerceptionPanel />
        </CampusMonitorSection>

        <CampusMonitorSection title="感知设备监测" bg-variant="mini">
          <DeviceMonitorPanel />
        </CampusMonitorSection>

        <CampusMonitorSection title="履职态势感知" bg-variant="mini">
          <DutyPerceptionPanel />
        </CampusMonitorSection>
      </div>

      <!-- ===== 右列悬浮层 ===== -->
      <div class="cm-col cm-col--right">
        <CampusMonitorSection title="平安联勤督办" bg-variant="ov">
          <SupervisePanel />
        </CampusMonitorSection>

        <CampusMonitorSection title="实时告警事件" bg-variant="mini">
          <AlarmPanel />
        </CampusMonitorSection>

        <CampusMonitorSection title="平安校园报告" bg-variant="mini">
          <ReportPanel />
        </CampusMonitorSection>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CampusMonitorHeader from './components/campus-monitor/CampusMonitorHeader.vue'
import CampusMonitorSection from './components/campus-monitor/CampusMonitorSection.vue'
import CampusMonitorMap from './components/campus-monitor/CampusMonitorMap.vue'

// 业务模块占位组件（先全部渲染，后续逐个替换为真实内容）
import SafetyPerceptionPanel from './components/campus-monitor/panels/SafetyPerceptionPanel.vue'
import DeviceMonitorPanel from './components/campus-monitor/panels/DeviceMonitorPanel.vue'
import DutyPerceptionPanel from './components/campus-monitor/panels/DutyPerceptionPanel.vue'
import SupervisePanel from './components/campus-monitor/panels/SupervisePanel.vue'
import AlarmPanel from './components/campus-monitor/panels/AlarmPanel.vue'
import ReportPanel from './components/campus-monitor/panels/ReportPanel.vue'

import './components/campus-monitor/campus-monitor-fonts.css'

// Tab 状态：'overview' 为完整稿，其他 4 个为占位
const activeTab = ref<string>('overview')
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.cm-bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(50% 50% at 50% 50%, #003F76 0%, #004683 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 内容区：地图铺满底层 + 左右模块悬浮 ===== */
.cm-content {
  position: absolute;
  top: vh(84);
  left: 0;
  right: 0;
  bottom: vh(12);
  /* 不再用 padding/gap，左右两列自带位置 */
}

/* 底层地图：铺满整个内容区（设计稿 top=84, bottom=12） */
.cm-map-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

/* 左右两列：绝对定位悬浮在地图两侧 */
.cm-col {
  position: absolute;
  top: vh(12);
  bottom: 0;
  width: vw(384);
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: vh(16);

  &--left {
    left: vw(12);
  }

  &--right {
    right: vw(12);
  }

  &--left > *,
  &--right > * {
    flex: 1;
    min-height: 0;
  }
}
</style>