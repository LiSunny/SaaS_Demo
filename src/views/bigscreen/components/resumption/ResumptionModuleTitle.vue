<template>
  <div class="rm-title-bar">
    <!-- 底部分隔线 -->
    <div class="rm-title-divider" />
    <!-- 标题文字 -->
    <p class="rm-title-text">{{ title }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.rm-title-bar {
  position: relative;
  width: 100%;
  height: vh(40);
  flex-shrink: 0;
  overflow: hidden;
}

/* 底部分隔线 */
.rm-title-divider {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: vh(3);
  background: linear-gradient(
    to right,
    rgba(54, 120, 227, 0) 0%,
    rgba(54, 120, 227, 0.8) 30%,
    rgba(54, 120, 227, 0.8) 70%,
    rgba(54, 120, 227, 0) 100%
  );
}

/* 标题文字 */
.rm-title-text {
  position: absolute;
  left: vw(16);
  top: 0;
  bottom: vh(6);
  display: flex;
  align-items: center;
  margin: 0;
  font-family: 'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 20px);
  font-weight: 700;
  color: #c3d7f8;
  white-space: nowrap;
  line-height: 1;

  /* 左侧蓝色竖线装饰 */
  &::before {
    content: '';
    display: inline-block;
    width: vw(3);
    height: vh(16);
    margin-right: vw(8);
    background: #3678E3;
    border-radius: 2px;
  }
}
</style>
