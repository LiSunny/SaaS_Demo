/**
 * 图元库一致性校验
 *
 * 校验构建产物、点表、布局文件与文档声明是否互相自洽。
 * 用法：node scripts/verify-symbol-library.mjs
 *
 * 覆盖：
 *   1. 分类树：图元引用的分类与系统必须已声明，计数必须对得上
 *   2. 点表：点名唯一、寄存器连续不重叠、系统列与 manifest 一致、点名与图元绑定一致
 *   3. 布局：必须声明画布尺寸、图元存在、端口不越界、节点外框在画布内、尺寸档位合法、边引用有效
 *   4. 文档：清单文档声明的数字必须能从 manifest 与点表复算出来
 *   5. 跨文档：README 与清单文档的系统分布表、布局画布尺寸/节点数/连线数必须与产物一致
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const libRoot = path.join(root, 'symbol-library')
const dist = path.join(libRoot, 'dist')
const layoutsDir = path.join(libRoot, 'src', 'layouts')

const errors = []
const warns = []
const err = (m) => errors.push(m)
const warn = (m) => warns.push(m)

const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'))
const csvText = fs.readFileSync(path.join(dist, 'points.sample.csv'), 'utf8').replace(/^﻿/, '')
const docPath = path.join(libRoot, 'docs', '气体灭火图元清单.md')
const doc = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : ''
const readmePath = path.join(libRoot, 'README.md')
const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : ''

const SIZE_STEPS = [40, 48, 60, 72, 96]
const PORT_DIRS = ['left', 'right', 'up', 'down']
const ID_RE = /^[A-Z]{2,4}-[A-Z]{2,5}-\d{2}$/

/* ── 1. 分类树 ───────────────────────────────────────────── */
const symbols = manifest.symbols ?? []
const systems = manifest.systems ?? []
const categories = manifest.categories ?? []
const sysKeys = new Set(systems.map((s) => s.key))
const catKeys = new Set(categories.map((c) => c.key))
const catMap = new Map(categories.map((c) => [c.key, c]))
const symMap = new Map(symbols.map((s) => [s.id, s]))

if (!systems.length) err('manifest.systems 为空')
if (!categories.length) err('manifest.categories 为空')

for (const s of symbols) {
  if (!catKeys.has(s.category)) err(`${s.id} 引用了未声明的分类：${s.category}`)
  if (!sysKeys.has(s.system)) err(`${s.id} 引用了未声明的系统：${s.system}`)
  if (!ID_RE.test(s.id)) err(`${s.id} 图元 ID 不符合命名规范`)
  if (!s.bindings?.length) err(`${s.id} 未定义任何绑定`)
  for (const p of s.ports ?? []) {
    if (p.x < 0 || p.x > 64 || p.y < 0 || p.y > 64) err(`${s.id} 连接点越界：${p.x},${p.y}`)
    if (!PORT_DIRS.includes(p.dir)) err(`${s.id} 连接点方向非法：${p.dir}`)
  }
}

for (const c of categories) {
  if (!sysKeys.has(c.system)) err(`分类 ${c.key} 归属了未声明的系统：${c.system}`)
  if (!c.screen) err(`分类 ${c.key} 未声明建议画面`)
  const actual = symbols.filter((s) => s.category === c.key).length
  if (actual !== c.count) err(`分类 ${c.key} 声明 ${c.count} 个图元，实际 ${actual}`)
}

for (const sys of systems) {
  const actual = symbols.filter((s) => s.system === sys.key).length
  if (actual !== sys.symbols.length) {
    err(`系统 ${sys.key} 的 symbols 列表 ${sys.symbols.length} 个，实际 ${actual}`)
  }
  for (const sid of sys.symbols) {
    const s = symMap.get(sid)
    if (!s) err(`系统 ${sys.key} 引用了不存在的图元 ${sid}`)
    else if (s.system !== sys.key) err(`图元 ${sid} 归属系统为 ${s.system}，却在 ${sys.key} 的列表中`)
  }
}

