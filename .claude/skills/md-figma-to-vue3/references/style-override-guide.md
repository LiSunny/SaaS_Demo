# Element Plus 样式覆盖指南

> 生成代码时，对每个 Element Plus 组件，按本指南的「必覆盖」和「深色必覆盖」清单逐项处理。目标是 Element Plus 只提供行为（排序、翻页、下拉），视觉完全由 Figma CSS 变量控制。

## 一、通用覆盖原则

### 1.1 三层覆盖策略

```
el-* 默认样式  →  :root CSS 变量（--el-*）做全局基调  →  scoped CSS 做组件级精确覆盖
```

- **`:root` 层**：统一 Element Plus CSS 变量（颜色、字号、圆角、间距）—— 已在 design-tokens.md §六中定义
- **全局 `<style>` 层**（无 scoped）：覆盖 Teleport 到 `<body>` 的弹出层组件
- **`<style scoped>` 层**：覆盖当前组件内可见的 EL 子元素

### 1.2 必须用 `!important` 的场景

- 覆盖 `.el-select-dropdown` 等 Teleport 组件的样式
- 覆盖 Element Plus 内联 style 产生的样式
- Dark 主题下覆盖 Light 默认值

### 1.3 必须用全局 CSS（无 scoped）的场景

这些组件通过 Teleport 挂载到 `<body>`，scoped 样式无法穿透：

| 组件 | 挂载位置 | 全局选择器 |
|------|---------|-----------|
| `el-select` 下拉 | `<body>` | `.el-select-dropdown` `.el-select-dropdown__item` |
| `el-dialog` | `<body>` | `.el-dialog` `.el-dialog__header` `.el-dialog__body` `.el-dialog__footer` |
| `el-drawer` | `<body>` | `.el-drawer` `.el-drawer__header` `.el-drawer__body` `.el-drawer__footer` |
| `el-popover` | `<body>` | `.el-popover` `.el-popper` |
| `el-tooltip` | `<body>` | `.el-tooltip` `.el-popper` |
| `el-dropdown` | `<body>` | `.el-dropdown-menu` `.el-dropdown-menu__item` |
| `el-date-picker` 面板 | `<body>` | `.el-picker-panel` `.el-date-picker` |
| `el-cascader` 面板 | `<body>` | `.el-cascader__dropdown` |
| `el-message` | `<body>` | `.el-message` |
| `el-notification` | `<body>` | `.el-notification` |
| `el-message-box` | `<body>` | `.el-message-box` |

### 1.4 scoped 深度选择器

Vue 3 scoped 中穿透子组件用 `:deep()`：

```css
/* ✅ 正确 */
:deep(.el-input__wrapper) { border-color: var(--border-default); }

/* ❌ Vue 3 不支持 */
>>> .el-input__wrapper { }
/deep/ .el-input__wrapper { }
::v-deep .el-input__wrapper { }
```

---

## 二、组件覆盖速查

每个组件包含三部分：
- **DOM 结构**：关键 class 名称
- **🎨 必覆盖**：视觉属性（调用 get_design_context 后从 Figma 提取对应值）
- **🌙 深色必覆盖**：Dark 主题下必须额外处理的属性

---

### 2.1 Button — `el-button`

```
DOM:
.el-button
  ├── background, border, color, font-size, padding, border-radius 直接在这层
  ├── .el-button:hover  — hover 态
  ├── .el-button:active — active 态
  ├── .el-button.is-disabled — 禁用态
  ├── .el-button--primary / --danger / --success / --warning / --info — 类型变体
  └── .el-button--small / --large — 尺寸变体
```

| 属性 | 选择器 | Figma 来源 |
|------|--------|-----------|
| 背景色 | `.el-button--primary` | accent/primary |
| 文字色 | `.el-button--primary` | text/on-primary 或白色 |
| 边框 | `.el-button` / `.el-button.is-plain` | border color |
| 字号 | `.el-button` | fontSize/small (default 14px) |
| 圆角 | `.el-button` | border-radius-md (8px) |
| 内边距 | `.el-button` | Figma auto-layout padding |
| Hover bg | `.el-button--primary:hover` | accent/primary 加深 10% |
| 禁用态 | `.el-button.is-disabled` | opacity 0.4 + cursor not-allowed |

**🌙 深色必覆盖**：
```css
html.dark .el-button--default { background: var(--bg-card); color: var(--text-primary); border-color: var(--border-default); }
html.dark .el-button--default:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
html.dark .el-button.is-plain { background: transparent; }
html.dark .el-button.is-disabled { opacity: 0.3; }
```

**陷阱**：`el-button link` 类型的 hover 色需要在全局覆盖，因为 link 按钮的文字色通过 `--el-button-text-color` 控制。

---

### 2.2 Input — `el-input`

```
DOM:
.el-input
  ├── .el-input__wrapper        → border, bg, border-radius, padding, box-shadow, min-height
  │   ├── .el-input__inner      → color, font-size, font-family, line-height
  │   ├── .el-input__prefix     → 前缀图标区域
  │   ├── .el-input__suffix     → 后缀图标/clearable 区域
  │   └── .el-input__suffix-inner → clearable 图标
  ├── .el-input.is-disabled
  │   └── .el-input__wrapper    → disabled bg, border, text color
  ├── .el-input.is-focus
  │   └── .el-input__wrapper    → focus border, box-shadow
  └── .el-input--small / --large
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 边框 | `.el-input__wrapper` | 默认 `var(--border-default)`，focus 时 `var(--accent-primary)` |
| 背景 | `.el-input__wrapper` | Light: `#FFF`，Dark: `var(--bg-card)` |
| 文字色 | `.el-input__inner` | `var(--text-primary)` |
| 字号 | `.el-input__inner` | `var(--font-body, 16px)` |
| placeholder 色 | `.el-input__inner::placeholder` | `var(--text-placeholder)` |
| 圆角 | `.el-input__wrapper` | `var(--border-radius-sm, 6px)` |
| focus shadow | `.el-input.is-focus .el-input__wrapper` | `box-shadow: 0 0 0 1px var(--accent-primary) inset` |
| clearable icon | `.el-input__suffix-inner` | 颜色、尺寸 |
| disabled | `.el-input.is-disabled .el-input__wrapper` | bg + border + text color |

**🌙 深色必覆盖**：
```css
html.dark .el-input__wrapper { background: var(--bg-card); border-color: var(--border-default); box-shadow: none; }
html.dark .el-input__inner { color: var(--text-primary); }
html.dark .el-input__inner::placeholder { color: var(--text-muted); }
html.dark .el-input.is-disabled .el-input__wrapper { background: var(--bg-sub-card); border-color: var(--border-low); }
html.dark .el-input.is-disabled .el-input__inner { color: var(--text-muted); }
```

