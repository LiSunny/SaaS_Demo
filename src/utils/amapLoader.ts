/**
 * 高德地图 JSAPI 按需加载器
 *
 * 原先是在 index.html 里用 <script src="https://webapi.amap.com/maps..."> 同步引入，
 * 全站每个页面（含与地图无关的门户页）都要等这 284KB 下载+执行完，
 * 外加它自己发的 restapi.amap.com/v3/log/init 请求，实测占 4.6 秒。
 *
 * 现在改为：只有真正需要地图的页面在初始化时调用 loadAMap()，动态注入脚本。
 * 同一页面多次调用会复用同一个 Promise，不会重复插入 script。
 */

const AMAP_KEY = '7f4cd18b762df89a443dfabcee1f5f5b'
const AMAP_SECURITY_CODE = '53ebff2a3ed8b8130c8f73e307800177'

let amapPromise: Promise<any> | null = null

export function loadAMap(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).AMap) {
    return Promise.resolve((window as any).AMap)
  }
  if (amapPromise) return amapPromise

  amapPromise = new Promise((resolve, reject) => {
    // ⚠️ securityJsCode 必须在 JS API 脚本加载之前设置
    ;(window as any)._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    script.async = true
    script.onload = () => {
      if ((window as any).AMap) resolve((window as any).AMap)
      else reject(new Error('高德地图 JSAPI 加载完成但未挂载 window.AMap'))
    }
    script.onerror = () => {
      amapPromise = null // 允许下次重试
      reject(new Error('高德地图 JSAPI 加载失败'))
    }
    document.head.appendChild(script)
  })

  return amapPromise
}
