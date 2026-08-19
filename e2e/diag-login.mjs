/**
 * 临时诊断脚本：复现"窗体高度变小 → 白色窗体覆盖验证码输入框 border"
 * 用法: node e2e/diag-login.mjs
 */
import { chromium } from '@playwright/test'

const BASE = 'http://localhost:3200'

function box(el) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    top: round(r.top),
    bottom: round(r.bottom),
    left: round(r.left),
    right: round(r.right),
    width: round(r.width),
    height: round(r.height),
  }
}
const round = (n) => Math.round(n * 10) / 10

async function collectDiag(page) {
  return page.evaluate(() => {
    const g = (sel) => document.querySelector(sel)
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1),
        left: +r.left.toFixed(1), right: +r.right.toFixed(1),
        width: +r.width.toFixed(1), height: +r.height.toFixed(1),
      }
    }
    const card = g('.login-card')
    const area = g('.login-form-area')
    const body = g('.login-body')
    const header = g('.login-header')
    const footer = g('.login-footer')
    const smsWrapper = g('.sms-code-input .el-input__wrapper')
    const smsItem = g('.sms-code-row')?.closest('.el-form-item')
    const phoneItem = g('.login-input')?.closest('.el-form-item')
    const items = [...document.querySelectorAll('.login-form .el-form-item')].map((it) => ({
      prop: it.className.includes('is-error') ? 'is-error' : '',
      box: box(it),
      error: g('.el-form-item__error', it) ? box(it.querySelector('.el-form-item__error')) : null,
    }))

    // 验证码输入框顶部边缘、上方 6px 处，实际渲染在最上层的元素
    let hitTop = null
    let hitAbove = null
    if (smsWrapper) {
      const r = smsWrapper.getBoundingClientRect()
      const midX = r.left + r.width / 2
      hitTop = (() => {
        const el = document.elementFromPoint(midX, r.top + 1)
        if (!el) return null
        return { tag: el.tagName, cls: el.className, id: el.id }
      })()
      hitAbove = (() => {
        const el = document.elementFromPoint(midX, r.top - 6)
        if (!el) return null
        return { tag: el.tagName, cls: el.className, id: el.id }
      })()
    }

    const ov = (it) => it && it.clientHeight < it.scrollHeight
    return {
      viewport: { w: innerWidth, h: innerHeight },
      header: box(header),
      body: box(body),
      area: box(area),
      card: {
        ...box(card),
        scrollHeight: card ? card.scrollHeight : null,
        clientHeight: card ? card.clientHeight : null,
        scrollable: ov(card),
      },
      footer: box(footer),
      smsInput: box(smsWrapper),
      smsItem: box(smsItem),
      phoneItem: box(phoneItem),
      formItems: items,
      elementFromPoint: {
        atInputTop: hitTop,
        aboveInput6px: hitAbove,
      },
      // card 是否超出 area / body 边界
      cardOutOfArea: card && area ? card.getBoundingClientRect().bottom > area.getBoundingClientRect().bottom || card.getBoundingClientRect().top < area.getBoundingClientRect().top : null,
    }
  })
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-proxy-server', '--no-sandbox'],
  })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await context.newPage()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.login-card', { timeout: 15000 })

  // 切到"验证码登录"
  await page.getByRole('button', { name: '验证码登录' }).click()
  await page.waitForSelector('.sms-code-row', { timeout: 10000 })
  await page.waitForTimeout(400)

  const heights = [1080, 850, 750, 650, 580, 520]
  for (const h of heights) {
    await page.setViewportSize({ width: 1920, height: h })
    await page.waitForTimeout(500)
    const d = await collectDiag(page)
    await page.screenshot({ path: `/tmp/diag-login-${h}.png`, fullPage: false })
    console.log(`\n===== viewport 1920x${h} =====`)
    console.log(JSON.stringify(d, null, 1))
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
