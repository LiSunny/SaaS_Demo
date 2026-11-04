/**
 * 软件版本号 — 全局唯一事实源
 *
 * v0.89.76 由 git 历史推导：
 *   MAJOR  0   — 0.x 阶段，破坏性变更由 MINOR 承载
 *   MINOR  89  — feat 且引入新业务代码文件（.ts/.vue）的提交数
 *   PATCH  76  — fix 类提交数
 *
 * 发布时同步更新本文件，并打同名 git tag。
 */
export const APP_VERSION = '0.89.76'

/** 展示用版本标识，如 v0.53.59 */
export const APP_VERSION_LABEL = `v${APP_VERSION}`
