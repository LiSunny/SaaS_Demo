<template>
  <!--
    Figma 设计稿 1:1 还原（node 5156:5061 Frame 622，620×36）
    结构：左侧多边形(含内阴影) → 竖线色块×2 → 右侧横线+向右斜线×3
    特点：纯透明背景，所有装饰元素浮在内容区上方
  -->
  <div class="rm-title-bar">
    <!-- 左侧多边形（Figma: Exclude boolean 导出 SVG, 165×35, 含内阴影） -->
    <img class="rm-polygon" src="@/assets/bigscreen/resumption/title-polygon.svg" alt="" />

    <!-- 标题文字（Figma: 16px, white → #b0fdff, 居中于多边形上） -->
    <p class="rm-title-text">{{ title }}</p>

    <!-- ===== 竖线色块 1（Figma: 矩形, 6×17, #1685D3） ===== -->
    <span class="rm-v-divider rm-vd-1" />

    <!-- ===== 竖线色块 2（Figma: 矩形备份 61, 6×17, #25B5D9） ===== -->
    <span class="rm-v-divider rm-vd-2" />

    <!-- ===== 右侧装饰组（Figma: Frame 620, x=199） ===== -->
    <div class="rm-right-deco">
      <!-- 水平横线（Figma: 路径 10, #1565A4, 2px） -->
      <span class="rm-deco-line" />
      <!-- 3 条向右斜线（Figma: 路径 ×3, rotate 51.69deg skew 9.57deg）
           用 border-top 实现细线，避免 SVG 拉伸成色块 -->
      <span class="rm-slash" />
      <span class="rm-slash" />
      <span class="rm-slash" />
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
   标题栏容器（Figma: Frame 622, 620×36, 无背景）
   ================================================ */
.rm-title-bar {
  position: relative;
  width: 100%;
  height: vh(36);  /* Figma: Frame 622, 620×36 */
  flex-shrink: 0;
}

/* ================================================
   左侧多边形（Figma: Exclude boolean, 165×35）
   底部斜切 15×15 三角形
   ================================================ */
.rm-polygon {
  position: absolute;
  left: 0;
  top: vh(2);
  width: vw(165);
  height: vh(35);
  pointer-events: none;
}

/* ================================================
   标题文字（Figma: 16px white→#b0fdff, 居中于多边形）
   ================================================ */
.rm-title-text {
  position: absolute;
  left: 0;
  top: vh(10);
  width: vw(165);
  margin: 0;
  text-align: center;
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
   竖线色块（Figma: 6×17 矩形）
   ================================================ */
.rm-v-divider {
  position: absolute;
  top: 40%;
  transform: translateY(-50%);
  width: vw(6);
  height: vh(17);
}

.rm-vd-1 {
  left: vw(172);
  background: #1685D3;
}

.rm-vd-2 {
  left: vw(185);
  background: #25B5D9;
}

/* ================================================
   右侧装饰组（Figma: Frame 620, x=199）
   横线(#1565A4) + 3 条向右斜线
   ================================================ */
.rm-right-deco {
  position: absolute;
  left: vw(199);
  right: vw(4);
  top: 40%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0;
  height: vh(7);
}

/* 水平横线（Figma: 路径 10, stroke-width 2, #1565A4）
   末端与第一条斜线相连（Figma: 线终点 x≈399.9, 斜线起点 x=399） */
.rm-deco-line {
  flex: 1;
  height: 0;
  min-width: vw(60);
  border-top: 2px solid #1565A4;
  margin-right: -1px;
}

/* 向右斜线间距（Figma: 路径间 ≈7px → 缩小至 30%） */
.rm-slash + .rm-slash {
  margin-left: vw(2.1);
}

/* 向右斜线（Figma: 路径 ×3, stroke-width 2, #1565A4 ≡ 横线颜色一致, rotate 51.69deg skew 9.57deg） */
.rm-slash {
  display: block;
  width: vw(10);
  height: vh(6.3);
  flex-shrink: 0;
  position: relative;
  transform: rotate(51.69deg) skewX(9.57deg);
  transform-origin: center center;

  /* 用绝对定位 + border 确保始终是细线，颜色与横线相同 */
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
