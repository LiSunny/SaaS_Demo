<template>
  <div
    class="trend-line-widget"
    :style="{ height: `${height}px` }"
  >
    <!-- loading -->
    <div v-if="loading" class="state-layer">
      <el-skeleton :rows="2" animated />
    </div>
    <!-- error -->
    <div v-else-if="error" class="state-layer">
      <span class="state-icon error">!</span>
      <span class="state-text">{{ errorMessage }}</span>
      <button class="state-retry" @click="emit('retry')">重试</button>
    </div>
    <!-- empty -->
    <div v-else-if="!hasData" class="state-layer">
      <span class="state-text muted">暂无数据</span>
    </div>
    <!-- chart canvas -->
    <div
      v-show="!loading && !error && hasData"
      ref="chartRef"
      class="chart-canvas"
    />
  </div>
</template>

<script setup lang="ts">
// 趋势折线图 widget（自管 ECharts 全生命周期）
// ★ 禁止共享 useECharts / useChartTheme / chart-adapters
// ★ ECharts init / dispose / resize / 主题切换 / option 组装全部自管
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { TrendLineConfig, TrendLineWidgetProps } from './types'
import { trendLineMock } from './_mocks/trend-line.mock'

const props = withDefaults(defineProps<TrendLineWidgetProps>(), {
  height: 240,
  loading: false,
  error: null,
})

const emit = defineEmits<{
  retry: []
  'chart-click': [params: echarts.ECElementEvent]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let resizeTimer: number | null = null
let darkObserver: MutationObserver | null = null
let refreshTimer: number | null = null

const data = computed<TrendLineConfig>(() => props.config ?? trendLineMock)

const hasData = computed(() => {
  const s = data.value.series ?? []
  return s.length > 0 && s.some(x => (x.data?.length ?? 0) > 0)
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  return typeof props.error === 'string' ? props.error : '图表加载失败'
})

// ★ 自写 palette 读取（不共享 composables）
function readPalette(): string[] {
  const cs = getComputedStyle(document.documentElement)
  return [
    cs.getPropertyValue('--accent-primary').trim(),
    cs.getPropertyValue('--purple').trim(),
    cs.getPropertyValue('--success').trim(),
    cs.getPropertyValue('--warning').trim(),
  ].filter(Boolean)
}

// ★ 自写 option 组装（不共享 chart-adapters）
function buildOption(input: TrendLineConfig, palette: string[], isDark: boolean): EChartsOption {
  const axisLineColor = isDark ? '#3a4a5e' : '#e9e9e9'
  const splitLineColor = isDark ? '#1f3050' : '#F3F3F3'
  const labelColor = isDark ? '#8892B0' : '#5E5E5E'
  const tooltipBg = isDark ? 'rgba(20,30,50,0.95)' : 'rgba(255,255,255,0.96)'
  const tooltipBorder = isDark ? '#3a4a5e' : '#E9E9E9'

  return {
    grid: { top: 28, left: 8, right: 16, bottom: 24, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: isDark ? '#E9E9E9' : '#101010', fontSize: 12 },
    },
    legend: {
      right: 0,
      top: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: labelColor, fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: input.xAxis ?? [],
      boundaryGap: false,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
      axisLabel: { color: labelColor, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
      axisLabel: { color: labelColor, fontSize: 11 },
    },
    series: (input.series ?? []).map((s, i) => {
      const color = palette[i % palette.length]
      return {
        name: s.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: s.data,
        itemStyle: { color },
        lineStyle: { width: 2, color },
        areaStyle: s.area
          ? {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: hexToRgba(color, isDark ? 0.35 : 0.18) },
                  { offset: 1, color: hexToRgba(color, 0) },
                ],
              },
            }
          : undefined,
      }
    }),
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function initChart() {
  if (!chartRef.value || !hasData.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildOption(data.value, readPalette(), isDarkMode.value))
  bindResize()
  bindChartClick()
}

function bindResize() {
  if (!chartRef.value) return
  resizeObserver = new ResizeObserver(() => {
    if (resizeTimer) window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      chartInstance?.resize()
    }, 100)
  })
  resizeObserver.observe(chartRef.value)
}

function bindChartClick() {
  chartInstance?.on('click', (params) => {
    emit('chart-click', params)
  })
}

function refreshOption() {
  if (!chartInstance || !hasData.value) return
  if (refreshTimer) window.clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => {
    chartInstance?.setOption(
      buildOption(data.value, readPalette(), isDarkMode.value),
      true,
    )
  }, 60)
}

// ★ 自写 dark 模式监听（不共享 useChartTheme）
const isDarkMode = ref<boolean>(document.documentElement.classList.contains('dark'))

function bindDarkObserver() {
  darkObserver = new MutationObserver(() => {
    isDarkMode.value = document.documentElement.classList.contains('dark')
    refreshOption()
  })
  darkObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

onMounted(() => {
  nextTick(() => {
    initChart()
    // 兜底：grid 重排可能在 mount 后发生
    setTimeout(() => chartInstance?.resize(), 50)
  })
  bindDarkObserver()
})

onBeforeUnmount(() => {
  if (resizeTimer) window.clearTimeout(resizeTimer)
  if (refreshTimer) window.clearTimeout(refreshTimer)
  resizeObserver?.disconnect()
  darkObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
  resizeObserver = null
  darkObserver = null
})

watch(
  () => props.config,
  () => refreshOption(),
  { deep: true },
)

watch(
  () => hasData.value,
  (newVal) => {
    if (newVal && !chartInstance) {
      nextTick(initChart)
    }
  },
)
</script>

<style scoped>
.trend-line-widget {
  position: relative;
  width: 100%;
  min-height: 160px;
}

.chart-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.state-layer {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
}
.state-icon {
  font-size: 28px;
}
.state-icon.error {
  color: var(--danger);
}
.state-text {
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
}
.state-text.muted {
  color: var(--text-placeholder);
}
.state-retry {
  padding: 4px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm, 6px);
  background: none;
  color: var(--accent-primary);
  font-size: var(--font-small, 14px);
  cursor: pointer;
  transition: all .15s;
}
.state-retry:hover {
  background: var(--accent-primary10);
  border-color: var(--accent-primary);
}
</style>