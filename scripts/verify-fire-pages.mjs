/**
 * 消防系统监测页 · 渲染验证脚本
 *
 * 用法：node scripts/verify-fire-pages.mjs [baseURL]
 *
 * 消防水系统监测页（垂直三段：核心数据 / 组态 / 报警记录）与气体灭火、防排烟两页
 * （旧版点位长列表）结构不同，按 kind 分支断言。
 *
 * 计数断言原则（与 e2e/specs/scene-config.spec.ts 一致）：
 * 页面自己声明的数字互相校验，不写死总数。
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:5599'
const OUT = '/tmp/fire-shots'
const DOC_OUT = path.join(process.cwd(), 'docs/screenshots/fire-water-monitor')
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(DOC_OUT, { recursive: true })

const PAGES = [
  { path: '/device-facility/monitor/fire-water', name: '01-消防水系统监测', kind: 'firewater' },
  { path: '/device-facility/monitor/fire-gas', name: '02-气体灭火系统', kind: 'legacy' },
  { path: '/device-facility/monitor/fire-smoke', name: '03-消防防排烟系统', kind: 'legacy' },
]

const errors = []
const failures = []
/**
 * 应用外壳噪声：脚本注入的是假 token，企业切换器（DefaultLayout）必然 401。
 * 这类报错不属于页面自身，单独归类，不计入页面错误。
 */
const shellNoise = []
const SHELL_401_PATH = '/api/admin/users/me/enterprises'
let shellOnly401 = true

function check(cond, message) {
  if (!cond) failures.push(message)
  return cond
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })

// 注入登录态，跳过路由守卫
await ctx.addInitScript(() => {
  localStorage.setItem('auth_token', 'verify-token')
})

const page = await ctx.newPage()
page.on('console', m => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`)
})
page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`))
page.on('response', r => {
  if (r.status() === 401 && !r.url().includes(SHELL_401_PATH)) shellOnly401 = false
})

// ===== 消防水系统监测页（统计区常驻 + 三视图切换） =====

