<template>
  <EbikeV2Card :title="title">
    <div class="placeholder-card">
      <span class="placeholder-card__hint">{{ hint }}</span>
      <span class="placeholder-card__sub">{{ sub }}</span>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
import EbikeV2Card from './EbikeV2Card.vue'

withDefaults(
  defineProps<{
    /** 模块标题 */
    title: string
    /** 占位说明 */
    hint?: string
    /** 副标题（当前系统 / 画面等上下文） */
    sub?: string
  }>(),
  { hint: '模块待接入', sub: '' },
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 占位态：中性文字，不与真实数据抢注意力 */
.placeholder-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(8);
  padding: vh(10) vw(12);
}

.placeholder-card__hint {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  color: var(--fire-text-sub);
  letter-spacing: 1px;
}

.placeholder-card__sub {
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  color: var(--fire-text-dim);
}
</style>
