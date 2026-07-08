<template>
  <div class="module-title-bar">
    <!-- 左上斜切背景（Figma SVG 矢量路径 1:1 还原） -->
    <svg
      class="title-bg-svg"
      viewBox="0 0 448 46"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M448 46H0V24L24 0H448V46Z"
        :fill="`url(#${gradientId})`"
      />
      <defs>
        <linearGradient
          :id="gradientId"
          x1="0"
          y1="46"
          x2="448.918"
          y2="12.178"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#005FBC" />
          <stop offset="0.326923" stop-color="#0250B2" />
          <stop offset="1" stop-color="#005FBC" />
        </linearGradient>
      </defs>
    </svg>

    <!-- 左侧三色装饰点（Figma SVG 矢量 + 滤镜辉光 1:1 导出） -->
    <img
      class="title-dots"
      src="@/assets/bigscreen/dot.svg"
      alt=""
    />

    <!-- 底部分隔线（渐变） -->
    <div class="title-divider" />

    <!-- 文字区域（flex 垂直居中 + 两端对齐） -->
    <div class="title-content">
      <!-- 主标题（白色→蓝色线性渐变文字） -->
      <p class="title-text">{{ title }}</p>
      <!-- 副标题（右侧淡出英文斜体） -->
      <p
        class="title-sub"
        :class="{ clickable: subtitleClickable }"
        @click="subtitleClickable && $emit('subtitle-click')"
      >{{ subtitle }}</p>
    </div>

    <!-- 放大图标 -->
    <button
      v-if="showZoom"
      class="zoom-btn"
      :title="isZoomed ? '还原' : '放大'"
      @click.stop="$emit('zoom-click')"
    >
      <!-- 放大图标 -->
      <svg v-if="!isZoomed" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
      <!-- 还原图标 -->
      <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="4 8 4 4 8 4" />
        <polyline points="20 16 20 20 16 20" />
        <line x1="14" y1="10" x2="4" y2="4" />
        <line x1="10" y1="14" x2="20" y2="20" />
      </svg>
    </button>
  </div>
</template>

<script lang="ts">
/** 模块级计数器，确保每个组件实例的 SVG 渐变 ID 唯一 */
let seq = 0
function nextGradientId(): string {
  return `bg-gradient-${++seq}`
}
</script>

<script setup lang="ts">
defineProps<{
  /** 主标题 */
  title: string
  /** 副标题（英文） */
  subtitle: string
  /** 是否显示放大按钮 */
  showZoom?: boolean
  /** 是否已处于放大状态 */
  isZoomed?: boolean
  /** 副标题是否可点击 */
  subtitleClickable?: boolean
}>()

defineEmits<{
  'zoom-click': []
  'subtitle-click': []
}>()

const gradientId = nextGradientId()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.module-title-bar {
  position: relative;
  width: 100%;
  height: vh(40);
  flex-shrink: 0;
  overflow: hidden;
}

/* ===== 斜切背景 SVG ===== */
.title-bg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ===== 三色装饰点（Figma SVG 矢量 + 滤镜辉光 1:1 导出） ===== */
.title-dots {
  position: absolute;
  left: vw(1);
  top: vh(1);
  width: calc(29 * var(--min-scale));
  height: calc(31 * var(--min-scale));
  pointer-events: none;
}

/* ===== 底部分隔线（Figma: #014c8e → #73a1bb 19% → #014c8e） ===== */
.title-divider {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: vh(2);
  background: linear-gradient(
    to right,
    #014c8e 0%,
    #73a1bb 19.081%,
    #014c8e 100%
  );
}

/* ===== 文字容器（flex 垂直居中 + 两端对齐，高度自适应） ===== */
.title-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: vw(38);
  padding-right: vw(12);
  pointer-events: none;
}

/* ===== 主标题（Figma: 24px, Source-KeynoteartHans, 白色→蓝色渐变） ===== */
.title-text {
  margin: 0;
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(20 * var(--min-scale)), 24px);
  font-weight: 400;
  line-height: vh(29);
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

/* ===== 副标题（Figma: 20px, Helvetica Neue Medium Italic, 右侧淡出） ===== */
.title-sub {
  margin: 0;
  font-family: 'Helvetica Neue', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 20px);
  font-weight: 500;
  font-style: italic;
  color: rgba(157, 203, 254, 0.26);
  text-align: right;
  white-space: nowrap;
}

.title-sub.clickable {
  cursor: pointer;
  pointer-events: auto;
}

.title-sub.clickable:hover {
  color: rgba(157, 203, 254, 0.5);
}

/* ===== 放大按钮 ===== */
.zoom-btn {
  position: absolute;
  right: vw(12);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 4px;
  background: rgba(10, 26, 46, 0.6);
  color: #89b5ff;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
}

.zoom-btn:hover {
  background: rgba(71, 132, 232, 0.25);
  border-color: rgba(71, 132, 232, 0.6);
  color: #3cd3d7;
}
</style>