**陷阱**：
- `el-input__wrapper` 默认有 `box-shadow: 0 0 0 1px var(--el-border-color) inset`，做自定义边框时必须覆盖 box-shadow
- `el-input-number` 和 `el-input` 共享 `el-input__wrapper`，覆盖会同时生效
- **兼容旧版**：部分 Element Plus 版本用 `.el-input__wrapper`，旧版用 `.el-input__inner` 的外层 wrapper，需同时写两套选择器

---

### 2.3 Select — `el-select`

```
DOM（输入框部分，在当前组件内）:
.el-select
  └── .el-select__wrapper         → border, bg, border-radius, padding, min-height
      ├── .el-select__input       → color, font-size（显示已选文字）
      ├── .el-select__placeholder → placeholder color
      ├── .el-select__caret       → 下拉箭头图标颜色、transform
      └── .el-select__suffix      → 后缀区域

DOM（下拉面板，Teleport 到 <body>）:
.el-select-dropdown               → border, bg, box-shadow, border-radius
  ├── .el-select-dropdown__item   → color, font-size, padding, line-height
  │   ├── .is-selected            → 选中态 bg, color
  │   └── .is-hovering            → hover 态 bg
  └── .el-select-dropdown__empty  → 空数据提示
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 输入框 border | `.el-select__wrapper` | 同 el-input 规则 |
| 输入框 bg | `.el-select__wrapper` | |
| 文字 | `.el-select__input` / `.el-select__placeholder` | |
| 箭头 | `.el-select__caret` | 颜色、展开时 rotate(180deg) |
| 下拉面板 bg | `.el-select-dropdown` | **全局 CSS** |
| 下拉面板 border | `.el-select-dropdown` | **全局 CSS** |
| 下拉面板 shadow | `.el-select-dropdown` | **全局 CSS** |
| 选项文字 | `.el-select-dropdown__item` | **全局 CSS** |
| 选项 hover | `.el-select-dropdown__item.is-hovering` | **全局 CSS** |
| 选项选中 | `.el-select-dropdown__item.is-selected` | **全局 CSS** |

**🌙 深色必覆盖**：
```css
html.dark .el-select__wrapper { background: var(--bg-card); border-color: var(--border-default); }
html.dark .el-select__input { color: var(--text-primary); }
html.dark .el-select__caret { color: var(--text-muted); }
/* ↓ 全局 CSS，必须 !important */
html.dark .el-select-dropdown { background: var(--bg-card) !important; border-color: var(--border-default) !important; }
html.dark .el-select-dropdown__item { color: var(--text-primary) !important; }
html.dark .el-select-dropdown__item.is-hovering { background: var(--bg-card-hover) !important; }
html.dark .el-select-dropdown__item.is-selected { color: var(--accent-primary) !important; font-weight: 600; }
```

**陷阱**：
- 下拉面板是 Teleport 到 `<body>` 的，scoped 样式无效，必须写在全局 `<style>` 块
- 同时写 `.el-select__wrapper` 和 `.el-input__wrapper` 兼容不同 Element Plus 版本
- 多选模式（`multiple`）每个 tag 用 `.el-tag` 覆盖

---

### 2.4 Table — `el-table`

```
DOM:
.el-table
  ├── .el-table__header-wrapper
  │   └── .el-table__header
  │       └── thead > tr > th (.el-table__cell)
  │           ├── .cell                → 表头文字容器
  │           └── .el-table__column-filter-trigger  → 筛选图标
  ├── .el-table__body-wrapper
  │   └── .el-table__body
  │       └── tbody > tr (.el-table__row)
  │           └── td (.el-table__cell)
  │               └── .cell            → 单元格文字容器
  ├── .el-table__empty-text           → 空数据
  ├── .el-table--border               → 带边框变体
  ├── .el-table--striped              → 斑马纹
  ├── tr.el-table__row--striped       → 斑马行
  ├── tr.hover-row                    → 悬停行
  └── .el-loading-mask                → 加载遮罩（见 2.15）
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 表头 bg | `.el-table th.el-table__cell` | `var(--bg-sub-card)` |
| 表头文字 | `.el-table th.el-table__cell .cell` | color, font-size, font-weight |
| 表头 border-bottom | `.el-table th.el-table__cell` | `var(--border-default)` |
| 表体文字 | `.el-table td.el-table__cell .cell` | color, font-size |
| 行高 | `.el-table__body-wrapper .el-table__row` | 默认约 45px，通过 `--el-table-row-height` 或直接设 td padding |
| 行 hover bg | `.el-table__body tr.hover-row > td` | `var(--bg-card-hover)` 或 rgba |
| 斑马行 bg | `.el-table--striped .el-table__row--striped td` | |
| 边框色 | `.el-table--border .el-table__cell` | `var(--border-default)` |
| 空数据 | `.el-table__empty-text` | color, font-size |
| 排序图标 | `.el-table .caret-wrapper` | color |
| 展开行 | `.el-table__expand-icon` | color |
| 选择列 | `.el-table__selection-column` | width |
| 固定列阴影 | `.el-table-fixed-column--right` / `--left` | `box-shadow` |
| 固定列 bg | `.el-table__fixed-right` / `__fixed-left` | 背景色 |

**🌙 深色必覆盖**：
```css
html.dark .el-table { --el-table-bg-color: var(--bg-card); --el-table-tr-bg-color: var(--bg-card); }
html.dark .el-table th.el-table__cell { background: var(--bg-sub-card); color: var(--text-primary); border-bottom-color: var(--border-default); }
html.dark .el-table td.el-table__cell { background: var(--bg-card); color: var(--text-primary); border-bottom-color: var(--border-low); }
html.dark .el-table tr.hover-row > td.el-table__cell { background: var(--bg-card-hover); }
html.dark .el-table--striped .el-table__row--striped td { background: rgba(255,255,255,0.02); }
html.dark .el-table__empty-text { color: var(--text-muted); }
html.dark .el-table .cell { color: var(--text-primary); }
html.dark .el-table__expand-icon { color: var(--text-primary); }
html.dark .el-table__expand-icon--expanded { color: var(--accent-primary); }
```

**陷阱**：
- 表头排序图标 `.caret-wrapper` 的默认颜色较浅，需明确设 color
- 固定列（`fixed="right"` / `fixed="left"`）会自动生成 `el-table__fixed-right` 等 class，有独立 bg 和 box-shadow
- 表格列的 `display: none !important` 用于响应式隐藏列时必须加 `!important` 覆盖 Element Plus 的 `display: table-cell`

---

### 2.5 Pagination — `el-pagination`

