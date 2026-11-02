import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  DeviceType,
  HierarchyNode,
  HierarchyNodeType,
  LinkUnitsResult,
  ManagedUnit,
  NodeStat,
  Project,
  ProjectDevice,
  ProjectStatus,
  ProjectUnit,
  ProjectUnitRow,
  UnitKind,
  UnitNature,
  VisualTemplate,
} from '@/types/project-ops'

/**
 * project-ops.ts — 项目管理（运营商侧）演示数据与状态
 *
 * 数据全部在前端内存中演示（design.md §10.3：前端用 Pinia 维护演示状态，
 * 后续接接口时只替换数据来源，不改交互）。
 *
 * 统计口径（design.md §8.4）：
 *   头部 KPI → 项目级，不随节点变化
 *   树徽标   → 默认含下级总数，tooltip 显示「本级 / 含下级」
 *   含下级开关 → 默认开，关闭时只看直接挂载
 */

/** 未分配节点的虚拟 id（树底部特殊节点，不可删除） */
export const UNASSIGNED_NODE_ID = '__unassigned__'

/** 层级最大深度（design.md §8.1） */
export const MAX_TREE_DEPTH = 6

/** 单次批量接入上限（design.md §8.2） */
export const MAX_LINK_UNITS = 50

// ===== 字典 =====

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'pending', label: '待启动' },
  { value: 'running', label: '进行中' },
  { value: 'done', label: '已完成' },
]

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: '待启动',
  running: '进行中',
  done: '已完成',
}

export const PROJECT_TYPE_OPTIONS = [
  '独居老人联网',
  '燃气监测',
  '重点单位联网',
  '九小场所托管',
  '区域安全托管',
]

export const UNIT_NATURE_OPTIONS: UnitNature[] = [
  '党政机关',
  '社会单位',
  '技术服务机构',
  '九小场所·个人',
  '家庭',
  '其它',
]

export const UNIT_KIND_OPTIONS: { value: UnitKind; label: string }[] = [
  { value: 'enterprise', label: '企业' },
  { value: 'family', label: '家庭' },
  { value: 'venue', label: '九小场所' },
]

export const DEVICE_TYPE_OPTIONS: DeviceType[] = ['烟感', '燃气', '电气', '摄像头', '网关', '其他']

export const VENUE_TYPE_OPTIONS = [
  '商店',
  '饭店',
  '网吧',
  '歌舞娱乐场所',
  '易燃易爆场所',
  '生产加工企业',
  '洗浴',
  '住宿',
]

/** 行政区划级联（省 / 市 / 区 / 街道） */
export interface RegionOption {
  label: string
  value: string
  children?: RegionOption[]
}

export const REGION_TREE: RegionOption[] = [
  {
    label: '河北省',
    value: '河北省',
    children: [
      {
        label: '秦皇岛市',
        value: '秦皇岛市',
        children: [
          {
            label: '海港区',
            value: '海港区',
            children: [
              { label: '港西街道', value: '港西街道' },
              { label: '港东街道', value: '港东街道' },
              { label: '红旗街道', value: '红旗街道' },
            ],
          },
          {
            label: '山海关区',
            value: '山海关区',
            children: [
              { label: '关城街道', value: '关城街道' },
              { label: '古城街道', value: '古城街道' },
              { label: '南街街道', value: '南街街道' },
            ],
          },
          {
            label: '北戴河区',
            value: '北戴河区',
            children: [
              { label: '海港街道', value: '海港街道' },
              { label: '戴河街道', value: '戴河街道' },
            ],
          },
          {
            label: '抚宁区',
            value: '抚宁区',
            children: [{ label: '抚宁镇', value: '抚宁镇' }],
          },
        ],
      },
      {
        label: '唐山市',
        value: '唐山市',
        children: [
          {
            label: '路北区',
            value: '路北区',
            children: [{ label: '文化路街道', value: '文化路街道' }],
          },
          {
            label: '路南区',
            value: '路南区',
            children: [{ label: '学院路街道', value: '学院路街道' }],
          },
        ],
      },
    ],
  },
]

// ===== 工具 =====

/** 在整棵区划树上递归查找某级的下级区划 */
function regionChildren(value: string): RegionOption[] {
  const find = (list: RegionOption[]): RegionOption | undefined => {
    for (const node of list) {
      if (node.value === value) return node
      if (node.children?.length) {
        const hit = find(node.children)
        if (hit) return hit
      }
    }
    return undefined
  }
  return find(REGION_TREE)?.children ?? []
}

let seq = 1000
function nextId(prefix: string): string {
  seq += 1
  return `${prefix}-${seq}`
}

// ===== 种子数据 =====

function seedProjects(): Project[] {
  return [
    {
      id: 'pj-001',
      code: 'pj-261021-hx45',
      name: '海港区独居老人联网',
      type: '独居老人联网',
      status: 'running',
      region: '海港区',
      regionPath: ['河北省', '秦皇岛市', '海港区'],
      owner: '孙文博',
      startDate: '2025-10-09',
      endDate: '2026-12-31',
      remark: '独居老人家庭烟感与燃气监测接入',
      createdAt: '2025-10-09 09:00:00',
      creator: '孙文博',
      visual: { bigscreen: 'bs-001', dashboard: null },
    },
    {
      id: 'pj-002',
      code: 'pj-261021-jwxf',
      name: '海港区燃气监测',
      type: '燃气监测',
      status: 'pending',
      region: '海港区',
      regionPath: ['河北省', '秦皇岛市', '海港区'],
      owner: '孙文博',
      startDate: '2025-11-01',
      endDate: '2026-11-30',
      remark: '餐饮燃气报警器联网',
      createdAt: '2025-10-09 09:20:00',
      creator: '孙文博',
      visual: { bigscreen: null, dashboard: null },
    },
    {
      id: 'pj-003',
      code: 'pj-260621-sg32',
      name: '海港区重点单位联网',
      type: '重点单位联网',
      status: 'done',
      region: '海港区',
      regionPath: ['河北省', '秦皇岛市', '海港区'],
      owner: '宋力志',
      startDate: '2025-06-21',
      endDate: '2026-06-20',
      remark: '重点单位消防物联接入',
      createdAt: '2025-06-21 14:30:00',
      creator: '宋力志',
      visual: { bigscreen: null, dashboard: 'db-001' },
    },
  ]
}

