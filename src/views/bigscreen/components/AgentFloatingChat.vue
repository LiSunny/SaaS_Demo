<template>
  <Teleport to="body">
    <div class="agent-floating-chat" :class="[{ 'is-open': store.isOpen }, robotPhase]">
      <!-- ===== 折叠态：机器人 ===== -->
      <div v-if="!store.isOpen" class="robot-wrapper">
        <button
          class="chat-fab"
          @click="handleRobotClick"
          title="AI 助手"
        >
          <img src="@/assets/agent-robot.svg" alt="AI助手" class="fab-robot-img" />
        </button>
        <!-- 打招呼气泡 -->
        <div v-if="robotPhase === 'greeting'" class="robot-greeting">
          <span>嗨，我是AI助手 👋</span>
        </div>
      </div>

      <!-- ===== 展开态：遮罩 + 居中面板 ===== -->
      <div v-if="store.isOpen" class="chat-overlay" @click.self="store.close()">
        <div class="chat-panel" :class="{ 'has-debug': store.debugOpen }">
        <!-- 头部 -->
        <div class="chat-header">
          <span class="chat-header-title">小安助手</span>
          <div class="chat-header-actions">
            <button
              v-if="isDev"
              class="chat-header-debug-btn"
              :class="{ active: store.debugOpen }"
              @click="store.debugOpen = !store.debugOpen"
              :title="store.debugOpen ? '关闭调试日志' : '打开调试日志'"
            >🐛</button>
            <button class="chat-header-close" @click="store.close()">✕</button>
          </div>
        </div>

        <!-- 主体区：消息列表 + 调试面板 -->
        <div class="chat-main">
        <!-- 消息列表 -->
        <div class="chat-body" ref="bodyRef">
          <!-- 欢迎消息 -->
          <div v-if="store.messages.length === 0" class="chat-welcome">
            <div class="welcome-icon">
              <img src="@/assets/agent-robot-chat.svg" alt="AI助手" class="welcome-robot-img" />
            </div>
            <p class="welcome-text">你好！我是小安助手。</p>
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
              <template v-if="msg.role === 'user'">👤</template>
              <img v-else src="@/assets/agent-robot-chat.svg" alt="AI" class="chat-msg-robot-img" />
            </div>
            <div class="chat-msg-bubble" v-if="msg.role === 'user'">
              <!-- 文件附件卡片 -->
              <div v-for="att in msg.attachments" :key="att.url"
                   class="chat-file-card" @click="openFile(att.url)">
                <span class="file-card-icon">{{ fileIcon(att.fileName) }}</span>
                <div class="file-card-info">
                  <span class="file-card-name">{{ att.fileName }}</span>
                  <span class="file-card-meta">{{ formatSize(att.fileSize) }}</span>
                </div>
                <span class="file-card-dl" title="查看原文件">↗</span>
              </div>
              <div v-if="msg.content">{{ msg.content }}</div>
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

        <!-- 调试面板 -->
        <div v-if="store.debugOpen" class="chat-debug-panel">
          <div class="debug-header">
            <span class="debug-title">🔍 调用时间线</span>
            <span class="debug-count">{{ store.debugEvents.length }} 个节点</span>
          </div>
          <div class="debug-body" ref="debugBodyRef">
            <div v-if="store.debugEvents.length === 0" class="debug-empty">
              <span class="debug-empty-icon">📡</span>
              <span>发送消息后，此处将显示完整的调用流程</span>
            </div>
            <div
              v-for="(evt, idx) in store.debugEvents"
              :key="idx"
              :class="['debug-node', `debug-node--${evt.io}`]"
            >
              <!-- 时间线竖线 + 圆点 -->
              <div class="debug-timeline">
                <div class="debug-dot" :class="`dot--${evt.io}`"></div>
                <div v-if="idx < store.debugEvents.length - 1" class="debug-line"></div>
              </div>
              <!-- 节点内容 -->
              <div class="debug-node-content">
                <div class="debug-node-head" @click="toggleDebugDetail(idx)">
                  <span class="debug-node-label">{{ evt.label }}</span>
                  <span class="debug-node-summary">{{ evt.summary }}</span>
                  <span v-if="evt.detail && Object.keys(evt.detail).length" class="debug-expand">{{ expandedDebug.has(idx) ? '▾' : '▸' }}</span>
                </div>
                <!-- 可展开详情 -->
                <div v-if="evt.detail && expandedDebug.has(idx)" class="debug-node-detail">
                  <pre class="debug-json">{{ formatDebugDetail(evt.detail) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div><!-- /chat-main -->

        <!-- 输入区 -->
        <div class="chat-footer">
          <!-- 文件预览 Tag -->
          <div v-if="pendingFile" class="chat-file-tags">
            <div class="file-tag"
                 ref="fileTagRef"
                 :class="{ 'is-uploading': isUploading, 'is-done': !!pendingUpload }"
                 @mouseenter="onTagEnter"
                 @mouseleave="onTagLeave">
              <!-- 上传中：旋转图标 -->
              <span v-if="isUploading" class="file-tag-spinner"></span>
              <span v-else class="file-tag-type">{{ fileTypeLabel(pendingFile.name) }}</span>
              <span class="file-tag-name">{{ pendingFile.name }}</span>
              <!-- 上传中：进度文字；完成后：大小 -->
              <span v-if="isUploading" class="file-tag-meta">{{ uploadProgress.toFixed(0) }}%</span>
              <span v-else class="file-tag-meta">· {{ formatSize(pendingFile.size) }}</span>
              <button class="file-tag-remove" @click.stop="clearPendingFile">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- 上传中进度条 -->
            <div v-if="isUploading" class="file-tag-progress">
              <div class="file-tag-progress-bar" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>

          <div class="chat-input-row">
            <!-- 附件按钮 -->
            <button class="chat-attach-btn" @click="triggerFileInput"
                    :disabled="store.isLoading || isUploading" title="上传文件（PDF/图片）">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <input type="file" ref="fileInputRef" hidden
                   accept=".pdf,.txt,.md,.json,.png,.jpg,.jpeg,.gif,.webp"
                   @change="handleFileSelected" />

            <input
              ref="inputRef"
              v-model="inputText"
              class="chat-input"
              :placeholder="pendingFile ? '添加说明文字（可选）...' : '问我任何问题，如：有多少个租户？'"
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
              :disabled="(!inputText.trim() && !pendingUpload) || isUploading"
            >发送</button>
          </div>

          <!-- 语音通话入口（暂隐藏） -->
          <div v-if="false" class="chat-voice-row">
            <button class="chat-voice-btn" @click="startVoiceChat" title="语音通话">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>语音通话</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 图片预览气泡（Teleport 到 body，规避父容器 overflow:hidden 截断） -->
    <div v-if="showImagePreview && isImageFile(pendingFile?.name || '')" class="file-image-preview" :style="previewStyle">
      <img :src="pendingPreviewUrl" :alt="pendingFile?.name" />
    </div>

    <!-- 语音通话面板 -->
    <VoiceChatPanel v-if="showVoiceChat" @close="showVoiceChat = false" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'
import VoiceChatPanel from './VoiceChatPanel.vue'

// 开发环境标识
const isDev = import.meta.env.DEV

// 配置 marked
marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}
import { useAiChatStore, type FileAttachment, type FileUploadResult } from '@/stores/ai-chat'

const store = useAiChatStore()
const router = useRouter()

// 机器人动画阶段：hidden → flying-in → greeting → peeking
type RobotPhase = 'hidden' | 'flying-in' | 'greeting' | 'peeking'
const robotPhase = ref<RobotPhase>('hidden')

function handleRobotClick() {
  if (robotPhase.value !== 'peeking') return
  store.open()
}

// 在已有 onMounted 中追加机器人动画逻辑
// 页面加载 800ms → flying-in, 1500ms → greeting, 4500ms → peeking
;
const inputText = ref('')
const bodyRef = ref<HTMLElement | null>(null)
const debugBodyRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const pendingUpload = ref<FileUploadResult | null>(null)  // 选完即上传的结果
const pendingPreviewUrl = ref<string>('')
const showImagePreview = ref(false)
const previewStyle = ref<Record<string, string>>({})
const isUploading = ref(false)
const uploadProgress = ref(0)  // 上传进度 0-100
const fileTagRef = ref<HTMLElement | null>(null)
let previewTimer: ReturnType<typeof setTimeout> | null = null

// ===== 语音通话 =====
const showVoiceChat = ref(false)

function startVoiceChat() {
  // 浏览器支持检测
  const hasSTT = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  if (!hasSTT) {
    ElMessage.warning({ message: '当前浏览器不支持语音输入，请使用 Chrome 或 Edge 浏览器', zIndex: 10000 })
    return
  }
  showVoiceChat.value = true
}

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

// ===== 文件相关 =====
function triggerFileInput() {
  fileInputRef.value?.click()
}

function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
}

