import type { WidgetType } from './widget-registry'

/**
 * 业务域隐式约定（按 role key 命名分桶，不新增独立 dashboard 路由）：
 * - fire-safety-*         物业方（消防安全）
 * - duty-officer          消控值班
 * - project-lead          服务方项目负责人
 * - tech-lead             服务方技术负责人
 * - maintenance-engineer  服务方工程师
 * - safety-supervisor     监管方
 * - platform-ops/admin    平台方
 *
 * 后续接业务域时按此命名约定扩展 roleDefaults 即可，registry 与 dashboard 框架不动。
 */

/**
 * 单个组件槽位
 *
 * size 语义（v3 占用单位制，不再是 flex-basis 百分比别名）：
 *   size:1 → 3 单位（视觉 = 满行 100%）
 *   size:2 → 2 单位（视觉 = 半行 50%）
 *   size:3 → 1 单位（视觉 = 三分行 33.33%）
 *
 * 单行最多 6 单位，组合：3+3 / 3+2+1 / 2+2+2 / 2+2+1+1 / 1×6 / 1+1+1+1+2 等
 * 见 src/utils/dashboard-layout.ts 的 ROW_MAX_UNITS / SIZE_UNITS。
 */
export interface WidgetSlot {
  id: string
  type: WidgetType
  size: 1 | 2 | 3
  config?: Record<string, any>
}

/**
 * 单行容器（v3 引入，替代 v2 的扁平 WidgetSlot[]）
 *
 * 约束：
 *   - slots.length >= 1（启动校验会移除空 row）
 *   - rowUnits(slots) <= 6（数据损坏时会被 sanitizeLayout 拆行）
 *   - 拖拽跨行时 row.id 保持稳定
 */
export interface WidgetRow {
  id: string
  slots: WidgetSlot[]
}

/** 仪表盘预设 */
export interface DashboardPreset {
  id: string
  label: string
  description?: string
  /** 单行最大单位数（默认 6，响应式窄屏由 useResponsiveRows 决定视觉，不动数据） */
  maxUnits: 6
  roleDefaults: Record<string, WidgetRow[]>
  availableWidgets: WidgetType[]
}

