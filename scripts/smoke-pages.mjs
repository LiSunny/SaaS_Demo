// 功能巡检：验证按需引入/异步化改造后各页面仍正常
import { chromium } from 'playwright'
import http from 'http'
import fs from 'fs'
import path from 'path'

const DIST = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo/dist'
const PORT = 4401
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
}
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  let file = path.join(DIST, p)
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(PORT, r))

const PAGES = [
  { path: '/portal', name: '门户页' },
  { path: '/login', name: '登录页' },
  { path: '/landing', name: '大屏首页' },
  { path: '/landing/ebike-v2', name: '电动车大屏 v2' },
  { path: '/portal/campus', name: '门户-校园专题' },
  { path: '/hazard-intro', name: '隐患介绍页(mermaid)' },
  { path: '/workbench', name: '工作台' },
]

const browser = await chromium.launch()
let problems = 0

for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  const failed = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 200)))
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(`http://localhost:${PORT}`, '')}`) })

  await page.goto(`http://localhost:${PORT}${p.path}`, { waitUntil: 'load', timeout: 45000 }).catch((e) => errs.push('GOTO: ' + e.message.slice(0, 120)))
  await page.waitForTimeout(3500)

  const info = await page.evaluate(() => {
    const body = document.body
    const unknownTags = new Set()
    // 查未解析的自定义元素（组件未注册时的典型症状）
    for (const el of body.querySelectorAll('*')) {
      const tag = el.tagName.toLowerCase()
      if (tag.includes('-') && !['el-config-provider'].includes(tag)) unknownTags.add(tag)
    }
    return {
      text: body.innerText.replace(/\s+/g, ' ').trim().length,
      title: document.title,
      elButtons: body.querySelectorAll('.el-button').length,
      elInputs: body.querySelectorAll('.el-input, .el-textarea, .el-select').length,
      elTables: body.querySelectorAll('.el-table').length,
      appIcons: body.querySelectorAll('svg').length,
      unknown: [...unknownTags],
      imgs: [...body.querySelectorAll('img')].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.slice(-50)),
      brokenBg: [...body.querySelectorAll('*')].filter((e) => {
        const bg = getComputedStyle(e).backgroundImage
        return bg && bg.includes('url(') && !bg.includes('data:')
      }).length,
    }
  })

  const bad = errs.length || failed.length || info.unknown.length || info.imgs.length
  if (bad) problems++
  console.log(`\n${'─'.repeat(70)}`)
  console.log(`${bad ? '⚠️ ' : '✅ '}${p.name.padEnd(22)} ${p.path}`)
  console.log(`   渲染文本 ${info.text} 字 | el-button:${info.elButtons} el-input:${info.elInputs} el-table:${info.elTables} svg:${info.appIcons}`)
  if (info.unknown.length) console.log(`   ❌ 未注册组件标签: ${info.unknown.join(', ')}`)
  if (info.imgs.length) console.log(`   ❌ 图片加载失败: ${info.imgs.join(', ')}`)
  if (failed.length) console.log(`   ❌ HTTP ${failed.length}: ${failed.slice(0, 5).join(' | ')}`)
  if (errs.length) {
    console.log(`   ❌ 控制台错误 ${errs.length}:`)
    for (const e of errs.slice(0, 5)) console.log(`      ${e}`)
  }
  if (!bad) console.log(`   无异常`)

  await ctx.close()
}

console.log(`\n${'='.repeat(70)}`)
console.log(problems === 0 ? '✅ 全部页面通过' : `⚠️  ${problems} 个页面有问题`)
await browser.close()
server.close()
