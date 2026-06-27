---
name: gen-api
description: 根据前端 HTTP Adapter 契约和 DAO 参考实现，自动生成后端 Express + Prisma 三层代码（Routes → Controller → Service），并自动注册路由。在后端框架已搭建后使用。
when_to_use: 用户说"生成后端接口"、"实现 XX API"、"写 XX 模块后端"、"gen-api"时使用。
---

你是一名全栈工程师，擅长将前端的 API 契约和业务逻辑移植为后端代码。

$ARGUMENTS 传入要生成的目标模块名，例如：
- `auth`：认证登录
- `enterprise`：企业/租户 CRUD
- `workflow`：流程模板管理
- `work-order`：工单生命周期
- `maintenance`：维保计划 CRUD
- `all`：按依赖顺序生成全部模块

## 项目约定

- **框架**：Express.js + TypeScript + Prisma
- **端口**：后端 3201，前端 3200（Vite proxy `/api` → 3201）
- **响应格式**：`{ code: 0, message: 'ok', data: {...} }`
- **错误格式**：`{ code: <状态码>, message: '<消息>', data: null }`
- **文件位置**：`server/src/routes/`、`server/src/controllers/`、`server/src/services/`
- **Prisma Client 实例**：在 Service 文件中直接 `new PrismaClient()`（不共享单例）
- **路由注册**：所有路由在 `server/src/routes/index.ts` 中挂载

## 执行步骤

### Step 1：确认目标模块

如果 $ARGUMENTS 为空或为 `all`，按以下依赖顺序处理全部模块：
1. `auth`（无依赖）
2. `enterprise`（无依赖）
3. `workflow`（企业数据依赖）
4. `work-order`（模板 + 企业数据依赖）
5. `maintenance`（无依赖）

如果 $ARGUMENTS 指定了单个模块，只处理该模块。

### Step 2：读取前端契约和参考实现

对目标模块，读取以下文件：

| 前端文件 | 用途 |
|---------|------|
| `src/api/adapters/{module}-http.ts` | **API 契约**：精确的 HTTP 方法、路径、请求/响应格式 |
| `src/api/adapters/{module}-dao.ts` | **业务逻辑参考**：从 localStorage 移植到 Prisma |
| `src/types/{module}.ts` | **类型定义**：对应 Prisma Schema |
| `src/stores/{module}.ts` | **调用方**：了解前端如何调用 API |

如果某个模块没有独立的 HTTP adapter（如 `maintenance`），则读 `src/api/maintenance.ts`。

如果某个模块没有 DAO（如 `auth`），则只根据 HTTP adapter 实现。

### Step 3：生成 Service（厚层：业务逻辑 + Prisma 查询）

创建 `server/src/services/{module}.service.ts`。

**核心原则**：将前端 DAO 中的 localStorage 操作替换为 Prisma 操作。

**注意事项**：
- JSON 字段（`formSchema`、`flowDef`、`slaJson` 等）存储时用 `JSON.stringify()`，读取后在 Controller 层 `JSON.parse()` 返回
- 关联查询用 Prisma 的 `include` 或 `select`
- SQLite 不支持 JSON 内部查询，筛选 JSON 内部字段的需求在应用层完成
- Prisma Model 名首字母大写（`db.enterprise`、`db.workOrder`、`db.workflowTemplate`）

### Step 4：生成 Controller（薄层：参数提取 + 调用 Service）

创建 `server/src/controllers/{module}.controller.ts`。

**注意事项**：
- 所有 error 一律 `next(err)`，由 `error-handler.ts` 统一处理
- ID 参数从 `/api/xxx/:id` 提取，用 `Number(req.params.id)` 转换
- 分页参数默认值：`page=1, size=20`
- 404 情况：查不到记录时返回 `{ code: 404, message: '记录不存在', data: null }`

### Step 5：生成 Routes（路由定义）

创建 `server/src/routes/{module}.routes.ts`。

**注意事项**：
- 路由路径与前端 HTTP adapter 完全一致（例如前端调 `GET /work-order/list`，路由就写 `router.get('/list', ...)`）
- 带参数的路径用 `:id`
- export 命名用 `{module}Router` 格式
- import 路径必须加 `.js` 后缀（ESM）

### Step 6：注册路由

编辑 `server/src/routes/index.ts`：

1. 在文件顶部添加 `import` 语句
2. 在文件底部添加 `router.use('/api/{module}', {module}Router)`

**注意事项**：
- 只添加当前模块的注册，不要动其他已有注册
- 如果 import 或 use 行已存在（注释状态），取消注释即可

### Step 7：验证

生成完成后，执行以下验证：

```bash
# 1. 检查 TypeScript 编译
cd server && npx tsc --noEmit 2>&1 | head -30

# 2. 启动后端，测试对应接口
cd server && npx tsx src/index.ts &
sleep 2
curl -s http://localhost:3201/api/{module}/list | python3 -m json.tool
```

输出验证结果摘要，包含：
- 生成了哪些文件
- TypeScript 编译是否通过
- 接口是否正常响应

## 模块特殊处理

### auth 模块
- 无前端 HTTP adapter 参考，手动实现
- 路由：`POST /api/auth/login`、`GET /api/auth/profile`
- Service 从 `User` 表查询验证，用 `jsonwebtoken` 签发 token

### workflow 模块
- `getTemplateDetail` 的回退链：草稿 JSON → 已发布 JSON → 种子 JSON → `BUILTIN_DETAILS`（前端常量）
- `saveTemplateDraft`：更新 `draftConfig` JSON 字段，同步更新 `nodeCount`/`fieldCount`
- `publishTemplate`：将 `draftConfig` 内容迁移到 `publishedFlowDef`，更新 `status=1`
- 需要将前端的 `BUILTIN_DETAILS` 常量复制到后端

### work-order 模块
- 核心：SLA 评估引擎 + 状态机流转
- 移植 `work-order-dao.ts` 中的 `escalatePriority()`、`advanceAfterNodeCompletion()` 等到 Service 层
- `getDetail` 时需要动态计算 SLA 进度（`ttsProgress = elapsed / ttsMinutes * 100`）
- 创建工单时需要从 `WorkflowTemplate` 复制节点结构到 `WorkOrderNode` 表
- 跨企业协作（external 节点）：创建子工单 + 子工单回流父工单

### maintenance 模块
- 无独立 HTTP adapter，参考 `src/api/maintenance.ts` 的 Mock 实现

## 输出质量要求

- Controller 不做业务判断，只做参数提取和调用 Service
- Service 包含完整的业务逻辑和 Prisma 操作
- 响应格式严格遵循 `{ code, message, data }`
- JSON 字符串字段在 Service 存储，在 Controller 解析返回
- Prisma 查询使用 `findMany`/`findUnique`/`create`/`update`/`delete`，不用 raw SQL
