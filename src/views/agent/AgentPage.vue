<template>
  <div class="agent-workbench" :class="{ light: !isDark }">
    <!-- ===== 左栏：会话列表 ===== -->
    <aside class="col col-left" :class="{ collapsed: leftCollapsed }" :style="{ width: leftCollapsed ? 0 : leftWidth + 'px' }">
      <div class="brand">
        <img class="brand-logo" src="@/assets/agent-robot-chat.svg" alt="logo" />
        <span class="brand-name">小安助手</span>
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
          <div class="user-role">{{ orgLabel }}</div>
        </div>
        <button v-if="isExpMode && userStore.isLoggedIn" class="switch-role-btn" title="切换体验身份" @click="roleDialogVisible = true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
        </button>
      </div>
    </aside>

    <!-- 左栏拖拽分隔条 -->
    <div
      v-if="!leftCollapsed"
      class="col-divider"
      :class="{ resizing: resizing === 'left' }"
      title="拖拽调整宽度"
      @mousedown="startResize('left', $event)"
    ></div>

    <!-- ===== 中栏：对话区 ===== -->
    <main class="col col-main">
      <div class="main-header">
        <button
          class="col-expand-btn"
          :class="{ active: !leftCollapsed }"
          :title="leftCollapsed ? '展开会话列表' : '收起会话列表'"
          @click="leftCollapsed = !leftCollapsed"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="14" x="4" y="5" rx="2" /><path d="M9.5 5v14" /></svg>
        </button>
        <span class="main-title">{{ currentTitle }}</span>
        <!-- 深色 / 浅色切换 -->
        <button class="theme-toggle" :class="{ light: !isDark }" :title="isDark ? '切换到浅色模式' : '切换到深色模式'" @click="toggleTheme">
          <span class="tt-thumb">
            <svg v-if="isDark" class="tt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            <svg v-else class="tt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
          </span>
        </button>
        <button
          class="col-expand-btn"
          :class="{ active: !rightCollapsed }"
          :title="rightCollapsed ? '展开时间线与产物' : '收起时间线与产物'"
          @click="rightCollapsed = !rightCollapsed"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="14" x="4" y="5" rx="2" /><path d="M14.5 5v14" /></svg>
        </button>
      </div>

      <div class="chat-wrap">
        <div ref="chatScrollRef" class="chat-scroll" @scroll="onChatScroll">
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

    <!-- 右栏拖拽分隔条 -->
    <div
      v-if="!rightCollapsed"
      class="col-divider"
      :class="{ resizing: resizing === 'right' }"
      title="拖拽调整宽度"
      @mousedown="startResize('right', $event)"
    ></div>

    <!-- ===== 右栏：调用时间线 / 产物 ===== -->
    <aside class="col col-right" :class="{ collapsed: rightCollapsed }" :style="{ width: rightCollapsed ? 0 : rightWidth + 'px' }">
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
        <div v-for="(ev, i) in store.debugEvents" :key="i" class="tl-node" :class="[`io-${ev.io}`, nodeClass(ev.node)]">
          <div class="tl-line" :class="{ last: i === store.debugEvents.length - 1 }"></div>
          <div class="tl-dot">
            <svg v-if="nodeIcon(ev.node)" class="tl-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="nodeIcon(ev.node)"></svg>
            <span v-else class="tl-dot-blank"></span>
          </div>
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

    <!-- 手机端侧栏展开时的点击关闭遮罩（点非展开区域收起侧栏） -->
    <div
      v-if="isNarrow() && (!leftCollapsed || !rightCollapsed)"
      class="side-overlay"
      @click="leftCollapsed = true; rightCollapsed = true"
    ></div>

    <!-- 体验身份选择弹窗（未登录必选不可关闭；体验模式下可随时切换身份） -->
    <!-- ⚠️ 必须放在 .agent-workbench 内部：fixed 定位不受 overflow:hidden 裁剪，且能继承深/浅色 CSS 变量 -->
    <div v-if="roleDialogVisible" class="role-dialog-mask">
      <div class="role-dialog">
        <div class="role-dialog-header">
          <div class="role-dialog-logo">
            <img src="@/assets/agent-robot-chat.svg" alt="小安助手" />
          </div>
          <h3 class="role-dialog-title">选择体验身份</h3>
          <p class="role-dialog-sub">不同身份看到的告警、隐患、设备数据范围不同，选择后即可开始对话</p>
        </div>
        <div class="role-grid">
          <button
            v-for="acc in ACTIVE_DEMO_ACCOUNTS"
            :key="acc.role"
            class="role-card"
            :class="{ loading: pickingRole === acc.role }"
            :disabled="roleLoggingIn"
            @click="pickRole(acc)"
          >
            <img class="role-card-img" :src="acc.image" :alt="acc.role" />
            <span class="role-card-name">{{ acc.role }}</span>
            <span class="role-card-desc">{{ acc.desc }}</span>
          </button>
        </div>
        <p v-if="roleLoggingIn" class="role-dialog-loading">正在以「{{ pickingRole }}」身份进入…</p>
        <p v-else class="role-dialog-hint">选择身份即代表同意《用户协议》和《隐私政策》</p>
      </div>
    </div>
  </div>

  <!-- 图片悬浮预览（Teleport 到 body，规避父容器 overflow:hidden 截断） -->
  <Teleport to="body">
    <div v-if="showImagePreview" class="file-image-preview" :style="previewStyle">
      <img :src="hoverPreviewUrl" alt="预览" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { useAiChatStore, type ChatMessage, type FileUploadResult } from '@/stores/ai-chat'
