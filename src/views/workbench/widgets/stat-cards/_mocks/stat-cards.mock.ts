// StatCardsWidget Mock 数据
//
// 4 张并排卡：工单总数 / 今日待处理 / 在线设备 / SLA 达标率
// 数据为占位演示值，对接 API 时由调用方传入 config.cards
//
// 图标：本次按"100%按设计稿"指令，从 Figma Frame 667 下载 Bookmark SVG（21x26，
//      fill=#3678E3）。设计稿 4 张卡共用同一图标，故引用同一文件。
//      业务接入时可替换为各卡专属 SVG（如 widget-stat-bookmark-total / -pending 等）。

import type { StatCardsConfig } from '../types'

export const statCardsMock: StatCardsConfig = {
  cards: [
    {
      id: 'stat-total',
      icon: 'widget-stat-bookmark',
      title: '工单总数',
      value: 1286,
      unit: '单',
      primary: { label: '较昨日', delta: 12.5, trend: 'up' },
      secondary: { label: '占比', delta: 12.5, trend: 'down' },
      accent: 'primary',
    },
    {
      id: 'stat-pending',
      icon: 'widget-stat-bookmark',
      title: '今日待处理',
      value: 47,
      unit: '单',
      primary: { label: '较昨日', delta: 8.3, trend: 'up' },
      secondary: { label: '占比', delta: 3.6, trend: 'down' },
      accent: 'warning',
    },
    {
      id: 'stat-online',
      icon: 'widget-stat-bookmark',
      title: '在线设备',
      value: 932,
      unit: '台',
      primary: { label: '较昨日', delta: 1.2, trend: 'up' },
      secondary: { label: '占比', delta: 0.8, trend: 'up' },
      accent: 'success',
    },
    {
      id: 'stat-sla',
      icon: 'widget-stat-bookmark',
      title: 'SLA 达标率',
      value: 96.4,
      unit: '%',
      primary: { label: '较昨日', delta: 2.1, trend: 'up' },
      secondary: { label: '占比', delta: 1.4, trend: 'down' },
      accent: 'danger',
    },
  ],
}