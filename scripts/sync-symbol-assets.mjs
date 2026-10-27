#!/usr/bin/env node
/**
 * sync-symbol-assets.mjs — 位图资源同步
 *
 * 图元库的 runtime.js 按 `imageBase + '/' + 文件名` 拼图片版图元的 <image href>，
 * 需要一条按原文件名直出的绝对路径。Vite 只有 public/ 目录能按原路径直出，
 * 所以把 symbol-library/dist/img 复制到 public/symbols/img（服务路径 /symbols/img/…）。
 *
 * 不用 viteStaticCopy：那会引入新依赖；这里用几十行脚本换掉。
 * 代价是位图双份存储（库目录一份 + public 一份）。
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC_DIR = resolve(ROOT, 'symbol-library/dist/img')
const DEST_DIR = resolve(ROOT, 'public/symbols/img')

if (!existsSync(SRC_DIR)) {
  console.error(`[symbols] 源目录不存在：${SRC_DIR}\n  先跑 npm run symbols:build 生成图元库产物。`)
  process.exit(1)
}

rmSync(DEST_DIR, { recursive: true, force: true })
mkdirSync(DEST_DIR, { recursive: true })
cpSync(SRC_DIR, DEST_DIR, { recursive: true })

const pngs = readdirSync(DEST_DIR).filter((f) => f.endsWith('.png'))
console.log(`[symbols] 位图已同步 → public/symbols/img：${pngs.length} 张 PNG（服务路径 /symbols/img/）`)
