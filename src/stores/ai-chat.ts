/**
 * ai-chat.ts — AI Chat Pinia Store
 *
 * 管理聊天消息列表、SSE 流式消费、导航动作执行。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

// ===== 类型 =====
/** 文件附件（聊天消息中展示） */
export interface FileAttachment {
  url: string
  fileName: string
  fileType: string
  fileSize: number
}

/** 文件上传后服务端返回的完整数据（含解析文本，暂存前端用于发送） */
export interface FileUploadResult extends FileAttachment {
  key: string
  parsedText: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  attachments?: FileAttachment[]
  followups?: string[]       // AI 生成的后续快捷提问（仅 assistant 有）
  scopeEnts?: number[] | null  // 实际查询使用的企业 ID 集合（仅 assistant 有，用于追问时延续 scope）
  thinking?: string          // AI 思考过程（仅 assistant 有，已 stripNonChinese）
  toolExecArgs?: Record<string, any>        // 工具调用参数（仅 assistant 有，仅白名单字段）
  toolExecDropped?: string[]                // 被白名单丢弃的参数名（仅 assistant 有）
}

/** 调试日志单条事件 */
export interface DebugEvent {
  node: string
  label: string
  io: 'input' | 'output' | 'info' | 'error'
  summary: string
  detail?: any
  // 前端补的时间戳
  receivedAt: number
}

/** 产物（右栏「产物」Tab 展示的可交付物，HTML） */
export interface Artifact {
  id: string
  type: 'alarm-report' | 'hazard-list' | 'order-weekly'
  title: string
  html: string
}

// ===== 工具 =====
let msgIdCounter = 0
function nextId(): string { return `msg-${Date.now()}-${++msgIdCounter}` }

/** 尝试从文本中提取导航 JSON 的 reply 字段，有则只显示 reply，无则返回原文 */
function cleanNavJson(text: string): string {
  try {
    const m = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    const jsonStr = m ? m[1].trim() : text.trim()
    if (jsonStr.startsWith('{') && jsonStr.includes('"type"') && jsonStr.includes('"navigate"')) {
      const parsed = JSON.parse(jsonStr)
      if (parsed.reply) return parsed.reply
    }
  } catch {}
  // 正则降级
  const navMatch = text.match(/\{[^}]*"type"\s*:\s*"navigate"[^}]*"reply"\s*:\s*"([^"]+)"[^}]*\}/)
  if (navMatch) return navMatch[1]
  return text
}

