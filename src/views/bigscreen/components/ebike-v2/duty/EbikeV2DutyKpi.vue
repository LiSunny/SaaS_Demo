<template>
  <div class="kpi">
    
    <!-- ===== 三张计数卡（设计稿 EL-7cf51341：等分整行） ===== -->
    <section v-for="c in countCards" :key="c.key" class="kpi__card kpi__card--count">
      <span class="kpi__emblem">
        <img :src="emblem" alt="" />
      </span>
      <div class="kpi__text">
        <div class="kpi__label">
          <span>{{ c.label }}</span>
          <img class="kpi__note" :src="infoIcon" alt="" :title="c.hint" />
        </div>
        <div class="kpi__value">
          <span class="kpi__num" :class="{ 'is-abnormal': c.tone === 'abnormal' }">{{ c.value }}</span>
          <span class="kpi__unit">{{ c.unit }}</span>
        </div>
      </div>
    </section>

    <!-- ===== 两张比率卡（设计稿 EL-2a5f1fc0：内容宽度的 hug 卡，右侧带环 + 图例） ===== -->
    <section v-for="r in rateCards" :key="r.key" class="kpi__card kpi__card--rate">
      <span class="kpi__emblem">
        <img :src="emblem" alt="" />
      </span>
      <div class="kpi__text">
        <div class="kpi__label">
          <span>{{ r.label }}</span>
          <img class="kpi__note" :src="infoIcon" alt="" :title="r.hint" />
        </div>
        <div class="kpi__value">
          <span class="kpi__num">{{ r.value }}</span>
          <span class="kpi__unit">%</span>
        </div>
      </div>

      <!-- 状态分布环 + 图例 -->
      <div class="kpi__legend">
        <FireDonut :segments="r.segments" :size="66" :thickness="7" />
        <div class="kpi__legend-list">
          <div v-for="d in r.dist" :key="d.key" class="kpi__legend-row">
            <i class="kpi__dot" :style="{ background: d.color }" />
            <span class="kpi__legend-label">{{ d.label }}</span>
            <b class="kpi__legend-value">{{ (d.ratio * 100).toFixed(1) }}%</b>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 交接班 ===== -->
    <button type="button" class="kpi__handover" @click="emit('handover')">交接班</button>
  </div>
</template>

<script setup lang="ts">
/**
 * 实时警情页 · 顶部 KPI 行
 *
 * 版式按 Figma「智能安全管控平台/实时警情」节点 86:8287（KPI 行 #140:25513）重做：
 *
 *   计数卡 ×3   设计稿 EL-7cf51341：图标 + 标题(ⓘ) + 数值，三张等分整行宽度
 *   比率卡 ×2   设计稿 EL-2a5f1fc0：图标 + 标题(ⓘ) + 数值 + 状态分布环 + 两行图例
 *   交接班      设计稿 #140:25661：150 宽主按钮 rgba(0,134,228,.9)，圆角 8
 *
 * 数值口径（与消防总览页「设备状态监控」卡同一份，见 fire-mock.ts）：
 *   设备完好率 =（设备总数 − 故障 − 离线）/ 设备总数
 *   设备在线率 =（设备总数 − 离线）/ 设备总数
 * 台数取平台设备档案（config/subsystem-profiles.ts 的 scale），是真实规模；
 * 故障 / 离线为演示计数。
 *
 * 与设计稿的有意偏离（勿"顺手改回去"）：
 *   1. 图例文字色：设计稿写 #5E5E5E / #454545，落在深蓝玻璃底上实测对比度不足
 *      2:1（裁图核对过，渲染出来是一层暖灰）。本项目文字色阶最低 4.5:1，
 *      改走 L3 #8fb0d8（名称）+ L2 #a9c9ea（百分比）。
 *   2. 图例字号：设计稿 12px，低于本项目全大屏 14px 下限（$fire-min-size），按 14px 落地，
 *      图例列宽从设计稿的 91 放宽到 104 以容纳。
 *   3. 环的配色：设计稿「异常 / 离线」用绿 #059669。绿在消防语境里就是"正常 / 安全"，
 *      把离线画成绿会让值班员读反；且本项目色彩规则是"异常数据统一一个红"。
 *      故正常 / 在线用设计稿的蓝 #3678E3，异常 / 离线用异常红 #ff8080。
 *   4. 前三张卡设计稿的占位值是百分比（97.7%），实际是事件计数，单位按「个」写，
 *      不给计数套百分比号。
 */
