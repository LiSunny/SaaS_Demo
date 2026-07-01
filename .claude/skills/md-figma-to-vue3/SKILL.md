---
name: md-figma-to-vue3
description: "将 Markdown 设计文档 + Figma 设计稿转换为可商用的 Vue 3 + Element Plus + TypeScript 前端代码。支持生成独立组件和完整页面。触发条件：用户提供 MD 需求文档和 Figma 设计链接，要求生成 Vue 3 代码；或提及「设计稿还原」「Figma 转代码」「根据设计文档生成页面」等。即使只提供 MD 文档或只提供 Figma 链接，技能也能独立工作。生成代码前会先输出技术方案（组件树、布局、Element Plus 映射、Token 差异）让用户确认。"
---

# MD + Figma → Vue 3 前端代码生成

将设计文档和设计稿转化为生产级 Vue 3 代码。默认生成 `Element Plus` 组件、`TypeScript`、`Pinia`、`Vue Router`。

## 前置条件

- Figma MCP 服务器已连接
- 用户至少提供以下之一：MD 设计文档路径/内容、Figma 文件链接
- 若用户只提供一项，另一项跳过，技能仍能正常工作

## 参考文件

按需加载以下参考文件：

| 文件 | 何时读取 | 内容 |
|------|---------|------|
| [design-tokens.md](references/design-tokens.md) | 每次生成代码前必读 | 82 个标准设计 token + Light/Dark CSS 变量 |
| **`src/style.css`** | **阶段 2 开始前、阶段 4 生成页面时必读** | **项目全局 CSS 类清单（筛选栏/表格/分页/按钮/操作列）。生成列表页、详情页时必须复用这些全局类，禁止在 scoped 中重新定义同名选择器** |
| [component-registry.md](references/component-registry.md) | 阶段 2 开始前必读 | 10 个预置业务组件定义 + 匹配算法（Props/Emits/Slots/视觉特征） |
| [element-plus-mapping.md](references/element-plus-mapping.md) | 阶段 2 做组件映射时 | Figma 组件 → Element Plus 映射规则 |
| [style-override-guide.md](references/style-override-guide.md) | 阶段 2 确定样式策略、阶段 4 生成 scoped CSS 时 | Element Plus 组件 DOM 结构 + CSS 覆盖清单 + Dark 模式选择器 |
| [code-templates.md](references/code-templates.md) | 阶段 4 生成代码时 | Vue 3 代码模板（页面 / 组件 / API / Store / 路由 / 图标 / 主题） |
| [quality-gates.md](references/quality-gates.md) | 生成完成后自检 | 10 条质量门，不通过则修正 |

## 核心工作流（四个阶段，严格按顺序执行）

### 阶段 1：解析输入

#### 1a. 读取 MD 设计文档（如有）

从文档中提取：
- **页面/模块功能描述** — 这个页面是做什么的
- **数据结构定义** — 字段名、类型、是否必填、校验规则
- **业务逻辑流程** — 状态转换、交互时序、条件分支
- **接口定义** — API endpoint、Method、Request/Response 结构
- **组件结构描述** — 页面包含哪些区域（搜索区 / 操作栏 / 表格 / 弹窗 等）

#### 1b. 提取 Figma 设计稿（如有）

从 Figma 链接解析 `fileKey` 和 `nodeId`（URL 中 `node-id=1-2` → `1:2`），然后按顺序调用：

1. `get_design_context` — 获取完整设计上下文、组件层级、属性和参考代码
2. `get_screenshot` — 获取视觉截图（作为后续布局还原的参考）
3. `get_variable_defs` — 提取设计 token（颜色、间距、圆角等变量）
4. `get_metadata` — （仅在需要理解大范围结构时使用）获取节点位置和尺寸概览

#### 1c. Token 差异对比

将 `get_variable_defs` 和 `get_design_context` 提取的设计属性与 [design-tokens.md](references/design-tokens.md) 中的 82 个标准 token 对比。

**对比原则：Figma 设计稿优先，Token 为兜底默认值。**

