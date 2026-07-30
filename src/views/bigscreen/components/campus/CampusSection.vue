<template>
  <div class="campus-section">
    <!-- 标题栏 -->
    <div class="section-header">
      <!-- 标题背景梯形（CSS 自适应宽度，最底层） -->
      <div class="header-bg-trapezoid" />

      <!-- 底部分割线 -->
      <div class="header-divider" />

      <!-- 左侧斜切强调条：CSS 还原 Figma 平行四边形（渐变 white→#B6EAFF→#79D9FF） -->
      <div class="header-accent" />

      <!-- 中文标题 -->
      <h2 class="header-title">{{ title }}</h2>

      <!-- 英文副标题 -->
      <p class="header-subtitle">{{ subtitle }}</p>
    </div>

    <div class="section-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.campus-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: rgba(43, 101, 175, 0.35);
  border-radius: 4px;
  overflow: hidden;
  padding: vh(10) vw(10);
}

/* ===== 标题栏（Figma: 548×49） ===== */
.section-header {
  position: relative;
  flex-shrink: 0;
  height: vh(49);
}

/* 左侧强调条：CSS 还原 Figma Rectangle 3（16.5×38 斜切平行四边形，渐变 white→#B6EAFF→#79D9FF） */
.header-accent {
  position: absolute;
  left: 0;
  top: vh(6.5);
  width: vw(16.5);
  height: vh(38);
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #B6EAFF 59.13%,
    #79D9FF 100%
  );
  clip-path: polygon(38% 1%, 97% 0%, 59% 100%, 3% 100%);
  z-index: 1;
}

/* 标题背景梯形（自适应宽度。Figma: left:6, bottom:5, height:22, 渐变 #BEF6FE→#48E5E5） */
.header-bg-trapezoid {
  position: absolute;
  left: vw(6);
  right: 0;
  bottom: vh(5);
  height: vh(22);
  background: linear-gradient(
    270deg,
    rgba(190, 246, 254, 0.01) 0%,
    rgba(72, 229, 229, 0.25) 100%
  );
  pointer-events: none;
}

/* 底部分割线（自适应宽度。Figma: left:0, right:7, height:2, 渐变 cyan→transparent） */
.header-divider {
  position: absolute;
  left: 0;
  right: vw(7);
  bottom: 0;
  height: vh(2);
  background: linear-gradient(
    90deg,
    rgba(22, 255, 224, 0.45) 0%,
    rgba(116, 178, 255, 0) 100%
  );
  pointer-events: none;
}

/* 中文标题 */
.header-title {
  position: absolute;
  left: vw(24);
  top: 0;
  margin: 0;
  z-index: 2;
  font-family: 'YouSheBiaoTiHei', 'Source-KeynoteartHans', 'PingFang SC', sans-serif;
  font-size: clamp(22px, calc(24 * var(--min-scale)), 28px);
  font-weight: 400;
  line-height: vh(49);
  color: #ffffff;
  white-space: nowrap;
}

/* 英文副标题 */
.header-subtitle {
  position: absolute;
  right: vw(7);
  bottom: 0;
  margin: 0;
  z-index: 2;
  font-family: 'Arial', 'Helvetica Neue', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 14px);
  font-style: italic;
  color: rgba(255, 255, 255, 0.54);
  line-height: vh(49);
  white-space: nowrap;
}

/* 内容区（卡片 padding 已提供左右下边距，此处仅顶部间距） */
.section-body {
  flex: 1;
  min-height: 0;
  padding-top: vh(16);
  overflow: hidden;
}
</style>
