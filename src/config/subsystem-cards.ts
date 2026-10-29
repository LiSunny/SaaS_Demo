/**
 * 子系统监测页 · 顶部统计卡公共口径
 *
 * 四个系统页的统计卡口径完全一致（按设备计数，不按测点）：
 *   设备总数   = 主机 + 分机 + 采集器件
 *   设备在线率 = 非离线设备 / 设备总数
 *   设备故障率 = 故障设备 / 设备总数
 *   预警设备   = 报警 + 故障设备（台数）
 *
 * 差异只在图标地址与分项配色，由各系统传入 theme。
 */
import type { PointDef, PointRuntime, PointStatus } from '@/types/subsystem'
import type { SubsystemCardValue } from '@/types/subsystem-scene'

/** 统计卡主题：图标地址 + 分项配色 */
export interface SubsystemCardTheme {
  icons: {
    deviceTotal: string
    deviceOnline: string
    deviceFault: string
    deviceWarning: string
  }
  colors: {
    /** 主机 / 分机 */
    host: string
    /** 采集器件 */
    device: string
    /** 离线 */
    offline: string
    /** 在线 / 正常 */
    online: string
    /** 故障 */
    fault: string
    /** 预警 */
    warning: string
  }
}

/**
 * 计算顶部 4 张统计卡
 *
 * 主机/分机的判定：采集器件带 hostId（挂在某台分机下），
 * 主机与分机自身不带 hostId。
 */
export function computeSubsystemCards(
  points: PointDef[],
  getRuntime: (id: string) => PointRuntime | undefined,
  theme: SubsystemCardTheme,
): SubsystemCardValue[] {
  const total = points.length
  const hosts = points.filter(p => !p.hostId)
  const devices = points.filter(p => !!p.hostId)

  const statusOfPoint = (p: PointDef): PointStatus => getRuntime(p.id)?.status ?? 'unknown'
  const offline = points.filter(p => statusOfPoint(p) === 'offline')
  const fault = points.filter(p => statusOfPoint(p) === 'fault')
  const warning = points.filter(p => {
    const s = statusOfPoint(p)
    return s === 'alarm' || s === 'fault'
  })

  const online = total - offline.length
  const healthy = total - fault.length
  const pct = (n: number): string => (total > 0 ? ((n / total) * 100).toFixed(2) : '0.00')

  return [
    {
      key: 'deviceTotal',
      label: '设备总数',
      icon: theme.icons.deviceTotal,
      value: String(total),
      unit: '台',
      hint: `主机 ${hosts.length} 台（监控主机 + 分机）+ 采集器件 ${devices.length} 台 = ${total} 台`,
      legend: [
        { label: '主机', value: hosts.length, color: theme.colors.host },
        { label: '器件', value: devices.length, color: theme.colors.device },
      ],
      total,
      points,
    },
    {
      key: 'deviceOnline',
      label: '设备在线率',
      icon: theme.icons.deviceOnline,
      value: pct(online),
      unit: '%',
      hint: `在线 ${online} 台 ÷ 设备总数 ${total} 台 = ${pct(online)}%`,
      legend: [
        { label: '离线', value: offline.length, color: theme.colors.offline },
        { label: '在线', value: online, color: theme.colors.online },
      ],
      total,
      points: offline,
    },
    {
      key: 'deviceFault',
      label: '设备故障率',
      icon: theme.icons.deviceFault,
      value: pct(fault.length),
      unit: '%',
      hint: `故障 ${fault.length} 台 ÷ 设备总数 ${total} 台 = ${pct(fault.length)}%`,
      legend: [
        { label: '故障', value: fault.length, color: theme.colors.fault },
        { label: '正常', value: healthy, color: theme.colors.online },
      ],
      total,
      points: fault,
    },
    {
      key: 'deviceWarning',
      label: '预警设备',
      icon: theme.icons.deviceWarning,
      value: String(warning.length),
      unit: '台',
      hint: `报警 + 故障共 ${warning.length} 台（正常 ${total - warning.length} 台）`,
      legend: [
        { label: '预警', value: warning.length, color: theme.colors.warning },
        { label: '正常', value: total - warning.length, color: theme.colors.online },
      ],
      total,
      points: warning,
    },
  ]
}
