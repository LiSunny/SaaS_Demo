/**
 * 智慧消防 · 三个子系统的设备档案与页面配置
 *
 * 数据来源：《20261015-智慧消防系统(尼特)》设备清单
 *   - 消防管网监控系统：主机 NT8091A×2+NT9210 ×1台 / 分机 ×8
 *   - 气体灭火监控系统：主机 JB-QB-NT8031 + NT8254×3 ×1台 / 分机 ×2
 *   - 消防防排烟系统：主机 NT8041A×2 ×1台 / 分机 ×2
 *
 * ⚠️ 换项目复用：整份文件属于"项目配置层"，可整体替换。
 *    页面组件只读取 SubsystemProfile 结构，不含任何消防语义。
 */

import type { SubsystemProfile } from '@/types/subsystem'

// ===== 共用测点定义 =====

const PRESSURE_METRIC = {
  key: 'pressure',
  label: '压力',
  kind: 'analog' as const,
  unit: 'MPa',
  range: [0, 1.6] as [number, number],
  // 消防管网正常供水压力 0.3~0.9 MPa（低于 0.1 视为失压，高于 1.0 视为超压）
  normalRange: [0.3, 0.85] as [number, number],
  precision: 3,
  highLimit: 1.0,
  lowLimit: 0.1,
}

const STATUS_METRIC = {
  key: 'runStatus',
  // ⚠️ 命名约束：这是"设备自身状态"（正常/故障/备电），不是"点位状态"（正常/报警/故障/离线）。
  // 点位状态由阈值判定得出，展示在卡片标题行。两者都叫"状态"会让报警卡片写着"正常"。
  label: '设备状态',
  kind: 'status' as const,
  states: [
    { value: 'normal', label: '正常', tone: 'normal' as const },
    { value: 'fault', label: '故障', tone: 'fault' as const },
    { value: 'backup', label: '备电', tone: 'alarm' as const },
  ],
}

const VALVE_METRIC = {
  key: 'valveState',
  label: '阀门状态',
  kind: 'switch' as const,
  states: [
    { value: 'open', label: '开', tone: 'normal' as const },
    { value: 'closed', label: '关', tone: 'normal' as const },
    { value: 'fault', label: '故障', tone: 'fault' as const },
  ],
}

// ============================================================================
// 子系统一：消防管网监控系统（水系统）
// ============================================================================

