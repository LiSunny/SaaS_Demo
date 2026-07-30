---
name: bigscreen-implement
description: |
  从 Figma 设计稿自动实现可视化大屏页面。工作流：设计分析 → 框架搭建 → 模块实现 → 走查验证。
  当用户提供 Figma 设计链接并要求"实现大屏"、"生成大屏页面"、"按设计稿做可视化大屏"、"还原设计稿"时使用。
  触发词：Figma + 大屏/可视化/bigscreen/数据大屏/校园/平安/监控大屏/驾驶舱。
  即使只提供 Figma 链接没有明确说"大屏"，如果设计稿尺寸是 1920×1080 也应触发。
compatibility: figma
---

# 大屏实现引擎

> 从 Figma 设计稿到可运行大屏页面的全自动流水线。
> 项目：`maintenance-demo`，技术栈：Vue 3 + Element Plus + TypeScript + SCSS。

## 核心原则

1. **设计稿是唯一的真相来源**。一切以 Figma 为准，不要凭记忆或推测。
2. **SVG > CSS**。装饰元素坚持用 Figma 导出 SVG，禁止自己手写 SVG、禁止手绘图标。
3. **增量验证**。每改一步就刷新看效果，不要攒到最后。
4. **先框架后内容**。整体布局对齐后再填模块内容。
5. **公共样式尽早抽**。发现第二处重复就抽 mixin，不要等 5 处。

## 前置检查

在开始前确认：
- Figma MCP 已连接
- 项目 `npm run dev` 可正常启动
- 了解项目已有的大屏架构（见 `references/architecture.md`）

---

## 阶段一：设计分析

### 1.1 获取设计稿

```
get_design_context(fileKey, nodeId)
get_screenshot(fileKey, nodeId, maxDimension=1920)
```

拿到后分析：整体布局（几列？列宽？）、模块数量、每个模块的层级结构。

### 1.2 提取设计 Token

从 `get_design_context` 中提取：
- **颜色**：卡片背景、文字、表头、状态标签（红/青）、渐变
- **字体**：中文标题（YouSheBiaoTiHei）、英文副标题（Arial Italic）、数字（DingTalk JinBuTi）、正文（Alibaba PuHuiTi）
- **字号**：标题 28px、正文 16px、数字 28px、小字 14px
- **间距**：卡片内边距、模块间距、列间距
- **圆角**：卡片、按钮

### 1.3 验证数学

```
列宽总和 + 间距总和 + 左右边距 = 1920
左列 568 + 中间 720 + 右列 568 + 间距 16×2 + 边距 16×2 = 1920 ✓
```

---

## 阶段二：框架搭建

### 2.1 字体配置

如果设计稿用了项目中没有的字体，让用户提供字体文件（ttf/woff2），放到 `public/fonts/`。
在组件目录创建 `campus-fonts.css`，用 `@font-face` 声明，`font-display: swap`。
在页面入口 `import` 引入。

### 2.2 下载装饰素材

```
download_assets(fileKey, nodeId) → 导出 Header 和 Section 标题栏 SVG
```

放到 `public/` 目录，命名带 `campus-` 前缀避免冲突。

### 2.3 创建组件

**CampusHeader.vue**（模板见 `references/templates.md`）：
- 高度通常 64-84px
- 渐变背景 + 左侧装饰面板 SVG + 标题文字（渐变 white→#84d6ff）
- 右侧用户信息（从 `useUserStore` 获取）

**CampusSection.vue**：
- 卡片背景 `rgba(43, 101, 175, 0.35)`，圆角 4px
- 标题栏：左侧斜切强调条（CSS clip-path）+ 梯形背景 + 渐变分割线
- 文字位置用绝对定位精确匹配 Figma 坐标
- 强调条在梯形之上（z-index）

### 2.4 创建页面

**CampusBigscreen.vue**：
- 全屏容器：`position: relative; width: 100vw; height: 100vh;`
- 背景渐变：`radial-gradient(50% 50% at 50% 50%, #003F76 0%, #00204A 100%);`
- 内容区 `position: absolute;` 三列布局
- 列用 `vh()`/`vw()` 函数（来自 `@/styles/function.scss`）
- 每列内部 flex 列布局 + `gap: vh(16)`

### 2.5 注册路由

- `src/types/bigscreen.ts`：添加类型 + 标签
- `src/config/bigscreen-templates.ts`：添加路由映射
- `src/router/index.ts`：添加路由（StandaloneLayout 子路由）

### 2.6 验证

```bash
npx vue-tsc --noEmit  # 编译检查
curl --noproxy '*' -sI http://localhost:3200/{path}  # 页面加载
```

浏览器截图 vs 设计稿，标注偏差。

---

## 阶段三：逐模块实现

### 3.1 识别模块类型

| 类型 | 特征 | 实现方式 |
|------|------|---------|
| 统计卡片 | 大数字 + 标签 + 不规则背景 | `stat-card` 模式 |
| Tab + 表格 | 切换标签 + 数据表 | `tab-row` + `campus-table` mixin |
| 告警列表 | 状态标签 + 时间 + 位置 | `status-badge` mixin |
| 地图 + 标注 | 背景图 + 点位 | 完整截图或 Figma SVG marker |
| 纯展示 | 机器人/插图 + 文字 | Figma 导出的 SVG/PNG |

