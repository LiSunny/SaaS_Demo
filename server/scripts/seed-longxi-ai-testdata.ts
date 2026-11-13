/**
 * 中冶龙熙半岛 — AI 数据链测试数据补齐脚本
 *
 * 用途：为「中冶龙熙半岛」补齐 Agent 数据链（设备 / 告警 / 隐患 / 工单），
 *       使 AI 助手（小尼平安）在该企业上下文中能查到真实可筛选的数据。
 *
 * 幂等：按设备名 / 点位 / 位置 / 工单号判存在，重复执行只补不重。
 *
 * 用法：
 *   cd server && npx tsx scripts/seed-longxi-ai-testdata.ts
 *
 * 上线提醒：发布脚本只带代码不带数据，线上需单独执行一次本脚本。
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ENTERPRISE_NAME = '中冶龙熙半岛'

// ===== 时间工具 =====
// 要求：同一份数据在任意时间重复执行都落在同一绝对时刻（幂等键含时间戳），
//      同时「今天组」必须落在本地今天，才能被 AI 的「今天/最近 N 天」筛选命中。

/**
 * 确定性时间：本地今天 00:00 + N 分钟。
 *
 * 今日组统一取本地 08:00 之后的时刻：agent.service 展示时间用 toISOString()（UTC），
 * 本地 08:00 之前的数据会被显示成「昨天」，AI 说「今天」却显示昨天日期，演示观感差。
 *
 * 若脚本在凌晨执行（目标时刻尚未到来），退回今天凌晨的固定小偏移，保证「今天」
 * 仍然能查到同样条数的数据；连凌晨偏移都还没到时，才落到昨天同一时刻。
 */
function todayAt(minutes: number): Date {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
  const t = new Date(y, m, d, 0, minutes, 0, 0)
  if (t.getTime() <= now.getTime()) return t
  const fallback = new Date(y, m, d, 0, 5 + (minutes % 20), 0, 0)
  if (fallback.getTime() <= now.getTime()) return fallback
  return new Date(y, m, d - 1, 0, minutes, 0, 0)
}

/** N 天前的某个本地时刻（跨天重跑时刻保持一致，配合幂等键稳定） */
function daysAgoAt(days: number, hour: number, minute = 0): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour, minute, 0, 0)
}

/** 固定绝对时刻（用于工单，保证重复执行完全幂等） */
function fixedAt(text: string): Date {
  return new Date(text.replace(' ', 'T'))
}

// ===== 设备台账 =====

interface DeviceSeed {
  name: string
  type: string
  status: string
  location: string
}

const DEVICES: DeviceSeed[] = [
  { name: '1号楼单元门厅 烟感 01', type: '烟感', status: '在线', location: '1号楼1单元门厅' },
  { name: '1号楼电梯厅 烟感 02', type: '烟感', status: '在线', location: '1号楼电梯厅' },
  { name: '2号楼大堂 烟感 03', type: '烟感', status: '在线', location: '2号楼大堂' },
  { name: '地库 烟感 G-01', type: '烟感', status: '在线', location: '地下车库B1层' },
  { name: '充电棚 烟感 E-01', type: '烟感', status: '在线', location: '地面电动车充电棚' },
  { name: '地库 电气监控 E-01', type: '电气', status: '在线', location: '地下车库B1层配电间' },
  { name: '充电桩 电气监控 E-02', type: '电气', status: '故障', location: '地下车库B2层充电区' },
  { name: '1号楼 电气监控 E-03', type: '电气', status: '在线', location: '1号楼配电间' },
  { name: '地库出入口 摄像头 C-01', type: '摄像头', status: '在线', location: '地下车库出入口' },
  { name: '2号楼大堂 摄像头 C-02', type: '摄像头', status: '离线', location: '2号楼大堂' },
  { name: '商铺 燃气探测器 S-01', type: '燃气', status: '在线', location: '1号楼底商101' },
  { name: '消防泵房 手动报警按钮 M-01', type: '手动', status: '在线', location: '地下消防泵房' },
]

