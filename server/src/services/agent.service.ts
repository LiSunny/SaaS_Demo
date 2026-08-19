/**
 * agent.service.ts — AI Agent 核心服务
 *
 * 调用 DeepSeek LLM，支持：
 * - 页面导航（Phase 1）
 * - 数据查询 Function Calling（Phase 3）
 * - 本地规则降级
 */

import OpenAI from 'openai'
import { env } from '../config/env.js'
import { loadSystemPrompt } from '../config/agent-prompt-loader.js'
import * as enterpriseService from './enterprise.service.js'
import * as userService from './user.service.js'
import * as positionService from './position.service.js'
import db from '../config/db.js'

// ===== 页面别名映射 =====
const PAGE_ALIASES: Record<string, { route: string; aliases: string[] }> = {
  'landing':        { route: '/landing',                  aliases: ['大屏首页', '区域联勤', '总览大屏', '可视化大屏', '主大屏', '首页', 'landing'] },
  'street-detail':  { route: '/landing/street-detail',    aliases: ['商业街', '商业街管理', '商业街专题', '示范街', '街道详情', '街道管理', '街道'] },
  'fire-control':   { route: '/landing/fire-control',     aliases: ['消防控制室', '消控室', '消防管理', '消防监控', '消防'] },
  'gongmao':        { route: '/gongmao',                  aliases: ['工贸安全', '工贸驾驶舱', '工贸企业', '安全生产驾驶舱', '驾驶舱', '工贸'] },
}

// ===== System Prompt（从 Markdown 文件加载） =====
function getSystemPrompt(): string {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const todayLabel = `${today}（${weekdays[now.getDay()]}）`
  return loadSystemPrompt({ pageList: buildPageListText(), today: todayLabel })
}

// ===== 工具定义 =====
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      // 工具名称：查询租户列表
      name: 'query_enterprise_list',
      // 工具说明：查询租户（企业）的详细列表，返回企业名称、行业分类、地区等信息。
      // 触发场景：当用户要"列出所有租户"、"租户清单"、"有哪些企业"时使用此工具。
      description: '查询租户（企业）的详细列表，返回企业名称、行业分类、地区等信息。当用户要"列出所有租户"、"租户清单"、"有哪些企业"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          // dimB：消防重点单位类别筛选维度
          //   - 类型：string
          //   - 可选值：消防重点单位类别代码（XF/T 3016.1-2022，'01'~'28'，如 '27'=党政机关、'06'=学校、'04'=餐饮场所）
          //   - 作用：按类别代码筛选返回的企业列表；不传（或为空）则返回全部
          //   - 注意：取值需严格匹配上述代码枚举，拼写不一致会导致筛选无效
          dimB: { type: 'string', description: '按消防重点单位类别代码筛选（XF/T 3016.1-2022，01~28，如 27=党政机关、06=学校、04=餐饮场所）。不传则返回全部' },
          // keyword：企业名称关键词
          //   - 类型：string
          //   - 作用：按企业名称进行模糊搜索（包含匹配）；不传（或为空）则返回全部
          //   - 注意：与 dimB 可组合使用，先按行业筛选再按名称搜索
          keyword: { type: 'string', description: '按名称搜索关键词，不传则返回全部' },
        },
        // 必填字段：本工具所有参数均为可选，dimB 与 keyword 至少可单独或组合使用
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_enterprise_stats',
      description: '查询租户（企业）的统计数据，包括总数和行业分布。当用户问"有多少个租户"、"都是什么行业"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          dimB: { type: 'string', description: '按消防重点单位类别代码筛选（XF/T 3016.1-2022，01~28，如 27=党政机关、06=学校、04=餐饮场所）。不传则查询总数和所有类别分布' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_user_stats',
      description: '查询平台用户数据。不传 keyword 时返回平台总用户数；传入 keyword（手机号或姓名关键词）时，查询匹配用户并展示其关联企业及关联岗位信息。当用户问"用户关联了哪些岗位"、"某用户关联了哪家企业"、"用户统计"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          // keyword：用户手机号或姓名关键词
          //   - 类型：string
          //   - 作用：按手机号或姓名模糊匹配用户；不传（或为空）则返回平台总用户数
          keyword: { type: 'string', description: '按手机号或姓名搜索用户。不传则返回平台总用户数' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_position_list',
      description: '查询平台岗位列表',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_alarms',
      description: '查询告警数据（列表与统计）。返回告警点位、类型、等级、处置状态、时间、所属企业。当用户问"今天几条告警"、"未处理的火警"、"告警情况"、"告警统计"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '按处置状态筛选：未处理 / 已处理。不传则返回全部' },
          level: { type: 'string', description: '按等级筛选：紧急 / 重要 / 一般。不传则返回全部' },
          date: { type: 'string', description: '按日期筛选，格式 YYYY-MM-DD（如 2026-08-15）。用户说"今日/今天/8月15日"时转成此格式传入' },
          startDate: { type: 'string', description: '起始日期（含），格式 YYYY-MM-DD。查询时间范围（如"最近3天""8月1日到8月10日"）时使用' },
          endDate: { type: 'string', description: '结束日期（含），格式 YYYY-MM-DD。与 startDate 搭配使用' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_hazards',
      description: '查询隐患台账数据。返回隐患位置、类别、等级、整改状态、发现时间、所属企业。当用户问"未整改的隐患"、"隐患清单"、"隐患台账"、"隐患整改情况"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '按整改状态筛选：未整改 / 整改中 / 已整改。不传则返回全部' },
          level: { type: 'string', description: '按等级筛选：重大 / 重要 / 一般。不传则返回全部' },
          date: { type: 'string', description: '按日期筛选，格式 YYYY-MM-DD（如 2026-08-15）。用户说"今日/今天/8月15日"时转成此格式传入' },
          startDate: { type: 'string', description: '起始日期（含），格式 YYYY-MM-DD。查询时间范围（如"最近3天""8月1日到8月10日"）时使用' },
          endDate: { type: 'string', description: '结束日期（含），格式 YYYY-MM-DD。与 startDate 搭配使用' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_orders',
      description: '查询工单数据。返回工单号、标题、类型、状态、优先级、处理人、创建时间、所属企业。当用户问"我的工单"、"工单情况"、"工单统计"、"待处理的工单"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '按状态筛选：active（进行中）/ closed（已关闭）。不传则返回全部' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_devices',
      description: '查询设备台账与状态数据。返回设备名称、类型、在线状态、位置、所属企业。当用户问"离线设备"、"设备状态"、"设备台账"、"多少设备在线"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '按在线状态筛选：在线 / 离线。不传则返回全部' },
        },
        required: [],
      },
    },
  },
]

