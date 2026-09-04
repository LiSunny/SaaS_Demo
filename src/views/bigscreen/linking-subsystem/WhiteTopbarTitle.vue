<template>
  <!--
    白色主题大标题（Figma「示范街」设计稿 112:16869「大标题/左」，画布 1920×80）
    图层顺序（底→顶）与坐标系 = 设计稿 1:1：
      badge(662×44@0,36) < line-a(645起,68) < line-b(662起,54) < title-bg(853×70@0,0) < 标题@(36,11) < 副标题@(36,48)
    素材 = Figma 直接导出的 4 个 header-white-*.svg（与本节点 112:16869 逐字节一致），仅作背景拉伸，无任何手写图形
    主题约定：html[data-theme="light"] 显示完整装饰；dark 下隐藏装饰、标题走深蓝大屏渐变字
      （主题由调用方 SubsystemLayout 按系统类型设置，组件只响应）
  -->
  <div class="white-topbar-title">
    <!-- 徽章（底部大平行四边形 + 小平行四边形 + 底线，y42~86 贴底） -->
    <span class="wt-deco wt-badge" aria-hidden="true"></span>
    <!-- 装饰线 A（y74 起，从标题区右缘延伸到屏幕右缘） -->
    <span class="wt-deco wt-line-a" aria-hidden="true"></span>
    <!-- 装饰线 B（y60 起，更靠内） -->
    <span class="wt-deco wt-line-b" aria-hidden="true"></span>
    <!-- 标题区背景 + 斜切描边（设计稿 Frame 430，位于两条装饰线上层，右下透明让线露出） -->
    <span class="wt-deco wt-title-bg" aria-hidden="true"></span>

    <h1 class="wt-title">{{ title }}</h1>
    <div class="wt-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
// 标题字体「演示斜黑体(Source-KeynoteartHans)」的 @font-face 只在 LinkingPlatform 引入，
// 子系统页直接访问路由时不会加载 → 组件内显式引入，保证标题字体独立可用
import '@/views/bigscreen/components/linking/linking-fonts.css'

defineProps<{
  /** 主标题（如「隐患排查治理系统」） */
  title: string
  /** 副标题标签（如「按商户维度 · 处理进度跟踪」） */
  subtitle: string
}>()
</script>

<style lang="scss" scoped>
.white-topbar-title {
  position: relative;
  z-index: 1;                /* 压过 dark 顶栏 .topbar::after 的 header-left.svg 角落装饰（伪元素同为 z-index:auto，按 DOM 顺序会盖住标题文字） */
  height: 80px;              /* 设计稿画布高（2026-09-02 更新：86→80）；light 下 .topbar 内容区 = 80（82 含 border），坐标即画布坐标 */
  flex: 1;
  min-width: 0;
}

/* 装饰层：绝对定位 + 背景拉伸，pointer-events 让文字区域不受干扰 */
.wt-deco {
  position: absolute;
  pointer-events: none;
  background-repeat: no-repeat;
}

/* ===== light 主题：完整装饰（组件默认态） ===== */
.wt-badge {
  left: 0;
  top: 36px;
  width: 662px;
  height: 44px;
  background-image: url("/linking-subsystem/figma/topbar/header-white-badge.svg");
  background-size: 662px 44px;
}
.wt-line-a {
  left: 645px;
  right: 0;
  top: 68px;
  height: 12px;
  background-image: url("/linking-subsystem/figma/topbar/header-white-line1.svg");
  background-size: 100% 12px;   /* 横向拉伸到顶栏右缘（设计稿 645→1920） */
}
.wt-line-b {
  left: 662px;
  right: 0;
  top: 54px;
  height: 8px;
  background-image: url("/linking-subsystem/figma/topbar/header-white-line2.svg");
  background-size: 100% 8px;
}
.wt-title-bg {
  left: 0;
  top: 0;
  width: 853px;      /* 素材 853×70（含 Figma 导出出血），内容视觉 = 设计稿 Frame 430(852×68) */
  height: 70px;
  background-image: url("/linking-subsystem/figma/topbar/header-white-title-bg.svg");
  background-size: 853px 70px;
}

/* 标题文字：直接按设计稿文本框定位（title@36,11 · subtitle@36,48） */
.wt-title {
  position: absolute;
  left: 36px;
  top: 11px;
  margin: 0;
  font-size: 24px;
  line-height: 1.1;
  font-family: "Source-KeynoteartHans:Regular", "Source-KeynoteartHans", "DingTalk JinBuTi", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-weight: 700;
  font-style: normal;
  font-synthesis: none;
  letter-spacing: .5px;
  color: #1d5fae;
  white-space: nowrap;
}
.wt-subtitle {
  position: absolute;
  left: 36px;
  top: 48px;
  font-size: 14px;
  line-height: 1;
  letter-spacing: .6px;
  white-space: nowrap;
  color: #6b7c90;
}

/* ===== dark 主题（深蓝大屏）：仅标题文字，装饰由 css 顶栏伪元素体系负责 ===== */
[data-theme="dark"] .wt-deco {
  display: none;
}
[data-theme="dark"] .wt-title {
  color: transparent;
  background: linear-gradient(180deg, #ffffff 0%, #7fd4ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: none;
  font-size: 24px;
}
[data-theme="dark"] .wt-subtitle {
  color: #9fb4d0;
}
</style>
