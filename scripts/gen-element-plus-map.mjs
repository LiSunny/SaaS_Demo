#!/usr/bin/env node
/**
 * 生成 Element Plus 精确组件路径映射表。
 *
 * 背景：unplugin-vue-components 的 ElementPlusResolver 对 EP 2.x 一律返回
 * `from: "element-plus/es"`（全量入口），Rollup/Rolldown 无法 tree-shake 干净，
 * 结果整个 element-plus（1.5MB）都进了入口 chunk。
 *
 * 这里扫描 element-plus/es/components 下每个组件的导出名，生成
 *   组件名 → { from: 精确模块路径, sideEffects: 精确样式路径 }
 * 供 vite.config.ts 的自定义 resolver 使用，实现真正的按需引入。
 */
import fs from 'fs'
import path from 'path'

const EP = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo/node_modules/element-plus'
const OUT = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo/src/config/element-plus-components.ts'

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.mjs')) out.push(p)
  }
  return out
}

// 只扫一级组件目录的 index.mjs：
// 子组件（ElTableColumn / ElOption / ElTabPane…）不在自己的目录里，
// 而是由父组件目录的 index.mjs 一并导出（见 table/index.mjs），
// 所以按父目录引入才能既按需又带全子组件。
const compDir = path.join(EP, 'es/components')
const dirs = fs.readdirSync(compDir, { withFileTypes: true }).filter((d) => d.isDirectory())
const files = dirs.map((d) => path.join(compDir, d.name, 'index.mjs')).filter((f) => fs.existsSync(f))
const map = {}

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8')
  const rel = path.relative(EP, f).replace(/\\/g, '/')

  // 提取导出的 ElXxx 名
  const names = new Set()
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const seg = part.trim()
      if (!seg) continue
      const asMatch = seg.match(/\bas\s+([A-Za-z_$][\w$]*)/)
      const local = seg.replace(/\s+as\s+.*$/, '').trim()
      const exported = asMatch ? asMatch[1] : local
      if (/^El[A-Z]/.test(exported)) names.add(exported)
    }
  }

  if (names.size === 0) continue

  // 样式路径：<同目录>/style/css.mjs
  const stylePath = path.join(path.dirname(f), 'style/css.mjs')
  const styleRel = fs.existsSync(stylePath) ? path.relative(EP, stylePath).replace(/\\/g, '/') : null

  for (const n of names) {
    if (map[n]) continue
    map[n] = { from: rel, style: styleRel }
  }
}

const entries = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
console.log(`解析到 ${entries.length} 个 Element Plus 组件`)

const body = entries
  .map(([name, v]) => `  ${name}: { from: '${v.from}'${v.style ? `, style: '${v.style}'` : ''} },`)
  .join('\n')

fs.writeFileSync(
  OUT,
  `/* eslint-disable */
/**
 * Element Plus 组件精确路径映射表（自动生成，勿手改）
 *
 * 由 scripts/gen-element-plus-map.mjs 生成。
 *
 * 用途：替换 unplugin-vue-components 官方 ElementPlusResolver 的
 * \`from: "element-plus/es"\` 全量入口 —— 那个入口无法被 tree-shake 干净，
 * 导致 1.5MB 的 element-plus 全部进入首屏 chunk。
 */
export interface ElementPlusComponentEntry {
  from: string
  style?: string
}

export const ELEMENT_PLUS_COMPONENTS: Record<string, ElementPlusComponentEntry> = {
${body}
}
`,
  'utf8',
)
console.log(`已写入 ${OUT}`)
console.log('样例:', entries.slice(0, 6).map(([k, v]) => `${k}->${v.from}`).join(', '))