/* ── 2. 点表 ─────────────────────────────────────────────── */
const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '')
const header = lines[0].split(',')
const EXPECT_COLS = [
  '点名', '图元ID', '图元名称', '系统', '分类', '绑定', '数据类型', '寄存器', '读写',
  '量程下限', '量程上限', '单位', '报警下限', '报警上限', '死区', '延时s', '画面', '说明',
]
if (header.join(',') !== EXPECT_COLS.join(',')) {
  err(`点表表头不符：\n  实际 ${header.join(',')}\n  期望 ${EXPECT_COLS.join(',')}`)
}

const rows = lines.slice(1).map((l) => {
  const cells = l.split(',')
  const o = {}
  EXPECT_COLS.forEach((c, i) => { o[c] = cells[i] ?? '' })
  return o
})

const seenPoints = new Map()
const sysNameByKey = new Map(systems.map((s) => [s.key, s.name]))
for (const r of rows) {
  if (seenPoints.has(r.点名)) err(`点名重复：${r.点名}（${seenPoints.get(r.点名)} 与 ${r.图元ID}）`)
  else seenPoints.set(r.点名, r.图元ID)

  const sym = symMap.get(r.图元ID)
  if (!sym) { err(`点表引用了不存在的图元：${r.图元ID}`); continue }
  if (r.图元名称 !== sym.name) err(`${r.点名} 图元名称不一致：表=${r.图元名称} manifest=${sym.name}`)
  if (r.分类 !== sym.category) err(`${r.点名} 分类不一致：表=${r.分类} manifest=${sym.category}`)
  if (r.系统 !== (sysNameByKey.get(sym.system) ?? sym.system)) {
    err(`${r.点名} 系统列不一致：表=${r.系统} manifest=${sys.system}`)
  }
  if (!sym.bindings.some((b) => b.point === r.点名)) err(`${r.点名} 不在图元 ${r.图元ID} 的绑定定义中`)
  if (!r.点名.startsWith(r.图元ID.replace(/-/g, '_') + '_')) err(`点名与图元 ID 不符：${r.点名}`)
  if (r.数据类型 === 'DI' && !(r.量程下限 === '0' && r.量程上限 === '1')) {
    err(`${r.点名} DI 量程应为 0~1，实际 ${r.量程下限}~${r.量程上限}`)
  }
}

// 寄存器连续且不重叠
for (const type of ['AI', 'DI']) {
  const addrs = rows.filter((r) => r.数据类型 === type).map((r) => Number(r.寄存器.split('x')[1])).sort((a, b) => a - b)
  if (!addrs.length) { err(`${type} 没有任何点`); continue }
  const expect = addrs[0] + addrs.length - 1
  for (let i = 0; i < addrs.length; i++) {
    if (addrs[i] !== addrs[0] + i) { err(`${type} 寄存器不连续：${addrs.join(',')}`); break }
  }
  if (addrs[addrs.length - 1] !== expect) err(`${type} 寄存器区间异常`)
}

/* ── 3. 布局 ─────────────────────────────────────────────── */
const layouts = fs.existsSync(layoutsDir)
  ? fs.readdirSync(layoutsDir).filter((f) => f.endsWith('.json'))
  : []
const layoutData = []
for (const f of layouts) {
  const lay = JSON.parse(fs.readFileSync(path.join(layoutsDir, f), 'utf8'))
  layoutData.push({ file: f, lay })
  // 画布尺寸必须显式声明：编辑器画布按 layout.width/height 渲染
  if (!Number.isFinite(lay.width) || lay.width <= 0) err(`${f} 未声明画布宽度 width`)
  if (!Number.isFinite(lay.height) || lay.height <= 0) err(`${f} 未声明画布高度 height`)
  const ids = new Set()
  for (const n of lay.nodes ?? []) {
    if (ids.has(n.id)) err(`${f} 节点 ID 重复：${n.id}`)
    ids.add(n.id)
    const d = symMap.get(n.symbol)
    if (!d) { err(`${f} ${n.id} 未知图元 ${n.symbol}`); continue }
    if (!SIZE_STEPS.includes(n.size)) err(`${f} ${n.id} 尺寸档位非法：${n.size}`)
    // 按节点外框判越界：半宽 + 标签行（编辑器在节点下方 16/29 px 处画两行文字）
    const half = (n.size ?? 60) / 2
    if (
      n.x - half < 0 || n.x + half > (lay.width ?? 1200) ||
      n.y - half < 0 || n.y + half + 29 > (lay.height ?? 700)
    ) {
      err(`${f} ${n.id} 节点越界：${n.x},${n.y}（画布 ${lay.width ?? 1200}×${lay.height ?? 700}）`)
    }
  }
  for (const e of lay.edges ?? []) {
    for (const side of ['from', 'to']) {
      if (!ids.has(e[side].node)) { err(`${f} ${e.id} ${side} 引用了不存在的节点 ${e[side].node}`); continue }
      if (e.kind === 'control') continue
      const n = lay.nodes.find((x) => x.id === e[side].node)
      const d = symMap.get(n.symbol)
      const port = e[side].port ?? 0
      if (port >= (d.ports?.length ?? 0)) {
        err(`${f} ${e.id} ${side} 端口 ${port} 超出 ${n.symbol}（${d.ports?.length ?? 0} 口）`)
      }
    }
  }
}

