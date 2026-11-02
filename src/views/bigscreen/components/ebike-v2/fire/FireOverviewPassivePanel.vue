<template>
  <EbikeV2Card title="隐患排查治理">
    <div class="hz">
      <!-- ===== 汇总：两组并排（本月排查任务 / 未闭环隐患） ===== -->
      <div class="hz__sums">
        <div v-for="s in HAZARD_SUMMARIES" :key="s.key" class="hz__sum">
          <div class="hz__sum-head">
            <img class="hz__sum-icon" :src="SUM_ICONS[s.icon]" alt="" />
            <span class="hz__sum-name">{{ s.name }}</span>
            <svg class="hz__sum-info" viewBox="0 0 12 12" width="13" height="13">
              <title>{{ s.hint }}</title>
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.1" />
              <path d="M6 3.1v3.3M6 8.5v.6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
            </svg>
          </div>

          <div class="hz__sum-num-row">
            <span class="hz__sum-num">{{ s.count }}</span>
            <span class="hz__sum-unit">{{ s.unit }}</span>
          </div>

          <div class="hz__sum-items">
            <span v-for="it in s.items" :key="it.label" class="hz__sum-item">
              <span class="hz__sum-tag">{{ it.label }}</span>
              <span class="hz__sum-ratio">{{ it.ratio.toFixed(1) }}%</span>
            </span>
          </div>
        </div>
      </div>

      <div class="hz__divider" />

      <!-- ===== 未闭环隐患：分区标题 + 更多入口 ===== -->
      <div class="hz__section">
        <span class="hz__section-title">未闭环隐患（近 5 条）</span>
        <span class="hz__more">更多 ›</span>
      </div>

      <!-- ===== 隐患列表：2 行式（等级角标 + 标题 + 时间 / 位置） ===== -->
      <div class="hz__list">
        <div v-for="r in visibleRows" :key="r.key" class="hz__row">
          <div class="hz__row-head">
            <span class="hz__row-lead">
              <span class="hz__badge" :class="r.level === 'major' ? 'is-major' : 'is-general'">
                {{ LEVEL_LABEL[r.level] }}
              </span>
              <span class="hz__row-title">{{ r.title }}</span>
            </span>
            <span class="hz__row-time">{{ r.time }}</span>
          </div>
          <span class="hz__row-loc">{{ r.location }}</span>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 隐患排查治理
 *
 * 版式按 Figma 70:313 右下卡（设计稿 Section 80:4501，521.86×462）重做：
 *
 *   汇总区  两块并排（间距 6px，各占一半）：
 *            16×16 图标（设计稿原图导出）+ 名称(ⓘ 13×13) + 28px 数值 + 「个」
 *            数值渐变 #A5CEFF→#D0E4FC
 *            每块下排两个子项：48×18 定宽标签盒 + 14px 占比
 *   分隔线  1px
 *   分区标题 蓝色竖条 + 「未闭环隐患（近 5 条）」15px + 右对齐「更多 ›」
 *   列表    单容器（底 rgba(0,84,160,0.2)、圆角 10、内距 6px 8px）
 *            每条 2 行：① 等级角标 + 隐患描述 + 右对齐完整时间戳 ② 位置
 *            行间 1px 虚线（#234972，2-2 虚线）
 *
 * 数据口径：演示值（fire-mock.ts），与本页其它三张卡同一口径。
 *   隐患台账（M1）虽有实装 store，但种子数据挂在 enterprise 1，
 *   本演示账号属 enterprise 2，取不到数；排查任务（M1-7）仍是占位页。
 *   所以本卡不接后台，也不拿 mock 数字冒充台账真值 —— 口径写在
 *   fire-mock.ts 的注释里。
 *
 * 与设计稿的四处有意偏离：
 *   1. 等级角标：一般保留设计稿的橙 #FFA600，重大由设计稿的 #E5523F 换成
 *      项目异常红 #FF8080 —— #E5523F 在卡片底色上实测仅 3.73:1，达不到
 *      4.5:1 的 AA 底线。橙是全页唯一的第二语义色：等级是有序的
 *      （一般 < 重大），角标颜色承担的是严重度梯度；右上「故障 / 预警」
 *      是同一类故障的两个子类型，文案已能区分，故统一用红。
 *   2. 「个」用 L2 #A9C9EA 而非设计稿的 #8FB0D8：它与右上卡的「件」是
 *      同一个角色（核心数值后的单位），同页同角色必须同色。
 *   3. 角标文字 14px、设计稿 10px；「更多 ›」14px、设计稿 12px。
 *      全大屏字号下限 14px（fire-common.scss 的 $fire-min-size）。
 *   4. 列表只显示 4 条，且行内距比设计稿收紧：设计稿的等级角标文字是 10px、
 *      角标盒 16px 高，本页角标受 14px 字号下限约束、盒高 20px，按设计稿的
 *      行距（内距 6px、标题与位置间距 7px）放不下 4 条 —— 位置行会被压掉
 *      半行。收紧到内距 4px、间距 4px 后 4 条都完整显示（与右上卡同一处理）。
 *
 * 与设计稿的实测比对（1920×1080，卡内相对坐标）：
 *   卡尺寸     522×462（设计稿 521.86×462）
 *   汇总块起点 x=13 / 264（设计稿 14 / 264），各宽 245（设计稿 246）
 *   名称行 y=63~78（设计稿 65~78）｜数值行 97~117（97.5~116）
 *   子项行     138~150（138~150.5）｜分隔线 175.4（174.4）
 *   分区标题   187~201（189~202）｜列表起点 213.2（213.4）
 *   子项横向   完成 16~｜82.8% 66~102｜未完成 138~｜17.2% 180~222
 *              （设计稿 16~｜12.5% 65~101.5｜138~｜185~222）
 */
