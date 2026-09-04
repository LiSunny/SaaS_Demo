<template>
  <!-- 商铺主体责任系统 · 独立大屏（不进 11 屏共享壳：无左侧切换菜单、无共享顶栏）
       内容 = 全屏辖区地图 + OverviewOverlay 悬浮（右侧2列模块面板 / 底部筛选条 / 弹窗），
       顶部 = 独立大标题组件 BigTitle（右侧插槽：时钟 + 当前用户） -->
  <div class="app rsb-app">
    <!-- 大屏切换抽屉（与 11 屏壳同一导航组件；本屏 active=1 商铺主体责任系统） -->
    <BigscreenNavDrawer :items="LINKING_NAV_ITEMS" :active-id="1" header="大屏切换" @select="go" />

    <BigTitle title="商铺主体责任系统">
      <template #right>
        <span class="clock">{{ clock }}</span>
        <div class="header-user">
          <span class="header-user-name">{{ displayName }}</span>
          <div class="header-user-avatar">
            <img :src="avatarUrl" alt="用户头像" />
          </div>
        </div>
      </template>
    </BigTitle>

    <div class="rsb-main">
      <div class="subsystem-scene">
        <div ref="hostEl" class="subsystem-view" data-system="overview"></div>
        <OverviewOverlay />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BigTitle from './responsibility/BigTitle.vue'
import OverviewOverlay from './OverviewOverlay.vue'
import BigscreenNavDrawer from '@/components/base/BigscreenNavDrawer.vue'
import { LINKING_NAV_ITEMS, linkingRouteFor } from './data/nav'
import { useUserStore } from '@/stores/user'
import '@/assets/bigscreen/linking-subsystem/subsystem.css'

/* ===== 大屏切换（与壳内 SubsystemLayout 同源：linkingRouteFor 已含模块1→独立大屏例外） ===== */
const router = useRouter()
function go(id: number | string) {
  router.push(linkingRouteFor(Number(id)))
}

/* ===== 引擎渲染（复用 overview-engine：全屏地图注入 hostEl） ===== */
const hostEl = ref<HTMLElement>()
let disposed = false
let ro: ResizeObserver | undefined

async function render() {
  const body = hostEl.value
  if (!body || disposed) return
  const engine = await import('./engine/overview-engine')
  if (disposed) return
  engine.renderOverview(body, body)
  engine.mountOverviewGlobals?.()
  /* 窗口/容器尺寸变化时强制高德重算画布，避免缩放后底部露出底色（resizeEnable 覆盖不到的场景） */
  ro = new ResizeObserver(() => engine.resizeGaodeMap())
  ro.observe(body)
}

onMounted(() => {
  render()
  tick()
  timer = setInterval(tick, 1000)
  /* 本屏独立大屏：固定深色主题 */
  document.documentElement.setAttribute('data-theme', 'dark')
})
let timer: ReturnType<typeof setInterval> | undefined
onBeforeUnmount(() => {
  disposed = true
  ro?.disconnect()
  if (timer) clearInterval(timer)
  document.documentElement.removeAttribute('data-theme')
  import('./engine/overview-engine').then(m => m.unmountOverviewGlobals?.())
})

/* ===== 时钟 ===== */
const clock = ref('--:--:--')
function tick() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/* ===== 当前登录用户（对齐其他大屏：realName + 头像，无头像 DiceBear 兜底） ===== */
const userStore = useUserStore()
const displayName = computed(() => userStore.user?.realName || '')
const avatarUrl = computed(() => {
  const u = userStore.user
  return u?.avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(u?.realName || 'default')}`
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.rsb-app {
  position: relative; /* 标题条 absolute 覆盖的定位基准 */
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* clock 样式（对齐共享壳 [data-theme] .topbar-right .clock 语义，本屏独立定义） */
.rsb-app .clock {
  font-size: vmin(14);
  font-weight: 700;
  color: #dbf2ff;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}

/* ===== 主内容：全屏地图场景 ===== */
.rsb-main {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 场景布局自包含（对齐 SubsystemView.vue 全局样式）：
   直接打开本路由时 SubsystemView chunk 未加载，其全局 .subsystem-scene/.subsystem-view
   样式不存在，宿主高度会塌陷为 0（data-theme 下 .ov-map min-height:0）导致地图不可见 */
.rsb-main .subsystem-scene {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rsb-main .subsystem-scene .subsystem-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
