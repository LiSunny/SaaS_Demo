/**
 * 导航数据结构
 *
 * 侧栏主导航：按"使用群体"组织（四方用户视角），工作台固定。
 *
 * 群体分组：
 *   regulator → 区域监管（监管机构）
 *   unit      → 社会单位业务域（学校/企业/商户/物业）
 *   operator  → 项目管理（社会单位-运营商）
 *   service   → 技术服务（技术服务机构）
 *   platform  → 系统管理（平台方，按 systemRole）
 *
 * 过滤逻辑（DefaultLayout）：
 *   系统角色用户 → 只显示 visibleTo 含其 systemRole 的分组
 *   普通用户     → 按当前企业的 groups（无企业时按岗位 group 兜底）过滤分组，
 *                  组内子节点按岗位 key 过滤（visibleTo）
 *
 * @see docs/design/navigation-design.md
 */

// ===== 类型定义 =====

export interface NavNode {
  key: string
  label: string
  icon?: string
  route?: string
  children?: NavNode[]
  /** 岗位 key 白名单，缺省 = 全员可见 */
  visibleTo?: string[]
}

export interface NavGroup {
  key: string
  label: string
  icon?: string
  children: NavNode[]
  /** 使用群体标签白名单：regulator|unit|operator|service，缺省 = 全员可见 */
  visibleTo?: string[]
}

// ===== 导出常量 =====

/** 工作台固定项（独立于任何分组，始终显示在搜索下方） */
export const WORKBENCH_ITEM: NavNode = {
  key: 'workbench',
  label: '工作台',
  icon: 'menuicon-53',
  route: '/workbench',
}

/**
 * 按使用群体组织的导航分组
 */
