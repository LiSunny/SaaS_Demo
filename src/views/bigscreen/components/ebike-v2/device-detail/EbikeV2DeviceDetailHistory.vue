<template>
  <div class="hist">
    <!-- ===== 标题行（设计稿 #165:26227） ===== -->
    <header class="dd-head">
      <span class="dd-head__bar" />
      <h3 class="dd-head__title">历史数据</h3>
    </header>

    <!-- ===== 页签行（设计稿 #165:26233） ===== -->
    <div class="hist__tabs" role="tablist" aria-label="历史数据类型">
      <button
        v-for="t in HISTORY_TABS"
        :key="t.key"
        type="button"
        role="tab"
        class="hist__tab"
        :class="{ 'is-active': tab === t.key }"
        :aria-selected="tab === t.key"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- ===== 工具条（设计稿 #165:26256：日期区间 + 查询） ===== -->
    <div class="hist__toolbar">
      <!-- 日期区间：样式与消防档案页同一套（见 device-detail-common.scss） -->
      <div class="dd-date">
        <el-date-picker
          v-model="draftRange"
          type="daterange"
          unlink-panels
          editable
          clearable
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :popper-class="`bigscreen-el-date-panel ${DD_POPPER_CLASS}`"
        />
      </div>

      <button type="button" class="hist__query" @click="applyRange">查询</button>
    </div>

    <!-- ===== 折线图（设计稿 #200:2239） ===== -->
    <div class="hist__chart">
      <!-- y 轴单位：设计稿 #200:2243（内容随当前指标变：% / dBm / dB / 级） -->
      <span v-if="history.unit" class="hist__unit">{{ history.unit }}</span>

      <VChart class="hist__echarts" :option="option" autoresize />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备详情 · 历史数据分区
 *
 * 版式按 Figma「设备详情」节点 165:26126 的历史数据卡：
 *
 *   页签行  #165:26233：联网状态 / 运行状态 / 剩余电量 / 信号功率 / RSRQ /
 *           信噪比 / 烟雾灵敏度，选中底 #013E79 圆角 5，未选中 #8FB0D8
 *   工具条  #165:26256：日期区间（380×36，描边 #1A4573 + 日历图标）+ 查询
 *   图区    #200:2239：内距 12、高 262、圆角 10；y 轴刻度右对齐 #719ECD，
 *           网格线 1px #0C3464 虚线（2-2），x 轴标签同色
 *
 * 与设计稿的有意偏离：
 *   折线用 ECharts 实时绘制，不是贴设计稿那张静态 SVG ——
 *   页签要能切、日期区间要能选，贴图做不到。
 *
 * 日期区间是「选完点查询才生效」：工具条上摆着查询按钮，
 * 就是让值守员先框范围再确认，避免拖一下就跳。
 */
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { HISTORY_TABS, buildHistory } from './device-detail-data'
import { DD_POPPER_CLASS } from './device-detail-popper'
import type { DutyEvent, SceneDevice } from '../duty/duty-data'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const props = defineProps<{
  device?: SceneDevice | null
  event?: DutyEvent | null
}>()

/* ============================================================
 * 状态
 * ============================================================ */

/** 当前页签 */
const tab = ref(HISTORY_TABS[0].key)

/** 默认区间：最近三天（设计稿的日期框默认也是一段短区间） */
function defaultRange(): [string, string] {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = p(now.getMonth() + 1)
  const d = p(now.getDate())
  return [`${y}-${m}-${p(now.getDate() - 2)}`, `${y}-${m}-${d}`]
}

/** 'YYYY-MM-DD' → 当天 00:00:00 的时间戳 */
function startOfDay(s: string): number {
  return new Date(s.replace(/-/g, '/')).getTime()
}

/** 'YYYY-MM-DD' → 当天 23:59:59 的时间戳 */
function endOfDay(s: string): number {
  return startOfDay(s) + 86_399_999
}

/** 选中的区间（未生效） */
const draftRange = ref<[string, string]>(defaultRange())

/** 已生效的区间 */
const appliedRange = ref<[string, string]>([...draftRange.value])

/** 查询：把选中的区间生效 */
function applyRange() {
  if (!draftRange.value?.[0] || !draftRange.value?.[1]) return
  appliedRange.value = [...draftRange.value]
}

/* ============================================================
 * 曲线
 * ============================================================ */

