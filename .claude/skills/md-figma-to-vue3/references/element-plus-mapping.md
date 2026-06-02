# Figma 组件 → Element Plus 组件映射

基于 Figma 组件库（`62lfkdpu51JTVjGo7pvHJk`，页面 `5:4144: 组件`）与 Element Plus 2.x 的映射关系。

## 映射规则

1. 先查 Code Connect（`*.figma.ts`），若有映射直接用
2. 无 Code Connect 时按本表映射
3. Figma Variant → Element Plus props
4. Figma 实例属性 → Element Plus slot/enum

## 导航

| Figma 组件 | Element Plus | Props 映射 |
|-----------|-------------|-----------|
| `导航/大` (样式=选中/默认) | `ElMenu` + `router` mode | `default-opened` / `active` → `default-active` |

## 菜单

| Figma 组件 | Element Plus | Props 映射 |
|-----------|-------------|-----------|
| `菜单` (等级=一级) | `el-menu-item` | — |
| `菜单` (等级=二级) | `el-sub-menu` > `el-menu-item` | — |
| 样式=选中 | `el-menu-item` `active` | 通过当前路由自动高亮 |
| 样式=默认 | `el-menu-item` | — |
| `菜单icon` | `<el-icon>` + inline SVG/icon component | — |

## 按钮

Figma 按钮有复杂变体系统：
```
应用位置 × 风格 × 样式 × 类型 × icon位置
```

| Figma Variant | Element Plus | 映射 |
|--------------|-------------|------|
| 风格=填充, 类型=蓝色 | `<el-button type="primary">` | — |
| 风格=填充, 类型=红色 | `<el-button type="danger">` | — |
| 风格=填充, 类型=灰色 | `<el-button>` (default) | — |
| 风格=填充, 类型=白色 | `<el-button type="default" plain>` | bg white |
| 风格=线框 | `<el-button plain>` | — |
| 风格=无 | `<el-button link>` / `text` | — |
| 样式=icon, icon位置=左 | `<el-button :icon="...">` | icon slot |
| 样式=icon, icon位置=右 | slot `#default` + icon after text | — |
| 样式=文本 | `<el-button>` (纯文本) | — |
| 应用位置=列表 | `size="small"` | — |

## 表单

| Figma 组件 | Element Plus | 状态映射 |
|-----------|-------------|---------|
| `输入框` (默认) | `<el-input>` | — |
| `输入框` (已录入) | `<el-input>` + `v-model` value | — |
| `输入框` (不可编辑) | `<el-input disabled>` | — |
| `下拉选择` (默认) | `<el-select>` | — |
| `下拉选择` (已录入) | `<el-select>` + value | — |
| `下拉选择` (不可编辑) | `<el-select disabled>` | — |
| `多选` (默认) | `<el-select multiple>` | — |
| `日期选择` | `<el-date-picker type="date">` | — |
| `日期时间范围选择` | `<el-date-picker type="datetimerange">` | — |
| `图片选择` | `<el-upload list-type="picture-card">` | — |
| `文件上传` | `<el-upload drag>` | — |
| `带快捷操作` | `<el-date-picker>` + `shortcuts` prop | — |

## 列表/表格

| Figma 组件 | Element Plus | 映射 |
|-----------|-------------|------|
| `搜索框` (默认/录入) | `<el-input v-model="searchText" clearable>` | prefix-icon Search |
| `筛选框` (默认/录入) | `<el-select>` + filterable | — |
| `时间段选择框` | `<el-date-picker type="daterange">` | — |
| `列表/表头按钮` (排序升序) | `ElTable` `sortable="custom"` | sort-method |
| `列表/表头按钮` (排序降序) | `ElTable` `sortable="custom"` | sort-method |
| `列表/表头按钮` (筛选) | `ElTable` `filters` + `filter-method` | — |
| `列表/表头按钮` (说明) | `<el-tooltip>` + `<el-icon>` | — |

## 标签/Tag

| Figma Variant | Element Plus | 映射 |
|--------------|-------------|------|
| 颜色=蓝色, 样式=填充 | `<el-tag type="primary">` | — |
| 颜色=绿色, 样式=填充 | `<el-tag type="success">` | — |
| 颜色=红色, 样式=填充 | `<el-tag type="danger">` | — |
| 颜色=黄色, 样式=填充 | `<el-tag type="warning">` | — |
| 颜色=橙色, 样式=填充 | `<el-tag type="warning">` + custom color | — |
| 颜色=灰色, 样式=填充 | `<el-tag type="info">` | — |
| 样式=线框 | `<el-tag effect="plain">` | — |
| 样式=icon | `<el-tag closable>` / 自定义 icon slot | — |

## 其他组件

| Figma 组件 | Element Plus | 映射 |
|-----------|-------------|------|
| `switch` (开/关) | `<el-switch>` | v-model boolean |
| `check` (选中/未选中) | `<el-checkbox>` | — |
| `方向` (上/下/左/右) | `<el-icon>` + direction icon | — |
| `气泡弹窗背景` | `<el-popover>` / `<el-tooltip>` | — |
| `展开折叠` | `<el-icon>` + toggle | `<Fold>` / `<Expand>` |
| `树型结构` (一级/二级) | `<el-tree>` | :data, :props |
| `树型结构` (默认/告警) | `<el-tree>` + slot | scoped slot 自定义 |
| `报告/报表` (日报/周报/月报) | 自定义卡片组件 | `<el-card>` + layout |

## 不确定时的处理

当 Figma 元素无法明确映射时，按以下优先级处理：

0. **先查组件注册表** — 读取 [component-registry.md](component-registry.md)，按匹配算法（容器模式 + 语义标签 + 上下文位置 + 视觉特征，≥70% 判定复用）检查是否有已注册的业务组件。若有直接复用，跳过后续步骤
1. **优先 Element Plus 最接近组件** — 即使不完全匹配，用 props 调整
2. **组合基础组件** — 如 `el-card` + `el-table` + `el-pagination`
3. **自定义组件** — 仅当前两步不可行时，用 `<template>` + 基础 HTML + 设计 token CSS 变量。**新建后必须追加完整定义到 component-registry.md**
4. **标注不确定** — 在方案确认阶段的映射清单中标注 `⚠️` 标记
