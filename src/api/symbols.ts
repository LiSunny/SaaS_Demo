/**
 * symbols.ts — 自定义图元 API 门面层
 *
 * 始终走 HTTP 真实 API，无 Mock 回退。
 */
export {
  fetchCustomSymbols,
  createCustomSymbol,
  updateCustomSymbol,
  removeCustomSymbol,
} from './adapters/symbol-http'
