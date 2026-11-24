/**
 * markdown.ts — 受限 Markdown 渲染器（零依赖）
 *
 * 为什么自己写：项目不引入 marked / markdown-it 这类第三方依赖，而消息正文
 * 只需要一个可控的语法子集（标题 / 列表 / 段落 / 加粗 / 斜体 / 行内代码 / 引用）。
 *
 * 安全：所有文本先做 HTML 转义，再在**已转义**文本上做行内标记替换，
 * 因此正文里的 `<script>` 之类只会原样显示为文本，不会变成可执行节点。
 *
 * 输出包裹语义化 class（md-h1 / md-list / md-strong …），样式由调用方 scoped CSS 控制。
 */

/** HTML 转义 —— 必须在任何标记解析之前完成 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 行内元素渲染（在已转义文本上做替换）
 *
 * 行内代码用占位符先摘出来，避免代码里的 `*` 被当成粗体/斜体标记。
 */
function renderInline(raw: string): string {
  const codes: string[] = []
  let text = escapeHtml(raw).replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(`<code class="md-code">${code}</code>`)
    return `\u0000CODE${codes.length - 1}\u0000`
  })

  // 粗体
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="md-strong">$1</strong>')
  // 斜体（避开已被粗体消耗的 **）
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em class="md-em">$2</em>')
  // 删除线（部分 AI 报告会用）
  text = text.replace(/~~([^~]+)~~/g, '<del class="md-del">$1</del>')

  // 还原行内代码
  text = text.replace(/\u0000CODE(\d+)\u0000/g, (_m, idx: string) => codes[Number(idx)])

  return text
}

interface ListItem {
  ordered: boolean
  text: string
  children: ListItem[]
}

const LIST_RE = /^(\s*)([-*+]|\d+\.)\s+(.*)$/
const HEADING_RE = /^(#{1,6})\s+(.*)$/
const QUOTE_RE = /^>\s?(.*)$/

/** 该行是否是块级语法起始（用于结束段落收集） */
function isBlockStart(line: string): boolean {
  return (
    HEADING_RE.test(line) || QUOTE_RE.test(line) || LIST_RE.test(line)
  )
}

/**
 * 解析列表块（支持两级嵌套：缩进 ≥ 4 空格视为子项）
 * 返回渲染结果与下一个待处理行的下标。
 */
function parseList(lines: string[], start: number): { html: string; next: number } {
  const roots: ListItem[] = []
  let i = start
  let current: ListItem | null = null

  while (i < lines.length) {
    const m = LIST_RE.exec(lines[i])
    if (!m) break

    const indent = m[1].replace(/\t/g, '    ').length
    const ordered = /\d/.test(m[2])
    const text = m[3]

    if (indent >= 4) {
      // 子项：挂到最近一个列表项下
      if (current) {
        current.children.push({ ordered, text, children: [] })
      }
    } else {
      current = { ordered, text, children: [] }
      roots.push(current)
    }
    i++
  }

  return { html: renderList(roots), next: i }
}

/** 渲染列表（连续同类型合并成同一个 ul / ol） */
function renderList(items: ListItem[]): string {
  const groups: { ordered: boolean; items: ListItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (last && last.ordered === item.ordered) last.items.push(item)
    else groups.push({ ordered: item.ordered, items: [item] })
  }

  return groups
    .map((group) => {
      const tag = group.ordered ? 'ol' : 'ul'
      const lis = group.items
        .map((item) => {
          const children = item.children.length ? renderList(item.children) : ''
          return `<li class="md-li">${renderInline(item.text)}${children}</li>`
        })
        .join('')
      return `<${tag} class="md-list">${lis}</${tag}>`
    })
    .join('')
}

/**
 * 把 Markdown 文本渲染为 HTML 字符串（供 v-html 使用）
 *
 * @param source 原始 Markdown
 * @returns HTML 字符串；输入为空时返回空串
 */
export function renderMarkdown(source: string): string {
  if (!source) return ''

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行
    if (!line.trim()) {
      i++
      continue
    }

    // 标题（只出 h1 / h2 / h3，更深的层级按 h3 收敛）
    const heading = HEADING_RE.exec(line)
    if (heading) {
      const level = Math.min(heading[1].length, 3)
      out.push(`<h${level} class="md-h${level}">${renderInline(heading[2])}</h${level}>`)
      i++
      continue
    }

    // 引用
    const quote = QUOTE_RE.exec(line)
    if (quote) {
      const buf: string[] = [quote[1]]
      i++
      while (i < lines.length) {
        const next = QUOTE_RE.exec(lines[i])
        if (!next) break
        buf.push(next[1])
        i++
      }
      out.push(`<blockquote class="md-quote">${renderInline(buf.join(' '))}</blockquote>`)
      continue
    }

    // 列表
    if (LIST_RE.test(line)) {
      const { html, next } = parseList(lines, i)
      out.push(html)
      i = next
      continue
    }

    // 段落：连续非空、非块级起始的行合并为一段
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      buf.push(lines[i])
      i++
    }
    out.push(`<p class="md-p">${renderInline(buf.join('\n')).replace(/\n/g, '<br />')}</p>`)
  }

  return out.join('\n')
}

/**
 * 从 Markdown / HTML 正文中提取一段纯文本摘要（用于弹窗卡片预览）
 *
 * 剥掉标记与空白，截断到指定长度。
 * 标题行整行丢弃（弹窗卡片上方已单独显示标题，摘要只取正文），
 * HTML 的 <style> / <script> 块整块丢弃（否则 CSS 源码会漏进摘要）。
 */
export function toPlainSummary(source: string, maxLength = 60): string {
  const text = (source || '')
    // HTML 的样式与脚本块（整块，含其中内容）
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    // 代码块 / 行内代码
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    // 标题整行丢弃
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, '')
    // 列表、引用标记
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')
    // 行内标记
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // 剩余 HTML 标签
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}
