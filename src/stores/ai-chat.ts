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
  ) {
    if ((!text.trim() && !attachments?.length) || isLoading.value) return

    messages.value.push({ id: nextId(), role: 'user', content: text, attachments })
    const aiMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', isStreaming: true }
    messages.value.push(aiMsg)
    isLoading.value = true
    debugEvents.value = []  // 新消息 → 清空调试日志

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
        body: JSON.stringify({ message: text, history, fileContext }),
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

  function reset() { messages.value = []; isLoading.value = false }

  return { messages, isLoading, isOpen, hasNewMessage, debugEvents, debugOpen, toggle, open, close, stop, sendMessage, uploadFile, reset }
})
