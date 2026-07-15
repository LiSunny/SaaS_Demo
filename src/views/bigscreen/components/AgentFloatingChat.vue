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
              :disabled="isUploading"
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
        </div>
      </div>
      </div>
    </div>

    <!-- 图片预览气泡（Teleport 到 body，规避父容器 overflow:hidden 截断） -->
    <div v-if="showImagePreview && isImageFile(pendingFile?.name || '')" class="file-image-preview" :style="previewStyle">
      <img :src="pendingPreviewUrl" :alt="pendingFile?.name" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'

// 配置 marked
marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}
import { useAiChatStore, type FileAttachment, type FileUploadResult } from '@/stores/ai-chat'

const store = useAiChatStore()
const router = useRouter()
const inputText = ref('')
const bodyRef = ref<HTMLElement | null>(null)
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
  if (previewTimer) clearTimeout(previewTimer)
  if (pendingPreviewUrl.value) URL.revokeObjectURL(pendingPreviewUrl.value)
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
  flex-direction: column;
  gap: 0;
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
  background: rgba(86, 240, 244, 0.1);
  font-size: 12px;
  position: relative;
  transition: background 0.15s;

  &:hover {
    background: rgba(86, 240, 244, 0.16);
  }
}

.file-tag-type {
  color: #5a8aaa;
  background: rgba(86, 240, 244, 0.15);
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
  border: 2px solid rgba(86, 240, 244, 0.2);
  border-top-color: #56f0f4;
  border-radius: 50%;
  flex-shrink: 0;
  animation: tag-spin 0.8s linear infinite;
}

@keyframes tag-spin {
  to { transform: rotate(360deg); }
}

/* 上传完成状态 */
.file-tag.is-done {
  .file-tag-type { background: rgba(86, 240, 244, 0.2); color: #56f0f4; }
}

.file-tag-name {
  color: #c8e4ff;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-tag-meta {
  color: #5a7a9a;
  font-size: 11px;
  flex-shrink: 0;
}

.file-tag-remove {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #7a9bb5;
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
    background: rgba(255, 71, 87, 0.25);
    color: #ff6b7a;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

/* 上传进度条 */
.file-tag-progress {
  height: 2px;
  border-radius: 1px;
  background: rgba(86, 240, 244, 0.1);
  overflow: hidden;
}

.file-tag-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(86, 240, 244, 0.6), #56f0f4);
  border-radius: 1px;
  transition: width 0.3s ease;
}

/* ===== 图片预览气泡（Teleport to body，fixed 定位避开 overflow:hidden） ===== */
.file-image-preview {
  max-width: 280px;
  max-height: 240px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(86, 240, 244, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 10001;
  background: rgba(0, 24, 52, 0.96);
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
  border: 1px solid rgba(86, 240, 244, 0.2);
  background: rgba(255, 255, 255, 0.04);
  color: #7a9bb5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(86, 240, 244, 0.4);
    color: #56f0f4;
    background: rgba(86, 240, 244, 0.08);
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:last-child { margin-bottom: 0; }

  &:hover {
    background: rgba(86, 240, 244, 0.1);
    border-color: rgba(86, 240, 244, 0.25);
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
  color: #c8dff0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-meta {
  font-size: 11px;
  color: #6a8ea8;
}

.file-card-dl {
  font-size: 14px;
  color: #6a8ea8;
  flex-shrink: 0;
  transition: color 0.15s;

  .chat-file-card:hover & {
    color: #56f0f4;
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
