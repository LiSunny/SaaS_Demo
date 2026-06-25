/**
 * enterprise-dao.ts — 租户管理 DAO 适配器（Mock 数据）
 */
import type { EnterpriseItem, EnterpriseQuery, EnterpriseForm, SubordinateItem, PartnerItem, OperationLogItem, PaginatedData } from '@/types/enterprise'
import { createPersistentStore } from '@/utils/db-adapter'

// ===== Mock 企业数据 =====
const MOCK_ENTERPRISES: EnterpriseItem[] = [
  {
    id: '1', name: '尼特', code: 'QY1',
    dimA: { level1: 'platform_operator', level2: null, level3: null },
    dimB: '', dimC: { code: '', name: '' }, dimD: '',
    region: '', contactName: '管理员', contactPhone: '16666666666',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 5, unitCount: 2, relCount: 3,
    createdAt: '2024-10-31 15:53:06', updatedAt: '2024-10-31 15:53:06',
  },
  {
    id: '2', name: '港南一中', code: 'QY1013801074735185920',
    dimA: { level1: 'social_unit', level2: null, level3: null },
    dimB: '06', dimC: { code: '85', name: '教育' }, dimD: '12',
    region: '广西壮族自治区 贵港市 港南区', contactName: '李文学', contactPhone: '17733550542',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 1, unitCount: 1, relCount: 2,
    createdAt: '2025-08-29 13:23:32', updatedAt: '2025-08-29 13:23:32',
  },
  {
    id: '3', name: '港南消防队', code: 'QY1044197200894099456',
    dimA: { level1: 'supervisor', level2: null, level3: 'fire_rescue' },
    dimB: '', dimC: { code: '91', name: '国家机构' }, dimD: '',
    region: '', contactName: '李阳', contactPhone: '17733550542',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 3, unitCount: 1, relCount: 1,
    createdAt: '2025-11-21 10:26:53', updatedAt: '2025-11-21 10:26:53',
  },
  {
    id: '4', name: '阳光物业管理有限公司', code: 'QY1000000000000000001',
    dimA: { level1: 'manager', level2: 'space_manager', level3: 'property_mgr' },
    dimB: '', dimC: { code: '70', name: '房地产业' }, dimD: '2',
    region: '北京市 朝阳区', contactName: '赵丽萍', contactPhone: '13800001111',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '朝阳区XX路100号', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 12, unitCount: 5, relCount: 8,
    createdAt: '2025-06-15 09:00:00', updatedAt: '2025-06-15 09:00:00',
  },
  {
    id: '5', name: '蓝盾消防技术服务公司', code: 'QY1000000000000000002',
    dimA: { level1: 'service_unit', level2: null, level3: 'fire_tech_service' },
    dimB: '', dimC: { code: '80', name: '居民服务业' }, dimD: '',
    region: '北京市 海淀区', contactName: '郑晓峰', contactPhone: '13900002222',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: ['维保', '检测'], address: '海淀区XX科技园', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 25, unitCount: 3, relCount: 6,
    createdAt: '2025-07-01 10:00:00', updatedAt: '2025-07-01 10:00:00',
  },
  {
    id: '6', name: '应急管理局安全管理中心', code: 'QY1000000000000000003',
    dimA: { level1: 'supervisor', level2: null, level3: 'emergency_mgmt' },
    dimB: '', dimC: { code: '91', name: '国家机构' }, dimD: '',
    region: '北京市', contactName: '王蕾', contactPhone: '13700003333',
    status: 1, validFrom: '', validTo: '', parentId: '', parentName: '',
    tags: [], address: '', remark: '', logo: '', qrcode: '', creatorName: '孙文博',
    staffCount: 8, unitCount: 2, relCount: 4,
    createdAt: '2025-08-01 08:00:00', updatedAt: '2025-08-01 08:00:00',
  },
]

