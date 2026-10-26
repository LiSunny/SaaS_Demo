/**
 * 模块占位页配置体例（共用）
 *
 * 各模块在自己的目录内维护一份 `Record<路由名, ModulePageConfig>`，
 * 由 `src/views/shared/module-registry.ts` 汇总后交给 ModulePlaceholder.vue 渲染。
 */
export interface ModulePageConfig {
  code: string        // 子功能编号，如 "D1-1"
  title: string       // 页面名（与侧栏菜单名一致）
  module: string      // 所属模块
  desc: string        // 一句话定位
  caps: string[]      // 核心能力（4~6 条）
  status?: string     // 演示状态文案
  statusTone?: 'info' | 'success' | 'warning'
}
