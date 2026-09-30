<!--
  CampusMonitorSection
  港南校园大屏通用模块卡片容器（标题栏 + 内容区）
  设计稿节点：666:3645 等 6 个模块
-->
<template>
  <section class="cm-section">
    <!-- 标题栏 -->
    <header class="cm-section__head">
      <img
        class="cm-section__head-bg"
        :src="bgVariant === 'ov' ? '/campus-monitor/section-titles/title-ov.svg' : '/campus-monitor/section-titles/title-mini.svg'"
        alt=""
      />
      <h2 class="cm-section__title">{{ title }}</h2>
    </header>

    <!-- 内容区 -->
    <div class="cm-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 港南校园大屏模块容器
 *
 * Props:
 *   title       - 必填，模块标题（白→蓝渐变）
 *   bgVariant   - 'ov' | 'mini'，标题栏背景变体（Figma 中实际视觉一致，但命名区分）
 */
withDefaults(defineProps<{
  title: string
  bgVariant?: 'ov' | 'mini'
}>(), {
  bgVariant: 'ov',
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-monitor-common.scss" as *;

.cm-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: $cm-bg-primary;
  min-height: 0;
  overflow: hidden;

  &__head {
    position: relative;
    width: vw(384); height: vh(39);
    flex-shrink: 0;
    overflow: hidden;
  }

  &__head-bg {
    position: absolute;
    left: 0; bottom: 0;
    width: vw(392); height: vh(39);
    pointer-events: none;
  }

  &__title {
    position: absolute;
    left: vw(14); top: 50%; transform: translateY(-50%);
    margin: 0;
    @include cm-section-title;
    pointer-events: none;
    z-index: 1;
  }

  &__body {
    width: 100%;
    flex: 1;
    min-height: 0;
    border: 2px solid $cm-border-primary;
    border-top: none;  // 上边框由 head 底边接管
    padding: vh(8) vw(8);
    display: flex;
    flex-direction: column;
    gap: vh(8);
  }
}
</style>