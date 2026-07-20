# ai-spec：复工流程详情

> 页面路由：`/resumption/:id` | 页面类型：详情展示（步骤流程） | 深度：🔵 light | 最后更新：2026-07-20

## 1. 组件树

```
PlanDetail (detail-page)
├── page-top
│   ├── button.btn-link [← 返回列表]
│   └── el-breadcrumb
│       ├── el-breadcrumb-item [复工复产管理] → /resumption
│       └── el-breadcrumb-item [复工流程详情]
├── summary-card（计划摘要）
│   ├── summary-left
│   │   ├── h2.summary-title {{ locationName }}
│   │   └── StatusTag(:status="plan_xxx")
│   ├── summary-meta
│   │   ├── meta-item > meta-label + meta-value（复工时间）
│   │   ├── meta-item > meta-label + meta-value（完成时间）
│   │   ├── meta-item > meta-label + meta-value（小组人数）
│   │   └── meta-item > meta-label + meta-value（复工令状态）
│   └── team-row
│       └── span.team-tag ×N（角色·姓名）
├── steps-card（步骤进度条）
│   └── steps-scroll（horizontal scrollable）
│       └── .step-node ×11（clickable）
│           ├── .step-circle（序号 / ✓ 完成标记）
│           └── .step-label（步骤简称）
├── step-detail-card（选中步骤详情）
│   ├── step-detail-header
│   │   ├── h3.step-detail-title（步骤序号 + 名称）
│   │   └── StatusTag(:status="step_xxx")
│   ├── step-detail-body
│   │   ├── info-row（执行角色）
│   │   ├── info-row（法规依据，可选）
│   │   ├── info-row（完成人）
│   │   ├── info-row（完成时间）
│   │   └── info-row（操作记录 remark）
│   └── step-attachments
│       └── no-attachments（暂无附件占位）
│
├── [状态分支] loading-wrap（v-loading，加载中）
├── [状态分支] empty-wrap（计划不存在/已删除）
```

## 2. 组件映射

| 设计元素 | 组件 | 来源 | 关键 Props |
|---------|------|------|-----------|
| 状态标签 | StatusTag | `components/business/StatusTag.vue` | `status="plan_preparing\|plan_trial\|plan_archived"` 或 `"step_done\|step_in_progress\|step_pending"` |
| 步骤进度条 | 自定义 `.steps-scroll` | 页面 scoped | 11 个 `.step-node`，点击切换 `selectedStepId` |
| 步骤节点 | 自定义 `.step-circle` | 页面 scoped | 状态驱动样式：`step-done` / `step-active` / `step-pending` |
| 面包屑 | el-breadcrumb | Element Plus | — |
| 返回按钮 | `.btn-link` | `style.css` 全局类 | — |

> 本页面**未使用** Element Plus 的 `el-steps` 组件，因为 11 个步骤在标准 el-steps 中过于拥挤。改用自定义横向可滚动的步骤指示器。

## 3. 数据流

```
┌──────────────────────────────────────────────────────┐
│  useResumptionStore (Pinia)                           │
│  ├── detail: ResumptionPlan | null                   │
│  ├── detailLoading: boolean                           │
│  └── fetchDetail(id) → getResumptionPlanDetail(id)   │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  getResumptionPlanDetail (resumption-dao.ts)          │
│  ├── planStore.getById(id) → ResumptionPlanItem       │
│  ├── stepStore.findBy(planId) → ResumptionStep[]      │
│  │   └── 按 stepOrder 升序排列（11 步）               │
│  ├── teamStore.findBy(planId) → OrgTeamMember[]       │
│  └── orderStore.findBy(planId) → ResumptionOrder?     │
│  return { ...plan, steps, team, order }               │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  页面本地状态                                         │
│  ├── selectedStepId: number | null                    │
│  │   └── 默认选中第一个 status !== 'done' 的步骤      │
│  ├── selectedStep: computed → detail.steps.find()     │
│  └── stepMetaByType(type): computed → STEP_META.find()│
└──────────────────────────────────────────────────────┘
```

### STEP_META（静态配置，来自 `src/types/resumption.ts`）

| order | type | label | sixOneLabel | executor |
|:---:|------|------|------|------|
| 1 | build-team | 建组 | — | 车间主任 |
| 2 | sign-pledge | 签责 | ⑥完善安全审批管理手续 | 车间主任→班组长→成员 |
| 3 | safety-training | 安全培训 | ②组织安全生产教育培训 | 车间安全员 |
| 4 | tech-disclosure | 技术交底 | ③实施全面安全技术交底 | 车间安全员 |
| 5 | hazard-check | 隐患排查 | ④排查安全生产问题隐患 | 班组长+成员 |
| 6 | device-check | 设备体检 | ⑤进行设施设备维护保养 | 班组长/设备管理员 |
| 7 | rectify | 整改闭环 | ④隐患整改验收 | 班组长+安全员 |
| 8 | joint-acceptance | 联合验收 | — | 车间主任+安全员+班组长 |
| 9 | issue-order | 签发复工令 | — | 厂长/总经理 |
| 10 | duty-log | 试产值班 | — | 班组长 |
| 11 | archive | 归档组卷 | — | 车间安全员 |

