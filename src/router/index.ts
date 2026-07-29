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
  scrollBehavior(to, _from, _savedPosition) {
    if (to.hash) {
      return { el: to.hash }
    }
    return { top: 0 }
  },
  routes: [
    // ===== 对外门户页（无布局，独立页面，无需登录） =====
    {
      path: '/portal',
      name: 'Portal',
      component: () => import('@/views/portal/PortalPage.vue'),
      meta: { standalone: true },
    },
    // 行业专题页
    {
      path: '/portal/campus',
      name: 'IndustryCampus',
      component: () => import('@/views/portal/IndustryCampus.vue'),
      meta: { standalone: true },
    },
    {
      path: '/portal/industry',
      name: 'IndustryIndustry',
      component: () => import('@/views/portal/IndustryIndustry.vue'),
      meta: { standalone: true },
    },
    {
      path: '/portal/merchant',
      name: 'IndustryMerchant',
      component: () => import('@/views/portal/IndustryMerchant.vue'),
      meta: { standalone: true },
    },
    {
      path: '/portal/hotwork',
      name: 'IndustryHotWork',
      component: () => import('@/views/portal/IndustryHotWork.vue'),
      meta: { standalone: true },
    },
    // 案例详情页
    {
      path: '/portal/case/:slug',
      name: 'CaseDetail',
      component: () => import('@/views/portal/CaseDetail.vue'),
      meta: { standalone: true },
    },
    // 大屏静态预览页
    {
      path: '/portal/preview/:type',
      name: 'BigscreenPreview',
      component: () => import('@/views/portal/BigscreenPreview.vue'),
      meta: { standalone: true },
    },

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
        { path: 'gongmao', name: 'BigscreenGongmao', component: () => import('@/views/bigscreen/BigscreenGongmao.vue') },
        { path: 'enterprise-cockpit', name: 'EnterpriseCockpit', component: () => import('@/views/bigscreen/EnterpriseCockpit.vue') },
        { path: 'resumption-bigscreen', name: 'BigscreenResumption', component: () => import('@/views/bigscreen/BigscreenResumption.vue') },
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
        { path: 'list', name: 'DeviceList', component: () => import('@/views/device/DeviceList.vue') },
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
        { path: 'enterpriseManagement/detail', name: 'EnterpriseDetail', component: () => import('@/views/admin/EnterpriseDetail.vue'), meta: { hidden: true } },
        { path: 'users', name: 'UserList', component: () => import('@/views/admin/UserList.vue') },
        { path: 'positions', name: 'PositionList', component: () => import('@/views/admin/PositionList.vue') },
        { path: 'bigscreens', name: 'BigscreenList', component: () => import('@/views/admin/BigscreenList.vue') },
      ],
    },

    // ===== 企业管理（M1 企业用户管理） =====
    {
      path: '/enterprise',
      component: DefaultLayout,
      children: [
        { path: 'members', name: 'EnterpriseMembers', component: () => import('@/views/enterprise/Members.vue') },
        { path: 'positions', name: 'EnterprisePositions', component: () => import('@/views/enterprise/PositionManage.vue') },
      ],
    },

    // ===== 复工复产管理 =====
    {
      path: '/resumption',
      component: DefaultLayout,
      children: [
        { path: '', name: 'ResumptionPlanList', component: () => import('@/views/resumption/PlanList.vue') },
        { path: ':id', name: 'ResumptionPlanDetail', component: () => import('@/views/resumption/PlanDetail.vue'), meta: { hidden: true } },
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

// ===== 全局路由守卫 =====
router.beforeEach((to) => {
  const token = localStorage.getItem('auth_token')
  const isPublicPage = to.path === '/login' || to.path.startsWith('/portal')

  if (!token && !isPublicPage) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 已登录访问登录页 → 跳转工作台
  if (token && to.path === '/login') {
    return { path: '/workbench' }
  }

  // 系统角色路由保护
  const systemRole = localStorage.getItem('system-role')
  const isAdminRoute = to.path.startsWith('/admin') || to.path.startsWith('/system/template')
  const isBusinessRoute = to.path.startsWith('/system/monitor')
    || to.path.startsWith('/system/order')
    || to.path.startsWith('/system/dashboard')
    || to.path.startsWith('/maintenance')
    || to.path.startsWith('/device')
    || to.path.startsWith('/iot')

  if (systemRole && isBusinessRoute) {
    // 系统角色用户不能访问业务域路由
    return { path: '/workbench' }
  }

  // 系统角色用户访问根路由（大屏）→ 工作台
  if (systemRole && (to.path === '/' || to.path.startsWith('/landing') || to.path.startsWith('/gongmao'))) {
    return { path: '/workbench' }
  }

  if (!systemRole && isAdminRoute) {
    // 普通用户不能访问管理路由
    return { path: '/workbench' }
  }
})

export default router