// ===== 告警（点位需与设备名一致，关联 deviceId） =====

interface AlarmSeed {
  point: string
  type: string
  level: string
  status: string
  occurredAt: Date
}

const ALARMS: AlarmSeed[] = [
  // —— 今天 ——
  { point: '充电桩 电气监控 E-02', type: '电气故障', level: '紧急', status: '未处理', occurredAt: todayAt(500) },
  { point: '商铺 燃气探测器 S-01', type: '燃气预警', level: '重要', status: '未处理', occurredAt: todayAt(580) },
  { point: '地库 烟感 G-01', type: '烟感预警', level: '一般', status: '已处理', occurredAt: todayAt(675) },
  { point: '2号楼大堂 摄像头 C-02', type: '电气故障', level: '一般', status: '未处理', occurredAt: todayAt(810) },
  // —— 昨天 ——
  { point: '充电棚 烟感 E-01', type: '火警', level: '紧急', status: '已处理', occurredAt: daysAgoAt(1, 9, 20) },
  { point: '地库 电气监控 E-01', type: '电气故障', level: '重要', status: '已处理', occurredAt: daysAgoAt(1, 11, 5) },
  { point: '1号楼 电气监控 E-03', type: '电气故障', level: '重要', status: '未处理', occurredAt: daysAgoAt(1, 15, 40) },
  { point: '1号楼单元门厅 烟感 01', type: '烟感预警', level: '一般', status: '已处理', occurredAt: daysAgoAt(1, 19, 12) },
  // —— 2~3 天前 ——
  { point: '2号楼大堂 烟感 03', type: '烟感预警', level: '一般', status: '已处理', occurredAt: daysAgoAt(2, 8, 45) },
  { point: '商铺 燃气探测器 S-01', type: '燃气预警', level: '重要', status: '已处理', occurredAt: daysAgoAt(3, 10, 30) },
  { point: '地库 烟感 G-01', type: '火警', level: '紧急', status: '已处理', occurredAt: daysAgoAt(3, 21, 8) },
  // —— 一周前 ——
  { point: '消防泵房 手动报警按钮 M-01', type: '火警', level: '紧急', status: '已处理', occurredAt: daysAgoAt(6, 14, 10) },
  { point: '1号楼电梯厅 烟感 02', type: '烟感预警', level: '一般', status: '已处理', occurredAt: daysAgoAt(7, 9, 55) },
  { point: '充电桩 电气监控 E-02', type: '电气故障', level: '重要', status: '已处理', occurredAt: daysAgoAt(7, 17, 25) },
  // —— 半个月前 ——
  { point: '地库出入口 摄像头 C-01', type: '电气故障', level: '一般', status: '已处理', occurredAt: daysAgoAt(14, 13, 40) },
  { point: '1号楼单元门厅 烟感 01', type: '烟感预警', level: '一般', status: '已处理', occurredAt: daysAgoAt(23, 16, 5) },
]

// ===== 隐患 =====

interface HazardSeed {
  location: string
  category: string
  level: string
  status: string
  foundAt: Date
  description: string
}

