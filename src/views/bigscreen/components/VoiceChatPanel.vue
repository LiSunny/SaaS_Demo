<template>
  <Teleport to="body">
    <div class="voice-call-overlay" @click.self="handleOverlayClick">
      <div class="voice-call-panel">
        <!-- === 顶部栏 === -->
        <div class="vc-header">
          <span class="vc-title">🎙️ 韧性AI助手 · 语音通话</span>
          <div class="vc-header-right">
            <span class="vc-duration" v-if="duration > 0">{{ formatDuration(duration) }}</span>
            <button class="vc-close-btn" @click="hangUp" title="挂断">✕</button>
          </div>
        </div>

        <!-- === 中心动画区 === -->
        <div class="vc-center" :class="`vc-state--${vc.state.value}`">
          <!-- 收听/录音状态：脉冲环 + 声波 -->
          <template v-if="vc.state.value === 'listening' || vc.state.value === 'recording' || vc.state.value === 'transcribing'">
            <div class="vc-pulse-ring" :class="{ 'is-recording': vc.state.value === 'recording' }">
              <div class="vc-pulse-ring-inner">
                <div class="vc-pulse-ring-core">
                  <span class="vc-mic-icon">{{ vc.state.value === 'recording' ? '🎤' : '👂' }}</span>
                </div>
              </div>
            </div>
            <!-- 声波条 -->
            <div class="vc-wave-bars" v-if="vc.state.value === 'recording'">
              <div
                v-for="i in 5"
                :key="i"
                class="vc-wave-bar"
                :style="{ height: waveHeight(i) + 'px', animationDelay: (i - 1) * 0.1 + 's' }"
              />
            </div>
            <p class="vc-state-hint">
              {{ vc.state.value === 'listening' ? '我正在听...' :
                 vc.state.value === 'recording' ? '' :
                 '识别中...' }}
            </p>
          </template>

          <!-- AI 说话状态：声波反相 -->
          <template v-if="vc.state.value === 'speaking'">
            <div class="vc-pulse-ring is-speaking">
              <div class="vc-pulse-ring-inner">
                <div class="vc-pulse-ring-core">
                  <span class="vc-mic-icon">🤖</span>
                </div>
              </div>
            </div>
            <div class="vc-wave-bars is-ai">
              <div
                v-for="i in 5"
                :key="i"
                class="vc-wave-bar"
                :style="{ height: (20 + Math.random() * 30) + 'px', animationDelay: (i - 1) * 0.08 + 's' }"
              />
            </div>
            <p class="vc-state-hint">AI 正在回复...</p>
          </template>

          <!-- 错误状态 -->
          <template v-if="vc.state.value === 'error'">
            <div class="vc-error-icon">⚠️</div>
            <p class="vc-error-text">{{ vc.errorMessage.value }}</p>
            <button class="vc-retry-btn" @click="vc.startVoiceChat()">重新开始</button>
          </template>
        </div>

        <!-- === 对话转写区 === -->
        <div class="vc-transcripts" ref="transcriptRef">
          <div
            v-for="line in vc.transcripts.value"
            :key="line.id"
            :class="['vc-transcript-line', `vc-transcript--${line.role}`]"
          >
            <span class="vc-transcript-role">{{ line.role === 'user' ? '你' : 'AI' }}</span>
            <span class="vc-transcript-text">
              {{ line.text }}
              <span v-if="line.isStreaming" class="vc-transcript-cursor">▍</span>
            </span>
          </div>
          <!-- 中间识别文字 -->
          <div v-if="vc.interimText.value" class="vc-transcript-line vc-transcript--user vc-transcript--interim">
            <span class="vc-transcript-role">你</span>
            <span class="vc-transcript-text">{{ vc.interimText.value }}</span>
          </div>
          <div v-if="vc.transcripts.value.length === 0 && !vc.interimText.value" class="vc-transcripts-empty">
            对着麦克风说出你的问题，我听到后会自动回答。
          </div>
        </div>

        <!-- === 底部控制 === -->
        <div class="vc-footer">
          <button class="vc-hangup-btn" @click="hangUp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)"/>
            </svg>
            <span>挂断</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useVoiceChat, type VoiceState } from '@/composables/useVoiceChat'
