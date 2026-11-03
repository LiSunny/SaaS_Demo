/**
 * 值守工作台 · 设备空间归属（园区建筑 / 部位）
 *
 * 数据来源
 * -------
 * 园区空间真值 = 校园三维模型（public/campus-model），模型 README 明确
 *   「业务平台通过 manifest.json 消费 POI」，所以这里直接读模型产物，不另抄一份：
 *     assets/manifest.json → 85 个 POI：9 个分区、60 栋建筑（层数、类型都是真的）
 *     src/layout.js         → 分区定义（Z1..Z9 ↔ 教学区 / 生活服务区 …）
 *
 * 设备归属 = 本文件里的类型规则（演示口径）
 * -------------------------------------------
 * 平台里目前没有任何「设备 → 建筑」的关联：组态画面的 scope 字段全为空，
 * 画面节点也没有位置字段；设备台账 Device.location 是另一套未接入的数据。
 * 所以树里的设备叶子按设备类型落到空间上：
 *
 *   楼内末端设备 → 模型里的真实建筑，部位是该建筑的真实楼层
 *                  （末端灭火设备 → 学生公寓；探测监控 → 教学楼；支管阀门 → 学院楼）
 *   泵房 / 机房 / 室外设备 → 「工程构筑物」（消防泵房、防排烟机房、室外管网 …）
 *                  这类构筑物不在模型的 60 栋建筑里，单独标为 engineering 种类，
 *                  不冒充成某一栋真实建筑。
 *
 * 规则集中在本文件：接上真实设备台账后，只需替换 assignDeviceSpaces 的取值来源，
 * 树的渲染与筛选逻辑不用动。
 */

/* ============================================================
 * 类型
 * ============================================================ */

/** 园区分区 */
export interface CampusZone {
  id: string
  name: string
}

/** 园区建筑 */
export interface CampusBuilding {
  id: string
  name: string
  /** 所属分区 id */
  zoneId: string
  /** 真实层数（工程构筑物为 1） */
  floors: number
  /**
   * 建筑种类：
   *   model       模型里的真实建筑
   *   engineering 工程构筑物（泵房 / 机房 / 室外管网），模型里没有
   */
  kind: 'model' | 'engineering'
}

/** 园区空间全集 */
export interface CampusSpaces {
  zones: CampusZone[]
  buildings: CampusBuilding[]
  /** 建筑 id → 建筑 */
  buildingById: Map<string, CampusBuilding>
  /** 分区 id → 分区名 */
  zoneNameById: Map<string, string>
}

/** 设备落在园区里的位置 */
export interface DeviceSpace {
  zoneId: string
  zoneName: string
  buildingId: string
  buildingName: string
  buildingKind: CampusBuilding['kind']
  /** 部位：楼层（3层）或房间（泵房 / 主机房 …） */
  part: string
}

/** 参与归属计算的设备 */
export interface SpaceDevice {
  /** 设备身份：图元符号 + 设备名（同一台设备在多个画面出现时是同一个 key） */
  key: string
  /** 设备名 */
  label: string
  /** 图元符号 */
  symbol: string
}

/* ============================================================
 * 空间真值加载
 * ============================================================ */

/** 模型清单地址（public/ 下，dev 与 build 后都走根路径） */
const MANIFEST_URL = '/campus-model/assets/manifest.json'
/** 模型布局（分区定义） */
const LAYOUT_URL = '/campus-model/src/layout.js'

interface ManifestPoi {
  id: string
  name: string
  zone?: string
  type: string
  meta?: { floors?: number; buildingType?: string }
}

interface ManifestFile {
  items?: ManifestPoi[]
}

/**
 * 读取分区名（Z1..Z9 → 教学区 / 生活服务区 …）
 *
 * layout.js 是浏览器 ESM，放在 public 下：Vite dev 对 public 里的模块做 import()
 * 会追加 `?import` 并走转换管线，直接 500（public 目录的文件不经插件处理）。
 * 所以这里按文本取回来，抠出其中严格 JSON 的 "zones" 数组再解析。
 * 解析失败不抛 —— 退回用分区 id 当名字，树照样能用。
 */
async function loadZoneNames(): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  try {
    const res = await fetch(LAYOUT_URL)
    if (!res.ok) return out
    const text = await res.text()
    const zones = extractJsonArray(text, '"zones"')
    for (const z of zones) {
      const id = z?.id
      const name = z?.name
      if (typeof id === 'string' && typeof name === 'string') out.set(id, name)
    }
  } catch {
    // 分区名取不到时，用分区 id 兜底
  }
  return out
}

/**
 * 从 JS 源文本里抠出 `"key": [ … ]` 的 JSON 数组
 *
 * 括号配对时跳过字符串字面量（描述文案里可能有方括号）。
 */
