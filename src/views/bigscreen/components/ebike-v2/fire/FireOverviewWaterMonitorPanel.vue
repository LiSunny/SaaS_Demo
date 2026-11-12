<template>
  <EbikeV2Card title="消防用水监控">
    <div class="wm">
      <!-- ===== 三项指标：图标 + 名称ⓘ + 数值 + 24h 迷你趋势 ===== -->
      <div
        v-for="m in metrics"
        :key="m.key"
        class="wm__metric"
        :class="{ 'wm__metric--entry': m.key === 'tank' }"
        :role="m.key === 'tank' ? 'button' : undefined"
        :tabindex="m.key === 'tank' ? 0 : undefined"
        :title="m.key === 'tank' ? '点击进入泵房场景监控' : undefined"
        :aria-label="m.key === 'tank' ? '水箱液位，点击进入泵房场景监控' : undefined"
        @click="m.key === 'tank' && goPumpRoom()"
        @keydown.enter="m.key === 'tank' && goPumpRoom()"
      >
        <!-- 图标：设计稿 48.72×47.96 原图导出。
             原先叠在图标右下角的「下钻箭头徽标」已按用户要求去除
             （2026-11-03）：它是手写 SVG，与项目「禁止手写 SVG」的规矩冲突，
             压在图标上也压观感。整块下钻能力保留，改由 hover 底色 + 焦点框
             + 原生 tooltip 承担提示；图标直接作为 flex 子元素，横向排布
             （图标 48.72 + 文字列 126 + 趋势图 291 = 497.8）不变。 -->
        <img class="wm__icon" :src="METRIC_ICON" alt="" />
        <div class="wm__text">
          <div class="wm__name">
            <span class="wm__name-text">{{ m.name }}</span>
            <svg class="wm__info" viewBox="0 0 12 12" width="13" height="13">
              <title>{{ m.hint }}</title>
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.1" />
              <path d="M6 3.1v3.3M6 8.5v.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </div>
          <div class="wm__value">
            <span class="wm__num" :class="{ 'is-abnormal': m.abnormal }">{{ m.value }}</span>
            <span class="wm__unit">{{ m.unit }}</span>
          </div>
        </div>
        <FireTrendSpark
          class="wm__chart"
          :series="m.trend"
          :aria-label="`${m.name} 24 小时趋势`"
        />
      </div>

      <div class="wm__divider" />

      <!-- ===== 最近警情：分区标题 + 更多入口 ===== -->
      <div class="wm__section">
        <span class="wm__section-title">实时警情</span>
        <span class="wm__more">更多 ›</span>
      </div>

      <!-- ===== 警情列表：2 行式（角标 + 标题 + 时间 / 位置） =====
           整条可点：点开警情弹窗看警情详情（设计稿 200:1296） -->
      <div class="wm__list">
        <div
          v-for="r in visibleRows"
          :key="r.key"
          class="wm__item"
          role="button"
          tabindex="0"
          :aria-label="`查看警情详情：${r.badge} ${r.title}`"
          @click="emit('alarmClick', r)"
          @keyup.enter="emit('alarmClick', r)"
          @keyup.space="emit('alarmClick', r)"
        >
          <div class="wm__item-head">
            <span class="wm__item-lead">
              <span class="wm__badge">{{ r.badge }}</span>
              <button type="button" class="wm__item-title" @click.stop="emit('alarmClick', r)">
                {{ r.title }}
              </button>
            </span>
            <span class="wm__item-time">{{ r.time }}</span>
          </div>
          <span class="wm__item-loc">{{ r.location }}</span>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 消防用水监控
 *
 * 版式按 Figma 94:9824 左上卡（设计稿 521.8×462）重做：
 *
 *   三行指标  每行：48.72×47.96 图标（设计稿原图导出）+ 名称(ⓘ 13×13)
 *                + 28px 数值 + 单位，右侧一张 291×65 的 24h 迷你趋势面积图
 *                图标 48.72 + 间距 16 + 文字列 126 + 间距 16 + 图 291 = 497.8
 *                正好铺满卡内容区（521.8 − 12×2）
 *   分隔线    1px
 *   分区标题  蓝色竖条 + 「最近警情（近 5 条）」15px + 右对齐「更多 ›」
 *   列表      单容器（底 rgba(0,31,60,.5)、圆角 4、内距 6px 8px）
 *             每条 2 行：① 胶囊角标 + 事件标题 + 右对齐完整时间戳 ② 位置
 *             行间 1px 虚线（#234972，2-2 虚线）
 *
 * 数值与趋势口径见 water-metrics.ts：全部复用平台绑定表
 * （config/firewater-scene.ts）与点位解析，与组态画面、消防水系统监测页一致。
 * 迷你趋势图自己画 SVG 而不是接 ECharts，理由见 FireTrendSpark.vue。
 *
 * 警情列表用 WATER_ALARM_ROWS（fire-mock.ts）：只挂水系统自己的告警，
 * 右侧「实时警情监控」卡的跨系统列表是另一份 ALARM_ROWS，两者不混用。
 *
 * 与设计稿的有意偏离：
 *   1. 数值红色渐变的暗端用 #FF8080 而非设计稿的 #E5523F ——
 *      #E5523F 在卡片底色上实测仅 3.73:1，达不到 4.5:1 的 AA 底线。
 *   2. 单位「%」「MPa」用 L2 #A9C9EA 而非设计稿的 #8FB0D8：它与右上卡的
 *      「件」、右下卡的「个」是同一个角色（核心数值后的单位），同页同角色同色。
 *   3. 角标文字 14px、设计稿 10px；「更多 ›」14px、设计稿 12px。
 *      全大屏字号下限 14px（fire-common.scss 的 $fire-min-size）。
 *   4. 列表显示 2 条：设计稿的列表区只有 125px 高（卡片 462 − 内容区起 326），
 *      放得下 2 条，第 3 条在设计稿里根本排不下。本卡随左列等分后高度 481，
 *      2 条各分到 62px，全部完整显示不裁切。
 */
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useSubsystemStore } from '@/stores/subsystem'
import EbikeV2Card from '../EbikeV2Card.vue'
import FireTrendSpark from './FireTrendSpark.vue'
import { WATER_ALARM_ROWS } from './fire-mock'
import type { AlarmRow } from './fire-mock'
import { buildWaterMetrics } from './water-metrics'
import metricGauge from '@/assets/bigscreen/ebike-v2/fire/metric-gauge.png'

