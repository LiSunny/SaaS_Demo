# Business Component Registry

> 业务组件注册表。所有跨页面复用的业务组件必须在此注册。
> **生成代码前先查本表**，有匹配组件直接复用；无匹配才新建，新建后追加到本表末尾。

---

## 基础 UI（全局 CSS 类 / base 组件）

> 以下元素满足 4 条判定规则，样式在 `style.css` 中统一定义，**禁止在页面 scoped CSS 中重复定义**。

### 判定规则（4 条全部满足才归为基础 UI）

| # | 规则 | AI 检查方式 | 反例 |
|---|------|-----------|------|
| 1 | **无业务专有名词** | 选择器和 CSS 值不含业务字段名/状态值/业务术语 | `.plan-status-badge` 含"plan" → 业务 |
| 2 | **跨页面类型通用** | 至少在 2 种页面类型中出现（列表/详情/表单/看板/树形） | 只在列表页出现的折叠动画 → 非基础 |
| 3 | **可纯由令牌推导** | 所有值映射到 design-tokens.md，不需要 Figma 提取 | 圆角是 Figma 特有值 7px → 非基础 |
| 4 | **不依赖业务数据** | 不绑定特定 API 字段、不随业务状态变化 | el-switch 绑定 `row.enabled` → 非基础 |

### 基础 UI 清单

| 元素 | 形式 | 变体 | 写入位置 |
|------|------|------|---------|
| 按钮 | `style.css` 全局 CSS 类 `.btn-*` | primary, danger, default, link | style.css（首次生成时追加） |

### 使用方式

页面中直接使用全局类，不定义页面级样式：
```html
<button class="btn-primary" @click="...">确定</button>
<button class="btn-danger" @click="...">删除</button>
<button class="btn-default" @click="...">取消</button>
<button class="btn-link" @click="...">返回</button>
```

---

## 业务组件

## 注册表索引

| 组件名 | 匹配标签 | 容器模式 | 适用页面 |
|--------|---------|---------|---------|
| StatusTag | 状态,标签,status,tag | `el-tag` | 列表,详情,表单 |
| FilterBar | 筛选,搜索,查询,filter,search | `el-form` + `el-input` + `el-select` + `el-button` | 列表 |
| ToolBar | 操作栏,按钮组,toolbar,actions | `el-button` group, flex row | 列表,详情 |
| DataTable | 表格,列表,数据,table,list | `el-table` + `el-pagination` | 列表 |
| FormDialog | 弹窗,表单,新增,编辑,dialog | `el-dialog` + `el-form` | 列表,详情 |
| FormDrawer | 抽屉,表单,配置,drawer | `el-drawer` + `el-form` | 列表,详情 |
| MetricCard | 统计,指标,数值,metric,stat | `el-card` shadow="hover" | 看板,概览,详情 |
| SummaryCard | 总分,汇总,多指标,summary | `el-card` + 内部 grid | 看板,概览 |
| ChartCard | 图表,趋势,chart | `el-card` + chart slot | 看板,概览 |
| InfoCard | 详情,信息,描述,info,detail | `el-descriptions` / `el-card` | 详情 |
| DetailHeader | 摘要,头部,标题栏,detail-header | `el-card` + MetricCard + StatusTag + 关键字段行 | 详情 |
| ProcessTimeline | 流程,时间线,进度,处理记录,timeline | 垂直卡片列表 + 时间戳 | 详情,流程页 |

---

## 组件定义

---

### StatusTag

> 状态标签组件。根据业务状态枚举值自动显示对应颜色的 Tag。
> 参考：Element Plus `el-tag`

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| status | `number \| string` | 是 | — | 业务状态值 |
| label | `string` | 否 | 从 map 推导 | 标签文字，默认从 map 查 |
| size | `'small' \| 'default'` | 否 | `'small'` | 尺寸 |

**Emits** 无

**Slots**

