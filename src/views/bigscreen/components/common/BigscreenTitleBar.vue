<template>
  <div
    class="bs-title-bar"
    :style="{
      '--bs-user-right': userRight,
      '--bs-title-size': titleSize,
      '--bs-title-top': `${((titleTop / 1080) * 100).toFixed(6)}vh`,
    }"
  >
    <!-- 主题底图：各主题自行提供（斜纹装饰 / 底部分隔线 / 蓝块） -->
    <slot name="background" />

    <!-- 主标题 -->
    <h1 class="bs-title-bar__title">{{ title }}</h1>

    <!-- 导航条：主题可选提供，组件自行定位 -->
    <slot name="nav" />

    <!-- 用户区 -->
    <div class="bs-title-bar__user">
      <span class="bs-title-bar__user-name">{{ displayName }}</span>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="bs-title-bar__avatar">
          <slot name="avatar">
            <img :src="avatarUrl" alt="" />
          </slot>
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

const props = withDefaults(
  defineProps<{
    /** 主标题文字 */
    title: string
    /** 用户区距右边的设计稿像素 */
    userRight?: number
    /** 主标题字号（设计稿像素） */
    titleSize?: number
    /** 主标题距顶（设计稿像素） */
    titleTop?: number
  }>(),
  { userRight: 24, titleSize: 36, titleTop: 10 },
)

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

.bs-title-bar {
  position: absolute; top: 0; left: 0;
  width: 100vw; height: vh(68);
  z-index: 100;
}

/* ===== 主标题（Figma: x=32 y=10, Source-KeynoteartHans 36px, white→#7fd4ff） =====
 * 字号 / 距顶由 titleSize / titleTop 控制，默认值即设计稿值；
 * 主题可调小字号而不影响其它大屏。 */
.bs-title-bar__title {
  position: absolute; left: vw(32); top: var(--bs-title-top);
  margin: 0;
  font-family: 'Source-KeynoteartHans', 'YouSheBiaoTiHei', 'PingFang SC', sans-serif;
  font-size: clamp(
    20px,
    calc(var(--bs-title-size) * var(--min-scale)),
    calc(var(--bs-title-size) * 1px)
  );
  font-weight: 400; line-height: normal;
  background: linear-gradient(to bottom, #ffffff 0%, #7fd4ff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

/* ===== 用户区（Figma: y=9, gap 11px, 头像 44×44） ===== */
.bs-title-bar__user {
  position: absolute; right: calc(var(--bs-user-right) / 1920 * 100vw); top: vh(9);
  display: flex; align-items: center; gap: vw(11);
}

.bs-title-bar__user-name {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  color: #fff; text-align: right; line-height: vh(46);
}

.bs-title-bar__avatar {
  width: calc(44 * var(--min-scale)); height: calc(44 * var(--min-scale));
  border-radius: 50%; overflow: hidden; cursor: pointer; flex-shrink: 0;
  img { width: 100%; height: 100%; display: block; }
}
</style>
