// HeatmapWidget Mock 数据
//
// 设计稿 1:1 复刻：7 行（周一到周日）× 8 列（1-8 月）= 56 格
// 模拟工作日多、周末少；6-8 月高峰（夏季空调/消防高发）
// 关闭率：mock 范围 35-85%

import type { HeatmapConfig, CloseRateResolver } from '../types'

const xAxis = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月']
const yAxis = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 确定性 mock：基于 (xIdx, yIdx) 计算工单数
 * - 月份权重：6-8 月 ×1.4，1-2 月 ×0.7
 * - 星期权重：周一三五 ×1.2，周六日 ×0.6
 * - 基础值 12-28 之间
 */
function generateData(): [number, number, number][] {
  const monthWeight = [0.7, 0.7, 0.9, 1.0, 1.1, 1.4, 1.4, 1.3]
  const dayWeight = [1.2, 1.1, 1.2, 1.1, 1.2, 0.6, 0.6]  // 周一到周日
  const result: [number, number, number][] = []
  for (let x = 0; x < xAxis.length; x++) {
    for (let y = 0; y < yAxis.length; y++) {
      const base = 14 + ((x * 7 + y * 3) % 14)  // 14-27
      const value = Math.round(base * monthWeight[x] * dayWeight[y])
      result.push([x, y, value])
    }
  }
  return result
}

/** 关闭率：mock 函数（确定性） */
const closeRate: CloseRateResolver = (x, y) => {
  const v = 50 + ((x * 11 + y * 7) % 36)  // 50-85
  return v
}

export const heatmapMock: HeatmapConfig = {
  xAxis,
  yAxis,
  data: generateData(),
  currentDateLabel: '5月23',
  closeRate,
}