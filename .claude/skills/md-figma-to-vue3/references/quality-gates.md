# 质量自检清单

代码生成完成后，逐条自检。每项不通过则修正后重新生成。

## 1. 字号合规

**检查**：grep 所有 `font-size`，若有不在 24/20/18/16/14/12 px 范围内的值，确认是否来自 Figma 设计稿。

```
grep -rn 'font-size' src/ | grep -v '24px\|20px\|18px\|16px\|14px\|12px'
```

- 无输出 → 直接通过
- 有输出 → 逐项确认：值为 Figma 设计稿实际值 → 通过；值为非标准且无 Figma 来源 → 修正为标准值
- 设计稿字号必须在阶段 3「Token 差异报告」中有记录

## 2. 颜色使用设计令牌

**检查**：业务代码中不应出现硬编码 hex 色值。颜色应引用 CSS 变量。

```
grep -rn '#[0-9A-Fa-f]\{6\}\|#[0-9A-Fa-f]\{3\}' src/ | grep -v 'node_modules' | grep -v '.svg'
```

仅 `style.css` 中的 CSS 变量定义可包含 hex，其余文件不应有。

## 3. Light/Dark 双主题

**检查**：
- `style.css` 必须包含 `:root {` 和 `html.dark {` 两个块
- 两个块必须包含相同变量名的不同色值
- 必须存在 `src/stores/theme.ts`（主题 Store, localStorage 持久化）
- 必须存在 `src/components/base/ThemeToggle.vue`（切换按钮）
- `index.html` 的 `<html>` 需有初始 `class` 或 JS 读取 localStorage

## 4. 图标占位

**检查**：
- `src/assets/icons/` 目录必须存在
- 目录下必须有语义化命名的 `.svg` 文件（不少于设计中用到的图标数）
- 项目根目录必须存在 `ICONS.md`，包含：
  - 图标名称、文件名、用途
  - Figma 来源（组件名 / 节点 ID）
  - 替换指引

## 5. EL 组件样式覆盖精度

**检查**：对照 [style-override-guide.md](style-override-guide.md)，每个使用的 EL 组件是否完成了视觉覆盖：

- [ ] 每个 `<el-input>` / `<el-select>` 的 wrapper 是否有 border、bg、border-radius、min-height 覆盖？
- [ ] 每个 `<el-table>` 的表头、表体、hover 行、border 是否有覆盖？
- [ ] 每个 `<el-button>` 的每个 type 变体（primary/danger/default）是否有 bg、text color、border、hover 覆盖？
- [ ] 每个 `<el-tag>` 的业务状态是否有独立的 bg + color 覆盖（而非只用 type="primary/success/danger"）？
- [ ] 所有 Teleport 组件（el-select-dropdown、el-dialog、el-picker-panel、el-dropdown-menu、el-cascader__dropdown、el-popper、el-message、el-notification、el-message-box）的样式是否写在**全局 `<style>` 块（无 scoped）**中？
- [ ] 所有 scoped 内 EL 子元素覆盖是否使用 `:deep()` 而非 `>>>` / `::v-deep`？

**检查命令**：
```bash
# 检查 Teleport 组件是否有全局 CSS 覆盖
grep -rn 'el-select-dropdown\|el-dialog\|el-picker-panel\|el-dropdown-menu\|el-cascader__dropdown\|el-popper' src/style.css
# 检查是否有错误的 Vue 2 深度选择器
grep -rn '>>>\|::v-deep\|/deep/' src/
```

无 Vue 2 选择器 + style.css 有 Teleport 覆盖 = 通过。

## 6. Element Plus 行为层及深色模式

**检查**：
- `el-select`、`el-switch`、`el-pagination` 等组件有 `<style scoped>` 覆盖其默认样式
- **Dark 适配完整性**（对照 code-templates.md §4.4 清单）：
  - Loading 遮罩：`el-loading-mask` 已覆盖 bg
  - Switch：`el-switch__core` 已覆盖 bg
  - Pagination 全区域：页码、prev/next、每页条数下拉、跳页输入框
  - Select 下拉面板：全局 CSS 已覆盖 `.el-select-dropdown`
  - Select 输入框：同时写 `.el-select__wrapper` 和 `.el-input__wrapper`
  - Teleport 组件覆盖时使用 `!important`
- 不存在 `--el-color-*` 变量用于配色

## 7. 自适应布局

**检查**：
- 侧栏有 `@media (max-width: 1280px)` 收起为图标模式 + JS matchMedia 监听
- 表格使用 `table-layout: auto`，不允许 `min-width` 导致永久横向滚动条
- 表格列分为核心列（始终显示）和次要列（断点隐藏），至少含 `@media (max-width: 1550px)` 和 `(max-width: 1250px)` 两层隐藏
- 列隐藏使用 `display: none !important` 确保生效
- 分页在 `≤800px` 纵向排列
- Header 用户区域在 `≤1100px` 隐藏非必要元素
- 筛选栏不产生横向溢出（`.filter-left` 已 `flex-wrap`，控件数过多时缩小宽度而非溢出）