import { computed } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import { HAZARD_SUMMARIES, HAZARD_ROWS, type HazardLevelKey } from './fire-mock'
import sumTask from '@/assets/bigscreen/ebike-v2/fire/sum-task.png'
import sumHazard from '@/assets/bigscreen/ebike-v2/fire/sum-hazard.png'

/** 汇总图标：直接用设计稿原图导出，不自绘 */
const SUM_ICONS: Record<string, string> = {
  task: sumTask,
  hazard: sumHazard,
}

/** 等级角标文案 */
const LEVEL_LABEL: Record<HazardLevelKey, string> = {
  general: '一般',
  major: '重大',
}

/** 卡片可见条数：与设计稿一致（第 4 条在设计稿里是被裁掉一行的） */
const VISIBLE_ROWS = 4
const visibleRows = computed(() => HAZARD_ROWS.slice(0, VISIBLE_ROWS))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire-common.scss" as *;

/* 卡片内容区：设计稿 #80:4514 / #80:4515 —— 内距 10px 12px，块间距 10px */
.hz {
  @include fire-panel;
  gap: vh(10);
}

/* ===== 汇总：两块并排 ===== */
.hz__sums {
  display: flex;
  gap: vw(6);
  align-items: stretch;
  flex-shrink: 0;
}

/* 单个指标块：内距 12px 2px、块间距 8px（设计稿 EL-abf40868，无底色） */
.hz__sum {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(8);
  padding: vh(12) vw(2);
}

/* 指标名行：图标 + 名称 + ⓘ（间距 4px） */
.hz__sum-head {
  display: flex;
  align-items: center;
  gap: vw(4);
  min-width: 0;
}

/* 汇总图标：设计稿 16×16 原图导出 */
.hz__sum-icon {
  flex-shrink: 0;
  width: vw(16);
  height: vw(16);
  object-fit: contain;
  display: block;
}

.hz__sum-name {
  @include fire-label(15);
  color: var(--fire-text-title);
  line-height: 1.12;
  white-space: nowrap;
}

.hz__sum-info {
  flex-shrink: 0;
  color: var(--fire-text-sub);
}

