<template>
  <div class="sys-column">
    <!-- ===== 列框装饰（Figma: Subtract 525×802 + 三角 TL/BL/BR） ===== -->
    <img class="frame-body" src="@/assets/bigscreen/linking/linking-frame-body.svg" alt="" />
    <img class="frame-corner frame-corner--tl" src="@/assets/bigscreen/linking/linking-frame-corner-tl.svg" alt="" />
    <img class="frame-corner frame-corner--bl" src="@/assets/bigscreen/linking/linking-frame-corner-bl.svg" alt="" />
    <div class="frame-corner frame-corner--br">
      <img src="@/assets/bigscreen/linking/linking-frame-corner-br.svg" alt="" />
    </div>

    <!-- ===== 内容区（Figma: 475.667px 宽，水平垂直居中，gap 28px） ===== -->
    <div class="col-inner">
      <!-- 列头（Figma: 71.979px 高） -->
      <div class="col-head">
        <div class="col-head-row">
          <!-- 中文标题（Figma: Source-KeynoteartHans 24px，渐变 white→#89b5ff） -->
          <p class="col-title">{{ column.title }}</p>
          <!-- 标题底部渐变线（Figma: 12.846px 高，贴底） -->
          <div class="col-title-line" />
          <!-- 英文标题（Figma: DingTalk Sans 20px #1e4b93，绝对定位）
               注意：left 不能用 scss 的 vw() 函数（编译期），模板里需写浏览器可解析的 calc -->
          <p class="col-en" :style="{ left: `calc(${column.enLeft} / 1920 * 100vw)` }">{{ column.enTitle }}</p>
        </div>
        <!-- 列副标题（Figma: 20px #99b1cf） -->
        <p class="col-desc">{{ column.desc }}</p>
      </div>

      <!-- 系统卡片列表（Figma: gap 18px，5 张卡片） -->
      <div class="col-cards">
        <SysCard v-for="card in column.cards" :key="card.title" :card="card" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SysColumnData } from './linking-systems'
import SysCard from './SysCard.vue'

defineProps<{
  column: SysColumnData
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 列容器（Figma: 525×802，flex-1 三等分，高度由父容器定） */
.sys-column {
  position: relative;
  flex: 1 0 0;
  min-width: 0;
  height: 100%;
}

/* Figma: Subtract 525×802 铺满 */
.frame-body {
  position: absolute;
  left: 0; top: 0;
  width: vw(525); height: vh(802);
  display: block; pointer-events: none;
}

/* 三角装饰：TL 16×16 @ (0,0)；BL 18×18 @ (0,bottom)；BR 18×18 镜像 @ (right,bottom) */
.frame-corner {
  position: absolute;
  display: block; pointer-events: none;
}

.frame-corner--tl {
  left: 0; top: 0;
  width: vw(16); height: vw(16);
}

.frame-corner--bl {
  left: 0; bottom: 0;
  width: vw(18); height: vw(18);
}

.frame-corner--br {
  right: 0; bottom: 0;
  width: vw(18); height: vw(18);
  display: flex; align-items: center; justify-content: center;
}

.frame-corner--br img {
  width: 100%; height: 100%;
  /* Figma: -scale-y-100 rotate-180 = 水平镜像 */
  transform: rotate(180deg) scaleY(-1);
  display: block;
}

/* 内容区（Figma: 475.667px 宽，水平垂直居中） */
.col-inner {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: vw(475.667);
  display: flex; flex-direction: column;
  gap: vh(28);
}

/* ===== 列头（Figma: 71.979px 高） ===== */
.col-head {
  display: flex; flex-direction: column;
  gap: vh(8);
  flex-shrink: 0;
}

/* 标题行（Figma: inline-grid，高 36.976px，标题顶部对齐 + 渐变线贴底） */
.col-head-row {
  position: relative;
  height: vh(36.976);
  width: 100%;
  flex-shrink: 0;
}

/* 中文标题（Figma: 24px，行高 29px，ml 2.59%） */
.col-title {
  font-family: 'Source-KeynoteartHans', 'YouSheBiaoTiHei', 'PingFang SC', sans-serif;
  font-size: clamp(18px, calc(24 * var(--min-scale)), 24px);
  font-weight: 400;
  line-height: vh(29);
  margin-left: 2.59%;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

/* 标题底部渐变线（Figma: 12.846px 高，95.54% 宽，贴底，56.32° 渐变） */
.col-title-line {
  position: absolute;
  left: 0; bottom: 0;
  width: 95.54%; height: vh(12.846);
  background: linear-gradient(
    56.32deg,
    rgb(25, 82, 170) 0%,
    rgba(22, 70, 145, 0.688) 34.615%,
    rgba(15, 43, 91, 0) 100%
  );
}

/* 英文标题（Figma: DingTalk Sans 20px #1e4b93，top 6px，left 按列配置） */
.col-en {
  position: absolute;
  top: vh(6);
  font-family: 'DingTalk JinBuTi', 'PingFang SC', sans-serif;
  font-size: clamp(15px, calc(20 * var(--min-scale)), 20px);
  font-weight: 400;
  line-height: normal;
  color: #1e4b93;
  white-space: nowrap;
}

/* 列副标题（Figma: 20px #99b1cf） */
.col-desc {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(15px, calc(20 * var(--min-scale)), 20px);
  font-weight: 400;
  line-height: normal;
  color: #99b1cf;
  white-space: nowrap;
}

/* 卡片列表（Figma: gap 18px） */
.col-cards {
  display: flex; flex-direction: column;
  gap: vh(18);
  flex-shrink: 0;
}
</style>
