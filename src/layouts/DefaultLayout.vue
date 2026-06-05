<template>
  <div class="layout">
    <!-- ===== 顶部导航栏 ===== -->
    <header class="top-header">
      <div class="logo-area">
        <div class="logo-icon" />
        <span class="company-name">xxx股份有限公司</span>
        <svg class="logo-arrow" width="14" height="14" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="var(--text-primary)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>

      <nav class="top-nav">
        <button
          v-for="item in topMenus"
          :key="item.key"
          :class="['nav-item', { active: activeMenu === item.key }]"
          @click="onTopMenuClick(item.key)"
        >{{ item.label }}</button>
      </nav>

      <div class="user-area">
        <AppIcon name="message" class="ua-icon" />
        <ThemeToggle />
        <div class="avatar" />
        <span class="user-name desk-only">用户名</span>
        <svg class="logo-arrow desk-only" width="14" height="14" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="var(--text-primary)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <!-- 侧栏切换按钮 -->
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed" title="切换侧栏">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- ===== 主体 ===== -->
    <div class="main-body">
      <aside :class="['left-sidebar', { collapsed: sidebarCollapsed }]">
        <template v-for="item in visibleSideMenus" :key="item.key">
          <!-- 一级菜单（无子级） -->
          <button
            v-if="!item.children"
            :class="['side-item', { active: activeSideMenu === item.key }]"
            :title="item.label"
            @click="onSideClick(item.key)"
          >
            <span class="side-dot" />
            <span class="side-label">{{ item.label }}</span>
          </button>

          <!-- 一级菜单（有子级） -->
          <div v-else class="side-group">
            <button
              :class="['side-item', { open: expandedKeys.includes(item.key) }]"
              :title="item.label"
              @click="toggleExpand(item.key)"
            >
              <span class="side-dot" />
              <span class="side-label">{{ item.label }}</span>
              <svg class="side-arrow" :class="{ rotated: expandedKeys.includes(item.key) }" width="14" height="14" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="var(--text-secondary)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div v-show="expandedKeys.includes(item.key)" class="side-sub">
              <button
                v-for="child in item.children"
                :key="child.key"
                :class="['side-sub-item', { active: activeSideMenu === child.key }]"
                :title="child.label"
                @click="onSideClick(child.key)"
              >{{ child.label }}</button>
            </div>
          </div>
        </template>
      </aside>

      <!-- 侧栏收起时的遮罩 -->
      <div v-if="!sidebarCollapsed" class="sidebar-overlay" @click="sidebarCollapsed = true" />

      <main class="main-content">
        <router-view v-if="activeSideMenu in menuRoutes" />
        <div v-else class="placeholder-page">{{ activeSideMenu }}</div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const router = useRouter()

const activeMenu = ref('device')
const activeSideMenu = ref('')
const expandedKeys = ref<string[]>([])
const sidebarCollapsed = ref(false)

// ===== 路由 → 菜单映射表（路由隔离核心） =====
// 精确路由路径 → 侧边栏菜单 key
const routeToSideMenu: Record<string, string> = {
  '/workbench': 'workbench-overview',
  '/system/dashboard': 'system-dashboard',
  '/system/template': 'workflow-template',
  '/system/monitor': 'workflow-monitor',
  '/system/order': 'workflow-monitor',      // 工单详情页 → 工单监控侧边菜单
  '/maintenance/plans': 'maintenance-plan',
  '/maintenance/plans/detail': 'maintenance-plan',
}

// 侧边栏菜单 key → 实际路由路径
const menuRoutes: Record<string, string> = {
  'workbench-overview': '/workbench',
  'system-dashboard': '/system/dashboard',
  'workflow-template': '/system/template',
  'workflow-monitor': '/system/monitor',
  'maintenance-plan': '/maintenance/plans',
}

