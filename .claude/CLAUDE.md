# maintenance-demo — 人工智能+智能安全管控平台（产品 Demo）

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

**应急局电动车安全管控大屏 v2（`/landing/ebike-v2`）：**
- [x] `EbikeMonitorV2.vue` — 页面骨架：三维模型铺底（z-index 0）+ 大标题（z-index 100）+ 左右两列（z-index 10）+ 模型区悬浮控件组（`.ebike-v2__scene-tools`，z-index 11）
- [x] `components/common/BigscreenTitleBar.vue` — 大标题公共底座（background / nav / avatar 三个 slot），旧大屏 `EbikeMonitorHeader` 已改为基于它
- [x] `components/common/BigscreenSectionTitle.vue` — 小标题公共组件（由 `ebike/EbikeSectionTitle.vue` 迁入，旧大屏 7 处 import 只改路径）
- [x] `components/ebike-v2/EbikeV2Header.vue` — 标题「智能安全管控平台」+ 5 个导航按钮
- [x] `components/ebike-v2/EbikeV2Nav.vue` — 150×46 斜切按钮，选中态叠 Figma `nav-active-1/2.svg`
- [x] `components/ebike-v2/EbikeV2Card.vue` — 小标题 + 拟态玻璃内容区（透出三维模型）
- [x] `components/ebike-v2/EbikeV2CampusModel.vue` — 校园三维模型（iframe 嵌入 + 主题/机位覆盖 + 建筑导航面板开关）
- [x] `components/ebike-v2/campusTheme.ts` — 昼夜三档各自的大屏配色与机位参数
- [x] `components/ebike-v2/EbikeV2PoiToggle.vue` — 模型区悬浮「建筑导航」开关（展开模型自带 POI 面板，弹窗吸附在按钮下方展开）
- [x] `components/ebike-v2/EbikeV2TimeSwitch.vue` — 模型区悬浮「场景光线」开关（白天 / 黄昏两态，样式沿用后台 `ThemeToggle` 的药丸轨道 + 滑动圆钮 + 钮内图标；在「建筑导航」按钮上方）
- [x] `components/ebike-v2/useCampusModel.ts` — 模型实例 provide / inject（模型区控件与页面层不同层级）
- [x] 路由注册：`/landing/ebike-v2`、类型 `BigscreenType.ebike-v2`、模板 `bigscreen-templates.ts`、后台入库脚本 `server/scripts/register-ebike-v2-bigscreen.ts`
- [ ] 6 个业务模块内容（当前只有小标题骨架）

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

### v2 大屏技术要点

