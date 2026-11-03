<template>
  <EbikeV2Card title="报告分类" class="report-side">
    <nav class="report-side__tabs" role="tablist" aria-label="报告分类">
      <button
        v-for="c in categories"
        :key="c.key"
        type="button"
        role="tab"
        class="report-side__tab"
        :class="{ 'is-active': c.key === activeCategory }"
        :aria-selected="c.key === activeCategory"
        @click="emit('update:activeCategory', c.key)"
      >
        <span class="report-side__icon">
          <img class="report-side__icon-img" :src="CATEGORY_ICONS[c.icon]" alt="" />
        </span>
        <span class="report-side__label">{{ c.label }}</span>
      </button>
    </nav>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 运行报告页 · 左栏「报告分类」
 *
 * 设计稿 117:21199：宽 280 的分区卡，标题栏之下纵向排三个分类 tab
 * （告警分析报告 / 设备运行报告 / 值守报告），每个 tab 是「图标 + 文字」一行。
 *
 * 卡片外框复用 `EbikeV2Card`：底色 rgba(0,44,94,0.72) + blur(9px) +
 * 边框 rgba(0,152,230,0.16) + 圆角 3px，与设计稿的 Section 完全一致
 * （fill rgba(0,44,94,0.72) / blur 9px / stroke rgba(0,152,230,0.16)），
 * 标题栏 `BigscreenSectionTitle` 也与设计稿的 Container + 渐变条 + 左右装饰同款。
 *
 * 图标：直接使用 Figma 设计稿导出的原始素材（节点 117:21215 / 117:21225 /
 * 117:21236，24×24 的彩色立体插画），存于 `src/assets/bigscreen/ebike-v2/report/`。
 * 素材自带渐变与描边，不做重绘、也不做单色化。
 */
import alarmIcon from '@/assets/bigscreen/ebike-v2/report/report-cat-alarm.svg'
import deviceIcon from '@/assets/bigscreen/ebike-v2/report/report-cat-device.svg'
import dutyIcon from '@/assets/bigscreen/ebike-v2/report/report-cat-duty.svg'
import EbikeV2Card from '../EbikeV2Card.vue'
import type { ReportCategory, ReportIcon, ReportKind } from './report-data'

defineProps<{
  /** 三类报告（tab） */
  categories: ReportCategory[]
  /** 当前分类的 key */
  activeCategory: ReportKind
}>()

const emit = defineEmits<{
  (e: 'update:activeCategory', key: ReportKind): void
}>()

/** 分类图标 → Figma 原始素材（Vite 打包为 URL 字符串） */
const CATEGORY_ICONS: Record<ReportIcon, string> = {
  clipboard: alarmIcon,
  map: deviceIcon,
  warning: dutyIcon,
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.report-side {
  height: 100%;
}

/* 分类列表：内距 12，tab 之间留 12（设计稿 117:21212） */
.report-side :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
  padding: vh(12) vw(12);
  overflow: hidden;
}

.report-side__tabs {
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

/* 分类项：一行「图标 + 文字」，高 44（设计稿 117:21213） */
.report-side__tab {
  display: flex;
  align-items: center;
  gap: vw(8);
  width: 100%;
  height: vh(44);
  padding: 0 vw(12);
  border: 1px solid transparent;
  border-radius: vw(4);
  background: var(--fire-tab-idle);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.report-side__tab:hover {
  background: rgba(0, 92, 168, 0.6);
  color: var(--fire-text-title);
}

/* 选中态：蓝色渐变 + 亮边 + 外发光（设计稿 117:21213） */
.report-side__tab.is-active {
  background: var(--fire-tab-active);
  border-color: var(--fire-tab-active-line);
  box-shadow: 0 vh(4) vh(12) rgba(0, 134, 228, 0.25);
  color: #ffffff;
  font-weight: 700;
}

/* 图标位：28 见方，图标居中（设计稿 icon-wrap 28×28） */
.report-side__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(28);
  height: vh(28);
  flex-shrink: 0;
}

/* Figma 原始素材：24 见方，object-fit 保持比例，避免 vw/vh 比例差把图拉扁 */
.report-side__icon-img {
  width: vw(24);
  height: vh(24);
  object-fit: contain;
  display: block;
}

.report-side__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
