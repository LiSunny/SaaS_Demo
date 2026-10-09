// 验证 5 个新 widget 不再渲染 emoji
// 用 fire-safety-manager 角色登录 → 工作台 → 截图
const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })

  // 注入 localStorage（fire-safety-manager 角色登录态）
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
  await page.waitForTimeout(1500) // 等 widget 渲染 + ECharts init

  // 滚动到底部确保所有 widget 都被加载
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)

  // 截图 light 模式
  await page.screenshot({ path: '/tmp/workbench-emoji-fix-light.png', fullPage: true })

  // 抓取页面上所有 widget 文本内容，grep emoji
  const widgetTexts = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.widget-card, [class*="widget"], .stat-cards-widget, .ranking-widget, .trend-line-widget, .shortcuts-grid-widget, .realtime-alerts-widget')
      .forEach(el => out.push(el.innerText))
    return out
  })

  // 简化版：抓整个 body 文本，看有没有 emoji 残留
  const bodyText = await page.evaluate(() => document.body.innerText)

  // emoji 字符范围
  const emojiRe = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{1F000}-\u{1F2FF}]/u
  const found = []
  for (const m of bodyText.matchAll(new RegExp(emojiRe.source, 'gu'))) {
    found.push(m[0])
  }

  console.log('--- 渲染到页面的文本中的 emoji 残留 ---')
  if (found.length === 0) {
    console.log('✓ 无 emoji 残留（5 个新 widget 全部用 CSS 色块或 ASCII 字母）')
  } else {
    console.log('✗ 发现 emoji:', JSON.stringify(found))
  }

  console.log('--- 5 个 widget 区域渲染文本 ---')
  console.log(widgetTexts.slice(0, 5).map((t, i) => `\n[widget ${i}]\n${t.slice(0, 200)}`).join('\n'))

  // 切到 dark 模式
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(800)
  await page.screenshot({ path: '/tmp/workbench-emoji-fix-dark.png', fullPage: true })

  await browser.close()
  console.log('\n✓ 截图保存：/tmp/workbench-emoji-fix-light.png')
  console.log('✓ 截图保存：/tmp/workbench-emoji-fix-dark.png')
})()
