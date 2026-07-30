<template>
  <div class="ebike-bigscreen">
    <EbikeMonitorHeader />

    <div class="ebike-content">
      <!-- ===== 左列 468px ===== -->
      <div class="col-left">
        <DutyCompliance />
        <HazardHandling />
        <PlatformInfo />
      </div>

      <!-- ===== 中列 flex:1 ===== -->
      <div class="col-center">
        <StatCardRow />
        <MapWithMarkers />
        <ChargingStationStats />
      </div>

      <!-- ===== 右列 468px ===== -->
      <div class="col-right">
        <FireAlarmLinkage />
        <EnterpriseMonitor />
        <EmergencyPlan />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EbikeMonitorHeader from './components/ebike/EbikeMonitorHeader.vue'
import DutyCompliance from './components/ebike/DutyCompliance.vue'
import HazardHandling from './components/ebike/HazardHandling.vue'
import PlatformInfo from './components/ebike/PlatformInfo.vue'
import StatCardRow from './components/ebike/StatCardRow.vue'
import MapWithMarkers from './components/ebike/MapWithMarkers.vue'
import ChargingStationStats from './components/ebike/ChargingStationStats.vue'
import FireAlarmLinkage from './components/ebike/FireAlarmLinkage.vue'
import EnterpriseMonitor from './components/ebike/EnterpriseMonitor.vue'
import EmergencyPlan from './components/ebike/EmergencyPlan.vue'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ebike-bigscreen {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden;
  background: #003768;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.ebike-content {
  position: absolute;
  top: vh(86);
  left: 0; right: 0; bottom: vh(16);
  display: flex; gap: vw(16);
  padding: 0 vw(16);
}

.col-left, .col-right {
  width: vw(468); flex-shrink: 0;
  display: flex; flex-direction: column; gap: vh(16);
}

.col-center {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: vh(16);
}
</style>

<style>
.ebike-bigscreen *::-webkit-scrollbar { -webkit-appearance: none; width: 4px; height: 4px; }
.ebike-bigscreen *::-webkit-scrollbar-track { background: transparent; }
.ebike-bigscreen *::-webkit-scrollbar-thumb { background: rgba(71,132,232,0.2); border-radius: 2px; }
.ebike-bigscreen * { scrollbar-width: thin; scrollbar-color: rgba(71,132,232,0.2) transparent; }
</style>
