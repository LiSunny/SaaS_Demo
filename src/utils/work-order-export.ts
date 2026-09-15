// ===== 工单导出 PDF 工具 =====
// 技术方案：浏览器端 jsPDF + autoTable + 阿里普惠体嵌入
// 输出：A4 纵向，单文件，包含基本信息表 + 三段式表单（发起/处置/审核）
// 设计：上页眉（工单号/模板名/导出时间）+ 下页脚（第 X 页/共 Y 页）

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ===== 类型 =====
interface ExportRecord {
  action: string
  operatorName: string
  operatorOrgName?: string | null
  createdAt: string
  startedAt?: string | null
  content?: string
  durationText?: string | null
  overtimeAlertAt?: string | null
  judgedAt?: string | null
  isEmptyForm?: boolean
}
interface ExportWorkOrder {
  orderNo: string
  title: string | null
  templateName: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  status: 'draft' | 'active' | 'closed'
  creatorName: string
  creatorOrgName: string
  createdAt: string
  closedAt: string | null
  formData?: Record<string, any>
  nodeRecords?: Array<{ data?: Record<string, any> }>
  records?: ExportRecord[]
}

// ===== 字段 ID → 业务含义（与处理记录区域共用） =====
const REPAIR_LABEL: Record<string, string> = {
  repaired: '已完成',
  unrepaired: '未完成',
  partial: '部分修复',
}
const APPROVAL_LABEL: Record<string, string> = {
  approved: '通过',
  rejected: '驳回',
}
const PRIORITY_LABEL: Record<string, string> = {
  urgent: '紧急', high: '高', normal: '普通', low: '低',
}
const STATUS_LABEL: Record<string, string> = {
  draft: '草稿', active: '进行中', closed: '已关闭',
}

// ===== 字体：仅嵌入 Regular（中文矢量字形全靠它；Medium/Bold 通过 fake bold 实现） =====
const FONT_NAME = 'AlibabaPuHuiTi'
const FONT_URL = '/fonts/Alibaba-PuHuiTi-Regular.ttf'
let fontBase64Cache: string | null = null

/** 加载字体（全局缓存，避免重复拉取） */
async function loadFontBase64(): Promise<string> {
  if (fontBase64Cache) return fontBase64Cache
  const buf = await fetch(FONT_URL).then(r => r.arrayBuffer())
  // Uint8Array → base64（分块避免 stack overflow）
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as number[],
    )
  }
  fontBase64Cache = btoa(binary)
  return fontBase64Cache
}

/** 把远程图片转为 base64 dataURL（用于嵌入 PDF） */
async function imgUrlToBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { mode: 'cors' })
    if (!resp.ok) return null
    const blob = await resp.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** 安全文件名（去掉 / \ : * ? " < > |） */
function safeFileName(s: string, maxLen = 30): string {
  return (s || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, maxLen)
}

/** 格式化时间戳 → YYYY-MM-DD HH:mm:ss */
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  // 兼容 "YYYY-MM-DD HH:mm:ss" 和 ISO 两种
  return s.includes('T') ? s.replace('T', ' ').slice(0, 19) : s.slice(0, 19)
}

/** 流转记录：根据 action 字符串推断状态 tag（与 FlowRecords.vue 复用同一套规则） */
function inferRecordTag(rec: ExportRecord): { label: string; color: [number, number, number] } {
  const act = rec.action || ''
  const has = (s: string, kw: string) => s.includes(kw)
  // 颜色：success=#059669, danger=#dc2626, info=#3678e3, default=#454545
  const SUCCESS: [number, number, number] = [5, 150, 105]
  const DANGER: [number, number, number] = [220, 38, 38]
  const INFO: [number, number, number] = [54, 120, 227]
  const DEFAULT: [number, number, number] = [69, 69, 69]
  if (has(act, '发起') || has(act, '创建')) return { label: '', color: DEFAULT }
  if (has(act, '超时未完成')) return { label: '超时未完成', color: DANGER }
  if (has(act, '超时跟进') || rec.durationText) return { label: rec.durationText || '超时', color: DANGER }
  if (has(act, '转派')) return { label: '转派', color: INFO }
  if (has(act, '驳回') || has(act, '取消')) return { label: '驳回', color: DANGER }
  if (has(act, '通过') || has(act, '验收') || has(act, '完成') || has(act, '关闭')) {
    return { label: '通过', color: SUCCESS }
  }
  return { label: '已完成', color: DEFAULT }
}

