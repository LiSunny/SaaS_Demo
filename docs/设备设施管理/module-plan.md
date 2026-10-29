# 设备设施管理 — 一级菜单接入方案

> 调研日期：2026-10-26
> 对标平台：智慧消防云平台 `beijingrenxing.com:9443`（租户：港南二中，账号 李文学）
> 状态：方案待实施（第 1 批菜单骨架 / 第 2~4 批真实页面）
> 后续补充：组态配置 + 图元库接入（第 2 批）；消防三系统监测迁入运行监控（2026-10-27，见 §6.5）；消防水系统监测页重构为垂直三段（2026-10-27，见 §6.7）；气体灭火系统监测页重构 + 监测页公共组件层（2026-10-28，见 §6.9）

---

## 一、结论

1. 新增一级分组「设备设施管理」，`visibleTo` 缺省（普通用户全员可见），`NAV_GROUPS` 由 10 个分组增至 11 个。
2. 子菜单按平台「设备管理」模块实测菜单复制，去掉平台「首页」：7 个二级项 + 15 个三级项，共 22 个节点、16 个可落地叶子。平台「使用手册」为语雀外链，不纳入。
3. 本期只新增，不改动「巡查检查」一级分组（`unit-patrol`，8 节点 / 8 路由，提交 `83f876f`）。
4. 与现有菜单重名的条目 10 处，本期并存不删，收口时机见 §九。
5. 可复用的真实页面 2 个（设备台账、保养计划），其余 14 个叶子先做占位页。
6. 新增路由 16 条，前缀 `/device-facility`，不复用旧路径，避免与 `安全管理›设备管理›设备台账` 抢占同一路由的选中态。
7. 2026-10-27：「运行监控」新增 3 项消防三系统监测（消防水 / 气体灭火 / 防排烟），页面复用 `src/views/subsystem/` 既有真实页；平台「运行监控」只有状态监控、场景监控 2 项，这 3 项为本仓库新增。
8. 2026-10-27：消防水系统监测页重构为垂直三段（核心数据 → 组态 → 报警记录），路由与菜单 key 不变，详见 §6.7。

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
| 7 | 规则配置 | 父级 | 自定义事件、平面图描点、数据拉取、数据推送、策略执行器 | 未获取（本仓库另加「组态配置」，平台无对应项） |
| 8 | 消息推送 | 父级 | 告警推送 | 未获取 |
| 9 | 使用手册 | 叶子（语雀外链） | — | `#/iframes/<base64>` |

计数：二级 9 项（叶子 2、父级 6、外链 1），三级 16 项，叶子合计 19（含外链 1），站内可落地叶子 18。按要求不落地平台「首页」，本方案落地叶子 17 个。

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
│   ├── 场景监控      /device-facility/monitor/scene
│   ├── 消防水系统监测   /device-facility/monitor/fire-water      ← 本仓库新增
│   ├── 气体灭火系统监测 /device-facility/monitor/fire-gas       ← 本仓库新增
│   └── 防排烟系统监测   /device-facility/monitor/fire-smoke     ← 本仓库新增
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
│   ├── 策略执行器     /device-facility/rule/strategy
│   └── 组态配置       /device-facility/rule/scene-config
└── 消息推送
    └── 告警推送      /device-facility/notify/alarm-push
