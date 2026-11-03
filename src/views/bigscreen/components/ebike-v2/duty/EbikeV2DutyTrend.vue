<template>
  <EbikeV2Card title="持续报警历史曲线" class="trend">
    <div class="trend__inner">
      <div class="trend__meta">
        <span class="trend__fact">
          累计上报 <b>{{ event?.reportTimes ?? 0 }}</b> 次
        </span>
        <span class="trend__fact">
          首次 <b>{{ event ? formatShort(event.firstAt) : '—' }}</b>
        </span>
      </div>
      <div class="trend__chart">
        <EChart v-if="series.length" class="trend__ec" :option="chartOption" autoresize />
        <span v-else class="trend__empty">该事件暂无报警记录</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 持续报警历史曲线
 *
 * 按日统计该事件的报警次数（云端口径：[{date, count}]）。
 * 数据由事件的上报次数按确定性随机分摊到最近若干天 —— 后端暂无
 * 报警日志接口，同一事件每次刷新得到同一条曲线。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import EbikeV2Card from '../EbikeV2Card.vue'
import { dutyTrendOf, formatShort, type DutyEvent } from './duty-data'

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])
const EChart = VChart

const props = defineProps<{
  event: DutyEvent | null
}>()

const series = computed(() => (props.event ? dutyTrendOf(props.event) : []))

/** 与全局 --min-scale 同源：字号下限 14px */
const scale = ref(1)

function updateScale() {
  scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
}

function fs(design: number): number {
  return Math.min(design, Math.max(14, Math.round(design * scale.value)))
}

const chartOption = computed<EChartsOption>(() => {
  const labels = series.value.map((d) => d.date)
  const values = series.value.map((d) => d.count)
  return {
    animationDuration: 500,
    grid: { top: 18, right: 8, bottom: 2, left: 2, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 44, 94, 0.96)',
      borderColor: 'rgba(120, 190, 255, 0.28)',
      borderWidth: 1,
      padding: [6, 10],
      confine: true,
      textStyle: {
        color: '#cfe4ff',
        fontSize: fs(14),
        fontFamily: 'Alibaba PuHuiTi, PingFang SC, sans-serif',
      },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const value = Array.isArray(p?.value) ? p.value[1] : p?.value
        return `${p?.axisValue ?? ''}<br/>报警 ${value ?? 0} 次`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(120, 190, 255, 0.22)' } },
      axisTick: { show: false },
      axisLabel: { color: '#7ea6d6', fontSize: fs(14), margin: 8 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      splitNumber: 2,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#7ea6d6', fontSize: fs(14) },
      splitLine: { lineStyle: { color: 'rgba(120, 190, 255, 0.12)', type: 'dashed' } },
    },
    series: [
      {
        name: '报警次数',
        type: 'line',
        smooth: 0.35,
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
            colorStops: [
              { offset: 0, color: 'rgba(255, 128, 128, 0.55)' },
              { offset: 1, color: 'rgba(255, 128, 128, 0.12)' },
            ],
          },
        },
        emphasis: { focus: 'series' },
        data: values,
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
@use "../fire/fire-common.scss" as *;

.trend {
  height: 100%;
}

.trend__inner {
  @include fire-panel;
  gap: vh(8);
}

/* 上报事实 */
.trend__meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(16);
  padding-bottom: vh(6);
  border-bottom: 1px solid rgba(120, 190, 255, 0.16);
}

.trend__fact {
  @include fire-dim(14);
  white-space: nowrap;
}

.trend__fact b {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: var(--fire-text-title);
  font-variant-numeric: tabular-nums;
}

/* 曲线 */
.trend__chart {
  flex: 1;
  min-height: 0;
  position: relative;
}

.trend__ec {
  width: 100%;
  height: 100%;
}

.trend__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fire-dim(14);
}
</style>
