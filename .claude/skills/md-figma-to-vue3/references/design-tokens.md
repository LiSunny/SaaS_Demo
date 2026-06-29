# Design Tokens — 人工智能公共安全管理平台

> 来源：Figma `62lfkdpu51JTVjGo7pvHJk` Token JSON 导出，共 82 个 token。

## 一、文字排版 (10 tokens)

| 分组 | Token | 值 |
|------|-------|----|
| fontSize | `fontSize/h1` | 24px |
| | `fontSize/h2` | 20px |
| | `fontSize/h3` | 18px |
| | `fontSize/h4` | 16px |
| | `fontSize/body` | 16px |
| | `fontSize/small` | 14px |
| | `fontSize/xs` | 12px |
| fontWeight | `fontWeight/regular` | 400 |
| | `fontWeight/medium` | 500 |
| | `fontWeight/blod` | 900 |

**字体**：Alibaba PuHuiTi（H1 Bold, H2-H4 Medium, Body-XS Regular）

### 强制映射：UI 元素 → 令牌（代码生成必须遵守）

生成代码时，每个 UI 元素必须使用以下指定的令牌，**不可根据 Figma 页面设计稿中的字号自行决定**：

| UI 元素类型 | 令牌 | 字号 | 字重 | CSS 变量 |
|-----------|------|------|------|---------|
| 页面大标题 | `fontSize/h1` | 24px | Bold(900) | `var(--font-h1)` |
| 区块标题 | `fontSize/h2` | 20px | Medium(500) | `var(--font-h2)` |
| 卡片标题 | `fontSize/h3` | 18px | Medium(500) | `var(--font-h3)` |
| 表格表头 | `fontSize/h4` | 16px | Regular(400) | `var(--font-h4)` |
| 顶部导航菜单项 | `fontSize/h3` | 18px | Medium(500) | `var(--font-h3)` |
| 侧栏菜单项（一级/二级） | `fontSize/body` | 16px | Regular(400) | `var(--font-body)` |
| 表格表体文字 | `fontSize/body` | 16px | Regular(400) | `var(--font-body)` |
| 输入框文字 | `fontSize/body` | 16px | Regular(400) | `var(--font-body)` |
| 下拉选择文字 | `fontSize/body` | 16px | Regular(400) | `var(--font-body)` |
| 按钮文字 | `fontSize/small` | 14px | Regular(400) | `var(--font-small)` |
| Tag 标签 | `fontSize/small` | 14px | Regular(400) | `var(--font-small)` |
| 分页/辅助说明文字 | `fontSize/small` | 14px | Regular(400) | `var(--font-small)` |
| 角标/占位提示 | `fontSize/xs` | 12px | Regular(400) | `var(--font-xs)` |

> **Figma 页面字号冲突处理**：当 Figma 设计稿中某元素的字号与上表不一致时（如按钮用了 15px、菜单用了 18px），**以 Figma 设计稿为准**。上表令牌值仅作为缺失时的兜底默认值。Figma 中的实际字号直接使用，不需要强制对齐到令牌值。

## 二、间距 (8 tokens)

| Token | `0` | `2` | `4` | `6` | `8` | `12` | `16` | `24` |
|-------|-----|-----|-----|-----|-----|------|------|------|
| px | 0 | 2 | 4 | 6 | 8 | 12 | 16 | 24 |

使用 4px 基数网格系统。

## 三、圆角 (4 tokens)

| Token | `sm` | `md` | `lg` | `xl` |
|-------|------|------|------|------|
| px | 6 | 8 | 10 | 14 |

**Element Plus 圆角映射**：
| Figma | Element Plus | 用途 |
|-------|-------------|------|
| `sm` 6px | `--el-border-radius-base` | 标签/徽章/输入框 |
| `md` 8px | `--el-border-radius-round` | 按钮 |
| `lg` 10px | 自定义 | 卡片 |
| `xl` 14px | 自定义 | 弹窗/对话框 |

## 三-B、按钮令牌 (12 tokens)

> 按钮的视觉属性抽象为独立令牌，避免每个页面重复定义。按钮是基础 UI，样式在 `style.css` 中通过全局 `.btn-*` 类统一定义。

### 共享基类

| Token | 值 | 用途 |
|-------|-----|------|
| `--btn-height` | `37px` | 按钮高度 |
| `--btn-radius` | `var(--radius-md)` = 8px | 按钮圆角 |
| `--btn-padding-x` | `var(--spacing-lg)` = 12px | 按钮水平内边距 |
| `--btn-padding-y` | `var(--spacing-md)` = 8px | 按钮垂直内边距 |
| `--btn-font-size` | `var(--font-small)` = 14px | 按钮字号 |
| `--btn-font-weight` | `400` | 按钮字重 |
| `--btn-gap` | `var(--spacing-md)` = 8px | 按钮内图标与文字间距 |

### 变体

