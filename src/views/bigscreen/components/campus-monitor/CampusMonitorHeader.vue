<!--
  CampusMonitorHeader
  港南校园大屏顶部栏（5 Tab + 大标题 + 用户区）
  设计稿节点：666:3889（大标题）
-->
<template>
  <div class="cm-header">
    <!-- 背景图（Figma 导出的复杂装饰） -->
    <img class="cm-header__bg" src="/campus-monitor/header/header-bg.png" alt="" />
    <img class="cm-header__deco" src="/campus-monitor/header/header-decoration.svg" alt="" />

    <!-- 大标题 -->
    <h1 class="cm-header__title">港南教育局&ldquo;人工智能+平安校园&rdquo;监管平台</h1>

    <!-- 5 个 Tab -->
    <div class="cm-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="cm-tab"
        :class="{ 'cm-tab--active': modelValue === tab.key }"
        @click="handleClick(tab.key)"
      >
        <template v-if="modelValue === tab.key">
          <img class="cm-tab__bg" src="/campus-monitor/section-titles/tab-active-1.svg" alt="" />
          <img class="cm-tab__bg" src="/campus-monitor/section-titles/tab-active-2.svg" alt="" />
        </template>
        <span class="cm-tab__label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- 用户区 -->
    <div class="cm-user">
      <span class="cm-user__name">{{ displayName }}</span>
      <div class="cm-user__avatar">
        <img :src="avatarUrl" alt="用户头像" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

interface TabDef { key: string; label: string }

const tabs: TabDef[] = [
  { key: 'overview',  label: '辖区态势概览' },
  { key: 'device',    label: '感知设备监测' },
  { key: 'duty',      label: '履职态势感知' },
  { key: 'supervise', label: '平安联勤督办' },
  { key: 'report',    label: '平安校园报告' },
]

// v-model 父组件控制的当前 Tab
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleClick(key: string) {
  emit('update:modelValue', key)
}

const userStore = useUserStore()
const displayName = computed(() => userStore.user?.realName || '用户名')
const avatarUrl = computed(() => {
  const u = userStore.user
  return u?.avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(u?.realName || 'default')}`
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-monitor-common.scss" as *;

.cm-header {
  position: absolute;
  top: 0; left: 0;
  width: 100vw; height: vh(86);
  z-index: 100; pointer-events: auto;
  overflow: hidden;
  // Header 区域单独深底色，对齐设计稿 666:3889 节点最外层 imgBg 渐变
  background: linear-gradient(180deg, #001a3a 0%, #002f5c 100%);
}

.cm-header__bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; object-position: top left;
  pointer-events: none;
  z-index: 1;
}

.cm-header__deco {
  position: absolute; left: 0; top: 0;
  width: 100%; height: 100%;
  object-fit: cover; pointer-events: none;
  z-index: 2;
}

.cm-header__title {
  position: absolute;
  left: vw(306); top: vh(14);  // 上移让 deco 光带在下方不接触字底
  width: vw(586); height: vh(38);
  margin: 0;
  font-family: 'Source-KeynoteartHans', 'YouSheBiaoTiHei', sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: vh(38);
  text-align: center;
  background: $cm-text-gradient-big;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);  // 设计稿节点 666:3927：306 为标题中心位置
  z-index: 3;  // 显式高于 deco，确保不被 SVG 中任何路径遮挡
  filter: drop-shadow(0 0 6px rgba(137, 213, 255, 0.45));  // 提升渐变终点颜色的可见度
}

/* ===== 5 个 Tab ===== */
.cm-tabs {
  position: absolute;
  left: vw(860); top: vh(8);
  width: vw(710); height: vh(41);
  display: flex;
  align-items: stretch;
  pointer-events: auto;
  z-index: 10;
}

.cm-tab {
  position: relative;
  flex: 1;
  width: vw(142); height: vh(41);
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;

  &__bg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    pointer-events: none;
  }

  &__label {
    position: relative; z-index: 1;
    font-family: 'Source-KeynoteartHans', 'YouSheBiaoTiHei', sans-serif;
    font-size: 16px;
    line-height: 1;
    background: $cm-text-gradient-big;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }
}

/* ===== 用户区 ===== */
.cm-user {
  position: absolute;
  right: vw(27); top: vh(18);
  display: flex; align-items: center; gap: vw(11);
  pointer-events: auto;

  &__name {
    font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
    font-size: 16px; color: #ffffff; white-space: nowrap;
  }

  &__avatar {
    width: vh(44); height: vh(44);
    border-radius: 50%; overflow: hidden; flex-shrink: 0;
    img { width: 100%; height: 100%; display: block; }
  }
}
</style>