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
| **图标** | **项目内不存在的图标 → 用占位图 `📷`，告诉用户自己替换。禁止手写 SVG、禁止从 Figma 导出**（唯一例外：用户明确点名「直接使用 Figma 设计素材」时，导出原始素材落盘，见下方「消防档案」条目） | 用户已有明确 skill 规定 |

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
- [x] `components/ebike-v2/EbikeV2TimeSwitch.vue` — 模型区悬浮「场景光线」开关（白天 / 黄昏两态；形制按设计稿 70:313 = 胶囊 99×34 + 左侧场景名 + 右侧白圆钮 28×28，钮内 18px 场景图标；在「建筑导航」按钮上方）
- [x] `components/ebike-v2/EbikeV2CleanToggle.vue` — 模型区悬浮「全屏查看」入口（形制按设计稿 70:313 = 99×34 + 四角外扩图标 + 文字；进入全屏切内收图标 +「退出全屏」；全屏后转为右下角半透明退出入口）
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
- **嵌入模式露出建筑导航面板**：`html.is-embed .panel-left` 默认收起，大屏侧按钮切 `.is-open`；定位用 vw/vh 与大屏页面同一套 1920×1080 设计基准（iframe 与页面视口 1:1），吸附在「建筑导航」按钮下方：left 58.2292vw（= 面板左缘 1118 = 按钮右缘 1362 − 244）/ top 11.8519vh（= 按钮底缘 120 + 8）/ width 12.7083vw（= 244）/ bottom 1.4815vh（= 1064，与两列模块底缘齐平）
- **面板定位必须用设计单位而非写死像素**：写死 `left:508px; top:92px` 时，面板顶部 92~150 被大屏态势条（86~150 通栏，层级更高）压住，「建筑导航」标题与计数徽标整段不可见；且换视口即失效。iframe 内 `100vw/100vh` 即页面视口，`vw()/vh()` 与大屏页面完全等价
- **视觉方案在父页覆盖**：`campusTheme.ts` 按昼夜三档各写一套天空/雾/灯光/曝光。天穹是 `renderOrder === -1000` 的 ShaderMaterial 网格（唯一带 `topColor`/`bottomColor` uniform），雾色与天穹底部同色让地块远端融进大屏底色 `#000D34`
- **白天只换模型光照、不换场景背景**：白天档的天空/雾/场景背景沿用大屏底色（`#000a26→#000d34`，与黄昏同值），只把模型本体切成日光（暖白主光 2.4 + 强半球光 + 关夜间灯 + 曝光 1.05）。切白天若把天空刷成浅蓝 `#8ec9ef`，深蓝玻璃卡片会浮在一片亮天空上，整屏配色语言直接断掉；大屏是固定机位远看，背景一变还会被误读成"画面切了"
- **昼夜切换用立即模式**：`setTimePreset(name, true)` 后再套大屏配色，避免模型 1.2s 过渡中间态把天空刷成预设原始色
- **全屏底色单一来源 `BIGSCREEN_PAGE_BG`（#000D34）**：用户 2026-11-03 定「大屏整体背景改为 #000D34，所有 tab 共用」。常量导出在 `campusTheme.ts`，页面 CSS 经根节点内联注入的 `--bigscreen-page-bg` 消费；`BIGSCREEN_CAMPUS_BG`（小尼平安 `--embed-page-bg` 链路）、模型天穹底色与雾色全部指向同一个值 —— 只改 CSS 会让总览 tab（透出天穹）与其余 tab（透出页面底色）之间出现跳变。天穹顶部色同步压暗（day/dusk `#000a26`、night `#00060f`），保持"天顶比地平线暗"的层次。改底色后助手面板 surface 色阶必须重算：旧值相对新近黑底会浮成三块突兀亮蓝，现为 `--bg-0/1/2/3 = #000d34 / #061a3a / #0c2956 / #113468`
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
- **建筑导航开关与昼夜切换不在设计稿里**，是自加控件。原放在顶栏导航与用户区之间的空档（建筑导航 x=1360、昼夜 x=1472），现已移到模型区：做成 `.ebike-v2__scene-tools` 悬浮控件组挂在两列容器上（`top:0` → 与两列顶边天然对齐，状态条改高度不用改数值），昼夜切换在上、建筑导航在下；建筑导航另置 `.ebike-v2__scene-tools-right`（`right: calc(vw(522) + vw(20))` → 右缘 1362 = 右列左缘 1382 − 20）
- **两侧模块列宽按黄金分割 1 : φ : 1**：左右等宽 `vw(522)`（左 16→538、右 1382→1904），模型区 538→1382（844 = 522 × φ，φ=1.618）。设计稿 70:313 原为左 468 / 模型 1024 / 右 396，2026-11-02 按用户口径重分，卡内版式比例仍沿用设计稿
- **绝对定位的 `left` 基准是列容器不是页面**：`.ebike-v2__scene-tools` 挂在 `.ebike-v2__cols`（自身左缘 = 内容区内边距 x=16）上，`left: vw(545)` 的绝对结果是 x=561（左列右缘 538 + 23），写 `vw(561)` 会整体右移 16px。右组用 `right` 锚右缘，无此偏移
- **顶栏底图按 68px 通栏重排**（`src/assets/bigscreen/ebike-v2/header-bg.svg`）：斜纹组 `translate(0 -6) scale(1 1.0625)` 拉到 0~68 满高
- **`<img>` 加载的 SVG 默认会上下留白居中**：盒子的宽高比与 SVG 自身 viewBox 比例不一致时，浏览器按 `preserveAspectRatio="xMidYMid meet"` 缩放并在剩余方向留白。实测底图盒 1690.5×66.11（比例 25.57）vs SVG 1932×68（比例 28.41）→ 内容按宽缩放 0.875、高 59.5，上下各留 3.3px，装饰线实际落在 CSS 59.0~62.8 而不是贴底。**三个 SVG（底图 / 装饰线 / 辉光）全部加 `preserveAspectRatio="none"`** 消除留白
- **装饰线拆成独立图层用代码定位**（`header-line.svg` + `.v2-header-line`）：`bottom:0` + `height: vh(4)`，与 `.v2-header-glow` 共用同一基准带，两者必然严格重合，不受视口比例影响。装饰线底边实测 CSS 62.2~66.1，正好等于标题条底边 66.11
- **底部装饰线的"流动"用设计稿自己的辉光块，不另加色块**：设计稿在 x=463.7~607.7 有一段静态辉光，另加一条流动亮痕会与它和两处蓝块同时高亮而打架。做法是把那段辉光从底图摘出，改成 `header-line-glow.svg`（144×4，外圈径向渐变改透明，两端淡出才无缝）沿线循环滑动；蓝块保持静止，线上任意时刻只有一处高光。`transform: translateX(-100% → calc(100vw + 100%))`，8s 一轮，约 258px/s
- **辉光亮度按"不抢眼"压过两轮**：初版峰值 `#DDFFFE` @0.78 → 实测峰值像素 (176,223,240)，对照同位置装饰线 (63,139,205) 偏亮过多，用户反馈"太亮、太明显"。现为 `#C6E9FF` @0.38 / `#4F9EDC` @0.34，实测峰值 (111,171,219)，呈柔和光带而非白闪
- **旧大屏零影响**：`/landing/ebike` 的组件只改 import 路径与标题底座实现，回归截图差异仅为实时时间戳 OSD
- **全屏查看模式（只留三维模型，内部仍叫 cleanMode）**：入口是模型区控件组第二枚（四角外扩图标 +「全屏查看」）；进入时隐藏顶栏 / 左右模块列 / 悬浮控件组（用 `v-show` 保留 DOM，不重建三维模型 iframe），并收起助手浮层与建筑导航面板；退出靠右下角半透明「退出全屏」（`opacity .45`，悬停点亮）或 Esc 键
- **模型区两枚场景控件尺寸固定 px，不随视口缩放**：控件里有 14px 文字，而大屏字号下限锁 14 不再缩小；盒子若跟着 `vw()/vh()` 缩，窄视口下文字就放不下。故这两枚控件按设计稿尺寸写死（胶囊 99×34、圆钮 28×28、图标 18px），各视口几何完全一致；1920 下与设计稿逐像素对齐
- **清屏要跨层隐藏全局悬浮机器人**：小尼机器人挂在 `StandaloneLayout` 里且 Teleport 到 `body`，组件 scoped 样式够不到，改用 `body.ebike-clean-mode` 类 + 页面内非 scoped 样式块隐藏 `.agent-floating-chat`
- **本页 Playwright 合成点击全部判不过**：浮在三维模型 iframe 之上的控件（顶栏标题、建筑导航、全屏查看入口）用 `page.click()` 都会卡在可操作性检查（visible/stable），既有控件同样如此，不是新代码引入；CDP 真实输入事件命中正常。校验脚本改用 `page.mouse.click(元素中心坐标)`，与用户实际点击一致
- **消防档案页按设计稿 110:11265 重构为左右两栏**（`pages/EbikeV2FireArchive.vue`）：左「档案分类」分区固定 `vw(280)`（`archive/EbikeV2ArchiveSidebar.vue`，三个纵向 tab：值班记录 / 巡查记录 / 隐患台账），右「详细记录」分区吃掉剩余宽度。分类 tab 从「卡片内顶部横排」移到侧栏后，表格区能占满整屏宽度 —— 值班 7 列 / 巡查 9 列 / 隐患 10 列，窄表区会把长时间戳列压到截断。设计稿未给条数角标，故 tab 上不显示计数
- **大屏分页器覆盖必须 `!important` + 更高特异性**：全局 `src/style.css` 的 `.el-pagination.is-background .el-pager li { background-color: var(--pagi-bg) !important }` 会压过 `styles/bigscreen-ep.scss` 的 `.bigscreen .el-pagination .el-pager li`（后者无 `!important`，特异性再高也压不住 important）。大屏页没有 `html.dark`，`--pagi-bg` 落到 `:root` 的浅色 `#F0F1F6`，不压掉就渲染成浅灰方块、与深蓝卡片割裂。页面内覆盖（如 `EbikeV2ListPanel.vue` 的 `.list-panel__pager`）要写 `!important` 且选择器比全局更具体
- **大屏日期区间面板需要独立暗色作用域**：项目里 `el-picker-panel` 的暗色适配只写在 `html.dark` 下，大屏没有 `html.dark`，直接用 `el-date-picker` 会弹出浅色面板。已在 `styles/bigscreen-ep.scss` 补 `.bigscreen-el-date-panel`（teleport 到 body，需独立作用域），页面用 `popper-class="bigscreen-el-date-panel"` 挂上
- **`el-date-picker` 的根元素不吃 scoped 作用域标记**：Vue 只把父组件的 `data-v-*` 挂到子组件的根元素，而 EP 日期选择器的根是内部渲染的 `.el-date-editor`，拿不到作用域标记 —— 写 `.list-panel__date { ... }` 会整条不命中（表现是宽度/内距都没生效，元素被 flex 撑开）。做法是外面包一层自己的 `<div class="list-panel__date">`，再用 `:deep(.el-date-editor)` 往下打
- **大屏字号有 14px 下限，控件盒子不能纯按 vw 缩**：设计稿量的是 1920，但文字不随视口缩，盒子按比例缩到窄视口就装不下（分页器的「10 条」被截成「1...」）。这类固定文案控件给 `min-width`（px），不只给 `vw()`
- **e2e 前后端端口可覆盖**：`e2e/setup.mjs` 的 `E2E_FE_PORT` / `E2E_API_PORT`、`e2e/playwright.config.ts` 的 `E2E_BASE_URL` 可改端口。手工 dev server 常占着 3200，此时 setup 里的 `vite --strictPort` 不会退出、只打一行「Port 3200 is already in use」，随后 `waitForServer` 立刻成功 —— 测试于是跑在手工 dev server 上（代理到真实后端/真实库），以为在测测试库，其实在测开发环境。改端口避开
- **档案分类 tab 的 icon 用 Figma 原始素材（用户显式授权的例外）**：三个 24×24 彩色立体插画节点 `112:330` / `112:337` / `112:345`（值班记录=记录板、巡查记录=折叠地图+定位针、隐患台账=台账+警示三角），已导出为 `src/assets/bigscreen/ebike-v2/archive/archive-icon-{duty,patrol,hazard}.svg`，组件里 `import` 拿 URL 渲染 `<img class="archive-side__icon-img">`。这属于「禁止从 Figma 导出」默认规则的例外：**仅当用户点名要原图时**才这么做，且只用于 Figma 里本身就是 IMAGE-SVG 导出素材的节点（自带渐变描边，重画必然走样）；矢量图形组件仍走项目图标库。SVG 在 4KB 以下会被 Vite 内联成 data URL，运行时无外部依赖
- **系统监测页按设计稿 110:10889 重构**（`pages/EbikeV2SystemMonitor.vue`）：版式换成「顶部设备检测指标概览横条 + 左侧组态画布 + 右列（实时警情 / 多发故障排名）」。原右列三模块（健康度分析 / 设备状态监控 / 统计分析报表）与底部三模块行（故障曲线等）设计稿里都没有，连同 `EbikeV2PageShell.vue` / `EbikeV2PlaceholderCard.vue` 一并删除（设计稿是唯一准绳，不留"以防万一"的模块）。系统切换从画布左上角的浮动按钮移到顶部横条的「当前系统」下拉
- **指标四项计数改用实时设备数据，与「设备设施管理 → 运行监控」三个系统主页同源**（`monitor-data.ts` + `useSubsystemStore`）：设备总数 = 该系统接入的设备台数（消防给水 1156 / 气体灭火 101 / 防排烟 96，来自 `config/subsystem-profiles.ts` 的 `scale`）；故障 / 屏蔽 / 预警 = 对应状态（fault / shielded / alarm）的设备台数。**注意 store 只会产出 normal / alarm / fault 三种状态，不产生 shielded / offline** → 大屏「屏蔽」恒为 0，这是口径事实不是 bug。排名改为按**设备类型**聚合异常台数（不是按点位名）；警情每条 = 一台异常设备，标题给设备编号、位置给「设备类型 · 位置描述」。原先 `scene-points.ts` 里的 `sceneMetricsOf` / `faultTypeRanks` 随之删除，该文件只剩值守工作台在用的 `pointSourcesOf` / `isAbnormalPoint`
- **大屏下拉浮层必须 Teleport 到 body**：带 `backdrop-filter` 的祖先会把溢出的子元素裁到自身边框盒内（滤镜区域 = border box），下拉留在玻璃卡里只剩一条缝。`EbikeV2MonitorMetrics.vue` 的系统下拉用 `<Teleport to="body">` + 触发框 `getBoundingClientRect()` 算 `position: fixed` 的 top/left/width
- **Teleport 到 body 的浮层拿不到页面级 CSS 变量**：大屏的主题变量（`--fire-text-*`）挂在 `EbikeMonitorV2.vue` 的根节点上，`--min-scale` 挂在 `StandaloneLayout.vue` 的根节点上 —— 浮层被传到 body 后脱离这两个作用域，`var(--fire-text-label)` 解析失败会**静默回退成继承色**（实测未选中项变成黑字，在深蓝底上看不清；`font-size: clamp(..., calc(16 * var(--min-scale)), 16px)` 同样整条失效）。所以 Teleport 出去的浮层里，色值直接引 `fire-common.scss` 的 SCSS 真源（`fire.$fire-text-label`），字号用固定 px；页面内元素照常用 `var(--fire-*)`
- **右列两卡高度等分父容器，不再给悬浮机器人留位**：`.monitor__side > :deep(*) { flex: 1 1 0 }` 让「实时警情」「多发故障排名」各占一半（各 322px），底边与组态画布齐平（830）。原先底部留的 `vh(128)` 机器人空位已去掉 —— 留白会破坏等分。小尼机器人是全局 fixed 悬浮件（112×112，右下角 24px），仍会压住排名卡**末行占比条的灰底右段**，但占比填充段在左侧、百分比数字在右端靠边，两者都不受影响
- **气体灭火 / 防排烟用组态配置里那两幅现成画面，不另画**（`server/prisma/seed-monitor-symbols.ts`）：大屏画的就是组态配置里的「气体灭火设备状态监测」「防排烟系统设备监控」（各 2 个节点），**画面一个节点都不加**。真正的缺口是这四个图元（`GFES-MH-01` / `GFES-PD-01` / `SCS-MH-01` / `SCS-RPD-01`）从没登记进图元管理，只以内联定义留在组态配置导出的画面文件里（`src/config/gas-scene.json` 等）—— 大屏画布只认图元库，所以渲染不出图形、也取不到点位 → 四项指标全 0。做法是把这四个图元补登记进图元管理（产品图沿用画面文件里的 OSS 地址、端口照搬），并给绑定补状态类声明：运行点补 `offClass:['is-off']`（停运即「屏蔽」）、故障点 `is-fault`、欠压 / 压差超限 `is-over`（进「预警」与故障排名）。结果两个系统都是 设备总数 2 / 故障 2 / 屏蔽 1 / 预警 1。`npm run db:seed:monitor`（server/ 下）幂等补写，`prisma/seed.ts` 里也调一次，新库/e2e 库开箱即有
- **三个系统统一取「设备监控类」画面**（`scene-picker.ts`）：设备设施管理 → 组态配置里每个系统都有一幅监控组态图 —— 气体灭火设备状态监测 / 防排烟系统设备监控 / **消防水系统设备状态监控**；大屏三个系统统一用这些，指标与警情口径才一致。挑选规则按序：① 名称同时含「设备」与「监控/监测」的优先 ② 节点多的优先 ③ 最近更新的优先；「验证 / 测试」画面排除。不硬编码画面 id 或名称（画面是平台数据，组态配置里可编辑）。消防给水系统改用「消防水系统设备状态监控」后是 11 图元 / 故障 7 / 屏蔽 0 / 预警 4

