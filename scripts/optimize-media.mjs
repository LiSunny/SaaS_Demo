#!/usr/bin/env node
/**
 * 门户页媒体资源压缩：4K hero 图降采样 + 演示视频重编码。
 *
 * 背景：线上门户页滚动加载会拉 5.45MB 的 mp4 和 1.6MB 的 4K hero 图。
 *  - hero 图原始分辨率 3840x2160，但页面展示宽度远小于此
 *  - 演示视频码率 0.5~1.4Mbps，对"循环演示"用途偏高
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const ROOT = '/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo'

// ---------- 1) hero 图：降采样到 1920 宽 + WebP ----------
const HERO_IMAGES = [
  'src/assets/portal/hero-campus.png',
  'src/assets/portal/hero-industry.png',
  'src/assets/portal/hero-merchant.png',
]

console.log('=== hero 图：降采样到 1920 宽 ===')
for (const rel of HERO_IMAGES) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) continue
  const out = abs.replace(/\.png$/, '.webp')
  const before = fs.statSync(abs).size

  // 用 sips（macOS 自带）降采样，再转 WebP
  const tmp = `/tmp/hero-resized-${path.basename(out)}`
  try {
    execFileSync('sips', ['-Z', '1920', abs, '--out', tmp], { stdio: 'ignore' })
    execFileSync('cwebp', ['-q', '80', '-m', '6', '-quiet', tmp, '-o', out])
    const after = fs.statSync(out).size
    console.log(
      `✅ ${path.basename(rel).padEnd(22)} ${(before / 1024).toFixed(0).padStart(6)}KB → ${(after / 1024).toFixed(0).padStart(5)}KB  (${(before / after).toFixed(1)}x)`,
    )
  } catch (e) {
    console.log(`⚠️  ${rel} 处理失败: ${e.message.slice(0, 80)}`)
  }
}

// ---------- 2) 演示视频：H.264 + 720p + CRF30 + faststart ----------
const VIDEOS = ['public/images/ai-demo-01.mp4', 'public/images/ai-demo-02.mp4', 'public/images/ai-demo-03.mp4', 'public/images/ai-demo-04.mp4']

console.log('\n=== 演示视频：重编码（720p / CRF 30 / faststart）===')
for (const rel of VIDEOS) {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) continue
  const out = abs.replace(/\.mp4$/, '.opt.mp4')
  const before = fs.statSync(abs).size
  try {
    execFileSync(
      'ffmpeg',
      [
        '-y', '-i', abs,
        '-vf', 'scale=-2:720',
        '-c:v', 'libx264', '-profile:v', 'main', '-crf', '30', '-preset', 'slow',
        '-movflags', '+faststart',
        '-an', '-r', '24',
        out,
      ],
      { stdio: 'ignore' },
    )
    const after = fs.statSync(out).size
    if (after < before) {
      fs.renameSync(out, abs)
      console.log(
        `✅ ${path.basename(rel).padEnd(22)} ${(before / 1024).toFixed(0).padStart(6)}KB → ${(after / 1024).toFixed(0).padStart(5)}KB  (${(before / after).toFixed(1)}x)`,
      )
    } else {
      fs.unlinkSync(out)
      console.log(`· ${path.basename(rel)} 重编码后更大，保留原文件`)
    }
  } catch (e) {
    console.log(`⚠️  ${rel} 处理失败: ${e.message.slice(0, 80)}`)
  }
}
