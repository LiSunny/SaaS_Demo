<template>
  <div class="sys-card" :title="card.title" @click="openSubsystem">
    <!-- 图标（Figma: 88×88 容器，PNG 按 inset 百分比定位并拉伸填满） -->
    <div class="card-icon">
      <img :src="card.icon" :style="iconStyle" alt="" />
    </div>

    <!-- 文字区（Figma: 标题 20px Medium 白 / 副标题 18px Regular 白） -->
    <div class="card-text">
      <p class="card-title">{{ card.title }}</p>
      <p class="card-subtitle">{{ card.subtitle }}</p>
    </div>

    <!-- 右侧箭头（Figma: Left 36×36，镜像后指向右） -->
    <div class="card-arrow">
      <img src="@/assets/bigscreen/linking/linking-card-arrow.svg" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { SysCardItem } from './linking-systems'

const props = defineProps<{
  card: SysCardItem
}>()
const router = useRouter()

/** 点击卡片 → 跳转 Vue 子系统页面（对应 index.html 的 MODULES[id]） */
function openSubsystem() {
  router.push(`/landing/linking/sub/${props.card.mod}`)
}

/**
 * 把 Figma 的 inset（top right bottom left，如 '13.64% 13.64% 15.15% 12.12%'）
 * 解析为 left/top/width/height 样式。
 * 注意：img 是替换元素，inset 不会拉伸它，必须显式给出尺寸。
 */
const iconStyle = computed(() => {
  const [t, r, b, l] = props.card.iconInset.split(' ').map(s => parseFloat(s))
  return {
    left: `${l}%`,
    top: `${t}%`,
    width: `${100 - l - r}%`,
    height: `${100 - t - b}%`,
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* Figma: 系统卡片 119.604px 高，bg rgba(0,49,110,0.38) + border #0d50a2，px12 py8 */
.sys-card {
  display: flex; align-items: center;
  gap: vw(12);
  width: 100%; height: vh(119.604);
  padding: vh(8) vw(12);
  background: rgba(0, 49, 110, 0.38);
  border: 1px solid #0d50a2;
  border-radius: vh(4);
  flex-shrink: 0;
  /* 大屏入口：可点击 */
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease,
              background 0.25s ease, box-shadow 0.25s ease;
}

/* hover：轻微抬起 + 边框提亮 + 蓝色辉光（呼应 Rectangle 198 光晕色 #62b9da） */
.sys-card:hover {
  transform: translateY(vh(-2));
  border-color: rgba(98, 185, 218, 0.9);
  background: rgba(13, 80, 162, 0.55);
  box-shadow: 0 0 vh(16) rgba(98, 185, 218, 0.28),
              inset 0 0 vh(12) rgba(98, 185, 218, 0.15);
}

/* hover 时箭头向右微移（提示可进入） */
.sys-card:hover .card-arrow img {
  /* 镜像后 x 轴翻转，视觉向右需 translateX(-4px) */
  transform: rotate(180deg) scaleY(-1) translateX(vw(-4));
}

/* 图标容器（Figma: 88×88 overflow-clip，img 绝对定位 + inset） */
.card-icon {
  position: relative;
  width: vmin(88); height: vmin(88);
  overflow: clip;
  flex-shrink: 0;
}

.card-icon img {
  position: absolute;
  display: block;
  max-width: none;
  object-fit: fill;
}

.card-text {
  display: flex; flex-direction: column;
  gap: vh(12);
  flex: 1; min-width: 0;
  color: #ffffff;
  line-height: normal;
}

/* Figma: 20px Alibaba PuHuiTi Medium 白 */
.card-title {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(15px, calc(20 * var(--min-scale)), 20px);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}

/* Figma: 18px Alibaba PuHuiTi Regular 白 */
.card-subtitle {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}

/* 箭头（Figma: rotate(180deg) scaleY(-1) = 水平镜像，指向右） */
.card-arrow {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.card-arrow img {
  width: vmin(36); height: vmin(36);
  transform: rotate(180deg) scaleY(-1);
  display: block; pointer-events: none;
  transition: transform 0.25s ease;
}
</style>
