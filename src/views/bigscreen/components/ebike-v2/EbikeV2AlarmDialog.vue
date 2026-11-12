<template>
  <Transition name="ad-fade">
    <div v-if="modelValue" class="ad__mask" @click.self="close">
      <section
        class="ad"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.stop
      >
        <!-- ===== 标题栏 ===== -->
        <header class="ad__head">
          <div class="ad__head-lead">
            <img class="ad__head-icon" :src="titleIcon" alt="" />
            <h3 class="ad__title">{{ title }}</h3>
          </div>
          <button type="button" class="ad__close" title="关闭" aria-label="关闭" @click="close">
            <img :src="closeIcon" alt="" />
          </button>
        </header>

        <div class="ad__sep" />

        <!-- ===== 主体 ===== -->
        <div class="ad__body">
          <!-- ===== 左列：报警单位信息 + 持续报警数据 ===== -->
          <div class="ad__col ad__col--left">
            <!-- 报警单位信息 -->
            <section class="ad__card">
              <div class="ad__card-head">
                <i class="ad__card-bar" />
                <span class="ad__card-title">报警单位信息</span>
              </div>
              <div class="ad__fields">
                <div v-for="f in companyFields" :key="f.label" class="ad__row">
                  <span class="ad__label">{{ f.label }}</span>
                  <span class="ad__value">{{ f.value }}</span>
                </div>
              </div>
            </section>

            <!-- 持续报警数据 -->
            <section class="ad__card ad__card--stroke">
              <div class="ad__card-head">
                <i class="ad__card-bar" />
                <span class="ad__card-title">持续报警数据</span>
              </div>
              <div class="ad__timeline">
                <div class="ad__tl">
                  <i class="ad__tl-line" />
                  <div
                    v-for="(item, i) in timeline"
                    :key="item.time + i"
                    class="ad__tl-item"
                    :class="{ 'is-active': i === 0 }"
                  >
                    <span class="ad__tl-time">{{ item.time }}</span>
                    <span class="ad__tl-type">{{ item.type }}</span>
                    <i class="ad__tl-dot" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <!-- ===== 中列：报警设备信息 ===== -->
          <section class="ad__card ad__card--device">
            <div class="ad__card-head">
              <i class="ad__card-bar" />
              <span class="ad__card-title">报警设备信息</span>
            </div>
            <div class="ad__fields ad__fields--grow">
              <div class="ad__row">
                <span class="ad__label">告警设备：</span>
                <span class="ad__value">{{ device.device }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">告警位置：</span>
                <span class="ad__value">{{ device.position }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">告警内容：</span>
                <span class="ad__value ad__value--alert">{{ device.content }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">管理单元：</span>
                <span class="ad__value">{{ device.unit }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">最新报警时间：</span>
                <span class="ad__value">{{ device.latestAt }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">首次报警时间：</span>
                <span class="ad__value">{{ device.firstAt }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">设备编码：</span>
                <span class="ad__value">{{ device.code }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">告警值：</span>
                <span class="ad__value">{{ device.value }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">告警图片：</span>
                <span class="ad__value">{{ device.image }}</span>
              </div>
              <div class="ad__row">
                <span class="ad__label">实时视频：</span>
                <span class="ad__value">
                  <img class="ad__video" :src="videoIcon" alt="实时视频" />
                </span>
              </div>
              <div class="ad__row">
                <span class="ad__label">设备联系人：</span>
                <span class="ad__value">{{ device.contact }}</span>
              </div>
            </div>
          </section>

          <!-- ===== 右列：警情处置 ===== -->
          <section class="ad__card ad__card--stroke ad__card--handle">
            <div class="ad__card-head">
              <i class="ad__card-bar" />
              <span class="ad__card-title">警情处置</span>
            </div>
            <div class="ad__fields ad__fields--grow">
              <div class="ad__row">
                <span class="ad__label">设备运行状态：</span>
                <span class="ad__value">{{ deviceStatus }}</span>
              </div>

              <!-- 核实结果：单选 -->
              <div class="ad__row ad__row--group">
                <span class="ad__label">核实结果：</span>
                <div class="ad__radios">
                  <button
                    v-for="opt in VERIFY_OPTIONS"
                    :key="opt"
                    type="button"
                    class="ad__radio-item"
                    :aria-pressed="verify === opt"
                    @click="verify = opt"
                  >
                    <i class="ad__radio" :class="{ 'is-on': verify === opt }" />
                    <span class="ad__radio-text">{{ opt }}</span>
                  </button>
                </div>
              </div>

              <!-- 处理结果：单选 -->
              <div class="ad__row ad__row--group">
                <span class="ad__label">处理结果：</span>
                <div class="ad__radios ad__radios--wrap">
                  <button
                    v-for="opt in HANDLE_OPTIONS"
                    :key="opt"
                    type="button"
                    class="ad__radio-item"
                    :aria-pressed="handle === opt"
                    @click="handle = opt"
                  >
                    <i class="ad__radio" :class="{ 'is-on': handle === opt }" />
                    <span class="ad__radio-text">{{ opt }}</span>
                  </button>
                </div>
              </div>

              <!-- 处理说明 -->
              <div class="ad__row ad__row--remark">
                <span class="ad__label">处理说明：</span>
                <textarea
                  v-model="remark"
                  class="ad__textarea"
                  placeholder="请输入处理说明"
                  aria-label="处理说明"
                />
              </div>
            </div>
          </section>
        </div>

        <!-- ===== 底部：提交 ===== -->
        <footer class="ad__foot">
          <span v-if="error" class="ad__error">{{ error }}</span>
          <button type="button" class="ad__submit" @click="submit">确认核实处置</button>
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * 警情弹窗（EbikeV2 大屏 · 校园总览页）
 *
 * 版式按 Figma「林业大学 / 警情弹窗」节点 200:1296 重做（设计稿基准 1920×1080）：
 *
 *   遮罩  radial-gradient(circle at 50% 50%, rgba(0,13,52,.21) 0%, rgba(0,13,52,.52) 100%)
 *   弹窗  宽 1340、居中偏上；底 #000D34、描边 rgba(74,110,255,.45)、圆角 6、
 *         外发光 0 0 15px 11px rgba(226,65,65,.45)（火警红晕）
 *   标题  24×24 火警图标 + 「发生火警」16px 粗体 #E74E4E；右侧 24×24 关闭图标
 *   分隔  1px rgba(120,190,255,.16)，左右各留 20
 *   主体  横向三块：报警单位信息 + 持续报警数据（自适应）| 报警设备信息 422 | 警情处置 422
 *   底部  右对齐主按钮「确认核实处置」（rgba(0,134,228,.9)、圆角 8、36 高）
 *
 * 图标全部取 Figma 原图导出（assets/bigscreen/ebike-v2/fire/alarm-*.svg），不自绘。
 *
 * 与设计稿的偏差（均已在交付说明中列出）：
 *   1. 持续报警数据的时间线：设计稿三条时间/类型沿用同一个组件占位（文本重复），
 *      这里按每条警情的实际时间线给不同时间，保证「最新 / 首次报警时间」与时间线自洽。
 *   2. 核实结果、处理结果为可交互单选（设计稿是静态 radio 稿），默认选中值取
 *      该警情自身的类型。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  HANDLE_OPTIONS,
  VERIFY_OPTIONS,
  defaultVerifyOf,
  type AlarmConfirmPayload,
  type AlarmDetail,
} from './fire/alarm-dialog-data'
import titleIcon from '@/assets/bigscreen/ebike-v2/fire/alarm-title.svg'
import closeIcon from '@/assets/bigscreen/ebike-v2/fire/alarm-close.svg'
import videoIcon from '@/assets/bigscreen/ebike-v2/fire/alarm-video.svg'

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue?: boolean
    /** 警情详情（为空时按空态渲染） */
    detail?: AlarmDetail | null
  }>(),
  { modelValue: false, detail: null },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  /** 提交核实处置 */
  confirm: [payload: AlarmConfirmPayload]
}>()

/** 弹窗标题：发生火警 / 发生故障 … */
const title = computed(() => props.detail?.title ?? '警情详情')

/** 报警单位信息字段（设计稿 #199:740 的 6 行） */
const companyFields = computed(() => {
  const c = props.detail?.company
  if (!c) return []
  return [
    { label: '企业名称：', value: c.name },
    { label: '企业标签：', value: c.tag },
    { label: '企业类型：', value: c.type },
    { label: '风险等级：', value: c.riskLevel },
    { label: '负责人：', value: c.owner },
    { label: '详细地址：', value: c.address },
  ]
})

/** 持续报警数据 */
const timeline = computed(() => props.detail?.timeline ?? [])

/** 报警设备信息 */
const device = computed(
  () =>
    props.detail?.device ?? {
      device: '-',
      position: '-',
      content: '-',
      unit: '-',
      latestAt: '-',
      firstAt: '-',
      code: '-',
      value: '-',
      image: '-',
      contact: '-',
    },
)

/** 设备运行状态 */
const deviceStatus = computed(() => props.detail?.deviceStatus ?? '-')

/** 核实结果（单选） */
const verify = ref('')
/** 处理结果（单选） */
const handle = ref('')
/** 处理说明 */
const remark = ref('')
/** 校验提示 */
const error = ref('')

/** 每次打开弹窗重置处置项：上一条警情的核实结果不该带到下一条。
    弹窗开着时换一条警情（detail 变了）同样要重置。 */
watch(
  () => [props.modelValue, props.detail] as const,
  ([open]) => {
    if (!open) return
    verify.value = defaultVerifyOf(device.value.content)
    handle.value = ''
    remark.value = ''
    error.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

/** 提交：处理结果必填 */
function submit() {
  if (!handle.value) {
    error.value = '请先选择处理结果'
    return
  }
  error.value = ''
  emit('confirm', {
    key: props.detail?.key ?? '',
    content: device.value.content,
    verify: verify.value,
    handle: handle.value,
    remark: remark.value.trim(),
  })
  close()
}

/** Esc 关闭 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 遮罩 ===== */
.ad__mask {
  position: fixed;
  inset: 0;
  z-index: 10040;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 设计稿 #200:1296 的径向遮罩：中心浅、四周深 */
  background: radial-gradient(circle at 50% 50%, rgba(0, 13, 52, 0.21) 0%, rgba(0, 13, 52, 0.52) 100%);
}

/* ===== 弹窗本体 ===== */
.ad {
  width: vw(1340);
  max-width: calc(100vw - vw(40));
  max-height: calc(100vh - vh(80));
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(74, 110, 255, 0.45);
  border-radius: vw(6);
  background: #000d34;
  /* 火警红晕：设计稿 0 0 15px 11px rgba(226,65,65,.45) */
  box-shadow: 0 0 vh(15) vh(11) rgba(226, 65, 65, 0.45);
  overflow: hidden;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.ad-fade-enter-active,
.ad-fade-leave-active {
  transition: opacity 0.2s ease;
}
.ad-fade-enter-from,
.ad-fade-leave-to {
  opacity: 0;
}

/* ===== 标题栏 ===== */
.ad__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(16);
  padding: vh(16) vw(16);
  background: rgba(4, 21, 51, 0.9);
}

.ad__head-lead {
  display: flex;
  align-items: center;
  gap: vw(4);
  min-width: 0;
}

/* 标题图标：Figma 原图导出（火警红已烤进图里） */
.ad__head-icon {
  flex-shrink: 0;
  width: min(vw(24), vh(24));
  height: min(vw(24), vh(24));
  display: block;
}

.ad__title {
  margin: 0;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  font-weight: 700;
  line-height: 1.5;
  color: #e74e4e;
  white-space: nowrap;
}

.ad__close {
  flex-shrink: 0;
  width: min(vw(24), vh(24));
  height: min(vw(24), vh(24));
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.18s, transform 0.18s;

  img {
    width: 100%;
    height: 100%;
    display: block;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.06);
  }
}

/* ===== 分隔线 ===== */
.ad__sep {
  flex-shrink: 0;
  height: 1px;
  margin: 0 vw(20);
  background: rgba(120, 190, 255, 0.16);
}

/* ===== 主体 ===== */
.ad__body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: vw(12);
  padding: vh(16) vw(16);
  background: rgba(4, 21, 51, 0.9);
  overflow: auto;
}

/* 左列：自适应宽度 */
.ad__col--left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* ===== 卡片 ===== */
.ad__card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(10);
  padding: vh(12) vw(12);
  border-radius: vw(4);
  background: rgba(0, 44, 94, 0.72);
}

/* 带描边的两张卡（持续报警数据 / 警情处置）：设计稿描边 rgba(255,255,255,.06)。
   用 inset 阴影而不是 border —— border 会把卡片撑大 2px，与设计稿的 422 宽对不上。 */
.ad__card--stroke {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

/* 两张 422 宽的卡：报警设备信息 / 警情处置 */
.ad__card--device,
.ad__card--handle {
  width: vw(422);
  flex-shrink: 0;
}

/* 卡片标题行 */
.ad__card-head {
  flex-shrink: 0;
  height: vh(36);
  display: flex;
  align-items: center;
  gap: vw(8);
}

/* 标题前的蓝色竖条（设计稿 #200:1057：4×16、圆角 4） */
.ad__card-bar {
  flex-shrink: 0;
  width: vw(4);
  height: vh(16);
  border-radius: vw(4);
  background: rgba(0, 134, 228, 0.9);
}

.ad__card-title {
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1.2;
  color: #d4e6ff;
  white-space: nowrap;
}

/* ===== 字段行 ===== */
.ad__fields {
  display: flex;
  flex-direction: column;
}

.ad__fields--grow {
  flex: 1;
  min-height: 0;
}

.ad__row {
  display: flex;
  align-items: center;
  padding: vh(12) 0;
  border-bottom: 1px solid rgba(120, 190, 255, 0.07);
}

/* 字段组的最后一行不画分隔线（设计稿用不同组件表示） */
.ad__fields .ad__row:last-child {
  border-bottom: 0;
}

/* 组行（核实结果 / 处理结果 / 处理说明）：
   设计稿这三行也是"标签在左、内容在右"的横排（#200:1214 / #200:1238 / #200:1274
   都是 row 布局），内容超出时在右侧区域内换行。 */
.ad__row--group {
  align-items: center;
}

/* 处理说明行：输入框 104 高，标签与输入框首行齐平（设计稿是顶对齐，不是垂直居中） */
.ad__row--remark {
  align-items: flex-start;
}

.ad__label {
  flex-shrink: 0;
  width: vw(86);
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 18px;
  color: #c7d7ed;
  /* 标签定宽 86px，长标签在框内折行（设计稿「最新报警时间：」就是折成两行），
     不折行会压到右侧的值上。 */
  white-space: normal;
  word-break: break-all;
}

.ad__row--group .ad__label {
  width: vw(86);
}

.ad__value {
  flex: 1;
  min-width: 0;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 18px;
  color: #ffffff;
  word-break: break-all;
}

/* 告警内容：火警红（设计稿 #E74E4E，粗体） */
.ad__value--alert {
  color: #e74e4e;
  font-weight: 700;
}

/* 实时视频图标 */
.ad__video {
  display: block;
  width: vw(42);
  height: auto;
}

/* ===== 持续报警数据（时间线） ===== */
.ad__timeline {
  flex-shrink: 0;
  height: vh(330);
  border-radius: vw(3);
  overflow: hidden;
}

.ad__tl {
  position: relative;
  height: vh(256);
  padding: vh(8) 0 0 vw(24);
}

/* 时间轴竖线（设计稿 #200:1120：2×120、#2A4066） */
.ad__tl-line {
  position: absolute;
  left: vw(7);
  top: vh(14);
  width: 2px;
  height: vh(120);
  background: #2a4066;
}

.ad__tl-item {
  position: relative;
  display: flex;
  flex-direction: column;
  padding-bottom: vh(16);
}

/* 时间与类型分两行（设计稿：时间在上、类型另起一行左对齐） */
.ad__tl-time {
  font-size: clamp(12px, calc(12 * var(--min-scale)), 12px);
  font-weight: 500;
  line-height: 1.6;
  color: #a9b8cc;
  font-variant-numeric: tabular-nums;
}

.ad__tl-type {
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1.6;
  color: #ece5d6;
}

/* 节点圆点：选中项大一号、走亮蓝 + 深蓝描边，其余小一号 */
.ad__tl-dot {
  position: absolute;
  left: vw(-20);
  top: vh(6);
  width: vw(8);
  height: vw(8);
  border-radius: 50%;
  background: #9fc1db;
  box-shadow: 0 0 0 2px #9fc1db;
}

.ad__tl-item.is-active .ad__tl-dot {
  left: vw(-22);
  top: vh(4);
  width: vw(12);
  height: vw(12);
  background: #5aa9e6;
  box-shadow: 0 0 0 2px #007dd5;
}

/* ===== 单选组 ===== */
.ad__radios {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: vw(20);
}

/* 处理结果：设计稿是两列 —— 火警排除 / 转隐患处置 在第一行，
   生成真实警情 落到第二行第一列（#200:1260 的三枚按 x=0 / x=96 排布）。
   用固定列宽的网格复刻，不用自动换行：三枚在一行放得下，
   自动换行就永远折不出来。 */
.ad__radios--wrap {
  display: grid;
  grid-template-columns: vw(96) auto;
  column-gap: 0;
  row-gap: 0;
  align-items: center;
}

.ad__radio-item {
  display: flex;
  align-items: center;
  height: vh(32);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

/* 单选圈：14×14、白色底 + #DCDFE6 描边 */
.ad__radio {
  position: relative;
  flex-shrink: 0;
  width: vw(14);
  height: vw(14);
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  background: #ffffff;
}

.ad__radio.is-on {
  border-color: #4a79ee;
  background: #4a79ee;
}

/* 选中态中心 4×4 白点 */
.ad__radio.is-on::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: vw(4);
  height: vw(4);
  margin: calc(vw(-2)) 0 0 calc(vw(-2));
  border-radius: 50%;
  background: #ffffff;
}

.ad__radio-text {
  margin-left: vw(8);
  font-size: clamp(12px, calc(12 * var(--min-scale)), 12px);
  font-weight: 500;
  line-height: 1.5;
  color: #ffffff;
  white-space: nowrap;
}

/* ===== 处理说明 ===== */
.ad__textarea {
  width: 100%;
  height: vh(104);
  padding: vh(12);
  border: 1px solid #1a4573;
  border-radius: vw(8);
  background: transparent;
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.18s;

  &::placeholder {
    color: #a9c9ea;
  }

  &:focus {
    border-color: rgba(0, 134, 228, 0.9);
  }
}

/* ===== 底部 ===== */
.ad__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: vw(16);
  padding: 0 vw(16) vh(16);
  background: rgba(4, 21, 51, 0.9);
}

/* 校验提示：占住底部左侧，按钮仍右对齐（设计稿按钮右对齐） */
.ad__error {
  margin-right: auto;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1.2;
  color: #ff8080;
}

.ad__submit {
  height: vh(36);
  padding: vh(8) vw(18);
  border: 0;
  border-radius: vw(8);
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1.25;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;

  &:hover {
    background: rgba(0, 154, 240, 0.95);
    box-shadow: 0 0 vh(10) rgba(0, 134, 228, 0.45);
  }
}
</style>