| 名称 | 说明 |
|------|------|
| icon | 标签文字前的 icon |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-small)` | 字号 14px |
| `var(--border-radius-sm)` | 圆角 6px |
| `var(--semantic-success)` / `--semantic-success-bg` | 成功态 |
| `var(--semantic-danger)` / `--semantic-danger-bg` | 错误态 |
| `var(--semantic-warning)` / `--semantic-warning-bg` | 警告态 |
| `var(--semantic-info)` / `--semantic-info-bg` | 信息态 |
| `var(--semantic-normal)` / `--semantic-normal-bg` | 中性态 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：小型圆角矩形标签，内含短文字（2-4字），填充或线框样式
- 典型尺寸：高 22-28px，宽 40-80px
- 上下文：表格单元格内、详情页字段旁、卡片标题旁
- 标签关键词：status, tag, 状态, 标签, 启用/禁用, 正常/异常
- 颜色变体：通常 3-6 种（绿/红/黄/蓝/灰）

**文件位置**：`components/business/StatusTag.vue`

---

### FilterBar

> 搜索筛选栏组件。顶部横向排列的筛选表单 + 查询/重置按钮。
> 参考：Element Plus `el-form` inline + `el-input` + `el-select` + `el-button`

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| model-value | `Record<string, any>` | 是 | — | 筛选条件双向绑定 |
| loading | `boolean` | 否 | `false` | 查询按钮加载态 |

**Emits**

| 事件 | 参数 | 说明 |
|------|------|------|
| update:model-value | `Record<string, any>` | 筛选值变更 |
| search | — | 点击查询 |
| reset | — | 点击重置 |

**Slots**

| 名称 | 说明 |
|------|------|
| filters | 筛选项（el-form-item 列表） |
| extra | 查询按钮后的额外操作 |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--spacing-16)` | 筛选项间距 |
| `var(--spacing-8)` | 按钮间距 |
| `var(--font-body)` | 输入框字号 |
| `var(--bg-card)` | 筛选栏背景 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：页面顶部的横向区域，包含若干输入框 + 选择器 + 查询按钮。元素水平排列，有统一间距
- 典型尺寸：高 40-56px，占满内容宽度
- 上下文：列表页最顶部，表格上方
- 容器模式：flex row / inline el-form，内嵌 `el-input` + `el-select` + `el-date-picker` + `el-button`
- 标签关键词：筛选, 搜索, 查询, filter, search, 关键字, keyword, 状态, 日期范围

**文件位置**：`components/business/FilterBar.vue`

---

### ToolBar

> 操作按钮栏。横向排列主要操作按钮，支持批量操作联动。
> 参考：Element Plus `el-button` group

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| selected-count | `number` | 否 | `0` | 已选条数，>0 时批量按钮启用 |

**Emits** 无（通过 slot 内按钮自行处理）

**Slots**

| 名称 | 说明 |
|------|------|
| left | 左侧按钮组（一般为新增） |
| right | 右侧按钮组（批量删除、导出等） |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--spacing-8)` | 按钮间距 |
| `var(--spacing-16)` | 与上下区域间距 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：一行水平排列的按钮，通常"新增"为首（primary），"批量删除"在右侧（danger），中间可能有其他操作
- 典型尺寸：高 32-40px
- 上下文：列表页，筛选栏下方、表格上方
- 容器模式：flex row, justify-content: space-between
- 标签关键词：操作栏, 工具栏, toolbar, actions, 新增, 批量, 导出

**文件位置**：`components/business/ToolBar.vue`

---

### DataTable

> 数据表格 + 分页器封装。统一表格样式和分页行为。
> 参考：Element Plus `el-table` + `el-pagination`

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| data | `any[]` | 是 | — | 表格数据 |
| loading | `boolean` | 否 | `false` | 加载态 |
| total | `number` | 是 | — | 总条数 |
| page | `number` | 是 | — | 当前页 (v-model) |
| page-size | `number` | 是 | — | 每页条数 (v-model) |
| border | `boolean` | 否 | `true` | 是否带边框 |
| stripe | `boolean` | 否 | `true` | 是否斑马纹 |
| empty-text | `string` | 否 | `'暂无数据'` | 空数据文字 |

**Emits**

| 事件 | 参数 | 说明 |
|------|------|------|
| update:page | `number` | 页码变更 |
| update:page-size | `number` | 每页条数变更 |
| selection-change | `any[]` | 选中行变更 |

**Slots**

| 名称 | 说明 |
|------|------|
| default | 表格列定义（el-table-column） |
| empty | 自定义空数据展示 |
| append | 表格后插入内容（如汇总行） |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-h4)` | 表头字号 |
| `var(--font-body)` | 表体字号 |
| `var(--bg-sub-card)` | 表头背景 |
| `var(--bg-card)` | 表体背景 |
| `var(--border-default)` | 表格边框 |
| `var(--text-primary)` | 表体文字 |
| `var(--font-small)` | 分页字号 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：数据行和列的网格，有表头行、数据行、底部分页器
- 典型尺寸：表头行高 ~45px，数据行高 ~45px，分页器高 ~40px
- 上下文：列表页中部，筛选区和操作栏下方
- 容器模式：`el-table` + 底部 `el-pagination`
- 标签关键词：表格, 列表, table, list, 数据, 记录

