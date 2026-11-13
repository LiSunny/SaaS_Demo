<template>
  <Teleport to="body">
    <div class="agent-floating-chat" :class="[{ 'is-open': store.isOpen }, robotPhase]">
      <!-- ===== 折叠态：机器人入口（点击唤起小尼平安对话浮层） ===== -->
      <div v-if="!store.isOpen" class="robot-wrapper">
        <button
          class="chat-fab"
          @click="handleRobotClick"
          title="小尼平安"
        >
          <img src="@/assets/agent-robot.svg" alt="小尼平安" class="fab-robot-img" />
        </button>
        <!-- 打招呼气泡 -->
        <div v-if="robotPhase === 'greeting'" class="robot-greeting">
          <span>嗨，我是小尼平安 👋</span>
        </div>
      </div>

      <!-- ===== 展开态：遮罩 + 小尼平安工作台（浅色，与 /agent 同一套界面） =====
           2026-11-13：原来这里是一套自建的对话面板（独立模板 / 样式 / 上传 / 调试逻辑），
           与 /agent 工作台各写一份，界面和功能长期不同步。
           现改为直接复用 AgentWorkbench 组件并 forceLight 锁定浅色 ——
           布局、交互、会话持久化与 /agent 完全一致，只有主题不同。 -->
      <div v-if="store.isOpen" class="chat-overlay" @click.self="store.close()">
        <div class="chat-panel">
          <!-- Suspense 兜住按需加载的空窗：defineAsyncComponent 首次渲染时才发起
               import，loading 期间显示占位（不能用 v-if 包组件做条件渲染 ——
               那样组件永远不挂载，loader 也就永远不会执行）。 -->
          <Suspense>
            <AgentWorkbench embedded force-light closable @close="store.close()" />
            <template #fallback>
              <div class="chat-loading">
                <span class="chat-loading-spinner" />
                <span>小尼平安加载中…</span>
              </div>
            </template>
          </Suspense>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import { useAiChatStore } from '@/stores/ai-chat'

const store = useAiChatStore()
const router = useRouter()

// 工作台按需加载：大屏首屏不打包 AgentWorkbench（1.3k 行 + 独立 CSS），
// 用户点开机器人时才拉取。
const AgentWorkbench = defineAsyncComponent(() => import('@/views/agent/AgentWorkbench.vue'))

// ===== 机器人入场动画 =====
// 阶段：hidden → flying-in（飞入）→ greeting（打招呼气泡）→ idle（就位待命）
// 注：2026-11-04 移除机器人入口时此状态机被一并删除，2026-11-13 恢复。
// 与原实现的两点差异：
//   1. 终态由 peeking（探头、只露一半）改为 idle（完整就位）—— 机器人是入口，
//      藏一半既难点到也不易被发现；飞入 + 打招呼的入场动画保持原样。
//   2. 点击不再受阶段限制（原来必须等到 peeking 才响应），任何时刻点开都生效。
type RobotPhase = 'hidden' | 'flying-in' | 'greeting' | 'idle'
const robotPhase = ref<RobotPhase>('hidden')
const robotTimers: ReturnType<typeof setTimeout>[] = []

function handleRobotClick() {
  store.open()
}

/**
 * 登录态失效（后端 /api/agent/chat 返回 401）。
 * 大屏是值守场景，不能把用户踢到登录页 —— 明确提示去工作台重新登录即可。
 */
function handleAuthExpired() {
  ElMessage.warning({
    message: '登录已过期，请重新登录后再提问（可前往「小尼平安」工作台登录）',
    duration: 5000,
    zIndex: 10000,
  })
}

// 从 URL 读取当前 bigscreenId
function getCurrentBigscreenId(): number {
  return Number(new URLSearchParams(window.location.search).get('bigscreenId')) || 0
}