```
DOM:
.el-pagination
  ├── .el-pagination__total          → "共 X 条"
  ├── .el-pagination__sizes
  │   └── .el-select__wrapper        → 每页条数选择器（参考 2.3 Select）
  ├── .btn-prev / .btn-next          → 上一页/下一页按钮
  │   └── .el-icon                   → 箭头图标
  ├── .el-pager
  │   └── li                         → 页码按钮
  │       └── .is-active             → 当前页（bg = accent/primary, color = white）
  ├── .el-pagination__jump
  │   └── .el-input__wrapper         → 跳转输入框
  └── .el-pagination.is-background   → background 属性开启时
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 整体字号 | `.el-pagination` | `var(--font-small, 14px)` |
| 文字色 | `.el-pagination__total`, `.el-pager li` | `var(--text-secondary)` |
| 页码 hover | `.el-pager li:hover` | color change |
| 当前页 bg | `.el-pager li.is-active` | `var(--accent-primary)` |
| 当前页文字 | `.el-pager li.is-active` | `#FFF` |
| prev/next 按钮 | `.btn-prev`, `.btn-next` | color, bg, border-radius |
| prev/next disabled | `.btn-prev:disabled`, `.btn-next:disabled` | `var(--text-muted)` 文字 |
| 每页条数 Select | `.el-pagination__sizes .el-select__wrapper` | bg, border, color（同 2.3） |
| 跳转输入框 | `.el-pagination__jump .el-input__wrapper` | bg, border, color（同 2.2） |

**🌙 深色必覆盖**：
```css
html.dark .el-pagination .el-pager li { color: var(--text-primary); background: transparent; }
html.dark .el-pagination .el-pager li.is-active { background: var(--accent-primary); color: #000; }
html.dark .el-pagination .el-pager li:hover { color: var(--accent-primary); }
html.dark .el-pagination .btn-prev, html.dark .el-pagination .btn-next { color: var(--text-primary); background: var(--bg-card); }
html.dark .el-pagination .btn-prev:disabled, html.dark .el-pagination .btn-next:disabled { color: var(--text-muted); background: transparent; }
html.dark .el-pagination__total { color: var(--text-secondary); }
html.dark .el-pagination__jump .el-input__wrapper { background: var(--bg-card); border-color: var(--border-default); }
/* Pagination 内的 Select 尺寸选择器（Teleport 的下拉面板用全局 CSS，同 2.3） */
```

**陷阱**：
- 分页器内的每页条数 Select 下拉面板同样是 Teleport 到 `<body>` 的，必须全局 CSS
- `background` 属性会给按钮加 bg，Dark 下需覆盖
- 跳页输入框的 DOM 在 2.9+ 版本中从 `el-input` 改为 `el-input__wrapper`

---

### 2.6 Dialog — `el-dialog`

```
DOM（Teleport 到 <body>）:
.el-overlay                          → 遮罩层
  └── .el-dialog                     → 弹窗容器
      ├── .el-dialog__header         → 标题栏
      │   ├── .el-dialog__title      → 标题文字
      │   └── .el-dialog__headerbtn  → 关闭按钮（×）
      │       └── .el-dialog__close  → 关闭图标
      ├── .el-dialog__body           → 内容区
      └── .el-dialog__footer         → 底部按钮区（需 slot #footer）
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 弹窗 bg | `.el-dialog` | **全局 CSS** |
| 弹窗圆角 | `.el-dialog` | `var(--border-radius-xl, 14px)` |
| 弹窗 shadow | `.el-dialog` | Figma 提取 |
| 标题文字 | `.el-dialog__title` | font-size, font-weight, color |
| 关闭按钮 | `.el-dialog__headerbtn` | 位置、颜色、hover 色 |
| 内容 padding | `.el-dialog__body` | Figma auto-layout |
| 遮罩 bg | `.el-overlay` | rgba 值 |

**🌙 深色必覆盖**：
```css
html.dark .el-dialog { background: var(--bg-card) !important; }
html.dark .el-dialog__title { color: var(--text-primary) !important; }
html.dark .el-dialog__headerbtn .el-dialog__close { color: var(--text-secondary) !important; }
html.dark .el-dialog__body { color: var(--text-primary) !important; }
html.dark .el-overlay { background: rgba(0, 0, 0, 0.6) !important; }
```

**陷阱**：
- Dialog 整体 Teleport 到 `<body>`，全用全局 CSS + `!important`
- `el-dialog__header` 默认有 `padding-bottom: 0`，如果 Figma 有间距需要覆盖
- 如果 dialog 内有表单（见 2.8），表单元素覆盖不受 scoped 影响（在 Teleport 的 DOM 内）

---

### 2.7 Drawer — `el-drawer`

```
DOM（Teleport 到 <body>）:
.el-overlay                          → 遮罩层
  └── .el-drawer                     → 抽屉容器
      ├── .el-drawer__header         → 标题栏
      │   ├── .el-drawer__title      → 标题文字
      │   └── .el-drawer__close-btn  → 关闭按钮
      ├── .el-drawer__body           → 内容区
      └── .el-drawer__footer         → 底部（需 slot #footer）
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 抽屉 bg | `.el-drawer` | **全局 CSS** |
| 标题文字 | `.el-drawer__title` | |
| 关闭按钮 | `.el-drawer__close-btn` | |
| 内容 padding | `.el-drawer__body` | 默认 20px |

**🌙 深色必覆盖**：
```css
html.dark .el-drawer { background: var(--bg-card) !important; }
html.dark .el-drawer__title { color: var(--text-primary) !important; }
html.dark .el-drawer__close-btn { color: var(--text-secondary) !important; }
html.dark .el-drawer__body { color: var(--text-primary) !important; }
```

---

### 2.8 Form — `el-form` / `el-form-item`

```
DOM:
.el-form
  └── .el-form-item
      ├── .el-form-item__label      → label 文字
      ├── .el-form-item__content    → 表单控件容器
      │   ├── .el-form-item__error  → 校验错误信息
      │   └── [表单控件]             → el-input / el-select / ...
      └── .el-form-item.is-error    → 错误态
          └── .el-input__wrapper    → 错误态边框
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| label 文字色 | `.el-form-item__label` | `var(--text-primary)` |
| label 字号 | `.el-form-item__label` | `var(--font-body, 16px)` |
| label 宽度 | `.el-form-item__label` 或 `label-width` prop | |
| 必填星号 | `.el-form-item__label::before` | color: `var(--semantic-danger)` |
| 错误信息 | `.el-form-item__error` | font-size: 12px, color: `var(--semantic-danger)` |
| 错误边框 | `.el-form-item.is-error .el-input__wrapper` | `var(--semantic-danger)` |
| item 间距 | `.el-form-item` | margin-bottom |

**🌙 深色必覆盖**：
```css
html.dark .el-form-item__label { color: var(--text-primary); }
html.dark .el-form-item__error { color: var(--semantic-danger); }
```

---

### 2.9 Switch — `el-switch`

```
DOM:
.el-switch
  ├── .el-switch__core              → 开关轨道（bg, border-radius, width, height）
  │   └── .el-switch__action        → 开关圆点（bg, transform, box-shadow）
  ├── .el-switch.is-checked
  │   └── .el-switch__core          → 选中态轨道 bg
  └── .el-switch.is-disabled        → 禁用态 opacity
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 轨道 bg（关） | `.el-switch__core` | `var(--border-high)` 或灰色 |
| 轨道 bg（开） | `.el-switch.is-checked .el-switch__core` | `var(--accent-primary)` |
| 轨道尺寸 | `.el-switch__core` | width, height, border-radius |
| 圆点颜色 | `.el-switch__action` | `#FFF` |
| 禁用态 | `.el-switch.is-disabled` | opacity: 0.4 |

