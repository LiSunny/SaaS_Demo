<template>
  <EbikeV2Card title="消防设备完好率">
    <div class="iip">
      <!-- ===== 总体块：图标 + 标题(说明角标) + 完好率数值 + 状态分布环 ===== -->
      <div class="iip__total">
        <div class="iip__total-row">
          <span class="iip__iconbox">
            <FireSystemIcon system="bookmark" :size="28" />
          </span>

          <div class="iip__total-text">
            <div class="iip__total-title">
              完好率
              <svg v-if="hasIssue" class="iip__note" viewBox="0 0 12 12" width="13" height="13">
                <title>存在报警 / 故障 / 离线设备</title>
                <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.1" />
                <path d="M6 3.1v3.3M6 8.5v.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
            </div>
            <div class="iip__total-value">
              <span class="iip__value-num" :style="{ color: dataColor(overallTone(DEVICE_OVERALL.rate)) }">
                {{ DEVICE_OVERALL.rate.toFixed(1) }}
              </span>
              <span class="iip__unit">%</span>
            </div>
          </div>

          <!-- 状态分布环形图 -->
          <span class="iip__ring">
            <FireDonut :segments="donutSegments" :size="64" :thickness="9" />
          </span>
        </div>

        <!-- 状态分布图例：2 行 2 列，方块色标 + 名称 + 右对齐百分比 -->
        <div class="iip__legend">
          <span v-for="d in OVERALL_DIST" :key="d.key" class="iip__legend-item">
            <span class="iip__legend-label">
              <i class="iip__legend-dot" :style="{ background: d.color }" />{{ d.label }}
            </span>
            <b>{{ (d.ratio * 100).toFixed(1) }}%</b>
          </span>
        </div>
      </div>

      <div class="iip__divider" />

      <!-- ===== 8 个系统：2 列 4 行，每格两行（名称 + 台数 / 完好率 + 占比条 + 百分比） ===== -->
      <div class="iip__systems">
        <div v-for="(row, ri) in sysRows" :key="ri" class="iip__sys-row">
          <div v-for="r in row" :key="r.key" class="iip__sys">
            <div class="iip__sys-head">
              <span class="iip__sys-icon" :style="{ color: r.pending ? 'var(--fire-text-dim)' : iconColor(r) }">
                <FireSystemIcon :system="r.icon" :size="14" />
              </span>
              <span class="iip__sys-name" :title="r.name">{{ r.name }}</span>
              <span class="iip__sys-total">{{ r.pending ? '待接入' : r.total }}</span>
            </div>
            <div class="iip__sys-foot">
              <span class="iip__sys-label">完好率</span>
              <span v-if="!r.pending" class="iip__sys-bar">
                <i :style="{ width: normalWidth(r) }" />
              </span>
              <span class="iip__sys-rate" :style="{ color: rateColor(r) }">
                {{ r.pending ? '—' : `${r.rate.toFixed(1)}%` }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 消防设备完好率
 *
 * 版式按 Figma 70:703（总览页右列上卡，396×500）重做：
 *
 *   总体块  图标 48×48 + 「完好率」(说明角标) + 数值 32px + 状态分布环 64×64
 *           下方 2 行 2 列图例：10×10 方块 + 名称 15px + 右对齐百分比 16px
 *   分隔线  1px
 *   8 系统  2 列 4 行卡片（底 rgba(0,84,160,0.2)、圆角 4、内距 8）
 *           每格两行：① 14px 图标 + 系统全称 14px + 右对齐台数 15px
 *                     ② 「完好率」14px + 占比条 4px + 右对齐百分比 14px
 *
 * 数值口径：完好率 =（总数 − 故障 − 离线）/ 总数，由 `fire-mock.ts` 算出，不手写百分比。
 * 尚未建档案的 5 个系统显示"待接入"，不用 mock 数字冒充。
 */
import { computed } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import FireDonut from './FireDonut.vue'
import FireSystemIcon from './FireSystemIcon.vue'
import {
  DEVICE_OVERALL,
  OVERALL_DIST,
  RATE_TARGET,
  SYSTEM_ROWS,
  dataColor,
  type SystemRow,
  type Tone,
} from './fire-mock'

/** 有故障 / 报警 / 离线时，标题右侧挂说明角标（中性蓝，不作告警色） */
const hasIssue = computed(() => DEVICE_OVERALL.fault + DEVICE_OVERALL.alarm + DEVICE_OVERALL.offline > 0)

/** 环形图分段：占比为 0 的状态不进环 */
const donutSegments = computed(() =>
  OVERALL_DIST.filter((d) => d.count > 0).map((d) => ({ value: d.ratio, color: d.color })),
)

/** 8 个系统按 2 列切成 4 行 */
const sysRows = computed(() => {
  const rows: SystemRow[][] = []
  for (let i = 0; i < SYSTEM_ROWS.length; i += 2) rows.push(SYSTEM_ROWS.slice(i, i + 2))
  return rows
})

/** 系统行堆叠条：只画正常占比，其余留空，不做四态细分 */
function normalWidth(r: SystemRow): string {
  if (!r.total) return '0%'
  return `${((r.normal / r.total) * 100).toFixed(2)}%`
}

/** 完好率是否达标：达标为正常，低于目标即异常（同一个红） */
function overallTone(rate: number): Tone {
  return rate >= RATE_TARGET ? 'normal' : 'abnormal'
}

/** 系统行百分比：待接入无数据，用最弱辅助色；达标淡蓝，不达标异常红 */
function rateColor(r: SystemRow): string {
  if (r.pending) return 'var(--fire-text-dim)'
  return dataColor(overallTone(r.rate), 'label')
}

/** 图标颜色跟该系统最差状态 */
function iconColor(r: SystemRow): string {
  if (r.fault > 0 || r.alarm > 0 || r.offline > 0) return 'var(--fire-anomaly)'
  return 'var(--fire-neutral)'
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

/* 卡片内容区：设计稿 #70:718 —— 内距 10px 12px，块间距 12px */
.iip {
  @include fire-panel;
  gap: vh(12);
}

/* ===== 总体块：设计稿 #70:719（内距 8px 12px 0，无底色） ===== */
.iip__total {
  display: flex;
  flex-direction: column;
  gap: vh(8);
  flex-shrink: 0;
  padding: vh(8) vw(12) 0;
}

.iip__total-row {
  display: flex;
  align-items: center;
  gap: vw(16);
}

/* 图标框：设计稿「组合 4」48.72×47.96 */
.iip__iconbox {
  width: min(vw(48), vh(48));
  height: min(vw(48), vh(48));
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: vw(8);
  background: rgba(54, 120, 227, 0.14);
  color: #6fb0ff;

  /* 图标随框等比缩放（FireSystemIcon 的 size 是固定 px 值） */
  :deep(svg) {
    width: 58%;
    height: 58%;
  }
}

/* 状态分布环：设计稿 64×64 贴内容右缘 */
.iip__ring {
  flex-shrink: 0;
  width: min(vw(64), vh(64));
  height: min(vw(64), vh(64));
  display: block;

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.iip__total-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

/* 「完好率」+ 说明角标 */
.iip__total-title {
  @include fire-label(15);
  color: var(--fire-text-title);
  display: flex;
  align-items: center;
  gap: vw(4);
  white-space: nowrap;
}

.iip__note {
  color: var(--fire-text-sub);
  flex-shrink: 0;
}

/* 主数值：总体完好率，卡内最大的一处。
   声明色保持 L0 白（脚本按声明色量对比度），视觉上叠一层冷调渐变。 */
.iip__total-value {
  display: flex;
  align-items: baseline;
  gap: vw(2);
}

.iip__value-num {
  @include fire-value(32);
  background: linear-gradient(180deg, #d0e4fc 0%, #ffffff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 百分号：16px 辅助级 */
.iip__unit {
  @include fire-sub(16);
  font-style: normal;
}

/* ===== 状态分布图例：设计稿 #70:1311（2 行 2 列，行距 6、列距 25） ===== */
.iip__legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: vw(25);
  row-gap: vh(6);
}

.iip__legend-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(6);
  padding: vh(4) 0;
  min-width: 0;
}

.iip__legend-label {
  @include fire-dim(15);
  display: flex;
  align-items: center;
  gap: vw(4);
  white-space: nowrap;
}

.iip__legend-dot {
  width: vw(10);
  height: vw(10);
  border-radius: vw(2);
  flex-shrink: 0;
}

.iip__legend-item b {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  color: var(--fire-text-dim);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.iip__divider {
  @include fire-divider;
}

/* ===== 8 个系统：设计稿 #70:2334（2 列 4 行，行距 8） ===== */
.iip__systems {
  display: flex;
  flex-direction: column;
  gap: vh(8);
  flex: 1;
  min-height: 0;
}

.iip__sys-row {
  display: flex;
  gap: vw(8);
  flex: 1;
  min-height: 0;
}

.iip__sys {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(8);
  padding: vh(8) vw(8);
  border-radius: vw(4);
  background: rgba(0, 84, 160, 0.2);
  overflow: hidden;
}

/* 第 1 行：图标 + 系统全称 + 右对齐台数 */
.iip__sys-head {
  display: flex;
  align-items: center;
  gap: vw(4);
  min-width: 0;
}

.iip__sys-icon {
  flex-shrink: 0;
  display: flex;

  /* 图标随视口缩放（FireSystemIcon 的 size 是固定 px 值） */
  :deep(svg) {
    width: vw(14);
    height: vw(14);
  }
}

.iip__sys-name {
  @include fire-dim(14);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.iip__sys-total {
  @include fire-dim(14);
  flex-shrink: 0;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* 第 2 行：「完好率」+ 占比条 + 右对齐百分比 */
.iip__sys-foot {
  display: flex;
  align-items: center;
  gap: vw(7);
  min-width: 0;
}

.iip__sys-label {
  @include fire-dim(14);
  flex-shrink: 0;
  white-space: nowrap;
}

/* 正常占比条：设计稿 4px 高 */
.iip__sys-bar {
  flex: 1;
  min-width: 0;
  height: vh(4);
  border-radius: vh(2);
  background: rgba(0, 84, 160, 0.45);
  overflow: hidden;
  display: flex;

  i {
    height: 100%;
    flex-shrink: 0;
    background: var(--fire-neutral);
  }
}

/* 系统行完好率：14px，与主数值拉开 */
.iip__sys-rate {
  @include fire-value(14);
  min-width: 44px;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
</style>
