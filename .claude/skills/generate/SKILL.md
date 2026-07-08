---
name: generate
description: "代码生成引擎。读取设计文档 design.md，生成 Vue 3 + Element Plus 前端代码和 Express + Prisma 后端代码。支持三级深度：light（前端+Mock，快速验证）、standard（+后端+数据库）、full（+权限+种子数据+边界，可演示）。可选传入 Figma 链接获取设计稿参考。替代旧的 md-figma-to-vue3 + gen-api + demo-scaffold + gen-ai-spec 多步流程。"
when_to_use: 用户说"生成代码"、"实现 XX 模块"、"生成前端/后端"、"根据设计文档生成页面"时使用。
---

# 代码生成引擎

读取设计文档（`design.md`），生成完整可运行的前后端代码。

## 核心概念：三级深度（渐进叠加）

| | 🔵 light（默认） | 🟡 standard | 🟢 full |
|---|---|---|---|
| **目标** | 快速验证想法 | 验证逻辑闭环 | 可演示 |
| **前端** | Vue 3 + Element Plus | ← 同 | ← 同 |
| **数据** | Mock（dao-engine + localStorage） | Prisma + SQLite | ← 同 |
| **后端** | 无 | Express 三层 | ← 同 |
| **接口** | 前端直接调 DAO | HTTP → 后端 | ← 同 |
| **权限** | 跳过 | 基础 JWT（登录即可） | 完整 RBAC |
| **种子数据** | 2-3 条 | 5-10 条 | 20+ 条真实感 |
| **异常处理** | 不考虑 | 主流程 try/catch | 全部分支 |
| **边界条件** | 不考虑 | 不考虑 | 全部覆盖 |
| **响应式** | 基础 | 完整 | ← 同 |

**渐进叠加**：standard 在 light 基础上加后端，full 在 standard 基础上加权限+边界。同一份前端代码持续生长，不重写。

## 输入

- **必读**：`docs/{域名}/design.md` — 唯一设计输入
- **可选**：Figma 链接 — 提供设计稿时，提取视觉参考
- **可选**：`--depth=light|standard|full` — 默认 light
- **可选**：`--incremental` — 从当前深度升级到更高深度（保留已有代码）

## 参考文件

本 skill 依赖 `../md-figma-to-vue3/references/` 下的参考文件：

| 文件 | 何时读取 | 内容 |
|------|---------|------|
| [design-tokens.md](../md-figma-to-vue3/references/design-tokens.md) | 每次生成代码前必读 | 82 个标准设计 token + Light/Dark CSS 变量 |
| [component-registry.md](../md-figma-to-vue3/references/component-registry.md) | 阶段 2 开始前必读 | 预置业务组件定义 + 匹配算法 |
| [element-plus-mapping.md](../md-figma-to-vue3/references/element-plus-mapping.md) | 阶段 2 做组件映射时 | Figma → Element Plus 映射规则 |
| [style-override-guide.md](../md-figma-to-vue3/references/style-override-guide.md) | 阶段 2 确定样式策略、阶段 3 生成 scoped CSS 时 | EL 组件 DOM 结构 + CSS 覆盖清单 + Dark 模式 |
| [code-templates.md](../md-figma-to-vue3/references/code-templates.md) | 阶段 3 生成代码时 | Vue 3 代码模板（页面 / 组件 / API / Store / 路由 / 图标 / 主题） |
| [quality-gates.md](../md-figma-to-vue3/references/quality-gates.md) | 生成完成后自检 | 8 条质量门 |

---

## 工作流（三个严格按序执行的阶段）

### 阶段 1：解析输入

#### 1a. 读取设计文档

从 `docs/{域名}/design.md` 提取：
- **§1 业务定位**：产品背景和理解
- **§2 核心场景**：用户故事，理解交互流程
- **§3 页面清单**：要生成哪些页面、各什么类型、路由是什么
- **§4 数据模型**：实体字段、状态枚举 → 生成 types + Prisma Schema + 种子数据
- **§5 业务规则**：状态流转、交互行为、特殊约束 → 生成业务逻辑
- **§6 接口概要**：API endpoint、方法、路径 → 生成后端路由 + 前端 adapter

