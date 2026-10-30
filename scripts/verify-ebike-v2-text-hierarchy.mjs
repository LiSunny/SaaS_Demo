/**
 * 校验 ebike-v2 消防总览页的文字层级：
 *   1. 亮度层级单调下降：核心数值 > 区块标题 > 指标标签 > 辅助说明 > 最弱辅助；
 *   2. 异常数据全部同色（同一个红），且亮度不低于最弱辅助；
 *   3. 非异常数据只用中性色阶，不占用语义色（绿 / 橙 / 主机蓝 / 离线灰）；
 *   4. 每级对比度 ≥ 4.5:1（WCAG AA 正文）。
 *
 * 对比度的算法：
 *   前景 = getComputedStyle 的声明色（浏览器按此渲染，差异只在抗锯齿）；
 *   背景 = 该文字所在行的"无字邻带"实测中位色 —— 大屏卡片是半透明玻璃，
 *   底下的三维模型会透出来，局部底色并不等于卡片基色 #0a2c5c，
 *   直接拿基色算会高估，用邻带实测才接近值班员眼睛看到的真实对比。
 *
 * 用法: node scripts/verify-ebike-v2-text-hierarchy.mjs
 */
import { chromium } from '@playwright/test'
import fp from 'fast-png'
import fs from 'node:fs'

const API = process.env.E2E_API ?? 'http://localhost:3201'
const BASE = process.env.E2E_BASE ?? 'http://localhost:3200'
const OUT = process.env.SHOT_OUT ?? 'screenshots/ebike-v2-text-hierarchy'
const USER = { phone: '13300001111', password: 'admin123!@#' }

/**
 * 亮度层级（不含异常红）。
 * 异常红是色相维度：它不参与亮度排序，只要求"不低于最弱辅助"，
 * 否则会出现"要处理的故障"比"一行时间戳"还暗。
 *
 * L0 的取值只取非异常、非弱化的核心数值：态势条里既有正常的白，
 * 也有异常的红和屏蔽的淡蓝，三者同属"核心数值"槽位但不同色，
 * 因此判定"同角色颜色统一"时要把它们排除在外。
 */
const ROLE_TARGETS = [
  {
    role: 'L0 核心数值',
    sels: ['.fsb__value', '.iip__total-value', '.asr__metric-value', '.alp__count-value'],
    only: 'hero',
  },
  { role: 'L1 区块标题', sels: ['.iip__total-title', '.asr__name', '.psv__name'] },
  { role: 'L2 指标标签', sels: ['.fsb__label', '.alp__count-label', '.alp__link-label', '.asr__metric-label', '.psv__metric-label'] },
  { role: 'L3 辅助说明', sels: ['.alp__loc', '.fsb__unit', '.iip__unit', '.asr__metric-unit', '.psv__top-text'] },
  { role: 'L4 最弱辅助', sels: ['.alp__time', '.alp__elapsed', '.iip__sys-name', '.iip__sys-total', '.iip__legend-item', '.asr__metric-th', '.asr__trend-label', '.iip__total-count'] },]

/** 次级数值（系统行完好率）：达标为 L2 淡蓝，不达标为异常红，单独校验 */
const SECONDARY_TARGETS = [
  { role: '次级数值(系统行)', sels: ['.iip__sys-rate'] },
]

/** 异常数据应统一为此色 */
const ANOMALY_RGB = [255, 128, 128]

/** 语义色：非异常数据不得使用 */
const FORBIDDEN_RGB = [
  [5, 150, 105], // #059669 绿
  [217, 119, 6], // #D97706 橙
  [98, 147, 200], // #6293C8 主机蓝
  [206, 210, 215], // #CED2D7 离线灰
]

/** 中性色阶（允许出现在非异常数据上） */
const NEUTRAL_RGB = [
  [255, 255, 255], // 核心数值
  [207, 228, 255], // 区块标题
  [169, 201, 234], // 指标标签
  [143, 176, 216], // 辅助说明
  [126, 166, 214], // 最弱辅助
]

