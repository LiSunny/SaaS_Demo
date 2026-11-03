/**
 * 值守工作台 · 数据层
 *
 * 数据来源三层（与本大屏既有口径一致）：
 *   设备 / 位置   = 组态画面节点（真值，来自平台组态配置 /api/scenes）
 *   点位 / 量程   = 图元库符号绑定（真值，symbolDef(...).bindings）
 *   次数 / 时间 / 数值 = 按「节点 + 点位」做确定性随机（后端暂无告警工单接口）
 *
 * 同一台设备 + 同一个点位 → 永远同一组时间与次数：刷新页面不会跳动。
 * 接真接口时只替换 buildDutyEvents 的取值来源，图形部分不动。
 *
 * 口径对应云端「值守监控 › 值守工作台」：
 *   一条待核实事件 = 一台设备上的一个持续告警（不是一次上报）
 *   上报次数 / 首次报警时间 / 最新报警时间都挂在这一条上
 *
 * 平面图描点用另一份清单：buildSceneDevices 给出画面里的**全部**设备
 * （含未报警的），报警状态由事件表叠加 —— 消防 CRT 的平面图就是
 * "所有点位都在，报警的点标红"，不是只画报警的那几台。
 */
import { symbolDef, SYMBOL_REGISTRY_VERSION } from '@/symbols'
import type { SceneConfig } from '@/types/scene-config'
import { deviceKeyOf, type CampusSpaces, type DeviceSpace } from '@/config/duty-locations'
import { isAbnormalPoint, pointSourcesOf } from '../scene-points'
import { rngOf, seedOf } from '../seeded-random'

/* ============================================================
 * 类型
 * ============================================================ */

/** 事件类别（云端为 火警 / 故障 / 预警 / 其他） */
export type DutyCategory = '火警' | '故障' | '预警' | '其他'

/** 一条待核实事件 */
export interface DutyEvent {
  id: string
  /** 事件源 = 设备名（画面图元标签） */
  source: string
  /**
   * 设备身份 key = 图元符号 + 设备名。
   * 同一台设备出现在多个画面时共用一个 key —— 空间树按设备聚合，不按画面重复挂。
   */
  deviceKey: string
  /** 图元符号 */
  symbol: string
  /** 事件源点位名 */
  point: string
  /** 事件类别 */
  category: DutyCategory
  /** 所属系统 key */
  systemKey: string
  /** 所属画面 id */
  sceneId: string
  /** 所属画面名 */
  sceneName: string
  /** 画面节点 id —— 报警位置图里高亮这一个图元 */
  nodeId: string
  /** 位置：园区里的「建筑 + 部位」，没有空间归属时退到系统名 */
  location: string
  /** 设备在园区空间里的归属（分区 / 建筑 / 部位） */
  space?: DeviceSpace
  /** 告警设备（产品类别） */
  deviceType: string
  /** 设备编码 */
  deviceCode: string
  /** 上报次数 */
  reportTimes: number
  /** 首次报警时间（epoch ms） */
  firstAt: number
  /** 最新报警时间（epoch ms） */
  latestAt: number
  /** 持续时长文案（如「5天3小时」） */
  duration: string
  /** 告警值 */
  alarmValue: string
  /** 联系人 */
  contact: string
}

/** 园区空间树节点：园区 › 分区 › 建筑 › 部位 › 设备 */
export interface DutySpaceNode {
  key: string
  label: string
  /** 层级 */
  level: 'zone' | 'building' | 'part' | 'device'
  /** 该节点下的待核实事件数 */
  count: number
  children: DutySpaceNode[]
}

/* ============================================================
 * 设备清单（平面图描点用）
 * ============================================================ */

/** 画面里的一台设备 */
export interface SceneDevice {
  /** 设备身份 key = 图元符号 + 设备名（同一台设备出现在多个画面时共用一个 key） */
  key: string
  /** 设备名（画面图元标签） */
  label: string
  /** 图元符号 */
  symbol: string
  /** 所属画面 id */
  sceneId: string
  /** 所属画面名 */
  sceneName: string
  /** 所属系统 key */
  systemKey: string
  /** 设备在园区空间里的归属 */
  space?: DeviceSpace
}

/**
 * 画面 → 设备清单（全量，含未报警的设备）
 *
 * 平面图要画的是「这个单元里有哪些设备点位」，不是「哪几台在报警」，
 * 所以这里取画面里的每一个图元节点；同一台设备出现在多张画面时只留一条
 * （按设备身份 key 去重，与事件表的口径一致）。
 */
