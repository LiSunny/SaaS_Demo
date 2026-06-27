import { PrismaClient } from '@prisma/client'

/**
 * 全局共享的 PrismaClient 单例
 * 避免多个实例竞争 SQLite 文件锁导致超时
 */
const db = new PrismaClient()

export default db
