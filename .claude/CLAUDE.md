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
| `src/components/business/` | 业务组件 |
| `src/components/base/` | 基础组件 |
| `src/stores/` | Pinia Store |
| `src/api/` | Mock API 层 |
| `src/types/` | TypeScript 类型定义 |
| `src/router/` | 路由配置 |
| `src/style.css` | 全局样式（Design Tokens + Light/Dark 变量） |

## 已生成的代码

| 模块 | 页面/组件 | 状态 |
|------|----------|------|
| 维保计划 | `views/maintenance/PlanList.vue` | ✅ 已生成 |
| 维保计划 | `views/maintenance/PlanDetail.vue` | ✅ 已生成 |
| 流程编排 | `views/workflow/TemplateList.vue` | ✅ 已生成 |
| 流程编排 | `views/workflow/TemplateConfig.vue` | ✅ 已生成 |
| 通用 | `components/business/StatusTag.vue` | ✅ 已生成 |
| 通用 | `components/business/FlowDesigner.vue` | ✅ 已生成 |
| 通用 | `components/business/FormDesigner.vue` | ✅ 已生成 |
| 通用 | `components/business/NodePropertyPanel.vue` | ✅ 已生成 |
| 通用 | `components/business/PersonSelector.vue` | ✅ 已生成 |
| 通用 | `components/base/ThemeToggle.vue` | ✅ 已生成 |
| 通用 | `components/base/AppIcon.vue` | ✅ 已生成 |
| 通用 | `layouts/DefaultLayout.vue` | ✅ 已生成 |

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
> 最后更新：2026-06-02

| 层级 | 文档 | 说明 |
|------|------|------|
| 平台总览 | [biz-design.md](docs/design/biz-design.md) | 8 个业务域 + 用户角色 |
| 工单管理 | [工单管理/biz-design.md](docs/design/工单管理/biz-design.md) | 流程编排 + 工单全生命周期 |
| 维保管理 | [维保管理/biz-design.md](docs/design/维保管理/biz-design.md) | 维保计划→任务→报告全链路 |

> 新增业务域：创建 `docs/design/{业务域}/` 目录，`/biz-design` 产出 `biz-design.md` 放入该目录，更新 `biz-design.md` 和本索引。

## 模块清单
> 最后更新：2026-06-02

### 工单管理
| 模块 | 优先级 | 状态 |
|------|--------|------|
| M0 模板配置 | P0 | ✅ 已完成 |
| M1 工单监控 | P0 | ✅ 已完成 |
| M2 工单发起 | P0 | 待实现 |
| M3 移动端处置 | P0 | 待实现 |
| M4 工单归档 | P1 | 待实现 |
| M5 统计看板 | P1 | 待实现 |
| M6 消息通知 | P2 | 待实现 |

详见 [工单管理/module-plan.md](docs/design/工单管理/module-plan.md)

### Skill 源仓库

`.claude/skills/` 下的所有 skill 从 `../`（父目录 `skill维护/`）复制而来。修改应先在这里验证，确认有效后再同步回源仓库。
