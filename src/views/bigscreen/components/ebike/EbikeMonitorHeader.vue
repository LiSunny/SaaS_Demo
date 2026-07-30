<template>
  <div class="ebike-header">
    <!-- Layer 0: 渐变背景 -->
    <div class="header-bg" />

    <!-- Layer 1: 左侧装饰 SVG（Figma Union 279×64） -->
    <img class="header-left-decor" src="@/assets/bigscreen/ebike-header-left.svg" alt="" />

    <!-- Layer 2: 右侧装饰 SVG（Figma Union 332×64） -->
    <img class="header-right-decor" src="@/assets/bigscreen/ebike-header-right.svg" alt="" />

    <!-- Layer 3: 底部分隔线（Figma Component 1: 渐变 + 蓝色方块 + Intersect 辉光） -->
    <div class="header-bottom-line">
      <img class="bottom-glow" src="@/assets/bigscreen/ebike-header-glow.svg" alt="" />
      <div class="bottom-block bottom-block--1" />
      <div class="bottom-block bottom-block--2" />
    </div>

    <!-- Layer 4: 标题 -->
    <h1 class="header-title">港南区"人工智能+电动自行车"管理平台</h1>

    <!-- Layer 5: 用户信息 -->
    <div class="user-area">
      <span class="user-name">{{ displayName }}</span>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-avatar">
          <img :src="avatarUrl" alt="" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="backend">管理后台</el-dropdown-item>
            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const userStore = useUserStore()
const { confirmLogout } = useConfirm()

const displayName = computed(() => userStore.user?.realName || '')
const avatarUrl = computed(() => {
  const u = userStore.user
  return u?.avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(u?.realName || 'default')}`
})

async function handleLogout() {
  try { await confirmLogout() } catch { return }
  userStore.logout()
  router.replace('/login')
}
function handleCommand(cmd: string) {
  if (cmd === 'backend') window.open('/workbench', '_blank')
  else if (cmd === 'logout') handleLogout()
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ebike-header {
  position: absolute; top: 0; left: 0;
  width: 100vw; height: vh(68);
  z-index: 100;
}

/* ===== Layer 0: 渐变背景（Figma: Rectangle 7 + blur(3px)） ===== */
.header-bg {
  position: absolute; inset: 0;
  background: linear-gradient(
    265.79deg,
    rgba(29, 134, 255, 0.025) 0%,
    rgba(38, 139, 241, 0.075) 38.46%,
    rgba(43, 126, 204, 0.28) 73.56%,
    rgba(0, 84, 161, 0.43) 100%
  );
}

/* ===== Layer 1: 左侧 SVG 装饰（Figma: 279×64 at x=0 y=0） ===== */
.header-left-decor {
  position: absolute; left: 0; top: 0;
  width: vw(279); height: vh(64);
  display: block; pointer-events: none;
}

/* ===== Layer 2: 右侧 SVG 装饰（Figma: 332×64 at x=1587 y=0） ===== */
.header-right-decor {
  position: absolute; right: 0; top: 0;
  width: vw(332); height: vh(64);
  display: block; pointer-events: none;
}

/* ===== Layer 3: 底部分隔线（Figma Component 1: 渐变 + 蓝色方块 + Intersect 辉光） ===== */
.header-bottom-line {
  position: absolute; left: 0; right: 0; bottom: 0;
  height: vh(4);
  background: linear-gradient(
    90deg,
    rgb(1, 68, 123) 0%,
    rgb(67, 142, 204) 17.4%,
    rgb(65, 139, 201) 25.1%,
    rgb(104, 186, 253) 49.5%,
    rgb(1, 68, 123) 100%
  );
}

/* Intersect 辉光（Figma: 143.925×4 at x≈457.76） */
.bottom-glow {
  position: absolute; left: vw(457.76); top: 0;
  width: vw(143.925); height: 100%;
  display: block; pointer-events: none;
}

/* 蓝色方块①（Figma: 13×4 at x=912.5） */
.bottom-block--1 {
  position: absolute; left: vw(912.5); top: 0;
  width: vw(13); height: 100%;
  background: #0086e4;
}

/* 蓝色方块②（Figma: 27×4 at x=981.5） */
.bottom-block--2 {
  position: absolute; left: vw(981.5); top: 0;
  width: vw(27); height: 100%;
  background: #0086e4;
}

/* ===== Layer 4: 标题（Figma: Source-KeynoteartHans 36px, white→#7fd4ff） ===== */
.header-title {
  position: absolute; left: vw(32); top: vh(10);
  margin: 0;
  font-family: 'Source-KeynoteartHans', 'YouSheBiaoTiHei', 'PingFang SC', sans-serif;
  font-size: clamp(20px, calc(36 * var(--min-scale)), 36px);
  font-weight: 400; line-height: normal;
  background: linear-gradient(to bottom, #ffffff 0%, #7fd4ff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

/* ===== Layer 5: 用户区域（Figma: at x=1720 y=9, gap 11px） ===== */
.user-area {
  position: absolute; right: vw(24); top: vh(9);
  display: flex; align-items: center; gap: vw(11);
}

.user-name {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  color: #fff; text-align: right; line-height: vh(46);
}

.user-avatar {
  width: calc(44 * var(--min-scale)); height: calc(44 * var(--min-scale));
  border-radius: 50%; overflow: hidden; cursor: pointer; flex-shrink: 0;
  img { width: 100%; height: 100%; display: block; }
}
</style>
