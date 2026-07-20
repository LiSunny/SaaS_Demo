# ai-spec：复工计划列表

> 页面路由：`/resumption` | 页面类型：列表管理 | 深度：🔵 light | 最后更新：2026-07-20

## 1. 组件树

```
PlanList (list-page)
└── content-card
    ├── help-card（可关闭引导说明）
    │   ├── img（说明配图）
    │   └── help-content
    │       ├── help-section > help-title + help-text
    │       └── help-section > help-subtitle + help-list
    ├── filter-bar
    │   ├── filter-left
    │   │   ├── search-input-wrap > input.fi-input + button.fi-clear + AppIcon(search)
    │   │   ├── fi-select-wrap > el-select（状态下拉：筹备中/试产中/已归档）
    │   │   ├── button.btn-primary [查询]
    │   │   └── button.btn-default [重置]（条件激活时显示）
    │   └── filter-right
    │       ├── button.btn-outline-primary [复工看板]
    │       └── button.btn-outline-primary > AppIcon(plus) [新建计划]
    ├── table-wrap
    │   └── table.fi-table
    │       ├── thead > tr.fi-thead-tr
    │       │   ├── th.col-name [复工场所]
    │       │   ├── th.col-status [状态]
    │       │   ├── th.col-step [当前步骤]
    │       │   ├── th.fi-th-sort.col-date [开始时间] > TableSortIcon
    │       │   ├── th.col-date2 [完成时间]
    │       │   └── th.col-actions [操作]
    │       └── tbody[v-loading]
    │           └── tr.fi-tbody-tr
    │               ├── td.col-name {{ locationName }}
    │               ├── td.col-status > StatusTag(plan_xxx)
    │               ├── td.col-step {{ currentStepLabel }}
    │               ├── td.col-date {{ startedAt }}
    │               ├── td.col-date2 {{ completedAt }}
    │               └── td.col-actions > .action-cell > button.act-btn.act-preview > AppIcon(preview)
    ├── pagination-wrap
    │   ├── span.pagi-total
    │   └── el-pagination（layout="sizes, prev, pager, next, jumper"）
    └── el-dialog [新建计划]
        ├── el-form
        │   └── el-form-item[label="复工场所"]
        │       └── el-select（filterable + allow-create，选项来自管理单元 Mock 数据）
        └── template#footer > button.btn-default [取消] + button.btn-primary [确定]
```

## 2. 组件映射

| 设计元素 | 组件 | 来源 | 关键 Props |
|---------|------|------|-----------|
| 状态标签 | StatusTag | `components/business/StatusTag.vue` | `status="plan_preparing\|plan_trial\|plan_archived"` |
| 搜索输入 | 原生 `.fi-input` | `style.css` 全局类 | `v-model="query.keyword"` |
| 图标 | AppIcon | `components/base/AppIcon.vue` | `name="search\|clear\|plus\|preview"` |
| 排序图标 | TableSortIcon | `components/base/TableSortIcon.vue` | `direction="none\|asc\|desc"` |
| 状态下拉 | el-select | Element Plus | `:teleported="false"`, `popper-class="fi-popper"` |
| 管理单元选择 | el-select | Element Plus | `filterable`, `allow-create` |
| 数据表格 | table.fi-table | 原生 HTML（范式：EnterpriseList.vue） | 固定表头 `position: sticky; top: 0` |
| 分页 | el-pagination | Element Plus | `layout="sizes, prev, pager, next, jumper"`, `:page-sizes="[10,20,50,100]"` |
| 新建弹窗 | el-dialog | Element Plus | `width="440px"`, 无 `destroy-on-close`（用 `@closed` 手动重置） |
| 按钮 | .btn-primary / .btn-default / .btn-outline-primary / .btn-link / .act-btn | `style.css` 全局类 | — |

## 3. 数据流

```
┌──────────────────────────────────────────────────────┐
│  useResumptionStore (Pinia)                           │
│  ├── list: ResumptionPlanItem[]                       │
│  ├── loading: boolean                                 │
│  ├── query: ResumptionQuery { keyword, status, page, size }│
│  ├── total: number                                    │
│  ├── fetchList()  →  getResumptionPlanList(query)     │
│  └── search()     →  query.page=1 + fetchList()       │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  getResumptionPlanList (resumption-dao.ts)            │
│  ├── 从 localStorage（createPersistentStore）读取     │
│  ├── 关键词筛选 → locationName.includes(kw)           │
│  ├── 状态筛选 → plan.status in statuses               │
│  ├── 按 createdAt 倒序                                │
│  └── 分页切片 → { data, total }                       │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  管理单元数据（新建弹窗）                              │
│  getManagementUnits(enterpriseId)                     │
│  └── 从 unitStore 读取平铺列表                        │
│  └── el-select 选中 → locationId + locationName       │
│  └── allow-create 输入 → locationName（无 locationId） │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  createResumptionPlan(locationName, enterpriseId, locationId?)│
│  ├── planStore.add(plan)                              │
│  └── 自动创建 11 个 pending 步骤（stepStore.add ×11） │
└──────────────────────────────────────────────────────┘
```

