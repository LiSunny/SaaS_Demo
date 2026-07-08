/**
 * Playwright 全局 teardown
 * 1. 杀掉前后端进程
 * 2. 清理 test.db
 */
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '..')
const SERVER = path.resolve(ROOT, 'server')

export default async function globalTeardown() {
  console.log('\n🧹 [E2E Teardown] 清理测试环境…')

  // 1. 杀掉前后端进程
  for (const proc of [globalThis.__E2E_BE_PROCESS, globalThis.__E2E_FE_PROCESS]) {
    if (proc && proc.pid) {
      try {
        proc.kill('SIGTERM')
      } catch {
        // 进程可能已经退出
      }
    }
  }
  // 等待进程完全退出
  await new Promise((r) => setTimeout(r, 1000))
  console.log('  ✅ 前后端进程已停止')

  // 2. 清理测试数据库
  const dbPath = path.join(SERVER, 'prisma', 'test.db')
  execSync(`rm -f "${dbPath}"`, { stdio: 'ignore' })

  // 也清理 SQLite WAL 日志
  execSync(`rm -f "${dbPath}-journal" "${dbPath}-wal" "${dbPath}-shm"`, { stdio: 'ignore' })

  console.log('  ✅ test.db 已清理')
  console.log('🧹 [E2E Teardown] 完成\n')
}
