<template>
  <div class="bs-list-table">
    <!-- 固定表头（Figma: bg #0457a7, text #aedaff） -->
    <div class="bs-header">
      <div
        v-for="col in columns"
        :key="col.key"
        class="bs-header-cell"
        :style="{
          ...(col.width ? { flex: `0 0 ${col.width}`, minWidth: col.width } : {}),
          ...(col.minWidth && !col.width ? { minWidth: col.minWidth } : {}),
          ...(col.minWidth && col.width ? { minWidth: col.minWidth } : {}),
        }"
      >
        {{ col.label }}
      </div>
    </div>

    <!-- 可滚动内容区 -->
    <div
      class="bs-body"
      ref="bodyRef"
      :style="{ maxHeight: maxHeight }"
      @mouseenter="pauseScroll"
      @mouseleave="resumeScroll"
    >
      <div class="bs-scroll-track" ref="trackRef" :style="trackTransform">
        <div
          v-for="(row, i) in rows"
          :key="rowKey ? row[rowKey] : i"
          class="bs-row"
          :class="{ 'bs-row-stripe': i % 2 === 1 }"
        >
          <div
            v-for="col in columns"
            :key="col.key"
            class="bs-cell"
            :style="{
              ...(col.width ? { flex: `0 0 ${col.width}`, minWidth: col.width } : {}),
              ...(col.minWidth && !col.width ? { minWidth: col.minWidth } : {}),
              ...(col.minWidth && col.width ? { minWidth: col.minWidth } : {}),
            }"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="i">
              {{ row[col.key] }}
            </slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

export interface BsColumn {
  /** 列标识（对应 row 的字段名，也用于 slot 名 cell-{key}） */
  key: string
  /** 列表头文字 */
  label: string
  /** 可选固定宽度（CSS 值，如 "90px" 或 "vw(90)"），不设则弹性等分 */
  width?: string
  /** 可选最小宽度（CSS 值），保证文字不被截断；设 width 时也生效 */
  minWidth?: string
}

const props = withDefaults(defineProps<{
  columns: BsColumn[]
  rows: Record<string, any>[]
  /** 行唯一键字段名，用于 v-for key；不传则用 index */
  rowKey?: string
  /** 内容区最大高度（CSS 值），不设则自适应父容器 */
  maxHeight?: string
  /** 是否启用自动滚动（默认 true） */
  autoScroll?: boolean
  /** 滚动速度，像素/秒（默认 30） */
  scrollSpeed?: number
}>(), {
  autoScroll: true,
  scrollSpeed: 30,
})

const bodyRef = ref<HTMLElement>()
const trackRef = ref<HTMLElement>()
const translateY = ref(0)

let animationId = 0
let paused = false
let lastTime = 0
let accumulatedPx = 0
let maxScrollPx = 0
let resetTimer: ReturnType<typeof setTimeout> | null = null

const trackTransform = computed(() => ({
  transform: `translateY(${-translateY.value}px)`,
}))

function pauseScroll() {
  paused = true
}

function resumeScroll() {
  paused = false
}

function calcMaxScroll(): number {
  if (!bodyRef.value || !trackRef.value) return 0
  return trackRef.value.scrollHeight - bodyRef.value.clientHeight
}

function scrollLoop(timestamp: number) {
  if (!bodyRef.value || !trackRef.value) {
    animationId = requestAnimationFrame(scrollLoop)
    return
  }
  // 每帧重新计算（适应窗口大小变化）
  maxScrollPx = calcMaxScroll()
  if (maxScrollPx <= 0) {
    animationId = requestAnimationFrame(scrollLoop)
    return
  }
  if (lastTime === 0) lastTime = timestamp
  const delta = timestamp - lastTime
  lastTime = timestamp

  if (!paused) {
    accumulatedPx += (props.scrollSpeed! / 1000) * delta
    if (accumulatedPx >= maxScrollPx) {
      accumulatedPx = maxScrollPx
      translateY.value = accumulatedPx
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        accumulatedPx = 0
        translateY.value = 0
      }, 1500)
    } else {
      translateY.value = accumulatedPx
    }
  }
  animationId = requestAnimationFrame(scrollLoop)
}

onMounted(async () => {
  if (props.autoScroll) {
    await nextTick()
    // 再用 rAF 等一帧，确保 CSS 布局完全计算完毕
    requestAnimationFrame(() => {
      animationId = requestAnimationFrame(scrollLoop)
    })
  }
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resetTimer) clearTimeout(resetTimer)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.bs-list-table {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 固定表头（Figma: bg #0457a7, text #aedaff, 16px） ===== */
.bs-header {
  display: flex;
  align-items: center;
  background: #0457a7;
  flex-shrink: 0;
}

.bs-header-cell {
  flex: 1 0 0;
  min-width: 0;
  padding: vh(6) vw(10);
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #aedaff;
  text-align: center;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 可滚动内容区 ===== */
.bs-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.bs-scroll-track {
  will-change: transform;
}

/* ===== 数据行（Figma: text #f1f1f1, 16px） ===== */
.bs-row {
  display: flex;
  align-items: center;
}

.bs-row-stripe {
  background: rgba(0, 73, 142, 0.14);
}

.bs-cell {
  flex: 1 0 0;
  min-width: 0;
  padding: vh(12) vw(10);
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f1f1f1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 空状态 ===== */
.bs-empty {
  padding: vh(24) vw(8);
  text-align: center;
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
  color: rgba(255, 255, 255, 0.3);
}
</style>
