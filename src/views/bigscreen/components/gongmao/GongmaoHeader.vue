<template>
  <div class="gongmao-header">
    <!-- Layer 0: 顶部装饰条 (Figma: 21px, 全宽) -->
    <img
      class="top-deco"
      src="@/assets/bigscreen/gongmao-top-deco.svg"
      alt=""
    />

    <!-- Layer 1: 大标题背景层 (Figma: Group 25, 1920×99.5px at y=28) -->
    <img
      class="title-bg-full"
      src="@/assets/bigscreen/gongmao-title-bg-full.svg"
      alt=""
    />

    <!-- Layer 2: 大标题中部叠加 (Figma: Group 27, 1180×56px at x=370 y=53) -->
    <img
      class="title-overlay"
      src="@/assets/bigscreen/gongmao-title-overlay.svg"
      alt=""
    />

    <!-- Layer 3: 大标题宽条 (Figma: Group 28, 1318×32.5px at x=301 y=54) -->
    <img
      class="title-group28"
      src="@/assets/bigscreen/gongmao-title-group28.svg"
      alt=""
    />

    <!-- Layer 4: Union 底部条 (Figma: 980×33px at x=470 y=94.5) -->
    <img
      class="title-union"
      src="@/assets/bigscreen/gongmao-title-union.svg"
      alt=""
    />

    <!-- Layer 5al: 左装饰 — 独立定位 -->
    <svg class="title-deco-left" viewBox="0 0 33 32" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.742 9.48L22.396 5.405C22.509 5.38 22.561 5.517 22.46 5.577L12.042 11.898C11.998 11.924 11.978 11.973 11.994 12.015L15.643 21.957C15.679 22.055 15.536 22.139 15.463 22.063L3.675 9.64C3.625 9.587 3.662 9.497 3.742 9.48Z" fill="url(#tdl-g3)"/>
      <path d="M20.804 12.804L32.136 9.075C32.239 9.041 32.315 9.173 32.234 9.245L26.233 14.561C26.207 14.585 26.195 14.62 26.201 14.654L27.695 22.727C27.714 22.833 27.575 22.891 27.514 22.802L20.753 12.956C20.716 12.901 20.741 12.825 20.804 12.804Z" fill="url(#tdl-g4)"/>
      <defs>
        <linearGradient id="tdl-g3" x1="3.2" y1="10.3" x2="17.8" y2="17.1" gradientUnits="userSpaceOnUse">
          <stop stop-color="#76C8FF"/><stop offset="1" stop-color="#1D689A"/>
        </linearGradient>
        <linearGradient id="tdl-g4" x1="20.5" y1="13.5" x2="29.8" y2="17" gradientUnits="userSpaceOnUse">
          <stop stop-color="#76C8FF"/><stop offset="1" stop-color="#1D689A"/>
        </linearGradient>
      </defs>
    </svg>
    <!-- Layer 5ar: 右装饰 — 独立定位，带投影 -->
    <svg class="title-deco-right" viewBox="0 0 43 32" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#tdr-shadow)">
        <path d="M42.489 9.478L23.835 5.403C23.722 5.378 23.67 5.515 23.771 5.575L34.189 11.896C34.233 11.922 34.253 11.971 34.237 12.014L30.588 21.955C30.552 22.053 30.695 22.138 30.768 22.061L42.555 9.639C42.606 9.585 42.569 9.495 42.489 9.478Z" fill="url(#tdr-g1)"/>
        <path d="M26.306 13.634L14.962 9.906C14.859 9.872 14.784 10.003 14.865 10.074L20.872 15.393C20.898 15.416 20.91 15.451 20.904 15.485L19.406 23.564C19.387 23.669 19.525 23.726 19.586 23.638L26.357 13.785C26.394 13.73 26.369 13.655 26.306 13.634Z" fill="url(#tdr-g2)"/>
      </g>
      <defs>
        <filter id="tdr-shadow" x="-10" y="-10" width="60" height="50" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feDropShadow dx="0" dy="1" stdDeviation="3.2" flood-color="#76DAFF" flood-opacity="0.25"/>
        </filter>
        <linearGradient id="tdr-g1" x1="43" y1="10.3" x2="28.4" y2="17.1" gradientUnits="userSpaceOnUse">
          <stop stop-color="#76C8FF"/><stop offset="1" stop-color="#1D689A"/>
        </linearGradient>
        <linearGradient id="tdr-g2" x1="26.7" y1="14.3" x2="17.3" y2="17.8" gradientUnits="userSpaceOnUse">
          <stop stop-color="#76C8FF"/><stop offset="1" stop-color="#1D689A"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Layer 5b: 标题下方呼吸动画椭圆 (Figma: 287×27 at x=816 y=96) — CSS blur 更可靠 -->
    <div class="breathing-ellipse">
      <div class="breathing-outer" />
      <div class="breathing-inner" />
    </div>

    <!-- Layer 5c: 标题文字 (Figma: YouSheBiaoTiHei 36px, white→#89b5ff) -->
    <p class="platform-title">"人工智能+企业安全"自律驾驶舱</p>

    <!-- Layer 5d: 对角装饰条 (Figma: Group 30, 1920×46px at y=28) — 放在最上层确保可见 -->
    <!-- 左半容器 (0-960px) -->
    <div class="accent-bar-wrap accent-bar-wrap-left">
      <div class="accent-fill" />
      <svg class="accent-bar-svg" viewBox="0 0 960 46" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- 底层对角斜线 -->
        <path d="M0 0L682.5 46L705.5 25.3H960" stroke="url(#accent-grad)" stroke-width="2"/>
        <!-- 流动亮线 — 虚线偏移动画沿斜线扫过 -->
        <path class="accent-sweep" d="M0 0L682.5 46L705.5 25.3H960"
              stroke="#7DE8FF" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="50 980" fill="none" filter="url(#accent-glow)"/>
        <defs>
          <linearGradient id="accent-grad" x1="0" y1="23" x2="960" y2="23" gradientUnits="userSpaceOnUse">
            <stop stop-color="#2665EB"/>
            <stop offset="1" stop-color="#2BC0FF"/>
          </linearGradient>
          <filter id="accent-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
          </filter>
        </defs>
      </svg>
    </div>
    <!-- 右半容器 (960-1920px) — 水平镜像 -->
    <div class="accent-bar-wrap accent-bar-wrap-right">
      <div class="accent-fill" />
      <svg class="accent-bar-svg" viewBox="0 0 960 46" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0L682.5 46L705.5 25.3H960" stroke="url(#accent-grad)" stroke-width="2"/>
        <path class="accent-sweep" d="M0 0L682.5 46L705.5 25.3H960"
              stroke="#7DE8FF" stroke-width="3" stroke-linecap="round"
              stroke-dasharray="50 980" fill="none" filter="url(#accent-glow)"/>
        <defs>
          <linearGradient id="accent-grad" x1="0" y1="23" x2="960" y2="23" gradientUnits="userSpaceOnUse">
            <stop stop-color="#2665EB"/>
            <stop offset="1" stop-color="#2BC0FF"/>
          </linearGradient>
          <filter id="accent-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
          </filter>
        </defs>
      </svg>
    </div>

    <!-- Layer 6: 左侧天气 + 时间 (Figma: x=18 y=56, DingTalk_JinBuTi 16px white) -->
    <div class="weather-area">
      <div class="time-info">
        <p class="time-text">{{ timeStr }}</p>
        <p class="date-text">{{ dateStr }}</p>
      </div>
      <div class="weather-icon">
        <img src="@/assets/bigscreen/weather_icon.svg" alt="" />
      </div>
    </div>

    <!-- Layer 7: 右侧用户信息 (Figma: x=1748 y=56, DingTalk_JinBuTi 16px white) -->
    <div class="user-area">
      <div class="user-text">
        <p class="user-name">{{ username }}</p>
      </div>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-avatar">
          <img src="@/assets/bigscreen/avatar.svg" alt="用户头像" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-if="bigscreens.length > 1">
              <el-dropdown-item
                v-for="bs in bigscreens"
                :key="bs.relationId"
                :command="`switch:${bs.relationId}`"
                :class="{ 'is-active': bs.relationId === currentRelationId }"
              >
                <span class="screen-switch-item">
                  <span v-if="bs.relationId === currentRelationId" class="screen-check">✓</span>
                  <span v-else class="screen-check-placeholder" />
                  {{ bs.name }}
                  <el-tag v-if="bs.isDefault" size="small" type="success" class="screen-default-tag">默认</el-tag>
                </span>
              </el-dropdown-item>
              <el-dropdown-item divided command="backend">管理后台</el-dropdown-item>
            </template>
            <template v-else>
              <el-dropdown-item command="backend">管理后台</el-dropdown-item>
            </template>
            <el-dropdown-item command="voice">语音播报</el-dropdown-item>
            <el-dropdown-item command="alarm">告警弹窗</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'
import type { UserBigscreenItem } from '@/types/bigscreen'
import { getBigscreenRoute } from '@/config/bigscreen-templates'

const props = withDefaults(defineProps<{
  bigscreens?: UserBigscreenItem[]
  currentRelationId?: number
}>(), {
  bigscreens: () => [],
  currentRelationId: 0,
})

const router = useRouter()
const userStore = useUserStore()
const { confirmLogout } = useConfirm()

const username = computed(() => userStore.user?.realName || '')

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
  try { await confirmLogout() } catch { return }
  userStore.logout()
  router.replace('/login')
}

function handleCommand(command: string): void {
  if (command.startsWith('switch:')) {
    const relationId = Number(command.slice(7))
    const target = props.bigscreens?.find(bs => bs.relationId === relationId)
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

.gongmao-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: vh(149);
  z-index: 100;
  pointer-events: auto;
}

/* ===== Layer 0: 顶部装饰条 (Figma: 21px) ===== */
.top-deco {
  position: absolute;
  left: 0;
  top: vh(7);
  width: 100vw;
  height: vh(21);
  pointer-events: none;
}

/* ===== Layer 1: 大标题全宽背景 (Figma: 1920×99.5 at y=28) ===== */
.title-bg-full {
  position: absolute;
  left: 0;
  top: vh(28);
  width: 100vw;
  height: vh(99.5);
  pointer-events: none;
}

/* ===== Layer 5d: 对角装饰条 (Figma: Group 30, 1920×46px at y=28) — 最上层 ===== */
/* 容器 — 定位 + 尺寸，右半水平镜像 */
.accent-bar-wrap {
  position: absolute;
  top: vh(28);
  width: 50vw;
  height: vh(46);
  pointer-events: none;
  overflow: visible;
}
.accent-bar-wrap-left {
  left: 0;
}
.accent-bar-wrap-right {
  left: 50vw;
  transform: scaleX(-1);
}
/* 渐变填充层 — CSS 控制，clip-path 裁切为斜线上方区域 */
.accent-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(2, 76, 171, 1) 0%,
    rgba(2, 76, 171, 1) 100%,
    rgba(26, 105, 209, 0.53) 40%
  );
  clip-path: polygon(0 0, 100% 0, 100% 55%, 73.5% 55%, 71.1% 100%);
  pointer-events: none;
}
/* 内联 SVG — 填满容器 */
.accent-bar-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* 流动亮线 — stroke-dashoffset 扫过路径 */
.accent-sweep {
  animation: sweep-flow 2.5s linear infinite;
}

@keyframes sweep-flow {
  0%   { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -1030; }
}

/* ===== Layer 2: 中部叠加 (Figma: 1180×56 at x=370 y=53) ===== */
.title-overlay {
  position: absolute;
  left: vw(370);
  top: vh(53);
  width: vw(1180);
  height: vh(56);
  pointer-events: none;
}

/* ===== Layer 3: 宽装饰条 (Figma: 1318×32.5 at x=301 y=54) ===== */
.title-group28 {
  position: absolute;
  left: vw(301);
  top: vh(54);
  width: vw(1318);
  height: vh(32.5);
  pointer-events: none;
}

/* ===== Layer 4: Union 底部条 (Figma: 980×33 at x=470 y=94.5) ===== */
.title-union {
  position: absolute;
  left: vw(470);
  top: vh(94.5);
  width: vw(980);
  height: vh(33);
  pointer-events: none;
}

/* ===== Layer 5a: 标题旁小装饰 — 左右对齐斜线拐点内侧 ===== */
/* ===== Layer 5a: 左右装饰 — 独立定位，改 left 即可微调 ===== */
.title-deco-left,
.title-deco-right {
  position: absolute;
  top: vh(72);
  height: vh(24.4);
  pointer-events: none;
  overflow: visible;
}
.title-deco-left {
  left: vw(710);
  width: vw(33);
}
.title-deco-right {
  left: vw(1180);
  width: vw(43);
}

/* ===== Layer 5b: 呼吸动画椭圆 (Figma: 287×27 at x=816 y=96) ===== */
.breathing-ellipse {
  position: absolute;
  left: vw(816);
  top: vh(96);
  width: vw(287);
  height: vh(27);
  pointer-events: none;
  overflow: visible;
}
/* 外层椭圆 — 白→青渐变光晕 (Figma Ellipse 2: rx=143.5 ry=9.5) */
.breathing-outer {
  position: absolute;
  left: 2.6%;
  top: 36.6%;
  width: 94.4%;
  height: 43.2%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(0, 255, 255, 0) 70%);
  filter: blur(4px);
  animation: breathing-pulse 2s ease-in-out infinite;
}
/* 内层椭圆 — 蓝→透明光晕 (Figma Ellipse 1: rx=100.5 ry=9.5) */
.breathing-inner {
  position: absolute;
  left: 16.8%;
  top: 18.4%;
  width: 66.1%;
  height: 43.2%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center,
    #92D3FF 0%,
    rgba(12, 159, 209, 0) 70%);
  filter: blur(4px);
  animation: breathing-pulse 2s ease-in-out 0.6s infinite;
}

