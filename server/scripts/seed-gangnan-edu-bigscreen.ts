/**
 * 港南教育局平安校园监管大屏 — 种子脚本
 *
 * 背景：教育局大屏页面 `/landing/campus-monitor`（CampusMonitorBigscreen.vue，
 *       页头「港南教育局"人工智能+平安校园"监管平台」）代码已就绪，但库里没有任何
 *       type=campus-monitor 的大屏记录，工作台顶栏的大屏入口选不到它。
 *       本脚本补齐：企业 → 账号 → 大屏记录 → 授权 四步。
 *
 * 产出：
 *   企业   港南教育局（supervisor / groups=[regulator]）
 *   账号   13400001234 / admin123!@#（企业管理员，positions=platform:org-admin）
 *   大屏   港南教育局平安校园监管大屏（type=campus-monitor → /landing/campus-monitor）
 *   授权   上述大屏授权给港南教育局，isDefault=1
 *
 * 幂等：企业按 name、账号按 phone、大屏按 name、授权按 (bigscreenId, enterpriseId) 判存，
 *       已存在则跳过，可重复执行。
 *
 * 用法：
 *   cd server && npx tsx scripts/seed-gangnan-edu-bigscreen.ts
 *
 * 上线提醒：发布脚本只带代码不带数据，线上需单独执行一次本脚本。
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ===== 目标数据 =====
const ENTERPRISE_NAME = '港南教育局'
const USER_PHONE = '13400001234'
const USER_NAME = '港南教育局管理员'
const USER_PASSWORD = 'admin123!@#'
const BIGSCREEN_NAME = '港南教育局平安校园监管大屏'
const BIGSCREEN_TYPE = 'campus-monitor'

async function main() {
  console.log('\n🌱 [教育局大屏种子] 开始…\n')

  // ── 1. 企业：港南教育局 ──
  let enterprise = await prisma.enterprise.findFirst({ where: { name: ENTERPRISE_NAME } })
  if (enterprise) {
    console.log(`  ✅ 企业「${enterprise.name}」已存在（id=${enterprise.id}）`)
  } else {
    enterprise = await prisma.enterprise.create({
      data: {
        name: ENTERPRISE_NAME,
        code: `QY${Date.now()}`,
        // 教育局是监管单位：对齐「港南应急局 / 海港应急局 / 泉州市应急局」的监管属性
        dimALevel1: 'supervisor',
        groups: JSON.stringify(['regulator']),
        region: '秦皇岛市海港区',
        status: 1,
        creatorName: 'seed-gangnan-edu-bigscreen',
      },
    })
    console.log(`  ✅ 新建企业「${enterprise.name}」（id=${enterprise.id}，code=${enterprise.code}）`)
  }

  // ── 2. 账号：企业管理员 ──
  let user = await prisma.user.findUnique({ where: { phone: USER_PHONE } })
  if (user) {
    console.log(`  ✅ 账号 ${USER_PHONE} 已存在（id=${user.id}）`)
  } else {
    user = await prisma.user.create({
      data: {
        phone: USER_PHONE,
        realName: USER_NAME,
        password: bcrypt.hashSync(USER_PASSWORD, 10),
        status: 1,
      },
    })
    console.log(`  ✅ 新建账号 ${USER_PHONE}「${USER_NAME}」（id=${user.id}）`)
  }

  // 账号 → 企业关联（企业内成员）
  const ue = await prisma.userEnterprise.findUnique({
    where: { userId_enterpriseId: { userId: user.id, enterpriseId: enterprise.id } },
  })
  if (ue) {
    console.log(`  ✅ 账号已归属企业「${enterprise.name}」`)
  } else {
    await prisma.userEnterprise.create({
      data: {
        userId: user.id,
        enterpriseId: enterprise.id,
        status: 1,
        positions: JSON.stringify(['platform:org-admin']),
      },
    })
    console.log(`  ✅ 账号已关联企业「${enterprise.name}」（positions=platform:org-admin）`)
  }

  // ── 3. 大屏记录 ──
  let bigscreen = await prisma.bigscreen.findFirst({ where: { name: BIGSCREEN_NAME } })
  if (bigscreen) {
    console.log(`  ✅ 大屏「${bigscreen.name}」已存在（id=${bigscreen.id}，type=${bigscreen.type}）`)
  } else {
    bigscreen = await prisma.bigscreen.create({
      data: {
        name: BIGSCREEN_NAME,
        type: BIGSCREEN_TYPE,
        scenario: '政府区域监管',
        description: '港南教育局“人工智能+平安校园”监管平台（/landing/campus-monitor）',
        tags: JSON.stringify(['教育局', '平安校园']),
        status: 1,
        sortOrder: 0,
        createdBy: user.id,
      },
    })
    console.log(`  ✅ 新建大屏「${bigscreen.name}」（id=${bigscreen.id}，type=${bigscreen.type}）`)
  }

  // ── 4. 授权：把大屏挂给该企业 ──
  const rel = await prisma.bigscreenEnterprise.findUnique({
    where: { bigscreenId_enterpriseId: { bigscreenId: bigscreen.id, enterpriseId: enterprise.id } },
  })
  if (rel) {
    console.log(`  ✅ 大屏已授权给企业「${enterprise.name}」`)
  } else {
    await prisma.bigscreenEnterprise.create({
      data: {
        bigscreenId: bigscreen.id,
        enterpriseId: enterprise.id,
        isDefault: true,
        status: 1,
      },
    })
    console.log(`  ✅ 大屏已授权给企业「${enterprise.name}」（isDefault=1）`)
  }

  // ── 5. 校验：该账号现在能看到哪些大屏 ──
  const screens = await prisma.bigscreenEnterprise.findMany({
    where: { enterpriseId: enterprise.id, status: 1, bigscreen: { status: 1 } },
    include: { bigscreen: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
  console.log(`\n📋 账号 ${USER_PHONE} 可见大屏（${screens.length} 个）：`)
  for (const s of screens) {
    console.log(`    id=${s.bigscreenId}  ${s.bigscreen.name}  →  type=${s.bigscreen.type}`)
  }

  console.log(`\n  🔑 登录：${USER_PHONE} / ${USER_PASSWORD}（企业「${enterprise.name}」）\n`)
}

main()
  .catch((err) => {
    console.error('种子失败：', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
