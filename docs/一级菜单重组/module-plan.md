# 一级菜单重组 — 社会单位侧

> 日期：2026-10-26
> 范围：`src/config/navigation.ts` 中 `visibleTo: ['unit']` 的侧栏分组
> 状态：已落地（菜单 + 路由 + 占位页 + 校验脚本）
> 同日补充：一级菜单排序调整（见结论 8）；巡查检查首个子项改名「数据看板」

---

## 一、结论

1. 「安全管理」一级菜单解散，原 8 个二级项拆入 7 个一级菜单。
2. 新增 6 个一级菜单：值守与应急、培训与演练、消防维保、特种作业管理、安全档案、项目管理；原「安全概览」升为独立一级菜单。
3. 单位侧「项目管理」与运营商侧「项目管理」（`key=operator`）分组独立，互斥可见，不合并。
4. 新增路由 60 条，全部挂占位页；消防监控 4 条与可视化大屏沿用真实页。
5. 导航分组 11 → 17；菜单节点新增 68、删除 12；带路由的叶子 109 → 150。
6. `ROUTE_TO_NAV_KEY` 70 → 130 条，`NAV_KEY_TO_ROUTE` 69 → 127 条。
7. 7 个业务域菜单的首个子项统一为「数据看板」（原「首页」），模块首页路径不变。
8. 社会单位侧一级菜单排序：设备设施管理 → 巡查检查 → 值守与应急 → 隐患排查治理 → 特种作业管理 → 消防维保 → 培训与演练 → 安全档案 → 协同工作 → 项目管理 → 安全概览 → 单位设置。「消防维保」排在「特种作业管理」之后。
9. 「区域监管」仍居 `NAV_GROUPS` 首位，对社会单位用户不可见；「设备设施管理」在数组中紧随其后，故监管侧、运营商侧、技术服务侧的侧栏顺序不变。

---

## 二、原「安全管理」解散后的归属

| 原二级项 | 原叶子 | 现归属 |
|------|------|------|
| 安全概览 | 安全态势 / 数据看板 / 可视化大屏 | 一级菜单「安全概览」（`unit-overview`） |
| 设备管理 | 设备台账 / 保养任务 / 保养记录 | 一级菜单「设备设施管理」（`device-facility`，已有） |
| 维保管理 | 维保合同 / 维保台账 / 维保记录 / 维保报告 | 一级菜单「消防维保」（`unit-fire-maintenance`） |
| 消防监控 | 消防管网系统 / 组态总览 / 气体灭火系统 / 消防防排烟系统 | 「值守与应急 › 消防监控」 |
| 告警处置 | 告警列表 / 处置记录 | 「值守与应急 › 告警处置」 |
| 危险作业 | 作业申请 / 作业记录 | 一级菜单「特种作业管理」（`unit-special-work`） |
| 培训演练 | 知识库 / 培训记录 / 演练记录 | 一级菜单「培训与演练」（`unit-training-drill`） |
| 通知提醒 | 推送记录 | 「值守与应急 › 通知提醒」 |

连带调整：

- 「单位设置 › 告警设置 › 预案管理」删除，预案归入「值守与应急 › 应急管理 › 应急预案」，避免同一功能两处入口。
- 原「安全管理 › 设备管理」3 条路径（`/device/list`、`/unit/device/tasks`、`/unit/device/records`）随节点删除，设备域统一走 `/device-facility/*`。
- 运营商侧「项目管理」图标由 `briefcase` 改为 `building`，技术服务侧由 `tools` 改为 `rocket`（原图标在图标库中不存在，且与新菜单撞图标）。

---

## 三、菜单树

社会单位侧一级菜单，自上而下：

