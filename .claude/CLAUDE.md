# maintenance-demo — AI 安全管理平台（维保计划 Demo）

> Skill 调试验证项目。所有 10 个 skill 在此项目中迭代调试。

## 技术栈
- Vue 3 + Vite + TypeScript + Composition API
- Element Plus 2.x（UI 组件库）
- Pinia（状态管理）+ Vue Router 4
- 所有 API 为 Mock 实现（`src/api/`，内存数据）
- 开发服务器：`npm run dev`（默认 `http://localhost:3200`）

## 目录约定

| 目录 | 用途 |
|------|------|
| `DESIGN.md` / `DESIGN_DETAIL.md` | md-template 格式的设计文档（直接喂给 md-figma-to-vue3） |
| `docs/{域名}/` | 按业务域聚合（标准模板：prd/ + biz-design.md + module-plan.md + api.md + technical/ + ai-spec/） |
| `docs/{域名}/prd/` | gen-prd 产出 |
| `docs/{域名}/api.md` | gen-prd 产出（接口规格） |
| `docs/{域名}/ai-spec/` | gen-ai-spec 产出 → md-figma-to-vue3 输入 |
| `docs/issues/` | review-demo 走查报告 |
| `src/views/` | 生成的页面 |
| `src/views/*/widgets/` | 仪表盘 Widget 组件（按业务模块存放） |
| `src/components/dashboard/` | 仪表盘框架组件（通用） |
| `src/components/business/` | 业务组件 |
| `src/components/base/` | 基础组件 |
| `src/stores/` | Pinia Store |
| `src/api/` | Mock API 层 |
| `src/types/` | TypeScript 类型定义 |
| `src/router/` | 路由配置 |
| `src/config/` | 全局配置（Widget 注册表 / 仪表盘预设） + **导航数据结构** |
| `src/style.css` | 全局样式（Design Tokens + Light/Dark 变量） |

## 已生成的代码

| 模块 | 页面/组件 | 状态 |
|------|----------|------|
| 维保计划 | `views/maintenance/PlanList.vue` | ✅ 已生成 |
| 维保计划 | `views/maintenance/PlanDetail.vue` | ✅ 已生成 |
| 流程编排 | `views/workflow/TemplateList.vue` | ✅ 已生成 |
| 流程编排 | `views/workflow/TemplateConfig.vue` | ✅ 已生成 |
| 工单监控 | `views/workflow/WorkOrderMonitor.vue` | ✅ 已生成 |
| 工单详情 | `views/workflow/WorkOrderDetail.vue` | ✅ 已生成 |
| 通用 | `components/business/StatusTag.vue` | ✅ 已生成 |
| 通用 | `components/business/FlowDesigner.vue` | ✅ 已生成 |
| 通用 | `components/business/FormDesigner.vue` | ✅ 已生成 |
| 通用 | `components/business/NodePropertyPanel.vue` | ✅ 已生成 |
| 通用 | `components/business/PersonSelector.vue` | ✅ 已生成 |
| 通用 | `components/base/ThemeToggle.vue` | ✅ 已生成 |
| 通用 | `components/base/AppIcon.vue` | ✅ 已生成 |
| 通用 | `layouts/DefaultLayout.vue` | ✅ 已生成 |

### 待生成（本次）

| 模块 | 页面/组件 | 说明 |
|------|----------|------|
| 仪表盘框架 | `components/dashboard/DashboardShell.vue` 等 | 通用仪表盘引擎 |
| 仪表盘框架 | `stores/dashboard.ts` | 仪表盘状态管理 |
| 仪表盘框架 | `config/widget-registry.ts` | Widget 注册表 |
| 仪表盘框架 | `config/dashboard-presets.ts` | 仪表盘预设 |
| 工作台 | `views/workbench/Workbench.vue` | 角色化首页 |
| 工单 Widget | `views/work-order/widgets/OrderOverviewWidget.vue` | 工单概览 |
| 工单 Widget | `views/work-order/widgets/SlaOverviewWidget.vue` | SLA 概览 |
| 工单 Widget | `views/work-order/widgets/CreateOrderAction.vue` | 快捷发起 |
| 通用 | `components/business/PlaceholderWidget.vue` | 占位卡片 |
| 通用 | `components/business/CreateOrderDialog.vue` | 提取共用弹窗 |
| 系统管理 | `views/system/Dashboard.vue` | 工单数据看板 |

## 完整流水线（10 个 Skill）

### 命令速查

