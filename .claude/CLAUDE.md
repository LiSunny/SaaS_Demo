# maintenance-demo — 人工智能+公共安全管理平台（产品 Demo）

> Skill 调试验证项目。Skill 流水线、调试方法见[父目录 CLAUDE.md](../CLAUDE.md)。

## 一、产品定位

**通用安全领域数字化协同平台**。覆盖消防安全 + 应急安全 + 可扩展至工业安全，串联物业方、服务方、监管方三方协作。全平台规划 **17 业务域 × 123 模块**（详见 `docs/biz-design.md`）。

**核心用户**：11 岗位覆盖四方组织（详见 [`docs/平台岗位设计.md`](docs/平台岗位设计.md)）。

## 二、业务域全景图

> 17 域全量视图，来源 `docs/biz-design.md`。粗体 = POC 已实现。

| 导航分组 | 业务域 | 模块数 | POC 状态 | 文档 |
|---------|--------|:---:|:---:|------|
| ⭐ 工作台（固定） | **工作台** | 1 | ✅ | [设计文档](docs/工作台/biz-design.md) |
| 🖥 监控与值守 | **远程值守** | 12 | 🔨 消防控制室场景 | — |
| | **数据可视化** | 7 | 🔨 大屏 + 街道详情 | — |
| 🔧 设备与物联 | 设备管理 | 18 | 📌 域首页占位 | — |
| | IOT | 14 | 📌 域首页占位 | — |
| | **维保应用** | 2 | 🔨 计划列表/详情 | [设计文档](docs/维保管理/biz-design.md) |
| 🔍 巡查与隐患 | 巡查检查 | 8 | ⬜ | — |
| | 隐患管理 | 2 | ⬜ | — |
| | 危险作业 | 2 | ⬜ | — |
| 📋 合规与管理 | 政务管理 | 4 | ⬜ | — |
| | 项目管理 | 6 | ⬜ | — |
| | 食品安全 | 6 | ⬜ | — |
| 🏫 培训与知识 | 培训与演练 | 3 | ⬜ | — |
| ⚙️ 平台运营/管理 | **平台运营** | 4 | 🔨 租户/用户/岗位/流程 CRUD | [租户管理](docs/租户管理/) / [用户管理](docs/用户管理/) |
| | 平台管理 | 4 | ⬜ 占位 | — |
| | 平台配置 | 22 | 📌 域首页占位 | — |
| | 系统管理 | 17 | 📌 域首页占位 | — |

### POC 已实现页面（按业务域）

| 业务域 | 页面 | 路径 |
|--------|------|------|
| **工作台** | 工作台首页 | `src/views/workbench/Workbench.vue` |
| **消防控制室** | 大屏入口、消防控制室、街道详情 | `src/views/bigscreen/BigscreenLanding.vue` `FireControlPage.vue` `StreetDetailPage.vue` |
| **维保应用** | 维保计划列表、详情 | `src/views/maintenance/PlanList.vue` `PlanDetail.vue` |
| **工单管理** | 模板列表/配置、工单监控/详情、仪表盘 | `src/views/workflow/` + `src/views/system/Dashboard.vue` |
| **租户管理** | 企业列表/详情/关联/下级管理 | `src/views/admin/EnterpriseList.vue` `EnterpriseDetail.vue` `PartnerManage.vue` `SubordinateManage.vue` |
| **用户管理** | 账号管理、岗位 | `src/views/admin/UserList.vue` `PositionList.vue` |
| **设备/IOT/平台/系统** | 各域首页（跳转入口） | `src/views/device/Overview.vue` `iot/Overview.vue` `platform/Overview.vue` `admin/Overview.vue` |
| **门户/登录** | Portal 落地页、登录 | `src/views/portal/PortalPage.vue` `src/views/auth/Login.vue` |

## 三、平台组织模型

- **扁平企业模型**：所有主体均为平级企业，管理链通过关联动态建立
- **下级管理**：上级发起（"我把你纳为下级"），数据从下级流向上级，上级自动获全部权限，一企业一上级
- **相关方**：数据持有方发起（"我把自己数据给你"），数据同向流动，需手动配置权限，无数量限制
- **"上级"判定**：谁发起"下级管理"谁就是上级，关联类型本身定义方向，非系统标签

### 导航架构

