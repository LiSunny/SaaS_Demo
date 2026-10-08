// TrendLineWidget Mock 数据
// 近 7 天，2 系列（设计稿 1:1 复刻）

import type { TrendLineConfig } from '../types'

export const trendLineMock: TrendLineConfig = {
  xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  series: [
    { name: '工单数', data: [23, 41, 35, 56, 78, 62, 49], area: true },
    { name: '关闭数', data: [18, 35, 30, 50, 72, 55, 42], area: true },
  ],
}