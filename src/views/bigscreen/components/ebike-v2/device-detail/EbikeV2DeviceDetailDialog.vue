<template>
  <!-- ===== 遮罩 ===== -->
  <Transition name="dd-mask">
    <div v-if="modelValue" class="dd__mask" @click="close" />
  </Transition>

  <!-- ===== 弹窗本体 ===== -->
  <Transition name="dd-panel">
    <section
      v-if="modelValue"
      class="dd"
      role="dialog"
      aria-modal="true"
      aria-label="设备详情"
    >
      <div class="dd__body">
        <!-- ===== 左侧导航（设计稿 #165:26124） ===== -->
        <nav class="dd__nav" aria-label="设备详情分区">
          <!-- 返回：设计稿 #165:26125（线框蓝按钮 + 回退图标） -->
          <button type="button" class="dd__back" title="返回实时警情" @click="close">
            <span class="dd__back-icon" />
            <span class="dd__back-text">返回</span>
          </button>

          <button
            v-for="t in DEVICE_DETAIL_TABS"
            :key="t.key"
            type="button"
            class="dd__navbtn"
            :class="{ 'is-active': tab === t.key }"
            :aria-current="tab === t.key ? 'true' : undefined"
            @click="scrollToSection(t.key)"
          >
            {{ t.label }}
          </button>
        </nav>

        <!-- ===== 右侧内容（设计稿 #165:26131：五个分区纵向排列，整列滚动） ===== -->
        <div ref="contentRef" class="dd__content" @scroll.passive="onScroll">
          <!-- ===== 基础信息 #165:26132 ===== -->
          <section id="dd-basic" ref="basicRef" class="dd-card dd__block">
            <header class="dd-head">
              <span class="dd-head__bar" />
              <h3 class="dd-head__title">基础信息</h3>
            </header>

            <div class="dd__rows">
              <div v-for="row in basics" :key="row.label" class="dd__row">
                <span class="dd__row-label">{{ row.label }}</span>
                <span class="dd__row-value">
                  {{ row.value }}
                  <button
                    v-if="row.copyable"
                    type="button"
                    class="dd__copy"
                    :title="`复制${row.label}`"
                    :aria-label="`复制${row.label}`"
                    @click="copy(row.value)"
                  >
                    <span class="dd__copy-icon" />
                  </button>
                </span>
              </div>
            </div>
          </section>

          <!-- ===== 实时数据 #165:26164 ===== -->
          <section id="dd-realtime" ref="realtimeRef" class="dd-card dd__block">
            <header class="dd-head">
              <span class="dd-head__bar" />
              <h3 class="dd-head__title">实时数据</h3>
              <!-- 设计稿 #165:26171：分区标题右侧的刷新图标 -->
              <button
                type="button"
                class="dd-head__action"
                title="刷新实时数据"
                aria-label="刷新实时数据"
                @click="refresh"
              >
                <span class="dd-head__action-icon" />
              </button>
            </header>

            <div class="dd__metrics">
              <template v-for="(m, i) in metrics" :key="m.label">
                <!-- 格间虚线竖线：设计稿 #200:2336 -->
                <span v-if="i > 0" class="dd__metric-sep" />
                <div class="dd__metric" :class="{ 'is-abnormal': m.abnormal }">
                  <span class="dd__metric-value">{{ m.value }}</span>
                  <span class="dd__metric-label">{{ m.label }}</span>
                </div>
              </template>
            </div>
          </section>

          <!-- ===== 设备控制 #165:26204 ===== -->
          <section id="dd-control" ref="controlRef" class="dd-card dd__block">
            <header class="dd-head">
              <span class="dd-head__bar" />
              <h3 class="dd-head__title">设备控制</h3>
              <button
                type="button"
                class="dd-head__action"
                title="重置设备控制状态"
                aria-label="重置设备控制状态"
                @click="resetControl"
              >
                <span class="dd-head__action-icon" />
              </button>
            </header>

            <div class="dd__actions">
              <button
                v-for="a in actions"
                :key="a.key"
                type="button"
                class="dd__action"
                :class="{ 'is-done': a.key === 'mute' && muted }"
                @click="runAction(a)"
              >
                <span class="dd__action-icon" />
                <span class="dd__action-label">
                  {{ a.key === 'mute' && muted ? '已消音' : a.label }}
                </span>
              </button>

              <span v-if="!actions.length" class="dd__actions-empty">
                该设备未登记可下发的控制动作
              </span>
            </div>
          </section>

          <!-- ===== 历史数据 #165:26226 ===== -->
          <section id="dd-history" ref="historyRef" class="dd-card dd__block">
            <EbikeV2DeviceDetailHistory :device="device" :event="event" />
          </section>

          <!-- ===== 告警日志 #165:26282 ===== -->
          <section id="dd-alarm" ref="alarmRef" class="dd-card dd__block">
            <EbikeV2DeviceDetailAlarms :device="device" :event="event" />
          </section>
        </div>
      </div>

      <!-- ===== 操作反馈 ===== -->
      <Transition name="dd-toast">
        <span v-if="toast" class="dd__toast">{{ toast }}</span>
      </Transition>
    </section>
  </Transition>