/* ── 4. 文档声明 ─────────────────────────────────────────── */
if (doc) {
  const claim = (re, g = 1) => {
    const m = doc.match(re)
    return m ? Number(m[g]) : null
  }
  const gasSymbols = symbols.filter((s) => s.system === 'gas')
  const gasRows = rows.filter((r) => r.系统 === (sysNameByKey.get('gas') ?? '气体灭火'))
  const gasAi = gasRows.filter((r) => r.数据类型 === 'AI').length
  const gasDi = gasRows.filter((r) => r.数据类型 === 'DI').length

  const checks = [
    ['图元库图元', claim(/\| 图元库图元 \| (\d+) \|/), symbols.length],
    ['新增图元', claim(/\| 新增图元（气体灭火） \| (\d+) \|/), gasSymbols.length],
    ['二级分类', claim(/\| 二级分类 \| (\d+) \|/), categories.length],
    ['绑定点', claim(/\| 绑定点 \| (\d+) \|/), rows.length],
    ['气体灭火测点', claim(/\| 气体灭火测点 \| (\d+)（AI (\d+) \/ DI (\d+)） \|/), gasRows.length],
    ['AI 点数', claim(/\| 气体灭火测点 \| \d+（AI (\d+) \/ DI \d+） \|/), gasAi],
    ['DI 点数', claim(/\| 气体灭火测点 \| \d+（AI \d+ \/ DI (\d+)） \|/), gasDi],
    ['点表规模', claim(/\| 点表规模 \| \d+ → (\d+) \|/), rows.length],
    ['连接点', claim(/\| 连接点 \| (\d+) \|/), symbols.reduce((n, s) => n + (s.ports?.length ?? 0), 0)],
  ]
  for (const [name, claimed, actual] of checks) {
    if (claimed === null) { warn(`文档未声明：${name}`); continue }
    if (claimed !== actual) err(`文档「${name}」声明 ${claimed}，实际 ${actual}`)
  }

  // 清单文档里的 CSV 块必须与构建产物一致
  const m = doc.match(/```csv\n([\s\S]*?)```/)
  if (!m) err('文档缺少点表 CSV 块')
  else {
    const docRows = m[1].trim().split('\n').map((l) => l.split(','))
    if (docRows.length !== gasRows.length) {
      err(`文档点表块 ${docRows.length} 行，实际气体灭火测点 ${gasRows.length} 行`)
    } else {
      const gasPointOrder = gasRows.map((r) => r.点名)
      docRows.forEach((cells, i) => {
        if (cells[0] !== gasPointOrder[i]) {
          err(`文档点表块第 ${i + 1} 行点名 ${cells[0]}，与产物顺序 ${gasPointOrder[i]} 不一致`)
        }
      })
    }
  }
}

/* ── 5. 跨文档声明（README + 清单文档） ────────────────────── */
const docTexts = [['README.md', readme], ['docs/气体灭火图元清单.md', doc]]

