/**
 * symbol-image.ts — 产品图处理（浏览器端）
 *
 * 图元库的产品图由 symbol-library/tools/process.py 生成（Python + numpy/PIL）：
 *   泛洪抠背景 → 裁到内容框 → 等比缩放到 496 居中于 512 画布 → 内容框 bbox
 * 浏览器端跑不了那条管线，这里移植等价逻辑：
 *   1. 解码后按原始比例缩放（最长边不超过 1024）
 *   2. 自适应阈值 + 边缘泛洪抠背景，铺平后硬切
 *   3. 剔除脱离主体、明显偏暗的卫星块（投影残留）
 *   4. 裁到内容框，等比缩放到 496×496 居中于 512 画布
 *   5. 输出 PNG 与内容框 bbox（供图片版状态光晕计算）
 */

/** 输出边长（与图元库一致） */
export const SYMBOL_IMAGE_SIZE = 512

/** 输出边距（与图元库一致） */
export const SYMBOL_IMAGE_MARGIN = 8

/** 背景阈值相对参考亮度的下调量 */
const BG_DROP = 20

/** 背景像素允许的最大局部梯度 */
const FLAT_GRAD = 7

/** 铺平后的纯白切阈值 */
const WHITE = 247

/** 卫星块相对主体的亮度上限 */
const SAT_RATIO = 0.8

/** 卫星块相对主体的面积上限 */
const SAT_AREA = 0.4

/** 解码后的最长边上限 */
const MAX_DECODE = 1024

/** 处理结果 */
export interface ProcessedSymbolImage {
  /** PNG 二进制 */
  blob: Blob
  /** 内容框 [x0,y0,x1,y1]，512 空间，与图元库 img/index.json 同格式 */
  bbox: number[]
  /** 内容占画布比例 0-1 */
  cover: number
  /** 预览地址 */
  previewUrl: string
}

/** 亮度 */
function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** 建画布 */
function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/**
 * 背景参考亮度：四周边缘环 90 分位
 */
function backgroundLevel(lum: Float32Array, w: number, h: number): number {
  const ring: number[] = []
  const size = Math.max(2, Math.round(Math.min(w, h) * 0.02))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= size && x < w - size && y >= size && y < h - size) continue
      ring.push(lum[y * w + x])
    }
  }
  ring.sort((a, b) => a - b)
  return ring[Math.floor(ring.length * 0.9)] ?? 255
}

/**
 * 泛洪：从边缘连通的高亮平坦区域
 * @param cand 候选掩码（1 = 可通行）
 */
function flood(cand: Uint8Array, w: number, h: number): Uint8Array {
  const bg = new Uint8Array(w * h)
  const queue = new Int32Array(w * h)
  let head = 0
  let tail = 0

  const push = (i: number) => {
    if (!bg[i] && cand[i]) {
      bg[i] = 1
      queue[tail++] = i
    }
  }

  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }

  while (head < tail) {
    const i = queue[head++]
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) push(i - 1)
    if (x < w - 1) push(i + 1)
    if (y > 0) push(i - w)
    if (y < h - 1) push(i + w)
  }

  return bg
}

/**
 * 剔除脱离主体、明显偏暗的卫星块（地面投影残留）
 * @param alpha 透明度数组，255 = 保留
 */
function dropDarkSatellites(alpha: Uint8Array, lum: Float32Array, w: number, h: number): void {
  const n = w * h
  const label = new Int32Array(n)
  const stack = new Int32Array(n)
  let count = 0

  for (let i = 0; i < n; i++) {
    if (!alpha[i] || label[i]) continue
    count++
    let sp = 0
    stack[sp++] = i
    label[i] = count
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % w
      const y = (p / w) | 0
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of nb) {
        if (q < 0 || !alpha[q] || label[q]) continue
        label[q] = count
        stack[sp++] = q
      }
    }
  }

  if (count <= 1) return

  const areas = new Float64Array(count + 1)
  const lums = new Float64Array(count + 1)
  for (let i = 0; i < n; i++) {
    if (!alpha[i]) continue
    const l = label[i]
    areas[l]++
    lums[l] += lum[i]
  }

  let main = 0
  for (let i = 1; i <= count; i++) {
    if (areas[i] > areas[main]) main = i
  }
  const mainLum = areas[main] ? lums[main] / areas[main] : 0

  for (let i = 1; i <= count; i++) {
    if (i === main) continue
    const mean = areas[i] ? lums[i] / areas[i] : 0
    if (areas[i] < SAT_AREA * areas[main] && mean < SAT_RATIO * mainLum) {
      for (let p = 0; p < n; p++) {
        if (label[p] === i) alpha[p] = 0
      }
    }
  }
}

