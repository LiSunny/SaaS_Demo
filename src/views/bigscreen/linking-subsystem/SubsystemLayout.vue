<template>
  <div class="app subsystem-app">
    <!-- ===== 顶栏（原 index.html .topbar 1:1） ===== -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.7l1.7 4.3a4 4 0 003.1 2.5l4.5.7-3.3 3.2a4 4 0 00-1.1 3.4l.8 4.6-4-2.1a4 4 0 00-3.7 0l-4 2.1.8-4.6a4 4 0 00-1.1-3.4L2.7 10.2l4.5-.7a4 4 0 003.1-2.5z"/>
          </svg>
        </div>
        <div>
          <h1>海港区“人工智能+沿街商铺”应消联勤平台</h1>
          <div class="brand-subtitle">风险预警 · 联勤协同处置 · 闭环监管</div>
        </div>
      </div>
      <div class="topbar-right">
        <span class="clock">{{ clock }}</span>
        <button type="button" class="theme-switch" @click="toggleTheme" title="切换主题" aria-label="切换主题">
          <span class="ts-track">
            <span class="ts-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ico-sun" :style="theme==='dark' ? 'opacity:1' : 'opacity:0'"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M3.3 12h2M18.7 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ico-moon" :style="theme==='dark' ? 'opacity:0' : 'opacity:1'"><path d="M21 13.2A8.7 8.7 0 0 1 10.8 3a8.7 8.7 0 1 0 10.2 10.2z"/></svg>
            </span>
          </span>
          <span class="ts-thumb" :style="theme==='dark' ? 'left:3px' : 'left:27px'"></span>
        </button>
      </div>
    </header>

    <div class="main">
      <!-- ===== 侧栏（原 index.html .sidebar 1:1，含 Figma 装饰） ===== -->
      <aside class="sidebar">
        <div class="sidebar-title-decor" aria-hidden="true">
          <img class="sidebar-decor-bar sidebar-decor-bar-a" src="@/assets/bigscreen/linking-subsystem/figma/sidebar/title-accent-1.svg" alt="">
          <img class="sidebar-decor-bar sidebar-decor-bar-b" src="@/assets/bigscreen/linking-subsystem/figma/sidebar/title-accent-2.svg" alt="">
          <img class="sidebar-decor-line" src="@/assets/bigscreen/linking-subsystem/figma/sidebar/title-line.svg" alt="">
          <img class="sidebar-decor-spark sidebar-decor-spark-a" src="@/assets/bigscreen/linking-subsystem/figma/sidebar/title-spark.svg" alt="">
          <img class="sidebar-decor-spark sidebar-decor-spark-b" src="@/assets/bigscreen/linking-subsystem/figma/sidebar/title-spark.svg" alt="">
          <img class="sidebar-decor-spark sidebar-decor-spark-c" src="@/assets/bigscreen/linking-subsystem/figma/sidebar/title-spark.svg" alt="">
        </div>
        <div class="mod-list">
          <button
            v-for="m in MODULES"
            :key="m.id"
            type="button"
            class="mod-item"
            :class="{ active: m.id === activeId }"
            @click="go(m.id)"
          >
            <div class="mod-num"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="ico(m.icon)"></svg></div>
            <div class="mod-body">
              <div class="mod-title">{{ m.title }}</div>
              <div class="mod-tag">{{ m.tag }}</div>
            </div>
          </button>
        </div>
      </aside>

      <!-- ===== 内容区 ===== -->
      <section class="content">
        <div class="iframe-shell" :data-system="currentModule?.custom ?? ''">
          <div class="iframe-shell-title">{{ currentModule?.title }}</div>
          <div class="iframe-shell-decor"></div>
          <div class="iframe-shell-darkstrip"></div>
          <div class="iframe-shell-body">
            <SubsystemView :mod="activeId" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MODULES } from './data/modules'
import { ico } from './util/ico-map'
import SubsystemView from './SubsystemView.vue'
import '@/assets/bigscreen/linking-subsystem/subsystem.css'

/* ===== 主题（原 index.html applyTheme/toggleTheme 1:1） ===== */
const theme = ref<'dark' | 'light'>(document.documentElement.getAttribute('data-theme') as 'dark' | 'light' || 'dark')
const root = document.documentElement
root.setAttribute('data-theme', theme.value)

const router = useRouter()
const route = useRoute()
const activeId = computed(() => Number(route.params.mod) || 1)
const currentModule = computed(() => MODULES.find(x => x.id === activeId.value))

/* ===== 模块切换（原 selectModule 1:1，改为路由） ===== */
function go(id: number) {
  router.push(`/landing/linking/sub/${id}`)
}

/* ===== 时钟（原 tickClock 1:1） ===== */
const clock = ref('--:--:--')
function tick() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
onMounted(() => {
  tick()
  setInterval(tick, 1000)
  // 全局 ico 图标支持（inline-feature 等直接 v-html）
})
onBeforeUnmount(() => {
  root.removeAttribute('data-theme')
})

/* ===== 主题切换 ===== */
function toggleTheme() {
  const cur = root.getAttribute('data-theme') || 'dark'
  theme.value = cur === 'dark' ? 'light' : 'dark'
}
</script>

<style lang="scss" scoped>
.subsystem-app {
  width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>
