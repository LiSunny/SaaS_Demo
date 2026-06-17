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
      <p class="title-sub">{{ subtitle }}</p>
    </div>
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
}>()

const gradientId = nextGradientId()
</script>

<style scoped>
.module-title-bar {
  position: relative;
  width: 100%;
  height: calc(40 * var(--h));
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
  left: calc(1 * var(--w));
  top: calc(1 * var(--h));
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
  height: calc(2 * var(--h));
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
  padding-left: calc(38 * var(--w));
  padding-right: calc(12 * var(--w));
  pointer-events: none;
}

/* ===== 主标题（Figma: 24px, Source-KeynoteartHans, 白色→蓝色渐变） ===== */
.title-text {
  margin: 0;
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(20 * var(--min-scale)), 24px);
  font-weight: 400;
  line-height: calc(29 * var(--h));
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
</style>