function seedNodes(): HierarchyNode[] {
  return [
    { id: 'n-001', projectId: 'pj-001', parentId: null, name: '海港区', type: 'region', order: 1, regionCode: '海港区' },
    { id: 'n-002', projectId: 'pj-001', parentId: 'n-001', name: '港西街道', type: 'region', order: 1, regionCode: '港西街道' },
    { id: 'n-003', projectId: 'pj-001', parentId: 'n-001', name: '港东街道', type: 'region', order: 2, regionCode: '港东街道' },
    { id: 'n-004', projectId: 'pj-001', parentId: 'n-001', name: '红旗街道', type: 'region', order: 3, regionCode: '红旗街道' },
    { id: 'n-005', projectId: 'pj-001', parentId: 'n-001', name: '海港区燃气用户片区', type: 'custom', order: 4, regionCode: '' },
    { id: 'n-006', projectId: 'pj-001', parentId: 'n-002', name: '港西街道 1 号网格', type: 'custom', order: 1, regionCode: '' },
    { id: 'n-007', projectId: 'pj-002', parentId: null, name: '海港区', type: 'region', order: 1, regionCode: '海港区' },
    { id: 'n-008', projectId: 'pj-002', parentId: 'n-007', name: '港西街道', type: 'region', order: 1, regionCode: '港西街道' },
    { id: 'n-009', projectId: 'pj-003', parentId: null, name: '海港区', type: 'region', order: 1, regionCode: '海港区' },
    { id: 'n-010', projectId: 'pj-003', parentId: 'n-009', name: '红旗街道', type: 'region', order: 1, regionCode: '红旗街道' },
  ]
}

function seedUnits(): ManagedUnit[] {
  return [
    { id: 'u-001', name: '港南消防队', kind: 'enterprise', nature: '社会单位', region: '海港区', address: '秦皇岛市海港区建设大街 12 号', contact: '李子新', phone: '18751529933', tags: ['消防安全重点单位'], isKeyUnit: true, venueType: '', createdAt: '2025-10-09 10:00:00' },
    { id: 'u-002', name: '阳光物业管理有限公司', kind: 'enterprise', nature: '社会单位', region: '海港区', address: '秦皇岛市海港区文化路 88 号', contact: '宋力志', phone: '17040201428', tags: ['物业'], isKeyUnit: true, venueType: '', createdAt: '2025-10-09 10:05:00' },
    { id: 'u-003', name: '蓝盾消防技术服务公司', kind: 'enterprise', nature: '技术服务机构', region: '海港区', address: '秦皇岛市海港区红旗路 32 号', contact: '郑晓峰', phone: '13900002222', tags: ['维保', '检测'], isKeyUnit: true, venueType: '', createdAt: '2025-10-09 10:10:00' },
    { id: 'u-004', name: '海港区政府', kind: 'enterprise', nature: '党政机关', region: '海港区', address: '秦皇岛市海港区人民政府大街 1 号', contact: '王小康', phone: '18946450602', tags: ['标签3'], isKeyUnit: true, venueType: '', createdAt: '2025-10-09 10:15:00' },
    { id: 'u-005', name: '烟草局', kind: 'enterprise', nature: '党政机关', region: '海港区', address: '秦皇岛市海港区文化路 1 号', contact: '李子新', phone: '18751529931', tags: ['标签2'], isKeyUnit: false, venueType: '', createdAt: '2025-10-09 10:20:00' },
    { id: 'u-006', name: '秦皇岛一中', kind: 'enterprise', nature: '社会单位', region: '海港区', address: '秦皇岛市海港区红旗路 1 号', contact: '王小康', phone: '18946450601', tags: ['学校'], isKeyUnit: true, venueType: '', createdAt: '2025-10-09 10:25:00' },
    { id: 'u-007', name: '万达商业管理有限公司', kind: 'enterprise', nature: '社会单位', region: '海港区', address: '秦皇岛市海港区文化路 200 号', contact: '陈伟强', phone: '18612345678', tags: ['消防安全重点单位'], isKeyUnit: true, venueType: '', createdAt: '2025-10-09 10:30:00' },
    { id: 'u-008', name: '张桂芳家庭', kind: 'family', nature: '家庭', region: '海港区', address: '秦皇岛市海港区港西街道 12 号楼 2 单元 301', contact: '张桂芳', phone: '13500001111', tags: ['独居老人'], isKeyUnit: false, venueType: '', createdAt: '2025-10-09 10:35:00' },
    { id: 'u-009', name: '李明远家庭', kind: 'family', nature: '家庭', region: '海港区', address: '秦皇岛市海港区港东街道 5 号楼 401', contact: '李明远', phone: '13500002222', tags: ['独居老人'], isKeyUnit: false, venueType: '', createdAt: '2025-10-09 10:40:00' },
    { id: 'u-010', name: '王秀英家庭', kind: 'family', nature: '家庭', region: '海港区', address: '秦皇岛市海港区红旗街道 8 号楼 102', contact: '王秀英', phone: '13500003333', tags: ['独居老人'], isKeyUnit: false, venueType: '', createdAt: '2025-10-09 10:45:00' },
    { id: 'u-011', name: '老孙头饺子馆', kind: 'venue', nature: '九小场所·个人', region: '海港区', address: '秦皇岛市海港区港西街道 66 号', contact: '孙建军', phone: '13600001111', tags: ['餐饮'], isKeyUnit: false, venueType: '饭店', createdAt: '2025-10-09 10:50:00' },
    { id: 'u-012', name: '海港便利店', kind: 'venue', nature: '九小场所·个人', region: '海港区', address: '秦皇岛市海港区港东街道 12 号', contact: '刘海燕', phone: '13600002222', tags: ['零售'], isKeyUnit: false, venueType: '商店', createdAt: '2025-10-09 10:55:00' },
    { id: 'u-013', name: '金海岸洗浴中心', kind: 'venue', nature: '九小场所·个人', region: '海港区', address: '秦皇岛市海港区红旗路 45 号', contact: '赵刚', phone: '13600003333', tags: [], isKeyUnit: false, venueType: '洗浴', createdAt: '2025-10-09 11:00:00' },
  ]
}

