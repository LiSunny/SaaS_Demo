# 一级菜单重组 — 社会单位侧

> 日期：2026-10-26
> 范围：`src/config/navigation.ts` 中 `visibleTo: ['unit']` 的侧栏分组
> 状态：已落地（菜单 + 路由 + 占位页 + 校验脚本）

---

## 一、结论

1. 「安全管理」一级菜单解散，原 8 个二级项拆入 7 个一级菜单。
2. 新增 6 个一级菜单：值守与应急、培训与演练、消防维保、特种作业管理、安全档案、项目管理；原「安全概览」升为独立一级菜单。
3. 单位侧「项目管理」与运营商侧「项目管理」（`key=operator`）分组独立，互斥可见，不合并。
4. 新增路由 60 条，全部挂占位页；消防监控 4 条与可视化大屏沿用真实页。
5. 导航分组 11 → 17；菜单节点新增 68、删除 12；带路由的叶子 109 → 150。
6. `ROUTE_TO_NAV_KEY` 70 → 130 条，`NAV_KEY_TO_ROUTE` 69 → 127 条。
7. 6 个新菜单的首个子项统一为「数据看板」（原「首页」），模块首页路径不变。

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

```
安全概览 unit-overview
├── 安全态势 /unit/dashboard          数据看板 /unit/data          可视化大屏 /enterprise-cockpit（真实页）

值守与应急 unit-duty-emergency
├── 数据看板 /unit/duty
├── 值守管理：值班表 / 值班记录 / 到岗打卡 / 交接班
├── 告警处置：告警列表 /unit/alarms、处置记录 /unit/alarms/records
├── 消防监控：消防管网系统 / 消防管网·组态总览 / 气体灭火系统 / 消防防排烟系统（4 条真实页）
├── 应急管理：应急预案 / 应急物资 / 事件处置
└── 通知提醒：推送记录 /unit/notifications

培训与演练 unit-training-drill
├── 数据看板 /unit/training
├── 培训管理：培训计划 / 培训记录 / 培训考试
├── 演练管理：演练计划 / 演练记录 / 演练评估
└── 知识库 /unit/training/knowledge

消防维保 unit-fire-maintenance
├── 数据看板 /unit/maintenance
├── 维保管理：维保合同 / 维保计划 / 维保任务 / 维保记录 / 维保报告
├── 维保台账 /unit/maintenance/ledger
├── 维保标准库 / 故障与隐患 / 待办工作台

特种作业管理 unit-special-work
├── 数据看板 /unit/special-work
├── 作业类型：动火作业 / 电焊作业 / 高处作业 / 有限空间作业 / 临时用电作业
├── 作业流程：作业申请 / 作业审批 / 作业监护 / 作业记录
└── 人员资质：特种作业人员 / 证件台账

安全档案 unit-safety-archive
├── 数据看板 /unit/safety-archive
├── 档案归集：单位档案 / 设施档案 / 制度档案 / 预案档案 / 证照档案
└── 档案管理：归档台账 / 归档记录 / 借阅记录

项目管理 unit-project（社会单位侧）
├── 数据看板 /unit/projects
├── 项目总览：项目看板 / 项目统计
├── 项目台账：全部项目 / 项目成员
├── 项目交付：交付节点 / 验收记录
└── 服务评价 /unit/projects/evaluation
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
| `vue-tsc --noEmit` | 通过，无输出 |
| `vite build` | 通过，5.49s |
| `node scripts/check-nav-consistency.mjs` | 菜单 151 节点 / 路由 163 条 / 占位页配置 60 条，三方一致，无错误；死链 26 条（改动前既有）。脚本未入库 |
| 浏览器实测（dev 3200，社会单位账号 13100001234） | 侧栏 17 个分组渲染正常，抽查 25 条新路由全部命中对应占位页标题；控制台无 warn / error |

死链 26 条为改动前既有（`单位设置` 24 条、运营商侧「项目管理」2 条、`/admin/member-types` 1 条），本次未处理。

---

## 七、待办

1. 26 条既有死链：补占位页或并入本次新模块。
2. 「消防维保 › 维保计划」可复用真实页 `/maintenance/plans`（服务商侧维保计划），需解决两侧选中态互斥问题后再切换。
3. 「安全概览 › 可视化大屏」与「区域监管 › 监管大屏」共用 `/enterprise-cockpit`，运营商侧 `visibleTo` 之外的用户看不到该分组。
4. `src/api/adapters/enterprise-dao.ts` 的租户菜单树 mock（平台管理 › 菜单管理用）仍是线上平台旧结构，未同步。
5. 角色名文案「安全管理」仍存在于 `src/views/agent/AgentPage.vue:366`、`src/config/demo-accounts.ts`、门户场景标签中，指「社会单位」这一使用主体，与侧栏菜单同名但非一回事，待统一术语时一并处理。
