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
    // 默认首页 → 工作台
    { path: '/', redirect: '/workbench' },

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

export default router