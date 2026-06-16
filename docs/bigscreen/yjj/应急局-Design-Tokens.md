# 应急局监管平台 — Design Tokens

> 从 Figma 设计稿 `应急局` (node 1:991) 提取
> 画布 1920×1080 · 44 种纯色 · 179 种渐变 · 20 种文字样式

---

## 一、颜色系统 (Color Palette)

### 🔵 品牌蓝系 (Brand Blue)

| Token | HEX | 用途 |
|-------|-----|------|
| `--blue-950` | `#003972` | 最深蓝（半透明遮罩） |
| `--blue-900` | `#00489b` | 深蓝底部光效 |
| `--blue-850` | `#00498e` | 深蓝半透明面板 |
| `--blue-800` | `#005a9b` | 椭圆深蓝 / `#0059ae` 渐变起始 / `#0056cd` 渐变端 |
| `--blue-750` | `#004a90` / `#014a90` | 卡片深蓝 |
| `--blue-700` | `#015eaf` | 背景径向渐变起始 |
| `--blue-650` | `#0060a5` | Subtract 标题背景 |
| `--blue-600` | `#0151a4` / `#0175b3` | 椭圆中蓝 |
| `--blue-550` | `#016e94` | 深蓝绿 |
| `--blue-500` | `#035fc8` | 标准品牌蓝 |
| `--blue-450` | `#0457a7` | 表头背景色 |
| `--blue-400` | `#166fc9` | 卡片蓝 |
| `--blue-350` | `#1865c6` / `#1966c8` | 中间区域渐变 |
| `--blue-300` | `#1457ad` | 底部区域渐变终点 |
| `--blue-200` | `#205cc2` | 半透明深蓝 |
| `--blue-100` | `#02397c` | 背景渐变深色终点 |

### 💧 辅助蓝系 (Accent Blue)

| Token | HEX | 用途 |
|-------|-----|------|
| `--accent-100` | `#ebf9ff` | 极浅蓝 |
| `--accent-200` | `#aeccff` / `#aedaff` | 表头文字浅蓝 |
| `--accent-300` | `#9dcbfe` | 英文副标题浅蓝 |
| `--accent-400` | `#7fc2ff` | 浅蓝矢量 |
| `--accent-500` | `#66b5ff` | 中浅蓝 |
| `--accent-600` | `#4baefa` | 渐变中蓝 |
| `--accent-700` | `#1e92ff` | 亮蓝标记 |
| `--accent-800` | `#148dff` | 进度条高亮蓝 |

### 🩱 青绿色系 (Cyan / Teal)

| Token | HEX | 用途 |
|-------|-----|------|
| `--cyan-100` | `#00d5ff` | 渐变亮青 |
| `--cyan-200` | `#3cd3d7` | 青绿面板 |
| `--cyan-300` | `#30c8d3` / `#36c3cd` | 进度条青绿 |
| `--cyan-400` | `#24c3e2` | 描边青 |
| `--cyan-500` | `#62c0e8` | 蓝青 |
| `--cyan-600` | `#12869d` | 渐变深青 |
| `--cyan-700` | `#2584ab` | 深蓝青 |
| `--cyan-800` | `#0094e6` | 亮蓝青 |

### 🟠 暖色点缀 (Warm / Amber)

| Token | HEX | 用途 |
|-------|-----|------|
| `--amber-100` | `#ffeaa4` | 金色渐变起点 |
| `--amber-200` | `#fdd23e` | 金色 |
| `--amber-300` | `#fecc39` | 亮金 |
| `--amber-400` | `#f5c28d` / `#fab670` / `#eaad6c` | 暖橙 |
| `--amber-500` | `#fdbb58` | 中橙 |
| `--amber-600` | `#ffc21a` / `#fdd542` | 亮橙 |
| `--amber-700` | `#d4b100` | 金色渐变终点 |
| `--amber-800` | `#fe9100` / `#fe911c` | 深橙 |
| `--amber-900` | `#fa6c21` | 橙红 |

### 🔴 警示色系 (Alert / Danger)

| Token | HEX | 用途 |
|-------|-----|------|
| `--red-100` | `#d93d45` | 红色半透明背景 |
| `--red-200` | `#fe3030` | 红色描边 |
| `--red-300` | `#f73e3e` | 未履职标记 |
| `--red-400` | `#ff4e51` | 红色数字 |
| `--red-500` | `#dd2828` | 深红矢量 |
| `--red-600` | `#ff0000` | 纯红描边 |

### ⚪ 中性色系 (Neutrals)

