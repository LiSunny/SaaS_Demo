/**
 * 软件版本号 — 全局唯一事实源
 *
 * v0.94.87 由 git 历史推导：
 *   MAJOR  0   — 0.x 阶段，破坏性变更由 MINOR 承载
 *   MINOR  94  — feat 且引入新业务代码文件的提交数（.ts/.vue 与脚本）
 *   PATCH  87  — fix 类提交数
 *
 * 本次 MINOR +1 来源：feat(消息通知) 顶部导航栏消息通知子页面 ——
 * 新增消息通知模块（类型 / 数据层 / store / 受限 Markdown 渲染器 /
 * 正文分发组件 / 顶栏未读角标 / 通知抽屉三态：最近消息列表、全部消息列表、消息详情）。
 *
 * 发布时同步更新本文件，并打同名 git tag。
 */
export const APP_VERSION = '0.94.87'

/** 展示用版本标识，如 v0.53.59 */
export const APP_VERSION_LABEL = `v${APP_VERSION}`