function seedProjectUnits(): ProjectUnit[] {
  return [
    { projectId: 'pj-001', unitId: 'u-008', nodeId: 'n-006', addedAt: '2025-10-09 13:20:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-001', unitId: 'u-009', nodeId: 'n-002', addedAt: '2025-10-09 13:25:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-001', unitId: 'u-010', nodeId: 'n-003', addedAt: '2025-10-09 13:30:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-001', unitId: 'u-001', nodeId: 'n-001', addedAt: '2025-10-09 13:35:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-001', unitId: 'u-011', nodeId: 'n-004', addedAt: '2025-10-09 13:40:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-001', unitId: 'u-012', nodeId: null, addedAt: '2025-10-09 13:45:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-002', unitId: 'u-011', nodeId: 'n-008', addedAt: '2025-11-02 09:10:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-002', unitId: 'u-013', nodeId: 'n-007', addedAt: '2025-11-02 09:15:00', operator: '孙文博', remark: '', tags: [], contact: '' },
    { projectId: 'pj-003', unitId: 'u-001', nodeId: 'n-009', addedAt: '2025-06-22 10:00:00', operator: '宋力志', remark: '', tags: [], contact: '' },
    { projectId: 'pj-003', unitId: 'u-007', nodeId: 'n-010', addedAt: '2025-06-22 10:05:00', operator: '宋力志', remark: '', tags: [], contact: '' },
  ]
}

function seedDevices(): ProjectDevice[] {
  const rows: [string, string, string, DeviceType, string, string, boolean][] = [
    ['pj-001', 'u-008', '张桂芳家烟感', '烟感', 'SB-A1-0001', '客厅', true],
    ['pj-001', 'u-008', '张桂芳家燃气报警器', '燃气', 'RQ-A1-0002', '厨房', true],
    ['pj-001', 'u-008', '张桂芳家网关', '网关', 'GW-A1-0003', '客厅', false],
    ['pj-001', 'u-009', '李明远家烟感', '烟感', 'SB-A1-0004', '卧室', true],
    ['pj-001', 'u-009', '李明远家电气监测', '电气', 'DQ-A1-0005', '配电箱', true],
    ['pj-001', 'u-010', '王秀英家烟感', '烟感', 'SB-A1-0006', '客厅', false],
    ['pj-001', 'u-010', '王秀英家摄像头', '摄像头', 'SX-A1-0007', '门口', true],
    ['pj-001', 'u-001', '港南消防队烟感', '烟感', 'SB-A1-0008', '值班室', true],
    ['pj-001', 'u-001', '港南消防队摄像头', '摄像头', 'SX-A1-0009', '大门', true],
    ['pj-001', 'u-001', '港南消防队网关', '网关', 'GW-A1-0010', '值班室', true],
    ['pj-001', 'u-011', '老孙头饺子馆烟感', '烟感', 'SB-A1-0011', '后厨', true],
    ['pj-001', 'u-011', '老孙头饺子馆燃气报警器', '燃气', 'RQ-A1-0012', '后厨', false],
    ['pj-001', 'u-012', '海港便利店烟感', '烟感', 'SB-A1-0013', '收银台', true],
    ['pj-002', 'u-011', '老孙头饺子馆燃气报警器', '燃气', 'RQ-A2-0001', '灶台', true],
    ['pj-002', 'u-013', '金海岸洗浴烟感', '烟感', 'SB-A2-0002', '更衣间', true],
    ['pj-002', 'u-013', '金海岸洗浴电气监测', '电气', 'DQ-A2-0003', '配电箱', false],
    ['pj-003', 'u-001', '港南消防队烟感', '烟感', 'SB-A3-0001', '档案室', true],
    ['pj-003', 'u-007', '万达烟感', '烟感', 'SB-A3-0002', '中庭', true],
    ['pj-003', 'u-007', '万达摄像头', '摄像头', 'SX-A3-0003', '东门', true],
  ]
  return rows.map(([projectId, unitId, name, type, code, location, online], i) => ({
    id: `d-${String(i + 1).padStart(3, '0')}`,
    projectId,
    unitId,
    name,
    type,
    code,
    location,
    online,
    connectedAt: '2025-10-10 08:00:00',
    remark: '',
  }))
}