await page.goto(`${BASE}/device-facility/monitor/fire-water`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const fwTitle = await page.locator('.fwm__title').textContent().catch(() => null)
const fwTabs = await page.locator('.fw-tabs__item').allTextContents()
const fwCards = await page.locator('.fw-card').count()
const fwCardData = await page.locator('.fw-card').evaluateAll(nodes =>
  nodes.map(n => ({
    label: n.querySelector('.fw-card__label')?.textContent?.trim() ?? '',
    num: n.querySelector('.fw-card__num')?.textContent?.trim() ?? '',
    unit: n.querySelector('.fw-card__unit')?.textContent?.trim() ?? '',
    hint: n.getAttribute('title') ?? '',
    legend: [...n.querySelectorAll('.fw-card__legend-item')].map(li => ({
      label: li.querySelector('.fw-card__legend-key')?.textContent?.trim() ?? '',
      value: li.querySelector('.fw-card__legend-value')?.textContent?.trim() ?? '',
    })),
  })),
)
// 组态三层结构：底图层（连线 + 位图）/ 文本层（数值 + 交互）/ 动画层（流动光带）
const fwNodes = await page.locator('.fw-scene__svg--base .fw-scene__node').count()
const fwTextNodes = await page.locator('.fw-scene__svg--text .fw-scene__node').count()
const fwEdges = await page.locator('.fw-scene__svg--base .fw-edge').count()

// 页面级垂直滚动：设计稿要求整页在窗口内展示
const vScroll = await page.evaluate(() => {
  const mc = document.querySelector('main.main-content')
  return mc ? mc.scrollHeight - mc.clientHeight : document.documentElement.scrollHeight - document.documentElement.clientHeight
})

// 位图是否全部加载成功（0 个 404 / 0 个解码失败）
// 位图只在底图层：文本层与动画层含位图会让每次刷新重栅格化整张 SVG
const imgState = await page.evaluate(() =>
  [...document.querySelectorAll('.fw-scene__svg--base image')].map(im => ({
    href: im.getAttribute('href'),
    ok: im.getBoundingClientRect().width > 0,
  })),
)

// 横向滚动
const hScroll = await page.evaluate(() => {
  const mc = document.querySelector('main.main-content')
  return mc ? mc.scrollWidth - mc.clientWidth : document.documentElement.scrollWidth - document.documentElement.clientWidth
})

console.log('\n=== 01-消防水系统监测 (/device-facility/monitor/fire-water) ===')
console.log(`  标题: ${fwTitle}`)
console.log(`  视图切换: ${fwTabs.join(' → ')}`)
console.log(`  统计卡: ${fwCards} 个`)
fwCardData.forEach(c =>
  console.log(
    `    · ${c.label}: ${c.num} ${c.unit} | ${c.legend.map(l => `${l.label} ${l.value}`).join(' / ')} | ${c.hint}`,
  ),
)
console.log(`  组态: 底图 ${fwNodes} 个图元 / 文本 ${fwTextNodes} 个, ${fwEdges} 条连线, 位图 ${imgState.length} 张`)
console.log(`  横向滚动溢出: ${hScroll}px | 垂直滚动溢出: ${vScroll}px`)

check(fwTitle === '消防水系统', `消防水页标题应为「消防水系统」，实际「${fwTitle}」`)
check(
  fwTabs.length === 3 && fwTabs[0] === '系统总览' && fwTabs[1] === '报警记录' && fwTabs[2] === '设备台帐',
  `消防水页视图切换应为 系统总览 → 报警记录 → 设备台帐，实际「${fwTabs.join('/')}」`,
)
check(fwCards === 4, `统计卡应为 4 张，实际 ${fwCards}`)
check(vScroll <= 1, `页面出现垂直滚动，溢出 ${vScroll}px`)

// 统计卡分项必须自洽（页面自身声明的数字互相校验）
const totalCard = fwCardData.find(c => c.label === '设备总数')
check(!!totalCard, '缺少「设备总数」统计卡')
const totalNum = Number(totalCard?.num ?? 0)
const hostNum = Number(totalCard?.legend?.[0]?.value ?? 0)
const deviceNum = Number(totalCard?.legend?.[1]?.value ?? 0)
check(hostNum + deviceNum === totalNum, `设备总数 ${totalNum} ≠ 主机 ${hostNum} + 器件 ${deviceNum}`)

const onlineCard = fwCardData.find(c => c.label === '设备在线率')
const onlinePct = Number(onlineCard?.num ?? 0)
const offlineNum = Number(onlineCard?.legend?.[0]?.value ?? 0)
const onlineNum = Number(onlineCard?.legend?.[1]?.value ?? 0)
check(offlineNum + onlineNum === totalNum, `在线率分项 ${offlineNum} + ${onlineNum} ≠ 设备总数 ${totalNum}`)
check(
  Math.abs((onlineNum / totalNum) * 100 - onlinePct) < 0.01,
  `在线率 ${onlinePct}% 与分项 ${onlineNum}/${totalNum} 不符`,
)

const faultCard = fwCardData.find(c => c.label === '设备故障率')
const faultPct = Number(faultCard?.num ?? 0)
const faultNum = Number(faultCard?.legend?.[0]?.value ?? 0)
check(
  Math.abs((faultNum / totalNum) * 100 - faultPct) < 0.01,
  `故障率 ${faultPct}% 与分项 ${faultNum}/${totalNum} 不符`,
)

const warnCard = fwCardData.find(c => c.label === '预警设备')
const warnNum = Number(warnCard?.num ?? 0)
check(
  Number(warnCard?.legend?.[0]?.value ?? -1) === warnNum,
  `预警设备主值 ${warnNum} 与分项 ${warnCard?.legend?.[0]?.value} 不符`,
)

// 卡片自身声明的分母必须与实际下钻点位一致
async function drillCard(label) {
  const card = page.locator('.fw-card', { hasText: label }).first()
  const hint = (await card.getAttribute('title')) ?? ''
  const declaredCount = Number(hint.match(/=\s*(\d+)\s*台/)?.[1] ?? 0)
  await card.click()
  await page.waitForTimeout(700)
  const rows = await page.locator('.fwd__list .pr').count()
  const meta = (await page.locator('.fwd__meta').textContent().catch(() => ''))?.replace(/\s+/g, ' ').trim() ?? ''
  const range = (await page.locator('.fwd__range').textContent().catch(() => ''))?.replace(/\s+/g, ' ').trim() ?? ''
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  const metaCount = Number(meta.match(/(\d+)\s*个点位/)?.[1])
  console.log(`  卡片「${label}」声明 ${declaredCount} 台 → 抽屉声明 ${metaCount} 个，本页 ${rows} 行（${range}）`)
  check(declaredCount > 0 && metaCount === declaredCount, `卡片「${label}」声明 ${declaredCount} 与抽屉声明 ${metaCount} 不一致`)
  check(rows === Math.min(declaredCount, 100), `卡片「${label}」抽屉当前页 ${rows} 行与分页上限不一致`)
}

await drillCard('设备总数')

// 报警记录视图（切 tab）
await page.locator('.fw-tabs__item', { hasText: '报警记录' }).click()
await page.waitForTimeout(600)
const fwAlarmRows = await page.locator('.fwat tbody tr').count()
const fwAlarmCols = await page.locator('.fwat .fi-th').allTextContents()
console.log(`  报警记录: ${fwAlarmRows} 行 | 列 ${fwAlarmCols.map(c => c.trim()).join(' / ')}`)
check(fwAlarmRows > 0, '报警记录表为空')
for (const col of ['事件类型', '事件内容', '设备类型', '设备编码', '安装位置', '上报时间', '操作']) {
  check(fwAlarmCols.some(c => c.trim() === col), `报警记录缺列「${col}」`)
}

// 设备台帐视图（切 tab）
await page.locator('.fw-tabs__item', { hasText: '设备台帐' }).click()
await page.waitForTimeout(600)
const fwLedgerRows = await page.locator('.fwlt tbody tr').count()
const fwLedgerCols = await page.locator('.fwlt .fi-th').allTextContents()
console.log(`  设备台帐: ${fwLedgerRows} 行 | 列 ${fwLedgerCols.map(c => c.trim()).join(' / ')}`)
check(fwLedgerRows > 0, '设备台帐表为空')
for (const col of ['运行状态', '设备名称', '设备类型', '设备编码', '安装位置', '添加时间', '操作']) {
  check(fwLedgerCols.some(c => c.trim() === col), `设备台帐缺列「${col}」`)
}

// 切回总览，供后续组态下钻
await page.locator('.fw-tabs__item', { hasText: '系统总览' }).click()
await page.waitForTimeout(600)

// 组态图元下钻
const nodeDrill = {}
for (const nodeLabel of ['液位', '自动末端试水']) {
  const node = page.locator('.fw-scene__svg--text .fw-scene__node', { hasText: nodeLabel }).first()
  await node.click()
  await page.waitForTimeout(700)
  const rows = await page.locator('.fwd__list .pr').count()
  const title = await page.locator('.el-drawer__title').first().textContent()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  nodeDrill[nodeLabel] = { rows, title: title?.trim() }
  console.log(`  图元「${nodeLabel}」下钻 → ${rows} 个点位`)
  check(rows > 0, `图元「${nodeLabel}」下钻点位数为 0`)
}

// 点行 → 单点详情抽屉（组内导航）
await page.locator('.fw-scene__svg--text .fw-scene__node', { hasText: '液位' }).first().click()
await page.waitForTimeout(700)
await page.locator('.fwd__list .pr').first().click()
await page.waitForTimeout(1200)
const pddVisible = await page.locator('.pdd').isVisible().catch(() => false)
const pddTitle = await page.locator('.el-drawer__title').last().textContent().catch(() => null)
const pddNav = await page.locator('.pdd__nav-text').textContent().catch(() => null)
const pddChart = await page.locator('.pdd__chart canvas').count()
await page.screenshot({ path: `${OUT}/01-消防水系统监测-详情.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(600)
console.log(`  点行 → 详情抽屉: ${pddVisible ? 'OK' : '未打开'} → ${pddTitle?.trim()} | ${pddNav?.trim()} | 趋势图 canvas ${pddChart}`)
check(pddVisible, '消防水页点行未打开点位详情抽屉')
check(pddChart > 0, '消防水页点位详情缺 24h 趋势图')

// 报警记录：表内必须有带事件类型的记录（火警/故障/离线），与「预警设备」卡口径一致
const warnCardRow = fwCardData.find(c => c.label === '预警设备')
const warnDeclared = Number(warnCardRow?.num ?? 0)
const alarmRowsAll = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.fwat tbody tr')]
  const tagged = rows.filter(tr => tr.querySelector('.fw-tag')).length
  return { total: rows.length, tagged }
})
console.log(`  预警设备声明 ${warnDeclared} 台 → 报警表内记录 ${alarmRowsAll.total} 条（带事件类型 ${alarmRowsAll.tagged} 条）`)
check(alarmRowsAll.total > 0, '报警记录表为空')
check(alarmRowsAll.tagged > 0, '报警记录表内没有带事件类型的行')

// 点位编号格式与集合一致性
// 采集点编号形如 FM-0432 / YW-0001（4 位）；主机分机形如 HOST-01 / SLAVE-02（2 位）
const badCodes = await page.evaluate(() =>
  [...document.querySelectorAll('.fwat tbody tr')]
    .map(tr => tr.querySelector('.col-code')?.textContent?.trim() ?? '')
    .filter(c => c && !/^[A-Z]+-\d{2,4}$/.test(c)),
)
check(badCodes.length === 0, `报警记录存在非法点位编号：${badCodes.slice(0, 3).join(', ')}`)

check(imgState.length === 11, `组态位图应为 11 张，实际 ${imgState.length}`)
check(imgState.every(i => i.ok), '存在未成功加载的组态位图')
check(fwNodes === 11 && fwTextNodes === 11, `组态图元应为 11 个，实际底图 ${fwNodes} / 文本 ${fwTextNodes}`)
check(fwEdges === 10, `组态连线应为 10 条，实际 ${fwEdges}`)
check(
  imgState.every(i => (i.href ?? '').startsWith('http')),
  '组态位图应指向 OSS 公网地址（平台新增图元的产品图）',
)
check(hScroll === 0, `页面出现横向滚动，溢出 ${hScroll}px`)
check(fwAlarmRows > 0, '报警记录表为空')

// 截图：设计稿目标视口（1920×1080），整页在窗口内展示
await page.setViewportSize({ width: 1920, height: 1080 })
await page.waitForTimeout(800)
await page.screenshot({ path: `${DOC_OUT}/01-消防水系统监测.png`, fullPage: true })
await page.screenshot({ path: `${OUT}/01-消防水系统监测.png` })

// 目标视口下再验一次横竖向滚动
const scrollAtTarget = await page.evaluate(() => {
  const mc = document.querySelector('main.main-content')
  return mc
    ? { h: mc.scrollWidth - mc.clientWidth, v: mc.scrollHeight - mc.clientHeight }
    : { h: 0, v: 0 }
})
check(scrollAtTarget.h === 0, `目标视口出现横向滚动，溢出 ${scrollAtTarget.h}px`)
check(scrollAtTarget.v <= 1, `目标视口出现垂直滚动，溢出 ${scrollAtTarget.v}px`)

await page.setViewportSize({ width: 1600, height: 1000 })
await page.waitForTimeout(400)

// ===== 气体灭火 / 防排烟（旧版点位长列表，结构未变） =====

for (const p of PAGES.filter(x => x.kind === 'legacy')) {
  await page.goto(BASE + p.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const title = await page.locator('.smp__title').textContent().catch(() => null)
  const desc = await page.locator('.smp__desc').textContent().catch(() => null)
  const kpis = await page.locator('.ssb__card').count()
  const kpiText = await page.locator('.ssb__num').allTextContents()
  const hosts = await page.locator('.smp__host').count()
  const sections = await page.locator('.smp__section-title').allTextContents()
  const cards = await page.locator('.pc').count()
  const tiles = await page.locator('.pt').count()
  const alarmCount = await page.locator('.pc--alarm, .pt--alarm').count()

  await page.locator('.smp__search input').first().fill('A 区')
  await page.waitForTimeout(600)
  const afterFilter = await page.locator('.pc, .pt').count()
  await page.locator('.smp__search input').first().fill('')
  await page.waitForTimeout(400)

  await page.locator('.pc, .pt').first().click()
  await page.waitForTimeout(1500)
  const drawerVisible = await page.locator('.pdd').isVisible().catch(() => false)
  const drawerTitle = drawerVisible
    ? await page.locator('.el-drawer__title').first().textContent().catch(() => null)
    : null
  const chartCount = await page.locator('.pdd__chart canvas').count()

  await page.screenshot({ path: `${OUT}/${p.name}.png`, fullPage: false })
  if (drawerVisible) {
    await page.screenshot({ path: `${OUT}/${p.name}-详情.png` })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }

  console.log(`\n=== ${p.name} (${p.path}) ===`)
  console.log(`  标题: ${title}`)
  console.log(`  描述: ${desc?.slice(0, 60)}…`)
  console.log(`  KPI卡: ${kpis} 个 → ${kpiText.join(' | ')}`)
  console.log(`  主机/分机: ${hosts} 台`)
  console.log(`  分区: ${sections.join(' / ')}`)
  console.log(`  渲染: ${cards} 卡片 + ${tiles} 瓦片, 其中报警态 ${alarmCount}`)
  console.log(`  搜索"A 区"后: ${afterFilter} 条`)
  console.log(`  详情抽屉: ${drawerVisible ? 'OK' : '未打开'} → ${drawerTitle}, 趋势图 canvas: ${chartCount}`)

  check(!!title, `${p.name} 缺标题`)
  check(kpis === 5, `${p.name} 汇总卡应为 5 个，实际 ${kpis}`)
  check(drawerVisible, `${p.name} 点位详情抽屉未打开`)
}

await browser.close()

// 假 token 引起的外壳 401 单独归类，不算页面错误
const pageErrors = shellOnly401
  ? errors.filter(e => !e.includes('401'))
  : errors
shellNoise.push(...errors.filter(e => e.includes('401')))

console.log('\n=== 页面自身错误 ===')
if (pageErrors.length === 0) console.log('无')
else pageErrors.slice(0, 20).forEach(e => console.log(' ', e))

if (shellNoise.length) {
  console.log(`\n=== 应用外壳噪声（${shellNoise.length} 条，假 token 导致，不计失败）===`)
  console.log(`  ${SHELL_401_PATH} 401 —— DefaultLayout 企业切换器，与页面无关`)
}

console.log('\n=== 断言失败 ===')
if (failures.length === 0) console.log('无')
else failures.forEach(f => console.log('  ✗', f))

console.log(`\n截图目录: ${OUT}\n文档截图: ${DOC_OUT}`)
process.exit(pageErrors.length || failures.length ? 1 : 0)