```
设备设施管理 device-facility
├── 设备台账 /device-facility/ledger
├── 保养管理：保养规范 / 保养计划 / 保养任务 / 保养记录
├── 运行监控：状态监控 / 场景监控
├── 报表与报告：告警分析报告 / 设备运行报表
├── 系统日志：事件日志
├── 规则配置：自定义事件 / 平面图描点 / 数据拉取 / 数据推送 / 策略执行器
└── 消息推送：告警推送

巡查检查 unit-patrol
├── 数据看板 /unit/patrol
├── 任务监控：巡查任务 /unit/patrol/tasks
├── 项目配置 /unit/patrol/forms
├── 点位管理 /unit/patrol/locations
├── 计划管理：消防巡查 /unit/patrol/plans
└── 异常处置 / 巡查报表 / 通知提醒

值守与应急 unit-duty-emergency
├── 数据看板 /unit/duty
├── 值守管理：值班表 / 值班记录 / 到岗打卡 / 交接班
├── 告警处置：告警列表 /unit/alarms、处置记录 /unit/alarms/records
├── 消防监控：消防管网系统 / 消防管网·组态总览 / 气体灭火系统 / 消防防排烟系统（4 条真实页）
├── 应急管理：应急预案 / 应急物资 / 事件处置
└── 通知提醒：推送记录 /unit/notifications

隐患排查治理 unit-hazard
├── 模块介绍 /workbench/hazard-intro
├── 隐患排查：隐患台账 / 隐患上报 / 排查任务
├── 隐患整改：整改看板
├── 制度与计划：制度建设 / 排查计划 / 排查清单
└── 报表与统计：数字看板 / 周期报表（对内报告 / 监管报告）

特种作业管理 unit-special-work
├── 数据看板 /unit/special-work
├── 作业类型：动火作业 / 电焊作业 / 高处作业 / 有限空间作业 / 临时用电作业
├── 作业流程：作业申请 / 作业审批 / 作业监护 / 作业记录
└── 人员资质：特种作业人员 / 证件台账

消防维保 unit-fire-maintenance
├── 数据看板 /unit/maintenance
├── 维保管理：维保合同 / 维保计划 / 维保任务 / 维保记录 / 维保报告
├── 维保台账 /unit/maintenance/ledger
├── 维保标准库 / 故障与隐患 / 待办工作台

培训与演练 unit-training-drill
├── 数据看板 /unit/training
├── 培训管理：培训计划 / 培训记录 / 培训考试
├── 演练管理：演练计划 / 演练记录 / 演练评估
└── 知识库 /unit/training/knowledge

安全档案 unit-safety-archive
├── 数据看板 /unit/safety-archive
├── 档案归集：单位档案 / 设施档案 / 制度档案 / 预案档案 / 证照档案
└── 档案管理：归档台账 / 归档记录 / 借阅记录

协同工作 unit-collab-work
├── 协同管理：流程编排 / 协同监控
└── 待办事项 / 已办事项 / 发起事项

项目管理 unit-project（社会单位侧）
├── 数据看板 /unit/projects
├── 项目总览：项目看板 / 项目统计
├── 项目台账：全部项目 / 项目成员
├── 项目交付：交付节点 / 验收记录
└── 服务评价 /unit/projects/evaluation

安全概览 unit-overview
├── 安全态势 /unit/dashboard
├── 数据看板 /unit/data
└── 可视化大屏 /enterprise-cockpit（真实页）

单位设置 unit-settings
├── 设备设置：保养规范 / 保养计划 / 运行监控 / 设备报表 / 设备配置 / 系统日志
├── 告警设置：告警配置 / 值守报表
├── 通知设置：通知配置 / 告警推送
├── 组织管理：管理单元 / 建筑管理 / 重点部位 / 人员管理 / 权限管理 / 部门管理 / 岗位管理
├── 制度管理 / 通知公告
├── 企业配置：基础信息 / 个性化
├── 日志管理
├── 动态表单：表单管理 / 填写记录
└── 使用手册
```

---

## 四、子项口径来源

| 一级菜单 | 依据 |
|------|------|
| 安全概览 | `docs/社会单位/能力清单与菜单设计.md`（看安全全貌 / 看数据趋势） |
| 值守与应急 | `docs/消防控制室管理/module-plan.md`（值班打卡 M0、主机台账 M3、交接班 M4、离岗报备）、`docs/数字台账`（应急物资全链路） |
| 培训与演练 | `docs/社会单位/能力清单与菜单设计.md`（培训与记录）、`docs/协同管理/流程模板/flow-template-05-消防演练申请.md` |
| 消防维保 | `docs/维保管理/module-plan.md`（合同 / 台账 / 计划 / 任务 / 故障隐患 / 报告 / 待办 / 标准库）、`docs/社会单位/能力清单与菜单设计.md`（管理消防维保） |
| 特种作业管理 | `docs/动火作业管理/scenarios`（4 阶段 × 15 步）、`docs/协同管理/流程模板/flow-template-04-动火作业审批.md` |
| 安全档案 | 消防安全管理建档要求（单位 / 设施 / 制度 / 预案 / 证照） |
| 项目管理 | `docs/项目管理/biz-design.md`，改写为业主（社会单位）视角 |

---

## 五、代码落点

