# 设备设施管理 — 一级菜单接入方案

> 调研日期：2026-10-26
> 对标平台：智慧消防云平台 `beijingrenxing.com:9443`（租户：港南二中，账号 李文学）
> 状态：方案待实施（第 1 批菜单骨架 / 第 2~4 批真实页面）

---

## 一、结论

1. 新增一级分组「设备设施管理」，`visibleTo` 缺省（普通用户全员可见），`NAV_GROUPS` 由 10 个分组增至 11 个。
2. 子菜单按平台「设备管理」模块实测菜单复制，去掉平台「首页」：7 个二级项 + 15 个三级项，共 22 个节点、16 个可落地叶子。平台「使用手册」为语雀外链，不纳入。
3. 本期只新增，不改动「巡查检查」一级分组（`unit-patrol`，8 节点 / 8 路由，提交 `83f876f`）。
4. 与现有菜单重名的条目 10 处，本期并存不删，收口时机见 §九。
5. 可复用的真实页面 2 个（设备台账、保养计划），其余 14 个叶子先做占位页。
6. 新增路由 16 条，前缀 `/device-facility`，不复用旧路径，避免与 `安全管理›设备管理›设备台账` 抢占同一路由的选中态。

---

## 二、平台侧基线（实测 2026-10-26）

### 2.1 顶部一级菜单（港南二中）

设备管理、巡查检查、远程值守、维保应用、数据可视化、隐患管理、食品安全管理、培训与演练、系统管理（共 9 项）。

「设备管理」与「巡查检查」在平台是两个并列的顶部一级菜单。

### 2.2 「设备管理」左侧菜单树（港南二中）

| # | 二级菜单 | 类型 | 三级子项 | 平台路由 |
|---|---------|------|---------|----------|
| 1 | 首页 | 叶子 | — | 未获取 |
| 2 | 设备台账 | 叶子 | — | `#/device/ledger/index` |
| 3 | 保养管理 | 父级 | 保养规范、保养计划、保养任务、保养记录 | 保养规范 `#/device/maintenance/standard/index`；保养记录 `#/device/maintenance/record/index`；其余未获取 |
| 4 | 运行监控 | 父级 | 状态监控、场景监控 | 未获取 |
| 5 | 报表与报告 | 父级 | 告警分析报告、设备运行报表 | 未获取 |
| 6 | 系统日志 | 父级 | 事件日志 | 未获取 |
| 7 | 规则配置 | 父级 | 自定义事件、平面图描点、数据拉取、数据推送、策略执行器 | 未获取 |
| 8 | 消息推送 | 父级 | 告警推送 | 未获取 |
| 9 | 使用手册 | 叶子（语雀外链） | — | `#/iframes/<base64>` |

计数：二级 9 项（叶子 2、父级 6、外链 1），三级 15 项，叶子合计 18（含外链 1），站内可落地叶子 17。按要求不落地平台「首页」，本方案落地叶子 16 个。

### 2.3 租户差异

同一模块在「（规上）韧性木业」租户的「规则配置」为 3 项（自定义事件、平面图描点、数据拉取），港南二中为 5 项（多数据推送、策略执行器）。本方案按港南二中口径。

### 2.4 「巡查检查」不动的基线（本期不变）

8 个节点：首页 / 任务监控›巡查任务 / 项目配置 / 点位管理 / 计划管理›消防巡查 / 异常处置 / 巡查报表 / 通知提醒。路由 `/unit/patrol/*`，菜单配置见 `src/config/navigation.ts:179-211`。

---

## 三、目标菜单树（本仓库）