import { useUserStore } from '@/stores/user'
import { loginApi } from '@/api/auth'
import { ACTIVE_DEMO_ACCOUNTS, type DemoAccount } from '@/config/demo-accounts'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}

const store = useAiChatStore()
const userStore = useUserStore()

const displayName = computed(() => userStore.user?.realName || '用户')
const avatarChar = computed(() => displayName.value.slice(0, 1) || '用')
const orgLabel = computed(() => {
  const u = userStore.user
  if (u?.enterpriseName) return u.enterpriseName
  const r = u?.systemRole || localStorage.getItem('system-role')
  return r === 'platform-admin' ? '平台管理' : r === 'platform-ops' ? '运营管理' : '安全管理'
})

// ===== 体验模式（介绍页 /agent?exp=1 进入）=====
// 未登录访问 /agent → 强制弹「选择体验身份」（不可关闭，选完才可对话）
// 体验模式下左下角用户卡提供「切换身份」，可随时换账号再体验
const route = useRoute()
const isExpMode = computed(() => route.query.exp === '1')
const roleDialogVisible = ref(false)
const roleLoggingIn = ref(false)
const pickingRole = ref('')

/** 身份切换完成后：会话 key 按 userId 隔离 → 重读新用户会话并恢复最近一条 */
function afterIdentityChange() {
  sessions.value = loadSessions()
  currentSessionId.value = sessions.value[0]?.id || ''
  const first = sessions.value[0]
  if (first) {
    store.messages = [...first.messages]
  } else {
    store.reset()
  }
  store.artifacts = []
  store.debugEvents = []
  store.isLoading = false
  inputText.value = ''
  pendingUploads.value = []
}

async function pickRole(acc: DemoAccount) {
  if (roleLoggingIn.value) return
  roleLoggingIn.value = true
  pickingRole.value = acc.role
  try {
    const res = await loginApi({ phone: acc.phone, password: acc.password })
    // 切换前先落盘旧用户会话（旧 key）
    persistCurrentSession()
    saveSessions()
    userStore.setLogin(res.token, res.user)
    afterIdentityChange()
    roleDialogVisible.value = false
    ElMessage.success(`${acc.role} · 登录成功`)
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || err?.message || '登录失败，请重试')
  } finally {
    roleLoggingIn.value = false
    pickingRole.value = ''
  }
}

// 未登录访问工作台 → 强制先选体验身份（弹窗不可关闭）
if (!userStore.isLoggedIn) {
  roleDialogVisible.value = true
}

// ===== 深色 / 浅色主题（localStorage 持久化，默认深色） =====
const isDark = ref(localStorage.getItem('agent_theme') !== 'light')
function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('agent_theme', isDark.value ? 'dark' : 'light')
}

// ===== 会话列表（localStorage 持久化，key 按用户隔离，切换账号互不可见） =====
interface Session {
  id: string
  messages: ChatMessage[]
  updatedAt: number
}

function sessionKey(): string {
  return `agent_sessions_${userStore.user?.id || 'guest'}`
}

