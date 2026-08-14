<template>
  <div class="agent-workbench">
    <!-- ===== 左栏：会话列表 ===== -->
    <aside class="col col-left">
      <div class="brand">
        <img class="brand-logo" src="@/assets/agent-robot-chat.svg" alt="logo" />
        <span class="brand-name">韧性AI助手</span>
      </div>

      <button class="new-chat-btn" @click="newSession">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        新建对话
      </button>

      <div class="search-box">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="searchQuery" class="search-input" type="text" placeholder="搜索会话" />
      </div>

      <div class="session-list">
        <template v-for="group in groupedSessions" :key="group.label">
          <div v-if="group.items.length" class="session-group">
            <div class="session-group-label">{{ group.label }}</div>
            <div
              v-for="s in group.items"
              :key="s.id"
              class="session-item"
              :class="{ active: s.id === currentSessionId }"
              @click="switchSession(s.id)"
            >
              <span class="session-dot"></span>
              <span class="session-title">{{ sessionTitle(s) }}</span>
              <span class="session-time">{{ timeLabel(s.updatedAt) }}</span>
            </div>
          </div>
        </template>
        <div v-if="filteredSessions.length === 0" class="session-empty">暂无会话</div>
      </div>

      <div class="user-card">
        <div class="user-avatar">{{ avatarChar }}</div>
        <div class="user-info">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-role">{{ roleLabel }}</div>
        </div>
      </div>
    </aside>

    <!-- ===== 中栏：对话区 ===== -->
    <main class="col col-main">
      <div class="main-header">
        <span class="main-title">{{ currentTitle }}</span>
      </div>

      <div ref="chatScrollRef" class="chat-scroll">
        <div class="chat-inner">
          <!-- 欢迎态 -->
          <div v-if="store.messages.length === 0" class="welcome">
            <div class="welcome-logo">
              <img src="@/assets/agent-robot-chat.svg" alt="AI助手" class="welcome-robot-img" />
            </div>
            <h3 class="welcome-title">你好，有什么可以帮你？</h3>
            <p class="welcome-hint">查询告警、隐患、设备、工单，或生成日报清单</p>
            <div class="welcome-chips">
              <button v-for="chip in quickChips" :key="chip" class="welcome-chip" :disabled="store.isLoading" @click="sendQuick(chip)">{{ chip }}</button>
            </div>
          </div>

          <!-- 消息流 -->
          <template v-else>
            <div v-for="msg in store.messages" :key="msg.id" class="msg" :class="msg.role">
              <div class="msg-avatar" :class="msg.role">
                <template v-if="msg.role === 'assistant'">
                  <img src="@/assets/agent-robot-chat.svg" alt="AI" class="chat-msg-robot-img" />
                </template>
                <template v-else>{{ avatarChar }}</template>
              </div>
              <div class="msg-body">
                <div v-if="msg.role === 'assistant'" class="msg-bubble msg-bubble--md">
                  <span v-if="msg.content" v-html="renderMarkdown(msg.content)"></span>
                  <span v-else class="loading-dots"><span class="ld-dot" v-for="i in 3" :key="i" :style="{ animationDelay: `${(i - 1) * 0.15}s` }"></span></span>
                </div>
                <div v-else class="msg-bubble msg-bubble--user">
                  <div v-for="att in msg.attachments" :key="att.url" class="chat-file-card" @click="openFile(att.url)">
                    <span class="file-card-icon" :style="{ background: fileTypeColor(att.fileName) }">{{ fileTypeLabel(att.fileName) }}</span>
                    <div class="file-card-info">
                      <span class="file-card-name">{{ att.fileName }}</span>
                      <span class="file-card-meta">{{ formatSize(att.fileSize) }}</span>
                    </div>
                  </div>
                  <div v-if="msg.content" class="msg-user-text">{{ msg.content }}</div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="input-wrap">
        <div class="input-box">
          <!-- 已选文件标签（文本输入上方） -->
          <div v-if="pendingUploads.length" class="file-tags">
            <div
              v-for="(u, i) in pendingUploads"
              :key="u.key || u.url"
              class="file-tag"
              @mouseenter="onFileTagEnter(u, $event)"
              @mouseleave="onFileTagLeave"
            >
              <span class="file-tag-type">{{ fileTypeLabel(u.fileName) }}</span>
              <span class="file-tag-name">{{ u.fileName }}</span>
              <span class="file-tag-meta">· {{ formatSize(u.fileSize) }}</span>
              <button class="file-tag-remove" title="移除" @click.stop="removePendingFile(i)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <textarea
            v-model="inputText"
            class="input-area"
            rows="1"
            placeholder="输入问题，Enter 发送，Shift+Enter 换行"
            @keydown.enter.exact.prevent="handleSend"
          ></textarea>

          <div class="input-tools">
            <div class="input-tools-left">
              <button class="tool-btn" title="上传文件" @click="triggerFileInput">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </button>
            </div>
            <button class="send-btn" :disabled="store.isLoading || (!inputText.trim() && !pendingUploads.length)" @click="handleSend">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
        <p class="input-disclaimer">内容由 AI 生成，请核实重要信息</p>
      </div>

      <input ref="fileInputRef" type="file" class="file-input" @change="handleFileSelected" />
    </main>

    <!-- ===== 右栏：调用时间线 / 产物 ===== -->
    <aside class="col col-right">
      <div class="right-tabs">
        <button class="right-tab" :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">
          调用时间线<span v-if="store.debugEvents.length" class="tab-count">{{ store.debugEvents.length }}</span>
        </button>
        <button class="right-tab" :class="{ active: activeTab === 'artifacts' }" @click="activeTab = 'artifacts'">
          产物<span v-if="store.artifacts.length" class="tab-count">{{ store.artifacts.length }}</span>
        </button>
      </div>

      <!-- 时间线 -->
      <div v-if="activeTab === 'timeline'" class="timeline">
        <div v-if="store.debugEvents.length === 0" class="right-empty">
          <p>暂无调用记录</p>
          <p class="right-empty-sub">发送消息后，这里会展示 AI 的每一步调用过程</p>
        </div>
        <div v-for="(ev, i) in store.debugEvents" :key="i" class="tl-node" :class="`io-${ev.io}`">
          <div class="tl-line" :class="{ last: i === store.debugEvents.length - 1 }"></div>
          <div class="tl-dot"></div>
          <div class="tl-content">
            <div class="tl-label">{{ ev.label }}</div>
            <div class="tl-summary">{{ ev.summary }}</div>
            <details v-if="ev.detail" class="tl-detail">
              <summary>详情</summary>
              <pre class="tl-json">{{ formatDetail(ev.detail) }}</pre>
            </details>
          </div>
        </div>
      </div>

      <!-- 产物 -->
      <div v-else class="artifacts">
        <div v-if="store.artifacts.length === 0" class="right-empty">
          <p>暂无产物</p>
          <p class="right-empty-sub">试试说「出个今日告警日报」</p>
        </div>
        <template v-else>
          <div class="artifact-list">
            <button
              v-for="a in store.artifacts"
              :key="a.id"
              class="artifact-item"
              :class="{ active: a.id === activeArtifactId }"
              @click="activeArtifactId = a.id"
            >
              <span class="artifact-type">{{ typeLabel(a.type) }}</span>
              <span class="artifact-title">{{ a.title }}</span>
            </button>
          </div>
          <div class="artifact-preview">
            <iframe v-if="activeArtifact" :srcdoc="activeArtifact.html" class="artifact-iframe" sandbox="allow-same-origin"></iframe>
            <div class="artifact-actions">
              <button class="art-btn" @click="copyArtifact">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                复制
              </button>
              <button class="art-btn" @click="openArtifactNew">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>
                新窗口
              </button>
              <button class="art-btn art-btn-primary" @click="downloadArtifact">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>
                下载
              </button>
            </div>
          </div>
        </template>
      </div>
    </aside>
  </div>

  <!-- 图片悬浮预览（Teleport 到 body，规避父容器 overflow:hidden 截断） -->
  <Teleport to="body">
    <div v-if="showImagePreview" class="file-image-preview" :style="previewStyle">
      <img :src="hoverPreviewUrl" alt="预览" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import { useAiChatStore, type ChatMessage, type FileUploadResult } from '@/stores/ai-chat'
