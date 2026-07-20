/**
 * useVoiceChat.ts — 全双工语音对话 Composable
 *
 * 纯浏览器 API 实现：
 * - AnalyserNode 能量检测做 VAD
 * - SpeechRecognition API 做 STT
 * - SpeechSynthesis API 做 TTS
 *
 * 零外部依赖，无 WASM/CJS 兼容问题。
 */
import { ref, readonly } from 'vue'

// ===== 全局类型补充 =====

interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((ev: ISpeechRecognitionEvent) => void) | null
  onerror: ((ev: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number
  results: ISpeechRecognitionResultList
}

interface ISpeechRecognitionResultList {
  length: number
  [index: number]: ISpeechRecognitionResult
}

interface ISpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: ISpeechRecognitionAlternative
}

interface ISpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

// ===== 导出类型 =====

export type VoiceState = 'idle' | 'listening' | 'recording' | 'transcribing' | 'speaking' | 'error'

export interface TranscriptLine {
  id: string
  role: 'user' | 'assistant'
  text: string
  isStreaming?: boolean
}

export interface VoiceChatState {
  state: VoiceState
  stateLabel: string
  interimText: string
  transcripts: TranscriptLine[]
  errorMessage: string
  isSpeaking: boolean
  audioLevel: number
}

// ===== 常量 =====

const STT_LANG = 'zh-CN'
const BARGE_IN_MIN_MS = 400
const TTS_RATE = 1.05
const TTS_PITCH = 1.0

/** 能量阈值：超过此值判定为"有人在说话" */
const ENERGY_THRESHOLD = 0.025
/** 连续静音多久判定为说完（ms） */
const SILENCE_TIMEOUT_MS = 1200
/** VAD 检测频率（ms） */
const VAD_INTERVAL_MS = 100

// ===== 工具 =====

let lineIdCounter = 0
function nextLineId(): string { return `vl-${Date.now()}-${++lineIdCounter}` }

