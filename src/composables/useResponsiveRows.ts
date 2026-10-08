import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 响应式降级 composable
 *
 * 监听容器宽度，按可用宽度反推当前屏幕密度等级：
 *   level 0 (>= 1400px)：桌面，每行 6 单位（默认）
 *   level 1 (1024-1399px)：中等屏，每行 4 单位
 *   level 2 (< 1024px)：窄屏，每行 2 单位
 *
 * 数据不变（WidgetRow[] 单行单位总和 <= 6 是硬约束），只让 CSS 把每张 size 卡按更小单位 stretch。
 * 屏幕密度切换通过在容器加 .dashboard-responsive--{level} class，由媒体查询或组件 scoped CSS 渲染不同 flex 比例。
 *
 * 注意：阈值应与 WidgetCard 的媒体查询保持一致。
 */
export type ResponsiveLevel = 0 | 1 | 2

const WIDE_BREAKPOINT = 1400
const MEDIUM_BREAKPOINT = 1024

export function useResponsiveRows(target: Ref<HTMLElement | null>) {
  const level = ref<ResponsiveLevel>(0)
  let ro: ResizeObserver | null = null

  function updateLevel(width: number): ResponsiveLevel {
    let next: ResponsiveLevel = 0
    if (width < MEDIUM_BREAKPOINT) next = 2
    else if (width < WIDE_BREAKPOINT) next = 1
    if (level.value !== next) level.value = next
    return next
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    updateLevel(el.clientWidth)
    ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        updateLevel(w)
      }
    })
    ro.observe(el)
  })

  onUnmounted(() => {
    ro?.disconnect()
    ro = null
  })

  return { level }
}

/** 媒体查询阈值常量（供 CSS 同步使用） */
export const RESPONSIVE_BREAKPOINTS = {
  wide: WIDE_BREAKPOINT,
  medium: MEDIUM_BREAKPOINT,
} as const