- 🎨 **Figma 有明确值** → 以 Figma 为准（颜色、字号、间距、圆角等），不强制对齐 token
- ✅ **Figma 与 Token 一致** → 直接应用标准 CSS 变量
- 🆕 **仅 Figma 有** — 目标文件特有的值，直接使用 Figma 精确值
- ⚠️ **仅标准有，Figma 缺失** — 使用标准 token 值兜底

在阶段 3 的 Token 差异报告中，以 Figma 实际值为准，标准 token 仅标注匹配/兜底情况。

### 阶段 2：分析规划

基于解析结果，完成以下分析：

> **0. 注册表查询（新增，最先执行）**
> 
> 读取并参考 `references/component-registry.md`，对当前 UI 模式进行匹配：
> 
> 1. **从 MD 提取页面类型**：按 [code-templates.md §2](references/code-templates.md) 的决策树判定（列表管理页 / 详情展示页 / 表单提交页 / 看板页 / 树形管理页）
> 2. **从 Figma/MD 提取候选 UI 模式**：如"状态标签""搜索筛选区""操作按钮栏""数据表格""统计卡片"
> 3. **对每个候选，查注册表进行 4 维匹配**：
>    - 容器模式（35%）：候选的 EL 组件组合是否匹配注册表组件的容器模式
>    - 语义标签（30%）：Figma 层名 / MD 关键词是否命中注册表组件的匹配标签
>    - 上下文位置（20%）：候选在页面中的位置是否匹配注册表组件视觉特征中的上下文描述
>    - 视觉特征（15%）：候选的尺寸是否落在注册表组件的典型尺寸范围内
> 4. **判定**：综合评分 ≥ 70% → ✅ 复用注册表组件；< 70% → 🆕 新建候选
> 
> 匹配结果在阶段 3 方案确认中呈现给用户。

> **0b. 项目全局 CSS 类提取（新增，必执行）**
>
> **在生成任何列表页、详情页代码前**，必须先读取 `src/style.css`，提取其中已定义的全局 CSS 类清单。
> 这些类已在项目中多处使用，新页面必须复用，**禁止在 scoped CSS 中重新定义同名或功能等价的样式**。
>
> 必须复用的全局类：
>
> | 区域 | 全局类名 | 用途 | 禁止行为 |
> |------|---------|------|---------|
> | 筛选栏 | `.filter-bar`, `.filter-left`, `.filter-right` | 搜索筛选栏布局 | 禁止 scoped 中重定义这些类 |
> | 搜索输入框 | `.search-input-wrap`, `.fi-input`, `.fi-clear`, `.fi-icon` | 搜索输入框+图标+清除按钮 | 同上 |
> | 下拉选择 | `.fi-select-wrap`, `.fi-select` | el-select 包装器 | 同上 |
> | 数据表格 | `.table-wrap`, `.fi-table`, `.fi-thead-tr`, `.fi-th`, `.fi-th-sort`, `.th-sort-icon`, `.fi-tbody-tr`, `.fi-td` | 原生 `<table>` 样式 | **使用原生 `<table class="fi-table">`，禁止用 `el-table` 替代** |
> | 分页容器 | `.pagination-wrap`, `.pagi-total` | 分页器布局+总数文字 | 禁止 scoped 中重定义 |
> | **分页按钮覆盖** | `el-pagination` 的 `:deep()` 块 | 页码/上下页/下拉/跳转的颜色覆盖（暗色模式依赖） | **任何含 `<el-pagination>` 的组件必须复制 [code-templates.md §3.1 分页 CSS 块](references/code-templates.md)**，完整版 7 条或简化版 4 条 |
> | 按钮 | `.btn-primary`, `.btn-danger`, `.btn-default`, `.btn-link` | 全局按钮类 | 禁止 scoped 中重定义 |
> | 操作列 | `.action-cell`, `.act-btn`, `.act-icon`, `.act-preview`, `.act-edit`, `.act-delete`, `.act-copy` | 表格操作列按钮 | 禁止 scoped 中重定义 |
>
> **执行方式**：在生成列表页/详情页的 `<style scoped>` 前，扫描该文件中是否出现了上述全局类名的重新定义。如有，删除 scoped 中的重复定义，改为在模板中使用全局类。