const HAZARDS: HazardSeed[] = [
  { location: '地下车库B2层 充电区', category: '电气安全', level: '重大', status: '未整改', foundAt: todayAt(520), description: '充电桩线路老化，2 号桩带载时外壳发烫，需立即停电检修' },
  { location: '1号楼底商 商铺厨房后厨', category: '燃气安全', level: '重大', status: '整改中', foundAt: daysAgoAt(1, 10, 20), description: '燃气软管超期未更换，阀门锈蚀' },
  { location: '2号楼消防通道 东侧', category: '消防通道', level: '重要', status: '未整改', foundAt: daysAgoAt(1, 16, 5), description: '通道堆放纸箱与自行车，净宽不足 1 米' },
  { location: '1号楼单元门厅 灭火器箱', category: '消防设施', level: '重要', status: '未整改', foundAt: daysAgoAt(2, 9, 15), description: '灭火器压力表指针在红区，年检标签已过期' },
  { location: '地下车库B1层 疏散指示灯', category: '消防设施', level: '一般', status: '整改中', foundAt: daysAgoAt(3, 14, 40), description: '3 处疏散指示灯电池失效，需更换' },
  { location: '地面充电棚 配电箱', category: '电气安全', level: '重要', status: '未整改', foundAt: daysAgoAt(4, 11, 30), description: '配电箱无防护盖，箱门闭合不严' },
  { location: '1号楼底商 商铺后厨排烟管道', category: '消防设施', level: '一般', status: '未整改', foundAt: daysAgoAt(6, 15, 55), description: '排烟管道油垢堆积，未按周期清洗' },
  { location: '地库出入口 防火卷帘', category: '消防设施', level: '重要', status: '已整改', foundAt: daysAgoAt(9, 10, 25), description: '卷帘下降卡顿，已更换电机并复测' },
  { location: '2号楼大堂 灭火器', category: '消防设施', level: '一般', status: '已整改', foundAt: daysAgoAt(12, 9, 40), description: '灭火器摆放位置被货架遮挡，已移位并重新贴标' },
  { location: '1号楼 电缆井', category: '电气安全', level: '一般', status: '已整改', foundAt: daysAgoAt(19, 14, 10), description: '桥架局部锈蚀，已做防锈处理' },
]

// ===== 工单 =====

interface OrderSeed {
  orderNo: string
  title: string
  status: string
  priority: string
  currentNodeName: string
  currentAssigneeName: string
  createdAt: Date
  closedAt?: Date
  closedBy?: string
  remark: string
}

function orderNoOf(seq: number): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `GD${y}${m}${d}${String(seq).padStart(3, '0')}`
}

const ORDERS: OrderSeed[] = [
  {
    orderNo: orderNoOf(101),
    title: '龙熙半岛 充电桩电气故障检修',
    status: 'active',
    priority: 'urgent',
    currentNodeName: '现场处置',
    currentAssigneeName: '林师傅',
    createdAt: fixedAt('2026-11-10 09:30'),
    remark: '地库B2层 2号充电桩电气故障告警，AI 转派',
  },
  {
    orderNo: orderNoOf(102),
    title: '龙熙半岛 2号楼消防通道整改',
    status: 'active',
    priority: 'high',
    currentNodeName: '现场处置',
    currentAssigneeName: '周管理',
    createdAt: daysAgoAt(1, 16, 30),
    remark: '通道堆物，AI 派发物业秩序岗',
  },
  {
    orderNo: orderNoOf(103),
    title: '龙熙半岛 商铺燃气阀门检测',
    status: 'closed',
    priority: 'normal',
    currentNodeName: '完成归档',
    currentAssigneeName: '刘工',
    createdAt: daysAgoAt(8, 10, 0),
    closedAt: daysAgoAt(5, 17, 20),
    closedBy: '刘工',
    remark: '燃气阀门年检，检测合格已闭环',
  },
]

// ===== 主流程 =====

