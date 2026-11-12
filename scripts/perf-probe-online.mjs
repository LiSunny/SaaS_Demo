// 线上复测（不限速）：最贴近真实用户体验
import { chromium } from 'playwright'

const BASE = 'https://www.lyspace.top'
const TARGETS = [
  { name: '门户页 /portal', url: `${BASE}/portal` },
  { name: '平台首页 /workbench', url: `${BASE}/workbench` },
]

const browser = await chromium.launch()

for (const t of TARGETS) {
  // ⚠️ 冷/热两轮必须用同一个 context：新 context 的缓存是空的，
  //    否则「热缓存」轮测的仍是冷启动，缓存命中永远显示 0。
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })

  const failed = []
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })

  for (const cold of [true, false]) {
    if (!cold) {
      // 热缓存轮：恢复使用 HTTP 缓存
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: false })
      await page.goto('about:blank', { waitUntil: 'load' }).catch(() => {})
      // ⚠️ 必须等上一轮网络完全空闲：门户页有 autoplay 视频在后台持续下载，
      //    HTTP/2 单连接多路复用下，它会和新一轮的文档请求排在同一条流上，
      //    测出虚高的 TTFB（实测 1.9s，服务器实际 0.2ms）。
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(1500)
    }

    const t0 = Date.now()
    await page.goto(t.url, { waitUntil: 'load', timeout: 90000 }).catch(() => {})
    const loadMs = Date.now() - t0
    await page.waitForTimeout(3000)

    const d = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {}
      const paints = performance.getEntriesByType('paint')
      const res = performance.getEntriesByType('resource').map((r) => ({
        name: r.name, type: r.initiatorType, dur: Math.round(r.duration), transfer: r.transferSize || 0,
      }))
      return {
        ttfb: Math.round(nav.responseStart || 0),
        fcp: Math.round(paints.find((p) => p.name === 'first-contentful-paint')?.startTime || 0),
        dcl: Math.round(nav.domContentLoadedEventEnd || 0),
        res, total: res.reduce((s, r) => s + r.transfer, 0),
        cached: res.filter((r) => r.transfer === 0).length,
      }
    })

    console.log(`\n${'-'.repeat(70)}`)
    console.log(`【${t.name}】${cold ? '冷缓存（首次访问）' : '热缓存（复访）'} · 不限速`)
    console.log(`  load=${loadMs}ms  TTFB=${d.ttfb}ms  FCP=${d.fcp}ms  DCL=${d.dcl}ms`)
    console.log(`  请求数=${d.res.length}  总传输=${(d.total / 1024).toFixed(0)}KB  缓存命中=${d.cached}/${d.res.length}`)
    if (cold) {
      console.log('  -- 体积 TOP8 --')
      for (const r of [...d.res].sort((a, b) => b.transfer - a.transfer).slice(0, 8)) {
        console.log(`    ${(r.transfer / 1024).toFixed(0).padStart(7)}KB  ${String(r.dur).padStart(5)}ms  ${r.name.replace(BASE, '').slice(0, 60)}`)
      }
    }
  }
  if (failed.length) console.log(`  HTTP 失败: ${failed.length} → ${failed.slice(0, 5).join(' | ')}`)
  await ctx.close()
}

await browser.close()