/** 解析「一级（系统）」分布表 → [[系统 key, 图元数], ...] */
function parseSystemTable(text) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.includes('一级（系统）'))
  if (start < 0) return null
  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i].trim()
    if (!l.startsWith('|')) break
    const cells = l.split('|').map((c) => c.trim()).filter((c) => c !== '')
    let key = null
    for (const c of cells) {
      const bare = c.replace(/`/g, '')
      if (sysKeys.has(bare)) { key = bare; break }
      const m = c.match(/`([a-z]+)`/)
      if (m && sysKeys.has(m[1])) { key = m[1]; break }
    }
    if (!key) continue
    const n = Number(cells[cells.length - 1])
    if (Number.isFinite(n)) out.push([key, n])
  }
  return out
}

for (const [label, text] of docTexts) {
  if (!text) { warn(`${label} 不存在，跳过声明核对`); continue }

  // 分布表：每个系统的图元数与 manifest 一致，且之和等于图元总数
  const table = parseSystemTable(text)
  if (!table) warn(`${label} 没有「一级（系统）」分布表`)
  else {
    for (const [key, claimed] of table) {
      const actual = symbols.filter((s) => s.system === key).length
      if (claimed !== actual) err(`${label} 分布表「${key}」声明 ${claimed}，实际 ${actual}`)
    }
    const sum = table.reduce((n, [, c]) => n + c, 0)
    if (sum !== symbols.length) err(`${label} 分布表图元数之和 ${sum}，实际 ${symbols.length}`)
  }

  // 布局声明：出现的画布尺寸 / 节点数 / 连线数必须与布局文件一致
  for (const { file, lay } of layoutData) {
    const lines = text.split('\n').filter((l) => l.includes(file))
    if (!lines.length) continue
    const declLines = lines.filter((l) => /\d{3,4}\s*×\s*\d{3,4}/.test(l))
    for (const l of declLines) {
      const size = l.match(/(\d{3,4})\s*×\s*(\d{3,4})/)
      if (size && (Number(size[1]) !== lay.width || Number(size[2]) !== lay.height)) {
        err(`${label} 布局 ${file} 画布尺寸声明 ${size[1]}×${size[2]}，实际 ${lay.width}×${lay.height}`)
      }
      const nodes = l.match(/(\d+)\s*节点/)
      if (nodes && Number(nodes[1]) !== lay.nodes.length) {
        err(`${label} 布局 ${file} 节点数声明 ${nodes[1]}，实际 ${lay.nodes.length}`)
      }
      const edges = l.match(/(\d+)\s*连线/)
      if (edges && Number(edges[1]) !== lay.edges.length) {
        err(`${label} 布局 ${file} 连线数声明 ${edges[1]}，实际 ${lay.edges.length}`)
      }
    }
  }
}

// 气体灭火总貌是主交付物：两份文档都必须声明它的画布尺寸与节点/连线数
for (const [label, text] of docTexts) {
  const gas = layoutData.find((d) => d.file === 'demo-gasfire.json')
  if (!gas) continue
  const line = text.split('\n').find((l) => l.includes('demo-gasfire.json') && /\d{3,4}\s*×\s*\d{3,4}/.test(l))
  if (!line) { err(`${label} 未声明气体灭火布局的画布尺寸`); continue }
  if (!line.includes(`${gas.lay.nodes.length} 节点`) || !line.includes(`${gas.lay.edges.length} 连线`)) {
    err(`${label} 气体灭火布局未声明 ${gas.lay.nodes.length} 节点 / ${gas.lay.edges.length} 连线`)
  }
}

/* ── 结果 ────────────────────────────────────────────────── */
const bySystem = systems
  .map((s) => `${s.name} ${symbols.filter((x) => x.system === s.key).length}`)
  .join(' / ')
console.log(`图元 ${symbols.length} · 系统 ${systems.length} · 分类 ${categories.length} · 测点 ${rows.length}`)
console.log(`分布：${bySystem}`)
console.log(`布局：${layouts.length} 个`)
if (warns.length) {
  console.log('\n警告：')
  warns.forEach((w) => console.log('  ! ' + w))
}
if (errors.length) {
  console.error(`\n校验未通过，共 ${errors.length} 项：`)
  errors.forEach((e) => console.error('  ✗ ' + e))
  process.exit(1)
}
console.log('\n校验通过：分类树 / 点表 / 布局 / 文档声明 一致')
