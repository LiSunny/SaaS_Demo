/**
 * work-order.ts — 工单 API
 *
 * 薄层转发，实际实现在 adapters/ 中根据 VITE_API_MODE 选择：
 *   - 默认（PoC 模式）：adapters/work-order-dao.ts（内存 mock）
 *   - VITE_API_MODE=real：adapters/work-order-http.ts（axios → 真实后端）
 */

import * as dao from './adapters/work-order-dao'
import * as http from './adapters/work-order-http'

const mode = import.meta.env.VITE_API_MODE
const adapter = mode === 'real' ? http : dao

export const {
  getWorkOrderList,
  createWorkOrder,
  getWorkOrderDetail,
  cancelWorkOrder,
  reassignWorkOrder,
  getWorkOrderStats,
} = adapter
