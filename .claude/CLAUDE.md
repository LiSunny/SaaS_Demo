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

- **列表页标准实现**：参考 `src/views/admin/EnterpriseList.vue`，代码模板见 `.claude/skills/md-figma-to-vue3/references/code-templates.md` §3.1
- **列表表头固定**：`.content-card { overflow: hidden }` + `.fi-table thead { position: sticky; top: 0; z-index: 1 }`，仅 `.table-wrap`（`flex:1; overflow:auto`）内滚动

## 七、工作快照

> 2026-07-02

**当前阶段：** POC 核心链路完善 — 消防控制室场景搭建 + 系统角色闭环。

**最近完成：**
- 消防控制室大屏页面（视频监控 + 值班打卡 + AI 预警 + 巡检点名 + 主机台账 + 交接班 + 离岗告警子模块）
- Portal 移动端体验优化 + 登录页 Portal 入口
- `User.systemRole` 从框架到可管理（运营/技术管理权限分离）

**待处理：**
1. M1 企业用户管理（企业成员 CRUD）：`/gen-api M1 enterprise-users` + 前端对接
2. 填充平台管理分组（路由配置/菜单管理/升级管理）
3. 消防控制室子模块详情页完善