```

组态配置另有两条非菜单路由：编辑器 `/device-facility/rule/scene-config/:id/editor`、图元管理 `/device-facility/rule/symbol-library`（编辑器右侧图元选择组件右上角入口，不进侧栏）。

节点 26 个（7 个二级 + 19 个三级），叶子 20 个 = 菜单路由 20 条 + 非菜单路由 2 条 = 路由 22 条。

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
| 运行监控 › 消防水系统监测 | 消防水系统监测 | `/device-facility/monitor/fire-water` | 复用 `src/views/subsystem/PipelineMonitor.vue`（真实页） |
| 运行监控 › 气体灭火系统监测 | 气体灭火系统监测 | `/device-facility/monitor/fire-gas` | 复用 `src/views/subsystem/GasExtinguishMonitor.vue`（真实页） |
| 运行监控 › 防排烟系统监测 | 防排烟系统监测 | `/device-facility/monitor/fire-smoke` | 复用 `src/views/subsystem/SmokeExhaustMonitor.vue`（真实页） |
| 报表与报告 › 告警分析报告 | 告警分析报告 | `/device-facility/report/alarm` | 新建占位页 |
| 报表与报告 › 设备运行报表 | 设备运行报表 | `/device-facility/report/device` | 新建占位页 |
| 系统日志 › 事件日志 | 事件日志 | `/device-facility/log/event` | 新建占位页 |
| 规则配置 › 自定义事件 | 自定义事件 | `/device-facility/rule/custom-event` | 新建占位页 |
| 规则配置 › 平面图描点 | 平面图描点 | `/device-facility/rule/plan-point` | 新建占位页 |
| 规则配置 › 数据拉取 | 数据拉取 | `/device-facility/rule/data-fetch` | 新建占位页 |
| 规则配置 › 数据推送 | 数据推送 | `/device-facility/rule/data-push` | 新建占位页 |
| 规则配置 › 策略执行器 | 策略执行器 | `/device-facility/rule/strategy` | 新建占位页 |
| 规则配置 › 组态配置 | 组态配置 | `/device-facility/rule/scene-config` | 新建真实页 `src/views/device-facility/SceneConfigList.vue`（画面列表 + 新增） |
| 组态配置 › 编辑器 | 组态编辑器 | `/device-facility/rule/scene-config/:id/editor` | 新建真实页 `src/views/device-facility/SceneEditor.vue`（非菜单项） |
| 组态配置 › 图元管理 | 图元管理 | `/device-facility/rule/symbol-library` | 新建真实页 `src/views/device-facility/SymbolLibraryPage.vue`（编辑器内入口，非菜单项） |
| 消息推送 › 告警推送 | 告警推送 | `/device-facility/notify/alarm-push` | 新建占位页 |
| 首页 | 不纳入 | — | 平台模块首页，按要求不做菜单项 |
| 使用手册 | 不纳入 | — | 语雀外链，与巡查检查一致处理 |

复用 5 页（设备台账、保养计划、消防水、气体灭火、防排烟监测）+ 占位 14 页 + 新建真实页 3 页（组态配置列表、组态编辑器、图元管理）= 22 页；不纳入 2 项（首页、使用手册）。

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

死链 43 条与本模块无关（隐患、培训、单位设置等历史项），本模块新增的 19 条路由全部落地。

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

16 个三级项不带图标。

### 6.3 可见范围

`visibleTo` 缺省时：普通用户按企业群体匹配时全部通过（`src/layouts/DefaultLayout.vue:448-458`）；系统角色账号（`platform-ops` / `platform-admin`）只显示带 `visibleTo` 的分组，故看不到本分组（`src/layouts/DefaultLayout.vue:426-434`）。

### 6.4 第 2 批：组态配置 + 图元库接入

| 文件 | 改动 |
|------|------|
| `symbol-library/` | 迁入消防给水图元库子工程：27 图元 / 8 分类 / 69 绑定点 / 54 连接点，真源 `src/symbols.source.js`，构建产物 `dist/`（含 27 张 512×512 位图） |
| `scripts/build-symbols.mjs`、`scripts/sync-symbol-assets.mjs` | 图元库构建入口 + 位图同步到 `public/symbols/img`（服务路径 `/symbols/img/`）；npm 命令 `symbols:build`、`symbols:sync` |
| `src/symbols/index.ts`、`src/symbols/runtime.d.ts`、`src/symbols/theme.css` | 接入层：运行时单例、图元元数据、点表解析、几何计算；类型声明；配色令牌化（`--sym-*` 改挂 `var(--xxx)`） |
| `src/types/scene-config.ts`、`src/stores/scene-config.ts` | 组态画面类型与 store（画面列表走 `src/utils/db-adapter.ts`，草稿键 `scene-config:draft:<id>`） |
| `src/views/device-facility/SceneConfigList.vue` | 组态配置列表页（范式对齐 `src/views/maintenance/PlanList.vue`）：筛选、新增/编辑弹窗、预览弹窗、启停、删除 |
| `src/views/device-facility/SceneEditor.vue` | 组态编辑器：顶栏 + 画布 + 右侧图元选择组件 + 属性面板；改动自动存草稿，保存写回画面记录，导入导出 JSON |
| `src/views/device-facility/SymbolLibraryPage.vue` | 图元管理：分类浏览、缩略图、状态预览、绑定点表；新增/删除自定义图元（内置图元只读不可删） |
| `src/components/device-facility/` | `SceneCanvas.vue`、`SymbolPicker.vue`（含「图元管理」入口）、`ScenePropertyPanel.vue`、`SymbolThumb.vue`、`SceneSymbolNode.vue` |
| `src/config/navigation.ts` | `df-rule` 增加三级项「组态配置」；`ROUTE_TO_NAV_KEY` 补 2 条并置于 `'/device'` 之前（否则 `/device` 前缀会抢命中）；`NAV_KEY_TO_ROUTE` 补 1 条 |
| `src/router/index.ts` | 新增 3 条路由（列表、编辑器、图元管理） |
| `vite.config.ts` | alias 增加 `@symbols` → `symbol-library/dist` |
| `e2e/specs/scene-config.spec.ts` | 新增组态配置 e2e 用例 4 条 |

### 6.5 第 3 批：消防三系统监测迁入运行监控（2026-10-27）

原「值守与应急 › 消防监控」4 项（消防管网系统 / 消防管网·组态总览 / 气体灭火系统 / 消防防排烟系统）删除，3 项三系统监测迁到「设备设施管理 › 运行监控」，组态总览无菜单入口。

| 文件 | 改动 |
|------|------|
| `src/config/navigation.ts` | 删除 `unit-fire-monitor` 节点及 4 个子项；`df-monitor` 增加 `df-monitor-fire-water` / `df-monitor-fire-gas` / `df-monitor-fire-smoke`；`ROUTE_TO_NAV_KEY` 补 3 条新路径、删 3 条 `/fire/*` 旧路径、保留 `/fire/pipeline/topology`；`NAV_KEY_TO_ROUTE` 补 3 条、删 4 条 `unit-fire-*` |
| `src/router/index.ts` | `/device-facility` 下新增 3 条子路由（复用 `src/views/subsystem/` 组件）；`/fire/pipeline`、`/fire/gas`、`/fire/smoke` 改为重定向到新路径，`/fire/pipeline/topology` 保留为真实路由（无菜单入口） |
| 可见范围 | 三项不设 `visibleTo`，跟随「设备设施管理」分组对所有使用群体可见 |

旧链接兼容：`/fire/pipeline`、`/fire/gas`、`/fire/smoke` 301 到新路径；`/fire/pipeline/topology` URL 仍可达，侧栏高亮落在「消防水系统监测」。

### 6.6 组态连线：自动中点拐点 + 流动动画（2026-10-27）

连线拐点不再依赖手工拖拽：默认路径经过两个端口连线的中点（正交，中间长边取两端偏移较大者）；连线可设流动方向，正向 = 源→目标、反向 = 目标→源，虚线沿方向行进，方向末端带箭头。

| 文件 | 改动 |
|------|------|
| `src/types/scene-config.ts` | `SceneEdge` 增 `routeMode`（auto/align/manual）、`flow`（none/forward/reverse） |
| `src/symbols/index.ts` | 抽出 `edgePoints()`；`edgeRouteMode()` 判有效模式（显式 `routeMode` 优先，否则有折点按手动、无折点按自动中点）；`edgePathReversed()` 出反向路径 |
| `src/components/device-facility/SceneCanvas.vue` | 连线叠加流动光带 path（`stroke-dashoffset` 关键帧）+ 方向箭头 marker；新增 `animate` 属性 |
| `src/components/device-facility/ScenePropertyPanel.vue` | 连线属性增「路径方式」「流动方向」；折点输入仅手动模式可用 |
| `src/views/device-facility/SceneEditor.vue` | 顶栏增「连线动画」开关 |

兼容性：`via` 折点与 `kind` 语义不变；带折点的历史画面走线与改前逐点一致；导入校验不拦截新字段，导出 JSON 自动携带。

### 6.7 第 4 批：消防水系统监测页重构为垂直三段（2026-10-27）

`/device-facility/monitor/fire-water` 由「点位长列表」改为**垂直三段**：① 核心数据 → ② 组态 → ③ 报警记录。路由路径与菜单 key 均不变，导航树无改动。

| 文件 | 改动 |
|------|------|
| `src/views/subsystem/FireWaterMonitor.vue` | 新页面：页头（演示数据标识 / 刷新三档状态 / 更新时间）+ 三段垂直布局 + 两级下钻抽屉 |
| `src/views/subsystem/PipelineMonitor.vue` | **删除**（`src/` 内仅 router 一处引用，已改指新页） |
| `src/components/subsystem/FireWaterCoreCards.vue` | ① 核心数据 4 卡（供水压力 / 供水流量 / 水池水位 / 系统状态），卡可下钻 |
| `src/components/subsystem/FireWaterScene.vue` | ② 只读位图组态：复用 `SceneSymbolNode` + `@/symbols` 的 `edgePath`/`edgePathReversed`，实线底管 + 流动光带 |
| `src/components/subsystem/FireWaterPointDrawer.vue` | 点位组抽屉：列出图元所辖点位（异常优先 + 关键字过滤），点行转单点详情 |
| `src/components/subsystem/FireWaterAlarmTable.vue` | ③ 报警记录表：`fi-table`，等级筛选 + 标记已处理 |
| `src/config/firewater-scene.json` | **组态画面真源**：组态编辑器导出的「消防给水系统总貌」（1200×700 / 12 节点 / 12 连线），改画面后整份替换此文件 |
| `src/config/firewater-scene.ts` | 读画面 JSON + 节点↔点位绑定表 + 核心数据卡取值规则 |
| `src/stores/firewater-alarm.ts` | 报警记录 store：当前异常点位实时累积（正常→报警/故障才记一条）+ 首次加载补 12 条确定性历史，上限 200 条 |
| `src/types/firewater.ts` | 报警记录 / 点位组 / 节点绑定 / 核心数据卡类型 |
| `src/router/index.ts` | `monitor/fire-water` 组件改指 `FireWaterMonitor.vue`（路径与 name 不变） |
| `src/components/business/StatusTag.vue` | `MAP` 增 `critical`/`important`/`general`/`unhandled`/`handled` |
| `src/symbols/theme.css` | 补 `.is-alarm`/`.is-discharge` 的令牌覆盖（图元库原本写死橙色与深红） |
| `scripts/verify-fire-pages.mjs` | 断言改新结构（三段顺序 / 4 卡 / 16 图元 / 13 连线 / 卡面声明数与抽屉实到数互校）；外壳 401 单独归类 |
| `e2e/specs/fire-water-monitor.spec.ts` | 新增 e2e 用例 4 条 |

**点位绑定口径**（`FIREWATER_NODE_BINDINGS`）：typeKey + 编号前缀圈定设备档案类，再按类内序号切片。压力 38+38+38 = 114 ✓ 阀门 719 + 72 = 791 ✓ 液位 2+2 = 4 ✓ 试水 232 ✓ 主机 1 + 分机 4+2+2 = 9 ✓。组态覆盖 1150 个点位，其余 6 个流量点由「供水流量」卡下钻进入 → 1156 个点位全部可达。

组态画面分上下两条支路，阀门节点 (n10) 为两条支路共用：

| 节点 | 图元 | 标签 | 点位分组 | 显示值 |
|---|---|---|---|---|
| n1 | TNK-FIRE-01 | 消防水池 | `water_level` [0,2) | 最低水位 % |
| n2 | RES-TANK-01 | 消防水箱 | `water_level` [2,4) | 最低水位 % |
| n3 | PMP-SET-01 | 消防泵组 | `pipe_slave` [4,6) | 运行 N/2 |
| n5 | CAB-PMP-01 | 稳压控制柜 | `pipe_host` | 设备状态 |
| n9 | HYD-IND-01 | 室内消火栓 | `pipe_pressure` [0,38) | 最小压力 |
| n10 | VLV-BUTT-01 | 阀门 | `valve_switch` FM | 开 N/719 |
| n11 | HYD-HOSE-01 | 消火栓箱 | `pipe_pressure` [38,76) | 最小压力 |
| n15 | TST-TEST-01 | 末端试水装置 | `hydrant_test` | 启动 N/232 |
| nmvq2pm3bw7kl | PMP-SET-01 | 消防泵组 | `pipe_slave` [6,8) | 运行 N/2 |
| nmvq2q06li0ev | CAB-PMP-01 | 消防泵控制柜 | `pipe_slave` [0,4) | 运行 N/4 |
| nmvq7w5er8tog | SPK-SPR-01 | 喷淋喷头 | `pipe_pressure` [76,114) | 最小压力 |
| nmvqajja98rbz | ALV-GRP-01 | 报警阀组 | `valve_switch` BZ | 开 N/72 |

**核心数据取值**（`computeFireWaterCards`）：供水压力 = 114 个压力测点最小值；供水流量 = 6 个流量测点算术平均；水池水位 = 4 个液位测点最小值（按量程上限折算 %）；系统状态 = 1156 个点位状态计数派生。正常范围文案取自指标定义的 `normalRange`，卡片副行标明分母（测点数）。

**规模说明口径**：页头「共 1 处主机、8 台分机、N 个采集点位」取 `points` 全量长度（N = 1156 = 1147 个采集设备 + 1 主机 + 8 分机），与「系统状态」卡同口径。`scale.devices` 之和是设备数而非点位数，不可直接用作 N。`scripts/verify-fire-pages.mjs` 断言页头 N 与卡片 N 相等。

### 6.8 图元管理：新增/删除自定义图元（2026-10-28）

图元管理页从只读改为可维护。内置 47 个图元仍是图元库构建产物、只读不可删；新增走**运行时图层**：服务端存元数据与产品图，运行时注册进渲染链路，不重建图元库。

| 文件 | 改动 |
|------|------|
| `server/prisma/schema.prisma` | 新增 `CustomSymbol`（symbolId 唯一、imageUrl/imageKey、bboxJson、portsJson、bindingsJson、enterpriseId 可空=平台级） |
| `server/src/services/custom-symbol.service.ts` | CRUD + 校验（ID 命名规范、连接点越界/方向、绑定点名全局唯一、状态类已声明、至少一个绑定点）+ 删除时清理 OSS 对象 |
| `server/src/controllers/custom-symbol.controller.ts`、`server/src/routes/custom-symbol.routes.ts` | `/api/symbols/custom` 五个接口，需登录 |
| `server/src/services/upload.service.ts` | 新增 `deleteFile(key)` |
| `src/symbols/index.ts` | `SYMBOLS` / `SYMBOL_POINTS` 改 `reactive`；新增 `registerCustomSymbol` / `unregisterCustomSymbol` / `isCustomSymbol`；自定义图元图片 markup 不写 `data-file`，产品图 href 不被 imageBase 覆盖 |
| `symbol-library/src/build.mjs` | 导出 `BADGES`（状态角标 markup），平台侧复用不复制 |
| `src/stores/symbols.ts`、`src/api/symbols.ts`、`src/api/adapters/symbol-http.ts` | 自定义图元拉取与 CRUD，拉取后注册进渲染链路 |
| `src/utils/symbol-image.ts` | 产品图处理：抠背景 → 512×512 → 内容框 bbox（供状态光晕计算） |
| `src/components/device-facility/SymbolFormDrawer.vue` | 新增/编辑抽屉：产品图上传、连接点网格编辑器、绑定点录入 |
| `src/views/device-facility/SymbolLibraryPage.vue` | 增「新增图元」入口；自定义图元带标记与删除按钮；详情抽屉区分内置/自定义 |
| `src/components/business/OssUpload.vue` | 新增可选 `transform` 钩子，供上传前加工图片 |
| `e2e/specs/symbol-library.spec.ts` | 新增自定义图元增删用例 2 条 |
| `src/components/device-facility/SymbolPicker.vue` | 组件自持 `store.load()`，组态编辑器直接刷新进入也能拿到自定义图元 |
| `src/symbols/index.ts` | 新增 `renderSymbolSafe()`（未知图元返回 null 不抛错）与 `SYMBOL_REGISTRY_VERSION`（注册/注销自增） |
| `src/components/device-facility/SymbolThumb.vue`、`src/components/device-facility/SceneSymbolNode.vue` | 改用 `renderSymbolSafe()`；监听 `SYMBOL_REGISTRY_VERSION`，图元就位后重绘 |

**删除语义**：内置图元不可删（真源在 `symbols.source.js`，运行时删了下次构建会回来）。组态画面存在浏览器本地（`db:scene-config`），服务端不知道引用关系，删除前的引用统计在前端做，命中则二次确认并列出画面名，确认后把命中的节点与相关连线从画面记录和草稿中一并移除。

**导出**：画面导出 JSON 增 `symbols` 字段，携带所用到的自定义图元定义（内置图元由图元库提供，不携带）。

**异步注册**：自定义图元拉取后才注册进渲染链路，页面首帧可能先于注册完成。图元库 runtime 对未知图元抛错，而 Vue 挂载钩子抛错会中断整条 post-flush 队列，导致同批次其他缩略图 / 画布节点一起不渲染 —— 故在平台层用 `renderSymbolSafe()` 兜底，并用 `SYMBOL_REGISTRY_VERSION` 触发注册后重绘。

**已知限制**：自定义图元只有图片版，线框版为占位；绑定类型限 bool / level / text（无指针几何，不开放 angle）；绑定点暂不接实时点位数据源。

### 6.9 气体灭火系统监测页重构 + 监测页公共组件层（2026-10-28）

`/device-facility/monitor/fire-gas` 由通用点位长列表页（`SubsystemMonitorPage`）改为与消防水页同版式：统计区常驻 → 视图切换条 → 主体区三视图 + 两级下钻抽屉。路由路径与菜单 key 均不变。

同时把两页共用的版式与组件抽成公共层，消防水页同步改造为调用公共组件（版式、取值口径、路由均不变）。

| 文件 | 改动 |
|------|------|
| `src/components/subsystem/SubsystemMonitorLayout.vue` | **新增**：监测页骨架（统计区 + 视图切换 + 三视图 + 两级下钻抽屉 + 刷新三档状态），两系统共用 |
| `src/components/subsystem/SubsystemScene.vue` | **新增**：只读组态渲染器（三层 SVG：底图位图 / 文本数值 / 流动动画），画面内容由适配器传入 |
| `src/components/subsystem/SubsystemCoreCards.vue`、`SubsystemKpiRing.vue`、`SubsystemTabs.vue`、`SubsystemAlarmTable.vue`、`SubsystemLedgerTable.vue`、`SubsystemPointDrawer.vue` | **新增**：统计卡 / 环形图 / 视图切换 / 报警记录表 / 设备台帐 / 点位组抽屉 |
| `src/components/subsystem/FireWater*.vue`（7 个） | **删除**：并入公共组件 |
| `src/types/subsystem-scene.ts` | **新增**：公共类型（报警记录 / 图元绑定 / 统计卡 / 视图切换 / 场景适配器 `SubsystemSceneAdapter`） |
| `src/config/subsystem-scene-core.ts` | **新增**：绑定公共内核（成员解析缓存、组内状态汇总、图元状态类映射） |
| `src/config/subsystem-cards.ts` | **新增**：4 张统计卡公共口径（按设备计数），图标与配色由各系统传主题 |
| `src/stores/subsystem-alarm.ts` | **新增**：报警记录 store 工厂（状态跃迁累积 + 首次加载补 12 条确定性历史），各系统只传类型名与等级口径 |
| `src/config/gas-scene.json` | **新增**：气体灭火组态画面真源（1200×700 / 2 节点 / 1 连线 / 2 个自定义图元定义），导出自组态配置 |
| `src/config/gas-scene.ts` | **新增**：气体场景绑定表 + 场景适配器 + 统计卡主题 |
| `src/stores/gas-alarm.ts` | **新增**：气体报警 store（钢瓶压力不足 = 紧急） |
| `src/views/subsystem/GasExtinguishMonitor.vue` | 重写：改用公共骨架，只保留气体自己的数据与口径 |
| `src/views/subsystem/FireWaterMonitor.vue` | 改造：改用公共骨架，版式与取值口径不变 |
| `src/types/firewater.ts`、`src/types/gas.ts` | **删除**：类型并入 `src/types/subsystem-scene.ts` |
| `public/icons/fire-gas/kpi-*.svg` | **删除**：气体统计卡图标沿用消防水那套（`public/icons/fire-water/kpi-*.svg`），不再另做一套 |
| `src/style.css` | `el-pagination` 主题覆盖提到全局：此前每个列表页各抄一份 `:deep(.el-pagination …)`，没抄的页面就是 Element Plus 默认样式；公共组件的分页改用全局 `.pagination-wrap` + `.pagi-total` + `layout="sizes, prev, pager, next, jumper"`（与设备台账页一致） |
| `e2e/specs/fire-water-monitor.spec.ts` | 类名随公共组件改名（`.fwm__*` → `.sm__*` 等），断言逻辑不变 |
| `e2e/specs/gas-extinguish-monitor.spec.ts` | **新增**：气体页 e2e 用例 8 条 |

**气体组态绑定口径**（`GAS_NODE_BINDINGS`）：`GFES-MH-01` → `gas_host`（设备状态）；`GFES-PD-01` → `cylinder_pressure` 98 台（最低压力 + 压力正常 N/98）。共 101 个点位 = 主机 1 + 分机 2 + 探测器 98；分机 2 台当前画面无图元 → 组态视图无下钻入口（设备台帐仍可查）。

**报警等级**：钢瓶压力低于下限 1.2 MPa（灭火剂储备不足）= 紧急；高于上限 1.4 MPa = 重要；设备故障 / 离线 = 一般。等级体现在报警表「事件类型」角标的悬浮提示与 CSV 导出的「报警等级」列。

**顺带修复**：两页进页后立即播种一次报警记录，不再等首轮刷新（3s）——此前切到「报警记录」的前 3 秒是空表。

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

1. 侧栏出现「设备设施管理」一级分组，展开后 7 个二级项 + 19 个三级项，名称与 §2.2 逐项一致（首页、使用手册除外；运行监控下 3 个消防三系统监测项为本仓库新增，平台无对应项）。
2. 22 条路由全部可访问，控制台无「未登记到 ROUTE_TO_NAV_KEY」告警。
3. 「设备台账」「保养计划」「组态配置」及 3 个消防三系统监测项渲染真实页，其余 14 项渲染占位页。
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
