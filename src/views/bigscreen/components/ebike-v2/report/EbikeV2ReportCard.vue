<template>
  <article class="rcard" :class="[`rcard--${report.art}`, { 'rcard--badge': report.agentBadge }]">
    <!-- 右侧 3D 插画（Figma 素材：剪贴板 + 放大镜 / 剪贴板 + 柱状图） -->
    <img class="rcard__art" :src="artSrc" alt="" aria-hidden="true" />

    <!-- 左侧内容区：Figma x=14 y=14 w=199 h=158（此处按 1.2 倍放大到 458×224 的卡片） -->
    <div class="rcard__body">
      <!-- 标题组：角标（样式一）+ 报告名 + 周期 -->
      <div class="rcard__head">
        <!-- 「小安助手」角标：Figma 6539:8661 的 IMAGE-SVG + 机器人图标整体导出 -->
        <img v-if="report.agentBadge" class="rcard__badge" :src="badgeSrc" alt="小安助手" />

        <h3 class="rcard__title">{{ report.title }}</h3>
        <p class="rcard__period">{{ report.period }}</p>
      </div>

      <!-- 「点击查看」胶囊（Figma 6539:8661 / 280:13129 同一套） -->
      <button type="button" class="rcard__cta" @click="emit('open', report)">
        <span class="rcard__cta-text">点击查看</span>
        <img class="rcard__cta-icon" :src="clickSrc" alt="" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * 运行报告卡片
 *
 * 版式 1:1 还原 Figma「人工智能+公共安全管理平台（后台）」的两个报告卡组件：
 *   · 样式一 6539:8661「报告」：顶部「小安助手」角标 + 报告名 + 日期 + 点击查看
 *   · 样式二 280:13129「报表」：无角标，标题块贴底 + 点击查看
 * 两种样式的卡体、插画位、点击胶囊完全一致，本组件用 `agentBadge` 开关区分，
 * 差异只有角标与标题块的对齐方式。
 *
 * 尺寸换算：设计稿卡 382×186，本页按 1.2 倍放大到 458×224（一行放 4 张：
 * 4×458 + 3×16 = 1880，设计稿内容宽 1920 − 左右各 16 = 1888）。
 * 卡内所有尺寸 = Figma 原值 × 1.2，统一走 `--min-scale`（视口等比缩放，
 * 卡片是固定比例的对象，不能让宽高各按 vw/vh 缩放）。
 *
 * 卡片是浅色件（设计稿就是浅底），放在大屏深蓝底上靠描边 + 阴影分离，
 * 不改成深色 —— 插画素材本身是浅底 3D 图，换深底会出现白方块。
 */
import { computed } from 'vue'
import artAlarm from '@/assets/bigscreen/ebike-v2/report/report-art-alarm.png'
import artStats from '@/assets/bigscreen/ebike-v2/report/report-art-stats.png'
import badgeSrc from '@/assets/bigscreen/ebike-v2/report/report-agent-badge.png'
import clickSrc from '@/assets/bigscreen/ebike-v2/report/report-click-icon.png'
import type { ReportItem } from './report-data'

const props = defineProps<{ report: ReportItem }>()

const emit = defineEmits<{ (e: 'open', report: ReportItem): void }>()

