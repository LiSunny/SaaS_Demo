/**
 * 大屏「系统监测」页的 mock 组态画面（平台组态配置链路）
 *
 * 为什么需要它
 * ------------
 * 大屏系统监测页的三个模块 —— 设备检测指标概览、实时警情、多发故障排名 ——
 * 全部从**平台的组态画面**派生（`/api/scenes` → 画面节点 → 图元库符号绑定的状态类）。
 * 平台现有的两个画面：
 *   gas   「气体灭火设备状态监测」  2 节点，用的是平台自定义图元 GFES-*
 *   smoke 「防排烟系统设备监控」    2 节点，用的是平台自定义图元 SCS-*
 * 这两个自定义图元只在内联画面文件里注册（`src/config/gas-scene.json` 等），
 * 图元库里没有它们的符号定义 → 大屏画布渲染不出图形，点位也取不到，
 * 四项指标全是 0、警情与排名都空。
 *
 * 所以补 mock 画面：节点**只用内置图元库里的符号**（带 onClass / offClass 声明），
 * 走同一条组态配置链路，前端一行都不用改。
 *
 * 数据来源与口径
 * --------------
 * 指标不写演示值，四项计数全部由画面派生（见 `src/views/bigscreen/components/ebike-v2/scene-points.ts`）：
 *   设备总数 = 画面图元数
 *   故障     = 绑定声明 is-fault 的点位数
 *   屏蔽     = 绑定声明 offClass is-off 的点位数
 *   预警     = 绑定声明 is-over / is-alarm / is-flow 的点位数
 * 节点不写 `state`（没有实时点位），因此画布上不出现异常角标 ——
 * 角标只反映真实上报状态，mock 数据不伪造角标。
 *
 * 故障类型数控制在 4 条以内：右列两卡等分父容器高度后，每张卡只有约 322px，
 * 排名行高 38 + 行距 18，排 5 行会被 overflow 裁掉（见 EbikeV2FaultRank.vue）。
 *
 * 幂等：按 sceneId upsert，重复执行安全；改这里重跑即可生效。
 */
import { PrismaClient } from '@prisma/client'
import { pathToFileURL } from 'node:url'

/** mock 画面的固定业务 ID（e2e 用例按这两个 ID 清理，保证自己的断言环境干净） */
export const MONITOR_MOCK_SCENE_IDS = {
  gas: 'scene-mock-gas',
  smoke: 'scene-mock-smoke',
} as const

/** 画面节点（与 SceneConfig.nodesJson 的元素结构一致） */
interface MockSceneNode {
  id: string
  symbol: string
  label: string
  x: number
  y: number
  size: number
}

/** 画面连线（与 SceneConfig.edgesJson 的元素结构一致） */
interface MockSceneEdge {
  id: string
  from: { node: string; port: number }
  to: { node: string; port: number }
  flow?: string
}

/** 一幅 mock 画面 */
interface MockScene {
  sceneId: string
  name: string
  systemKey: 'gas' | 'smoke'
  remark: string
  nodes: MockSceneNode[]
  edges: MockSceneEdge[]
}

/**
 * 气体灭火系统总貌
 *
 * 设备构成照气体灭火七件套排：储存装置 → 驱动装置 → 管网阀门 → 探测报警 → 声光警报。
 * 图元全部取自内置图元库的 gas 分类，绑定里带状态类声明：
 *   故障 6（控制器 / 电磁阀 / 信号器 / 输入输出模块 / 感烟 / 感温）
 *   失重 1（钢瓶组）、欠压 1（钢瓶压力表）—— 同属 is-fault
 *   报警 2（感烟 / 感温）、失压/超压不计
 * 期望指标：设备总数 11 / 故障 8 / 屏蔽 0 / 预警 2
 * 期望排名：故障 8、报警 2、失重 1、欠压 1
 */
const GAS_SCENE: MockScene = {
  sceneId: MONITOR_MOCK_SCENE_IDS.gas,
  name: '气体灭火系统总貌',
  systemKey: 'gas',
  remark: '大屏系统监测页 mock 画面（节点取自内置图元库）',
  nodes: [
    { id: 'g1', symbol: 'CTL-GAS-01', label: '气体灭火控制器', x: 160, y: 140, size: 72 },
    { id: 'g2', symbol: 'CYL-GRP-01', label: '灭火剂钢瓶组', x: 420, y: 140, size: 96 },
    { id: 'g3', symbol: 'CYL-DRV-01', label: '启动气瓶', x: 690, y: 140, size: 72 },
    { id: 'g4', symbol: 'PAI-CYL-01', label: '钢瓶压力表', x: 950, y: 140, size: 72 },
    { id: 'g5', symbol: 'VLV-SOL-01', label: '启动电磁阀', x: 160, y: 360, size: 72 },
    { id: 'g6', symbol: 'PRS-SIG-01', label: '压力信号器', x: 420, y: 360, size: 72 },
    { id: 'g7', symbol: 'MDL-IOR-01', label: '输入输出模块', x: 690, y: 360, size: 72 },
    { id: 'g8', symbol: 'NZL-GAS-01', label: '灭火剂喷嘴', x: 950, y: 360, size: 72 },
    { id: 'g9', symbol: 'DET-SMK-01', label: '感烟探测器', x: 160, y: 560, size: 72 },
    { id: 'g10', symbol: 'DET-HST-01', label: '感温探测器', x: 420, y: 560, size: 72 },
    { id: 'g11', symbol: 'ALM-SLR-01', label: '声光警报器', x: 690, y: 560, size: 72 },
  ],
  edges: [
    // 钢瓶组 → 启动电磁阀 → 喷嘴（灭火剂管路走向）
    { id: 'ge1', from: { node: 'g2', port: 1 }, to: { node: 'g5', port: 0 }, flow: 'forward' },
    { id: 'ge2', from: { node: 'g5', port: 1 }, to: { node: 'g8', port: 0 }, flow: 'forward' },
  ],
}