**文件位置**：`components/business/DataTable.vue`

---

### FormDialog

> 表单弹窗。≤6 个字段的简单表单，用于新增/编辑。
> 参考：Element Plus `el-dialog` + `el-form`

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| model-value | `boolean` | 是 | — | 弹窗显隐 (v-model) |
| title | `string` | 是 | — | 弹窗标题（如"新增用户"） |
| width | `string` | 否 | `'520px'` | 弹窗宽度 |
| submitting | `boolean` | 否 | `false` | 提交按钮 loading 态 |
| confirm-text | `string` | 否 | `'确定'` | 确认按钮文字 |
| cancel-text | `string` | 否 | `'取消'` | 取消按钮文字 |

**Emits**

| 事件 | 参数 | 说明 |
|------|------|------|
| update:model-value | `boolean` | 弹窗显隐 |
| confirm | — | 点击确定 |
| cancel | — | 点击取消/关闭 |

**Slots**

| 名称 | 说明 |
|------|------|
| default | 表单内容（el-form-item 列表） |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--border-radius-xl)` | 弹窗圆角 14px |
| `var(--bg-card)` | 弹窗背景 |
| `var(--text-primary)` | 标题文字色 |
| `var(--font-h3)` | 标题字号 18px |
| `var(--spacing-24)` | 弹窗内边距 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：居中弹窗，顶部标题 + 关闭按钮，中部表单区域，底部确定/取消按钮
- 典型尺寸：宽 480-640px，高自适应
- 上下文：列表页操作栏触发、详情页编辑按钮触发
- 容器模式：`el-dialog` > header(title) + body(`el-form`) + footer(buttons)
- 标签关键词：弹窗, 对话框, dialog, modal, 新增, 编辑, 添加, 修改

**文件位置**：`components/business/FormDialog.vue`

---

### FormDrawer

> 表单抽屉。>6 个字段或分区块的复杂表单，从侧边滑出。
> 参考：Element Plus `el-drawer` + `el-form`

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| model-value | `boolean` | 是 | — | 抽屉显隐 (v-model) |
| title | `string` | 是 | — | 抽屉标题 |
| size | `string` | 否 | `'640px'` | 抽屉宽度 |
| submitting | `boolean` | 否 | `false` | 提交按钮 loading 态 |
| confirm-text | `string` | 否 | `'保存'` | 确认按钮文字 |

**Emits**

| 事件 | 参数 | 说明 |
|------|------|------|
| update:model-value | `boolean` | 抽屉显隐 |
| confirm | — | 点击保存 |
| close | — | 关闭（可用于未保存提示） |

**Slots**

| 名称 | 说明 |
|------|------|
| default | 表单内容（分区块的 el-card + el-form-item） |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--bg-card)` | 抽屉背景 |
| `var(--text-primary)` | 标题文字色 |
| `var(--font-h3)` | 标题字号 |
| `var(--spacing-16)` | 内容区内边距 |
| `var(--border-default)` | 表单项分隔 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：从右侧滑出的面板，顶部标题 + 关闭，中部滚动表单（通常分区块），底部固定操作栏
- 典型尺寸：宽 520-800px，高 100vh
- 上下文：列表页操作栏触发、复杂配置编辑
- 容器模式：`el-drawer` > header(title) + body(cards/sections) + footer(buttons)
- 标签关键词：抽屉, 侧边栏, drawer, 配置, 高级设置, 详情编辑

