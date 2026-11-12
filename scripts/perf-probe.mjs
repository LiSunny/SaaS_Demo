// 本地构建产物性能探针：冷缓存 + 3G 网络模拟
// 用法：先 npx vite build，再 node scripts/perf-probe.mjs
import { chromium } from 'playwright'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PERF_PORT || 4399)

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
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  })
  fs.createReadStream(file).pipe(res)
})
await new Promise((r) => server.listen(PORT, r))

// 1.6Mbps / 150ms RTT ≈ 国内普通 4G
const throttle = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
}

const browser = await chromium.launch()
const TARGETS = [
  { name: '门户页 /portal', url: `http://localhost:${PORT}/portal` },
  { name: '平台首页 /workbench', url: `http://localhost:${PORT}/workbench` },
]

for (const t of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', throttle)

  const failed = []
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url().replace(`http://localhost:${PORT}`, '')}`)
  })

  const t0 = Date.now()
  await page.goto(t.url, { waitUntil: 'load', timeout: 60000 }).catch(() => {})
  const loadMs = Date.now() - t0
  await page.waitForTimeout(3000)

  const d = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {}
    const paints = performance.getEntriesByType('paint')
    const res = performance.getEntriesByType('resource').map((r) => ({
      name: r.name, type: r.initiatorType, dur: Math.round(r.duration), transfer: r.transferSize || 0,
    }))
    return {
      fcp: Math.round(paints.find((p) => p.name === 'first-contentful-paint')?.startTime || 0),
      dcl: Math.round(nav.domContentLoadedEventEnd || 0),
      res, total: res.reduce((s, r) => s + r.transfer, 0),
    }
  })

  console.log(`\n${'='.repeat(70)}`)
  console.log(`【${t.name}】`)
  console.log('='.repeat(70))
  console.log(`load=${loadMs}ms  FCP=${d.fcp}ms  DCL=${d.dcl}ms  请求数=${d.res.length}  总传输=${(d.total / 1024 / 1024).toFixed(2)}MB`)
  console.log('\n-- 传输体积 TOP8 --')
  for (const r of [...d.res].sort((a, b) => b.transfer - a.transfer).slice(0, 8)) {
    console.log(`  ${(r.transfer / 1024).toFixed(0).padStart(7)}KB  ${String(r.dur).padStart(6)}ms  ${r.type.padEnd(9)}  ${r.name.replace(`http://localhost:${PORT}`, '').slice(0, 62)}`)
  }
  if (failed.length) console.log(`\nHTTP 失败 ${failed.length}: ${failed.slice(0, 8).join(' | ')}`)
  await ctx.close()
}

await browser.close()
server.close()
