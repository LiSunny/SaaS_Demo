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

// ===== 页面别名映射 =====
const PAGE_ALIASES: Record<string, { route: string; aliases: string[] }> = {
  'landing':        { route: '/landing',                  aliases: ['大屏首页', '区域联勤', '总览大屏', '可视化大屏', '主大屏', '首页', 'landing'] },
  'street-detail':  { route: '/landing/street-detail',    aliases: ['商业街', '商业街管理', '商业街专题', '示范街', '街道详情', '街道管理', '街道'] },
  'fire-control':   { route: '/landing/fire-control',     aliases: ['消防控制室', '消控室', '消防管理', '消防监控', '消防'] },
  'gongmao':        { route: '/gongmao',                  aliases: ['工贸安全', '工贸驾驶舱', '工贸企业', '安全生产驾驶舱', '驾驶舱', '工贸'] },
}

// ===== System Prompt（从 Markdown 文件加载） =====
function getSystemPrompt(): string {
  return loadSystemPrompt({ pageList: buildPageListText() })
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
          // dimB：行业分类筛选维度
          //   - 类型：string
          //   - 可选值：'工贸企业' | '教育行业' | '社区物业' | '其他'
          //   - 作用：按行业筛选返回的企业列表；不传（或为空）则返回全部行业
          //   - 注意：取值需严格匹配上述枚举，拼写不一致会导致筛选无效
          dimB: { type: 'string', description: '按行业筛选，可选：工贸企业、教育行业、社区物业、其他。不传则返回全部' },
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
          dimB: { type: 'string', description: '按行业筛选。不传则查询总数和所有行业分布' },
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
]

// 岗位标签映射从数据库动态加载（见 buildPositionLabelMap），不写死

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

/** 文件上下文（前端上传解析后传入） */
export interface FileContext {
  url: string
  fileName: string
  fileType: string
  fileSize: number
  parsedText: string
}

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

