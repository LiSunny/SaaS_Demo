<template>
  <EbikeV2Card title="故障设备数量曲线">
    <div class="fc">
      <!-- ===== ① 当前故障设备 ===== -->
      <div class="fc__head">
        <div class="fc__main">
          <span class="fc__label">当前故障设备</span>
          <div class="fc__value-row">
            <span class="fc__value">{{ current }}</span>
            <span class="fc__unit">台</span>
            <span class="fc__ratio">占本系统 {{ ratioText }}</span>
          </div>
        </div>
      </div>

      <!-- ===== ② 24h 统计 ===== -->
      <div class="fc__facts">
        <span class="fc__fact">峰值 <b>{{ peak.value }}</b> 台（{{ peak.hour }}）</span>
        <span class="fc__fact">最低 <b>{{ lowest }}</b> 台</span>
      </div>

      <!-- ===== ③ 故障设备数曲线 ===== -->
      <div class="fc__chart">
        <EChart v-if="hasData" class="fc__chart-ec" :option="chartOption" autoresize />
        <span v-else class="fc__empty">该系统暂无设备</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 故障设备数量曲线
 *
 * 近 24 小时（按小时）本系统的故障设备数曲线，用 ECharts 面积折线绘制。
 * 卡片内自上而下三段：当前故障设备（核心数值）→ 24h 峰值 / 最低 → 曲线本体。
 *
 * 曲线口径 = 当前组态画面的系统，随画布上的系统切换而变：
 *   台数基数取该画面的图元数，曲线幅值随之缩放 —— 12 台的小系统不会画出
 *   与上千台系统一样的"故障 800 台"。
 *
 * 数据为演示值（后端暂无故障历史接口），生成过程按系统名做确定性随机，
 * 同一系统每次刷新得到同一条曲线，不会因重绘而跳动；接真接口时只换
 * buildSeries 的数据来源，图形部分不动。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { GridComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { SceneConfig } from '@/types/scene-config'
import { rngOf, seedOf } from './seeded-random'
import EbikeV2Card from './EbikeV2Card.vue'

use([LineChart, GridComponent, TooltipComponent, MarkPointComponent, CanvasRenderer])
const EChart = VChart

const props = withDefaults(
  defineProps<{
    /** 当前画面（取图元数作为台数基数） */
    scene?: SceneConfig | null
    /** 当前系统名 */
    systemName?: string
  }>(),
  { scene: null, systemName: '本系统' },
)

/* ============================================================
 * 数据
 * ============================================================ */

/** 本系统设备总数（画面内的图元数） */
const deviceTotal = computed(() => props.scene?.nodes?.length ?? 0)

/**
 * 24 小时的故障权重
 *
 * 夜间巡检少、故障少，早晚交接班与白天值守时段故障多 ——
 * 权重决定曲线的日内起伏形状，数值本身是"相对倍率"，不是台数。
 */
const HOUR_WEIGHT = [
  0.45, 0.32, 0.28, 0.3, 0.42, 0.78, 1.2, 1.55,
  1.4, 1.12, 1.0, 0.88, 0.85, 0.88, 1.0, 1.12,
  1.35, 1.55, 1.7, 1.5, 1.22, 1.0, 0.78, 0.58,
]

/**
 * 生成近 24 小时的故障设备数序列
 *
 * 窗口以"当前小时"收尾：最后一个点就是当前故障设备数，
 * 往前推 23 个小时，横轴标的是真实钟点。
 */
function buildSeries(systemName: string, total: number): { labels: string[]; values: number[] } {
  const endHour = new Date().getHours()
  const rnd = rngOf(seedOf(systemName))
  /** 基线台数：设备总数的 25%，最少 1 台 */
  const base = Math.max(1, Math.round(total * 0.25))

  const labels: string[] = []
  const values: number[] = []
  for (let back = 23; back >= 0; back--) {
    const hour = (endHour - back + 48) % 24
    const weight = HOUR_WEIGHT[hour]
    const noise = 0.72 + rnd() * 0.52
    labels.push(`${String(hour).padStart(2, '0')}:00`)
    values.push(Math.min(total, Math.max(0, Math.round(base * weight * noise))))
  }
  return { labels, values }
}

const series = computed(() => buildSeries(props.systemName, deviceTotal.value))

const hasData = computed(() => deviceTotal.value > 0 && series.value.values.length > 0)

/** 当前故障设备数 = 曲线最后一个点 */
const current = computed(() => series.value.values[series.value.values.length - 1] ?? 0)

/** 峰值与最低 */
const stats = computed(() => {
  const values = series.value.values
  if (!values.length) return { peakIndex: -1, peakValue: 0, lowest: 0 }
  let peakIndex = 0
  values.forEach((v, i) => {
    if (v > values[peakIndex]) peakIndex = i
  })
  return {
    peakIndex,
    peakValue: values[peakIndex],
    lowest: Math.min(...values),
  }
})

const peak = computed(() => ({
  value: stats.value.peakValue,
  hour: series.value.labels[stats.value.peakIndex] ?? '',
}))

const lowest = computed(() => stats.value.lowest)

/** 当前故障数占本系统设备的比例 */
const ratioText = computed(() =>
  deviceTotal.value ? `${((current.value / deviceTotal.value) * 100).toFixed(1)}%` : '—',
)

/* ============================================================
 * ECharts
 * ============================================================ */

/**
 * 等比缩放因子
 *
 * 与全局 --min-scale 同源（取宽高较小边），字号按 clamp(14, 尺寸 × 缩放, 尺寸)
 * 取值 —— 与页面其它文字同一套下限与上限，ECharts 的画布不会另起一套尺度。
 */
const scale = ref(1)

function updateScale() {
  scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
}

/** 设计尺寸 → 实际字号（像素），下限 14px、上限不超过设计尺寸 */
function fs(design: number): number {
  return Math.min(design, Math.max(14, Math.round(design * scale.value)))
}

const chartOption = computed<EChartsOption>(() => {
  const labels = series.value.labels
  const values = series.value.values
  const lastIndex = values.length - 1
  const peakIndex = stats.value.peakIndex

  return {
    animationDuration: 600,
    grid: {
      /* 顶部留 26px：峰值点贴在网格上沿时，其「N 台」标签要落在网格之外，
         留不够会被裁掉半个字 */
      top: 26,
      right: 10,
      bottom: 2,
      left: 2,
      containLabel: true,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 44, 94, 0.96)',
      borderColor: 'rgba(120, 190, 255, 0.28)',
      borderWidth: 1,
      padding: [6, 10],
      /* 卡片小，提示框不限制会飘出图表压到别的模块上 */
      confine: true,
      textStyle: {
        color: '#cfe4ff',
        fontSize: fs(14),
        fontFamily: 'Alibaba PuHuiTi, PingFang SC, sans-serif',
      },
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'rgba(120, 190, 255, 0.45)', type: 'dashed' },
      },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const value = Array.isArray(p?.value) ? p.value[1] : p?.value
        return `${p?.axisValue ?? ''}<br/>故障设备 ${value ?? 0} 台`
      },
    },
    xAxis: {
      type: 'category',
      /* 两端留半个类目宽：首尾的点（峰值 / 当前）才不会被绘图区边缘切掉 */
      boundaryGap: true,
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(120, 190, 255, 0.22)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#7ea6d6',
        fontSize: fs(14),
        interval: 6,
        margin: 10,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      /* 上沿留 20% 余量：峰值点不贴着网格顶，标记与标签才有余地 */
      max: (value) => Math.max(1, Math.ceil(value.max * 1.2)),
      minInterval: 1,
      splitNumber: 2,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#7ea6d6', fontSize: fs(14) },
      splitLine: { lineStyle: { color: 'rgba(120, 190, 255, 0.12)', type: 'dashed' } },
    },
    series: [
      {
        name: '故障设备数',
        type: 'line',
        smooth: 0.35,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#ff8080', width: 2 },
        itemStyle: { color: '#ff8080' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            /* 以数据包围盒为渐变基准：曲线高点处填充最实，低谷处淡出但不归零 */
            colorStops: [
              { offset: 0, color: 'rgba(255, 128, 128, 0.55)' },
              { offset: 1, color: 'rgba(255, 128, 128, 0.12)' },
            ],
          },
        },
        emphasis: { focus: 'series' },
        data: values,
        /* 标记两个点：峰值（带数值标签）与当前时刻。
           当前点用 markPoint 而不是折线自带的 symbol —— showSymbol 为 false 时
           折线端点不画点，改用 markPoint 单独指定才能同时控制两者样式。 */
        markPoint: {
          symbol: 'circle',
          symbolSize: 9,
          label: { show: false },
          itemStyle: {
            color: '#ff8080',
            borderColor: '#ffffff',
            borderWidth: 1.5,
            shadowBlur: 8,
            shadowColor: 'rgba(255, 128, 128, 0.75)',
          },
          data: [
            {
              name: '当前',
              coord: [lastIndex, values[lastIndex]],
            },
            {
              name: '峰值',
              coord: [peakIndex, values[peakIndex]],
              label: {
                show: true,
                position: 'top',
                distance: 6,
                formatter: `${values[peakIndex]} 台`,
                color: '#ffffff',
                fontSize: fs(14),
                fontWeight: 'bold',
                fontFamily: 'Douyin Sans, Alibaba PuHuiTi, sans-serif',
              },
            },
          ],
        },
      },
    ],
  }
})