1. **布局结构分析**
   - 从 MD Section 2（页面结构表）提取卡片区域数、Tab 数、长内容标记
   - 从 MD Section 3（数据模型）统计实体字段数
   - **运行布局决策树**（读取 [code-templates.md §2](references/code-templates.md) 对应页面类型）：
     - 输入：信息密度 N = 字段数 + 卡片区域数
     - 输出：全宽单列 / 两列网格 / 全宽+Tabs / 左右分栏 等
     - 在阶段 3 方案确认时输出布局选择理由（如"因 N=8 且有 Tabs，选择全宽+Tabs 布局"）
   - 识别主要区域：Header / Sidebar / Content / Footer
   - 确定 flex/grid 策略
   - **确定自适应策略**（读取 code-templates.md §4.3）：
     - 侧栏：≤1280px 收起为图标模式
     - 表格列：标记核心列/次要列，按断点逐步隐藏，禁止横向滚动条
     - Header：≤1100px 用户名隐藏
     - 分页/筛选栏：≤800px 纵向排列

2. **组件映射**
   - 将每个 Figma 设计元素映射到 Element Plus 组件
   - 读取 [element-plus-mapping.md](references/element-plus-mapping.md) 获取映射规则
   - 识别 Figma 组件实例的 Variant 属性 → 转换为 Element Plus props
   - 无法明确映射的元素标注 `⚠️`，优先用最接近的 Element Plus 组件兜底

3. **组件树设计**
   - 自顶向下设计组件层级：Page → Section → Card/Form/Table → Field/Button/Tag
   - 确定每个组件的 props 和 slots
   - 确定组件间通信方式（props down / events up / provide-inject / Pinia Store）

4. **数据流设计**
   - 确定哪些数据放 Pinia Store（跨组件共享状态）
   - 确定哪些数据放组件本地 state（临时 UI 状态）
   - 确定 API 调用在哪个层级触发

5. **样式策略**（关键原则：Element Plus = 行为骨架，Figma CSS = 视觉皮肤）
   - **角色分工**：Element Plus 组件只提供交互逻辑（el-table 排序、el-pagination 翻页、el-input 输入、el-select 下拉、el-switch 切换），**所有视觉样式由 Figma 精确 CSS 覆盖**
   - 风格禁止使用 `--el-color-*` 等 Element Plus 默认主题变量进行配色
   - 优先用原生 HTML（table、input、button）+ Figma 精确 CSS 代替 Element Plus 组件的默认渲染
   - 仅在 Element Plus 交互逻辑无法用原生 HTML 替代时才使用其组件（如 el-select 的下拉行为），并用 scoped CSS 完全覆盖其样式
   - 读取 [design-tokens.md](references/design-tokens.md) 获取 Light/Dark CSS 变量模板
   - 读取 [style-override-guide.md](references/style-override-guide.md) 获取每个 EL 组件的 DOM 结构、必覆盖 CSS 属性、Dark 模式选择器、Teleport 处理方案
   - **图标策略**：收集 Figma 中所有图标 → 生成语义化占位 SVG 到 `src/assets/icons/` → 生成 ICONS.md 替换指引 → 代码引用占位 SVG。禁止使用过期 Figma URL

### 阶段 3：方案确认

输出以下五项内容，**等待用户确认后再生成代码**：

#### 3.1 页面/组件结构图

用 ASCII 树形图展示组件层级，示例：

```
PageLayout
├── SearchBar (el-form + el-input + el-button)
├── ToolBar (el-button x3)
├── DataTable (el-table + el-pagination)
│   ├── StatusTag (el-tag)
│   └── ActionButtons (el-button link x2)
└── FormDialog (el-dialog + el-form)
```

