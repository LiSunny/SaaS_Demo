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
      // ===== 物业方 =====
      'fire-safety-responsible': [
        { id: 'wb-fsr-1', type: 'sla-overview',   size: 2, order: 0 },
        { id: 'wb-fsr-2', type: 'order-overview', size: 1, order: 1 },
        { id: 'wb-fsr-3', type: 'placeholder',    size: 1, order: 2, config: { moduleName: '安全态势', icon: 'shield' } },
      ],
      'fire-safety-manager': [
        { id: 'wb-fsm-1', type: 'quick-actions',  size: 1, order: 0 },
        { id: 'wb-fsm-2', type: 'my-tasks',       size: 1, order: 1 },
        { id: 'wb-fsm-3', type: 'order-overview', size: 1, order: 2 },
        { id: 'wb-fsm-4', type: 'plan-status',    size: 1, order: 3 },
      ],
      'duty-officer': [
        { id: 'wb-do-1', type: 'quick-actions',   size: 1, order: 0 },
        { id: 'wb-do-2', type: 'my-tasks',        size: 1, order: 1 },
        { id: 'wb-do-3', type: 'placeholder',     size: 1, order: 2, config: { moduleName: '告警概览', icon: 'bell' } },
      ],
      // ===== 服务方 =====
      'project-lead': [
        { id: 'wb-pl-1', type: 'sla-overview',    size: 2, order: 0 },
        { id: 'wb-pl-2', type: 'order-overview',  size: 1, order: 1 },
        { id: 'wb-pl-3', type: 'plan-status',     size: 1, order: 2 },
      ],
      'tech-lead': [
        { id: 'wb-tl-1', type: 'my-tasks',        size: 1, order: 0 },
        { id: 'wb-tl-2', type: 'order-overview',  size: 1, order: 1 },
        { id: 'wb-tl-3', type: 'plan-status',     size: 1, order: 2 },
      ],
      'maintenance-engineer': [
        { id: 'wb-me-1', type: 'my-tasks',        size: 1, order: 0 },
        { id: 'wb-me-2', type: 'placeholder',     size: 1, order: 1, config: { moduleName: '今日任务', icon: 'calendar' } },
      ],
      // ===== 监管方 =====
      'safety-supervisor': [
        { id: 'wb-ss-1', type: 'sla-overview',    size: 2, order: 0 },
        { id: 'wb-ss-2', type: 'order-overview',  size: 1, order: 1 },
        { id: 'wb-ss-3', type: 'placeholder',     size: 1, order: 2, config: { moduleName: '隐患概览', icon: 'warning' } },
        { id: 'wb-ss-4', type: 'placeholder',     size: 1, order: 3, config: { moduleName: '值守概览', icon: 'monitor' } },
      ],
      // ===== 平台方（systemRole 用户） =====
      'platform-ops': [
        { id: 'wb-po-1', type: 'app-shortcuts',  size: 1, order: 0 },
        { id: 'wb-po-2', type: 'placeholder',    size: 1, order: 1, config: { moduleName: '租户管理', icon: 'building' } },
        { id: 'wb-po-3', type: 'placeholder',    size: 1, order: 2, config: { moduleName: '系统概览', icon: 'dashboard' } },
      ],
      'platform-admin': [
        { id: 'wb-pa-1', type: 'app-shortcuts',  size: 1, order: 0 },
        { id: 'wb-pa-2', type: 'placeholder',    size: 1, order: 1, config: { moduleName: '系统健康', icon: 'monitor' } },
        { id: 'wb-pa-3', type: 'placeholder',    size: 1, order: 2, config: { moduleName: '升级管理', icon: 'upload' } },
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
      'safety-supervisor': [
        { id: 'sd-1', type: 'sla-overview',   size: 2, order: 0 },
        { id: 'sd-2', type: 'order-overview', size: 1, order: 1 },
      ],
      'fire-safety-manager': [
        { id: 'sd-1', type: 'order-overview', size: 2, order: 0 },
      ],
    },
  },
}

/** 默认岗位 */
export const DEFAULT_ROLE = 'fire-safety-manager'