| 阶段 | 命令 | 产出 |
|------|------|------|
| 业务设计 | `/biz-design "描述"` | `docs/{域名}/biz-design.md` |
| 模块规划 | `/module-plan "约束"` | `docs/{域名}/module-plan.md` |
| Demo 搭建 | `/demo-scaffold {模块}` | `demo/{模块}/` |
| Demo 走查 | `/review-demo {模块}` | `docs/issues/{模块}-review.md` |
| 更新设计 | `/update-spec {模块}` | 更新 biz-design.md / module-plan.md |
| 生成 PRD | `/gen-prd {域名}` | `docs/{域名}/prd/{域名}.md` |
| 生成 AI 规格 | `/gen-ai-spec {域名}` | `docs/{域名}/ai-spec/{页面}.md` |
| 生成代码 | `/md-figma-to-vue3` + Figma | Vue 3 代码 |
| 提交 | `/commit` | git commit |
| 保存进度 | `/context-snapshot` | 更新本文档 |

### 快捷路径
- 仅代码生成：`/md-figma-to-vue3 DESIGN.md + Figma URL`
- PRD → 代码：`/gen-ai-spec {模块}` → `/md-figma-to-vue3`

## 调试 Skill 工作流

```
发现问题 → 编辑 .claude/skills/{skill}/SKILL.md → 重新调用 /{skill} → 对比输出
```

**每次调用 skill 时 Claude Code 从磁盘重新读取 SKILL.md**，无需重启会话。

### 常见修复位置

| 问题 | 修改文件 |
|------|---------|
| 页面组件分配错误 | `.claude/skills/gen-ai-spec/SKILL.md` |
| 状态颜色不对 | `.claude/skills/gen-ai-spec/SKILL.md` |
| EL 组件选型不准 | `.claude/skills/md-figma-to-vue3/references/element-plus-mapping.md` |
| 生成 CSS 样式偏差 | `.claude/skills/md-figma-to-vue3/references/style-override-guide.md` |
| 注册表缺组件 | `.claude/skills/md-figma-to-vue3/references/component-registry.md` |
| Design Token 缺失 | `.claude/skills/md-figma-to-vue3/references/design-tokens.md` |
| 代码模板不对 | `.claude/skills/md-figma-to-vue3/references/code-templates.md` |

## 导航架构

> 改造日期：2026-06-05。从「顶部 9 Tab + 侧栏过滤」改为「侧栏主导航」。

### 一级导航（侧栏）

| 分组 | 默认 | 画像 | 包含域 |
|------|------|------|--------|
| ⭐ 工作台 | 固定 | 全员 | 工作台 |
| 🖥 监控与值守 | 展开 | 值班员 | 远程值守（12）· 数据可视化（7）· 工单管理（2） |
| 🔧 设备与物联 | 折叠 | 维保/OEM | 设备管理→（18）· IOT→（14）· 维保应用（2） |
| 🔍 巡查与隐患 | 展开 | 安全经理 | 巡查检查（8）· 隐患管理（2）· 危险作业（2） |
| 📋 合规与管理 | 折叠 | 监管单位 | 政务管理（4）· 项目管理（6）· 食品安全（6） |
| 🏫 培训与知识 | 折叠 | 全员 | 培训与演练（3） |
| ⚙️ 平台管理 | 折叠 | 系统管理员 | 租户管理（4）· 流程管理（1）· 平台配置→（22）· 系统管理→（17） |

> **→** 标记表示该域模块数 > 10，侧栏只放入口，点击跳转至域首页概览页。
> 交互机制详见 [navigation-design.md](docs/navigation-design.md)。

### 路由 → 侧栏映射

| 路由 | 侧栏菜单 key | 说明 |
|------|-------------|------|
| `/workbench` | `workbench` | 工作台 |
| `/system/template` | `flow-template` | 流程模板（归属流程管理） |
| `/system/template/config/:id?` | `flow-template` | 模板配置（子路由） |
| `/system/monitor` | `order-monitor` | 工单监控（归属工单管理） |
| `/system/order/:id` | `order-monitor` | 工单详情（子路由） |
| `/system/dashboard` | `order-dashboard` | 工单数据看板（归属工单管理） |
| `/maintenance/plans` | `maintenance-record` | 维保计划 |
| `/maintenance/plans/detail/:id` | `maintenance-record` | 维保详情（子路由） |
| `/device` | `device` | 设备管理域首页（跳转式入口） |
| `/iot` | `iot` | IOT 域首页（跳转式入口） |
| `/platform` | `platform` | 平台配置域首页（跳转式入口） |
| `/admin` | `admin` | 系统管理域首页（跳转式入口） |

导航数据定义在 `src/config/navigation.ts`（NavGroup / NavNode 类型 + 6 组常量 + 工具函数）。

## 业务设计
> 最后更新：2026-06-25

