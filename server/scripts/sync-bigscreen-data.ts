/**
 * sync-bigscreen-data.ts — 把大屏依赖的平台数据补进目标库（幂等）
 *
 * 为什么需要它
 * ------------
 * 大屏「系统监测」「实时警情」页的画面与图元不是画在前端里的，而是平台数据：
 *   - 组态画面 → SceneConfig（画面主体 + 布局）
 *   - 图元管理 → CustomSymbol（图元元数据 + 绑定点位 + 状态类）
 * 前端只按规则取用（scene-picker.ts：取「设备监控/设备状态监控」类画面），
 * 不硬编码画面 id —— 库里没有，画面就渲染不出来、指标就全是 0。
 *
 * 线上库比本地旧时（表都还没有），只推 schema 是不够的，必须把数据补上。
 * 本脚本把本地导出的载荷按唯一键 upsert 进目标库：
 *   - CustomSymbol  按 symbolId  upsert
 *   - SceneConfig   按 sceneId   upsert
 *   - Bigscreen     按 name      upsert（name 有 @@unique）
 *   - 关联          按「大屏名 + 企业名」创建（企业按名匹配，线上 id 与本地不同）
 *
 * 幂等：重复执行安全，不会产生重复行；也不删除目标库里的任何既有数据。
 *
 * 运行（server/ 下）：
 *   npx tsx scripts/sync-bigscreen-data.ts [载荷路径]
 * 默认载荷：prisma/bigscreen-sync-payload.json
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

interface PayloadScene {
  sceneId: string
  name: string
  systemKey: string
  scope: string
  width: number
  height: number
  style: string
  status: string
  nodesJson: string
  edgesJson: string
  draftJson: string
  remark: string
  enterpriseId: number | null
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string | null
}

interface PayloadSymbol {
  symbolId: string
  name: string
  system: string
  category: string
  desc: string
  imageUrl: string
  imageKey: string
  bboxJson: string
  portsJson: string
  bindingsJson: string
  enterpriseId: number | null
  createdAt: string | null
  updatedAt: string | null
}

interface PayloadBigscreen {
  name: string
  type: string
  scenario: string
  description: string
  tags: string
  status: number
  sortOrder: number
  createdAt: string | null
  updatedAt: string | null
}

interface PayloadLink {
  bigscreen: string
  enterprise: string
  isDefault: boolean
  status: number
}

interface Payload {
  scenes: PayloadScene[]
  symbols: PayloadSymbol[]
  bigscreens: PayloadBigscreen[]
  links: PayloadLink[]
}

async function main() {
  const payloadPath = resolve(process.cwd(), process.argv[2] ?? 'prisma/bigscreen-sync-payload.json')
  const payload: Payload = JSON.parse(readFileSync(payloadPath, 'utf-8'))

  const db = new PrismaClient()

  // createdBy 要指向库里真实存在的用户，否则平台的「创建人」展示是空指针。
  // 优先取平台运营账号（13800000001），没有就退到第一个用户。
  const owner =
    (await db.user.findUnique({ where: { phone: '13800000001' } })) ??
    (await db.user.findFirst({ orderBy: { id: 'asc' } }))
  if (!owner) throw new Error('库里没有任何用户，无法确定数据创建人')
  console.log(`ℹ️ 创建人: ${owner.realName} (${owner.phone}, id=${owner.id})`)

  // ---------- 图元 ----------
  for (const s of payload.symbols) {
    const data = {
      name: s.name,
      system: s.system,
      category: s.category,
      desc: s.desc,
      imageUrl: s.imageUrl,
      imageKey: s.imageKey,
      bboxJson: s.bboxJson,
      portsJson: s.portsJson,
      bindingsJson: s.bindingsJson,
      enterpriseId: s.enterpriseId,
      createdBy: owner.id,
    }
    await db.customSymbol.upsert({
      where: { symbolId: s.symbolId },
      update: data,
      create: { symbolId: s.symbolId, ...data, createdAt: s.createdAt ? new Date(s.createdAt) : undefined },
    })
    console.log(`  ✅ 图元: ${s.symbolId} ${s.name}`)
  }

  // ---------- 组态画面 ----------
  for (const sc of payload.scenes) {
    const data = {
      name: sc.name,
      systemKey: sc.systemKey,
      scope: sc.scope,
      width: sc.width,
      height: sc.height,
      style: sc.style,
      status: sc.status,
      nodesJson: sc.nodesJson,
      edgesJson: sc.edgesJson,
      draftJson: sc.draftJson,
      remark: sc.remark,
      enterpriseId: sc.enterpriseId,
      createdBy: owner.id,
    }
    await db.sceneConfig.upsert({
      where: { sceneId: sc.sceneId },
      update: data,
      create: {
        sceneId: sc.sceneId,
        ...data,
        createdAt: sc.createdAt ? new Date(sc.createdAt) : undefined,
        updatedAt: sc.updatedAt ? new Date(sc.updatedAt) : undefined,
        deletedAt: sc.deletedAt ? new Date(sc.deletedAt) : null,
      },
    })
    console.log(`  ✅ 画面: ${sc.name} (${sc.sceneId}, ${sc.systemKey})`)
  }

  // ---------- 大屏记录 ----------
  for (const b of payload.bigscreens) {
    const data = {
      type: b.type,
      scenario: b.scenario,
      description: b.description,
      tags: b.tags,
      status: b.status,
      sortOrder: b.sortOrder,
      createdBy: owner.id,
    }
    await db.bigscreen.upsert({
      where: { name: b.name },
      update: data,
      create: { name: b.name, ...data },
    })
    console.log(`  ✅ 大屏: ${b.name} (${b.type})`)
  }

  // ---------- 大屏-企业关联（企业按名匹配，线上 id 与本地不同） ----------
  for (const l of payload.links) {
    const bigscreen = await db.bigscreen.findUnique({ where: { name: l.bigscreen } })
    if (!bigscreen) {
      console.warn(`  ⚠️ 跳过关联（找不到大屏）: ${l.bigscreen}`)
      continue
    }
    const enterprise = await db.enterprise.findFirst({ where: { name: l.enterprise } })
    if (!enterprise) {
      console.warn(`  ⚠️ 跳过关联（找不到企业）: ${l.enterprise}`)
      continue
    }
    await db.bigscreenEnterprise.upsert({
      where: { bigscreenId_enterpriseId: { bigscreenId: bigscreen.id, enterpriseId: enterprise.id } },
      update: { isDefault: l.isDefault, status: l.status },
      create: {
        bigscreenId: bigscreen.id,
        enterpriseId: enterprise.id,
        isDefault: l.isDefault,
        status: l.status,
      },
    })
    console.log(`  ✅ 关联: ${l.bigscreen} → ${l.enterprise} (默认大屏=${l.isDefault})`)
  }

  // ---------- 核对 ----------
  const [symbolCount, sceneCount, bigscreenCount] = await Promise.all([
    db.customSymbol.count(),
    db.sceneConfig.count({ where: { deletedAt: null } }),
    db.bigscreen.count(),
  ])
  console.log('\n=== 同步后核对 ===')
  console.log(`  图元 CustomSymbol: ${symbolCount}`)
  console.log(`  画面 SceneConfig:   ${sceneCount}`)
  console.log(`  大屏 Bigscreen:     ${bigscreenCount}`)

  const monitorScenes = await db.sceneConfig.findMany({
    where: { deletedAt: null, name: { contains: '设备' } },
    select: { name: true, systemKey: true, status: true, nodesJson: true },
  })
  console.log('  大屏可用的设备监控类画面:')
  for (const s of monitorScenes) {
    console.log(`    - ${s.name} [${s.systemKey}] 节点数=${JSON.parse(s.nodesJson || '[]').length}`)
  }

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('❌ 大屏数据同步失败:', e)
  process.exit(1)
})
