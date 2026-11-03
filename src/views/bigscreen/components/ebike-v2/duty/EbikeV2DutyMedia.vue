<template>
  <EbikeV2Card title="实时画面" class="media">
    <div class="media__inner">
      <!-- ===== 画面来源切换 ===== -->
      <div class="media__tabs" role="radiogroup" aria-label="画面来源">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          role="radio"
          class="media__tab"
          :class="{ 'is-active': source === t.key }"
          :aria-checked="source === t.key"
          @click="source = t.key"
        >
          <span class="media__radio" />
          {{ t.label }}
        </button>
      </div>

      <!-- ===== 画面区 ===== -->
      <div class="media__stage">
        <img v-if="imageUrl" class="media__img" :src="imageUrl" alt="告警图片" />
        <video v-else-if="videoUrl" class="media__video" :src="videoUrl" controls />
        <span v-else class="media__empty">{{ emptyText }}</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 实时画面
 *
 * 两种来源：告警图片 / 现场视频（云端同一组切换）。
 * 本地没有告警抓拍与视频流的接口来源，默认空态 —— 不放占位图假装有画面。
 * 有真实地址时把 imageUrl / videoUrl 传进来即可。
 */
import { ref } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'

withDefaults(
  defineProps<{
    /** 告警图片地址 */
    imageUrl?: string
    /** 现场视频地址 */
    videoUrl?: string
  }>(),
  { imageUrl: '', videoUrl: '' },
)

const TABS = [
  { key: 'image', label: '告警图片' },
  { key: 'video', label: '现场视频' },
] as const

type SourceKey = (typeof TABS)[number]['key']
const source = ref<SourceKey>('image')

const emptyText = '暂无图片'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.media {
  height: 100%;
}

.media__inner {
  @include fire-panel;
  gap: vh(8);
}

/* ===== 来源切换 ===== */
.media__tabs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(14);
}

.media__tab {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  border: none;
  background: transparent;
  padding: 0;
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.media__tab.is-active {
  color: var(--fire-text-title);
}

/* 单选圈 */
.media__radio {
  width: vw(13);
  height: vw(13);
  border-radius: 50%;
  border: 1px solid rgba(143, 176, 216, 0.8);
  background: rgba(0, 30, 68, 0.6);
  position: relative;
}

.media__tab.is-active .media__radio {
  border-color: rgba(96, 200, 255, 0.95);
}

.media__tab.is-active .media__radio::after {
  content: '';
  position: absolute;
  inset: vw(3);
  border-radius: 50%;
  background: #4fa8ff;
}

/* ===== 画面区 ===== */
.media__stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 190, 255, 0.14);
  border-radius: vw(3);
  background: rgba(0, 30, 68, 0.35);
  overflow: hidden;
}

.media__img,
.media__video {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.media__empty {
  @include fire-dim(14);
}
</style>
