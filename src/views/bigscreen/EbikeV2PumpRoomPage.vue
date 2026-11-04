<template>
  <div class="pump-page" :style="{ background: BIGSCREEN_CAMPUS_BG }">
    <!-- ===== ① 底层：三维泵房模型铺满全屏 ===== -->
    <PumpRoomScene />

    <!-- ===== ② 顶层：场景顶栏（左：标题牌 + 返回；无全局菜单与用户信息） ===== -->
    <PumpRoomHeader @back="goBack" />

    <!-- ===== ③ 顶层：悬浮层（右侧竖排实时指标卡） ===== -->
    <main class="pump-page__overlay">
      <div class="pump-page__side">
        <PumpRoomMetricCard
          v-for="m in metrics"
          :key="m.key"
          class="pump-page__metric"
          :metric="m"
          :show-trend="m.trend.length > 1"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 水泵房场景监控（二级专题页）
 *
 * 版式：三维泵房模型铺底，实时指标卡竖排浮在右侧 ——
 * 与总览页「三维校园模型铺底、四个模块悬浮」的范式一致，不是左右分栏。
 *
 * 顶栏是场景专用的 PumpRoomHeader：不带全局菜单，也不带右上角用户信息，
 * 只留场景标题牌（中文名 + 英文装饰 + 返回总览）。
 *
 * 数据口径：
 *   水罐液位 / 水泵 / 控制柜 → 平台实时（config/firewater-scene.ts）
 *   环境温湿度 / 水浸        → 本地演示数据（平台档案侧无此设备类）
 */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useSubsystemStore } from '@/stores/subsystem'
import PumpRoomHeader from './components/ebike-v2/pump/PumpRoomHeader.vue'
import PumpRoomScene from './components/ebike-v2/pump/PumpRoomScene.vue'
import PumpRoomMetricCard from './components/ebike-v2/pump/PumpRoomMetricCard.vue'
import { buildPumpMetrics } from './components/ebike-v2/pump/pump-room-data'
import { BIGSCREEN_CAMPUS_BG } from './components/ebike-v2/campusTheme'
import './components/ebike-v2/ebike-v2-fonts.css'

const router = useRouter()
const route = useRoute()

/**
 * 平台实时点位
 *
 * 与消防水系统监测页同一套 store 与刷新节奏；
 * 页面离开即停刷新（否则定时器在后台空转）。
 */
const subsystem = useSubsystemStore()
const { points } = storeToRefs(subsystem)

/** 右侧竖排的实时指标卡数据 */
const metrics = computed(() => buildPumpMetrics(points.value, subsystem.getRuntime))

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
  /* 底色与大屏整体底色一致（导航页统一底色单一来源） */
  background: #000d34;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  /* 消防面板的主题变量：文字色阶 + 异常红，各卡片共用同一份 */
  @include fire.fire-theme;
}

/**
 * 悬浮层
 *
 * 容器不吃指针事件（pointer-events: none），
 * 让指标卡之间的空隙仍然可以旋转三维模型；
 * 右侧指标列自身恢复 auto（见 .pump-page__side）。
 */
.pump-page__overlay {
  position: absolute;
  /* 场景顶栏比通用顶栏高，悬浮层要跟着往下让 */
  top: vh(90);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
}

/* ===== 右侧竖排实时指标卡 ===== */
.pump-page__side {
  position: absolute;
  right: vw(16);
  top: vh(16);
  width: vw(380);
  bottom: vh(16);
  /* 网格行等分：卡片按内容条数自适应张数，每张卡等高，
     卡片内部的分行交给卡片自己的 flex 撑开（.pm__chart 是 flex:1）。 */
  display: grid;
  grid-auto-rows: 1fr;
  gap: vh(10);
  pointer-events: auto;
}

.pump-page__metric {
  min-height: 0;
}
</style>
