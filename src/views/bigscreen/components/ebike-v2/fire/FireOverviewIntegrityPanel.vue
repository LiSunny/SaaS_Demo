<template>
  <EbikeV2Card title="消防设备完好率">
    <div class="iip">
      <!-- ===== 总体卡：Figma「单个指标总分占比」结构 ===== -->
      <div class="iip__total">
        <div class="iip__total-top">
          <span class="iip__iconbox">
            <FireSystemIcon system="bookmark" :size="24" />
          </span>

          <div class="iip__total-text">
            <div class="iip__total-title">
              接入设备
              <svg v-if="hasIssue" class="iip__note" viewBox="0 0 12 12" width="13" height="13">
                <title>存在故障 / 报警 / 离线设备</title>
                <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.1" />
                <path d="M6 3.1v3.3M6 8.5v.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
            </div>
            <div class="iip__total-value">
              <span :style="{ color: rateColor(DEVICE_OVERALL.rate) }">
                {{ DEVICE_OVERALL.rate.toFixed(1) }}<span class="iip__unit">%</span>
              </span>
              <span class="iip__total-count">共 {{ DEVICE_OVERALL.total }} 台</span>
            </div>
          </div>

          <!-- 状态分布环形图 -->
          <FireDonut :segments="donutSegments" :size="56" :thickness="8" />
        </div>

        <!-- 状态分布图例 -->
        <div class="iip__legend">
          <span v-for="d in OVERALL_DIST" :key="d.key" class="iip__legend-item">
            <i class="iip__legend-dot" :style="{ background: d.color }" />{{ d.label }}
            <b>{{ d.count }}</b>
            <em>{{ (d.ratio * 100).toFixed(1) }}%</em>
          </span>
        </div>
      </div>

      <div class="iip__divider" />

      <!-- ===== 8 个系统 ===== -->
      <div class="iip__systems">
        <div v-for="r in SYSTEM_ROWS" :key="r.key" class="iip__sys">
          <span class="iip__sys-icon" :style="{ color: r.pending ? '#8FB4D9' : iconColor(r) }">
            <FireSystemIcon :system="r.icon" :size="18" />
          </span>
          <span class="iip__sys-name">{{ r.name }}</span>
          <span v-if="r.pending" class="iip__sys-pending">待接入</span>
          <template v-else>
            <span class="iip__sys-total">{{ r.total }}</span>
            <span class="iip__sys-bar">
              <i :style="{ width: normalWidth(r), background: TONE_COLOR.normal }" />
            </span>
            <span class="iip__sys-rate" :style="{ color: rateColor(r.rate) }">{{ r.rate.toFixed(1) }}%</span>
          </template>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 消防设备完好率
 *
 * 版式对齐 Figma「单个指标总分占比」卡片（node 6056:7254）：
 *   图标 + 标题(+说明角标) → 大数值(+单位) → 状态分布环形图 → 底部状态图例
 * 暗色玻璃主题下按同结构重做，保留"总 → 分系统"两层：
 *   总体卡（标题「接入设备」+ 说明角标 / 总体完好率 + 共 N 台 / 四态分布环 + 图例）
 *   8 个系统（图标 + 名称 + 台数 + 正常占比条 + 完好率）
 *
 * 可用率 =（总数 − 故障 − 离线）/ 总数，由 `fire-mock.ts` 算出，不手写百分比。
 * 尚未建档案的 5 个系统显示"待接入"，不用 mock 数字冒充。
 */
import { computed } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import FireDonut from './FireDonut.vue'
import FireSystemIcon from './FireSystemIcon.vue'
import {
  DEVICE_OVERALL,
  OVERALL_DIST,
  SYSTEM_ROWS,
  TONE_COLOR,
  type SystemRow,
} from './fire-mock'

/** 有故障 / 报警 / 离线时，标题右侧挂说明角标（中性蓝，不作告警色） */
const hasIssue = computed(() => DEVICE_OVERALL.fault + DEVICE_OVERALL.alarm + DEVICE_OVERALL.offline > 0)

/** 环形图分段：占比为 0 的状态不进环 */
const donutSegments = computed(() =>
  OVERALL_DIST.filter((d) => d.count > 0).map((d) => ({ value: d.ratio, color: d.color })),
)

