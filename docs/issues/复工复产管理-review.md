## 复工复产管理 走查报告

> 走查时间：2026-07-20 | 模式：light | 设计文档版本：v2.0

### 功能完整性

| 页面 | 状态 | 备注 |
|------|:---:|------|
| 复工计划列表 (`/resumption`) | ✅ | 搜索、状态筛选、分页、新建（管理单元选择+allow-create）正常 |
| 复工流程详情 (`/resumption/:id`) | ✅ | 4 阶段进度条 + 子步骤导航 + 步骤录入 + 验收/签发内联展示 |
| 复工看板 (`/resumption/dashboard`) | ✅ | 3 统计卡片 + 车间进度网格 + 点击跳详情 |

### 核心链路

✅ 列表 → 新建计划（选管理单元）→ 进入详情 → 点击阶段 → 选子步骤 → 标记完成 → 状态流转 → 返回列表 → 看板查看进度

完整链路可走通，light 深度下的目标已达到。

---

## 🔴 P0 阻塞问题（影响核心交互）

### 1. 阶段切换时选中了错误的子步骤

- **严重程度**：P0 — 点击阶段节点后，详情跳到上一个阶段的步骤
- **原因**：`selectStage(key)` 先设置 `selectedStage.value = key`，然后立刻读取 `currentStageSteps.value`。但 `currentStageSteps` 是 computed 属性，依赖 `selectedStage.value`，Vue 的 computed 是惰性求值的——在当前 tick 内 `currentStageSteps.value` 仍是旧阶段的步骤列表。
- **复现路径**：列表 → 进入详情（默认选中"复工准备"）→ 点击"复工审核"阶段 → 右侧详情仍显示步骤 8（因为自动选中了旧阶段步骤列表的第一个未完成步骤）
- **建议修复**：

  ```typescript
  // PlanDetail.vue selectStage 函数
  function selectStage(key: string) {
    selectedStage.value = key
    // 直接过滤 detail.steps，不依赖 computed
    const stage = STAGES.find(s => s.key === key)
    const steps = stage ? detail.value!.steps.filter(s => stage.stepOrders.includes(s.stepOrder)) : []
    if (steps.length) {
      const firstPending = steps.find(s => s.status !== 'done')
      selectedStepId.value = firstPending ? firstPending.id : steps[steps.length - 1].id
    }
  }
  ```

---

## 🟡 P1 体验问题（影响演示效果）

### 2. 看板"已完成步数"对试产阶段计算不准确

- **严重程度**：P1 — 看板展示与实际进度不一致
- **原因**：`Dashboard.vue` 的 `completedSteps` 函数对 `trial` 状态硬编码返回 `9`。但 `trial` 状态覆盖两个场景：
  - 步骤 8 完成、步骤 9 待执行 → 8 步完成
  - 步骤 9 完成、步骤 10 待执行 → 9 步完成
  - 步骤 10 完成、步骤 11 待执行 → 10 步完成（当前逻辑错误返回 9）
- **建议修复**：

  ```typescript
  // Dashboard.vue
  function completedSteps(plan: ResumptionPlanItem): number {
    if (plan.status === 'archived') return 11
    return plan.currentStep - 1  // currentStep 已由 updateStep 维护
  }
  ```

  直接信任 `currentStep` 字段（`updateStep` 已实时维护），不需要特殊处理 `trial`。

---

## 🟢 P2 优化建议（可选）

### 3. 列表"当前步骤"列名语义不匹配

- **问题**：列表列名为"当前步骤"，但在复工准备阶段步骤是自由顺序的，没有"当前"的概念
- **建议**：列名改为"进度"，显示格式改为"阶段名/步骤名"，如"复工准备·隐患排查" 或 "审核·签发复工令"

### 4. 步骤编辑后页面可能闪烁

- **问题**：`saveStep` 调用 `store.fetchDetail()` 刷新全部数据，造成不必要的全量重渲染
- **建议**：直接在本地更新 `detail.value` 中对应步骤的数据，避免网络请求（即使是 Mock 也有延迟感）

### 5. 新建计划未校验重复场所

- **问题**：可以为同一管理单元创建多个复工计划
- **建议**：light 阶段可暂不处理（依赖用户自觉），standard 阶段在后端做唯一约束

---

## 📋 设计文档待补充

1. §5 业务规则中缺少"同一场所是否允许同时存在多个复工计划"的约束
2. §6 接口概要对 `updateStep` 的描述未覆盖"可回退到 pending"的情况