const PIPELINE_PROFILE: SubsystemProfile = {
  key: 'pipeline',
  name: '消防管网监控系统',
  shortName: '消防管网',
  icon: 'vehicle',
  accent: '#3678E3',
  description:
    '对消防水池（箱）水位、管网压力、流量、阀门状态及末端试水装置进行实时监测与远程控制。',

  hostProfiles: [
    {
      typeKey: 'pipe_host',
      name: '消防管网监控主机',
      category: 'controller',
      icon: 'cpu',
      metrics: [STATUS_METRIC],
    },
    {
      typeKey: 'pipe_slave',
      name: '消防管网监控分机',
      category: 'controller',
      icon: 'cpu',
      metrics: [STATUS_METRIC],
    },
  ],

  deviceProfiles: [
    {
      typeKey: 'water_level',
      name: '液位探测器',
      category: 'sensor',
      icon: 'vehicle',
      metrics: [
        {
          key: 'level',
          label: '水位',
          kind: 'analog',
          unit: 'm',
          range: [0, 10],
          normalRange: [3.2, 6.5],
          precision: 2,
          highLimit: 8,
          lowLimit: 2,
        },
        STATUS_METRIC,
      ],
    },
    {
      typeKey: 'pipe_pressure',
      name: '压力探测器',
      category: 'sensor',
      icon: 'chart',
      metrics: [PRESSURE_METRIC, STATUS_METRIC],
    },
    {
      typeKey: 'flow_sensor',
      name: '流量传感器',
      category: 'sensor',
      icon: 'activity',
      metrics: [
        { key: 'flow', label: '瞬时流量', kind: 'analog', unit: 'L/s', range: [0, 50], normalRange: [12, 32], precision: 2, highLimit: 40 },
        { key: 'totalFlow', label: '累计流量', kind: 'analog', unit: 'm³', range: [0, 100000], precision: 1 },
        STATUS_METRIC,
      ],
    },
    {
      typeKey: 'valve_switch',
      name: '阀门探测装置',
      category: 'switch',
      icon: 'poweroff',
      metrics: [VALVE_METRIC],
      controllable: true,
    },
    {
      typeKey: 'hydrant_test',
      name: '末端试水装置',
      category: 'switch',
      icon: 'data-display',
      metrics: [
        { ...PRESSURE_METRIC, key: 'pressure', label: '末端压力' },
        {
          key: 'runState',
          label: '装置状态',
          kind: 'switch',
          states: [
            { value: 'idle', label: '待机', tone: 'normal' },
            { value: 'running', label: '启动', tone: 'alarm' },
            { value: 'fault', label: '故障', tone: 'fault' },
          ],
        },
        {
          key: 'driveType',
          label: '驱动方式',
          kind: 'switch',
          states: [
            { value: 'electric', label: '电动', tone: 'normal' },
            { value: 'manual', label: '手动', tone: 'normal' },
          ],
        },
      ],
      controllable: true,
    },
  ],

  scale: {
    host: 1,
    slave: 8,
    devices: [
      { typeKey: 'valve_switch', count: 719, codePrefix: 'FM', nameHint: '消火栓环网阀门' },
      { typeKey: 'valve_switch', count: 72, codePrefix: 'BZ', nameHint: '报警阀间/水泵/稳压泵阀门' },
      { typeKey: 'hydrant_test', count: 194, codePrefix: 'SD', nameHint: '手动末端试水装置' },
      { typeKey: 'hydrant_test', count: 38, codePrefix: 'ZSD', nameHint: '电动末端试水装置' },
      { typeKey: 'pipe_pressure', count: 114, codePrefix: 'YL', nameHint: '管网压力探测器' },
      { typeKey: 'flow_sensor', count: 6, codePrefix: 'LL', nameHint: '流量传感器' },
      { typeKey: 'water_level', count: 4, codePrefix: 'YW', nameHint: '消防水池/水箱液位' },
    ],
  },

  summaryCards: [
    { key: 'total', label: '接入设备', icon: 'layers', source: 'total', hint: '含主机/分机与采集点' },
    { key: 'normal', label: '正常', icon: 'check', source: 'statusCount', hint: '状态正常点位' },
    { key: 'alarm', label: '报警', icon: 'error-circle', source: 'statusCount', hint: '压力/水位超限' },
    { key: 'fault', label: '故障', icon: 'close-circle', source: 'statusCount', hint: '设备或回路故障' },
    { key: 'offline', label: '离线', icon: 'close-circle', source: 'statusCount', hint: '心跳丢失' },
  ],

  sections: [
    {
      key: 'hydraulic',
      title: '水力参数监测',
      layout: 'cards',
      showTypes: ['water_level', 'pipe_pressure', 'flow_sensor'],
      span: 4,
      hint: '模拟量实时值与趋势 · 压力正常 0.3~0.85 MPa，超 1.0 / 低于 0.1 判为报警',
    },
    {
      key: 'valve',
      title: '阀门状态监测',
      layout: 'grid',
      showTypes: ['valve_switch'],
      span: 1,
      hint: '共 {n} 处阀门开/关状态，支持远程控制',
    },
    {
      key: 'hydrant',
      title: '末端试水装置监测',
      layout: 'grid',
      showTypes: ['hydrant_test'],
      span: 1,
      hint: '共 {n} 处，支持电动远程启动',
    },
  ],
}

// ============================================================================
// 子系统二：气体灭火监控系统（钢瓶压力）
// ============================================================================

