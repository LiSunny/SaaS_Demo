// RealtimeAlertsWidget Mock 数据
// 设计稿 Frame 660 为 3 条告警；mock 池保留 5 条覆盖 critical/warning/info 全级别，
// 由 limit 字段控制实际显示条数。

import type { RealtimeAlertsConfig } from '../types'

export const realtimeAlertsMock: RealtimeAlertsConfig = {
  limit: 3,
  alerts: [
    {
      id: 'a1',
      level: 'critical',
      title: 'A 区地下车库消防栓压力异常',
      location: 'A 区·地下 1 层·3 号点位',
      timestamp: '12:39',
      link: '/risk/hazard',
    },
    {
      id: 'a2',
      level: 'warning',
      title: 'C 栋一层配电室电缆绝缘电阻 0.3MΩ',
      location: 'C 栋·1 层·配电室',
      timestamp: '12:38',
    },
    {
      id: 'a3',
      level: 'warning',
      title: 'B 栋东侧安全出口指示灯闪烁',
      location: 'B 栋·3 层·东侧',
      timestamp: '12:35',
    },
    {
      id: 'a4',
      level: 'critical',
      title: '维保工单 SLA 超时 6 小时',
      location: '服务方·华东大区',
      timestamp: '12:21',
      link: '/workflow/work-order',
    },
    {
      id: 'a5',
      level: 'info',
      title: '系统将于今晚 23:00 进行版本升级',
      location: '平台公告',
      timestamp: '11:00',
    },
  ],
}