/**
 * 点击警情 → 由总览页弹出警情弹窗（设计稿 200:1296）
 *
 * 弹窗本体在总览页（EbikeMonitorV2）持有，内容按警情 key 从
 * alarm-dialog-data.ts 取（水系统警情走 WATER_ALARM_DETAILS）。
 */
const emit = defineEmits<{
  alarmClick: [row: AlarmRow]
}>()

const router = useRouter()
const route = useRoute()

/**
 * 下钻到「水泵房场景监控」二级专题页
 *
 * 只保留 bigscreenId：大屏记录上下文不能丢。
 */
function goPumpRoom() {
  router.push({
    path: '/landing/ebike-v2/pump-room',
    query: route.query.bigscreenId ? { bigscreenId: route.query.bigscreenId } : {},
  })
}

/** 指标图标：设计稿原图导出，三行共用同一枚（设计稿 94:9841 / 9866 / 9891 同素材） */
const METRIC_ICON = metricGauge

/**
 * 设备档案与实时点位
 *
 * 数值与趋势都来自平台档案的实时点位，与「设备设施管理 › 运行监控 ›
 * 消防水系统」页同一套绑定与汇总口径。
 */
const subsystem = useSubsystemStore()
const { points } = storeToRefs(subsystem)

/** 三项指标（含数值、单位、异常态、24h 趋势） */
const metrics = computed(() => buildWaterMetrics(points.value, subsystem.getRuntime))

/** 警情列表可见条数：与设计稿一致（列表区只放得下 2 条） */
const VISIBLE_ROWS = 2

/**
 * 警情列表：水系统专用（消防管网监控档案里的部件）
 *
 * 不用通用的 ALARM_ROWS —— 那份是跨系统总览（给右侧「实时警情监控」卡用），
 * 里面有燃气预警、烟感误报这些非水系统告警，挂在水系统卡下会让值班员误读。
 */
const visibleRows = computed(() => WATER_ALARM_ROWS.slice(0, VISIBLE_ROWS))

onMounted(() => {
  subsystem.loadSubsystem('pipeline')
})