function isSTTSupported(): boolean {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

function isTTSSupported(): boolean {
  return !!window.speechSynthesis
}

function createSTTRecognition(): ISpeechRecognition {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  const rec: ISpeechRecognition = new Ctor()
  rec.lang = STT_LANG
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1
  return rec
}

// ===== 主 Composable =====

export function useVoiceChat(options: {
  onUserSpeech: (text: string) => void
  onInterrupt: () => void
  onError?: (message: string) => void
}) {
  const _state = ref<VoiceState>('idle')
  const interimText = ref('')
  const transcripts = ref<TranscriptLine[]>([])
  const errorMessage = ref('')
  const isSpeaking = ref(false)
  const audioLevel = ref(0)

  let recognition: ISpeechRecognition | null = null
  let bargeInTimer: ReturnType<typeof setTimeout> | null = null
  let _bargeInFlag = false
  let _currentAILineIdx = -1
  let _silenceTimer: ReturnType<typeof setTimeout> | null = null
  let _lastAISpokenLen = 0

  // VAD 状态
  let _audioCtx: AudioContext | null = null
  let _analyser: AnalyserNode | null = null
  let _stream: MediaStream | null = null
  let _vadTimer: ReturnType<typeof setInterval> | null = null
  let _isSpeakingFlag = false
  let _silenceStartTime = 0

  // TTS 队列
  let _ttsQueue: string[] = []
  let _ttsActive = false

  const isSupported = isSTTSupported() && isTTSSupported()

  const stateLabels: Record<VoiceState, string> = {
    'idle':         '',
    'listening':    '正在听...',
    'recording':    '',
    'transcribing': '识别中...',
    'speaking':     '',
    'error':        '',
  }

  function updateState(s: VoiceState, errMsg?: string) {
    _state.value = s
    if (errMsg !== undefined) errorMessage.value = errMsg
  }

  function buildSnapshot(): VoiceChatState {
    return {
      state: _state.value,
      stateLabel: stateLabels[_state.value],
      interimText: interimText.value,
      transcripts: [...transcripts.value],
      errorMessage: errorMessage.value,
      isSpeaking: isSpeaking.value,
      audioLevel: audioLevel.value,
    }
  }

  // ===== 能量检测 VAD =====
  async function initVAD() {
    _stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    _audioCtx = new AudioContext()
    const source = _audioCtx.createMediaStreamSource(_stream)
    _analyser = _audioCtx.createAnalyser()
    _analyser.fftSize = 256
    _analyser.smoothingTimeConstant = 0.3
    source.connect(_analyser)

    const dataArray = new Uint8Array(_analyser.frequencyBinCount)
    _isSpeakingFlag = false
    _silenceStartTime = 0

    _vadTimer = setInterval(() => {
      if (_analyser) {
        _analyser.getByteFrequencyData(dataArray)
      }

      // 计算平均能量
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const avg = sum / dataArray.length / 255 // 归一化 0-1
      audioLevel.value = avg

      const now = Date.now()

      if (avg > ENERGY_THRESHOLD) {
        // 检测到能量 → 有人说话
        if (!_isSpeakingFlag) {
          _isSpeakingFlag = true
          _silenceStartTime = 0
          onEnergySpeechStart(now)
        }
      } else {
        // 静音
        if (_isSpeakingFlag) {
          if (_silenceStartTime === 0) {
            _silenceStartTime = now
          } else if (now - _silenceStartTime >= SILENCE_TIMEOUT_MS) {
            _isSpeakingFlag = false
            _silenceStartTime = 0
            onEnergySpeechEnd()
          }
        }
      }
    }, VAD_INTERVAL_MS)
  }

  function destroyVAD() {
    if (_vadTimer) {
      clearInterval(_vadTimer)
      _vadTimer = null
    }
    if (_stream) {
      _stream.getTracks().forEach(t => t.stop())
      _stream = null
    }
    if (_audioCtx && _audioCtx.state !== 'closed') {
      _audioCtx.close()
      _audioCtx = null
    }
    _analyser = null
  }

  function onEnergySpeechStart(_now: number) {
    clearSilenceTimer()

    // 打断检测
    if (_state.value === 'speaking') {
      if (!bargeInTimer) {
        bargeInTimer = setTimeout(() => {
          bargeInTimer = null
          console.log('[useVoiceChat] 🔔 用户打断！')
          cancelTTS()
          _bargeInFlag = true
          if (_currentAILineIdx >= 0) {
            transcripts.value = transcripts.value.map((t, i) =>
              i === _currentAILineIdx ? { ...t, isStreaming: false } : t
            )
          }
          interimText.value = ''
          options.onInterrupt()
          updateState('recording')
        }, BARGE_IN_MIN_MS)
      }
      return
    }

    // 正常：开始录音
    if (_state.value === 'listening' || _state.value === 'idle') {
      updateState('recording')
    }
  }

  function onEnergySpeechEnd() {
    if (bargeInTimer) {
      clearTimeout(bargeInTimer)
      bargeInTimer = null
    }
    // 短暂能量丢失可能只是停顿，用静音计时器确认
    // (已在 updateState('recording') 后由 startSilenceTimer 处理)
    // 这里不做任何事，VAD 会在确定长时间静音后才触发 STT
    startSilenceTimer()
  }

  // ===== STT =====
  function runSTT() {
    recognition = createSTTRecognition()

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let final = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) {
          final += r[0].transcript
        } else {
          interim += r[0].transcript
        }
      }

      interimText.value = (final + interim).trim()

      if (final.trim()) {
        const text = final.trim()
        transcripts.value = [...transcripts.value, { id: nextLineId(), role: 'user', text }]
        interimText.value = ''
        safeAbortRecognition()
        options.onUserSpeech(text)
      }
    }

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        safeAbortRecognition()
        updateState('listening')
        return
      }
      console.warn('[useVoiceChat] STT 错误:', event.error)
      safeAbortRecognition()
      updateState('listening')
    }

    recognition.onend = () => {
      if (_state.value === 'transcribing') {
        updateState('listening')
      }
    }

    try {
      recognition.start()
      updateState('transcribing')
    } catch (err: any) {
      console.warn('[useVoiceChat] 启动 STT 失败:', err.message)
      setTimeout(() => {
        try { recognition?.start() } catch { /* ignore */ }
      }, 200)
    }
  }

  function safeAbortRecognition() {
    if (recognition) {
      try { recognition.stop() } catch { /* ignore */ }
      recognition = null
    }
  }

  // ===== TTS =====
  function enqueueTTS(text: string) {
    if (!text.trim() || !isTTSSupported()) return
    _ttsQueue.push(text)
    if (!_ttsActive) playNextTTS()
  }

  function playNextTTS() {
    if (_ttsQueue.length === 0 || _bargeInFlag) {
      _ttsActive = false
      isSpeaking.value = false
      return
    }
    _ttsActive = true

    const text = _ttsQueue.shift()!
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = STT_LANG
    utterance.rate = TTS_RATE
    utterance.pitch = TTS_PITCH

    const voices = synth.getVoices()
    const zhVoice = voices.find(v => v.lang.startsWith('zh-CN') || v.lang.startsWith('zh'))
    if (zhVoice) utterance.voice = zhVoice

    isSpeaking.value = true

    utterance.onend = () => {
      if (_bargeInFlag) return
      playNextTTS()
    }

    utterance.onerror = () => {
      if (_bargeInFlag) return
      playNextTTS()
    }

    synth.speak(utterance)
  }

  function cancelTTS() {
    _bargeInFlag = true
    _ttsQueue = []
    _ttsActive = false
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }

  // ===== 静音计时 =====
  function startSilenceTimer() {
    clearSilenceTimer()
    _silenceTimer = setTimeout(() => {
      _silenceTimer = null
      if (_state.value === 'recording') {
        runSTT()
      }
    }, SILENCE_TIMEOUT_MS)
  }

  function clearSilenceTimer() {
    if (_silenceTimer) {
      clearTimeout(_silenceTimer)
      _silenceTimer = null
    }
  }

  // ===== 父组件桥接 =====

  function beginAIResponse() {
    _bargeInFlag = false
    _currentAILineIdx = transcripts.value.length
    transcripts.value = [...transcripts.value, {
      id: nextLineId(), role: 'assistant', text: '', isStreaming: true,
    }]
    updateState('speaking')
  }

  function feedAIText(fullText: string) {
    if (_bargeInFlag) return

    transcripts.value = transcripts.value.map((t, i) =>
      i === _currentAILineIdx ? { ...t, text: fullText } : t
    )

    const oldLen = _lastAISpokenLen
    const newText = fullText.slice(oldLen).trim()
    if (newText) {
      _lastAISpokenLen = fullText.length
      enqueueTTS(newText)
    }
  }

  function endAIResponse() {
    if (_bargeInFlag) return
    transcripts.value = transcripts.value.map((t, i) =>
      i === _currentAILineIdx ? { ...t, isStreaming: false } : t
    )
    _currentAILineIdx = -1
    _lastAISpokenLen = 0
    updateState('listening')
  }

  // ===== 生命周期 =====

  async function startVoiceChat() {
    if (!isSupported) {
      const msg = '当前浏览器不支持语音输入（需要 Chrome/Edge/Safari）'
      updateState('error', msg)
      options.onError?.(msg)
      return
    }

    // 预加载 TTS voices
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices()
    }

    transcripts.value = []
    interimText.value = ''
    _bargeInFlag = false
    _currentAILineIdx = -1
    _lastAISpokenLen = 0

    try {
      await initVAD()
      updateState('listening')
      console.log('[useVoiceChat] ✅ 语音通话已启动（纯浏览器 VAD）')
    } catch (err: any) {
      console.error('[useVoiceChat] 初始化失败:', err)
      const msg = err.name === 'NotAllowedError'
        ? '需要麦克风权限才能使用语音通话，请在浏览器设置中允许。'
        : `语音引擎启动失败: ${err.message}`
      updateState('error', msg)
      options.onError?.(msg)
    }
  }

  async function hangUp() {
    cancelTTS()
    clearSilenceTimer()

    if (bargeInTimer) {
      clearTimeout(bargeInTimer)
      bargeInTimer = null
    }

    safeAbortRecognition()
    destroyVAD()

    _bargeInFlag = false
    _currentAILineIdx = -1
    _lastAISpokenLen = 0
    interimText.value = ''
    updateState('idle')
    console.log('[useVoiceChat] 语音通话已挂断')
  }

  return {
    state: readonly(_state),
    interimText: readonly(interimText),
    transcripts: readonly(transcripts),
    errorMessage: readonly(errorMessage),
    isSpeaking: readonly(isSpeaking),
    audioLevel: readonly(audioLevel),
    isSupported,
    buildSnapshot,
    startVoiceChat,
    hangUp,
    beginAIResponse,
    feedAIText,
    endAIResponse,
  }
}