import { useUserStore } from '@/stores/user'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}

const store = useAiChatStore()
const userStore = useUserStore()

const displayName = computed(() => userStore.user?.realName || '用户')
const avatarChar = computed(() => displayName.value.slice(0, 1) || '用')
const roleLabel = computed(() => {
  const r = localStorage.getItem('system-role')
  return r === 'platform-admin' ? '平台管理' : r === 'platform-ops' ? '运营管理' : '安全管理'
})

// ===== 会话列表（localStorage 持久化） =====
interface Session {
  id: string
  messages: ChatMessage[]
  updatedAt: number
}

function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem('agent_sessions') || '[]') as Session[] } catch { return [] }
}
const sessions = ref<Session[]>(loadSessions())
const currentSessionId = ref(sessions.value[0]?.id || '')

function saveSessions() {
  localStorage.setItem('agent_sessions', JSON.stringify(sessions.value))
}

function sessionTitle(s: Session): string {
  const firstUser = s.messages.find(m => m.role === 'user')
  return firstUser && firstUser.content ? firstUser.content.slice(0, 18) : '新对话'
}

function timeLabel(ts: number): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const searchQuery = ref('')
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return sessions.value
  const q = searchQuery.value.trim()
  return sessions.value.filter(s => sessionTitle(s).includes(q))
})

