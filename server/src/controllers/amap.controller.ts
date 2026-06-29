import type { Request, Response } from 'express'

/**
 * 高德 JSAPI 安全模式 - serviceHost 代理服务
 *
 * 严格参考官方文档实现：
 * https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode
 *
 * 代理规则（仅需两条）：
 *   /_AMapService/v4/map/styles → https://webapi.amap.com/v4/map/styles （自定义地图服务，可选）
 *   /_AMapService/              → https://restapi.amap.com/              （Web 服务 API，必须）
 *
 * 所有请求附加 jscode=安全密钥 参数
 */

const AMAP_SECURITY_CODE = '5daf4f6a88af245297b73451e95ea25e'

/**
 * 构建转发 URL：保留原始 query 参数 + 附加 jscode 安全密钥
 */
function buildForwardUrl(baseUrl: string, path: string, query: Record<string, any>): string {
  const url = new URL(baseUrl + path)
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.append(k, String(v))
  }
  url.searchParams.append('jscode', AMAP_SECURITY_CODE)
  return url.toString()
}

/**
 * 通用代理转发（透传响应内容和 Content-Type）
 */
async function proxyTo(targetBaseUrl: string, forwardPath: string, req: Request, res: Response) {
  try {
    const forwardUrl = buildForwardUrl(targetBaseUrl, forwardPath, req.query as Record<string, any>)

    const resp = await fetch(forwardUrl, {
      method: req.method,
      headers: {
        'User-Agent': req.get('User-Agent') || 'AMap-Proxy-Node',
        'Accept': req.get('Accept') || '*/*',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const contentType = resp.headers.get('content-type')
    if (contentType) res.set('Content-Type', contentType)
    const text = await resp.text()
    res.status(resp.status).send(text)
  } catch (error: any) {
    console.error('[AMap Proxy] 转发失败', error.message)
    res.status(502).json({ error: '代理请求失败', detail: error.message })
  }
}

/**
 * 自定义地图服务代理（可选，未使用自定义地图功能可不设置）
 * /_AMapService/v4/map/styles/* → https://webapi.amap.com/v4/map/styles/*
 */
export async function mapStylesProxy(req: Request, res: Response) {
  const rest = (req.params as any)[0] || ''
  await proxyTo('https://webapi.amap.com', '/v4/map/styles' + rest, req, res)
}

/**
 * Web 服务 API 代理（必须）
 * /_AMapService/* → https://restapi.amap.com/*
 */
export async function generalProxy(req: Request, res: Response) {
  const rest = (req.params as any)[0] || ''
  await proxyTo('https://restapi.amap.com', '/' + rest, req, res)
}
