/**
 * bigscreen.ts — 大屏管理 API 层
 *
 * 始终走 HTTP 真实 API，无 Mock 回退。
 */
export {
  getBigscreenList,
  getBigscreenDetail,
  createBigscreen,
  updateBigscreen,
  deleteBigscreen,
  getBigscreenEnterprises,
  addBigscreenEnterprise,
  updateBigscreenEnterprise,
  removeBigscreenEnterprise,
  getUserBigscreens,
  getUserDefaultBigscreen,
} from './adapters/bigscreen-http'
