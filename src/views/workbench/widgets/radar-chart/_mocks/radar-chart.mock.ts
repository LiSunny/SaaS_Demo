// RadarChartWidget Mock 数据
// 5 维消防安全评估（设计稿 1:1 复刻，浅蓝双系列）

import type { RadarChartConfig } from '../types'

export const radarChartMock: RadarChartConfig = {
  title: '消防安全评估',
  indicators: [
    { name: '消防安全', max: 100 },
    { name: '应急能力', max: 100 },
    { name: '设备完好', max: 100 },
    { name: '培训到位', max: 100 },
    { name: '巡查覆盖', max: 100 },
  ],
  series: [
    { name: '当前', value: [92, 85, 78, 88, 95], color: '#3678E3' },
    { name: '上月', value: [88, 82, 75, 80, 90], color: '#cde4ff' },
  ],
}