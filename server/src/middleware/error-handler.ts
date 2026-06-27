import type { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || '服务器内部错误'

  console.error(`[ERROR] ${statusCode} - ${message}`)
  if (statusCode === 500) {
    console.error(err.stack)
  }

  res.status(statusCode).json({
    code: statusCode,
    message,
    data: null,
  })
}
