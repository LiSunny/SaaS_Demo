<!--
  DeviceMonitorPanel
  感知设备监测（左中模块）
  设计稿节点：666:3661（容器） + 666:3662（小标题） + 670:1645（统计+折线） + 668:4643（感烟） + 670:1590（电气火灾）

  包含：
    - 累计接入设备（router 图标 + 数字 + 单位 + ECharts line chart）
    - 感烟探测器（设备图标 + 数字 + 单位 + ECharts doughnut 圆环 + 双占比图例）
    - 电气火灾探测器（同上）
-->
<template>
  <div class="dm-panel">
    <!-- ===== 模块内容容器（设计稿 666:3676） ===== -->
    <div class="dm-body">
      <!-- 累计接入设备 + ECharts line chart（设计稿 670:1645） -->
      <div class="dm-summary-row">
        <div class="dm-summary">
          <div class="dm-summary__head">
            <div class="dm-summary__icon-frame">
              <img class="dm-summary__icon" src="/campus-monitor/icons/router.svg" alt="" />
            </div>
            <span class="dm-summary__label">累计接入设备</span>
          </div>
          <div class="dm-summary__value-row">
            <span class="dm-summary__value">{{ totalDevices }}</span>
            <span class="dm-summary__unit">台</span>
          </div>
        </div>
        <div ref="lineChartRef" class="dm-line-chart"></div>
      </div>

      <!-- 两个设备指标块（设计稿 670:1711） -->
      <div class="dm-metrics">
        <div
          v-for="device in devices"
          :key="device.key"
          class="dm-metric"
        >
          <div class="dm-metric__main">
            <!-- 左侧：图标 + 标签 + 数字 -->
            <div class="dm-metric__info">
              <div class="dm-metric__icon-frame">
                <img class="dm-metric__icon" :src="device.iconSrc" alt="" />
              </div>
              <div class="dm-metric__text">
                <div class="dm-metric__label-row">
                  <span class="dm-metric__label">{{ device.label }}</span>
                  <img class="dm-metric__attention" src="/campus-monitor/icons/device-attention.svg" alt="" />
                </div>
                <div class="dm-metric__value-row">
                  <span class="dm-metric__value">{{ device.value }}</span>
                  <span class="dm-metric__unit">台</span>
                </div>
              </div>
            </div>
            <!-- 右侧：ECharts 南丁格尔圆环（normal 72.5% 蓝 + abnormal 27.5% 青） -->
            <div class="dm-metric__chart">
              <div :ref="el => ringChartRefs[device.key] = el as HTMLDivElement" class="dm-metric__chart-ec"></div>
            </div>
          </div>
          <!-- 分隔线 + 占比图例（设计稿 668:4664 / 670:1607） -->
          <div class="dm-metric__legend">
            <div class="dm-metric__legend-item">
              <span class="dm-metric__legend-dot" :style="{ background: device.normalColor }"></span>
              <span class="dm-metric__legend-label">正常设备占比</span>
              <span class="dm-metric__legend-value">{{ device.normalRate }}%</span>
            </div>
            <div class="dm-metric__legend-item">
              <span class="dm-metric__legend-dot" :style="{ background: device.abnormalColor }"></span>
              <span class="dm-metric__legend-label">异常设备占比</span>
              <span class="dm-metric__legend-value">{{ device.abnormalRate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([CanvasRenderer, LineChart, PieChart, GridComponent])

const totalDevices = '9999999'

interface DeviceDef {
  key: string
  label: string
  value: string
  iconSrc: string
  normalRate: number
  abnormalRate: number
  normalColor: string
  abnormalColor: string
}

const devices: DeviceDef[] = [
  {
    key: 'smoke',
    label: '感烟探测器',
    value: '1256',
    iconSrc: '/campus-monitor/icons/smoke-detector.png',
    normalRate: 72.5,
    abnormalRate: 27.5,
    normalColor: '#3678e3',
    abnormalColor: '#00d7ef',
  },
  {
    key: 'electric',
    label: '电气火灾探测器',
    value: '1256',
    iconSrc: '/campus-monitor/icons/gas-detector.png',
    normalRate: 72.5,
    abnormalRate: 27.5,
    normalColor: '#3678e3',
    abnormalColor: '#00d7ef',
  },
]

/* ===== line chart option ===== */
const lineOption = {
  grid: { top: 4, right: 0, bottom: 0, left: 0, containLabel: false },
  xAxis: {
    type: 'category' as const,
    show: false,
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月'],
  },
  yAxis: { type: 'value' as const, show: false, scale: true },
  series: [{
    type: 'line' as const,
    smooth: true,
    symbol: 'none',
    lineStyle: { color: '#00d7ef', width: 1.5 },
    areaStyle: {
      color: {
        type: 'linear' as const,
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 215, 239, 0.45)' },
          { offset: 1, color: 'rgba(0, 215, 239, 0)' },
        ],
      },
    },
    data: [12, 28, 45, 38, 62, 55, 78, 92, 85],
  }],
}

/* ===== ring chart option factory（南丁格尔玫瑰图） ===== */
function buildRingOption(normal: number, abnormal: number, normalColor: string, abnormalColor: string) {
  return {
    series: [{
      type: 'pie' as const,
      radius: ['45%', '65%'],   // 半径差 20%，玫瑰花瓣更细
      center: ['50%', '50%'],
      startAngle: 0,
      silent: true,
      animation: false,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderRadius: 0 },
      data: [
        { value: normal,   name: 'normal',   itemStyle: { color: normalColor } },
        { value: abnormal, name: 'abnormal', itemStyle: { color: abnormalColor } },
      ],
    }],
  }
}

