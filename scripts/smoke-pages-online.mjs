// 线上功能快检：控制台错误 / HTTP 失败 / 关键元素渲染
// 用法：node scripts/smoke-pages-online.mjs
import { chromium } from 'playwright'

const BASE = process.env.SMOKE_BASE || 'https://www.lyspace.top'
const PAGES = [
  { path: '/portal', name: '门户页' },
  { path: '/login', name: '登录页' },
  { path: '/portal/campus', name: '门户-校园专题' },
  { path: '/landing', name: '大屏首页' },
  { path: '/landing/ebike-v2', name: '电动车大屏 v2' },
  { path: '/workbench', name: '工作台' },
]

const browser = await chromium.launch()
let bad = 0

for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  const failed = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 150)) })
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 150)))
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(BASE, '')}`) })

  await page.goto(`${BASE}${p.path}`, { waitUntil: 'load', timeout: 60000 }).catch((e) => errs.push('GOTO: ' + e.message.slice(0, 100)))
  await page.waitForTimeout(4000)

  const info = await page.evaluate(() => ({
    text: document.body.innerText.replace(/\s+/g, ' ').trim().length,
    elBtn: document.querySelectorAll('.el-button').length,
    elInput: document.querySelectorAll('.el-input, .el-textarea, .el-select').length,
    svg: document.querySelectorAll('svg').length,
    broken: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
  }))

  // 后端接口 401 属正常（未登录），单独归类
  const realFailed = failed.filter((f) => !f.startsWith('401'))
  const issue = errs.length || realFailed.length || info.broken > 0
  if (issue) bad++
  console.log(
    `${issue ? '⚠️ ' : '✅ '}${p.name.padEnd(20)} ${p.path.padEnd(20)} 文本${String(info.text).padStart(5)}字 el-btn:${info.elBtn} el-input:${info.elInput} svg:${info.svg} 坏图:${info.broken}`,
  )
  if (errs.length) console.log(`     控制台错误 ${errs.length}: ${errs.slice(0, 3).join(' | ')}`)
  if (realFailed.length) console.log(`     HTTP 失败: ${realFailed.slice(0, 5).join(' | ')}`)
  await ctx.close()
}

console.log(`\n${bad === 0 ? '✅ 线上全部页面无异常' : `⚠️  ${bad} 个页面有问题`}`)
await browser.close()