### 3.2 下载图标

对每个模块：
```
download_assets(fileKey, moduleNodeId, format="svg")
```
下载到 `public/campus-icons/`，按 `m{模块号}-{用途}.svg` 命名。

**关键规则**：
- 每个图标都必须从 Figma 导出，不得自己手写
- 如果图标是分层的（如地图标注），用整体截图替代
- SVG 中有 `fill="#1E1E1E"` 的画布背景要删掉

### 3.3 创建模块组件

复用公共 mixin（`campus-common.scss`）：
- `tab-row` / `tab-btn-base` / `tab-active`
- `campus-table` / `table-wrap`
- `btn-view` / `tag-done`
- `status-badge`
- `hide-scrollbar`

### 3.4 Tab 样式规范

- **选中态**：渐变背景 `rgba(0,215,215,0.15)→transparent`，文字 `#ffffff`
- **非选中态**：透明背景，文字 `#00c0c0`
- **间距**：`gap: vw(12)`
- **字号**：20px Alibaba PuHuiTi Medium

### 3.5 表格样式规范

- 表头：sticky, `background: #0F437A`, `color: #40b6b6`
- 表体：`color: #e6e6e6`
- 滚动：`overflow-y: auto` + `scrollbar-width: none`

### 3.6 每完成一个模块

```bash
npx vue-tsc --noEmit  # 编译检查
```
浏览器刷新，截图 vs Figma 设计稿该模块。

---

## 阶段四：走查验证

### 4.1 代码走查

- CSS 重复 → 抽 mixin
- 颜色硬编码 → 统一为 Token
- 图标引用是否是 Figma 导出
- `vw/vh/clamp` 是否正确

### 4.2 UI 走查

- 逐模块截图对比设计稿
- Tab 选中/非选中态
- 表格表头固定 + 滚动
- 不同窗口大小下无溢出/变形

### 4.3 快速验证清单

```
□ vue-tsc --noEmit       编译通过
□ 页面 HTTP 200          路由正常
□ Tab 颜色统一 #00c0c0   非选中态一致
□ Tab gap 统一 vw(12)    间距一致
□ 表头 sticky + 滚动     表格正常
□ 字体加载(200)          字体正确
□ 图标无空白/无变形      图标正确
```

---

## 常见问题与解决

| 问题 | 原因 | 解决 |
|------|------|------|
| 标题文字重叠 | SVG 自带文字 + HTML 文字 | 删除 SVG 中文字路径 |
| 装饰背景被截断 | 容器变小但 SVG 未缩放 | 固定元素用 SVG，可伸缩元素用 CSS |
| 左侧强调条不可见 | 梯形背景覆盖了强调条 | 调换 DOM 顺序 + z-index |
| 图标文件搞反 | 命名混淆 | 检查 SVG viewBox 尺寸确认 |
| 气泡背景不显示 | SVG 旋转计算错误 | 80×212 SVG 旋转 -90° = 视觉 212×80 |
| 模块宽度不一致 | 固定宽度 SVG 被拉伸 | 可伸缩元素用 CSS 自适应 |

---

## ⚠️ 硬性约束（每次必查，违反即返工）

> 以下规则源于多次返工教训，**不是建议，是铁律**。

### 素材铁律

1. **装饰元素必须从 Figma 下载，禁止手写 SVG/CSS 模拟**。包括但不限于：Header 装饰、小标题装饰、圆环图标、标记点图标、卡片背景。
2. **下载后立即检查内容**：`head -3 xxx.svg` 确认 viewBox 尺寸是否合理。多图层组件（如 City 图标由 3 层组成）必须全部下载后合成，不能只拿第一层。
3. **图标禁止用 emoji、禁止用 CSS 画、禁止手写 `<svg>`**。只能使用 Figma `download_assets` 导出的素材。

### 设计解析铁律

4. **对每个子模块分别调用 `get_design_context`**。不要只看顶层元数据就动手。左/中/右三列各调一次，复杂模块单独调。
5. **Figma Instance 组件必须解析**。遇到 `<instance>` 标记，用其 nodeId 单独获取设计上下文，不要跳过或占位。

### 验证铁律

6. **每完成一个模块就停下来让用户确认**。不要一口气写完所有组件再回头改。
7. **写完一个模块 → vue-tsc → 截图 vs 设计稿**。确认无误再开始下一个。

### 样式铁律

8. **`::-webkit-scrollbar` 必须写在非 scoped 的 `<style>` 块中**，scoped 对伪元素无效。
9. **组件类名统一用 `.module-card`**，所有模块共享 `background + border + border-radius + padding` 四件套，保持视觉一致。
10. **先调页面背景深度，再调模块透明度**。页面背景太浅 → 模块看不清 → 盲目加深模块 → 永远调不准。正确顺序：先定页面背景（深蓝 `#003768→#00244d` 左右），再定模块 `rgba(0,80,140,0.45)`。

---

## 参考文件

需要时阅读以下文件：
- `references/architecture.md` — 大屏架构详解（布局/路由/缩放系统）
- `references/templates.md` — Header/Section 组件模板代码
- `references/common-mixins.md` — 公共 SCSS Mixin 参考
- 项目 `.claude/CLAUDE.md` — 项目整体规范