**🌙 深色必覆盖**：
```css
html.dark .el-switch__core { background: var(--border-high); }
html.dark .el-switch.is-checked .el-switch__core { background: var(--accent-primary); border-color: var(--accent-primary); }
html.dark .el-switch__action { background: #FFF; }
```

**陷阱**：
- 轨道 border-color 和 bg-color 需要同时覆盖
- 部分版本 `.el-switch__core` 有内联 border-color，需 `!important`

---

### 2.10 Checkbox / Radio — `el-checkbox` / `el-radio`

```
DOM（Checkbox）:
.el-checkbox
  ├── .el-checkbox__input
  │   ├── .el-checkbox__inner       → 复选框方块（bg, border, border-radius）
  │   └── .el-checkbox__original    → 原生 input[hidden]
  ├── .el-checkbox__label           → 标签文字
  ├── .is-checked .el-checkbox__inner → 选中态（bg + 勾选图标）
  └── .is-disabled                  → 禁用态

DOM（Radio）:
.el-radio
  ├── .el-radio__input
  │   ├── .el-radio__inner          → 圆形框
  │   └── .el-radio__original       → 原生 input[hidden]
  ├── .el-radio__label              → 标签文字
  ├── .is-checked .el-radio__inner  → 选中态
  └── .is-disabled                  → 禁用态
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 方块/圆形 border | `.el-checkbox__inner` / `.el-radio__inner` | `var(--border-high)` |
| 方块/圆形 bg | `.el-checkbox__inner` / `.el-radio__inner` | `var(--bg-card)` |
| 选中态 bg | `.is-checked .el-checkbox__inner` | `var(--accent-primary)` |
| 选中态 border | `.is-checked .el-checkbox__inner` | `var(--accent-primary)` |
| 标签文字 | `.el-checkbox__label` / `.el-radio__label` | color, font-size |

**🌙 深色必覆盖**：
```css
html.dark .el-checkbox__inner, html.dark .el-radio__inner { background: var(--bg-card); border-color: var(--border-high); }
html.dark .el-checkbox__label, html.dark .el-radio__label { color: var(--text-primary); }
```

---

### 2.11 Tag — `el-tag`

```
DOM:
.el-tag
  ├── background, color, border, font-size, border-radius 直接在这层
  ├── .el-tag__content            → 文字容器
  ├── .el-tag__close              → 可关闭的 × 按钮
  ├── .el-tag--primary / --success / --danger / --warning / --info
  └── .el-tag--plain / --dark     → effect 属性
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| bg | `.el-tag` | 按 type 分别设置 |
| 文字色 | `.el-tag__content` | |
| 边框 | `.el-tag` | |
| 字号 | `.el-tag` | `var(--font-small, 14px)` |
| 圆角 | `.el-tag` | `var(--border-radius-sm, 6px)` |
| 关闭按钮 | `.el-tag__close` | color, hover color |

**🌙 深色必覆盖**：
```css
html.dark .el-tag--default { background: var(--bg-sub-card); color: var(--text-primary); border-color: var(--border-default); }
html.dark .el-tag--primary { background: rgba(0,229,255,0.15); color: var(--accent-primary); border-color: transparent; }
html.dark .el-tag--success { background: rgba(76,175,80,0.15); color: var(--semantic-success); border-color: transparent; }
html.dark .el-tag--danger { background: rgba(244,67,54,0.15); color: var(--semantic-danger); border-color: transparent; }
html.dark .el-tag--warning { background: rgba(255,152,0,0.15); color: var(--semantic-warning); border-color: transparent; }
html.dark .el-tag--info { background: rgba(185,185,185,0.15); color: var(--semantic-normal); border-color: transparent; }
```

**陷阱**：
- Tag 是最应该「按 Figma 定制」的组件。后台系统通常有 5-8 种业务状态 Tag，不要只用 `type="primary/success/danger"`，要根据 Figma 精确写每个状态的 bg + color
- `el-tag--plain` 的边框色和文字色一致，Dark 下需要注意对比度

---

### 2.12 Tabs — `el-tabs`

```
DOM:
.el-tabs
  ├── .el-tabs__header
  │   └── .el-tabs__nav-wrap
  │       └── .el-tabs__nav
  │           ├── .el-tabs__item         → 每个标签
  │           │   ├── color, font-size, padding
  │           │   └── .is-active         → 激活态（color + 下划线指示器）
  │           ├── .el-tabs__active-bar   → 激活下划线
  │           └── .el-tabs__new-tab      → + 新增标签按钮
  └── .el-tabs__content
      └── .el-tab-pane
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 标签文字 | `.el-tabs__item` | color, font-size, padding |
| 激活标签文字 | `.el-tabs__item.is-active` | color: `var(--accent-primary)`, font-weight |
| 激活下划线 | `.el-tabs__active-bar` | bg: `var(--accent-primary)`, height, border-radius |
| 导航条底部线 | `.el-tabs__nav-wrap::after` | bg: `var(--border-low)`, height |
| hover 文字 | `.el-tabs__item:hover` | color |

**🌙 深色必覆盖**：
```css
html.dark .el-tabs__item { color: var(--text-secondary); }
html.dark .el-tabs__item.is-active { color: var(--accent-primary); }
html.dark .el-tabs__item:hover { color: var(--accent-primary); }
html.dark .el-tabs__nav-wrap::after { background: var(--border-low); }
```

**陷阱**：
- `card` 类型的 tabs（`type="card"`）有额外 border 和 bg，DOM 结构不同
- `el-tabs__header` 默认底部有 1px border

---

### 2.13 DatePicker — `el-date-picker`

```
DOM（输入框部分，参考 el-input）:
.el-date-editor
  └── .el-input__wrapper            → 同 el-input（见 2.2）
      ├── .el-input__prefix         → 日历图标
      └── .el-range__icon / .el-range__close-icon → range 模式的图标

