# 复工复产管理 — 设计文档

> 状态：🔵 light | 最后更新：2026-07-21

## 1. 业务定位

**复工复产管理**面向工贸企业（工厂），在节后/停产检修/临时停工后，以车间为履责主体，按照"六个一"法规要求，完成从"复工准备 → 复工审核 → 试产观察 → 正式复产"的全流程闭环管理。

**核心用户**：厂长/总经理（签发复工令）、车间主任（统筹复工全过程）、车间安全员（培训执行、隐患审核）、班组长（设备检查、隐患整改）、班组成员（隐患上报、参与培训）。

**解决的核心问题**：
- 让厂长能**自证尽责**：每步留痕 + 电子签名 → 法律上的履职免责证据链
- 让车间主任能**掌控进度**：多车间同时复工时，哪间卡在哪步一目了然
- 让班组长**不抵触**：操作比微信随手拍更简单，不增加填表负担
- 让监管检查**不再翻纸盒**：一键导出全套归档材料

**本域独立闭环**：不依赖平台其他模块即可独立完成完整业务流程。

## 2. 核心场景

- 作为**车间主任**，我希望创建复工计划并选择复工场所，以便启动节后复工复产流程。
- 作为**车间安全员**，我希望按"六个一"步骤逐项完成并录入，每完成一步系统自动记录时间和操作人。
- 作为**厂长/总经理**，我希望在列表页一屏看到全厂各车间的复工进度统计。
- 作为**厂长/总经理**，我希望在联合验收通过后，在线签发复工令，形成有法律效力的复产许可记录。
- 作为**班组长**，我希望在复工流程中完成责任状签署、设备逐项检查、隐患上报。

## 3. 页面清单

| 页面 | 类型 | 路由 | 核心功能 | 深度 |
|------|------|------|---------|:---:|
| 复工计划列表 | 列表/卡片 | `/resumption` | 4 阶段统计卡片 + 状态筛选 + 卡片/列表双视图切换 + 新建计划 | 🔵 light |
| 复工流程详情 | 详情展示 | `/resumption/:id` | 单一父容器布局：摘要（统计指标+QR）+ 4 阶段进度条 + 左侧步骤导航 + 右侧步骤编辑（7 个独立步骤组件） | 🔵 light |

> Light 深度：仅前端页面 + Mock 数据（localStorage 持久化），支持步骤录入和状态流转。后续 standard/full 阶段增加后端 API、数据库、权限校验。
>
> **已移除**：复工看板（`/resumption/dashboard`），统计功能已迁移至列表页顶部。

## 4. 数据模型

### 4.1 复工计划（ResumptionPlanItem）

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|:---:|------|------|
| id | number | ✅ | 主键 | Mock 自增 |
| enterpriseId | number | ✅ | 所属企业 ID | — |
| locationId | number | — | 关联管理单元 ID | light 阶段可选 |
| locationName | string | ✅ | 复工场所名称 | 关联管理单元时自动填充 |
| status | PlanStatus | ✅ | 计划状态（prepare/review/trial/production） | 见 4.6 |
| currentStep | number | ✅ | 当前步骤序号 1-11 | 自动维护 |
| startedAt | string | — | 复工开始时间 | — |
| completedAt | string | — | 完成时间 | 全流程完成时自动填充 |
| createdAt | string | ✅ | 创建时间 | 自动 |
| updatedAt | string | ✅ | 更新时间 | 自动 |

### 4.2 复工步骤（ResumptionStep）

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|:---:|------|------|
| id | number | ✅ | 主键 | Mock 自增 |
| planId | number | ✅ | 关联复工计划 ID | — |
| stepType | StepType | ✅ | 步骤类型 | 见 4.7 |
| stepOrder | number | ✅ | 步骤序号（1-11） | — |
| status | StepStatus | ✅ | 步骤状态（pending/in_progress/done） | 1-7 自由顺序，8+ 顺序执行 |
| completedBy | string | — | 完成人姓名 | — |
| completedAt | string | — | 完成时间 | — |
| remark | string | — | 备注/操作记录摘要 | — |
| attachments | string[] | — | 附件（照片/签名等） | light 阶段占位 |
| formData | object | — | 步骤专属表单数据（JSON） | 类型由 stepType 决定，见 4.10 |

### 4.3 组织小组（OrgTeamMember）

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|:---:|------|------|
| id | number | ✅ | 主键 | Mock 自增 |
| planId | number | ✅ | 关联复工计划 ID | — |
| role | string | ✅ | 组内角色 | 组长/副组长/成员 |
| userName | string | ✅ | 人员姓名 | — |
| positionKey | string | ✅ | 岗位 key | — |

### 4.4 复工令（ResumptionOrder）

