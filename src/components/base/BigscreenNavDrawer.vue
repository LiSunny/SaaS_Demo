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
            <span v-if="it.icon" class="bsnd-icon" v-html="it.icon"></span>
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
  border: 1px solid var(--border, rgba(120, 180, 230, 0.35));
  border-left: 0;
  border-radius: 0 10px 10px 0;
  background: var(--card, rgba(10, 44, 82, 0.88));
  color: var(--text, #dffaff);
  box-shadow: var(--shadow, 0 6px 24px rgba(0, 0, 0, 0.35));
  cursor: pointer;
  transition: background 0.15s;
}
.bsnd-handle:hover {
  background: var(--card-hover, rgba(19, 66, 114, 0.92));
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
  opacity: 0.85;
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
  border: 1px solid var(--border, rgba(120, 180, 230, 0.35));
  border-radius: 12px;
  background: var(--card, rgba(10, 44, 82, 0.92));
  box-shadow: var(--shadow, 0 10px 36px rgba(0, 0, 0, 0.45));
  overflow: hidden;
  backdrop-filter: blur(6px);
}
.bsnd-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border, rgba(120, 180, 230, 0.25));
}
.bsnd-head-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text, #dffaff);
}
.bsnd-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--muted, #b9dded);
  cursor: pointer;
  transition: background 0.15s;
}
.bsnd-close:hover {
  background: rgba(255, 255, 255, 0.08);
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
  color: var(--text, inherit);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
}
.bsnd-item:hover {
  background: rgba(120, 180, 230, 0.12);
}
.bsnd-item.active {
  background: rgba(59, 100, 180, 0.28);
  border-color: var(--border-strong, #33517e);
}
.bsnd-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--icon-bg, rgba(120, 180, 230, 0.14));
  color: var(--muted, #b9dded);
}
.bsnd-item.active .bsnd-icon {
  background: var(--border-strong, #33517e);
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
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}
.bsnd-item.active .bsnd-title {
  color: var(--accent-text, #bfe6ff);
}
.bsnd-tag {
  font-size: 12px;
  color: var(--muted, #b9dded);
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