| 文件 | 改动 |
|------|------|
| `src/config/navigation.ts` | 删除分组 `unit-daily`；新增 7 个分组；`ROUTE_TO_NAV_KEY` +60 条；`NAV_KEY_TO_ROUTE` +58 条；`/device`、`/device/list`、`/iot` 三个旧映射改指 `df-ledger` |
| `src/config/navigation.ts`（同日补充） | `NAV_GROUPS` 分组顺序调整为第三节序列；`unit-patrol-home` 标签「首页」→「数据看板」，`ROUTE_TO_NAV_KEY` / `NAV_KEY_TO_ROUTE` 不变 |
| `src/views/patrol/patrol-pages.ts`（同日补充） | `PatrolHome` 标题「首页」→「数据看板」，描述首句改为「巡查检查数据看板：…」 |
| `src/router/index.ts` | 新增 7 个路由块、60 条路由，全部指向共享占位组件 |
| `src/views/shared/ModulePlaceholder.vue` | 新增：通用占位页组件，按 `route.name` 读配置渲染 |
| `src/views/shared/module-page-config.ts` | 新增：配置体例接口 |
| `src/views/shared/module-registry.ts` | 新增：汇总 7 份模块页面配置 |
| `src/views/overview/overview-pages.ts` | 新增：安全概览 2 条配置 |
| `src/views/duty/duty-pages.ts` | 新增：值守与应急 11 条配置 |
| `src/views/training/training-pages.ts` | 新增：培训与演练 8 条配置 |
| `src/views/fire-maintenance/fire-maintenance-pages.ts` | 新增：消防维保 10 条配置 |
| `src/views/special-work/special-work-pages.ts` | 新增：特种作业管理 12 条配置 |
| `src/views/safety-archive/safety-archive-pages.ts` | 新增：安全档案 9 条配置 |
| `src/views/project/project-pages.ts` | 新增：项目管理 8 条配置 |
| `src/config/permission-modules.ts` | `remote-duty`→值守与应急、`maintain-app`→消防维保、`danger-work`→特种作业管理；新增 `safety-archive` |
| `src/views/workbench/widgets/AppShortcutsWidget.vue` | 快捷入口改为 9 个业务域入口，全部指向新菜单首页 |

一致性校验脚本 `scripts/check-nav-consistency.mjs` 保留在本地工作区，本次未入库；它对菜单 / 路由 / 页面配置三方做静态核对，可直接用于后续菜单改动。

占位页组件不复用 `PatrolPlaceholder.vue` / `DeviceFacilityPlaceholder.vue`，改为共享组件 + 每模块一份配置表：两处旧占位组件的模板与样式完全相同，第 7 个模块再复制一份只会增加维护面。

---

## 六、校验

| 项 | 结果 |
|------|------|
| `vue-tsc -b` | 通过，无输出 |
| `vite build` | 通过，5.49s |
| `node scripts/check-nav-consistency.mjs` | 导航分组 17 个；菜单叶子 150 条、路由 163 条、占位页配置 60 条，三方一致，无错误；死链 26 条（改动前既有）。脚本未入库 |
| 浏览器实测（dev 3200，社会单位账号 13100001234） | 侧栏 17 个分组渲染正常；社会单位侧可见 12 个一级菜单，顺序与第三节一致；「巡查检查」首个子项显示「数据看板」，`/unit/patrol` 页面标题为「数据看板」；控制台无 error，warn 27 条（26 条未实现路由 + 1 条 prop 类型）均为既有 |

死链 26 条为改动前既有（`单位设置` 24 条、运营商侧「项目管理」2 条、`/admin/member-types` 1 条），本次未处理。

---

## 七、待办

1. 26 条既有死链：补占位页或并入本次新模块。
2. 「消防维保 › 维保计划」可复用真实页 `/maintenance/plans`（服务商侧维保计划），需解决两侧选中态互斥问题后再切换。
3. 「安全概览 › 可视化大屏」与「区域监管 › 监管大屏」共用 `/enterprise-cockpit`，运营商侧 `visibleTo` 之外的用户看不到该分组。
4. `src/api/adapters/enterprise-dao.ts` 的租户菜单树 mock（平台管理 › 菜单管理用）仍是线上平台旧结构，未同步。
5. 角色名文案「安全管理」仍存在于 `src/views/agent/AgentPage.vue:366`、`src/config/demo-accounts.ts`、门户场景标签中，指「社会单位」这一使用主体，与侧栏菜单同名但非一回事，待统一术语时一并处理。