export const dashboardPresets: Record<string, DashboardPreset> = {
  // ===== 工作台 =====
  workbench: {
    id: 'workbench',
    label: '工作台',
    description: '跨业务域聚合工作入口',
    maxUnits: 6,
    availableWidgets: [
      'app-shortcuts', 'quick-actions', 'my-tasks', 'notifications',
      'order-overview', 'sla-overview', 'plan-status',
      'stat-cards', 'ranking', 'trend-line', 'shortcuts-grid', 'realtime-alerts',
      'radar-chart', 'pie-chart', 'heatmap', 'bar-chart',
      'placeholder',
    ],
    roleDefaults: {
      // ===== 物业方 =====
      'fire-safety-responsible': [
        // 行 1：sla-overview (size:2) — 半行
        { id: 'r-fsr-1', slots: [
          { id: 'wb-fsr-1', type: 'sla-overview', size: 2 },
        ] },
        // 行 2：order-overview (size:1) + placeholder (size:1) — 各半
        { id: 'r-fsr-2', slots: [
          { id: 'wb-fsr-2', type: 'order-overview', size: 1 },
          { id: 'wb-fsr-3', type: 'placeholder', size: 1, config: { moduleName: '安全态势', icon: 'shield' } },
        ] },
      ],
      'fire-safety-manager': [
        // 主推布局（5 行）：
        // 行 1：stat-cards 满行（bare 双指标卡，size:1 占 100%）
        { id: 'r-fsm-1', slots: [
          { id: 'wb-fsm-stats', type: 'stat-cards', size: 1, config: { bare: true } },
        ] },
        // 行 2：shortcuts-grid (size:2) + realtime-alerts (size:1) = 5 单位 stretch 满 100%
        { id: 'r-fsm-2', slots: [
          { id: 'wb-fsm-sg', type: 'shortcuts-grid', size: 2 },
          { id: 'wb-fsm-alerts', type: 'realtime-alerts', size: 1 },
        ] },
        // 行 3：trend-line (size:2) + heatmap (size:2) = 4 单位 stretch 满 100%
        { id: 'r-fsm-3', slots: [
          { id: 'wb-fsm-trend', type: 'trend-line', size: 2 },
          { id: 'wb-fsm-heatmap', type: 'heatmap', size: 2 },
        ] },
        // 行 4：bar-chart (size:2) + ranking (size:3) + radar-chart (size:3) = 6 单位
        { id: 'r-fsm-4', slots: [
          { id: 'wb-fsm-bar', type: 'bar-chart', size: 2 },
          { id: 'wb-fsm-rank', type: 'ranking', size: 3 },
          { id: 'wb-fsm-radar', type: 'radar-chart', size: 3 },
        ] },
        // 行 5：pie-chart (size:3) — 三分行 stretch 满 100%
        { id: 'r-fsm-5', slots: [
          { id: 'wb-fsm-pie', type: 'pie-chart', size: 3 },
        ] },
      ],
      'duty-officer': [
        // 行 1：quick-actions + my-tasks = 6 单位
        { id: 'r-do-1', slots: [
          { id: 'wb-do-1', type: 'quick-actions', size: 1 },
          { id: 'wb-do-2', type: 'my-tasks', size: 1 },
        ] },
        // 行 2：placeholder 满行
        { id: 'r-do-2', slots: [
          { id: 'wb-do-3', type: 'placeholder', size: 1, config: { moduleName: '告警概览', icon: 'bell' } },
        ] },
      ],
      // ===== 服务方 =====
      'project-lead': [
        // 行 1：sla-overview + order-overview = 5 单位 stretch
        { id: 'r-pl-1', slots: [
          { id: 'wb-pl-1', type: 'sla-overview', size: 2 },
          { id: 'wb-pl-2', type: 'order-overview', size: 1 },
        ] },
        // 行 2：plan-status 满行
        { id: 'r-pl-2', slots: [
          { id: 'wb-pl-3', type: 'plan-status', size: 1 },
        ] },
      ],
      'tech-lead': [
        // 行 1：my-tasks + order-overview = 6 单位
        { id: 'r-tl-1', slots: [
          { id: 'wb-tl-1', type: 'my-tasks', size: 1 },
          { id: 'wb-tl-2', type: 'order-overview', size: 1 },
        ] },
        // 行 2：plan-status 满行
        { id: 'r-tl-2', slots: [
          { id: 'wb-tl-3', type: 'plan-status', size: 1 },
        ] },
      ],
      'maintenance-engineer': [
        // 行 1：my-tasks + placeholder = 6 单位
        { id: 'r-me-1', slots: [
          { id: 'wb-me-1', type: 'my-tasks', size: 1 },
          { id: 'wb-me-2', type: 'placeholder', size: 1, config: { moduleName: '今日任务', icon: 'calendar' } },
        ] },
      ],
      // ===== 监管方 =====
      'safety-supervisor': [
        // 行 1：sla-overview + order-overview = 5 单位
        { id: 'r-ss-1', slots: [
          { id: 'wb-ss-1', type: 'sla-overview', size: 2 },
          { id: 'wb-ss-2', type: 'order-overview', size: 1 },
        ] },
        // 行 2：两个 placeholder = 6 单位
        { id: 'r-ss-2', slots: [
          { id: 'wb-ss-3', type: 'placeholder', size: 1, config: { moduleName: '隐患概览', icon: 'warning' } },
          { id: 'wb-ss-4', type: 'placeholder', size: 1, config: { moduleName: '值守概览', icon: 'monitor' } },
        ] },
      ],
      // ===== 平台方（systemRole 用户） =====
      'platform-ops': [
        // 行 1：app-shortcuts + placeholder1 = 6 单位
        { id: 'r-po-1', slots: [
          { id: 'wb-po-1', type: 'app-shortcuts', size: 1 },
          { id: 'wb-po-2', type: 'placeholder', size: 1, config: { moduleName: '租户管理', icon: 'building' } },
        ] },
        // 行 2：placeholder2 满行
        { id: 'r-po-2', slots: [
          { id: 'wb-po-3', type: 'placeholder', size: 1, config: { moduleName: '系统概览', icon: 'dashboard' } },
        ] },
      ],
      'platform-admin': [
        // 行 1：stat-cards + app-shortcuts = 6 单位
        { id: 'r-pa-1', slots: [
          { id: 'wb-pa-stats', type: 'stat-cards', size: 1 },
          { id: 'wb-pa-1', type: 'app-shortcuts', size: 1 },
        ] },
        // 行 2：两个 placeholder = 6 单位
        { id: 'r-pa-2', slots: [
          { id: 'wb-pa-2', type: 'placeholder', size: 1, config: { moduleName: '系统健康', icon: 'monitor' } },
          { id: 'wb-pa-3', type: 'placeholder', size: 1, config: { moduleName: '升级管理', icon: 'upload' } },
        ] },
      ],
    },
  },

  // ===== 系统管理·工单数据看板（M5）=====
  'system-dashboard': {
    id: 'system-dashboard',
    label: '工单数据看板',
    description: '工单 SLA 达标率、趋势、效率排行',
    maxUnits: 6,
    availableWidgets: ['order-overview', 'sla-overview'],
    roleDefaults: {
      'safety-supervisor': [
        // 行 1：sla-overview + order-overview = 5 单位 stretch
        { id: 'r-sd-ss-1', slots: [
          { id: 'sd-1', type: 'sla-overview', size: 2 },
          { id: 'sd-2', type: 'order-overview', size: 1 },
        ] },
      ],
      'fire-safety-manager': [
        // 行 1：order-overview 满行
        { id: 'r-sd-fsm-1', slots: [
          { id: 'sd-1', type: 'order-overview', size: 1 },
        ] },
      ],
    },
  },
}

/** 默认岗位 */
export const DEFAULT_ROLE = 'fire-safety-manager'