```
设备设施管理（新增一级分组，key: device-facility）
├── 设备台账         /device-facility/ledger
├── 保养管理
│   ├── 保养规范      /device-facility/maintenance/standard
│   ├── 保养计划      /device-facility/maintenance/plans
│   ├── 保养任务      /device-facility/maintenance/tasks
│   └── 保养记录      /device-facility/maintenance/records
├── 运行监控
│   ├── 状态监控      /device-facility/monitor/status
│   └── 场景监控      /device-facility/monitor/scene
├── 报表与报告
│   ├── 告警分析报告   /device-facility/report/alarm
│   └── 设备运行报表   /device-facility/report/device
├── 系统日志
│   └── 事件日志      /device-facility/log/event
├── 规则配置
│   ├── 自定义事件     /device-facility/rule/custom-event
│   ├── 平面图描点     /device-facility/rule/plan-point
│   ├── 数据拉取       /device-facility/rule/data-fetch
│   ├── 数据推送       /device-facility/rule/data-push
│   └── 策略执行器     /device-facility/rule/strategy
└── 消息推送
    └── 告警推送      /device-facility/notify/alarm-push
```

节点 22 个（7 个二级 + 15 个三级），叶子 16 个 = 路由 16 条。

侧栏渲染能力满足该层级：`src/layouts/DefaultLayout.vue:142-219` 支持「分组 → 节点 → 节点子项」三级可点，三级项不带图标。

---

## 四、菜单映射表

| 平台菜单 | 本仓库菜单 | 路由 | 页面来源 |
|---------|-----------|------|----------|
| 设备台账 | 设备台账 | `/device-facility/ledger` | 复用 `src/views/device/DeviceList.vue` |
| 保养管理 › 保养规范 | 保养规范 | `/device-facility/maintenance/standard` | 新建占位页 |
| 保养管理 › 保养计划 | 保养计划 | `/device-facility/maintenance/plans` | 复用 `src/views/maintenance/PlanList.vue` |
| 保养管理 › 保养任务 | 保养任务 | `/device-facility/maintenance/tasks` | 新建占位页 |
| 保养管理 › 保养记录 | 保养记录 | `/device-facility/maintenance/records` | 新建占位页 |
| 运行监控 › 状态监控 | 状态监控 | `/device-facility/monitor/status` | 新建占位页 |
| 运行监控 › 场景监控 | 场景监控 | `/device-facility/monitor/scene` | 新建占位页 |
| 报表与报告 › 告警分析报告 | 告警分析报告 | `/device-facility/report/alarm` | 新建占位页 |
| 报表与报告 › 设备运行报表 | 设备运行报表 | `/device-facility/report/device` | 新建占位页 |
| 系统日志 › 事件日志 | 事件日志 | `/device-facility/log/event` | 新建占位页 |
| 规则配置 › 自定义事件 | 自定义事件 | `/device-facility/rule/custom-event` | 新建占位页 |
| 规则配置 › 平面图描点 | 平面图描点 | `/device-facility/rule/plan-point` | 新建占位页 |
| 规则配置 › 数据拉取 | 数据拉取 | `/device-facility/rule/data-fetch` | 新建占位页 |
| 规则配置 › 数据推送 | 数据推送 | `/device-facility/rule/data-push` | 新建占位页 |
| 规则配置 › 策略执行器 | 策略执行器 | `/device-facility/rule/strategy` | 新建占位页 |
| 消息推送 › 告警推送 | 告警推送 | `/device-facility/notify/alarm-push` | 新建占位页 |
| 首页 | 不纳入 | — | 平台模块首页，按要求不做菜单项 |
| 使用手册 | 不纳入 | — | 语雀外链，与巡查检查一致处理 |

复用 2 页 + 占位 14 页 = 16 页；不纳入 2 项（首页、使用手册）。

---

## 五、与现有菜单的关系

### 5.1 重名条目（本期并存）

