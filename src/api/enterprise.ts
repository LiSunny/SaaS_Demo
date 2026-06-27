/**
 * enterprise.ts — 租户管理 API 层
 *
 * 根据 VITE_API_MODE 环境变量切换适配器：
 * - VITE_API_MODE=real → HTTP 适配器（真实后端）
 * - 其他 / 未设置 → DAO 适配器（localStorage Mock）
 */
import * as dao from './adapters/enterprise-dao'
import * as http from './adapters/enterprise-http'

const useHttp = import.meta.env.VITE_API_MODE === 'real'

function api() { return useHttp ? http : dao }

export const getEnterpriseList        = (...args: any[]) => (api() as any).getEnterpriseList(...args)
export const getEnterpriseDetail      = (...args: any[]) => (api() as any).getEnterpriseDetail(...args)
export const createEnterprise         = (...args: any[]) => (api() as any).createEnterprise(...args)
export const updateEnterprise         = (...args: any[]) => (api() as any).updateEnterprise(...args)
export const lockEnterprise           = (...args: any[]) => (api() as any).lockEnterprise(...args)
export const extendEnterprise         = (...args: any[]) => (api() as any).extendEnterprise(...args)
export const batchDeleteEnterprises   = (...args: any[]) => (api() as any).batchDeleteEnterprises(...args)
export const getSubordinates          = (...args: any[]) => (api() as any).getSubordinates(...args)
export const addSubordinates          = (...args: any[]) => (api() as any).addSubordinates(...args)
export const removeSubordinates       = (...args: any[]) => (api() as any).removeSubordinates(...args)
export const getPartners              = (...args: any[]) => (api() as any).getPartners(...args)
export const addPartner               = (...args: any[]) => (api() as any).addPartner(...args)
export const updatePartner            = (...args: any[]) => (api() as any).updatePartner(...args)
export const removePartners           = (...args: any[]) => (api() as any).removePartners(...args)
export const savePartnerAuth          = (...args: any[]) => (api() as any).savePartnerAuth(...args)
export const getPartnerAuth           = (...args: any[]) => (api() as any).getPartnerAuth(...args)
export const getOperationLogs         = (...args: any[]) => (api() as any).getOperationLogs(...args)
export const getEnterpriseQrcode      = (...args: any[]) => (api() as any).getEnterpriseQrcode(...args)
export const regenerateQrcode         = (...args: any[]) => (api() as any).regenerateQrcode(...args)
export const searchEnterprises        = (...args: any[]) => (api() as any).searchEnterprises(...args)
export const getRelationRoleDict       = (...args: any[]) => (api() as any).getRelationRoleDict(...args)
export const getTagDict               = (...args: any[]) => (api() as any).getTagDict(...args)
export const getDictB                 = (...args: any[]) => (api() as any).getDictB(...args)
export const getDictC                 = (...args: any[]) => (api() as any).getDictC(...args)
export const getDictD                 = (...args: any[]) => (api() as any).getDictD(...args)
export const getModuleTree            = (...args: any[]) => (api() as any).getModuleTree(...args)