| Token | 值 | 用途 |
|-------|-----|------|
| `--btn-primary-bg` | `var(--accent-primary)` | primary 背景 |
| `--btn-primary-hover-bg` | `var(--accent-dark)` | primary hover 背景 |
| `--btn-primary-color` | `#fff` | primary 文字色 |
| `--btn-danger-bg` | `var(--danger)` | danger 背景 |
| `--btn-danger-color` | `#fff` | danger 文字色 |
| `--btn-default-border` | `var(--border-default)` | default 边框 |
| `--btn-default-color` | `var(--text-secondary)` | default 文字色 |
| `--btn-default-hover-color` | `var(--accent-primary)` | default hover 文字色 |
| `--btn-default-hover-border` | `var(--accent-primary)` | default hover 边框 |

> 按钮样式在 `style.css` 中以全局 CSS 类形式生成。详见 [code-templates.md §4.5](code-templates.md)。

---

## 四、Light 主题颜色 (33 tokens)

### Background
| Token | Hex | 用途 |
|-------|-----|------|
| `background/main` | `#F0F1F6` | 页面底色 |
| `background/card` | `#FFFFFF` | 卡片 |
| `background/sub-card` | `#FBFBFB` | 嵌套区域 |
| `background/card-hover` | `#939393` | 卡片悬停 |

### Text
| Token | Hex | 用途 |
|-------|-----|------|
| `text/primary` | `#101010` | 主文字 |
| `text/secondary` | `#2E2E2E` | 次要文字 |
| `text/tertiary` | `#454545` | 三级文字 |
| `text/muted` | `#5E5E5E` | 禁用/占位 |
| `text/placeholder` | `#D9D9D9` | 输入框占位文字 |

### Accent
| Token | Hex | 用途 |
|-------|-----|------|
| `accent/primary` | `#3678E3` | 品牌主色 |
| `accent/primary10%` | `#3678E3` α=10% | 主色浅底 |
| `accent/dark` | `#204785` | 深色变体 |

### Border
| Token | Hex | 用途 |
|-------|-----|------|
| `border/high` | `#D3D3D3` | 高对比 |
| `border/default` | `#E9E9E9` | 默认 |
| `border/low` | `#F3F3F3` | 低对比 |
| `border/hover` | `#3678E3` α=19% | 悬停态 |

### Semantic（各含主色 + `-bg` α=10% + `-border` α=20%）
| Token | Hex | 用途 |
|-------|-----|------|
| `semantic/success` | `#059669` | 成功 |
| `semantic/warning` | `#D97706` | 警告 |
| `semantic/danger` | `#DC2626` | 危险/错误 |
| `semantic/info` | `#3678E3` | 信息 |
| `semantic/notice` | `#CA8A04` | 注意 |
| `semantic/normal` | `#364153` | 中性/默认态 |
| `semantic/normal-bg` | `#F3F4F6` | 中性浅底 |
| `semantic/normal-border` | `#ACBCD5` | 中性边框 |

## 五、Dark 主题颜色 (33 tokens)

### Background
| Token | Hex | 用途 |
|-------|-----|------|
| `background/main` | `#002B59` | 页面底色 |
| `background/card` | `#00336A` | 卡片 |
| `background/sub-card` | `#003670` | 嵌套区域 |
| `background/card-hover` | `#F9FAFB` α=8% | 卡片悬停 |

### Text
| Token | Hex | 用途 |
|-------|-----|------|
| `text/primary` | `#FFFFFF` | 主文字 |
| `text/secondary` | `#C5C5C5` | 次要文字 |
| `text/tertiary` | `#DDDDDD` | 三级文字 |
| `text/muted` | `#8892B0` | 禁用/占位 |
| `text/placeholder` | `#FFFFFF` | 输入框占位文字 |

### Accent
| Token | Hex | 用途 |
|-------|-----|------|
| `accent/primary` | `#3DD1E2` | 品牌主色 |
| `accent/primary10%` | `#00E5FF` α=10% | 主色浅底 |
| `accent/dark` | `#0091EA` | 深色变体 |

### Border
| Token | Hex | 用途 |
|-------|-----|------|
| `border/high` | `#004E7E` | 高对比 |
| `border/default` | `#00426B` | 默认 |
| `border/low` | `#00436D` α=69% | 低对比 |
| `border/hover` | `#00E5FF` α=20% | 悬停态 |

### Semantic（各含主色 + `-bg` α=13% + `-border` α=25%）
| Token | Hex | 用途 |
|-------|-----|------|
| `semantic/success` | `#4CAF50` | 成功 |
| `semantic/warning` | `#FF9800` | 警告 |
| `semantic/danger` | `#F44336` | 危险/错误 |
| `semantic/info` | `#00E5FF` | 信息 |
| `semantic/notice` | `#FFD600` | 注意 |
| `semantic/normal` | `#B9B9B9` | 中性/默认态 |
| `semantic/normal-bg` | `#B9B9B9` α=15% | 中性浅底 |
| `semantic/normal-border` | `#B9B9B9` α=25% | 中性边框 |

