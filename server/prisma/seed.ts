/**
 * 种子数据
 * 后续从前端 Mock DAO 移植具体业务数据。
 * 当前仅包含登录所需的基础数据。
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充种子数据...')

  // 平台运营方企业
  const platform = await prisma.enterprise.upsert({
    where: { code: 'PLATFORM' },
    update: {},
    create: {
      name: '平台运营方',
      code: 'PLATFORM',
      dimALevel1: 'platform_operator',
      contactName: '赵启明',
      contactPhone: '13800000000',
      status: 1,
      region: '杭州市',
      address: '杭州市西湖区',
      creatorName: '系统初始化',
    },
  })
  console.log(`  ✅ 平台企业: ${platform.name}`)

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

  // 默认管理员（密码在 auth.service.ts 的 ensureDefaultAdmin() 中通过 bcrypt 处理）
  // 此处 seed 不创建用户，由启动时的 ensureDefaultAdmin() 统一处理
  console.log('  ℹ️  用户账号由服务启动时的 ensureDefaultAdmin() 创建')

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
