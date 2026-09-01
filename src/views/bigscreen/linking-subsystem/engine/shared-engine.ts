// 共享引擎：原 index.html 中跨模块复用的公共函数（原样提取）
import * as echarts from 'echarts'
import { icoPin } from './icon-consts'
import { SHOPS } from '../data/shops'

/* ===== 弹窗：openOverlay（原 index.html 8482 行） ===== */
export function openOverlay(overlayClass: string, innerHtml: string): HTMLElement {
  const overlay = document.createElement('div')
  overlay.className = overlayClass
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove() }
  overlay.innerHTML = innerHtml
  document.body.appendChild(overlay)
  return overlay
}

/* ===== ECharts 初始化：initChart（原 index.html 3633 行） ===== */
export function initChart(el: HTMLElement | null): any {
  if (!el) return { setOption() {} }
  if (typeof echarts === 'undefined') {
    el.classList.add('chart-fallback')
    el.textContent = '图表加载失败'
    return { setOption() {} }
  }
  return echarts.init(el)
}

/* ===== 读取 CSS 变量：cv（原 index.html 4155 行） ===== */
export function cv(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/* ===== 跨模块跳转状态：原 selectModule 改为由 SubsystemLayout 绑定 ===== */
export type ModuleSwitchFn = (id: number, state?: Record<string, unknown>) => void
let moduleSwitch: ModuleSwitchFn = () => {}
export function bindModuleSwitch(fn: ModuleSwitchFn) { moduleSwitch = fn }

/** 跨模块状态传递（原 openShopMore 设置 hzCurrentShop/evCurrentTab 等） */
let pendingState: Record<string, unknown> = {}
export function setPendingState(s: Record<string, unknown>) { pendingState = s }
export function consumePendingState(): Record<string, unknown> {
  const s = pendingState
  pendingState = {}
  return s
}

/** 原 openShopMore：模块01 商铺详情 → 跳到模块6/2 并带状态 */
export function openShopMore(kind: string, shopId: number, switchFn?: ModuleSwitchFn) {
  const s = SHOPS.find((x: any) => x.id === shopId)
  if (kind === 'hazard') {
    setPendingState({ hzCurrentShop: shopId })
    ;(switchFn || moduleSwitch)(6)
    return
  }
  setPendingState({ evCurrentTab: 'alarm', evStatusFilter: 'all', evSearchKeyword: s ? (s as any).name : '', evPage: 1 })
  ;(switchFn || moduleSwitch)(2)
}

/* ===== disposeCharts：释放 content 内 ECharts 实例（原 index.html 8492） ===== */
export function disposeCharts() {
  if(typeof echarts === 'undefined') return
  document.querySelectorAll('#content [id]').forEach(el => {
    const inst = echarts.getInstanceByDom(el)
    if(inst) inst.dispose()
  })
}

/* ===== cmpFallback：图片加载失败回退（原 index.html 4344） ===== */
export function cmpFallback(el: HTMLElement, label: string) {
  el.outerHTML = `<div class="cmp-empty"><span>${label} · 图片待替换</span></div>`
}

/* ===== toolbarHtml：空实现（原 index.html toolbarHtml 固定返回空，保真保留） ===== */
export function toolbarHtml(title: string, filters: any[] = [], actions: any[] = []): string {
  return ''
}

/* ===== uiToast：轻提示（原 index.html） ===== */
export function uiToast(msg: string) {
  const old = document.querySelector('.notice-toast-floating')
  if(old) old.remove()
  const toast = document.createElement('div')
  toast.className = 'notice-toast-floating'
  toast.textContent = msg || '操作成功'
  toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:2000;background:#182232;color:#fff;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 12px 28px rgba(0,0,0,.28);animation:uiToastIn .25s ease-out'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 1800)
}

/* ===== ico：侧栏图标（原 index.html 3632，依赖 ico-map） ===== */
import { ico as icoMap } from '../util/ico-map'
export function ico(name: string): string {
  return icoMap(name) || ''
}

export { icoMap }

/* ===== 跨引擎懒加载代理（循环依赖安全） ===== */
export async function _proxy(fn: string): Promise<any> {
  switch (fn) {
    case 'showEventDetail': {
      const m = await import('./events-engine')
      return (m as any).showEventDetail
    }
    case 'showDeviceDetail': {
      const m = await import('./devices-engine')
      return (m as any).showDeviceDetail
    }
    case 'getAllEvents': {
      const m = await import('./events-engine')
      return (m as any).getAllEvents
    }
    case 'shopDetailHtml': {
      const m = await import('./overview-engine')
      return (m as any).shopDetailHtml
    }
    case 'renderShopDeviceChart': {
      const m = await import('./overview-engine')
      return (m as any).renderShopDeviceChart
    }
    case 'getLifeInfo': {
      const m = await import('./devices-engine')
      return (m as any).getLifeInfo
    }
    default: return undefined
  }
}

/* ===== 小图标常量（原 index.html 1:1） ===== */
export const icoClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`
export const icoDevicePin = icoPin
export const icoExportSmallRaw = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`
export const icoFb = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
export const icoFile = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>`
export const icoMonitor = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`
export const icoNotice = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l14-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/></svg>`
export const icoPlusSmall = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`
export const icoRead = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`
export const icoRefreshSmall = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>`
export const icoSmoke = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 00-4 12.7V17a1 1 0 001 1h6a1 1 0 001-1v-2.3A7 7 0 0012 2z"/><path d="M9 21h6"/><path d="M10 18v3"/><path d="M14 18v3"/></svg>`

export const icoExportSmall = icoExportSmallRaw
