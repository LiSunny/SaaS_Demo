<template>
  <div class="layout">
    <!-- ===== 顶部导航栏（简化：只保留 Logo + 用户区） ===== -->
    <header class="top-header">
      <div class="logo-area">
        <div class="logo-icon" />
        <span class="company-name">xxx股份有限公司</span>
      </div>

      <div class="user-area">
        <AppIcon name="message" class="ua-icon" />
        <ThemeToggle />
        <span v-if="userStore.isLoggedIn" class="user-name">{{ userStore.user?.realName }}</span>
        <button v-if="userStore.isLoggedIn" class="logout-btn" title="退出登录" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <PositionSwitcher />
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

        <!-- 1. 搜索框 -->
        <div class="sidebar-search">
          <input v-model="searchQuery" class="search-input" placeholder="搜索菜单或功能..." />
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 15.5L19 19M5 11a6 6 0 1 0 12 0 6 6 0 0 0-12 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- 2. 工作台（固定项） -->
        <button
          :class="['workbench-item', { active: activeNavKey === WORKBENCH_ITEM.key }]"
          @click="onNodeClick(WORKBENCH_ITEM)"
        >
          <AppIcon :name="WORKBENCH_ITEM.icon || 'menuicon'" class="side-icon" />
          <span class="side-label">工作台</span>
        </button>

        <!-- 3. 常用区（有钉选才显示） -->
        <template v-if="pinnedItems.length > 0">
          <hr class="sidebar-divider" />
          <div class="pinned-section">
            <button class="section-header" @click="pinnedExpanded = !pinnedExpanded">
              <span class="section-label">📌 常用</span>
              <svg class="section-chevron" :class="{ rotated: pinnedExpanded }" width="14" height="14" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
            </button>
            <div v-show="pinnedExpanded" class="section-body">
              <button
                v-for="item in pinnedItems"
                :key="item.key"
                :class="['side-item', { active: activeNavKey === item.key }]"
                @click="onNodeClick(item)"
              >
                <AppIcon :name="item.icon || 'menuicon'" class="side-icon" />
                <span class="side-label">{{ item.label }}</span>
                <span class="pin-active" @click.stop="togglePin(item.key)">⭐</span>
              </button>
            </div>
          </div>
        </template>

        <hr class="sidebar-divider" />

        <!-- 4. 空搜索提示 -->
        <div v-if="searchQuery.trim() && filteredGroups.length === 0" class="no-results">
          无匹配结果
        </div>

        <!-- 5. 导航分组 -->
        <div
          v-for="group in filteredGroups"
          :key="group.key"
          class="nav-group"
        >
          <div class="section-header">
            <span class="section-label">{{ group.label }}</span>
          </div>
          <div class="section-body">
            <template v-for="node in group.children" :key="node.key">
              <!-- 展开节点（有 children，无 route） -->
              <div v-if="node.children && !node.route" class="side-group">
                <button
                  :class="['side-item', { open: expandedKeys.includes(node.key) }]"
                  @click="toggleExpand(node.key)"
                >
                  <AppIcon :name="node.icon || 'menuicon'" class="side-icon" />
                  <span class="side-label">{{ node.label }}</span>
                  <span
                    class="pin-icon"
                    :class="{ pinned: pinnedKeys.has(node.key) }"
                    @click.stop="togglePin(node.key)"
                  >{{ pinnedKeys.has(node.key) ? '⭐' : '☆' }}</span>
                  <svg class="side-arrow" :class="{ rotated: expandedKeys.includes(node.key) }" width="14" height="14" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
                </button>
                <div v-show="expandedKeys.includes(node.key)" class="side-sub">
                  <button
                    v-for="child in node.children"
                    :key="child.key"
                    :class="['side-sub-item', { active: activeNavKey === child.key }]"
                    @click="onNodeClick(child)"
                  >{{ child.label }}</button>
                </div>
              </div>

              <!-- 跳转节点（有 route，无 children）— 包括跳转域首页入口 -->
              <button
                v-else-if="node.route && !node.children"
                :key="node.key"
                :class="['side-item', { active: activeNavKey === node.key }]"
                @click="onNodeClick(node)"
              >
                <AppIcon :name="node.icon || 'menuicon'" class="side-icon" />
                <span class="side-label">{{ node.label }}</span>
                <span
                  class="pin-icon"
                  :class="{ pinned: pinnedKeys.has(node.key) }"
                  @click.stop="togglePin(node.key)"
                >{{ pinnedKeys.has(node.key) ? '⭐' : '☆' }}</span>
                <svg v-if="node.route && !node.children" class="nav-entry-arrow" width="14" height="14" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
              </button>

              <!-- 纯占位（两者都无）— 不可点击 -->
              <div v-else class="side-item side-item-placeholder">
                <AppIcon :name="node.icon || 'menuicon'" class="side-icon" />
                <span class="side-label">{{ node.label }}</span>
              </div>
            </template>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <router-view v-if="activeNavKey in NAV_KEY_TO_ROUTE || !activeNavKey" />
        <div v-else class="placeholder-page">{{ activeNavKey }}</div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import PositionSwitcher from '@/components/base/PositionSwitcher.vue'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  WORKBENCH_ITEM,
  NAV_GROUPS,
  ROUTE_TO_NAV_KEY,
  NAV_KEY_TO_ROUTE,
  findAncestors,
  findNodeByKey,
  type NavNode,
  type NavGroup,
} from '@/config/navigation'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', { type: 'warning' })
  } catch { return }
  userStore.logout()
  router.replace('/login')
}

