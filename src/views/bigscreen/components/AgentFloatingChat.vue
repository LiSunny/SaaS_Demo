<template>
  <Teleport to="body">
    <div class="agent-floating-chat" :class="{ 'is-open': store.isOpen }">
      <!-- ===== 折叠态：浮动按钮 ===== -->
      <button
        v-if="!store.isOpen"
        class="chat-fab"
        @click="store.open()"
        :title="'AI 助手'"
      >
        <span class="fab-icon">🤖</span>
        <span v-if="store.hasNewMessage" class="fab-dot" />
      </button>

      <!-- ===== 展开态：遮罩 + 居中面板 ===== -->
      <div v-if="store.isOpen" class="chat-overlay" @click.self="store.close()">
        <div class="chat-panel">
        <!-- 头部 -->
        <div class="chat-header">
          <span class="chat-header-title">韧性AI助手</span>
          <button class="chat-header-close" @click="store.close()">✕</button>
        </div>

        <!-- 消息列表 -->
        <div class="chat-body" ref="bodyRef">
          <!-- 欢迎消息 -->
          <div v-if="store.messages.length === 0" class="chat-welcome">
            <p class="welcome-icon">🤖</p>
            <p class="welcome-text">你好！我是韧性AI助手。</p>
            <p class="welcome-hint">可以帮你查询数据、打开页面：</p>
            <div class="welcome-chips">
              <button v-for="chip in quickChips" :key="chip" class="welcome-chip" @click="sendQuick(chip)" :disabled="store.isLoading">{{ chip }}</button>
            </div>
          </div>

          <!-- 对话消息 -->
          <div
            v-for="msg in store.messages"
            :key="msg.id"
            :class="['chat-msg', `chat-msg--${msg.role}`]"
          >
            <div class="chat-msg-avatar">
              {{ msg.role === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="chat-msg-bubble" v-if="msg.role === 'user'">
              {{ msg.content }}
            </div>
            <!-- AI 消息：有内容时渲染 Markdown，空内容时显示加载动画 -->
            <div class="chat-msg-bubble chat-msg-bubble--md" v-else>
              <span v-if="msg.content" v-html="renderMarkdown(msg.content)"></span>
              <span v-else class="chat-loading-dots">
                <span class="ld-dot" v-for="i in 3" :key="i" :style="{ animationDelay: `${(i-1)*0.15}s` }" />
              </span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-footer">
          <input
            ref="inputRef"
            v-model="inputText"
            class="chat-input"
            placeholder="问我任何问题，如：有多少个租户？"
            @keyup.enter="handleSend"
          />
          <button
            v-if="store.isLoading"
            class="chat-stop-btn"
            @click="store.stop()"
          >停止</button>
          <button
            v-else
            class="chat-send-btn"
            @click="handleSend"
            :disabled="!inputText.trim()"
          >发送</button>
        </div>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'

// 配置 marked
marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}
import { useAiChatStore } from '@/stores/ai-chat'

const store = useAiChatStore()
const router = useRouter()
const inputText = ref('')
const bodyRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// 从 URL 读取当前 bigscreenId
function getCurrentBigscreenId(): number {
  return Number(new URLSearchParams(window.location.search).get('bigscreenId')) || 0
}

// ===== 快捷指令 =====
const quickChips = [
  '有多少个租户',
  '都是什么行业',
  '列出所有企业',
  '打开商业街专题',
  '去消防控制室',
]

// ===== 发送消息 =====
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || store.isLoading) return
  inputText.value = ''
  await store.sendMessage(text)
  await scrollToBottom()
  inputRef.value?.focus()
}

function sendQuick(text: string) {
  inputText.value = text
  handleSend()
}

// ===== 自动滚到底部 =====
async function scrollToBottom() {
  await nextTick()
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  }
}

// 展开时聚焦输入框
watch(() => store.isOpen, async (open) => {
  if (open) {
    await nextTick()
    inputRef.value?.focus()
    await scrollToBottom()
  }
})

// 新消息时滚动
watch(() => store.messages.length, async () => {
  await scrollToBottom()
})

// ===== 监听导航事件 =====
function handleNavigate(e: Event) {
  const detail = (e as CustomEvent).detail as { route: string }
  if (!detail?.route) return

  const currentPath = window.location.pathname
  const targetRoute = detail.route

  // 判断是否需要全页刷新（跨大屏类型）
  const currentBase = currentPath.split('?')[0]
  const targetBase = targetRoute.split('?')[0]

  if (currentBase === targetBase) {
    // 同一页面，不需要跳转
    return
  }

  const bigscreenId = getCurrentBigscreenId()
  const qs = bigscreenId ? `?bigscreenId=${bigscreenId}` : ''

  if (currentBase.startsWith('/landing') && targetBase.startsWith('/landing')) {
    // landing 下的子页面切换，用 router
    store.close()
    router.push(targetRoute + qs)
  } else {
    // 跨大屏类型（如 /gongmao → /landing），全页刷新
    store.close()
    setTimeout(() => { window.location.href = targetRoute + qs }, 100)
  }
}

onMounted(() => {
  window.addEventListener('agent:navigate', handleNavigate)
})

