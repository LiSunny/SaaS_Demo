# 用户管理 — AI 代码规格索引

> 模块：M0 用户账号管理（平台级） + M2 岗位与权限管理（平台层）
> 菜单归属：系统管理
> 生成日期：2026-06-27

---

## 页面清单

### M0 用户账号管理

| 页面 | 类型 | 文件 | 状态 |
|------|------|------|------|
| 用户列表 | 列表管理 | [用户列表.md](用户列表.md) | ✅ 已生成 |
| 新增用户 | 表单提交（弹窗） | [新增用户.md](新增用户.md) | ✅ 已生成 |
| 编辑用户 | 表单提交（弹窗） | [编辑用户.md](编辑用户.md) | ✅ 已生成 |

### M2 岗位与权限管理（平台层）

| 页面 | 类型 | 文件 | 状态 |
|------|------|------|------|
| 内置岗位列表 | 列表管理 | [内置岗位列表.md](内置岗位列表.md) | ✅ 已生成 |
| 新增/编辑岗位 | 表单提交（弹窗） | [新增编辑岗位.md](新增编辑岗位.md) | ✅ 已生成 |
| 权限配置 | 表单提交（抽屉） | [权限配置.md](权限配置.md) | ✅ 已生成 |

---

## 接口汇总

### M0 用户账号管理

| 操作 | 方法 | 路径 |
|------|------|------|
| 获取用户列表 | `GET` | `/api/admin/users` |
| 获取用户详情 | `GET` | `/api/admin/users/:id` |
| 新增用户 | `POST` | `/api/admin/users` |
| 编辑用户 | `PUT` | `/api/admin/users/:id` |
| 停用/启用 | `POST` | `/api/admin/users/:id/toggle-status` |
| 重置密码 | `POST` | `/api/admin/users/:id/reset-password` |
| 获取关联企业 | `GET` | `/api/admin/users/:id/enterprises` |

### M2 岗位与权限管理

| 操作 | 方法 | 路径 |
|------|------|------|
| 获取岗位列表 | `GET` | `/api/admin/positions` |
| 获取岗位详情 | `GET` | `/api/admin/positions/:id` |
| 新增岗位 | `POST` | `/api/admin/positions` |
| 编辑岗位 | `PUT` | `/api/admin/positions/:id` |
| 删除岗位 | `DELETE` | `/api/admin/positions/:id` |
| 保存权限配置 | `PUT` | `/api/admin/positions/:id/permissions` |

## 下一步

- 如有 Figma 设计稿：`/md-figma-to-vue3 docs/用户管理/ai-spec/内置岗位列表.md + Figma 链接`
- 如无 Figma 设计稿：`/md-figma-to-vue3 docs/用户管理/ai-spec/内置岗位列表.md`（仅基于 MD 生成）
- 如需调整规格：直接编辑对应 `.md` 文件后重新运行 `md-figma-to-vue3`