function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(sessionKey()) || '[]') as Session[] } catch { return [] }
}
const sessions = ref<Session[]>(loadSessions())
const currentSessionId = ref(sessions.value[0]?.id || '')
// 刷新后自动恢复最近会话到对话区（避免「数据丢了」的错觉；右栏时间线/产物为内存态，刷新即空）
const restoredSession = sessions.value[0]
if (restoredSession) {
  store.messages = [...restoredSession.messages]
  store.artifacts = []
  store.debugEvents = []
  store.isLoading = false
}

function saveSessions() {
  localStorage.setItem(sessionKey(), JSON.stringify(sessions.value))
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

// ===== 快捷指令（按登录角色定制，与角色定位 + 数据权限匹配，避免答不出数据） =====
// 运营管理(operator)/服务机构(service) 的授权扩展（S4/S5）实现前已被体验入口屏蔽，此处预留，实现后启用
const CHIPS = {
  /** 监管机构：辖区关系树（本企业 + 下级/辖区） */
  regulator: ['辖区有哪些告警？', '列出辖区未整改的隐患', '辖区哪些企业有设备离线？'],
  /** 社会单位：本企业数据 */
  unit: ['我们单位有哪些告警？', '列出我们未整改的隐患', '哪些设备离线了？'],
  /** 运营管理（预留，S5 授权单位实现后启用） */
  operator: ['我服务的单位有哪些告警？', '列出我托管单位的隐患清单', '我负责的单位哪些设备离线？'],
  /** 服务机构（预留，S4 授权只读实现后启用） */
  service: ['我的工单情况', '列出我授权的企业隐患', '最近有哪些待处理的工单？'],
  /** 平台管理：租户 / 用户 / 系统配置视角（全量） */
  platform: ['当前平台接入了多少租户？', '各行业租户分布怎么样？', '平台有多少个用户账号？', '列出平台全部租户'],
  /** 默认（非四方角色）：本企业视角 */
  default: ['我们单位有哪些告警？', '列出我们未整改的隐患', '哪些设备离线了？'],
}
const quickChips = computed(() => {
  const u = userStore.user
  const role = u?.systemRole || ''
  if (role === 'platform-ops' || role === 'platform-admin') return CHIPS.platform
  const groups: string[] = Array.isArray(u?.groups) ? u.groups : []
  if (groups.includes('regulator')) return CHIPS.regulator
  if (groups.includes('operator')) return CHIPS.operator
  if (groups.includes('service')) return CHIPS.service
  if (groups.includes('unit')) return CHIPS.unit
  return CHIPS.default
})

// ===== 输入与发送 =====
const inputText = ref('')
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

/** 发送前确保存在当前会话（首次消息自动创建，否则 persist 找不到会话写不进 localStorage） */
function ensureCurrentSession(): void {
  const cur = sessions.value.find(s => s.id === currentSessionId.value)
  if (cur) return
  const id = 's' + Date.now()
  sessions.value.unshift({ id, messages: [], updatedAt: Date.now() })
  currentSessionId.value = id
}

async function handleSend() {
  const text = inputText.value
  if ((!text.trim() && !pendingUploads.value.length) || store.isLoading) return
  ensureCurrentSession()
  inputText.value = ''
  const uploads = [...pendingUploads.value]
  pendingUploads.value = []
  await store.sendMessage(text, uploads.map(u => ({ url: u.url, fileName: u.fileName, fileType: u.fileType, fileSize: u.fileSize })), uploads)
  persistCurrentSession()
  saveSessions()
}

// ===== 自动滚动到底部（用户在底部才跟随，否则提示按钮） =====
const chatScrollRef = ref<HTMLElement | null>(null)
const showScrollBottom = ref(false)
let followBottom = true

function isNearBottom(): boolean {
  const el = chatScrollRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

function onChatScroll() {
  showScrollBottom.value = !isNearBottom()
  if (isNearBottom()) followBottom = true
}

watch(
  () => store.messages.map(m => m.content).join(''),
  async () => {
    await nextTick()
    if (followBottom && chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }
  },
)

// ===== 三栏布局：折叠 / 拖拽调宽 =====
// 手机端(<768px)默认折叠左右两栏,保证对话区可用;窗口跨阈值时自动同步折叠状态
const isNarrow = () => window.innerWidth < 768
const leftWidth = ref(268)
const rightWidth = ref(330)
const leftCollapsed = ref(isNarrow())
const rightCollapsed = ref(isNarrow())
const resizing = ref<'left' | 'right' | null>(null)

let prevNarrow = isNarrow()
function onWindowResize() {
  const narrow = isNarrow()
  if (narrow !== prevNarrow) {
    prevNarrow = narrow
    leftCollapsed.value = narrow
    rightCollapsed.value = narrow
  }
}
window.addEventListener('resize', onWindowResize)
onUnmounted(() => window.removeEventListener('resize', onWindowResize))

function startResize(side: 'left' | 'right', e: MouseEvent) {
  e.preventDefault()
  resizing.value = side
  const startX = e.clientX
  const startW = side === 'left' ? leftWidth.value : rightWidth.value

  function onMove(ev: MouseEvent) {
    const dx = ev.clientX - startX
    if (side === 'left') {
      leftWidth.value = Math.min(380, Math.max(180, startW + dx))
    } else {
      rightWidth.value = Math.min(460, Math.max(220, startW - dx))
    }
  }
  function onUp() {
    resizing.value = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

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

// ===== 时间线节点图标（线性 SVG，替代 emoji） =====
const NODE_ICONS: Record<string, string> = {
  request: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  system_prompt: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  llm_call_1: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
  llm_call_1_response: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
  llm_call_2: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
  llm_call_2_response: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
  llm_direct: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
  llm_direct_response: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
  tool_exec: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  artifact_intent: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  artifact_data: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  artifact_generated: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  done: '<polyline points="20 6 9 17 4 12"/>',
  llm_error: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  fallback: '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
}
function nodeIcon(node: string): string {
  if (NODE_ICONS[node]) return NODE_ICONS[node]
  if (node.startsWith('fallback')) return NODE_ICONS.fallback
  const base = node.replace(/_response$/, '')
  return NODE_ICONS[base] || ''
}

/** 时间线节点分类（模型/工具统一语义色） */
function nodeClass(node: string): string {
  if (node.startsWith('llm')) return 'node-llm'
  if (node === 'tool_exec') return 'node-tool'
  if (node === 'done') return 'node-done'
  return ''
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
  --accent-rgb: 91, 155, 255;
  --green: #34d399;
  --red: #f87171;
  --violet: #a78bfa;
  --file-card-bg: rgba(0, 0, 0, 0.18);
  --file-card-bg-hover: rgba(0, 0, 0, 0.28);
  --user-bubble-bg: rgba(91, 155, 255, 0.22);
  --user-bubble-color: #eaf1ff;

  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  gap: 6px;
  padding: 10px;
  background:
    radial-gradient(1100px 560px at 12% -12%, rgba(91, 155, 255, 0.09), transparent 62%),
    radial-gradient(900px 480px at 96% 112%, rgba(99, 102, 241, 0.07), transparent 62%),
    radial-gradient(700px 400px at 80% -8%, rgba(52, 211, 153, 0.04), transparent 60%),
    var(--bg-0);
  color: var(--text-1);
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

/* ===== 浅色模式 ===== */
.agent-workbench.light {
  --bg-0: #eef1f6;
  --bg-1: #ffffff;
  --bg-2: #f3f5f9;
  --bg-3: #e6ebf2;
  --text-1: #1e293b;
  --text-2: #475569;
  --text-3: #64748b;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: rgba(37, 99, 235, 0.10);
  --accent-rgb: 37, 99, 235;
  --green: #059669;
  --red: #dc2626;
  --violet: #7c3aed;
  --file-card-bg: rgba(0, 0, 0, 0.05);
  --file-card-bg-hover: rgba(0, 0, 0, 0.08);
  --user-bubble-bg: rgba(37, 99, 235, 0.12);
  --user-bubble-color: #1e293b;

  background:
    radial-gradient(1100px 560px at 12% -12%, rgba(37, 99, 235, 0.07), transparent 62%),
    radial-gradient(900px 480px at 96% 112%, rgba(99, 102, 241, 0.05), transparent 62%),
    var(--bg-0);
}

.col {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 70px),
    var(--bg-1);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.045);
  box-sizing: border-box;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.03) inset,
    0 10px 28px rgba(0, 0, 0, 0.26);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: width .18s ease, box-shadow .2s ease;
}
.agent-workbench.light .col {
  border-color: rgba(15, 23, 42, 0.06);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 10px 28px rgba(15, 23, 42, 0.08);
}
.col-left { width: 268px; flex: none; }
.col-left.collapsed { border-radius: 16px; }
.col-main { flex: 1; min-width: 0; position: relative; }
.col-right { width: 330px; flex: none; }

/* ===== 拖拽分隔条 ===== */
.col-divider {
  flex: none; width: 6px; cursor: col-resize;
  position: relative; align-self: stretch;
}
.col-divider::after {
  content: ''; position: absolute; left: 50%; top: 10px; bottom: 10px;
  width: 2px; transform: translateX(-50%);
  background: transparent; border-radius: 1px; transition: background .15s;
}
.col-divider:hover::after { background: var(--accent); opacity: .45; }
.col-divider.resizing::after { background: var(--accent); opacity: .9; }

/* ===== 中栏折叠 / 展开按钮（常驻标题栏，侧边栏图标） ===== */
.brand { display: flex; align-items: center; gap: 9px; padding: 18px 14px 10px; }
.col-expand-btn {
  flex: none; width: 30px; height: 30px;
  border: 1px solid transparent; border-radius: 8px;
  background: transparent; color: var(--text-3);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .12s;
}
.col-expand-btn:hover { background: var(--bg-2); color: var(--text-1); }
.col-expand-btn.active { color: var(--accent); background: var(--accent-soft); }

/* 深色 / 浅色切换开关 */
.theme-toggle {
  flex: none; width: 52px; height: 28px;
  border: 1px solid var(--bg-3); border-radius: 999px;
  background: var(--bg-2); cursor: pointer;
  position: relative; padding: 0; transition: background .2s, border-color .2s;
}
.theme-toggle:hover { border-color: var(--accent); }
.tt-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--bg-3); color: var(--text-2);
  display: flex; align-items: center; justify-content: center;
  transition: transform .2s, background .2s, color .2s;
}
.theme-toggle.light .tt-thumb { transform: translateX(24px); background: var(--accent-soft); color: var(--accent); }
.tt-icon { width: 13px; height: 13px; }
.right-tabs { flex: none; display: flex; gap: 6px; padding: 14px 14px 10px; }
.brand-logo { width: 22px; height: 22px; object-fit: contain; flex: none; }
.brand-name { font-size: 15px; font-weight: 600; }

