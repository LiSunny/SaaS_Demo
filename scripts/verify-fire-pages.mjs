/**
 * 消防三系统实时监测页 · 渲染验证脚本
 * 用法：node scripts/verify-fire-pages.mjs [baseURL]
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:5599'
const OUT = '/tmp/fire-shots'
fs.mkdirSync(OUT, { recursive: true })

const PAGES = [
  { path: '/fire/pipeline', name: '01-消防管网系统' },
  { path: '/fire/gas', name: '02-气体灭火系统' },
  { path: '/fire/smoke', name: '03-消防防排烟系统' },
]

const errors = []

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

for (const p of PAGES) {
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

  // 交互：搜索过滤
  await page.locator('.smp__search input').first().fill('A 区')
  await page.waitForTimeout(600)
  const afterFilter = await page.locator('.pc, .pt').count()
  await page.locator('.smp__search input').first().fill('')
  await page.waitForTimeout(400)

  // 交互：打开详情抽屉
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
}

await browser.close()

console.log('\n=== 控制台错误 ===')
if (errors.length === 0) console.log('无')
else errors.slice(0, 20).forEach(e => console.log(' ', e))
console.log(`\n截图目录: ${OUT}`)
process.exit(errors.length ? 1 : 0)