// ===== 状态 =====
const activeNavKey = ref('')
const expandedKeys = ref<string[]>([])
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const pinnedExpanded = ref(true)

// ===== 钉选 =====
const PINNED_STORAGE_KEY = 'sidebar-pinned-keys'

function loadPinnedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* 静默失败 */ }
  return new Set()
}

function savePinnedKeys(keys: Set<string>): void {
  localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify([...keys]))
}

const pinnedKeys = ref<Set<string>>(loadPinnedKeys())

/** 钉选状态变化时立即持久化 */
watch(pinnedKeys, (val) => savePinnedKeys(val), { deep: true })

function togglePin(key: string): void {
  const next = new Set(pinnedKeys.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  pinnedKeys.value = next
}

/** 常驻的高亮钉选项（分展开/跳转两类节点） */
const pinnedItems = computed(() => {
  const items: NavNode[] = []
  for (const key of pinnedKeys.value) {
    if (key === WORKBENCH_ITEM.key) {
      items.push(WORKBENCH_ITEM)
    } else {
      const node = findNodeByKey(key)
      if (node) items.push(node)
    }
  }
  return items
})

// ===== 搜索过滤 =====

/** 是否符合搜索条件 */
function labelMatches(label: string, query: string): boolean {
  return label.toLowerCase().includes(query.toLowerCase().trim())
}

/** 递归过滤 NavGroup 的子节点，只保留匹配或子节点匹配的 */
function filterGroup(group: NavGroup, query: string): NavGroup {
  const filteredChildren = group.children
    .map(node => filterNode(node, query))
    .filter(Boolean) as NavNode[]
  return { ...group, children: filteredChildren }
}

function filterNode(node: NavNode, query: string): NavNode | null {
  // 自身匹配
  if (labelMatches(node.label, query)) return node

  // 递归子节点
  if (node.children) {
    const filteredChildren = node.children
      .map(c => filterNode(c, query))
      .filter(Boolean) as NavNode[]
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren }
    }
  }

  return null
}

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return NAV_GROUPS // 无搜索时返回全部

  return NAV_GROUPS
    .map(group => filterGroup(group, q))
    .filter(g => g.children.length > 0)
})

// ===== 节点展开/折叠 =====
function toggleExpand(key: string): void {
  const idx = expandedKeys.value.indexOf(key)
  if (idx > -1) {
    expandedKeys.value.splice(idx, 1)
  } else {
    expandedKeys.value.push(key)
  }
  if (sidebarCollapsed.value) sidebarCollapsed.value = false
}

// ===== 节点点击 =====
function onNodeClick(node: NavNode): void {
  if (node.route) {
    activeNavKey.value = node.key
    router.push(node.route)
  }
}

// ===== 路由 → 菜单同步 =====
function syncMenuFromRoute(): void {
  const path = router.currentRoute.value.path

  // 1. 匹配侧栏 key
  let navKey = ROUTE_TO_NAV_KEY[path]
  if (!navKey) {
    for (const [routePath, key] of Object.entries(ROUTE_TO_NAV_KEY)) {
      if (path.startsWith(routePath)) {
        navKey = key
        break
      }
    }
  }

  if (!navKey) {
    // 兜底：默认展开工作台
    activeNavKey.value = WORKBENCH_ITEM.key
    return
  }

  activeNavKey.value = navKey

  // 2. 自动展开父级
  const ancestors = findAncestors(navKey)
  if (ancestors) {
    // 展开父节点
    for (const parentKey of ancestors.parentKeys) {
      if (!expandedKeys.value.includes(parentKey)) {
        expandedKeys.value.push(parentKey)
      }
    }
  }
}