import { computed } from 'vue'
import FireDonut from '../fire/FireDonut.vue'
import { DEVICE_OVERALL } from '../fire/fire-mock'
import type { DutyKpi } from './duty-data'

const props = defineProps<{
  kpi: DutyKpi
}>()

const emit = defineEmits<{ (e: 'handover'): void }>()

/** 设计稿「组合 4」徽标：与消防总览页「设备状态监控」卡同一枚六边形文档徽标 */
const emblem = new URL('@/assets/bigscreen/ebike-v2/fire/fire-state-hexagon.png', import.meta.url)
  .href
/** 设计稿标题后的 ⓘ 说明角标（13×13，Figma 原图） */
const infoIcon = new URL('@/assets/bigscreen/ebike-v2/duty/info-icon.svg', import.meta.url).href

/** 正常 / 在线：设计稿的蓝 */
const SEG_OK = '#3678E3'
/** 异常 / 离线：项目异常红（见文件头偏离说明 3） */
const SEG_BAD = '#ff8080'

/* ============================================================
 * 计数卡
 * ============================================================ */

const countCards = computed(() => {
  const k = props.kpi
  return [
    {
      key: 'confirmed',
      label: '今日已核实事件',
      value: String(k.confirmedToday),
      unit: '个',
      tone: 'normal' as const,
      hint: '今日已完成核实处置的事件数',
    },
    {
      key: 'unconfirmed',
      label: '待核实事件',
      value: String(k.unconfirmed),
      unit: '个',
      tone: k.unconfirmed > 0 ? ('abnormal' as const) : ('normal' as const),
      hint: '当前仍待值班员核实的警情条数',
    },
    {
      key: 'fire',
      label: '待核实火警',
      value: String(k.fire),
      unit: '个',
      tone: k.fire > 0 ? ('abnormal' as const) : ('normal' as const),
      hint: '待核实事件中判定为火警的条数',
    },
  ]
})

/* ============================================================
 * 比率卡
 * ============================================================ */

/** 设备总数（台） */
const total = DEVICE_OVERALL.total

/** 完好率：可用设备（总数 − 故障 − 离线）÷ 总数 */
const intact = computed(() => {
  const ok = DEVICE_OVERALL.available
  const bad = total - ok
  return {
    ok,
    bad,
    rate: total > 0 ? (ok / total) * 100 : 0,
  }
})

/** 在线率：在线设备（总数 − 离线）÷ 总数 */
const online = computed(() => {
  const off = DEVICE_OVERALL.offline
  const on = total - off
  return {
    on,
    off,
    rate: total > 0 ? (on / total) * 100 : 0,
  }
})