#### 1b. 提取 Figma 设计稿（如有）

从 Figma 链接解析 `fileKey` 和 `nodeId`（URL 中 `node-id=1-2` → `1:2`），调用：
1. `get_design_context` → 设计上下文、组件层级、属性
2. `get_screenshot` → 视觉参考
3. `get_variable_defs` → 设计 token（颜色、间距、圆角）

**Token 处理原则**：Figma 设计稿优先，标准 token 为兜底默认值。

---

### 阶段 2：分析规划

基于 design.md 和 Figma 信息，输出技术方案，**等待用户确认后再生成代码**。

#### 2.1 页面结构

用 ASCII 树形图展示每个页面的组件层级：

```
PlanList
├── FilterBar (搜索 + 筛选)
├── ToolBar (新建 + 批量操作)
├── DataTable (el-table + 分页)
│   ├── StatusTag (状态标签)
│   └── ActionButtons (编辑 / 删除)
└── FormDialog (新建/编辑弹窗)
```

#### 2.2 组件映射

| 设计元素 | 组件 | 来源 | 说明 |
|---------|------|------|------|
| 搜索筛选区 | FilterBar | 注册表 | 复用 |
| 数据表格 | DataTable | 注册表 | 复用 |
| 状态标签 | StatusTag | 注册表 | 复用 |

#### 2.3 生成范围（按深度）

展示不同深度下的产出物清单：

```
🔵 light 将生成：
  - src/types/{module}.ts
  - src/api/adapters/{module}-dao.ts
  - src/views/{module}/*.vue
  - src/router/ (追加路由)

🟡 standard 追加：
  - server/prisma/schema.prisma (追加 model)
  - server/src/routes/{module}.routes.ts
  - server/src/controllers/{module}.controller.ts
  - server/src/services/{module}.service.ts
  - src/api/adapters/{module}-http.ts
  - src/api/adapters/index.ts (追加)

🟢 full 追加：
  - server/prisma/seed.ts (追加种子数据)
  - 异常处理逻辑
  - 完整权限校验
```

#### 2.4 图标清单（如有 Figma）

列出需要用户提供 SVG 的图标（EL 内置和已有 sprite 图标跳过）。

---

### 阶段 3：代码生成

用户确认后，按深度分步生成。

#### 3.1 生成顺序（所有深度共用）

1. **TypeScript 类型定义** (`src/types/{module}.ts`)
2. **前端数据层** (`src/api/adapters/{module}-dao.ts`)
3. **Pinia Store** (`src/stores/{module}.ts`) — 仅列表管理页需要
4. **页面组件** (`src/views/{module}/*.vue`)
5. **路由注册** (`src/router/index.ts`)

#### 3.2 Light 模式：仅前端

- 使用 `dao-engine.ts` + `db-adapter.ts` → localStorage 持久化
- Mock 数据放在 DAO 文件的 SEED 常量中
- 不生成 `server/` 下任何文件
- 不生成 `{module}-http.ts`（无后端可调）

**代码模板参考**：[code-templates.md §3](../md-figma-to-vue3/references/code-templates.md)

#### 3.3 Standard 模式：叠加后端

在 light 生成的前端代码基础上：

1. **追加 Prisma Schema**：根据 design.md §4 数据模型，在 `server/prisma/schema.prisma` 末尾追加 model
2. **生成 API Adapter HTTP 层**：`src/api/adapters/{module}-http.ts`（路由路径从 §6 提取）
3. **更新 adapter 选择层**：修改 `src/api/adapters/index.ts`，追加新模块的 HTTP/DAO 切换
4. **生成后端三层**：
   - `server/src/services/{module}.service.ts` — 业务逻辑 + Prisma 操作（厚层）
   - `server/src/controllers/{module}.controller.ts` — 参数提取 + 调 Service（薄层）
   - `server/src/routes/{module}.routes.ts` — 路由定义
