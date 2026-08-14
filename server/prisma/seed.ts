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
      groups: JSON.stringify(['unit']),
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
      groups: JSON.stringify(['service']),
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
      groups: JSON.stringify(['regulator']),
    },
  })
  console.log(`  ✅ 示例企业: ${supervisor.name}`)

  console.log('  ℹ️  用户账号由服务启动时的 ensureDefaultAdmin() 创建')

  // ================================================================
  // 测试数据（数据链：企业 → 设备 → 告警/隐患）
  // 幂等：按名称 findFirst，不存在才创建；设备/告警/隐患同理
  // 场景账号对应：海港应急局(13000000001) / 新思维高级中学(13100001234)
  //             安信智慧消防运营(18800001234) / 蓝盾消防(13900002222)
  // ================================================================

  const now = Date.now()
  const hoursAgo = (h: number) => new Date(now - h * 3600_000)
  const daysAgo = (d: number) => new Date(now - d * 86400_000)

  async function ensureEnterprise(name: string, extra: Record<string, any> = {}) {
    const exists = await prisma.enterprise.findFirst({ where: { name } })
    if (exists) return exists
    return prisma.enterprise.create({
      data: {
        name,
        code: `TEST_${now}_${Math.random().toString(36).slice(2, 6)}`,
        dimALevel1: 'social_unit',
        groups: JSON.stringify(['unit']),
        region: '杭州市',
        status: 1,
        creatorName: 'seed',
        ...extra,
      },
    })
  }

  async function ensureRelation(type: string, enterpriseId: number, relatedId: number, extra: Record<string, any> = {}) {
    const exists = await prisma.enterpriseRelation.findFirst({ where: { type, enterpriseId, relatedId } })
    if (exists) return exists
    const [e, r] = await Promise.all([
      prisma.enterprise.findUnique({ where: { id: enterpriseId } }),
      prisma.enterprise.findUnique({ where: { id: relatedId } }),
    ])
    return prisma.enterpriseRelation.create({
      data: { type, enterpriseId, enterpriseName: e?.name || '', relatedId, relatedName: r?.name || '', ...extra },
    })
  }

  async function ensureDevice(name: string, data: { type: string; status?: string; location?: string; enterpriseId: number }) {
    const exists = await prisma.device.findFirst({ where: { name } })
    if (exists) return exists
    return prisma.device.create({ data: { name, type: data.type, status: data.status || '在线', location: data.location || '', enterpriseId: data.enterpriseId } })
  }

  async function ensureAlarm(point: string, data: { deviceId: number; type: string; level: string; status?: string; occurredAt: Date; enterpriseId: number }) {
    const exists = await prisma.alarm.findFirst({ where: { point } })
    if (exists) return exists
    return prisma.alarm.create({ data: { point, ...data } })
  }

  async function ensureHazard(location: string, data: { category: string; level: string; status?: string; foundAt: Date; description?: string; enterpriseId: number }) {
    const exists = await prisma.hazard.findFirst({ where: { location } })
    if (exists) return exists
    return prisma.hazard.create({ data: { location, ...data } })
  }

  // ---- 企业定位（已有则复用，幂等；顶部已定义 property/service 直接复用） ----
  const school = await ensureEnterprise('新思维高级中学', { dimALevel2: 'school', groups: JSON.stringify(['unit']) })
  const wood = await ensureEnterprise('韧性木业', { dimB: '工贸企业', groups: JSON.stringify(['unit']) })
  const shop1 = await ensureEnterprise('商铺1', { groups: JSON.stringify(['unit']) })
  const street1 = await ensureEnterprise('商业街1', { dimB: '商业综合体', groups: JSON.stringify(['unit']) })
  const superv = await ensureEnterprise('海港应急局', { dimALevel1: 'supervisor', groups: JSON.stringify(['regulator']) })
  const operatorEnt = await ensureEnterprise('安信智慧消防运营有限公司', { groups: JSON.stringify(['operator']) })

  console.log('  ✅ 测试企业定位完成')

  // ---- 企业关系（对齐现有体系：partner + role 反向表达 / subordinate 上级挂下级） ----
  // 监管辖区：海港应急局 ← my_supervisor（商业街1 已有，补齐韧性木业/新思维中学/阳光物业）
  await ensureRelation('partner', wood.id, superv.id, { role: 'my_supervisor/emergency_mgmt', roleLabel: '我的监管方>应急管理部门' })
  await ensureRelation('partner', school.id, superv.id, { role: 'my_supervisor/emergency_mgmt', roleLabel: '我的监管方>应急管理部门' })
  await ensureRelation('partner', property.id, superv.id, { role: 'my_supervisor/emergency_mgmt', roleLabel: '我的监管方>应急管理部门' })
  // 管理方下级：商业街1 → 商户（商铺1 已有 my_manager）；阳光物业 → 商铺1
  await ensureRelation('partner', shop1.id, street1.id, { role: 'my_manager/space_manager/business_street', roleLabel: '我的管理方>商业街' })
  await ensureRelation('partner', shop1.id, property.id, { role: 'my_manager/space_manager/property', roleLabel: '我的管理方>物业' })
  // 服务授权：阳光物业/商业街1 授权蓝盾消防（partner + authUnits）
  await ensureRelation('partner', property.id, service.id, { role: 'my_service/fire_tech', roleLabel: '我的服务机构>消防维保', authUnits: JSON.stringify([property.id]) })
  await ensureRelation('partner', street1.id, service.id, { role: 'my_service/fire_tech', roleLabel: '我的服务机构>消防维保', authUnits: JSON.stringify([street1.id, shop1.id]) })
  // 运营授权：安信智慧消防运营 ← my_operator（阳光物业/商业街1）
  await ensureRelation('partner', property.id, operatorEnt.id, { role: 'my_operator', roleLabel: '我的运营商', authUnits: JSON.stringify([property.id]) })
  await ensureRelation('partner', street1.id, operatorEnt.id, { role: 'my_operator', roleLabel: '我的运营商', authUnits: JSON.stringify([street1.id, shop1.id]) })
  // 上级主动挂下级（subordinate 体系）：海港应急局挂韧性木业/新思维中学为下级
  await ensureRelation('subordinate', superv.id, wood.id)
  await ensureRelation('subordinate', superv.id, school.id)
  await ensureRelation('subordinate', superv.id, property.id)

  console.log('  ✅ 企业关系填充完成')

  // ---- S2 管理方测试账号（本企业 + 下级；密码统一 admin123!@#） ----
  async function ensureUser(phone: string, data: { realName: string; enterpriseId: number; positions?: string[] }) {
    const exists = await prisma.user.findUnique({ where: { phone } })
    if (exists) return exists
    const user = await prisma.user.create({
      data: {
        phone,
        realName: data.realName,
        password: bcrypt.hashSync('admin123!@#', 10),
        status: 1,
      },
    })
    await prisma.userEnterprise.create({
      data: {
        userId: user.id,
        enterpriseId: data.enterpriseId,
        status: 1,
        positions: JSON.stringify(data.positions || ['platform:org-admin']),
      },
    })
    return user
  }

  await ensureUser('13300001111', { realName: '周志远', enterpriseId: property.id }) // 阳光物业（物业方）
  await ensureUser('13300002222', { realName: '刘伟', enterpriseId: street1.id })    // 商业街1（商业街管理方）
  console.log('  ✅ S2 管理方测试账号: 阳光物业(13300001111) / 商业街1(13300002222)')

  // ---- 设备 / 告警 / 隐患 ----
  // 新思维高级中学（S1 社会单位）
  const d1 = await ensureDevice('教学楼烟感 A-101', { type: '烟感', status: '在线', location: '教学楼 1F', enterpriseId: school.id })
  const d2 = await ensureDevice('食堂电气监控 B-03', { type: '电气', status: '在线', location: '食堂后厨', enterpriseId: school.id })
  const d3 = await ensureDevice('宿舍楼烟感 C-207', { type: '烟感', status: '离线', location: '宿舍楼', enterpriseId: school.id })
  await ensureAlarm('教学楼烟感 A-101', { deviceId: d1.id, type: '火警', level: '紧急', status: '未处理', occurredAt: hoursAgo(2), enterpriseId: school.id })
  await ensureAlarm('食堂电气监控 B-03', { deviceId: d2.id, type: '电气故障', level: '重要', status: '未处理', occurredAt: hoursAgo(5), enterpriseId: school.id })
  await ensureAlarm('宿舍楼烟感 C-207', { deviceId: d3.id, type: '烟感预警', level: '一般', status: '已处理', occurredAt: daysAgo(1), enterpriseId: school.id })
  await ensureHazard('教学楼 1F 灭火器箱', { category: '消防设施', level: '一般', status: '未整改', foundAt: daysAgo(2), enterpriseId: school.id })
  await ensureHazard('宿舍楼 消防通道', { category: '消防通道', level: '重大', status: '未整改', foundAt: daysAgo(4), enterpriseId: school.id })

  // 韧性木业
  const d4 = await ensureDevice('车间烟感 01', { type: '烟感', status: '在线', location: '生产车间', enterpriseId: wood.id })
  await ensureAlarm('车间烟感 01', { deviceId: d4.id, type: '火警', level: '紧急', status: '未处理', occurredAt: hoursAgo(3), enterpriseId: wood.id })
  await ensureHazard('车间电气箱', { category: '电气安全', level: '重要', status: '未整改', foundAt: daysAgo(3), enterpriseId: wood.id })

  // 商业街1 / 商铺1（S2 管理方场景）
  const d5 = await ensureDevice('商业街1号铺 摄像头 01', { type: '摄像头', status: '在线', location: '商业街 1 号铺', enterpriseId: street1.id })
  const d6 = await ensureDevice('商铺1 燃气探测器 01', { type: '燃气', status: '离线', location: '商铺 1', enterpriseId: shop1.id })
  await ensureAlarm('商业街1号铺 摄像头 01', { deviceId: d5.id, type: '电气故障', level: '重要', status: '未处理', occurredAt: hoursAgo(6), enterpriseId: street1.id })
  await ensureAlarm('商铺1 燃气探测器 01', { deviceId: d6.id, type: '燃气预警', level: '一般', status: '未处理', occurredAt: hoursAgo(8), enterpriseId: shop1.id })
  await ensureHazard('商业街1号铺 燃气阀', { category: '燃气安全', level: '重大', status: '整改中', foundAt: daysAgo(1), enterpriseId: street1.id })

  // 阳光物业
  const d7 = await ensureDevice('物业大楼 烟感 01', { type: '烟感', status: '在线', location: '物业大楼 3F', enterpriseId: property.id })
  await ensureAlarm('物业大楼 烟感 01', { deviceId: d7.id, type: '烟感预警', level: '一般', status: '已处理', occurredAt: daysAgo(1), enterpriseId: property.id })
  await ensureHazard('物业大楼 灭火器过期', { category: '消防设施', level: '一般', status: '未整改', foundAt: daysAgo(5), enterpriseId: property.id })

  console.log('  ✅ 设备/告警/隐患测试数据填充完成')

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