侧栏主导航（**6 分组 + 工作台固定项**），定义在 `src/config/navigation.ts`。
- 模块数 ≤ 8 → 侧栏内嵌展开，2 级嵌套
- 模块数 > 10 → 侧栏放入口项，点击跳转域首页
- 支持按岗位过滤可见性（`NavNode.visibleTo`），见 [`navigation-role-design.md`](docs/navigation-role-design.md)

## 四、技术参考

### 技术栈

| 层 | 选型 |
|----|------|
| 前端框架 | Vue 3 + Vite + TypeScript + Composition API |
| UI 组件库 | Element Plus 2.x |
| 状态管理 | Pinia + Vue Router 4 |
| 表单设计器 | `@form-create/designer` + `@form-create/element-ui`（可视化搭建 + DynamicForm 渲染） |
| 后端 | Express + Prisma + SQLite（`server/`） |
| 数据模式 | `.env` 中 `VITE_API_MODE=real` → 真实 API；不设置 → `dao-engine.ts` + `db-adapter.ts` localStorage Mock |

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev:fresh` | 一键启动前后端（释放端口 → 后端 → 前端） |
| `npm run dev` | 仅前端 Vite（`:3200`，代理 `/api` → `:3201`） |
| `cd server && npm run dev` | 仅后端 Express（`:3201`） |
| `npm run build` | `vue-tsc -b && vite build` 类型检查 + 生产构建 |
| `npm run icons` | 从 `public/icons/` 构建 SVG sprite |
| `cd server && npx prisma generate` | 重新生成 Prisma Client |
| `cd server && npx prisma db push` | 推送 schema 变更到 SQLite |

### 后端三层架构

```
Routes → Controller → Service → Prisma
```

| 层 | 职责 | 位置 |
|----|------|------|
| **Routes** | 定义路由 + 绑定中间件（`auth` / `requireSystemRole`） | `server/src/routes/` |
| **Controller** | 请求解析、参数校验、调用 Service、构造响应 | `server/src/controllers/` |
| **Service** | 业务逻辑 + Prisma 查询，不接触 req/res | `server/src/services/` |
| **Middleware** | `auth.ts`（JWT 验证，注入 `req.user`）、`error-handler.ts`、`not-found.ts` | `server/src/middleware/` |

已实现 API：`auth` / `enterprise` / `user` / `position`

### 前端 API Adapter 模式

```
src/api/adapters/
├── index.ts              # 根据 VITE_API_MODE 切换 adapter
├── enterprise-http.ts    # 真实 HTTP 调用
├── enterprise-dao.ts     # Mock localStorage DAO
├── work-order-http.ts / work-order-dao.ts
└── workflow-http.ts / workflow-dao.ts
```

新增业务域 adapter 必须遵循 HTTP/DAO 双实现模式。

### HTTP 请求工具

`src/utils/request.ts` — Axios 实例，baseURL `/api`，自动注入 Bearer token，401 时清除登录态。

### 路由守卫

`src/router/index.ts` — 两层保护：
1. **登录保护**：无 token → `/login`；已登录访问 `/login` → `/workbench`
2. **系统角色保护**：`platform-ops`/`platform-admin` 用户与普通用户路由互斥

### 关键设计决策

| 决策 | 说明 |
|------|------|
| `User.systemRole` 独立于企业岗位 | 分 `platform-ops`（运营管理）和 `platform-admin`（技术管理） |
| 运营 vs 技术分离 | 运营 → 租户/用户/岗位/流程；技术 → 路由/菜单/升级/参数 |
| 不能降级自己 | 编辑自己的 systemRole 时后端拒绝 |

## 五、目录约定

| 目录 | 用途 |
|------|------|
| `src/views/` | 页面（按业务域分子目录） |
| `src/views/*/widgets/` | 仪表盘 Widget 组件 |
| `src/components/dashboard/` | 仪表盘框架组件 |
| `src/components/business/` | 业务组件 |
| `src/components/base/` | 基础组件 |
| `src/stores/` | Pinia Store |
| `src/api/` | API 调用层 |
| `src/api/adapters/` | API Adapter 层（HTTP/DAO 双模式，运行时按 `VITE_API_MODE` 切换） |
| `src/types/` | TypeScript 类型定义 |
| `src/router/` | 路由配置 |
| `src/config/` | 全局配置 + 导航数据结构 |
| `src/utils/` | 工具（`request.ts` axios 实例、`dao-engine.ts` 通用 DAO、`db-adapter.ts` localStorage 适配） |
| `src/composables/` | Vue Composables（`useConfirm`、`useCountUp`、`useInView`） |
| `src/style.css` | 全局样式（Design Tokens + Light/Dark 变量 + Element Plus 覆盖） |
| `public/icons/` | SVG 图标源文件 → `npm run icons` → `public/sprite.svg` |
| `server/src/` | 后端（routes / controllers / services / middleware） |
| `scripts/` | `dev-fresh.sh`（全栈启动）、`build-sprite.cjs`（SVG sprite） |

## 六、开发规范

- **列表页**：复制 `src/views/admin/EnterpriseList.vue` 全文，只改：列名、字段、Store 名、表单字段。CSS 一字不动。禁止凭记忆手写列表页。
- **列表表头固定**：`.content-card { overflow: hidden }` + `.fi-table thead { position: sticky; top: 0; z-index: 1 }`，仅 `.table-wrap`（`flex:1; overflow:auto`）内滚动
- **UI 组件**：禁止直接使用 `el-button` / `el-table` / `el-tag` 的默认样式。按钮用项目 class（`btn-primary` `btn-default` `act-btn`），表格用 `<table class="fi-table">` + 全局 CSS，标签用 `StatusTag` 组件。视觉全走 `var(--xxx)` 设计令牌，不硬编码颜色/字号。场景不匹配 → 提问让用户决定。

## 七、工作快照

> 2026-07-10

**当前阶段：** 数据可视化大屏配置功能 — 运营可为企业配置大屏，企业登录后按配置跳转。

### 已完成

**大屏配置核心链路：**
- [x] 数据模型：`Bigscreen` + `BigscreenEnterprise`（多对多关联，Prisma migration）
- [x] 后端 API：CRUD + 关联企业管理 + 企业端默认查询（3 层架构）
- [x] 运营管理页：`BigscreenList.vue`（列表 + 新增/编辑抽屉 + 关联企业抽屉）
- [x] 导航新增：运营管理 → 大屏配置 → 大屏管理（`/admin/bigscreens`）
- [x] 登录跳转：企业用户登录 → 查默认大屏 → 有则跳大屏，无则工作台
- [x] 大屏 Header：多屏切换下拉 + 真实登录用户名显示
- [x] 类型→路由映射：`getBigscreenRoute(type, id)` → `/landing?bigscreenId=5`
- [x] 移除 DAO Mock：只走 HTTP 真实 API
- [x] 精简大屏类型：移除 `fire-control` / `street-detail`，只保留 `landing`（消控室/街道详情是大屏内的专题页面，不是独立大屏类型）

**UI 规范硬化：**
- [x] CLAUDE.md 开发规范升级："参考"→"复制全文，CSS 一字不动"
- [x] memory `ui-component-conventions.md` 升级：加"标准源文件表"+"三不原则"+"标准布局骨架"
- [x] 表单下拉动态化：从 `BIGSCREEN_TYPE_LABELS` 生成，不手写 `<el-option>`

### 关键决策

- **大屏-企业多对多**：参照 `User ↔ UserEnterprise` 模式，`isDefault` 放在中间表，不同企业可为不同大屏设默认
- **type 决定模板 + id 通过 URL 传**：`/landing?bigscreenId=5`，type 选 Vue 文件，id 让页面知道自己在展示哪个大屏
- **大屏类型只有 `landing`**：消控室、街道详情是大屏内的专题页面，路由保留在 `/landing/fire-control` 和 `/landing/street-detail`，由大屏内部导航，不走大屏配置
- **新增大屏模板只动 4 个文件**：types.ts / templates.ts / router / .vue 页面

### 待处理

| 问题 | 优先级 | 来源 |
|------|--------|------|
| 企业成员 CRUD API 完整对接 | P1 | 上次快照遗留 |
| 填充平台管理分组（路由配置/菜单管理/升级管理） | P2 | 上次快照遗留 |
| 大屏内容按配置动态渲染（当前仍为静态 Mock 组件） | P2 | 本次 |
| 其他模块 DAO Mock 是否也移除 | P2 | 本次讨论 |

### 下次建议动作

1. 真实数据库验证完整链路：运营创建大屏 → 关联企业 → 企业用户登录 → 自动跳转大屏
2. 让大屏页面根据 `bigscreenId` 展示不同标题/数据（当前组件仍为静态 Mock）