// 顶部菜单 key → 默认侧边栏菜单 key
// 每个顶部菜单都应有默认侧边栏，确保点击"空菜单"时也能导航
const defaultSideMenus: Record<string, string> = {
  workbench: 'workbench-overview',
  device: 'maintenance-plan',
  inspect: 'maintenance-plan',
  remote: 'maintenance-plan',
  maintain: 'maintenance-plan',
  risk: 'maintenance-plan',
  platform: 'maintenance-plan',
  training: 'maintenance-plan',
  system: 'system-dashboard',
}

/** 根据当前路由同步菜单状态（路由 → 菜单，路由隔离核心） */
function syncMenuFromRoute() {
  const route = router.currentRoute.value
  const path = route.path
  const metaTopMenu = (route.meta?.topMenu as string) || ''

  // 1. 同步顶部菜单：仅当路由所属分组与当前不同时才切换
  //    避免用户点击同组其他顶部菜单（如"巡查检查"）后被覆盖回默认
  if (metaTopMenu) {
    const currentGroup = sideMenuGroups[activeMenu.value]
    const routeGroup = sideMenuGroups[metaTopMenu]
    if (currentGroup !== routeGroup) {
      activeMenu.value = metaTopMenu
    }
  }

  // 2. 同步侧边栏菜单 active + 展开父级分组
  let sideKey = routeToSideMenu[path]
  if (!sideKey) {
    for (const [routePath, key] of Object.entries(routeToSideMenu)) {
      if (path.startsWith(routePath)) {
        sideKey = key
        break
      }
    }
  }
  if (sideKey) {
    activeSideMenu.value = sideKey
    const parent = allSideMenus.find(s =>
      (s.children || []).some(c => c.key === sideKey)
    )
    if (parent) expandedKeys.value = [parent.key]
  }
}

function onSideClick(key: string) {
  activeSideMenu.value = key
  const r = menuRoutes[key]
  if (r) router.push(r)
}

function onTopMenuClick(key: string) {
  activeMenu.value = key
  const defaultSide = defaultSideMenus[key] || ''
  activeSideMenu.value = defaultSide
  // 展开对应的分组
  const sideItem = allSideMenus.find(s => (s.children || []).some(c => c.key === defaultSide) || s.key === defaultSide)
  if (sideItem) expandedKeys.value = [sideItem.key]
  const r = menuRoutes[defaultSide]
  if (r) router.push(r)
}

const toggleExpand = (key: string) => {
  const idx = expandedKeys.value.indexOf(key)
  if (idx > -1) expandedKeys.value.splice(idx, 1)
  else expandedKeys.value.push(key)
  if (sidebarCollapsed.value) sidebarCollapsed.value = false
}

// 监听窗口宽度自动收起侧栏
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(max-width: 1280px)')
  sidebarCollapsed.value = mq.matches
  mq.addEventListener('change', (e) => {
    sidebarCollapsed.value = e.matches
  })
}

const topMenus = [
  { key: 'workbench', label: '工作台' },
  { key: 'device', label: '设备管理' },
  { key: 'inspect', label: '巡查检查' },
  { key: 'remote', label: '远程值守' },
  { key: 'maintain', label: '维保应用' },
  { key: 'risk', label: '隐患管理' },
  { key: 'platform', label: '平台配置' },
  { key: 'training', label: '培训演练' },
  { key: 'system', label: '系统管理' },
]