import { useAiChatStore } from '@/stores/ai-chat'

const emit = defineEmits<{
  close: []
}>()

const store = useAiChatStore()
const transcriptRef = ref<HTMLElement | null>(null)

// 通话时长
const duration = ref(0)
let durationTimer: ReturnType<typeof setInterval> | null = null

// ===== 语音通话实例 =====
const vc = useVoiceChat({
  onUserSpeech: async (text: string) => {
    // 用户说完一句话 → 桥接到 AI Chat Store
    vc.beginAIResponse()
    try {
      await store.sendMessage(text)
    } catch {}
    // 检查是否被打断（sendMessage 可能被 abort）
    if (!store.isLoading && vc.state.value === 'speaking') {
      vc.endAIResponse()
    }
  },

  onInterrupt: () => {
    // 用户打断 → 停止当前 SSE 请求
    store.stop()
  },

  onError: (msg: string) => {
    console.warn('[VoiceChatPanel] 语音错误:', msg)
  },
})

// ===== 监听 AI 回复流式文字 =====
// 每秒轮询最后一条 assistant 消息的内容
let feedTimer: ReturnType<typeof setInterval> | null = null
let _lastFeedText = ''

function startFeedPolling() {
  _lastFeedText = ''
  feedTimer = setInterval(() => {
    if (vc.state.value !== 'speaking') return
    const msgs = store.messages
    if (msgs.length === 0) return
    const last = msgs[msgs.length - 1]
    if (last.role !== 'assistant') return
    const text = last.content
    if (text && text !== _lastFeedText) {
      _lastFeedText = text
      vc.feedAIText(text)
    }
    // 检查是否已完成流式输出
    if (!store.isLoading && !last.isStreaming) {
      stopFeedPolling()
      vc.endAIResponse()
    }
  }, 300)
}

function stopFeedPolling() {
  if (feedTimer) {
    clearInterval(feedTimer)
    feedTimer = null
  }
}

// ===== 监听 isLoading 变化（开始/结束一次 AI 回复） =====
watch(() => store.isLoading, (loading) => {
  if (loading) {
    // AI 开始回复
    if (vc.state.value !== 'speaking') {
      vc.beginAIResponse()
      startFeedPolling()
    }
  } else {
    // AI 回复结束
    stopFeedPolling()
    if (vc.state.value === 'speaking') {
      vc.endAIResponse()
    }
  }
})

// ===== 自动滚动转写区 =====
watch(() => [vc.transcripts.value.length, vc.transcripts.value.at(-1)?.text], async () => {
  await nextTick()
  if (transcriptRef.value) {
    transcriptRef.value.scrollTop = transcriptRef.value.scrollHeight
  }
})

watch(() => vc.interimText.value, async () => {
  await nextTick()
  if (transcriptRef.value) {
    transcriptRef.value.scrollTop = transcriptRef.value.scrollHeight
  }
})

// ===== 声波动画高度 =====
function waveHeight(index: number): number {
  if (vc.state.value === 'recording') {
    // 根据 audioLevel 随机抖动
    return 12 + vc.audioLevel.value * 40 + (index % 2 === 0 ? 5 : -5)
  }
  return 20
}

// ===== 通话计时 =====
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ===== 挂断 =====
async function hangUp() {
  vc.hangUp()
  stopFeedPolling()
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
  duration.value = 0
  emit('close')
}

function handleOverlayClick() {
  // 不关闭，避免误触
}

// ===== 生命周期 =====
onMounted(async () => {
  await nextTick()
  vc.startVoiceChat()

  // 启动计时器
  durationTimer = setInterval(() => {
    if (vc.state.value !== 'idle' && vc.state.value !== 'error') {
      duration.value++
    }
  }, 1000)
})

onUnmounted(() => {
  vc.hangUp()
  stopFeedPolling()
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
})
</script>

