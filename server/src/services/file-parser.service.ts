/**
 * file-parser.service.ts — 文件文本解析服务
 *
 * 将上传的文件（PDF、图片、纯文本）转换为纯文本字符串，
 * 供 DeepSeek 文本模型阅读和分析。
 *
 * PDF 解析两层策略：
 *   ① pdftotext 提取文字 ≥ 100 字符 → 直接返回
 *   ② 文字不足 → pdftoppm 逐页转图 + Tesseract.js OCR
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, readFile, unlink, mkdir, readdir, rm } from 'fs/promises'
import { Readable } from 'stream'
import Tesseract from 'tesseract.js'
import iconv from 'iconv-lite'
import { env } from '../config/env.js'
import AliOcrModule from '@alicloud/ocr-api20210707'
const AliOcrClient = (AliOcrModule as any).default || AliOcrModule
const RecognizeGeneralRequest = (AliOcrModule as any).RecognizeGeneralRequest
import { Config as OpenApiConfig } from '@alicloud/openapi-core/dist/utils'

const execFileAsync = promisify(execFile)

// ===== 类型 =====
export interface ParseResult {
  parsedText: string
  pageCount?: number
  /** OCR 方案标识，便于对比效果 */
  ocrProvider?: string
}

// ===== 阿里云 OCR 客户端（懒加载） =====
let _aliOcrClient: InstanceType<typeof AliOcrClient> | null = null
function getAliOcrClient() {
  if (!_aliOcrClient) {
    if (!env.ALIYUN_ACCESS_KEY_ID || !env.ALIYUN_ACCESS_KEY_SECRET) {
      throw new Error('阿里云 OCR 未配置：缺少 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET')
    }
    const ocrConfig = new OpenApiConfig({
      accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    })
    ocrConfig.endpoint = env.ALIYUN_OCR_ENDPOINT
    _aliOcrClient = new AliOcrClient(ocrConfig)
    console.log(`[file-parser] 阿里云 OCR 客户端已初始化, endpoint=${env.ALIYUN_OCR_ENDPOINT}`)
  }
  return _aliOcrClient
}

// ===== 主入口 =====

/** 根据文件扩展名分发到对应解析器 */
export async function parseFileContent(
  buffer: Buffer,
  originalName: string,
): Promise<ParseResult> {
  const ext = originalName.split('.').pop()?.toLowerCase() || ''

  switch (ext) {
    case 'pdf':
      return parsePdf(buffer)

    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return parseImageOcr(buffer)

    case 'txt':
    case 'md':
    case 'json':
      return parsePlainText(buffer)

    default:
      throw Object.assign(
        new Error(`暂不支持 .${ext} 格式。当前支持：pdf、图片（jpg/png/gif/webp）、纯文本（txt/md/json）`),
        { statusCode: 400 },
      )
  }
}

// ===== 纯文本解析 =====

function parsePlainText(buffer: Buffer): ParseResult {
  let text = buffer.toString('utf-8')

  // UTF-8 解码出现替换字符 → 尝试 GBK
  if (text.includes('�')) {
    text = iconv.decode(buffer, 'gbk')
  }

  text = text.trim()
  const MAX = 100 * 1024 // 100K 字符

  if (text.length > MAX) {
    text = text.slice(0, MAX) + '\n\n[文本过长，已截断至前 100K 字符]'
  }

  return { parsedText: text || '(空文件)' }
}

// ===== PDF 解析 =====