| Token | HEX | 用途 |
|-------|-----|------|
| `--white` | `#ffffff` | 白色文字/背景 |
| `--white-off` | `#fffdfd` | 近白 |
| `--gray-100` | `#f1f1f1` | 表行交替背景 |
| `--gray-300` | `#d9d9d9` | 中灰 |
| `--black-60` | `rgba(18, 18, 18, 0.58)` | 半透明黑 |
| `--black` | `#000000` | 纯黑矢量 |

---

## 二、渐变系统 (Gradients)

### 背景渐变

| Token | 类型 | 色值 | 用途 |
|-------|------|------|------|
| `--gradient-bg` | radial | `#015eaf` → `#02397c` | 主背景 |
| `--gradient-content` | radial | `#1865c6` → `#1966c8` → `#1457ad` | 中间内容区 |
| `--gradient-glow` | radial | `#00d5ff` → `#12869d` → `#02448f` | 顶部光晕 |

### 面板渐变

| Token | 类型 | 色值 | 用途 |
|-------|------|------|------|
| `--gradient-map` | linear | `#0056cd` → `#4baefa` → `#0056cd` | 地图面板 |
| `--gradient-card` | linear | `#03448f` → `#02387b` | 卡片背景 |
| `--gradient-card-alt` | linear | `#033b80` → `#0062bd` | 卡片背景交替 |
| `--gradient-dark` | linear | `#044582` → `#00498f` | 深色面板 |
| `--gradient-header` | linear | `#0059ae` → `#00498f` | 标题栏 |
| `--gradient-primary` | linear | `#014a90` → `#005fc1` | 主面板 |
| `--gradient-accent` | linear | `#0072f2` → `#044582` | 强调面板 |

### 暖色渐变

| Token | 类型 | 色值 | 用途 |
|-------|------|------|------|
| `--gradient-gold` | linear | `#ffeaa4` → `#fff5ce` → `#d4b100` → `#ffe134` | 金色点缀 |
| `--gradient-orange` | linear | `#fecc39` → `#fe9100` → `#fe911c` | 橙色点缀 |
| `--gradient-warm` | linear | `#fa6c21` → `#ffd358` | 橙黄警示 |
| `--gradient-yellow` | linear | `#ffc21a` → `#fdd542` | 黄色高亮 |

### 文字渐变

| Token | 类型 | 色值 | 用途 |
|-------|------|------|------|
| `--gradient-text-title` | linear | `#ffffff` → `#ce8511` | 标题文字渐变 |
| `--gradient-text-icon` | linear | `#d6f0ff` → `#a2d5ff` | 图标渐变 |
| `--gradient-text-accent` | linear | `#8fd5ff` → `#4cafff` | 图标亮蓝渐变 |

---

## 三、字体系统 (Typography)

| Token | 字体 | 字号 | 字重 | 用途 |
|-------|------|------|------|------|
| `--text-hero` | Source-KeynoteartHans | **36px** | Bold (900) | 大标题（港南区...监管平台） |
| `--text-h1` | Source-KeynoteartHans | **24px** | Bold (900) | 一级标题（地图标注地名） |
| `--text-h1-alt` | YouSheBiaoTiHei | **24px** | Regular (400) | 一级标题变体（数据标签如"10条"） |
| `--text-h2` | YouSheBiaoTiHei | **18px** | Regular | 二级标题（卡片标题） |
| `--text-h3` | YouSheBiaoTiHei | **16px** | Regular | 三级标题 |
| `--text-h4` | Source-KeynoteartHans | **16px** | Bold (900) | 四级标题（如"安全生产举报线索"） |
| `--text-number-xl` | Douyin Sans | **32px** | Bold | 特大数字（中心统计 999） |
| `--text-number-lg` | Douyin Sans | **24px** | Bold | 大数字（234家、10 次） |
| `--text-number-md` | Douyin Sans | **20px** | Bold | 中数字（18 家） |
| `--text-label-lg` | Douyin Sans | **18px** | Bold | 大标签（四象限类别名） |
| `--text-body-lg` | Alibaba PuHuiTi | **16px** | Regular / Medium | 正文大（表格内容） |
| `--text-body-md` | DingTalk JinBuTi | **16px** | Regular | 正文中（界面文字） |
| `--text-body-heiti` | Heiti TC | **16px** | Medium | 正文中（如"10 次"） |
| `--text-body-sm` | Alibaba PuHuiTi | **14px** | Regular | 正文小（已履职/未履职） |
| `--text-caption` | Alibaba PuHuiTi | **12px** | Regular | 辅助文字 / 角标 |
| `--text-en-subtitle` | Helvetica Neue | **20px** | Medium Italic | 英文副标题 |
| `--text-en-small` | DingTalk JinBuTi | **14px** | Regular | 小英文/时间 |

### 文字颜色

