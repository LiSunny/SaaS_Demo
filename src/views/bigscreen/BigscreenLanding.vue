<template>
  <div class="bigscreen">
    <!-- 顶部导航条 -->
    <BigscreenHeader />

    <!-- 内容区：三列布局 -->
    <div class="bigscreen-content">
      <!-- 左侧列 -->
      <div class="col-left">
        <ComplianceOverview />
        <RiskControl />
        <ChargingSafety />
      </div>

      <!-- 中间列 -->
      <div class="col-center">
        <div class="center-top">
          <CenterMap />
        </div>
        <div class="center-bottom">
          <HiddenDangerTable />
          <EmergencyPlan />
        </div>
      </div>

      <!-- 右侧列 -->
      <div class="col-right">
        <DailyChecklist />
        <RiskApproval />
        <EduSafety />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BigscreenHeader from './components/BigscreenHeader.vue'
import ComplianceOverview from './components/ComplianceOverview.vue'
import RiskControl from './components/RiskControl.vue'
import ChargingSafety from './components/ChargingSafety.vue'
import CenterMap from './components/CenterMap.vue'
import HiddenDangerTable from './components/HiddenDangerTable.vue'
import EmergencyPlan from './components/EmergencyPlan.vue'
import DailyChecklist from './components/DailyChecklist.vue'
import RiskApproval from './components/RiskApproval.vue'
import EduSafety from './components/EduSafety.vue'
</script>

<style scoped>

.bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(50% 50% at 50% 50%, #015EAF 0%, #02397C 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 内容区 ===== */
.bigscreen-content {
  position: absolute;
  top: calc(97 * var(--h));
  left: 0;
  right: 0;
  bottom: calc(16 * var(--h));
  display: flex;
  gap: calc(16 * var(--w));
  padding: 0 calc(16 * var(--w));
}

/* ===== 三列统一：高度 100%，子组件 flex 填充 ===== */
.col-left,
.col-right,
.col-center {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(16 * var(--h));
}

.col-left,
.col-right {
  width: calc(448 * var(--w));
  flex-shrink: 0;
}

.col-center {
  flex: 1;
  min-width: 0;
}

/* 左右列子组件等比填充 */
.col-left > *,
.col-right > * {
  flex: 1;
  min-height: 0;
}

/* 中间列：上部占 2 份，下部占 1 份（与左右列单个模块等高） */
.center-top {
  flex: 2;
  min-height: 0;
}

.center-bottom {
  display: flex;
  gap: calc(16 * var(--w));
  flex: 1;
  min-height: 0;
}

.center-bottom > * {
  flex: 1;
}
</style>
