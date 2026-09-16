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

export interface AgentScope {
  systemRole: string | null   // platform-admin / platform-ops / 其他
  groups: string[]            // 用户关联企业 groups 的并集：regulator|unit|operator|service
  enterpriseNames: string[]   // 用户关联的企业名称
  enterpriseIds: number[]     // 用户关联的企业 ID（真实表过滤用）
  realName?: string           // 当前用户姓名（服务商工单按处理人过滤用）
}

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

/**
 * 工具返回文案末尾的「数据范围」脚注（透明性规则）
 *
 * 输出 HTML 块（class="scope-note"），前端用 v-html 渲染，配套样式见 src/style.css。
 * 抽出来后所有工具统一调用——避免每个 case 自行拼写导致格式漂移。
 * 入参：
 *   - scope：当前用户的 scope（agent.controller.ts:resolveScope 构造）
 *   - entIds：工具实际查询时使用的企业 ID 集合（来自 visibleEnterpriseIds(scope)）
 *   - options.totalCount：返回的总条数（用于「共 N 条 + 数据范围」复合文案）
 * 返回：HTML 字符串（带前后换行），空场景返回 ''
 */
// 内联说明图标（与 public/icons/列表/类型=说明.svg 一致），用 currentColor 跟随父元素色
const SCOPE_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 3C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>'

export function buildScopeText(
  scope: AgentScope | undefined,
  entIds: number[] | null,
  options?: { totalCount?: number },
): string {
  if (entIds === null || !scope?.enterpriseIds?.length) return ''
  const mine = new Set(scope.enterpriseIds)
  const extra = entIds.filter(id => !mine.has(id)).length
  if (extra <= 0) return ''
  return `\n\n<div class="scope-note">${SCOPE_ICON_SVG}<span>数据范围：本企业及 ${extra} 家直接下级/辖区企业（未包含下级的下级；如需包含全部层级，请说「全部下级」）</span></div>`
}

/** 别名（内部 query_* 工具复用） */
export const scopeNote = buildScopeText

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

/** 后续快捷提问事件：基于当前问答上下文，推荐用户下一步可问的 2-4 个问题 */
export interface StreamFollowupEvent {
  type: 'followup'
  followups: string[]
}

/**
 * 思考过程事件：DeepSeek 等模型在「思考模式」下会把内部推理放在 content 字段里
 * （包括 DSML 工具调用声明 + 中文叙述）。我们在流式消费时切分出来，去掉非汉字字符
 * 后推送给前端，作为气泡下方的可折叠「思考过程」区。
 */
export interface StreamThinkingEvent {
  type: 'thinking'
  text: string
}

/**
 * 后处理事件：LLM #2 流式消费完成后，后端对 fullText 做一次"scope-note div 后置"
 * 重排（把数据范围脚注从中间位置挪到全文末尾），通过此事件下发重组后的完整文本，
 * 前端 store 用它覆盖 rawText，让气泡显示的就是最终正确顺序。
 *
 * 流过程中 token 仍按 LLM 原序推送（用户看到中间过程的"脚注夹中间"状态），流结束后
 * 被此事件覆盖。LLM #2 流速通常 2-5 秒，闪烁感知不强；好处是 100% 不依赖 LLM 配合。
 */
