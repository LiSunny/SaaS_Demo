/**
 * agent-prompt-loader.ts — 从 Markdown 文件加载 Agent System Prompt
 *
 * 启动时同步读取一次（fs.readFileSync），后续调用直接返回缓存结果。
 * 支持 {{变量名}} 占位符替换，变量由调用方传入。
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROMPT_PATH = resolve(__dirname, 'agent-prompt.md')

/** 启动时读一次，缓存原始模板 */
let templateCache: string | null = null

function loadTemplate(): string {
  if (!templateCache) {
    templateCache = readFileSync(PROMPT_PATH, 'utf-8')
  }
  return templateCache
}

/**
 * 加载 System Prompt，替换模板中的 {{变量}} 占位符。
 * 当前支持的变量：{{pageList}}
 */
export function loadSystemPrompt(vars: Record<string, string> = {}): string {
  let prompt = loadTemplate()
  for (const [key, value] of Object.entries(vars)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value)
  }
  return prompt
}

/** 强制重新读取文件（调试用，无需重启服务即可更新 prompt） */
export function reloadPrompt(): void {
  templateCache = null
}
