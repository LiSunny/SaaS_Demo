import type { WidgetType } from './widget-registry'

/** 单个组件槽位 */
export interface WidgetSlot {
  id: string
  type: WidgetType
  size: 1 | 2 | 3
  order: number
  config?: Record<string, any>
}

/** 仪表盘预设 */
export interface DashboardPreset {
  id: string
  label: string
  description?: string
  maxColumns: 3 | 4
  roleDefaults: Record<string, WidgetSlot[]>
  availableWidgets: WidgetType[]
}

export const dashboardPresets: Record<string, DashboardPreset> = {
  // ===== 工作台 =====
  workbench: {
    id: 'workbench',
    label: '工作台',
    description: '跨业务域聚合工作入口',
    maxColumns: 3,
    availableWidgets: [
      'app-shortcuts', 'quick-actions', 'my-tasks', 'notifications',
      'order-overview', 'sla-overview', 'plan-status', 'placeholder',
    ],
    roleDefaults: {
      // 物业管理员
      property: [
        { id: 'wb-1', type: 'app-shortcuts',  size: 1, order: 0 },
        { id: 'wb-2', type: 'quick-actions',  size: 1, order: 1 },
        { id: 'wb-3', type: 'my-tasks',       size: 1, order: 2 },
        { id: 'wb-4', type: 'order-overview', size: 1, order: 3 },
        { id: 'wb-5', type: 'notifications',  size: 1, order: 4 },
        { id: 'wb-6', type: 'plan-status',    size: 1, order: 5 },
        { id: 'wb-7', type: 'placeholder',    size: 1, order: 6, config: { moduleName: '隐患管理' } },
        { id: 'wb-8', type: 'placeholder',    size: 1, order: 7, config: { moduleName: '设备管理' } },
        { id: 'wb-9', type: 'placeholder',    size: 1, order: 8, config: { moduleName: '巡查检查' } },
      ],
      // 安全监管员
      supervisor: [
        { id: 'wb-s1', type: 'app-shortcuts',  size: 1, order: 0 },
        { id: 'wb-s2', type: 'sla-overview',   size: 2, order: 1 },
        { id: 'wb-s3', type: 'my-tasks',       size: 1, order: 2 },
        { id: 'wb-s4', type: 'order-overview', size: 1, order: 3 },
        { id: 'wb-s5', type: 'notifications',  size: 1, order: 4 },
        { id: 'wb-s6', type: 'placeholder',    size: 1, order: 5, config: { moduleName: '隐患管理' } },
      ],
      // 消防服务工程师
      engineer: [
        { id: 'wb-e1', type: 'app-shortcuts',  size: 1, order: 0 },
        { id: 'wb-e2', type: 'quick-actions',  size: 1, order: 1 },
        { id: 'wb-e3', type: 'my-tasks',       size: 1, order: 2 },
        { id: 'wb-e4', type: 'order-overview', size: 1, order: 3 },
        { id: 'wb-e5', type: 'notifications',  size: 1, order: 4 },
        { id: 'wb-e6', type: 'plan-status',    size: 1, order: 5 },
      ],
    },
  },

  // ===== 系统管理·工单数据看板（M5）=====
  'system-dashboard': {
    id: 'system-dashboard',
    label: '工单数据看板',
    description: '工单 SLA 达标率、趋势、效率排行',
    maxColumns: 3,
    availableWidgets: ['order-overview', 'sla-overview'],
    roleDefaults: {
      supervisor: [
        { id: 'sd-1', type: 'sla-overview', size: 2, order: 0 },
        { id: 'sd-2', type: 'order-overview', size: 1, order: 1 },
      ],
      property: [
        { id: 'sd-1', type: 'order-overview', size: 2, order: 0 },
      ],
    },
  },
}

/** 默认角色 */
export const DEFAULT_ROLE = 'property'