DOM（日期面板，Teleport 到 <body>）:
.el-picker-panel
  ├── .el-date-picker
  │   ├── .el-picker-panel__header    → 年月切换头部
  │   │   ├── button                  → < > 箭头
  │   ├── .el-picker-panel__body
  │   │   ├── .el-date-table
  │   │   │   ├── th                  → 周列表头
  │   │   │   ├── td
  │   │   │   │   ├── .available      → 可选日期
  │   │   │   │   ├── .today          → 今天
  │   │   │   │   ├── .current        → 当前选中
  │   │   │   │   └── .disabled       → 不可选日期
  │   │   │   └── td:hover
  │   │   └── .el-month-table / .el-year-table
  │   └── .el-picker-panel__footer    → 底部"此刻"确认按钮
  └── .el-date-range-picker           → range 模式
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| **面板 bg** | `.el-picker-panel` | **全局 CSS** |
| **面板 border** | `.el-picker-panel` | **全局 CSS** |
| **面板 shadow** | `.el-picker-panel` | **全局 CSS** |
| 头部文字 | `.el-picker-panel__header .el-date-picker__header-label` | color, font-size |
| 箭头按钮 | `.el-picker-panel__header button` | color |
| 周列表头 | `.el-date-table th` | color, font-weight, border-bottom |
| 日期文字 | `.el-date-table td.available` | color |
| 今天 | `.el-date-table td.today` | color, font-weight |
| 选中日期 | `.el-date-table td.current` | bg: `var(--accent-primary)`, color: white |
| hover 日期 | `.el-date-table td.available:hover` | bg, color |
| 禁用日期 | `.el-date-table td.disabled` | color: `var(--text-muted)` |

**🌙 深色必覆盖**：
```css
html.dark .el-picker-panel { background: var(--bg-card) !important; border-color: var(--border-default) !important; }
html.dark .el-date-table th { color: var(--text-secondary) !important; border-bottom-color: var(--border-default) !important; }
html.dark .el-date-table td.available { color: var(--text-primary) !important; }
html.dark .el-date-table td.current { background: var(--accent-primary) !important; color: #000 !important; }
html.dark .el-date-table td.today { color: var(--accent-primary) !important; }
html.dark .el-date-table td.disabled { color: var(--text-muted) !important; }
html.dark .el-date-table td.available:hover { background: var(--bg-card-hover) !important; }
html.dark .el-picker-panel__header button { color: var(--text-secondary) !important; }
html.dark .el-picker-panel__header button:hover { color: var(--accent-primary) !important; }
html.dark .el-picker-panel__icon-btn { color: var(--text-secondary) !important; }
```

**陷阱**：
- 日期面板 Teleport 到 `<body>`，全部用全局 CSS + `!important`
- Range 模式的输入框有两个 el-input__wrapper，中间有分隔符 `.el-range-separator`
- TimePicker 的面板结构不同，使用 `.el-time-panel`
- **Flex 容器中的高度**：`el-date-editor` 内部由 `--el-component-size` 控制高度（默认 32px）。当父容器使用 `align-items: stretch` 自动撑高时，必须对 `.el-date-editor` 设置 `height: 100% !important`，否则无法撑满容器，会比其他筛选组件矮

---

### 2.14 Cascader — `el-cascader`

```
DOM（输入框部分，参考 el-input）:
.el-cascader
  └── .el-input__wrapper            → 同 el-input（见 2.2）

DOM（级联面板，Teleport 到 <body>）:
.el-cascader__dropdown
  └── .el-cascader-panel
      └── .el-cascader-menu          → 每一级菜单列
          ├── .el-cascader-node      → 每个选项
          │   ├── .el-cascader-node__label    → 文字
          │   ├── .is-active          → 激活态
          │   └── .is-disabled        → 禁用态
          └── .el-cascader-menu__wrap → 滚动容器
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 面板 bg | `.el-cascader__dropdown` | **全局 CSS** |
| 面板 border | `.el-cascader__dropdown` | **全局 CSS** |
| 面板 shadow | `.el-cascader__dropdown` | **全局 CSS** |
| 选项文字 | `.el-cascader-node__label` | color, font-size |
| 选项 hover | `.el-cascader-node:not(.is-disabled):hover` | bg |
| 选中态 | `.el-cascader-node.is-active` | color: `var(--accent-primary)` |
| 箭头图标 | `.el-cascader-node__postfix` | color |

**🌙 深色必覆盖**：同 Select 面板模式，bg、文字、hover 进行全面覆盖。

---

### 2.15 Tree / TreeSelect — `el-tree` / `el-tree-select`

```
DOM（Tree）:
.el-tree
  └── .el-tree-node
      ├── .el-tree-node__content      → 节点行
      │   ├── .el-tree-node__expand-icon → 展开/折叠图标
      │   ├── .el-tree-node__label       → 标签文字
      │   └── .el-checkbox               → 如启用 show-checkbox
      ├── .is-current                  → 当前高亮节点
      ├── .is-checked                  → 选中节点（checkbox）
      └── .el-tree-node__children      → 子节点容器

DOM（TreeSelect，输入框参考 el-input，下拉面板 Teleport 到 <body>）:
.el-tree-select__dropdown
  └── .el-tree （同上面 Tree DOM）
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 节点文字 | `.el-tree-node__label` | color, font-size |
| 节点 hover | `.el-tree-node__content:hover` | bg |
| 当前高亮 | `.el-tree-node__content.is-current` | bg, color |
| 展开图标 | `.el-tree-node__expand-icon` | color, size |
| 缩进 | `.el-tree-node__children` | padding-left |
| 下拉面板 bg | `.el-tree-select__dropdown` | **全局 CSS（TreeSelect）** |

**🌙 深色必覆盖**：
```css
html.dark .el-tree { background: var(--bg-card); }
html.dark .el-tree-node__label { color: var(--text-primary); }
html.dark .el-tree-node__content:hover { background: var(--bg-card-hover); }
html.dark .el-tree-node__content.is-current { background: rgba(0,229,255,0.1); }
html.dark .el-tree-node__expand-icon { color: var(--text-muted); }
html.dark .el-tree-node__expand-icon.expanded { color: var(--text-primary); }
```

**陷阱**：
- Tree 的缩进由 `.el-tree-node__children` 的 padding-left 控制，默认约 18px/级
- `highlight-current` 属性开启后，当前节点 class 为 `.is-current`（不是 `.is-active`）

---

### 2.16 Menu — `el-menu`