// ===== 监听导航事件 =====
// AI 回复里带「跳转某页面」指令时，store 会派发 agent:navigate。
// 大屏上跨大屏类型需要整页刷新（同页内则由 router 处理）。
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
  // 登录态失效（接口 401）：大屏是值守场景，不能把用户踢走，
  // 提示去工作台重新登录即可（独立工作台 /agent 会自动弹体验身份选择）。
  window.addEventListener('agent:auth-expired', handleAuthExpired)
  // 机器人入场动画：页面加载 800ms → 飞入，1500ms → 打招呼，4500ms → 就位
  robotTimers.push(setTimeout(() => { robotPhase.value = 'flying-in' }, 800))
  robotTimers.push(setTimeout(() => { robotPhase.value = 'greeting' }, 1500))
  robotTimers.push(setTimeout(() => { robotPhase.value = 'idle' }, 4500))
})

onUnmounted(() => {
  window.removeEventListener('agent:navigate', handleNavigate)
  window.removeEventListener('agent:auth-expired', handleAuthExpired)
  robotTimers.forEach(clearTimeout)
  robotTimers.length = 0
})
</script>

<style lang="scss" scoped>
/* ===== 悬浮对话容器 =====
   2026-11-04：右下角机器人图标（含飞入 / 打招呼 / 探头动画）被移除；
   2026-11-13：按需求恢复机器人入口与入场动画（飞入 → 打招呼 → 就位待命）。
   终态由「探头露一半」改为「完整就位 + 轻微浮动」，让入口可点、可发现。 */
.agent-floating-chat {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;

  /* 入场前完全隐藏 */
  &.hidden .robot-wrapper { opacity: 0; }

  /* 飞入：从右侧外部飞入，落位时轻微回弹 */
  &.flying-in .robot-wrapper {
    animation: robot-fly-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* 打招呼阶段：机器人已就位，轻微浮动 */
  &.greeting .robot-wrapper {
    animation: robot-float 2.6s ease-in-out infinite;
  }

  /* 就位待命：轻微上下浮动，提示可点 */
  &.idle .robot-wrapper {
    animation: robot-float 3.2s ease-in-out infinite;
  }
}

/* ===== 飞入动画（从右侧外部飞入） ===== */
@keyframes robot-fly-in {
  0%   { transform: translateX(160px); opacity: 0; }
  60%  { transform: translateX(-12px); opacity: 1; }
  100% { transform: translateX(0); opacity: 1; }
}

/* ===== 就位后的轻微浮动 ===== */
@keyframes robot-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

/* ===== 机器人容器 ===== */
.robot-wrapper {
  position: relative;
  transition: transform 0.5s ease-out, opacity 0.5s;
}

/* ===== 浮动按钮 =====
   2026-11-13：112px → 150px。机器人是新换的全身形象（199:277），
   在 112px 方盒里只渲染出 87px 宽的细长小人，相对大屏窗口占比偏小、不协调。
   150px 容器下渲染约 108×150，与 1920×1080 大屏的比例更协调。 */
.chat-fab {
  width: 150px;
  height: 150px;
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
    transform: scale(1.08);
  }
}

.fab-robot-img {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

/* ===== 打招呼气泡 ===== */
.robot-greeting {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 14px;
  background: #fff;
  color: #1a1a2e;
  font-size: 15px;
  font-weight: 500;
  padding: 11px 18px;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  animation: greeting-bounce 0.4s ease-out;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 34px;
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

/* ===== 遮罩层 ===== */
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 浮层容器 =====
   承载 AgentWorkbench（embedded 模式铺满本容器）。
   尺寸放大到接近整屏：三栏布局（左会话 268 + 中对话 + 右时间线 330）
   在窄容器里会把中栏挤到不可用。 */
.chat-panel {
  width: min(88vw, 1720px);
  height: min(88vh, 950px);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
  background: #eef1f6;
}

/* ===== 工作台按需加载中的占位 ===== */
.chat-loading {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #475569;
  font-size: 14px;
}

.chat-loading-spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(37, 99, 235, 0.2);
  border-top-color: #2563eb;
  animation: chat-loading-spin 0.8s linear infinite;
}

@keyframes chat-loading-spin {
  to { transform: rotate(360deg); }
}
</style>