| 层级 | 文档 | 说明 |
|------|------|------|
| 平台总览 | [biz-design.md](docs/biz-design.md) | 15 个业务域 + 11 岗位 + 导航分组 |
| 平台岗位 | [平台岗位设计.md](docs/平台岗位设计.md) | 11 岗位 × 四方协同 × 权限矩阵 × 数据范围（**后续功能设计依据**） |
| 导航设计 | [navigation-design.md](docs/navigation-design.md) | 侧栏主导航：6 分组、搜索/钉选/收起、角色化路线图 |
| 仪表盘框架 | [仪表盘框架/](docs/仪表盘框架/) | 通用仪表盘引擎 |
| 工作台 | [工作台/biz-design.md](docs/工作台/biz-design.md) | 跨域聚合，角色化首页 |
| 工单管理 | [工单管理/biz-design.md](docs/工单管理/biz-design.md) | 流程编排 + 工单全生命周期 |
| 维保管理 | [维保管理/biz-design.md](docs/维保管理/biz-design.md) | 维保计划→任务→报告全链路 |
| 租户管理 | [租户管理/biz-design.md](docs/租户管理/biz-design.md) | 企业管理、四维度属性体系、层级关系、配置流程 |

> 新增业务域：在 `docs/` 下创建 `{域名}/` 目录，按标准模板（prd/ + biz-design.md + module-plan.md + api.md + technical/ + ai-spec/）组织。`/biz-design` 产出 `biz-design.md` 放入该目录，更新本索引。

## 模块清单
> 最后更新：2026-06-25

### 仪表盘框架
| 模块 | 优先级 | 状态 |
|------|--------|------|
| M0 仪表盘框架 | P0 | 📝 设计完成，待编码 |

### 工作台
| 模块 | 优先级 | 状态 |
|------|--------|------|
| M1 工作台页面 | P0 | 📝 设计完成，待编码 |
| M2 工单概览 Widget | P0 | 📝 设计完成，待编码 |
| M3 SLA 概览 Widget | P0 | 📝 设计完成，待编码 |
| M4 维保概览 Widget | P1 | 📝 设计完成，待编码 |
| M5 隐患概览 Widget | P1 | 📝 设计完成，待编码 |
| M6 发起工单 Widget | P0 | 📝 设计完成，待编码 |
| M7 占位 Widget | P0 | 📝 设计完成，待编码 |
| M8 工单数据看板 | P1 | 📝 设计完成，待编码 |

详见 [工作台/module-plan.md](docs/工作台/module-plan.md)

### 工单管理（流程编排 + 工单全生命周期）

> 文档按域聚合于 `docs/工单管理/`：PRD → `prd/` | 业务设计 → `biz-design.md` | 模块规划 → `module-plan.md` | API → `api.md` | 技术设计 → `technical/` | AI 规格 → `ai-spec/`

| 模块 | 优先级 | 状态 |
|------|--------|------|
| M0 流程模板列表 | P0 | ✅ 已完成 |
| M1 流程模板配置（表单设计+流程设计） | P0 | ✅ 已完成 |
| M0 工单监控列表 | P0 | ✅ 已完成（含统计卡片+筛选+发起弹窗） |
| M1 工单详情页 | P0 | ✅ 已完成 |
| M2 工单数据看板 | P1 | 📝 设计完成，待编码 |
| 待实现 | M3 动态表单渲染 / M4 移动端处置 / M5 归档 / M6 消息通知 | — |
| 关键页面 | TemplateList + TemplateConfig + WorkOrderMonitor + WorkOrderDetail | — |

详见 [工单管理/biz-design.md](docs/工单管理/biz-design.md) · [工单管理/module-plan.md](docs/工单管理/module-plan.md)
设计：[00c-动态表单渲染设计](docs/工单管理/technical/00c-动态表单渲染设计.md)

### 租户管理

> 文档按域聚合于 `docs/租户管理/`：业务设计 → `biz-design.md` | 模块规划 → `module-plan.md`

| 模块 | 优先级 | 状态 |
|------|--------|------|
| M0 租户全生命周期管理（列表+新增+详情+编辑/锁定/延期） | P0 | 📝 设计完成，平台已有基础 |
| M1 企业属性升级（四维度 A/B/C/D） | P1 | 📝 设计完成，待开发 |
| M2 企业间关联管理（下级管理+相关方+数据授权） | P0 | 📝 设计完成，平台已有基础 |
| M3 应用配置（按域功能授权） | P1 | 📝 设计完成，平台已有基础 |
| M4 个性化配置（白标定制） | P2 | 📝 设计完成，平台已有基础 |

详见 [租户管理/biz-design.md](docs/租户管理/biz-design.md) · [租户管理/module-plan.md](docs/租户管理/module-plan.md)

### 域首页占位（跳转式入口，>10 模块的大域）
| 页面 | 路由 | 状态 |
|------|------|------|
| 设备管理域首页 | `/device` | 📝 占位页 |
| IOT 域首页 | `/iot` | 📝 占位页 |
| 平台配置域首页 | `/platform` | 📝 占位页 |
| 系统管理域首页 | `/admin` | 📝 占位页 |

### Skill 源仓库

`.claude/skills/` 下的所有 skill 从 `../`（父目录 `skill维护/`）复制而来。修改应先在这里验证，确认有效后再同步回源仓库。