const groupedSessions = computed(() => {
  const today: Session[] = []
  const yesterday: Session[] = []
  const earlier: Session[] = []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfYesterday = startOfToday - 86400000
  for (const s of filteredSessions.value) {
    if (s.updatedAt >= startOfToday) today.push(s)
    else if (s.updatedAt >= startOfYesterday) yesterday.push(s)
    else earlier.push(s)
  }
  return [
    { label: '今天', items: today },
    { label: '昨天', items: yesterday },
    { label: '更早', items: earlier },
  ]
})

const currentTitle = computed(() => {
  const cur = sessions.value.find(s => s.id === currentSessionId.value)
  return cur ? sessionTitle(cur) : '新对话'
})

function persistCurrentSession() {
  const cur = sessions.value.find(s => s.id === currentSessionId.value)
  if (cur) {
    cur.messages = [...store.messages]
    cur.updatedAt = Date.now()
  }
}

function newSession() {
  persistCurrentSession()
  const id = 's' + Date.now()
  sessions.value.unshift({ id, messages: [], updatedAt: Date.now() })
  currentSessionId.value = id
  store.reset()
  inputText.value = ''
  pendingUploads.value = []
  saveSessions()
}

function switchSession(id: string) {
  if (id === currentSessionId.value) return
  persistCurrentSession()
  currentSessionId.value = id
  const target = sessions.value.find(s => s.id === id)
  store.messages = target ? [...target.messages] : []
  store.artifacts = []
  store.debugEvents = []
  store.isLoading = false
  inputText.value = ''
  pendingUploads.value = []
  saveSessions()
}

// ===== 快捷指令 =====
const quickChips = [
  '今天有几条未处理的告警',
  '列出未整改的隐患',
  '哪些设备离线了',
  '我的工单情况',
  '出个今日告警日报',
]

// ===== 输入与发送 =====
const inputText = ref('')
const chatScrollRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingUploads = ref<FileUploadResult[]>([])

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  ;(e.target as HTMLInputElement).value = ''
  if (!file) return
  try {
    const result = await store.uploadFile(file)
    pendingUploads.value.push(result)
  } catch (err: any) {
    // 上传失败静默处理，不打断输入
    console.error('[agent] 上传失败:', err?.message)
  }
}

function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
}

function fileTypeColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return '#e5484d'
  if (['doc', 'docx'].includes(ext)) return '#2f6fed'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '#30a46c'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '#8e4ec6'
  if (['zip', 'rar', '7z'].includes(ext)) return '#f5a623'
  return '#64748b'
}

