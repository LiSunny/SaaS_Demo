// BarChartWidget Mock 数据
// 工单完成率柱状图（7 区域 × 完成率 %）
// 数值范围 65-95，模拟真实业务表现

import type { BarChartConfig } from '../types'

export const barChartMock: BarChartConfig = {
  title: '工单完成率',
  unit: '%',
  series: [
    { name: '餐饮街区', value: 78 },
    { name: '学校片区', value: 92 },
    { name: '医院片区', value: 88 },
    { name: '商超街区', value: 71 },
    { name: '工业园区', value: 84 },
    { name: '住宅片区', value: 95 },
    { name: '办公园区', value: 65 },
  ],
  max: 100,
}