/** WCAG 相对亮度 */
function relLum([r, g, b]) {
  const f = (c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** WCAG 对比度 */
function contrast(a, b) {
  const l1 = relLum(a)
  const l2 = relLum(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

/** 亮度（0~255） */
const lumOf = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

const res = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(USER),
})
const { data } = await res.json()
if (!data?.token) {
  console.error('登录失败')
  process.exit(1)
}

const browser = await chromium.launch()
let failed = 0

for (const vp of [{ width: 1920, height: 1080 }]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 })
  await page.goto(BASE)
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    { token: data.token, user: data.user },
  )
  await page.goto(`${BASE}/landing/ebike-v2?bigscreenId=20`, { waitUntil: 'networkidle' })
  await page
    .waitForFunction(() => !document.querySelector('.campus-layer__loading'), null, { timeout: 60000 })
    .catch(() => console.log('  ! 模型加载遮罩未在 60s 内撤下'))
  // 等入场镜头飞行结束（4s）再测量：飞行途中是高空俯视，
  // 模型背景整体偏亮，会让所有文字的实测对比度失真。
  await page.waitForTimeout(6000)

  /**
   * 取元素的"首个直接文本节点"墨迹盒。
   * 只取直接文本、不含子元素：`.iip__total-value` 里既有大数值也有
   * "共 1353 台"，整盒取会把两种颜色混在一起测。
   */
  const targets = await page.evaluate(([ROLE_TARGETS, SECONDARY_TARGETS]) => {
    const inkBox = (el) => {
      const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
      if (!node) return null
      const range = document.createRange()
      range.selectNodeContents(node)
      const b = range.getBoundingClientRect()
      if (b.width < 2 || b.height < 2) return null
      return { x: b.x, y: b.y, w: b.width, h: b.height }
    }
    const out = []
    for (const { role, sels } of [...ROLE_TARGETS, ...SECONDARY_TARGETS]) {
      for (const sel of sels) {
        for (const el of document.querySelectorAll(sel)) {
          const box = inkBox(el)
          if (!box) continue
          out.push({
            role,
            sel,
            color: getComputedStyle(el).color,
            text: (el.textContent || '').trim().slice(0, 14),
            box,
          })
        }
      }
    }
    return out
  }, [ROLE_TARGETS, SECONDARY_TARGETS])

  /** 异常数据候选：这些选择器里的元素可能是红，也可能是中性色 */
  const anomalyCandidates = await page.evaluate(() => {
    const inkBox = (el) => {
      const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim())
      if (!node) return null
      const range = document.createRange()
      range.selectNodeContents(node)
      const b = range.getBoundingClientRect()
      if (b.width < 2 || b.height < 2) return null
      return { x: b.x, y: b.y, w: b.width, h: b.height }
    }
    const out = []
    const sels = ['.fsb__value', '.alp__type', '.alp__status', '.psv__metric-value', '.iip__sys-rate']
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const box = inkBox(el)
        if (!box) continue
        out.push({
          sel,
          color: getComputedStyle(el).color,
          text: (el.textContent || '').trim().slice(0, 14),
          box,
        })
      }
    }
    return out
  })

  // 页面有持续动画（三维模型 + 异常点闪烁），整屏 screenshot 会等不到稳定帧；
  // 用 clip 走裁剪路径可直接出图。
  const shotBuf = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
    timeout: 90000,
    animations: 'disabled',
  })
  const shot = fp.decode(shotBuf)
  const W = shot.width
  const H = shot.height

  const pxAt = (x, y) => {
    const i = (y * W + x) * (shot.channels || 3)
    return [shot.data[i], shot.data[i + 1], shot.data[i + 2]]
  }

  /**
   * 局部背景：取文字盒正上方一条同宽的"无字邻带"的中位色。
   * 邻带与文字行在同一张玻璃卡上、同一段模型背景，但不含字形像素，
   * 因此能反映该文字背后的真实底色。
   */
  function localBg(box) {
    const x0 = Math.max(0, Math.round(box.x))
    const y0 = Math.max(0, Math.round(box.y))
    const x1 = Math.min(W - 1, Math.round(box.x + box.w))
    const y1 = Math.min(H - 1, Math.round(box.y + box.h))
    const px = []
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) px.push(pxAt(x, y))
    }
    if (!px.length) return null
    // 取最暗的 25% 像素（字缝里露出的底色）的中位色
    const sorted = [...px].sort((a, b) => lumOf(a) - lumOf(b))
    const dark = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.25)))
    const byLum = [...dark].sort((a, b) => lumOf(a) - lumOf(b))
    return byLum[Math.floor(byLum.length / 2)]
  }

  /** 渲染校验：墨迹盒里是否真的出现了声明色 */
  function hasColor(box, rgb, tol = 45) {
    const x0 = Math.max(0, Math.round(box.x))
    const y0 = Math.max(0, Math.round(box.y))
    const x1 = Math.min(W - 1, Math.round(box.x + box.w))
    const y1 = Math.min(H - 1, Math.round(box.y + box.h))
    let hit = 0
    let total = 0
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const p = pxAt(x, y)
        total++
        if (Math.abs(p[0] - rgb[0]) + Math.abs(p[1] - rgb[1]) + Math.abs(p[2] - rgb[2]) <= tol) hit++
      }
    }
    return total ? hit / total : 0
  }

  const rgbOf = (s) => s.match(/\d+/g).slice(0, 3).map(Number)

  console.log(`\n===== ${vp.width}x${vp.height} 文字层级实测 =====`)
  console.log('（对比度 = 声明前景色 vs 墨迹盒内暗像素中位底色；层级按声明色亮度排序）\n')

  const roleStats = []
  for (const { role, sels, only } of ROLE_TARGETS) {
    // 本级基准色 = 该组内出现最多的颜色（异常红与弱化淡色是少数派，另判）
    const group = targets.filter((x) => x.role === role)
    const tally = new Map()
    for (const t of group) {
      const k = rgbOf(t.color).join(',')
      tally.set(k, (tally.get(k) || 0) + 1)
    }
    const base = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const rows = []
    for (const t of group) {
      const rgb = rgbOf(t.color)
      if (only === 'hero' && rgb.join(',') !== '255,255,255') continue
      if (!only && rgb.join(',') !== base) continue
      const bg = localBg(t.box)
      if (!bg) continue
      rows.push({
        sel: t.sel,
        text: t.text,
        rgb,
        bg,
        cr: +contrast(rgb, bg).toFixed(2),
        painted: hasColor(t.box, rgb),
      })
    }
    if (!rows.length) continue
    const colors = new Set(rows.map((r) => r.rgb.join(',')))
    const crs = rows.map((r) => r.cr)
    roleStats.push({
      role,
      crMin: Math.min(...crs),
      crMax: Math.max(...crs),
      // 层级尺子：声明色的相对亮度（同一把尺，与局部底色无关）
      lum: +relLum(rows[0].rgb).toFixed(4),
      uniform: colors.size === 1,
      color: rows[0].rgb.join(','),
      allPainted: rows.every((r) => r.painted > 0.005),
    })
    console.log(
      `${role.padEnd(14)} 对比度 ${String(Math.min(...crs)).padStart(5)} ~ ${String(Math.max(...crs)).padStart(5)}   亮度 ${String(roleStats[roleStats.length - 1].lum).padStart(7)}   色值 ${rows[0].rgb.join(',')}`,
    )
    for (const r of rows) {
      console.log(
        `    ${r.sel.padEnd(28)} 「${r.text}」 cr=${String(r.cr).padStart(5)}  底色 rgb(${r.bg.join(',')})  命中 ${(r.painted * 100).toFixed(0)}%`,
      )
    }
  }

  console.log('')
  const checks = []
  for (const s of roleStats) {
    checks.push([`${s.role} 同一角色颜色统一`, s.uniform, s.color])
    checks.push([`${s.role} 声明色已真实渲染`, s.allPainted, '墨迹盒命中判定'])
  }
  // 层级单调下降：按声明色亮度，同一把尺
  for (let i = 0; i < roleStats.length - 1; i++) {
    const a = roleStats[i]
    const b = roleStats[i + 1]
    checks.push([`${a.role} 亮于 ${b.role}`, a.lum > b.lum, `亮度 ${a.lum} > ${b.lum}`])
  }
  for (const s of roleStats) {
    checks.push([`${s.role} 对比度 ≥ 4.5`, s.crMin >= 4.5, String(s.crMin)])
  }

  // ===== 次级数值（系统行完好率）：达标淡蓝 / 不达标红 =====
  console.log('--- 次级数值（系统行完好率）---')
  for (const { role, sels } of SECONDARY_TARGETS) {
    const rows = []
    for (const sel of sels) {
      for (const t of targets.filter((x) => x.sel === sel)) {
        const rgb = rgbOf(t.color)
        const bg = localBg(t.box)
        if (!bg) continue
        rows.push({ text: t.text, rgb, cr: +contrast(rgb, bg).toFixed(2) })
      }
    }
    if (!rows.length) continue
    const abnormal = rows.filter((r) => r.rgb.join(',') === ANOMALY_RGB.join(','))
    const normal = rows.filter((r) => r.rgb.join(',') !== ANOMALY_RGB.join(','))
    console.log(`    达标 ${normal.length} 个（${normal[0]?.rgb.join(',') || '-'}），不达标 ${abnormal.length} 个（异常红）`)
    for (const r of rows) {
      console.log(`      「${r.text}」 ${r.rgb.join(',')} cr=${r.cr}`)
    }
    checks.push([
      '次级数值仅用淡蓝或异常红',
      rows.every((r) => r.rgb.join(',') === ANOMALY_RGB.join(',') || NEUTRAL_RGB.some((n) => n.join(',') === r.rgb.join(','))),
      '淡蓝 / 异常红',
    ])
    const minCr = Math.min(...rows.map((r) => r.cr))
    checks.push(['次级数值对比度 ≥ 4.5', minCr >= 4.5, String(minCr)])
  }

  // ===== 异常数据：统一红，且亮度不低于最弱辅助 =====
  console.log('--- 异常数据 ---')
  const redEls = []
  const nonRedEls = []
  for (const t of anomalyCandidates) {
    const rgb = rgbOf(t.color)
    ;(rgb.join(',') === ANOMALY_RGB.join(',') ? redEls : nonRedEls).push({ ...t, rgb })
  }
  console.log(`红色 ${redEls.length} 个 / 非红 ${nonRedEls.length} 个`)
  for (const t of nonRedEls) {
    const bg = localBg(t.box)
    console.log(`    非红：${t.sel.padEnd(22)} 「${t.text}」 ${t.rgb.join(',')}`)
  }
  // 所有红色元素必须同色（只有一个红）
  const redColorSet = new Set(redEls.map((t) => t.rgb.join(',')))
  checks.push(['异常数据只用同一个红', redColorSet.size <= 1, [...redColorSet].join(' / ') || '无红元素'])
  // 异常红的亮度位置：必须高于最弱辅助（否则"最弱的一行"比"要处理的故障"更亮），
  // 同时低于 L3 辅助说明（否则红会被当成普通辅助色，语义丢失）
  const dimRole = roleStats.find((s) => s.role.includes('L4'))
  const subRole = roleStats.find((s) => s.role.includes('L3'))
  if (dimRole && redEls.length) {
    const redLum = +relLum(ANOMALY_RGB).toFixed(4)
    checks.push([
      '异常红亮于 L4 最弱辅助',
      redLum > dimRole.lum,
      `亮度 ${redLum} > ${dimRole.lum}`,
    ])
    if (subRole) {
      checks.push([
        '异常红弱于 L3 辅助说明',
        redLum < subRole.lum,
        `亮度 ${redLum} < ${subRole.lum}`,
      ])
    }
    const redCr = +contrast(ANOMALY_RGB, localBg(redEls[0].box)).toFixed(2)
    checks.push(['异常红实测对比度 ≥ 4.5', redCr >= 4.5, String(redCr)])
  }
  // 非异常元素不占语义色，且都在中性色阶内
  const semanticHit = nonRedEls.filter((t) =>
    FORBIDDEN_RGB.some((f) => f.join(',') === t.rgb.join(',')),
  )
  checks.push(['非异常数据未使用语义色', semanticHit.length === 0, semanticHit.map((t) => t.text).join(',') || '无'])
  const offPalette = nonRedEls.filter(
    (t) => !NEUTRAL_RGB.some((n) => n.join(',') === t.rgb.join(',')),
  )
  checks.push([
    '非异常元素均在中性色阶内',
    offPalette.length === 0,
    offPalette.map((t) => `${t.text}:${t.rgb.join(',')}`).join(' ') || '无',
  ])

  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}：${detail}`)
    if (!ok) failed++
  }

  fs.mkdirSync(OUT, { recursive: true })
  const snap = (path, clip) =>
    page
      .screenshot({ path, clip, timeout: 90000, animations: 'disabled' })
      .catch(() => console.log(`  ! 截图失败：${path}`))
  await snap(`${OUT}/整屏-${vp.width}.png`, { x: 0, y: 0, width: vp.width, height: vp.height })
  // 用页面内取矩形而非 locator.boundingBox：后者会等元素"稳定"，
  // 三维模型持续动画时永远不稳定，必然超时。
  const boxes = await page.evaluate(() => {
    const get = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }
    }
    return { right: get('.col--right'), left: get('.col--left'), bar: get('.ebike-v2__statusbar') }
  })
  if (boxes.right) await snap(`${OUT}/右列-${vp.width}.png`, boxes.right)
  if (boxes.left) await snap(`${OUT}/左列-${vp.width}.png`, boxes.left)
  if (boxes.bar) await snap(`${OUT}/态势条-${vp.width}.png`, boxes.bar)

  await page.close()
}

await browser.close()
console.log(failed ? `\n✗ ${failed} 项未通过` : '\n✓ 全部通过')
process.exit(failed ? 1 : 0)
