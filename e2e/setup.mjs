/**
 * Playwright 全局 setup
 * 1. 清理旧测试数据库
 * 2. 创建 test.db + 推送 schema
 * 3. 填充种子数据（3 企业 + 9 岗位）
 * 4. 启动后端（端口 3202，独立 test.db）
 * 5. 启动前端（端口 3200，proxy → 3202）
 */
import { execSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const SERVER = path.resolve(ROOT, 'server')

async function waitForServer(url, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) return
    } catch {
      // 服务尚未就绪，继续等待
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`服务 ${url} 在 ${timeoutMs}ms 内未就绪`)
}

export default async function globalSetup() {
  console.log('\n🔧 [E2E Setup] 准备测试环境…')

  // ── 1. 清理旧测试数据库 ──
  const dbPath = path.join(SERVER, 'prisma', 'test.db')
  execSync(`rm -f "${dbPath}"`, { stdio: 'ignore' })
  console.log('  ✅ 已清理旧 test.db')

  // ── 2. 创建测试数据库 + 推送 schema ──
  execSync('npx prisma db push --skip-generate', {
    cwd: SERVER,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  })
  console.log('  ✅ test.db 表结构已创建')

  // ── 3. 填充种子数据 ──
  execSync('npx tsx prisma/seed.ts', {
    cwd: SERVER,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  })
  console.log('  ✅ 种子数据已填充')

  // ── 4. 启动后端（独立端口 + 独立数据库） ──
  const beEnv = {
    ...process.env,
    PORT: '3202',
    DATABASE_URL: 'file:./test.db',
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-do-not-use-in-production',
    JWT_EXPIRES_IN: '1d',
  }
  const beProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: SERVER,
    env: beEnv,
    stdio: 'pipe',
  })
  beProcess.stdout.on('data', (d) => process.stdout.write(`[BE:3202] ${d}`))
  beProcess.stderr.on('data', (d) => process.stderr.write(`[BE:3202:err] ${d}`))
  globalThis.__E2E_BE_PROCESS = beProcess

  await waitForServer('http://localhost:3202/api/health', 20000)
  console.log('  ✅ 后端已就绪 (http://localhost:3202)')

  // ── 5. 启动前端（proxy → 3202） ──
  const feEnv = {
    ...process.env,
    VITE_API_TARGET: 'http://localhost:3202',
  }
  const feProcess = spawn('npx', ['vite', '--port', '3200', '--strictPort'], {
    cwd: ROOT,
    env: feEnv,
    stdio: 'pipe',
  })
  feProcess.stdout.on('data', (d) => process.stdout.write(`[FE] ${d}`))
  feProcess.stderr.on('data', (d) => process.stderr.write(`[FE:err] ${d}`))
  globalThis.__E2E_FE_PROCESS = feProcess

  await waitForServer('http://localhost:3200', 30000)
  console.log('  ✅ 前端已就绪 (http://localhost:3200)')

  console.log('🔧 [E2E Setup] 测试环境就绪\n')
}
