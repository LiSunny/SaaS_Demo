import { createRouter, createWebHistory } from 'vue-router'

const DefaultLayout = () => import('@/layouts/DefaultLayout.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/maintenance/plans' },
    {
      path: '/maintenance',
      component: DefaultLayout,
      meta: { topMenu: 'device' },
      children: [
        { path: 'plans', name: 'MaintenancePlanList', component: () => import('@/views/maintenance/PlanList.vue') },
        { path: 'plans/detail/:id', name: 'MaintenancePlanDetail', component: () => import('@/views/maintenance/PlanDetail.vue'), meta: { hidden: true } },
      ],
    },
    {
      path: '/workflow',
      component: DefaultLayout,
      meta: { topMenu: 'system' },
      children: [
        { path: 'template', name: 'WorkflowTemplateList', component: () => import('@/views/workflow/TemplateList.vue') },
        { path: 'template/config/:id?', name: 'WorkflowTemplateConfig', component: () => import('@/views/workflow/TemplateConfig.vue'), meta: { hidden: true } },
        { path: 'monitor', name: 'WorkOrderMonitor', component: () => import('@/views/workflow/WorkOrderMonitor.vue') },
	        { path: 'order/:id', name: 'WorkOrderDetail', component: () => import('@/views/workflow/WorkOrderDetail.vue'), meta: { hidden: true } },
      ],
    },
  ],
})

export default router
