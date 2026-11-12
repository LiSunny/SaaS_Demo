#!/usr/bin/env node
/**
 * 把 `from 'element-plus'` 全量入口导入改为按需路径。
 *
 * 背景：项目有 75 处 `import { ElMessage } from 'element-plus'` 这类写法。
 * element-plus 的全量入口 es/index.mjs 顶层有一批 import，Rollup 保守保留，
 * 结果整个库（1.5MB）都进了入口 chunk —— 即使只用了 ElMessage / ElMessageBox。
 *
 * 改法：换成 Element Plus 官方的按需路径，并补上对应的样式 import
 *       （按需路径的 index.mjs 不含样式，样式在 style/css）。
 */
import fs from 'fs'
import path from 'path'

const ROOT = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo'

// 符号 → { module: 按需模块路径, css: 样式路径 }
const SYMBOLS = {
  ElMessage: { module: 'element-plus/es/components/message', css: 'element-plus/es/components/message/style/css' },
  ElMessageBox: { module: 'element-plus/es/components/message-box', css: 'element-plus/es/components/message-box/style/css' },
  ElNotification: { module: 'element-plus/es/components/notification', css: 'element-plus/es/components/notification/style/css' },
  ElLoading: { module: 'element-plus/es/components/loading', css: 'element-plus/es/components/loading/style/css' },
  vLoading: { module: 'element-plus/es/components/loading', css: 'element-plus/es/components/loading/style/css' },
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(vue|ts)$/.test(e.name)) out.push(p)
  }
  return out
}

let changedFiles = 0
let changedImports = 0

for (const file of walk(path.join(ROOT, 'src'))) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s

  // 匹配 import { A, B } from 'element-plus'
  s = s.replace(/import\s*\{([^}]*)\}\s*from\s*['"]element-plus['"]/g, (match, body) => {
    const names = body.split(',').map((x) => x.trim()).filter(Boolean)
    const groups = new Map() // module → { names[], css }
    const unknown = []

    for (const raw of names) {
      const name = raw.replace(/\s+as\s+.*$/, '').trim()
      const alias = raw.includes(' as ') ? raw.split(/\s+as\s+/)[1].trim() : null
      const spec = SYMBOLS[name]
      if (!spec) {
        unknown.push(raw)
        continue
      }
      if (!groups.has(spec.module)) groups.set(spec.module, { names: [], css: spec.css })
      groups.get(spec.module).names.push(alias ? `${name} as ${alias}` : name)
      changedImports++
    }

    if (unknown.length) {
      console.log(`⚠️  ${path.relative(ROOT, file)}: 未覆盖的符号 ${unknown.join(', ')} —— 保持原样`)
      return match
    }

    const lines = []
    for (const [mod, g] of groups) {
      lines.push(`import { ${g.names.join(', ')} } from '${mod}'`)
      lines.push(`import '${g.css}'`)
    }
    return lines.join('\n')
  })

  if (s !== orig) {
    fs.writeFileSync(file, s)
    changedFiles++
  }
}

console.log(`\n改写文件 ${changedFiles} 个，导入 ${changedImports} 处`)
