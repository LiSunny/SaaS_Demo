<template>
  <div class="gongmao-title-bar">
    <!-- Subtract SVG 背景 (Figma 设计稿 1:1 还原) -->
    <img
      class="title-bg"
      src="@/assets/bigscreen/gongmao-title-bg.svg"
      alt=""
    />

    <!-- 底部分隔线 (Figma: 4px 渐变条) -->
    <div class="title-divider" />

    <!-- 标题文字 -->
    <p class="title-text">{{ title }}</p>

    <!-- 顶部右侧装饰条 (Figma: Frame 323) -->
    <img
      class="top-right-bar"
      src="@/assets/bigscreen/gongmao-title-topbar.svg"
      alt=""
    />

    <!-- 右上角青色装饰 (Figma: Rectangle 62) -->
    <img
      class="cyan-diamond"
      src="@/assets/bigscreen/gongmao-title-cyan.svg"
      alt=""
    />

    <!-- 右侧装饰 V 形 (Figma: Group 22) -->
    <img
      class="title-chevrons"
      src="@/assets/bigscreen/gongmao-title-chevrons.svg"
      alt=""
    />

    <!-- 右侧徽章标签 (Figma: Group 23, badge 属性有值时显示) -->
    <div v-if="badge" class="title-badge">
      <img
        class="badge-frame"
        src="@/assets/bigscreen/gongmao-title-badge-frame.svg"
        alt=""
      />
      <span class="badge-text">{{ badge }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  /** 右侧徽章文字（可选），如"责任状"。不传则不显示徽章 */
  badge?: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.gongmao-title-bar {
  position: relative;
  width: 100%;
  height: vh(48);
  flex-shrink: 0;
  overflow: hidden;
}

/* ===== Subtract SVG 背景 (574×42) ===== */
.title-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: vh(42);
  pointer-events: none;
}

/* ===== 底部分隔线 (Figma: 4px, #003890 → #2371b7 → #003890) ===== */
.title-divider {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: vh(4);
  background: linear-gradient(
    to right,
    #003890 0%,
    #2371b7 50%,
    #003890 100%
  );
}

/* ===== 标题文字 (Figma: YouSheBiaoTiHei 28px, white→#89b5ff) ===== */
.title-text {
  position: absolute;
  left: vw(18);
  top: vh(3);
  bottom: vh(9);
  display: flex;
  align-items: center;
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 28px);
  font-weight: 400;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  z-index: 1;
}

/* ===== 顶部右侧装饰条 (Figma: Frame 323, 286×8) ===== */
.top-right-bar {
  position: absolute;
  right: 0;
  top: 0;
  width: vw(286);
  height: vh(8);
  pointer-events: none;
}

/* ===== 右上角青色装饰 (Figma: Rectangle 62, 7×7) ===== */
.cyan-diamond {
  position: absolute;
  right: 0;
  top: vh(10);
  width: vw(7);
  height: vh(7);
  pointer-events: none;
}

/* ===== 右侧装饰 V 形 (Figma: Group 22, 72×13.4) ===== */
.title-chevrons {
  position: absolute;
  right: vw(22);
  bottom: vh(12.6);
  width: vw(72);
  height: vh(13);
  pointer-events: none;
}

/* ===== 右侧徽章标签 (Figma: Group 23) ===== */
.title-badge {
  position: absolute;
  right: vw(10);
  top: calc(50% + vh(2.5));
  transform: translateY(-50%);
  width: vw(79);
  height: vh(25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  /* 徽章边框 SVG */
  .badge-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .badge-text {
    position: relative;
    font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
    font-size: clamp(11px, calc(14 * var(--min-scale)), 14px);
    font-weight: 400;
    color: #ffffff;
    white-space: nowrap;
    line-height: 1;
  }
}
</style>