const allSideMenus = [
  // ===== 工作台 =====
  { key: 'workbench', label: '概览', group: 'workbench' },
  // { key: 'messages', label: '消息中心', group: 'workbench' }, // 预留

  // ===== 设备管理 =====
  { key: 'home', label: '首页', group: 'device' },
  { key: 'equipment', label: '设备设施台账', group: 'device' },
  { key: 'monitor', label: '运行监控', group: 'device', children: [
    { key: 'monitor-device', label: '设备设施监控' },
    { key: 'monitor-scene', label: '场景监控' },
  ]},
  { key: 'maintenance', label: '保养管理', group: 'device', children: [
    { key: 'maintenance-spec', label: '保养规范' },
    { key: 'maintenance-plan', label: '保养计划' },
    { key: 'maintenance-task', label: '保养任务' },
    { key: 'maintenance-record', label: '保养记录' },
    { key: 'maintenance-remind', label: '保养提醒' },
  ]},
  { key: 'supplies', label: '应急物资', group: 'device' },
  { key: 'report', label: '报表与报告', group: 'device', children: [
    { key: 'report-device', label: '设备设施运行报表' },
    { key: 'report-alarm', label: '告警分析报告' },
  ]},
  { key: 'log', label: '日志', group: 'device', children: [
    { key: 'log-event', label: '事件日志' },
  ]},
  { key: 'config', label: '配置', group: 'device', children: [
    { key: 'config-data-pull', label: '标准数据拉取' },
    { key: 'config-floor-plan', label: '平面图描点' },
    { key: 'config-data-push', label: '标准数据推送' },
    { key: 'config-device-link', label: '设备联动' },
  ]},
  { key: 'push', label: '消息推送', group: 'device', children: [
    { key: 'push-alarm', label: '告警推送' },
  ]},

  // ===== 系统管理 =====
  { key: 'system', label: '流程管理', group: 'system', children: [
    { key: 'system-dashboard', label: '数据看板' },
    { key: 'workflow-template', label: '流程模板' },
    { key: 'workflow-monitor', label: '工单监控' },
  ]},
]

const sideMenuGroups: Record<string, string> = {
  workbench: 'workbench',
  device: 'device', inspect: 'device', remote: 'device',
  maintain: 'device',
  risk: 'device', platform: 'device', training: 'device',
  system: 'system',
}
const visibleSideMenus = computed(() => {
  const g = sideMenuGroups[activeMenu.value] || 'device'
  return allSideMenus.filter(s => s.group === g)
})

// 路由变化时自动同步菜单（含首次加载）
// 注意：必须在 allSideMenus 定义之后调用，避免 TDZ 错误
watch(() => router.currentRoute.value.path, () => syncMenuFromRoute(), { immediate: true })

</script>

<style scoped>
.layout { display: flex; flex-direction: column; height: 100vh; min-width: 1024px; }

/* ===== Top Header (82px) ===== */
.top-header {
  display: flex; align-items: center; gap: 16px;
  height: 64px; background: var(--bg-card);
  border-bottom: 1px solid var(--border-high);
  padding: 0; flex-shrink: 0;
}
.logo-area {
  display: flex; align-items: center; gap: 14px;
  padding: 8px 12px; width: 272px; flex-shrink: 0;
}
.logo-icon {
  width: 40px; height: 40px; border-radius: var(--radius-md, 8px);
  background: linear-gradient(135deg, #2e95e2, #006efc);
  flex-shrink: 0;
}
.company-name { font-size: var(--font-h4, 16px); font-weight: 500; color: var(--text-primary); white-space: nowrap; }
.logo-arrow { flex-shrink: 0; }

/* -- 导航 -- */
.top-nav {
  flex: 1; display: flex; align-items: center; gap: 8px;
  min-width: 0; overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.top-nav::-webkit-scrollbar { display: none; }
.nav-item {
  background: none; border: none; cursor: pointer;
  font-size: var(--font-h4, 16px); font-weight: 500; color: var(--text-primary);
  padding: 10px 6px; white-space: nowrap;
  border-bottom: 3px solid transparent;
  transition: color .15s;
  flex-shrink: 0;
}
.nav-item:hover { color: var(--accent-primary); }
.nav-item.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }

/* -- 用户区 -- */
.user-area {
  display: flex; align-items: center; gap: 16px;
  padding: 0 16px; flex-shrink: 0;
}
.ua-icon { width: 26px; height: 26px; opacity: .7; cursor: pointer; color: var(--text-secondary); }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--border-high); flex-shrink: 0;
}
.user-name { font-size: var(--font-h4, 16px); font-weight: 500; color: var(--text-primary); white-space: nowrap; }

