/**
 * bigscreen-templates.ts — 大屏类型到路由的映射
 *
 * Bigscreen.type 是数据库中的字符串标识符（自己定义），
 * 只要这里、数据库、router 三处一致即可。
 */
import type { BigscreenType } from '@/types/bigscreen'

/** 大屏类型 → 路由路径（不含参数） */
const TYPE_ROUTES: Record<BigscreenType, string> = {
  landing: '/landing',
  gongmao: '/gongmao',
  'enterprise-cockpit': '/enterprise-cockpit',
  campus: '/landing/campus',
}

/**
 * 根据大屏的 type 和 id 生成完整路由 URL
 *
 * type 决定用哪个 .vue 页面模板
 * id   通过 query 参数传入，让页面知道当前在展示哪个大屏
 *
 * 例：getBigscreenRoute('landing', 5) → '/landing?bigscreenId=5'
 */
export function getBigscreenRoute(type: BigscreenType, id: number): string {
  const base = TYPE_ROUTES[type] || '/landing'
  return `${base}?bigscreenId=${id}`
}
