import type { Request, Response, NextFunction } from 'express'

export function notFound(_req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    code: 404,
    message: `接口不存在: ${_req.method} ${_req.originalUrl}`,
    data: null,
  })
}
