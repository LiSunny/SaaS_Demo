/**
 * 中冶龙熙半岛 AI 数据链 — 验收脚本
 *
 * 复刻 server/src/services/agent.service.ts 的查询口径（日期边界、状态/等级筛选、
 * 企业 scope 过滤），逐条验证 AI 常见问法能否查到数据。
 *
 * 用法：cd server && npx tsx scripts/verify-longxi-ai-testdata.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ENTERPRISE_NAME = '中冶龙熙半岛'

/** 与 agent.service.ts buildDateRange 一致：用本地时间构造当天边界 */
function buildDateRange(args: Record<string, any>): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {}
  const oneDay = 86400_000
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (args.date) {
    const d = new Date(`${args.date}T00:00:00`)
    if (!isNaN(d.getTime())) {
      range.gte = d
      range.lte = new Date(d.getTime() + oneDay - 1)
    }
  } else {
    if (args.startDate) {
      const s = new Date(`${args.startDate}T00:00:00`)
      if (!isNaN(s.getTime())) range.gte = s
    }
    if (args.endDate) {
      const e = new Date(`${args.endDate}T00:00:00`)
      if (!isNaN(e.getTime())) range.lte = new Date(e.getTime() + oneDay - 1)
    }
    if (args.days) {
      const n = parseInt(args.days, 10)
      if (!isNaN(n) && n > 0) range.gte = new Date(new Date(`${todayStr}T00:00:00`).getTime() - (n - 1) * oneDay)
    }
  }
  return range
}

async function main() {
  const ent = await prisma.enterprise.findFirst({ where: { name: ENTERPRISE_NAME, deletedAt: null } })
  if (!ent) throw new Error(`未找到企业 ${ENTERPRISE_NAME}`)
  const entId = ent.id

  // 复刻 visibleEnterpriseIds：unit 角色 → 本企业 + 下级/管理方
  const relations = await prisma.enterpriseRelation.findMany({
    where: {
      OR: [
        { enterpriseId: { in: [entId] }, type: 'subordinate' },
        { relatedId: { in: [entId] }, role: { contains: 'my_manager' } },
      ],
    },
  })
  const visible = new Set<number>([entId])
  for (const r of relations) visible.add(r.type === 'subordinate' ? r.relatedId : r.enterpriseId)
  const entIds = [...visible]

  const cases: Array<{ q: string; tool: string; args: Record<string, any>; expect: number }> = [
    { q: '中冶龙熙半岛今天有几条告警', tool: 'query_alarms', args: { date: todayStr() }, expect: 4 },
    { q: '中冶龙熙半岛未处理的告警', tool: 'query_alarms', args: { status: '未处理' }, expect: 4 },
    { q: '中冶龙熙半岛紧急告警', tool: 'query_alarms', args: { level: '紧急' }, expect: 4 },
    { q: '中冶龙熙半岛最近3天的告警', tool: 'query_alarms', args: { days: 3 }, expect: 9 },
    { q: '中冶龙熙半岛全部告警', tool: 'query_alarms', args: {}, expect: 16 },
    { q: '中冶龙熙半岛未整改的隐患', tool: 'query_hazards', args: { status: '未整改' }, expect: 5 },
    { q: '中冶龙熙半岛重大隐患', tool: 'query_hazards', args: { level: '重大' }, expect: 2 },
    { q: '中冶龙熙半岛全部隐患', tool: 'query_hazards', args: {}, expect: 10 },
    { q: '中冶龙熙半岛的设备台账', tool: 'query_devices', args: {}, expect: 12 },
    { q: '中冶龙熙半岛离线设备', tool: 'query_devices', args: { status: '离线' }, expect: 1 },
    { q: '中冶龙熙半岛故障设备', tool: 'query_devices', args: { status: '故障' }, expect: 1 },
    { q: '中冶龙熙半岛进行中的工单', tool: 'query_orders', args: { status: 'active' }, expect: 2 },
    { q: '中冶龙熙半岛已关闭工单', tool: 'query_orders', args: { status: 'closed' }, expect: 1 },
  ]

  console.log(`\n🔍 校验对象：${ENTERPRISE_NAME}（id=${entId}），AI 可见企业范围 ${JSON.stringify(entIds)}\n`)

  let pass = 0
  let fail = 0
  for (const c of cases) {
    let count = 0
    if (c.tool === 'query_alarms') {
      const where: any = { enterpriseId: { in: entIds } }
      if (c.args.status) where.status = c.args.status
      if (c.args.level) where.level = c.args.level
      const r = buildDateRange(c.args)
      if (r.gte || r.lte) where.occurredAt = r
      count = await prisma.alarm.count({ where })
    } else if (c.tool === 'query_hazards') {
      const where: any = { enterpriseId: { in: entIds } }
      if (c.args.status) where.status = c.args.status
      if (c.args.level) where.level = c.args.level
      const r = buildDateRange(c.args)
      if (r.gte || r.lte) where.foundAt = r
      count = await prisma.hazard.count({ where })
    } else if (c.tool === 'query_devices') {
      const where: any = { enterpriseId: { in: entIds } }
      if (c.args.status) where.status = c.args.status
      count = await prisma.device.count({ where })
    } else {
      const where: any = { creatorOrgId: { in: entIds } }
      if (c.args.status) where.status = c.args.status
      count = await prisma.workOrder.count({ where })
    }
    const ok = count === c.expect
    ok ? pass++ : fail++
    console.log(`${ok ? '✅' : '❌'} ${c.q.padEnd(24, ' ')} 命中 ${String(count).padStart(2)} 条${ok ? '' : `（预期 ${c.expect}）`}`)
  }

  // 维度覆盖检查：确保各枚举值都有样本，AI 回答才有区分度
  console.log('\n📊 维度覆盖：')
  const dims: Array<[string, Promise<any[]>]> = [
    ['告警类型', prisma.alarm.findMany({ where: { enterpriseId: entId }, select: { type: true }, distinct: ['type'] })],
    ['告警等级', prisma.alarm.findMany({ where: { enterpriseId: entId }, select: { level: true }, distinct: ['level'] })],
    ['告警状态', prisma.alarm.findMany({ where: { enterpriseId: entId }, select: { status: true }, distinct: ['status'] })],
    ['隐患类别', prisma.hazard.findMany({ where: { enterpriseId: entId }, select: { category: true }, distinct: ['category'] })],
    ['隐患等级', prisma.hazard.findMany({ where: { enterpriseId: entId }, select: { level: true }, distinct: ['level'] })],
    ['隐患状态', prisma.hazard.findMany({ where: { enterpriseId: entId }, select: { status: true }, distinct: ['status'] })],
    ['设备类型', prisma.device.findMany({ where: { enterpriseId: entId }, select: { type: true }, distinct: ['type'] })],
    ['设备状态', prisma.device.findMany({ where: { enterpriseId: entId }, select: { status: true }, distinct: ['status'] })],
    ['工单状态', prisma.workOrder.findMany({ where: { creatorOrgId: entId }, select: { status: true }, distinct: ['status'] })],
    ['工单优先级', prisma.workOrder.findMany({ where: { creatorOrgId: entId }, select: { priority: true }, distinct: ['priority'] })],
  ]
  for (const [name, p] of dims) {
    const rows = await p
    console.log(`   ${name}：${rows.map((r: any) => Object.values(r)[0]).join('、')}`)
  }

  console.log(`\n${fail === 0 ? '🎉 全部通过' : '⚠️ 有失败项'}：通过 ${pass} / 失败 ${fail}\n`)
  if (fail > 0) process.exitCode = 1
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

main()
  .catch((e) => {
    console.error('❌ 校验失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
