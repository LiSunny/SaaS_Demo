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
import * as enterpriseService from './enterprise.service.js'
import * as userService from './user.service.js'

// ===== 页面别名映射 =====
const PAGE_ALIASES: Record<string, { route: string; aliases: string[] }> = {
  'landing':        { route: '/landing',                  aliases: ['大屏首页', '区域联勤', '总览大屏', '可视化大屏', '主大屏', '首页', 'landing'] },
  'street-detail':  { route: '/landing/street-detail',    aliases: ['商业街', '商业街管理', '商业街专题', '示范街', '街道详情', '街道管理', '街道'] },
  'fire-control':   { route: '/landing/fire-control',     aliases: ['消防控制室', '消控室', '消防管理', '消防监控', '消防'] },
  'gongmao':        { route: '/gongmao',                  aliases: ['工贸安全', '工贸驾驶舱', '工贸企业', '安全生产驾驶舱', '驾驶舱', '工贸'] },
}

// ===== System Prompt =====
const SYSTEM_PROMPT = `你是"人工智能+企业安全"平台的大屏 AI 助手。你可以和用户自由对话，回答关于平台数据的各种问题。

## 数据查询能力

你可以查询平台中的真实数据，包括：
- **租户（企业）**：租户数量、行业分类、地区分布等
- **用户**：用户数量、角色分布等
- **岗位**：岗位列表

当用户询问数据相关的问题时（如"有多少个租户"、"都是什么行业"），使用工具函数查询真实数据，然后将结果用自然语言组织给用户。

## 页面导航

当用户想要打开某个页面时，返回导航 JSON：
\`\`\`json
{ "type": "navigate", "pageKey": "street-detail", "reply": "好的，正在为你打开..." }
\`\`\`

可用页面：${Object.keys(PAGE_ALIASES).join('、')}
${buildPageListText()}

## 回复规则
- 用户想导航 → 返回上面的 JSON
- 用户问数据 → 调用工具查询，然后基于工具返回的数据回复
- 其他问题 → 直接自然语言回复
- 友好、简洁

## 【重要】数据回复铁律
1. 工具返回的 text 字段是预先格式化好的真实数据，直接输出它，不要修改、不要重写、不要补充
2. 绝对不编造任何企业名称、数字、行业分类
3. 如果工具返回的 text 里写的是未分类，就如实说未分类，不要自行推测
4. 可以在 text 前后加一句简短引导语，但数据部分一字不改`

// ===== 工具定义 =====
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_enterprise_list',
      description: '查询租户（企业）的详细列表，返回企业名称、行业分类、地区等信息。当用户要"列出所有租户"、"租户清单"、"有哪些企业"时使用此工具',
      parameters: {
        type: 'object',
        properties: {
          dimB: { type: 'string', description: '按行业筛选，可选：工贸企业、教育行业、社区物业、其他。不传则返回全部' },
          keyword: { type: 'string', description: '按名称搜索关键词，不传则返回全部' },
        },
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
          dimB: { type: 'string', description: '按行业筛选。不传则查询总数和所有行业分布' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_user_stats',
      description: '查询平台用户统计数据，包括总用户数',
      parameters: { type: 'object', properties: {} },
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
]

// 这些行业分类来自 enterprise.service.ts 的 DIM_B_OPTIONS
const DIM_B_LABELS: Record<string, string> = {
  'industry_trade': '工贸企业',
  'education': '教育行业',
  'community_property': '社区物业',
  'other': '其他行业',
  // 补充常见原始值映射
  '工贸企业': '工贸企业',
  '教育行业': '教育行业',
  '社区物业': '社区物业',
  'fire_tech_service': '消防技术服务',
  'gov_regulator': '政府监管',
  'commercial_complex': '商业综合体',
  'manufacturing': '制造业',
  'emergency_mgmt': '应急管理',
}

// ===== DeepSeek 客户端 =====
const client = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY || '',
  baseURL: env.DEEPSEEK_BASE_URL,
})