.new-chat-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  margin: 4px 12px 10px; height: 38px;
  border: 1px solid rgba(var(--accent-rgb), 0.35);
  border-radius: 10px;
  background: transparent; color: var(--accent);
  font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: all .15s;
}
.new-chat-btn:hover { background: var(--accent-soft); border-color: var(--accent); box-shadow: 0 4px 16px rgba(var(--accent-rgb), 0.18); }

.search-box { position: relative; padding: 0 14px 8px; }
.search-input {
  width: 100%; height: 34px; box-sizing: border-box;
  border: 1px solid transparent; border-radius: 8px;
  background: var(--bg-3); color: var(--text-1);
  padding: 0 10px 0 33px; font-size: 13px; outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.search-input::placeholder { color: var(--text-3); }
.search-icon { position: absolute; left: 25px; top: 10px; color: var(--text-3); pointer-events: none; }

.session-list { flex: 1; overflow-y: auto; padding: 2px 10px 10px; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.16) transparent; }
.session-list::-webkit-scrollbar { width: 8px; }
.session-list::-webkit-scrollbar-track { background: transparent; }
.session-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.14); border-radius: 4px; }
.session-list::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.24); }
.session-group-label { font-size: 12px; color: var(--text-3); padding: 10px 8px 6px; }
.session-item {
  position: relative; display: flex; align-items: center;
  height: 38px; padding: 0 10px 0 12px; margin-bottom: 2px;
  border-radius: 8px; cursor: pointer;
}
.session-item:hover { background: var(--bg-2); }
.session-item.active { background: var(--accent-soft); }
.session-title { flex: 1; font-size: 13px; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.session-item.active .session-title { color: var(--accent); font-weight: 500; }
.session-time { font-size: 11px; color: var(--text-3); flex: none; margin-left: 8px; }
.session-item.active .session-time { color: var(--accent); opacity: .85; }
.session-empty { font-size: 13px; color: var(--text-3); text-align: center; padding: 30px 0; }

.user-card {
  flex: none; display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; margin: 0 10px 10px;
  border-radius: 10px; background: var(--bg-2);
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
.agent-workbench.light .user-card {
  border-color: rgba(15, 23, 42, 0.05);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex: none;
  background: var(--accent-strong); color: #fff;
  font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.user-name { font-size: 13px; font-weight: 500; }
.user-role { font-size: 11px; color: var(--text-3); margin-top: 1px; max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 切换体验身份（仅体验模式显示） */
.switch-role-btn {
  flex: none; width: 26px; height: 26px; margin-left: auto;
  border: 1px solid var(--bg-3); border-radius: 50%;
  background: transparent; color: var(--text-2);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
  transition: border-color .15s, color .15s, background .15s;
}
.switch-role-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

/* ===== 中栏 ===== */
.main-header {
  height: 58px; flex: none;
  display: flex; align-items: center; gap: 10px; padding: 0 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.agent-workbench.light .main-header { border-bottom-color: rgba(15, 23, 42, 0.05); }
.main-title { flex: 1; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-wrap { flex: 1; min-height: 0; position: relative; display: flex; flex-direction: column; }
.chat-scroll {
  flex: 1; overflow-y: auto; min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
}
.chat-scroll::-webkit-scrollbar { width: 8px; }
.chat-scroll::-webkit-scrollbar-track { background: transparent; }
.chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.14); border-radius: 4px; }
.chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.24); }
.chat-inner { max-width: 1100px; margin: 0 auto; padding: 16px 28px 8px; }

.welcome { text-align: center; padding: 40px 0 20px; }
.welcome-logo { margin: 0 auto 16px; }
.welcome-robot-img { width: 64px; height: 64px; object-fit: contain; display: block; margin: 0 auto; }
.welcome-title { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
.welcome-hint { font-size: 13px; color: var(--text-3); margin: 0 0 24px; }
.welcome-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.welcome-chip {
  padding: 8px 14px; border-radius: 999px;
  border: 1px solid rgba(var(--accent-rgb), 0.25);
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
.msg.user .msg-bubble--user { background: var(--user-bubble-bg); color: var(--user-bubble-color); border-radius: 12px 12px 4px 12px; }
.msg.assistant .msg-bubble--md {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 40px),
    var(--bg-2);
  color: var(--text-1);
  border-radius: 12px 12px 12px 4px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14);
}
.agent-workbench.light .msg.assistant .msg-bubble--md {
  border-color: rgba(15, 23, 42, 0.05);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
}

/* 用户消息里的文件附件卡片 */
.chat-file-card {
  background: var(--file-card-bg);
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px; margin-bottom: 6px;
  border-radius: 8px; background: var(--file-card-bg);
  cursor: pointer; transition: background .12s;
}
.chat-file-card:hover { background: var(--file-card-bg-hover); }
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
.input-wrap { flex: none; max-width: 1100px; width: 100%; margin: 0 auto; padding: 10px 28px 14px; }
.input-box {
  background: var(--bg-2); border-radius: 14px;
  border: 1px solid transparent; padding: 12px 14px 10px;
  transition: border-color .15s;
}
.input-box:focus-within {
  border-color: var(--accent);
  box-shadow:
    0 0 0 3px var(--accent-soft),
    0 2px 18px rgba(var(--accent-rgb), 0.12);
}
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
.send-btn:hover:not(:disabled) {
  filter: brightness(1.12);
  box-shadow: 0 4px 16px rgba(var(--accent-rgb), 0.4);
}
.send-btn:disabled { opacity: .4; cursor: not-allowed; }
.input-disclaimer { font-size: 11.5px; color: var(--text-3); text-align: center; margin: 8px 0 0; }
.file-input { display: none; }

/* ===== 右栏 ===== */
.right-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; border: none; border-radius: 16px;
  background: transparent; color: var(--text-3);
  font-size: 13px; cursor: pointer; transition: all .15s;
}
.right-tab.active { background: var(--accent-soft); color: var(--accent); font-weight: 500; }
.tab-count {
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 11px; display: flex; align-items: center; justify-content: center;
}

.right-empty { text-align: center; padding: 50px 20px; }
.right-empty p { margin: 0 0 6px; font-size: 13.5px; color: var(--text-2); }
.right-empty-sub { font-size: 12px !important; color: var(--text-3) !important; line-height: 1.6; }

/* 时间线 */
.timeline { flex: 1; overflow-y: auto; padding: 4px 16px 16px; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.16) transparent; }
.timeline::-webkit-scrollbar { width: 8px; }
.timeline::-webkit-scrollbar-track { background: transparent; }
.timeline::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.14); border-radius: 4px; }
.timeline::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.24); }
.tl-node { position: relative; display: flex; gap: 12px; padding-bottom: 18px; }
.tl-line { position: absolute; left: 10.5px; top: 24px; bottom: 0; width: 2px; background: var(--bg-3); }
.tl-line.last { display: none; }
.tl-dot {
  position: relative; z-index: 1; flex: none;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--bg-3); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.tl-icon { width: 12px; height: 12px; display: block; }