#### 3.2 Element Plus 组件映射清单

列出每个 Figma 元素对应的 Element Plus 组件及关键 props：

| Figma 元素 | Element Plus 组件 | 关键 Props | 状态 |
|-----------|------------------|-----------|------|
| 搜索框 | `el-input` | `clearable`, `prefix-icon` | ✅ |
| 蓝色填充按钮 | `el-button type="primary"` | `size="small"` | ✅ |
| 自定义卡片 | `el-card` + custom | — | ⚠️ |

#### 3.3 布局方案

说明 flex/grid 结构和响应式策略。

#### 3.4 数据流

说明组件通信方式、Store 结构、API 触发位置。

#### 3.5 Token 差异报告

展示目标文件 token 与标准 token 的对比：

```
✅ 匹配: 24 个  |  🆕 新增: 3 个  |  ⚠️ 缺失: 2 个
新增: brand/secondary (#FF6B00), spacing/32 (32px), shadow/lg (...)
缺失: text/tertiary, semantic/notice-border
```

#### 3.6 组件复用报告

列出本轮的组件复用/新建计划：

| 组件 | 来源 | 状态 | 说明 |
|------|------|------|------|
| StatusTag | 注册表 StatusTag | ✅ 复用 | 匹配标签 "状态" |
| FilterBar | 注册表 FilterBar | ✅ 复用 | 匹配标签 "搜索""筛选" |
| UserForm | — | 🆕 新建 | 表单字段组合在注册表中无匹配 |

> 新建组件将在生成完成后自动追加到 [component-registry.md](references/component-registry.md)。

**等待用户回复。** 用户可能说「确认」「开始生成」或提出修改意见。

### 阶段 4：代码生成

用户确认后，按优先级生成代码。读取 [code-templates.md](references/code-templates.md) 获取模板。

#### 生成顺序

1. **TypeScript 类型定义** (`types/`) — 数据结构、API 请求/响应、表单类型
2. **API 层** (`api/`) — 接口请求函数
3. **Pinia Store** (`stores/`) — 如有跨组件共享状态
4. **全局 CSS** (`style.css`) — 两部分：
   - **基础 UI 全局类**：对所有候选 UI 元素跑判定规则（见代码规范 #14），满足条件 → 检查 style.css 是否已有对应全局类；无则追加 `.btn-primary` `.btn-danger` `.btn-default` `.btn-link` 等。按钮令牌见 [design-tokens.md §三-B](references/design-tokens.md)，代码模板见 [code-templates.md §4.5](references/code-templates.md)
   - **Teleport Dark 覆盖**：按 style-override-guide.md §四的模板，添加 el-select-dropdown、el-dialog、el-picker-panel 等组件的 Dark 模式全局覆盖
5. **基础组件** (`components/base/`) — Element Plus 二次封装（如需要）+ ThemeToggle
6. **业务组件** (`components/business/`) — **优先从注册表复用**。先在 [component-registry.md](references/component-registry.md) 中查找匹配组件，无匹配才新建。新建组件完成后必须：
   - 在注册表索引表末尾添加新行
   - 在注册表文件末尾追加完整组件定义（Props / Emits / Slots / CSS 变量依赖 / 视觉特征 / 文件位置）
   - 定义格式遵从注册表已有条目格式
   - 读取 [code-templates.md §3.5](references/code-templates.md) 获取代码模板
7. **页面视图** (`views/`) — 组合子组件，禁止复制粘贴代码。跨页面风格一致性由统一组件库保证
8. **路由配置** (`router/`) — 追加路由定义

#### 代码规范（硬性要求）

