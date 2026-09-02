<template>
  <div class="app subsystem-app">
    <!-- ===== 顶栏（原 index.html .topbar 1:1） ===== -->
    <header class="topbar">
      <!-- 大标题组件（白色主题装饰 + 标题文字，按设计稿 108:15008 Frame 430 重构；dark 下仅标题文字） -->
      <WhiteTopbarTitle
        :title="currentModule?.title ?? '平台概览'"
        :subtitle="currentModule?.tag ?? '海港区“人工智能+沿街商铺”应消联勤平台'"
      />
      <div class="topbar-right">
        <span class="clock">{{ clock }}</span>
        <!-- ===== 当前登录用户（逻辑与其他大屏一致：userStore.realName + 头像，无头像 DiceBear 兜底） ===== -->
        <div class="header-user">
          <span class="header-user-name">{{ displayName }}</span>
          <div class="header-user-avatar">
            <img :src="avatarUrl" alt="用户头像" />
          </div>
        </div>
      </div>
    </header>

    <div class="main">
      <!-- ===== 悬浮抽屉导航（通用大屏导航组件） ===== -->
      <BigscreenNavDrawer
        :items="navItems"
        :active-id="activeId"
        header="大屏切换"
        @select="go"
      />

      <!-- ===== 内容区（与顶栏构成一整块可视化大屏，模块内容全幅直出） ===== -->
      <section class="content">
        <SubsystemView :mod="activeId" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MODULES } from './data/modules'
import { LINKING_NAV_ITEMS, linkingRouteFor } from './data/nav'
import SubsystemView from './SubsystemView.vue'
import BigscreenNavDrawer from '@/components/base/BigscreenNavDrawer.vue'
import WhiteTopbarTitle from './WhiteTopbarTitle.vue'
import { useUserStore } from '@/stores/user'
import '@/assets/bigscreen/linking-subsystem/subsystem.css'

const router = useRouter()
const route = useRoute()
const activeId = computed(() => Number(route.params.mod) || 1)

/* ===== 当前登录用户（对齐 BigscreenHeader：realName + 头像，无头像 DiceBear 兜底） ===== */
const userStore = useUserStore()
const displayName = computed(() => userStore.user?.realName || '')
const avatarUrl = computed(() => {
  const u = userStore.user
  return u?.avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(u?.realName || 'default')}`
})

/* ===== 当前子系统（顶栏标题/标签 = 本屏独立标题） ===== */
const currentModule = computed(() => MODULES.find((x) => x.id === activeId.value))

/* ===== 通用切换菜单（平台概览 + 10 系统，全局一致） ===== */
const navItems = LINKING_NAV_ITEMS

/* ===== 模块切换（原 selectModule 1:1，改为路由） ===== */
function go(id: number | string) {
  router.push(linkingRouteFor(Number(id)))
}

/* ===== 时钟 ===== */
const clock = ref('--:--:--')
function tick() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/* ===== 主题跟随系统（去除手动切换；C 档浅色报表类切 light，其余深色大屏类留 dark） ===== */
const root = document.documentElement
const LIGHT_SYSTEMS = ['shops', 'ledger', 'hazards', 'jointDuty', 'hotWork']
function applySystemTheme(custom?: string) {
  const theme = custom && LIGHT_SYSTEMS.includes(custom) ? 'light' : 'dark'
  if (root.getAttribute('data-theme') !== theme) root.setAttribute('data-theme', theme)
}
watch(
  () => currentModule.value?.custom,
  (custom) => applySystemTheme(custom),
  { immediate: true }
)
onMounted(() => {
  tick()
  setInterval(tick, 1000)
  applySystemTheme(currentModule.value?.custom)
})
onBeforeUnmount(() => {
  root.removeAttribute('data-theme')
})
</script>

<style lang="scss" scoped>
.subsystem-app {
  width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
