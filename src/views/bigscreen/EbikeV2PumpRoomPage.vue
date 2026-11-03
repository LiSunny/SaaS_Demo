<template>
  <div class="pump-page" :style="{ background: BIGSCREEN_CAMPUS_BG }">
    <!-- ===== ① 底层：三维泵房模型铺满全屏 ===== -->
    <PumpRoomScene ref="sceneRef" />

    <!-- ===== ② 顶层：顶栏 ===== -->
    <EbikeV2Header :active-index="0" />

    <!-- ===== ③ 顶层：悬浮层（指标卡 + 详情列 + 返回） ===== -->
    <main class="pump-page__overlay">
      <!-- 顶部一排汇总指标卡 -->
      <div class="pump-page__top">
        <PumpRoomMetricCard
          v-for="m in metrics"
          :key="m.key"
          class="pump-page__metric"
          :metric="m"
          :show-trend="m.trend.length > 1"
        />
      </div>

      <!-- 右侧一列设备详情 -->
      <div class="pump-page__side">
        <PumpRoomDeviceDetail :groups="groups" @select="focusPoi" />
      </div>

      <!-- 返回总览 -->
      <button type="button" class="pump-page__back" title="返回校园总览" @click="goBack">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span>返回总览</span>
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 水泵房场景监控（二级专题页）
 *
 * 版式：三维泵房模型铺底，指标卡与详情列悬浮其上 ——
 * 与总览页「三维校园模型铺底、四个模块悬浮」的范式一致，不是左右分栏。
 *
 * 数据口径：
 *   水罐液位 / 水泵 / 控制柜 / 阀门 → 平台实时（config/firewater-scene.ts）
 *   环境温湿度 / 水浸                → 本地演示数据（平台档案侧无此设备类）
 * 两者在页面上分开标注，不混为一谈。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useSubsystemStore } from '@/stores/subsystem'
import EbikeV2Header from './components/ebike-v2/EbikeV2Header.vue'
import PumpRoomScene from './components/ebike-v2/pump/PumpRoomScene.vue'
import PumpRoomMetricCard from './components/ebike-v2/pump/PumpRoomMetricCard.vue'
import PumpRoomDeviceDetail from './components/ebike-v2/pump/PumpRoomDeviceDetail.vue'
import { buildPumpDeviceGroups, buildPumpMetrics } from './components/ebike-v2/pump/pump-room-data'
import { BIGSCREEN_CAMPUS_BG } from './components/ebike-v2/campusTheme'
import './components/ebike-v2/ebike-v2-fonts.css'

const router = useRouter()
const route = useRoute()

/** 三维场景句柄（用于点详情聚焦设备） */
const sceneRef = ref<InstanceType<typeof PumpRoomScene> | null>(null)

/**
 * 平台实时点位
 *
 * 与消防水系统监测页同一套 store 与刷新节奏；
 * 页面离开即停刷新（否则定时器在后台空转）。
 */
const subsystem = useSubsystemStore()
const { points } = storeToRefs(subsystem)

/** 顶部指标卡数据 */
const metrics = computed(() => buildPumpMetrics(points.value, subsystem.getRuntime))

/** 右侧设备详情分组 */
const groups = computed(() => buildPumpDeviceGroups(points.value, subsystem.getRuntime))

/** 点详情行 → 三维模型聚焦对应设备 */
function focusPoi(poiId: string) {
  sceneRef.value?.focusPoi(poiId)
}

/** 返回总览（保留 bigscreenId，不丢大屏记录上下文） */
function goBack() {
  router.push({
    path: '/landing/ebike-v2',
    query: route.query.bigscreenId ? { bigscreenId: route.query.bigscreenId } : {},
  })
}

/** Esc 返回总览 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') goBack()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  subsystem.loadSubsystem('pipeline')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  // 与消防水系统监测页、总览页同一套生命周期：离开即停刷新
  subsystem.stopTimer()
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./components/ebike-v2/fire/fire-common.scss" as fire;

.pump-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 底色与总览页三维模型背景一致（导航页统一底色单一来源） */
  background: #00437a;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  /* 消防面板的主题变量：文字色阶 + 异常红，各卡片共用同一份 */
  @include fire.fire-theme;
}

/**
 * 悬浮层
 *
 * 容器不吃指针事件（pointer-events: none），
 * 让指标卡与详情列之间的空隙仍然可以旋转三维模型；
 * 卡片自身恢复 auto（见 .pump-page__metric / .pump-page__side）。
 */
.pump-page__overlay {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
}

/* ===== 顶部一排指标卡 ===== */
.pump-page__top {
  position: absolute;
  top: vh(16);
  left: vw(16);
  /* 右侧给详情列留出 380 + 16 的位置，指标卡不压到它 */
  right: calc(vw(380) + vw(16) * 2);
  display: flex;
  gap: vw(12);
  pointer-events: none;
}

.pump-page__metric {
  flex: 1;
  min-width: 0;
  pointer-events: auto;
}

/* ===== 右侧详情列 ===== */
.pump-page__side {
  position: absolute;
  right: vw(16);
  top: vh(16);
  width: vw(380);
  /* 底部留白，给三维场景的视图控件让位（控件在左下角，不冲突） */
  bottom: vh(16);
  pointer-events: auto;
}

/* ===== 返回按钮 ===== */
/* 放在左下角、视图控件（left: vw(16) / bottom: vh(16)）的上方，
   避开右侧详情列（right: vw(16) / bottom: vh(16)）—— 两者都贴边会叠在一起。 */
.pump-page__back {
  position: absolute;
  left: vw(16);
  bottom: calc(vh(16) + vh(28) + vh(8) + vh(24) + vh(8));
  display: flex;
  align-items: center;
  gap: vw(6);
  height: vh(30);
  padding: 0 vw(12);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(6, 24, 44, 0.78);
  color: rgba(200, 228, 255, 0.92);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.2s, color 0.2s;
}

.pump-page__back:hover {
  background: rgba(0, 92, 168, 0.85);
  color: #eaf6ff;
}
</style>