export const NAV_GROUPS: NavGroup[] = [
  // ===== 1. 区域监管（监管机构） =====
  {
    key: 'regulator',
    label: '区域监管',
    icon: 'dashboard',
    visibleTo: ['regulator'],
    children: [
      {
        key: 'reg-situation',
        label: '态势总览',
        icon: 'menuicon-48',
        children: [
          { key: 'reg-bigscreen', label: '监管大屏', route: '/landing' },
          { key: 'reg-report', label: '智能报表' },
        ],
      },
      {
        key: 'reg-supervise',
        label: '督办管理',
        icon: 'menuicon-30',
        children: [
          { key: 'reg-urge', label: '超时督办' },
          { key: 'reg-ranking', label: '红黑榜考核' },
        ],
      },
      {
        key: 'reg-inspect',
        label: '监管检查',
        icon: 'menuicon-25',
        children: [
          { key: 'reg-whitelist', label: '白名单管理' },
          { key: 'reg-check-record', label: '检查记录' },
        ],
      },
      {
        key: 'reg-system',
        label: '系统管理',
        icon: 'menuicon-43',
        visibleTo: ['org-admin'],
        children: [
          { key: 'reg-members', label: '部门成员', route: '/enterprise/members' },
          { key: 'reg-positions', label: '部门岗位', route: '/enterprise/positions' },
        ],
      },
    ],
  },


  // ===== 2. 隐患排查治理（社会单位：消防安全管理人） =====
  {
    key: 'unit-hazard',
    label: '隐患排查治理',
    icon: 'menuicon-29',
    visibleTo: ['unit'],
    children: [
      // 模块介绍（分组首项，进入该分组的明确入口）
      {
        key: 'unit-hazard-intro',
        label: '模块介绍',
        icon: 'menuicon-50',
        route: '/workbench/hazard-intro',
      },
      {
        key: 'unit-hazard-check',
        label: '隐患排查',
        icon: 'menuicon-30',
        children: [
          { key: 'unit-hazard-ledger', label: '隐患台账', route: '/unit/hazards' },
          { key: 'unit-hazard-report', label: '隐患上报', route: '/unit/hazards/report' },
          { key: 'unit-hazard-task', label: '排查任务', route: '/unit/hazards/tasks' },
        ],
      },
      {
        key: 'unit-hazard-rectify',
        label: '隐患整改',
        icon: 'menuicon-34',
        children: [
          { key: 'unit-hazard-board', label: '整改看板', route: '/unit/hazards/board' },
        ],
      },
      {
        key: 'unit-hazard-rule',
        label: '制度与计划',
        icon: 'menuicon-37',
        children: [
          { key: 'unit-hazard-system', label: '制度建设', route: '/unit/hazards/system' },
          { key: 'unit-hazard-plan', label: '排查计划', route: '/unit/hazards/plan' },
          { key: 'unit-hazard-checklist', label: '排查清单', route: '/unit/hazards/checklist' },
        ],
      },
      {
        key: 'unit-hazard-stat',
        label: '报表与统计',
        icon: 'menuicon-47',
        children: [
          { key: 'unit-hazard-dashboard', label: '数字看板', route: '/unit/hazards/dashboard' },
          {
            key: 'unit-hazard-periodic',
            label: '周期报表',
            route: '/unit/hazards/reports',
            children: [
              {
                key: 'unit-hazard-report-internal',
                label: '对内报告',
                route: '/unit/hazards/reports/internal',
              },
              {
                key: 'unit-hazard-report-regulator',
                label: '监管报告',
                route: '/unit/hazards/reports/regulator',
              },
            ],
          },
        ],
      },
    ],
  },

  // ===== 2a. 巡查检查（社会单位：安全管理员 / 巡查员） =====
  // 菜单名称与层级对齐平台「巡查检查」模块（智慧消防云平台，实测 2026-10-26）
  {
    key: 'unit-patrol',
    label: '巡查检查',
    icon: 'menuicon-25',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-patrol-home', label: '首页', icon: 'menuicon-48', route: '/unit/patrol' },
      {
        key: 'unit-patrol-monitor',
        label: '任务监控',
        icon: 'menuicon-30',
        children: [
          { key: 'unit-patrol-task', label: '巡查任务', route: '/unit/patrol/tasks' },
        ],
      },
      { key: 'unit-patrol-forms', label: '项目配置', icon: 'menuicon-37', route: '/unit/patrol/forms' },
      { key: 'unit-patrol-locations', label: '点位管理', icon: 'menuicon-29', route: '/unit/patrol/locations' },
      {
        key: 'unit-patrol-plan-mgmt',
        label: '计划管理',
        icon: 'menuicon-9',
        children: [
          { key: 'unit-patrol-plan', label: '消防巡查', route: '/unit/patrol/plans' },
        ],
      },
      { key: 'unit-patrol-abnormal', label: '异常处置', icon: 'menuicon-24', route: '/unit/patrol/abnormal' },
      { key: 'unit-patrol-reports', label: '巡查报表', icon: 'menuicon-47', route: '/unit/patrol/reports' },
      { key: 'unit-patrol-notices', label: '通知提醒', icon: 'menuicon-34', route: '/unit/patrol/notices' },
    ],
  },

  // ===== 2b. 协同工作（社会单位：协同管理 + 我的待办/已办/发起） =====
  {
    key: 'unit-collab-work',
    label: '协同工作',
    icon: 'menuicon-2',
    visibleTo: ['unit'],
    children: [
      {
        key: 'collab-mgmt',
        label: '协同管理',
        icon: 'menuicon-42',
        children: [
          { key: 'collab-flow-template', label: '流程编排', route: '/system/template' },
          { key: 'collab-monitor', label: '协同监控', route: '/system/monitor' },
        ],
      },
      { key: 'collab-pending', label: '待办事项', route: '/collab/task/pending' },
      { key: 'collab-completed', label: '已办事项', route: '/collab/task/completed' },
      { key: 'collab-started', label: '发起事项', route: '/collab/task/started' },
    ],
  },

  // ===== 2c. 设备设施管理（设备台账 / 保养 / 运行监控 / 报表 / 日志 / 规则 / 推送） =====
  // 菜单名称与层级对齐平台「设备管理」模块（智慧消防云平台，实测 2026-10-26，港南二中租户）
  // 平台「首页」「使用手册」不纳入
  {
    key: 'device-facility',
    label: '设备设施管理',
    icon: 'menuicon-46',
    children: [
      { key: 'df-ledger', label: '设备台账', icon: 'menuicon-31', route: '/device-facility/ledger' },
      {
        key: 'df-maintenance',
        label: '保养管理',
        icon: 'menuicon-32',
        children: [
          { key: 'df-maint-standard', label: '保养规范', route: '/device-facility/maintenance/standard' },
          { key: 'df-maint-plans', label: '保养计划', route: '/device-facility/maintenance/plans' },
          { key: 'df-maint-tasks', label: '保养任务', route: '/device-facility/maintenance/tasks' },
          { key: 'df-maint-records', label: '保养记录', route: '/device-facility/maintenance/records' },
        ],
      },
      {
        key: 'df-monitor',
        label: '运行监控',
        icon: 'menuicon-33',
        children: [
          { key: 'df-monitor-status', label: '状态监控', route: '/device-facility/monitor/status' },
          { key: 'df-monitor-scene', label: '场景监控', route: '/device-facility/monitor/scene' },
        ],
      },
      {
        key: 'df-report',
        label: '报表与报告',
        icon: 'menuicon-35',
        children: [
          { key: 'df-report-alarm', label: '告警分析报告', route: '/device-facility/report/alarm' },
          { key: 'df-report-device', label: '设备运行报表', route: '/device-facility/report/device' },
        ],
      },
      {
        key: 'df-log',
        label: '系统日志',
        icon: 'menuicon-36',
        children: [
          { key: 'df-log-event', label: '事件日志', route: '/device-facility/log/event' },
        ],
      },
      {
        key: 'df-rule',
        label: '规则配置',
        icon: 'menuicon-38',
        children: [
          { key: 'df-rule-custom-event', label: '自定义事件', route: '/device-facility/rule/custom-event' },
          { key: 'df-rule-plan-point', label: '平面图描点', route: '/device-facility/rule/plan-point' },
          { key: 'df-rule-data-fetch', label: '数据拉取', route: '/device-facility/rule/data-fetch' },
          { key: 'df-rule-data-push', label: '数据推送', route: '/device-facility/rule/data-push' },
          { key: 'df-rule-strategy', label: '策略执行器', route: '/device-facility/rule/strategy' },
        ],
      },
      {
        key: 'df-notify',
        label: '消息推送',
        icon: 'menuicon-39',
        children: [
          { key: 'df-notify-alarm-push', label: '告警推送', route: '/device-facility/notify/alarm-push' },
        ],
      },
    ],
  },

  // ===== 2d. 安全概览（社会单位：学校/企业/商户/物业） =====
  // 原「安全管理›安全概览」升为独立一级菜单（安全管理一级菜单已解散）
  {
    key: 'unit-overview',
    label: '安全概览',
    icon: 'chart',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-dashboard', label: '安全态势', icon: 'menuicon-48', route: '/unit/dashboard' },
      { key: 'unit-data', label: '数据看板', icon: 'menuicon-47', route: '/unit/data' },
      { key: 'unit-bigscreen', label: '可视化大屏', icon: 'menuicon-50', route: '/enterprise-cockpit' },
    ],
  },

  // ===== 2e. 值守与应急（社会单位：值班员 / 安全管理员） =====
  // 收拢原「安全管理›告警处置」「安全管理›消防监控」「安全管理›通知提醒」
  {
    key: 'unit-duty-emergency',
    label: '值守与应急',
    icon: 'alarm',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-duty-home', label: '数据看板', icon: 'menuicon-48', route: '/unit/duty' },
      {
        key: 'unit-duty-mgmt',
        label: '值守管理',
        icon: 'menuicon-10',
        children: [
          { key: 'unit-duty-schedule', label: '值班表', route: '/unit/duty/schedule' },
          { key: 'unit-duty-records', label: '值班记录', route: '/unit/duty/records' },
          { key: 'unit-duty-checkin', label: '到岗打卡', route: '/unit/duty/checkin' },
          { key: 'unit-duty-handover', label: '交接班', route: '/unit/duty/handover' },
        ],
      },
      {
        key: 'unit-alarm',
        label: '告警处置',
        icon: 'menuicon-24',
        children: [
          { key: 'unit-alarm-list', label: '告警列表', route: '/unit/alarms' },
          { key: 'unit-alarm-record', label: '处置记录', route: '/unit/alarms/records' },
        ],
      },
      {
        key: 'unit-fire-monitor',
        label: '消防监控',
        icon: 'menuicon-29',
        children: [
          { key: 'unit-fire-pipeline', label: '消防管网系统', route: '/fire/pipeline' },
          { key: 'unit-fire-pipeline-topology', label: '消防管网 · 组态总览', route: '/fire/pipeline/topology' },
          { key: 'unit-fire-gas', label: '气体灭火系统', route: '/fire/gas' },
          { key: 'unit-fire-smoke', label: '消防防排烟系统', route: '/fire/smoke' },
        ],
      },
      {
        key: 'unit-emergency',
        label: '应急管理',
        icon: 'menuicon-13',
        children: [
          { key: 'unit-emergency-plan', label: '应急预案', route: '/unit/duty/emergency/plans' },
          { key: 'unit-emergency-supplies', label: '应急物资', route: '/unit/duty/emergency/supplies' },
          { key: 'unit-emergency-incident', label: '事件处置', route: '/unit/duty/emergency/incidents' },
        ],
      },
      {
        key: 'unit-notify',
        label: '通知提醒',
        icon: 'menuicon-34',
        children: [
          { key: 'unit-notify-list', label: '推送记录', route: '/unit/notifications' },
        ],
      },
    ],
  },

  // ===== 2f. 培训与演练（社会单位：安全管理员 / 员工） =====
  // 原「安全管理›培训演练」并入本模块
  {
    key: 'unit-training-drill',
    label: '培训与演练',
    icon: 'book',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-training-home', label: '数据看板', icon: 'menuicon-48', route: '/unit/training' },
      {
        key: 'unit-training-mgmt',
        label: '培训管理',
        icon: 'menuicon-6',
        children: [
          { key: 'unit-training-plan', label: '培训计划', route: '/unit/training/plans' },
          { key: 'unit-training-record', label: '培训记录', route: '/unit/training/records' },
          { key: 'unit-training-exam', label: '培训考试', route: '/unit/training/exams' },
        ],
      },
      {
        key: 'unit-drill-mgmt',
        label: '演练管理',
        icon: 'menuicon-17',
        children: [
          { key: 'unit-drill-plan', label: '演练计划', route: '/unit/training/drills/plans' },
          { key: 'unit-drill-record', label: '演练记录', route: '/unit/training/drills' },
          { key: 'unit-drill-evaluation', label: '演练评估', route: '/unit/training/drills/evaluations' },
        ],
      },
      { key: 'unit-training-knowledge', label: '知识库', icon: 'menuicon-11', route: '/unit/training/knowledge' },
    ],
  },

  // ===== 2g. 消防维保（社会单位：业主视角，服务商按合同履约） =====
  // 原「安全管理›维保管理」并入本模块，子项按 docs/维保管理 文档体例扩展
  {
    key: 'unit-fire-maintenance',
    label: '消防维保',
    icon: 'tools',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-maint-home', label: '数据看板', icon: 'menuicon-48', route: '/unit/maintenance' },
      {
        key: 'unit-maint-mgmt',
        label: '维保管理',
        icon: 'menuicon-9',
        children: [
          { key: 'unit-maint-contract', label: '维保合同', route: '/unit/maintenance/contracts' },
          { key: 'unit-maint-plan', label: '维保计划', route: '/unit/maintenance/plans' },
          { key: 'unit-maint-task', label: '维保任务', route: '/unit/maintenance/tasks' },
          { key: 'unit-maint-record', label: '维保记录', route: '/unit/maintenance/records' },
          { key: 'unit-maint-report', label: '维保报告', route: '/unit/maintenance/reports' },
        ],
      },
      { key: 'unit-maint-ledger', label: '维保台账', icon: 'menuicon-20', route: '/unit/maintenance/ledger' },
      { key: 'unit-maint-standard', label: '维保标准库', icon: 'menuicon-21', route: '/unit/maintenance/standards' },
      { key: 'unit-maint-fault', label: '故障与隐患', icon: 'menuicon-22', route: '/unit/maintenance/faults' },
      { key: 'unit-maint-todo', label: '待办工作台', icon: 'menuicon-23', route: '/unit/maintenance/todo' },
    ],
  },

  // ===== 2h. 特种作业管理（动火 / 焊接 / 高处 / 有限空间 / 临时用电） =====
  // 原「安全管理›危险作业」并入本模块，按作业类型 + 作业流程 + 人员资质三条线组织
  {
    key: 'unit-special-work',
    label: '特种作业管理',
    icon: 'secured',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-special-home', label: '数据看板', icon: 'menuicon-48', route: '/unit/special-work' },
      {
        key: 'unit-special-type',
        label: '作业类型',
        icon: 'menuicon-27',
        children: [
          { key: 'unit-special-hotwork', label: '动火作业', route: '/unit/special-work/hot-work' },
          { key: 'unit-special-welding', label: '电焊作业', route: '/unit/special-work/welding' },
          { key: 'unit-special-height', label: '高处作业', route: '/unit/special-work/height' },
          { key: 'unit-special-confined', label: '有限空间作业', route: '/unit/special-work/confined-space' },
          { key: 'unit-special-power', label: '临时用电作业', route: '/unit/special-work/temp-power' },
        ],
      },
      {
        key: 'unit-special-process',
        label: '作业流程',
        icon: 'menuicon-28',
        children: [
          { key: 'unit-special-apply', label: '作业申请', route: '/unit/special-work/applications' },
          { key: 'unit-special-approve', label: '作业审批', route: '/unit/special-work/approvals' },
          { key: 'unit-special-watch', label: '作业监护', route: '/unit/special-work/watch' },
          { key: 'unit-special-record', label: '作业记录', route: '/unit/special-work/records' },
        ],
      },
      {
        key: 'unit-special-personnel',
        label: '人员资质',
        icon: 'menuicon-40',
        children: [
          { key: 'unit-special-people', label: '特种作业人员', route: '/unit/special-work/personnel' },
          { key: 'unit-special-cert', label: '证件台账', route: '/unit/special-work/certificates' },
        ],
      },
    ],
  },

  // ===== 2i. 安全档案（消防档案归集、借阅与台账） =====
  {
    key: 'unit-safety-archive',
    label: '安全档案',
    icon: 'folder',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-archive-home', label: '数据看板', icon: 'menuicon-48', route: '/unit/safety-archive' },
      {
        key: 'unit-archive-collect',
        label: '档案归集',
        icon: 'menuicon-49',
        children: [
          { key: 'unit-archive-unit', label: '单位档案', route: '/unit/safety-archive/unit' },
          { key: 'unit-archive-facility', label: '设施档案', route: '/unit/safety-archive/facility' },
          { key: 'unit-archive-policy', label: '制度档案', route: '/unit/safety-archive/policy' },
          { key: 'unit-archive-plan', label: '预案档案', route: '/unit/safety-archive/plan' },
          { key: 'unit-archive-license', label: '证照档案', route: '/unit/safety-archive/license' },
        ],
      },
      {
        key: 'unit-archive-mgmt',
        label: '档案管理',
        icon: 'menuicon-50',
        children: [
          { key: 'unit-archive-ledger', label: '归档台账', route: '/unit/safety-archive/ledger' },
          { key: 'unit-archive-record', label: '归档记录', route: '/unit/safety-archive/records' },
          { key: 'unit-archive-borrow', label: '借阅记录', route: '/unit/safety-archive/borrow' },
        ],
      },
    ],
  },

  // ===== 2j. 项目管理（社会单位：消防工程 / 维保服务项目） =====
  // 与运营商侧「项目管理」（key=operator）分属不同群体，各自独立分组
  {
    key: 'unit-project',
    label: '项目管理',
    icon: 'shop',
    visibleTo: ['unit'],
    children: [
      { key: 'unit-project-home', label: '数据看板', icon: 'menuicon-48', route: '/unit/projects' },
      {
        key: 'unit-project-overview',
        label: '项目总览',
        icon: 'menuicon-30',
        children: [
          { key: 'unit-project-board', label: '项目看板', route: '/unit/projects/board' },
          { key: 'unit-project-stat', label: '项目统计', route: '/unit/projects/statistics' },
        ],
      },
      {
        key: 'unit-project-ledger',
        label: '项目台账',
        icon: 'menuicon-28',
        children: [
          { key: 'unit-project-list', label: '全部项目', route: '/unit/projects/list' },
          { key: 'unit-project-members', label: '项目成员', route: '/unit/projects/members' },
        ],
      },
      {
        key: 'unit-project-delivery',
        label: '项目交付',
        icon: 'menuicon-31',
        children: [
          { key: 'unit-project-milestone', label: '交付节点', route: '/unit/projects/milestones' },
          { key: 'unit-project-acceptance', label: '验收记录', route: '/unit/projects/acceptance' },
        ],
      },
      { key: 'unit-project-evaluate', label: '服务评价', icon: 'menuicon-47', route: '/unit/projects/evaluation' },
    ],
  },

  // ===== 2e. 安全管理 — 单位设置（社会单位管理员） =====
  {
    key: 'unit-settings',
    label: '单位设置',
    icon: 'setting',
    visibleTo: ['unit'],
    children: [
      {
        key: 'unit-set-device',
        label: '设备设置',
        icon: 'menuicon-45',
        children: [
          { key: 'unit-set-device-standard', label: '保养规范', route: '/unit/settings/device/standards' },
          { key: 'unit-set-device-plan', label: '保养计划', route: '/unit/settings/device/plans' },
          { key: 'unit-set-device-monitor', label: '运行监控', route: '/unit/settings/device/monitor' },
          { key: 'unit-set-device-report', label: '设备报表', route: '/unit/settings/device/reports' },
          { key: 'unit-set-device-config', label: '设备配置', route: '/unit/settings/device/config' },
          { key: 'unit-set-device-log', label: '系统日志', route: '/unit/settings/device/logs' },
        ],
      },
      {
        key: 'unit-set-alarm',
        label: '告警设置',
        icon: 'menuicon-24',
        children: [
          { key: 'unit-set-alarm-config', label: '告警配置', route: '/unit/settings/alarms/config' },
          { key: 'unit-set-alarm-report', label: '值守报表', route: '/unit/settings/alarms/reports' },
          // 「预案管理」已并入「值守与应急 › 应急管理 › 应急预案」，此处不再重复
        ],
      },
      {
        key: 'unit-set-notify',
        label: '通知设置',
        icon: 'menuicon-34',
        children: [
          { key: 'unit-set-notify-config', label: '通知配置', route: '/unit/settings/notifications/config' },
          { key: 'unit-set-notify-push', label: '告警推送', route: '/unit/settings/notifications/push' },
        ],
      },
      {
        key: 'unit-set-org',
        label: '组织管理',
        icon: 'menuicon-43',
        children: [
          { key: 'unit-set-org-unit', label: '管理单元', route: '/unit/settings/org/units' },
          { key: 'unit-set-org-building', label: '建筑管理', route: '/unit/settings/org/buildings' },
          { key: 'unit-set-org-focus', label: '重点部位', route: '/unit/settings/org/focus' },
          { key: 'unit-set-org-members', label: '人员管理', route: '/enterprise/members' },
          { key: 'unit-set-org-perms', label: '权限管理', route: '/unit/settings/org/permissions' },
          { key: 'unit-set-org-dept', label: '部门管理', route: '/unit/settings/org/departments' },
          { key: 'unit-set-org-positions', label: '岗位管理', route: '/enterprise/positions' },
        ],
      },
      {
        key: 'unit-set-policy',
        label: '制度管理',
        icon: 'menuicon-8',
        route: '/unit/settings/policies',
      },
      {
        key: 'unit-set-announce',
        label: '通知公告',
        icon: 'menuicon-7',
        route: '/unit/settings/announcements',
      },
      {
        key: 'unit-set-enterprise',
        label: '企业配置',
        icon: 'menuicon-37',
        children: [
          { key: 'unit-set-ent-info', label: '基础信息', route: '/unit/settings/enterprise/info' },
          { key: 'unit-set-ent-custom', label: '个性化', route: '/unit/settings/enterprise/custom' },
        ],
      },
      {
        key: 'unit-set-log',
        label: '日志管理',
        icon: 'menuicon-42',
        route: '/unit/settings/logs',
      },
      {
        key: 'unit-set-form',
        label: '动态表单',
        icon: 'menuicon-47',
        children: [
          { key: 'unit-set-form-mgmt', label: '表单管理', route: '/unit/settings/forms' },
          { key: 'unit-set-form-records', label: '填写记录', route: '/unit/settings/forms/records' },
        ],
      },
      {
        key: 'unit-set-manual',
        label: '使用手册',
        icon: 'menuicon-50',
        route: '/unit/settings/manual',
      },
    ],
  },

  // ===== 3. 项目管理（社会单位-运营商） =====
  {
    key: 'operator',
    label: '项目管理',
    icon: 'building',
    visibleTo: ['operator'],
    children: [
      {
        key: 'op-overview',
        label: '项目总览',
        icon: 'menuicon-30',
        children: [
          { key: 'op-dashboard', label: '项目看板' },
          { key: 'op-bigscreen', label: '项目大屏' },
        ],
      },
      {
        key: 'op-projects',
        label: '项目列表',
        icon: 'menuicon-28',
        children: [
          { key: 'op-project-list', label: '全部项目', route: '/projects' },
          { key: 'op-member-delivery', label: '成员交付', route: '/projects/:id/members' },
        ],
      },
      {
        key: 'op-orders',
        label: '项目工单',
        icon: 'menuicon-2',
        children: [
          { key: 'op-order-monitor', label: '工单监控', route: '/system/monitor' },
        ],
      },
      {
        key: 'op-system',
        label: '系统管理',
        icon: 'menuicon-43',
        visibleTo: ['org-admin'],
        children: [
          { key: 'op-members', label: '企业成员', route: '/enterprise/members' },
          { key: 'op-positions', label: '企业岗位', route: '/enterprise/positions' },
        ],
      },
    ],
  },

  // ===== 4. 技术服务（技术服务机构） =====
  {
    key: 'service',
    label: '技术服务',
    icon: 'rocket',
    visibleTo: ['service'],
    children: [
      {
        key: 'svc-order',
        label: '我的工单',
        icon: 'menuicon-2',
        children: [
          { key: 'svc-order-monitor', label: '工单监控', route: '/system/monitor' },
          { key: 'svc-order-dashboard', label: '数据看板', route: '/system/dashboard' },
        ],
      },
      {
        key: 'svc-maintain',
        label: '维保应用',
        icon: 'menuicon-9',
        children: [
          { key: 'svc-maintain-contract', label: '合同管理' },
          { key: 'svc-maintain-record', label: '维保记录', route: '/maintenance/plans' },
        ],
      },
      {
        key: 'svc-report',
        label: '服务报告',
        icon: 'menuicon-30',
        children: [
          { key: 'svc-report-list', label: '报告列表' },
        ],
      },
      {
        key: 'svc-system',
        label: '系统管理',
        icon: 'menuicon-43',
        visibleTo: ['org-admin'],
        children: [
          { key: 'svc-members', label: '企业成员', route: '/enterprise/members' },
          { key: 'svc-positions', label: '企业岗位', route: '/enterprise/positions' },
        ],
      },
    ],
  },

  // ===== 5. 运营管理（平台运营方 platform-ops） =====
  {
    key: 'platform-ops',
    label: '运营管理',
    icon: 'setting',
    visibleTo: ['platform-ops'],
    children: [
      {
        key: 'plat-tenant',
        label: '租户管理',
        icon: 'menuicon-43',
        children: [
          { key: 'tenant-mgmt', label: '租户列表', route: '/admin/enterpriseManagement/index' },
        ],
      },
      {
        key: 'plat-user',
        label: '用户管理',
        icon: 'menuicon-43',
        children: [
          { key: 'user-list', label: '用户列表', route: '/admin/users' },
        ],
      },
      {
        key: 'plat-position',
        label: '岗位管理',
        icon: 'menuicon-43',
        children: [
          { key: 'position-mgmt', label: '岗位列表', route: '/admin/positions' },
        ],
      },
      {
        key: 'plat-bigscreen',
        label: '大屏配置',
        icon: 'menuicon-43',
        children: [
          { key: 'bigscreen-list', label: '大屏管理', route: '/admin/bigscreens' },
        ],
      },
      {
        key: 'plat-process',
        label: '流程模板',
        icon: 'menuicon-42',
        children: [
          { key: 'flow-template', label: '流程模板', route: '/system/template' },
        ],
      },
      {
        key: 'plat-member-type',
        label: '类型注册',
        icon: 'menuicon-43',
        children: [
          { key: 'member-type-list', label: '成员类型', route: '/admin/member-types' },
        ],
      },
    ],
  },

  // ===== 6. 平台管理（技术管理 platform-admin；platform-ops 兼看） =====
  {
    key: 'platform-admin',
    label: '平台管理',
    icon: 'server',
    visibleTo: ['platform-admin', 'platform-ops'],
    children: [
      {
        key: 'plat-tech',
        label: '技术配置',
        icon: 'server',
        children: [
          { key: 'route-config', label: '路由配置' },
          { key: 'menu-config', label: '菜单管理' },
          { key: 'system-params', label: '系统参数' },
          { key: 'upgrade-mgmt', label: '升级管理' },
        ],
      },
      {
        key: 'plat-test-data',
        label: 'Agent 测试数据',
        icon: 'menuicon-43',
        children: [
          { key: 'test-data-list', label: '测试数据管理', route: '/test-data' },
        ],
      },
    ],
  },
]

