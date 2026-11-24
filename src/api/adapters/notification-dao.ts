/**
 * notification-dao.ts — 消息通知数据层（DAO / PoC 模式）
 *
 * 与项目其他 mock 数据层一致：走 `createPersistentStore`，数据落在 localStorage
 * （key `db:notifications`），刷新不丢；后端就绪后可另建 notification-http.ts
 * 并在此处切换实现，调用方（src/api/notification.ts）签名不变。
 *
 * 未读状态的唯一事实源是 `NotificationItem.read` 字段，任何地方都不额外缓存
 * 未读数字，避免角标与列表状态不一致。
 */

import { createPersistentStore } from '@/utils/db-adapter'
import type {
  NotificationItem,
  NotificationQuery,
  NotificationTableData,
} from '@/types/notification'

// ===== 种子数据 =====

/** 设计稿正文原文：设备告警日志分析报告（Markdown） */
const REPORT_MARKDOWN = `# 设备告警日志分析报告
## 总体概况
- **时间范围**：2025 年 12 月 17 日 02:00:55 至 2025 年 12 月 18 日 18:35:04。
- **总条数**：49 条。
- **主要设备类型**：AI 校园紧急呼叫报警器、独立式光电感烟火灾探测报警器、联网型独立式组合式电气火灾探测器、联网型独立式手动火灾报警按钮。
- **告警类别**：预警、联网。
- **安全态势总结**：当天校园安全态势较为严峻，高危事件频发，同时存在电气安全隐患。
## 重大安全风险识别
- **事件簇**：
    - 2025 年 12 月 18 日 15:00:26 - 15:08:24，女宿舍西北楼梯 219 室门口和 419 室门口多次触发"打人/打人啦"语音识别告警。
- **语义关联分析**："救命""打人""打架"等关键词频繁出现，且在同一地点短时间内多次触发，判断为真实求救可能性较大，非误报或恶作剧。
- **高危时间点和地点**：
    - 时间点：2025 年 12 月 18 日 15:00:26 - 15:08:24。
    - 地点：女宿舍西北楼梯 219 室门口和 419 室门口。
## 设施与硬件运维诊断
- **电气安全**：联网型独立式组合式电气火灾探测器在女生宿舍一层配电箱内多次发出 A 相、B 相、C 相过压报警，存在线路隐患，可能会引发电气火灾。
- **设备稳定性**：日志中未发现设备频繁报"故障"或"掉线"情况，目前设备稳定性良好，暂未发现供电不稳或人为破坏迹象。
## 时间分布规律
- **告警分布**：
    - 深夜（00:00 - 06:00）：主要是独立式光电感烟火灾探测报警器和联网型独立式手动火灾报警按钮的联网信息。
    - 午休（12:00 - 14:00）：有 AI 校园紧急呼叫报警器发出"救命"语音识别告警。
    - 上课时间（推测 08:00 - 12:00，14:00 - 18:00）：AI 校园紧急呼叫报警器多次发出"打人""打架""救命"等语音识别告警。
- **异常活跃时间段**：2025 年 12 月 18 日 15:00 - 15:08，女宿舍西北楼梯 219 室门口和 419 室门口告警密集。
## 行动建议
### 安保部门
- 立即核查 2025 年 12 月 18 日 15:00 - 15:08 女宿舍西北楼梯 219 室门口和 419 室门口的情况，排查是否发生打架、冲突等事件。
- 对当天出现"救命""打人""打架"等语音识别告警的其他地点进行巡逻检查，确保校园安全。
### 工程维修部门
- 对女生宿舍一层配电箱内的联网型独立式组合式电气火灾探测器进行全面检查，排查线路过压原因，及时修复线路隐患，避免发生电气火灾。`

/** 表格形态正文（第47周值守报告） */
const DUTY_TABLE: NotificationTableData = {
  columns: ['日期', '班次', '值班人', '在岗时长(h)', '巡查次数', '异常处置'],
  rows: [
    ['2025-10-06', '白班', '李阳', 8, 12, 0],
    ['2025-10-07', '夜班', '王二麻', 7.5, 9, 1],
    ['2025-10-08', '白班', '李阳', 8, 15, 0],
    ['2025-10-09', '夜班', '张伟', 8, 11, 2],
  ],
}