| # | 现有条目 | 所属分组 | 与新菜单关系 | 现有路由是否有页面 |
|---|---------|---------|-------------|------------------|
| 1 | 设备台账 | 安全管理 › 设备管理 | 同名 | 有（`/device/list`） |
| 2 | 保养任务 | 安全管理 › 设备管理 | 同名 | 无 |
| 3 | 保养记录 | 安全管理 › 设备管理 | 同名 | 无 |
| 4 | 保养规范 | 单位设置 › 设备设置 | 同名 | 无 |
| 5 | 保养计划 | 单位设置 › 设备设置 | 同名 | 无 |
| 6 | 运行监控 | 单位设置 › 设备设置 | 同名 | 无 |
| 7 | 设备报表 | 单位设置 › 设备设置 | ≈ 平台「设备运行报表」 | 无 |
| 8 | 设备配置 | 单位设置 › 设备设置 | ≈ 平台「规则配置」 | 无 |
| 9 | 系统日志 | 单位设置 › 设备设置 | ≈ 平台「事件日志」 | 无 |
| 10 | 告警推送 | 单位设置 › 告警设置 | = 平台「消息推送 › 告警推送」 | 无 |

10 处重名，其中仅第 1 处指向已有页面。

### 5.2 本仓库现状数据

| 指标 | 值 | 来源 |
|------|----|------|
| `NAV_GROUPS` 分组数 | 10 | `src/config/navigation.ts` |
| 导航配置引用路由数 | 85 | `src/config/navigation.ts` 全部 `route:` 去重 |
| 其中 router 内无对应页面 | 43（50.6%） | 与 `src/router/index.ts` 路径表逐条比对 |
| 可复用的设备类真实页 | 2（`/device/list`、`/maintenance/plans`） | `src/views/device/DeviceList.vue`、`src/views/maintenance/PlanList.vue` |

死链 43 条与本模块无关（隐患、培训、单位设置等历史项），本模块新增的 16 条路由全部落地。

---

## 六、代码落点（第 1 批）

| 文件 | 改动 |
|------|------|
| `src/config/navigation.ts` | `NAV_GROUPS` 新增分组 `device-facility`（label「设备设施管理」，`visibleTo` 缺省，`defaultOpen: true`），含 7 个二级节点 + 15 个三级节点；`ROUTE_TO_NAV_KEY` 补 16 条（具体路径在前、前缀项在后）；`NAV_KEY_TO_ROUTE` 补 16 条 |
| `src/router/index.ts` | 新增 `/device-facility` 路由块（`component: DefaultLayout`），16 个子路由，`name` 与占位页配置键一一对应 |
| `src/views/device-facility/DeviceFacilityPlaceholder.vue` | 新建占位页组件，结构与样式对齐 `src/views/patrol/PatrolPlaceholder.vue` |
| `src/views/device-facility/facility-pages.ts` | 新建 14 条页面配置（`code`/`title`/`module`/`desc`/`caps`/`status`），字段体例对齐 `src/views/patrol/patrol-pages.ts`；设备台账、保养计划 2 条路由直接复用真实页组件，不进本表 |
| `src/config/permission-modules.ts` | 「设备与物联」分组新增 `{ key: 'device-facility', name: '设备设施管理' }` |
| `src/views/workbench/widgets/AppShortcutsWidget.vue` | 「设备管理」快捷入口 `route` 由 `/maintenance/plans` 改为 `/device-facility/ledger` |

### 6.1 分组位置

建议插在「协同工作」与「安全管理」之间（`NAV_GROUPS` 中 `unit-collab-work` 之后、`unit-daily` 之前），使设备域与巡查域相邻。

### 6.2 图标

取自 `public/sprite.svg`，组内不重复，且均为 `src/config/navigation.ts` 当前未占用的编号：

| 节点 | 图标 |
|------|------|
| 设备设施管理（分组） | `menuicon-46` |
| 设备台账 | `menuicon-31` |
| 保养管理 | `menuicon-32` |
| 运行监控 | `menuicon-33` |
| 报表与报告 | `menuicon-35` |
| 系统日志 | `menuicon-36` |
| 规则配置 | `menuicon-38` |
| 消息推送 | `menuicon-39` |

15 个三级项不带图标。

### 6.3 可见范围

