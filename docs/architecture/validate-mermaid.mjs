// 离线校验 docs/architecture/*.mmd 的 mermaid 语法（复用仓库已打包的 mermaid，不联网、不用 mmdc）
// 用法：node docs/architecture/validate-mermaid.mjs
import { chromium } from 'playwright'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const files = readdirSync(HERE).filter((f) => f.endsWith('.mmd'))
const browser = await chromium.launch({ args: ['--no-sandbox'] })

let failed = 0
for (const f of files) {
  const src = readFileSync(join(HERE, f), 'utf8')
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.addInitScript((s) => { window.__MMD__ = s }, src)
  await page.goto(new URL('./_validate-mermaid.html', import.meta.url).href)
  await page.waitForFunction(() => window.__RESULT__, null, { timeout: 20000 }).catch(() => {})
  const r = await page.evaluate(() => window.__RESULT__ || 'NO_RESULT')
  console.log(`${r === 'PARSE_OK' ? '✅' : '❌'} ${f}  ${r}`)
  if (r !== 'PARSE_OK') failed++
  await ctx.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