const history = computed(() => {
  const device = props.device
  const [from, to] = appliedRange.value
  if (!device || !from || !to) {
    return { xLabels: [], unit: '', min: 0, max: 100, series: [] }
  }
  // 区间按天选：起点当天 00:00:00，终点当天 23:59:59
  return buildHistory(device, tab.value, startOfDay(from), endOfDay(to))
})

/** 图表配置 */
const option = computed<EChartsOption>(() => {
  const h = history.value
  return {
    grid: { left: 46, right: 20, top: 34, bottom: 30 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#2e2e2e',
      borderWidth: 0,
      padding: [8, 10],
      textStyle: { color: '#ffffff', fontSize: 12, fontFamily: 'Alibaba PuHuiTi' },
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'rgba(120, 190, 255, 0.45)', width: 1 },
      },
      formatter: (params: unknown) => {
        const list = params as Array<{ axisValue: string; marker: string; seriesName: string; value: number }>
        if (!list?.length) return ''
        const unit = h.unit ? ` ${h.unit}` : ''
        const rows = list
          .map(
            (p) =>
              `<div style="display:flex;align-items:center;gap:8px;line-height:18px">
                 <span style="width:10px;height:6px;border-radius:2px;background:${p.marker?.includes('rgb') ? p.marker : '#4f9df0'}"></span>
                 <span>${p.seriesName}：${p.value}${unit}</span>
               </div>`,
          )
          .join('')
        return `<div style="font-weight:500;margin-bottom:4px">${list[0].axisValue}</div>${rows}`
      },
    },
    xAxis: {
      type: 'category',
      data: h.xLabels,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#719ecd', fontSize: 12, fontFamily: 'Alibaba PuHuiTi' },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: h.min,
      max: h.max,
      // 布尔量程（联网状态 / 运行状态 0~1）只切两格；
      // 否则 0~1 会被切成 0.2 一格，读出来是 0.8 / 0.6 这种没意义的数
      splitNumber: h.max - h.min <= 1 ? 1 : 5,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#719ecd', fontSize: 12, fontFamily: 'Alibaba PuHuiTi' },
      splitLine: { lineStyle: { color: '#0c3464', type: [2, 2], width: 1 } },
    },
    series: h.series.map((s) => ({
      name: s.name,
      type: 'line' as const,
      // 布尔量程（联网状态 / 运行状态）用阶梯线：0/1 是跳变的，
      // 平滑曲线会画出一段不存在的中间值
      smooth: h.max - h.min > 1,
      step: h.max - h.min > 1 ? undefined : ('middle' as const),
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 2, color: s.color },
      itemStyle: { color: '#ffffff', borderColor: '#417ab7', borderWidth: 2 },
      emphasis: { focus: 'series' as const },
      data: s.data,
    })),
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./device-detail-common.scss" as *;

.hist {
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

/* ===== 页签行 ===== */
.hist__tabs {
  display: flex;
  align-items: center;
  gap: vw(10);
  flex-wrap: wrap;
}

.hist__tab {
  padding: 0 vw(12);
  height: vh(35);
  border: none;
  border-radius: vw(5);
  background: transparent;
  color: #8fb0d8;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: vh(35);
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.hist__tab:hover {
  color: #d4e3ff;
}

.hist__tab.is-active {
  background: #013e79;
  color: #d4e3ff;
  font-weight: 500;
}

/* ===== 工具条 ===== */
.hist__toolbar {
  display: flex;
  align-items: center;
  gap: vw(12);
  height: vh(36);
}

/* 查询按钮：设计稿 #200:2054 */
.hist__query {
  height: vh(36);
  padding: 0 vw(18);
  border: none;
  border-radius: vw(8);
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}

.hist__query:hover {
  background: rgba(0, 134, 228, 1);
}

/* ===== 图区 ===== */
/* 卡内不再加 padding：vue-echarts 的根元素自带 width/height:100%，
   再叠 absolute + inset 会被 over-constrained 规则吃掉 right/bottom，
   图表会撑出卡片。内边距交给 ECharts 的 grid 去做。 */
.hist__chart {
  position: relative;
  height: vh(262);
  border-radius: vw(10);
  overflow: hidden;
}

/* y 轴单位：设计稿 #200:2243 */
.hist__unit {
  position: absolute;
  left: vw(12);
  top: vw(6);
  white-space: nowrap;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  color: #719ecd;
  pointer-events: none;
}

.hist__echarts {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
