<template>
  <!-- 模块5 · 业态风险分布：常规用法雷达 —— 6 个风险维度作轴，各业态一条系列线做横向对比。
       三条系列为同色系三阶蓝（亮→暗），低风险业态贴圆心属正常读数；
       DOM 图例 + 顶部说明文字降低理解成本。图表 flex:1 撑满面板剩余高度 -->
  <ModulePanel title="业态风险分布" class="bd-panel">
    <div class="bd-cap">六大风险维度 · 各业态横向对比 · 悬停查看数值</div>
    <div class="bd-legend">
      <span class="bd-leg" v-for="(r, i) in rows" :key="r.t">
        <i class="bd-dot" :style="{ background: SHADES[i % SHADES.length].color }"></i>{{ r.t }}·{{ r.n }}家
      </span>
    </div>
    <div ref="chartEl" class="bd-radar"></div>
  </ModulePanel>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import ModulePanel from '../ModulePanel.vue'
import { SHOPS } from '../../data/shops'

interface TypeRisk {
  t: string
  n: number
  hazards: number
  alarms: number
  notDuty: number
  lowRate: number
  gas: number
  smoke: number
}

const rows: TypeRisk[] = [...new Set(SHOPS.map(s => s.type))].map(t => {
  const shops = SHOPS.filter(s => s.type === t)
  return {
    t,
    n: shops.length,
    hazards: shops.reduce((a, s) => a + s.hazards, 0),
    alarms: shops.reduce((a, s) => a + s.alarms, 0),
    notDuty: shops.filter(s => !s.todayDuty).length,
    lowRate: shops.filter(s => s.dutyRate < 70).length,
    gas: shops.reduce((a, s) => a + (s.devices?.gas || 0), 0),
    smoke: shops.reduce((a, s) => a + s.deviceAlarms.filter(al => al.title.includes('烟感') || al.title.includes('离线')).length, 0),
  }
})

/* 6 个风险维度；各维度量纲不同，逐维独立取最大值作刻度上限 */
const INDICATORS: { key: keyof TypeRisk; name: string }[] = [
  { key: 'hazards', name: '未闭环隐患' },
  { key: 'alarms', name: '未处置告警' },
  { key: 'notDuty', name: '今日未履职' },
  { key: 'lowRate', name: '履责率<70%' },
  { key: 'gas', name: '燃气设备' },
  { key: 'smoke', name: '烟感/离线' },
]

/* 同色系三阶蓝（亮→暗），三线在深底上均可辨识 */
const SHADES = [
  { color: '#6FE3ED', area: 'rgba(111,227,237,0.16)' },
  { color: '#4FB3E8', area: 'rgba(79,179,232,0.20)' },
  { color: '#A9C6E8', area: 'rgba(169,198,232,0.22)' },
]

const chartEl = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let ro: ResizeObserver | undefined

onMounted(() => {
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value)
  /* echarts 画布字号只接受 px，按视口宽度对 1920 基准做一次缩放 */
  const fs = Math.max(11, Math.round(13 * (window.innerWidth / 1920)))
  chart.setOption({
    tooltip: { trigger: 'item' },
    radar: {
      indicator: INDICATORS.map(ind => ({
        name: ind.name,
        max: Math.max(...rows.map(r => r[ind.key] as number), 1),
      })),
      radius: '60%',
      center: ['50%', '52%'],
      axisName: { color: '#C0D7E8', fontSize: fs },
      splitNumber: 4,
      splitArea: { areaStyle: { color: ['rgba(110,227,237,0.04)', 'rgba(110,227,237,0.08)'] } },
      splitLine: { lineStyle: { color: 'rgba(110,227,237,0.18)' } },
      axisLine: { lineStyle: { color: 'rgba(110,227,237,0.25)' } },
    },
    series: [{
      type: 'radar',
      symbolSize: 3,
      data: rows.map((r, i) => ({
        name: `${r.t}·${r.n}家`,
        value: INDICATORS.map(ind => r[ind.key]),
        itemStyle: { color: SHADES[i % SHADES.length].color },
        lineStyle: { color: SHADES[i % SHADES.length].color, width: 2 },
        areaStyle: { color: SHADES[i % SHADES.length].area },
      })),
    }],
  })
  ro = new ResizeObserver(() => chart?.resize())
  ro.observe(chartEl.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  chart?.dispose()
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.bd-panel { flex: auto; }

.bd-cap {
  font-size: vmin(12);
  color: rgba(192, 215, 232, 0.65);
  letter-spacing: 0.5px;
  padding-bottom: vh(6);
  border-bottom: 1px dashed rgba(110, 227, 237, 0.16);
}

/* DOM 图例（echarts 内置 legend 在窄容器下会叠字） */
.bd-legend {
  display: flex;
  align-items: center;
  gap: vw(14);
  padding: vh(6) vw(2) vh(2);
}
.bd-leg {
  display: flex;
  align-items: center;
  gap: vw(5);
  font-size: vmin(13);
  color: #C0D7E8;
  white-space: nowrap;
}
.bd-dot {
  width: vmin(9);
  height: vmin(9);
  border-radius: vmin(2);
  flex: none;
}

/* 撑满面板体剩余高度（面板由 flex:auto 拉伸，图表跟随填充不留空） */
.bd-radar {
  flex: 1;
  min-height: vh(160);
}
</style>