/* ===== ECharts 命令式初始化 ===== */
const lineChartRef = ref<HTMLDivElement | null>(null)
const ringChartRefs = ref<Record<string, HTMLDivElement | null>>({})
let lineChart: echarts.ECharts | null = null
const ringCharts: Record<string, echarts.ECharts | null> = {}

onMounted(async () => {
  await nextTick()
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption(lineOption)
  }
  devices.forEach(d => {
    const el = ringChartRefs.value[d.key]
    if (el) {
      const inst = echarts.init(el)
      inst.setOption(buildRingOption(d.normalRate, d.abnormalRate, d.normalColor, d.abnormalColor))
      ringCharts[d.key] = inst
    }
  })
})

// 视口 resize 时同步调整
window.addEventListener('resize', () => {
  lineChart?.resize()
  Object.values(ringCharts).forEach(c => c?.resize())
})

onBeforeUnmount(() => {
  lineChart?.dispose()
  Object.values(ringCharts).forEach(c => c?.dispose())
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../campus-monitor-common.scss" as *;

.dm-panel {
  // 边框/背景由 parent CampusMonitorSection 提供，自身不重复绘制
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* ===== 模块内容（设计稿 666:3676，对齐 SafetyPerceptionPanel padding 模式） ===== */
.dm-body {
  flex: 1;
  display: flex; flex-direction: column;
  gap: vh(8);
  padding: 0 vw(2);          // 对齐 sp-grid：仅左右 2vw
  min-height: 0;
}

/* ===== 累计接入设备 + 折线图（设计稿 670:1645） ===== */
.dm-summary-row {
  flex: 0 0 auto;
  display: flex; align-items: flex-end; gap: vw(36);
  min-height: 0;
}

.dm-summary {
  display: flex; flex-direction: column;
  gap: vh(4);

  &__head {
    display: flex; align-items: center; justify-content: center;
    gap: vw(6);
  }

  &__icon-frame {
    flex: 0 0 auto;
    width: vh(18); height: vh(18);
    border-radius: 4px;
    background: $cm-bg-icon-frame;
    display: flex; align-items: center; justify-content: center;
  }

  &__icon {
    width: vh(12); height: vh(12);
  }

  &__label {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 14px;
    color: $cm-text-secondary;
    line-height: normal;
    white-space: nowrap;
  }

  &__value-row {
    display: flex; align-items: flex-end; gap: vw(8);
  }

  &__value {
    @include cm-num;
    font-size: 22px;
    color: $cm-text-primary;
    line-height: vh(29);
    white-space: nowrap;
  }

  &__unit {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    color: $cm-text-tertiary;
    line-height: vh(29);
    width: vw(20);
    text-align: left;
    flex-shrink: 0;
  }
}

.dm-line-chart {
  flex: 1; min-width: 0;
  height: vh(56);

  &__ec {
    width: 100% !important; height: 100% !important;
  }
}

/* ===== 2 个设备指标块（设计稿 670:1711，对齐 SafetyPerceptionPanel sp-metric 模式） ===== */
.dm-metrics {
  flex: 1;
  display: flex; flex-direction: column;
  gap: vh(8);
  padding: 0;                 // tile 容器无内 padding，由子元素 dm-metric 自己提供
  background: $cm-bg-tile;
  border-radius: 10px;
  min-height: 0;
}

.dm-metric {
  flex: 1;
  display: flex; flex-direction: column;
  border-bottom: 1px dashed rgba(64, 158, 255, 0.12);
  padding: vh(8) vw(12);      // 对齐 sp-metric：8px 上下 + 12px 左右
  min-height: 0;
  gap: vh(4);

  &:last-child { border-bottom: none; }

  &__main {
    flex: 1;
    display: flex; align-items: center; justify-content: space-between;
    gap: vw(8);
    min-height: 0;
  }

  &__info {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: vw(8);
    min-width: 0;
  }

  &__icon-frame {
    flex: 0 0 auto;
    width: vh(48); height: vh(48);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }

  &__icon {
    width: 100%; height: 100%;
    object-fit: contain;
  }

  &__text {
    flex: 0 0 auto;
    display: flex; flex-direction: column;
    gap: vh(4);
  }

  &__label-row {
    display: flex; align-items: center; gap: vw(4);
  }

  &__label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 14px;
    color: $cm-text-secondary;
    line-height: normal;
    white-space: nowrap;
  }

  &__attention {
    width: vh(12); height: vh(12);
    flex-shrink: 0;
  }

  &__value-row {
    display: flex; align-items: flex-end; gap: vw(8);
  }

  &__value {
    @include cm-num;
    font-size: 20px;
    color: $cm-text-primary;
    line-height: vh(29);
    white-space: nowrap;
  }

  &__unit {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    color: $cm-text-tertiary;
    line-height: vh(29);
    width: vw(20);
    text-align: left;
    flex-shrink: 0;
  }

  &__chart {
    flex: 0 0 auto;
    position: relative;
    width: vh(66); height: vh(66);

    &-ec {
      position: absolute; inset: 0;
      width: 100% !important; height: 100% !important;
    }
  }

  &__legend {
    flex: 0 0 auto;
    display: flex; gap: vw(16);
    padding-top: vh(4);
    width: 100%;
  }

  &__legend-item {
    flex: 1; min-width: 0;
    display: flex; align-items: center; gap: vw(6);
  }

  &__legend-dot {
    flex: 0 0 auto;
    width: vh(8); height: vh(8); border-radius: 2px;
  }

  &__legend-label {
    flex: 0 0 auto;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 12px;
    color: $cm-text-tertiary;
    line-height: normal;
    width: vw(72);
    white-space: nowrap;
  }

  &__legend-value {
    flex: 1; min-width: 0;
    @include cm-num;
    font-size: 12px;
    color: $cm-text-primary;
    line-height: normal;
    text-align: right;
    white-space: nowrap;
  }
}
</style>