// ===== 类型 =====
export interface AgentMessage { role: 'user' | 'assistant'; content: string }
export interface AgentResponse { type: 'navigate' | 'chat'; pageKey?: string; route?: string; reply: string }

export interface StreamEvent { type: 'token'; content: string }
export interface StreamDoneEvent { type: 'done'; action?: { type: 'navigate'; route: string; pageKey: string } }

// ===== 执行工具调用 =====
async function executeTool(name: string, args: Record<string, any>): Promise<string> {
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
    default:
      return JSON.stringify({ error: `未知工具: ${name}` })
  }
}

// ===== 核心：流式调用 LLM（支持 Function Calling） =====
export async function* streamChat(
  message: string,
  history: AgentMessage[] = [],
): AsyncGenerator<StreamEvent | StreamDoneEvent> {
  // 本地降级
  if (!env.DEEPSEEK_API_KEY) {
    yield* localFallbackStream(message)
    return
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    // 预判：用户问题是否很可能需要查数据
    const dataKeywords = /多少|几个|有哪些|列表|列出|统计|什么行业|哪个|查询|几个租户|几个用户|岗位/
    const likelyDataQuery = dataKeywords.test(message)

    if (likelyDataQuery) {
      // 先尝试工具调用（数据查询）
      const resp1 = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        tools: TOOLS,
        tool_choice: 'auto',
      })
      const toolCalls = resp1.choices[0]?.message?.tool_calls
      if (toolCalls && toolCalls.length > 0) {
        messages.push(resp1.choices[0].message)
        for (const tc of toolCalls) {
          const fn = (tc as any).function
          const args = JSON.parse(fn?.arguments || '{}')
          const result = await executeTool(fn?.name || '', args)
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
        }
        const stream2 = await client.chat.completions.create({
          model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 1024, stream: true,
        })
        for await (const chunk of stream2) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) yield { type: 'token', content: delta }
        }
        yield { type: 'done' }
        return
      }
    }

    // 导航和普通对话：流式调用（无 tools）
    const stream1 = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
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
    const navAction = parseAction(fullText)
    yield { type: 'done', action: navAction }

  } catch (err: any) {
    console.error('[agent] DeepSeek 调用失败:', err.message)
    yield* localFallbackStream(message)
  }
}

// ===== 本地规则降级流式版本 =====
async function* localFallbackStream(message: string): AsyncGenerator<StreamEvent | StreamDoneEvent> {
  const text = message.toLowerCase()

  // 导航匹配
  for (const [pageKey, page] of Object.entries(PAGE_ALIASES)) {
    for (const alias of page.aliases) {
      if (text.includes(alias)) {
        const reply = `好的，正在为你打开${alias}页面`
        for (let i = 0; i < reply.length; i += 2) {
          yield { type: 'token', content: reply.slice(i, i + 2) }
          await sleep(15)
        }
        yield { type: 'done', action: { type: 'navigate', route: page.route, pageKey } }
        return
      }
    }
  }

  // 数据查询：本地降级也能查
  if (text.includes('租户') || text.includes('企业') && (text.includes('多少') || text.includes('几个'))) {
    const { total } = await enterpriseService.getList({ page: 1, size: 1 })
    const reply = `目前平台共有 ${total} 个租户。`
    for (let i = 0; i < reply.length; i += 2) {
      yield { type: 'token', content: reply.slice(i, i + 2) }
      await sleep(15)
    }
    yield { type: 'done' }
    return
  }

  // 默认
  const reply = '我是大屏AI助手，可以帮你：\n1. 查询数据（如"有多少个租户"）\n2. 导航页面（如"打开商业街专题"）\n3. 自由对话\n\n试试看吧！'
  for (let i = 0; i < reply.length; i += 2) {
    yield { type: 'token', content: reply.slice(i, i + 2) }
    await sleep(15)
  }
  yield { type: 'done' }
}

// ===== 工具函数 =====
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
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  try {
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat', messages, temperature: 0.7, max_tokens: 1024,
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
