#!/usr/bin/env node
/**
 * build-symbols.mjs — 图元库构建入口
 *
 * 图元库是仓库内自洽子工程（symbol-library/），构建脚本在 symbol-library/src/build.mjs，
 * 产物落在 symbol-library/dist/。本脚本在库构建后把位图同步到 public/symbols/img，
 * 使 Vue 侧能按 /symbols/img/<图元ID>.png 直出图片版图元。
 *
 * 库构建自带入库校验（ID 唯一且符合「类别-对象-序号」、端口在画布内、
 * 绑定点名唯一且入点表、几何中无颜色属性、spin/angle 有对应旋转元素与轴心），
 * 校验不通过时退出码非 0 —— 本脚本透传该退出码。
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: false })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log('[symbols] 构建图元库…')
run(process.execPath, [resolve(ROOT, 'symbol-library/src/build.mjs')])

console.log('[symbols] 同步位图…')
run(process.execPath, [resolve(__dirname, 'sync-symbol-assets.mjs')])

console.log('[symbols] 完成')