// 路由变化时自动同步菜单
watch(() => router.currentRoute.value.path, syncMenuFromRoute, { immediate: true })

// 监听窗口宽度自动收起侧栏
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(max-width: 1280px)')
  sidebarCollapsed.value = mq.matches
  mq.addEventListener('change', (e) => {
    sidebarCollapsed.value = e.matches
  })
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; height: 100vh; min-width: 1024px; }

/* ===== Top Header (56px) ===== */
.top-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 56px; background: var(--bg-card);
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
.logout-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: var(--radius-sm); background: transparent; color: var(--text-secondary); cursor: pointer; transition: all .2s; }
.logout-btn:hover { background: var(--danger-bg); color: var(--danger); }

/* 侧栏切换按钮 */
.sidebar-toggle {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  width: 32px; height: 32px;
  border-radius: var(--radius-sm, 6px); color: var(--text-secondary);
  flex-shrink: 0;
}
.sidebar-toggle:hover { background: var(--accent-primary10); color: var(--accent-primary); }

/* ===== Body ===== */
.main-body { flex: 1; display: flex; overflow: hidden; position: relative; }

/* ===== Left Sidebar ===== */
.left-sidebar {
  width: 272px; flex-shrink: 0; background: var(--bg-card);
  border-right: 1px solid var(--border-high);
  padding: var(--spacing-lg, 12px); overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--spacing-xs, 4px);
  transition: width .25s ease;
}
.left-sidebar.collapsed {
  width: 72px; padding: 12px var(--spacing-md, 8px);
  overflow-y: auto; overflow-x: hidden;
}
.left-sidebar.collapsed .side-label,
.left-sidebar.collapsed .side-arrow,
.left-sidebar.collapsed .nav-entry-arrow,
.left-sidebar.collapsed .side-sub,
.left-sidebar.collapsed .section-chevron,
.left-sidebar.collapsed .section-body,
.left-sidebar.collapsed .search-input,
.left-sidebar.collapsed .search-icon,
.left-sidebar.collapsed .sidebar-divider,
.left-sidebar.collapsed .pinned-section,
.left-sidebar.collapsed .no-results,
.left-sidebar.collapsed .pin-icon { display: none !important; }
.left-sidebar.collapsed .sidebar-search { display: none; }
.left-sidebar.collapsed .workbench-item {
  justify-content: center; padding: 0; min-height: 45px;
}
.left-sidebar.collapsed .side-item {
  justify-content: center; padding: 0; gap: 0; height: 45px;
}

/* ===== 搜索框 ===== */
.sidebar-search {
  position: relative; margin-bottom: var(--spacing-md, 8px);
}
.search-input {
  width: 100%; height: 38px; padding: 0 36px 0 12px;
  border: 1px solid var(--border-default); border-radius: var(--radius-md, 8px);
  font-size: var(--font-small, 14px); color: var(--text-primary);
  background: var(--bg-sub-card); outline: none; box-sizing: border-box;
}
.search-input::placeholder { color: var(--text-placeholder); }
.search-input:focus { border-color: var(--accent-primary); }
.search-icon {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted); pointer-events: none;
}