1. **统一 `<script setup lang="ts">`** — 所有 .vue 文件使用 Composition API + TypeScript
2. **Element Plus 仅做行为层** — 使用 `el-select`、`el-switch`、`el-pagination` 等只为其交互逻辑，可用原生 HTML 替代时优先用原生。禁止使用 `--el-color-*` 变量进行配色
3. **显式类型注解** — 所有 props / emits / ref / reactive 必须有 TypeScript 类型
4. **所有颜色来自设计令牌** — 使用 `var(--bg-main)`、`var(--text-primary)` 等设计令牌 CSS 变量，禁止硬编码 hex 色值
5. **字号优先取 Figma 设计稿值** — 标准令牌值 24/20/18/16/14/12 px 为默认值。Figma 设计稿中的实际字号优先使用，Token 仅在设计稿缺失时兜底。颜色、间距、圆角同此原则
6. **间距/圆角来自令牌** — 间距取 0/2/4/6/8/12/16/24，圆角取 6/8/10/14
7. **Light/Dark 双主题** — 必须生成两份 CSS 变量（`:root` + `html.dark`），并包含主题切换 Store + 组件
8. **响应式布局** — flex/grid 优先，侧栏 < 1280px 自动收起
9. **路由懒加载** — `() => import(...)` 包裹页面组件
10. **Scoped 样式** — 所有 `<style scoped>`，避免样式泄漏
11. **图标占位策略** — 生成语义化占位 SVG（非过期 Figma URL），并生成 `ICONS.md` 替换指引
12. **不写无关注释** — 不写"what"，只在非显而易见处写"why"
13. **组件优先复用** — 先查 [component-registry.md](references/component-registry.md) 是否有匹配组件，≥70% 匹配即复用；无匹配才新建。新建后必须注册。相同 UI 块出现 ≥2 次必须抽取为独立组件
14. **表单/属性面板多级标题层级** — 表单或属性配置面板中常出现三层标题结构，必须保证层级辨识度：面板标题 > 分区标题 > 字段标签。分区标题与字段标签字号相近时（如均为 16px），分区标题需额外增加视觉重量以拉开差距。**做法**：分区标题加左侧色条（`border-left: 3px solid var(--accent-primary)`）+ 加粗（`font-weight: 500`）+ 颜色使用 `--text-primary`（字段标签可用 `--text-secondary` 退后）；分区标题与字段标签的字号差距保持 ≥2px 为佳。禁止分区标题颜色比字段标签更浅的反模式
15. **基础 UI 禁止页面内重复定义** — 所有 UI 元素生成前先跑判定。满足以下 **4 条全部** 即为"基础 UI"，样式必须写到 `style.css` 全局类，禁止在页面 scoped CSS 中重复定义：
    - ① **无业务专有名词**：选择器和 CSS 值不含业务字段名/状态值/业务术语
    - ② **跨页面类型通用**：至少在 2 种页面类型中出现
    - ③ **可纯由令牌推导**：所有 CSS 值映射到 [design-tokens.md](references/design-tokens.md) token
    - ④ **不依赖业务数据**：不绑定特定 API 字段、不随业务状态变化
    - 当前注册的基础 UI 清单见 [component-registry.md](references/component-registry.md)「基础 UI」section。满足规则但清单未列的元素，追加到注册表同时写入 style.css
16. **生成页面 View 前必须先读同类型的已有页面** — 在写 `src/views/` 中任何新页面前，必须：
    - 找到项目中 **同页面类型、已实现的页面文件**（如生成列表页→先读 `PlanList.vue` / `TemplateList.vue`）
    - 提取该页面使用的 **模板结构模式**（如 `<table class="fi-table">` vs `el-table`）、**全局 CSS 类使用方式**、**分页写法**、**筛选栏结构**
    - 新页面严格对齐已有页面的写法，包括：表格标签选择（原生 table / el-table）、分页容器类名、筛选栏结构、按钮类名
    - 这是"对照正确答案"的检查点，优先级高于 code-templates.md 中的通用模板。**code-templates.md 是通用参考，而已有页面是项目实际的正确写法——两者冲突时以项目已有页面为准**