function seedTemplates(): VisualTemplate[] {
  return [
    { id: 'bs-001', kind: 'bigscreen', name: '园区安全态势大屏', scene: '园区 / 厂区', desc: '接入单位与设备分布、实时告警与在线率总览', thumb: 'linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)' },
    { id: 'bs-002', kind: 'bigscreen', name: '城市消防运行大屏', scene: '区域 / 城市', desc: '按行政区划分层展示单位接入情况与风险分布', thumb: 'linear-gradient(135deg, #0F4C81 0%, #38BDF8 100%)' },
    { id: 'bs-003', kind: 'bigscreen', name: '重点单位联网大屏', scene: '重点单位', desc: '重点单位在线率、设备状态与告警处置进度', thumb: 'linear-gradient(135deg, #7C2D12 0%, #F59E0B 100%)' },
    { id: 'db-001', kind: 'dashboard', name: '项目运营看板', scene: '运营商', desc: '项目 KPI、接入进度与层级分布一屏总览', thumb: 'linear-gradient(135deg, #065F46 0%, #34D399 100%)' },
    { id: 'db-002', kind: 'dashboard', name: '设备健康看板', scene: '运维', desc: '设备在线率、离线清单与故障分布', thumb: 'linear-gradient(135deg, #4C1D95 0%, #A78BFA 100%)' },
  ]
}

// ===== Store =====

