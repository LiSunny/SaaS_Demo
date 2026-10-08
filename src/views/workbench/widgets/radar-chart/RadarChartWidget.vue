<template>
  <div
    class="radar-chart-widget"
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
// 雷达图 widget（自管 ECharts 全生命周期，浅色固定主题）
// ★ 禁止共享 useECharts / useChartTheme / chart-adapters
// ★ ECharts init / dispose / resize / option 组装全部自管
// ★ 浅色固定：不做 dark mode 监听（reactivity -race 风险）
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { RadarChartConfig, RadarChartWidgetProps } from './types'
import { radarChartMock } from './_mocks/radar-chart.mock'

const props = withDefaults(defineProps<RadarChartWidgetProps>(), {
  height: 280,
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
let refreshTimer: number | null = null

const data = computed<RadarChartConfig>(() => props.config ?? radarChartMock)

const hasData = computed(() => {
  const s = data.value.series ?? []
  return s.length > 0 && s.every(x => (x.value?.length ?? 0) > 0)
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  return typeof props.error === 'string' ? props.error : '图表加载失败'
})

// 浅色默认配色（当前主色 #3678E3 + 设计稿浅蓝 #cde4ff）
const DEFAULT_COLORS = ['#3678E3', '#cde4ff', '#7fb8e6', '#5a9bd4']

function resolveColor(s: { color?: string }, i: number): string {
  return s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function buildOption(input: RadarChartConfig): EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#E9E9E9',
      textStyle: { color: '#101010', fontSize: 12 },
      extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.06);',
    },
    legend: {
      bottom: 8,
      left: 'center',
      orient: 'horizontal',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 24,
      textStyle: { color: '#5E5E5E', fontSize: 13 },
    },
    radar: {
      indicator: input.indicators.map(ind => ({ name: ind.name, max: ind.max })),
      radius: '60%',
      center: ['50%', '46%'],     // 雷达图整体居中，垂直略偏上为底部图例留空间
      axisName: {
        color: '#5E5E5E',
        fontSize: 13,
      },
      splitNumber: 4,
      splitArea: {
        areaStyle: {
          color: [
            'rgba(205,228,255,0.05)',
            'rgba(205,228,255,0.10)',
            'rgba(205,228,255,0.18)',
            'rgba(205,228,255,0.28)',
          ],
        },
      },
      splitLine: {
        lineStyle: { color: '#DEDEDE' },
      },
      axisLine: {
        lineStyle: { color: '#DEDEDE' },
      },
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 8,
      data: (input.series ?? []).map((s, i) => {
        const color = resolveColor(s, i)
        return {
          name: s.name,
          value: s.value,
          itemStyle: { color },
          lineStyle: { color, width: 2 },
          areaStyle: { color: hexToRgba(color, 0.35) },
        }
      }),
    }],
  }
}

function initChart() {
  if (!chartRef.value || !hasData.value) return
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildOption(data.value))
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
    chartInstance?.setOption(buildOption(data.value), true)
  }, 60)
}

onMounted(() => {
  nextTick(() => {
    initChart()
    // 兜底：grid 重排可能在 mount 后发生
    setTimeout(() => chartInstance?.resize(), 50)
  })
})

onBeforeUnmount(() => {
  if (resizeTimer) window.clearTimeout(resizeTimer)
  if (refreshTimer) window.clearTimeout(refreshTimer)
  resizeObserver?.disconnect()
  chartInstance?.dispose()
  chartInstance = null
  resizeObserver = null
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
.radar-chart-widget {
  position: relative;
  width: 100%;
  min-height: 200px;
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
  color: #e5454d;
}

.state-text {
  font-size: 14px;
  color: #5e5e5e;
}

.state-text.muted {
  color: #999;
}

.state-retry {
  padding: 4px 12px;
  border: 1px solid #dedede;
  border-radius: 6px;
  background: none;
  color: #3678e3;
  font-size: 14px;
  cursor: pointer;
  transition: all .15s;
}

.state-retry:hover {
  background: rgba(54, 120, 227, 0.06);
  border-color: #3678e3;
}
</style>