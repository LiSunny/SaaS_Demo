/**
 * 大屏「系统监测」页用的平台图元补登记 + mock 画面清理
 *
 * 为什么需要它
 * ------------
 * 大屏系统监测页的三个模块 —— 设备检测指标概览、实时警情、多发故障排名 ——
 * 全部从**平台的组态画面**派生（`/api/scenes` → 画面节点 → 图元库符号绑定的状态类）。
 *
 * 平台组态配置里现成的两幅画面正是这两个系统该用的监控组态图：
 *   gas   「气体灭火设备状态监测」  气体灭火控制主机 + 钢瓶压力探测器
 *   smoke 「防排烟系统设备监控」    防排烟监测主机 + 风机压差探测器
 *
 * 但画面里的四个图元（GFES-* / SCS-*）**从没登记进平台图元管理**，只以内联定义
 * 的形式留在组态配置导出的画面文件里（`src/config/gas-scene.json` 等）。
 * 大屏画布只认图元库（内置 manifest + 图元管理里的 CustomSymbol），
 * 所以：
 *   - 画面渲染不出这四个图元（大屏只看到设备名标签，没有图形）
 *   - `scene-points.ts` 取不到它们任何绑定点位 → 四项指标全 0、警情与排名都空
 *
 * 这里把这四个图元补登记进图元管理（产品图沿用画面文件里的 OSS 地址，
 * 端口照搬），并给它们的绑定补上状态类声明 —— 与内置图元库的做法一致：
 *   运行类点位补 offClass:['is-off'] → 设备停运即「屏蔽」
 *   故障 / 欠压 / 压差超限补 onClass → 进「故障」「预警」与故障排名
 *
 * 画面本身一个节点都不加：大屏画的就是组态配置里那两幅，不另造画面。
 *
 * 幂等：按 symbolId upsert，重复执行安全；改这里重跑即可生效。
 */
import { PrismaClient } from '@prisma/client'
import { pathToFileURL } from 'node:url'

/**
 * 之前误建的 mock 画面（另画的「系统总貌」）—— 用户要求用组态配置里那两幅，
 * 这里负责把它们清掉。画面是软删除模型，这里直接删记录。
 */
const MOCK_OVERVIEW_SCENE_IDS = ['scene-mock-gas', 'scene-mock-smoke']

/** 图元端口（64×64 画布坐标） */
interface SymbolPort {
  x: number
  y: number
  dir: string
}

/** 图元绑定点 */
interface SymbolBinding {
  name: string
  kind: string
  point: string
  onClass?: string[]
  offClass?: string[]
  textIndex?: number
}

/** 要补登记的图元 */
interface MonitorSymbol {
  symbolId: string
  name: string
  system: 'gas' | 'smoke'
  category: string
  desc: string
  /** 产品图公网地址（沿用组态配置导出的画面文件） */
  imageUrl: string
  ports: SymbolPort[]
  bindings: SymbolBinding[]
}

/**
 * 气体灭火 / 防排烟的四个图元
 *
 * 产品图与端口取自组态配置导出的画面文件（src/config/gas-scene.json、
 * smoke-scene.json 的 symbols 段）；绑定在原声明上补状态类。
 */