`visibleTo` 缺省时：普通用户按企业群体匹配时全部通过（`src/layouts/DefaultLayout.vue:448-458`）；系统角色账号（`platform-ops` / `platform-admin`）只显示带 `visibleTo` 的分组，故看不到本分组（`src/layouts/DefaultLayout.vue:426-434`）。

---

## 七、交付批次

| 批次 | 内容 | 交付物 |
|------|------|--------|
| 第 1 批 | 菜单骨架 | 1 个分组 + 22 个菜单节点 + 16 条路由 + 14 个占位页 + 2 个复用页 + 两张映射表登记 + 权限模块 + 工作台入口 |
| 第 2 批 | 设备与保养核心页 | 设备台账（台账字段 + 增删改）、保养规范、保养计划、保养任务、保养记录 |
| 第 3 批 | 运行与报表 | 状态监控、场景监控、告警分析报告、设备运行报表、事件日志、告警推送 |
| 第 4 批 | 规则配置 | 自定义事件、平面图描点、数据拉取、数据推送、策略执行器（依赖设备物联数据打通） |

第 1 批验收实测（2026-10-26，dev server 3202，账号 新思维高级中学 · 企业管理员）：侧栏出现「设备设施管理」一级分组，位置在「协同工作」与「安全管理」之间，7 个二级项均可展开；抽查 4 条路由全部正常渲染——保养规范（F2-1 占位页）、告警推送（F7-1 占位页）、设备台账（真实页，5 条记录）、保养计划（真实页，5 条记录）；控制台含 `device-facility` 的告警 0 条；`vue-tsc --noEmit` 与 `vite build` 均通过。静态核对：router 16 条路由、`ROUTE_TO_NAV_KEY` 16 条、`NAV_KEY_TO_ROUTE` 16 条、菜单带路由节点 16 个，key 集合完全一致。

数据落位：走 `src/api/adapters/` DAO 适配层 + `src/api/` 接口层，不写死在组件内。

---

## 八、验收标准

1. 侧栏出现「设备设施管理」一级分组，展开后 7 个二级项 + 15 个三级项，名称与 §2.2 逐项一致（首页、使用手册除外）。
2. 16 条路由全部可访问，控制台无「未登记到 ROUTE_TO_NAV_KEY」告警。
3. 「设备台账」「保养计划」渲染真实页组件，其余 14 项渲染占位页。
4. 「巡查检查」一级分组及其 8 条路由行为不变。
5. 现有 10 处重名条目均未被删除或改路径。
6. `vue-tsc --noEmit` 通过。

---

## 九、待确认

| # | 事项 | 现状 |
|---|------|------|
| 1 | 「设备设施管理」在侧栏的排序位置 | 建议置于「协同工作」与「安全管理」之间 |
| 2 | 现有 10 处重名条目的收口时机 | 本期并存；建议第 2 批完成后删除 `安全管理›设备管理`、`单位设置›设备设置` 中的设备相关条目 |
| 3 | 「规则配置」5 项对普通单位是否可见 | 平台为平台侧能力，本方案按全员可见实施，待定 |
| 4 | 「巡查检查」是否同步调整 | 已定：不动 |

---

## 附：数据来源

| 来源 | 说明 |
|------|------|
| 平台「设备管理」菜单 | `https://beijingrenxing.com:9443/` → 顶栏「设备管理」（港南二中租户，2026-10-26 实测） |
| 平台「巡查检查」菜单 | `https://beijingrenxing.com:9443/#/patrol/taskManagement/patrolTask/index` |
| 平台租户差异 | `https://beijingrenxing.com:9443/#/device/ledger/index`（（规上）韧性木业租户） |
| 本仓库导航配置 | `src/config/navigation.ts` |
| 本仓库路由表 | `src/router/index.ts` |
| 侧栏渲染与分组过滤 | `src/layouts/DefaultLayout.vue:142-219`、`:423-458` |
| 巡查检查模块方案 | `docs/巡查检查/module-plan.md` |
