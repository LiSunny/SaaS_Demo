// 校验：所有 .vue 模板里用到的 el-* 组件，都能被新的按需 resolver 解析
import fs from 'fs'
import path from 'path'

const ROOT = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo/src'

// 从生成的映射表里取组件名
const mapSrc = fs.readFileSync(path.join(ROOT, 'config/element-plus-components.ts'), 'utf8')
const known = new Set([...mapSrc.matchAll(/^  (El[A-Za-z0-9]+):/gm)].map((m) => m[1]))
// 官方 resolver 兜底能处理的：ElIcon* → @element-plus/icons-vue
const isIcon = (n) => /^ElIcon.+/.test(n)

function toPascal(kebab) {
  return kebab.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.vue')) out.push(p)
  }
  return out
}

const missing = new Map()
let totalTags = 0
const used = new Set()

for (const file of walk(ROOT)) {
  const s = fs.readFileSync(file, 'utf8')
  const tpl = s.match(/<template>([\s\S]*)<\/template>/)
  if (!tpl) continue
  for (const m of tpl[1].matchAll(/<(el-[a-z0-9-]+)/g)) {
    totalTags++
    const name = 'El' + toPascal(m[1].slice(3))
    used.add(name)
    if (!known.has(name) && !isIcon(name)) {
      if (!missing.has(name)) missing.set(name, [])
      missing.get(name).push(path.relative(ROOT, file))
    }
  }
}

console.log(`扫描 el-* 标签 ${totalTags} 处，去重后 ${used.size} 个组件`)
console.log(`映射表覆盖: ${[...used].filter((n) => known.has(n)).length} 个`)
console.log(`走 ElIcon* 兜底: ${[...used].filter(isIcon).length} 个`)

if (missing.size === 0) {
  console.log('\n✅ 所有 el-* 组件都在按需映射表里 —— 不会有组件漏注册')
} else {
  console.log(`\n❌ ${missing.size} 个组件不在映射表（会渲染成未知元素）:`)
  for (const [name, files] of missing) {
    console.log(`  ${name.padEnd(22)} ${[...new Set(files)].slice(0, 3).join(', ')}`)
  }
}