<style lang="scss" scoped>
/* ===== 覆盖层 ===== */
.voice-call-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-call-panel {
  width: 420px;
  height: 620px;
  max-height: 90vh;
  border-radius: 24px;
  background: linear-gradient(180deg, #0a1628 0%, #0d1f3c 40%, #0a1628 100%);
  border: 1px solid rgba(86, 240, 244, 0.15);
  box-shadow: 0 0 80px rgba(86, 240, 244, 0.08), 0 24px 64px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 顶部栏 ===== */
.vc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  flex-shrink: 0;
}

.vc-title {
  font-size: 14px;
  font-weight: 600;
  color: #a0c8e8;
}

.vc-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vc-duration {
  font-size: 13px;
  color: #5a7a9a;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'Menlo', monospace;
}

.vc-close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #7a9bb5;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 71, 87, 0.15);
    color: #ff6b7a;
    border-color: rgba(255, 71, 87, 0.25);
  }
}

/* ===== 中心动画区 ===== */
.vc-center {
  flex-shrink: 0;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
}

/* 脉冲环 */
.vc-pulse-ring {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &.is-recording::before {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px solid rgba(86, 240, 244, 0.5);
    animation: pulse-ring 1.5s ease-out infinite;
  }

  &.is-recording::after {
    content: '';
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    border: 1.5px solid rgba(86, 240, 244, 0.25);
    animation: pulse-ring 1.5s ease-out 0.5s infinite;
  }

  &.is-speaking::before {
    content: '';
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px solid rgba(168, 255, 120, 0.4);
    animation: pulse-ring 2s ease-out infinite;
  }

  &.is-speaking::after {
    content: '';
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    border: 1.5px solid rgba(168, 255, 120, 0.2);
    animation: pulse-ring 2s ease-out 0.5s infinite;
  }
}

.vc-pulse-ring-inner {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(86, 240, 244, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vc-pulse-ring-core {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(86, 240, 244, 0.15), rgba(0, 63, 118, 0.3));
  border: 1.5px solid rgba(86, 240, 244, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vc-mic-icon {
  font-size: 28px;
  line-height: 1;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* 声波条 */
.vc-wave-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 50px;

  &.is-ai .vc-wave-bar {
    background: rgba(168, 255, 120, 0.5);
  }
}

.vc-wave-bar {
  width: 4px;
  min-height: 8px;
  border-radius: 2px;
  background: rgba(86, 240, 244, 0.55);
  animation: wave-anim 0.6s ease-in-out infinite alternate;
}

@keyframes wave-anim {
  0% { height: 12px; }
  100% { height: 48px; }
}

/* 状态提示 */
.vc-state-hint {
  font-size: 13px;
  color: #5a7a9a;
  margin: 0;
}

/* 错误 */
.vc-error-icon {
  font-size: 40px;
}

.vc-error-text {
  font-size: 13px;
  color: #ff8a8a;
  text-align: center;
  max-width: 300px;
  margin: 0;
}

.vc-retry-btn {
  margin-top: 8px;
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid rgba(86, 240, 244, 0.3);
  background: rgba(86, 240, 244, 0.08);
  color: #56f0f4;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;

  &:hover {
    background: rgba(86, 240, 244, 0.15);
  }
}

/* ===== 转写区 ===== */
.vc-transcripts {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(86, 240, 244, 0.1);
    border-radius: 2px;
  }
}

.vc-transcripts-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 13px;
  color: #3a5a7a;
  padding: 0 40px;
  line-height: 1.6;
}

.vc-transcript-line {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.vc-transcript-role {
  flex-shrink: 0;
  font-weight: 600;
  font-size: 11px;
  width: 24px;
  text-align: right;
}

.vc-transcript--user {
  .vc-transcript-role { color: #56f0f4; }
  .vc-transcript-text { color: #c0d8e8; }
}

.vc-transcript--assistant {
  .vc-transcript-role { color: #a8ff78; }
  .vc-transcript-text { color: #d0e0f0; }
}

.vc-transcript--interim {
  opacity: 0.6;
  font-style: italic;
}

.vc-transcript-cursor {
  animation: blink 1s step-end infinite;
  color: #a8ff78;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ===== 底部 ===== */
.vc-footer {
  padding: 16px 20px 24px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.vc-hangup-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 36px;
  border-radius: 28px;
  border: none;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(231, 76, 60, 0.3);
  transition: all 0.15s;

  &:hover {
    background: linear-gradient(135deg, #ff5c4c, #e74c3c);
    box-shadow: 0 6px 24px rgba(231, 76, 60, 0.45);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }
}
</style>