.tl-dot-blank { width: 6px; height: 6px; border-radius: 50%; background: var(--text-2); opacity: .6; }
.io-input .tl-dot { background: var(--accent); }
.io-output .tl-dot { background: var(--green); }
.io-error .tl-dot { background: var(--red); }
.io-info .tl-dot { background: var(--text-3); }
/* 节点语义色（覆盖 io 色） */
.node-llm .tl-dot { background: var(--accent); }
.node-tool .tl-dot { background: var(--violet); }
.node-done .tl-dot { background: var(--green); }
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

/* ===== 手机端侧栏展开时的点击关闭遮罩（点非展开区域收起） ===== */
.side-overlay {
  position: fixed; inset: 0; z-index: 25;
  background: rgba(9, 14, 26, 0.45);
}
.agent-workbench.light .side-overlay { background: rgba(30, 41, 59, 0.32); }

/* ===== 体验身份选择弹窗（未登录必选；体验模式可切换身份） ===== */
.role-dialog-mask {
  position: fixed; inset: 0; z-index: 3000;
  background: rgba(9, 14, 26, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.agent-workbench.light .role-dialog-mask { background: rgba(30, 41, 59, 0.38); }
.role-dialog {
  width: 560px; max-width: 92vw;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 64px),
    var(--bg-1);
  border: 1px solid var(--bg-3);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  padding: 28px 28px 22px;
  box-sizing: border-box;
}
.role-dialog-header { text-align: center; margin-bottom: 22px; }
.role-dialog-logo {
  width: 56px; height: 56px; margin: 0 auto 12px;
  background: linear-gradient(135deg, rgba(111, 168, 255, 0.18), rgba(59, 118, 246, 0.10));
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
}
.role-dialog-logo img { width: 30px; height: 30px; object-fit: contain; }
.role-dialog-title { margin: 0 0 6px; font-size: 17px; font-weight: 700; color: var(--text-1); }
.role-dialog-sub { margin: 0; font-size: 12.5px; color: var(--text-3); line-height: 1.6; }
.role-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.role-card {
  width: 160px; height: 98px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  background: var(--bg-2);
  border: 1px solid var(--bg-3);
  border-radius: 12px;
  cursor: pointer; padding: 0;
  transition: border-color .15s, background .15s, transform .15s;
}
.role-card:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-1px); }
.role-card:disabled { opacity: .55; cursor: default; transform: none; }
.role-card.loading { border-color: var(--accent); background: var(--accent-soft); }
.role-card-img { width: 34px; height: 34px; object-fit: contain; }
.role-card-name { font-size: 14px; font-weight: 600; color: var(--text-1); }
.role-card-desc { font-size: 11px; color: var(--text-3); }
.role-dialog-loading {
  margin: 18px 0 0; text-align: center;
  font-size: 12px; color: var(--accent);
}
.role-dialog-hint { margin: 18px 0 0; text-align: center; font-size: 11px; color: var(--text-3); }

/* ===== 移动端适配(<768px):默认折叠侧栏,对话区优先 ===== */
@media (max-width: 767px) {
  .agent-workbench { padding: 6px; gap: 6px; }
  .col-expand-btn { width: 40px; height: 40px; }
  .role-dialog { padding: 22px 16px 18px; }
  .role-card { width: 44%; }
  /* 手机端侧栏:默认隐藏;展开时悬浮覆盖在中栏之上,不挤压对话区 */
  .col-left,
  .col-right {
    position: fixed;
    top: 6px; bottom: 6px;
    width: min(84vw, 340px) !important;
    z-index: 30;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
    transition: transform .2s ease, width .18s ease, box-shadow .2s ease;
  }
  .col-left { left: 6px; }
  .col-right { right: 6px; }
  .col-left.collapsed { transform: translateX(-110%); pointer-events: none; box-shadow: none; }
  .col-right.collapsed { transform: translateX(110%); pointer-events: none; box-shadow: none; }
  /* 手机端消息表格:保持内容宽度,超宽横向滚动,禁止单元格内容竖排堆叠 */
  .msg-bubble--md :deep(table) {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    white-space: nowrap;
  }
}
</style>
