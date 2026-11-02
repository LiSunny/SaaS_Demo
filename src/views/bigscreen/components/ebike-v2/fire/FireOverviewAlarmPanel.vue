<template>
  <EbikeV2Card title="实时警情监控">
    <div class="alp">
      <!-- ===== KPI：2×2（图标 + 名称ⓘ + 数值 + 单位「件」） ===== -->
      <div class="alp__kpis">
        <div v-for="c in ALARM_COUNTS" :key="c.key" class="alp__kpi">
          <span class="alp__kpi-icon">
            <img :src="KPI_ICONS[c.icon]" alt="" />
          </span>
          <div class="alp__kpi-text">
            <div class="alp__kpi-name">
              {{ c.label }}
              <svg class="alp__kpi-info" viewBox="0 0 12 12" width="13" height="13">
                <title>{{ c.hint }}</title>
                <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.1" />
                <path d="M6 3.1v3.3M6 8.5v.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
            </div>
            <div class="alp__kpi-num-row">
              <span class="alp__kpi-num" :class="{ 'is-abnormal': c.tone === 'abnormal' }">
                {{ c.count }}
              </span>
              <span class="alp__kpi-unit">件</span>
            </div>
          </div>
        </div>
      </div>

      <div class="alp__divider" />

      <!-- ===== 最近警情：分区标题 + 更多入口 ===== -->
      <div class="alp__section">
        <span class="alp__section-title">最近警情（近 5 条）</span>
        <span class="alp__more">更多 ›</span>
      </div>

      <!-- ===== 警情列表：2 行式（角标 + 标题 + 时间 / 位置） ===== -->
      <div class="alp__list">
        <div v-for="r in visibleRows" :key="r.key" class="alp__row">
          <div class="alp__row-head">
            <span class="alp__row-lead">
              <span class="alp__badge">{{ r.badge }}</span>
              <span class="alp__row-title">{{ r.title }}</span>
            </span>
            <span class="alp__row-time">{{ r.time }}</span>
          </div>
          <span class="alp__row-loc">{{ r.location }}</span>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 实时警情监控
 *
 * 版式按 Figma 70:313 右上卡（设计稿 Section 80:4812，521.86×500）重做：
 *
 *   KPI 区  2 行 2 列：46×46 图标（设计稿原图导出）+ 名称(ⓘ 13×13) + 32px 数值 + 单位「件」
 *          数值渐变：异常 #FF8080→#FFB3B3，非异常 #A5CEFF→#D0E4FC
 *   分隔线  1px
 *   分区标题  蓝色竖条 + 「最近警情（近 5 条）」15px + 右对齐「更多 ›」
 *   列表    单容器（底 rgba(0,84,160,0.2)、圆角 10、内距 6px 8px）
 *          每条 2 行：① 胶囊角标 + 事件标题 + 右对齐完整时间戳 ② 位置
 *          行间 1px 虚线（#234972，2-2 虚线）
 *
 * 与设计稿的四处有意偏离：
 *   1. 角标统一用异常红。设计稿把「故障」标橙、「预警」标红，与本页
 *      "异常统一一个红"的色彩规则冲突（见 fire-common.scss 顶部说明）；
 *      角标文案已区分档位，颜色不再承担区分职责。
 *   2. 角标文字 14px、设计稿 10px；「更多 ›」14px、设计稿 12px。
 *      全大屏字号下限 14px（fire-common.scss 的 $fire-min-size）。
 *   3. 数值红色渐变的暗端用 #FF8080 而非设计稿的 #E5523F ——
 *      #E5523F 在卡片底色上实测仅 3.73:1，达不到 4.5:1 的 AA 底线。
 *   4. 角标底色在红色渐变下再垫一层深蓝：只叠渐变时角标红字压在自己
 *      那层浅红上实测仅 4.31:1，加深底后 4.86~5.10:1。
 *
 * 列表只显示 4 条：设计稿的列表容器是"填满剩余高度"，第 4 条本来就被卡片
 * 底边裁掉一行（设计稿 PNG 实测第 4 条的下沿在 512，卡高 500）。
 * 这里保留 4 条的可见条数，但让 4 条都完整显示，不做裁切。
 */
import { computed } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import { ALARM_COUNTS, ALARM_ROWS } from './fire-mock'
import kpiFire from '@/assets/bigscreen/ebike-v2/fire/kpi-fire.png'
import kpiFault from '@/assets/bigscreen/ebike-v2/fire/kpi-fault.png'
import kpiShield from '@/assets/bigscreen/ebike-v2/fire/kpi-shield.png'
import kpiComm from '@/assets/bigscreen/ebike-v2/fire/kpi-comm.png'

/**
 * KPI 图标：直接用设计稿原图导出，不自绘。
 *
 * 设计稿里这 4 枚图标是 46×46 的成品素材（外层柔光方框 + 内层描边方框 +
 * 字形），自绘会丢掉那层光效，也容易被误读成"线框工程符号"。
 */
