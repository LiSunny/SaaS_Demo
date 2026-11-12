#!/usr/bin/env node
/**
 * 收集全项目实际渲染的字符集，供字体子集化使用。
 *
 * 产出：/tmp/project-charset.txt
 * 用法：node scripts/collect-charset.mjs && /tmp/fontenv/bin/python scripts/subset-fonts.py
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'src')
const OUT = '/tmp/project-charset.txt'

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(vue|ts|css|scss)$/.test(e.name)) out.push(p)
  }
  return out
}

const files = walk(SRC)
const chars = new Set()

// ASCII 可打印全集
for (let i = 0x20; i <= 0x7e; i++) chars.add(String.fromCharCode(i))
// 常用中文标点与符号
for (const c of '　、。，！？；：“”‘’（）《》【】—…·×÷≥≤±°％￥＄€§©®™→←↑↓✓✕★☆●○◆◇■□▲▼「」『』〔〕～') chars.add(c)

for (const f of files) {
  const s = fs.readFileSync(f, 'utf8')

  const tpl = s.match(/<template>([\s\S]*)<\/template>/)
  if (tpl) {
    const text = tpl[1].replace(/<[^>]*>/g, ' ').replace(/\{\{[^}]*\}\}/g, ' ')
    for (const c of text) chars.add(c)
  }

  for (const m of s.matchAll(/'([^'\\\n]{1,300})'/g)) for (const c of m[1]) chars.add(c)
  for (const m of s.matchAll(/"([^"\\\n]{1,300})"/g)) for (const c of m[1]) chars.add(c)
  for (const m of s.matchAll(/`([^`\\]{1,300})`/g)) for (const c of m[1]) chars.add(c)
  for (const m of s.matchAll(/content:\s*['"]([^'"]+)['"]/g)) for (const c of m[1]) chars.add(c)
}

const set = [...chars]
  .filter((c) => {
    const cp = c.codePointAt(0)
    return cp >= 0x20 && cp !== 0x7f
  })
  .sort()

fs.writeFileSync(OUT, set.join(''), 'utf8')
console.log(`扫描文件数: ${files.length}`)
console.log(`字符集大小: ${set.length}`)
console.log(`已写入: ${OUT}`)