/**
 * 防排烟系统总貌
 *
 * 内置图元库里 smoke 分类是空的（"风机与风阀（预留）"），所以这里用
 * 排风机（FAN-EXH-01）+ 通用件（闸阀 / 压力表 / 控制柜 / 流量计）拼一组，
 * 探测报警部分沿用气体灭火那套探测器（防排烟与火灾自动报警联动）。
 * 期望指标：设备总数 12 / 故障 8 / 屏蔽 0 / 预警 3
 * 期望排名：故障 7、报警 2、超压 1、动作 1
 */
const SMOKE_SCENE: MockScene = {
  sceneId: MONITOR_MOCK_SCENE_IDS.smoke,
  name: '防排烟系统总貌',
  systemKey: 'smoke',
  remark: '大屏系统监测页 mock 画面（节点取自内置图元库）',
  nodes: [
    { id: 's1', symbol: 'FAN-EXH-01', label: '屋顶排风机', x: 180, y: 140, size: 96 },
    { id: 's2', symbol: 'FAN-EXH-01', label: '车库排风机', x: 460, y: 140, size: 96 },
    { id: 's3', symbol: 'VLV-GATE-01', label: '排烟风阀', x: 740, y: 140, size: 72 },
    { id: 's4', symbol: 'VLV-GATE-01', label: '防火阀', x: 1020, y: 140, size: 72 },
    { id: 's5', symbol: 'PAI-SPG-01', label: '风机压差表', x: 180, y: 360, size: 72 },
    { id: 's6', symbol: 'CAB-PMP-01', label: '防排烟控制柜', x: 460, y: 360, size: 96 },
    { id: 's7', symbol: 'FTM-TX-01', label: '风量计', x: 740, y: 360, size: 72 },
    { id: 's8', symbol: 'MDL-IOR-01', label: '输入输出模块', x: 1020, y: 360, size: 72 },
    { id: 's9', symbol: 'DET-SMK-01', label: '感烟探测器', x: 180, y: 560, size: 72 },
    { id: 's10', symbol: 'DET-HST-01', label: '感温探测器', x: 460, y: 560, size: 72 },
    { id: 's11', symbol: 'MAN-CLB-01', label: '手动报警按钮', x: 740, y: 560, size: 72 },
    { id: 's12', symbol: 'ALM-SLR-01', label: '声光警报器', x: 1020, y: 560, size: 72 },
  ],
  edges: [
    // 排风机 → 排烟风阀 → 排烟回路
    { id: 'se1', from: { node: 's1', port: 1 }, to: { node: 's2', port: 0 }, flow: 'forward' },
    { id: 'se2', from: { node: 's2', port: 1 }, to: { node: 's3', port: 0 }, flow: 'forward' },
    // 压差检测 → 控制柜 → 风量计
    { id: 'se3', from: { node: 's5', port: 1 }, to: { node: 's6', port: 0 }, flow: 'forward' },
    { id: 'se4', from: { node: 's6', port: 1 }, to: { node: 's7', port: 0 }, flow: 'forward' },
  ],
}

/** 全部 mock 画面 */
export const MONITOR_MOCK_SCENES: MockScene[] = [GAS_SCENE, SMOKE_SCENE]

/**
 * 写入 mock 画面（幂等）
 *
 * @param prisma Prisma 客户端
 * @param createdBy 创建人 userId（对应 seed 里的种子账号）
 */
export async function seedMonitorScenes(prisma: PrismaClient, createdBy: number): Promise<void> {
  for (const s of MONITOR_MOCK_SCENES) {
    const nodesJson = JSON.stringify(s.nodes)
    const edgesJson = JSON.stringify(s.edges)
    await prisma.sceneConfig.upsert({
      where: { sceneId: s.sceneId },
      update: {
        name: s.name,
        systemKey: s.systemKey,
        remark: s.remark,
        status: 'published',
        nodesJson,
        edgesJson,
        deletedAt: null,
      },
      create: {
        sceneId: s.sceneId,
        name: s.name,
        systemKey: s.systemKey,
        scope: '',
        width: 1200,
        height: 700,
        style: 'image',
        status: 'published',
        nodesJson,
        edgesJson,
        draftJson: '',
        remark: s.remark,
        enterpriseId: null,
        createdBy,
      },
    })
    console.log(`  ✅ 组态 mock 画面: ${s.name}（${s.nodes.length} 图元）`)
  }
}

/**
 * 独立执行：给已有库补 mock 画面
 *
 * `npm run db:seed:monitor`（在 server/ 下执行）。
 * 用 DATABASE_URL 指向的库 —— dev 环境是 server/prisma/dev.db。
 */
async function runCli() {
  const prisma = new PrismaClient()
  try {
    // createdBy：取一个种子账号（13300001111 周志远）；没有就退到 1
    const user =
      (await prisma.user.findUnique({ where: { phone: '13300001111' } })) ??
      (await prisma.user.findFirst({ orderBy: { id: 'asc' } }))
    if (!user) throw new Error('库里没有任何用户，无法确定画面创建人')

    console.log('🌱 写入大屏系统监测页 mock 组态画面…')
    await seedMonitorScenes(prisma, user.id)
    console.log('🌱 mock 组态画面写入完成')
  } finally {
    await prisma.$disconnect()
  }
}

// 独立执行时才跑 CLI；被 seed.ts import 时只提供函数
const entry = process.argv[1]
if (entry && import.meta.url === pathToFileURL(entry).href) {
  runCli().catch((e) => {
    console.error('❌ mock 画面写入失败:', e)
    process.exit(1)
  })
}
