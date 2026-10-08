// RankingWidget Mock 数据
// 5 行 TOP 完成率（设计稿 1-5 名）

import type { RankingConfig } from '../types'

export const rankingMock: RankingConfig = {
  metric: '完成率',
  items: [
    { id: 'r1', name: '沙县小吃',     value: 96, percent: 96, rank: 1 },
    { id: 'r2', name: '爱玛电动车',   value: 89, percent: 89, rank: 2 },
    { id: 'r3', name: 'Tony 美发店',  value: 80, percent: 80, rank: 3 },
    { id: 'r4', name: '东北饭庄',     value: 74, percent: 74, rank: 4 },
    { id: 'r5', name: '柳州螺蛳粉',   value: 50, percent: 50, rank: 5 },
  ],
}