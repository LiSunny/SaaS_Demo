import { createRouter, createWebHistory } from 'vue-router'

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
      meta: { topMenu: 'workbench' },
      children: [
        { path: '', name: 'Workbench', component: () => import('@/views/workbench/Workbench.vue') },
      ],
    },

    // ===== 系统管理 =====
    {
      path: '/system',
      component: DefaultLayout,
      meta: { topMenu: 'system' },
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
      meta: { topMenu: 'maintain' },
      children: [
        { path: 'plans', name: 'MaintenancePlanList', component: () => import('@/views/maintenance/PlanList.vue') },
        { path: 'plans/detail/:id', name: 'MaintenancePlanDetail', component: () => import('@/views/maintenance/PlanDetail.vue'), meta: { hidden: true } },
      ],
    },

    // ===== 旧路径兼容（/workflow/* → /system/*）=====
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
