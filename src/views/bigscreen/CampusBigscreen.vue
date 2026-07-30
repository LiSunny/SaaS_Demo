<template>
  <div class="campus-bigscreen">
    <!-- 顶部 Header -->
    <CampusHeader />

    <!-- 三列内容区 -->
    <div class="campus-content">
      <!-- ===== 左列 ===== -->
      <div class="col-left">
        <!-- 模块1: 主体安全履责尽责 -->
        <CampusSection
          title="主体安全履责尽责"
          subtitle="Traceability of Responsibility"
        >
          <CampusSafetyDuty />
        </CampusSection>

        <!-- 模块2: 上报隐患处置反馈 -->
        <CampusSection
          title="上报隐患处置反馈"
          subtitle="Potential Hazard Reporting"
        >
          <CampusHazardReport />
        </CampusSection>

        <!-- 模块3: 学生欺凌防范行动 -->
        <CampusSection
          title="学生欺凌防范行动"
          subtitle="Bullying Prevention"
        >
          <CampusBullyingPrevention />
        </CampusSection>
      </div>

      <!-- ===== 中列 ===== -->
      <div class="col-center">
        <!-- 模块4: 校园AI防欺凌告警 -->
        <CampusSection
          title="校园AI防欺凌告警"
          subtitle="Bullying Alarm"
        >
          <CampusBullyingAlarm />
        </CampusSection>

        <!-- 模块5+6: 电消安全隐患巡检 + AI赋能场景应用 -->
        <div class="center-bottom-row">
          <CampusSection
            title="电消安全隐患巡检"
            subtitle=""
          >
            <CampusElecFireInspect />
          </CampusSection>
          <CampusSection
            title="AI赋能场景应用"
            subtitle=""
          >
            <CampusAiAssistant />
          </CampusSection>
        </div>
      </div>

      <!-- ===== 右列 ===== -->
      <div class="col-right">
        <!-- 模块7: 警情事件每日清零 -->
        <CampusSection
          title="警情事件每日清零"
          subtitle="Alarm Event"
        >
          <CampusAlarmDaily />
        </CampusSection>

        <!-- 模块8: 校园食品安全检查 -->
        <CampusSection
          title="校园食品安全检查"
          subtitle="Food Safety Inspection"
        >
          <CampusFoodSafety />
        </CampusSection>

        <!-- 模块9: 安消报警联动救援 -->
        <CampusSection
          title="安消报警联动救援"
          subtitle="Safety and Fire"
        >
          <CampusAlarmRescue />
        </CampusSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CampusHeader from './components/campus/CampusHeader.vue'
import CampusSection from './components/campus/CampusSection.vue'
import CampusSafetyDuty from './components/campus/CampusSafetyDuty.vue'
import CampusHazardReport from './components/campus/CampusHazardReport.vue'
import CampusBullyingPrevention from './components/campus/CampusBullyingPrevention.vue'
import CampusBullyingAlarm from './components/campus/CampusBullyingAlarm.vue'
import CampusElecFireInspect from './components/campus/CampusElecFireInspect.vue'
import CampusAiAssistant from './components/campus/CampusAiAssistant.vue'
import CampusAlarmDaily from './components/campus/CampusAlarmDaily.vue'
import CampusFoodSafety from './components/campus/CampusFoodSafety.vue'
import CampusAlarmRescue from './components/campus/CampusAlarmRescue.vue'
import './components/campus/campus-fonts.css'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 全屏容器 ===== */
.campus-bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(50% 50% at 50% 50%, #003F76 0%, #004683 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 三列内容区（设计稿：top=86, 左右padding=16, gap=16） ===== */
.campus-content {
  position: absolute;
  top: vh(80);
  left: 0;
  right: 0;
  bottom: vh(16);
  display: flex;
  gap: vw(16);
  padding: 0 vw(16);
}

/* ===== 列容器 ===== */
.col-left,
.col-right {
  width: vw(568);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

.col-center {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* ===== 左列：等比填充 ===== */
.col-left > * {
  flex: 1;
  min-height: 0;
}

/* ===== 右列：前两个等比填充，最后一个由内容撑起 ===== */
.col-right > :first-child,
.col-right > :nth-child(2) {
  flex: 1;
  min-height: 0;
}

.col-right > :last-child {
  flex: 0 0 auto;
  min-height: vh(194);
}

/* ===== 中列：上部占约 60%，下部占约 40% ===== */
.col-center > :first-child {
  flex: 1.62;
  min-height: 0;
}

/* ===== 中列底部双栏 ===== */
.center-bottom-row {
  display: flex;
  gap: vw(16);
  flex: 1;
  min-height: 0;
}

.center-bottom-row > :first-child {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.center-bottom-row > :last-child {
  flex: 0 0 38%;
  min-width: 0;
  overflow: hidden;
}

</style>
