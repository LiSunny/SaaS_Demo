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

// ===== 消防水系统监测页（垂直三段） =====

await page.goto(`${BASE}/device-facility/monitor/fire-water`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const fwTitle = await page.locator('.fwm__title').textContent().catch(() => null)
const fwSections = await page.locator('.fwm__section-title').allTextContents()
const fwCards = await page.locator('.fw-card').count()
const fwCardData = await page.locator('.fw-card').evaluateAll(nodes =>
  nodes.map(n => ({
    label: n.querySelector('.fw-card__label')?.textContent?.trim() ?? '',
    num: n.querySelector('.fw-card__num')?.textContent?.trim() ?? '',
    unit: n.querySelector('.fw-card__unit')?.textContent?.trim() ?? '',
    sub: n.querySelector('.fw-card__sub')?.textContent?.trim() ?? '',
    range: n.querySelector('.fw-card__range')?.textContent?.trim() ?? '',
  })),
)
const fwNodes = await page.locator('.fw-scene__node').count()
const fwEdges = await page.locator('.fw-edge').count()
const fwAlarmRows = await page.locator('.fwat tbody tr').count()
const fwUndeclared = await page.locator('.fwat__count').first().textContent().catch(() => null)
const fwDesc = await page.locator('.fwm__desc').textContent().catch(() => '')

// 位图是否全部加载成功（0 个 404 / 0 个解码失败）
const imgState = await page.evaluate(() =>
  [...document.querySelectorAll('.fw-scene__node svg image')].map(im => ({
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
console.log(`  分区顺序: ${fwSections.join(' → ')}`)
console.log(`  核心数据卡: ${fwCards} 个`)
fwCardData.forEach(c => console.log(`    · ${c.label}: ${c.num} ${c.unit} | ${c.sub} | ${c.range}`))
console.log(`  组态: ${fwNodes} 个图元, ${fwEdges} 条连线, 位图 ${imgState.length} 张`)
console.log(`  报警记录: ${fwAlarmRows} 行 | ${fwUndeclared?.replace(/\s+/g, ' ').trim()}`)
console.log(`  规模说明: ${fwDesc?.replace(/\s+/g, ' ').trim()}`)
console.log(`  横向滚动溢出: ${hScroll}px`)

check(fwTitle === '消防水系统监测', `消防水页标题应为「消防水系统监测」，实际「${fwTitle}」`)
check(
  fwSections.length === 3 && fwSections[0] === '核心数据' && fwSections[1] === '消防给水系统总貌' && fwSections[2] === '报警记录',
  `消防水页三段顺序应为 核心数据 → 消防给水系统总貌 → 报警记录，实际「${fwSections.join('/')}」`,
)
check(fwCards === 4, `核心数据卡应为 4 张，实际 ${fwCards}`)

// 页头声明的点位数必须与「系统状态」卡口径一致（同一页内自相校验）
const descPoints = fwDesc?.match(/(\d+)\s*个采集点位/)
const statusRange = fwCardData.find(c => c.label === '系统状态')?.range ?? ''
const statusPoints = statusRange.match(/(\d+)\s*个点位/)
check(
  !!descPoints && !!statusPoints && Number(descPoints[1]) === Number(statusPoints[1]),
  `页头声明 ${descPoints?.[1]} 个采集点位 与「系统状态」卡 ${statusPoints?.[1]} 个点位 不一致`,
)

// 卡片自身声明的分母必须与实际下钻点位一致
async function drillCount(openSelector) {
  await page.locator(openSelector).first().click()
  await page.waitForTimeout(700)
  const rows = await page.locator('.fwd__list .pr').count()
  const meta = await page.locator('.fwd__meta').textContent().catch(() => '')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  return { rows, meta: meta?.replace(/\s+/g, ' ').trim() ?? '' }
}

const cardDrill = {}
for (const label of ['供水压力', '供水流量', '水池水位']) {
  const card = page.locator('.fw-card', { hasText: label }).first()
  const declared = (await card.locator('.fw-card__sub').textContent())?.match(/(\d+)\s*个测点/)
  await card.click()
  await page.waitForTimeout(700)
  const rows = await page.locator('.fwd__list .pr').count()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  cardDrill[label] = { declared: declared ? Number(declared[1]) : null, rows }
  console.log(`  卡片「${label}」声明 ${declared?.[1]} 个测点 → 抽屉实到 ${rows} 个`)
  check(
    declared && Number(declared[1]) === rows,
    `卡片「${label}」声明 ${declared?.[1]} 个测点与抽屉实际 ${rows} 个不一致`,
  )
}

// 组态图元下钻
const nodeDrill = {}
for (const nodeLabel of ['消防水池', '末端试水装置']) {
  const node = page.locator('.fw-scene__node', { hasText: nodeLabel }).first()
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
await page.locator('.fw-scene__node', { hasText: '消防水池' }).first().click()
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

// 报警记录：未处理条数应覆盖当前报警点位数（系统状态卡声明的报警数）
const sysCard = page.locator('.fw-card', { hasText: '系统状态' }).first()
const sysSub = (await sysCard.locator('.fw-card__sub').textContent()) ?? ''
const alarmCount = Number(sysSub.match(/(\d+)\s*个报警/)?.[1] ?? 0)
const highLevelRows = await page
  .locator('.fwat tbody tr', { has: page.locator('.fi-tag', { hasText: /重要|紧急/ }) })
  .count()
console.log(`  系统状态声明 ${alarmCount} 个报警 → 表内重要/紧急级记录 ${highLevelRows} 条`)
check(
  highLevelRows >= alarmCount,
  `报警记录表的重要/紧急级记录 ${highLevelRows} 条 < 系统状态声明的 ${alarmCount} 个报警`,
)

// 点位编号格式与集合一致性
// 采集点编号形如 FM-0432 / YW-0001（4 位）；主机分机形如 HOST-01 / SLAVE-02（2 位）
const badCodes = await page.evaluate(() =>
  [...document.querySelectorAll('.fwat tbody tr')]
    .map(tr => tr.querySelector('.col-code')?.textContent?.trim() ?? '')
    .filter(c => c && !/^[A-Z]+-\d{2,4}$/.test(c)),
)
check(badCodes.length === 0, `报警记录存在非法点位编号：${badCodes.slice(0, 3).join(', ')}`)

check(imgState.length === 12, `组态位图应为 12 张，实际 ${imgState.length}`)
check(imgState.every(i => i.ok), '存在未成功加载的组态位图')
check(hScroll === 0, `页面出现横向滚动，溢出 ${hScroll}px`)
check(fwAlarmRows > 0, '报警记录表为空')

// 截图：整页（含页头与三段）
await page.setViewportSize({ width: 1600, height: 1700 })
await page.waitForTimeout(800)
await page.screenshot({ path: `${DOC_OUT}/01-消防水系统监测.png`, fullPage: true })
await page.screenshot({ path: `${OUT}/01-消防水系统监测.png` })

// 整页在 1600 宽度下再验一次横向滚动
const hScrollTall = await page.evaluate(() => {
  const mc = document.querySelector('main.main-content')
  return mc ? mc.scrollWidth - mc.clientWidth : 0
})
check(hScrollTall === 0, `整页视图出现横向滚动，溢出 ${hScrollTall}px`)

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
