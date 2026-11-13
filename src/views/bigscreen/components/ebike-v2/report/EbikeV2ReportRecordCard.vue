<template>
  <article class="rrc">
    <!-- 左侧内容列：设计稿 117:21299（x=14 y=14 w=172，组间距 18） -->
    <div class="rrc__body">
      <!-- 标题组：小尼平安角标 + 报告名 + 周期（组内不设间距，
           间距由各文本框自身的高度给出，与设计稿一致） -->
      <div class="rrc__head">
        <!-- 「小尼平安」角标：Figma 117:21301 整体导出（102×31） -->
        <img v-if="record.agentBadge" class="rrc__badge" :src="badgeSrc" alt="小尼平安" />

        <!-- 报告名：YouSheBiaoTiHei 22px（艺术字只有 normal 档，font-weight 写 400） -->
        <h3 class="rrc__title">{{ record.title }}</h3>

        <!-- 周期：Alibaba PuHuiTi 16px #A9C9EA -->
        <p class="rrc__date">{{ record.date }}</p>
      </div>

      <!-- 「点击查看」胶囊（设计稿 117:21304 + Turn-on 图标 117:21306） -->
      <button type="button" class="rrc__cta" @click="emit('open', record)">
        <span class="rrc__cta-text">点击查看</span>
        <img class="rrc__cta-icon" :src="clickSrc" alt="" aria-hidden="true" />
      </button>
    </div>

    <!-- 右侧插画：设计稿 117:21298 / 117:21374（剪贴板 + 放大镜 / 剪贴板 + 柱状图） -->
    <img class="rrc__art" :src="artSrc" alt="" aria-hidden="true" />
  </article>
</template>

<script setup lang="ts">
/**
 * 运行报告 · 列表卡片（设计稿 117:21297 Article）
 *
 * 1:1 还原设计稿的卡片：深蓝卡面 + 「小尼平安」角标 + 报告名 + 周期 +
 * 「点击查看」胶囊 + 右侧插画。
 *
 * 尺寸：卡 302×172（设计稿 1588 宽的内容区里放 5 张：5×302 + 4×12 = 1558），
 * 卡内所有尺寸 = 设计稿原值 × --min-scale —— 卡片是固定比例的对象，
 * 宽高各按 vw/vh 缩放会在非 16:9 屏上变形。
 */
import { computed } from 'vue'
import artAnalysis from '@/assets/bigscreen/ebike-v2/report/report-record-art-analysis.png'
import artStats from '@/assets/bigscreen/ebike-v2/report/report-record-art-stats.png'
import badgeSrc from '@/assets/bigscreen/ebike-v2/report/report-agent-badge.png'
import clickSrc from '@/assets/bigscreen/ebike-v2/report/report-list-click-icon.svg'
import type { ReportRecord } from './report-data'

const props = defineProps<{ record: ReportRecord }>()

const emit = defineEmits<{ (e: 'open', record: ReportRecord): void }>()

/** 右侧插画：分析（放大镜）/ 统计（柱状图） */
const artSrc = computed(() => (props.record.art === 'analysis' ? artAnalysis : artStats))
</script>

<style lang="scss" scoped>
/* ===== 卡体：设计稿 117:21297 =====
   底色 rgba(0,62,121,0.98)、描边 #1A4573、圆角 10、
   投影 0 8px 24px rgba(0,0,0,0.25) */
.rrc {
  position: relative;
  width: calc(302 * var(--min-scale));
  height: calc(172 * var(--min-scale));
  overflow: hidden;
  border: 1px solid #1a4573;
  border-radius: calc(10 * var(--min-scale));
  background: rgba(0, 62, 121, 0.98);
  box-shadow: 0 calc(8 * var(--min-scale)) calc(24 * var(--min-scale)) rgba(0, 0, 0, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.rrc:hover {
  transform: translateY(calc(-3 * var(--min-scale)));
  box-shadow: 0 calc(12 * var(--min-scale)) calc(30 * var(--min-scale)) rgba(0, 8, 24, 0.45);
}

/* ===== 左侧内容列：x=14 y=14 w=172 ===== */
.rrc__body {
  position: absolute;
  left: calc(14 * var(--min-scale));
  top: calc(14 * var(--min-scale));
  width: calc(172 * var(--min-scale));
  display: flex;
  flex-direction: column;
  /* 组间距 18：只在「标题组」与「点击查看」之间（设计稿 117:21299 gap 18） */
  gap: calc(18 * var(--min-scale));
}

/* 标题组：角标 + 报告名 + 周期。组内不设间距 ——
   设计稿这一组的行距由各文本框自身的高度给出。 */
.rrc__head {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 「小尼平安」角标：Figma 102×31 */
.rrc__badge {
  width: calc(102 * var(--min-scale));
  height: calc(31 * var(--min-scale));
  object-fit: contain;
  object-position: left center;
}

/* 报告名：Figma YouSheBiaoTiHei 22px #F2FBFF
   行高用设计稿给的 49.2px（比字号大 27px，Figma 靠它把字形压到框的下半部）；
   文本框本身仍是 42px 高，行盒溢出 7px 不裁（设计稿就是溢出显示的）。 */
.rrc__title {
  margin: 0;
  height: calc(42 * var(--min-scale));
  font-family: 'YouSheBiaoTiHei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 400;
  font-size: clamp(14px, calc(22 * var(--min-scale)), 22px);
  line-height: calc(49.2 * var(--min-scale));
  color: #f2fbff;
  white-space: nowrap;
  overflow: visible;
}

/* 周期：Figma Alibaba PuHuiTi 16px #A9C9EA，行高 26.4 */
.rrc__date {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  line-height: calc(26.4 * var(--min-scale));
  letter-spacing: -0.0094em;
  color: #a9c9ea;
  white-space: nowrap;
  overflow: hidden;
}

/* ===== 「点击查看」胶囊：设计稿 117:21304 =====
   高 26、圆角 18、内距 0 12、底 rgba(169,201,234,0.1)、
   描边 rgba(96,200,255,0.6) */
.rrc__cta {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  height: calc(26 * var(--min-scale));
  padding: 0 calc(12 * var(--min-scale));
  border: 1px solid rgba(96, 200, 255, 0.6);
  border-radius: calc(18 * var(--min-scale));
  background: rgba(169, 201, 234, 0.1);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rrc__cta:hover {
  background: rgba(96, 200, 255, 0.22);
  border-color: rgba(96, 200, 255, 0.9);
}

.rrc__cta:focus-visible {
  outline: 2px solid #026ff1;
  outline-offset: 2px;
}

/* 文案：Figma Alibaba PuHuiTi 14px #92DBFF */
.rrc__cta-text {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1;
  color: #92dbff;
  white-space: nowrap;
}

/* 点击手势图标：Figma Turn-on 24×24（素材自带左侧留白，间距不再另加） */
.rrc__cta-icon {
  width: calc(24 * var(--min-scale));
  height: calc(24 * var(--min-scale));
  object-fit: contain;
  pointer-events: none;
}

/* ===== 右侧插画：设计稿 x=160 y=26 w=133 h=132（卡片 302 宽 → 右边距 9） ===== */
.rrc__art {
  position: absolute;
  right: calc(9 * var(--min-scale));
  top: calc(26 * var(--min-scale));
  width: calc(133 * var(--min-scale));
  height: calc(132 * var(--min-scale));
  object-fit: contain;
  object-position: center;
  pointer-events: none;
}
</style>