/** 系统行堆叠条：只画正常占比，其余留空，不做四态细分 */
function normalWidth(r: SystemRow): string {
  if (!r.total) return '0%'
  return `${((r.normal / r.total) * 100).toFixed(2)}%`
}

/** 可用率分级：≥97 正常 / ≥94 关注 / 其余故障 */
function rateColor(rate: number): string {
  if (rate >= 97) return TONE_COLOR.normal
  if (rate >= 94) return TONE_COLOR.fault
  return TONE_COLOR.warning
}

/** 图标颜色跟该系统最差状态 */
function iconColor(r: SystemRow): string {
  if (r.fault > 0) return TONE_COLOR.fault
  if (r.alarm > 0) return TONE_COLOR.warning
  if (r.offline > 0) return TONE_COLOR.muted
  return TONE_COLOR.normal
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

.iip {
  @include fire-panel;
  gap: vh(8);
}

/* ===== 总体卡（对应 Figma 卡片） ===== */
.iip__total {
  display: flex;
  flex-direction: column;
  gap: vh(7);
  flex-shrink: 0;
  padding: vh(9) vw(10);
  border-radius: vw(8);
  background: rgba(0, 84, 160, 0.24);
  border: 1px solid rgba(0, 152, 230, 0.16);
}

.iip__total-top {
  display: flex;
  align-items: center;
  gap: vw(10);
}

/* 图标框：对应 Figma 48×48 圆角方块 */
.iip__iconbox {
  width: vh(40);
  height: vh(40);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: vw(7);
  background: rgba(54, 120, 227, 0.14);
  color: #6fb0ff;
}

.iip__total-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.iip__total-title {
  @include fire-label(14);
  display: flex;
  align-items: center;
  gap: vw(4);
}

.iip__note {
  color: #9cc6f2;
  flex-shrink: 0;
}

.iip__total-value {
  @include fire-value(26);
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

/* 接入设备总数：紧跟总体完好率，不占标题行 */
.iip__total-count {
  @include fire-sub(12);
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-variant-numeric: tabular-nums;
}

.iip__unit {
  @include fire-sub(13);
  font-style: normal;
}

/* 状态分布图例：两行两列，铺满卡片宽度 */
.iip__legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: vh(3) vw(10);
}

.iip__legend-item {
  @include fire-sub(12);
  display: flex;
  align-items: baseline;
  gap: vw(4);

  b {
    font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
    font-weight: 700;
    font-size: 14px;
    color: $fire-value;
  }

  em {
    font-style: normal;
    color: #6fa5e0;
    font-variant-numeric: tabular-nums;
  }
}

.iip__legend-dot {
  width: vw(7);
  height: vw(7);
  border-radius: vw(2);
  flex-shrink: 0;
  align-self: center;
}

.iip__divider {
  @include fire-divider;
}

/* ===== 8 个系统 ===== */
.iip__systems {
  display: flex;
  flex-direction: column;
  gap: vh(3);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  justify-content: space-between;
}

.iip__sys {
  display: flex;
  align-items: center;
  gap: vw(7);
  height: vh(22);
  flex-shrink: 0;
}

.iip__sys-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.iip__sys-name {
  @include fire-label(13);
  min-width: vw(56);
  flex-shrink: 0;
  white-space: nowrap;
}

.iip__sys-total {
  @include fire-sub(12);
  min-width: 34px;
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.iip__sys-pending {
  @include fire-sub(11);
  margin-left: auto;
  padding: 0 vw(6);
  border: 1px solid rgba(207, 210, 215, 0.3);
  border-radius: vw(2);
  color: #ced2d7;
}

/* 四态堆叠条 */
.iip__sys-bar {
  flex: 1;
  min-width: 0;
  height: vh(7);
  border-radius: vh(4);
  background: rgba(0, 84, 160, 0.4);
  overflow: hidden;
  display: flex;

  i {
    height: 100%;
    flex-shrink: 0;
  }
}

.iip__sys-rate {
  @include fire-value(15);
  min-width: 40px;
  text-align: right;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
</style>