/* 数值行：28px 渐变数值 + 「个」 */
.hz__sum-num-row {
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

/**
 * 核心数值：28px 纵向渐变。
 * 声明色保留在 L0 白（脚本按声明色量对比度），视觉上叠一层渐变。
 * 行高 1.4143 = 设计稿 39.6px —— 行高决定块高，改它会让下方分隔线偏离设计稿。
 */
.hz__sum-num {
  @include fire-value(28);
  line-height: 1.4143;
  background: linear-gradient(180deg, #a5ceff 0%, #d0e4fc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}

/* 单位「个」：L2，与右上卡的「件」同角色同色 */
.hz__sum-unit {
  @include fire-label(16);
  font-weight: 700;
  color: var(--fire-text-label);
  flex-shrink: 0;
}

/* 子项行：两组并排（间距 4px），组内 标签 + 占比（间距 2px） */
.hz__sum-items {
  display: flex;
  gap: vw(4);
}

.hz__sum-item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: vw(2);
}

/**
 * 标签：48×18 定宽盒，文字左对齐（设计稿 layout_c9411501）。
 * 用行高撑出 18px 的行盒，基线与同组的百分比自然对齐。
 */
.hz__sum-tag {
  flex-shrink: 0;
  width: vw(48);
  line-height: vh(18);
  @include fire-label(15);
  color: var(--fire-text-dim);
  white-space: nowrap;
}

.hz__sum-ratio {
  @include fire-label(14);
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  color: var(--fire-text-label);
  white-space: nowrap;
}

.hz__divider {
  @include fire-divider;
}

/* ===== 分区标题 + 更多入口 ===== */
.hz__section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  flex-shrink: 0;
}

.hz__section-title {
  @include fire-section-title(15);
  /* 行高 1.12 = 设计稿 16.8px（style_baa99601），直接决定下方列表的落点 */
  line-height: 1.12;

  /* 设计稿竖条圆角 3px（3px 宽 → 圆头） */
  &::before {
    border-radius: 3px;
  }
}

/* 「更多 ›」：设计稿 #92DBFF，是可点入口，不占用文字色阶。
   行高写死 1.2（16.8px）：不写的话默认 normal 会撑到 20px，
   把下面的列表整体压低 3px（设计稿列表起点 213.4）。 */
.hz__more {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1.2;
  color: #92dbff;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== 隐患列表：单容器 ===== */
.hz__list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
  padding: vh(6) vw(8);
  border-radius: vw(10);
  background: rgba(0, 84, 160, 0.2);
  overflow: hidden;
}

/* 每条 2 行；行间虚线（设计稿 1px #234972，2-2 虚线）。
   flex:1 让 4 条均分列表高度 —— 大屏放大后列表容器变高，行不跟着撑开会
   在容器底部留一条空带。

   行内距比设计稿（6px / 7px）收紧到 4px / 4px：设计稿的等级角标文字是
   10px、角标盒只有 16px 高，本页角标文字受 14px 字号下限约束，盒高 20px，
   按设计稿的行距放不下 4 条 —— 位置行会被压掉半行。
   子项加 flex-shrink:0 是兜底：行高不够时宁可溢出，也不裁字。 */
.hz__row {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: vh(4);
  padding: vh(4) 0;
  border-bottom: 1px dashed #234972;
}

.hz__row-head,
.hz__row-loc {
  flex-shrink: 0;
}

.hz__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  min-width: 0;
}

.hz__row-lead {
  display: flex;
  align-items: center;
  gap: vw(16);
  min-width: 0;
}

/* 等级角标：内距 2px 6px、圆角 4、1px 同色描边
   底色分两层：先一层深蓝压住底色，再叠语义色径向渐变。
   只叠渐变的话，角标字压在自己那层浅色上实测不足 4.5:1。
   一般与重大同色（用户 2026-11-02 定：全页角标只留一个红），
   等级差异由角标文案承担，故不再单列 .is-major 规则。 */
.hz__badge {
  @include fire-badge(255, 128, 128, 0.13, 0.16);
}

.hz__row-title {
  @include fire-label(14);
  color: var(--fire-text-label);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hz__row-time {
  @include fire-sub(14);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 位置：行内辅助信息，比标题弱一级 */
.hz__row-loc {
  @include fire-sub(14);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