| Token | 颜色 | 用途 |
|-------|------|------|
| `--text-primary` | `#ffffff` | 主要文字 |
| `--text-secondary` | `#9dcbfe` | 英文副标题文字 |
| `--text-header` | `#aedaff` | 表头文字 |
| `--text-danger` | `#ff4e51` / `#f73e3e` | 警示文字 |
| `--text-gradient-title` | `#ffffff` → `#ce8511` | 标题渐变文字 |

---

## 四、间距系统 (Spacing)

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-xs` | **3px** | 极小间距 |
| `--space-sm` | **4px** | 小间距 |
| `--space-sm2` | **5px** | 小间距变体 |
| `--space-sm3` | **6px** | 小间距变体 |
| `--space-md` | **8px** | 中等间距（卡片内容） |
| `--space-md2` | **10px** | 中等间距变体（表格单元格） |
| `--space-md3` | **11px** | 中等间距变体 |
| `--space-lg` | **12px** | 较大间距 |
| `--space-lg2` | **13px** | 较大间距变体 |
| `--space-lg3` | **14px** | 较大间距变体 |
| `--space-xl` | **16px** | 大间距（卡片内边距） |
| `--space-xl2` | **18px** | 大间距变体 |
| `--space-2xl` | **22px** | 特大间距 |
| `--space-2xl2` | **26px** | 特大间距变体 |
| `--space-3xl` | **27px** | 超大间距 |
| `--space-3xl2` | **33px** | 超大间距变体 |
| `--space-4xl` | **49px** | 最大间距 |

### 页面级间距

| Token | 值 | 用途 |
|-------|-----|------|
| `--page-gutter` | **16px** | 页面水平内边距（内容区距边缘） |
| `--column-gap` | **16px** | 三列之间间距（左448 + 中960 + 右448） |
| `--card-gap` | **16px** | 卡片之间纵向间距 |

---

## 五、圆角系统 (Border Radius)

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | **1px** | 极小圆角 |
| `--radius-md` | **2px** | 小圆角（分割线、进度条） |
| `--radius-lg` | **4px** | 中圆角（卡片、按钮） |
| `--radius-xl` | **8px** | 大圆角（面板） |

---

## 六、描边系统 (Strokes)

| Token | 颜色 | 宽度 | 用途 |
|-------|------|------|------|
| `--border-cyan` | `#24c3e2` | **2px** | 地图面板描边 |
| `--border-blue` | `#0180d6` | **1px** | 六边形图标描边 |
| `--border-accent` | `#0094e6` | **1px** | 标题区域描边 |
| `--border-teal` | `#3cd3d7` | **1px** | 青绿色卡片描边 |
| `--border-warm` | `#fab670` | **1px** | 暖色装饰描边 |
| `--border-danger` | `#f73e3e` / `#fe3030` / `#ff0000` | **1-2px** | 红色警示描边 |

---

## 七、阴影系统 (Effects)

> 此设计稿未使用任何 DROP_SHADOW / INNER_SHADOW 效果。

---

## 八、Figma 变量 (Local Variables)

| 变量名 | 类型 | 说明 |
|--------|------|------|
| `字体-蓝色线性渐变` | GRADIENT | 字体蓝色线性渐变 |
| `icon淡蓝渐变` | GRADIENT | 图标淡蓝渐变 |
| `图标渐变` | GRADIENT | 图标渐变 |
| `标题渐变` | GRADIENT | 标题渐变 |

> 注意：此文件无本地 variable collections（color/number/string 类型变量为空），所有颜色均以 hardcoded fills 形式存在。渐变以局部 paint 形式定义。

---

## 九、布局 Token (Layout)

| Token | 值 | 用途 |
|-------|-----|------|
| `--canvas-width` | **1920px** | 画布宽度 |
| `--canvas-height` | **1080px** | 画布高度 |
| `--header-height` | **86px** | 顶部导航栏高度 |
| `--content-top` | **97px** | 内容区起始 Y |
| `--sidebar-width` | **448px** | 左侧/右侧面板宽度 |
| `--center-width` | **960px** | 中间内容区宽度 |
| `--card-min-height` | **~286-356px** | 卡片高度范围 |
| `--card-title-height` | **46px** | 卡片标题栏高度 |
| `--table-row-height` | **42px** | 表格行高度 |
| `--table-header-height` | **30-42px** | 表头高度 |
| `--icon-size-sm` | **22-24px** | 小图标 |
| `--icon-size-md` | **26px** | 中图标 |
| `--icon-size-lg` | **30px** | 大图标（定位点） |
| `--hexagon-size` | **64.67px** | 六边形图标尺寸 |
| `--progress-bar-height` | **8px** | 进度条高度 |
| `--divider-height` | **2px** | 分割线高度 |
