// PieChartWidget Mock 数据
// 6 行业接入占比（设计稿 1:1 复刻，6 阶蓝渐变）
// 6 项合计 234 = 中心数字（避免设计稿 216 vs 234 不一致问题）

import type { PieChartConfig } from '../types'

export const pieChartMock: PieChartConfig = {
  centerValue: 234,
  centerLabel: '接入企业',
  series: [
    { name: '餐饮企业', value: 42, color: '#cde4ff' },  // 最浅
    { name: '零售门店', value: 38, color: '#aecdef' },
    { name: '企业办公', value: 36, color: '#88b0dc' },
    { name: '学校院校', value: 40, color: '#6293c8' },
    { name: '医院医疗', value: 34, color: '#417ab7' },
    { name: '其他',     value: 44, color: '#1b5ea4' },  // 最深
  ],
}