```
DOM:
.el-menu
  ├── background, border-right, color 直接在这层
  ├── .el-menu-item                   → 一级菜单项
  │   ├── color, background
  │   ├── .is-active                  → 激活态
  │   ├── :hover                      → hover 态
  │   └── .el-icon                    → 菜单图标
  ├── .el-sub-menu
  │   ├── .el-sub-menu__title         → 父级标题
  │   └── .el-menu--inline            → 子菜单容器（inline 模式）
  │       └── .el-menu-item           → 子菜单项
  └── .el-menu--collapse              → 折叠态
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 菜单 bg | `.el-menu` | `var(--bg-card)` 或独立侧栏色 |
| 菜单 border-right | `.el-menu` | `var(--border-default)` |
| 菜单项文字 | `.el-menu-item` | color, font-size |
| 菜单项 hover | `.el-menu-item:hover` | bg, color |
| 激活态文字 | `.el-menu-item.is-active` | color: `var(--accent-primary)` |
| 激活态 bg | `.el-menu-item.is-active` | `var(--accent-primary10%)` 或渐变 |
| 图标色 | `.el-menu-item .el-icon` | color（继承文字色或独立色） |
| 折叠宽度 | `.el-menu--collapse` | width: ~72px |
| sub-menu title | `.el-sub-menu__title` | color, font-size, padding |

**🌙 深色必覆盖**：
```css
html.dark .el-menu { background: var(--bg-card); border-right-color: var(--border-default); }
html.dark .el-menu-item { color: var(--text-secondary); }
html.dark .el-menu-item:hover { background: var(--bg-card-hover); color: var(--text-primary); }
html.dark .el-menu-item.is-active { color: var(--accent-primary); background: rgba(0,229,255,0.08); }
html.dark .el-sub-menu__title { color: var(--text-secondary); }
html.dark .el-sub-menu__title:hover { color: var(--text-primary); background: var(--bg-card-hover); }
```

---

### 2.17 Dropdown — `el-dropdown`

```
DOM（触发元素在当前组件内，下拉菜单 Teleport 到 <body>）:
.el-dropdown-menu                   → 下拉菜单容器
  └── .el-dropdown-menu__item       → 菜单项
      ├── .is-disabled              → 禁用项
      └── :hover                    → hover 态
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 菜单 bg | `.el-dropdown-menu` | **全局 CSS** |
| 菜单 border | `.el-dropdown-menu` | **全局 CSS** |
| 菜单 shadow | `.el-dropdown-menu` | **全局 CSS** |
| 选项文字 | `.el-dropdown-menu__item` | color, font-size, padding |
| 选项 hover | `.el-dropdown-menu__item:hover` | bg, color |
| 禁用项 | `.el-dropdown-menu__item.is-disabled` | color: `var(--text-muted)` |

**🌙 深色必覆盖**：
```css
html.dark .el-dropdown-menu { background: var(--bg-card) !important; border-color: var(--border-default) !important; }
html.dark .el-dropdown-menu__item { color: var(--text-primary) !important; }
html.dark .el-dropdown-menu__item:hover { background: var(--bg-card-hover) !important; }
html.dark .el-dropdown-menu__item.is-disabled { color: var(--text-muted) !important; }
```

---

### 2.18 Popover / Tooltip — `el-popover` / `el-tooltip`

```
DOM（Teleport 到 <body>）:
.el-popper                          → 弹出层容器
  ├── background, border, box-shadow, color, font-size, padding, border-radius
  ├── .el-popper__arrow             → 箭头
  │   └── ::before                  → 箭头可见部分（bg + border）
  ├── .el-popover                   → Popover 内容
  │   └── .el-popover__title        → 标题
  └── .el-tooltip                   → Tooltip 内容（极简，仅文字）
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 弹出层 bg | `.el-popper` / `.el-popover` / `.el-tooltip` | **全局 CSS** |
| 弹出层 border | `.el-popper` | **全局 CSS** |
| 弹出层 shadow | `.el-popper` | **全局 CSS** |
| 文字色 | `.el-popper` | **全局 CSS** |
| 弹出层圆角 | `.el-popper` | |
| 箭头 bg | `.el-popper__arrow::before` | **全局 CSS**（箭头方向不同 bg 位置不同） |
| Popover 标题 | `.el-popover__title` | color, font-size, font-weight |

**🌙 深色必覆盖**：
```css
html.dark .el-popper { background: var(--bg-card) !important; color: var(--text-primary) !important; border-color: var(--border-default) !important; }
html.dark .el-popper__arrow::before { background: var(--bg-card) !important; border-color: var(--border-default) !important; }
html.dark .el-popover__title { color: var(--text-primary) !important; }
html.dark .el-tooltip { background: var(--bg-card) !important; color: var(--text-primary) !important; }
```

**陷阱**：
- Tooltip 默认是暗色的（`--el-bg-color-overlay` 为深色），在 Light 主题也可能需要处理
- 箭头方向（top/bottom/left/right）影响 `::before` 的边框位置，需要针对 4 个方向分别覆盖

---

### 2.19 Breadcrumb — `el-breadcrumb`

```
DOM:
.el-breadcrumb
  └── .el-breadcrumb__item
      ├── .el-breadcrumb__inner     → 文字链接
      │   ├── .is-link              → 可点击项
      │   └── :hover                → hover 态
      └── .el-breadcrumb__separator → 分隔符
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 分隔符 | `.el-breadcrumb__separator` | color |
| 链接文字 | `.el-breadcrumb__inner.is-link` | color |
| 链接 hover | `.el-breadcrumb__inner.is-link:hover` | color: `var(--accent-primary)` |
| 当前项文字 | `.el-breadcrumb__inner:not(.is-link)` | color: `var(--text-primary)`, font-weight |
| 字号 | `.el-breadcrumb__inner` | `var(--font-small, 14px)` |

---

### 2.20 Card — `el-card`

```
DOM:
.el-card
  ├── background, border, border-radius, box-shadow 直接在这层
  ├── .el-card__header               → header 区域（如有 slot #header 或 header prop）
  └── .el-card__body                 → 默认内容区（padding）
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| bg | `.el-card` | `var(--bg-card)` |
| border | `.el-card` | `var(--border-default)` |
| 圆角 | `.el-card` | `var(--border-radius-lg, 10px)` |
| shadow | `.el-card` | box-shadow（Figma 提取） |
| header border-bottom | `.el-card__header` | `var(--border-low)` |
| content padding | `.el-card__body` | Figma auto-layout |

**🌙 深色必覆盖**：
```css
html.dark .el-card { background: var(--bg-card); border-color: var(--border-default); }
html.dark .el-card__header { border-bottom-color: var(--border-low); }
```

---

### 2.21 Loading / Skeleton — `v-loading` / `el-skeleton`

```
DOM（v-loading 指令，动态插入）:
.el-loading-mask                    → 遮罩层
  ├── background, z-index
  └── .el-loading-spinner
      ├── .circular                 → 旋转圈 SVG
      └── .el-loading-text          → 加载文字

DOM（Skeleton）:
.el-skeleton
  ├── .el-skeleton__item
  │   ├── .el-skeleton__paragraph  → 段落占位
  │   │   └── li                   → 每行
  │   ├── .el-skeleton__image       → 图片占位
  │   ├── .el-skeleton__button      → 按钮占位
  │   └── .el-skeleton__text        → 文字占位
  ├── .el-skeleton.is-animated     → 动画变体
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| Loading 遮罩 bg | `.el-loading-mask` | `rgba(255,255,255,0.6)` Light / `rgba(0,0,0,0.4)` Dark |
| Loading spinner 颜色 | `.el-loading-spinner .circular` | stroke color |
| Skeleton bg | `.el-skeleton__item` | `var(--bg-sub-card)` |
| Skeleton 动画渐变 | `.el-skeleton.is-animated .el-skeleton__item` | gradient |