export const useProjectOpsStore = defineStore('project-ops', () => {
  const projects = ref<Project[]>(seedProjects())
  const nodes = ref<HierarchyNode[]>(seedNodes())
  const units = ref<ManagedUnit[]>(seedUnits())
  const projectUnits = ref<ProjectUnit[]>(seedProjectUnits())
  const devices = ref<ProjectDevice[]>(seedDevices())
  const templates = ref<VisualTemplate[]>(seedTemplates())

  // ===== 读取 =====

  function projectById(id: string): Project | undefined {
    return projects.value.find(p => p.id === id)
  }

  function nodesOf(projectId: string): HierarchyNode[] {
    return nodes.value.filter(n => n.projectId === projectId)
  }

  function nodeById(nodeId: string): HierarchyNode | undefined {
    return nodes.value.find(n => n.id === nodeId)
  }

  /** 直接子节点（按 order 排序） */
  function childrenOf(projectId: string, parentId: string | null): HierarchyNode[] {
    return nodesOf(projectId)
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  }

  /** 节点深度：根节点为 1 */
  function depthOf(nodeId: string): number {
    let depth = 0
    let cur = nodeById(nodeId)
    while (cur) {
      depth += 1
      cur = cur.parentId ? nodeById(cur.parentId) : undefined
    }
    return depth
  }

  /** 某节点的全部后代 id */
  function descendantIds(nodeId: string): string[] {
    const out: string[] = []
    const walk = (pid: string) => {
      for (const child of nodes.value.filter(n => n.projectId === nodeById(nodeId)?.projectId && n.parentId === pid)) {
        out.push(child.id)
        walk(child.id)
      }
    }
    walk(nodeId)
    return out
  }

  /** 节点路径（从根到该节点） */
  function nodePath(nodeId: string): HierarchyNode[] {
    const path: HierarchyNode[] = []
    let cur = nodeById(nodeId)
    while (cur) {
      path.unshift(cur)
      cur = cur.parentId ? nodeById(cur.parentId) : undefined
    }
    return path
  }

  /** 节点显示路径文案，如「海港区 / 港西街道 / 1 号网格」 */
  function nodePathText(nodeId: string | null): string {
    if (!nodeId) return '未分配'
    return nodePath(nodeId).map(n => n.name).join(' / ')
  }

  /** 项目内单位行 */
  function unitRows(projectId: string): ProjectUnitRow[] {
    return projectUnits.value
      .filter(pu => pu.projectId === projectId)
      .map(pu => {
        const unit = units.value.find(u => u.id === pu.unitId)
        if (!unit) return null
        return {
          ...unit,
          nodeId: pu.nodeId,
          addedAt: pu.addedAt,
          operator: pu.operator,
          projectRemark: pu.remark,
          projectTags: pu.tags ?? [],
          projectContact: pu.contact ?? '',
          deviceCount: devices.value.filter(d => d.projectId === projectId && d.unitId === unit.id).length,
          otherProjects: projectUnits.value
            .filter(other => other.unitId === unit.id && other.projectId !== projectId)
            .map(other => projectById(other.projectId)?.name ?? '')
            .filter(Boolean),
        }
      })
      .filter((r): r is ProjectUnitRow => r !== null)
  }

  /**
   * 项目内设备行（带单位名 / 层级路径）
   * 设备随单位走：单位被移出项目后设备保留在台账，但项目内不再显示（design.md §6.4.4）
   */
  function deviceRows(projectId: string): (ProjectDevice & { unitName: string; nodePath: string })[] {
    const linkedUnitIds = new Set(
      projectUnits.value.filter(pu => pu.projectId === projectId).map(pu => pu.unitId),
    )
    return devices.value
      .filter(d => d.projectId === projectId && linkedUnitIds.has(d.unitId))
      .map(d => {
        const link = projectUnits.value.find(pu => pu.projectId === projectId && pu.unitId === d.unitId)
        const unit = units.value.find(u => u.id === d.unitId)
        return { ...d, unitName: unit?.name ?? '—', nodePath: nodePathText(link?.nodeId ?? null) }
      })
  }

  /** 某节点下的单位（includeChildren 控制是否含子孙） */
  function unitsOfNode(projectId: string, nodeId: string | null, includeChildren: boolean): ProjectUnitRow[] {
    const rows = unitRows(projectId)
    if (nodeId === UNASSIGNED_NODE_ID) {
      return rows.filter(r => !r.nodeId)
    }
    if (!nodeId) return rows
    const scope = includeChildren ? new Set([nodeId, ...descendantIds(nodeId)]) : new Set([nodeId])
    return rows.filter(r => r.nodeId !== null && scope.has(r.nodeId))
  }

  /** 某节点下的设备（includeChildren 控制是否含子孙） */
  function devicesOfNode(projectId: string, nodeId: string | null, includeChildren: boolean): (ProjectDevice & { unitName: string; nodePath: string })[] {
    const rows = deviceRows(projectId)
    if (nodeId === UNASSIGNED_NODE_ID) {
      const ids = new Set(unitRows(projectId).filter(r => !r.nodeId).map(r => r.id))
      return rows.filter(d => ids.has(d.unitId))
    }
    if (!nodeId) return rows
    const scope = includeChildren ? new Set([nodeId, ...descendantIds(nodeId)]) : new Set([nodeId])
    const unitIds = new Set(
      projectUnits.value
        .filter(pu => pu.projectId === projectId && pu.nodeId !== null && scope.has(pu.nodeId))
        .map(pu => pu.unitId),
    )
    return rows.filter(d => unitIds.has(d.unitId))
  }

  /** 节点统计（树徽标 / 层级管理抽屉） */
  function statOf(projectId: string, nodeId: string): NodeStat {
    const rows = unitRows(projectId)
    const own = rows.filter(r => r.nodeId === nodeId)
    const kids = descendantIds(nodeId)
    const total = rows.filter(r => r.nodeId !== null && (r.nodeId === nodeId || kids.includes(r.nodeId)))
    const deviceCountOf = (unitIds: string[]) =>
      devices.value.filter(d => d.projectId === projectId && unitIds.includes(d.unitId)).length
    return {
      ownUnits: own.length,
      totalUnits: total.length,
      ownDevices: deviceCountOf(own.map(r => r.id)),
      totalDevices: deviceCountOf(total.map(r => r.id)),
    }
  }

  /** 项目级 KPI（不随节点变化，design.md §8.4） */
  const projectKpi = computed(() => (projectId: string) => {
    const rows = unitRows(projectId)
    const devs = devices.value.filter(d => d.projectId === projectId)
    const natureDist = UNIT_NATURE_OPTIONS.map(nature => ({
      name: nature,
      value: rows.filter(r => r.nature === nature).length,
    })).filter(i => i.value > 0)
    return {
      unitCount: rows.length,
      deviceCount: devs.length,
      onlineCount: devs.filter(d => d.online).length,
      offlineCount: devs.filter(d => !d.online).length,
      natureDist,
    }
  })

  /** 未分配单位数 */
  function unassignedCount(projectId: string): number {
    return unitRows(projectId).filter(r => !r.nodeId).length
  }

  /** 单位已加入的项目名列表 */
  function projectNamesOfUnit(unitId: string): string[] {
    return projectUnits.value
      .filter(pu => pu.unitId === unitId)
      .map(pu => projectById(pu.projectId)?.name ?? '')
      .filter(Boolean)
  }

  // ===== 项目 =====

  function createProject(
    payload: {
      name: string
      type: string
      regionPath: string[]
      owner: string
      startDate: string
      endDate: string
      remark: string
    },
    init: { mode: 'region' | 'blank' | 'copy'; depth: 'city' | 'district' | 'street'; copyFromProjectId: string | null },
  ): Project {
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const id = nextId('pj')
    const project: Project = {
      id,
      code: `pj-${stamp}-${id.slice(-4)}`,
      name: payload.name,
      type: payload.type,
      status: 'pending',
      region: payload.regionPath[payload.regionPath.length - 1] ?? '',
      regionPath: [...payload.regionPath],
      owner: payload.owner,
      startDate: payload.startDate,
      endDate: payload.endDate,
      remark: payload.remark,
      createdAt: now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      creator: '当前用户',
      visual: { bigscreen: null, dashboard: null },
    }
    projects.value.unshift(project)

    if (init.mode === 'region') {
      buildRegionNodes(project.id, payload.regionPath, init.depth)
    } else if (init.mode === 'copy' && init.copyFromProjectId) {
      copyNodes(project.id, init.copyFromProjectId)
    }
    return project
  }

  /** 按行政区划生成层级：根 = 管理范围选中的那一级，子级按深度下探 */
  function buildRegionNodes(projectId: string, regionPath: string[], depth: 'city' | 'district' | 'street'): void {
    const scope = regionPath[regionPath.length - 1]
    if (!scope) return
    const levelInPath = regionPath.indexOf(scope)
    // levelInPath: 0=省 1=市 2=区 3=街道
    const rootId = nextId('n')
    nodes.value.push({
      id: rootId,
      projectId,
      parentId: null,
      name: scope,
      type: 'region',
      order: 1,
      regionCode: scope,
    })

    const makeChildren = (parentId: string, parentName: string, parentLevel: number) => {
      const kids = regionChildren(parentName)
      if (!kids.length) return
      kids.forEach((k, i) => {
        const id = nextId('n')
        nodes.value.push({
          id,
          projectId,
          parentId,
          name: k.label,
          type: 'region',
          order: i + 1,
          regionCode: k.label,
        })
        const nextLevel = parentLevel + 1
        const wantKids =
          (depth === 'district' && nextLevel <= 2) ||
          (depth === 'street' && nextLevel <= 3)
        if (wantKids) makeChildren(id, k.label, nextLevel)
      })
    }

    const rootLevel = levelInPath >= 0 ? levelInPath : 1
    const wantKids =
      (depth === 'district' && rootLevel <= 1) ||
      (depth === 'street' && rootLevel <= 2)
    if (wantKids) makeChildren(rootId, scope, rootLevel)
  }

  /** 复制已有项目的层级结构（不复制单位 / 设备） */
  function copyNodes(targetProjectId: string, sourceProjectId: string): void {
    const source = nodesOf(sourceProjectId)
    const idMap = new Map<string, string>()
    const sorted = [...source].sort((a, b) => depthOf(a.id) - depthOf(b.id))
    for (const n of sorted) {
      const newId = nextId('n')
      idMap.set(n.id, newId)
      nodes.value.push({
        id: newId,
        projectId: targetProjectId,
        parentId: n.parentId ? idMap.get(n.parentId) ?? null : null,
        name: n.name,
        type: n.type,
        order: n.order,
        regionCode: n.regionCode,
      })
    }
  }

  function updateProject(id: string, payload: Partial<Project>): void {
    const p = projectById(id)
    if (!p) return
    if (payload.regionPath && payload.regionPath.length) {
      payload.region = payload.regionPath[payload.regionPath.length - 1]
    }
    Object.assign(p, payload)
  }

  /** 删除项目：级联清掉该项目下的层级 / 接入关系 / 设备（台账单位与设备基础信息保留在台账） */
  function deleteProject(id: string): void {
    projects.value = projects.value.filter(p => p.id !== id)
    nodes.value = nodes.value.filter(n => n.projectId !== id)
    projectUnits.value = projectUnits.value.filter(pu => pu.projectId !== id)
    devices.value = devices.value.filter(d => d.projectId !== id)
  }

  // ===== 层级节点 =====

  /** 新增子级 / 同级 */
  function addNode(
    projectId: string,
    parentId: string | null,
    name: string,
    type: HierarchyNodeType = 'custom',
  ): { ok: boolean; msg: string; nodeId?: string } {
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, msg: '请输入节点名称' }
    if (parentId) {
      const parent = nodeById(parentId)
      if (!parent) return { ok: false, msg: '父节点不存在' }
      if (depthOf(parentId) + 1 > MAX_TREE_DEPTH) {
        return { ok: false, msg: `层级最多 ${MAX_TREE_DEPTH} 层，无法继续新增` }
      }
    }
    const siblings = childrenOf(projectId, parentId)
    if (siblings.some(n => n.name === trimmed)) {
      return { ok: false, msg: '同级已有同名节点' }
    }
    const id = nextId('n')
    nodes.value.push({
      id,
      projectId,
      parentId,
      name: trimmed,
      type,
      order: siblings.length + 1,
      regionCode: '',
    })
    return { ok: true, msg: '新增成功', nodeId: id }
  }

  /** 按行政区划初始化层级（项目详情「层级管理」抽屉内使用） */
  function initRegionNodes(projectId: string, regionPath: string[], depth: 'city' | 'district' | 'street'): { ok: boolean; msg: string; added: number } {
    const before = nodesOf(projectId).length
    buildRegionNodes(projectId, regionPath, depth)
    const added = nodesOf(projectId).length - before
    return { ok: true, msg: added ? `已生成 ${added} 个层级节点` : '层级未变化', added }
  }

  /** 重命名（区划节点仅改显示名，不改区划来源） */
  function renameNode(nodeId: string, name: string): { ok: boolean; msg: string } {
    const node = nodeById(nodeId)
    if (!node) return { ok: false, msg: '节点不存在' }
    const trimmed = name.trim()
    if (!trimmed) return { ok: false, msg: '请输入节点名称' }
    const siblings = childrenOf(node.projectId, node.parentId)
    if (siblings.some(n => n.id !== nodeId && n.name === trimmed)) {
      return { ok: false, msg: '同级已有同名节点' }
    }
    node.name = trimmed
    return { ok: true, msg: '重命名成功' }
  }

  /** 删除节点前置校验 */
  function checkRemoveNode(projectId: string, nodeId: string): { ok: boolean; msg: string; stat?: NodeStat } {
    const node = nodeById(nodeId)
    if (!node) return { ok: false, msg: '节点不存在' }
    if (childrenOf(projectId, nodeId).length > 0) {
      return { ok: false, msg: '请先删除或迁移子层级' }
    }
    const stat = statOf(projectId, nodeId)
    return { ok: true, msg: '', stat }
  }

  /**
   * 删除节点
   * strategy: 'unassign' 移至「未分配」并删除（默认）| 'migrate' 迁移后删除（需先指定目标节点）
   */
  function removeNode(projectId: string, nodeId: string, strategy: 'unassign' | 'migrate', targetNodeId?: string): { ok: boolean; msg: string } {
    const check = checkRemoveNode(projectId, nodeId)
    if (!check.ok) return check
    const affected = projectUnits.value.filter(pu => pu.projectId === projectId && pu.nodeId === nodeId)
    if (affected.length > 0) {
      if (strategy === 'migrate') {
        if (!targetNodeId) return { ok: false, msg: '请选择迁移目标节点' }
        for (const pu of affected) pu.nodeId = targetNodeId
      } else {
        for (const pu of affected) pu.nodeId = null
      }
    }
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    return { ok: true, msg: '删除成功' }
  }

  /** 移动节点（不能移到自己的子孙下） */
  function moveNode(projectId: string, nodeId: string, targetParentId: string | null): { ok: boolean; msg: string } {
    const node = nodeById(nodeId)
    if (!node) return { ok: false, msg: '节点不存在' }
    if (targetParentId === nodeId) return { ok: false, msg: '不能移动到自己的下级' }
    if (targetParentId && descendantIds(nodeId).includes(targetParentId)) {
      return { ok: false, msg: '不能移动到自己的下级' }
    }
    if (targetParentId && depthOf(targetParentId) + 1 > MAX_TREE_DEPTH) {
      return { ok: false, msg: `层级最多 ${MAX_TREE_DEPTH} 层，无法移动到该节点下` }
    }
    const siblings = childrenOf(projectId, targetParentId).filter(n => n.id !== nodeId)
    if (siblings.some(n => n.name === node.name)) {
      return { ok: false, msg: '同级已有同名节点' }
    }
    node.parentId = targetParentId
    node.order = siblings.length + 1
    return { ok: true, msg: '移动成功' }
  }

  /** 同级排序：上移 / 下移 */
  function reorderNode(projectId: string, nodeId: string, dir: 'up' | 'down'): { ok: boolean; msg: string } {
    const node = nodeById(nodeId)
    if (!node) return { ok: false, msg: '节点不存在' }
    const siblings = childrenOf(projectId, node.parentId)
    const idx = siblings.findIndex(n => n.id === nodeId)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return { ok: false, msg: '已经到边界了' }
    const tmp = siblings[idx].order
    siblings[idx].order = siblings[swapIdx].order
    siblings[swapIdx].order = tmp
    return { ok: true, msg: dir === 'up' ? '已上移' : '已下移' }
  }

  /** 同步下级区划（仅区划节点可用，已存在的跳过） */
  function syncChildRegions(projectId: string, nodeId: string): { ok: boolean; msg: string; added: number } {
    const node = nodeById(nodeId)
    if (!node) return { ok: false, msg: '节点不存在', added: 0 }
    if (node.type !== 'region') return { ok: false, msg: '仅区划节点支持同步下级区划', added: 0 }
    const kids = regionChildren(node.name)
    if (!kids.length) return { ok: false, msg: '该区划没有下级区划', added: 0 }
    const existing = childrenOf(projectId, nodeId)
    let added = 0
    for (const k of kids) {
      if (existing.some(n => n.name === k.label)) continue
      const id = nextId('n')
      nodes.value.push({
        id,
        projectId,
        parentId: nodeId,
        name: k.label,
        type: 'region',
        order: childrenOf(projectId, nodeId).length + 1,
        regionCode: k.label,
      })
      added += 1
    }
    return { ok: true, msg: added ? `已同步 ${added} 个下级区划` : '下级区划已是最新', added }
  }

  // ===== 单位 =====

  /** 接入单位：已在本项目的跳过 */
  function linkUnits(projectId: string, unitIds: string[], nodeId: string | null): LinkUnitsResult {
    const result: LinkUnitsResult = { success: 0, skipped: 0, skippedNames: [] }
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    for (const unitId of unitIds) {
      const exists = projectUnits.value.find(pu => pu.projectId === projectId && pu.unitId === unitId)
      if (exists) {
        result.skipped += 1
        result.skippedNames.push(units.value.find(u => u.id === unitId)?.name ?? unitId)
        continue
      }
      projectUnits.value.push({
        projectId,
        unitId,
        nodeId,
        addedAt: now,
        operator: '当前用户',
        remark: '',
        tags: [],
        contact: '',
      })
      result.success += 1
    }
    return result
  }

  /**
   * 移除单位：只解除项目关联，台账单位与其设备保留在台账（design.md §6.4.4）
   * 设备随单位走：单位移出后，项目设备列表不再包含这些设备（deviceRows 已按关联过滤）
   */
  function unlinkUnits(projectId: string, unitIds: string[]): number {
    const before = projectUnits.value.length
    projectUnits.value = projectUnits.value.filter(
      pu => !(pu.projectId === projectId && unitIds.includes(pu.unitId)),
    )
    return before - projectUnits.value.length
  }

  /** 移动单位到指定层级 */
  function moveUnits(projectId: string, unitIds: string[], nodeId: string | null): number {
    let count = 0
    for (const pu of projectUnits.value) {
      if (pu.projectId === projectId && unitIds.includes(pu.unitId)) {
        pu.nodeId = nodeId
        count += 1
      }
    }
    return count
  }

  /**
   * 编辑项目内单位字段（标签 / 备注 / 项目内联系人）
   * 只改项目级字段，台账基础信息去台账编辑（design.md §6.4.4）
   */
  function updateProjectUnit(
    projectId: string,
    unitId: string,
    payload: { tags?: string[]; remark?: string; contact?: string },
  ): { ok: boolean; msg: string } {
    const pu = projectUnits.value.find(p => p.projectId === projectId && p.unitId === unitId)
    if (!pu) return { ok: false, msg: '该单位未接入本项目' }
    if (payload.tags !== undefined) pu.tags = [...payload.tags]
    if (payload.remark !== undefined) pu.remark = payload.remark
    if (payload.contact !== undefined) pu.contact = payload.contact
    return { ok: true, msg: '保存成功' }
  }

  /** 新建单位（台账 + 可选直接接入项目） */
  function createUnit(payload: {
    name: string
    kind: UnitKind
    nature: UnitNature
    region: string
    address: string
    contact: string
    phone: string
    tags: string[]
    venueType: string
    isKeyUnit: boolean
  }, link?: { projectId: string; nodeId: string | null }): { ok: boolean; msg: string; unitId?: string } {
    const trimmed = payload.name.trim()
    if (!trimmed) return { ok: false, msg: '请输入名称' }
    if (payload.phone && !/^1[3-9]\d{9}$/.test(payload.phone)) {
      return { ok: false, msg: '手机号格式不正确' }
    }
    if (link?.projectId) {
      const dup = projectUnits.value.find(
        pu => pu.projectId === link.projectId && units.value.find(u => u.id === pu.unitId)?.name === trimmed,
      )
      if (dup) return { ok: false, msg: '该项目内已存在同名单位' }
    }
    const id = nextId('u')
    units.value.unshift({
      id,
      name: trimmed,
      kind: payload.kind,
      nature: payload.nature,
      region: payload.region,
      address: payload.address,
      contact: payload.contact,
      phone: payload.phone,
      tags: [...payload.tags],
      isKeyUnit: payload.isKeyUnit,
      venueType: payload.venueType,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    })
    if (link?.projectId) {
      linkUnits(link.projectId, [id], link.nodeId)
    }
    return { ok: true, msg: '保存成功', unitId: id }
  }

  function updateUnit(unitId: string, payload: Partial<ManagedUnit>): void {
    const u = units.value.find(x => x.id === unitId)
    if (u) Object.assign(u, payload)
  }

  function removeUnit(unitId: string): void {
    units.value = units.value.filter(u => u.id !== unitId)
    projectUnits.value = projectUnits.value.filter(pu => pu.unitId !== unitId)
    devices.value = devices.value.filter(d => d.unitId !== unitId)
  }

  // ===== 设备 =====

  /** 新增设备：编码在项目内唯一 */
  function addDevice(payload: {
    projectId: string
    unitId: string
    name: string
    type: DeviceType
    code: string
    location: string
    online: boolean
    remark: string
  }): { ok: boolean; msg: string; deviceId?: string } {
    if (!payload.unitId) return { ok: false, msg: '请选择归属单位' }
    if (!payload.name.trim()) return { ok: false, msg: '请输入设备名称' }
    if (!payload.code.trim()) return { ok: false, msg: '请输入设备编码' }
    const dup = devices.value.find(d => d.projectId === payload.projectId && d.code === payload.code.trim())
    if (dup) return { ok: false, msg: '设备编码重复' }
    const id = nextId('d')
    devices.value.push({
      id,
      projectId: payload.projectId,
      unitId: payload.unitId,
      name: payload.name.trim(),
      type: payload.type,
      code: payload.code.trim(),
      location: payload.location,
      online: payload.online,
      connectedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      remark: payload.remark,
    })
    return { ok: true, msg: '保存成功', deviceId: id }
  }

  function removeDevice(deviceId: string): void {
    devices.value = devices.value.filter(d => d.id !== deviceId)
  }

  /**
   * 编辑设备（design.md §7.2.4 操作列含「编辑」）
   * 编码在项目内唯一（排除自身）；归属单位不可改（设备挂单位，换单位等于换归属）
   */
  function updateDevice(
    deviceId: string,
    payload: {
      name?: string
      type?: DeviceType
      code?: string
      location?: string
      online?: boolean
      remark?: string
    },
  ): { ok: boolean; msg: string } {
    const d = devices.value.find(x => x.id === deviceId)
    if (!d) return { ok: false, msg: '设备不存在' }
    const name = (payload.name ?? d.name).trim()
    if (!name) return { ok: false, msg: '请输入设备名称' }
    const code = (payload.code ?? d.code).trim()
    if (!code) return { ok: false, msg: '请输入设备编码' }
    const dup = devices.value.find(x => x.projectId === d.projectId && x.code === code && x.id !== deviceId)
    if (dup) return { ok: false, msg: '设备编码重复' }
    d.name = name
    if (payload.type) d.type = payload.type
    d.code = code
    if (payload.location !== undefined) d.location = payload.location
    if (payload.online !== undefined) d.online = payload.online
    if (payload.remark !== undefined) d.remark = payload.remark
    return { ok: true, msg: '保存成功' }
  }

  // ===== 可视化 =====

  function setVisual(projectId: string, kind: 'bigscreen' | 'dashboard', templateId: string | null): void {
    const p = projectById(projectId)
    if (!p) return
    p.visual = { ...p.visual, [kind]: templateId }
  }

  function templateById(id: string | null): VisualTemplate | undefined {
    if (!id) return undefined
    return templates.value.find(t => t.id === id)
  }

  return {
    // state
    projects,
    nodes,
    units,
    projectUnits,
    devices,
    templates,
    // 读取
    projectById,
    nodesOf,
    nodeById,
    childrenOf,
    depthOf,
    descendantIds,
    nodePath,
    nodePathText,
    unitRows,
    deviceRows,
    unitsOfNode,
    devicesOfNode,
    statOf,
    projectKpi,
    unassignedCount,
    projectNamesOfUnit,
    // 项目
    createProject,
    updateProject,
    deleteProject,
    // 层级
    addNode,
    renameNode,
    checkRemoveNode,
    removeNode,
    moveNode,
    reorderNode,
    syncChildRegions,
    initRegionNodes,
    // 单位
    linkUnits,
    unlinkUnits,
    moveUnits,
    updateProjectUnit,
    createUnit,
    updateUnit,
    removeUnit,
    // 设备
    addDevice,
    updateDevice,
    removeDevice,
    // 可视化
    setVisual,
    templateById,
  }
})