**文件位置**：`components/business/FormDrawer.vue`

---

### MetricCard

> 单指标统计卡片。展示一个数值指标，可选图标和趋势。
> 适用：看板页的指标行，通常一行 3-5 个。

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| label | `string` | 是 | — | 指标名称（如"今日巡检"） |
| value | `string \| number` | 是 | — | 指标数值 |
| unit | `string` | 否 | `''` | 数值单位 |
| trend | `'up' \| 'down' \| 'flat'` | 否 | — | 趋势方向，不传则不显示 |
| trend-value | `string` | 否 | `''` | 趋势数值（如"12%"） |
| icon | `string` | 否 | — | 图标名（src/assets/icons/ 下的文件名） |
| background | `string` | 否 | `'var(--bg-card)'` | 卡片背景色 |

**Emits** 无

**Slots**

| 名称 | 说明 |
|------|------|
| icon | 自定义图标区域 |
| footer | 底部额外信息 |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-small)` | 指标名称字号 14px |
| `var(--font-h1)` | 数值字号 24px |
| `var(--text-secondary)` | 指标名称颜色 |
| `var(--text-primary)` | 数值颜色 |
| `var(--semantic-success)` | 上升趋势色 |
| `var(--semantic-danger)` | 下降趋势色 |
| `var(--border-radius-lg)` | 卡片圆角 10px |
| `var(--bg-card)` | 卡片背景 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：小矩形卡片，包含图标/名称/数字/趋势，内部垂直排列
- 典型尺寸：高 100-130px，宽 180-280px
- 上下文：看板页顶部统计行
- 容器模式：`el-card shadow="hover"`，内部 flex column
- 标签关键词：统计, 指标, 数值, metric, stat, 今日, 累计, 总计（单个值的语境）

**文件位置**：`components/business/MetricCard.vue`

---

### SummaryCard

> 多指标总分卡片。展示一个总数值及其子项明细，子项网格排列。
> 适用：看板页的核心汇总区，通常一行 1-2 个。

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| title | `string` | 是 | — | 汇总标题（如"总任务数"） |
| total | `string \| number` | 是 | — | 总数值 |
| total-label | `string` | 否 | `'总计'` | 总数标签 |
| items | `{label: string; value: string \| number; trend?: 'up' \| 'down'}[]` | 是 | — | 子项列表 |
| items-per-row | `number` | 否 | `3` | 子项每行个数（默认3） |

**Emits**

| 事件 | 参数 | 说明 |
|------|------|------|
| item-click | `{label: string; value: string}` | 点击子项（跳转详情等） |

**Slots**

| 名称 | 说明 |
|------|------|
| header-extra | 标题旁的操作（如日期选择器） |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-h3)` | 标题字号 18px |
| `var(--font-h1)` | 总数值字号 24px |
| `var(--font-small)` | 子项标签字号 14px |
| `var(--font-body)` | 子项数值字号 16px |
| `var(--text-primary)` | 总数/子项数值颜色 |
| `var(--text-secondary)` | 标题/标签颜色 |
| `var(--spacing-16)` | 子项间距 |
| `var(--border-default)` | 子项分隔线 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：较大的矩形卡片，顶部标题 + 大号总数 + 下方子项网格
- 典型尺寸：宽 400-600px（约占页面 50%），高 160-240px
- 上下文：看板页上部，统计行下方
- 容器模式：`el-card`，内部垂直布局：header > total > items grid
- 标签关键词：汇总, 总分, 总览, summary, total, 全部, 累计（总数+明细的语境）

**文件位置**：`components/business/SummaryCard.vue`

---

### ChartCard

