<template>
  <!-- 页内浮层：覆盖顶栏以下的大屏区域，嵌入深色小安工作台（不跳转路由） -->
  <Teleport to="body">
    <div class="agent-panel" :style="{ background: pageBg }">
      <!-- 工作台本体：嵌入模式铺满浮层，强制深色；底色 = 三维模型背景色；
           关闭按钮在工作台标题栏内；右栏（调用时间线 / 产物）默认折叠 -->
      <AgentWorkbench
        embedded
        force-dark
        closable
        default-right-collapsed
        :style="{ '--embed-page-bg': pageBg }"
        @close="emit('close')"
      />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AgentWorkbench from '@/views/agent/AgentWorkbench.vue'
import { BIGSCREEN_CAMPUS_BG } from './campusTheme'

const emit = defineEmits<{ (e: 'close'): void }>()

/** 导航页底色：与总览页三维模型背景一致 */
const pageBg = BIGSCREEN_CAMPUS_BG

/** Esc 关闭浮层 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 浮层：固定在顶栏之下，铺满其余区域 */
.agent-panel {
  position: fixed;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10002;              /* 高于悬浮小安机器人（9999）与浮动聊天层（9998） */
}
</style>
