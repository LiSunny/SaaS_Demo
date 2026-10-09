// 验证 stat-cards 4 张卡已渲染 Figma Bookmark SVG
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

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
  await page.waitForTimeout(1500)

  // 检查 stat-cards 区域是否加载 SVG
  const iconStatus = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('.stat-icon-img'))
    return imgs.map(img => ({
      src: img.src,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }))
  })

  console.log('--- StatCardsWidget icon <img> 加载状态 ---')
  console.log(JSON.stringify(iconStatus, null, 2))

  const allLoaded = iconStatus.length === 4 && iconStatus.every(i => i.naturalWidth > 0)
  if (allLoaded) {
    console.log(`✓ 4 张卡都成功加载了 Figma Bookmark SVG`)
  } else {
    console.log(`✗ 有 ${iconStatus.filter(i => i.naturalWidth === 0).length} 张卡 SVG 未加载`)
  }

  // 截图保存
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/tmp/workbench-figma-icons.png', fullPage: false })

  // 只截 stat-cards widget 区域
  const statCards = await page.$('.stat-cards-widget')
  if (statCards) {
    await statCards.screenshot({ path: '/tmp/stat-cards-only.png' })
    console.log('✓ stat-cards 区域截图：/tmp/stat-cards-only.png')
  }

  await browser.close()
})()