export function buildSceneDevices(scenes: SceneConfig[]): SceneDevice[] {
  const out = new Map<string, SceneDevice>()
  for (const scene of scenes) {
    for (const n of scene.nodes ?? []) {
      const def = symbolDef(n.symbol)
      const label = n.label || def?.name || n.symbol
      const key = deviceKeyOf(n.symbol, label)
      if (out.has(key)) continue
      out.set(key, {
        key,
        label,
        symbol: n.symbol,
        sceneId: scene.id,
        sceneName: scene.name,
        systemKey: scene.systemKey,
      })
    }
  }
  return [...out.values()]
}

/**
 * 设备 / 事件是否落在选中的管理单元内
 *
 * 节点 key 与树一一对应：
 *   zone-*  按园区分区筛
 *   bld-*   按建筑筛
 *   part-*  按建筑内的部位筛
 *   dev-*   按设备筛（同一台设备跨画面的事件一起出来）
 *   root    不筛
 *
 * @param space 设备 / 事件的园区空间归属
 * @param key   选中的树节点 key
 */
export function inUnit(space: DeviceSpace | undefined, key: string): boolean {
  if (key === 'root') return true
  if (!space) return false
  if (key.startsWith('zone-')) return space.zoneId === key.slice(5)
  if (key.startsWith('bld-')) return space.buildingId === key.slice(4)
  if (key.startsWith('part-')) {
    const [buildingId, part] = key.slice(5).split('::')
    return space.buildingId === buildingId && space.part === part
  }
  return true
}

/**
 * 按设备身份 key 判断是否落在选中的管理单元内
 *
 * 设备叶子节点用 dev-* 表达，此时按设备身份 key 精确匹配。
 */
export function deviceInUnit(
  deviceKey: string,
  space: DeviceSpace | undefined,
  key: string,
): boolean {
  if (key.startsWith('dev-')) return deviceKey === key.slice(4)
  return inUnit(space, key)
}

/* ============================================================
 * 类别判定
 * ============================================================ */

/**
 * 点位名 → 事件类别
 *
 * 命中规则按优先级取第一条：火警 > 故障 > 预警。
 * 点位名里没有对应词（如「液位」「压力」）归「其他」。
 */
const CATEGORY_RULES: Array<{ cat: DutyCategory; words: string[] }> = [
  { cat: '火警', words: ['火警', '报警'] },
  { cat: '故障', words: ['故障'] },
  { cat: '预警', words: ['预警', '失重', '欠压', '超限', '水浸', '溢流'] },
]

export function dutyCategoryOf(point: string): DutyCategory {
  for (const r of CATEGORY_RULES) {
    if (r.words.some((w) => point.includes(w))) return r.cat
  }
  return '其他'
}

/* ============================================================
 * 时间与文案
 * ============================================================ */

/** yyyy-MM-dd HH:mm:ss */
export function formatTime(t: number): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** MM/DD HH:mm */
export function formatShort(t: number): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 持续时长文案
 *
 * 云端口径：不足 1 小时显示「N分钟」，不足 1 天显示「N小时N分钟」，否则「N天N小时」。
 */