async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // 写入临时文件（pdftotext 需要文件路径）
  const tmpDir = tmpdir()
  const pdfPath = join(tmpDir, `agent-pdf-${Date.now()}.pdf`)
  await writeFile(pdfPath, buffer)

  try {
    // ① pdftotext 提取文字（-layout 保持排版）
    const { stdout } = await execFileAsync('pdftotext', ['-layout', pdfPath, '-'], {
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024, // 5MB 文本上限
    })

    const text = (stdout || '').trim()

    // ② 文字量充足 → 直接返回
    if (text.length >= 100) {
      const MAX = 100 * 1024
      if (text.length > MAX) {
        return { parsedText: text.slice(0, MAX) + '\n\n[文本过长，已截断至前 100K 字符]' }
      }
      return { parsedText: text }
    }

    // ③ 文字不足 → OCR 降级
    console.log(`[file-parser] pdftotext 仅提取 ${text.length} 字符，降级为 OCR`)
    return await ocrPdf(pdfPath)
  } catch (err: any) {
    // pdftotext 执行失败（如 poppler 未安装）→ 直接 OCR
    console.log(`[file-parser] pdftotext 失败: ${err.message}，降级为 OCR`)
    return await ocrPdf(pdfPath)
  } finally {
    await unlink(pdfPath).catch(() => {})
  }
}

/** OCR 降级：pdftoppm 逐页转图 + Tesseract 逐页识别 */
async function ocrPdf(pdfPath: string): Promise<ParseResult> {
  const tmpDir = tmpdir()
  const imgDir = join(tmpDir, `agent-ocr-${Date.now()}`)
  await mkdir(imgDir, { recursive: true })

  try {
    // pdftoppm 逐页转 PNG（-r 300 = 300 DPI，保证 OCR 精度）
    await execFileAsync('pdftoppm', ['-png', '-r', '300', pdfPath, join(imgDir, 'page')], {
      timeout: 120000,
    })

    // 逐页 OCR
    const files = (await readdir(imgDir))
      .filter(f => f.endsWith('.png'))
      .sort((a, b) => {
        // page-1.png, page-2.png, ... page-10.png → 数字排序
        const na = parseInt(a.match(/(\d+)/)?.[1] || '0', 10)
        const nb = parseInt(b.match(/(\d+)/)?.[1] || '0', 10)
        return na - nb
      })

    if (files.length === 0) {
      return { parsedText: '(无法识别此 PDF，pdftoppm 未生成任何图片)' }
    }

    console.log(`[file-parser] OCR 开始，共 ${files.length} 页`)

    // 创建单个 Worker 并复用（仅 tesseract 模式）
    const provider = env.OCR_PROVIDER
    const ocrFn = provider === 'aliyun'
      ? async (imgPath: string) => {
          const buf = await readFile(imgPath)
          return parseImageOcrAliyun(buf)
        }
      : async (imgPath: string) => {
          const { data } = await worker!.recognize(imgPath)
          return { parsedText: data.text?.trim() || '', ocrProvider: 'tesseract' }
        }

    let worker: Tesseract.Worker | null = null
    if (provider !== 'aliyun') {
      worker = await Tesseract.createWorker('chi_sim+eng')
    }

    const results: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const imgPath = join(imgDir, files[i])
        console.log(`[file-parser] OCR(${provider}) 第 ${i + 1}/${files.length} 页...`)
        const r = await ocrFn(imgPath)
        if (r.parsedText) {
          results.push(`--- 第 ${i + 1} 页 ---\n${r.parsedText}`)
        }
      }
    } finally {
      if (worker) await worker.terminate()
    }

    const finalText = results.join('\n\n')
    const MAX = 50 * 1024 // OCR 截断上限更低（速度考虑）

    if (!finalText) {
      return { parsedText: '(无法识别此 PDF 中的文字，可能为纯图片扫描件且文字不清晰)', ocrProvider: provider }
    }

    return {
      parsedText: finalText.length > MAX
        ? finalText.slice(0, MAX) + '\n\n[文本过长，已截断至前 50K 字符]'
        : finalText,
      ocrProvider: provider,
    }
  } catch (err: any) {
    console.error(`[file-parser] OCR 失败: ${err.message}`)
    return { parsedText: `(PDF 解析失败: ${err.message})` }
  } finally {
    // 清理 OCR 临时图片目录
    await rm(imgDir, { recursive: true, force: true }).catch(() => {})
  }
}