function extractJsonArray(text: string, key: string): Array<Record<string, unknown>> {
  const at = text.indexOf(key)
  if (at < 0) return []
  const start = text.indexOf('[', at)
  if (start < 0) return []

  let depth = 0
  let quote = ''
  for (let k = start; k < text.length; k++) {
    const c = text[k]
    if (quote) {
      if (c === '\\') k++
      else if (c === quote) quote = ''
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) {
        try {
          const parsed = JSON.parse(text.slice(start, k + 1))
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
    }
  }
  return []
}

/**
 * 加载园区空间真值
 *
 * 失败不抛：返回空集合，调用方退回系统名口径，不让整页挂掉。
 */
export async function loadCampusSpaces(): Promise<CampusSpaces> {
  const empty: CampusSpaces = {
    zones: [],
    buildings: [],
    buildingById: new Map(),
    zoneNameById: new Map(),
  }

  let manifest: ManifestFile
  try {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) return empty
    manifest = (await res.json()) as ManifestFile
  } catch {
    return empty
  }

  // 分区名在 layout.js 里（模型唯一几何来源），动态 import 取，不另抄一份
  const zoneNameById = await loadZoneNames()

  const zones: CampusZone[] = []
  const buildings: CampusBuilding[] = []

  for (const poi of manifest.items ?? []) {
    if (poi.type !== 'building') continue
    const zoneId = poi.zone ?? ''
    // 分区名取不到（layout.js 没读到）时，用分区 id 兜底
    if (zoneId && !zoneNameById.has(zoneId)) zoneNameById.set(zoneId, zoneId)
    buildings.push({
      id: poi.id,
      name: poi.name,
      zoneId,
      floors: Math.max(1, poi.meta?.floors ?? 1),
      kind: 'model',
    })
  }

  // 分区按 layout.js 的顺序排（Z1..Z9）；manifest 里出现的额外分区补在后面
  for (const [id, name] of zoneNameById) zones.push({ id, name })

  return {
    zones,
    buildings,
    buildingById: new Map(buildings.map((b) => [b.id, b])),
    zoneNameById,
  }
}

/* ============================================================
 * 归属规则
 * ============================================================ */

/** 设备在园区里的角色 */
type DeviceRole =
  | 'terminal-fire' // 末端灭火设备（消火栓 / 喷淋 / 末端试水）
  | 'terminal-detect' // 探测与监控模块（探测器 / 输入输出模块 / 压力开关 …）
  | 'terminal-valve' // 楼内支管阀门
  | 'pump' // 消防泵房（水源 / 泵组 / 控制柜 / 阀组 …）
  | 'outdoor' // 室外（消防水池 / 水泵接合器）
  | 'smoke' // 防排烟机房
  | 'gas' // 气体灭火间

/** 工程构筑物：模型 60 栋建筑里没有这类，归在后勤区 */
const ENGINEERING_BUILDINGS: Record<
  'pump' | 'outdoor' | 'smoke' | 'gas',
  { id: string; name: string; zoneId: string }
> = {
  pump: { id: 'ENG-PUMP', name: '消防泵房', zoneId: 'Z8' },
  outdoor: { id: 'ENG-OUTDOOR', name: '室外管网', zoneId: 'Z8' },
  smoke: { id: 'ENG-SMOKE', name: '防排烟机房', zoneId: 'Z8' },
  gas: { id: 'ENG-GAS', name: '气体灭火间', zoneId: 'Z8' },
}

/** 末端设备对应的真实建筑池（模型里的建筑 id） */
const BUILDING_POOLS: Record<'terminal-fire' | 'terminal-detect' | 'terminal-valve', string[]> = {
  // 末端灭火设备装在学生公寓（宿舍是消火栓重点部位）
  'terminal-fire': [
    'CAMPUS_DORM_01',
    'CAMPUS_DORM_02',
    'CAMPUS_DORM_03',
    'CAMPUS_DORM_04',
    'CAMPUS_DORM_05',
    'CAMPUS_DORM_06',
    'CAMPUS_DORM_07',
    'CAMPUS_DORM_08',
  ],
  // 探测与监控模块装在教学楼
  'terminal-detect': [
    'CAMPUS_TEACH_01',
    'CAMPUS_TEACH_02',
    'CAMPUS_TEACH_03',
    'CAMPUS_TEACH_04',
    'CAMPUS_TEACH_05',
    'CAMPUS_TEACH_06',
    'CAMPUS_TEACH_07',
    'CAMPUS_TEACH_08',
  ],
  // 支管阀门装在学院楼
  'terminal-valve': [
    'CAMPUS_COLLEGE_01',
    'CAMPUS_COLLEGE_02',
    'CAMPUS_COLLEGE_03',
    'CAMPUS_COLLEGE_04',
    'CAMPUS_COLLEGE_05',
    'CAMPUS_COLLEGE_06',
    'CAMPUS_COLLEGE_07',
    'CAMPUS_COLLEGE_08',
  ],
}