@keyframes breathing-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.9); }
  50%      { opacity: 1;   transform: scale(1); }
}

/* ===== Layer 5c: 标题文字 (Figma: YouSheBiaoTiHei 36px Regular) ===== */
.platform-title {
  position: absolute;
  left: vw(698);
  top: vh(62);
  width: vw(525);
  height: vh(47);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(24px, calc(30 * var(--min-scale)), 36px);
  font-weight: 400;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  pointer-events: none;
}

/* ===== Layer 6: 左侧天气 + 时间 (Figma: x=18 y=56, DingTalk_JinBuTi 16px) ===== */
.weather-area {
  position: absolute;
  left: vw(18);
  top: vh(56);
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
.time-text,
.date-text {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #fff;
  text-align: right;
  margin: 0;
  line-height: normal;
  white-space: nowrap;
}
.weather-icon {
  position: relative;
  width: calc(48 * var(--min-scale));
  height: calc(48 * var(--min-scale));
  flex-shrink: 0;
  overflow: hidden;
}
.weather-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ===== Layer 7: 右侧用户 (Figma: x=1748 y=56, DingTalk_JinBuTi 16px) ===== */
.user-area {
  position: absolute;
  left: vw(1748);
  top: vh(56);
  display: flex;
  align-items: flex-start;
  gap: vw(11);
}
.user-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: vh(2) 0;
  width: vw(95);
}
.user-name {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #fff;
  text-align: right;
  margin: 0;
  line-height: normal;
  white-space: nowrap;
}
.user-avatar {
  width: calc(48 * var(--min-scale));
  height: calc(48 * var(--min-scale));
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

/* ===== 大屏切换下拉 ===== */
.screen-switch-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.screen-check {
  color: var(--color-success, #67c23a);
  font-weight: 700;
  width: 14px;
}
.screen-check-placeholder {
  width: 14px;
}
.screen-default-tag {
  margin-left: auto;
}
</style>
