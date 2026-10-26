// 渲染平台架构图 HTML → PNG
// 用法：node docs/architecture/render.mjs
// 依赖：项目内已有 playwright（devDependency）
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

const TARGETS = [
  { file: 'platform-architecture.html', out: 'platform-architecture.png', w: 1920, h: 1080, full: false },
  { file: 'platform-architecture-portrait.html', out: 'platform-architecture-portrait.png', w: 1400, h: 900, full: true },
  { file: 'platform-dev-architecture.html', out: 'platform-dev-architecture.png', w: 1920, h: 1080, full: false },
  // ===== 四种架构图对照 =====
  { file: 'fig1-panorama.html', out: 'fig1-panorama.png', w: 1920, h: 1080, full: false },
  { file: 'fig2-application.html', out: 'fig2-application.png', w: 1920, h: 1080, full: false },
  { file: 'fig3-deployment.html', out: 'fig3-deployment.png', w: 1920, h: 1080, full: false },
  // 图四 = 分层架构图，复用 platform-dev-architecture.html，不另存一份源文件
  { file: 'platform-dev-architecture.html', out: 'fig4-layered.png', w: 1920, h: 1080, full: false },
  // 平台分层框架图（给开发）—— 5 层 + L3 支点，与图四研发视角并列，独立一份
  { file: 'platform-layered-framework.html', out: 'platform-layered-framework.png', w: 1920, h: 1254, full: false },
  // 框架总览（单页索引）
  { file: 'framework-overview.html', out: 'framework-overview.png', w: 1920, h: 1080, full: false },
]

const only = process.argv[2] // 可选：只渲染名字包含该字符串的目标

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

for (const t of TARGETS) {
  if (only && !t.file.includes(only) && !t.out.includes(only)) continue
  const ctx = await browser.newContext({
    viewport: { width: t.w, height: t.h },
    deviceScaleFactor: 2, // 2 倍图，PPT 里放大不糊
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error(`[pageerror] ${t.file}: ${e.message}`))
  await page.goto('file://' + join(HERE, t.file), { waitUntil: 'load' })
  await page.waitForTimeout(400)
  const out = join(HERE, t.out)
  await page.screenshot({ path: out, fullPage: t.full })
  console.log(`✅ ${t.out}`)
  await ctx.close()
}

await browser.close()