/* 侧栏切换按钮 */
.sidebar-toggle {
  display: none; background: none; border: none; cursor: pointer;
  width: 32px; height: 32px; align-items: center; justify-content: center;
  border-radius: var(--radius-sm, 6px); color: var(--text-secondary);
}
.sidebar-toggle:hover { background: var(--accent-primary10); color: var(--accent-primary); }

/* ===== Body ===== */
.main-body { flex: 1; display: flex; overflow: hidden; position: relative; }

/* ===== 侧栏遮罩 ===== */
.sidebar-overlay { display: none; }

/* ===== Left Sidebar ===== */
.left-sidebar {
  width: 272px; flex-shrink: 0; background: var(--bg-card);
  border-right: 1px solid var(--border-high);
  padding: var(--spacing-xl, 16px); overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--spacing-sm, 6px);
  transition: width .25s ease;
}
.left-sidebar.collapsed {
  width: 72px; padding: 12px var(--spacing-md, 8px);
  overflow-y: auto; overflow-x: hidden;
}
.left-sidebar.collapsed .side-label,
.left-sidebar.collapsed .side-arrow,
.left-sidebar.collapsed .side-sub { display: none; }
.left-sidebar.collapsed .side-item {
  justify-content: center; padding: 0; gap: 0;
}
.left-sidebar.collapsed .side-dot {
  margin: 0;
}

.side-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; height: 45px; padding: 0 10px;
  border: none; background: none; cursor: pointer;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-body, 16px); font-weight: 400;
  color: var(--text-secondary); text-align: left; flex-shrink: 0;
}
.side-item:hover { background: var(--accent-primary10); }
.side-item.active { background: var(--accent-primary); color: #FFFFFF; }
.side-item.active .side-arrow path { stroke: #FFFFFF; }

.side-dot {
  width: 24px; height: 24px; flex-shrink: 0;
  border-radius: 6px; background: var(--border-default);
}
.side-item.active .side-dot { background: rgba(255,255,255,0.3); }
.side-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.side-arrow { flex-shrink: 0; transition: transform .2s; }
.side-arrow.rotated { transform: rotate(180deg); }

/* 二级菜单 */
.side-sub { display: flex; flex-direction: column; gap: 2px; }
.side-sub-item {
  display: flex; align-items: center;
  width: 100%; height: 45px; padding-left: 45px; padding-right: 10px;
  border: none; background: none; cursor: pointer;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-body, 16px); font-weight: 400;
  color: var(--text-secondary); text-align: left;
}
.side-sub-item:hover { background: var(--accent-primary10); }
.side-sub-item.active { background: var(--accent-primary); color: #FFFFFF; }

/* ===== Main Content ===== */
.main-content {
  flex: 1; min-width: 0; padding: var(--spacing-lg, 12px);
  background: var(--bg-main); overflow-y: auto;
}
.placeholder-page {
  display: flex; align-items: center; justify-content: center;
  height: 100%; font-size: var(--font-h1, 24px); color: var(--text-placeholder);
}

/* ===== 响应式 ===== */

/* 1280px: 侧栏收起为图标模式 */
@media (max-width: 1280px) {
  .left-sidebar { width: 72px; padding: 12px var(--spacing-md, 8px); }
  .left-sidebar .side-label,
  .left-sidebar .side-arrow,
  .left-sidebar .side-sub { display: none; }
  .left-sidebar .side-item { justify-content: center; padding: 0; gap: 0; }
  .left-sidebar .side-dot { margin: 0; }
  .left-sidebar.collapsed { width: 72px; }
  .sidebar-toggle { display: flex; }
  .logo-area { width: auto; }
}

/* 1100px: 用户名隐藏 */
@media (max-width: 1100px) {
  .desk-only { display: none; }
  .user-area { gap: 10px; padding: 0 10px; }
}

/* 1024px: 最小宽度 */
@media (max-width: 1024px) {
  .layout { min-width: auto; }
  .top-header { gap: 8px; }
  .top-nav { gap: 4px; }
  .nav-item { font-size: var(--font-h4, 16px); padding: 10px 4px; }
}
</style>