/** HTML 网页形态正文（安全态势周报） */
const WEEKLY_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; padding: 4px 8px; font-family: 'Alibaba PuHuiTi', -apple-system, sans-serif; color: #141414; }
  h3 { margin: 0 0 8px; font-size: 16px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
  .card { border: 1px solid #E9E9E9; border-radius: 8px; padding: 10px 12px; background: #FFFFFF; }
  .card .label { font-size: 12px; color: #5E5E5E; }
  .card .value { font-size: 22px; font-weight: 500; color: #3678E3; margin-top: 4px; }
  .card .value.warn { color: #DC2626; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #EBF4FF; color: #303133; font-weight: 500; padding: 6px 8px; text-align: left; }
  td { padding: 6px 8px; border-bottom: 1px solid #F3F3F3; }
</style>
</head>
<body>
  <h3>安全态势周报（第47周）</h3>
  <div class="grid">
    <div class="card"><div class="label">告警总数</div><div class="value">49</div></div>
    <div class="card"><div class="label">高危事件</div><div class="value warn">7</div></div>
    <div class="card"><div class="label">闭环率</div><div class="value">93.8%</div></div>
  </div>
  <table>
    <thead><tr><th>园区</th><th>告警数</th><th>已处置</th><th>处置率</th></tr></thead>
    <tbody>
      <tr><td>主校区</td><td>26</td><td>25</td><td>96.2%</td></tr>
      <tr><td>东校区</td><td>15</td><td>14</td><td>93.3%</td></tr>
      <tr><td>西校区</td><td>8</td><td>7</td><td>87.5%</td></tr>
    </tbody>
  </table>
</body>
</html>`

const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    title: '第47周值守报告',
    category: 'system',
    contentType: 'table',
    content: '',
    tableData: DUTY_TABLE,
    receivedAt: '2025-10-09 13:26:00',
    read: true,
  },
  {
    id: 2,
    title: '第47周巡检报表',
    category: 'system',
    contentType: 'markdown',
    content: `# 第47周巡检报表
- **统计周期**：2025-10-06 至 2025-10-12
- **巡检任务**：共 42 项，已完成 39 项
- **发现问题**：6 项，均已闭环
- **未完成原因**：3 项因设备离线顺延，1 项因现场施工暂停
## 待跟进
- 女生宿舍一层配电箱过压报警复核
- 第八教学楼 3 层烟感联动测试`,
    receivedAt: '2025-10-10 09:15:00',
    read: false,
  },
  {
    id: 3,
    title: '您位于 A 区地下车库的消防栓压力表，在 2025-10-11 15:32 发生压力异常告警，已超时 2 小时无人处置。',
    category: 'communication',
    contentType: 'markdown',
    content: `> **告警超时提醒**
> 您位于 A 区地下车库 的 消防栓压力表，在 2025-10-11 15:32 发生 压力异常告警，已超时 2 小时 无人处置。

请及时到现场核实处置，处置后可在告警记录中补充处理说明。`,
    receivedAt: '2025-10-11 16:42:00',
    read: false,
  },
  {
    id: 4,
    title: '重要提醒：分配给您的巡检任务 第47周宿舍楼消防巡检 已逾期，原定完成时间：2025-12-16 18:00，当前状态：未完成。请尽快完成巡检任务。',
    category: 'communication',
    contentType: 'markdown',
    content: `## 巡检任务逾期提醒

- **任务名称**：第47周宿舍楼消防巡检
- **原定完成时间**：2025-12-16 18:00
- **当前状态**：未完成

请尽快完成巡检任务，并在系统中补充巡检记录与现场照片。`,
    receivedAt: '2025-12-18 09:45:00',
    read: false,
  },
  {
    id: 5,
    title: '关于系统升级的通知',
    category: 'system',
    contentType: 'markdown',
    content: `为了让您更好的使用本平台，我们正在对平台进行升级。升级期间暂时无法访问，给您带来的不便，敬请谅解。

- **升级范围**：告警推送链路、设备台账导入
- **预计时长**：2 小时
- **影响范围**：后台消息通知与大屏告警实时刷新`,
    receivedAt: '2025-12-18 10:05:00',
    read: false,
  },
  {
    id: 6,
    title: '安全态势周报（第47周）',
    category: 'system',
    contentType: 'html',
    content: WEEKLY_HTML,
    receivedAt: '2025-12-19 08:20:00',
    read: true,
  },
  {
    id: 7,
    title: '设备告警日志分析报告',
    category: 'system',
    contentType: 'markdown',
    content: REPORT_MARKDOWN,
    receivedAt: '2025-12-19 09:12:00',
    read: false,
  },
]

// ===== 持久化存储 =====

/**
 * 种子数据版本
 *
 * `createPersistentStore` 优先读 localStorage 里已有数据，所以改了种子文案后
 * 老浏览器仍会显示旧内容。递增此版本号后，启动时检测到不一致就清掉旧数据
 * 重新灌入新种子。
 */
const SEED_VERSION = 2
const SEED_VERSION_KEY = 'db:notifications:seedVersion'
const SEED_DATA_KEY = 'db:notifications'
const SEED_ID_KEY = 'db:notifications:nextId'

function ensureSeedVersion() {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === String(SEED_VERSION)) return
    localStorage.removeItem(SEED_DATA_KEY)
    localStorage.removeItem(SEED_ID_KEY)
    localStorage.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
  } catch {
    // localStorage 不可用（隐私模式等）时忽略，走内存数据
  }
}
ensureSeedVersion()

const store = createPersistentStore<NotificationItem>('notifications', SEED_NOTIFICATIONS)

// ===== 查询实现 =====

/** 按接收时间倒序（最新在前）—— 列表页与弹窗的统一默认序 */
function sortByReceivedAt(list: NotificationItem[], order: 'asc' | 'desc' = 'desc'): NotificationItem[] {
  const sorted = [...list].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
  return order === 'asc' ? sorted : sorted.reverse()
}

/** 全量消息（按接收时间倒序） */
export function getAllNotifications(): NotificationItem[] {
  return sortByReceivedAt(store.getAll())
}

/** 分页查询 */
export function getNotificationList(query: NotificationQuery): { data: NotificationItem[]; total: number } {
  let data = store.getAll()

  if (query.keyword) {
    const kw = query.keyword.trim()
    if (kw) {
      data = data.filter(
        (n) => n.title.includes(kw) || (n.content || '').includes(kw),
      )
    }
  }

  if (query.readStatus && query.readStatus !== 'all') {
    const wantRead = query.readStatus === 'read'
    data = data.filter((n) => n.read === wantRead)
  }

  const sorted = sortByReceivedAt(data, query.sortOrder ?? 'desc')
  const page = Math.max(1, query.page || 1)
  const size = Math.max(1, query.size || 10)

  return {
    data: sorted.slice((page - 1) * size, page * size),
    total: sorted.length,
  }
}

/** 按 id 取详情 */
export function getNotificationDetail(id: number): NotificationItem | undefined {
  return store.getById(id)
}

/** 最近 N 条（弹窗用），按接收时间倒序 */
export function getRecentNotifications(limit = 3): NotificationItem[] {
  return sortByReceivedAt(store.getAll()).slice(0, Math.max(0, limit))
}

/** 未读数量 —— 由 read 字段实时统计，不缓存 */
export function getUnreadCount(): number {
  return store.getAll().filter((n) => !n.read).length
}

/** 标记已读（幂等） */
export function markAsRead(id: number): void {
  const item = store.getById(id)
  if (!item || item.read) return
  store.update(id, { read: true })
}

/** 全部标记已读（幂等） */
export function markAllAsRead(): void {
  for (const item of store.getAll()) {
    if (!item.read) store.update(item.id, { read: true })
  }
}