</template>

<script setup lang="ts">
/**
 * 大屏「实时警情」页 · 设备详情抽屉
 *
 * 版式按 Figma「林业大学」节点 165:26122「Dialog - 设备详情」重做：
 *
 *   抽屉     960 宽、贴右边缘、顶到顶栏下方、底 #000D34、
 *            左侧描边 rgba(0,152,230,.16)、backdrop blur(10px)
 *   左栏     110 宽：返回（线框蓝）+ 五个分区（基础信息 / 实时数据 /
 *            设备控制 / 历史数据 / 告警日志）
 *   右栏     802 宽、五个分区卡片纵向排列，整列滚动
 *
 * **抽屉从右侧滑出**（不是居中弹窗）：与本大屏既有的右侧抽屉
 * （EbikeV2MonitorDeviceDrawer）同一套定位与过渡 —— 贴右边缘、顶到
 * 顶栏下方、遮罩盖住顶栏以下的区域、整块横向滑入。
 *
 * 交互口径（与设计稿一致）：
 *   左栏是**锚点导航**而不是 tab —— 设计稿的右栏容器高 2073，五个分区
 *   是同一条滚动流里的五张卡；左栏点哪个分区，右栏滚到哪个分区，
 *   滚动时左栏高亮跟着走（scrollspy）。做成 tab 只能一次看一段，
 *   与设计稿的「一条文档 + 目录」形态不符。
 *
 * 与设计稿的有意偏离：
 *   1. 事件角标（故障 / 火警）统一走全页唯一红 --fire-anomaly：
 *      设计稿按档位分橙 #FFA600 / 红 #E5523F，但全页角标只留一个红是
 *      本项目既定口径（见 fire/fire-common.scss 顶部第 3 条）。
 *   2. 历史数据的折线用 ECharts 实时绘制，而不是贴设计稿那张静态 SVG：
 *      页签可切、日期区间可选，贴图做不到。
 *
 * 数据口径见 device-detail-data.ts 顶部说明。
 */
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import EbikeV2DeviceDetailHistory from './EbikeV2DeviceDetailHistory.vue'
import EbikeV2DeviceDetailAlarms from './EbikeV2DeviceDetailAlarms.vue'
import {
  DEVICE_DETAIL_TABS,
  buildActions,
  buildBasics,
  buildMetrics,
  type DeviceDetailTab,
} from './device-detail-data'
import type { DutyEvent, SceneDevice } from '../duty/duty-data'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** 被查看的设备 */
    device?: SceneDevice | null
    /** 该设备当前的警情（没有则为空） */
    event?: DutyEvent | null
  }>(),
  { device: null, event: null },
)

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

/* ============================================================
 * 状态
 * ============================================================ */

/** 当前分区（由滚动位置驱动） */
const tab = ref<DeviceDetailTab>('basic')

/** 实时数据的刷新计数：点刷新即重新采一次物联上报值 */
const refreshTick = ref(0)

/** 已消音 */
const muted = ref(false)

/** 操作反馈 */
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

/** 右栏滚动容器 */
const contentRef = ref<HTMLElement | null>(null)

/**
 * 五个分区各自的 DOM（锚点定位用）
 *
 * 必须是五个独立顶层 ref —— <script setup> 里 `ref="basicRef"` 这种
 * 字符串 ref 不会绑定到对象属性上（那是 Vue 2 的写法），值会一直是 null，
 * 左栏点下去就没有反应。
 */
const basicRef = ref<HTMLElement | null>(null)
const realtimeRef = ref<HTMLElement | null>(null)
const controlRef = ref<HTMLElement | null>(null)
const historyRef = ref<HTMLElement | null>(null)
const alarmRef = ref<HTMLElement | null>(null)

const sectionRefs: Record<DeviceDetailTab, Ref<HTMLElement | null>> = {
  basic: basicRef,
  realtime: realtimeRef,
  control: controlRef,
  history: historyRef,
  alarm: alarmRef,
}

/* ============================================================
 * 派生
 * ============================================================ */

const basics = computed(() => (props.device ? buildBasics(props.device, props.event ?? undefined) : []))

const metrics = computed(() =>
  props.device ? buildMetrics(props.device, props.event ?? undefined, refreshTick.value) : [],
)

const actions = computed(() => (props.device ? buildActions(props.device) : []))