## 4. 交互状态

| 状态 | 触发条件 | UI 表现 |
|------|---------|--------|
| **加载中** | `detailLoading === true` | 显示 loading-wrap，含 v-loading 遮罩 |
| **加载失败/不存在** | `detail === null` 且非加载中 | 显示 empty-wrap："计划不存在或已被删除" + 返回按钮 |
| **正常** | `detail !== null` | 渲染摘要卡片 + 步骤进度条 + 步骤详情 |
| **步骤选中** | 点击 .step-node | `selectedStepId` 更新，detail card 切换到对应步骤 |
| **已完成步骤** | `step.status === 'done'` | 步骤节点显示 ✓、绿色圆圈 + 绿色连接线 |
| **执行中步骤** | `step.status === 'in_progress'` | 步骤节点高亮蓝色圆圈 + 阴影 |
| **待执行步骤** | `step.status === 'pending'` | 灰色圆圈 + 灰色连接线 |
| **无附件** | `step.attachments.length === 0` | 显示"📷 暂无附件"占位 |
| **有操作记录** | `step.remark !== ''` | 显示 remark 文本行 |
| **无操作记录** | `step.remark === ''` 且步骤未完成 | 不显示操作记录行 |

## 5. 边界条件

| 场景 | 处理方式 |
|------|---------|
| 路由参数非数字 | `Number(route.params.id)` 得到 NaN，`getResumptionPlanDetail(NaN)` 返回 null → empty 状态 |
| 计划 ID 不存在 | `planStore.getById` 返回 undefined → 返回 null → empty 状态 |
| 所有步骤已完成（归档状态） | `firstPending` 为 undefined → 默认选中最后一个步骤 |
| 步骤列表为空（异常） | `detail.steps` 为空数组 → `firstPending` 为 undefined → `selectedStepId` 为 null → 显示"请点击上方步骤" |
| 管理单元未关联 | `locationId` 为 undefined，不影响展示（仅显示 locationName） |
| 复工令未签发 | `detail.order === null` → 摘要卡片显示"未签发" |
| 小组无成员 | `detail.team.length === 0` → 小组区域不渲染 |
| 步骤详情横向滚动 | `steps-scroll` 设置 `overflow-x: auto`，移动端/窄屏可滑动 |
| 11 步标签过长 | `step-label` 字号 11px + `white-space: nowrap`，最小宽度 52px |

## 6. 步骤状态流（light 阶段纯展示）

```
pending ──→ in_progress ──→ done
 灰色         蓝色高亮        绿色✓

当前步骤判定：steps.find(s => s.status !== 'done') 的第一个
- 全部 done → "已完成"
- 有 in_progress → 该步骤为当前位置
- 无 in_progress 但有 pending → 第一个 pending 为当前位置
```

## 7. 样式来源

| 样式 | 位置 |
|------|------|
| 页面容器 `.detail-page` | scoped（flex column + gap + overflow:auto） |
| 面包屑 `.page-top` | scoped |
| 摘要卡片 `.summary-card` | scoped（bg-card + border + radius + padding） |
| 步骤进度条 `.steps-card` `.steps-scroll` `.step-node` `.step-circle` `.step-label` | scoped（自定义，含伪元素连接线） |
| 步骤详情 `.step-detail-card` | scoped |
| 信息行 `.info-row` `.info-label` `.info-value` `.remark-text` | scoped |
| 附件区 `.step-attachments` `.no-attachments` | scoped |
| 加载/空状态 `.loading-wrap` `.empty-wrap` | scoped |
| 按钮 `.btn-link` | `style.css` 全局类 |
| 标签 | StatusTag scoped |
| 颜色/字号/间距 | 全部使用 `var(--xxx)` 设计令牌 |

## 8. 文件索引

| 文件 | 说明 |
|------|------|
| `src/types/resumption.ts` | `ResumptionPlan`、`ResumptionStep`、`OrgTeamMember`、`ResumptionOrder`、`STEP_META`、`StepType`、`StepStatus` |
| `src/api/adapters/resumption-dao.ts` | `getResumptionPlanDetail`、`getStepLabel`、种子数据 |
| `src/stores/resumption.ts` | `useResumptionStore`：detail/detailLoading/fetchDetail |
| `src/views/resumption/PlanDetail.vue` | 本页面（~250 行） |
| `src/components/business/StatusTag.vue` | 复用 `step_done`/`step_in_progress`/`step_pending` 映射 |

## 9. 变更记录

| 日期 | 变更 |
|------|------|
| 2026-07-20 | v1.0：初始版本，基于 light 深度生成的 PlanDetail 实现 |