| 字段 | 类型 | 必填 | 说明 | 约束 |
|------|------|:---:|------|------|
| id | number | ✅ | 主键 | Mock 自增 |
| planId | number | ✅ | 关联复工计划 ID | 唯一 |
| conclusion | string | — | 签发结论 | — |
| issuedBy | string | — | 签发人（厂长/总经理） | — |
| issuedAt | string | — | 签发时间 | — |
| signatureUrl | string | — | 电子签名图片 | light 占位 |

### 4.5 新增岗位

| 岗位 key | 名称 | 层级 | 职责摘要 |
|----------|------|:---:|---------|
| `factory-director` | 厂长/总经理 | 系统级 | 主持安全专题会、签发复工令 |
| `workshop-director` | 车间主任 | 系统级 | 统筹复工全过程，建组、联合验收 |
| `workshop-safety-officer` | 车间安全员 | 系统级 | 培训执行、隐患审核、归档组卷 |
| `team-leader` | 班组长 | 系统级 | 设备检查、隐患整改、试产值班 |
| `team-member` | 班组成员 | 系统级 | 隐患上报、参与培训、签署责任状 |

> 5 个岗位均为系统级岗位（`enterpriseId = null`），全体工业企业默认继承。

### 4.6 计划状态枚举

| 状态值 | 标签 | 说明 |
|--------|------|------|
| `prepare` | 复工准备 | 步骤 1-8 进行中，验收未完成 |
| `review` | 复工审核 | 验收完成，签发复工令进行中 |
| `trial` | 试产观察 | 复工令已签发，试产值班中 |
| `production` | 正式复产 | 全流程完成，全部只读 |

> 4 个计划状态与 4 个阶段一一对应，列表、详情用词完全一致。

### 4.7 步骤类型枚举

| 类型值 | 标签 | 阶段 | "六个一" | 执行角色 |
|--------|------|:---:|:---:|---------|
| `build-team` | 建组 | 复工准备 | — | 车间主任 |
| `sign-pledge` | 签责 | 复工准备 | ⑥ | 车间主任→班组长→成员 |
| `safety-training` | 安全培训 | 复工准备 | ② | 车间安全员 |
| `tech-disclosure` | 技术交底 | 复工准备 | ③ | 车间安全员 |
| `hazard-check` | 隐患排查 | 复工准备 | ④ | 班组长+成员 |
| `device-check` | 设备体检 | 复工准备 | ⑤ | 班组长/设备管理员 |
| `rectify` | 整改闭环 | 复工准备 | ④ | 班组长+安全员 |
| `joint-acceptance` | 联合验收 | 复工审核 | — | 车间主任+安全员+班组长 |
| `issue-order` | 签发复工令 | 复工审核 | — | 厂长/总经理 |
| `duty-log` | 试产值班 | 试产观察 | — | 班组长 |
| `archive` | 归档组卷 | 正式复产 | — | 车间安全员 |

### 4.8 步骤状态枚举

| 状态值 | 标签 | 说明 |
|--------|------|------|
| `pending` | 待执行 | 尚未开始 |
| `in_progress` | 执行中 | 进行中（步骤 8+ 使用） |
| `done` | 已完成 | 已完成 |

> 步骤 1-7（复工准备阶段）自由顺序，仅 pending/done。步骤 8+ 顺序执行，支持 in_progress。

### 4.9 阶段定义（4 阶段模型）

| 阶段 key | 标签 | 步骤范围 | 编辑规则 |
|------|------|:---:|------|
| `prepare` | 复工准备 | ①-⑦ | 步骤 1-8 可编辑（prepare 阶段），不限顺序 |
| `review` | 复工审核 | ⑧-⑨ | 验收后前序锁定，仅编辑当前未完成步骤 |
| `trial` | 试产观察 | ⑩ | 审核后锁定，仅编辑步骤 10 |
| `production` | 正式复产 | ⑪ | 全部只读 |

### 4.10 步骤专属表单类型

每个步骤的 `formData` 存储对应类型数据：

| 步骤 | formData 类型 | 关键字段 |
|------|------|------|
| ② 签责 | PledgeData | title, content, signers[], photoUrl |
| ③ 安全培训 | TrainingData | topic, location, trainDate, format, participants, photoUrls[] |
| ④ 技术交底 | TechDisclosureData | records[], discloseDate, discloser, photoUrls[] |
| ⑤ 隐患排查 | HazardRecord[] | description, level, status, foundBy, photos[] |
| ⑥ 设备体检 | DeviceCheckItem[] | deviceName, location, checker, result, checkItems[], photos[] |

## 5. 业务规则