onUnmounted(() => {
  window.removeEventListener('agent:navigate', handleNavigate)
})
</script>

<style lang="scss" scoped>
/* ===== 容器 ===== */
.agent-floating-chat {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 浮动按钮 ===== */
.chat-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1.5px solid rgba(86, 240, 244, 0.4);
  background: linear-gradient(135deg, rgba(0, 63, 118, 0.92), rgba(0, 44, 98, 0.95));
  box-shadow: 0 0 20px rgba(86, 240, 244, 0.25), 0 4px 16px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 0 28px rgba(86, 240, 244, 0.4), 0 6px 20px rgba(0, 0, 0, 0.5);
  }

  &:active {
    transform: scale(0.96);
  }
}

.fab-icon {
  font-size: 26px;
  line-height: 1;
}

.fab-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff4757;
  border: 2px solid rgba(0, 44, 98, 0.95);
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ===== 遮罩层 ===== */
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 聊天面板 ===== */
.chat-panel {
  width: 60vw;
  height: 70vh;
  max-width: 900px;
  max-height: 800px;
  border-radius: 16px;
  border: 1px solid rgba(86, 240, 244, 0.3);
  background: linear-gradient(180deg, rgba(0, 55, 110, 0.98), rgba(0, 34, 78, 0.99));
  box-shadow: 0 0 60px rgba(86, 240, 244, 0.2), 0 16px 48px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 头部 ===== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(86, 240, 244, 0.12);
  flex-shrink: 0;
}

.chat-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #e0f4ff;
}

.chat-header-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #9ab8d4;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 71, 87, 0.2);
    color: #ff6b7a;
  }
}

/* ===== 消息列表 ===== */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(86, 240, 244, 0.15);
    border-radius: 2px;
  }
}

/* ===== 欢迎区 ===== */
.chat-welcome {
  text-align: center;
  padding: 24px 8px;
}

.welcome-icon {
  font-size: 40px;
  margin: 0 0 12px;
}

.welcome-text {
  font-size: 15px;
  color: #c8e4ff;
  margin: 0 0 4px;
}

.welcome-hint {
  font-size: 12px;
  color: #7a9bb5;
  margin: 0 0 14px;
}

.welcome-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.welcome-chip {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(86, 240, 244, 0.3);
  background: rgba(86, 240, 244, 0.06);
  color: #8ec8f0;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    background: rgba(86, 240, 244, 0.15);
    border-color: rgba(86, 240, 244, 0.5);
    color: #c0f0ff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

/* ===== 消息气泡 ===== */
.chat-msg {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  &--user {
    flex-direction: row-reverse;

    .chat-msg-bubble {
      background: rgba(86, 240, 244, 0.12);
      border-color: rgba(86, 240, 244, 0.25);
      border-radius: 14px 4px 14px 14px;
      color: #d0ecff;
    }
  }

  &--assistant {
    .chat-msg-bubble {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.08);
      border-radius: 4px 14px 14px 14px;
      color: #c8dff0;
    }
  }
}

.chat-msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.chat-msg-bubble {
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.55;
  border: 1px solid transparent;
  max-width: 420px;
  word-break: break-word;
}

/* ===== AI 思考中加载动画 ===== */
.chat-loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.ld-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #56f0f4;
  animation: ld-bounce 0.6s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(86, 240, 244, 0.5);
}

@keyframes ld-bounce {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* ===== 输入区 ===== */
.chat-footer {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid rgba(86, 240, 244, 0.12);
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(86, 240, 244, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: #d0e8ff;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;

  &::placeholder {
    color: #5a7a9a;
  }

  &:focus {
    border-color: rgba(86, 240, 244, 0.5);
  }

  &:disabled {
    opacity: 0.5;
  }
}

.chat-send-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, rgba(0, 168, 210, 0.8), rgba(0, 120, 180, 0.8));
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
  font-family: inherit;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.chat-stop-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 71, 87, 0.4);
  background: rgba(255, 71, 87, 0.15);
  color: #ff6b7a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 71, 87, 0.25);
  }
}

/* ===== Markdown 渲染样式 ===== */
.chat-msg-bubble--md {
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 12px;
  }
  :deep(th) {
    background: rgba(86, 240, 244, 0.1);
    color: #56f0f4;
    padding: 4px 8px;
    text-align: left;
    border-bottom: 1px solid rgba(86, 240, 244, 0.2);
    font-weight: 500;
  }
  :deep(td) {
    padding: 3px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    color: #c8dff0;
  }
  :deep(strong) {
    color: #56f0f4;
    font-weight: 600;
  }
  :deep(em) {
    color: #8ec8f0;
  }
  :deep(code) {
    background: rgba(255, 255, 255, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12px;
    color: #f0c060;
  }
  :deep(ul), :deep(ol) {
    margin: 4px 0;
    padding-left: 18px;
  }
  :deep(li) {
    margin: 2px 0;
    color: #c8dff0;
  }
  :deep(p) {
    margin: 0 0 4px;
    &:last-child { margin-bottom: 0; }
  }
  :deep(hr) {
    border: none;
    border-top: 1px solid rgba(86, 240, 244, 0.15);
    margin: 8px 0;
  }
}
</style>
