#!/usr/bin/env node
/**
 * check-nav-consistency.mjs — 侧栏菜单一致性静态校验
 *
 * 校验三张表与路由表是否对齐（菜单改造后最易漏登记的地方）：
 *   1. 菜单叶子节点的 route 在 router 中真实存在
 *   2. 节点 key 登记在 NAV_KEY_TO_ROUTE，且与菜单里的 route 一致
 *   3. route 登记在 ROUTE_TO_NAV_KEY（否则刷新后选中态丢失）
 *   4. 挂 ModulePlaceholder 的路由，其 route.name 在模块页面配置表中有对应条目
 *   5. 菜单 key 全局唯一（分组 key 与节点 key 不重复）
 *
 * 用法：node scripts/check-nav-consistency.mjs
 */
import { readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const TMP_DIR = resolve(ROOT, 'scripts/.tmp-nav-check')

// ===== 1. 用 vite 打包出可直接 import 的导航数据 =====
async function loadNavData() {
  const { build } = await import('vite')
  const entry = resolve(TMP_DIR, 'entry.ts')
  mkdirSync(TMP_DIR, { recursive: true })
  writeFileSync(
    entry,
    [
      "import { NAV_GROUPS, ROUTE_TO_NAV_KEY, NAV_KEY_TO_ROUTE } from '@/config/navigation'",
      "import { MODULE_PAGE_CONFIG } from '@/views/shared/module-registry'",
      'export const payload = { NAV_GROUPS, ROUTE_TO_NAV_KEY, NAV_KEY_TO_ROUTE, MODULE_PAGE_CONFIG }',
      '',
    ].join('\n'),
  )
  await build({
    root: ROOT,
    logLevel: 'error',
    build: {
      ssr: true,
      write: true,
      outDir: TMP_DIR,
      emptyOutDir: false,
      minify: false,
      rollupOptions: {
        input: entry,
        output: { entryFileNames: 'nav-data.mjs', format: 'es' },
      },
    },
  })
  const mod = await import(`file://${resolve(TMP_DIR, 'nav-data.mjs')}`)
  return mod.payload
}

// ===== 2. 解析 router/index.ts 的路由表 =====
function sliceBalanced(text, start) {
  const open = text[start]
  const close = open === '{' ? '}' : open === '[' ? ']' : null
  let depth = 0
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return ''
}

function joinPath(parent, child) {
  if (!child) return parent
  const p = child.startsWith('/') ? child : `${parent}/${child}`
  return p.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
}

function parseRoutes(text, parentPath = '') {
  const routes = []
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    if (open === -1) break
    const body = sliceBalanced(text, open)
    i = open + body.length
    const inner = body.slice(1, -1)
    const pathM = inner.match(/\bpath:\s*'([^']*)'/)
    if (!pathM) continue
    const full = joinPath(parentPath, pathM[1])
    const nameM = inner.match(/\bname:\s*'([^']*)'/)
    const childrenM = inner.match(/\bchildren:\s*\[/)
    let children = []
    if (childrenM) {
      const arrStart = inner.indexOf('[', childrenM.index)
      const arrText = sliceBalanced(inner, arrStart)
      children = parseRoutes(arrText.slice(1, -1), full)
    }
    routes.push({
      path: full,
      name: nameM ? nameM[1] : null,
      placeholder: inner.includes('ModulePlaceholder'),
      children,
    })
  }
  return routes
}

// ===== 3. 校验 =====
async function main() {
  const { NAV_GROUPS, ROUTE_TO_NAV_KEY, NAV_KEY_TO_ROUTE, MODULE_PAGE_CONFIG } = await loadNavData()

  const routerText = readFileSync(resolve(ROOT, 'src/router/index.ts'), 'utf8')
  const routesIdx = routerText.indexOf('routes: [')
  const arrText = sliceBalanced(routerText, routerText.indexOf('[', routesIdx))
  const routes = parseRoutes(arrText.slice(1, -1))

  const routerPaths = new Set()
  const routerNameToPath = new Map()
  const placeholderNames = new Set()
  for (const r of routes) {
    routerPaths.add(r.path)
    if (r.name) routerNameToPath.set(r.name, r.path)
    if (r.placeholder && r.name) placeholderNames.add(r.name)
    for (const c of r.children) {
      routerPaths.add(c.path)
      if (c.name) routerNameToPath.set(c.name, c.path)
      if (c.placeholder && c.name) placeholderNames.add(c.name)
    }
  }

  const errors = []
  const warnings = []
  const allKeys = new Set()
  const leaves = []
  const deadLinks = []

  const walkNodes = (nodes, groupKey) => {
    for (const n of nodes) {
      if (allKeys.has(n.key)) errors.push(`菜单 key 重复：${n.key}（分组 ${groupKey}）`)
      allKeys.add(n.key)
      if (n.children) walkNodes(n.children, groupKey)
      else if (n.route) leaves.push({ ...n, groupKey })
    }
  }
  for (const g of NAV_GROUPS) {
    if (allKeys.has(g.key)) errors.push(`分组 key 与节点 key 重复：${g.key}`)
    allKeys.add(g.key)
    walkNodes(g.children, g.key)
  }

  for (const leaf of leaves) {
    if (!routerPaths.has(leaf.route)) {
      // 纯占位菜单（路由还没实现）不算错误，记为死链警告
      deadLinks.push(`${leaf.groupKey} › ${leaf.key} → ${leaf.route}`)
      continue
    }
    if (NAV_KEY_TO_ROUTE[leaf.key] !== leaf.route) {
      errors.push(`NAV_KEY_TO_ROUTE 未登记或不一致：${leaf.key}（登记 ${NAV_KEY_TO_ROUTE[leaf.key] ?? '无'}，菜单 ${leaf.route}）`)
    }
    if (!ROUTE_TO_NAV_KEY[leaf.route]) {
      errors.push(`ROUTE_TO_NAV_KEY 未登记：${leaf.route}（节点 ${leaf.key}）`)
    }
  }

  for (const name of placeholderNames) {
    if (!MODULE_PAGE_CONFIG[name]) {
      errors.push(`占位页缺配置：路由名 ${name} 未在模块页面配置表中登记`)
    }
  }
  for (const name of Object.keys(MODULE_PAGE_CONFIG)) {
    if (!routerNameToPath.has(name)) {
      errors.push(`页面配置无对应路由：${name}`)
    }
  }

  const groups = NAV_GROUPS.map(g => `${g.label}(${g.children.length})`).join('、')
  console.log(`导航分组 ${NAV_GROUPS.length} 个：${groups}`)
  console.log(`菜单叶子 ${leaves.length} 条，路由 ${routerPaths.size} 条，占位页配置 ${Object.keys(MODULE_PAGE_CONFIG).length} 条`)
  if (deadLinks.length) {
    console.log(`\n死链 ${deadLinks.length} 条（菜单项已就位、页面未实现，点击后落到占位页）：`)
    for (const d of deadLinks) console.log('  · ' + d)
  }
  if (errors.length) {
    console.error(`\n✗ 发现 ${errors.length} 处不一致：`)
    for (const e of errors) console.error('  - ' + e)
    process.exitCode = 1
  } else {
    console.log('\n✓ 菜单 / 路由 / 页面配置三方一致')
  }
  rmSync(TMP_DIR, { recursive: true, force: true })
}

main().catch(err => {
  console.error(err)
  rmSync(TMP_DIR, { recursive: true, force: true })
  process.exit(1)
})
