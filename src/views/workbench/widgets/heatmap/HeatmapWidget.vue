<template>
  <div
    class="heatmap-widget"
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
      class="heatmap-canvas"
    />
  </div>
</template>

<script setup lang="ts">
// 热力图 widget（自管 ECharts 全生命周期）
// ★ 禁止共享 useECharts / useChartTheme / chart-adapters
// ★ ECharts init / dispose / resize / option 组装全部自管
// ★ 浅色固定：不做 dark mode 监听
// ★ 设计稿：7 行（周一到周日）× 8 列（1-8 月）蓝渐变热力图
//   + 底部 X 月份 / 左侧 Y 星期 + 自定义 tooltip（日期/发起数/关闭率）
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { HeatmapConfig, HeatmapWidgetProps } from './types'
import { heatmapMock } from './_mocks/heatmap.mock'

const props = withDefaults(defineProps<HeatmapWidgetProps>(), {
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

const data = computed<HeatmapConfig>(() => props.config ?? heatmapMock)

const hasData = computed(() => {
  const d = data.value
  return (
    (d.xAxis?.length ?? 0) > 0 &&
    (d.yAxis?.length ?? 0) > 0 &&
    (d.data?.length ?? 0) > 0
  )
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  return typeof props.error === 'string' ? props.error : '图表加载失败'
})

// 6 阶蓝色渐变（与 pie-chart / radar-chart 同色系，浅 → 深）
const HEAT_COLORS = ['#eaf4ff', '#cde4ff', '#aecdef', '#6293c8', '#417ab7', '#1b5ea4']

function buildOption(input: HeatmapConfig): EChartsOption {
  const xList = input.xAxis ?? []
  const yList = input.yAxis ?? []
  const cells = input.data ?? []
  // 取真实最大值（或显式传 max）
  const dataMax = cells.reduce((m, [, , v]) => Math.max(m, v), 0)
  const max = input.max ?? dataMax

  return {
    grid: {
      top: 16,
      left: 32,
      right: 8,
      bottom: 56,        // 给底部 visualMap 图例留空间
      containLabel: true,
    },
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: '#D9D9D9',
      borderWidth: 1,
      textStyle: { color: '#101010', fontSize: 12 },
      extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.10); border-radius: 6px;',
      formatter: (params: any) => {
        // params.data = [xIndex, yIndex, value]
        const [xIdx, yIdx, value] = params
        const xName = xList[xIdx] ?? ''
        const yName = yList[yIdx] ?? ''
        const dateLabel = input.currentDateLabel ?? xName
        const closePct = input.closeRate ? input.closeRate(xIdx, yIdx) : null
        return `
          <div style="line-height:1.6; min-width: 120px;">
            <div style="font-weight:600; margin-bottom:2px;">${dateLabel}（周${yName}）</div>
            <div>发起：${value} 个</div>
            ${closePct !== null ? `<div>关闭率：${closePct}%</div>` : ''}
          </div>
        `
      },
    },
    xAxis: {
      type: 'category',
      data: xList,
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      // 让 X 轴 label 居中对齐到每列中心
      axisLabel: {
        color: '#5E5E5E',
        fontSize: 11,
        interval: 0,
      },
    },
    yAxis: {
      type: 'category',
      data: yList,
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#5E5E5E',
        fontSize: 11,
        interval: 0,
      },
    },
    visualMap: {
      min: 0,
      max,
      // 显示底部水平图例（少 → 多），与设计稿一致
      show: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 4,
      text: ['少', '多'],     // text[0] 对应 min 浅端，text[1] 对应 max 深端
      textStyle: { color: '#5E5E5E', fontSize: 12 },
      calculable: true,
      inRange: { color: HEAT_COLORS },
    },
    series: [{
      type: 'heatmap',
      data: cells,
      // 单元格样式：锐利正方形小块 + 较宽的白色边框让"方块感"更强
      itemStyle: {
        borderColor: '#FFFFFF',
        borderWidth: 6,        // 加大白边，让单元格看起来是独立小方块
        // 故意不设 borderRadius，保持锐利直角 = "正方形小块"
      },
      emphasis: {
        itemStyle: {
          borderColor: '#3678E3',
          borderWidth: 2,
          shadowBlur: 6,
          shadowColor: 'rgba(54,120,227,0.35)',
        },
      },
      // 让格子大小自适应 grid（避免 xAxis/yAxis 长度差异过大导致格子被压扁）
      // 通过 progressive / layoutParams 控制也行；这里依赖 grid padding + responsive resize
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
.heatmap-widget {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 220px;
}

.heatmap-canvas {
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