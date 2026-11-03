<template>
  <EbikeV2Card title="档案分类" class="archive-side">
    <nav class="archive-side__tabs" role="tablist" aria-label="档案分类">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        role="tab"
        class="archive-side__tab"
        :class="{ 'is-active': t.key === activeTab }"
        :aria-selected="t.key === activeTab"
        @click="emit('update:activeTab', t.key)"
      >
        <span class="archive-side__icon">
          <img class="archive-side__icon-img" :src="TAB_ICONS[t.icon]" alt="" />
        </span>
        <span class="archive-side__label">{{ t.label }}</span>
      </button>
    </nav>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防档案页 · 左栏「档案分类」
 *
 * 设计稿 110:19099：宽 280 的分区卡，标题栏之下纵向排三个分类 tab
 * （值班记录 / 巡查记录 / 隐患台账），每个 tab 是「图标 + 文字」一行。
 *
 * 卡片外框复用 `EbikeV2Card`：它的底色 rgba(0,44,94,0.72) + blur(9px) +
 * 边框 rgba(0,152,230,0.16) + 圆角 3px，与设计稿的 Section 完全一致
 * （fill rgba(0,44,94,0.72) / blur 9px / stroke rgba(0,152,230,0.16)），
 * 标题栏 `BigscreenSectionTitle` 也与设计稿的 Container+Intersect+左右装饰同款。
 *
 * 图标：直接使用 Figma 设计稿导出的原始素材（节点 112:330 / 112:337 / 112:345，
 * 24×24 的彩色立体插画），存于 `src/assets/bigscreen/ebike-v2/archive/`。
 * 素材自带渐变与描边，不做重绘、也不做单色化 —— 这是用户明确指定的取图方式。
 */
import dutyIcon from '@/assets/bigscreen/ebike-v2/archive/archive-icon-duty.svg'
import patrolIcon from '@/assets/bigscreen/ebike-v2/archive/archive-icon-patrol.svg'
import hazardIcon from '@/assets/bigscreen/ebike-v2/archive/archive-icon-hazard.svg'
import EbikeV2Card from '../EbikeV2Card.vue'
import type { ArchiveIcon, ArchiveTab, ArchiveTabKey } from './archive-data'

defineProps<{
  /** 三类记录（tab） */
  tabs: ArchiveTab[]
  /** 当前 tab 的 key */
  activeTab: ArchiveTabKey
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', key: ArchiveTabKey): void
}>()

/** tab 图标 → Figma 原始素材（Vite 打包为 URL 字符串） */
const TAB_ICONS: Record<ArchiveIcon, string> = {
  clipboard: dutyIcon,
  map: patrolIcon,
  warning: hazardIcon,
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.archive-side {
  height: 100%;
}

/* 分类列表：内距 12，tab 之间留 12 */
.archive-side :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
  padding: vh(12) vw(12);
  overflow: hidden;
}

.archive-side__tabs {
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

/* 分类项：一行「图标 + 文字」，高 44 */
.archive-side__tab {
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

.archive-side__tab:hover {
  background: rgba(0, 92, 168, 0.6);
  color: var(--fire-text-title);
}

/* 选中态：蓝色渐变 + 亮边 + 外发光（设计稿 110:19428） */
.archive-side__tab.is-active {
  background: var(--fire-tab-active);
  border-color: var(--fire-tab-active-line);
  box-shadow: 0 vh(4) vh(12) rgba(0, 134, 228, 0.25);
  color: #ffffff;
  font-weight: 700;
}

/* 图标位：28 见方，图标居中（设计稿 icon-wrap 28×24） */
.archive-side__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(28);
  height: vh(28);
  flex-shrink: 0;
}

/* Figma 原始素材：24 见方，object-fit 保持比例，避免 vw/vh 比例差把图拉扁 */
.archive-side__icon-img {
  width: vw(24);
  height: vh(24);
  object-fit: contain;
  display: block;
}

.archive-side__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