/** 泵房设备的部位（按 符号::设备名 定位，避免同名不同设备串位） */
const PUMP_PARTS: Record<string, string> = {
  'TNK-FIRE-01::消防水池': '水池间',
  'RES-TANK-01::消防水箱': '水箱间',
  'PMP-SET-01::消防泵组': '泵房',
  'CAB-PMP-01::消防泵控制柜': '泵房控制柜',
  'CAB-PMP-01::稳压控制柜': '稳压泵房',
  'PMP-STAB-01::稳压泵': '稳压泵房',
  'VES-PRE-01::稳压气压罐': '气压罐间',
  'ALV-GRP-01::报警阀组': '阀组间',
  'FWMS-MH-01::消防用水监测主机': '监控室',
  'PAI-SPG-01::管网压力表': '泵房',
  'VLV-SIG-01::阀门': '阀组间',
}

/** 室外设备的部位 */
const OUTDOOR_PARTS: Record<string, string> = {
  'CON-OUT-01::水泵接合器': '接合器井',
}

/** 防排烟机房的部位 */
const SMOKE_PARTS: Record<string, string> = {
  'SCS-MH-01::防排烟监测主机': '主机房',
  'SCS-RPD-01::风机压差探测器': '风机房',
}

/** 气体灭火间的部位 */
const GAS_PARTS: Record<string, string> = {
  'GFES-MH-01::气体灭火控制主机': '主机房',
  'GFES-PD-01::钢瓶压力探测器': '钢瓶间',
}

/** 泵房角色的设备符号 */
const PUMP_SYMBOLS = new Set([
  'TNK-FIRE-01',
  'RES-TANK-01',
  'PMP-SET-01',
  'PMP-STAB-01',
  'VES-PRE-01',
  'CAB-PMP-01',
  'ALV-GRP-01',
  'FWMS-MH-01',
  'PAI-SPG-01',
  'VLV-SIG-01',
])

/** 末端灭火设备的符号 */
const FIRE_SYMBOLS = new Set([
  'HYD-IND-01',
  'HYD-HOSE-01',
  'SPK-SPR-01',
  'TST-TEST-01',
  'CUS-ATS-01',
  'CUS-MTS-01',
])

/** 判定设备角色 */
function roleOf(symbol: string): DeviceRole {
  if (symbol.startsWith('GFES-')) return 'gas'
  if (symbol.startsWith('SCS-')) return 'smoke'
  if (symbol.startsWith('CON-')) return 'outdoor'
  if (PUMP_SYMBOLS.has(symbol)) return 'pump'
  if (FIRE_SYMBOLS.has(symbol)) return 'terminal-fire'
  if (symbol.startsWith('VLV-')) return 'terminal-valve'
  return 'terminal-detect'
}

/** 设备身份 key：符号 + 设备名 */
export function deviceKeyOf(symbol: string, label: string): string {
  return `${symbol}::${label}`
}

/**
 * 生成设备空间归属表
 *
 * 同一角色的一批设备按 key 排序后，依次落到对应建筑池的第 i 栋；
 * 楼层在该建筑的真实层数内取（1 + i % 层数）。全程确定性 —— 刷新页面不跳动。
 *
 * @param spaces  园区空间真值
 * @param devices 设备清单（去重后的设备身份）
 */
export function assignDeviceSpaces(
  spaces: CampusSpaces,
  devices: SpaceDevice[],
): Map<string, DeviceSpace> {
  const out = new Map<string, DeviceSpace>()
  if (!spaces.buildings.length) return out

  // 按角色分组，组内按 key 排序保证稳定
  const groups = new Map<DeviceRole, SpaceDevice[]>()
  for (const d of devices) {
    const role = roleOf(d.symbol)
    const list = groups.get(role) ?? []
    list.push(d)
    groups.set(role, list)
  }
  for (const list of groups.values()) list.sort((a, b) => a.key.localeCompare(b.key))

  for (const [role, list] of groups) {
    if (role === 'pump' || role === 'outdoor' || role === 'smoke' || role === 'gas') {
      const eng = ENGINEERING_BUILDINGS[role]
      const partMap =
        role === 'pump' ? PUMP_PARTS : role === 'outdoor' ? OUTDOOR_PARTS : role === 'smoke' ? SMOKE_PARTS : GAS_PARTS
      const zoneName = spaces.zoneNameById.get(eng.zoneId) ?? eng.zoneId
      for (const d of list) {
        out.set(d.key, {
          zoneId: eng.zoneId,
          zoneName,
          buildingId: eng.id,
          buildingName: eng.name,
          buildingKind: 'engineering',
          part: partMap[d.key] ?? '设备间',
        })
      }
      continue
    }

    // 末端设备 → 真实建筑 + 真实楼层
    const pool = BUILDING_POOLS[role]
    list.forEach((d, i) => {
      const building = spaces.buildingById.get(pool[i % pool.length])
      if (!building) return
      out.set(d.key, {
        zoneId: building.zoneId,
        zoneName: spaces.zoneNameById.get(building.zoneId) ?? building.zoneId,
        buildingId: building.id,
        buildingName: building.name,
        buildingKind: building.kind,
        part: `${1 + (i % building.floors)}层`,
      })
    })
  }

  return out
}
