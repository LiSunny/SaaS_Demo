#!/usr/bin/env node
/**
 * UI 取证脚本 —— 截图 + 结构化事实采集
 *
 * 纯被动测量：不点击任何元素，避免触发"远程启动/停止/删除/提交"等破坏性动作。
 * 交互链路验证交给 Browser 工具按需手动走。
 *
 * 用法：
 *   node scripts/capture-ui.mjs --url http://localhost:3200/fire/pipeline --out /tmp/ui-audit
 *   node scripts/capture-ui.mjs --url A --url B --out /tmp/ui-audit --viewport 1600x1000
 *   node scripts/capture-ui.mjs --url A --auth auth_token=mock-token-001 --wait 3000
 *
 * 输出：
 *   <out>/<slug>.png          首屏截图
 *   <out>/<slug>-full.png     整页截图
 *   <out>/facts.json          结构化事实
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

// ---------- 参数 ----------
const argv = process.argv.slice(2)
const arg = (name, def = undefined) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def
}
const argAll = (name) => {
  const res = []
  argv.forEach((v, i) => {
    if (v === `--${name}` && argv[i + 1]) res.push(argv[i + 1])
  })
  return res
}

const urls = argAll('url')
if (!urls.length) {
  console.error('用法: node scripts/capture-ui.mjs --url <页面地址> [--url ...] [--out <目录>]')
  process.exit(2)
}
const OUT = path.resolve(arg('out', '/tmp/ui-audit'))
const [VW, VH] = String(arg('viewport', '1600x1000')).split('x').map(Number)
const WAIT = Number(arg('wait', '2500'))
const AUTH = argAll('auth')

fs.mkdirSync(OUT, { recursive: true })

const slug = (u) => {
  try {
    const p = new URL(u)
    return (p.pathname.replace(/^\/+|\/+$/g, '') || 'root').replace(/\//g, '_')
  } catch {
    return 'page'
  }
}

// ---------- 浏览器 ----------
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 })

if (AUTH.length) {
  await ctx.addInitScript((pairs) => {
    for (const p of pairs) {
      const i = p.indexOf('=')
      localStorage.setItem(p.slice(0, i), p.slice(i + 1))
    }
  }, AUTH)
}

const page = await ctx.newPage()
const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300))
})
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${e.message}`.slice(0, 300)))

// ---------- 页内测量 ----------
const MEASURE = () => {
  const rootStyle = getComputedStyle(document.documentElement)
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0'
  document.body.appendChild(probe)
  const resolveColor = (c) => {
    if (!c) return ''
    probe.style.color = 'rgb(0,0,0)'
    probe.style.color = c
    return getComputedStyle(probe).color
  }
  const tok = (n) => resolveColor(rootStyle.getPropertyValue(n).trim())

  const DANGER = tok('--danger')
  const WARN = tok('--warning')
  const SUCCESS = tok('--success')
  const DANGER_BG = tok('--danger-bg')
  const WARN_BG = tok('--warning-bg')

  const vh = window.innerHeight
  const vw = window.innerWidth
  const all = Array.from(document.querySelectorAll('body *'))

  const ownText = (el) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.replace(/\s+/g, ' ').trim())
      .join(' ')
      .trim()

  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return false
    const s = getComputedStyle(el)
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05
  }

  const cssPath = (el) => {
    if (!el || el.nodeType !== 1) return ''
    if (el.id) return `#${el.id}`
    const parts = []
    let cur = el
    while (cur && cur.nodeType === 1 && parts.length < 4 && cur !== document.body) {
      let s = cur.tagName.toLowerCase()
      if (typeof cur.className === 'string' && cur.className.trim()) {
        const cls = cur.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.')
        if (cls) s += `.${cls}`
      }
      parts.unshift(s)
      cur = cur.parentElement
    }
    return parts.join(' > ')
  }

  const rectOf = (el) => {
    const r = el.getBoundingClientRect()
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      inFirstScreen: r.top < vh && r.bottom > 0,
      fullyInFirstScreen: r.top >= 0 && r.bottom <= vh,
    }
  }

  // --- 背景色解析（往上找第一个不透明背景） ---
  const parseRGB = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }
  }
  const bgOf = (el) => {
    // 逐层收集背景色并做 alpha 合成，得到真实可见底色（半透明令牌色必须合成，否则误判对比度）
    const layers = []
    let cur = el
    while (cur) {
      const s = getComputedStyle(cur)
      // 渐变/图片背景无法可靠取色，返回 null 由调用方跳过
      if (s.backgroundImage && s.backgroundImage !== 'none') return null
      const c = parseRGB(s.backgroundColor)
      if (c && c.a > 0) {
        layers.push(c)
        if (c.a >= 0.99) break
      }
      cur = cur.parentElement
    }
    let out = { r: 255, g: 255, b: 255, a: 1 }
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      out = {
        r: l.r * l.a + out.r * (1 - l.a),
        g: l.g * l.a + out.g * (1 - l.a),
        b: l.b * l.a + out.b * (1 - l.a),
        a: 1,
      }
    }
    return out
  }
  const lum = (c) => {
    const f = (v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b)
  }
  const contrast = (a, b) => {
    const l1 = lum(a), l2 = lum(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }

  // --- 1. 异常态元素（报警 / 故障 / 离线等） ---
  const alarmCandidates = []
  for (const el of all) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    const borders = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor]
    const borderHit = borders.some((c) => c === DANGER || c === WARN)
    const bgHit = s.backgroundColor === DANGER_BG || s.backgroundColor === WARN_BG
    if (!borderHit && !bgHit) continue
    const p = el.parentElement
    if (p) {
      const ps = getComputedStyle(p)
      const pBorderHit = [ps.borderTopColor, ps.borderBottomColor].some((c) => c === DANGER || c === WARN)
      const pBgHit = ps.backgroundColor === DANGER_BG || ps.backgroundColor === WARN_BG
      if (pBorderHit || pBgHit) continue // 只保留最外层
    }
    alarmCandidates.push(el)
  }
  const alarms = alarmCandidates.slice(0, 80).map((el) => {
    const s = getComputedStyle(el)
    const t = ownText(el) || (el.getAttribute('title') || '')
    const tone = [s.borderTopColor, s.borderBottomColor, s.backgroundColor].includes(DANGER) || s.backgroundColor === DANGER_BG
      ? 'danger'
      : 'warn'
    // 是否"仅靠颜色"：整棵子树里都没有可见文字，才算纯色表达
    // （外层容器自身无文字、但子元素带"报警"标签的，不算误报）
    const subtree = (el.textContent || '').replace(/\s+/g, '')
    const hasTextLabel = subtree.length > 0
    return {
      selector: cssPath(el),
      text: t.slice(0, 60),
      tone,
      ...rectOf(el),
      hasTextLabel,
      clickable: s.cursor === 'pointer' || ['button', 'a'].includes(el.tagName.toLowerCase()),
    }
  })

  // --- 2. 可交互元素 ---
  const inter = []
  const seen = new Set()
  for (const el of all) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    const tag = el.tagName.toLowerCase()
    const role = el.getAttribute('role')
    const isNative = ['button', 'a', 'input', 'select', 'textarea'].includes(tag) || ['button', 'tab', 'switch', 'checkbox'].includes(role)
    const isPointer = s.cursor === 'pointer'
    if (!isNative && !isPointer) continue
    const key = cssPath(el) + '|' + Math.round(el.getBoundingClientRect().y)
    if (seen.has(key)) continue
    seen.add(key)
    const r = rectOf(el)
    inter.push({
      selector: cssPath(el),
      tag,
      text: (ownText(el) || el.getAttribute('aria-label') || el.getAttribute('title') || '').slice(0, 40),
      ...r,
      size: { w: r.w, h: r.h },
      tiny: r.w < 32 || r.h < 32,
    })
  }

  // --- 3. 文本截断 ---
  const truncated = []
  for (const el of all) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    const xClip = el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(s.overflowX)
    const yClip = el.scrollHeight > el.clientHeight + 2 && ['hidden', 'clip'].includes(s.overflowY)
    if (!xClip && !yClip) continue
    if (el.clientWidth === 0 || el.clientHeight === 0) continue
    truncated.push({
      selector: cssPath(el),
      text: ownText(el).slice(0, 60),
      axis: xClip ? 'x' : 'y',
      scroll: el.scrollWidth > el.clientWidth ? el.scrollWidth : el.scrollHeight,
      client: el.scrollWidth > el.clientWidth ? el.clientWidth : el.clientHeight,
      hasTitle: !!el.getAttribute('title'),
    })
  }

  // --- 4. 文本对比度 ---
  const lowContrast = []
  for (const el of all) {
    if (!visible(el)) continue
    const t = ownText(el)
    if (!t) continue
    if (el.children.length > 0) continue
    const s = getComputedStyle(el)
    const fg = parseRGB(s.color)
    if (!fg) continue
    const bg = bgOf(el)
    if (!bg) continue // 渐变背景，取不到可靠底色
    // 纯装饰字符（标点、分隔符）不参与对比度判定
    if (!/[0-9A-Za-z一-龥]/.test(t)) continue
    const ratio = contrast(fg, bg)
    const fs = parseFloat(s.fontSize) || 14
    const large = fs >= 24 || (fs >= 18.66 && Number(s.fontWeight) >= 700)
    const threshold = large ? 3 : 4.5
    if (ratio < threshold) {
      lowContrast.push({
        selector: cssPath(el),
        text: t.slice(0, 50),
        ratio: Number(ratio.toFixed(2)),
        need: threshold,
        fontSize: fs,
        fg: s.color,
        bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
      })
    }
  }

  // --- 5. 标题层级 ---
  const headings = all
    .filter((el) => /^H[1-6]$/.test(el.tagName) && visible(el))
    .map((el) => ({
      tag: el.tagName,
      text: ownText(el).slice(0, 60),
      ...rectOf(el),
    }))

  // --- 6. 首屏密度 ---
  let firstScreenChars = 0
  let firstScreenBlocks = 0
  for (const el of all) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.top >= vh || r.bottom <= 0) continue
    if (el.children.length > 0) continue
    const t = ownText(el)
    if (!t) continue
    firstScreenChars += t.length
    firstScreenBlocks += 1
  }

  // --- 滚动容器（应用常为内部容器滚动，且侧边栏也可能滚动，需排除窄容器） ---
  const findScrollContainer = () => {
    const docEl = document.scrollingElement
    if (docEl && docEl.scrollHeight > docEl.clientHeight + 4) {
      return {
        selector: 'document',
        scrollHeight: docEl.scrollHeight,
        clientHeight: docEl.clientHeight,
        screens: Number((docEl.scrollHeight / vh).toFixed(1)),
      }
    }
    let best = null
    for (const el of all) {
      const s = getComputedStyle(el)
      if (!['auto', 'scroll'].includes(s.overflowY)) continue
      if (el.scrollHeight <= el.clientHeight + 4) continue
      const w = el.getBoundingClientRect().width
      // 只认宽度 ≥ 40% 视口的主内容容器，避免选中侧边栏等窄滚动区
      if (w < vw * 0.4) continue
      const score = w * el.scrollHeight
      if (!best || score > best.score) {
        best = {
          selector: cssPath(el),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          screens: Number((el.scrollHeight / vh).toFixed(1)),
          score,
        }
      }
    }
    return best
  }

  return {
    viewport: { w: vw, h: vh },
    pageHeight: document.documentElement.scrollHeight,
    scrollRatio: Number((document.documentElement.scrollHeight / vh).toFixed(2)),
    scrollContainer: findScrollContainer(),
    firstScreen: {
      textChars: firstScreenChars,
      textBlocks: firstScreenBlocks,
      interactive: inter.filter((i) => i.inFirstScreen).length,
      alarms: alarms.filter((a) => a.inFirstScreen).length,
    },
    interactive: {
      total: inter.length,
      inFirstScreen: inter.filter((i) => i.inFirstScreen).length,
      tinyTotal: inter.filter((i) => i.tiny).length,
      tinyTargets: inter.filter((i) => i.tiny).slice(0, 100),
    },
    alarms: {
      total: alarms.length,
      inFirstScreen: alarms.filter((a) => a.inFirstScreen).length,
      colorOnly: alarms.filter((a) => !a.hasTextLabel).slice(0, 20),
      items: alarms.slice(0, 40),
    },
    truncated: truncated.slice(0, 25),
    lowContrast: lowContrast.slice(0, 25),
    headings: headings.slice(0, 30),
  }
}

// ---------- 逐页采集 ----------
const allFacts = []
for (const url of urls) {
  const name = slug(url)
  consoleErrors.length = 0
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
  } catch (e) {
    console.warn(`[warn] ${url} 加载未完成: ${e.message}`)
  }
  await page.waitForTimeout(WAIT)

  const facts = await page.evaluate(MEASURE)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })

  // 内部容器滚动的页面：document 不滚，fullPage 无意义 → 改为按屏取图
  const sc = facts.scrollContainer
  const shots = []
  if (sc && sc.selector === 'document') {
    await page.screenshot({ path: path.join(OUT, `${name}-full.png`), fullPage: true })
    shots.push(`${name}-full.png`)
  } else if (sc && sc.screens > 1.05) {
    const n = Math.min(5, Math.ceil(sc.screens))
    for (let i = 1; i < n; i++) {
      const y = Math.round((sc.scrollHeight - sc.clientHeight) * (i / (n - 1)))
      await page.evaluate((target) => {
        const vw = window.innerWidth
        let best = null
        for (const el of document.querySelectorAll('body *')) {
          const s = getComputedStyle(el)
          if (!['auto', 'scroll'].includes(s.overflowY)) continue
          if (el.scrollHeight <= el.clientHeight + 4) continue
          const w = el.getBoundingClientRect().width
          if (w < vw * 0.4) continue
          const score = w * el.scrollHeight
          if (!best || score > best.score) best = { el, score }
        }
        if (best) best.el.scrollTop = target
      }, y)
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(OUT, `${name}-s${i}.png`), fullPage: false })
      shots.push(`${name}-s${i}.png`)
    }
    await page.evaluate(() => {
      const vw = window.innerWidth
      let best = null
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el)
        if (!['auto', 'scroll'].includes(s.overflowY)) continue
        if (el.scrollHeight <= el.clientHeight + 4) continue
        const w = el.getBoundingClientRect().width
        if (w < vw * 0.4) continue
        const score = w * el.scrollHeight
        if (!best || score > best.score) best = { el, score }
      }
      if (best) best.el.scrollTop = 0
    })
  }

  facts.url = url
  facts.consoleErrors = [...consoleErrors]
  facts.screenshots = shots
  allFacts.push(facts)

  console.log(`\n=== ${url} ===`)
  console.log(`  滚动容器: ${sc ? `${sc.selector} (${sc.scrollHeight}px ≈ ${sc.screens} 屏)` : '整页不滚动'}`)
  console.log(`  首屏文字 ${facts.firstScreen.textChars} 字 / ${facts.firstScreen.textBlocks} 块`)
  console.log(`  可交互: 共 ${facts.interactive.total} 个, 首屏 ${facts.interactive.inFirstScreen} 个, 过小 ${facts.interactive.tinyTargets.length} 个`)
  console.log(`  异常态: 共 ${facts.alarms.total} 个, 首屏 ${facts.alarms.inFirstScreen} 个, 仅靠颜色表达 ${facts.alarms.colorOnly.length} 个`)
  console.log(`  文本截断 ${facts.truncated.length} 处 | 对比度不足 ${facts.lowContrast.length} 处 | 控制台错误 ${facts.consoleErrors.length} 条`)
  console.log(`  截图: ${name}.png ${shots.join(' ')}`)
}

fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(allFacts, null, 2))
await browser.close()
console.log(`\n产物: ${OUT}/facts.json + 各页截图`)
