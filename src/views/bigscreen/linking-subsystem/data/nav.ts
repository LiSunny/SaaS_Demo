// 海港区应消联勤平台 · 通用左侧切换菜单数据源
//
// 供「概览页 LinkingPlatform / 系统壳 SubsystemLayout」共用，保证 11 屏菜单一致：
//   id=0 → 平台概览（/landing/linking）
//   id=1..10 → 各子系统（/landing/linking/sub/:id）
import { MODULES } from './modules'
import { ico } from '../util/ico-map'

export interface LinkingNavItem {
  id: number
  title: string
  tag: string
  /** 完整 <svg> 片段（BigscreenNavDrawer 直接 v-html） */
  icon: string
}

function svgIcon(inner: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

/** 通用切换菜单：平台概览(0) + 10 系统(1-10) */
export const LINKING_NAV_ITEMS: LinkingNavItem[] = [
  { id: 0, title: '平台概览', tag: '三列系统总览', icon: svgIcon(ico('网格')) },
  ...MODULES.map((m) => ({ id: m.id, title: m.title, tag: m.tag, icon: svgIcon(ico(m.icon)) })),
]

/** id → 路由（0=概览 / 1-10=系统） */
export function linkingRouteFor(id: number): string {
  return id === 0 ? '/landing/linking' : `/landing/linking/sub/${id}`
}

/** 按系统标题解析 mod（概览页 由 bigscreenId → 大屏 name 匹配用） */
export function modByTitle(title: string): number | null {
  const hit = MODULES.find((x) => title.includes(x.title) || x.title.includes(title))
  return hit ? hit.id : null
}
