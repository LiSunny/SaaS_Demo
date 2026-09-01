// 海港区应消联勤平台 · 通用左侧切换菜单数据源
//
// 供「概览页 LinkingPlatform / 系统壳 SubsystemLayout」共用，保证 11 屏菜单一致：
//   id=0 → 平台概览（/landing/linking）
//   id=1..10 → 各子系统（/landing/linking/sub/:id）
//
// icon 与标题风格与概览页（SysCard）一致：系统项用概览页同款 linking-icon-*.png 品牌图标，
// 标题白色 Alibaba PuHuiTi —— 见 BigscreenNavDrawer 的 .bsnd-icon/.bsnd-title 样式。
import { MODULES } from './modules'
import { ico } from '../util/ico-map'
import icon1 from '@/assets/bigscreen/linking/linking-icon-1.png'
import icon2 from '@/assets/bigscreen/linking/linking-icon-2.png'
import icon3 from '@/assets/bigscreen/linking/linking-icon-3.png'
import icon4 from '@/assets/bigscreen/linking/linking-icon-4.png'
import icon5 from '@/assets/bigscreen/linking/linking-icon-5.png'
import icon6 from '@/assets/bigscreen/linking/linking-icon-6.png'
import icon7 from '@/assets/bigscreen/linking/linking-icon-7.png'
import icon8 from '@/assets/bigscreen/linking/linking-icon-8.png'
import icon9 from '@/assets/bigscreen/linking/linking-icon-9.png'
import iconSys from '@/assets/bigscreen/linking/linking-icon-sys.png'

export interface LinkingNavItem {
  id: number
  title: string
  tag: string
  /** 完整 <svg> 片段（BigscreenNavDrawer 直接 v-html），用于无品牌图标项（如平台概览） */
  icon?: string
  /** 品牌 PNG 图标（概览页同款），存在时抽屉优先以 <img> 渲染，与概览页 icon 一致 */
  iconImg?: string
}

function svgIcon(inner: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

/** 概览页 SYS_COLUMNS 中各系统对应的品牌图标（mod → PNG），保持与概览页卡片一致 */
const MOD_ICONS: Record<number, string> = {
  1: icon1,   // 商铺主体责任系统
  3: icon2,   // 设备运行监测系统
  4: icon3,   // 商铺数字档案系统
  5: icon4,   // 设备生命周期系统
  9: icon5,   // 动火作业全流程管控
  2: icon6,   // 智能感知告警系统
  6: icon7,   // 隐患排查治理系统
  7: icon8,   // 联勤协同联动系统
  8: iconSys, // 消控联网监控系统
  10: icon9,  // 应急预案联动系统
}

/** 通用切换菜单：平台概览(0) + 10 系统(1-10) */
export const LINKING_NAV_ITEMS: LinkingNavItem[] = [
  { id: 0, title: '平台概览', tag: '三列系统总览', icon: svgIcon(ico('网格')) },
  ...MODULES.map((m) => ({ id: m.id, title: m.title, tag: m.tag, iconImg: MOD_ICONS[m.id] })),
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
