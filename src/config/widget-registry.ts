import { defineAsyncComponent } from 'vue'

export const widgetRegistry = {
  // ===== 核心 Widget（阶段1）=====
  'app-shortcuts': defineAsyncComponent(
    () => import('@/views/workbench/widgets/AppShortcutsWidget.vue')
  ),
  'quick-actions': defineAsyncComponent(
    () => import('@/views/workbench/widgets/QuickActionsWidget.vue')
  ),
  'my-tasks': defineAsyncComponent(
    () => import('@/views/workbench/widgets/MyTasksWidget.vue')
  ),
  'notifications': defineAsyncComponent(
    () => import('@/views/workbench/widgets/NotificationWidget.vue')
  ),

  // ===== 工单类 =====
  'order-overview': defineAsyncComponent(
    () => import('@/views/work-order/widgets/OrderOverviewWidget.vue')
  ),
  'sla-overview': defineAsyncComponent(
    () => import('@/views/work-order/widgets/SlaOverviewWidget.vue')
  ),

  // ===== 维保类（阶段2）=====
  'plan-status': defineAsyncComponent(
    () => import('@/views/maintenance/widgets/PlanStatusWidget.vue')
  ),

  // ===== 通用 =====
  placeholder: defineAsyncComponent(
    () => import('@/components/business/PlaceholderWidget.vue')
  ),
} as const

export type WidgetType = keyof typeof widgetRegistry

export const widgetLabels: Record<WidgetType, string> = {
  'app-shortcuts': '应用快捷入口',
  'quick-actions': '快捷操作',
  'my-tasks': '我的待办',
  'notifications': '消息通知',
  'order-overview': '工单概览',
  'sla-overview': 'SLA 概览',
  'plan-status': '维保计划',
  placeholder: '占位卡片',
}

export const widgetIcons: Partial<Record<WidgetType, string>> = {
  'app-shortcuts': 'Grid',
  'quick-actions': 'Plus',
  'my-tasks': 'List',
  'notifications': 'Bell',
  'order-overview': 'Document',
  'sla-overview': 'Timer',
  'plan-status': 'Calendar',
  placeholder: 'More',
}