export const useAiChatStore = defineStore('aiChat', () => {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isOpen = ref(false)
  const hasNewMessage = ref(false)
  const debugEvents = ref<DebugEvent[]>([])
  const debugOpen = ref(false)  // 调试面板是否展开
  const thinkingTexts = ref<string[]>([])  // 调试面板「思考」Tab 内容（实时累加纯汉字）
  const artifacts = ref<Artifact[]>([])  // 产物列表（本次会话产出的可交付物）
  let abortController: AbortController | null = null

  function toggle() { isOpen.value = !isOpen.value; if (isOpen.value) hasNewMessage.value = false }
  function open() { isOpen.value = true; hasNewMessage.value = false }
  function close() { isOpen.value = false }

  /** 停止当前生成 */
  function stop() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    const last = messages.value[messages.value.length - 1]
    if (last?.isStreaming) {
      last.isStreaming = false
      if (!last.content) last.content = '已取消。'
    }
    isLoading.value = false
  }

  /** 上传文件到 Agent 服务端 → 解析文本 → 返回结果 */
  async function uploadFile(file: File): Promise<FileUploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('auth_token')
    const resp = await fetch('/api/agent/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: '上传失败' }))
      throw new Error(err.message || '上传失败')
    }

    const json = await resp.json()
    if (json.code !== 0) {
      throw new Error(json.message || '上传失败')
    }
    return json.data as FileUploadResult
  }

  /** 发送消息 */
  async function sendMessage(
    text: string,
    attachments?: FileAttachment[],
    fileUploadResults?: FileUploadResult[],
    contextHint?: string,   // 上下文延续提示（文本兜底，如"继续在辖区范围内"），由追问按钮自动注入
    scopeParams?: { enterpriseIds?: number[] },  // 上下文延续参数（结构化主路径）
  ) {
    if ((!text.trim() && !attachments?.length) || isLoading.value) return

    messages.value.push({ id: nextId(), role: 'user', content: text, attachments })
    const aiMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', isStreaming: true }
    messages.value.push(aiMsg)
    isLoading.value = true
    debugEvents.value = []  // 新消息 → 清空调试日志
    thinkingTexts.value = [] // 新消息 → 清空思考内容
    artifacts.value = []    // 新消息 → 清空产物

    const history = messages.value
      .filter(m => !m.isStreaming && m.id !== aiMsg.id)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const token = localStorage.getItem('auth_token')
    abortController = new AbortController()

    // 构造 fileContext（取第一个附件，POC 阶段单文件）
    const fileContext = fileUploadResults?.length
      ? {
          url: fileUploadResults[0].url,
          fileName: fileUploadResults[0].fileName,
          fileType: fileUploadResults[0].fileType,
          fileSize: fileUploadResults[0].fileSize,
          parsedText: fileUploadResults[0].parsedText,
        }
      : undefined

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history, fileContext, contextHint, scopeParams }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        aiMsg.content = '抱歉，请求失败了，请稍后重试。'
        aiMsg.isStreaming = false
        isLoading.value = false
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        aiMsg.content = '抱歉，无法读取响应。'
        aiMsg.isStreaming = false
        isLoading.value = false
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let rawText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) { eventType = line.slice(7).trim(); continue }
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            const idx = messages.value.findIndex(m => m.id === aiMsg.id)
            if (idx === -1) continue
            if (eventType === 'token' && data.type === 'text' && data.content) {
              rawText += data.content
              messages.value[idx].content = cleanNavJson(rawText)
            } else if (eventType === 'action' && data.type === 'navigate' && data.route) {
              window.dispatchEvent(new CustomEvent('agent:navigate', { detail: { route: data.route } }))
            } else if (eventType === 'debug') {
              debugEvents.value.push({
                node: data.node,
                label: data.label,
                io: data.io,
                summary: data.summary,
                detail: data.detail,
                receivedAt: Date.now(),
              })
              // 从 tool_exec 节点提取实际企业 ID + 工具调用参数（结构化 scope + 参数白名单前端对照）
              if (data.node === 'tool_exec') {
                if (data.detail?.实际企业ID !== undefined) {
                  messages.value[idx].scopeEnts = data.detail.实际企业ID
                }
                // 工具调用参数：后端已用 toolArgsWhitelist 过滤；前端再校验一次
                if (data.detail?.参数 !== undefined) {
                  const { __dropped, ...whitelisted } = data.detail.参数
                  messages.value[idx].toolExecArgs = whitelisted
                  messages.value[idx].toolExecDropped = __dropped || []
                }
              }
            } else if (eventType === 'artifact') {
              artifacts.value.push({
                id: data.id,
                type: data.type,
                title: data.title,
                html: data.html,
              })
            } else if (eventType === 'followup' && Array.isArray(data.followups)) {
              messages.value[idx].followups = data.followups
            } else if (eventType === 'thinking' && data.text) {
              // 累加思考过程（已 stripNonChinese 的纯汉字）
              messages.value[idx].thinking = (messages.value[idx].thinking || '') + data.text + '\n'
              // 同时推到调试面板「思考」Tab
              thinkingTexts.value.push(data.text)
            } else if (eventType === 'rearranged' && typeof data.text === 'string') {
              // 后端 scope-note 后置完成：用重组后的完整文本覆盖（不 append），气泡内容同步更新。
              // 之前 token 累加产生的"脚注夹中间"状态在此被修正为最终正确顺序。
              rawText = data.text
              messages.value[idx].content = cleanNavJson(rawText)
            } else if (eventType === 'error') {
              messages.value[idx].content = data.message || '处理请求时出错'
            }
          } catch { /* skip */ }
          eventType = ''
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return // 用户取消
      console.error('[ai-chat] 请求失败:', err)
      aiMsg.content = '网络错误，请检查后端服务是否运行。'
    }

    abortController = null
    aiMsg.isStreaming = false
    isLoading.value = false
  }

  function reset() { messages.value = []; artifacts.value = []; debugEvents.value = []; thinkingTexts.value = []; isLoading.value = false }

  return { messages, isLoading, isOpen, hasNewMessage, debugEvents, debugOpen, thinkingTexts, artifacts, toggle, open, close, stop, sendMessage, uploadFile, reset }
})
