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
| `docs/design/` | 业务设计文档（biz-design.md、module-plan.md、00-11 详细设计） |
| `docs/prd/{模块}.md` | gen-prd 产出 |
| `docs/api/{模块}.md` | gen-prd 产出（接口规格） |
| `docs/ai-spec/{模块}/{页面}.md` | gen-ai-spec 产出 → md-figma-to-vue3 输入 |
| `docs/issues/{模块}-review.md` | review-demo 走查报告 |
| `src/views/` | 生成的页面 |
| `src/views/*/widgets/` | 仪表盘 Widget 组件（按业务模块存放） |
| `src/components/dashboard/` | 仪表盘框架组件（通用） |
| `src/components/business/` | 业务组件 |
| `src/components/base/` | 基础组件 |
| `src/stores/` | Pinia Store |
| `src/api/` | Mock API 层 |
| `src/types/` | TypeScript 类型定义 |
| `src/router/` | 路由配置 |
| `src/config/` | 全局配置（Widget 注册表 / 仪表盘预设） |
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
| 业务设计 | `/biz-design "描述"` | `docs/design/biz-design.md` |
| 模块规划 | `/module-plan "约束"` | `docs/design/module-plan.md` |
| Demo 搭建 | `/demo-scaffold {模块}` | `demo/{模块}/` |
| Demo 走查 | `/review-demo {模块}` | `docs/issues/{模块}-review.md` |
| 更新设计 | `/update-spec {模块}` | 更新 biz-design.md / module-plan.md |
| 生成 PRD | `/gen-prd {模块}` | `docs/prd/{模块}.md` |
| 生成 AI 规格 | `/gen-ai-spec {模块}` | `docs/ai-spec/{模块}/{页面}.md` |
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

## 业务设计
> 最后更新：2026-06-03

| 层级 | 文档 | 说明 |
|------|------|------|
| 平台总览 | [biz-design.md](docs/design/biz-design.md) | 9 个业务域 + 用户角色 |
| 仪表盘框架 | [仪表盘框架/框架设计.md](docs/design/仪表盘框架/框架设计.md) | 通用仪表盘引擎 |
| 工作台 | [工作台/biz-design.md](docs/design/工作台/biz-design.md) | 跨域聚合，角色化首页 |
| 工单管理 | [工单管理/biz-design.md](docs/design/工单管理/biz-design.md) | 流程编排 + 工单全生命周期 |
| 维保管理 | [维保管理/biz-design.md](docs/design/维保管理/biz-design.md) | 维保计划→任务→报告全链路 |

> 新增业务域：创建 `docs/design/{业务域}/` 目录，`/biz-design` 产出 `biz-design.md` 放入该目录，更新 `biz-design.md` 和本索引。

## 模块清单
> 最后更新：2026-06-03

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
| M8 系统管理·数据看板 | P1 | 📝 设计完成，待编码 |

详见 [工作台/module-plan.md](docs/design/工作台/module-plan.md)

### 工单管理
| 模块 | 优先级 | 状态 |
|------|--------|------|
| M0 模板配置 | P0 | ✅ 已完成 |
| M-N 动态表单渲染 | P0 | 📝 设计完成 |
| M1 工单监控 | P0 | ✅ 已完成（含工单发起弹窗） |
| M2 工单发起（升级） | P0 | ⚠️ 需升级（嵌入 DynamicForm） |
| M3 处置页面 + 移动端 | P0 | 待实现 |
| M4 工单归档 | P1 | 待实现 |
| M5 统计看板 | P1 | 待实现 |
| M6 消息通知 | P2 | 待实现 |

详见 [工单管理/module-plan.md](docs/design/工单管理/module-plan.md)
设计：[00c-动态表单渲染设计](docs/design/工单管理/00c-动态表单渲染设计.md)

### Skill 源仓库

`.claude/skills/` 下的所有 skill 从 `../`（父目录 `skill维护/`）复制而来。修改应先在这里验证，确认有效后再同步回源仓库。
