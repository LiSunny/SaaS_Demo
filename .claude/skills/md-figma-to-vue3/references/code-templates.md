# Vue 3 代码模板

所有模板统一使用 Composition API + TypeScript + Element Plus。

---

# 第一部分：目录约定

```
src/
├── types/          # TypeScript 类型定义
├── api/            # API 请求层
├── stores/         # Pinia 状态管理
├── components/
│   ├── base/       # 基础组件（Element Plus 二次封装、ThemeToggle 等）
│   └── business/   # 业务组件（StatusTag、FilterBar、DataTable 等）
├── views/          # 页面视图（按页面类型组织）
├── router/         # 路由配置
└── assets/
    └── icons/      # 图标 SVG（占位文件 + ICONS.md 替换指引）
```

---

# 第二部分：页面定位与展示原则

生成代码前，先根据 MD 文档判断页面类型，再按类型运行**布局决策树**确定结构。

## 页面类型判定

```
MD 文档描述
├── 包含"列表""表格""管理" → 列表管理页（§2.1）
├── 包含"详情""查看""信息" → 详情展示页（§2.2）
├── 包含"新增""编辑""配置""录入" → 判断复杂度
│   ├── 包含"步骤""分步""流程配置""多步骤" → 多步骤配置页（§2.3c）
│   ├── ≤6 个字段，无分区块 → 表单提交页·弹窗模式（§2.3a）
│   └── >6 个字段或多区块 → 表单提交页·抽屉/独立页（§2.3b）
├── 包含"统计""看板""仪表板""概览" → 仪表板/看板页（§2.4）
├── 包含"树""层级""分类" → 树形管理页（§2.5）
└── 包含"流程""进度""时间线""处理记录" → 流程时间线页（§2.6）
```

## 2.1 列表管理页

> 适用：数据列表、台账管理、日志查询等。

### 布局决策树

```
输入：MD Section 4 的查询参数量 = Q

Q ≤ 3 → 单行 FilterBar
   [Input] [Select] [Select] [查询]              [+ 新增]

Q > 3 → 可折叠 FilterBar（展开/收起更多筛选条件）
   [Input] [Select] [DateRange] [展开更多 ▼]      [+ 新增]

输出：FilterBar → ToolBar → DataTable(含分页)
```

### 布局原则

- **容器嵌套**：所有列表页使用 `list-page > content-card` 双层容器。`list-page` 只做高度占位；`content-card` 是所有子内容的唯一父容器（`bg-card + radius-md + padding-xl + flex column + overflow:auto`），禁止在其外部放任何内容
- FilterBar、ToolBar、DataTable 从上到下纵向堆叠，均在 `content-card` 内
- **筛选栏**：全局 `filter-left` 始终 `flex-wrap: wrap`，按钮永不溢出。多条件页面（≥5 个控件）在 scoped 中收紧控件宽度和 gap，确保 ≤2 行
- 表格操作列固定在右侧 (`fixed="right"`)

### 组件选用

| 交互 | 规则 |
|------|------|
| 新增/编辑 | ≤6 字段用 `el-dialog`；>6 字段用 `el-drawer` |
| 删除 | `ElMessageBox.confirm` 二次确认 |
| 查看详情 | 跳转独立详情页（§2.2），不在弹窗中展示 |

### 代码模板