// ===== 核心：流式调用 LLM（支持 Function Calling + 文件上下文） =====
export async function* streamChat(
  message: string,
  history: AgentMessage[] = [],
  fileContext?: FileContext,
): AsyncGenerator<StreamEvent | StreamDoneEvent | StreamDebugEvent> {
  const t0 = Date.now()

  // ===== 节点 1：收到请求 =====
  yield debugEvent('request', '📥 收到请求', 'info',
    `消息: "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}"`,
    {
      原始消息: message,
      历史消息数: history.length,
      包含文件: !!fileContext,
      文件信息: fileContext ? { 名称: fileContext.fileName, 类型: fileContext.fileType, 大小: fileContext.fileSize } : undefined,
    }, t0)

  // 本地降级
  if (!env.DEEPSEEK_API_KEY) {
    yield debugEvent('fallback_check', '⚠️ 降级模式', 'info',
      '未配置 DEEPSEEK_API_KEY，使用本地规则匹配', { 原因: 'no_api_key' }, t0)
    yield* localFallbackStream(message, t0)
    return
  }

  // 构造用户消息（有文件上下文时嵌入文件内容）
  const userContent = buildUserMessage(message, fileContext)
  const systemPrompt = getSystemPrompt()

  // ===== 节点 2：系统提示词 =====
  yield debugEvent('system_prompt', '📋 系统提示词', 'info',
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
  yield debugEvent('llm_call_1', '🤖 LLM 调用 #1（工具决策）', 'input',
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

      yield debugEvent('llm_call_1_response', '🤖 LLM 响应 #1', 'output',
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
          const result = await executeTool(fnName, args)
          yield debugEvent('tool_exec', '🔧 工具调用', 'output',
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
        yield debugEvent('llm_call_2', '🤖 LLM 调用 #2（汇总回复）', 'input',
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
        yield debugEvent('llm_call_2_response', '🤖 LLM 响应 #2', 'output',
          `流式完成，共 ${fullText2.length} 字符，耗时 ${Date.now() - t2}ms`,
          {
            回复预览: fullText2.slice(0, 300) + (fullText2.length > 300 ? '…' : ''),
            回复长度: fullText2.length,
            耗时ms: Date.now() - t2,
          }, t0)

        yield debugEvent('done', '✅ 完成', 'info',
          `总耗时 ${since(t0)}`,
          { 总耗时ms: Date.now() - t0 }, t0)

        yield { type: 'done' }
        return
      }
    }

    // 导航和普通对话：流式调用（无 tools）
    // ===== 节点 8：LLM 直接流式调用 =====
    yield debugEvent('llm_direct', '🤖 LLM 直接回复（无工具）', 'input',
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
    yield debugEvent('llm_direct_response', '🤖 直接回复完成', 'output',
      navAction
        ? `流式完成（${fullText.length} 字符），识别到导航意图 → ${navAction.pageKey}，耗时 ${Date.now() - tStream}ms`
        : `流式完成（${fullText.length} 字符），无导航意图，耗时 ${Date.now() - tStream}ms`,
      {
        回复预览: fullText.slice(0, 300) + (fullText.length > 300 ? '…' : ''),
        回复长度: fullText.length,
        导航识别: navAction || null,
        耗时ms: Date.now() - tStream,
      }, t0)

    yield debugEvent('done', '✅ 完成', 'info',
      `总耗时 ${since(t0)}`,
      { 总耗时ms: Date.now() - t0 }, t0)

    yield { type: 'done', action: navAction }

  } catch (err: any) {
    // ===== 节点 E：LLM 异常降级 =====
    yield debugEvent('llm_error', '❌ LLM 调用失败', 'error',
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
        yield debugEvent('fallback_nav', '🔀 本地匹配 → 导航', 'info',
          `匹配别名 "${alias}" → ${page.route}`,
          { 匹配关键词: alias, 目标路由: page.route, 页面Key: pageKey }, start)
        const reply = `好的，正在为你打开${alias}页面`
        for (let i = 0; i < reply.length; i += 2) {
          yield { type: 'token', content: reply.slice(i, i + 2) }
          await sleep(15)
        }
        yield debugEvent('done', '✅ 完成（本地降级）', 'info',
          `总耗时 ${since(start)}`,
          { 总耗时ms: Date.now() - start, 模式: 'local_fallback' }, start)
        yield { type: 'done', action: { type: 'navigate', route: page.route, pageKey } }
        return
      }
    }
  }

  // 数据查询：本地降级也能查
  if (text.includes('租户') || text.includes('企业') && (text.includes('多少') || text.includes('几个'))) {
    yield debugEvent('fallback_query', '🔀 本地匹配 → 数据查询', 'info',
      '关键词匹配"租户/企业"+"多少/几个"',
      { 匹配模式: 'enterprise_count' }, start)
    const { total } = await enterpriseService.getList({ page: 1, size: 1 })
    const reply = `目前平台共有 ${total} 个租户。`
    for (let i = 0; i < reply.length; i += 2) {
      yield { type: 'token', content: reply.slice(i, i + 2) }
      await sleep(15)
    }
    yield debugEvent('done', '✅ 完成（本地降级）', 'info',
      `总耗时 ${since(start)}`,
      { 总耗时ms: Date.now() - start, 模式: 'local_fallback' }, start)
    yield { type: 'done' }
    return
  }

  // 默认
  yield debugEvent('fallback_default', '🔀 本地匹配 → 默认回复', 'info',
    '未匹配任何规则，返回默认帮助文本', {}, start)
  const reply = '我是大屏AI助手，可以帮你：\n1. 查询数据（如"有多少个租户"）\n2. 导航页面（如"打开商业街专题"）\n3. 自由对话\n\n试试看吧！'
  for (let i = 0; i < reply.length; i += 2) {
    yield { type: 'token', content: reply.slice(i, i + 2) }
    await sleep(15)
  }
  yield debugEvent('done', '✅ 完成（本地降级）', 'info',
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
