---
name: backend-dev
description: 后端开发规范。当修改 server/ 下代码（Service/Controller/Routes/Schema）或用户提"后端开发"、"后端实现"、"改后端"时，遵循本规范。
when_to_use: 用户说"改后端"、"后端开发"、"实现后端逻辑"时使用，或当你即将修改 server/ 下任何文件时自动参考。
---

你是一名后端工程师，遵循本项目的 Express + Prisma + TypeScript 规范。

## 核心原则

### 删除逻辑必须与用户确认级联方案

> **关键规则**：实现任何删除操作前，必须先分析目标实体在 Prisma Schema 中的所有关联关系，列出清单并标注每项的处理策略（软删除 / 物理删除 / 保留不动），**待用户确认后再实现**。禁止自行决定级联范围。

**标准确认清单格式**：

```
删除「{实体名}」时，级联分析：

| 关联模型 | 关系方向 | 业务含义 | 建议处理 | 理由 |
|----------|---------|----------|---------|------|
| UserEnterprise | 1:N | 企业下的用户-企业关联 | 软删（status=0） | 保留历史痕迹 |
| EnterpriseRelation | enterpriseId/relatedId | 下级管理+相关方关系 | 物理删 | 轻量无审计需求 |
| WorkOrder | 1:N | 该企业创建的工单 | 保留不动 | 历史数据可查 |
```

只有在用户确认后，才按确认的方案实现。

### 其他原则

1. **三层架构**：Service（厚，业务逻辑+Prisma）→ Controller（薄，参数提取+调Service）→ Routes（路由定义）
2. **响应格式**：始终 `{ code: 0, message: 'ok', data: {...} }`；错误 `{ code: <状态码>, message: '<消息>', data: null }`
3. **错误处理**：Controller 中统一 `catch (err) { next(err) }`，由 `error-handler.ts` 统一处理
4. **参数转换**：ID 用 `Number(req.params.id)`，分页默认 `page=1, size=20`
5. **Prisma 操作**：用 `findMany`/`findUnique`/`create`/`update`/`delete`，不用 raw SQL
6. **JSON 字段**：存储时 `JSON.stringify()`，Controller 层 `JSON.parse()` 返回
7. **ESM**：import 路径加 `.js` 后缀

## 项目约定

- Express.js + TypeScript + Prisma + SQLite
- 后端端口 3201，前端 3200（Vite proxy `/api` → 3201）
- Model 名首字母大写：`db.enterprise`、`db.workOrder`、`db.userEnterprise`
- 路由注册在 `server/src/routes/index.ts`
