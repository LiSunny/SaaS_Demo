/**
 * 点位状态词表 —— 全站唯一来源
 *
 * 同物必须同名：卡片标题行、瓦片、详情抽屉、汇总卡、导出 CSV 全部读这里，
 * 避免出现"报警 / 告警 / 火警"混用导致值班员误判。
 */
import type { PointStatus } from '@/types/subsystem'

export const STATUS_LABELS: Record<PointStatus, string> = {
  normal: '正常',
  alarm: '报警',
  fault: '故障',
  offline: '离线',
  shielded: '已屏蔽',
  unknown: '未知',
}

/**
 * 展示顺序权重：数字越小越靠前。
 * 值班员的扫视顺序是"先找异常"，所以报警 > 故障 > 离线 > 未知 > 屏蔽 > 正常。
 */
export const STATUS_ORDER: Record<PointStatus, number> = {
  alarm: 0,
  fault: 1,
  offline: 2,
  unknown: 3,
  shielded: 4,
  normal: 5,
}

/** 除"正常"外都算异常 —— 异常态必须出文字，不能只靠颜色 */
export function isAbnormalStatus(s: PointStatus): boolean {
  return s !== 'normal'
}