- **三维模型走 iframe 整页嵌入**（`public/campus-model/`，`?embed=1`）：模型 `src/app.js` 1922 行、深度耦合自身 DOM，改为同源 iframe 加载，`model.js` 核心模块零改动；父页通过 `iframe.contentWindow.campusApp` 驱动（`camera` / `controls` / `scene` / `renderer` / `ctx.THREE`）
- **嵌入模式只改 `index.html` + `styles.css`**：加 `html.is-embed` 隐藏自身 UI，加载完成后 `parent.postMessage({type:'campus-model:ready'})`；POI 面板标题在嵌入模式下改为「建筑导航」
- **嵌入模式露出建筑导航面板**：`html.is-embed .panel-left` 默认收起，大屏侧按钮切 `.is-open`；定位用 vw/vh 与大屏页面同一套 1920×1080 设计基准（iframe 与页面视口 1:1），吸附在「建筑导航」按钮下方：left 61.25vw（= 按钮左缘 1176）/ top 23.5185vh（= 按钮底缘 246 + 8）/ width 12.7083vw（= 244，与上方控制组等宽）/ bottom 1.4815vh（= 1064，与两列模块底缘齐平）
- **面板定位必须用设计单位而非写死像素**：写死 `left:508px; top:92px` 时，面板顶部 92~150 被大屏态势条（86~150 通栏，层级更高）压住，「建筑导航」标题与计数徽标整段不可见；且换视口即失效。iframe 内 `100vw/100vh` 即页面视口，`vw()/vh()` 与大屏页面完全等价
- **视觉方案在父页覆盖**：`campusTheme.ts` 按昼夜三档各写一套天空/雾/灯光/曝光。天穹是 `renderOrder === -1000` 的 ShaderMaterial 网格（唯一带 `topColor`/`bottomColor` uniform），雾色与天穹底部同色让地块远端融进大屏底色 `#00437A`
- **白天只换模型光照、不换场景背景**：白天档的天空/雾/场景背景沿用大屏底色（`#05284f→#00437a`，与黄昏同值），只把模型本体切成日光（暖白主光 2.4 + 强半球光 + 关夜间灯 + 曝光 1.05）。切白天若把天空刷成浅蓝 `#8ec9ef`，深蓝玻璃卡片会浮在一片亮天空上，整屏配色语言直接断掉；大屏是固定机位远看，背景一变还会被误读成"画面切了"
- **昼夜切换用立即模式**：`setTimePreset(name, true)` 后再套大屏配色，避免模型 1.2s 过渡中间态把天空刷成预设原始色
- **窗户自发光按基准重算**：模型按 nightFactor 缩放自发光，父页记录基准强度后按「基准 × 目标浓度」重算，反复切换不累积误差
- **禁用平移**：`controls.enablePan = false`，否则右键拖拽会把目标点拖到地面以下、模型跑出画面
- **拟态玻璃**：标题条底衬 `rgba(0,52,106,.55)` + `blur(10px)`；模块卡片 `rgba(0,48,100,.28)` + `blur(7px)`，下层三维模型隐隐透出、模块内容仍清晰
- **玻璃有帧率代价**：持续重绘的 WebGL 画布上，`backdrop-filter` 每帧重算，静止帧率 52→31fps（成本来自"存在 backdrop-filter"本身，不是模糊半径或图层数量）
- **大标题字号走 prop**：`BigscreenTitleBar` 的 `titleSize` / `titleTop` 默认 36 / 10（旧大屏像素不变），v2 传 28 / 16；导航按钮 142×41 放大为 150×46
- **顶栏按新版设计稿 frame #51:1776 / header #51:1783 还原**：玻璃底衬 `rgba(0,52,106,.55)` + `blur(10px)`、1932×68 斜纹图、1932×4 底部线（y=64）、144×4 辉光（y=64）、大标题 x=32 y=16 28px 渐变 `#FFFFFF→#7FD4FF`、导航 x=434 y=11、用户区 x=1767
- **导航选中 / 未选中是两套字体与配色**（Figma 51:1800）：选中项 51:1801 = 斜切平行四边形底（`nav-v2-active-glow.svg` 径向辉光+描边 + `nav-v2-active-base.svg` 线性底 0.2）；未选中项无底图形
- **导航两态的区分靠"选中更亮更细、未选中更暗更粗"**：设计稿给的未选中色 `#A8C8FF` 比选中渐变下段 `#89B5FF` 还亮，未选中又用普惠体 Bold（墨量大）、选中是细笔画的演示斜黑体，两态层级是反的。改为：**选中纯白 `#FFFFFF` + `text-shadow 0 0 10px rgba(120,200,255,.5)`；未选中 `#6E93C4` + 普惠体 Medium 500**
- **两态区分度的实测口径与结论**（量法：亮度 L=0.2126R+0.7152G+0.0722B；取导航文字所在行区间 → 背景 = 该区间亮度 20 分位 → 文字像素 = L > 背景+30 → 峰值 = 最大 L、P90 = 最亮 10% 文字像素均值、全像素均亮 = 文字像素均值；比值 = 选中值 ÷ 5 个未选中值均值）：
  | 对象 | 峰值比 | P90 比 | 全像素均亮比 |
  |---|---|---|---|
  | 实现·改造前 | 1.00× | 1.00× | 0.95× |
  | 设计稿 51:1800 | 1.18× | 1.19× | 1.04× |
  | 实现·改造后 | 1.52× | 1.58× | 1.25× |
  - 改造前实现里 6 项共用同一条 `.v2-nav__text` 规则，文字像素完全一致（1.00×），两态差别只来自选中项底部的平行四边形图形
  - 设计稿自身两态也很接近（均亮 1.04×），所以照设计稿直译同样看不出差别
  - 量的时候必须先隐藏 `.v2-nav__glow` / `.v2-nav__fill`，否则选中项的底图形与辉光会混进"文字像素"污染数值
  - 原始截图：`screenshots/ebike-compare/_nav-textonly-before.png`、`_nav-textonly-after.png`、`_figma-nav-51-1800.png`