**🌙 深色必覆盖**：
```css
html.dark .el-loading-mask { background: rgba(0,0,0,0.5); }
html.dark .el-loading-spinner .path { stroke: var(--accent-primary); }
html.dark .el-skeleton__item { background: var(--bg-sub-card); }
```

**陷阱**：`v-loading` 的遮罩是动态插入到最近 `position: relative` 父元素的，如果遮罩位置不对需要检查父元素定位。

---

### 2.22 Message / Notification / MessageBox

```
DOM（Teleport 到 <body>）:
.el-message                        → 消息提示
  ├── .el-message__content          → 文字
  ├── .el-message__icon             → 图标
  └── .el-message__closeBtn         → 关闭按钮

.el-notification                    → 通知
  ├── .el-notification__title       → 标题
  ├── .el-notification__content     → 内容
  └── .el-notification__closeBtn    → 关闭按钮

.el-message-box                     → 确认框
  ├── .el-message-box__header
  │   └── .el-message-box__title    → 标题
  ├── .el-message-box__content
  │   └── .el-message-box__message  → 消息文字
  └── .el-message-box__btns         → 按钮区
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| Message bg | `.el-message` | **全局 CSS** |
| Message 文字 | `.el-message__content` | |
| Notification bg | `.el-notification` | **全局 CSS** |
| Notification 标题 | `.el-notification__title` | |
| MessageBox bg | `.el-message-box` | **全局 CSS** |
| MessageBox 标题 | `.el-message-box__title` | |

**🌙 深色必覆盖**：
```css
html.dark .el-message { background: var(--bg-card) !important; border-color: var(--border-default) !important; }
html.dark .el-message--success { border-color: var(--semantic-success); }
html.dark .el-message--error { border-color: var(--semantic-danger); }
html.dark .el-message__content { color: var(--text-primary) !important; }
html.dark .el-notification { background: var(--bg-card) !important; border-color: var(--border-default) !important; }
html.dark .el-notification__title { color: var(--text-primary) !important; }
html.dark .el-notification__content { color: var(--text-secondary) !important; }
html.dark .el-message-box { background: var(--bg-card) !important; }
html.dark .el-message-box__title { color: var(--text-primary) !important; }
html.dark .el-message-box__message { color: var(--text-secondary) !important; }
```

---

### 2.23 Upload — `el-upload`

```
DOM:
.el-upload
  ├── .el-upload-dragger             → 拖拽上传区域（drag 属性）
  │   ├── border, bg, border-radius
  │   └── .is-dragover               → 拖拽悬停态
  ├── .el-upload-list
  │   └── .el-upload-list__item      → 文件列表项
  │       ├── .el-upload-list__item-name  → 文件名
  │       ├── .el-upload-list__item-file-name → 文件名（新版）
  │       └── .el-icon--close         → 删除按钮
  └── .el-upload--picture-card       → 图片卡片模式
      └── .el-upload--picture-card .el-upload-list__item
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 拖拽区 border | `.el-upload-dragger` | dashed / solid |
| 拖拽区 bg | `.el-upload-dragger` | |
| 拖拽区 hover | `.el-upload-dragger.is-dragover` | border, bg change |
| 文件列表项 | `.el-upload-list__item` | border-bottom, padding |
| 文件名 | `.el-upload-list__item-name` | color, font-size |

**🌙 深色必覆盖**：
```css
html.dark .el-upload-dragger { background: var(--bg-card); border-color: var(--border-default); }
html.dark .el-upload-list__item-name { color: var(--text-primary); }
```

---

### 2.24 Steps — `el-steps`

```
DOM:
.el-steps
  └── .el-step
      ├── .el-step__head
      │   ├── .el-step__icon         → 步骤图标/数字圆圈
      │   └── .el-step__line         → 连接线
      ├── .el-step__main
      │   ├── .el-step__title        → 标题文字
      │   └── .el-step__description  → 描述文字
      ├── .is-process / .is-finish / .is-wait / .is-error
      └── .el-step__title.is-process / .is-finish / .is-wait / .is-error
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 标题文字 | `.el-step__title` | color, font-size |
| 描述文字 | `.el-step__description` | color, font-size |
| 连线 | `.el-step__line` | bg color |
| 图标圆圈 | `.el-step__icon` | bg, border, color |
| 完成态 | `.is-finish .el-step__title` | color: `var(--accent-primary)` |
| 进行中 | `.is-process .el-step__icon` | bg: `var(--accent-primary)`, border-color: `var(--accent-primary)` |

---

### 2.25 Descriptions — `el-descriptions`

```
DOM:
.el-descriptions
  ├── .el-descriptions__header
  │   └── .el-descriptions__title    → 标题
  ├── .el-descriptions__body
  │   └── .el-descriptions__table
  │       └── .el-descriptions__row
  │           └── .el-descriptions__cell
  │               ├── .el-descriptions__label   → 标签
  │               └── .el-descriptions__content → 值
  └── .el-descriptions--border      → 带边框变体
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 标签文字 | `.el-descriptions__label` | color: `var(--text-secondary)`, font-size |
| 内容文字 | `.el-descriptions__content` | color: `var(--text-primary)`, font-size |
| 边框 | `.el-descriptions--border .el-descriptions__cell` | `var(--border-low)` |
| 单元格 bg | `.el-descriptions__label` | `var(--bg-sub-card)` |

---

### 2.26 Progress — `el-progress`

```
DOM:
.el-progress
  ├── .el-progress-bar
  │   ├── .el-progress-bar__outer    → 外轨道（bg）
  │   └── .el-progress-bar__inner    → 内进度条（bg + width%）
  └── .el-progress__text             → 百分比文字
```

| 属性 | 选择器 | 备注 |
|------|--------|------|
| 轨道 bg | `.el-progress-bar__outer` | `var(--bg-sub-card)` |
| 进度条 bg | `.el-progress-bar__inner` | `var(--accent-primary)` |
| 百分比文字 | `.el-progress__text` | color, font-size |

---

### 2.27 Avatar / Badge / Alert / Empty / Result

```
DOM（Avatar）:
.el-avatar                            → bg, color, font-size, border-radius
  └── img                             → 图片头像

DOM（Badge）:
.el-badge
  └── .el-badge__content              → 角标（bg, color, font-size, border）
      └── .is-fixed                   → 固定定位角标

DOM（Alert）:
.el-alert
  ├── .el-alert__title                → 标题（color, font-size, font-weight）
  ├── .el-alert__description          → 描述
  └── .el-alert--success / --warning / --error / --info → bg + border

DOM（Empty）:
.el-empty
  ├── .el-empty__image                → 插图区域
  └── .el-empty__description          → 描述文字（color, font-size）

DOM（Result）:
.el-result
  ├── .el-result__icon                → 图标
  ├── .el-result__title               → 标题（color, font-size）
  └── .el-result__subtitle            → 副标题（color）
```