/* ===== 工作台固定项 ===== */
.workbench-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; min-height: 45px; padding: 0 10px;
  border: none; background: var(--accent-primary10); cursor: pointer;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-h4, 16px); font-weight: 500; color: var(--accent-primary);
  text-align: left; flex-shrink: 0;
  transition: background .15s, color .15s;
}
.workbench-item:hover { background: var(--accent-primary); color: #fff; }
.workbench-item.active { background: var(--accent-primary); color: #fff; }

/* ===== 分隔线 ===== */
.sidebar-divider {
  border: none; border-top: 1px solid var(--border-low);
  margin: var(--spacing-sm, 6px) 0; flex-shrink: 0;
}

/* ===== 分组标题 ===== */
.section-header {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 10px;
  border: none; background: none; cursor: pointer;
  font-size: var(--font-small, 14px); font-weight: 500; color: var(--text-muted);
  text-align: left; border-radius: var(--radius-sm, 6px);
  transition: background .15s; flex-shrink: 0;
}
.section-header:hover { background: var(--accent-primary10); }
.section-label { flex: 1; }
.section-chevron {
  flex-shrink: 0; transition: transform .2s; color: var(--text-muted);
}
.section-chevron.rotated { transform: rotate(180deg); }
.section-body {
  display: flex; flex-direction: column; gap: 2px;
}

/* ===== 侧栏项（复用已有样式，保留下划线变量） ===== */
.side-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; height: 40px; padding: 0 10px;
  border: none; background: none; cursor: pointer;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-body, 16px); font-weight: 400;
  color: var(--text-secondary); text-align: left; flex-shrink: 0;
  transition: background .15s;
}
.side-item:hover { background: var(--accent-primary10); }
.side-item.active { background: var(--accent-primary); color: #FFFFFF; }
.side-item.active .side-arrow path { stroke: #FFFFFF; }
.side-item.active .nav-entry-arrow path { stroke: #FFFFFF; }
.side-item.active .pin-icon { color: rgba(255,255,255,0.7); }
.side-item-placeholder {
  cursor: default; opacity: 0.5;
}

.side-icon { width: 18px; height: 18px; flex-shrink: 0; color: var(--text-muted); }
.side-item.active .side-icon { color: #FFFFFF; }
.side-item:hover .side-icon { color: var(--accent-primary); }
.side-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.side-arrow { flex-shrink: 0; transition: transform .2s; }
.side-arrow.rotated { transform: rotate(180deg); }

.nav-entry-arrow {
  flex-shrink: 0; color: var(--text-muted); opacity: 0.5;
}

/* 二级菜单 */
.side-sub { display: flex; flex-direction: column; gap: 2px; }
.side-sub-item {
  display: flex; align-items: center;
  width: 100%; height: 38px; padding-left: 42px; padding-right: 10px;
  border: none; background: none; cursor: pointer;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-small, 14px); font-weight: 400;
  color: var(--text-secondary); text-align: left;
  transition: background .15s;
}
.side-sub-item:hover { color: var(--accent-primary); }
.side-sub-item.active { background: var(--accent-primary); color: #FFFFFF; }

/* ===== 钉选 ===== */
.pin-icon {
  display: none; font-size: 14px; flex-shrink: 0;
  cursor: pointer; color: var(--text-placeholder); width: 18px; text-align: center;
}
.side-item:hover .pin-icon { display: inline-block; }
.pin-icon.pinned { display: inline-block; color: var(--warning); }

.pin-active {
  font-size: 14px; flex-shrink: 0; width: 18px; text-align: center;
  color: var(--warning); cursor: default;
}

/* ===== 无匹配结果 ===== */
.no-results {
  text-align: center; padding: 24px 12px;
  font-size: var(--font-small, 14px); color: var(--text-placeholder);
  flex-shrink: 0;
}

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
  .left-sidebar .nav-entry-arrow,
  .left-sidebar .side-sub,
  .left-sidebar .section-chevron,
  .left-sidebar .section-body,
  .left-sidebar .search-input,
  .left-sidebar .search-icon,
  .left-sidebar .sidebar-divider,
  .left-sidebar .pinned-section,
  .left-sidebar .no-results,
  .left-sidebar .pin-icon { display: none !important; }
  .left-sidebar .sidebar-search { display: none; }
  .left-sidebar .workbench-item {
    justify-content: center; padding: 0; min-height: 45px;
  }
  .left-sidebar .side-item {
    justify-content: center; padding: 0; gap: 0; height: 45px;
  }
  .left-sidebar.collapsed { width: 72px; }
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
}

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) {
  background-color: var(--pagi-bg); color: var(--pagi-text);
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .el-pager li.is-active) {
  background-color: var(--accent-primary); color: var(--btn-primary-color);
  border-color: var(--accent-primary);
}
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important;
  border: 1px solid var(--border-default);
}
:deep(.el-pagination .btn-prev.is-disabled),
:deep(.el-pagination .btn-next.is-disabled) {
  color: var(--text-muted) !important; background-color: var(--pagi-bg) !important;
}
:deep(.el-pagination .el-select .el-select__wrapper) {
  background-color: var(--bg-card) !important; color: var(--text-secondary);
  border: 1px solid var(--border-high) !important; box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-high) !important; box-shadow: none !important;
}
:deep(.el-pagination .el-pagination__jump .el-input__inner) {
  color: var(--text-primary) !important; background-color: var(--bg-card);
}
:deep(.el-loading-mask .el-loading-text) { color: var(--text-secondary); }
</style>