// ===== Mock 下级关联 =====
const MOCK_SUBORDINATES: Record<string, SubordinateItem[]> = {
  '6': [
    { id: 's1', enterpriseId: '3', enterpriseName: '港南消防队', dimALevel1: 'supervisor', tags: [], relatedAt: '2025-12-01 10:00:00', operatorName: '王蕾' },
    { id: 's2', enterpriseId: '4', enterpriseName: '阳光物业管理有限公司', dimALevel1: 'manager', tags: [], relatedAt: '2025-12-15 14:00:00', operatorName: '王蕾' },
  ],
  '4': [
    { id: 's3', enterpriseId: '5', enterpriseName: '蓝盾消防技术服务公司', dimALevel1: 'service_unit', tags: [], relatedAt: '2026-01-10 09:00:00', operatorName: '赵丽萍' },
  ],
}

// ===== Mock 相关方 =====
const MOCK_PARTNERS: Record<string, PartnerItem[]> = {
  '2': [
    { id: 'p1', enterpriseId: '3', enterpriseName: '港南消防队', tags: [], contactName: '李阳', contactPhone: '17733550542', relatedAt: '2025-08-29 14:08:21', operatorName: '李文学', authUnits: [], allowOperation: false },
    { id: 'p2', enterpriseId: '1', enterpriseName: '尼特', tags: [], contactName: '管理员', contactPhone: '16666666666', relatedAt: '2025-08-29 13:23:32', operatorName: '超级管理员', authUnits: [], allowOperation: false },
  ],
}

// ===== Mock 操作日志 =====
const MOCK_LOGS: OperationLogItem[] = [
  { id: 'l1', action: '创建企业', timestamp: '2025-08-29 13:23:32', operatorName: '超级管理员', details: [{ label: '企业名称', value: '港南一中' }] },
  { id: 'l2', action: '关联相关方', timestamp: '2025-08-29 13:23:32', operatorName: '超级管理员', details: [{ label: '关联企业', value: '尼特' }] },
  { id: 'l3', action: '关联相关方', timestamp: '2025-08-29 14:08:21', operatorName: '李文学', details: [{ label: '关联企业', value: '港南消防队' }] },
]

const store = createPersistentStore('enterprises', MOCK_ENTERPRISES)

// ===== API 实现 =====

export async function getEnterpriseList(query: EnterpriseQuery): Promise<PaginatedData<EnterpriseItem>> {
  let list = store.getAll() as EnterpriseItem[]
  if (query.keyword) {
    const kw = query.keyword.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(kw) || e.code.toLowerCase().includes(kw))
  }
  if (query.dimALevel1) {
    list = list.filter(e => e.dimA.level1 === query.dimALevel1)
  }
  if (query.dimB) list = list.filter(e => e.dimB === query.dimB)
  if (query.dimC) list = list.filter(e => e.dimC.name === query.dimC)
  const total = list.length
  const start = (query.page - 1) * query.size
  return { data: list.slice(start, start + query.size), total }
}

export async function getEnterpriseDetail(id: string): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  return item
}

