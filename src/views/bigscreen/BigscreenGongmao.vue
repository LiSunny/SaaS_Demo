<template>
  <div class="bigscreen">
    <!-- 顶部导航条 -->
    <GongmaoHeader
      :bigscreens="bigscreens"
      :current-relation-id="currentRelationId"
    />

    <!-- 内容区：三列布局 -->
    <div class="bigscreen-content">
      <!-- 左侧列：压实车间/电气设备填充上方，应急安全文化建设完整显示在最下方 -->
      <div class="col-left">
        <GongmaoWorkshopDuty class="col-left-fill" />
        <GongmaoRiskUnitDuty class="col-left-fill" />
        <GongmaoSafetyManagement class="col-left-fixed" />
      </div>

      <!-- 中间列 -->
      <div class="col-center">
        <GongmaoRiskInspection />
        <GongmaoDeviceMaintenance />
      </div>

      <!-- 右侧列 -->
      <div class="col-right">
        <GongmaoAiAssistant />
        <GongmaoRiskApproval />
        <GongmaoFireLedger />
        <GongmaoSecurityWatch />
      </div>
    </div>

    <!-- 左侧边装饰 (Figma: Component 17, 41×795px at x=0 y=149) -->
    <img class="side-deco-left" src="@/assets/bigscreen/gongmao-side-deco.svg" alt="" />
    <!-- 右侧边装饰 (Figma: 镜像) -->
    <img class="side-deco-right" src="@/assets/bigscreen/gongmao-side-deco.svg" alt="" />

    <!-- 底部装饰 (Figma: 1920×21px at y=1059) -->
    <img class="bottom-deco" src="@/assets/bigscreen/gongmao-bottom-deco.svg" alt="" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import GongmaoHeader from './components/gongmao/GongmaoHeader.vue'
import GongmaoWorkshopDuty from './components/gongmao/GongmaoWorkshopDuty.vue'
import GongmaoRiskUnitDuty from './components/gongmao/GongmaoRiskUnitDuty.vue'
import GongmaoSafetyManagement from './components/gongmao/GongmaoSafetyManagement.vue'
import GongmaoRiskInspection from './components/gongmao/GongmaoRiskInspection.vue'
import GongmaoDeviceMaintenance from './components/gongmao/GongmaoDeviceMaintenance.vue'
import GongmaoAiAssistant from './components/gongmao/GongmaoAiAssistant.vue'
import GongmaoRiskApproval from './components/gongmao/GongmaoRiskApproval.vue'
import GongmaoFireLedger from './components/gongmao/GongmaoFireLedger.vue'
import GongmaoSecurityWatch from './components/gongmao/GongmaoSecurityWatch.vue'
import { getUserBigscreens } from '@/api/bigscreen'
import type { UserBigscreenItem } from '@/types/bigscreen'

const router = useRouter()
const route = useRoute()
const bigscreens = ref<UserBigscreenItem[]>([])
const currentRelationId = ref(0)
const currentBigscreenId = ref(Number(route.query.bigscreenId) || 0)

onMounted(async () => {
  const qId = Number(route.query.bigscreenId)
  if (qId) currentBigscreenId.value = qId

  try {
    const screens = await getUserBigscreens()
    if (!screens || screens.length === 0) {
      router.replace('/workbench')
      return
    }
    bigscreens.value = screens
    const current = screens.find(s => s.id === currentBigscreenId.value)
      || screens.find(s => s.isDefault)
      || screens[0]
    currentRelationId.value = current.relationId
    currentBigscreenId.value = current.id
  } catch {
    router.replace('/workbench')
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(86.83% 85.05% at 50% 27.59%, #0039A2 0%, #023086 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 内容区：三列等宽布局 ===== */
.bigscreen-content {
  position: absolute;
  top: vh(149);
  left: 0;
  right: 0;
  bottom: vh(21);
  display: flex;
  gap: vw(16);
  padding: 0 vw(74);
}

/* ===== 三列统一：等宽 574px，高度 100% ===== */
.col-left,
.col-center,
.col-right {
  width: vw(574);
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* 左侧列：应急安全文化建设完整显示，其余两个模块填充剩余空间 */
.col-left-fixed {
  flex-shrink: 0;
}

.col-left-fill {
  flex: 1;
  min-height: 0;
}

/* ===== 侧边装饰 (Figma: Component 17, 41×795px) ===== */
.side-deco-left {
  position: absolute;
  left: 0;
  top: vh(149);
  width: vw(41);
  height: vh(795);
  pointer-events: none;
}
.side-deco-right {
  position: absolute;
  right: 0;
  top: vh(170);
  width: vw(41);
  height: vh(795);
  pointer-events: none;
  transform: scaleX(-1);
}

/* ===== 底部装饰 (Figma: 1920×21px at y=1059) ===== */
.bottom-deco {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100vw;
  height: vh(21);
  pointer-events: none;
}
</style>
