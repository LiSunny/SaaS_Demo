<template>
  <EbikeV2Card title="实时警情与联动状态">
    <div class="alp">
      <!-- 主机信号计数 -->
      <div class="alp__counts">
        <div v-for="c in ALARM_COUNTS" :key="c.key" class="alp__count">
          <span class="alp__count-value" :style="{ color: dataColor(c.tone) }">{{ c.count }}</span>
          <span class="alp__count-label" :style="{ color: dataColor(c.tone, 'label') }">{{ c.label }}</span>
        </div>
      </div>

      <div class="alp__divider" />

      <!-- 联动反馈 -->
      <div class="alp__section">联动反馈</div>
      <div class="alp__linkage">
        <div
          v-for="l in LINKAGE"
          :key="l.key"
          class="alp__link"
          :style="{ borderColor: markBorder(l.tone) }"
        >
          <span class="alp__dot" :style="{ background: markColor(l.tone) }" />
          <span class="alp__link-label">{{ l.label }}</span>
          <span class="alp__link-state" :style="{ color: dataColor(l.tone, 'label') }">{{ l.state }}</span>
        </div>
      </div>

      <div class="alp__divider" />

      <!-- 最近警情 -->
      <div class="alp__section">最近警情（近 5 条）</div>
      <div class="alp__rows">
        <div
          v-for="r in ALARM_ROWS"
          :key="r.key"
          class="alp__row"
          :class="{
            'is-abnormal': r.active && (r.typeTone === 'abnormal' || r.statusTone === 'abnormal'),
          }"
        >
          <span class="alp__dot alp__dot--row" :style="{ background: markColor(r.typeTone) }" />
          <span class="alp__time">{{ r.time }}</span>
          <span class="alp__type" :style="{ color: dataColor(r.typeTone, 'label') }">{{ r.type }}</span>
          <span class="alp__loc">{{ r.location }}</span>
          <span class="alp__status" :style="{ color: dataColor(r.statusTone, 'label') }">{{ r.status }}</span>
          <span class="alp__elapsed">{{ r.elapsed }}</span>
        </div>
      </div>

    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 实时警情与联动状态
 *
 * 三段：主机信号计数 → 联动反馈 → 最近 5 条警情。
 * 处置时效（今日警情 / 待处置 / 闭环 / 平均响应）在顶部态势条，不重复。
 *
 * 异常行闪烁：统一一个红、2.5s 周期、边缘 8% 渐变不硬切；
 * 正常行不闪、不挂标。异常色已统一，"故障红"与"预警红"不再分两档。
 */
import EbikeV2Card from '../EbikeV2Card.vue'
import { ALARM_COUNTS, ALARM_ROWS, LINKAGE, dataColor, markBorder, markColor } from './fire-mock'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

.alp {
  @include fire-panel;
  gap: vh(5);
}

/* ===== 主机信号计数 ===== */
.alp__counts {
  display: flex;
  gap: vw(6);
  flex-shrink: 0;
}

.alp__count {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: vh(1);
  padding: vh(3) 0;
  border-radius: vw(2);
  background: $fire-chip;
  border: 1px solid $fire-chip-border;
}

.alp__count-value {
  @include fire-value(24);
}

.alp__count-label {
  @include fire-label(14);
}
.alp__divider {
  @include fire-divider;
}

.alp__section {
  @include fire-section-title;
}

/* ===== 联动反馈 ===== */
.alp__linkage {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: vh(4) vw(6);
  flex-shrink: 0;
}

.alp__link {
  @include fire-chip;
  gap: vw(4);
  padding: vh(2) vw(6);
  border-width: 1px;
  border-style: solid;
}

.alp__dot {
  width: vw(5);
  height: vw(5);
  border-radius: 50%;
  flex-shrink: 0;
}

.alp__link-label {
  @include fire-label(14);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 窄窗口（如 1151×918）：三列会把联动项名称挤成省略号，改两列 */
@media (max-width: 1400px) {
  .alp__linkage {
    grid-template-columns: repeat(2, 1fr);
  }
}

.alp__link-state {
  @include fire-sub(13);
  flex-shrink: 0;
}

/* ===== 警情行 ===== */
.alp__rows {
  display: flex;
  flex-direction: column;
  gap: vh(4);
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  justify-content: space-between;
}

.alp__row {
  display: flex;
  align-items: center;
  gap: vw(6);
  padding: vh(5) vw(6);
  border-radius: vw(2);
  background: rgba(0, 84, 160, 0.18);
  font-size: 14px;
  line-height: 20px;
}

.alp__dot--row {
  width: vw(6);
  height: vw(6);
}

.alp__time {
  @include fire-dim(14);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.alp__type {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  flex-shrink: 0;
  min-width: vw(56);
  white-space: nowrap;
}

/* 位置：行内的辅助信息，比状态弱一级 */
.alp__loc {
  flex: 1;
  min-width: 0;
  color: var(--fire-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alp__status {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  flex-shrink: 0;
  min-width: vw(44);
  text-align: right;
  white-space: nowrap;
}

.alp__elapsed {
  @include fire-dim(13);
  flex-shrink: 0;
  width: vw(44);
  text-align: right;
  font-variant-numeric: tabular-nums;
}


/* ===== 异常闪烁 =====
   统一一个红、2.5s 周期；亮灭边缘各留 8% 渐变，不用硬切。 */
@keyframes fire-blink-abnormal {
  0% { opacity: 1; }
  8% { opacity: 0.25; }
  92% { opacity: 0.25; }
  100% { opacity: 1; }
}

.alp__row.is-abnormal .alp__dot--row {
  animation: fire-blink-abnormal 2.5s ease-in-out infinite;
  will-change: opacity;
}
</style>
