<template>
  <div class="bigscreen-header">
    <!-- ===== Layer 0: 左右背景填充 ===== -->
    <div class="header-bg-left" />
    <div class="header-bg-right" />

    <!-- ===== Layer 1: 中部装饰叠加图形 ===== -->
    <img
      class="overlay-center-1"
      src="@/assets/bigscreen/overlay-center-1.svg"
      alt=""
    />
    <img
      class="overlay-center-2"
      src="@/assets/bigscreen/overlay-center-2.svg"
      alt=""
    />
    <img
      class="overlay-center-3"
      src="@/assets/bigscreen/overlay-center-3.svg"
      alt=""
    />
    <img
      class="bottom-glow"
      src="@/assets/bigscreen/bottom-glow.svg"
      alt=""
    />

    <!-- ===== Layer 2: 左侧天气 + 时间 ===== -->
    <div class="weather-area">
      <slot name="weather">
        <div class="time-info">
          <p class="time-text">{{ timeStr }}</p>
          <p class="date-text">{{ dateStr }}</p>
        </div>
        <div class="weather-icon">
          <img
            src="@/assets/bigscreen/weather_icon.svg"
            alt=""
          />
        </div>
      </slot>
    </div>

    <!-- ===== Layer 3: 右侧用户信息 ===== -->
    <div class="user-area">
      <slot name="user">
        <div class="user-text">
          <p class="user-name">{{ username }}</p>
        </div>
      </slot>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-avatar">
          <img
            src="@/assets/bigscreen/avatar.svg"
            alt="用户头像"
          />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="voice">语音播报</el-dropdown-item>
            <el-dropdown-item command="alarm">告警弹窗</el-dropdown-item>
            <el-dropdown-item command="backend" divided>管理后台</el-dropdown-item>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- ===== Layer 4: 底部边线 ===== -->
    <img
      class="bottom-line left-line"
      src="@/assets/bigscreen/line-left.svg"
      alt=""
    />
    <img
      class="bottom-line right-line"
      src="@/assets/bigscreen/line-right.svg"
      alt=""
    />

    <!-- ===== Layer 5: 平台标题 ===== -->
    <div class="header-center">
      <slot name="title">
        <p class="platform-title">{{ title }}</p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 大标题 / 顶部导航栏组件
 *
 * Figma 组件集: 大标题 (11 variants)
 * 当前使用: Property 1=5 (完整版 1920×86)
 */
const props = withDefaults(defineProps<{
  /** 平台标题, 默认 "港南区"人工智能+安全自律"监管平台" */
  title?: string
  /** 用户名 */
  username?: string
}>(), {
  title: '港南区“人工智能+安全自律”监管平台',
  username: '用户名',
})

const timeStr = ref('')
const dateStr = ref('')

let timer: ReturnType<typeof setInterval>