// 岗位标签映射从数据库动态加载（见 buildPositionLabelMap），不写死

// 消防重点单位类别映射（XF/T 3016.1-2022，01-28 代码）：
// 主映射来自 enterprise.service.ts 的 DIM_B_OPTIONS（单一数据源），
// 兼容历史数据里直接存旧中文值的情况。
const DIM_B_LABELS: Record<string, string> = Object.fromEntries(
  enterpriseService.DIM_B_OPTIONS.map((o) => [o.value, o.label]),
)
// 旧字典/历史数据兜底：存量租户的 dimB 可能是迁移前的中文或英文 key
Object.assign(DIM_B_LABELS, {
  'industry_trade': '工贸企业',
  'education': '教育行业',
  'community_property': '社区物业',
  'other': '其他行业',
  'fire_tech_service': '消防技术服务',
  'gov_regulator': '政府监管',
  'commercial_complex': '商业综合体',
  'manufacturing': '制造业',
  'emergency_mgmt': '应急管理',
  '工贸企业': '工贸企业',
  '教育行业': '教育行业',
  '社区物业': '社区物业',
  '消防技术服务': '消防技术服务',
  '商业综合体': '商业综合体',
  '政府监管': '政府监管',
})

// ===== 四方数据问答 Mock 数据 =====
// 告警/隐患/设备后端无数据表、工单 WorkOrder 表当前为空，Demo 阶段统一用 mock 数据驱动。
// 每条带 enterprise 字段，scope 过滤按用户关联企业名匹配（权限在服务层，LLM 不参与过滤）。

export interface AgentScope {
  systemRole: string | null   // platform-admin / platform-ops / 其他
  groups: string[]            // 用户关联企业 groups 的并集：regulator|unit|operator|service
  enterpriseNames: string[]   // 用户关联的企业名称
  enterpriseIds: number[]     // 用户关联的企业 ID（真实表过滤用）
  realName?: string           // 当前用户姓名（服务商工单按处理人过滤用）
}

const MOCK_ALARMS = [
  { id: 1, point: '1号消控室·烟感A-101', type: '火警', level: '紧急', status: '未处理', time: '08:32', enterprise: '港南二中' },
  { id: 2, point: '食堂后厨·电气B-03', type: '电气故障', level: '重要', status: '未处理', time: '09:15', enterprise: '港南二中' },
  { id: 3, point: '宿舍楼·烟感C-207', type: '烟感预警', level: '一般', status: '已处理', time: '07:48', enterprise: '港南二中' },
  { id: 4, point: '商业街1号铺·烟感', type: '火警', level: '紧急', status: '已处理', time: '08:05', enterprise: '商业街1' },
  { id: 5, point: '商铺1·电气', type: '电气故障', level: '重要', status: '未处理', time: '10:20', enterprise: '商铺1' },
  { id: 6, point: '韧性木业·车间烟感', type: '火警', level: '紧急', status: '未处理', time: '09:40', enterprise: '韧性木业' },
]

const MOCK_HAZARDS = [
  { id: 1, location: '教学楼1F 灭火器箱', category: '消防设施', level: '一般', status: '未整改', foundAt: '2026-08-12', enterprise: '港南二中' },
  { id: 2, location: '宿舍楼 消防通道', category: '消防通道', level: '重大', status: '未整改', foundAt: '2026-08-10', enterprise: '港南二中' },
  { id: 3, location: '商业街1号铺 燃气阀', category: '燃气安全', level: '重大', status: '整改中', foundAt: '2026-08-13', enterprise: '商业街1' },
  { id: 4, location: '韧性木业 车间电气箱', category: '电气安全', level: '重要', status: '未整改', foundAt: '2026-08-11', enterprise: '韧性木业' },
]

const MOCK_ORDERS = [
  { id: 1, orderNo: 'GD20260814001', title: '港南二中 烟感故障维修', type: '设备维修', status: 'active', priority: 'urgent', assignee: '郑晓峰', createdAt: '2026-08-14 08:30', enterprise: '港南二中' },
  { id: 2, orderNo: 'GD20260814002', title: '商业街 消防通道整改', type: '隐患整改', status: 'active', priority: 'high', assignee: '郑晓峰', createdAt: '2026-08-14 09:00', enterprise: '商业街1' },
  { id: 3, orderNo: 'GD20260813005', title: '商铺1 电气检测', type: '检测服务', status: 'closed', priority: 'normal', assignee: '郑晓峰', createdAt: '2026-08-13 14:00', enterprise: '商铺1' },
]

const MOCK_DEVICES = [
  { id: 1, name: '烟感探测器 A-101', type: '烟感', status: '在线', location: '1号消控室', enterprise: '港南二中' },
  { id: 2, name: '电气火灾监控 B-03', type: '电气', status: '在线', location: '食堂后厨', enterprise: '港南二中' },
  { id: 3, name: '烟感探测器 C-207', type: '烟感', status: '离线', location: '宿舍楼', enterprise: '港南二中' },
  { id: 4, name: '智能摄像头 01', type: '摄像头', status: '在线', location: '商业街1号铺', enterprise: '商业街1' },
  { id: 5, name: '燃气探测器 01', type: '燃气', status: '离线', location: '商铺1', enterprise: '商铺1' },
  { id: 6, name: '烟感探测器 车间-1', type: '烟感', status: '在线', location: '车间', enterprise: '韧性木业' },
]

/** 全量可见：仅系统角色（platform-admin / platform-ops）。regulator 走辖区关系树，见 visibleEnterpriseIds */
function canSeeAll(scope?: AgentScope): boolean {
  if (!scope) return true
  return scope.systemRole === 'platform-admin' || scope.systemRole === 'platform-ops'
}

/**
 * 可见企业 ID 集合（默认一阶；「全部下级」递归在后续场景扩展）：
 * - 系统角色 → null（全部）
 * - unit 管理方 → 本企业 + 下级（subordinate 我挂的下级 ∪ partner 声明我为 my_manager 的发起方）
 * - regulator → 本企业 + 辖区（subordinate 我挂的下级 ∪ partner 声明我为 my_supervisor 的发起方）
 * - 其余（商户/operator/service）→ 本企业（服务/运营授权在 S4/S5 扩展）
 */