5. **注册路由**：修改 `server/src/routes/index.ts`，追加 import + use

**后端规范（硬性要求）**：
- 响应格式：`{ code: 0, message: 'ok', data: {...} }`
- 错误格式：`{ code: <状态码>, message: '<消息>', data: null }`
- Controller 不做业务判断，只提取参数和调 Service
- Service 含完整 Prisma 操作，用 `findMany`/`findUnique`/`create`/`update`/`delete`
- ESM：import 路径加 `.js` 后缀
- 删除逻辑必须先列出级联分析让用户确认（参考 backend-dev skill 规范）

#### 3.4 Full 模式：叠加完整度

在 standard 基础上：

1. **种子数据**：为每个实体准备 20+ 条真实感数据（中文、业务场景化、覆盖各种状态）
2. **权限逻辑**：根据 CLAUDE.md 中定义的岗位/角色，在页面组件中添加权限控制（v-if 控制按钮显隐）
3. **异常处理**：所有 API 调用加 try/catch，表单项加完整校验规则
4. **边界处理**：空数据占位图、超长文本截断、极端数值提示

#### 3.5 增量升级（`--incremental`）

当从低深度升级到高深度时：
- **保留已有代码**，不覆盖
- 前端 DAO → HTTP adapter：DAO 文件不动，新增 HTTP adapter + 更新 index.ts 选择层
- 新增后端文件：按 3.3 步骤生成
- 如果已有代码被修改过（与模板不一致），标注差异让用户决定

---

## 代码规范（硬性要求，所有深度遵守）

1. **统一 `<script setup lang="ts">`** — Composition API + TypeScript
2. **Element Plus 仅做行为层** — 样式由 Figma CSS 覆盖，禁止用 `--el-color-*` 配色
3. **显式类型注解** — 所有 props / emits / ref / reactive 有 TypeScript 类型
4. **颜色来自设计令牌** — 用 `var(--bg-main)` 等 CSS 变量，禁止硬编码 hex
5. **间距/圆角来自令牌** — 间距 0/2/4/6/8/12/16/24，圆角 6/8/10/14
6. **Light/Dark 双主题** — 必须包含 `:root` + `html.dark` 变量
7. **响应式布局** — flex/grid 优先，侧栏 < 1280px 收起
8. **路由懒加载** — `() => import(...)` 包裹页面组件
9. **Scoped 样式** — 所有 `<style scoped>`
10. **图标引用规范** — EL 内置用 `<el-icon>`、已有 sprite 用 `<use>`、新建图标引用 SVG 文件，禁止内联 `<svg>`
11. **组件优先复用** — 先查 component-registry，≥70% 匹配即复用
12. **基础 UI 禁止页面内重复定义** — 满足通用性 4 条判定的样式写到 `style.css` 全局类

详细代码模板见 [code-templates.md](../md-figma-to-vue3/references/code-templates.md)。

---

## 生成后自检

生成完所有文件后，读取 [quality-gates.md](../md-figma-to-vue3/references/quality-gates.md) 逐条自检。不通过则修正后重新生成。

同时：
- `npm run build` 检查 TypeScript 编译
- light 模式：`npm run dev` → 前端 `:3200` 确认页面可访问
- standard/full 模式：`npm run dev:fresh` → 启动前后端 → `curl` 测试接口

---

## 下一步指引

生成完成后提示：

```
✅ {深度} 代码已生成。

light 完成 → 可以 npm run dev 预览前端，确认设计再 /generate --depth=standard
standard 完成 → 可以验证接口，确认逻辑再 /generate --depth=full  
full 完成 → /review --mode=full 走查

如需修改设计：/design --update {域名} "变更描述" → /update
```
