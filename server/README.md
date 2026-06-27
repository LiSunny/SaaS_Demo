# maintenance-demo 后端

> 消防安全管理 SaaS 平台后端 · 2026-06-27

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 运行时 | Node.js + TypeScript | `tsx` 直接执行，无需编译 |
| 框架 | Express.js 4.x | HTTP 服务 |
| ORM | Prisma 6.x | 类型安全数据库访问 |
| 数据库 | SQLite（开发） | 单文件 `prisma/dev.db`，零配置；生产可切换 PostgreSQL |
| 认证 | JWT + bcrypt | Bearer Token |
| 安全 | helmet + cors | HTTP 头安全 + 跨域 |

## 目录结构

```
server/
├── prisma/
│   ├── schema.prisma              # 数据模型定义（所有表结构）
│   └── seed.ts                    # 种子数据（开发用示例数据）
├── src/
│   ├── index.ts                   # 应用入口（Express 实例、中间件、启动）
│   ├── config/
│   │   ├── env.ts                 #   环境变量加载
│   │   └── db.ts                  #   PrismaClient 单例
│   ├── middleware/
│   │   ├── auth.ts                #   JWT 认证中间件
│   │   ├── error-handler.ts       #   全局错误处理
│   │   └── not-found.ts           #   404 兜底
│   ├── routes/                    # 路由层（URL 定义）
│   ├── controllers/               # 控制器层（参数提取 + 响应封装）
│   └── services/                  # 服务层（业务逻辑 + 数据库查询）
├── .env                           # 环境变量
├── package.json
└── tsconfig.json
```

### 分层调用链

```
Request → Routes → Controller → Service → Prisma → SQLite
                      ↑
                  Middleware（auth / error）
```

- **Routes**：定义 URL 和 HTTP 方法
- **Controller**：从请求取参数，调用 Service，返回统一 JSON 响应
- **Service**：业务逻辑，调用 Prisma 操作数据库
- **Config**：基础设施（环境变量、DB 连接）
- **Middleware**：横切关注点（认证拦截、错误兜底）

### 统一响应格式

```json
{ "code": 0, "message": "ok", "data": {} }
```

## 数据模型一览

`prisma/schema.prisma` 定义了以下模型：

| 模型 | 说明 |
|------|------|
| `User` | 用户（用户名、所属企业、密码） |
| `Enterprise` | 企业 / 租户（三维度属性 B/C/D、层级关系） |
| `EnterpriseRelation` | 企业关联（下级管理 / 相关方） |
| `WorkflowTemplate` | 流程模板（表单设计 + 流程定义，JSON 嵌入） |
| `WorkOrder` | 工单（关联模板、流程状态、节点进度） |
| `WorkOrderNode` | 工单节点实例（状态、处理人） |
| `WorkOrderRecord` | 工单操作记录 |
| `NodeFormRecord` | 节点表单提交记录 |
| `BranchDecision` | 条件分支决策记录 |
| `MaintenancePlan` | 维保计划 |

## 数据库维护

### 查看数据（GUI）

```bash
cd server
npm run db:studio
```

自动打开浏览器 `http://localhost:5555`，可浏览、搜索、编辑所有表数据。

### 查看数据（命令行）

```bash
cd server
sqlite3 prisma/dev.db
```

```sql
.tables                    -- 列出所有表
.schema Enterprise         -- 查看 Enterprise 表结构
SELECT * FROM Enterprise;  -- 查询全量数据
.quit                      -- 退出
```

### 查看模型定义

```bash
cat prisma/schema.prisma
```

### 同步表结构（改 schema 后）

```bash
npm run db:push            # 同步 schema，不丢数据
npm run db:generate        # 重新生成 Prisma Client 类型
```

### 重置数据库

```bash
npm run db:reset           # 强制重建表 + 重新填充种子数据
```

### 种子数据

```bash
npm run db:seed            # 单独执行种子数据填充
```

种子数据包含：平台运营方 + 阳光物业 + 蓝盾消防 + 拱墅区应急管理局共 4 家企业示例。

## 常用命令

```bash
npm install                # 安装依赖
npm run dev                # 开发模式（tsx watch，文件变更自动重启）
npm start                  # 生产启动
npm run db:studio          # 打开数据浏览器
npm run db:push            # 同步数据库结构
npm run db:seed            # 填充种子数据
npm run db:reset           # 重置数据库
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3201` | 服务端口 |
| `DATABASE_URL` | `file:./dev.db` | 数据库连接；切 PostgreSQL 改此值即可 |
| `JWT_SECRET` | （开发默认值） | **生产环境务必替换** |
| `JWT_EXPIRES_IN` | `7d` | Token 过期时间 |

## 快速开始

```bash
cd server
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

- 服务：`http://localhost:3201`
- 健康检查：`GET /api/health`
- 默认管理员：`admin / admin123`
