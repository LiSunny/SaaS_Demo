<template>
  <div
    class="pie-chart-widget"
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
    <!-- 左饼图 + 右图例（设计稿 1:1 布局） -->
    <div
      v-show="!loading && !error && hasData"
      class="pie-layout"
    >
      <div class="pie-canvas-wrap">
        <div ref="chartRef" class="pie-canvas" />
        <div class="pie-center">
          <div class="pie-center-value">{{ formatNumber(data.centerValue) }}</div>
          <div v-if="data.centerLabel" class="pie-center-label">{{ data.centerLabel }}</div>
        </div>
      </div>
      <div class="pie-legend">
        <div
          v-for="(item, idx) in data.series"
          :key="item.name"
          class="pie-legend-item"
        >
          <div class="pie-legend-row">
            <span
              class="pie-legend-dot"
              :style="{ background: resolveColor(item, idx) }"
            />
            <span class="pie-legend-name" :title="item.name">{{ item.name }}</span>
          </div>
          <div class="pie-legend-value">{{ formatNumber(item.value) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 饼图 widget（自管 ECharts 全生命周期，浅色固定主题）
// ★ 禁止共享 useECharts / useChartTheme / chart-adapters
// ★ ECharts init / dispose / resize / option 组装全部自管
// ★ 浅色固定：不做 dark mode 监听
// ★ 中心数字通过 DOM 绝对定位叠加在 canvas 上（参考 DutyRateDist.vue）
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { PieChartConfig, PieChartWidgetProps } from './types'
import { pieChartMock } from './_mocks/pie-chart.mock'

const props = withDefaults(defineProps<PieChartWidgetProps>(), {
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

const data = computed<PieChartConfig>(() => props.config ?? pieChartMock)

const hasData = computed(() => {
  const s = data.value.series ?? []
  return s.length > 0 && s.some(x => (x.value ?? 0) > 0)
})

const errorMessage = computed(() => {
  if (!props.error) return ''
  return typeof props.error === 'string' ? props.error : '图表加载失败'
})

// 6 阶蓝色渐变（设计稿 Figma 节点 6000-14045）
const DEFAULT_COLORS = [
  '#cde4ff',  // 最浅
  '#aecdef',
  '#88b0dc',
  '#6293c8',
  '#417ab7',
  '#1b5ea4',  // 最深
]

function resolveColor(s: { color?: string }, i: number): string {
  return s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

function buildOption(input: PieChartConfig): EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#E9E9E9',
      textStyle: { color: '#101010', fontSize: 12 },
      extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.06);',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: { show: false },            // 图例用右侧 DOM 自绘
    series: [{
      type: 'pie',
      radius: ['42%', '62%'],
      center: ['50%', '50%'],          // 饼图在左侧容器内居中
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
      data: (input.series ?? []).map((s, i) => ({
        name: s.name,
        value: s.value,
        itemStyle: { color: resolveColor(s, i) },
      })),
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
.pie-chart-widget {
  position: relative;
  width: 100%;
  min-height: 200px;
}

/* 左饼图 + 右图例（设计稿 1:1 布局） */
.pie-layout {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}

.pie-canvas-wrap {
  position: relative;
  flex: 0 0 50%;            /* 左饼图占 50% 宽度 */
  height: 100%;
  min-width: 0;
}

.pie-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 中心数字叠加层 */
.pie-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;  /* 不挡 hover */
  text-align: center;
}

.pie-center-value {
  font-size: 22px;
  font-weight: 700;
  color: #101010;
  line-height: 1;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}

.pie-center-label {
  font-size: 12px;
  color: #5e5e5e;
  margin-top: 4px;
  white-space: nowrap;
}

/* 右侧图例（2 列 3 行） */
.pie-legend {
  flex: 1 1 50%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 6px 8px;
  align-items: center;
}

.pie-legend-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pie-legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.pie-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.pie-legend-name {
  font-size: 12px;
  color: #5e5e5e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.pie-legend-value {
  font-size: 13px;
  font-weight: 700;
  color: #101010;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  padding-left: 14px;       /* 与色块对齐 */
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