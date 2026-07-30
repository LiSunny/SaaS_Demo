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
          <p class="user-name">{{ displayName }}</p>
        </div>
      </slot>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-avatar">
          <img
            :src="avatarUrl"
            alt="用户头像"
          />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-if="bigscreens && bigscreens.length > 1">
              <el-dropdown-item
                v-for="bs in bigscreens"
                :key="bs.id"
                :command="`switch:${bs.id}`"
                :class="{ 'is-active': bs.id === currentBigscreenId }"
              >
                <span class="screen-switch-item">
                  <span v-if="bs.id === currentBigscreenId" class="screen-check">✓</span>
                  <span v-else class="screen-check-placeholder" />
                  {{ bs.name }}
                </span>
              </el-dropdown-item>
              <el-dropdown-item divided command="backend">管理后台</el-dropdown-item>
            </template>
            <template v-else>
              <el-dropdown-item command="voice">语音播报</el-dropdown-item>
              <el-dropdown-item command="alarm">告警弹窗</el-dropdown-item>
              <el-dropdown-item command="backend" divided>管理后台</el-dropdown-item>
            </template>
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

<script setup>
import { avatarUrl } from '@/composables/useAvatar' lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'
import type { UserBigscreenItem } from '@/types/bigscreen'
import { getBigscreenRoute } from '@/config/bigscreen-templates'

/**
 * 大标题 / 顶部导航栏组件
 *
 * Figma 组件集: 大标题 (11 variants)
 * 当前使用: Property 1=5 (完整版 1920×86)
 */
const props = withDefaults(defineProps<{
  /** 平台标题 */
  title?: string
  /** 用户名 */
  username?: string
  /** 用户可用大屏列表（多屏切换） */
  bigscreens?: UserBigscreenItem[]
  /** 当前大屏 ID */
  currentBigscreenId?: number
}>(), {
  title: '\u6E2F\u5357\u533A\u201C\u4EBA\u5DE5\u667A\u80FD+\u5B89\u5168\u81EA\u5F8B\u201D\u76D1\u7BA1\u5E73\u53F0',
  username: '',
  bigscreens: () => [],
  currentBigscreenId: 0,
})

const router = useRouter()
const userStore = useUserStore()
const { confirmLogout } = useConfirm()

const displayName = computed(() => props.username || userStore.user?.realName || '')
const avatarUrl = computed(() => {
  const u = userStore.user
  return u?.avatar || avatarUrl(u?.realName || 'default')
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

async function handleLogout(): Promise<void> {
  try {
    await confirmLogout()
  } catch { return }
  userStore.logout()
  router.replace('/login')
}

function handleCommand(command: string): void {
  if (command.startsWith('switch:')) {
    const bigscreenId = Number(command.slice(7))
    const target = props.bigscreens?.find(bs => bs.id === bigscreenId)
    if (target) {
      window.location.href = getBigscreenRoute(target.type, target.id)
    }
    return
  }
  switch (command) {
    case 'backend':
      window.open('/workbench', '_blank')
      break
    case 'logout':
      handleLogout()
      break
    case 'voice':
    case 'alarm':
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

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 容器 ===== */
.bigscreen-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: vh(70);
  z-index: 100;
  pointer-events: auto;
}

/* ===== Layer 0: 左右背景渐变 ===== */
.header-bg-left {
  position: absolute;
  left: 0;
  top: 0;
  width: vw(960);
  height: vh(70);
  background: linear-gradient(180deg, #03448F 0%, #02387B 100%);
}
.header-bg-right {
  position: absolute;
  left: vw(960);
  top: 0;
  width: vw(960);
  height: vh(70);
  background: linear-gradient(180deg, #03448F 0%, #02387B 100%);
}

/* ===== Layer 1: 中部装饰叠加图形 ===== */
.overlay-center-1 {
  position: absolute;
  left: vw(388);
  top: 0;
  width: vw(1144);
  height: vh(59);
  pointer-events: none;
}
.overlay-center-2 {
  position: absolute;
  left: vw(428);
  top: 0;
  width: vw(1064);
  height: vh(60);
  pointer-events: none;
}
.overlay-center-3 {
  position: absolute;
  left: vw(456);
  top: 0;
  width: vw(1008);
  height: vh(70);
  pointer-events: none;
}
.bottom-glow {
  position: absolute;
  left: vw(721);
  top: vh(64);
  width: vw(478);
  height: vh(7);
  pointer-events: none;
}

/* ===== Layer 2: 左侧天气区 ===== */
.weather-area {
  position: absolute;
  left: vw(15);
  top: vh(14);
  display: flex;
  align-items: flex-start;
  gap: vw(11);
}
.time-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding: vh(2) 0;
  width: vw(95);
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
  left: vw(1744);
  top: vh(10);
  display: flex;
  align-items: flex-start;
  gap: vw(11);
  height: vh(46);
}
.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: vh(2) 0;
  width: vw(95);
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
  height: vh(11);
  pointer-events: none;
}
.left-line {
  left: vw(1);
  top: vh(60);
  width: vw(495);
}
.right-line {
  left: vw(1425);
  top: vh(60);
  width: vw(495);
  transform: scaleX(-1);
}

/* ===== Layer 5: 平台标题 ===== */
.header-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: vw(889);
  text-align: center;
}
.platform-title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(22px, calc(32 * var(--min-scale)), 34px);
  font-weight: 900;
  background: linear-gradient(to bottom, #fff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: vh(43);
}

/* ===== 大屏切换菜单项 ===== */
.screen-switch-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.screen-check {
  color: #3cd3d7;
  font-weight: 700;
}

.screen-check-placeholder {
  display: inline-block;
  width: 12px;
}
</style>
