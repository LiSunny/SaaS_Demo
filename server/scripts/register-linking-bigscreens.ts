/**
 * register-linking-bigscreens.ts — 一次性注册「海港区应消联勤平台」11 条大屏记录
 *
 * 目标：把「人工智能+沿街商铺」应消联勤平台从 1 条 linking 记录拆成 11 条独立大屏：
 *   - 1 条概览（平台首页三列系统区，复用现有 id=9 更名为「平台概览」）
 *   - 10 条系统大屏（name = 各系统名，与 src/views/bigscreen/linking-subsystem/data/modules.ts 一一对应）
 *
 * 幂等：同名（@@unique(name)）已存在则跳过，可重复执行。
 * 运行：cd server && npx tsx scripts/register-linking-bigscreens.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// 10 个子系统（name 必须与前端 MODULES 的 title 一致，前端用 name.includes(title) 解析）
// sortOrder: 1..10（概览为 0），大屏管理列表按 sortOrder 升序排列
const SYSTEMS = [
  { sortOrder: 1, name: '商铺主体责任系统', desc: '责任显性化 · 主动履责。以区域维度统揽商业街与店铺履责情况，含商户责任公示、隐患自查、履责失责档案。' },
  { sortOrder: 2, name: '智能感知告警系统', desc: '设备事件 · 隐患排查。按商铺维度查看烟感/燃气告警事件与排查隐患，支持完整处置时间线。' },
  { sortOrder: 3, name: '设备运行监测系统', desc: '在线态势 · 全生命周期。实时掌握区域内商铺接入探测设备在线/离线/故障情况与设备档案、运维记录。' },
  { sortOrder: 4, name: '商铺数字档案系统', desc: '一店一码 · 动态更新。监管人员可查看商铺基础信息、设备状态、履责记录与隐患情况。' },
  { sortOrder: 5, name: '设备生命周期系统', desc: '按店归集 · 一机一档。以店铺维度查看设备清单，每台设备建立完整台账信息。' },
  { sortOrder: 6, name: '隐患排查治理系统', desc: '按商户维度 · 处理进度跟踪。查看上报隐患信息及处理进度，隐患从上报到闭环全程可追溯。' },
  { sortOrder: 7, name: '联勤协同联动系统', desc: '公告下达 · 阅读留痕 · 反馈收集。监管公告一键下达，企业阅读、反馈全程可视。' },
  { sortOrder: 8, name: '消控联网监控系统', desc: '联网监控 · 远程可视。辖区消控室统一接入联网监控，运行状态远程可视、值班在岗监测、异常实时告警。' },
  { sortOrder: 9, name: '动火作业全流程管控', desc: '四维防控 · 全流程闭环。聚焦沿街商铺临时动火、施工动火，构建线上备案、实时核验、动态监测体系。' },
  { sortOrder: 10, name: '应急预案联动系统', desc: '预案调度 · 多方联动。告警触发后联动预案、力量与处置记录，串联报警—预案—调度—处置—复盘全环节。' },
]

const OVERVIEW = { sortOrder: 0, name: '平台概览', desc: '海港区"人工智能+沿街商铺"应消联勤平台首页。以事前·预防 / 事中·响应 / 事后·复盘三列统揽全部子系统。' }

async function main() {
  // ===== 概览：复用现有 id=9（海港区联勤大屏导航）⇒ 更名为「平台概览」 =====
  const overview = await db.bigscreen.findUnique({ where: { id: 9 } })
  if (overview) {
    await db.bigscreen.update({
      where: { id: 9 },
      data: { name: OVERVIEW.name, type: 'linking', scenario: '街道治理', description: OVERVIEW.desc, status: 1, sortOrder: OVERVIEW.sortOrder },
    })
    console.log(`OVERVIEW updated id=9 -> ${OVERVIEW.name}`)
  } else {
    const o = await db.bigscreen.create({
      data: { name: OVERVIEW.name, type: 'linking', scenario: '街道治理', description: OVERVIEW.desc, tags: JSON.stringify(['街道治理', '应消联勤']), status: 1, sortOrder: OVERVIEW.sortOrder, createdBy: 20 },
    })
    console.log(`OVERVIEW created id=${o.id} -> ${OVERVIEW.name}`)
  }

  // ===== 10 个子系统 =====
  for (const s of SYSTEMS) {
    const ex = await db.bigscreen.findUnique({ where: { name: s.name } })
    if (ex) {
      console.log(`EXISTS   ${s.name} (id=${ex.id})`)
      continue
    }
    const r = await db.bigscreen.create({
      data: { name: s.name, type: 'linking', scenario: '街道治理', description: s.desc, tags: JSON.stringify(['街道治理', '应消联勤']), status: 1, sortOrder: s.sortOrder, createdBy: 20 },
    })
    console.log(`CREATED  ${s.name} (id=${r.id})`)
  }

  const all = await db.bigscreen.findMany({ where: { type: 'linking' }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, sortOrder: true } })
  console.log('\n=== linking 记录汇总 ===')
  all.forEach(x => console.log(`  id=${x.id} sort=${x.sortOrder} ${x.name}`))
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await db.$disconnect()
  process.exit(1)
})