async function visibleEnterpriseIds(scope?: AgentScope): Promise<number[] | null> {
  if (canSeeAll(scope)) return null
  const mine = scope?.enterpriseIds || []
  if (mine.length === 0) return []
  const groups = scope?.groups || []
  const roleKey = groups.includes('unit') ? 'my_manager' : groups.includes('regulator') ? 'my_supervisor' : null
  if (!roleKey) return mine
  const relations = await db.enterpriseRelation.findMany({
    where: {
      OR: [
        { enterpriseId: { in: mine }, type: 'subordinate' },      // 我主动挂的下级（上级→下级）
        { relatedId: { in: mine }, role: { contains: roleKey } }, // 对方声明我为管理方/监管方（partner 反向表达）
      ],
    },
  })
  const visible = new Set<number>(mine)
  for (const r of relations) visible.add(r.type === 'subordinate' ? r.relatedId : r.enterpriseId)
  return [...visible]
}

/** 关系树扩展时的范围自证文案（透明性规则：回答必须说明查询范围，默认一阶） */
function scopeNote(scope: AgentScope | undefined, entIds: number[] | null): string {
  if (entIds === null || !scope?.enterpriseIds?.length) return ''
  const mine = new Set(scope.enterpriseIds)
  const extra = entIds.filter(id => !mine.has(id)).length
  if (extra <= 0) return ''
  return `\n\n> 📌 数据范围：本企业及 ${extra} 家直接下级/辖区企业（未包含下级的下级；如需包含全部层级，请说「全部下级」）`
}

/** 按 scope 过滤带 enterprise 字段的 mock 数据（产物降级路径保留） */
function filterByScope<T extends { enterprise: string }>(items: T[], scope?: AgentScope): T[] {
  if (canSeeAll(scope)) return items
  const names = scope?.enterpriseNames || []
  if (names.length === 0) return items
  return items.filter(i => names.includes(i.enterprise))
}

/** 日期范围参数 → Prisma where 片段（本地时区解析；date 优先于 startDate/endDate） */
function buildDateRange(args: Record<string, any>): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {}
  const oneDay = 86400_000
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 「最近 N 天」：startDate 未显式给日期时，LLM 可能传相对天数（如 "最近3天" → startDate=2026-08-12）
  if (args.date) {
    const d = new Date(`${args.date}T00:00:00`)
    if (!isNaN(d.getTime())) {
      range.gte = d
      range.lte = new Date(d.getTime() + oneDay - 1)
    }
  } else {
    if (args.startDate) {
      const s = new Date(`${args.startDate}T00:00:00`)
      if (!isNaN(s.getTime())) range.gte = s
    }
    if (args.endDate) {
      const e = new Date(`${args.endDate}T00:00:00`)
      if (!isNaN(e.getTime())) range.lte = new Date(e.getTime() + oneDay - 1)
    }
    if (args.days) {
      const n = parseInt(args.days, 10)
      if (!isNaN(n) && n > 0) range.gte = new Date(new Date(`${todayStr}T00:00:00`).getTime() - (n - 1) * oneDay)
    }
  }
  return range
}

/** 工单过滤：服务商按处理人（我接的单），其余角色按企业归属 */
function filterOrders(scope?: AgentScope): typeof MOCK_ORDERS {
  if (canSeeAll(scope)) return MOCK_ORDERS
  if (scope?.groups.includes('service') && scope.realName) {
    return MOCK_ORDERS.filter(o => o.assignee === scope.realName)
  }
  const names = scope?.enterpriseNames || []
  if (names.length === 0) return MOCK_ORDERS
  return MOCK_ORDERS.filter(o => names.includes(o.enterprise))
}

/** 产物副标题里的数据范围文案（entIds 传入时标注关系树扩展） */
function scopeLabel(scope: AgentScope | undefined, entIds?: number[] | null): string {
  if (entIds === null) return '全部企业'
  const names = scope?.enterpriseNames || []
  if (names.length === 0) return '全部'
  if (entIds && scope?.enterpriseIds) {
    const mine = new Set(scope.enterpriseIds)
    const extra = entIds.filter(id => !mine.has(id)).length
    if (extra > 0) return `${names.join('、')} 及 ${extra} 家直接下级/辖区企业`
  }
  return names.join('、')
}

// ===== DeepSeek 客户端（懒加载，避免模块顶层初始化在没有 Key 时崩进程） =====
let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    if (!env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API Key 未配置，请在 server/.env 中设置 DEEPSEEK_API_KEY')
    }
    _client = new OpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: env.DEEPSEEK_BASE_URL,
    })
  }
  return _client
}

// 模型与默认请求参数集中管理（model 可在 .env 的 DEEPSEEK_MODEL 中覆盖）
const LLM_DEFAULTS = { model: env.DEEPSEEK_MODEL, temperature: 0.7, max_tokens: 1024 }

// ===== 类型 =====
export interface AgentMessage { role: 'user' | 'assistant'; content: string }
export interface AgentResponse { type: 'navigate' | 'chat'; pageKey?: string; route?: string; reply: string }

export interface StreamEvent { type: 'token'; content: string }
export interface StreamDoneEvent { type: 'done'; action?: { type: 'navigate'; route: string; pageKey: string } }

/** 调试日志事件：记录调用流程中每个节点的输入/输出 */
export interface StreamDebugEvent {
  type: 'debug'
  node: string       // 机器可读的节点名，如 'request'、'llm_call_1'
  label: string      // 人类可读标签
  io: 'input' | 'output' | 'info' | 'error'
  summary: string    // 单行摘要
  detail?: any       // 可展开的结构化详情
}

/** 产物类型（技能注册表键） */
export type ArtifactType = 'alarm-report' | 'hazard-list' | 'order-weekly'

/** 产物事件：一次对话产出的可交付物（HTML），右栏产物 Tab 预览 + 下载 */
export interface StreamArtifactEvent {
  type: 'artifact'
  artifact: {
    id: string
    type: ArtifactType
    title: string
    html: string
  }
}

/** 文件上下文（前端上传解析后传入） */
export interface FileContext {
  url: string
  fileName: string
  fileType: string
  fileSize: number
  parsedText: string
}