// ===== 映射表 =====

/** 路由路径 → 侧栏节点 key */
export const ROUTE_TO_NAV_KEY: Record<string, string> = {
  '/workbench': 'workbench',
  '/system/template': 'collab-flow-template',
  '/system/monitor': 'collab-monitor',
  '/system/order': 'collab-monitor',
  '/system/dashboard': 'svc-order-dashboard',
  '/maintenance/plans': 'svc-maintain-record',
  '/maintenance/plans/detail': 'svc-maintain-record',
  '/device': 'df-ledger',
  '/device/list': 'df-ledger',
  '/iot': 'df-ledger',
  '/platform': 'platform-admin',
  '/admin': 'tenant-mgmt',
  '/admin/enterpriseManagement': 'tenant-mgmt',
  '/admin/enterpriseManagement/index': 'tenant-mgmt',
  '/admin/users': 'user-list',
  '/admin/positions': 'position-mgmt',
  '/admin/bigscreens': 'bigscreen-list',
  '/admin/member-types': 'member-type-list',
  '/test-data': 'test-data-list',
  '/enterprise/members': 'unit-set-org-members',
  '/enterprise/positions': 'unit-set-org-positions',
  '/resumption': 'unit-hazard-report',
  '/resumption-bigscreen': 'unit-bigscreen',
  '/enterprise-cockpit': 'unit-bigscreen',
  '/workbench/hazard-intro': 'unit-hazard-intro',
  '/unit/hazards': 'unit-hazard-ledger',
  '/unit/hazards/report': 'unit-hazard-report',
  '/unit/hazards/tasks': 'unit-hazard-task',
  '/unit/hazards/board': 'unit-hazard-board',
  '/unit/hazards/system': 'unit-hazard-system',
  '/unit/hazards/plan': 'unit-hazard-plan',
  '/unit/hazards/checklist': 'unit-hazard-checklist',
  '/unit/hazards/dashboard': 'unit-hazard-dashboard',
  '/unit/hazards/reports': 'unit-hazard-periodic',
  '/unit/hazards/reports/internal': 'unit-hazard-report-internal',
  '/unit/hazards/reports/regulator': 'unit-hazard-report-regulator',
  // 巡查检查：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/patrol/tasks': 'unit-patrol-task',
  '/unit/patrol/forms': 'unit-patrol-forms',
  '/unit/patrol/locations': 'unit-patrol-locations',
  '/unit/patrol/plans': 'unit-patrol-plan',
  '/unit/patrol/abnormal': 'unit-patrol-abnormal',
  '/unit/patrol/reports': 'unit-patrol-reports',
  '/unit/patrol/notices': 'unit-patrol-notices',
  '/unit/patrol': 'unit-patrol-home',
  // 设备设施管理：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/device-facility/ledger': 'df-ledger',
  '/device-facility/maintenance/standard': 'df-maint-standard',
  '/device-facility/maintenance/plans': 'df-maint-plans',
  '/device-facility/maintenance/tasks': 'df-maint-tasks',
  '/device-facility/maintenance/records': 'df-maint-records',
  '/device-facility/monitor/status': 'df-monitor-status',
  '/device-facility/monitor/scene': 'df-monitor-scene',
  '/device-facility/report/alarm': 'df-report-alarm',
  '/device-facility/report/device': 'df-report-device',
  '/device-facility/log/event': 'df-log-event',
  '/device-facility/rule/custom-event': 'df-rule-custom-event',
  '/device-facility/rule/plan-point': 'df-rule-plan-point',
  '/device-facility/rule/data-fetch': 'df-rule-data-fetch',
  '/device-facility/rule/data-push': 'df-rule-data-push',
  '/device-facility/rule/strategy': 'df-rule-strategy',
  '/device-facility/notify/alarm-push': 'df-notify-alarm-push',
  '/collab/flow/template': 'collab-flow-template',  // 兼容旧路径：/collab/flow/* 已合并到 /system/*
  '/collab/flow/monitor': 'collab-monitor',
  '/landing': 'reg-bigscreen',
  '/fire/pipeline/topology': 'unit-fire-pipeline-topology',
  '/fire/pipeline': 'unit-fire-pipeline',
  '/fire/gas': 'unit-fire-gas',
  '/fire/smoke': 'unit-fire-smoke',
  // 安全概览
  '/unit/dashboard': 'unit-dashboard',
  '/unit/data': 'unit-data',
  // 值守与应急：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/duty/emergency/plans': 'unit-emergency-plan',
  '/unit/duty/emergency/supplies': 'unit-emergency-supplies',
  '/unit/duty/emergency/incidents': 'unit-emergency-incident',
  '/unit/duty/schedule': 'unit-duty-schedule',
  '/unit/duty/records': 'unit-duty-records',
  '/unit/duty/checkin': 'unit-duty-checkin',
  '/unit/duty/handover': 'unit-duty-handover',
  '/unit/duty': 'unit-duty-home',
  '/unit/alarms/records': 'unit-alarm-record',
  '/unit/alarms': 'unit-alarm-list',
  '/unit/notifications': 'unit-notify-list',
  // 培训与演练：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/training/drills/plans': 'unit-drill-plan',
  '/unit/training/drills/evaluations': 'unit-drill-evaluation',
  '/unit/training/drills': 'unit-drill-record',
  '/unit/training/plans': 'unit-training-plan',
  '/unit/training/records': 'unit-training-record',
  '/unit/training/exams': 'unit-training-exam',
  '/unit/training/knowledge': 'unit-training-knowledge',
  '/unit/training': 'unit-training-home',
  // 消防维保：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/maintenance/contracts': 'unit-maint-contract',
  '/unit/maintenance/plans': 'unit-maint-plan',
  '/unit/maintenance/tasks': 'unit-maint-task',
  '/unit/maintenance/records': 'unit-maint-record',
  '/unit/maintenance/reports': 'unit-maint-report',
  '/unit/maintenance/ledger': 'unit-maint-ledger',
  '/unit/maintenance/standards': 'unit-maint-standard',
  '/unit/maintenance/faults': 'unit-maint-fault',
  '/unit/maintenance/todo': 'unit-maint-todo',
  '/unit/maintenance': 'unit-maint-home',
  // 特种作业管理：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/special-work/hot-work': 'unit-special-hotwork',
  '/unit/special-work/welding': 'unit-special-welding',
  '/unit/special-work/height': 'unit-special-height',
  '/unit/special-work/confined-space': 'unit-special-confined',
  '/unit/special-work/temp-power': 'unit-special-power',
  '/unit/special-work/applications': 'unit-special-apply',
  '/unit/special-work/approvals': 'unit-special-approve',
  '/unit/special-work/watch': 'unit-special-watch',
  '/unit/special-work/records': 'unit-special-record',
  '/unit/special-work/personnel': 'unit-special-people',
  '/unit/special-work/certificates': 'unit-special-cert',
  '/unit/special-work': 'unit-special-home',
  // 安全档案：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/safety-archive/unit': 'unit-archive-unit',
  '/unit/safety-archive/facility': 'unit-archive-facility',
  '/unit/safety-archive/policy': 'unit-archive-policy',
  '/unit/safety-archive/plan': 'unit-archive-plan',
  '/unit/safety-archive/license': 'unit-archive-license',
  '/unit/safety-archive/ledger': 'unit-archive-ledger',
  '/unit/safety-archive/records': 'unit-archive-record',
  '/unit/safety-archive/borrow': 'unit-archive-borrow',
  '/unit/safety-archive': 'unit-archive-home',
  // 项目管理（社会单位）：具体路径在前，保证「路径前缀兜底匹配」时先命中子路由
  '/unit/projects/board': 'unit-project-board',
  '/unit/projects/statistics': 'unit-project-stat',
  '/unit/projects/list': 'unit-project-list',
  '/unit/projects/members': 'unit-project-members',
  '/unit/projects/milestones': 'unit-project-milestone',
  '/unit/projects/acceptance': 'unit-project-acceptance',
  '/unit/projects/evaluation': 'unit-project-evaluate',
  '/unit/projects': 'unit-project-home',
  '/collab/task/pending': 'collab-pending',
  '/collab/task/completed': 'collab-completed',
  '/collab/task/started': 'collab-started',
}

