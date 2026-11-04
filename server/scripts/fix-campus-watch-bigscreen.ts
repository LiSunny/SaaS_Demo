/**
 * fix-campus-watch-bigscreen.ts — 修正「校园值守监控可视化大屏」的大屏类型
 *
 * 背景
 * ----
 * 前端挑大屏模板是**按 type 映射路由**的（src/config/bigscreen-templates.ts）：
 *   type='campus'   → /landing/campus   → CampusBigscreen.vue（"人工智能+平安校园"应用管理平台）
 *   type='ebike-v2' → /landing/ebike-v2 → EbikeMonitorV2.vue（"智能安全管控平台" + 校园三维模型）
 *
 * 「校园值守监控可视化大屏」这条记录的实际内容是 ebike-v2 那套页面
 * （缩略图即 EbikeMonitorV2 的总览页：消防用水监控 / 实时舆情监控 / 隐患排查治理 + 校园三维模型；
 *  仓库既有的 scripts/verify-ebike-v2-model.mjs 也直接用 /landing/ebike-v2?bigscreenId=20），
 * 但 type 却登记成了 'campus'，于是点击它落到 campus 模板上，
 * 打开的正是「港南二中大屏」那一页 —— 同一企业下的另一条记录（type 同样是 campus）。
 *
 * 修复
 * ----
 * 把该记录的 type 纠正为 'ebike-v2'，让「按 type 选模板」回到正确分支。
 *
 * 幂等：只更新**已存在**的记录；库里没有这条记录时报错退出，不新建、不动其它记录。
 * 运行：cd server && npx tsx scripts/fix-campus-watch-bigscreen.ts
 */
import { PrismaClient } from '@prisma/client'

const NAME = '校园值守监控可视化大屏'
const CORRECT_TYPE = 'ebike-v2'

/** 修正后应落到的路由（与 src/config/bigscreen-templates.ts 的 TYPE_ROUTES 保持一致） */
const ROUTE_BY_TYPE: Record<string, string> = {
  landing: '/landing',
  gongmao: '/gongmao',
  'enterprise-cockpit': '/enterprise-cockpit',
  campus: '/landing/campus',
  'campus-monitor': '/landing/campus-monitor',
  ebike: '/landing/ebike',
  'ebike-v2': '/landing/ebike-v2',
  linking: '/landing/linking',
}

async function main() {
  const db = new PrismaClient()

  const existing = await db.bigscreen.findUnique({ where: { name: NAME } })
  if (!existing) {
    console.error(`❌ 库里没有大屏「${NAME}」，不做任何修改（退出）`)
    await db.$disconnect()
    process.exit(1)
  }

  console.log(`修正前: id=${existing.id} name=${existing.name} type=${existing.type}`)

  const updated = await db.bigscreen.update({
    where: { id: existing.id },
    data: { type: CORRECT_TYPE },
  })

  console.log(`修正后: id=${updated.id} name=${updated.name} type=${updated.type}`)
  console.log(`跳转路由: ${ROUTE_BY_TYPE[updated.type] ?? '/landing'}?bigscreenId=${updated.id}`)

  // 核对关联企业（大屏选择浮层按企业过滤可用大屏）
  const links = await db.bigscreenEnterprise.findMany({
    where: { bigscreenId: updated.id },
    include: { enterprise: { select: { name: true } } },
  })
  console.log('关联企业:')
  for (const l of links) {
    console.log(
      `  - ${l.enterprise.name}（isDefault=${l.isDefault}, status=${l.status}）` +
        (l.status === 1 ? '' : ' ← 软删除，不进选择列表'),
    )
  }

  await db.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await new PrismaClient().$disconnect()
  process.exit(1)
})