export const MONITOR_SYMBOLS: MonitorSymbol[] = [
  {
    symbolId: 'GFES-MH-01',
    name: '气体灭火控制主机',
    system: 'gas',
    category: '电气',
    desc: '气体灭火系统的控制主机，负责接收探测信号并驱动喷放',
    imageUrl:
      'https://gn-saas-files.oss-cn-beijing.aliyuncs.com/symbols/2026-10-28/1793173932479-94d4c626.png',
    ports: [
      { x: 32, y: 8, dir: 'up' },
      { x: 8, y: 32, dir: 'left' },
      { x: 56, y: 32, dir: 'right' },
      { x: 32, y: 48, dir: 'down' },
    ],
    bindings: [
      // 运行点补 offClass：主机停运即不再上报，对应指标概览的「屏蔽」
      { name: '运行', kind: 'bool', point: 'GFES-MH-01-RUN', onClass: ['is-run'], offClass: ['is-off'] },
      { name: '故障', kind: 'bool', point: 'GFES-MH-01-FAULT', onClass: ['is-fault'] },
    ],
  },
  {
    symbolId: 'GFES-PD-01',
    name: '钢瓶压力探测器',
    system: 'gas',
    category: '探测报警',
    desc: '监测灭火剂钢瓶压力，压力低于下限即判欠压',
    imageUrl:
      'https://gn-saas-files.oss-cn-beijing.aliyuncs.com/symbols/2026-10-28/1793173803359-c1ce5653.png',
    ports: [
      { x: 32, y: 8, dir: 'up' },
      { x: 8, y: 32, dir: 'left' },
      { x: 56, y: 32, dir: 'right' },
      { x: 32, y: 56, dir: 'down' },
    ],
    bindings: [
      { name: '压力', kind: 'text', point: 'GFES-PD-01-YL', textIndex: 0 },
      { name: '故障', kind: 'bool', point: 'GFES-PD-01-FAULT', onClass: ['is-fault'] },
      // 欠压属超限类（is-over），进「预警」与故障排名
      { name: '欠压', kind: 'bool', point: 'GFES-PD-01-LOW', onClass: ['is-over'] },
    ],
  },
  {
    symbolId: 'SCS-MH-01',
    name: '防排烟监测主机',
    system: 'smoke',
    category: '电气',
    desc: '防排烟系统的监测主机，负责联动风机与风阀',
    imageUrl:
      'https://gn-saas-files.oss-cn-beijing.aliyuncs.com/symbols/2026-10-28/1793174358281-c6704426.png',
    ports: [
      { x: 32, y: 8, dir: 'up' },
      { x: 8, y: 32, dir: 'left' },
      { x: 56, y: 32, dir: 'right' },
      { x: 32, y: 48, dir: 'down' },
    ],
    bindings: [
      // 运行点补 offClass：主机停运即不再上报，对应指标概览的「屏蔽」
      { name: '运行状态', kind: 'bool', point: 'SCS-MH-01-RUN', onClass: ['is-run'], offClass: ['is-off'] },
      { name: '故障', kind: 'bool', point: 'SCS-MH-01-FAULT', onClass: ['is-fault'] },
    ],
  },
  {
    symbolId: 'SCS-RPD-01',
    name: '风机压差探测器',
    system: 'smoke',
    category: '仪表',
    desc: '监测排烟风管两侧压差，压差超出区间即判超限',
    imageUrl:
      'https://gn-saas-files.oss-cn-beijing.aliyuncs.com/symbols/2026-10-28/1793174552902-080a4195.png',
    ports: [
      { x: 32, y: 8, dir: 'up' },
      { x: 8, y: 32, dir: 'left' },
      { x: 56, y: 32, dir: 'right' },
      { x: 32, y: 56, dir: 'down' },
    ],
    bindings: [
      { name: '压差', kind: 'text', point: 'SCS-RPD-01-yacha', textIndex: 0 },
      { name: '故障', kind: 'bool', point: 'SCS-RPD-01-FAULT', onClass: ['is-fault'] },
      // 压差超限属超限类（is-over），进「预警」与故障排名
      { name: '压差超限', kind: 'bool', point: 'SCS-RPD-01-OVER', onClass: ['is-over'] },
    ],
  },
]

/**
 * 写入图元（幂等）
 *
 * 包围盒按整图铺满（[0,0,512,512]）—— 组态配置导出的画面文件里没有包围盒，
 * 与前端 registerInlineSymbols 的兜底口径一致；大屏画布里光晕本就隐藏。
 */
export async function seedMonitorSymbols(
  prisma: PrismaClient,
  createdBy: number,
): Promise<void> {
  for (const s of MONITOR_SYMBOLS) {
    await prisma.customSymbol.upsert({
      where: { symbolId: s.symbolId },
      update: {
        name: s.name,
        system: s.system,
        category: s.category,
        desc: s.desc,
        imageUrl: s.imageUrl,
        bboxJson: '[0,0,512,512]',
        portsJson: JSON.stringify(s.ports),
        bindingsJson: JSON.stringify(s.bindings),
      },
      create: {
        symbolId: s.symbolId,
        name: s.name,
        system: s.system,
        category: s.category,
        desc: s.desc,
        imageUrl: s.imageUrl,
        imageKey: '',
        bboxJson: '[0,0,512,512]',
        portsJson: JSON.stringify(s.ports),
        bindingsJson: JSON.stringify(s.bindings),
        enterpriseId: null,
        createdBy,
      },
    })
    console.log(`  ✅ 图元补登记: ${s.symbolId} ${s.name}`)
  }
}

/**
 * 清掉误建的 mock 画面（另画的「系统总貌」）
 *
 * 大屏改用组态配置里那两幅现成画面，这两幅多余的直接删掉。
 */
export async function dropMockOverviewScenes(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.sceneConfig.findMany({
    where: { sceneId: { in: MOCK_OVERVIEW_SCENE_IDS } },
    select: { sceneId: true, name: true },
  })
  for (const r of rows) {
    await prisma.sceneConfig.delete({ where: { sceneId: r.sceneId } })
    console.log(`  🗑️ 已删除多余的 mock 画面: ${r.name}`)
  }
}

/**
 * 独立执行：给已有库补图元、清多余画面
 *
 * `npm run db:seed:monitor`（在 server/ 下执行）。
 * 用 DATABASE_URL 指向的库 —— dev 环境是 server/prisma/dev.db。
 */
async function runCli() {
  const prisma = new PrismaClient()
  try {
    // createdBy：取一个种子账号（13300001111 周志远）；没有就退到第一个用户
    const user =
      (await prisma.user.findUnique({ where: { phone: '13300001111' } })) ??
      (await prisma.user.findFirst({ orderBy: { id: 'asc' } }))
    if (!user) throw new Error('库里没有任何用户，无法确定图元创建人')

    console.log('🌱 补登记大屏系统监测页用的平台图元…')
    await dropMockOverviewScenes(prisma)
    await seedMonitorSymbols(prisma, user.id)
    console.log('🌱 图元补登记完成')
  } finally {
    await prisma.$disconnect()
  }
}

// 独立执行时才跑 CLI；被 seed.ts import 时只提供函数
const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  runCli().catch((e) => {
    console.error('❌ 图元补登记失败:', e)
    process.exit(1)
  })
}