/** 侧栏节点 key → 路由路径（用于导航） */
export const NAV_KEY_TO_ROUTE: Record<string, string> = {
  'workbench': '/workbench',
  'svc-order-dashboard': '/system/dashboard',
  'svc-maintain-record': '/maintenance/plans',
  'tenant-mgmt': '/admin/enterpriseManagement/index',
  'user-list': '/admin/users',
  'position-mgmt': '/admin/positions',
  'bigscreen-list': '/admin/bigscreens',
  'member-type-list': '/admin/member-types',
  'test-data-list': '/test-data',
  'unit-set-org-members': '/enterprise/members',
  'unit-set-org-positions': '/enterprise/positions',
  'reg-bigscreen': '/landing',
  'unit-bigscreen': '/enterprise-cockpit',
  'unit-hazard-intro': '/workbench/hazard-intro',
  'unit-hazard-ledger': '/unit/hazards',
  'unit-hazard-report': '/unit/hazards/report',
  'unit-hazard-task': '/unit/hazards/tasks',
  'unit-hazard-board': '/unit/hazards/board',
  'unit-hazard-system': '/unit/hazards/system',
  'unit-hazard-plan': '/unit/hazards/plan',
  'unit-hazard-checklist': '/unit/hazards/checklist',
  'unit-hazard-dashboard': '/unit/hazards/dashboard',
  'unit-hazard-periodic': '/unit/hazards/reports',
  'unit-hazard-report-internal': '/unit/hazards/reports/internal',
  'unit-hazard-report-regulator': '/unit/hazards/reports/regulator',
  'unit-patrol-home': '/unit/patrol',
  'unit-patrol-task': '/unit/patrol/tasks',
  'unit-patrol-forms': '/unit/patrol/forms',
  'unit-patrol-locations': '/unit/patrol/locations',
  'unit-patrol-plan': '/unit/patrol/plans',
  'unit-patrol-abnormal': '/unit/patrol/abnormal',
  'unit-patrol-reports': '/unit/patrol/reports',
  'unit-patrol-notices': '/unit/patrol/notices',
  'df-ledger': '/device-facility/ledger',
  'df-maint-standard': '/device-facility/maintenance/standard',
  'df-maint-plans': '/device-facility/maintenance/plans',
  'df-maint-tasks': '/device-facility/maintenance/tasks',
  'df-maint-records': '/device-facility/maintenance/records',
  'df-monitor-status': '/device-facility/monitor/status',
  'df-monitor-scene': '/device-facility/monitor/scene',
  'df-report-alarm': '/device-facility/report/alarm',
  'df-report-device': '/device-facility/report/device',
  'df-log-event': '/device-facility/log/event',
  'df-rule-custom-event': '/device-facility/rule/custom-event',
  'df-rule-plan-point': '/device-facility/rule/plan-point',
  'df-rule-data-fetch': '/device-facility/rule/data-fetch',
  'df-rule-data-push': '/device-facility/rule/data-push',
  'df-rule-strategy': '/device-facility/rule/strategy',
  'df-notify-alarm-push': '/device-facility/notify/alarm-push',
  'collab-flow-template': '/system/template',
  'collab-monitor': '/system/monitor',
  'collab-pending': '/collab/task/pending',
  'collab-completed': '/collab/task/completed',
  'collab-started': '/collab/task/started',
  // 同一路由被多个岗位的菜单共用，逐个登记，避免 activeNavKey 落在表外导致内容区退化成占位页
  'reg-members': '/enterprise/members',
  'reg-positions': '/enterprise/positions',
  'op-order-monitor': '/system/monitor',
  'op-members': '/enterprise/members',
  'op-positions': '/enterprise/positions',
  'svc-order-monitor': '/system/monitor',
  'svc-members': '/enterprise/members',
  'svc-positions': '/enterprise/positions',
  'flow-template': '/system/template',
  'unit-fire-pipeline': '/fire/pipeline',
  'unit-fire-pipeline-topology': '/fire/pipeline/topology',
  'unit-fire-gas': '/fire/gas',
  'unit-fire-smoke': '/fire/smoke',
  // 安全概览
  'unit-dashboard': '/unit/dashboard',
  'unit-data': '/unit/data',
  // 值守与应急
  'unit-duty-home': '/unit/duty',
  'unit-duty-schedule': '/unit/duty/schedule',
  'unit-duty-records': '/unit/duty/records',
  'unit-duty-checkin': '/unit/duty/checkin',
  'unit-duty-handover': '/unit/duty/handover',
  'unit-alarm-list': '/unit/alarms',
  'unit-alarm-record': '/unit/alarms/records',
  'unit-emergency-plan': '/unit/duty/emergency/plans',
  'unit-emergency-supplies': '/unit/duty/emergency/supplies',
  'unit-emergency-incident': '/unit/duty/emergency/incidents',
  'unit-notify-list': '/unit/notifications',
  // 培训与演练
  'unit-training-home': '/unit/training',
  'unit-training-plan': '/unit/training/plans',
  'unit-training-record': '/unit/training/records',
  'unit-training-exam': '/unit/training/exams',
  'unit-training-knowledge': '/unit/training/knowledge',
  'unit-drill-plan': '/unit/training/drills/plans',
  'unit-drill-record': '/unit/training/drills',
  'unit-drill-evaluation': '/unit/training/drills/evaluations',
  // 消防维保
  'unit-maint-home': '/unit/maintenance',
  'unit-maint-contract': '/unit/maintenance/contracts',
  'unit-maint-plan': '/unit/maintenance/plans',
  'unit-maint-task': '/unit/maintenance/tasks',
  'unit-maint-record': '/unit/maintenance/records',
  'unit-maint-report': '/unit/maintenance/reports',
  'unit-maint-ledger': '/unit/maintenance/ledger',
  'unit-maint-standard': '/unit/maintenance/standards',
  'unit-maint-fault': '/unit/maintenance/faults',
  'unit-maint-todo': '/unit/maintenance/todo',
  // 特种作业管理
  'unit-special-home': '/unit/special-work',
  'unit-special-hotwork': '/unit/special-work/hot-work',
  'unit-special-welding': '/unit/special-work/welding',
  'unit-special-height': '/unit/special-work/height',
  'unit-special-confined': '/unit/special-work/confined-space',
  'unit-special-power': '/unit/special-work/temp-power',
  'unit-special-apply': '/unit/special-work/applications',
  'unit-special-approve': '/unit/special-work/approvals',
  'unit-special-watch': '/unit/special-work/watch',
  'unit-special-record': '/unit/special-work/records',
  'unit-special-people': '/unit/special-work/personnel',
  'unit-special-cert': '/unit/special-work/certificates',
  // 安全档案
  'unit-archive-home': '/unit/safety-archive',
  'unit-archive-unit': '/unit/safety-archive/unit',
  'unit-archive-facility': '/unit/safety-archive/facility',
  'unit-archive-policy': '/unit/safety-archive/policy',
  'unit-archive-plan': '/unit/safety-archive/plan',
  'unit-archive-license': '/unit/safety-archive/license',
  'unit-archive-ledger': '/unit/safety-archive/ledger',
  'unit-archive-record': '/unit/safety-archive/records',
  'unit-archive-borrow': '/unit/safety-archive/borrow',
  // 项目管理（社会单位）
  'unit-project-home': '/unit/projects',
  'unit-project-board': '/unit/projects/board',
  'unit-project-stat': '/unit/projects/statistics',
  'unit-project-list': '/unit/projects/list',
  'unit-project-members': '/unit/projects/members',
  'unit-project-milestone': '/unit/projects/milestones',
  'unit-project-acceptance': '/unit/projects/acceptance',
  'unit-project-evaluate': '/unit/projects/evaluation',
}

