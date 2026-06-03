/**
 * workflow.ts — 流程模板 API
 *
 * 薄层转发，实际实现在 adapters/ 中根据 VITE_API_MODE 选择：
 *   - 默认（PoC 模式）：adapters/workflow-dao.ts（localStorage 持久化）
 *   - VITE_API_MODE=real：adapters/workflow-http.ts（axios → 真实后端）
 *
 * 所有 Store / View 的导入路径不变，修改记录集中在此文件。
 */

export * from './adapters/index'
