/**
 * register-ebike-v2-bigscreen.ts — 注册「应急局电动车监控大屏（浅色版）」大屏记录
 *
 * 对应前端：
 *   - 页面：src/views/bigscreen/EbikeMonitorV2.vue
 *   - 路由：/landing/ebike-v2
 *   - 类型：BigscreenType 'ebike-v2'（src/types/bigscreen.ts）
 *   - 模板：TYPE_ROUTES['ebike-v2'] = '/landing/ebike-v2'（src/config/bigscreen-templates.ts）
 *
 * 企业关联沿用现有 ebike 大屏（充电监控大屏）的关联企业：中冶龙熙半岛（默认大屏）。
 *
 * 幂等：同名（@@unique(name)）已存在则跳过，可重复执行。
 * 运行：cd server && npx tsx scripts/register-ebike-v2-bigscreen.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const NAME = '应急局电动车监控大屏（浅色版）'
const DESC = '应急局“人工智能+电动自行车”安全管控平台（浅色版）。顶栏带 5 个导航入口，内容区三列布局。'
const TAGS = JSON.stringify(['电动车', '安防监控', '应急指挥'])
/** 沿用「充电监控大屏」的关联企业 */
const ENTERPRISE_ID = 27

async function main() {
  const existing = await db.bigscreen.findUnique({ where: { name: NAME } })
  let bigscreenId: number

  if (existing) {
    await db.bigscreen.update({
      where: { id: existing.id },
      data: { type: 'ebike-v2', scenario: '安防监控', description: DESC, tags: TAGS, status: 1 },
    })
    bigscreenId = existing.id
    console.log(`UPDATED  ${NAME} (id=${bigscreenId})`)
  } else {
    const created = await db.bigscreen.create({
      data: {
        name: NAME,
        type: 'ebike-v2',
        scenario: '安防监控',
        description: DESC,
        tags: TAGS,
        status: 1,
        sortOrder: 1,
        createdBy: 20,
      },
    })
    bigscreenId = created.id
    console.log(`CREATED  ${NAME} (id=${bigscreenId})`)
  }

  // 企业关联：已存在则置为默认 + 启用
  const rel = await db.bigscreenEnterprise.findUnique({
    where: { bigscreenId_enterpriseId: { bigscreenId, enterpriseId: ENTERPRISE_ID } },
  })
  if (rel) {
    await db.bigscreenEnterprise.update({
      where: { id: rel.id },
      data: { isDefault: true, status: 1 },
    })
    console.log(`LINKED   enterprise=${ENTERPRISE_ID} (updated)`)
  } else {
    await db.bigscreenEnterprise.create({
      data: { bigscreenId, enterpriseId: ENTERPRISE_ID, isDefault: true, status: 1 },
    })
    console.log(`LINKED   enterprise=${ENTERPRISE_ID} (created)`)
  }

  const all = await db.bigscreen.findMany({
    where: { type: 'ebike-v2' },
    select: { id: true, name: true, type: true, status: true },
  })
  console.log('\n=== ebike-v2 记录 ===')
  all.forEach((x) => console.log(`  id=${x.id} ${x.name} (${x.type}, status=${x.status})`))
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})
