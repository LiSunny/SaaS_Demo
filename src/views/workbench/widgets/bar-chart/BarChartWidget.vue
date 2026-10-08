<template>
  <div
    class="bar-chart-widget"
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
      class="bar-canvas"
    />
  </div>
</template>

<script setup lang="ts">
// 柱状图 widget（自管 ECharts 全生命周期）
// ★ 禁止共享 useECharts / useChartTheme / chart-adapters
// ★ ECharts init / dispose / resize / option 组装全部自管
// ★ 浅色固定：不做 dark mode 监听
// ★ 蓝色单系列柱状图，X 轴 7 区域，Y 轴 0-100 完成率 %
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { BarChartConfig, BarChartWidgetProps } from './types'
import { barChartMock } from './_mocks/bar-chart.mock'

const props = withDefaults(defineProps<BarChartWidgetProps>(), {
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
let refreshTimer: number | null = null

const data = computed<BarChartConfig>(() => props.config ?? barChartMock)

const hasData = computed(() => {
  const s = data.value.series ?? []
  return s.length > 0 && s.some(x => (x.value ?? 0) >= 0)
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  return typeof props.error === 'string' ? props.error : '图表加载失败'
})

// 单色：与 pie / radar / heatmap 同色系（深蓝 #3678E3）
const BAR_COLOR = '#3678E3'

function buildOption(input: BarChartConfig): EChartsOption {
  const items = input.series ?? []
  const max = input.max ?? 100
  const unit = input.unit ?? '%'

  return {
    grid: {
      top: 24,
      left: 40,
      right: 16,
      bottom: 32,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#E9E9E9',
      textStyle: { color: '#101010', fontSize: 12 },
      extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.06);',
      formatter: (params: any) => {
        const arr = Array.isArray(params) ? params : [params]
        const name = arr[0]?.axisValueLabel ?? arr[0]?.name ?? ''
        const value = arr[0]?.value ?? 0
        return `<div style="line-height:1.5;"><div style="font-weight:600; margin-bottom:2px;">${name}</div><div>${value}${unit}</div></div>`
      },
    },
    xAxis: {
      type: 'category',
      data: items.map(x => x.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#5E5E5E',
        fontSize: 11,
        interval: 0,
        // 长 label 旋转避免重叠
        rotate: items.length > 6 ? 25 : 0,
      },
    },
    yAxis: {
      type: 'value',
      max,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F3F3', type: 'dashed' } },
      axisLabel: {
        color: '#5E5E5E',
        fontSize: 11,
        formatter: `{value}${unit}`,
      },
    },
    series: [{
      type: 'bar',
      data: items.map(x => x.value),
      barMaxWidth: 28,
      itemStyle: {
        color: BAR_COLOR,
        borderRadius: [4, 4, 0, 0],
      },
      emphasis: {
        itemStyle: {
          color: '#1F5BC8',
        },
      },
      label: {
        show: true,
        position: 'top',
        color: '#101010',
        fontSize: 11,
        fontWeight: 600,
        formatter: `{c}${unit}`,
      },
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
.bar-chart-widget {
  position: relative;
  width: 100%;
  min-height: 220px;
}

.bar-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 三态层 */
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