/* ============================================================
 * 操作
 * ============================================================ */

function flash(text: string) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
    toastTimer = null
  }, 2600)
}

/** 复制字段值 */
async function copy(value: string) {
  // navigator.clipboard 只在安全上下文（HTTPS / localhost）可用；
  // 大屏常部署在内网 HTTP 上，这里兜一份 execCommand 的老办法。
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      legacyCopy(value)
    }
    flash('已复制到剪贴板')
  } catch {
    try {
      legacyCopy(value)
      flash('已复制到剪贴板')
    } catch {
      flash('复制失败，请手动选取')
    }
  }
}

/** 非安全上下文的复制兜底：临时 textarea + execCommand */
function legacyCopy(value: string) {
  const ta = document.createElement('textarea')
  ta.value = value
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('execCommand copy failed')
}

/** 刷新实时数据：重新采一次物联上报值 */
function refresh() {
  refreshTick.value += 1
  flash('实时数据已刷新')
}

/** 执行控制动作 */
function runAction(action: { key: string; label: string }) {
  if (action.key === 'mute') {
    muted.value = !muted.value
    flash(muted.value ? '消音指令已下发' : '已解除消音')
  }
}

/** 重置设备控制状态 */
function resetControl() {
  if (!muted.value) {
    flash('设备控制状态已是最新')
    return
  }
  muted.value = false
  flash('设备控制状态已重置')
}

function close() {
  emit('update:modelValue', false)
}

/** 左栏点击：滚到对应分区 */
function scrollToSection(key: DeviceDetailTab) {
  const el = sectionRefs[key].value
  const box = contentRef.value
  if (!el || !box) return
  // 手动算 scrollTop，不用 scrollIntoView —— 后者会连带滚动祖先容器
  box.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
  tab.value = key
}

/** 滚动时同步左栏高亮 */
function onScroll() {
  const box = contentRef.value
  if (!box) return
  const top = box.scrollTop
  // 滚到底时最后一个分区要能亮起来：它的顶边永远在视口顶边之下（内容到头了），
  // 只按「顶边越过视口顶边」判定，最后一节永远高亮不到。
  const atBottom = top + box.clientHeight >= box.scrollHeight - 1

  let current: DeviceDetailTab = 'basic'
  for (const t of DEVICE_DETAIL_TABS) {
    const el = sectionRefs[t.key].value
    if (!el) continue
    // 视口内最靠上的那张卡即为当前分区
    if (el.offsetTop - top <= 24) current = t.key
  }
  if (atBottom) current = DEVICE_DETAIL_TABS[DEVICE_DETAIL_TABS.length - 1].key

  if (current !== tab.value) tab.value = current
}

/** Esc 关闭弹窗（模态的常规预期） */
function onKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !props.modelValue) return
  close()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

/** 换设备：回到基础信息、清掉消音态与刷新计数 */
watch(
  () => props.device?.key,
  () => {
    tab.value = 'basic'
    muted.value = false
    refreshTick.value = 0
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./device-detail-common.scss" as *;

/* ===== 遮罩：盖住顶栏以下的区域（大屏顶栏保持可见） ===== */
.dd__mask {
  position: fixed;
  top: vh(68);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10031;
  background: rgba(2, 14, 32, 0.42);
}

/* ===== 抽屉本体：从右侧滑出 =====
   定位与项目既有右侧抽屉一致（EbikeV2MonitorDeviceDrawer）：
   贴右边缘、顶到顶栏下方、高度撑满，左侧一道描边 + 向左的投影。 */
.dd {
  position: fixed;
  top: vh(68);
  right: 0;
  bottom: 0;
  z-index: 10032;
  width: vw(960);
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 152, 230, 0.16);
  background: #000d34;
  box-shadow:
    -8px 0 26px rgba(0, 0, 0, 0.4),
    0 vh(12) vh(32) 0 rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.dd__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: vw(16);
  padding: vw(16);
}

/* ===== 左侧导航：设计稿 #165:26124（110 宽） ===== */
.dd__nav {
  width: vw(110);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vw(12);
}

/* 返回按钮：设计稿 #165:26125 —— 线框蓝 + 回退图标 */
.dd__back {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(8) vw(12);
  border: 1px solid #3678e3;
  border-radius: vw(8);
  background: rgba(54, 120, 227, 0.1);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.dd__back:hover {
  background: rgba(54, 120, 227, 0.22);
  border-color: #63a9ff;
}

.dd__back-icon {
  width: vw(20);
  height: vw(20);
  flex-shrink: 0;
  background-color: #ffffff;
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-back.svg') center / contain
    no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-back.svg') center / contain no-repeat;
}

/* 分区按钮：设计稿 #165:26126~26130 */
.dd__navbtn {
  padding: vh(8) vw(12);
  border: none;
  border-radius: vw(8);
  background: transparent;
  color: #8fb0d8;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  font-weight: 500;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.dd__navbtn:hover {
  color: #d4e6ff;
  background: rgba(54, 120, 227, 0.16);
}

/* 选中态：实心蓝底（设计稿 #165:26126 的 fills #3678E3） */
.dd__navbtn.is-active {
  background: #3678e3;
  color: #fefefe;
}

/* ===== 右侧内容：整列滚动 ===== */
.dd__content {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vw(16);
  overflow-y: auto;
  overflow-x: hidden;
  /* 滚动条压暗，不抢内容的注意力 */
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 190, 255, 0.28) transparent;
}

.dd__content::-webkit-scrollbar {
  width: vw(6);
}

.dd__content::-webkit-scrollbar-thumb {
  background: rgba(120, 190, 255, 0.28);
  border-radius: vw(3);
}

/* 分区卡片：设计稿 EL-430ee290 / EL-6d79c636 */
.dd__block {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  padding: vw(16);
  flex-shrink: 0;
}

/* ===== 基础信息行：设计稿 #165:26138 ===== */
.dd__rows {
  width: 100%;
}

.dd__row {
  display: flex;
  align-items: center;
  padding: vh(8) 0;
  border-bottom: 1px solid rgba(120, 190, 255, 0.07);
}

.dd__row-label {
  width: vw(86);
  flex-shrink: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: vh(18);
  color: #d4e3ff;
}

.dd__row-value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: vw(8);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: vh(18);
  color: #ffffff;
  word-break: break-all;
}

