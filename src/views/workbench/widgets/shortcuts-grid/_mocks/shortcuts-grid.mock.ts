// ShortcutsGridWidget Mock 数据
// 4 行 × 2 列 = 8 个常用功能（Figma Frame 661 1:1 复刻）
//
// 排列顺序（按设计稿）：
//   左列：管理单元 / 建筑管理 / 重点部位管理 / 相关方管理
//   右列：上下级管理 / 人员管理 / 权限管理 / 岗位管理
//
// 图标：项目 MenuIcon-* 白色 SVG，命名虽为"白色"但实际 fill=#505968 黑色。
//      7 个图标已用 Figma 精确路径覆盖（建筑/重点部位/相关方/上下级/人员/权限/岗位），
//      "管理单元"保留项目已有版本。

import type { ShortcutsGridConfig } from '../types'

export const shortcutsGridMock: ShortcutsGridConfig = {
  columns: 2,
  rows: 4,
  items: [
    // 左列
    { key: 'unit',     label: '管理单元',     icon: 'MenuIcon-管理单元-白色',     route: '/admin/enterprise', ready: true },
    { key: 'building', label: '建筑管理',     icon: 'MenuIcon-建筑管理-白色',     route: '',                  ready: false },
    { key: 'site',     label: '重点部位管理', icon: 'MenuIcon-重点部位管理-白色', route: '',                  ready: false },
    { key: 'related',  label: '相关方管理',   icon: 'MenuIcon-相关方管理-白色',   route: '',                  ready: false },
    // 右列
    { key: 'partner',  label: '上下级管理',   icon: 'MenuIcon-上下级管理-白色',   route: '',                  ready: false },
    { key: 'staff',    label: '人员管理',     icon: 'MenuIcon-人员管理-白色',     route: '/admin/user',       ready: true },
    { key: 'perm',     label: '权限管理',     icon: 'MenuIcon-权限管理-白色',     route: '',                  ready: false },
    { key: 'post',     label: '岗位管理',     icon: 'MenuIcon-岗位管理-白色',     route: '/admin/position',   ready: true },
  ],
}