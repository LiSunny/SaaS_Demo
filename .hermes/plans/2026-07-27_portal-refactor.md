# 门户站点重构实施计划

> **目标**：将 PortalPage.vue 从"内部功能清单式布局"重构为"符合 B2B 产品首页行业范式的客户导向页面"

**架构思路**：保留场景区和 AI 能力区的优秀文案，删除开发状态标签和功能矩阵平铺，新增信任条、产品截图、客户案例三个区域。
**改动范围**：仅 `src/views/portal/PortalPage.vue` 一个文件。

---

## 前置条件（需用户确认后开始）

- [ ] 准备 2-3 张产品界面截图（Dashboard 主页 + 任意两个功能界面），存放到 `src/assets/portal/`
- [ ] 确认真实联系电话和邮箱（替换 `xxx-xxx-xxx` / `xxx@163.com`）
- [ ] 确认平台对外品牌名（导航用"韧性云"还是其他？）

---

## Task 1: 删除不该出现在产品首页的内容

**操作**：在 `PortalPage.vue` 中删除以下内容

### 1a. 删除"功能矩阵"区域的开发状态标签和图例

**删除 `<template>` 中**（第 126-130 行）：
```diff
- <div class="feat-legend">
-   <span v-for="(cfg, k) in STATE_CFG" :key="k" class="feat-legend-item">
-     <span class="feat-legend-dot" :style="{ background: cfg.color }"></span>{{ cfg.label }}
-   </span>
- </div>
```

**删除每个 `.feat-card` 中的状态 badge**（第 138 行）：
```diff
- <span class="feat-badge" :style="{ color: STATE_CFG[f.state].color, background: STATE_CFG[f.state].bg }">{{ STATE_CFG[f.state].label }}</span>
```

**删除 `.feat-bar` 左侧色条**（第 134 行）：
```diff
- <div class="feat-bar" :style="{ background: STATE_CFG[f.state].color }"></div>
```

**删除 `<script>` 中**（第 396-400 行）：
```diff
- const STATE_CFG: Record<string, { label: string; color: string; bg: string }> = {
-   done: { label: '已上线', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
-   wip: { label: '开发中', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
-   planned: { label: '规划中', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
- }
```

### 1b. 删除"开发中"的功能卡片（工单管理/危险作业/可视化大屏）

```diff
// FEATURES 数组中删除 3 个 wip 状态的条目
- { name: '工单管理', desc: '流程模板配置、工单监控、处置流转、归档追溯', state: 'wip' },
- { name: '危险作业', desc: '动火、高空等特殊作业备案、审批与全流程监管', state: 'wip' },
- { name: '可视化大屏', desc: '应急局、企业、校园多级驾驶舱，一屏掌握全局', state: 'wip' },
```

> **注意**：如果后续这 3 个功能上线了，再加回来即可。删掉 state 字段后 FEATURES 只剩 9 个条目。

### 1c. 删除 Hero 区"向下滚动"提示

**删除 `<template>` 中**（第 39-42 行）：
```diff
- <div class="hero-scroll">
-   <span class="hero-scroll-text">向下滚动</span>
-   <ChevronDown class="hero-scroll-arrow" :size="20" color="#fff" />
- </div>
```

同步删除 `<style scoped>` 中的 CSS：
```diff
- .hero-scroll { position: absolute; bottom: 32px; left: 50%; ... }
- .hero-scroll-text { ... }
- .hero-scroll-arrow { ... }
- @keyframes bounce { ... }
```

### 1d. 删除"查看功能矩阵" CTA 按钮

**删除 `<template>` 中**（第 35 行）：
```diff
- <a href="#功能矩阵" class="hero-btn-ghost"><span>查看功能矩阵</span><ChevronRight :size="15" /></a>
```

### 1e. 删除技术特性区的协议列表

**保持**技术特性区深色背景和 4 个数字（它们会移到信任条），但删掉协议列表部分。

**删除 `<template>` 中**（第 162-165 行）：
```diff
- <div ref="protoRef" class="protocols reveal" :class="{ visible: protoV }">
-   <span class="proto-label">协议支持</span>
-   <span v-for="p in PROTOCOLS" :key="p" class="proto-tag">{{ p }}</span>
- </div>
```