const KPI_ICONS: Record<string, string> = {
  fire: kpiFire,
  fault: kpiFault,
  shield: kpiShield,
  comm: kpiComm,
}

/** 卡片可见条数：与设计稿一致（第 4 条在设计稿里是被裁掉一行的） */
const VISIBLE_ROWS = 4
const visibleRows = computed(() => ALARM_ROWS.slice(0, VISIBLE_ROWS))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

/* 卡片内容区：设计稿 #80:4826 —— 内距 10px 12px，块间距 12px */
.alp {
  @include fire-panel;
  gap: vh(12);
}

/* ===== KPI：2 行 2 列（列间距 10、行间距 12） ===== */
.alp__kpis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: vw(10);
  row-gap: vh(12);
  flex-shrink: 0;
}

/* 单个 KPI：内距 4px 12px、圆角 10（设计稿无底色，只作排版） */
.alp__kpi {
  display: flex;
  align-items: center;
  gap: vw(12);
  padding: vh(4) vw(12);
  border-radius: vw(10);
  min-width: 0;
}

/* 图标：设计稿 46×46 原图导出，框与字形都在图里，不再另画外框 */
.alp__kpi-icon {
  flex-shrink: 0;
  width: min(vw(46), vh(46));
  height: min(vw(46), vh(46));
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.alp__kpi-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* 指标名 + ⓘ 说明角标（行高 1.12 = 设计稿 16.8px） */
.alp__kpi-name {
  @include fire-label(15);
  color: var(--fire-text-title);
  line-height: 1.12;
  display: flex;
  align-items: center;
  gap: vw(4);
  white-space: nowrap;
}

.alp__kpi-info {
  flex-shrink: 0;
  color: var(--fire-text-sub);
}

/* 数值 + 单位 */
.alp__kpi-num-row {
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

/**
 * 核心数值：32px 纵向渐变。
 * 声明色保留在 L0 白 / 异常红（脚本按声明色量对比度），视觉上叠一层渐变。
 * 行高 1.2375 = 设计稿 39.6px —— 行高决定 KPI 块的高度，
 * 改它会让下方分隔线偏离设计稿 221px 的位置。
 */
.alp__kpi-num {
  @include fire-value(32);
  line-height: 1.2375;
  background: linear-gradient(180deg, #a5ceff 0%, #d0e4fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}

/* 异常数值：换成异常红渐变（暗端即本页统一异常红 #FF8080）。
   用 background-image 而不是 background —— 后者会把 background-clip 重置回
   border-box，渐变会铺满整个数字的盒子，文字被 fill-color: transparent 吃掉，
   只剩一块红色色块。 */
.alp__kpi-num.is-abnormal {
  color: var(--fire-anomaly);
  background-image: linear-gradient(180deg, #ff8080 0%, #ffb3b3 100%);
}

.alp__kpi-unit {
  @include fire-label(14);
  color: var(--fire-text-label);
  flex-shrink: 0;
}

.alp__divider {
  @include fire-divider;
}

/* ===== 分区标题 + 更多入口 ===== */
.alp__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  flex-shrink: 0;
}

.alp__section-title {
  @include fire-section-title(15);

  /* 设计稿竖条圆角 3px（3px 宽 → 圆头） */
  &::before {
    border-radius: 3px;
  }
}

/* 「更多 ›」：设计稿 #92DBFF，是可点入口，不占用文字色阶 */
.alp__more {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  color: #92dbff;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== 警情列表：单容器 ===== */
.alp__list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
  padding: vh(6) vw(8);
  border-radius: vw(10);
  background: rgba(0, 84, 160, 0.2);
  overflow: hidden;
}

/* 每条 2 行；行间虚线（设计稿 1px #234972，2-2 虚线）。
   flex:1 让 4 条均分列表高度 —— 大屏放大后列表容器变高，行不跟着撑开会
   在容器底部留一条空带。 */
.alp__row {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(4);
  padding: vh(4) 0;
  border-bottom: 1px dashed #234972;
}

.alp__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  min-width: 0;
}

.alp__row-lead {
  display: flex;
  align-items: center;
  gap: vw(16);
  min-width: 0;
}

/* 胶囊角标：内距 2px 6px、圆角 4、1px 异常红描边
   底色分两层：先一层深蓝压住底色，再叠红色径向渐变。
   只叠渐变的话，角标红字压在自己那层浅红上，实测只有 4.31:1，达不到 4.5:1 底线。 */
.alp__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: vh(2) vw(6);
  border-radius: vw(4);
  border: 1px solid var(--fire-anomaly);
  background:
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 128, 128, 0.16) 0%,
      rgba(255, 128, 128, 0.2) 68%,
      rgba(255, 128, 128, 0.16) 100%
    ),
    rgba(0, 20, 46, 0.55);
  color: var(--fire-anomaly);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1;
  white-space: nowrap;
}

.alp__row-title {
  @include fire-label(14);
  color: var(--fire-text-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alp__row-time {
  @include fire-sub(14);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 位置：行内辅助信息，比标题弱一级 */
.alp__row-loc {
  @include fire-sub(14);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