function fileTypeLabel(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    pdf: 'PDF', txt: 'TXT', md: 'MD', json: 'JSON',
    jpg: 'JPG', jpeg: 'JPEG', png: 'PNG', gif: 'GIF', webp: 'WEBP',
  }
  return map[ext] || ext.toUpperCase()
}

function handleFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 客户端预检
  if (file.size > 15 * 1024 * 1024) {
    ElMessage.warning({ message: '文件大小不能超过 15MB', zIndex: 10000 })
    return
  }

  // 释放旧预览 URL + 清除旧上传结果
  clearPendingFile()

  pendingFile.value = file
  pendingUpload.value = null
  uploadProgress.value = 0

  // 图片生成本地预览 URL
  if (isImageFile(file.name)) {
    pendingPreviewUrl.value = URL.createObjectURL(file)
  }

  // 重置 input 使同一文件可再次选择
  ;(e.target as HTMLInputElement).value = ''

  // 选完立刻上传（不等待点击发送）
  uploadPendingFile()
}

async function uploadPendingFile() {
  if (!pendingFile.value) return
  isUploading.value = true
  uploadProgress.value = 0

  try {
    // 模拟上传进度（fetch 无法精确获取进度时用假进度）
    const progressTimer = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 15 + 5
        if (uploadProgress.value > 90) uploadProgress.value = 90
      }
    }, 300)

    const result = await store.uploadFile(pendingFile.value)
    clearInterval(progressTimer)
    uploadProgress.value = 100
    pendingUpload.value = result
  } catch (err: any) {
    ElMessage.error({ message: '文件上传失败：' + (err.message || '未知错误'), zIndex: 10000 })
    clearPendingFile()
  } finally {
    isUploading.value = false
  }
}

