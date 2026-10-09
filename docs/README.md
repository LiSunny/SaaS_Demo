# 产品文档索引

> 最后更新:2026-10-09

## 工作流(必读)
- [产品设计工作流](产品设计工作流.md) — 8 阶段流水线,所有业务域按此推进
  - ~~workflow-guide.md~~(已废弃,/design-/generate 体系零业务域采用)

---

## 一、平台总体
- [平台总体设计](design/biz-design.md)
- [四方用户导航与体验账号设计](四方用户导航与体验账号设计.md)
- [应用场景总览](应用场景总览.md)
- [平台岗位设计](平台岗位设计.md)
- [平台介绍PPT大纲](平台介绍PPT大纲.md)
- [功能结构排查分析](功能结构排查分析.md)
- [文档书写原则](文档书写原则.md)

---

## 二、各业务域

### 2.1 隐患排查治理 ⭐ 当前在 §0 评审阶段
- **§0 顶层设计**:
  - [biz-design-大纲](隐患管理/biz-design-大纲.md)(v0.3)
  - [法规-功能映射](隐患管理/法规-功能映射.md)
  - [参考法规清单](隐患管理/参考法规清单.md)
  - [设计评审汇报 HTML](隐患管理/汇报/隐患排查治理-设计评审汇报.html)
  - [架构图-文案规格](隐患管理/汇报/架构图-文案规格.md)
- **§1 module-plan 待启动**(§0 评审通过后立即启动)
- **§2-§5 待启动**(§1 评审通过后)

### 2.2 工单管理 ⭐ 标杆范本(全 8 阶段已跑通)
- **§0 顶层设计**:[biz-design](工单管理/biz-design.md)
- **§1 模块规划**:[module-plan](工单管理/module-plan.md)
- **§2 PRD**:[工单管理](工单管理/prd/工单管理.md)
- **§3 详细设计**:
  - [00-流程编排](工单管理/technical/00-流程编排模块详细设计.md)
  - [00a-督办流程交互](工单管理/technical/00a-督办流程交互设计.md)
  - [00b-节点指派范式](工单管理/technical/00b-节点指派范式.md)
  - [00c-动态表单渲染](工单管理/technical/00c-动态表单渲染设计.md)
  - [button-permissions](工单管理/technical/button-permissions.md)
- **§4 AI 规格**:[ai-spec/](工单管理/ai-spec/)
- **§5 接口设计**:[api](工单管理/api.md)
- **§6-§8**:代码实现在 `src/views/admin/` 下

### 2.3 维保管理
- **§0 顶层设计**:[biz-design](design/维保管理/biz-design.md)
- **§1 模块规划**:[module-plan](design/维保管理/module-plan.md)
- **§3 详细设计**:[07-故障与隐患模块](维保管理/technical/07-故障与隐患模块详细设计.md)
- 流程模板:[flow-template-01 火灾隐患排查上报](协同管理/流程模板/flow-template-01-火灾隐患排查上报.md)/[flow-template-02 火灾隐患整改处置](协同管理/流程模板/flow-template-02-火灾隐患整改处置.md)

### 2.4 工作台
- **§0 顶层设计**:[biz-design](design/工作台/biz-design.md)
- **§1 模块规划**:[module-plan](design/工作台/module-plan.md)
- **§3 详细设计**:[design](工作台/design.md)

### 2.5 租户管理
- **§0 顶层设计**:[biz-design](design/租户管理/biz-design.md)
- **§1-§3 部分已落**:
  - [关系角色结构化方案](租户管理/technical/关系角色结构化方案.md)(§3)
  - [ai-spec/README](租户管理/ai-spec/README.md)
  - [相关方管理](租户管理/ai-spec/相关方管理.md)
  - [新增编辑租户](租户管理/ai-spec/新增编辑租户.md)

### 2.6 项目管理
- **§0 顶层设计**:[biz-design](项目管理/biz-design.md)(v0.2)

### 2.7 消防控制室管理(范本)
- **§0 顶层设计**:[biz-design](消防控制室管理/biz-design.md)

### 2.8 复工复产管理
- **§4 AI 规格**:
  - [复工看板](复工复产管理/ai-spec/复工看板.md)
  - [复工流程详情](复工复产管理/ai-spec/复工流程详情.md)
  - [复工计划列表](复工复产管理/ai-spec/复工计划列表.md)

### 2.9 社会单位
- [能力清单与菜单设计](社会单位/能力清单与菜单设计.md)
- 场景介绍:
  - [校园安全管理](校园安全管理/scenarios/功能探索报告.md)
  - [工贸企业安全管理](工贸企业安全管理/scenarios/功能探索报告.md)
  - [工贸-场景介绍-隐患整改闭环](工贸企业安全管理/scenarios/场景介绍-隐患整改闭环.md)
  - [小商户-场景介绍-巡查与隐患处置](小商户安全监管/scenarios/场景介绍-巡查与隐患处置.md)

### 2.10 仪表盘框架
- [框架设计](仪表盘框架/technical/框架设计.md)

### 2.11 用户管理
- [ai-spec/README](用户管理/ai-spec/README.md)

---

## 三、协同管理(平台公共能力)
- [流程模板 README](协同管理/流程模板/README.md)
- [flow-template-01 火灾隐患排查上报](协同管理/流程模板/flow-template-01-火灾隐患排查上报.md)
- [flow-template-02 火灾隐患整改处置](协同管理/流程模板/flow-template-02-火灾隐患整改处置.md)

---

## 四、设计进度概览
- [设计进度概览](设计进度概览.md)(2026-06-02 旧,工单管理为基准)
- [E2E 测试指南](testing/e2e-guide.md)