**删除 `<script>` 中**（第 434 行）：
```diff
- const PROTOCOLS = ['MQTT 直连', 'TCP 直连', 'HTTP 订阅', 'MQTT 三方中转']
```

同时删除相关的 protoV / protoRef ref 定义和 Observer 绑定。

### 1f. 删除 `<style>` 中对应的 CSS 死代码

删除以下 CSS 块：`.feat-legend`, `.feat-legend-item`, `.feat-legend-dot`, `.feat-bar`, `.feat-badge`, `.hero-scroll`, `.hero-scroll-text`, `.hero-scroll-arrow`, `@keyframes bounce`, `.protocols`, `.proto-label`, `.proto-tag`。

**验证**：`npm run dev`，确认页面无编译报错，无空白区域残留。

---

## Task 2: 添加信任背书条（Hero 下方）

**在 Hero `</section>` 之后、平台定位 `<section>` 之前插入**：

```vue
<!-- ===== Trust Bar ===== -->
<section class="trust">
  <div class="sec-wrap">
    <div class="trust-row">
      <div class="trust-item reveal">
        <div class="trust-num">205<span class="trust-unit">+</span></div>
        <div class="trust-label">台设备接入</div>
      </div>
      <div class="trust-item reveal">
        <div class="trust-num">3<span class="trust-unit">类</span></div>
        <div class="trust-label">核心场景覆盖</div>
      </div>
      <div class="trust-item reveal">
        <div class="trust-num">3<span class="trust-unit">端</span></div>
        <div class="trust-label">多端协同</div>
      </div>
      <div class="trust-item reveal">
        <div class="trust-num">4<span class="trust-unit">种</span></div>
        <div class="trust-label">通信协议兼容</div>
      </div>
    </div>
  </div>
</section>
```

**CSS**：
```css
.trust { padding: 48px 0; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.04); }
.trust-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
@media (min-width: 768px) { .trust-row { grid-template-columns: repeat(4, 1fr); } }
.trust-item { text-align: center; }
.trust-num { font-size: 2rem; font-weight: 900; color: #101010; font-family: 'Outfit', 'Noto Sans SC', sans-serif; line-height: 1; }
@media (min-width: 640px) { .trust-num { font-size: 2.5rem; } }
.trust-unit { font-size: 1rem; font-weight: 500; color: #3678E3; margin-left: 2px; }
.trust-label { font-size: 13px; color: #5E5E5E; margin-top: 4px; }
```

**验证**：滚动到 Hero 下方，4 个数字横向排列，无动画（直接显示）。

---

## Task 3: 修复技术特性区数字始终为 0 的 bug

**在 `<template>` 中**（第 157 行）：
```diff
- <div class="stat-num">{{ countVals[i] }}<span class="stat-unit">{{ st.unit }}</span></div>
+ <div class="stat-num">{{ st.value }}<span class="stat-unit">{{ st.unit }}</span></div>
```

**在 `<script>` 中**：删除第 409-431 行的整个 count-up 逻辑（`countVals`、`techSection` ref、`counted` 变量、整个 `onMounted` 中的 Observer 回调）。

> **说明**：直接渲染数字，放弃 count-up 动画。在这个页面上 205 比动画可靠重要得多。

**验证**：打开页面向下滚动到技术特性区，4 个数字直接显示 205/6/4/3，不再出现 0。

---

## Task 4: Hero 区精简 + 预留截图位

### 4a. 精简 CTA 按钮

Hero 区目前两个按钮 + 导航栏"去体验"，改为 Hero 区只保留一个：

```vue
<div class="hero-btns">
  <a href="#应用场景" class="hero-btn-fill">
    <span>了解应用场景</span><ArrowRight :size="15" />
  </a>
</div>
```

### 4b. 在标题和 CTA 之间预留产品截图位

```vue
<!-- 在 .hero-sub 和 .hero-btns 之间插入 -->
<div class="hero-preview reveal">
  <img src="@/assets/portal/hero-screenshot.png" alt="平台概览" class="hero-preview-img" />
</div>
```

