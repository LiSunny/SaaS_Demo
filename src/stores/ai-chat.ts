/**
 * ai-chat.ts — AI Chat Pinia Store
 *
 * 管理聊天消息列表、SSE 流式消费、导航动作执行。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

// ===== 类型 =====
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
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

  /** 发送消息 */
  async function sendMessage(text: string) {
    if (!text.trim() || isLoading.value) return

    messages.value.push({ id: nextId(), role: 'user', content: text })
    const aiMsg: ChatMessage = { id: nextId(), role: 'assistant', content: '', isStreaming: true }
    messages.value.push(aiMsg)
    isLoading.value = true

    const history = messages.value
      .filter(m => !m.isStreaming && m.id !== aiMsg.id)
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))

    const token = localStorage.getItem('auth_token')
    abortController = new AbortController()

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
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

  return { messages, isLoading, isOpen, hasNewMessage, toggle, open, close, stop, sendMessage, reset }
})