export function durationText(from: number, to: number): string {
  const mins = Math.max(1, Math.floor((to - from) / 60_000))
  if (mins < 60) return `${mins}分钟`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时${mins % 60}分钟`
  const days = Math.floor(hours / 24)
  return `${days}天${hours % 24}小时`
}

/* ============================================================
 * 事件生成
 * ============================================================ */

/** 设备编码：由节点 id 派生的稳定 15 位数字（演示用，非真实 IMEI） */
function deviceCodeOf(nodeId: string): string {
  const rnd = rngOf(seedOf(`code-${nodeId}`))
  let out = ''
  for (let i = 0; i < 15; i++) out += String(Math.floor(rnd() * 10))
  return out
}

/**
 * 画面 → 事件列表
 *
 * 一台设备上的多个异常点位聚合成一条事件（云端口径：一条事件 = 一个持续告警），
 * 点位名用「、」连接。同一节点只产出一条，避免同一台设备在队列里刷屏。
 *
 * @param scenes  平台组态画面
 * @param systemNames 系统 key → 系统名（用于「位置」兜底）
 * @param now     基准时刻（传同一值可复现整份数据）
 */
export function buildDutyEvents(
  scenes: SceneConfig[],
  systemNames: Map<string, string> = new Map(),
  now: number = Date.now(),
): DutyEvent[] {
  // 自定义图元是异步注册的，读 DEF_MAP 前先碰注册版本号
  void SYMBOL_REGISTRY_VERSION.value

  const out: DutyEvent[] = []

  for (const scene of scenes) {
    const sources = pointSourcesOf(scene)

    // 按节点聚合异常点位
    const byNode = new Map<string, typeof sources>()
    for (const s of sources) {
      if (!isAbnormalPoint(s.point)) continue
      const list = byNode.get(s.nodeId) ?? []
      list.push(s)
      byNode.set(s.nodeId, list)
    }

    for (const [nodeId, list] of byNode) {
      const node = scene.nodes?.find((n) => n.id === nodeId)
      if (!node) continue

      const def = symbolDef(node.symbol)
      const deviceName = node.label || def?.name || node.symbol
      const points = list.map((s) => s.point)
      const category = dutyCategoryOf(points[0] ?? '')

      const rnd = rngOf(seedOf(`evt-${scene.id}-${nodeId}`))

      // 上报次数：2~32 次
      const reportTimes = 2 + Math.floor(rnd() * 31)
      // 首次报警：2~9 天前
      const firstAt = now - (2 + rnd() * 7) * 86_400_000
      // 最新报警：0~5 小时前（必须晚于首次）
      const latestAt = Math.max(firstAt + 60_000, now - rnd() * 5 * 3_600_000)

      out.push({
        id: `${scene.id}-${nodeId}`,
        source: deviceName,
        deviceKey: deviceKeyOf(node.symbol, deviceName),
        symbol: node.symbol,
        point: points.join('、'),
        category,
        systemKey: scene.systemKey,
        sceneId: scene.id,
        sceneName: scene.name,
        nodeId,
        // 位置：园区空间归属（建筑 + 部位）在装载后由 applyDeviceSpaces 覆盖；
        // 在那之前先用系统名兜底，不拿画面名当位置 —— 画面名是画面标识，不是地点。
        location: scene.scope || systemNames.get(scene.systemKey) || scene.name,
        deviceType: def?.name || node.symbol,
        deviceCode: deviceCodeOf(nodeId),
        reportTimes,
        firstAt,
        latestAt,
        duration: durationText(firstAt, latestAt),
        alarmValue: '-',
        contact: '暂无联系人',
      })
    }
  }

  // 最新报警时间倒序：值班员先看刚发生的
  return out.sort((a, b) => b.latestAt - a.latestAt)
}

/* ============================================================
 * 派生数据
 * ============================================================ */

/* ============================================================
 * KPI
 * ============================================================ */

export interface DutyKpi {
  /** 今日已核实事件 */
  confirmedToday: number
  /** 待核实事件 */
  unconfirmed: number
  /** 火警 */
  fire: number
  /** 故障 */
  fault: number
  /** 预警 */
  warn: number
  /** 其他 */
  other: number
}

/**
 * 汇总 KPI
 *
 * 只统计事件口径。设备在线率 / 异常率两项已去掉：
 * 本平台的组态画面没有落库设备状态（节点 state 未置位），
 * 算出来的在线率恒为 100%、异常率还得与队列强行对齐，没有可信口径。
 */
export function dutyKpiOf(events: DutyEvent[], confirmedToday = 0): DutyKpi {
  return {
    confirmedToday,
    unconfirmed: events.length,
    fire: events.filter((e) => e.category === '火警').length,
    fault: events.filter((e) => e.category === '故障').length,
    warn: events.filter((e) => e.category === '预警').length,
    other: events.filter((e) => e.category === '其他').length,
  }
}

/* ============================================================
 * 园区空间树
 * ============================================================ */

/**
 * 把设备空间归属写回事件：位置文案 + space 结构。
 *
 * 归属表按设备类型生成（见 config/duty-locations.ts），建筑与楼层取校园三维模型的
 * 真值；平台还没有「设备 → 建筑」的关联，所以这是演示口径，不是台账口径。
 */
export function applyDeviceSpaces(events: DutyEvent[], spaces: Map<string, DeviceSpace>): void {
  for (const e of events) {
    const sp = spaces.get(e.deviceKey)
    if (!sp) continue
    e.space = sp
    e.location = `${sp.buildingName} ${sp.part}`
  }
}

/**
 * 把设备空间归属写回设备清单（平面图描点用）。
 *
 * 与事件同一张归属表，所以平面图上的点位和树里的分支永远指同一栋楼。
 */
export function attachDeviceSpaces(
  devices: SceneDevice[],
  spaces: Map<string, DeviceSpace>,
): void {
  for (const d of devices) {
    const sp = spaces.get(d.key)
    if (sp) d.space = sp
  }
}

/**
 * 园区空间树：园区 › 分区 › 建筑 › 部位 › 设备
 *
 * 结构按**设备**建（每个有设备的单元都能在树里点到，平面图才有东西可描），
 * 计数按**事件**算（每个节点右侧的红字 = 该单元下待核实事件数）。
 *
 * 设计稿的树是一棵完整的组织树（公司 › 楼栋 › 楼层/部位），本身不带告警数据；
 * 这里沿用它的骨架，额外加一列待核实事件数 —— 本页的树是"哪栋楼有异常"的
 * 导航，没有计数就只剩一列楼名。
 *
 * 设备按 deviceKey 聚合：同一台设备在两张画面都报警时，树里只有一片叶子，
 * 事件数累加（点叶子能把两张画面的事件一起筛出来）。
 *
 * @param spaces  园区空间真值（只用来定建筑顺序）
 * @param devices 设备清单（带空间归属）
 * @param events  待核实事件（只用来计数）
 */
export function buildDutySpaceTree(
  spaces: CampusSpaces,
  devices: SceneDevice[],
  events: DutyEvent[],
): DutySpaceNode {
  const root: DutySpaceNode = {
    key: 'root',
    label: '校园消防',
    level: 'zone',
    count: 0,
    children: [],
  }

  const zoneNodes = new Map<string, DutySpaceNode>()
  const buildingNodes = new Map<string, DutySpaceNode>()
  const partNodes = new Map<string, DutySpaceNode>()
  const deviceNodes = new Map<string, DutySpaceNode>()

  /** 取（或建）某台设备所在的部位节点 */
  function partOf(sp: DeviceSpace): DutySpaceNode {
    let zone = zoneNodes.get(sp.zoneId)
    if (!zone) {
      zone = { key: `zone-${sp.zoneId}`, label: sp.zoneName, level: 'zone', count: 0, children: [] }
      zoneNodes.set(sp.zoneId, zone)
      root.children.push(zone)
    }

    let building = buildingNodes.get(sp.buildingId)
    if (!building) {
      building = {
        key: `bld-${sp.buildingId}`,
        label: sp.buildingName,
        level: 'building',
        count: 0,
        children: [],
      }
      buildingNodes.set(sp.buildingId, building)
      zone.children.push(building)
    }

    const partKey = `${sp.buildingId}::${sp.part}`
    let part = partNodes.get(partKey)
    if (!part) {
      part = { key: `part-${partKey}`, label: sp.part, level: 'part', count: 0, children: [] }
      partNodes.set(partKey, part)
      building.children.push(part)
    }
    return part
  }

  // 结构：一台设备一片叶子
  for (const d of devices) {
    if (!d.space) continue
    if (deviceNodes.has(d.key)) continue
    const part = partOf(d.space)
    const node: DutySpaceNode = {
      key: `dev-${d.key}`,
      label: d.label,
      level: 'device',
      count: 0,
      children: [],
    }
    deviceNodes.set(d.key, node)
    part.children.push(node)
  }

  // 计数：一条事件给它的整条路径 +1
  for (const e of events) {
    if (!e.space) continue
    root.count += 1
    partOf(e.space).count += 1
    const device = deviceNodes.get(e.deviceKey)
    if (device) device.count += 1
    const building = buildingNodes.get(e.space.buildingId)
    if (building) building.count += 1
    const zone = zoneNodes.get(e.space.zoneId)
    if (zone) zone.count += 1
  }

  // 分区按模型的分区顺序、建筑按模型清单顺序，部位按楼层数值
  const zoneOrder = new Map(spaces.zones.map((z, i) => [z.id, i]))
  root.children.sort((a, b) => (zoneOrder.get(a.key.slice(5)) ?? 99) - (zoneOrder.get(b.key.slice(5)) ?? 99))

  const buildingOrder = new Map(spaces.buildings.map((b, i) => [b.id, i]))
  for (const zone of root.children) {
    zone.children.sort(
      (a, b) =>
        (buildingOrder.get(a.key.slice(4)) ?? 999) - (buildingOrder.get(b.key.slice(4)) ?? 999),
    )
    for (const building of zone.children) {
      building.children.sort((a, b) => floorOf(a.label) - floorOf(b.label))
    }
  }

  return root
}

/** 「3层」→ 3；非楼层文案返回 999（排最后） */
function floorOf(part: string): number {
  const m = part.match(/^(\d+)/)
  return m ? Number(m[1]) : 999
}
