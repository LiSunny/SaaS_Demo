import platformAdminImg from '@/assets/demo-roles/platform-admin.svg'
import opsManagerImg from '@/assets/demo-roles/ops-manager.svg'
import supervisionAdminImg from '@/assets/demo-roles/supervision-admin.svg'
import enterpriseAdminImg from '@/assets/demo-roles/enterprise-admin.svg'
import normalUserImg from '@/assets/demo-roles/normal-user.svg'

/**
 * 体验账号（唯一数据源）
 *
 * 登录页「快速体验」五张体验卡与韧性AI助手工作台「选择体验身份」弹窗共用同一份数据，
 * 保证角色名 / 定位描述 / 账号密码完全一致（用户明确要求：功能相同文案必须一致）。
 *
 * 账号与身份对应关系：
 * 监管机构：13000000001 admin123!@# → 区域监管
 * 社会单位：13100001234 admin123!@# → 安全管理
 * 运营管理：安信智慧消防 18800001234 admin123!@# → 项目托管
 * 服务机构：蓝盾消防 13900002222 admin123!@# → 技术服务
 * 平台方：  测试运营(platform-ops) 13800000001 3xkxr4 → 运营管理（平台分组）
 */
export interface DemoAccount {
  role: string
  desc: string
  phone: string
  password: string
  image: string
  /**
   * 体验入口是否可用。运营管理（operator）/服务机构（service）的授权数据扩展（S4/S5）
   * 实现前先屏蔽体验入口——否则登录后推荐问题查不到数据（只能看本企业，无数据）。
   * S4/S5 实现后改回 true 即可（2026-08-18 用户拍板）。
   */
  enabled?: boolean
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: '监管机构', desc: '区域监管 · 联勤督办', phone: '13000000001', password: 'admin123!@#', image: supervisionAdminImg },
  { role: '社会单位', desc: '自查自管 · 隐患闭环', phone: '13100001234', password: 'admin123!@#', image: platformAdminImg },
  { role: '运营管理', desc: '安全托管 · 项目服务', phone: '18800001234', password: 'admin123!@#', image: opsManagerImg, enabled: false },
  { role: '服务机构', desc: '维保检测 · 接单处置', phone: '13900002222', password: 'admin123!@#', image: enterpriseAdminImg, enabled: false },
  { role: '平台管理', desc: '租户开通 · 配置支撑', phone: '13800000001', password: '3xkxr4', image: normalUserImg },
]

/** 当前可用的体验账号（按 enabled 过滤，默认全部可用） */
export const ACTIVE_DEMO_ACCOUNTS: DemoAccount[] = DEMO_ACCOUNTS.filter(a => a.enabled !== false)
