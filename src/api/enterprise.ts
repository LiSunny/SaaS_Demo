/**
 * enterprise.ts — 租户管理 API 层
 */
import * as dao from './adapters/enterprise-dao'

export const {
  getEnterpriseList,
  getEnterpriseDetail,
  createEnterprise,
  updateEnterprise,
  lockEnterprise,
  extendEnterprise,
  batchDeleteEnterprises,
  getSubordinates,
  addSubordinates,
  removeSubordinates,
  getPartners,
  addPartners,
  removePartners,
  savePartnerAuth,
  getOperationLogs,
  getEnterpriseQrcode,
  regenerateQrcode,
  searchEnterprises,
  getDimADict,
  getDictB,
  getDictC,
  getDictD,
  getModuleTree,
} = dao