export interface StreamRearrangedEvent {
  type: 'rearranged'
  text: string
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
      const entIds = await visibleEnterpriseIds(scope)
      const { data, total } = await enterpriseService.getListByIds({
        page: 1, size: 9999,
        entIds,
        dimB: args.dimB || undefined,
        keyword: args.keyword || undefined,
      })
      if (data.length === 0) return JSON.stringify({ text: '没有找到匹配的租户。' })
      const rows = data.map((item: any) => {
        const industry = DIM_B_LABELS[item.dimB] || item.dimB || '未分类'
        const region = item.region || '未填写'
        return `| ${item.name} | ${industry} | ${region} |`
      })
      const text = `**共 ${total} 个租户**\n\n| 名称 | 行业 | 地区 |\n|------|------|------|\n${rows.join('\n')}${buildScopeText(scope, entIds)}`
      return JSON.stringify({ text, total })
    }
    case 'query_enterprise_stats': {
      const entIds = await visibleEnterpriseIds(scope)
      const { data, total } = await enterpriseService.getListByIds({
        page: 1, size: 1000,
        entIds,
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
      const text = `**共 ${total} 个租户**\n\n| 行业 | 数量 |\n|------|------|\n${rows.join('\n')}${buildScopeText(scope, entIds)}`
      return JSON.stringify({ text, total })
    }
    case 'query_user_stats': {
      const entIds = await visibleEnterpriseIds(scope)
      // 传入 keyword：查询指定用户的关联岗位与企业信息（按 entIds 过滤）
      if (args.keyword) {
        const { data } = await userService.getListByIdsAndKeyword({
          page: 1, size: 100, entIds, keyword: args.keyword,
        })
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
        const text = blocks.join('\n\n') + buildScopeText(scope, entIds)
        return JSON.stringify({ text })
      }

      // 默认：按 entIds 统计用户数
      const total = await userService.getCountByEnterprises(entIds)
      return JSON.stringify({ total })
    }
    case 'query_position_list': {
      // 直接读企业端的岗位列表（动态 DB，岗位是全员一致的元数据，无需 scope 过滤）
      const { data } = await positionService.getList({ page: 1, size: 9999 })
      const list = data.map(p => ({ key: p.key, label: p.name }))
      return JSON.stringify({ total: list.length, list })
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
      const entIds = await visibleEnterpriseIds(scope)
      const where: any = {}
      // scope 过滤：creatorOrgId ∈ entIds；service 角色按处理人姓名
      if (scope?.groups.includes('service') && scope.realName) {
        where.currentAssigneeName = scope.realName
      } else if (entIds !== null) {
        where.creatorOrgId = { in: entIds }
      }
      if (args.status) where.status = args.status

      const orders = await db.workOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      if (orders.length === 0) return JSON.stringify({ text: '没有找到匹配的工单。' })
      const statusLabel = (s: string) => s === 'active' ? '进行中' : s === 'closed' ? '已关闭' : s
      const priLabel = (p: string) => ({ urgent: '紧急', high: '高', normal: '普通', low: '低' } as Record<string, string>)[p] || p
      const fmtT = (t: Date) => t.toISOString().slice(0, 16).replace('T', ' ')
      const rows = orders.map((o: any) => `| ${o.orderNo} | ${o.title} | ${o.templateName} | ${statusLabel(o.status)} | ${priLabel(o.priority)} | ${o.currentAssigneeName || '未分配'} | ${fmtT(o.createdAt)} | ${o.creatorOrgName} |`)
      const text = `**共 ${orders.length} 条工单**\n\n| 工单号 | 标题 | 类型 | 状态 | 优先级 | 处理人 | 创建时间 | 所属企业 |\n|------|------|------|------|------|------|------|------|\n${rows.join('\n')}${buildScopeText(scope, entIds)}`
      return JSON.stringify({ text, total: orders.length })
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

// ===== 后续快捷提问生成 =====
// 基于当前问答上下文（用户原问题 + 调用的工具 + 最终回答）让 LLM 生成 0-3 个追问。
// 仅在调过工具时生成（导航/纯聊天不生成），失败/超时静默不返回（不阻断主流程）。
// 后过滤：数据为空 / 回复过短等"无追问价值"场景直接返回 []，不调 LLM。
async function generateFollowups(
  message: string,
  toolResults: Array<{ toolName: string; resultText: string }>,
  finalReply: string,
): Promise<string[]> {
  if (toolResults.length === 0) return []

  // ===== 后过滤：以下场景直接判定"无追问价值"，不调 LLM =====
  const EMPTY_SIGNALS = ['没有找到', '暂无', '没有匹配', '为空', '**共 0 ', '共 0 条']
  const allResultsEmpty = toolResults.every(r => EMPTY_SIGNALS.some(sig => r.resultText.includes(sig)))
  const replyMentionsEmpty = EMPTY_SIGNALS.some(sig => finalReply.includes(sig))
  if (allResultsEmpty || replyMentionsEmpty) return []
  // 回复极短（< 30 字符，典型"没有找到"或纯一句话），追问无价值
  if (finalReply.trim().length < 30) return []

  const toolsList = toolResults.map(t => t.toolName).join(', ')
  const resultSnippet = toolResults
    .map(t => t.resultText.slice(0, 300))
    .join('\n---\n')

  const prompt = `你是「追问建议生成器」。基于以下对话上下文，**判断是否值得生成追问**，0-3 个。

## 用户原问题
${message}

## 调用的工具
${toolsList}

## 工具返回摘要
${resultSnippet}

## AI 回答摘要
${finalReply.slice(0, 300)}

## 输出要求（务必遵守）
- **默认返回空数组 []** ——宁缺毋滥。追问是引导，不是义务
- **必须**返回追问的典型条件（同时满足才有价值）：
  - 工具返回了多条数据（>1 条），且能从多个维度切片（按等级/时间/状态/类型/企业等）
  - 用户问题主题本身就是数据查询（"X 的告警"、"X 的隐患"、"工单情况"）
- **应该**返回 [] 的典型条件（任一命中即可）：
  - 工具返回 0 条数据（"没有找到…"）
  - 工具返回 1 条数据，无法深挖
  - 用户问题是简单计数（"有几个…"、"多少…"）→ 已得到答案
  - 用户问题主题是导航/确认/动作（"打开X"、"好的"、"谢谢"）
  - AI 回答已超过 200 字，结论明确
- 每个追问不超过 15 字（**严格控制，越短越好**）
- 与原问题**不同维度**（深入 / 换个角度 / 关联分析）
- 必须能用上述工具回答，不要编造工具
- 贴近用户原问题语言风格
- 只输出 JSON 数组，**不要任何解释、前缀、Markdown 代码块**

## 示例输出
值得追问：["按等级统计", "最近7天趋势", "未处理的有哪些"]
不值得追问：[]`

  try {
    const resp = await getClient().chat.completions.create({
      ...LLM_DEFAULTS,
      messages: [
        { role: 'system', content: '严格只输出 JSON 数组，禁止任何其他内容。' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.5,
    })

    const raw = resp.choices[0]?.message?.content?.trim() || ''
    console.log('[agent][followup] LLM 原始返回:', raw)

    // 第一道：尝试完整 JSON 解析
    try {
      const parsed = JSON.parse(raw)
      const arr = Array.isArray(parsed) ? parsed : parsed.followups
      if (Array.isArray(arr)) {
        return arr.filter((s: any) => typeof s === 'string' && s.trim()).slice(0, 3)
      }
      console.warn('[agent][followup] 解析结果无 followups 数组:', parsed)
      return []
    } catch (parseErr: any) {
      // 第二道：JSON 被截断时，从字符串里尽量提取已生成的问题
      console.warn('[agent][followup] JSON.parse 失败，尝试正则兜底:', parseErr?.message, '原始:', raw)
      const matches = raw.match(/"([^"]+?)"/g)
      if (matches && matches.length > 0) {
        const recovered = matches.map(m => m.slice(1, -1).trim()).filter(Boolean).slice(0, 3)
        console.log('[agent][followup] 正则兜底提取到:', recovered)
        return recovered
      }
      return []
    }
  } catch (err: any) {
    console.warn('[agent] 生成追问失败:', err?.message)
    return []
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
): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent | StreamArtifactEvent | StreamFollowupEvent> {
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
    const entIds = await visibleEnterpriseIds(scope)
    const where: any = {}
    if (scope?.groups.includes('service') && scope.realName) {
      where.currentAssigneeName = scope.realName
    } else if (entIds !== null) {
      where.creatorOrgId = { in: entIds }
    }
    const items = await db.workOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const active = items.filter(o => o.status === 'active').length
    subtitle = scope?.groups.includes('service') && scope.realName
      ? `截至 ${new Date().toLocaleDateString('zh-CN')} · 处理人 ${scope.realName}`
      : `截至 ${new Date().toLocaleDateString('zh-CN')} · 覆盖 ${scopeLabel(scope, entIds)}`
    stats = [
      { label: '工单总数', value: String(items.length) },
      { label: '进行中', value: String(active), tone: 'blue' },
      { label: '已关闭', value: String(items.length - active), tone: 'green' },
    ]
    columns = ['工单号', '标题', '类型', '状态', '优先级', '处理人', '创建时间']
    const statusLabel = (s: string) => s === 'active' ? '进行中' : s === 'closed' ? '已关闭' : s
    const priLabel = (p: string) => ({ urgent: '紧急', high: '高', normal: '普通', low: '低' } as Record<string, string>)[p] || p
    const fmtT = (t: Date) => t.toISOString().slice(0, 16).replace('T', ' ')
    rows = items.map(o => [o.orderNo, o.title, o.templateName, statusLabel(o.status), priLabel(o.priority), o.currentAssigneeName || '未分配', fmtT(o.createdAt)])
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
  contextHint?: string,   // 追问时前端注入的上下文延续提示（文本兜底，如"继续在【辖区】范围"）
  scopeParams?: { enterpriseIds?: number[] },  // 追问时前端传入的结构化 scope（主路径）
): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent | StreamArtifactEvent | StreamFollowupEvent | StreamThinkingEvent | StreamRearrangedEvent> {
  const t0 = Date.now()

  // scopeParams.enterpriseIds 覆盖 scope.enterpriseIds：
  // - 数字数组 → 追问时前端从上一轮 tool_exec 的「实际企业 ID」传回，比 resolveScope
  //   构造的初始 scope 更精确（处理"按辖区追问后又缩到具体 N 家"这类场景）
  // - undefined（前端显式传 undefined 或根本没传 scopeParams） → 沿用原 scope
  const effectiveScope: AgentScope | undefined =
    scopeParams?.enterpriseIds !== undefined
      ? { ...(scope as AgentScope), enterpriseIds: scopeParams.enterpriseIds }
      : scope

  // ===== 节点 0：产物意图识别（先于 LLM，命中则走产物生成流程） =====
  const artifactIntent = detectArtifactIntent(message)
  if (artifactIntent) {
    yield* generateArtifact(artifactIntent, message, effectiveScope, t0)
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
    // 上下文延续提示：追问时由前端从上一轮"📌 数据范围"脚注里抽取并传入，
    // 让 LLM 知道"上一轮的查询范围（如辖区）需要延续"
    ...(contextHint ? [{ role: 'system' as const, content: `[上下文延续] ${contextHint}` }] : []),
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
      let toolCalls = resp1.choices[0]?.message?.tool_calls

      // 兜底：DeepSeek 等模型可能不返回结构化 tool_calls，而是把工具调用用 DSML 文本
      // 塞进 content（用户看到的"乱码"就是这个 DSML 原文）。这里把 DSML 解析成伪 tool_calls，
      // 后面走正常的「执行工具 → LLM #2 汇总」流程，用户能看到真实数据而不是降级回复。
      if (!toolCalls || toolCalls.length === 0) {
        const content1 = resp1.choices[0]?.message?.content || ''
        const dsmlCalls = parseDSMLToolCalls(content1)
        if (dsmlCalls.length > 0) {
          toolCalls = dsmlCalls.map((tc, i) => ({
            id: `dsml-${Date.now()}-${i}`,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.args) },
          }))
          yield debugEvent('dsml_fallback', 'DSML 工具调用兜底解析', 'info',
            `从 content 解析出 ${dsmlCalls.length} 个工具调用（模型未返回标准 tool_calls）`,
            { 解析结果: dsmlCalls, 原始content长度: content1.length }, t0)
        }
      }

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
        // 收集工具执行结果，用于后续追问生成的上下文
        const toolResults: Array<{ toolName: string; resultText: string }> = []
        for (const tc of toolCalls) {
          const fn = (tc as any).function
          const fnName = fn?.name || ''
          const rawArgs = JSON.parse(fn?.arguments || '{}')
          // 参数白名单：丢弃 LLM 自由发挥的字段，只保留工具 schema 声明的参数
          const args = toolArgsWhitelist(fnName, rawArgs)

          // ===== 节点 5：工具执行 =====
          const tTool = Date.now()
          const result = await executeTool(fnName, args, effectiveScope)
          // 计算实际使用的 entIds，注入到 tool_exec 详情里供前端提取
          const toolEntIds = await visibleEnterpriseIds(effectiveScope)
          yield debugEvent('tool_exec', '工具调用', 'output',
            `${fnName}(${JSON.stringify(args)})${args.__dropped?.length ? ` ⚠️丢弃非声明参数：${args.__dropped.join(',')}` : ''}，耗时 ${Date.now() - tTool}ms`,
            {
              工具名: fnName,
              参数: args,
              丢弃参数: args.__dropped || [],
              结果预览: result.slice(0, 500) + (result.length > 500 ? '…' : ''),
              结果长度: result.length,
              耗时ms: Date.now() - tTool,
              实际企业ID: toolEntIds,
            }, t0)

          toolResults.push({ toolName: fnName, resultText: result })
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
        let fullThinking2 = ''
        const stream2 = await getClient().chat.completions.create({
          ...LLM_DEFAULTS, messages, stream: true,
        })
        for await (const ev of streamWithDSMLFilter(stream2)) {
          if (ev.type === 'token') {
            fullText2 += ev.text
            yield { type: 'token', content: ev.text }
          } else {
            fullThinking2 += ev.text + '\n'
            yield { type: 'thinking', text: ev.text }
          }
        }

        // ===== scope-note 后置：把脚注 div 从数据表和「建议」之间挪到全文末尾 =====
        // LLM #2 会原样 echo 工具返回里的脚注 div（在数据表之后），它自由发挥的
        // 「建议」自然落在脚注后面，读起来被切到注释区。我们把 div 整体后置，
        // 让顺序变成「数据表 → 建议 → 脚注」，符合"结论在前、说明在后"的阅读节奏。
        const SCOPE_NOTE_RE = /<div class="scope-note">[\s\S]*?<\/div>/
        const noteMatch = fullText2.match(SCOPE_NOTE_RE)
        if (noteMatch) {
          const noteBlock = noteMatch[0]
          const withoutNote = fullText2
            .replace(/[\s\n]*<div class="scope-note">[\s\S]*?<\/div>[\s\n]*/, '\n\n')
            .trimEnd()
          const rearranged = withoutNote + '\n\n' + noteBlock
          yield debugEvent('scope_note_rearrange', 'scope-note 后置', 'info',
            `脚注 div 移到回复末尾（${fullText2.length} → ${rearranged.length} 字符）`,
            { 原文本: fullText2, 重组后: rearranged }, t0)
          fullText2 = rearranged
          yield { type: 'rearranged', text: rearranged }
        }

        // ===== 节点 7：LLM 响应 #2 完成 =====
        yield debugEvent('llm_call_2_response', 'LLM 响应 #2', 'output',
          `流式完成，共 ${fullText2.length} 字符，耗时 ${Date.now() - t2}ms`,
          {
            回复预览: fullText2.slice(0, 300) + (fullText2.length > 300 ? '…' : ''),
            回复长度: fullText2.length,
            耗时ms: Date.now() - t2,
          }, t0)

        // ===== 节点 7.1：兜底 — 汇总阶段如果模型只吐 DSML（被剥离后）而没有可见中文 =====
        // 极端情况下 deepseek 在汇总阶段会重新发起 DSML 工具调用（说明它没把工具结果读懂），
        // DSML 被干净剥离后用户会看到空气泡。这里兜底：如果有工具结果，直接把第一条的 text 推给用户。
        if (fullText2.length === 0 && toolResults.length > 0) {
          try {
            const firstParsed = JSON.parse(toolResults[0].resultText)
            if (typeof firstParsed?.text === 'string' && firstParsed.text.trim()) {
              const fallback = firstParsed.text
              yield debugEvent('empty_reply_fallback', '汇总阶段空回复兜底', 'info',
                `LLM #2 产出空文本，沿用工具直接返回的 text（${fallback.length} 字符）`,
                { 工具名: toolResults[0].toolName }, t0)
              for (let i = 0; i < fallback.length; i += 2) {
                const piece = fallback.slice(i, i + 2)
                fullText2 += piece
                yield { type: 'token', content: piece }
              }
            }
          } catch { /* 工具结果不是 JSON，正常情况不会有 */ }
        }

        // ===== 节点 7.5：生成后续快捷提问 =====
        const tFollow = Date.now()
        const followups = await generateFollowups(message, toolResults, fullText2)
        yield debugEvent('followup_suggest', '生成后续提问', 'output',
          followups.length
            ? `生成 ${followups.length} 个追问，耗时 ${Date.now() - tFollow}ms`
            : '未生成追问（无工具调用或生成失败）',
          { 追问: followups, 耗时ms: Date.now() - tFollow }, t0)

        if (followups.length > 0) {
          yield { type: 'followup', followups }
        }

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
    // 同样走 DSML 过滤：DeepSeek 在「思考模式」下可能直接吐 DSML 标签，
    // 必须剥离，否则原始 <｜｜DSML｜｜ calls> 会当 token 推到前端（用户看到"乱码"）
    for await (const ev of streamWithDSMLFilter(stream1)) {
      if (ev.type === 'token') {
        fullText += ev.text
        yield { type: 'token', content: ev.text }
      } else {
        yield { type: 'thinking', text: ev.text }
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
async function* localFallbackStream(message: string, t0?: number): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent | StreamFollowupEvent> {
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

// ===== 思考过程解析 =====

/** 保留汉字 + 中文/全角标点 + 空白，其他字符全 strip（多个空白压成一个） */
function stripNonChinese(s: string): string {
  return s
    .replace(/[^一-鿿㐀-䶿　-〿＀-￯\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 把流式 chunk 喂进来，吐出去 token / thinking 事件。
 * - DSML 标签外的内容 → token（推给前端作为气泡正文）
 * - DSML 标签内的内容 → thinking（去非汉字后推给前端作为「思考过程」可折叠区）
 * - 流结束时若还停在思考段 → 兜底 flush
 *
 * 这是 LLM #2（汇总回复）和 llm_direct（无工具调用）**共用**的过滤器，
 * 保证任何路径都不会把 `<｜｜DSML｜｜ ... <｜｜DSML｜｜` 原始标签泄漏给用户。
 *
 * 关键：跨 chunk 缓冲 pending 字符串，**只处理完整 TAG**。OpenAI 流式 chunk 可能
 * 把标签字符拆得很碎（实测每个 token 是单字符或两字符），老版不做缓冲时单 chunk
 * 找不到完整 TAG，把 `<` 当 normal 文本吐出去 → 用户看到乱码。
 */
type FilteredChunk = { type: 'token' | 'thinking'; text: string }
async function* streamWithDSMLFilter(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
): AsyncGenerator<FilteredChunk> {
  const TAG = '<｜｜DSML｜｜'
  let pending = ''      // 跨 chunk 累积的待切分文本
  let inThink = false   // 当前是否在 DSML 标签内
  let thinkBuf = ''     // think 段累积的原文

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (!delta) continue
    pending += delta

    // 把 pending 里所有完整 TAG 都切掉
    while (true) {
      const idx = pending.indexOf(TAG)
      if (idx === -1) break

      // TAG 之前的内容
      const prefix = pending.slice(0, idx)
      if (prefix) {
        if (inThink) thinkBuf += prefix
        else yield { type: 'token', text: prefix }
      }

      // 跳过 TAG、切换模式
      pending = pending.slice(idx + TAG.length)
      inThink = !inThink
      if (!inThink) {
        // 退出 think：flush
        const cleaned = stripNonChinese(thinkBuf)
        if (cleaned) yield { type: 'thinking', text: cleaned }
        thinkBuf = ''
      }
    }

    // 剩余的 pending：
    // - inThink 段：可以放心加到 thinkBuf（不会有 TAG 跨段）
    // - normal 段：可能是半个 TAG 前缀，保留最后 TAG.length-1 字符等待下一 chunk
    if (pending.length > 0) {
      if (inThink) {
        thinkBuf += pending
        pending = ''
      } else {
        const keepLen = TAG.length - 1
        if (pending.length > keepLen) {
          const out = pending.slice(0, pending.length - keepLen)
          yield { type: 'token', text: out }
          pending = pending.slice(-keepLen)
        }
      }
    }
  }

  // 流结束：把剩余 pending 处理掉
  if (pending.length > 0) {
    if (inThink) {
      thinkBuf += pending
      const cleaned = stripNonChinese(thinkBuf)
      if (cleaned) yield { type: 'thinking', text: cleaned }
    } else {
      // normal 段残留：直接当 token 推（不可能含半个 TAG，TAG 已被切走）
      yield { type: 'token', text: pending }
    }
  }
}

/**
 * 从文本里提取 DSML 工具调用。
 * DeepSeek 等模型在「思考模式」下，有时不返回结构化 tool_calls，而是把工具调用
 * 用 DSML 文本塞进 content。本函数把这种文本解析成 `[{name, args}]`，
 * 让上层能构造伪 tool_calls 走正常的「执行 → 汇总」流程。
 *
 * 期望格式（不严格，容忍换行/空格）：
 *   <｜｜DSML｜｜ invoke name="query_alarms">
 *     <｜｜DSML｜｜ parameter name="status" string="true">未处理</｜｜DSML｜｜ parameter>
 *   </｜｜DSML｜｜ invoke>
 *   ...
 *   <｜｜DSML｜｜ /calls>
 *
 * 返回 [] 表示没匹配到（调用方应当 fall through 到 llm_direct 路径）。
 */
function parseDSMLToolCalls(content: string): Array<{ name: string; args: Record<string, any> }> {
  const results: Array<{ name: string; args: Record<string, any> }> = []
  if (!content || !content.includes('<｜｜DSML｜｜')) return results

  const invokeRe = /<｜｜DSML｜｜\s*invoke\s+name="([^"]+)"\s*>([\s\S]*?)<｜｜DSML｜｜\s*\/invoke\s*>/g
  const paramRe = /<｜｜DSML｜｜\s*parameter\s+name="([^"]+)"(?:\s+string="(true|false)")?\s*>([\s\S]*?)<｜｜DSML｜｜\s*\/parameter\s*>/g

  let m: RegExpExecArray | null
  while ((m = invokeRe.exec(content)) !== null) {
    const name = m[1]
    const inner = m[2]
    const args: Record<string, any> = {}
    let pm: RegExpExecArray | null
    // 必须在每次 invoke 匹配后重置 lastIndex（paramRe 是全局正则）
    paramRe.lastIndex = 0
    while ((pm = paramRe.exec(inner)) !== null) {
      const key = pm[1]
      const isString = pm[2] !== 'false'
      const v = pm[3].trim()
      if (isString) {
        args[key] = v
      } else {
        // 非 string：尝试 boolean/number
        if (v === 'true') args[key] = true
        else if (v === 'false') args[key] = false
        else if (v !== '' && !isNaN(Number(v))) args[key] = Number(v)
        else args[key] = v
      }
    }
    results.push({ name, args })
  }
  return results
}

/**
 * Schema 参数白名单：只保留工具 OpenAI 定义里声明的字段
 * - LLM 自由发挥的参数（如 query_hazards 收到 companyName）会被丢弃
 * - 丢弃的字段记入 __dropped，便于调试面板对照
 */
function toolArgsWhitelist(toolName: string, rawArgs: any): any {
  const toolDef = TOOLS.find(t => (t as any).function?.name === toolName) as any
  if (!toolDef || !rawArgs || typeof rawArgs !== 'object') return rawArgs || {}
  const props = (toolDef.function?.parameters?.properties || {}) as Record<string, any>
  const allowed = Object.keys(props)
  const filtered: any = {}
  for (const k of allowed) {
    if (rawArgs[k] !== undefined) filtered[k] = rawArgs[k]
  }
  filtered.__dropped = Object.keys(rawArgs).filter(k => !allowed.includes(k))
  return filtered
}
