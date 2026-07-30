<template>
  <div class="campus-header">
    <div class="header-bg" />
    <img class="header-left-decor" src="/campus-header-left.svg" alt="" />
    <h1 class="header-title">"人工智能+平安校园"应用管理平台</h1>

    <!-- 右侧用户信息 -->
    <div class="user-area">
      <span class="user-name">{{ displayName }}</span>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-avatar">
          <img :src="avatarUrl" alt="用户头像" />
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

function handleCommand(command: string) {
  switch (command) {
    case 'backend':
      window.open('/workbench', '_blank')
      break
    case 'logout':
      handleLogout()
      break
  }
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.campus-header {
  position: absolute;
  top: 0; left: 0;
  width: 100vw; height: vh(64);
  z-index: 100; pointer-events: auto;
}

.header-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #004D8E 0%, #005DAC 100%);
}

.header-left-decor {
  position: absolute; left: 0; top: 0;
  height: 100%; width: auto; display: block; pointer-events: none;
}

.header-title {
  position: absolute; left: vw(43); top: 50%; transform: translateY(-50%);
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'Source-KeynoteartHans', 'PingFang SC', sans-serif;
  font-size: clamp(20px, calc(36 * var(--min-scale)), 36px); font-weight: 400; line-height: normal;
  background: linear-gradient(to bottom, #ffffff 0%, #84d6ff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  white-space: nowrap;
}

.user-area {
  position: absolute; right: vw(24); top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; gap: vw(12);
}

.user-name {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(18 * var(--min-scale)), 18px); color: #ffffff; white-space: nowrap;
}

.user-avatar {
  width: calc(40 * var(--min-scale)); height: calc(40 * var(--min-scale));
  border-radius: 50%; overflow: hidden; flex-shrink: 0; cursor: pointer;
  img { width: 100%; height: 100%; display: block; }
}
</style>