### Props 传递（无父子组件，单页面自包含）

| 方向 | 说明 |
|------|------|
| Store → 模板 | `store.list`、`store.loading`、`store.query`、`store.total` 直接绑定 |
| 模板 → Store | `store.search()`、`store.fetchList()` 通过事件触发 |
| 本地状态 | `showHelp`、`statusSortDir`、`dateSortDir`、`dialogVisible`、`dialogForm`、`creating`、`unitOptions` |

## 4. 交互状态

| 状态 | 触发条件 | UI 表现 |
|------|---------|--------|
| **加载中** | `store.loading === true` | tbody 显示 `v-loading` 遮罩 |
| **空数据** | `store.list.length === 0` 且非加载中 | 表格显示空状态（`empty-text="暂无数据"`） |
| **正常** | `store.list.length > 0` | 表格渲染数据行 |
| **搜索无结果** | keyword 有值 + list 为空 | 表格空状态 + 重置按钮可用 |
| **创建中** | `creating === true` | 确定按钮显示"创建中..."并 disabled |
| **创建成功** | `createResumptionPlan` resolve | ElMessage.success + 关闭弹窗 + 刷新列表 |
| **排序激活** | `dateSortDir !== 'none'` | 客户端排序 `store.list.sort(...)`；点击其他排序列时互斥重置 |

## 5. 边界条件

| 场景 | 处理方式 |
|------|---------|
| 车间名称过长（>20字） | 创建弹窗 el-select 的输入限制不在前端强制，允许超长；列表列 `min-width: 140px` 弹性扩展 |
| 开始时间/完成时间为空 | 显示 `—` |
| 已完成所有步骤的计划 | `currentStepLabel` 返回"已完成" |
| localStorage 无数据（首次加载） | `createPersistentStore` 自动用 SEED_PLANS 初始化 |
| 管理单元为空 | el-select 下拉为空，仅可通过 allow-create 输入新名称 |
| 重复创建同名复工场所 | light 阶段不校验，允许同名计划共存 |
| 分页计算异常（total=0） | `Math.ceil(0/20) \|\| 1` 兜底为第 1 页 |
| 响应式 ≤800px | 筛选栏纵向排列、分页纵向排列、引导卡片纵向排列 |

## 6. 样式来源

| 样式 | 位置 |
|------|------|
| 容器 `.list-page` `.content-card` | scoped（范式模板） |
| 筛选栏 `.filter-bar` `.filter-left` `.filter-right` `.search-input-wrap` `.fi-input` `.fi-clear` `.fi-icon` | `style.css` 全局类 |
| 表格 `.fi-table` `.fi-thead-tr` `.fi-th` `.fi-tbody-tr` `.fi-td` | `style.css` 全局类 |
| 按钮 `.btn-primary` `.btn-default` `.btn-outline-primary` `.btn-link` `.act-btn` `.act-preview` | `style.css` 全局类 |
| 分页 `.pagination-wrap` `.pagi-total` | `style.css` 全局类 + scoped 覆盖 EP 变量 |
| 标签 `.fi-tag` | StatusTag scoped |
| 引导卡片 | scoped（页面特有） |
| 列宽 `.col-*` | scoped（页面特有） |
| 响应式断点 | scoped（页面特有） |
| 弹窗圆角 | scoped `:deep(.el-dialog)` |

## 7. 文件索引

| 文件 | 行数 | 说明 |
|------|:---:|------|
| `src/types/resumption.ts` | ~95 | `ResumptionPlanItem`、`ResumptionQuery`、`PaginatedData`、`STEP_META` |
| `src/api/adapters/resumption-dao.ts` | ~200 | `getResumptionPlanList`、`createResumptionPlan`、`getStepLabel`、`getManagementUnits`、`ManagementUnit` |
| `src/stores/resumption.ts` | 42 | `useResumptionStore`：list/loading/query/total/fetchList/search |
| `src/views/resumption/PlanList.vue` | ~225 | 本页面 |
| `src/components/business/StatusTag.vue` | — | 追加 `plan_preparing`/`plan_trial`/`plan_archived` 映射 |
| `src/config/navigation.ts` | — | 追加 `resumption-mgmt` 导航组 + 路由映射 |

## 8. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-07-20 | v1.0：初始版本，基于 light 深度生成的 PlanList 实现 |