这些组件相对简单，覆盖规则：
- **Avatar**：覆盖 bg、文字色、字号
- **Badge**：覆盖角标 bg、颜色、字号
- **Alert**：覆盖每个 type 的背景色（α=10% 变体）、边框色（α=20% 变体）、标题色
- **Empty**：覆盖描述文字色（Dark 下容易看不清）
- **Result**：覆盖标题和副标题色

---

## 三、Dark 模式覆盖优先级

按出现频率和影响面积排序，生成代码时优先处理：

| 优先级 | 组件 | 关键覆盖点 |
|--------|------|-----------|
| P0 | Table | 表头 bg、表体 bg、文字、hover 行、border |
| P0 | Input/Select 输入框 | bg、border、文字、placeholder |
| P0 | Button | bg、文字、border、hover、disabled |
| P1 | Pagination | 页码 bg、文字、激活态、prev/next |
| P1 | Dialog/Drawer | 面板 bg、标题、内容、遮罩 |
| P1 | Select 下拉 | 面板 bg、选项文字、hover、选中态 |
| P1 | DatePicker 面板 | 面板 bg、日期文字、选中态、hover |
| P2 | Tag | 各 type 的 bg + 文字色 |
| P2 | Menu | 菜单 bg、激活态、hover |
| P2 | Tabs | 激活文字、hover、下划线 |
| P3 | Dropdown/Cascader | 面板 bg、选项文字 |
| P3 | Popover/Tooltip | 弹出层 bg、文字、箭头 |
| P3 | Message/Notification | 消息 bg、文字 |
| P4 | 其他（Checkbox/Radio/Tree/Upload/Steps/Empty 等） | bg、文字色 |

---

## 四、全局 CSS 模板

生成项目时，在 `src/style.css` 中包含以下全局覆盖块（无 scoped）：

```css
/* =============================================
   Element Plus Teleport 组件 Dark 模式全局覆盖
   这些组件挂载到 <body>，scoped 样式无法穿透
   ============================================= */

/* --- Select 下拉 --- */
html.dark .el-select-dropdown {
  background: var(--bg-card) !important;
  border-color: var(--border-default) !important;
}
html.dark .el-select-dropdown__item {
  color: var(--text-primary) !important;
}
html.dark .el-select-dropdown__item.is-hovering {
  background: var(--bg-card-hover) !important;
}
html.dark .el-select-dropdown__item.is-selected {
  color: var(--accent-primary) !important;
}

/* --- Dialog --- */
html.dark .el-dialog {
  background: var(--bg-card) !important;
}
html.dark .el-dialog__title {
  color: var(--text-primary) !important;
}
html.dark .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-secondary) !important;
}
html.dark .el-dialog__body {
  color: var(--text-primary) !important;
}

/* --- Drawer --- */
html.dark .el-drawer {
  background: var(--bg-card) !important;
}
html.dark .el-drawer__title {
  color: var(--text-primary) !important;
}

/* --- DatePicker 面板 --- */
html.dark .el-picker-panel {
  background: var(--bg-card) !important;
  border-color: var(--border-default) !important;
}
html.dark .el-date-table th {
  color: var(--text-secondary) !important;
  border-bottom-color: var(--border-default) !important;
}
html.dark .el-date-table td.available {
  color: var(--text-primary) !important;
}
html.dark .el-date-table td.current {
  background: var(--accent-primary) !important;
  color: #000 !important;
}
html.dark .el-date-table td.today {
  color: var(--accent-primary) !important;
}
html.dark .el-date-table td.disabled {
  color: var(--text-muted) !important;
}
html.dark .el-date-table td.available:hover {
  background: var(--bg-card-hover) !important;
}

/* --- Dropdown --- */
html.dark .el-dropdown-menu {
  background: var(--bg-card) !important;
  border-color: var(--border-default) !important;
}
html.dark .el-dropdown-menu__item {
  color: var(--text-primary) !important;
}
html.dark .el-dropdown-menu__item:hover {
  background: var(--bg-card-hover) !important;
}

/* --- Popover / Tooltip --- */
html.dark .el-popper {
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-default) !important;
}

/* --- Cascader --- */
html.dark .el-cascader__dropdown {
  background: var(--bg-card) !important;
}

/* --- Message / Notification / MessageBox --- */
html.dark .el-message {
  background: var(--bg-card) !important;
  border-color: var(--border-default) !important;
}
html.dark .el-message__content {
  color: var(--text-primary) !important;
}
html.dark .el-notification {
  background: var(--bg-card) !important;
  border-color: var(--border-default) !important;
}
html.dark .el-notification__title {
  color: var(--text-primary) !important;
}
html.dark .el-message-box {
  background: var(--bg-card) !important;
}
html.dark .el-message-box__title {
  color: var(--text-primary) !important;
}
html.dark .el-message-box__message {
  color: var(--text-secondary) !important;
}

/* --- Overlay 遮罩 --- */
html.dark .el-overlay {
  background: rgba(0, 0, 0, 0.6) !important;
}
```

---

## 五、从 Figma 提取 CSS 属性的检查清单

调用 `get_design_context` 后，对每个 UI 元素提取以下属性用于 CSS 覆盖：

```
□ 背景色 (background / background-color)
□ 文字色 (color)
□ 字号 (font-size)         — 以 Figma 为准，Token 仅作为缺失时兜底
□ 字重 (font-weight)
□ 行高 (line-height)
□ 字间距 (letter-spacing)
□ 边框 (border: width style color)
□ 圆角 (border-radius)
□ 内边距 (padding: top right bottom left)
□ 外边距 (margin / gap)    — Figma auto-layout gap
□ 阴影 (box-shadow)
□ 宽度/高度 (width / height / min-width / min-height)
□ Hover 态变化
□ Active/Pressed 态变化
□ Disabled 态样式
□ Focus 态样式
```

---

## 六、自检清单（生成代码后执行）

生成所有文件后，快速自检以下 3 点：

1. **Teleport 组件**：`el-select-dropdown`、`el-dialog`、`el-picker-panel` 等是否写了全局 CSS（无 scoped）？
2. **Dark 模式**：`html.dark` 下是否覆盖了 Table、Input、Select、Pagination、Dialog 这 5 个高频组件的 bg、text、border？
3. **scoped 与 :deep()**：组件内 EL 子元素是否用 `:deep()` 穿透？是否有用 `>>>` 或 `::v-deep`？（Vue 3 不支持）
