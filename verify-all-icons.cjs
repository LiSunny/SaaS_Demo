// 验证 3 个 widget（stat-cards / shortcuts-grid / realtime-alerts）都用了 Figma 真实 SVG 图标
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1400 } })
  await ctx.addInitScript(() => {
    localStorage.setItem('auth_token', 'demo-token')
    localStorage.setItem('demo-position', 'fire-safety-manager')
    localStorage.setItem('system-role', '')
    localStorage.setItem('demo-user', JSON.stringify({
      id: 'u-fsm', name: '王经理', position: 'fire-safety-manager',
    }))
  })
  const page = await ctx.newPage()
  await page.goto('http://localhost:3200/workbench', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  // 1) stat-cards / realtime-alerts：img 节点
  const imgStats = await page.evaluate(() => {
    const collect = (sel) => {
      // 只算 <img>（CSS mask span 虽同名但不是图片节点）
      const imgs = Array.from(document.querySelectorAll(sel)).filter(e => e.tagName === 'IMG')
      const ok = imgs.filter(i => i.naturalWidth > 0 && i.complete).length
      return {
        total: imgs.length,
        loaded: ok,
        srcs: imgs.map(i => (i.getAttribute('src') || '').replace('http://localhost:3200', '')),
      }
    }
    return {
      'stat-cards': collect('.stat-icon-img'),
      'realtime-alerts': collect('.alert-icon-img'),
    }
  })

  // 2) shortcuts-grid：CSS mask
  const gsStats = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.shortcut-icon'))
    const ok = els.filter(e => getComputedStyle(e).maskImage.includes('url(')).length
    return { total: els.length, loaded: ok }
  })

  const all = {
    ...imgStats,
    'shortcuts-grid (mask)': gsStats,
  }

  for (const [name, c] of Object.entries(all)) {
    const status = c.loaded === c.total && c.total > 0 ? '✓' : '✗'
    console.log(`${status} ${name}: ${c.loaded}/${c.total} loaded`)
    if (c.srcs) {
      c.srcs.slice(0, 4).forEach(s => console.log(`    ${s}`))
      if (c.srcs.length > 4) console.log(`    ... +${c.srcs.length - 4} more`)
    }
  }

  await page.screenshot({ path: '/tmp/workbench-all-icons.png', fullPage: true })

  for (const [name, sel] of [
    ['stat-cards', '.stat-cards-widget'],
    ['shortcuts-grid', '.shortcuts-grid-widget'],
    ['realtime-alerts', '.realtime-alerts-widget'],
  ]) {
    const el = await page.$(sel)
    if (el) await el.screenshot({ path: `/tmp/widget-${name}.png` })
  }
  console.log('---')
  console.log('Screenshots:')
  console.log('  /tmp/widget-stat-cards.png')
  console.log('  /tmp/widget-shortcuts-grid.png')
  console.log('  /tmp/widget-realtime-alerts.png')

  await browser.close()
})()