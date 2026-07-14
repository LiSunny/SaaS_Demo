/**
 * agent-intents.ts — Agent 意图配置
 *
 * 页面别名 → 路由映射。与后端 server/src/services/agent.service.ts 中的 PAGE_ALIASES 保持同步。
 */
export interface PageAlias {
  route: string
  aliases: string[]
}

export const PAGE_ALIASES: Record<string, PageAlias> = {
  'landing': {
    route: '/landing',
    aliases: ['大屏首页', '区域联勤', '总览大屏', '可视化大屏', '主大屏', '首页', 'landing'],
  },
  'street-detail': {
    route: '/landing/street-detail',
    aliases: ['商业街', '商业街管理', '商业街专题', '示范街', '街道详情', '街道管理', '街道'],
  },
  'fire-control': {
    route: '/landing/fire-control',
    aliases: ['消防控制室', '消控室', '消防管理', '消防监控', '消防'],
  },
  'gongmao': {
    route: '/gongmao',
    aliases: ['工贸安全', '工贸驾驶舱', '工贸企业', '安全生产驾驶舱', '驾驶舱', '工贸'],
  },
}