export async function createEnterprise(form: EnterpriseForm): Promise<EnterpriseItem> {
  const id = String(Date.now())
  const code = `QY${Date.now()}${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const newItem: EnterpriseItem = {
    id, code,
    name: form.name, contactName: form.contactName, contactPhone: form.contactPhone,
    tags: form.tags ? form.tags.split(',').filter(Boolean) : [],
    validFrom: form.validFrom || '', validTo: form.validTo || '',
    region: form.region || '', parentId: form.parentId || '', parentName: '',
    address: form.address || '', remark: form.remark || '', logo: form.logo || '',
    dimA: { ...form.dimA }, dimB: form.dimB || '', dimC: { code: form.dimC || '', name: '' },
    dimD: form.dimD || '', status: 1, qrcode: '', creatorName: '当前用户',
    staffCount: 0, unitCount: 0, relCount: 0, createdAt: now, updatedAt: now,
  }
  store.add(newItem)
  return newItem
}

export async function updateEnterprise(id: string, form: Partial<EnterpriseForm>): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  Object.assign(item, form, { updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) })
  store.update(id, item)
  return item
}

export async function lockEnterprise(id: string): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  item.status = item.status === 1 ? 0 : 1
  store.update(id, item)
  return item
}

export async function extendEnterprise(id: string, validTo: string): Promise<EnterpriseItem> {
  const item = store.getById(id) as EnterpriseItem
  if (!item) throw new Error('企业不存在')
  item.validTo = validTo
  item.status = 1
  store.update(id, item)
  return item
}

export async function batchDeleteEnterprises(ids: string[]): Promise<void> {
  ids.forEach(id => store.remove(id))
}

export async function getSubordinates(enterpriseId: string, _query: { keyword?: string; page: number; size: number }): Promise<PaginatedData<SubordinateItem>> {
  const list = MOCK_SUBORDINATES[enterpriseId] || []
  return { data: list, total: list.length }
}

export async function addSubordinates(_enterpriseId: string, _enterpriseIds: string[]): Promise<void> {
  // Mock: 无实际操作
}

export async function removeSubordinates(_enterpriseId: string, _relationIds: string[]): Promise<void> {
  // Mock: 无实际操作
}

export async function getPartners(enterpriseId: string, _query: { keyword?: string; tag?: string; page: number; size: number }): Promise<PaginatedData<PartnerItem>> {
  const list = MOCK_PARTNERS[enterpriseId] || []
  return { data: list, total: list.length }
}

export async function addPartners(_enterpriseId: string, _enterpriseIds: string[]): Promise<void> {
  // Mock: 无实际操作
}

export async function removePartners(_enterpriseId: string, _relationIds: string[]): Promise<void> {
  // Mock: 无实际操作
}

export async function savePartnerAuth(_relationId: string, _data: { authUnits: string[]; allowOperation: boolean }): Promise<PartnerItem> {
  return {} as PartnerItem
}

export async function getOperationLogs(_enterpriseId: string, _query: { page: number; size: number }): Promise<PaginatedData<OperationLogItem>> {
  return { data: MOCK_LOGS, total: MOCK_LOGS.length }
}

export async function getEnterpriseQrcode(_id: string): Promise<string> {
  return ''
}

export async function regenerateQrcode(_id: string): Promise<string> {
  return ''
}

export async function searchEnterprises(keyword: string): Promise<EnterpriseItem[]> {
  return MOCK_ENTERPRISES.filter(e => e.name.includes(keyword) || e.code.includes(keyword))
}

// ===== 字典 =====
export async function getDimADict() {
  return { data: DIM_A_OPTIONS }
}

export async function getDictB() { return { data: DIM_B_OPTIONS } }
export async function getDictC() { return { data: DIM_C_OPTIONS } }
export async function getDictD() { return { data: DIM_D_OPTIONS } }
export async function getModuleTree() { return { data: MODULE_TREE } }

// ===== 维度 A 级联选项 =====
const DIM_A_OPTIONS = [
  {
    value: 'supervisor', label: '监管方',
    children: [
      { value: 'fire_rescue', label: '消防救援机构' },
      { value: 'emergency_mgmt', label: '应急管理部门' },
      { value: 'local_gov', label: '属地政府' },
      { value: 'industry_supervisor', label: '行业主管部门' },
    ],
  },
  {
    value: 'manager', label: '管理方',
    children: [
      {
        value: 'space_manager', label: '空间管理方',
        children: [
          { value: 'property_mgr', label: '物业管理方' },
          { value: 'park_mgr', label: '园区管理方' },
          { value: 'market_mgr', label: '市场管理方' },
          { value: 'complex_mgr', label: '综合体管理方' },
          { value: 'commercial_street_mgr', label: '商业街管理方' },
        ],
      },
      { value: 'group_manager', label: '集团管理方' },
    ],
  },
  { value: 'social_unit', label: '社会单位' },
  {
    value: 'service_unit', label: '服务单位',
    children: [
      { value: 'fire_tech_service', label: '消防技术服务机构' },
    ],
  },
  { value: 'platform_operator', label: '平台运营方' },
]

// XF/T 3016.1-2022 消防安全重点单位类别代码（28 项）
const DIM_B_OPTIONS = [
  { value: '01', label: '商场市场' }, { value: '02', label: '宾馆饭店' },
  { value: '03', label: '公共娱乐场所' }, { value: '04', label: '餐饮场所' },
  { value: '05', label: '医院' }, { value: '06', label: '学校' },
  { value: '07', label: '养老福利机构' }, { value: '08', label: '体育场馆' },
  { value: '09', label: '交通枢纽' }, { value: '10', label: '劳动密集型企业' },
  { value: '11', label: '易燃易爆场所' }, { value: '12', label: '高层公共建筑' },
  { value: '13', label: '地下建筑' }, { value: '14', label: '大型商业综合体' },
  { value: '15', label: '文物古建筑' }, { value: '16', label: '仓储物流' },
  { value: '17', label: '金融机构' }, { value: '18', label: '通信枢纽' },
  { value: '19', label: '广播电视' }, { value: '20', label: '发电厂/变电站' },
  { value: '21', label: '博物馆/展览馆' }, { value: '22', label: '图书馆/档案馆' },
  { value: '23', label: '科研机构' }, { value: '24', label: '旅游景区' },
  { value: '25', label: '宗教活动场所' }, { value: '26', label: '住宅小区' },
  { value: '27', label: '党政机关' }, { value: '28', label: '其他重点单位' },
]

// GB/T 4754-2017 国民经济行业分类（摘录常见 26 项）
const DIM_C_OPTIONS = [
  { value: '01', label: '农业' }, { value: '06', label: '煤炭开采和洗选业' },
  { value: '13', label: '农副食品加工业' }, { value: '17', label: '纺织业' },
  { value: '25', label: '石油、煤炭及其他燃料加工业' }, { value: '26', label: '化学原料和化学制品制造业' },
  { value: '33', label: '金属制品业' }, { value: '41', label: '土木工程建筑业' },
  { value: '47', label: '房屋建筑业' }, { value: '51', label: '批发业' },
  { value: '52', label: '零售业' }, { value: '56', label: '住宿业' },
  { value: '62', label: '餐饮业' }, { value: '63', label: '电信、广播电视和卫星传输服务' },
  { value: '64', label: '互联网和相关服务' }, { value: '66', label: '金融业' },
  { value: '70', label: '房地产业' }, { value: '80', label: '居民服务业' },
  { value: '82', label: '教育' }, { value: '83', label: '卫生' },
  { value: '85', label: '社会工作' }, { value: '86', label: '新闻和出版业' },
  { value: '87', label: '广播、电视、电影和影视录音制作业' }, { value: '90', label: '文化艺术业' },
  { value: '91', label: '国家机构' }, { value: '96', label: '基层群众自治组织' },
]

// 各省消防安全重点单位界定标准 — 场所/建筑类型（13 项）
const DIM_D_OPTIONS = [
  { value: '1', label: '人员密集场所' }, { value: '2', label: '高层建筑' },
  { value: '3', label: '地下建筑' }, { value: '4', label: '易燃易爆场所' },
  { value: '5', label: '文物古建筑' }, { value: '6', label: '大型商业综合体' },
  { value: '7', label: '工业建筑' }, { value: '8', label: '普通商铺' },
  { value: '9', label: '办公建筑' }, { value: '10', label: '交通建筑' },
  { value: '11', label: '医疗建筑' }, { value: '12', label: '教育建筑' },
  { value: '99', label: '其他' },
]

const MODULE_TREE = [
  {
    key: '设备管理', label: '设备管理',
    children: [
      { key: 'device-ledger', label: '设备台账' },
      { key: 'maintenance', label: '保养管理' },
      { key: 'monitor', label: '运行监控' },
    ],
  },
  { key: 'IOT', label: 'IOT', children: [] },
  {
    key: '远程值守', label: '远程值守',
    children: [
      { key: 'alarm-center', label: '告警中心' },
      { key: 'verify', label: '核实判定' },
    ],
  },
  {
    key: '巡查检查', label: '巡查检查',
    children: [
      { key: 'patrol-plan', label: '巡查计划' },
      { key: 'patrol-task', label: '巡查任务' },
    ],
  },
  { key: '项目管理', label: '项目管理', children: [] },
  { key: '维保应用', label: '维保应用', children: [] },
  { key: '数据可视化', label: '数据可视化', children: [] },
  {
    key: '隐患管理', label: '隐患管理',
    children: [
      { key: 'hazard-ledger', label: '隐患台账' },
    ],
  },
  { key: '食品安全管理', label: '食品安全管理', children: [] },
  { key: '培训与演练', label: '培训与演练', children: [] },
  { key: '系统管理', label: '系统管理', children: [] },
  { key: '政务管理', label: '政务管理', children: [] },
  { key: '危险作业管理', label: '危险作业管理', children: [] },
]