const rateCards = computed(() => {
  const i = intact.value
  const o = online.value
  const t = total || 1

  const mk = (
    key: string,
    label: string,
    hint: string,
    value: number,
    a: { label: string; count: number; color: string },
    b: { label: string; count: number; color: string },
  ) => ({
    key,
    label,
    hint,
    value: value.toFixed(1),
    dist: [
      { key: `${key}-a`, label: a.label, ratio: a.count / t, color: a.color },
      { key: `${key}-b`, label: b.label, ratio: b.count / t, color: b.color },
    ],
    segments: [
      { value: a.count / t, color: a.color },
      { value: b.count / t, color: b.color },
    ],
  })

  return [
    mk(
      'intact',
      '设备完好率',
      `可用设备 ${i.ok} 台 ÷ 接入设备 ${total} 台 = ${i.rate.toFixed(1)}%`,
      i.rate,
      { label: '正常', count: i.ok, color: SEG_OK },
      { label: '异常', count: i.bad, color: SEG_BAD },
    ),
    mk(
      'online',
      '设备在线率',
      `在线设备 ${o.on} 台 ÷ 接入设备 ${total} 台 = ${o.rate.toFixed(1)}%`,
      o.rate,
      { label: '在线', count: o.on, color: SEG_OK },
      { label: '离线', count: o.off, color: SEG_BAD },
    ),
  ]
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.kpi {
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  gap: vw(16);
}

/* ===== 卡片壳：设计稿 EL-7cf51341 =====
   底 rgba(0,44,94,.72) + 描边 rgba(0,152,230,.16) + 圆角 3 */
.kpi__card {
  display: flex;
  align-items: center;
  gap: vw(22);
  padding: vh(18) vw(18);
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.72);
  min-width: 0;
}

/* 三张计数卡：等分整行剩余宽度
   —— flex-basis 必须锁0：写成 auto 时三张卡会按各自文案宽度分配，
      第一张「今日已核实事件」文案更长 → 变成 249/220/220，不再等分 */
.kpi__card--count {
  flex: 1 1 0;
  /*改 flex-start：文字块自适应后三张卡内容宽度不同，
  居中会让三个徽标错位（实测 19.2 / 34 / 34），左对齐后齐平（19 / 19 / 19） */
  justify-content: flex-start;
}

/* 计数卡的文字列由固定 168 宽改为自适应内容宽度
   —— 只限定在计数卡下：比率卡共用 .kpi__text，全局改会把比率卡从 484.7 压到 402.6，
 破坏设计稿 EL-2d7cdc13 的版式 */
.kpi__card--count .kpi__text {
  width: auto;
}

/* 两张比率卡：内容宽度 */
.kpi__card--rate {
  flex: 0 0 auto;
}

/* 徽标：设计稿「组合 4」48.72×47.95 */
.kpi__emblem {
  flex-shrink: 0;
  width: vw(48.72);
  height: vh(47.96);
  display: block;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

/* 文字列：设计稿 EL-2d7cdc13 固定 168 宽 */
.kpi__text {
  flex-shrink: 0;
  width: vw(168);
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* 标题行：名称 + ⓘ */
.kpi__label {
  @include fire-label(15);
  color: var(--fire-text-title);
  display: flex;
  align-items: center;
  gap: vw(4);
  white-space: nowrap;
}

.kpi__note {
  flex-shrink: 0;
  width: vw(13);
  height: vw(13);
  display: block;
}

/* 数值行 */
.kpi__value {
  display: flex;
  align-items: baseline;
  gap: vw(2);
  height: vh(40);
}

/* 主数值 28px：设计稿 ts1 的纵向渐变 #A5CEFF→#D0E4FC */
.kpi__num {
  @include fire-value(28);
  background: linear-gradient(180deg, #a5ceff 0%, #d0e4fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}

/* 异常计数：红渐变（暗端即本项目统一异常红 #ff8080） */
.kpi__num.is-abnormal {
  background-image: linear-gradient(180deg, #ff8080 0%, #ffb3b3 100%);
}

/* 单位 16px */
.kpi__unit {
  @include fire-sub(16);
  font-style: normal;
}

/* ===== 状态分布环 + 图例 ===== */
.kpi__legend {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(16);
  height: vh(66);
}

.kpi__legend-list {
  width: vw(104);
  display: flex;
  flex-direction: column;
  gap: vh(4);
  padding-top: vh(4);
}

.kpi__legend-row {
  display: flex;
  align-items: center;
  gap: vw(6);
  min-width: 0;
}

/* 色标 8×8 圆角 2 */
.kpi__dot {
  flex-shrink: 0;
  width: vw(8);
  height: vw(8);
  border-radius: vw(2);
}

.kpi__legend-label {
  @include fire-sub(14);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi__legend-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  color: var(--fire-text-label);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ===== 交接班按钮：设计稿 #140:25661 ===== */
.kpi__handover {
  flex: 0 0 vw(150);
   /* 计数卡收缩后中间空出 ~77px，按钮会左飘；auto 把它钉回行右缘 */
  margin-left: auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: vw(8);
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  font-weight: 500;
  letter-spacing: -0.0094em;
  cursor: pointer;
  transition: background 0.18s;

  &:hover {
    background: rgba(0, 152, 230, 0.95);
  }
}
</style>
