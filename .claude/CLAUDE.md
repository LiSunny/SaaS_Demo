# maintenance-demo — 人工智能+公共安全管理平台（产品 Demo）

> Skill 调试验证项目。Skill 流水线、调试方法见[父目录 CLAUDE.md](../CLAUDE.md)。

## ⚠️ 写任何代码前（强制）

**拿到设计稿/需求 → 先查项目已有资源，再写代码。禁止自己发明。**

| 你要写 | 先查 | 工具 |
|--------|------|------|
| 图标 | `public/icons/` 下是否已有 | `ls public/icons/` |
| 按钮 / 标签 / 表单 | 项目 class 是否已有 | `grep` 搜索 `btn-` `act-` `clean-` 等 |
| 页面布局 | 列表页 → `EnterpriseList.vue`；表单 → `EnterpriseFormDrawer.vue`；详情 → `PlanDetail.vue` | 打开对应范式文件 |
| 颜色 / 字号 / 间距 | 只准用 `var(--xxx)` | `grep` 查 `src/style.css` |
| 表单输入框 | `class="clean-input"` 等公共样式 | `.claude/references/ui-patterns.md` 第三节 |
| Figma 写代码 | 设计稿每个元素 → 先映射到项目已有组件/class | 逐元素对照，找不到再问用户 |
| **图标** | **项目内不存在的图标 → 用占位图 `📷`，告诉用户自己替换。禁止手写 SVG、禁止从 Figma 导出** | 用户已有明确 skill 规定 |

**违反本规则的后果**：手写 SVG → 项目已有同名图标文件；自创 class → 项目已有标准 class；硬编码颜色 → 全局 Token 已定义；自己画图标 → 用户反复强调不能用 SVG 画。每次都浪费 1-2 轮对话修复。

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

> 更新时间：2026-07-30

**当前阶段：** 应急局电动车监控大屏（EbikeMonitor）开发完成，视觉调试收敛，bigscreen-implement skill 已加固。

### 已完成

**电动车监控大屏（代码，1 页面 + 11 组件）：**
- [x] `EbikeMonitor.vue` — 主页面，三列布局 + 暗色滚动条全局样式
- [x] `EbikeMonitorHeader.vue` — 顶部标题栏（Figma SVG 装饰 + 渐变背景 + 底部分隔线）
- [x] `EbikeSectionTitle.vue` — 小标题组件（Figma 精确还原：渐变底 + 3 个 SVG 装饰）
- [x] `StatCardRow.vue` — 4 统计卡片（Figma 导出 `stat-card-bg.svg` 背景 + CSS 文字）
- [x] `DutyCompliance.vue` — 经营主体日常履责（3 Tab + 已履责/未履责指标 + 排名表）
- [x] `HazardHandling.vue` — 自查隐患运维处置（2 Tab + 数据表格）
- [x] `PlatformInfo.vue` — 共享电动自行车监管（美团数据卡片）
- [x] `ChargingStationStats.vue` — 充电桩消安台账（2 Tab + SVG 圆环 + 达标详情）
- [x] `MapWithMarkers.vue` — 高德地图 + 4 色 Figma 标记点（SVG 圆点 + 标签）
- [x] `FireAlarmLinkage.vue` — 火灾预警点位联动（3 Tab + 告警列表）
- [x] `EnterpriseMonitor.vue` — 消控室值班监控（企业选择 + 持证人数 SVG + 写实摄像头画面）
- [x] `EmergencyPlan.vue` — 应急预案卡片（Figma SVG 图标 + 水印）
- [x] 路由注册：`/landing/ebike`、类型 `BigscreenType.ebike`、模板 `bigscreen-templates.ts`

**Figma 素材（26 个）：**
- [x] Header: `ebike-header-left/right/glow.svg`
- [x] 小标题: `section-intersect.svg` / `deco-left/right.svg`
- [x] Tab 图标: `icon-city/school/operation/smoke/leave/electric.svg`
- [x] 业务图标: `icon-ebike/battery/personnel/emergency-plan/good/bad.svg`
- [x] 地图标记: `marker-yellow/blue/red/orange.svg`
- [x] 履责背景: `compliance-bg-done/undone.svg`
- [x] 卡片背景: `stat-card-bg.svg`

**Skill 改进：**
- [x] `bigscreen-implement` SKILL.md 新增"硬性约束"10 条
- [x] Memory `skill-execution-enforcement.md` — 跨 session 技能执行提醒
- [x] Skill 从 monorepo 根目录复制到 `maintenance-demo/.claude/skills/`，`/` 斜杠可触发

### 技术要点

- **高德地图集成**：复用项目 AMap 2.0 CDN + 暗色主题 `d09c32c3f8fe92f329d2631a674d4441`
- **写实监控画面**：参考 `FireControlMonitoring.vue`，镜头暗角 + 扫描线动画 + REC 指示灯 + 时间戳 OSD
- **统一卡片体系**：所有模块 `.module-card` 使用 `rgba(0,80,140,0.45)` + `border rgba(0,152,230,0.2)`
- **页面背景**：`radial-gradient(#003768, #00244d)` 深蓝底
- **文字对比度**：渐变终点 `#c8e4ff`，未选中 tab `opacity: 0.45`
- **暗色滚动条**：非 scoped 全局 `::-webkit-scrollbar`，4px 宽、20% 蓝色滑块

### 待处理

| 问题 | 优先级 | 来源 |
|------|--------|------|
| 监控画面为静态截图，待对接真实 RTSP 流 | P1 | EnterpriseMonitor |
| 四个统计卡片数据为静态，需对接后端 API | P1 | StatCardRow |
| 地图标记点坐标为模拟值，需用真实坐标 | P1 | MapWithMarkers |
| 各列表数据为 Mock，需对接后端 | P2 | DutyCompliance / HazardHandling / FireAlarmLinkage |
| 充电桩圆环图达标率为固定值 | P2 | ChargingStationStats |

### 关键决策

- **Figma 素材 > CSS 模拟**：本次最大教训。已在 skill 中固化为硬性约束 #1-3。
- **逐模块验证 > 批量交付**：9 个模块一次性写完导致 10+ 轮返工。已在 skill 中固化为 #6-7。
- **非 scoped 样式块**：滚动条 scoped 无效，最终用全局 `<style>` 块解决。
- **模块底色统一**：尝试了 4 种方案后对齐 stat card 的 `#0063A0` 色相才收敛。

### 下次建议动作

1. `npm run dev` → 访问 `/landing/ebike` 查看完整效果
2. 对接后端：用 `/design 电动车监控` + `/generate 电动车监控` 创建 API
3. 替换监控画面为真实 RTSP 流或定期截图