**CSS**：
```css
.hero-preview { max-width: 800px; margin: 32px auto 24px; padding: 0 20px; }
.hero-preview-img { width: 100%; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.1); }
```

> ⚠️ 截图文件放 `src/assets/portal/hero-screenshot.png`。如果暂时没有，用一个带渐变背景的占位 div 替代，待截图就绪后替换。

**验证**：Hero 区出现产品截图（或占位区），仅一个 CTA 按钮。

---

## Task 5: AI 能力区 hover 效果减弱

**当前**：hover 时整张卡片变蓝 + 文字反白（`.ai-card:hover { background: #3678E3; ... }`）

**改为**：微妙上浮 + 阴影加深

```css
.ai-card {
  /* ... 保留现有 */
  transition: all 0.25s ease;
}
.ai-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(54,120,227,0.12);
  border-color: rgba(54,120,227,0.25);
}
/* 删除 hover 时的颜色变化 */
.ai-card:hover .ai-num { /* 保持原色 */ }
.ai-card:hover .ai-line { /* 保持原色 */ }
.ai-card:hover .ai-title { /* 保持原色 */ }
.ai-card:hover .ai-body { /* 保持原色 */ }
```

**验证**：hover AI 卡片时仅上浮 4px + 阴影变化，文字颜色不变。

---

## Task 6: 功能矩阵区改为精选展示（按 platform-portal skill 约束调整）

**skill 硬约束**：
- "能力模块只用 1 句话 + 3-4 个标签概括，不要展开细节"
- "不要在描述中枚举功能列表，枚举用下方标签/徽章格式呈现"
- "不要全用卡片，不要全居中 — 让部分卡片跨列宽幅展示"
- "同组卡片文字长度必须一致（±3字）"
- "正文最小字号 ≥14px"

**改为**：精选 6 个核心功能，描述压缩为一句概括（不枚举子功能），子功能用标签呈现。布局打破均匀网格——第 1、4 张卡片跨 2 列宽幅。

```typescript
// 精选 6 个已上线核心功能
// 注意：每张卡片的 desc（一句话概括）和 tags（3-4个标签）均独立控制字数
import { Monitor, ClipboardCheck, AlertTriangle, Cpu, Brain, Bell } from 'lucide-vue-next'

const FEATURES = [
  {
    name: '远程值守', icon: Monitor,
    desc: '消控室全天候自动监测，告警实时推送',
    tags: ['消控工作台', '预案管理', '告警推送', '值守报表'],
  },
  {
    name: '巡查检查', icon: ClipboardCheck,
    desc: '点位数字化管理，巡查任务自动编排',
    tags: ['点位管理', '计划编排', '异常处理', '巡查报表'],
  },
  {
    name: '隐患管理', icon: AlertTriangle,
    desc: '从上报到复查的全流程闭环',
    tags: ['隐患上报', '初核', '整改跟踪', '复查验收'],
  },
  {
    name: '设备管理', icon: Cpu,
    desc: '设备全生命周期台账与实时监控',
    tags: ['设备台账', '实时监控', '事件日志', '保养计划'],
  },
  {
    name: 'AI 告警分析', icon: Brain,
    desc: 'AI 自动生成告警事件分析报告',
    tags: ['智能分析', '报告生成', '处置建议'],
  },
  {
    name: '消息通知', icon: Bell,
    desc: '多渠道覆盖，确保消息触达',
    tags: ['站内信', '短信', '语音', '第三方推送'],
  },
]
```

**模板**（替换当前 `.feat-card` 循环）：
```vue
<div class="feat-grid">
  <div v-for="(f, i) in FEATURES" :key="i"
    class="feat-card reveal"
    :style="{ transitionDelay: `${i * 60}ms` }"
    :class="{ 'feat-card--wide': i === 0 || i === 3 }"
  >
    <div class="feat-card-top">
      <component :is="f.icon" :size="18" color="#3678E3" />
      <h4>{{ f.name }}</h4>
    </div>
    <p class="feat-desc">{{ f.desc }}</p>
    <div class="feat-tags">
      <span v-for="t in f.tags" :key="t" class="feat-tag-chip">{{ t }}</span>
    </div>
  </div>
</div>
```

