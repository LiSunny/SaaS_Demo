/**
 * 种子数据
 * 后续从前端 Mock DAO 移植具体业务数据。
 * 当前仅包含登录所需的基础数据。
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充种子数据...')

  // 阳光物业（示例物业方）
  const property = await prisma.enterprise.upsert({
    where: { code: 'DEMO001' },
    update: {},
    create: {
      name: '阳光物业',
      code: 'DEMO001',
      dimALevel1: 'social_unit',
      dimALevel2: 'space_manager',
      dimALevel3: 'property_mgr',
      dimB: '商业综合体',
      dimCCode: 'C01',
      dimCName: '消防重点单位',
      contactName: '周志远',
      contactPhone: '13800001111',
      status: 1,
      region: '杭州市',
      address: '杭州市拱墅区阳光商业街88号',
      creatorName: '系统初始化',
    },
  })
  console.log(`  ✅ 示例企业: ${property.name}`)

  // 蓝盾消防（示例服务方）
  const service = await prisma.enterprise.upsert({
    where: { code: 'DEMO002' },
    update: {},
    create: {
      name: '蓝盾消防',
      code: 'DEMO002',
      dimALevel1: 'service_unit',
      dimALevel3: 'fire_tech_service',
      dimB: '消防技术服务',
      dimCCode: 'C02',
      dimCName: '消防维保检测',
      contactName: '刘建华',
      contactPhone: '13800002222',
      status: 1,
      region: '杭州市',
      address: '杭州市滨江区蓝盾科技园',
      creatorName: '系统初始化',
    },
  })
  console.log(`  ✅ 示例企业: ${service.name}`)

  // 应急管理局（示例监管方）
  const supervisor = await prisma.enterprise.upsert({
    where: { code: 'DEMO003' },
    update: {},
    create: {
      name: '拱墅区应急管理局',
      code: 'DEMO003',
      dimALevel1: 'supervisor',
      dimALevel2: 'space_manager',
      dimALevel3: 'emergency_mgmt',
      dimB: '政府监管',
      dimCCode: 'C03',
      dimCName: '应急管理部门',
      contactName: '陈浩然',
      contactPhone: '13800003333',
      status: 1,
      region: '杭州市',
      address: '杭州市拱墅区政府大楼',
      creatorName: '系统初始化',
    },
  })
  console.log(`  ✅ 示例企业: ${supervisor.name}`)

  // 平台管理员账号由服务启动时的 ensureDefaultAdmin() 创建（systemRole=platform-ops）
  console.log('  ℹ️  用户账号由服务启动时的 ensureDefaultAdmin() 创建')

  // 体验账号（与前端 Login.vue demoAccounts 对应，供 E2E / 手动体验使用）
  // 注意：13800000000 已被 ensureDefaultAdmin 占用（普通用户 demo 与之冲突，故不在此 seed）
  const demoUsers = [
    { phone: '13800000001', realName: '测试运营', password: '3xkxr4', systemRole: 'platform-ops' },
  ]
  for (const u of demoUsers) {
    const hashed = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { phone: u.phone },
      update: {},
      create: {
        phone: u.phone,
        realName: u.realName,
        password: hashed,
        status: 1,
        systemRole: u.systemRole,
      },
    })
    console.log(`  ✅ 体验账号: ${u.realName} (${u.phone}, ${u.systemRole})`)
  }

  // ===== 平台内置岗位（9 个） =====
  const defaultPermissions = JSON.stringify({
    moduleAccess: [],
    dataOperations: {},
    managementOperations: [],
  })

  const positions = [
    { name: '消防安全责任人', key: 'platform:fire-safety-responsible', description: '法定负责人，对单位消防安全全面负责' },
    { name: '消防安全管理人', key: 'platform:fire-safety-manager', description: '日常消防管理，发起工单，组织验收' },
    { name: '消控值班员', key: 'platform:duty-officer', description: '告警核实，紧急工单发起，24小时值守' },
    { name: '项目负责人', key: 'platform:project-lead', description: '对接甲方，SLA 第一责任人，团队工单全貌' },
    { name: '技术负责人', key: 'platform:tech-lead', description: '技术把关，审核处置结果，强制改派' },
    { name: '维保工程师', key: 'platform:maintenance-engineer', description: '接单，现场处置，拍照留痕，转单' },
    { name: '安全监管员', key: 'platform:safety-supervisor', description: '督办超时工单，核查验收，生成监管报告' },
    { name: '企业管理员', key: 'platform:org-admin', description: '通用企业管理员，新建企业时自动分配' },
    { name: '平台管理员', key: 'platform:platform-admin', description: '租户管理，流程模板配置，全局参数' },
  ]

  for (const p of positions) {
    await prisma.position.upsert({
      where: { key: p.key },
      update: {},
      create: {
        name: p.name,
        key: p.key,
        description: p.description,
        permissions: defaultPermissions,
        isBuiltin: 1,
        status: 1,
      },
    })
    console.log(`  ✅ 岗位: ${p.name}`)
  }

  console.log('🌱 种子数据填充完成')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