→ 见 [§3.1 列表页模板](#31-页面组件--列表页)

## 2.2 详情展示页

> 适用：数据查看、信息详情、日志详情等。

### 布局决策树

```
输入：
  Section 3 实体字段数 + Section 2 卡片区域数 = 信息密度 N
  Section 2 中是否有 Tab 区域
  Section 2 中是否有表格/图表/图片

决策：

N ≤ 6，无长内容，无 Tab → 全宽单列
  面包屑 → 顶部摘要区(如有指标卡) → InfoCard1 → InfoCard2 → ... → 底部操作栏

N 7-15，无长内容，无 Tab → 两列网格
  面包屑 → 顶部摘要区 → [InfoCard1  InfoCard2] → [InfoCard3  InfoCard4] → 底部操作栏

有 Tab 子内容（如"计划详情 | 设备列表 | 执行记录"） → 全宽 + Tabs
  面包屑 → 顶部摘要区 → Tabs导航(全宽) → 当前Tab内容 → 底部操作栏

有两个语义独立的信息块需要并排对比（如"订单信息 vs 客户信息"） → 左右分栏
  面包屑 → [左60% 主信息] [右40% 对比信息] → 底部操作栏

有长内容(表格/图表/大段文本) → 该区域独占全宽
```

### 顶部摘要区（DetailHeader 模式）

> 源自 Figma 参考页。详情页顶部可选区域，非强制。

```
┌──────────────────────────────────────────────────────────┐
│ [icon 56px] 指标卡1  │  [icon 56px] 指标卡2  │ │ 竖线 │ StatusTag + 标题 + 编辑链接 │ QR码(可选) │
└──────────────────────────────────────────────────────────┘
```

触发条件：Section 2 中至少有 1 个区域标注为"顶部摘要区"或存在指标卡。

### 强制清单

| # | 要求 | 实现 |
|---|------|------|
| 1 | 独立页面 | 非弹窗/抽屉，有独立路由 |
| 2 | 面包屑 | 必须。`<el-breadcrumb>` |
| 3 | 返回按钮 | 必须。页面左上角或面包屑下方 |
| 4 | 底部操作栏 | 编辑/删除等操作按钮固定在底部 |
| 5 | 状态字段 | 必须用 `StatusTag` 组件渲染 |

### 代码模板

→ 见 [§3.2 详情页模板](#32-页面组件--详情页)

## 2.3 表单提交页

### 2.3a 简单表单（≤6 字段）→ 弹窗模式

用 `el-dialog`，嵌入在列表页组件内。

```vue
<el-dialog v-model="visible" :title="isEdit ? '编辑' : '新增'" width="520px">
  <el-form :model="form" :rules="rules" label-width="100px">
    <!-- ≤6 个 el-form-item -->
  </el-form>
  <template #footer>
    <button class="btn-default" @click="visible = false">取消</button>
    <button class="btn-primary" :disabled="submitting" @click="submit">确定</button>
  </template>
</el-dialog>
```

### 2.3b 复杂表单（>6 字段或多区块）→ 抽屉 / 独立页

- **抽屉模式**：`el-drawer`，width="640px" 或更大，分区块用 `<el-card>` 分隔
- **独立页模式**：有独立路由，表单区 + 可选预览区，适用于超长表单

### 2.3c 多步骤配置页 → 面包屑置顶 + 步骤&操作合并卡片 + 工作区卡片

> 适用：分步骤的表单配置、流程模板编排、向导式设置等。MD 文档中需包含"步骤""分步""流程配置"等关键词。

#### 布局决策树

```
输入：MD Section 2 的步骤数 = S，是否有步骤指示器
输出：面包屑行 → 工具栏卡片（步骤 + 操作）→ 工作区卡片
```

#### 布局结构

```
┌─ 面包屑行（独立，最小高度）──────────────────────┐
│ [返回] 面包屑 > 页面名称                          │
├─ 工具栏卡片（圆角）───────────────────────────────┤
│ el-steps（左）           [取消] [保存草稿] [发布]（右）│
├─ 工作区（flex:1）─────────────────────────────────┤
│ ┌─ 工作区卡片（圆角，flex:1，overflow:auto）─────┐ │
│ │                                                  │ │
│ │ 步骤内容（v-show 切换）                          │ │
│ │                                                  │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

#### 强制清单

| # | 要求 | 实现 |
|---|------|------|
| 1 | 面包屑独立置顶 | `<el-breadcrumb>` 单行，最小高度，左侧放返回按钮 |
| 2 | 步骤+操作合并卡片 | 一张圆角卡片（`bg-card` + `border` + `border-radius`），flex 左右分布；左 `el-steps`，右操作按钮 |
| 3 | 工作区圆角卡片 | `bg-card` + `border` + `border-radius` + `flex:1` + `overflow:auto`，包裹步骤内容 |
| 4 | 无独立底部栏 | 所有操作按钮在工具栏卡片右侧，页面 layout 无 footer |
| 5 | 步骤切换 | `v-show="currentStep === index"` 配合 `el-steps` 当前步骤高亮 |
| 6 | 按钮按步骤显隐 | 第一步无"上一步"、最后一步多"发布"按钮 |

#### 代码模板

```vue
<template>
  <div class="config-page">
    <!-- 面包屑 -->
    <div class="config-breadcrumb">
      <div class="breadcrumb-left">
        <button class="btn-link" @click="handleBack">返回列表</button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/xxx' }">模块名</el-breadcrumb-item>
          <el-breadcrumb-item>{{ isEdit ? name : '新建' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <!-- 工具栏卡片：步骤 + 操作 -->
    <div class="config-toolbar-card">
      <el-steps :active="currentStep" align-center>
        <el-step v-for="s in steps" :key="s.key" :title="s.label" />
      </el-steps>
      <div class="toolbar-actions">
        <button class="btn-default" @click="handleCancel">取消</button>
        <button class="btn-default" @click="handleSaveDraft">保存草稿</button>
        <button v-if="currentStep > 0" class="btn-default" @click="currentStep--">上一步</button>
        <button v-if="currentStep < steps.length - 1" class="btn-primary" @click="currentStep++">下一步</button>
        <button v-if="currentStep === steps.length - 1" class="btn-primary" @click="handlePublish">发布</button>
      </div>
    </div>

    <!-- 工作区 -->
    <div class="config-body">
      <div class="config-work-card">
        <!-- 步骤内容 v-show 切换 -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.config-breadcrumb {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.breadcrumb-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-toolbar-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  flex-shrink: 0;
  gap: 24px;
}
.config-toolbar-card :deep(.el-steps) {
  flex: 1;
  max-width: 480px;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.config-body {
  flex: 1;
  overflow: hidden;
}
.config-work-card {
  height: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 16px;
  overflow: auto;
}
</style>
```

### 代码模板

→ 见 [§3.3 表单页/抽屉模板](#33-页面组件--表单页--抽屉)

## 2.4 仪表板/看板页

> 适用：首页统计、数据概览、驾驶舱等。

### 布局决策树

```
输入：MetricCard 数量 = M，是否有 ChartCard/SummaryCard

M ≤ 4，无 Chart → 单行 N 列（每列 1fr）
M 5-8，无 Chart → 两行，每行 4 列

有 ChartCard + SummaryCard → 左右分栏
  [ChartCard 60%] [SummaryCard 40%]

有 ChartCard，无 SummaryCard → ChartCard 独占全宽

仅 SummaryCard → 独占全宽或两列
```

### 布局原则

- MetricCard 行用 grid + `align-items: stretch` 保证等高
- 父容器用 `grid-template-columns: repeat(N, 1fr)`，不用 `flex-wrap: wrap`
- ChartCard 内部图表库 (ECharts) 通过 slot 注入

### 代码模板

→ 见 [§3.4 看板页模板](#34-页面组件--看板页)

## 2.5 树形管理页

> 适用：组织架构、设备分类、菜单配置等。

### 布局原则

- 左侧 `el-tree` 固定 260px 宽度，`highlight-current`，`node-click` 事件
- 右侧内容区根据选中节点动态渲染（表格、详情或自定义内容）
- 第一个节点默认选中，避免右侧空白

### 强制清单

| # | 要求 | 实现 |
|---|------|------|
| 1 | 左侧树 | `el-tree`，highlight-current，node-click 事件 |
| 2 | 右侧内容 | 选中节点后动态切换表格或详情 |
| 3 | 默认选中 | 第一个节点默认选中，避免右侧空白 |

## 2.6 流程时间线页（新增）

> 适用：异常处理记录、审批流程、操作日志等。
> 源自 Figma 参考页（页面4），每个节点一张卡片纵向排列。

### 布局

```
全宽卡片列表，从上到下按时间倒序排列
┌─────────────────────────┐
│ 步骤N：结果确认               │
│ 2025-12-03 12:35:56        │
│ ┌───────────────────────┐ │
│ │ 确认人: xxx  结果: xxx  │ │
│ └───────────────────────┘ │
├─────────────────────────┤
│ 步骤N-1：异常处理            │
│ ...                       │
├─────────────────────────┤
│ 步骤1：异常上报              │
└─────────────────────────┘
            ↓
   底部操作按钮（可选）
```

### 组件

使用 `ProcessTimeline` 组件（见 component-registry.md）。

---

# 第三部分：代码模板（按文件类型）

## 3.1 页面组件 — 列表页

> **写列表页前必须先读项目中已有的列表页**（如 `PlanList.vue`、`TemplateList.vue`），以其实际使用的模板结构为准。
> 以下模板展示的是项目当前的标准写法：**原生 `<table class="fi-table">` + 全局 CSS 类**。

### 容器嵌套范式（不可变）

```
list-page (height:100%)                     ← 只做高度占位
└── content-card (bg-card + radius + pad)   ← 所有子内容的唯一父容器
    ├── [统计卡片 / 帮助说明 / 顶部自定义内容]
    ├── filter-bar
    ├── table-wrap > table.fi-table
    └── pagination-wrap
```

**关键规则**：页面上所有可见内容（包括统计卡片）必须放在 `content-card` 内部，禁止在外层 `list-page` 中添加任何子节点。

### 筛选栏标准范式

> 全局样式定义在 `style.css`，所有页面共用。页面 scoped 中只覆写控件宽度，禁止覆写 gap/height/display。

#### 全局约定（不可变）

| 属性 | 值 | 说明 |
|------|-----|------|
| `.filter-left` gap | `var(--spacing-lg, 12px)` | 统一横向间距 |
| `.filter-left` align-items | `stretch` | 同排组件自动等高 |
| `.filter-left` flex-wrap | `wrap` | 超宽自动换行 |
| `.filter-left` row-gap | `var(--spacing-sm, 6px)` | 换行后行间距 |
| 组件高度 | **禁止写死** | 通过 flex stretch + `flex: 1` 级联自动撑满 |

#### 高度自动统一机制

各筛选组件**不设固定高度**，通过 Flexbox 级联撑满到同行最高组件：

```
.filter-left (flex, align-items: stretch)  → 子 wrapper 统一到同行最高高度
  ├── .search-input-wrap (display: flex)
  │     └── .fi-input (flex: 1 → 填满 wrapper)
  ├── .fi-select-wrap (display: flex)
  │     └── .el-select (display: flex, height: 100%)
  │           └── .el-select__wrapper (flex: 1 → 填满)
  └── .fi-date-range-wrap (display: flex)
        └── .el-date-editor (flex: 1, height: 100% !important → 填满)
```

**关键规则**：
- Element Plus 的 `el-select__wrapper` 和 `el-date-editor` 内部通过 `--el-component-size` 设有默认高度，必须用 `flex: 1` / `height: 100% !important` 覆盖，确保撑满
- `el-date-editor` 必须 `height: 100% !important`（Element Plus 特异性高，不加 `!important` 会被覆盖）
- 每行独立计算——换行后各行高度由该行最高组件决定，互不影响

#### 页面 scoped 覆写规则

页面只需按控件数量调整 wrapper 宽度，**禁止覆写 gap/height**：

- **条件 ≤4 个**：无需额外处理，全局样式足够
- **条件 ≥5 个**：页面 scoped 中收紧控件宽度（注意 EL 组件有最小内容宽度限制，`el-date-picker[daterange]` ≥ 230px、`el-select` ≥ 100px）：
  ```css
  .filter-left .fi-select-wrap { width: 130px; }            /* 193px → 130px */
  .filter-left .search-input-wrap { width: 180px; }         /* 208px → 180px */
  .filter-left .fi-date-range-wrap { width: 230px; }        /* 380px → 230px（daterange 最小可用宽度） */
  ```

- **硬性约束**：筛选栏最多两行，整个页面禁止横向滚动条

#### 筛选操作区布局范式（不可变）

`filter-bar` 内部始终左右分布：

```
.filter-bar
├── .filter-left（flex: 1，居左）
│   ├── 筛选控件（搜索框 + 下拉 + 日期选择器）
│   ├── [查询]（btn-primary）
│   └── [重置]（btn-default）
└── .filter-right（flex-shrink: 0，居右）
    └── 操作按钮（如 [发起工单] [新建模板]）
```

- 查询/重置按钮**必须在** `.filter-left` 内，紧跟筛选控件
- 操作按钮（发起/新建/批量删除）**必须在** `.filter-right` 内
- 禁止在 `.filter-left` 和 `.filter-right` 之外创建独立操作栏行
- 设计文档中筛选区和操作按钮区描述为同行左右布局，代码生成时直接映射到 `.filter-left` + `.filter-right`

#### 代码模板

```vue
<template>
  <div class="list-page">
    <!-- ===== 内容卡片：所有子内容唯一父容器 ===== -->
    <div class="content-card">
      <!-- 统计卡片行（如有） -->
      <div class="stat-row">...</div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input v-model="query.keyword" class="fi-input" placeholder="关键词" @keyup.enter="search" />
            <button v-if="query.keyword" class="fi-clear" @click="query.keyword='';search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="query.status" placeholder="状态" clearable class="fi-select" :teleported="false" popper-class="fi-popper">
              <el-option v-for="o in statusOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>

          <button class="btn-primary" @click="search">查询</button>
          <button class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <button class="btn-primary" @click="handleAdd">
            <AppIcon name="plus" class="btn-add-icon" />新增
          </button>
        </div>
      </div>

      <!-- 数据表格 — 必须用原生 <table class="fi-table">，禁止用 el-table -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-check"><input type="checkbox" /></th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-name"><span>名称</span></th>
              <th class="fi-th col-time"><span>创建时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="loading">
            <tr v-for="row in list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-check"><input type="checkbox" /></td>
              <td class="fi-td col-status"><StatusTag :status="row.status" /></td>
              <td class="fi-td col-name">{{ row.name }}</td>
              <td class="fi-td col-time">{{ row.createdAt }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" @click="handleView(row)" title="查看"><AppIcon name="preview" class="act-icon" /></button>
                  <button class="act-btn act-edit" @click="handleEdit(row)" title="编辑"><AppIcon name="edit" class="act-icon" /></button>
                  <button class="act-btn act-delete" @click="handleDelete(row)" title="删除"><AppIcon name="delete" class="act-icon" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 — 必须用 .pagination-wrap + .pagi-total 全局类 -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ query.page }}/{{ Math.ceil(total / query.size) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @change="fetch"
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import StatusTag from '@/components/business/StatusTag.vue'
import AppIcon from '@/components/base/AppIcon.vue'
// import { getList, create, update, remove } from '@/api/xxx'
// import type { XxxItem, XxxQuery } from '@/types/xxx'

const query = reactive<any>({ keyword: '', status: '', page: 1, size: 20 })
const search = () => { query.page = 1; fetch() }

const list = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const fetch = async () => {
  loading.value = true
  try { /* const { list: data, total: t } = await getList(query); list.value = data; total.value = t */ }
  finally { loading.value = false }
}

const handleAdd = () => { /* 打开新增弹窗 */ }
const handleView = (row: any) => { /* 跳转详情 */ }
const handleEdit = (row: any) => { /* 打开编辑弹窗 */ }
const handleDelete = async (row: any) => { await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' }); /* await remove(row.id) */ fetch() }

onMounted(() => fetch())
</script>

<style scoped>
/* 外层页容器 — 只做高度占位 */
.list-page { height: 100%; }

/* 内容卡片 — 所有子内容唯一父容器（样式不可变） */
.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xl, 16px);
  overflow: auto;
}

/* 列宽（页面特有） */
.col-check { width: 50px; }
.col-status { width: 125px; min-width: 100px; }
.col-name { min-width: 140px; }
.col-time { width: 180px; }
.col-actions { width: 210px; min-width: 190px; white-space: nowrap; }

/* 响应式列隐藏 */
@media (max-width: 1550px) { .col-time { display: none !important; } }
@media (max-width: 1250px) { .col-name { display: none !important; } }
@media (max-width: 800px) { .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; } .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; } }

/* 分页器 EL 组件覆盖（项目通用，各页面保持一致） */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: var(--bg-card); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; }
</style>
```

## 3.2 页面组件 — 详情页

```vue
<template>
  <div class="detail-page">
    <!-- 面包屑 + 返回 -->
    <div class="page-top">
      <el-button link :icon="ArrowLeft" @click="$router.back()">返回</el-button>
      <el-breadcrumb><el-breadcrumb-item :to="{path:'/'}">模块</el-breadcrumb-item><el-breadcrumb-item>详情</el-breadcrumb-item></el-breadcrumb>
    </div>

    <!-- 主次布局 -->
    <div class="detail-body">
      <div class="detail-main">
        <el-card header="基本信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="名称">{{ data.name }}</el-descriptions-item>
            <el-descriptions-item label="状态"><StatusTag :status="data.status" /></el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ data.createdAt }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card header="扩展信息" class="mt-16"><!-- 更多字段 --></el-card>
      </div>
      <div class="detail-side">
        <el-card><el-tabs><el-tab-pane label="关联数据"><!-- 子表格 --></el-tab-pane><el-tab-pane label="操作日志"><!-- 日志列表 --></el-tab-pane></el-tabs></el-card>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="detail-footer"><el-button type="primary" @click="handleEdit">编辑</el-button><el-button type="danger" @click="handleDelete">删除</el-button></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'; import { useRoute } from 'vue-router'; import { ArrowLeft } from '@element-plus/icons-vue'
// import { getDetail } from '@/api/xxx'; import type { XxxItem } from '@/types/xxx'

const route = useRoute(); const data = ref<any>({})
const fetch = async () => { /* data.value = await getDetail(route.params.id) */ }
const handleEdit = () => { /* $router.push(`/xxx/${route.params.id}/edit`) */ }
const handleDelete = async () => { /* confirm → remove → $router.back() */ }
onMounted(() => fetch())
</script>

<style scoped>
.detail-page { padding: var(--spacing-lg, 12px); }
.page-top { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.detail-body { display: flex; gap: 16px; }
.detail-main { flex: 7; display: flex; flex-direction: column; gap: 16px; }
.detail-side { flex: 3; }
.detail-footer { margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid var(--border-default); padding-top: 16px; }
.mt-16 { margin-top: 16px; }
</style>
```

## 3.3 页面组件 — 表单页 / 抽屉

### 抽屉模式

```vue
<el-drawer v-model="visible" :title="title" size="640px" :before-close="handleClose">
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <el-card header="基本信息" shadow="never">
      <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
      <!-- ... ≤12 字段 ... -->
    </el-card>
    <el-card header="扩展配置" shadow="never" class="mt-16">
      <!-- 更多字段 -->
    </el-card>
  </el-form>
  <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></template>
</el-drawer>
```

### 判定规则

```
表单字段数 ≤ 6，无分区块 → el-dialog（嵌入列表页）
表单字段数 7-12 → el-drawer size="640px"
表单字段数 > 12 或含 3+ 区块 → 独立页面，左侧表单 + 右侧预览
```

## 3.4 页面组件 — 看板页

```vue
<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in stats" :key="card.label">
        <el-card shadow="hover"><div class="stat-card"><div class="stat-label">{{ card.label }}</div><div class="stat-value">{{ card.value }}</div></div></el-card>
      </el-col>
    </el-row>

    <!-- 图表 + 列表 -->
    <el-row :gutter="16" class="mt-16">
      <el-col :span="14"><el-card header="趋势图"><div class="chart-placeholder">图表区域</div></el-card></el-col>
      <el-col :span="10"><el-card header="最新记录"><!-- 列表 --></el-card></el-col>
    </el-row>
  </div>
</template>
```

## 3.5 业务组件

业务组件必须遵循 Element Plus 组件定义模式：**显式声明 Props / Emits / Slots，样式只引用 CSS 变量**。新建前必须查 [component-registry.md](component-registry.md)，有匹配则复用，无匹配才新建。

### 完整组件定义示例（StatusTag）

```vue
<!-- src/components/business/StatusTag.vue -->
<template>
  <el-tag :type="tagType" :size="size" :class="['status-tag', `status-${status}`]">
    <slot name="icon" />
    {{ displayLabel }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props — 语义化枚举，不用宽泛类型
interface Props {
  status: number | string
  label?: string
  size?: 'small' | 'default'
}
const props = withDefaults(defineProps<Props>(), { size: 'small' })

// 状态映射表 — 业务方注入，默认提供常用映射
const STATUS_MAP: Record<string, { label: string; type: string }> = {
  active: { label: '启用', type: 'success' },
  inactive: { label: '禁用', type: 'info' },
  error: { label: '异常', type: 'danger' },
  pending: { label: '待处理', type: 'warning' },
}

const tagType = computed(() => STATUS_MAP[props.status]?.type ?? 'info')
const displayLabel = computed(() => props.label ?? STATUS_MAP[props.status]?.label ?? props.status)
</script>

<style scoped>
/* 仅引用 var(--xxx)，不写死颜色 */
.status-tag {
  font-size: var(--font-small);
  border-radius: var(--border-radius-sm);
}
.status-active { /* 通过 CSS 变量控制，也可用 el-tag type 属性 */ }
.status-inactive { }
.status-error { }
.status-pending { }
</style>
```

### 新建组件后注册

新组件生成完成后，必须在 [component-registry.md](component-registry.md) 末尾追加完整定义（Props / Emits / Slots / CSS 变量依赖 / 视觉特征 / 文件位置），并在顶部索引表添加对应行。格式参见已有条目。

## 3.6 TypeScript 类型定义

```typescript
// src/types/xxx.ts
export interface XxxItem { id: number; name: string; status: number; createdAt: string }
export interface XxxQuery { keyword?: string; status?: number; page: number; size: number }
export interface XxxForm { name: string; status?: number }
export interface PaginatedData<T> { data: T[]; total: number }
```

## 3.7 API 层

```typescript
// src/api/xxx.ts
import request from '@/utils/request'
import type { XxxItem, XxxQuery, XxxForm, PaginatedData } from '@/types/xxx'

export const getList = (p: XxxQuery) => request.get<PaginatedData<XxxItem>>('/api/xxx', { params: p })
export const getDetail = (id: number) => request.get<XxxItem>(`/api/xxx/${id}`)
export const create = (d: XxxForm) => request.post<XxxItem>('/api/xxx', d)
export const update = (id: number, d: Partial<XxxForm>) => request.put<XxxItem>(`/api/xxx/${id}`, d)
export const remove = (id: number) => request.delete(`/api/xxx/${id}`)
```

## 3.8 Pinia Store

```typescript
// src/stores/xxx.ts
import { defineStore } from 'pinia'; import { ref, reactive } from 'vue'
import type { XxxItem, XxxQuery } from '@/types/xxx'; import { getList } from '@/api/xxx'

export const useXxxStore = defineStore('xxx', () => {
  const list = ref<XxxItem[]>([]); const loading = ref(false)
  const query = reactive<XxxQuery>({ page: 1, size: 20 }); const total = ref(0)
  async function fetch() { loading.value = true; try { const r = await getList({ ...query }); list.value = r.data; total.value = r.total } finally { loading.value = false } }
  return { list, loading, query, total, fetch }
})
```

## 3.9 路由配置

```typescript
{
  path: '/module', name: 'Module', redirect: '/module/list',
  children: [
    { path: 'list', name: 'ModuleList', component: () => import('@/views/module/List.vue'), meta: { title: '列表' } },
    { path: 'detail/:id', name: 'ModuleDetail', component: () => import('@/views/module/Detail.vue'), meta: { title: '详情', hidden: true } },
    { path: 'edit/:id', name: 'ModuleEdit', component: () => import('@/views/module/Edit.vue'), meta: { title: '编辑', hidden: true } },
  ],
}
```

---

# 第四部分：基础设施

## 4.1 图标策略

- 生成 `src/assets/icons/` 目录 + 语义化占位 SVG（`search.svg`、`plus.svg`、`edit.svg` 等）
- 代码用 `<img src="@/assets/icons/search.svg">` 引用
- 同时生成 `ICONS.md`：图标名、用途、Figma 来源、替换步骤
- 禁止使用过期 Figma 临时 URL

## 4.2 Light/Dark 主题

必须生成三件套：
1. **`style.css`**：`:root` + `html.dark` 双份 CSS 变量。**除自定义 `--accent-*` / `--text-*` 等令牌外，还必须写入 `--el-color-primary` 等 Element Plus 变量覆盖（完整清单见 design-tokens.md §六），确保 EL 组件（按钮、弹窗、标签等）使用主题色而非默认 `#409EFF`。**
2. **`src/stores/theme.ts`**：Pinia Store，`localStorage` 持久化，`document.documentElement.classList.toggle('dark')`
3. **`src/components/base/ThemeToggle.vue`**：切换按钮，嵌入 Header

## 4.3 自适应布局

| 断点 | 行为 |
|------|------|
| ≤1550px | 表格隐藏 2 列次要列 |
| ≤1280px | 侧栏收起为 72px 图标模式 (matchMedia 监听) |
| ≤1250px | 表格再隐藏 1 列 |
| ≤1100px | Header 用户名隐藏 |
| ≤1050px | 表格再隐藏 1 列 |
| ≤800px | 筛选栏/分页纵向排列 |

表格使用 `table-layout: auto`，列隐藏用 `display: none !important`，禁止永久横向滚动条。

## 4.4 Element Plus 深色模式适配清单

| 组件 | CSS 选择器 | 注意 |
|------|-----------|------|
| Loading 遮罩 | `.el-loading-mask` | `var(--bg-card)` |
| Switch 开关 | `.el-switch__core` / `.is-checked` | |
| Pagination 页码 | `.el-pager li` | 激活态 `var(--accent-primary)` |
| Pagination 按钮 | `.btn-prev` `.btn-next` | disabled 态 `var(--text-muted)` |
| Pagination 下拉 | `.el-select__wrapper` | 双写 `.el-input__wrapper` 兼容旧版 |
| Pagination 跳页 | `.el-pagination__jump .el-input__wrapper` | |
| Select 面板 | `.el-select-dropdown` | **必须全局 CSS**（teleport） |
| Select 输入框 | `.el-select__wrapper` | 双写兼容旧版 |

三条铁律：
1. Teleport 组件（下拉面板、tooltip、dialog）**必须全局 CSS**
2. `el-select__wrapper` 和 `el-input__wrapper` **双写兼容**
3. 覆盖 Element Plus 默认值**必须 `!important`**

## 4.5 组件复用规范

### 基础 UI（全局 CSS 类）

基础 UI 满足 4 条判定规则（无业务名词 + 跨页面通用 + 纯令牌 + 不依赖业务数据），样式以全局 CSS 类形式定义在 `style.css`，**禁止在页面 scoped 中重复定义**。

按钮全局类代码模板：
```css
/* ===== 基础 UI：按钮（style.css 全局类） ===== */
.btn-primary,
.btn-danger,
.btn-default,
.btn-link {
  height: var(--btn-height);
  border-radius: var(--btn-radius);
  padding: var(--btn-padding-y) var(--btn-padding-x);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--btn-gap);
}

/* primary 填充 */
.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-color);
  border: none;
}
.btn-primary:hover { background: var(--btn-primary-hover-bg); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }

/* danger 填充 */
.btn-danger {
  background: var(--btn-danger-bg);
  color: var(--btn-danger-color);
  border: none;
}
.btn-danger:hover { filter: brightness(0.9); }

/* default 线框 */
.btn-default {
  background: transparent;
  color: var(--btn-default-color);
  border: 1px solid var(--btn-default-border);
}
.btn-default:hover {
  color: var(--btn-default-hover-color);
  border-color: var(--btn-default-hover-border);
}

/* link 文字 */
.btn-link {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  height: auto;
  font-size: var(--font-small);
}
.btn-link:hover { color: var(--accent-primary); }
```

页面中使用（不写任何样式）：
```html
<button class="btn-primary" @click="handleSubmit">确定</button>
<button class="btn-danger" @click="handleDelete">删除</button>
<button class="btn-default" @click="handleCancel">取消</button>
<button class="btn-link" @click="$router.back()">返回</button>
```

### 业务组件

- **先查注册表，再新建**：生成任何业务组件前，必须先读 [component-registry.md](component-registry.md)，按匹配算法（4 维评分 ≥ 70%）判断是否已有可复用组件
- **新建后必须注册**：新组件生成后，追加完整定义（Props / Emits / Slots / CSS 变量依赖 / 视觉特征 / 文件位置）到注册表，并更新索引表
- 相同 UI 块出现 ≥2 次必须抽取到 `components/business/`；即使首次出现，若为通用 UI 模式（状态标签、筛选栏、操作栏、统计卡片等），也应直接抽取为组件并注册
- Props 用语义化枚举（`status: PlanStatus`），不用宽泛类型（`color: string`）
- 组件内部只引用 `var(--xxx)`，不写死颜色/字号
- 一个组件一个职责：`FilterBar` 管布局不关心筛选项，筛选项通过 slot 传入
- 跨页面一致性：Tag 颜色映射、分页器配置、弹窗宽度必须统一