/** 右侧插画：分析（放大镜）/ 统计（柱状图） */
const artSrc = computed(() => (props.report.art === 'alarm' ? artAlarm : artStats))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 卡体：Figma 6539:8661 =====
   底色 linear-gradient(180deg, #F3F3F5 → #F0F1F3)、描边 #E5E5E5、圆角 8，
   全部按 1.2 倍放大（圆角 9.6 → 10）。 */
.rcard {
  position: relative;
  width: calc(458 * var(--min-scale));
  height: calc(224 * var(--min-scale));
  overflow: hidden;
  border: 1px solid #e5e5e5;
  border-radius: calc(10 * var(--min-scale));
  background: linear-gradient(180deg, #f3f3f5 0%, #f0f1f3 100%);
  /* 大屏深蓝底上靠阴影把浅色卡片托起来（设计稿是浅底页面，不需要阴影） */
  box-shadow: 0 calc(4 * var(--min-scale)) calc(16 * var(--min-scale)) rgba(0, 10, 30, 0.38);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.rcard:hover {
  transform: translateY(calc(-3 * var(--min-scale)));
  box-shadow: 0 calc(8 * var(--min-scale)) calc(22 * var(--min-scale)) rgba(0, 10, 30, 0.48);
}

/* ===== 右侧插画：Figma x=196 w=186 h=186（×1.2 = 223 宽、满高） ===== */
.rcard__art {
  position: absolute;
  right: 0;
  top: 0;
  width: calc(223 * var(--min-scale));
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

/* ===== 左侧内容区：Figma x=14 y=14 w=199 h=158（×1.2） ===== */
.rcard__body {
  position: absolute;
  left: calc(17 * var(--min-scale));
  top: calc(17 * var(--min-scale));
  width: calc(239 * var(--min-scale));
  height: calc(190 * var(--min-scale));
  display: flex;
  flex-direction: column;
  /* 「点击查看」贴底：胶囊与标题组之间的间距由 gap 给，胶囊自身吸底 */
  gap: calc(24 * var(--min-scale));
}

/* 标题组：角标 / 报告名 / 周期，组内间距 8（×1.2） */
.rcard__head {
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--min-scale));
  min-width: 0;
}

/* 样式二没有角标：标题块是一个定高 100（×1.2 = 120）的框，标题与周期
   贴在框底（对齐 Figma 280:13129 的 justifyContent: flex-end）。
   定高而不是 flex:1 —— Figma 的这个框就是 100 高，框底到「点击查看」
   之间留 20 间距，卡片底部因此还剩一小截留白（样式一的底部是齐的）。 */
.rcard:not(.rcard--badge) .rcard__head {
  flex: none;
  height: calc(120 * var(--min-scale));
  justify-content: flex-end;
}

/* 「小安助手」角标：Figma 85×26（×1.2 = 102×31） */
.rcard__badge {
  width: calc(102 * var(--min-scale));
  height: calc(31 * var(--min-scale));
  object-fit: contain;
  object-position: left center;
}

/* 报告名：Figma YouSheBiaoTiHei 34px #303133（艺术字只有 normal 档，
   字重写 400，不要加粗 —— 合成粗体会把笔画糊掉） */
.rcard__title {
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 400;
  font-size: clamp(24px, calc(41 * var(--min-scale)), 41px);
  line-height: 1.2;
  color: #303133;
  white-space: nowrap;
}

/* 周期：Figma Source-KeynoteartHans 900 18px #505968 */
.rcard__period {
  margin: 0;
  font-family: 'SectionTitleHans', 'Source-KeynoteartHans', 'PingFang SC', sans-serif;
  font-weight: 900;
  font-size: clamp(14px, calc(22 * var(--min-scale)), 22px);
  line-height: 1.2;
  color: #505968;
  white-space: nowrap;
}

/* ===== 「点击查看」胶囊：Figma h=30 r=15 padding 0 8px 0 12px 白底 ===== */
.rcard__cta {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  height: calc(36 * var(--min-scale));
  padding: 0 calc(10 * var(--min-scale)) 0 calc(14 * var(--min-scale));
  border: none;
  border-radius: calc(18 * var(--min-scale));
  background: #ffffff;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}

/* 样式二：胶囊按 Figma 的顺序跟在标题块下方（间距 20），不吸底 ——
   它的卡片底部比样式一多留一截空白，与设计稿一致。 */
.rcard:not(.rcard--badge) .rcard__cta {
  margin-top: 0;
}

.rcard__cta:hover {
  background: #eef5ff;
}

.rcard__cta:focus-visible {
  outline: 2px solid #026ff1;
  outline-offset: 2px;
}

/* 文案：Figma Alibaba PuHuiTi Medium 14px #026FF1 */
.rcard__cta-text {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-weight: 500;
  font-size: clamp(14px, calc(17 * var(--min-scale)), 17px);
  line-height: 1;
  color: #026ff1;
  white-space: nowrap;
}

/* 点击手势图标：Figma 34.55×34.55（×1.2 = 41），素材自带内边距，
   不再额外加 gap（设计稿这一处 gap 就是 0）。 */
.rcard__cta-icon {
  width: calc(41 * var(--min-scale));
  height: calc(41 * var(--min-scale));
  object-fit: contain;
  pointer-events: none;
}
</style>