- **4 阶段模型**：11 个步骤归入 4 个阶段（复工准备 → 复工审核 → 试产观察 → 正式复产），进度条展示阶段节点 + 双层水波扩散动画。
- **复工准备阶段自由顺序**：步骤 1-7 不限制执行顺序，现场可并行完成。prepare 阶段步骤 1-8 均可编辑。
- **验收为分水岭**：步骤 8（联合验收）完成后，前序步骤锁定不可再改。后续步骤顺序执行。
- **步骤留痕**：每步完成后记录完成人、完成时间、备注，支持修改（在可编辑阶段内）。
- **步骤专属表单**：步骤 1-6 有独立编辑组件（Step1BuildTeam ~ Step6DeviceCheck），步骤 7-11 使用通用组件（StepGeneric）。编辑为内联模式（在详情区原地切换查看/编辑），非弹窗模式。
- **复工场所关联管理单元**：创建计划时从企业管理单元树中选择或手动输入复工场所名称。
- **多车间并行**：同一企业可同时有多个复工计划（每场所一个），互不干扰。
- **归档不可逆**：步骤 11（归档组卷）完成后计划状态变为 production，所有数据只读。

## 6. 接口概要

> Light 深度下使用前端 Mock 数据（`VITE_API_MODE` 不设置时走 `*-dao.ts`），已实现步骤录入和小组管理 DAO。

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 复工计划列表 | GET | `/api/resumption/plans` | 按企业 ID 查询，支持状态筛选 |
| 创建复工计划 | POST | `/api/resumption/plans` | 车间主任创建，含场所名称 |
| 复工计划详情 | GET | `/api/resumption/plans/:id` | 含步骤列表、小组、复工令 |
| 更新步骤状态 | PUT | `/api/resumption/plans/:id/steps/:stepId` | 完成步骤、写入 formData |
| 更新小组成员 | PUT | `/api/resumption/plans/:id/team` | 全量替换小组成员 |
| 签发复工令 | POST | `/api/resumption/plans/:id/order` | 厂长签发 |

## 7. 导航分组

```
巡查与隐患
├── 巡查检查
├── 隐患管理
├── 危险作业
└── 复工复产管理  ← 新增
    └── 复工计划列表   (/resumption)
```

> 导航节点 key：`resumption-mgmt`，详情页 (`/resumption/:id`) 不显示在侧栏（`meta: { hidden: true }`）。

## 8. 文件索引

| 文件 | 说明 |
|------|------|
| `src/types/resumption.ts` | 类型定义（实体、枚举、阶段、步骤元数据、表单类型） |
| `src/api/adapters/resumption-dao.ts` | DAO 适配器（Mock 数据 + localStorage 持久化 + 种子数据） |
| `src/stores/resumption.ts` | Pinia Store（列表 + 详情） |
| `src/views/resumption/PlanList.vue` | 列表页（统计卡片 + 筛选 + 卡片/列表双视图） |
| `src/views/resumption/PlanDetail.vue` | 详情页（单容器布局 + 阶段进度条 + 步骤导航 + 动态步骤组件） |
| `src/views/resumption/steps/Step1BuildTeam.vue` | 步骤 1：建组（成员列表编辑） |
| `src/views/resumption/steps/Step2SignPledge.vue` | 步骤 2：签责（电子责任状 + 签署人列表） |
| `src/views/resumption/steps/Step3SafetyTraining.vue` | 步骤 3：安全培训（主题/地点/日期/形式/人员/照片） |
| `src/views/resumption/steps/Step4TechDisclosure.vue` | 步骤 4：技术交底（多条岗位交底记录） |
| `src/views/resumption/steps/Step5HazardCheck.vue` | 步骤 5：隐患排查（隐患清单 + 等级/状态） |
| `src/views/resumption/steps/Step6DeviceCheck.vue` | 步骤 6：设备体检（统计 + 设备列表 + 设备详情弹窗） |
| `src/views/resumption/steps/StepGeneric.vue` | 步骤 7-11：通用编辑（完成人 + 备注） |
| `src/views/resumption/steps/shared-form.css` | 公共编辑表单样式（clean-input/select/datepicker） |

## 9. 变更记录

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-07-20 | v1.0 | 初始设计，light 深度 |
| 2026-07-20 | v1.1 | 验收签发页合并到详情页内联展示 |
| 2026-07-20 | v1.2 | 新增步骤编辑功能（标记完成/修改） |
| 2026-07-20 | v2.0 | 重构为 4 阶段模型 + 子步骤双层导航 |
| 2026-07-21 | v2.1 | 移除复工看板，统计迁移至列表页；列表支持卡片/列表双视图 |
| 2026-07-21 | v2.2 | 详情页重构为单一父容器布局；步骤表单拆分为 7 个独立组件；内联编辑替代弹窗；摘要卡片改为统计指标 |
| 2026-07-21 | v2.3 | 文档同步代码：修正 status 枚举、新增 formData 字段、更新页面清单、补充 4.10 表单类型 |