// ===== 执行工具调用 =====
async function executeTool(name: string, args: Record<string, any>, scope?: AgentScope): Promise<string> {
  switch (name) {
    case 'query_enterprise_list': {
      const { data, total } = await enterpriseService.getList({
        page: 1, size: 9999,
        dimB: args.dimB || undefined,
        keyword: args.keyword || undefined,
      })
      if (data.length === 0) return JSON.stringify({ text: '没有找到匹配的租户。' })
      const rows = data.map((item: any) => {
        const industry = DIM_B_LABELS[item.dimB] || item.dimB || '未分类'
        const region = item.region || '未填写'
        return `| ${item.name} | ${industry} | ${region} |`
      })
      const text = `**共 ${total} 个租户**\n\n| 名称 | 行业 | 地区 |\n|------|------|------|\n${rows.join('\n')}`
      return JSON.stringify({ text })
    }
    case 'query_enterprise_stats': {
      const { data, total } = await enterpriseService.getList({
        page: 1, size: 1000,
        dimB: args.dimB || undefined,
      })
      const byIndustry: Record<string, number> = {}
      for (const item of data) {
        const label = DIM_B_LABELS[item.dimB] || item.dimB || '未分类'
        byIndustry[label] = (byIndustry[label] || 0) + 1
      }
      const rows = Object.entries(byIndustry)
        .map(([k, v]) => `| ${k} | ${v} |`)
        .sort((a, b) => b.localeCompare(a))
      const text = `**共 ${total} 个租户**\n\n| 行业 | 数量 |\n|------|------|\n${rows.join('\n')}`
      return JSON.stringify({ text })
    }
    case 'query_user_stats': {
      // 传入 keyword：查询指定用户的关联岗位与企业信息
      if (args.keyword) {
        const { data } = await userService.getList({ page: 1, size: 100, keyword: args.keyword })
        if (data.length === 0) return JSON.stringify({ text: '没有找到匹配的用户。' })

        // 从数据库加载岗位 key → 名称 映射（含 platform:/ent: 前缀）
        const labelMap = await buildPositionLabelMap()
        const labelOf = (k: string) => labelMap[k] || k

        const blocks: string[] = []
        for (const u of data) {
          const enterprises = await userService.getUserEnterprises(u.id)
          const positions = new Set<string>()
          for (const e of enterprises) {
            for (const p of (e.positions || [])) positions.add(labelOf(p))
          }
          const entLines = enterprises.length
            ? enterprises
                .map(e => `- ${e.enterpriseName}（岗位：${(e.positions || []).map((p: string) => labelOf(p)).join('、') || '无'}）`)
                .join('\n')
            : '（无关联企业）'
          blocks.push(
            `**${u.realName || u.phone}**（${u.phone}）\n` +
            `- 关联企业数：${enterprises.length}\n` +
            `- 关联岗位：${[...positions].join('、') || '无'}\n` +
            `${entLines}`,
          )
        }
        const text = blocks.join('\n\n')
        return JSON.stringify({ text })
      }

      // 默认：平台用户统计
      const { total } = await userService.getList({ page: 1, size: 1 })
      return JSON.stringify({ total })
    }
    case 'query_position_list': {
      // 直接读企业端的岗位列表（简单的静态数据）
      const positions = [
        { key: 'safety-officer', label: '安全员' },
        { key: 'fire-officer', label: '消防专员' },
        { key: 'org-admin', label: '企业管理员' },
        { key: 'supervisor', label: '监管人员' },
        { key: 'inspector', label: '巡检员' },
      ]
      return JSON.stringify({ total: positions.length, list: positions })
    }
    case 'query_alarms': {
      const entIds = await visibleEnterpriseIds(scope)
      const where: any = {}
      if (entIds !== null) where.enterpriseId = { in: entIds }
      if (args.status) where.status = args.status
      if (args.level) where.level = args.level
      const dateRange = buildDateRange(args)
      if (dateRange.gte || dateRange.lte) where.occurredAt = dateRange
      const alarms = await db.alarm.findMany({
        where,
        include: { enterprise: { select: { name: true } } },
        orderBy: { occurredAt: 'desc' },
        take: 50,
      })
      if (alarms.length === 0) return JSON.stringify({ text: '没有找到匹配的告警记录。' })
      const fmtT = (t: Date) => t.toISOString().slice(0, 16).replace('T', ' ')
      const rows = alarms.map((a: any) => `| ${fmtT(a.occurredAt)} | ${a.point} | ${a.type} | ${a.level} | ${a.status} | ${a.enterprise.name} |`)
      const text = `**共 ${alarms.length} 条告警**\n\n| 时间 | 点位 | 类型 | 等级 | 状态 | 企业 |\n|------|------|------|------|------|------|\n${rows.join('\n')}${scopeNote(scope, entIds)}`
      return JSON.stringify({ text, total: alarms.length })
    }
    case 'query_hazards': {
      const entIds = await visibleEnterpriseIds(scope)
      const where: any = {}
      if (entIds !== null) where.enterpriseId = { in: entIds }
      if (args.status) where.status = args.status
      if (args.level) where.level = args.level
      const dateRange = buildDateRange(args)
      if (dateRange.gte || dateRange.lte) where.foundAt = dateRange
      const hazards = await db.hazard.findMany({
        where,
        include: { enterprise: { select: { name: true } } },
        orderBy: { foundAt: 'desc' },
        take: 50,
      })
      if (hazards.length === 0) return JSON.stringify({ text: '没有找到匹配的隐患记录。' })
      const fmtD = (t: Date) => t.toISOString().slice(0, 10)
      const rows = hazards.map((h: any) => `| ${h.location} | ${h.category} | ${h.level} | ${h.status} | ${fmtD(h.foundAt)} | ${h.enterprise.name} |`)
      const text = `**共 ${hazards.length} 条隐患**\n\n| 位置 | 类别 | 等级 | 状态 | 发现时间 | 企业 |\n|------|------|------|------|------|------|\n${rows.join('\n')}${scopeNote(scope, entIds)}`
      return JSON.stringify({ text, total: hazards.length })
    }
    case 'query_orders': {
      let items = filterOrders(scope)
      if (args.status) items = items.filter(o => o.status === args.status)
      if (items.length === 0) return JSON.stringify({ text: '没有找到匹配的工单。' })
      const statusLabel = (s: string) => s === 'active' ? '进行中' : s === 'closed' ? '已关闭' : s
      const priLabel = (p: string) => ({ urgent: '紧急', high: '高', normal: '普通', low: '低' } as Record<string, string>)[p] || p
      const rows = items.map(o => `| ${o.orderNo} | ${o.title} | ${o.type} | ${statusLabel(o.status)} | ${priLabel(o.priority)} | ${o.assignee} | ${o.createdAt} |`)
      const text = `**共 ${items.length} 条工单**\n\n| 工单号 | 标题 | 类型 | 状态 | 优先级 | 处理人 | 创建时间 |\n|------|------|------|------|------|------|------|\n${rows.join('\n')}`
      return JSON.stringify({ text, total: items.length })
    }
    case 'query_devices': {
      const entIds = await visibleEnterpriseIds(scope)
      const where: any = {}
      if (entIds !== null) where.enterpriseId = { in: entIds }
      if (args.status) where.status = args.status
      const devices = await db.device.findMany({
        where,
        include: { enterprise: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      if (devices.length === 0) return JSON.stringify({ text: '没有找到匹配的设备。' })
      const rows = devices.map((d: any) => `| ${d.name} | ${d.type} | ${d.status} | ${d.location} | ${d.enterprise.name} |`)
      const text = `**共 ${devices.length} 台设备**\n\n| 设备名称 | 类型 | 状态 | 位置 | 企业 |\n|------|------|------|------|------|\n${rows.join('\n')}${scopeNote(scope, entIds)}`
      return JSON.stringify({ text, total: devices.length })
    }
    default:
      return JSON.stringify({ error: `未知工具: ${name}` })
  }
}

// ===== 调试事件辅助 =====
const T0 = Symbol('t0')
function since(t0: number): string { return `${Date.now() - t0}ms` }

function debugEvent(node: string, label: string, io: StreamDebugEvent['io'], summary: string, detail?: any, t0?: number): StreamDebugEvent {
  const ts = Date.now()
  const prefix = t0 !== undefined ? `[+${since(t0)}] ` : ''
  return { type: 'debug', node, label, io, summary: prefix + summary, detail }
}

// ===== 产物生成（技能注册表 + HTML 模板） =====
// 技能注册表：触发词 + 标题 + 取数工具。HTML 骨架与图表规范另见 server/src/config/agent/skills/*.md（供 LLM 参考素材）。
// Demo 阶段产物用「内置技能模板 + 真实 mock 数据填充」生成 HTML，不依赖 LLM，无 Key 也能演示。

interface SkillDef {
  title: string
  patterns: RegExp[]
  tool: 'query_alarms' | 'query_hazards' | 'query_orders'
}

const SKILLS: Record<ArtifactType, SkillDef> = {
  'alarm-report': {
    title: '今日告警日报',
    patterns: [/告警.*日报/, /日报.*告警/, /今日告警/, /告警汇总/, /告警日报/, /告警.*报告/],
    tool: 'query_alarms',
  },
  'hazard-list': {
    title: '隐患清单',
    patterns: [/隐患清单/, /未整改隐患/, /隐患汇总/, /隐患台账/, /隐患.*清单/],
    tool: 'query_hazards',
  },
  'order-weekly': {
    title: '工单汇总',
    patterns: [/工单周报/, /工单汇总/, /工单总结/, /工单.*周报/, /工单.*汇总/],
    tool: 'query_orders',
  },
}

/** 从用户消息识别产物意图，未命中返回 null */
function detectArtifactIntent(message: string): ArtifactType | null {
  for (const [type, skill] of Object.entries(SKILLS) as [ArtifactType, SkillDef][]) {
    for (const p of skill.patterns) {
      if (p.test(message)) return type
    }
  }
  return null
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface ArtifactStat { label: string; value: string; tone?: 'red' | 'green' | 'amber' | 'blue' }

/** 生成自包含的浅色商务风 HTML 产物（统计卡 + 明细表），iframe 预览 / 下载发领导 */
function buildArtifactHtml(opts: {
  title: string
  subtitle: string
  stats: ArtifactStat[]
  columns: string[]
  rows: string[][]
}): string {
  const statCards = opts.stats.map(s => `
    <div class="stat${s.tone ? ' ' + s.tone : ''}">
      <div class="v">${escapeHtml(s.value)}</div>
      <div class="l">${escapeHtml(s.label)}</div>
    </div>`).join('')
  const headCells = opts.columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')
  const bodyRows = opts.rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(opts.title)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; background:#f5f7fb; color:#1f2937; padding:24px; }
  .wrap { max-width:880px; margin:0 auto; background:#fff; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,.06); overflow:hidden; }
  .head { background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; padding:24px 28px; }
  .head h1 { font-size:22px; font-weight:700; }
  .head p { font-size:13px; opacity:.85; margin-top:6px; }
  .stats { display:flex; gap:14px; padding:20px 28px 8px; }
  .stat { flex:1; background:#f8fafc; border-radius:10px; padding:16px 12px; text-align:center; }
  .stat .v { font-size:28px; font-weight:700; color:#1d4ed8; }
  .stat .l { font-size:12px; color:#64748b; margin-top:4px; }
  .stat.red .v { color:#b91c1c; } .stat.green .v { color:#1e7a45; } .stat.amber .v { color:#92400e; }
  table { width:100%; border-collapse:collapse; margin-top:12px; }
  th, td { padding:11px 16px; text-align:left; font-size:13px; border-bottom:1px solid #eef2f7; }
  th { background:#f8fafc; color:#475569; font-weight:600; }
  .foot { padding:16px 28px; font-size:12px; color:#94a3b8; border-top:1px solid #eef2f7; }
</style>
</head>
<body>
<div class="wrap">
  <div class="head"><h1>${escapeHtml(opts.title)}</h1><p>${escapeHtml(opts.subtitle)}</p></div>
  <div class="stats">${statCards}</div>
  <table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table>
  <div class="foot">商业街安全管理平台 · 由小安助手生成</div>
</div>
</body>
</html>`
}

/** 产物生成流程：识别意图 → 取数 → 模板生成 HTML → artifact 事件 → 确认文案 */
async function* generateArtifact(
  type: ArtifactType,
  message: string,
  scope: AgentScope | undefined,
  t0: number,
): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent | StreamArtifactEvent> {
  const skill = SKILLS[type]

  yield debugEvent('artifact_intent', '识别产物意图', 'info',
    `匹配技能「${skill.title}」`,
    { 技能: type, 触发消息: message }, t0)

  const tData = Date.now()
  yield debugEvent('artifact_data', '取数', 'output',
    `调用 ${skill.tool} 获取数据，耗时 ${Date.now() - tData}ms`,
    { 工具: skill.tool }, t0)

  // 按技能构造统计数据与明细（复用 mock 数据 + scope 过滤）
  let title = skill.title
  let subtitle = ''
  let stats: ArtifactStat[] = []
  let columns: string[] = []
  let rows: string[][] = []

  if (type === 'alarm-report') {
    const entIds = await visibleEnterpriseIds(scope)
    const now = new Date()
    const todayStart = new Date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T00:00:00`)
    const alarms = await db.alarm.findMany({
      where: {
        ...(entIds !== null ? { enterpriseId: { in: entIds } } : {}),
        occurredAt: { gte: todayStart }, // 日报 = 今日告警
      },
      include: { enterprise: { select: { name: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    })
    const unhandled = alarms.filter(a => a.status === '未处理')
    subtitle = `统计时间 ${new Date().toLocaleDateString('zh-CN')} · 覆盖 ${scopeLabel(scope, entIds)}`
    stats = [
      { label: '告警总数', value: String(alarms.length) },
      { label: '未处理', value: String(unhandled.length), tone: 'red' },
      { label: '已处置', value: String(alarms.length - unhandled.length), tone: 'green' },
    ]
    columns = ['时间', '点位', '类型', '等级', '状态', '企业']
    const fmtT = (t: Date) => t.toISOString().slice(0, 16).replace('T', ' ')
    rows = alarms.map((a: any) => [fmtT(a.occurredAt), a.point, a.type, a.level, a.status, a.enterprise.name])
  } else if (type === 'hazard-list') {
    const entIds = await visibleEnterpriseIds(scope)
    const hazards = await db.hazard.findMany({
      where: entIds !== null ? { enterpriseId: { in: entIds } } : {},
      include: { enterprise: { select: { name: true } } },
      orderBy: { foundAt: 'desc' },
      take: 100,
    })
    const major = hazards.filter(h => h.level === '重大').length
    subtitle = `截至 ${new Date().toLocaleDateString('zh-CN')} · 覆盖 ${scopeLabel(scope, entIds)}`
    stats = [
      { label: '隐患总数', value: String(hazards.length) },
      { label: '重大隐患', value: String(major), tone: 'red' },
      { label: '未整改', value: String(hazards.filter(h => h.status === '未整改').length), tone: 'amber' },
    ]
    columns = ['位置', '类别', '等级', '状态', '发现时间', '企业']
    const fmtD = (t: Date) => t.toISOString().slice(0, 10)
    rows = hazards.map((h: any) => [h.location, h.category, h.level, h.status, fmtD(h.foundAt), h.enterprise.name])
  } else if (type === 'order-weekly') {
    const items = filterOrders(scope)
    const active = items.filter(o => o.status === 'active').length
    subtitle = scope?.groups.includes('service') && scope.realName
      ? `截至 ${new Date().toLocaleDateString('zh-CN')} · 处理人 ${scope.realName}`
      : `截至 ${new Date().toLocaleDateString('zh-CN')} · 覆盖 ${scopeLabel(scope)}`
    stats = [
      { label: '工单总数', value: String(items.length) },
      { label: '进行中', value: String(active), tone: 'blue' },
      { label: '已关闭', value: String(items.length - active), tone: 'green' },
    ]
    columns = ['工单号', '标题', '类型', '状态', '优先级', '处理人', '创建时间']
    const statusLabel = (s: string) => s === 'active' ? '进行中' : s === 'closed' ? '已关闭' : s
    const priLabel = (p: string) => ({ urgent: '紧急', high: '高', normal: '普通', low: '低' } as Record<string, string>)[p] || p
    rows = items.map(o => [o.orderNo, o.title, o.type, statusLabel(o.status), priLabel(o.priority), o.assignee, o.createdAt])
  }

  const html = buildArtifactHtml({ title, subtitle, stats, columns, rows })

  yield debugEvent('artifact_generated', '产物生成', 'output',
    `已生成「${title}」HTML（${html.length} 字符）`,
    { 标题: title, HTML长度: html.length }, t0)

  yield { type: 'artifact', artifact: { id: `art-${Date.now()}-${type}`, type, title, html } }

  // 聊天窗口直接展示数据表格（产物作为附带下载）
  const headRow = '| ' + columns.join(' | ') + ' |'
  const sepRow = '|' + columns.map(() => '------|').join('')
  const bodyRows = rows.map(r => '| ' + r.join(' | ') + ' |')
  const tableText = rows.length
    ? `**共 ${rows.length} 条**\n\n${headRow}\n${sepRow}\n${bodyRows.join('\n')}`
    : '（范围内暂无数据）'
  const reply = `${tableText}\n\n已生成「${title}」，可在右侧「产物」栏预览和下载。`
  for (let i = 0; i < reply.length; i += 2) {
    yield { type: 'token', content: reply.slice(i, i + 2) }
    await sleep(12)
  }

  yield debugEvent('done', '完成', 'info', `总耗时 ${since(t0)}`, { 总耗时ms: Date.now() - t0 }, t0)
  yield { type: 'done' }
}

// ===== 核心：流式调用 LLM（支持 Function Calling + 文件上下文） =====
export async function* streamChat(
  message: string,
  history: AgentMessage[] = [],
  fileContext?: FileContext,
  scope?: AgentScope,
): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent | StreamArtifactEvent> {
  const t0 = Date.now()

  // ===== 节点 0：产物意图识别（先于 LLM，命中则走产物生成流程） =====
  const artifactIntent = detectArtifactIntent(message)
  if (artifactIntent) {
    yield* generateArtifact(artifactIntent, message, scope, t0)
    return
  }

  // ===== 节点 1：收到请求 =====
  yield debugEvent('request', '收到请求', 'info',
    `消息: "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`,
    {
      原始消息: message,
      历史消息数: history.length,
      包含文件: !!fileContext,
      文件信息: fileContext ? { 名称: fileContext.fileName, 类型: fileContext.fileType, 大小: fileContext.fileSize } : undefined,
    }, t0)

  // 本地降级
  if (!env.DEEPSEEK_API_KEY) {
    yield debugEvent('fallback_check', '降级模式', 'info',
      '未配置 DEEPSEEK_API_KEY，使用本地规则匹配', { 原因: 'no_api_key' }, t0)
    yield* localFallbackStream(message, t0)
    return
  }

  // 构造用户消息（有文件上下文时嵌入文件内容）
  const userContent = buildUserMessage(message, fileContext)
  const systemPrompt = getSystemPrompt()

  // ===== 节点 2：系统提示词 =====
  yield debugEvent('system_prompt', '系统提示词', 'info',
    `已加载（${systemPrompt.length} 字符，${TOOLS.length} 个工具定义）`,
    {
      提示词长度: systemPrompt.length,
      工具数量: TOOLS.length,
      工具列表: TOOLS.map(t => (t as any).function?.name).filter(Boolean),
    }, t0)

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userContent },
  ]

  // ===== 节点 3：LLM 调用 #1（带 tools） =====
  yield debugEvent('llm_call_1', 'LLM 调用 #1（工具决策）', 'input',
    `模型: ${LLM_DEFAULTS.model}，温度: ${LLM_DEFAULTS.temperature}，${messages.length} 条消息`,
    {
      参数: { model: LLM_DEFAULTS.model, temperature: LLM_DEFAULTS.temperature, max_tokens: LLM_DEFAULTS.max_tokens },
      消息数: messages.length,
      消息角色链: messages.map(m => m.role),
      工具数: TOOLS.length,
    }, t0)

  try {
    // 直接让 LLM 决定是否调用工具（tool_choice: 'auto'），不再用正则初筛
    {
      const t1 = Date.now()
      // 先尝试工具调用（数据查询）
      const resp1 = await getClient().chat.completions.create({
        ...LLM_DEFAULTS,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
      })

      // ===== 节点 4：LLM 响应 #1 =====
      const finishReason1 = resp1.choices[0]?.finish_reason
      const usage1 = (resp1 as any).usage
      const toolCalls = resp1.choices[0]?.message?.tool_calls

      yield debugEvent('llm_call_1_response', 'LLM 响应 #1', 'output',
        toolCalls?.length
          ? `finish_reason: ${finishReason1}，选中 ${toolCalls.length} 个工具调用，耗时 ${Date.now() - t1}ms`
          : `finish_reason: ${finishReason1}，直接文本回复（无工具调用），耗时 ${Date.now() - t1}ms`,
        {
          finish_reason: finishReason1,
          token用量: usage1 ? { prompt: usage1.prompt_tokens, completion: usage1.completion_tokens, total: usage1.total_tokens } : undefined,
          工具调用: toolCalls?.map((tc: any) => ({
            名称: tc.function?.name,
            参数: tc.function?.arguments ? JSON.parse(tc.function.arguments) : undefined,
            调用ID: tc.id,
          })),
          耗时ms: Date.now() - t1,
        }, t0)

      if (toolCalls && toolCalls.length > 0) {
        messages.push(resp1.choices[0].message)
        for (const tc of toolCalls) {
          const fn = (tc as any).function
          const fnName = fn?.name || ''
          const args = JSON.parse(fn?.arguments || '{}')

          // ===== 节点 5：工具执行 =====
          const tTool = Date.now()
          const result = await executeTool(fnName, args, scope)
          yield debugEvent('tool_exec', '工具调用', 'output',
            `${fnName}(${JSON.stringify(args)})，耗时 ${Date.now() - tTool}ms`,
            {
              工具名: fnName,
              参数: args,
              结果预览: result.slice(0, 500) + (result.length > 500 ? '…' : ''),
              结果长度: result.length,
              耗时ms: Date.now() - tTool,
            }, t0)

          messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
        }

        // ===== 节点 6：LLM 调用 #2（带工具结果，流式） =====
        yield debugEvent('llm_call_2', 'LLM 调用 #2（汇总回复）', 'input',
          `${messages.length} 条消息（含工具结果），流式输出`,
          {
            参数: { model: LLM_DEFAULTS.model, temperature: LLM_DEFAULTS.temperature, stream: true },
            消息数: messages.length,
            消息角色链: messages.map(m => m.role),
          }, t0)

        const t2 = Date.now()
        let fullText2 = ''
        const stream2 = await getClient().chat.completions.create({
          ...LLM_DEFAULTS, messages, stream: true,
        })
        for await (const chunk of stream2) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            fullText2 += delta
            yield { type: 'token', content: delta }
          }
        }

        // ===== 节点 7：LLM 响应 #2 完成 =====
        yield debugEvent('llm_call_2_response', 'LLM 响应 #2', 'output',
          `流式完成，共 ${fullText2.length} 字符，耗时 ${Date.now() - t2}ms`,
          {
            回复预览: fullText2.slice(0, 300) + (fullText2.length > 300 ? '…' : ''),
            回复长度: fullText2.length,
            耗时ms: Date.now() - t2,
          }, t0)

        yield debugEvent('done', '完成', 'info',
          `总耗时 ${since(t0)}`,
          { 总耗时ms: Date.now() - t0 }, t0)

        yield { type: 'done' }
        return
      }
    }

    // 导航和普通对话：流式调用（无 tools）
    // ===== 节点 8：LLM 直接流式调用 =====
    yield debugEvent('llm_direct', 'LLM 直接回复（无工具）', 'input',
      `${messages.length} 条消息，流式输出`,
      {
        参数: { model: LLM_DEFAULTS.model, temperature: LLM_DEFAULTS.temperature, stream: true },
        消息数: messages.length,
      }, t0)

    const tStream = Date.now()
    const stream1 = await getClient().chat.completions.create({
      ...LLM_DEFAULTS,
      messages,
      stream: true,
    })
    let fullText = ''
    for await (const chunk of stream1) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        fullText += delta
        yield { type: 'token', content: delta }
      }
    }

    // ===== 节点 9：流式完成 + 导航解析 =====
    const navAction = parseAction(fullText)
    yield debugEvent('llm_direct_response', '直接回复完成', 'output',
      navAction
        ? `流式完成（${fullText.length} 字符），识别到导航意图 → ${navAction.pageKey}，耗时 ${Date.now() - tStream}ms`
        : `流式完成（${fullText.length} 字符），无导航意图，耗时 ${Date.now() - tStream}ms`,
      {
        回复预览: fullText.slice(0, 300) + (fullText.length > 300 ? '…' : ''),
        回复长度: fullText.length,
        导航识别: navAction || null,
        耗时ms: Date.now() - tStream,
      }, t0)

    yield debugEvent('done', '完成', 'info',
      `总耗时 ${since(t0)}`,
      { 总耗时ms: Date.now() - t0 }, t0)

    yield { type: 'done', action: navAction }

  } catch (err: any) {
    // ===== 节点 E：LLM 异常降级 =====
    yield debugEvent('llm_error', 'LLM 调用失败', 'error',
      `错误: ${err.message}，降级到本地规则`,
      { 错误类型: err.name, 错误信息: err.message }, t0)

    console.error('[agent] DeepSeek 调用失败:', err.message)
    yield* localFallbackStream(message, t0)
  }
}

// ===== 本地规则降级流式版本 =====
async function* localFallbackStream(message: string, t0?: number): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent> {
  const text = message.toLowerCase()
  const start = t0 ?? Date.now()

  // 导航匹配
  for (const [pageKey, page] of Object.entries(PAGE_ALIASES)) {
    for (const alias of page.aliases) {
      if (text.includes(alias)) {
        yield debugEvent('fallback_nav', '本地匹配 → 导航', 'info',
          `匹配别名 "${alias}" → ${page.route}`,
          { 匹配关键词: alias, 目标路由: page.route, 页面Key: pageKey }, start)
        const reply = `好的，正在为你打开${alias}页面`
        for (let i = 0; i < reply.length; i += 2) {
          yield { type: 'token', content: reply.slice(i, i + 2) }
          await sleep(15)
        }
        yield debugEvent('done', '完成（本地降级）', 'info',
          `总耗时 ${since(start)}`,
          { 总耗时ms: Date.now() - start, 模式: 'local_fallback' }, start)
        yield { type: 'done', action: { type: 'navigate', route: page.route, pageKey } }
        return
      }
    }
  }

  // 数据查询：本地降级也能查
  if (text.includes('租户') || text.includes('企业') && (text.includes('多少') || text.includes('几个'))) {
    yield debugEvent('fallback_query', '本地匹配 → 数据查询', 'info',
      '关键词匹配"租户/企业"+"多少/几个"',
      { 匹配模式: 'enterprise_count' }, start)
    const { total } = await enterpriseService.getList({ page: 1, size: 1 })
    const reply = `目前平台共有 ${total} 个租户。`
    for (let i = 0; i < reply.length; i += 2) {
      yield { type: 'token', content: reply.slice(i, i + 2) }
      await sleep(15)
    }
    yield debugEvent('done', '完成（本地降级）', 'info',
      `总耗时 ${since(start)}`,
      { 总耗时ms: Date.now() - start, 模式: 'local_fallback' }, start)
    yield { type: 'done' }
    return
  }

  // 默认
  yield debugEvent('fallback_default', '本地匹配 → 默认回复', 'info',
    '未匹配任何规则，返回默认帮助文本', {}, start)
  const reply = '我是大屏AI助手，可以帮你：\n1. 查询数据（如"有多少个租户"）\n2. 导航页面（如"打开商业街专题"）\n3. 自由对话\n\n试试看吧！'
  for (let i = 0; i < reply.length; i += 2) {
    yield { type: 'token', content: reply.slice(i, i + 2) }
    await sleep(15)
  }
  yield debugEvent('done', '完成（本地降级）', 'info',
    `总耗时 ${since(start)}`,
    { 总耗时ms: Date.now() - start, 模式: 'local_fallback' }, start)
  yield { type: 'done' }
}

// ===== 工具函数 =====

/** 构造用户消息（有文件上下文时嵌入文件内容） */
function buildUserMessage(message: string, fileContext?: FileContext): string {
  if (!fileContext) return message

  const sizeText = fileContext.fileSize < 1024
    ? `${fileContext.fileSize} B`
    : fileContext.fileSize < 1024 * 1024
      ? `${(fileContext.fileSize / 1024).toFixed(1)} KB`
      : `${(fileContext.fileSize / (1024 * 1024)).toFixed(1)} MB`

  return [
    `用户上传了一个文件「${fileContext.fileName}」（${fileContext.fileType}，${sizeText}）`,
    ``,
    `文件内容：`,
    '```',
    fileContext.parsedText,
    '```',
    ``,
    message || '请分析这个文件的内容。',
  ].join('\n')
}

// 从数据库加载岗位 key → 名称 映射（岗位 key 含 platform:/ent: 前缀，与 UserEnterprise.positions 存储一致）
async function buildPositionLabelMap(): Promise<Record<string, string>> {
  const { data } = await positionService.getList({ page: 1, size: 9999 })
  const map: Record<string, string> = {}
  for (const p of data) map[p.key] = p.name
  return map
}
function buildPageListText(): string {
  return Object.entries(PAGE_ALIASES)
    .map(([key, p]) => `- **${key}**：${p.aliases.join('、')} → 路由 ${p.route}`)
    .join('\n')
}

function parseAction(raw: string): StreamDoneEvent['action'] {
  // 1. 先去掉 markdown 代码块包裹
  let jsonStr = raw
  const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (match) jsonStr = match[1].trim()

  // 2. 尝试直接解析
  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed.type === 'navigate' && parsed.pageKey) {
      const page = PAGE_ALIASES[parsed.pageKey]
      if (page) return { type: 'navigate', route: page.route, pageKey: parsed.pageKey }
    }
  } catch {}

  // 3. 降级：用正则从文本中提取 navigate JSON 对象
  const navMatch = raw.match(/\{[^}]*"type"\s*:\s*"navigate"[^}]*"pageKey"\s*:\s*"([^"]+)"[^}]*\}/)
  if (navMatch) {
    const pageKey = navMatch[1]
    const page = PAGE_ALIASES[pageKey]
    if (page) return { type: 'navigate', route: page.route, pageKey }
  }

  return undefined
}

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

// ===== 兼容旧代码 =====
export async function analyzeIntent(message: string, history: AgentMessage[] = []): Promise<AgentResponse> {
  if (!env.DEEPSEEK_API_KEY) return localFallbackSync(message)

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: getSystemPrompt() },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const completion = await getClient().chat.completions.create({
      ...LLM_DEFAULTS, messages,
    })
    const raw = completion.choices[0]?.message?.content?.trim() || ''
    return parseResponse(raw)
  } catch (err: any) {
    console.error('[agent] DeepSeek 调用失败:', err.message)
    return localFallbackSync(message)
  }
}

function parseResponse(raw: string): AgentResponse {
  let jsonStr = raw
  const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (match) jsonStr = match[1].trim()
  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed.type === 'navigate' && parsed.pageKey) {
      const page = PAGE_ALIASES[parsed.pageKey]
      if (page) return { type: 'navigate', pageKey: parsed.pageKey, route: page.route, reply: parsed.reply || '' }
    }
    if (parsed.reply) return { type: 'chat', reply: parsed.reply }
  } catch {}
  const cleanText = raw.replace(/```[\s\S]*?```/g, '').trim()
  return { type: 'chat', reply: cleanText || raw.slice(0, 500) }
}

function localFallbackSync(message: string): AgentResponse {
  const text = message.toLowerCase()
  for (const [pageKey, page] of Object.entries(PAGE_ALIASES)) {
    for (const alias of page.aliases) {
      if (text.includes(alias)) return { type: 'navigate', pageKey, route: page.route, reply: `好的，正在为你打开${alias}页面` }
    }
  }
  return { type: 'chat', reply: '我是大屏AI助手。当前为本地模式（未配置LLM），仅支持导航。' }
}