/**
 * 抠背景：返回透明度数组（0 或 255）
 */
function removeBackground(src: ImageData): { alpha: Uint8Array; rgb: Uint8ClampedArray } {
  const w = src.width
  const h = src.height
  const n = w * h
  const data = src.data

  const lum = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    lum[i] = luminance(data[o], data[o + 1], data[o + 2])
  }

  const ref = backgroundLevel(lum, w, h)
  const thr = Math.max(ref - BG_DROP, ref * 0.78)

  // 候选：亮度高于阈值且局部平坦（避免泛洪渗进金属高光）
  const cand = new Uint8Array(n)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (lum[i] < thr) continue
      if (x + 1 < w && Math.abs(lum[i] - lum[i + 1]) > FLAT_GRAD) continue
      if (y + 1 < h && Math.abs(lum[i] - lum[i + w]) > FLAT_GRAD) continue
      cand[i] = 1
    }
  }
  const bg = flood(cand, w, h)

  // 背景铺平成纯白，再按纯白硬切
  const rgb = new Uint8ClampedArray(data)
  for (let i = 0; i < n; i++) {
    if (!bg[i]) continue
    const o = i * 4
    rgb[o] = 255
    rgb[o + 1] = 255
    rgb[o + 2] = 255
  }

  const lum2 = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    lum2[i] = luminance(rgb[o], rgb[o + 1], rgb[o + 2])
  }
  const cand2 = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    if (lum2[i] >= WHITE) cand2[i] = 1
  }
  const bg2 = flood(cand2, w, h)

  const alpha = new Uint8Array(n)
  for (let i = 0; i < n; i++) alpha[i] = bg2[i] ? 0 : 255

  dropDarkSatellites(alpha, lum2, w, h)

  return { alpha, rgb }
}

/**
 * 抠背景 + 裁内容框 + 缩放居中 → 512×512 PNG
 * @param file 用户上传的产品图
 */
export async function processSymbolImage(file: File): Promise<ProcessedSymbolImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DECODE / Math.max(bitmap.width, bitmap.height))
  const sw = Math.max(1, Math.round(bitmap.width * scale))
  const sh = Math.max(1, Math.round(bitmap.height * scale))

  const work = makeCanvas(sw, sh)
  const wctx = work.getContext('2d', { willReadFrequently: true })!
  wctx.drawImage(bitmap, 0, 0, sw, sh)
  bitmap.close?.()

  const src = wctx.getImageData(0, 0, sw, sh)
  const { alpha, rgb } = removeBackground(src)

  // 内容框
  let x0 = sw
  let y0 = sh
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (!alpha[y * sw + x]) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (x1 < 0) {
    throw new Error('图片中没有可用的主体，请换一张背景干净的图片')
  }

  // 裁内容框
  const cw = x1 - x0 + 1
  const ch = y1 - y0 + 1
  const cut = makeCanvas(cw, ch)
  const cctx = cut.getContext('2d')!
  const cutData = cctx.createImageData(cw, ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const s = ((y0 + y) * sw + (x0 + x)) * 4
      const d = (y * cw + x) * 4
      cutData.data[d] = rgb[s]
      cutData.data[d + 1] = rgb[s + 1]
      cutData.data[d + 2] = rgb[s + 2]
      cutData.data[d + 3] = alpha[(y0 + y) * sw + (x0 + x)]
    }
  }
  cctx.putImageData(cutData, 0, 0)

  // 等比缩放到 496 居中于 512
  const target = SYMBOL_IMAGE_SIZE - 2 * SYMBOL_IMAGE_MARGIN
  const k = target / Math.max(cw, ch)
  const dw = Math.max(1, Math.round(cw * k))
  const dh = Math.max(1, Math.round(ch * k))
  const out = makeCanvas(SYMBOL_IMAGE_SIZE, SYMBOL_IMAGE_SIZE)
  const octx = out.getContext('2d')!
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(cut, 0, 0, cw, ch, (SYMBOL_IMAGE_SIZE - dw) / 2, (SYMBOL_IMAGE_SIZE - dh) / 2, dw, dh)

  // 内容框（512 空间）
  const ox = Math.floor((SYMBOL_IMAGE_SIZE - dw) / 2)
  const oy = Math.floor((SYMBOL_IMAGE_SIZE - dh) / 2)
  const bbox = [ox, oy, ox + dw, oy + dh]

  const blob = await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('图片导出失败'))), 'image/png')
  })

  return {
    blob,
    bbox,
    cover: (dw * dh) / (SYMBOL_IMAGE_SIZE * SYMBOL_IMAGE_SIZE),
    previewUrl: out.toDataURL('image/png'),
  }
}