- **组态画布接实时状态 + 点击下钻**（`pages/EbikeV2SceneCanvas.vue`）：传 `systemKey` 时，节点的设备归属走各系统绑定表（`monitor-bindings.ts` → `config/{firewater,gas,smoke}-scene.ts` 的 `bindingOf` + `aggregate`），状态按 `useSubsystemStore` 的运行时值聚合 → 异常图元挂 `is-fault` / `is-over`，角标按 2s / 2.5s 周期闪烁（与页面 3s 刷新错开）。**不传 `systemKey` 时保持原样**（只用画面自带的 `state`），值守工作台的平面图仍走这条，两者互不影响。交互层放在**文本层**（层2）：`<g role="button">` + `rect` 命中区（`fill="none"` + `pointer-events="all"`），层1 位图层 `pointer-events: none`，否则位图挡住点击
- **大屏系统监测页的一级抽屉版式对齐「设备设施台账 › 运行监控 › 系统监测」的下钻抽屉**（用户 2026-11-03 明确要求）：头部（设备数量 ⓘ + 图标 + 大数字 + 异常/正常占比环与图例）→ 分隔线 → 筛选行（设备编号/位置 + 运行状态 + 报警/故障 + 查询）→ 设备表格（运行状态 / 设备编码 / 位置 / 实时值 / 更新时间）→ 分页（共 N 条记录 第 x/y 页 + 页码按钮 + 共 N 页）。后台那份是 `components/subsystem/SubsystemPointGroupDialog.vue`（浅色 Element Plus 抽屉），大屏按同一版式重画成深色玻璃底（`EbikeV2MonitorDeviceDrawer.vue`，760 宽，`position: fixed`，z-index 10030 压过全局悬浮机器人 9999）。**报警/故障筛选用各系统的报警台账 store**（`stores/{firewater,gas,smoke}-alarm.ts`，与后台三个系统监测页共用同一批 store），大屏上筛出来的「有未处理报警」与后台是同一批设备。配色按大屏口径：异常统一一个红（#FF8080）、正常走中性色（环上的「正常」段因此是中性蓝而不是绿色）；**深色玻璃自绘而不用 `el-drawer`** —— 后台抽屉是浅色皮肤，贴到大屏上会割裂。**表格里状态量 / 开关量要给中文标签**（取 `MetricDef.states` 的 label），把 `normal` / `open` 甩到大屏上等于没做本地化
- **大屏系统监测页的 store 是全局单例，切系统会换掉别的页面的数据**：`useSubsystemStore` 同时被总览页的「消防用水监控」、泵房页、后台三个系统主页使用，`loadSubsystem(key)` 会整体替换 `points` 并重建运行时值。所以系统监测页切系统时调 `loadSubsystem`，离开页面时 `stopTimer()`（与总览页、泵房页同一套生命周期）
- **画布节点的绑定按「图元符号 + 第几个实例」匹配，不按节点 id**：画面是用户在组态配置里编辑的，节点 id 是编辑器生成的随机串，按 id 绑定会随编辑失效；符号才是稳定契约。`nth` 按该符号在画面节点数组里出现的次序算（`monitorNodeViews` 内维护 seen 计数）

### 下次建议动作

1. `npm run dev` → 访问 `/landing/ebike-v2` 查看三维背景效果
2. 补 v2 的 6 个业务模块内容（复用旧大屏模块组件，浅色主题另做）
3. 对接后端：用 `/design 电动车监控` + `/generate 电动车监控` 创建 API
4. 替换监控画面为真实 RTSP 流或定期截图

