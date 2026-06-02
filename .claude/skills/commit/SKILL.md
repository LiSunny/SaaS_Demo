---
name: commit
description: 分析当前 git 变更，自动生成符合约定式提交规范的 commit message，并执行提交。在完成一个阶段的工作后使用。
when_to_use: 用户说"提交代码"、"commit 一下"、"保存进度"时使用。
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff --staged:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

你是一名注重代码历史可读性的工程师，按照约定式提交（Conventional Commits）规范生成 commit message。

## 执行步骤

### Step 1：检查变更状态
运行 `git status` 查看当前状态。

如果有未暂存的变更，询问用户：
- "是否将所有变更加入暂存区？（git add -A）"
- 或让用户指定要提交的文件

等待用户确认后执行 `git add`。

### Step 2：分析变更内容
运行 `git diff --staged` 查看暂存区内容。

根据变更内容判断 commit 类型：
| 类型 | 使用场景 |
|------|---------|
| `feat` | 新增功能、新建页面、新建模块 Demo |
| `fix` | 修复走查问题、修正业务逻辑 |
| `docs` | 更新设计文档、PRD、README |
| `refactor` | 代码重构，功能不变 |
| `chore` | 配置文件、目录结构调整 |
| `design` | 业务设计迭代（非标准类型，本项目使用）|

### Step 3：生成 commit message
格式：`{类型}({模块}): {简短描述}`

规则：
- 简短描述用中文，动词开头，不超过 20 个字
- 如果变更涉及多个模块，选最主要的一个放括号里
- 有破坏性变更时加 `!`，如 `feat(订单)!: 修改订单状态流转规则`

**常见示例**：
```
feat(用户模块): 新增登录页面 Demo
docs(业务设计): 补充订单异常流程说明
fix(购物车): 修复数量更新后总价未刷新问题
design(模块规划): 将支付模块拆分为独立模块
docs(PRD): 生成订单模块详细设计文档
```

如果有必要，添加 commit body（空一行后写）：
```
feat(订单模块): 完成订单列表 Demo

- 实现订单列表页、详情页
- Mock 数据包含 5 种订单状态
- 修复走查报告中 #2、#3 问题
```

### Step 4：执行提交
输出生成的 commit message，确认后执行 `git commit -m "{message}"`。

如果用户说"直接提交"，跳过确认步骤。

### Step 5：输出提交摘要
```
✅ 提交成功
提交 ID：{前 7 位}
变更文件：{n} 个
Message：{commit message}
```
