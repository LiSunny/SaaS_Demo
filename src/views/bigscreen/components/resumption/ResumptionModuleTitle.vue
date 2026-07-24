<template>
  <!--
    Figma 设计稿 1:1 还原（node 5156:5061 Frame 622，620×36）
    结构：左侧多边形(含内阴影) → 竖线色块×2 → 右侧横线+向右斜线×3
    特点：纯透明背景，所有装饰元素浮在内容区上方
  -->
  <div class="rm-title-bar">
    <!-- 左侧：多边形 + 标题文字叠加 -->
    <div class="rm-title-left">
      <img class="rm-polygon" src="@/assets/bigscreen/resumption/title-polygon.svg" alt="" />
      <p class="rm-title-text">{{ title }}</p>
    </div>

    <!-- 右侧：色块 + 横线 + 斜线装饰（撑满剩余宽度） -->
    <div class="rm-title-right">
      <span class="rm-v-divider rm-vd-1" />
      <span class="rm-v-divider rm-vd-2" />
      <div class="rm-right-deco">
        <span class="rm-deco-line" />
        <span class="rm-slash" />
        <span class="rm-slash" />
        <span class="rm-slash" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ================================================
   标题栏容器（flex 布局，左多边形 + 右装饰）
   ================================================ */
.rm-title-bar {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: vh(36);
  margin: 0;
  padding: 0;
  flex-shrink: 0;
}

/* ================================================
   左侧：多边形 + 标题文字叠加
   ================================================ */
.rm-title-left {
  position: relative;
  flex-shrink: 0;
  // 不设宽度，由多边形撑开
}

.rm-polygon {
  display: block;
  height: vh(35);
  width: auto;
  margin: vh(1) 0 0 0;
  padding: 0;
  pointer-events: none;
}

.rm-title-text {
  position: absolute;
  left: vw(16);
  top: vh(10);
  margin: 0;
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff 0%, #b0fdff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  z-index: 1;
}

/* ================================================
   右侧：色块 + 横线 + 斜线装饰（撑满剩余宽度）
   ================================================ */
.rm-title-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: vw(6);
  padding-left: vw(8);
  padding-right: vw(4);
  min-width: 0;
}

.rm-v-divider {
  flex-shrink: 0;
  width: vw(6);
  height: vh(17);
}

.rm-vd-1 { background: #1685D3; }
.rm-vd-2 { background: #25B5D9; }

.rm-right-deco {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0;
  height: vh(7);
  min-width: 0;
}

.rm-deco-line {
  flex: 1;
  height: 0;
  min-width: vw(40);
  border-top: 2px solid #1565A4;
  margin-right: -1px;
}

.rm-slash + .rm-slash {
  margin-left: vw(2.1);
}

.rm-slash {
  display: block;
  width: vw(10);
  height: vh(6.3);
  flex-shrink: 0;
  position: relative;
  transform: rotate(51.69deg) skewX(9.57deg);
  transform-origin: center center;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    width: 100%;
    height: 0;
    top: 50%;
    border-top: 2px solid #1565A4;
  }
}
</style>