17. **颜色必须从 AI 规格的颜色类型 → 映射到具体 CSS 变量，禁止自创 token**：
    - AI 规格文档 §3.2 状态枚举的「颜色类型」列定义了每个状态对应的语义颜色：`success` / `warning` / `danger` / `info` / `normal`
    - 这些颜色类型**直接对应** `style.css` 中的语义色 CSS 变量：
      | 颜色类型 | 背景变量 | 文字/图标变量 |
      |---------|---------|-------------|
      | `success` | `var(--success-bg)` | `var(--success)` |
      | `warning` | `var(--warning-bg)` | `var(--warning)` |
      | `danger` | `var(--danger-bg)` | `var(--danger)` |
      | `info` | `var(--info-bg)` | `var(--info)` |
      | `normal` | `var(--normal-bg)` | `var(--normal)` |
    - **禁止**为已有颜色类型覆盖的状态自创新的 CSS 变量（如 `--sla-normal`、`--custom-red` 等无设计稿来源的变量）
    - **禁止**跳过颜色类型直接用 hex 硬编码
    - 只有当某个状态的视觉色**确实与语义色不同且有 Figma 设计稿证明**时，才可在 style.css 新增专用变量
18. **列表页必须使用 `list-page > content-card` 双层容器嵌套**，禁止在 `content-card` 外部放置任何页面内容：
    ```
    外层页容器 (height:100%)                       ← 只做高度占位，不写背景/圆角/padding
    └── content-card (白色背景+圆角+padding)        ← 所有子内容的唯一父容器
        ├── 统计卡片 / 帮助说明 / 其他顶部内容
        ├── filter-bar (筛选栏)
        ├── table-wrap > table.fi-table (数据表格)
        └── pagination-wrap (分页)
    ```
    - `content-card` 必须包含：`background: var(--bg-card)` + `border-radius: var(--radius-md, 8px)` + `padding: var(--spacing-xl, 16px)` + `display: flex; flex-direction: column; height: 100%; gap: var(--spacing-xl, 16px); overflow: auto`
    - **禁止**将统计卡片、图表、Tab 等任何内容放在 `content-card` 外面——它们必须在白色底板上
    - **禁止**在 scoped CSS 中重定义 `.content-card` 的 background / border-radius / padding，这些属性已由标准范式固定
19. **筛选栏最多两行、禁止页面横向滚动**：
    - **筛选条件数量由上游控制**：PRD（gen-prd）阶段限制 ≤5 个直接展示，AI 规格（gen-ai-spec）阶段自动将超出的分组为折叠筛选。若收到的 AI 规格中查询参数 >5 且未分组，提示用户先修正规格
    - 全局 `filter-left` 始终 `display: flex; align-items: stretch; gap: var(--spacing-lg, 12px); flex-wrap: wrap; row-gap: var(--spacing-sm, 6px)`——同排组件自动等高，横向间距统一 12px，超宽自动换行
    - 筛选组件高度禁止写死：通过 `align-items: stretch` + 级联 `flex: 1` / `height: 100%` 自动撑满到同行最高组件。`el-date-editor` 因 Element Plus 内部有高度约束，必须 `height: 100% !important`
	    - 全局已防御：`.filter-left > * { min-width: 0; }`（解除 flex 默认 min-content 限制）
    - **设定控件宽度时必须验证 Element Plus 组件的最小内容宽度**：`el-date-picker[type="daterange"]` 最小宽度约 260px，`el-select` 最小宽度约 100px
    - 筛选栏高度不超过两行。整个页面（筛选栏 + 表格）禁止产生横向滚动条
    - 这是"对照正确答案"的检查点，优先级高于 code-templates.md 中的通用模板。**code-templates.md 是通用参考，而已有页面是项目实际的正确写法——两者冲突时以项目已有页面为准**

#### 输出格式

对每个生成的文件，使用代码块展示，并标注文件路径：

```
### src/types/user.ts
```typescript
// ...
```

### src/views/UserList.vue
```vue
// ...
```
```

全部生成完成后，提示用户下一步操作（如安装依赖、启动开发服务器）。

#### 代码生成后自检

生成完所有文件后，必须读取 [quality-gates.md](references/quality-gates.md) 逐条自检。不通过则修正后重新生成对应文件。