const GAS_EXTINGUISH_PROFILE: SubsystemProfile = {
  key: 'gas',
  name: '气体灭火监控系统',
  shortName: '气体灭火',
  icon: 'rocket',
  accent: '#8B5CF6',
  description:
    '对气体灭火系统钢瓶压力进行实时监测，判断灭火剂储备是否充足。',

  hostProfiles: [
    {
      typeKey: 'gas_host',
      name: '钢瓶压力监控主机',
      category: 'controller',
      icon: 'cpu',
      metrics: [STATUS_METRIC],
    },
    {
      typeKey: 'gas_slave',
      name: '钢瓶压力监控分机',
      category: 'controller',
      icon: 'cpu',
      metrics: [STATUS_METRIC],
    },
  ],

  deviceProfiles: [
    {
      typeKey: 'cylinder_pressure',
      name: '钢瓶压力探测器',
      category: 'sensor',
      icon: 'rocket',
      metrics: [
        {
          key: 'pressure',
          label: '钢瓶压力',
          kind: 'analog',
          unit: 'MPa',
          range: [0, 1.6],
          // 钢瓶正常压力 1.2~1.4 MPa，低于 1.2 判定灭火剂储备不足
          normalRange: [1.24, 1.38],
          precision: 3,
          highLimit: 1.4,
          lowLimit: 1.2,
        },
        STATUS_METRIC,
      ],
    },
  ],

  scale: {
    host: 1,
    slave: 2,
    devices: [
      { typeKey: 'cylinder_pressure', count: 98, codePrefix: 'GT', nameHint: '钢瓶压力探测器' },
    ],
  },

  summaryCards: [
    { key: 'total', label: '接入设备', icon: 'layers', source: 'total', hint: '含主机/分机与钢瓶探测器' },
    { key: 'normal', label: '正常', icon: 'check', source: 'statusCount', hint: '压力 1.2~1.4 MPa' },
    { key: 'alarm', label: '报警', icon: 'error-circle', source: 'statusCount', hint: '压力 < 1.2 或 > 1.4 MPa' },
    { key: 'fault', label: '故障', icon: 'close-circle', source: 'statusCount', hint: '探测器异常' },
    { key: 'offline', label: '离线', icon: 'close-circle', source: 'statusCount', hint: '心跳丢失' },
  ],

  sections: [
    {
      key: 'cylinder',
      title: '钢瓶压力监测',
      layout: 'cards',
      showTypes: ['cylinder_pressure'],
      span: 4,
      hint: '压力 < 1.2 MPa 判定灭火剂储备不足，> 1.4 MPa 判定超压',
    },
  ],
}

// ============================================================================
// 子系统三：消防防排烟监控系统（风机压差）
// ============================================================================

const SMOKE_EXHAUST_PROFILE: SubsystemProfile = {
  key: 'smoke',
  name: '消防防排烟监控系统',
  shortName: '消防防排烟',
  icon: 'dashboard',
  accent: '#059669',
  description:
    '对机械加压送风机、排烟风机前后压差进行实时监测，判断风压是否维持正常区间。',

  hostProfiles: [
    {
      typeKey: 'smoke_host',
      name: '消防防排烟监测主机',
      category: 'controller',
      icon: 'cpu',
      metrics: [STATUS_METRIC],
    },
    {
      typeKey: 'smoke_slave',
      name: '消防防排烟监控分机',
      category: 'controller',
      icon: 'cpu',
      metrics: [STATUS_METRIC],
    },
  ],

  deviceProfiles: [
    {
      typeKey: 'fan_pressure',
      name: '风机压差探测器',
      category: 'sensor',
      icon: 'dashboard',
      metrics: [
        {
          key: 'diffPressure',
          label: '风机压差',
          kind: 'analog',
          unit: 'Pa',
          range: [0, 500],
          // 加压送风/排烟风机正常压差 100~300 Pa
          normalRange: [130, 270],
          precision: 1,
          highLimit: 300,
          lowLimit: 100,
        },
        STATUS_METRIC,
      ],
    },
  ],

  scale: {
    host: 1,
    slave: 2,
    devices: [
      { typeKey: 'fan_pressure', count: 93, codePrefix: 'FY', nameHint: '风机压差探测器' },
    ],
  },

  summaryCards: [
    { key: 'total', label: '接入设备', icon: 'layers', source: 'total', hint: '含主机/分机与风机探测器' },
    { key: 'normal', label: '正常', icon: 'check', source: 'statusCount', hint: '压差 130~270 Pa' },
    { key: 'alarm', label: '报警', icon: 'error-circle', source: 'statusCount', hint: '压差 < 100 或 > 300 Pa' },
    { key: 'fault', label: '故障', icon: 'close-circle', source: 'statusCount', hint: '探测器异常' },
    { key: 'offline', label: '离线', icon: 'close-circle', source: 'statusCount', hint: '心跳丢失' },
  ],

  sections: [
    {
      key: 'fan',
      title: '风机压差监测',
      layout: 'cards',
      showTypes: ['fan_pressure'],
      span: 4,
      hint: '加压送风/排烟风机前后压差实时监测',
    },
  ],
}

export const SUBSYSTEM_PROFILES: SubsystemProfile[] = [
  PIPELINE_PROFILE,
  GAS_EXTINGUISH_PROFILE,
  SMOKE_EXHAUST_PROFILE,
]

export function getSubsystemProfile(key: string): SubsystemProfile | undefined {
  return SUBSYSTEM_PROFILES.find(p => p.key === key)
}