// ===== 工具函数 =====

/**
 * 递归搜索 nav 树中 key 对应的节点
 */
export function findNodeByKey(key: string): NavNode | null {
  for (const group of NAV_GROUPS) {
    const found = searchInTree(group.children, key)
    if (found) return found
  }
  return null
}

/**
 * 查找 key 的所有祖先路径
 * 返回 { groupKey, parentKeys }
 * 用于自动展开当前路由所属的分组和父级
 */
export function findAncestors(
  key: string,
): { groupKey: string; parentKeys: string[] } | null {
  for (const group of NAV_GROUPS) {
    const parentKeys: string[] = []
    const found = findInGroup(group.children, key, parentKeys)
    if (found) return { groupKey: group.key, parentKeys }
  }
  return null
}

/**
 * 收集所有可钉选的节点 key（叶子节点 + 跳转入口）
 * 用于初始化钉选面板时枚举
 */
export function collectLeafKeys(): string[] {
  const keys: string[] = []
  for (const group of NAV_GROUPS) {
    collectLeaves(group.children, keys)
  }
  keys.push(WORKBENCH_ITEM.key)
  return keys
}

/**
 * 按岗位过滤导航树。
 * 递归裁剪：visibleTo 不匹配的节点及其全部子节点被移除。
 * 空分支折叠：父节点内所有子节点都被移除后，父节点也移除。
 *
 * @param nodes  原始节点数组
 * @param positionKeys  用户当前拥有的岗位 key 数组
 * @returns 过滤后的节点数组（新引用，不修改原数组）
 */
