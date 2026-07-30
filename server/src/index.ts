import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { ensureDefaultAdmin } from './services/auth.service.js'
import db from './config/db.js'

const app = express()

// ========== 全局中间件 ==========
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ========== 请求日志 ==========
app.use((req, _res, next) => {
  const start = Date.now()
  _res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${req.method}] ${req.originalUrl} → ${_res.statusCode} (${duration}ms)`)
  })
  next()
})

// ========== 路由 ==========
app.use(apiRouter)

// ========== 404 & 错误处理 ==========
app.use(notFound)
app.use(errorHandler)

// ========== 启动 ==========
const server = app.listen(env.PORT, async () => {
  // 启用 SQLite WAL 模式：允许读写并发，消除间歇性超时的根因
  await db.$queryRawUnsafe('PRAGMA journal_mode=WAL;')

  console.log(`
╔══════════════════════════════════════════╗
║  🚀 维保平台后端已启动                   ║
║  地址: http://localhost:${env.PORT}          ║
║  环境: ${env.NODE_ENV.padEnd(31)}║
║  健康检查: /api/health                   ║
║  登录接口: /api/auth/login               ║
║  数据库模式: WAL（读写并发）              ║
╚══════════════════════════════════════════╝
  `)

  // 启动时自动创建默认管理员
  await ensureDefaultAdmin()
})

// 服务端超时 60s，防止 Nginx/客户端断连后连接堆积
server.timeout = 60000

export default app