/* 复制按钮：设计稿 #200:2006 */
.dd__copy {
  width: vw(18);
  height: vw(18);
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.dd__copy-icon {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #409eff;
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-copy.svg') center / contain
    no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-copy.svg') center / contain no-repeat;
}

/* ===== 实时数据指标：设计稿 #165:26175（88 见方一格） ===== */
.dd__metrics {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vw(10);
}

.dd__metric {
  width: vw(88);
  height: vw(88);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(2);
}

.dd__metric-value {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-weight: 500;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  line-height: vh(24);
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
}

/* 异常格：全页只留一个红 */
.dd__metric.is-abnormal .dd__metric-value {
  color: var(--fire-anomaly);
}

.dd__metric-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: vh(21);
  color: #d4e3ff;
  white-space: nowrap;
}

/* 格间虚线竖线：设计稿 #200:2336（1px #0C3464，2-2 虚线） */
.dd__metric-sep {
  width: 0;
  height: vh(73);
  flex-shrink: 0;
  border-left: 1px dashed #0c3464;
}

/* ===== 设备控制：设计稿 #165:26215 ===== */
.dd__actions {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vw(10);
  min-height: vh(70);
}

.dd__action {
  display: flex;
  align-items: center;
  gap: vw(15);
  height: vh(50);
  padding: 0 vw(15);
  border: 1px solid rgba(0, 0, 0, 0);
  border-radius: vw(8);
  background: #013e79;
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}

.dd__action:hover {
  background: #01528f;
}

.dd__action.is-done {
  background: rgba(1, 62, 121, 0.6);
  color: #93afcc;
}

.dd__action-icon {
  width: vw(24);
  height: vw(24);
  flex-shrink: 0;
  background-color: currentColor;
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-mute.svg') center / contain
    no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-mute.svg') center / contain no-repeat;
}

.dd__actions-empty {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  color: #93afcc;
}

/* 分区标题右侧的刷新图标：设计稿 #165:26173 */
.dd-head__action-icon {
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-section.svg') center / contain
    no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-section.svg') center / contain no-repeat;
}

/* ===== 操作反馈 ===== */
.dd__toast {
  position: absolute;
  left: 50%;
  bottom: vh(20);
  transform: translateX(-50%);
  padding: vh(9) vw(18);
  border: 1px solid rgba(96, 200, 255, 0.5);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.96);
  color: #cfe4ff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  letter-spacing: 1px;
  white-space: nowrap;
  pointer-events: none;
}

/* ===== 过渡：从右侧滑出 ===== */
.dd-mask-enter-active,
.dd-mask-leave-active {
  transition: opacity 0.22s ease;
}

.dd-mask-enter-from,
.dd-mask-leave-to {
  opacity: 0;
}

.dd-panel-enter-active,
.dd-panel-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.dd-panel-enter-from,
.dd-panel-leave-to {
  transform: translateX(100%);
}

.dd-toast-enter-active,
.dd-toast-leave-active {
  transition: opacity 0.24s, transform 0.24s;
}

.dd-toast-enter-from,
.dd-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, vh(8));
}
</style>
