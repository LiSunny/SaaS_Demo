/**
 * 大屏 type 修正脚本 —— 大屏记录 ↔ 页面模板 的对应关系对齐
 *
 * 背景：大屏列表 → 落地页面的映射由 type 决定（见前端 src/config/bigscreen-templates.ts：
 *       type → 路由路径，id 通过 query 的 bigscreenId 传入）。
 *       type 填错时，列表里点「大屏 A」会打开「大屏 B」的页面——因为两条记录共用同一个页面模板，
 *       而 campus / campus-monitor 这类页面不消费 bigscreenId，同 type 的第二条必然撞车。
 *
 * 本脚本修正已知错配：
 *   id=20「校园安全管理」→ type 应为 ebike-v2
 *     （林业大学雄安小区消防安全管理大屏，路由 /landing/ebike-v2，全项目唯一带三维模型的总览页）
 *     依据：docs/bigscreen/雄安小区-消防安全管理大屏-实施计划.md
 *
 * 幂等：按 id + name 双重校验定位记录；已是期望 type 的记录直接跳过，可重复执行。
 *       name 对不上（记录被删/改名/id 漂移）则跳过并告警，不会误改别的记录。
 *
 * 用法：
 *   cd server && npx tsx scripts/fix-bigscreen-types.ts
 *
 * 上线提醒：发布脚本只带代码不带数据，线上需单独执行一次本脚本；
 *           等价操作是走管理端「大屏管理 → 编辑 → 类型」手动改。
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** 已知 type 错配清单：id + name 双校验，name 不符则跳过 */
const FIXES: Array<{ id: number; name: string; type: string; note: string }> = [
  {
    id: 20,
    name: '校园安全管理',
    type: 'ebike-v2',
    note: '林大雄安小区消防安全管理大屏（/landing/ebike-v2，带三维模型）',
  },
]

/** type → 落地路由（与前端 src/config/bigscreen-templates.ts 保持一致，仅用于体检输出） */
const TYPE_ROUTES: Record<string, string> = {
  landing: '/landing',
  gongmao: '/gongmao',
  'enterprise-cockpit': '/enterprise-cockpit',
  campus: '/landing/campus',
  'campus-monitor': '/landing/campus-monitor',
  ebike: '/landing/ebike',
  'ebike-v2': '/landing/ebike-v2',
  linking: '/landing/linking',
}

/** 页面会消费 bigscreenId 的 type：同 type 多条记录仍能按记录区分 */
const CONSUMES_BIGSCREEN_ID = new Set(['landing', 'linking'])

/** 终端显示宽度：中文/全角按 2 列算 */
function displayWidth(s: string): number {
  let w = 0
  for (const ch of s) w += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1
  return w
}

/** 按显示宽度左对齐补空格（中文列宽才是真的对齐） */
function padDisplay(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - displayWidth(s)))
}

async function main() {
  console.log('\n🔧 [大屏 type 修正] 开始…\n')

  // ── 1. 修正已知错配 ──
  for (const fix of FIXES) {
    const row = await prisma.bigscreen.findUnique({ where: { id: fix.id } })

    if (!row) {
      console.log(`  ⚠️  跳过 id=${fix.id}「${fix.name}」：记录不存在`)
      continue
    }
    if (row.name !== fix.name) {
      console.log(`  ⚠️  跳过 id=${fix.id}：名称不匹配（库中为「${row.name}」，期望「${fix.name}」）`)
      continue
    }
    if (row.type === fix.type) {
      console.log(`  ✅ id=${fix.id}「${row.name}」type 已是 ${fix.type}，无需修改`)
      continue
    }

    const before = row.type
    await prisma.bigscreen.update({
      where: { id: fix.id },
      data: { type: fix.type },
    })
    console.log(`  🔄 id=${fix.id}「${row.name}」type: ${before} → ${fix.type}`)
    console.log(`      ${fix.note}`)
  }

  // ── 2. 体检：列出全部大屏的落地页面，并标出可能撞车的同 type 多条 ──
  console.log('\n📋 大屏落地页面对照：')
  const all = await prisma.bigscreen.findMany({ orderBy: { id: 'asc' } })
  const byType = new Map<string, number>()
  for (const b of all) byType.set(b.type, (byType.get(b.type) ?? 0) + 1)

  for (const b of all) {
    const route = TYPE_ROUTES[b.type] ?? '(未知 type)'
    const sameType = byType.get(b.type) ?? 0
    const conflict = sameType > 1 && !CONSUMES_BIGSCREEN_ID.has(b.type)
    console.log(
      `  ${conflict ? '⚠️ ' : '  '}${padDisplay(`id=${b.id}`, 7)}  ${padDisplay(b.name, 26)}  ${padDisplay(b.type, 19)}→ ${route}`
      + (conflict ? `   （同 type 有 ${sameType} 条，该页面不消费 bigscreenId，会撞车）` : '')
    )
  }

  const conflicts = all.filter(
    b => (byType.get(b.type) ?? 0) > 1 && !CONSUMES_BIGSCREEN_ID.has(b.type)
  )
  if (conflicts.length) {
    console.log(`\n  ⚠️  仍有 ${conflicts.length} 条记录存在同 type 撞车风险，需为每条记录指定独立 type`)
  } else {
    console.log('\n  ✅ 无同 type 撞车风险')
  }

  console.log('')
}

main()
  .catch((err) => {
    console.error('修正失败：', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
