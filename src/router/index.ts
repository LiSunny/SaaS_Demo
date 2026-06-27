import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由配置
 *
 * ⚠️ meta.topMenu 已弃用（侧栏主导航不再依赖顶部菜单过滤）。
 * 保留字段仅为向后兼容，新路由无需设置。
 *
 * 路由路径兼容一览（新增域首页可放占位页，后续 /demo-scaffold 填充）：
 *   /device     → 设备管理域首页（跳转式入口）
 *   /iot        → IOT 域首页（跳转式入口）
 *   /platform   → 平台配置域首页（跳转式入口）
 *   /admin      → 系统管理域首页（跳转式入口）
 */

const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ===== 登录页（无布局，独立页面） =====
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { standalone: true },
    },

    // ===== 全屏可视化大屏首页 =====
    {
      path: '/',
      component: () => import('@/layouts/StandaloneLayout.vue'),
      children: [
        { path: '', redirect: { name: 'BigscreenLanding' } },
        { path: 'landing', name: 'BigscreenLanding', component: () => import('@/views/bigscreen/BigscreenLanding.vue') },
        { path: 'landing/street-detail', name: 'StreetDetail', component: () => import('@/views/bigscreen/StreetDetailPage.vue') },
        { path: 'landing/fire-control', name: 'FireControlDetail', component: () => import('@/views/bigscreen/FireControlPage.vue') },
      ],
    },

    // ===== 工作台 =====
    {
      path: '/workbench',
      component: DefaultLayout,
      children: [
        { path: '', name: 'Workbench', component: () => import('@/views/workbench/Workbench.vue') },
      ],
    },

    // ===== 流程管理/工单管理（原系统管理路由，路径不变） =====
    {
      path: '/system',
      component: DefaultLayout,
      children: [
        { path: 'dashboard', name: 'SystemDashboard', component: () => import('@/views/system/Dashboard.vue') },
        { path: 'template', name: 'WorkflowTemplateList', component: () => import('@/views/workflow/TemplateList.vue') },
        { path: 'template/config/:id?', name: 'WorkflowTemplateConfig', component: () => import('@/views/workflow/TemplateConfig.vue'), meta: { hidden: true } },
        { path: 'monitor', name: 'WorkOrderMonitor', component: () => import('@/views/workflow/WorkOrderMonitor.vue') },
        { path: 'order/:id', name: 'WorkOrderDetail', component: () => import('@/views/workflow/WorkOrderDetail.vue'), meta: { hidden: true } },
      ],
    },

    // ===== 维保管理 =====
    {
      path: '/maintenance',
      component: DefaultLayout,
      children: [
        { path: 'plans', name: 'MaintenancePlanList', component: () => import('@/views/maintenance/PlanList.vue') },
        { path: 'plans/detail/:id', name: 'MaintenancePlanDetail', component: () => import('@/views/maintenance/PlanDetail.vue'), meta: { hidden: true } },
      ],
    },

    // ===== 跳转式域首页（>10 模块的大域，占位页，后续填充） =====
    {
      path: '/device',
      component: DefaultLayout,
      children: [
        { path: '', name: 'DeviceOverview', component: () => import('@/views/device/Overview.vue') },
      ],
    },
    {
      path: '/iot',
      component: DefaultLayout,
      children: [
        { path: '', name: 'IotOverview', component: () => import('@/views/iot/Overview.vue') },
      ],
    },
    {
      path: '/platform',
      component: DefaultLayout,
      children: [
        { path: '', name: 'PlatformOverview', component: () => import('@/views/platform/Overview.vue') },
      ],
    },
    {
      path: '/admin',
      component: DefaultLayout,
      children: [
        { path: '', name: 'AdminOverview', component: () => import('@/views/admin/Overview.vue') },
        { path: 'enterpriseManagement/index', name: 'EnterpriseList', component: () => import('@/views/admin/EnterpriseList.vue') },
        { path: 'enterpriseManagement/create', name: 'EnterpriseCreate', component: () => import('@/views/admin/EnterpriseForm.vue'), meta: { hidden: true } },
        { path: 'enterpriseManagement/edit', name: 'EnterpriseEdit', component: () => import('@/views/admin/EnterpriseForm.vue'), meta: { hidden: true } },
        { path: 'enterpriseManagement/detail', name: 'EnterpriseDetail', component: () => import('@/views/admin/EnterpriseDetail.vue'), meta: { hidden: true } },
      ],
    },

    // ===== 兼容重定向（/workflow/* → /system/*） =====
    {
      path: '/workflow',
      redirect: '/system/template',
    },
    { path: '/workflow/template', redirect: '/system/template' },
    { path: '/workflow/template/config/:id?', redirect: to => ({ path: to.params.id ? `/system/template/config/${to.params.id}` : '/system/template/config', query: to.query }) },
    { path: '/workflow/monitor', redirect: '/system/monitor' },
    { path: '/workflow/order/:id', redirect: to => `/system/order/${to.params.id}` },
  ],
})

// ===== 全局路由守卫：未登录 → 跳转登录页 =====
router.beforeEach((to) => {
  const token = localStorage.getItem('auth_token')
  const isLoginPage = to.path === '/login'

  if (!token && !isLoginPage) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 已登录访问登录页 → 跳转工作台
  if (token && isLoginPage) {
    return { path: '/workbench' }
  }
})

export default router
