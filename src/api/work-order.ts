/**
 * work-order.ts — 工单 API
 *
 * 薄层转发，实际实现在 adapters/ 中根据 VITE_API_MODE 选择：
 *   - 默认（PoC 模式）：adapters/work-order-dao.ts（内存 mock）
 *   - VITE_API_MODE=real：adapters/work-order-http.ts（axios → 真实后端）
 */

import * as dao from './adapters/work-order-dao'
// 后端实现后恢复：import * as http from './adapters/work-order-http'

// 后端未实现，始终使用 DAO Mock（后端实现后改为 mode === 'real' ? http : dao）
const adapter = dao

export const {
  getWorkOrderList,
  createWorkOrder,
  submitDraft,
  getWorkOrderDetail,
  cancelWorkOrder,
  reassignWorkOrder,
  acceptWorkOrder,
  submitNodeForm,
  performNodeAction,
  getWorkOrderStats,
  updatePriority,
} = adapter
