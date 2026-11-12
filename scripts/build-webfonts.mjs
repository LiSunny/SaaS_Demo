// 自托管 Google Fonts：保留 unicode-range 分片结构，只下载字符集实际命中的分片
// 运行时浏览器仍按 unicode-range 只请求需要的分片，首屏只下 1~2 个小文件
//
// 用法：node scripts/build-webfonts.mjs
// 前置：字符集由 scripts/collect-charset.mjs 生成到 /tmp/project-charset.txt
import fs from 'fs'
import { execFileSync } from 'child_process'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const CHARSET_FILE = '/tmp/project-charset.txt'
const CHARSET = fs.existsSync(CHARSET_FILE)
  ? fs.readFileSync(CHARSET_FILE, 'utf8')
  : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const CODEPOINTS = [...new Set([...CHARSET].map((c) => c.codePointAt(0)))].sort((a, b) => a - b)

const ROOT = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo'
const OUT_FONT_DIR = `${ROOT}/public/fonts`
const OUT_CSS = `${ROOT}/src/styles/webfonts.css`

const TARGETS = [
  { family: 'Noto Sans SC', weights: '400;500;600;700' },
  { family: 'Outfit', weights: '400;500;600;700;800;900' },
]

fs.mkdirSync(OUT_FONT_DIR, { recursive: true })

/** 解析 unicode-range 成 [start,end] 列表 */
function parseRange(spec) {
  return spec.split(',').map((part) => {
    const t = part.trim().replace(/^U\+/i, '')
    if (t.includes('-')) {
      const [a, b] = t.split('-').map((x) => parseInt(x, 16))
      return [a, b]
    }
    if (t.includes('?')) {
      return [parseInt(t.replace(/\?/g, '0'), 16), parseInt(t.replace(/\?/g, 'F'), 16)]
    }
    const v = parseInt(t, 16)
    return [v, v]
  })
}

function hits(rangeSpec) {
  const ranges = parseRange(rangeSpec)
  return CODEPOINTS.some((cp) => ranges.some(([a, b]) => cp >= a && cp <= b))
}

/** 按 @font-face 块切分（前置注释可能含星号，用正则单独取） */
function splitFaceBlocks(css) {
  const out = []
  const re = /@font-face\s*\{([\s\S]*?)\n\}/g
  let m
  while ((m = re.exec(css)) !== null) {
    const body = m[1]
    // 往前找最近的注释
    const before = css.slice(Math.max(0, m.index - 120), m.index)
    const c = before.lastIndexOf('/*')
    const label = c === -1 ? '' : before.slice(c + 2, before.indexOf('*/')).trim()
    out.push({ label, body })
  }
  return out
}

const cssChunks = []

for (const t of TARGETS) {
  const url =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.family)}:wght@${t.weights}&display=swap`
  console.log(`\n[${t.family}] 拉取 CSS ...`)
  const css = execFileSync('curl', ['-sS', '--noproxy', '*', '-A', UA, url], { encoding: 'utf8' })

  const blocks = splitFaceBlocks(css)
  console.log(`  @font-face 块数: ${blocks.length}`)

  const needUrls = new Set()
  const outBlocks = []
  let kept = 0

  for (const b of blocks) {
    const fontUrl = b.body.match(/url\((https:\/\/[^)]+)\)/)?.[1]
    const rangeSpec = b.body.match(/unicode-range:\s*([^;]+);/)?.[1]
    if (!fontUrl) continue
    if (rangeSpec && !hits(rangeSpec)) continue

    needUrls.add(fontUrl)
    kept++
    outBlocks.push({ label: b.label, body: b.body, fontUrl })
  }

  // 按 URL 去重下载
  const urlToName = new Map()
  let i = 0
  for (const u of needUrls) {
    const name = `gf-${t.family.replace(/\s+/g, '')}-${i++}.woff2`
    urlToName.set(u, name)
    const dest = `${OUT_FONT_DIR}/${name}`
    if (!fs.existsSync(dest)) {
      execFileSync('curl', ['-sS', '--noproxy', '*', '-A', UA, '-o', dest, u])
    }
  }

  let bytes = 0
  for (const n of urlToName.values()) bytes += fs.statSync(`${OUT_FONT_DIR}/${n}`).size
  console.log(`  ✅ 命中块 ${kept} 个 → 去重后文件 ${urlToName.size} 个，合计 ${(bytes / 1024).toFixed(1)} KB`)

  const rendered = outBlocks
    .map(
      (b) =>
        `/* ${b.label || t.family} */\n@font-face {\n${b.body.replace(/url\(https:\/\/[^)]+\)/, `url('/fonts/${urlToName.get(b.fontUrl)}')`).trim()}\n}`,
    )
    .join('\n')
  cssChunks.push(rendered)
}

fs.writeFileSync(
  OUT_CSS,
  `/* 自动生成 —— 请勿手改 */\n` +
    `/* 由 scripts/build-webfonts.mjs 生成：Google Fonts 自托管（保留 unicode-range 分片） */\n` +
    `/* 替代 index.html 里的 fonts.googleapis.com 链接，避免国内访问 Google Fonts 慢/被阻断 */\n\n` +
    cssChunks.join('\n\n') +
    '\n',
)
console.log(`\nCSS 已写入 ${OUT_CSS}`)