onMounted(() => {
  updateScale()
  window.addEventListener('resize', updateScale)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScale)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.fc {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
  padding: vh(12) vw(16) vh(10);
  overflow: hidden;
}

/* ===== ① 当前故障设备 ===== */
.fc__head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: vw(12);
}

.fc__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

/* 指标名：L2 标签级 */
.fc__label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.2;
  color: var(--fire-text-label);
  white-space: nowrap;
}

/* 核心数值：L0 */
.fc__value-row {
  display: flex;
  align-items: baseline;
  gap: vw(6);
  min-width: 0;
}

.fc__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(24px, calc(34 * var(--min-scale)), 34px);
  line-height: 1.1;
  color: var(--fire-anomaly);
}

.fc__unit {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-sub);
}

/* 占本系统设备的比例 */
.fc__ratio {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
  white-space: nowrap;
}

/* ===== ② 24h 统计 ===== */
.fc__facts {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: vw(16);
  padding-bottom: vh(6);
  border-bottom: 1px solid rgba(120, 190, 255, 0.16);
}

.fc__fact {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
  white-space: nowrap;
}

.fc__fact b {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--fire-text-title);
}

/* ===== ③ 曲线 ===== */
.fc__chart {
  flex: 1;
  min-height: 0;
  position: relative;
}

.fc__chart-ec {
  width: 100%;
  height: 100%;
}

/* 空态 */
.fc__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
}
</style>