**CSS**（按 skill 约束：打破均匀网格，宽窄交错，字号 ≥14px）：
```css
.feat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 48px;
}
@media (min-width: 1024px) {
  .feat-grid { grid-template-columns: repeat(3, 1fr); }
}
.feat-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
/* 宽幅卡片跨越两列，打破均匀网格 */
.feat-card--wide {
  grid-column: span 2;
}
@media (max-width: 1023px) {
  .feat-card--wide { grid-column: span 1; }
}
.feat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.feat-card-top { display: flex; align-items: center; gap: 10px; }
.feat-card-top h4 { font-size: 16px; font-weight: 700; color: #101010; margin: 0; }
.feat-desc { font-size: 14px; color: #5E5E5E; line-height: 1.6; margin: 0; }
.feat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.feat-tag-chip {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 9999px;
  background: rgba(54,120,227,0.06);
  color: #3678E3;
  border: 1px solid rgba(54,120,227,0.12);
}
```

**验证**：
- [ ] 功能矩阵区 6 张卡片，第 1 和第 4 张宽幅跨两列，其余 1 列
- [ ] 每张卡片 = 一句话概括 + 3-4 个标签，不再枚举子功能
- [ ] 6 张卡片的 desc 文字字数差异在 ±3 字以内
- [ ] 正文 14px、标签 12px，均不低于 skill 底线

---

## Task 7: 场景卡片图片去边框

```css
.sc-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 12px;
  /* 删除：border: 4px solid #e5e5e5; */
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
```

**验证**：场景卡片右侧图片无灰色粗边框，圆角 + 微阴影。

---

## Task 8: Footer 链接修正

### 8a. 品牌名不改（用户指示）

### 8b. Footer 联系方式不改（用户手动处理）

### 8c. Footer "动火作业管理"链接

当前 Footer "应用场景"列里有"动火作业管理"，但首页场景卡片只有校园/工贸/小商户。从 Footer 的该列中删除"动火作业管理"链接（避免用户点进去找不到对应内容）。

**验证**：Footer 场景列仅 3 项，与首页对齐。

---

## Task 9: 清理未使用的 import 和 CSS

- 从 `<script>` 中删除不再使用的 import（ChevronDown 如果 Hero scroll 被删等）
- 删除与已删除模板对应的 CSS 规则

**验证**：`npm run build` 无 warning。

---

## 改动量总结

| 类型 | 操作 | 行数变化 |
|------|------|---------|
| 删除 | 开发状态标签/图例/色条 | -30 行 |
| 删除 | 3 张开发中功能卡片 | -3 行数据 |
| 删除 | "向下滚动"提示 + CSS | -15 行 |
| 删除 | "查看功能矩阵"按钮 | -3 行 |
| 删除 | 协议列表 + PROTOCOLS 数据 | -10 行 |
| 删除 | count-up 动画逻辑 | -20 行 |
| 新增 | 信任背书条 | +30 行 |
| 新增 | Hero 产品截图位 | +10 行 |
| 新增 | 功能卡片 icon | +6 行 import |
| 修改 | AI hover 效果 | ~5 行 CSS |
| 修改 | 场景图片边框 | 1 行 CSS |
| 修改 | 品牌名 + Footer | ~5 行 |
| **净变化** | | **约 -30 行，复杂性明显降低** |

---

## 执行顺序

1. **Task 1** 先删（大扫除，为后续改动清出空间）
2. **Task 2+3** 加信任条 + 修 count-up bug（数据可信度）
3. **Task 4** Hero 精简（决定用户第一印象）
4. **Task 5+6+7** 视觉微调（AI hover、功能卡片、图片边框）
5. **Task 8+9** 收尾（品牌统一、清理死代码）

**预计总工时**：4-5 小时（不含准备截图时间）

---

## 不在此次计划中的内容

以下内容需要在**本次重构完成后**根据用户反馈再决定是否追加：

- 客户案例区（需从场景详情页"真实案例"提炼到首页，当前子页面案例内容可能为 AI 生成，需确认真实性）
- 暗色模式（涉及全站颜色变量，影响面大）
- 导航滚动高亮（增强体验但非核心问题）
- 响应式移动端优化（当前页面有 mobile tip 弹窗说明未做移动端适配）