- **选中文字不用 `background-clip` 渐变**：17px 小字上垂直渐变几乎看不出，且渐变裁剪会把 `text-shadow` 一起裁掉、辉光显示异常
- **导航字体用独立字体族名声明**（`ebike-v2-fonts.css` 的 `NavKeynote` / `NavPuHuiTiMedium`）：直接声明 `Alibaba PuHuiTi` 只给单个字重会让页面其它位置被合成，故换族名只作用于导航。代价是两个字体文件共 19.5MB（`Source-KeynoteartHans.otf` 10MB + `Alibaba-PuHuiTi-Medium.ttf` 9.5MB）
- **建筑导航开关与昼夜切换不在设计稿里**，是自加控件。原放在顶栏导航与用户区之间的空档（建筑导航 x=1360、昼夜 x=1472），现已移到模型区：做成 `.ebike-v2__scene-tools` 悬浮控件组挂在两列容器上（`top:0` → 与两列顶边天然对齐，状态条改高度不用改数值；`right: calc(vw(468) + vw(16))` → 右缘距完好率模块 16px），昼夜切换在上、建筑导航在下
- **顶栏底图按 68px 通栏重排**（`src/assets/bigscreen/ebike-v2/header-bg.svg`）：斜纹组 `translate(0 -6) scale(1 1.0625)` 拉到 0~68 满高
- **`<img>` 加载的 SVG 默认会上下留白居中**：盒子的宽高比与 SVG 自身 viewBox 比例不一致时，浏览器按 `preserveAspectRatio="xMidYMid meet"` 缩放并在剩余方向留白。实测底图盒 1690.5×66.11（比例 25.57）vs SVG 1932×68（比例 28.41）→ 内容按宽缩放 0.875、高 59.5，上下各留 3.3px，装饰线实际落在 CSS 59.0~62.8 而不是贴底。**三个 SVG（底图 / 装饰线 / 辉光）全部加 `preserveAspectRatio="none"`** 消除留白
- **装饰线拆成独立图层用代码定位**（`header-line.svg` + `.v2-header-line`）：`bottom:0` + `height: vh(4)`，与 `.v2-header-glow` 共用同一基准带，两者必然严格重合，不受视口比例影响。装饰线底边实测 CSS 62.2~66.1，正好等于标题条底边 66.11
- **底部装饰线的"流动"用设计稿自己的辉光块，不另加色块**：设计稿在 x=463.7~607.7 有一段静态辉光，另加一条流动亮痕会与它和两处蓝块同时高亮而打架。做法是把那段辉光从底图摘出，改成 `header-line-glow.svg`（144×4，外圈径向渐变改透明，两端淡出才无缝）沿线循环滑动；蓝块保持静止，线上任意时刻只有一处高光。`transform: translateX(-100% → calc(100vw + 100%))`，8s 一轮，约 258px/s
- **辉光亮度按"不抢眼"压过两轮**：初版峰值 `#DDFFFE` @0.78 → 实测峰值像素 (176,223,240)，对照同位置装饰线 (63,139,205) 偏亮过多，用户反馈"太亮、太明显"。现为 `#C6E9FF` @0.38 / `#4F9EDC` @0.34，实测峰值 (111,171,219)，呈柔和光带而非白闪
- **旧大屏零影响**：`/landing/ebike` 的组件只改 import 路径与标题底座实现，回归截图差异仅为实时时间戳 OSD

### 下次建议动作

1. `npm run dev` → 访问 `/landing/ebike-v2` 查看三维背景效果
2. 补 v2 的 6 个业务模块内容（复用旧大屏模块组件，浅色主题另做）
3. 对接后端：用 `/design 电动车监控` + `/generate 电动车监控` 创建 API
4. 替换监控画面为真实 RTSP 流或定期截图