export function filterNodesByPosition(
  nodes: NavNode[],
  positionKeys: string[],
): NavNode[] {
  const result: NavNode[] = []
  for (const node of nodes) {
    if (!isNodeVisible(node, positionKeys)) continue
    if (node.children) {
      const filteredChildren = filterNodesByPosition(node.children, positionKeys)
      if (filteredChildren.length === 0) continue // 空分支折叠
      result.push({ ...node, children: filteredChildren })
    } else {
      result.push({ ...node })
    }
  }
  return result
}

/** 单节点可见性判定 */
function isNodeVisible(node: NavNode, positionKeys: string[]): boolean {
  if (!node.visibleTo || node.visibleTo.length === 0) return true
  return positionKeys.some(k => node.visibleTo!.includes(k))
}

// ===== 内部辅助 =====

function searchInTree(nodes: NavNode[], key: string): NavNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    if (node.children) {
      const found = searchInTree(node.children, key)
      if (found) return found
    }
  }
  return null
}

function findInGroup(
  nodes: NavNode[],
  key: string,
  parentKeys: string[],
): boolean {
  for (const node of nodes) {
    if (node.key === key) return true
    if (node.children) {
      parentKeys.push(node.key)
      if (findInGroup(node.children, key, parentKeys)) return true
      parentKeys.pop()
    }
  }
  return false
}

function collectLeaves(nodes: NavNode[], keys: string[]): void {
  for (const node of nodes) {
    if (node.route && !node.children) {
      keys.push(node.key)
    }
    if (node.children) {
      collectLeaves(node.children, keys)
    }
  }
}
