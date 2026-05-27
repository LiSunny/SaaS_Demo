const fs = require('fs')
const path = require('path')

const iconsDir = 'public/icons'
const out = 'public/sprite.svg'

const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'))

// 文件名 → 干净 id
function toId(filename) {
  let name = path.basename(filename, '.svg')
    .replace(/[（(][^)）]*[)）]/g, '') // 去括号及内容
    .replace(/[^\w-]/g, '')             // 去中文和特殊符号
    .replace(/-+/g, '-')                // 合并连字符
    .replace(/^-|-$/g, '')              // 去首尾连字符
  return name.toLowerCase()
}

const symbols = []
const map = []
const seen = new Set()

files.forEach(f => {
  let id = toId(f)
  // 去重：同名加数字后缀
  let n = 1, base = id
  while (seen.has(id)) { id = `${base}-${n++}` }
  seen.add(id)
  let raw = fs.readFileSync(path.join(iconsDir, f), 'utf8')
  const inner = raw.replace(/<svg[^>]*>|<\/svg>/gi, '').trim()
  const cleaned = inner
    .replace(/stroke="(?!currentColor)[^"]*"/g, 'stroke="currentColor"')
    .replace(/fill="(?!currentColor|none)[^"]*"/g, 'fill="currentColor"')
  symbols.push(`<symbol id="${id}" viewBox="0 0 24 24">${cleaned}</symbol>`)
  map.push(`<!-- ${f} → #${id} -->`)
})

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${map.join('\n')}
${symbols.join('\n')}
</svg>
`
fs.writeFileSync(out, sprite)
console.log(`sprite.svg built: ${files.length} icons`)