> 图表容器卡片。提供统一标题栏和图表插槽，高度可配。
> 适用：看板页的图表区，通常一行 1-2 个。

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| title | `string` | 是 | — | 图表标题 |
| height | `string` | 否 | `'360px'` | 卡片内容区高度（不含标题） |
| loading | `boolean` | 否 | `false` | 加载态 |

**Emits** 无

**Slots**

| 名称 | 说明 |
|------|------|
| chart | **必须**。图表渲染区域（ECharts / 其他图表库实例挂载点） |
| header-extra | 标题旁操作（如时间范围切换、数据粒度选择） |
| footer | 图表下方补充说明 |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-h3)` | 标题字号 18px |
| `var(--text-primary)` | 标题颜色 |
| `var(--bg-card)` | 卡片背景 |
| `var(--border-radius-lg)` | 卡片圆角 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：矩形卡片，顶部标题栏 + 图表区域（折线/柱状/饼图等），通常有图表交互元素
- 典型尺寸：高 320-420px，宽 400-700px
- 上下文：看板页中部，统计区下方
- 容器模式：`el-card` > header(title + controls) + body(chart slot)
- 标签关键词：图表, 趋势, 统计图, chart, 折线图, 柱状图, 饼图, 环比, 同比

**文件位置**：`components/business/ChartCard.vue`

---

### InfoCard

> 详情信息卡片。以 label-value 对展示结构化信息，通常用于详情页或侧边栏。
> 参考：Element Plus `el-descriptions` + `el-card`

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| title | `string` | 否 | — | 卡片标题 |
| items | `{label: string; value: string \| number; span?: number}[]` | 是 | — | 信息项列表 |
| columns | `number` | 否 | `2` | 每行列数（1/2/3/4） |
| border | `boolean` | 否 | `false` | 是否显示表格边框 |

**Emits** 无

**Slots**

| 名称 | 说明 |
|------|------|
| header-extra | 标题旁操作 |
| item-{index} | 自定义第 index 项的 value 渲染（如渲染 StatusTag 而非文字） |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-body)` | 内容字号 16px |
| `var(--font-small)` | 标签字号 14px |
| `var(--text-primary)` | 值的颜色 |
| `var(--text-secondary)` | 标签的颜色 |
| `var(--border-low)` | 分隔线 |
| `var(--bg-sub-card)` | 标签列背景（border 模式下） |
| `var(--spacing-16)` | 单元格 padding |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：结构化信息展示，左边灰色标签 + 右边黑色值，或表格模式；通常有分组标题
- 典型尺寸：宽自适应，高按条目数
- 上下文：详情页主信息区、侧边栏、弹窗内信息确认
- 容器模式：`el-card` > `el-descriptions` 或自定义 grid
- 标签关键词：详情, 信息, 描述, detail, info, 基本信息, 扩展信息, 配置信息

**文件位置**：`components/business/InfoCard.vue`

---

## 匹配算法

生成代码时，按以下 4 维对候选 UI 模式与注册表组件评分：

| 维度 | 权重 | 数据来源 | 匹配方式 |
|------|------|---------|---------|
| 容器模式 | 35% | Figma 元素类型 + `element-plus-mapping.md` 映射结果 | 候选的 EL 组件组合与注册表「容器模式」字段的 Jaccard 相似度 |
| 语义标签 | 30% | MD 文档关键词 + Figma 层名称 | 候选的文本特征与注册表「匹配标签」字段的交集率 |
| 上下文位置 | 20% | Figma `get_metadata` 节点树位置 + 页面类型 | 候选在页面中的位置是否匹配注册表「视觉特征」中的「上下文」 |
| 视觉特征 | 15% | Figma `get_design_context` 尺寸信息 | 候选的宽高范围是否落在注册表「典型尺寸」范围内 |

**判定**：综合评分 ≥ 70% → ✅ 复用；< 70% → 🆕 新建。

---

### DetailHeader