## 六、Element Plus CSS 变量完整映射

> ⚠️ **重要**：以下映射必须写入 `style.css` 的 `:root` 和 `html.dark` 块中，不可只保留在本文档。若缺失，所有 Element Plus 组件（按钮、弹窗、标签、输入框等）将使用 Element Plus 默认值（如主色 `#409EFF`），与设计系统不一致。

在 `<style>` 中使用以下映射，通过 CSS 变量覆盖 Element Plus 默认主题：

```css
:root {
  /* === 主色 === */
  --el-color-primary: #3678E3;
  --el-color-primary-light-3: #5e93eb;
  --el-color-primary-light-5: #86aef0;
  --el-color-primary-light-7: #afc9f5;
  --el-color-primary-light-8: #c3d7f8;
  --el-color-primary-light-9: #d7e5fa;
  --el-color-primary-dark-2: #2b60b6;

  /* === 语义色 === */
  --el-color-success: #059669;
  --el-color-warning: #D97706;
  --el-color-danger: #DC2626;
  --el-color-info: #3678E3;

  /* === 背景 === */
  --el-bg-color: #E4E4E4;
  --el-bg-color-page: #E4E4E4;
  --el-bg-color-overlay: #FFFFFF;
  --el-fill-color-blank: #FFFFFF;
  --el-fill-color-light: #FBFBFB;
  --el-fill-color: #F3F3F3;
  --el-fill-color-lighter: #FBFBFB;

  /* === 文字 === */
  --el-text-color-primary: #101010;
  --el-text-color-regular: #2E2E2E;
  --el-text-color-secondary: #5E5E5E;
  --el-text-color-placeholder: #5E5E5E;
  --el-text-color-disabled: #D3D3D3;

  /* === 边框 === */
  --el-border-color: #E9E9E9;
  --el-border-color-light: #F3F3F3;
  --el-border-color-lighter: #FBFBFB;
  --el-border-color-dark: #D3D3D3;
  --el-border-color-hover: rgba(54, 120, 227, 0.19);

  /* === 字号 === */
  --el-font-size-large: 24px;
  --el-font-size-base: 16px;
  --el-font-size-small: 14px;
  --el-font-size-extra-small: 12px;

  /* === 圆角 === */
  --el-border-radius-base: 6px;
  --el-border-radius-small: 4px;
  --el-border-radius-round: 8px;

  /* === 字体 === */
  --el-font-family: 'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* === Dark 主题 === */
html.dark {
  --el-color-primary: #00E5FF;
  --el-color-primary-light-3: #33eaff;
  --el-color-primary-light-5: #66efff;
  --el-color-primary-light-7: #99f4ff;
  --el-color-primary-light-8: #b3f7ff;
  --el-color-primary-light-9: #ccf9ff;
  --el-color-primary-dark-2: #00b7cc;

  --el-color-success: #4CAF50;
  --el-color-warning: #FF9800;
  --el-color-danger: #F44336;
  --el-color-info: #00E5FF;

  --el-bg-color: #002B59;
  --el-bg-color-page: #002B59;
  --el-bg-color-overlay: #00336A;
  --el-fill-color-blank: #00336A;
  --el-fill-color-light: #003670;
  --el-fill-color: #00426B;
  --el-fill-color-lighter: #003670;

  --el-text-color-primary: #FFFFFF;
  --el-text-color-regular: #C5C5C5;
  --el-text-color-secondary: #8892B0;
  --el-text-color-placeholder: #8892B0;
  --el-text-color-disabled: #004E7E;

  --el-border-color: #00426B;
  --el-border-color-light: rgba(0, 67, 109, 0.69);
  --el-border-color-lighter: #003670;
  --el-border-color-dark: #004E7E;
  --el-border-color-hover: rgba(0, 229, 255, 0.2);
}
```

## 七、间距在 Element Plus 中的应用

Element Plus 组件默认间距通过 CSS 变量控制，可覆盖以下变量以匹配设计系统：

```css
:root {
  --el-component-size: 32px;
  --el-component-size-large: 40px;
  --el-component-size-small: 24px;
  --el-menu-item-height: 45px;
  --el-header-padding: 16px;
  --el-main-padding: 24px;
  --el-card-padding: 16px;
  --el-table-row-height: 45px;
  --el-input-height: 36px;
  --el-button-size-default: 32px;
}
```

## 八、Token 动态提取与对比

对每个目标 Figma 文件，调用 `get_variable_defs` 提取其变量，与以上标准 token 对比：

1. **匹配** → 直接应用映射表
2. **仅目标有** → 记为新增，补充到生成代码的 `:root` 中
3. **仅标准有** → 目标文件缺失，使用标准值兜底

对比结果在「阶段 3：方案确认」中呈现给用户。