// ===== 图片 OCR（按 OCR_PROVIDER 环境变量路由） =====

async function parseImageOcr(buffer: Buffer): Promise<ParseResult> {
  if (env.OCR_PROVIDER === 'aliyun') {
    return parseImageOcrAliyun(buffer)
  }
  return parseImageOcrTesseract(buffer)
}

/** Tesseract.js 本地 OCR */
async function parseImageOcrTesseract(buffer: Buffer): Promise<ParseResult> {
  try {
    const { data } = await Tesseract.recognize(buffer as any, 'chi_sim+eng')
    const text = (data.text || '').trim()
    const MAX = 50 * 1024

    if (!text) {
      return { parsedText: '(OCR 未能识别出图片中的文字)', ocrProvider: 'tesseract' }
    }

    return {
      parsedText: text.length > MAX
        ? text.slice(0, MAX) + '\n\n[文本过长，已截断至前 50K 字符]'
        : text,
      ocrProvider: 'tesseract',
    }
  } catch (err: any) {
    console.error(`[file-parser] Tesseract OCR 失败: ${err.message}`)
    return { parsedText: `(图片 OCR 失败: ${err.message})`, ocrProvider: 'tesseract' }
  }
}

/**
 * 阿里云 OCR 统一识别（每月 200 次免费额度）
 * @param url 图片的 OSS 公网 URL（优先用 URL 传图，比二进制流更可靠）
 */
export async function parseImageOcrAliyunByUrl(imageUrl: string): Promise<ParseResult> {
  try {
    const client = getAliOcrClient()
    const request = new RecognizeGeneralRequest({
      url: imageUrl,
    })
    const response = await client.recognizeGeneral(request)

    const rawData = response.body?.data
    if (!rawData) {
      return { parsedText: '(阿里云 OCR 未返回结果)', ocrProvider: 'aliyun' }
    }

    const parsed = JSON.parse(rawData)
    const text = (parsed.content || '').trim()
    const MAX = 50 * 1024

    if (!text) {
      return { parsedText: '(阿里云 OCR 未能识别出图片中的文字)', ocrProvider: 'aliyun' }
    }

    return {
      parsedText: text.length > MAX
        ? text.slice(0, MAX) + '\n\n[文本过长，已截断至前 50K 字符]'
        : text,
      ocrProvider: 'aliyun',
    }
  } catch (err: any) {
    console.error(`[file-parser] 阿里云 OCR 失败: ${err.message}`)
    return { parsedText: `(阿里云 OCR 调用失败: ${err.message})`, ocrProvider: 'aliyun' }
  }
}

/** 阿里云 OCR（Buffer → 二进制流传图，保留兼容） */
async function parseImageOcrAliyun(buffer: Buffer): Promise<ParseResult> {
  try {
    const client = getAliOcrClient()
    const request = new RecognizeGeneralRequest({
      body: Readable.from(buffer) as any,
    })
    const response = await client.recognizeGeneral(request)

    // response.body.data 是 JSON 字符串，结构：
    // { content: "识别出的文字内容", ... }
    const rawData = response.body?.data
    if (!rawData) {
      return { parsedText: '(阿里云 OCR 未返回结果)', ocrProvider: 'aliyun' }
    }

    const parsed = JSON.parse(rawData)
    const text = (parsed.content || '').trim()
    const MAX = 50 * 1024

    if (!text) {
      return { parsedText: '(阿里云 OCR 未能识别出图片中的文字)', ocrProvider: 'aliyun' }
    }

    return {
      parsedText: text.length > MAX
        ? text.slice(0, MAX) + '\n\n[文本过长，已截断至前 50K 字符]'
        : text,
      ocrProvider: 'aliyun',
    }
  } catch (err: any) {
    console.error(`[file-parser] 阿里云 OCR 失败: ${err.message}`)
    return { parsedText: `(阿里云 OCR 调用失败: ${err.message})`, ocrProvider: 'aliyun' }
  }
}