function fileTypeLabel(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    pdf: 'PDF', txt: 'TXT', md: 'MD', json: 'JSON',
    jpg: 'JPG', jpeg: 'JPEG', png: 'PNG', gif: 'GIF', webp: 'WEBP',
  }
  return map[ext] || ext.toUpperCase()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function openFile(url: string) {
  window.open(url, '_blank')
}

function removePendingFile(index: number) {
  pendingUploads.value.splice(index, 1)
}

// ===== 图片悬浮预览（Teleport 到 body，规避 overflow:hidden） =====
const showImagePreview = ref(false)
const hoverPreviewUrl = ref('')
const previewStyle = ref<Record<string, string>>({})
let previewTimer: ReturnType<typeof setTimeout> | null = null

function onFileTagEnter(u: FileUploadResult, e: MouseEvent) {
  if (!isImageFile(u.fileName)) return
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    previewStyle.value = {
      position: 'fixed',
      bottom: `${window.innerHeight - rect.top + 10}px`,
      left: `${rect.left + rect.width / 2}px`,
      transform: 'translateX(-50%)',
    }
    hoverPreviewUrl.value = u.url
    showImagePreview.value = true
  }, 600)
}

function onFileTagLeave() {
  if (previewTimer) clearTimeout(previewTimer)
  showImagePreview.value = false
}

function sendQuick(text: string) {
  inputText.value = text
  handleSend()
}

async function handleSend() {
  const text = inputText.value
  if ((!text.trim() && !pendingUploads.value.length) || store.isLoading) return
  inputText.value = ''
  const uploads = [...pendingUploads.value]
  pendingUploads.value = []
  await store.sendMessage(text, uploads.map(u => ({ url: u.url, fileName: u.fileName, fileType: u.fileType, fileSize: u.fileSize })), uploads)
  persistCurrentSession()
  saveSessions()
}

// ===== 自动滚动到底部 =====
watch(
  () => store.messages.length,
  async () => {
    await nextTick()
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }
  },
)

// ===== 右栏：时间线 / 产物 =====
const activeTab = ref<'timeline' | 'artifacts'>('timeline')
const activeArtifactId = ref('')

const activeArtifact = computed(() => {
  return store.artifacts.find(a => a.id === activeArtifactId.value) || store.artifacts[0] || null
})

// 有新产物时自动选中第一个
watch(
  () => store.artifacts.length,
  (len) => {
    if (len > 0) {
      activeArtifactId.value = store.artifacts[len - 1].id
      activeTab.value = 'artifacts'
    }
  },
)

function typeLabel(t: string): string {
  return ({ 'alarm-report': '日报', 'hazard-list': '清单', 'order-weekly': '汇总' } as Record<string, string>)[t] || t
}

function formatDetail(detail: any): string {
  try { return JSON.stringify(detail, null, 2) } catch { return String(detail) }
}

function copyArtifact() {
  if (!activeArtifact.value) return
  navigator.clipboard.writeText(activeArtifact.value.html).catch(() => {})
}