async function main() {
  console.log(`🌱 开始为「${ENTERPRISE_NAME}」补齐 AI 数据链测试数据...`)

  const ent = await prisma.enterprise.findFirst({
    where: { name: ENTERPRISE_NAME, deletedAt: null },
  })
  if (!ent) {
    console.error(`❌ 未找到企业「${ENTERPRISE_NAME}」，请先确认企业已创建。`)
    process.exit(1)
  }
  const entId = ent.id
  console.log(`   企业 ID: ${entId}`)

  // ---- 设备 ----
  const deviceIds = new Map<string, number>()
  let deviceAdded = 0
  for (const d of DEVICES) {
    const exists = await prisma.device.findFirst({ where: { name: d.name } })
    if (exists) {
      deviceIds.set(d.name, exists.id)
      continue
    }
    const created = await prisma.device.create({
      data: { name: d.name, type: d.type, status: d.status, location: d.location, enterpriseId: entId },
    })
    deviceIds.set(d.name, created.id)
    deviceAdded++
  }
  console.log(`   设备：新增 ${deviceAdded} 台，共 ${deviceIds.size} 台`)

  // ---- 告警 ----
  // 同一设备可能多次告警，幂等键用「点位 + 发生时间」组合，不用点位单独去重
  let alarmAdded = 0
  for (const a of ALARMS) {
    const exists = await prisma.alarm.findFirst({
      where: { point: a.point, occurredAt: a.occurredAt },
    })
    if (exists) continue
    const deviceId = deviceIds.get(a.point)
    if (!deviceId) {
      console.warn(`   ⚠️ 告警「${a.point}」找不到对应设备，已跳过`)
      continue
    }
    await prisma.alarm.create({
      data: {
        point: a.point,
        type: a.type,
        level: a.level,
        status: a.status,
        occurredAt: a.occurredAt,
        enterpriseId: entId,
        deviceId,
      },
    })
    alarmAdded++
  }
  console.log(`   告警：新增 ${alarmAdded} 条`)

  // ---- 隐患 ----
  let hazardAdded = 0
  for (const h of HAZARDS) {
    const exists = await prisma.hazard.findFirst({ where: { location: h.location } })
    if (exists) continue
    await prisma.hazard.create({
      data: {
        location: h.location,
        category: h.category,
        level: h.level,
        status: h.status,
        foundAt: h.foundAt,
        description: h.description,
        enterpriseId: entId,
      },
    })
    hazardAdded++
  }
  console.log(`   隐患：新增 ${hazardAdded} 条`)

  // ---- 工单（依赖已发布的流程模板） ----
  const template = await prisma.workflowTemplate.findFirst({ where: { status: 1 } })
  if (!template) {
    console.warn('   ⚠️ 未找到执行中的流程模板，跳过工单数据')
  } else {
    const owner = await prisma.userEnterprise.findFirst({
      where: { enterpriseId: entId },
      include: { user: true },
    })
    const creatorName = owner?.user?.realName || ent.contactName || '测试运营'
    const creatorId = owner?.userId || 0
    let orderAdded = 0
    for (const o of ORDERS) {
      const exists = await prisma.workOrder.findFirst({ where: { orderNo: o.orderNo } })
      if (exists) continue
      await prisma.workOrder.create({
        data: {
          orderNo: o.orderNo,
          templateId: template.id,
          templateName: template.name,
          templateVersion: 1,
          title: o.title,
          status: o.status,
          priority: o.priority,
          currentNodeId: 'N1',
          currentNodeName: o.currentNodeName,
          currentNodeIndex: 1,
          totalNodes: template.nodeCount || 3,
          activePathNodeCount: 2,
          activePathIndex: 1,
          currentNodeType: 'assignee',
          currentAssigneeName: o.currentAssigneeName,
          creatorId,
          creatorName,
          creatorOrgId: entId,
          creatorOrgName: ent.name,
          remark: o.remark,
          closedAt: o.closedAt || null,
          closedBy: o.closedBy || null,
          createdAt: o.createdAt,
        },
      })
      orderAdded++
    }
    console.log(`   工单：新增 ${orderAdded} 条`)
  }

  // ---- 汇总 ----
  const [dCount, aCount, hCount, oCount] = await Promise.all([
    prisma.device.count({ where: { enterpriseId: entId } }),
    prisma.alarm.count({ where: { enterpriseId: entId } }),
    prisma.hazard.count({ where: { enterpriseId: entId } }),
    prisma.workOrder.count({ where: { creatorOrgId: entId } }),
  ])
  console.log(`✅ 完成。${ENTERPRISE_NAME}(id=${entId}) 当前数据量：设备 ${dCount} / 告警 ${aCount} / 隐患 ${hCount} / 工单 ${oCount}`)
}

main()
  .catch((e) => {
    console.error('❌ 执行失败：', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
