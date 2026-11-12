#!/usr/bin/env node
/**
 * 补齐缺失的本地头像。
 *
 * 背景：门户页（IndustryCampus 等）直接拼 `/images/avatars/<人名>.svg`，
 * 但 public/images/avatars/ 下并没有对应文件，运行时就是一堆 404。
 * 现有 32 个头像都是 DiceBear 的 Lorelei 系列，这里用同一系列补齐缺失项，
 * 风格保持一致；命名按角色人名，让图与人对得上。
 *
 * 用法：
 *   node scripts/gen-missing-avatars.mjs 周阿姨 孙老师 赵老师
 *   node scripts/gen-missing-avatars.mjs --check        # 只报告缺失，不下载
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'public/images/avatars')
const API = 'https://api.dicebear.com/9.x/lorelei/svg'

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const names = args.filter((a) => !a.startsWith('--'))

function existing() {
  if (!fs.existsSync(DIR)) return new Set()
  return new Set(
    fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.replace(/\.svg$/, '')),
  )
}

/** 把「被引用的人名」全量列出来：扫门户页里所有 person/avatar 字面量 */
function referencedNames() {
  const files = [
    'src/views/portal/IndustryIndustry.vue',
    'src/views/portal/IndustryCampus.vue',
    'src/views/portal/IndustryMerchant.vue',
    'src/views/portal/CaseDetail.vue',
  ]
  const set = new Set()
  for (const rel of files) {
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) continue
    const src = fs.readFileSync(abs, 'utf8')
    for (const m of src.matchAll(/(?:person|avatar):\s*'([^']+)'/g)) set.add(m[1])
  }
  return set
}

const have = existing()
const ref = referencedNames()
const missing = [...ref].filter((n) => !have.has(n)).sort()

console.log(`头像目录：${DIR}`)
console.log(`已有 ${have.size} 个，被引用 ${ref.size} 个`)
if (missing.length === 0) {
  console.log('✅ 无缺失头像')
  process.exit(0)
}
console.log(`缺失 ${missing.length} 个：${missing.join('、')}`)

if (checkOnly) process.exit(0)

for (const name of missing) {
  const url = `${API}?seed=${encodeURIComponent(name)}&backgroundType=gradientLinear`
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) {
    console.error(`✗ ${name}：HTTP ${res.status}`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const text = buf.toString('utf8')
  if (!text.includes('<svg') || text.includes('<!DOCTYPE html')) {
    console.error(`✗ ${name}：返回内容不是 SVG`)
    continue
  }
  const out = path.join(DIR, `${name}.svg`)
  fs.writeFileSync(out, buf)
  console.log(`✓ ${name}.svg（${(buf.length / 1024).toFixed(1)} KB）`)
}