function clearPendingFile() {
  if (pendingPreviewUrl.value) {
    URL.revokeObjectURL(pendingPreviewUrl.value)
    pendingPreviewUrl.value = ''
  }
  pendingFile.value = null
  pendingUpload.value = null
  uploadProgress.value = 0
  showImagePreview.value = false
}

// 长悬停图片预览
function onTagEnter() {
  if (previewTimer) clearTimeout(previewTimer)
  if (isImageFile(pendingFile.value?.name || '')) {
    previewTimer = setTimeout(() => {
      // 计算 tag 位置，用 fixed 定位避开父容器 overflow:hidden
      if (fileTagRef.value) {
        const rect = fileTagRef.value.getBoundingClientRect()
        previewStyle.value = {
          position: 'fixed',
          bottom: `${window.innerHeight - rect.top + 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      }
      showImagePreview.value = true
    }, 600)
  }
}

function onTagLeave() {
  if (previewTimer) clearTimeout(previewTimer)
  showImagePreview.value = false
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    pdf: '📕',
    txt: '📄', md: '📝', json: '📄',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
  }
  return map[ext] || '📎'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function openFile(url: string) {
  window.open(url, '_blank')
}

// ===== 发送消息 =====
async function handleSend() {
  const text = inputText.value.trim()
  if (!text && !pendingUpload.value) return
  if (store.isLoading || isUploading.value) return

  // 使用已上传完成的结果（无需等待）
  const uploadResults: FileUploadResult[] | undefined = pendingUpload.value
    ? [pendingUpload.value]
    : undefined

  const attachments: FileAttachment[] | undefined = uploadResults?.map(r => ({
    url: r.url,
    fileName: r.fileName,
    fileType: r.fileType,
    fileSize: r.fileSize,
  }))

  inputText.value = ''
  clearPendingFile()
  await store.sendMessage(text, attachments, uploadResults)
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

// ===== 调试面板 =====
const expandedDebug = reactive(new Set<number>())

function toggleDebugDetail(idx: number) {
  if (expandedDebug.has(idx)) {
    expandedDebug.delete(idx)
  } else {
    expandedDebug.add(idx)
  }
}

function formatDebugDetail(detail: any): string {
  try {
    return JSON.stringify(detail, null, 2)
  } catch {
    return String(detail)
  }
}

// 调试事件更新时自动滚到底部
watch(() => store.debugEvents.length, async () => {
  await nextTick()
  if (debugBodyRef.value) {
    debugBodyRef.value.scrollTop = debugBodyRef.value.scrollHeight
  }
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
  // 机器人入场动画
  setTimeout(() => { robotPhase.value = 'flying-in' }, 800)
  setTimeout(() => { robotPhase.value = 'greeting' }, 1500)
  setTimeout(() => { robotPhase.value = 'peeking' }, 4500)
})

onUnmounted(() => {
  window.removeEventListener('agent:navigate', handleNavigate)
  if (previewTimer) clearTimeout(previewTimer)
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
})
</script>

<style lang="scss" scoped>
/* ===== 机器人容器 ===== */
.agent-floating-chat {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;

  &.hidden .robot-wrapper { opacity: 0; }

  &.flying-in .robot-wrapper {
    animation: robot-fly-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  &.peeking .robot-wrapper {
    transform: translateX(60px); /* 只露出一半 */
    transition: transform 0.5s ease-out;
    opacity: 1;
  }
}

/* ===== 飞入动画（从右侧外部飞入） ===== */
@keyframes robot-fly-in {
  0%   { transform: translateX(160px); opacity: 0; }
  60%  { transform: translateX(-12px); opacity: 1; }
  100% { transform: translateX(0); opacity: 1; }
}

.robot-wrapper {
  position: relative;
  transition: transform 0.5s ease-out, opacity 0.5s;
}

/* ===== 浮动按钮 ===== */
.chat-fab {
  width: 112px;
  height: 112px;
  border: none;
  background: none;
  box-shadow: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.15);
  }
}

.fab-robot-img {
  width: 112px;
  height: 112px;
  object-fit: contain;
}

/* ===== 打招呼气泡 ===== */
.robot-greeting {
  position: absolute;
  bottom: 100%;
  right: -10px;
  margin-bottom: 12px;
  background: #fff;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  white-space: nowrap;
  animation: greeting-bounce 0.4s ease-out;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 24px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #fff;
  }
}

@keyframes greeting-bounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
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
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
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
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.25s ease, max-width 0.25s ease;

  &.has-debug {
    width: 82vw;
    max-width: 1300px;
  }
}

/* ===== 主体区（聊天 + 调试面板） ===== */
.chat-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ===== 头部 ===== */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #ffffff;
}

.chat-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-header-debug-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #f5f5f5;
  color: #9ca3af;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover {
    background: #e8f0fe;
    color: #2563eb;
    border-color: #93c5fd;
  }

  &.active {
    background: #dbeafe;
    color: #2563eb;
    border-color: #60a5fa;
    box-shadow: 0 0 4px rgba(37, 99, 235, 0.2);
  }
}

.chat-header-close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #f5f5f5;
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #fee2e2;
    color: #ef4444;
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
  background: #fafbfc;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
}

/* ===== 调试面板 ===== */
.chat-debug-panel {
  width: 380px;
  flex-shrink: 0;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #fafbfc;
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.debug-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.debug-count {
  font-size: 10px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 10px;
}

.debug-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
}

.debug-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
}

.debug-empty-icon {
  font-size: 28px;
  opacity: 0.5;
}

/* ===== 调试节点 ===== */
.debug-node {
  display: flex;
  gap: 8px;
  font-size: 11px;
  line-height: 1.5;

  &--input  .debug-node-summary { color: #2563eb; }
  &--output .debug-node-summary { color: #059669; }
  &--info   .debug-node-summary { color: #6b7280; }
  &--error  .debug-node-summary { color: #ef4444; }
}

.debug-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 14px;
}

.debug-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;

  &.dot--input  { background: #2563eb; box-shadow: 0 0 4px rgba(37, 99, 235, 0.3); }
  &.dot--output { background: #059669; box-shadow: 0 0 4px rgba(5, 150, 105, 0.3); }
  &.dot--info   { background: #9ca3af; }
  &.dot--error  { background: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.3); }
}

.debug-line {
  width: 1px;
  flex: 1;
  background: #e5e7eb;
  min-height: 8px;
}

.debug-node-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 8px;
}

.debug-node-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 4px;
  cursor: default;
  padding: 2px 0;
}

.debug-node-label {
  font-weight: 600;
  color: #374151;
  font-size: 11px;
  flex-shrink: 0;
}

.debug-node-summary {
  font-size: 10px;
  word-break: break-word;
}

.debug-expand {
  font-size: 9px;
  color: #9ca3af;
  flex-shrink: 0;
  cursor: pointer;
  padding: 0 3px;
  transition: color 0.15s;

  .debug-node-head:hover & {
    color: #2563eb;
  }
}

.debug-node-detail {
  margin-top: 4px;
  padding: 6px 8px;
  background: #f3f4f6;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: auto;
  max-height: 200px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
}

.debug-json {
  margin: 0;
  font-family: 'SF Mono', 'Cascadia Code', 'Menlo', monospace;
  font-size: 10px;
  line-height: 1.45;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
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

.welcome-robot-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.welcome-text {
  font-size: 15px;
  color: #1f2937;
  margin: 0 0 4px;
}

.welcome-hint {
  font-size: 12px;
  color: #9ca3af;
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
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #2563eb;
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
      background: #eff6ff;
      border-color: #bfdbfe;
      border-radius: 14px 4px 14px 14px;
      color: #1f2937;
    }
  }

  &--assistant {
    .chat-msg-bubble {
      background: #f3f4f6;
      border-color: #e5e7eb;
      border-radius: 4px 14px 14px 14px;
      color: #1f2937;
    }
  }
}

.chat-msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  overflow: hidden;
}

.chat-msg-robot-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
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
  background: #2563eb;
  animation: ld-bounce 0.6s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(37, 99, 235, 0.3);
}

@keyframes ld-bounce {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

/* ===== 输入区 ===== */
.chat-footer {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 10px 14px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #ffffff;
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #1f2937;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #93c5fd;
    background: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
  }
}

.chat-send-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  font-family: inherit;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.chat-stop-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #fca5a5;
  background: #fef2f2;
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 0.15s;

  &:hover {
    background: #fee2e2;
  }
}

/* ===== 语音通话入口 ===== */
.chat-voice-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

.chat-voice-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;

  &:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #2563eb;
    box-shadow: 0 0 8px rgba(37, 99, 235, 0.08);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }

  svg {
    flex-shrink: 0;
  }
}

/* ===== 文件预览 Tags ===== */
.chat-file-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.file-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 4px 4px 8px;
  border-radius: 6px;
  background: #f3f4f6;
  font-size: 12px;
  position: relative;
  transition: background 0.15s;

  &:hover {
    background: #e5e7eb;
  }
}

.file-tag-type {
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  line-height: 1.3;
}

/* 上传中旋转动画 */
.file-tag-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #d1d5db;
  border-top-color: #2563eb;
  border-radius: 50%;
  flex-shrink: 0;
  animation: tag-spin 0.8s linear infinite;
}

@keyframes tag-spin {
  to { transform: rotate(360deg); }
}

/* 上传完成状态 */
.file-tag.is-done {
  .file-tag-type { background: #dbeafe; color: #2563eb; }
}

.file-tag-name {
  color: #374151;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-tag-meta {
  color: #9ca3af;
  font-size: 11px;
  flex-shrink: 0;
}

.file-tag-remove {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;

  .file-tag:hover & {
    opacity: 1;
  }

  &:hover:not(:disabled) {
    background: #fee2e2;
    color: #ef4444;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

/* 上传进度条 */
.file-tag-progress {
  height: 2px;
  border-radius: 1px;
  background: #e5e7eb;
  overflow: hidden;
}

.file-tag-progress-bar {
  height: 100%;
  background: #2563eb;
  border-radius: 1px;
  transition: width 0.3s ease;
}

/* ===== 图片预览气泡（Teleport to body，fixed 定位避开 overflow:hidden） ===== */
.file-image-preview {
  max-width: 280px;
  max-height: 240px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 10001;
  background: #ffffff;
  pointer-events: none;

  img {
    display: block;
    max-width: 280px;
    max-height: 240px;
    object-fit: contain;
  }
}

/* ===== 输入行 ===== */
.chat-input-row {
  display: flex;
  gap: 8px;
}

/* ===== 附件按钮 ===== */
.chat-attach-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    border-color: #93c5fd;
    color: #2563eb;
    background: #eff6ff;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

/* ===== 文件卡片（消息气泡中） ===== */
.chat-file-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:last-child { margin-bottom: 0; }

  &:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
  }
}

.file-card-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.file-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-card-name {
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-meta {
  font-size: 11px;
  color: #9ca3af;
}

.file-card-dl {
  font-size: 14px;
  color: #9ca3af;
  flex-shrink: 0;
  transition: color 0.15s;

  .chat-file-card:hover & {
    color: #2563eb;
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
    background: #eff6ff;
    color: #2563eb;
    padding: 4px 8px;
    text-align: left;
    border-bottom: 1px solid #bfdbfe;
    font-weight: 500;
  }
  :deep(td) {
    padding: 3px 8px;
    border-bottom: 1px solid #f3f4f6;
    color: #374151;
  }
  :deep(strong) {
    color: #1f2937;
    font-weight: 600;
  }
  :deep(em) {
    color: #6b7280;
  }
  :deep(code) {
    background: #f3f4f6;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 12px;
    color: #d97706;
  }
  :deep(ul), :deep(ol) {
    margin: 4px 0;
    padding-left: 18px;
  }
  :deep(li) {
    margin: 2px 0;
    color: #374151;
  }
  :deep(p) {
    margin: 0 0 4px;
    &:last-child { margin-bottom: 0; }
  }
  :deep(hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 8px 0;
  }
}
</style>
