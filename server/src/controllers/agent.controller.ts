/**
 * agent.controller.ts — Agent 聊天接口
 *
 * POST /api/agent/chat
 * 接收用户消息，通过 SSE 流式返回 Agent 回复（真正的 LLM streaming）。
 * 导航意图会返回 action 事件，前端据此执行路由跳转。
 */

import type { Request, Response, NextFunction } from 'express'
import * as agentService from '../services/agent.service.js'
import type { AgentScope } from '../services/agent.service.js'
import db from '../config/db.js'

/**
 * 从当前登录用户推导数据权限 scope。
 * 链路：req.user.id → UserEnterprise → Enterprise.groups（regulator|unit|operator|service）+ 企业名。
 * 权限过滤在服务层（executeTool 按 scope 过滤），LLM 不参与。
 */
async function resolveScope(user: Request['user']): Promise<AgentScope> {
  if (!user) return { systemRole: null, groups: [], enterpriseNames: [] }

  const ue = await db.userEnterprise.findMany({ where: { userId: user.id, status: 1 } })
  if (ue.length === 0) return { systemRole: user.systemRole, groups: [], enterpriseNames: [], realName: user.realName }

  const entIds = ue.map(e => e.enterpriseId)
  const ents = await db.enterprise.findMany({ where: { id: { in: entIds } } })

  const groups = new Set<string>()
  const enterpriseNames: string[] = []
  for (const e of ents) {
    try { for (const g of JSON.parse(e.groups || '[]')) groups.add(g) } catch { /* ignore */ }
    enterpriseNames.push(e.name)
  }

  return { systemRole: user.systemRole, groups: [...groups], enterpriseNames, realName: user.realName }
}

export async function chat(req: Request, res: Response, _next: NextFunction) {
  const { message, history, fileContext } = req.body

  // 允许纯文件上传不含文字消息，但至少要有 message 或 fileContext
  const hasText = message && typeof message === 'string' && message.trim().length > 0
  const hasFile = fileContext && fileContext.parsedText && fileContext.fileName

  if (!hasText && !hasFile) {
    res.status(400).json({ code: 400, message: '请输入消息内容或上传文件', data: null })
    return
  }

  // 服务端二次截断 fileContext.parsedText
  if (fileContext?.parsedText && fileContext.parsedText.length > 100 * 1024) {
    fileContext.parsedText = fileContext.parsedText.slice(0, 100 * 1024)
  }

  // 设置 SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  res.write(':ok\n\n')

  try {
    const scope = await resolveScope(req.user)
    for await (const event of agentService.streamChat(
      (message || '').trim(),
      history,
      hasFile ? fileContext : undefined,
      scope,
    )) {
      if (event.type === 'token') {
        res.write(`event: token\ndata: ${JSON.stringify({ type: 'text', content: event.content })}\n\n`)
      } else if (event.type === 'done') {
        if (event.action) {
          res.write(`event: action\ndata: ${JSON.stringify(event.action)}\n\n`)
        }
        res.write(`event: done\ndata: ${JSON.stringify({ type: 'done' })}\n\n`)
      } else if (event.type === 'debug') {
        res.write(`event: debug\ndata: ${JSON.stringify(event)}\n\n`)
      } else if (event.type === 'artifact') {
        res.write(`event: artifact\ndata: ${JSON.stringify(event.artifact)}\n\n`)
      }
    }
    res.end()
  } catch (err: any) {
    console.error('[agent.controller] 错误:', err.message)
    res.write(`event: error\ndata: ${JSON.stringify({ type: 'error', message: '处理请求时出错，请稍后重试' })}\n\n`)
    res.end()
  }
}
