/**
 * adapters/index.ts — 适配器选择层
 *
 * 通过 Vite 环境变量 VITE_API_MODE 选择数据源：
 *   - 默认（不设 / 非 real）→ DAO 适配器（localStorage，PoC 模式）
 *   - VITE_API_MODE=real  → HTTP 适配器（axios → 真实后端）
 *
 * Vercel 部署：
 *   - 无需设置任何环境变量，默认走 DAO 模式，零配置
 *   - 将来后端就绪后，在 Vercel 项目设置中加 VITE_API_MODE=real 即可切换
 */

// 两个适配器函数签名完全一致，static import 保证类型安全
import * as dao from './workflow-dao'
// 后端实现后恢复：import * as http from './workflow-http'

// 后端未实现，始终使用 DAO Mock（后端实现后改为 mode === 'real' ? http : dao）
const adapter = dao

// 开发环境输出日志，方便确认当前模式
if (import.meta.env.DEV) {
  console.log('[api-adapter] Mode: DAO (PoC) — 后端未实现，使用 Mock 数据')
}

// 导出的所有函数的引用在编译时确定，tree-shaking 友好
export const {
  getTemplateList,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  batchDeleteTemplates,
  updateTemplateStatus,
  getTemplateDetail,
  saveTemplateDraft,
  publishTemplate,
  saveAsSeed,
  updateSeed,
  isSeedTemplate,
  validateFlowDefinition,
  uploadFile,
} = adapter