## 8. 组件封装与复用

**检查**：
- 新建的业务组件是否已在 [component-registry.md](component-registry.md) 中注册（索引表有对应行 + 文件末尾有完整定义）
- 注册表条目是否包含五项必填：Props / Emits / Slots / CSS 变量依赖 / 视觉特征
- 注册表中已注册的组件在 `views/` 中引用时，文件路径是否与注册表「文件位置」一致
- 相同 UI 块出现 ≥2 次是否已抽取到 `components/business/`；首次出现的通用 UI 模式是否也已抽取为组件并注册
- 组件是否通过 Props 暴露语义化接口（非 `color: string` 这类宽泛类型）
- 跨页面相同功能（如 Tag、按钮、弹窗）是否使用同一组件
- 分页器配置（`page-sizes`、`layout`）在多个页面是否一致
- 弹窗宽度、按钮位置、loading 态处理是否统一

## 10. 全局 CSS 使用检查

**检查**：页面 scoped CSS 中是否重复定义了 style.css 已有的全局类。

```
# 检查 scoped 中是否重新定义了全局筛选栏/表格/分页类
grep -rn '\.filter-bar\b\|\.filter-left\b\|\.fi-input\b\|\.fi-table\b\|\.fi-thead-tr\b\|\.fi-tbody-tr\b\|\.fi-td\b\|\.pagination-wrap\b\|\.pagi-total\b\|\.action-cell\b' src/views/ src/components/

# 检查是否使用了 el-table（应使用原生 <table class="fi-table">）
grep -rn '<el-table' src/views/
```

- 无输出 → 通过
- 有 `.filter-bar` 等在 scoped 中的重定义 → 删除 scoped 重复定义，改用全局类
- 有 `<el-table` → 改为原生 `<table class="fi-table">`（除非该页面需要 el-table 独有的排序/固定列/树形展开等交互，且这些交互确实被使用）
- `<el-table` 仅允许在以下场景保留：
  - 需要多列排序且排序状态需持久化到 URL
  - 需要固定列（fixed="right"）且列数 > 8
  - 需要树形数据展开（row-tree）—— 但项目目前无此场景

## 自检流程

```
生成代码 → 逐条检查(1-10) → 不通过项修正 → 重新生成 → 再检查 → 全部通过 → 输出给用户
```

> 质量门 #5（样式覆盖精度）、#6（Dark 适配）、#8（组件复用）、#9（el-dialog 稳定性）和 #10（全局 CSS 使用）是最容易遗漏的，生成多个页面时优先检查。

---

## 9. el-dialog 内容切换稳定性

**问题**：`el-dialog` 内部用 `v-if` 切换大片内容会触发 DOM 增删，Element Plus 可能将布局重算解读为关闭信号，导致 `update:modelValue(false)` 意外 emit，弹窗闪退。

**检查项**：

- [ ] 搜索所有 `<el-dialog>` 内部的 `<template v-if>` / `<div v-if>` 切换，确认不存在切换大片内容块（如 Tab 面板、分类列表）的 `v-if`：
  ```bash
  grep -n 'el-dialog' src/ -l | xargs -I{} sh -c 'echo "=== {} ==="; grep -n "v-if" {}'
  ```
- [ ] 上述场景应使用 `v-show` 替代 `v-if`——只改 `display`，DOM 树结构不变
- [ ] 弹窗可见性控制优先用 **父组件 `v-if` 挂载/卸载**，而非 `v-model:visible` + prop→watch→ref 同步链：
  ```vue
  <!-- ✅ 推荐：父组件 v-if 控制挂载 -->
  <MyDialog v-if="visible" :data="data" @close="visible = false" @confirm="onConfirm" />

  <!-- ❌ 避免：visible prop 透传到 el-dialog 再 watch 同步 -->
  ```
- [ ] 弹窗组件内部用局部 `ref(true)` 初始化 `dialogVisible`，确认/取消/关闭时 emit `close` 事件
- [ ] 弹窗内 Tab 按钮加 `type="button"` 防止默认表单提交行为

**验证**（必须手动测试，静态检查无法覆盖）：

| 场景 | 验证点 |
|---|---|
| 弹窗内 Tab/分类切换 | 弹窗不闪退 |
| 弹窗内搜索/筛选 | 列表过滤正确，选中态保持 |
| 确认后回显 | 父页面可见已选结果 |
| 再次打开弹窗 | 上次已选/默认值回显正确 |
| 暗色主题 | 弹窗/Tab/列表/搜索框正常 |
| 快速连续点击 | 无竞态关闭或状态错乱 |