function updateTime(): void {
  const now = new Date()
  timeStr.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  dateStr.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function handleCommand(command: string): void {
  switch (command) {
    case 'backend':
      window.open('/workbench', '_blank')
      break
    case 'voice':
    case 'alarm':
    case 'logout':
      // 装饰项，暂无功能
      break
  }
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
/* ===== 容器 ===== */
.bigscreen-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: calc(86 * var(--h));
  z-index: 100;
  pointer-events: auto;
}

/* ===== Layer 0: 左右背景渐变 ===== */
.header-bg-left {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(960 * var(--w));
  height: calc(86 * var(--h));
  background: linear-gradient(180deg, #03448F 0%, #02387B 100%);
}
.header-bg-right {
  position: absolute;
  left: calc(960 * var(--w));
  top: 0;
  width: calc(960 * var(--w));
  height: calc(86 * var(--h));
  background: linear-gradient(180deg, #03448F 0%, #02387B 100%);
}

/* ===== Layer 1: 中部装饰叠加图形 ===== */
.overlay-center-1 {
  position: absolute;
  left: calc(388 * var(--w));
  top: 0;
  width: calc(1144 * var(--w));
  height: calc(59 * var(--h));
  pointer-events: none;
}
.overlay-center-2 {
  position: absolute;
  left: calc(428 * var(--w));
  top: 0;
  width: calc(1064 * var(--w));
  height: calc(60 * var(--h));
  pointer-events: none;
}
.overlay-center-3 {
  position: absolute;
  left: calc(456 * var(--w));
  top: 0;
  width: calc(1008 * var(--w));
  height: calc(86 * var(--h));
  pointer-events: none;
}
.bottom-glow {
  position: absolute;
  left: calc(721 * var(--w));
  top: calc(80 * var(--h));
  width: calc(478 * var(--w));
  height: calc(7 * var(--h));
  pointer-events: none;
}

/* ===== Layer 2: 左侧天气区 ===== */
.weather-area {
  position: absolute;
  left: calc(15 * var(--w));
  top: calc(14 * var(--h));
  display: flex;
  align-items: flex-start;
  gap: calc(11 * var(--w));
}
.time-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding: calc(2 * var(--h)) 0;
  width: calc(95 * var(--w));
}
.time-text {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(9px, calc(14 * var(--min-scale)), 18px);
  font-weight: normal;
  color: #fff;
  text-align: right;
  margin: 0;
  line-height: normal;
  white-space: nowrap;
}
.date-text {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(9px, calc(14 * var(--min-scale)), 18px);
  font-weight: normal;
  color: #fff;
  text-align: right;
  margin: 0;
  line-height: normal;
  white-space: nowrap;
}
/* 等比元素：天气图标 */
.weather-icon {
  position: relative;
  width: calc(36 * var(--min-scale));
  height: calc(36 * var(--min-scale));
  flex-shrink: 0;
  overflow: hidden;
}
.weather-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.weather-layer {
  position: absolute;
  display: block;
  pointer-events: none;
  max-width: 100%;
  max-height: 100%;
}
/* Cloud — 顶部大云朵 */
.weather-cloud {
  left: 50%;
  right: 2.46%;
  bottom: 47.92%;
  top: 4.55%;
  width: auto;
  height: auto;
  transform: translateX(-50%);
}
/* Sun rays — 中间光芒 */
.weather-sun {
  left: 4.17%;
  right: 4.17%;
  top: 18.75%;
  bottom: 14.58%;
  width: auto;
  height: auto;
}
/* Rain drops — 底部雨滴 */
.weather-rain {
  left: 35.42%;
  right: 33.33%;
  top: 77.08%;
  bottom: 4.17%;
  width: auto;
  height: auto;
}

/* ===== Layer 3: 右侧用户区 ===== */
.user-area {
  position: absolute;
  left: calc(1744 * var(--w));
  top: calc(10 * var(--h));
  display: flex;
  align-items: flex-start;
  gap: calc(11 * var(--w));
  height: calc(46 * var(--h));
}
.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: calc(2 * var(--h)) 0;
  width: calc(95 * var(--w));
  height: 100%;
}
.user-name {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 20px);
  font-weight: normal;
  color: #fff;
  text-align: right;
  margin: 0;
  line-height: normal;
  white-space: nowrap;
}
/* 等比元素：头像 */
.user-avatar {
  width: calc(44 * var(--min-scale));
  height: calc(44 * var(--min-scale));
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  border-radius: 50%;
}
.user-avatar img {
  display: block;
  width: 100%;
  height: 100%;
}

/* ===== Layer 4: 底部边线 ===== */
.bottom-line {
  position: absolute;
  height: calc(11 * var(--h));
  pointer-events: none;
}
.left-line {
  left: calc(1 * var(--w));
  top: calc(65 * var(--h));
  width: calc(495 * var(--w));
}
.right-line {
  left: calc(1425 * var(--w));
  top: calc(65 * var(--h));
  width: calc(495 * var(--w));
  transform: scaleX(-1);
}

/* ===== Layer 5: 平台标题 ===== */
.header-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: calc(889 * var(--w));
  text-align: center;
}
.platform-title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(22px, calc(36 * var(--min-scale)), 44px);
  font-weight: 900;
  background: linear-gradient(to bottom, #fff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: calc(43 * var(--h));
}
</style>
