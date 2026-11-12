#!/usr/bin/env node
/**
 * 门户页大图批量转 WebP 并更新引用。
 *
 * 背景：线上门户页首屏要拉近 7MB 图片（5 张 ~1MB 的场景图 + hero 背景 + 大屏截图，
 * 其中 /screenshots/gangnan-cockpit.png 单张 3.5MB），是首屏慢的主要来源之一。
 *
 * 策略：
 *   1. 对超过阈值的图片跑 cwebp（质量 82，视觉几乎无损，体积通常降到 1/3~1/4）
 *   2. 把源码里的 .png/.jpg 引用改成 .webp
 *   3. 原文件保留不动（部署体积不变；运行时只下 webp）
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const ROOT = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo'
const MIN_BYTES = 60 * 1024 // 只处理 >60KB 的

// 需要扫描的目录（相对仓库根）
const DIRS = [
  'public/images/portal',
  'public/images/unsplash',
  'public/screenshots',
  'src/assets/portal',
]

const EXTS = new Set(['.png', '.jpg', '.jpeg'])

// 收集源文件
const targets = []
for (const d of DIRS) {
  const abs = path.join(ROOT, d)
  if (!fs.existsSync(abs)) continue
  for (const f of fs.readdirSync(abs)) {
    const ext = path.extname(f).toLowerCase()
    if (!EXTS.has(ext)) continue
    const p = path.join(abs, f)
    const size = fs.statSync(p).size
    if (size >= MIN_BYTES) targets.push({ abs: p, rel: path.relative(ROOT, p), size })
  }
}

console.log(`待转换图片 ${targets.length} 张，合计 ${(targets.reduce((s, t) => s + t.size, 0) / 1024 / 1024).toFixed(2)}MB\n`)

let totalBefore = 0
let totalAfter = 0
const renamed = [] // { from, to }

for (const t of targets) {
  const out = t.abs.replace(/\.(png|jpe?g)$/i, '.webp')
  try {
    execFileSync('cwebp', ['-q', '82', '-m', '6', '-quiet', t.abs, '-o', out])
  } catch (e) {
    console.log(`⚠️  转换失败 ${t.rel}`)
    continue
  }
  const after = fs.statSync(out).size
  totalBefore += t.size
  totalAfter += after
  renamed.push({
    from: t.rel,
    to: path.relative(ROOT, out),
    fromBase: path.basename(t.abs),
    toBase: path.basename(out),
  })
  console.log(
    `✅ ${path.basename(t.rel).padEnd(28)} ${(t.size / 1024).toFixed(0).padStart(6)}KB → ${(after / 1024).toFixed(0).padStart(5)}KB  (${(t.size / after).toFixed(1)}x)`,
  )
}

console.log(`\n合计 ${(totalBefore / 1024 / 1024).toFixed(2)}MB → ${(totalAfter / 1024 / 1024).toFixed(2)}MB  (${(totalBefore / totalAfter).toFixed(1)}x)`)

// ---- 更新引用 ----
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.tmp', '.tmp-check', 'test-results', 'reports', 'screenshots'].includes(e.name)) continue
      walk(p, out)
    } else if (/\.(vue|ts|js|css|scss|html)$/.test(e.name)) out.push(p)
  }
  return out
}

const codeFiles = walk(ROOT).filter((f) => !f.includes('/dist/') && !f.includes('/public/'))

let changed = 0
for (const cf of codeFiles) {
  let s = fs.readFileSync(cf, 'utf8')
  const orig = s
  for (const r of renamed) {
    // 1) 绝对路径形式 /images/portal/x.png
    s = s.split(`/${r.from}`).join(`/${r.to}`)
    // 2) alias 形式 @/assets/portal/x.png
    s = s.split(`@/${r.from}`).join(`@/${r.to}`)
    // 3) 裸文件名形式（截图数组里常见）
    s = s.split(`/${r.fromBase}`).join(`/${r.toBase}`)
  }
  if (s !== orig) {
    fs.writeFileSync(cf, s)
    changed++
    console.log(`  ↻ ${path.relative(ROOT, cf)}`)
  }
}
console.log(`\n更新引用文件数: ${changed}`)