onBeforeUnmount(() => {
  // 与消防水系统监测页同一套生命周期：页面离开即停刷新
  subsystem.stopTimer()
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

/* 卡片内容区：设计稿 #94:9838 —— 内距 10px 12px，块间距 8px */
.wm {
  @include fire-panel;
  gap: vh(8);
}

/* ===== 单行指标 ===== */
.wm__metric {
  display: flex;
  align-items: center;
  gap: vw(16);
  padding-top: vh(8);
  flex-shrink: 0;
}

/* 指标图标：设计稿 48.72×47.96 原图导出 */
.wm__icon {
  flex-shrink: 0;
  width: vw(48.72);
  height: vh(47.96);
  object-fit: contain;
  display: block;
}

/* 文字列：定宽 126px（设计稿 EL-526b07b3） */
.wm__text {
  flex-shrink: 0;
  width: vw(126);
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* 指标名 + ⓘ 说明角标 */
.wm__name {
  display: flex;
  align-items: center;
  gap: vw(4);
  white-space: nowrap;
}

/* ===== 入口行（水箱液位）=====
   水箱液位行可点击下钻到「水泵房场景监控」专题页。
   箭头徽标已按用户要求去除（2026-11-03），下钻提示改由 hover 底色 +
   焦点框 + 原生 tooltip（title）承担：不动卡片横向排布，也不新增图标。 */
.wm__metric--entry {
  position: relative;
  cursor: pointer;
  border-radius: vw(4);
  transition: background 0.15s;
}

.wm__metric--entry:hover {
  background: rgba(0, 84, 160, 0.28);
}

.wm__metric--entry:focus-visible {
  outline: 1px solid rgba(96, 200, 255, 0.6);
  outline-offset: 1px;
}

.wm__name-text {
  @include fire-label(15);
  color: var(--fire-text-title);
  line-height: 1.12;
}

.wm__info {
  flex-shrink: 0;
  color: var(--fire-text-sub);
}

/* 数值行：高 40px（设计稿 EL-f5d9400b），基线对齐 */
.wm__value {
  height: vh(40);
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

/**
 * 核心数值：28px 纵向渐变。
 * 声明色保留在 L0 白（脚本按声明色量对比度），视觉上叠一层渐变。
 * 行高 1.4143 = 设计稿 39.6px —— 行高决定行高，与设计稿逐像素对齐。
 */
.wm__num {
  @include fire-value(28);
  line-height: 1.4143;
  background: linear-gradient(180deg, #a5ceff 0%, #d0e4fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}

/* 异常数值：换成异常红渐变（暗端即本页统一异常红 #FF8080）。
   用 background-image 而不是 background —— 后者会把 background-clip 重置回
   border-box，渐变会铺满整个数字的盒子，文字被 fill-color: transparent 吃掉。 */
.wm__num.is-abnormal {
  color: var(--fire-anomaly);
  background-image: linear-gradient(180deg, #ff8080 0%, #ffb3b3 100%);
}

.wm__unit {
  @include fire-label(16);
  color: var(--fire-text-label);
  flex-shrink: 0;
}

/* 迷你趋势图：291×65（设计稿 EL-81a1193a） */
.wm__chart {
  flex: 1;
  min-width: 0;
  height: vh(65);
}

.wm__divider {
  @include fire-divider;
}

/* ===== 分区标题 + 更多入口 ===== */
.wm__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  flex-shrink: 0;
}

.wm__section-title {
  @include fire-section-title(15);
  /* 行高 1.12 = 设计稿 16.8px（style_baa99601） */
  line-height: 1.12;

  /* 设计稿竖条圆角 3px（3px 宽 → 圆头） */
  &::before {
    border-radius: 3px;
  }
}

/* 「更多 ›」：设计稿 #92DBFF，是可点入口，不占用文字色阶。
   行高写死 1.2（16.8px）：不写默认 normal 会撑到 20px，把下方列表压低。 */
.wm__more {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1.2;
  color: #92dbff;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== 警情列表：单容器（设计稿 #94:9921） ===== */
.wm__list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
  padding: vh(6) vw(8);
  border-radius: vw(4);
  background: rgba(0, 31, 60, 0.5);
  overflow: hidden;
}

/* 每条 2 行；行间虚线（设计稿 1px #234972，2-2 虚线）。
   flex:1 让各条均分列表高度；子项 flex-shrink:0 兜底 ——
   行高不够时宁可溢出，也不裁字。 */
.wm__item {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(7);
  padding: vh(6) 0;
  border-bottom: 1px dashed #234972;
  /* 可点：点开警情弹窗看详情 */
  cursor: pointer;
  transition: background 0.18s;
}

.wm__item:hover {
  background: rgba(0, 84, 160, 0.18);
}

.wm__item:focus-visible {
  outline: 1px solid rgba(96, 200, 255, 0.6);
  outline-offset: -1px;
}

.wm__item-head,
.wm__item-loc {
  flex-shrink: 0;
}

.wm__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  min-width: 0;
}

.wm__item-lead {
  display: flex;
  align-items: center;
  gap: vw(16);
  min-width: 0;
}

.wm__badge {
  @include fire-badge(255, 128, 128, 0.16, 0.2);
}

.wm__item-title {
  @include fire-label(15);
  color: var(--fire-text-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 标题做成按钮（整行可点的键盘入口）：复位浏览器默认按钮外观 */
  padding: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.wm__item-time {
  @include fire-sub(14);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 位置：行内辅助信息，比标题弱一级 */
.wm__item-loc {
  @include fire-sub(14);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
