<template>
  <div class="bsnd-root" :class="{ open }">
    <!-- 收起态：屏幕左缘悬浮把手 -->
    <button
      v-show="!open"
      type="button"
      class="bsnd-handle"
      title="打开导航"
      aria-label="打开导航"
      @click="show"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
      <span class="bsnd-handle-label">{{ header }}</span>
    </button>

    <!-- 展开态：悬浮抽屉面板 -->
    <transition name="bsnd-slide">
      <aside
        v-if="open"
        class="bsnd-panel"
        @mouseenter="pauseAutoHide"
        @mouseleave="armAutoHide"
      >
        <div class="bsnd-head">
          <span class="bsnd-head-title">{{ header }}</span>
          <button type="button" class="bsnd-close" aria-label="收起导航" title="收起" @click="hide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
        <nav class="bsnd-list">
          <button
            v-for="it in items"
            :key="it.id"
            type="button"
            class="bsnd-item"
            :class="{ active: it.id === activeId }"
            @click="pick(it.id)"
          >
            <span v-if="it.iconImg" class="bsnd-icon"><img :src="it.iconImg" alt="" /></span>
            <span v-else-if="it.icon" class="bsnd-icon" v-html="it.icon"></span>
            <span class="bsnd-body">
              <span class="bsnd-title">{{ it.title }}</span>
              <span v-if="it.tag" class="bsnd-tag">{{ it.tag }}</span>
            </span>
          </button>
        </nav>
      </aside>
    </transition>
  </div>
</template>

<script setup lang="ts">
/**
 * BigscreenNavDrawer — 可视化大屏通用悬浮导航抽屉
 *
 * 点击左缘把手滑出，autoHide 毫秒无交互后自动收起（悬停面板时暂停计时）。
 * 通过 items 注入任意大屏的菜单配置，select 事件回传选中项 id。
 */
import { onBeforeUnmount, ref, watch } from 'vue'

export interface BigscreenNavItem {
  id: number | string
  title: string
  tag?: string
  /** 图标 SVG 内部片段（不含 <svg> 外壳），可省略 */
  icon?: string
  /** 品牌位图图标（如概览页 PNG），存在时优先以 <img> 渲染 */
  iconImg?: string
}

const props = withDefaults(defineProps<{
  items: BigscreenNavItem[]
  activeId?: number | string | null
  /** 抽屉标题 */
  header?: string
  /** 展开后无交互自动收起的时长（ms） */
  autoHide?: number
}>(), {
  activeId: null,
  header: '导航菜单',
  autoHide: 5000,
})

const emit = defineEmits<{ (e: 'select', id: number | string): void }>()

const open = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}
function armAutoHide() {
  clearTimer()
  timer = setTimeout(() => { open.value = false }, props.autoHide)
}
function show() {
  open.value = true
}
function hide() {
  open.value = false
}
function pick(id: number | string) {
  emit('select', id)
  open.value = false
}

watch(open, (v) => {
  if (v) armAutoHide()
  else clearTimer()
})
onBeforeUnmount(clearTimer)
</script>

<style scoped>
.bsnd-root {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 把手（收起态） ===== */
.bsnd-handle {
  pointer-events: auto;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid rgba(71, 132, 232, 0.45);
  border-left: 0;
  border-radius: 0 10px 10px 0;
  background: linear-gradient(180deg, rgba(8, 66, 162, 0.88), rgba(5, 51, 125, 0.92));
  color: #dfeaff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: background 0.15s;
}
.bsnd-handle:hover {
  background: linear-gradient(180deg, rgba(12, 82, 186, 0.92), rgba(7, 61, 140, 0.95));
}
.bsnd-handle svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}
.bsnd-handle-label {
  writing-mode: vertical-lr;
  letter-spacing: 4px;
  font-size: 12px;
  color: #a9c7ff;
  opacity: 0.9;
}

/* ===== 抽屉面板 ===== */
.bsnd-panel {
  pointer-events: auto;
  position: absolute;
  left: 12px;
  top: 80px;
  bottom: 14px;
  width: 300px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(8, 66, 162, 0.92) 0%, rgba(5, 51, 125, 0.95) 100%);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  backdrop-filter: blur(8px);
}
.bsnd-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(71, 132, 232, 0.3);
}
.bsnd-head-title {
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(to bottom, #e5f2ff 0%, #b0cdff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.bsnd-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #89b5ff;
  cursor: pointer;
  transition: background 0.15s;
}
.bsnd-close:hover {
  background: rgba(71, 132, 232, 0.18);
  color: #cfe1ff;
}
.bsnd-close svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.bsnd-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bsnd-item {
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid transparent;
  color: #dfeaff;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}
.bsnd-item:hover {
  background: rgba(71, 132, 232, 0.16);
}
.bsnd-item.active {
  background: rgba(71, 132, 232, 0.26);
  border-color: rgba(71, 132, 232, 0.55);
}
.bsnd-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(71, 132, 232, 0.2);
  color: #89b5ff;
}
.bsnd-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  display: block;
}
.bsnd-item.active .bsnd-icon {
  background: #4784e8;
  color: #fff;
}
.bsnd-icon :deep(svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bsnd-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.bsnd-title {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: #ffffff;
}
.bsnd-item.active .bsnd-title {
  color: #eaf2ff;
}
.bsnd-tag {
  font-size: 12px;
  color: #99b1cf;
  line-height: 1.45;
  margin-top: 1px;
}

/* ===== 滑入滑出过渡 ===== */
.bsnd-slide-enter-active,
.bsnd-slide-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}
.bsnd-slide-enter-from,
.bsnd-slide-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}
</style>