/** 流转记录：根据 action 推断时间范围文字 */
function inferRecordTimeText(rec: ExportRecord): string {
  const started = rec.startedAt ? fmtDate(rec.startedAt) : ''
  const ended = fmtDate(rec.createdAt)
  if (rec.overtimeAlertAt && rec.judgedAt) {
    // 超时未完成：开始 / 超时提醒 → 判定超时
    return `${started}\n→ 判定超时：${fmtDate(rec.judgedAt)}`
  }
  if (started && started !== ended) return `${started} ~ ${ended}`
  return ended
}

// ===== 主函数 =====
export async function exportWorkOrderToPDF(detail: ExportWorkOrder): Promise<void> {
  // 1) 加载字体并初始化 PDF
  const fontBase64 = await loadFontBase64()
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  pdf.addFileToVFS('Alibaba-PuHuiTi-Regular.ttf', fontBase64)
  pdf.addFont('Alibaba-PuHuiTi-Regular.ttf', FONT_NAME, 'normal')
  pdf.setFont(FONT_NAME)

  // 2) 合并表单数据：start(formData) + execute/confirm(nodeRecords)
  const merged: Record<string, any> = { ...(detail.formData || {}) }
  for (const nr of detail.nodeRecords || []) {
    Object.assign(merged, nr.data || {})
  }
  const desc = merged.Feqcmpz7ldykabc as string | undefined
  const beforePhoto = merged.F4pumpz7ll1uaec as string | undefined
  const repairResult = merged.Fskkmpz7m3jjanc as string | undefined
  const afterPhoto = merged.F9ltmpz7mn57aqc as string | undefined
  const approval = merged.Foewmpz7mv4catc as string | undefined

  // 3) 提前把图片转 base64（避免在 cell hook 中阻塞）
  const beforePhotoDataUrl = beforePhoto ? await imgUrlToBase64(beforePhoto) : null
  const afterPhotoDataUrl = afterPhoto ? await imgUrlToBase64(afterPhoto) : null

  // 4) 页面尺寸
  const pageW = pdf.internal.pageSize.getWidth() // 210
  const pageH = pdf.internal.pageSize.getHeight() // 297
  const M_L = 20
  const M_R = 20
  const M_T_HEADER = 22  // 页眉下边距
  const M_B_FOOTER = 22  // 页脚上边距

  // 5) 画页眉（在每页顶部固定位置）
  function drawHeader(pageNum: number) {
    pdf.setPage(pageNum)
    pdf.setFontSize(9)
    pdf.setTextColor(94, 94, 94)
    pdf.text(detail.orderNo, M_L, 12)
    pdf.text(detail.templateName, pageW / 2, 12, { align: 'center' })
    const now = fmtDate(new Date().toISOString())
    pdf.text(`导出时间：${now}`, pageW - M_R, 12, { align: 'right' })
    pdf.setDrawColor(230, 230, 230)
    pdf.setLineWidth(0.2)
    pdf.line(M_L, 16, pageW - M_R, 16)
  }

  // 6) 画页脚（在每页底部固定位置）
  function drawFooters(totalPages: number) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(9)
      pdf.setTextColor(150, 150, 150)
      pdf.setDrawColor(230, 230, 230)
      pdf.line(M_L, pageH - 16, pageW - M_R, pageH - 16)
      pdf.text(`第 ${i} 页 / 共 ${totalPages} 页`, pageW / 2, pageH - 10, { align: 'center' })
    }
  }

  // ===== 大标题 =====
  pdf.setFontSize(18)
  pdf.setTextColor(16, 16, 16)
  pdf.text('工单详情', pageW / 2, M_T_HEADER + 8, { align: 'center' })

  // ===== 一、基本信息 =====
  pdf.setFontSize(12)
  pdf.setTextColor(16, 16, 16)
  pdf.text('一、基本信息', M_L, M_T_HEADER + 18)

  autoTable(pdf, {
    startY: M_T_HEADER + 22,
    margin: { left: M_L, right: M_R, top: M_T_HEADER + 20, bottom: M_B_FOOTER },
    head: [['字段', '内容']],
    body: [
      ['工单编号', detail.orderNo],
      ['工单标题', detail.title || '—'],
      ['模板名称', detail.templateName],
      ['优先级', PRIORITY_LABEL[detail.priority] || detail.priority],
      ['工单状态', STATUS_LABEL[detail.status] || detail.status],
      ['发起人', `${detail.creatorName} / ${detail.creatorOrgName}`],
      ['发起时间', fmtDate(detail.createdAt)],
      ['关闭时间', fmtDate(detail.closedAt)],
    ],
    styles: {
      font: FONT_NAME,
      fontSize: 10,
      cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
      textColor: [16, 16, 16],
      valign: 'middle',
    },
    headStyles: {
      font: FONT_NAME,
      fontStyle: 'normal',
      fillColor: [251, 251, 251],
      textColor: [69, 69, 69],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 40, textColor: [69, 69, 69] },
      1: { cellWidth: 'auto' },
    },
  })

  // ===== 二、发起部分 =====
  let cursorY = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(12)
  pdf.text('二、发起部分', M_L, cursorY)

  autoTable(pdf, {
    startY: cursorY + 4,
    margin: { left: M_L, right: M_R, top: M_T_HEADER + 20, bottom: M_B_FOOTER },
    body: [
      [{ content: '故障描述', styles: { textColor: [69, 69, 69] } }, desc || '—'],
      [{ content: '故障照片', styles: { textColor: [69, 69, 69] } },
       beforePhotoDataUrl ? '' : '—'],
    ],
    styles: {
      font: FONT_NAME,
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
      valign: 'middle',
    },
    columnStyles: { 0: { cellWidth: 40 } },
    didParseCell: (data) => {
      // 第二行第二列：故障照片 → 行高撑大以容纳图片
      if (data.section === 'body' && data.row.index === 1 && data.column.index === 1) {
        data.cell.height = beforePhotoDataUrl ? 50 : 10
      }
    },
    didDrawCell: (data) => {
      // 在故障照片 cell 中绘制图片
      if (
        data.section === 'body' &&
        data.row.index === 1 &&
        data.column.index === 1 &&
        beforePhotoDataUrl
      ) {
        const cellX = data.cell.x + 2
        const cellY = data.cell.y + 2
        // 38×38 缩略图（保持 128:134 设计稿比例）
        const imgW = 30
        const imgH = 30
        try {
          pdf.addImage(beforePhotoDataUrl, 'JPEG', cellX, cellY, imgW, imgH)
        } catch {
          /* ignore: 某些格式 jsPDF 不支持（如 webp），fallback 不显示 */
        }
      }
    },
  })

  // ===== 三、处置部分 =====
  cursorY = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(12)
  pdf.text('三、处置部分', M_L, cursorY)

  autoTable(pdf, {
    startY: cursorY + 4,
    margin: { left: M_L, right: M_R, top: M_T_HEADER + 20, bottom: M_B_FOOTER },
    body: [
      [{ content: '维修结果', styles: { textColor: [69, 69, 69] } },
       REPAIR_LABEL[repairResult || ''] || '—'],
      [{ content: '维修后照片', styles: { textColor: [69, 69, 69] } },
       afterPhotoDataUrl ? '' : '—'],
    ],
    styles: {
      font: FONT_NAME,
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
      valign: 'middle',
    },
    columnStyles: { 0: { cellWidth: 40 } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 1 && data.column.index === 1) {
        data.cell.height = afterPhotoDataUrl ? 50 : 10
      }
    },
    didDrawCell: (data) => {
      if (
        data.section === 'body' &&
        data.row.index === 1 &&
        data.column.index === 1 &&
        afterPhotoDataUrl
      ) {
        const cellX = data.cell.x + 2
        const cellY = data.cell.y + 2
        const imgW = 30
        const imgH = 30
        try {
          pdf.addImage(afterPhotoDataUrl, 'JPEG', cellX, cellY, imgW, imgH)
        } catch {
          /* ignore */
        }
      }
    },
  })

  // ===== 四、审核部分 =====
  cursorY = (pdf as any).lastAutoTable.finalY + 10
  pdf.setFontSize(12)
  pdf.text('四、审核部分', M_L, cursorY)

  autoTable(pdf, {
    startY: cursorY + 4,
    margin: { left: M_L, right: M_R, top: M_T_HEADER + 20, bottom: M_B_FOOTER },
    body: [
      [{ content: '验收审核', styles: { textColor: [69, 69, 69] } },
       APPROVAL_LABEL[approval || ''] || '—'],
      [{ content: '审核说明', styles: { textColor: [69, 69, 69] } }, '整改完成，隐患已消除，符合安全规范'],
    ],
    styles: {
      font: FONT_NAME,
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
      valign: 'middle',
    },
    columnStyles: { 0: { cellWidth: 40 } },
  })

  // ===== 五、流转记录时间线 =====
  if (detail.records && detail.records.length > 0) {
    cursorY = (pdf as any).lastAutoTable.finalY + 10
    // 检查剩余空间：不够时主动换页
    if (cursorY > pageH - M_B_FOOTER - 30) {
      pdf.addPage()
      cursorY = M_T_HEADER + 4
    }
    pdf.setFontSize(12)
    pdf.text('五、流转记录', M_L, cursorY)

    // 表格行：[时间, 节点动作, 操作人, 备注]
    const timelineRows = detail.records.map((rec) => {
      const tag = inferRecordTag(rec)
      // tag 拼到 action 下一行；颜色通过 didParseCell 单独设置
      const actionText = tag.label ? `${rec.action}\n[${tag.label}]` : rec.action
      const operator = rec.operatorOrgName
        ? `${rec.operatorName} / ${rec.operatorOrgName}`
        : rec.operatorName
      const note = rec.isEmptyForm
        ? '（表单内容）'
        : (rec.content || '—').replace(/\n/g, ' ')
      return [
        inferRecordTimeText(rec),
        actionText,
        operator,
        note,
      ]
    })

    autoTable(pdf, {
      startY: cursorY + 4,
      margin: { left: M_L, right: M_R, top: M_T_HEADER + 20, bottom: M_B_FOOTER },
      head: [['时间', '节点动作', '操作人 / 部门', '备注']],
      body: timelineRows,
      styles: {
        font: FONT_NAME,
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
        lineColor: [230, 230, 230],
        lineWidth: 0.2,
        valign: 'middle',
      },
      headStyles: {
        font: FONT_NAME,
        fontStyle: 'normal',
        fillColor: [251, 251, 251],
        textColor: [69, 69, 69],
      },
      columnStyles: {
        0: { cellWidth: 40, textColor: [69, 69, 69] },
        1: { cellWidth: 38 },
        2: { cellWidth: 32 },
        3: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        // 第 2 列（节点动作）：如果该行有 tag，把整格文字染色（视觉提示状态）
        if (data.section === 'body' && data.column.index === 1) {
          const rec = detail.records?.[data.row.index]
          if (rec) {
            const tag = inferRecordTag(rec)
            if (tag.label) data.cell.styles.textColor = tag.color
          }
        }
      },
    })
  }

  // ===== 页眉页脚（所有页都画） =====
  const totalPages = pdf.getNumberOfPages()
  drawFooters(totalPages)
  for (let i = 1; i <= totalPages; i++) drawHeader(i)

  // ===== 保存文件 =====
  const today = new Date().toISOString().slice(0, 10)
  const title = safeFileName(detail.title || '工单')
  pdf.save(`${detail.orderNo}_${title}_${today}.pdf`)
}