function openArtifactNew() {
  if (!activeArtifact.value) return
  const blob = new Blob([activeArtifact.value.html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

function downloadArtifact() {
  if (!activeArtifact.value) return
  const blob = new Blob([activeArtifact.value.html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activeArtifact.value.title}.html`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.agent-workbench {
  --bg-0: #0e1013;
  --bg-1: #16191f;
  --bg-2: #1d2129;
  --bg-3: #252a34;
  --text-1: #eceef2;
  --text-2: #9aa1ad;
  --text-3: #8b93a3;
  --accent: #5b9bff;
  --accent-strong: #3b76f6;
  --accent-soft: rgba(91, 155, 255, 0.14);
  --green: #34d399;
  --red: #f87171;

  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  gap: 10px;
  padding: 10px;
  background: var(--bg-0);
  color: var(--text-1);
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

.col {
  background: var(--bg-1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.col-left { width: 268px; flex: none; }
.col-main { flex: 1; min-width: 0; }
.col-right { width: 330px; flex: none; }

/* ===== 左栏 ===== */
.brand { display: flex; align-items: center; gap: 9px; padding: 18px 16px 10px; }
.brand-logo { width: 22px; height: 22px; object-fit: contain; flex: none; }
.brand-name { font-size: 15px; font-weight: 600; }

.new-chat-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  margin: 4px 12px 10px; height: 38px;
  border: none; border-radius: 10px;
  background: var(--accent-strong); color: #fff;
  font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: filter .12s;
}
.new-chat-btn:hover { filter: brightness(1.12); }

.search-box { position: relative; padding: 0 14px 8px; }
.search-input {
  width: 100%; height: 34px; box-sizing: border-box;
  border: none; border-radius: 8px;
  background: var(--bg-3); color: var(--text-1);
  padding: 0 10px 0 33px; font-size: 13px; outline: none;
}
.search-input::placeholder { color: var(--text-3); }
.search-icon { position: absolute; left: 25px; top: 10px; color: var(--text-3); pointer-events: none; }

.session-list { flex: 1; overflow-y: auto; padding: 2px 10px 10px; }
.session-list::-webkit-scrollbar { display: none; }
.session-group-label { font-size: 12px; color: var(--text-3); padding: 10px 8px 6px; }
.session-item {
  position: relative; display: flex; align-items: center;
  height: 38px; padding: 0 10px 0 12px; margin-bottom: 2px;
  border-radius: 8px; cursor: pointer;
}
.session-item:hover { background: var(--bg-2); }
.session-item.active { background: var(--bg-3); }
.session-title { flex: 1; font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-item.active .session-title { color: var(--text-1); font-weight: 500; }
.session-time { font-size: 11px; color: var(--text-3); flex: none; margin-left: 8px; }
.session-dot { display: none; }
.session-item.active .session-dot {
  display: block; width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); position: absolute; left: 3px; top: 50%; transform: translateY(-50%);
}
.session-empty { font-size: 13px; color: var(--text-3); text-align: center; padding: 30px 0; }

.user-card {
  flex: none; display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; margin: 0 10px 10px;
  border-radius: 10px; background: var(--bg-2);
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex: none;
  background: var(--accent-strong); color: #fff;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.user-name { font-size: 13px; font-weight: 500; }
.user-role { font-size: 11px; color: var(--text-3); margin-top: 1px; }

/* ===== 中栏 ===== */
.main-header { height: 58px; flex: none; display: flex; align-items: center; padding: 0 22px; }
.main-title { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-scroll { flex: 1; overflow-y: auto; }
.chat-scroll::-webkit-scrollbar { display: none; }
.chat-inner { max-width: 780px; margin: 0 auto; padding: 16px 28px 8px; }

.welcome { text-align: center; padding: 40px 0 20px; }
.welcome-logo { margin: 0 auto 16px; }
.welcome-robot-img { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto; }
.welcome-title { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.welcome-hint { font-size: 13px; color: var(--text-3); margin: 0 0 24px; }
.welcome-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.welcome-chip {
  padding: 8px 14px; border-radius: 999px;
  border: 1px solid rgba(91, 155, 255, 0.25);
  background: transparent; color: var(--text-2);
  font-size: 13px; cursor: pointer; transition: all .15s;
}
.welcome-chip:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.welcome-chip:disabled { opacity: .5; cursor: not-allowed; }

.msg { display: flex; gap: 10px; margin-bottom: 20px; }
.msg.user { flex-direction: row-reverse; }
.msg-avatar {
  width: 30px; height: 30px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; overflow: hidden;
}
.msg-avatar.assistant { background: var(--accent-soft); color: var(--accent); }
.msg-avatar.user { background: var(--accent-strong); color: #fff; }
.chat-msg-robot-img { width: 22px; height: 22px; object-fit: contain; }
.msg-body { max-width: 82%; min-width: 0; }
.msg-bubble {
  padding: 11px 14px; font-size: 13.5px; line-height: 1.7;
  border-radius: 12px; word-break: break-word;
}
.msg.user .msg-bubble--user { background: rgba(91, 155, 255, 0.22); color: #eaf1ff; border-radius: 12px 12px 4px 12px; }
.msg.assistant .msg-bubble--md { background: var(--bg-2); color: var(--text-1); border-radius: 12px 12px 12px 4px; }

/* 用户消息里的文件附件卡片 */
.chat-file-card {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px; margin-bottom: 6px;
  border-radius: 8px; background: rgba(0, 0, 0, 0.18);
  cursor: pointer; transition: background .12s;
}
.chat-file-card:hover { background: rgba(0, 0, 0, 0.28); }
.chat-file-card:last-child { margin-bottom: 0; }
.file-card-icon {
  flex: none; width: 34px; height: 34px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff;
}
.file-card-info { display: flex; flex-direction: column; min-width: 0; }
.file-card-name { font-size: 12px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-card-meta { font-size: 11px; color: rgba(255, 255, 255, 0.65); }
.msg-user-text { margin-top: 6px; white-space: pre-wrap; word-break: break-word; }

/* Markdown 渲染 */
.msg-bubble--md :deep(p) { margin: 0 0 8px; }
.msg-bubble--md :deep(p:last-child) { margin-bottom: 0; }
.msg-bubble--md :deep(ul), .msg-bubble--md :deep(ol) { margin: 4px 0; padding-left: 20px; }
.msg-bubble--md :deep(code) { background: var(--bg-3); padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
.msg-bubble--md :deep(pre) { background: var(--bg-3); padding: 12px; border-radius: 8px; overflow-x: auto; }
.msg-bubble--md :deep(pre code) { background: transparent; padding: 0; }
.msg-bubble--md :deep(table) { border-collapse: collapse; margin: 8px 0; width: 100%; font-size: 12.5px; }
.msg-bubble--md :deep(th), .msg-bubble--md :deep(td) { border: 1px solid var(--bg-3); padding: 6px 10px; text-align: left; }
.msg-bubble--md :deep(th) { background: var(--bg-3); }
.msg-bubble--md :deep(strong) { color: var(--text-1); }

.loading-dots { display: inline-flex; gap: 4px; padding: 4px 0; }
.ld-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-3); animation: ld-bounce 1s infinite; }
@keyframes ld-bounce { 0%, 100% { opacity: .3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-4px); } }

/* ===== 输入区 ===== */
.input-wrap { flex: none; padding: 10px 22px 14px; }
.input-box {
  background: var(--bg-2); border-radius: 14px;
  border: 1px solid transparent; padding: 12px 14px 10px;
  transition: border-color .15s;
}
.input-box:focus-within { border-color: var(--accent); }
.input-area {
  width: 100%; border: none; background: transparent; resize: none;
  color: var(--text-1); font-size: 14px; line-height: 1.6; outline: none;
  font-family: inherit; max-height: 140px;
}
.input-area::placeholder { color: var(--text-3); }
.input-tools { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
.input-tools-left { display: flex; align-items: center; gap: 10px; }
.tool-btn {
  width: 30px; height: 30px; border: none; border-radius: 8px;
  background: transparent; color: var(--text-3);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: all .12s;
}
.tool-btn:hover { background: var(--bg-3); color: var(--text-1); }
/* 已选文件标签 */
.file-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.file-tag {
  display: inline-flex; align-items: center; gap: 6px;
  max-width: 100%; padding: 5px 10px;
  border-radius: 8px; background: var(--bg-3);
  font-size: 12px; color: var(--text-2);
}
.file-tag-type {
  flex: none; padding: 1px 6px; border-radius: 4px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 10.5px; font-weight: 600;
}
.file-tag-name { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-tag-meta { color: var(--text-3); flex: none; }
.file-tag-remove {
  flex: none; width: 16px; height: 16px; border: none; border-radius: 4px;
  background: transparent; color: var(--text-3);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.file-tag-remove:hover { background: var(--bg-2); color: var(--text-1); }
.send-btn {
  width: 34px; height: 34px; border: none; border-radius: 10px;
  background: var(--accent-strong); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  transition: filter .12s;
}
.send-btn:hover:not(:disabled) { filter: brightness(1.12); }
.send-btn:disabled { opacity: .4; cursor: not-allowed; }
.input-disclaimer { font-size: 11.5px; color: var(--text-3); text-align: center; margin: 8px 0 0; }
.file-input { display: none; }

/* ===== 右栏 ===== */
.right-tabs { flex: none; display: flex; gap: 6px; padding: 14px 14px 10px; }
.right-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; border: none; border-radius: 16px;
  background: transparent; color: var(--text-3);
  font-size: 13px; cursor: pointer; transition: all .15s;
}
.right-tab.active { background: var(--bg-3); color: var(--text-1); font-weight: 500; }
.tab-count {
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 11px; display: flex; align-items: center; justify-content: center;
}

.right-empty { text-align: center; padding: 50px 20px; }
.right-empty p { margin: 0 0 6px; font-size: 13.5px; color: var(--text-2); }
.right-empty-sub { font-size: 12px !important; color: var(--text-3) !important; line-height: 1.6; }

/* 时间线 */
.timeline { flex: 1; overflow-y: auto; padding: 4px 16px 16px; }
.timeline::-webkit-scrollbar { display: none; }
.tl-node { position: relative; display: flex; gap: 12px; padding-bottom: 18px; }
.tl-line { position: absolute; left: 5px; top: 16px; bottom: 0; width: 2px; background: var(--bg-3); }
.tl-line.last { display: none; }
.tl-dot {
  position: relative; z-index: 1; flex: none;
  width: 12px; height: 12px; border-radius: 50%; margin-top: 3px;
  background: var(--bg-3); border: 2px solid var(--text-3);
}
.io-input .tl-dot { border-color: var(--accent); background: var(--accent); }
.io-output .tl-dot { border-color: var(--green); background: var(--green); }
.io-error .tl-dot { border-color: var(--red); background: var(--red); }
.io-info .tl-dot { border-color: var(--text-3); background: var(--text-3); }
.tl-content { flex: 1; min-width: 0; }
.tl-label { font-size: 13px; font-weight: 500; color: var(--text-1); }
.tl-summary { font-size: 12px; color: var(--text-3); margin-top: 3px; line-height: 1.5; word-break: break-word; }
.tl-detail { margin-top: 6px; }
.tl-detail summary { font-size: 12px; color: var(--accent); cursor: pointer; }
.tl-json {
  margin: 6px 0 0; padding: 8px; border-radius: 8px;
  background: var(--bg-2); color: var(--text-2);
  font-size: 11px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-all;
}

/* 产物 */
.artifacts { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 4px 14px 14px; }
.artifact-list { flex: none; display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.artifact-item {
  display: flex; align-items: center; gap: 8px; padding: 9px 12px;
  border: none; border-radius: 9px; background: transparent; cursor: pointer;
  text-align: left; transition: background .12s;
}
.artifact-item:hover { background: var(--bg-2); }
.artifact-item.active { background: var(--bg-3); }
.artifact-type {
  flex: none; font-size: 11px; padding: 2px 7px; border-radius: 5px;
  background: var(--accent-soft); color: var(--accent);
}
.artifact-title { font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.artifact-item.active .artifact-title { color: var(--text-1); }
.artifact-preview { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.artifact-iframe {
  flex: 1; min-height: 0; border: none; border-radius: 10px;
  background: #fff; width: 100%;
}
.artifact-actions { flex: none; display: flex; gap: 6px; padding-top: 10px; }
.art-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
  height: 32px; border: none; border-radius: 8px;
  background: var(--bg-2); color: var(--text-2); font-size: 12px; cursor: pointer;
  transition: all .12s;
}
.art-btn:hover { background: var(--bg-3); color: var(--text-1); }
.art-btn-primary { background: var(--accent-soft); color: var(--accent); }
.art-btn-primary:hover { background: var(--accent); color: #fff; }

/* ===== 图片悬浮预览气泡（Teleport 到 body） ===== */
.file-image-preview {
  z-index: 9999; pointer-events: none;
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  background: var(--bg-1);
}
.file-image-preview img { display: block; max-width: 260px; max-height: 200px; object-fit: contain; }
</style>