> 详情页顶部摘要横幅。可包含指标卡、标题、StatusTag、关键字段行、编辑链接、QR 码。
> 这是一个**组合模板**而非独立 .vue 文件，直接在详情页模板中生成。
> 参考：Figma 参考页（保养计划详情 / 设备台账详情 / 表单管理详情）

**包含元素（按需组合）**

| 子区域 | 容器 | 说明 |
|--------|------|------|
| 指标卡行 | `MetricCard` × N | 同行排列，N 从 Figma/MD 提取 |
| 分隔线 | 竖线 `border-right` 或 `rotate-90` 的 `<hr>` | 指标卡与标题区之间的视觉分隔 |
| 标题区 | `StatusTag` + 标题文字 + 编辑链接 | 标题用 Bold 20px，编辑链接用 accent-primary |
| 关键字段行 | flex row, gap 18px | 设备总数 / 保养项目 / 周期频次 / 下次生成时间 等摘要字段 |
| QR 码 | 130×130 图片占位 | 可选，表单/设备详情页常用 |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：页面顶部的横向卡片，包含 icon+数值指标 + 竖线分隔 + 标题+StatusTag+编辑链接 + 关键字段行
- 典型尺寸：高 96-150px，全宽
- 上下文：详情页最顶部，面包屑下方
- 容器模式：`el-card` 或 `<div>` + 内嵌 MetricCard + StatusTag + 字段行
- 标签关键词：详情, 摘要, 头部, 标题栏, detail-header, 指标

**文件位置**：无独立文件，直接在详情页 `views/` 中生成。

---

### ProcessTimeline

> 流程时间线组件。垂直排列的处理步骤卡片，每步含标题、时间戳、人员、描述、图片。
> 参考：Figma 参考页（巡查检查/异常点位/异常详情）

**Props**

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| steps | `TimelineStep[]` | 是 | — | 步骤列表（按时间倒序） |
| loading | `boolean` | 否 | `false` | 加载态 |

```typescript
interface TimelineStep {
  title: string                    // 步骤标题，如"结果确认""异常处理"
  timestamp: string                // 时间戳
  status?: 'completed' | 'active' | 'pending' // 步骤状态
  fields: { label: string; value: string }[]  // 键值对列表
  images?: string[]                // 现场图片 URL 列表
}
```

**Emits** 无

**Slots**

| 名称 | 说明 |
|------|------|
| footer | 时间线底部的操作按钮区 |

**CSS 变量依赖**

| 变量 | 用途 |
|------|------|
| `var(--font-h4)` | 步骤标题字号 16px |
| `var(--font-small)` | 时间戳字号 14px |
| `var(--text-primary)` | 标题/值颜色 |
| `var(--text-secondary)` | 标签颜色 |
| `var(--bg-card)` | 步骤卡片背景 |
| `var(--bg-sub-card)` | 步骤详情区背景 |
| `var(--border-default)` | 卡片边框 |
| `var(--radius-lg)` | 卡片圆角 10px |
| `var(--radius-md)` | 内部区块圆角 8px |

**视觉特征（用于 Figma/MD 匹配）**

- 特征：垂直排列的卡片列表，每张卡片内有标题栏(标题+时间戳)+详情区(灰色bg的键值对+可选图片)
- 典型尺寸：每张卡片高 100-200px，全宽
- 上下文：异常详情页、审批记录页、操作日志详情
- 容器模式：垂直 flex column，每步一张 `.el-card` 或白底 div
- 标签关键词：流程, 时间线, 进度, 处理记录, timeline, process, 上报, 处理, 确认

**文件位置**：`components/business/ProcessTimeline.vue`

---

## 注册表维护规则

1. **新增时机**：阶段 4 生成新业务组件后，立即追加到本文件末尾
2. **格式要求**：新条目必须包含完整定义（Props / Emits / Slots / CSS 变量依赖 / 视觉特征 / 文件位置），缺一不可
3. **索引更新**：追加组件的同时，在顶部索引表添加对应行
4. **去重检查**：追加前先检查是否有同名或高度相似的组件，避免重复注册
5. **使用统计**：每次成功匹配复用时，在索引表中更新使用计数（仅标记，不计入核心流程）
