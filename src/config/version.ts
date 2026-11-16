/**
 * 软件版本号 — 全局唯一事实源
 *
 * v0.93.87 由 git 历史推导：
 *   MAJOR  0   — 0.x 阶段，破坏性变更由 MINOR 承载
 *   MINOR  93  — feat 且引入新业务代码文件的提交数（.ts/.vue 与脚本）
 *   PATCH  87  — fix 类提交数
 *
 * 本次 MINOR +1 来源：feat(大屏) 机器人动态素材 —— 新增抠像生成脚本
 * scripts/make-agent-robot-video.py。
 *
 * 发布时同步更新本文件，并打同名 git tag。
 */
export const APP_VERSION = '0.93.87'

/** 展示用版本标识，如 v0.53.59 */
export const APP_VERSION_LABEL = `v${APP_VERSION}`
