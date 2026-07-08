# PM + AI 协作开发工作流 — 使用教程

> v2.0 | 2026-07-08 | 5 个核心 Skill，3 步主流程

## 一、为什么简化

旧流程 12 个 Skill、8+ 步骤、5+ 份中间文档，每一步都产出一份独立文档，文档之间需要同步，改需求时上下文噪音大。

新流程的核心思想：
- **设计文档是唯一真相源**：一个业务域只有一份 `design.md`
- **渐进深度**：同一份代码逐层生长（light → standard → full），不重写
- **你不管理流程，AI 管理**：你只需要做好设计文档，代码生成和修改由 Skill 搞定

## 二、Skill 一览

| Skill | 做什么 | 什么时候用 | 示例 |
|-------|--------|-----------|------|
| `/design` | 写 / 改设计文档 | 有想法要落地，或要改需求 | `/design 维保管理` |
| `/generate` | 生成代码（前后端） | 设计文档确认后 | `/generate 维保管理 --depth=light` |
| `/review` | 走查代码质量 | 代码生成完 | `/review 维保管理 --mode=light` |
| `/update` | 增量修改代码 | 改了设计文档后同步代码 | `/update 维保管理` |
| `/snapshot` | 保存进度 | 阶段性结束时 | `/snapshot` |

## 三、三级深度

| | 🔵 light | 🟡 standard | 🟢 full |
|---|---|---|---|
| **产物** | 前端 + Mock | 前端 + 后端 + 数据库 | 完整可演示 |
| **耗时** | 小时级 | 半天 | 1-2 天 |
| **给谁看** | 自己验证想法 | 团队内部验证逻辑 | 客户演示 |
| **前端** | Vue 3 + Element Plus | ← 同 | ← 同 |
| **后端** | 无 | Express + Prisma | ← 同 |
| **数据** | localStorage Mock | SQLite 真实数据 | + 20+ 条种子数据 |
| **权限** | 跳过 | 基础登录 | 完整 RBAC |
| **边界处理** | 不考虑 | 不考虑 | 全覆盖 |

**关键**：light → standard → full 是叠加关系。light 生成的前端代码在 standard 中保留不动，standard 只加后端部分。

## 四、典型使用流程

### 场景 1：新想法快速验证

```
/design 维保管理
    ↓ 对话中梳理：定位、场景、页面、数据、规则
    ↓ 产出：docs/维保管理/design.md

/generate 维保管理 --depth=light
    ↓ 产出：前端页面 + Mock 数据，npm run dev 可预览

/review 维保管理 --mode=light
    ↓ 检查：核心流程能不能跑通？逻辑对不对？

→ 决定：继续投入 / 放弃 / 调整方向
```

**时间**：半天出结果。

### 场景 2：想法确认，完整实现

```
/generate 维保管理 --depth=standard
    在 light 代码基础上叠加：后端三层 + Prisma + 基础登录

确认逻辑通了 →

/generate 维保管理 --depth=full
    在 standard 基础上叠加：20+ 条种子数据 + 完整权限 + 边界处理

/review 维保管理 --mode=full
    完整走查，可交付标准
```

**时间**：1-2 天从 light 到 full。

### 场景 3：需求变更

```
你发现维保计划需要"按季度分组展示"

/design --update 维保管理 "新增季度分组展示"
    ↓ 更新 design.md，标注 diff

/update 维保管理
    ↓ AI 分析：影响 types、PlanList.vue、Prisma Schema、API query…
    ↓ 输出影响报告，标注破坏性变更（如有）
    ↓ 你确认
    ↓ AI 只改受影响的文件

/review 维保管理 --mode=light
    ↓ 确认改动正确
```

**关键**：AI 不读聊天记录，只对比设计文档的变更和当前代码的差异。上下文干净。

## 五、design.md 怎么写

### 模板结构

```markdown
# {域名} — 设计文档

## 1. 业务定位（一段话）
## 2. 核心场景（2-5 条用户故事）
## 3. 页面清单（每个页面：名称、类型、路由、核心功能）
## 4. 数据模型（实体字段 + 状态枚举）
## 5. 业务规则（3-8 条约束）
## 6. 接口概要（方法 + 路径 + 说明）
## 7. 变更记录
```

### 填写要点

**§1 业务定位**：一句话 + 谁用 + 解决什么。写清楚"不是"什么（避免范围蔓延）。

**§2 核心场景**：格式参考——"作为【角色】，我希望【做什么】，以便【达成什么目的】"。不要写超长叙事，每个场景一句话。

**§3 页面清单**：最重要的一节。`/generate` 按这里的每个页面生成代码。
- 页面类型必须用标准值：列表管理 / 详情展示 / 表单提交 / 统计看板 / 树形管理
- 路由按项目约定写（如 `/maintenance/plans`）

**§4 数据模型**：
- 字段类型用前端类型：string / number / boolean / enum / date
- 状态颜色用：info / warning / success / danger / normal
- 每个实体必含 id、createdAt、updatedAt

**§5 业务规则**：可验证的约束（"每季度最多 3 个计划"），不写模糊描述（"用户体验好"）。

**§6 接口概要**：写清楚方法 + 路径 + 一句话说明即可，不需要定义 request/response body。

### 写好后的检查清单

- [ ] 每个页面都有明确的类型和路由？
- [ ] 数据模型的字段都标注了必填/可选？
- [ ] 状态枚举的颜色用了标准值？
- [ ] 业务规则都可验证？
- [ ] 不确定的地方是否留了注释让 AI 提问？

## 六、完整示例：维保管理

### 第一步：写设计文档

```
/design 维保管理
```

AI 会分 2-3 轮和你对话：
1. "这个域要解决什么问题？给谁用？最核心的场景是什么？"
2. "需要哪些页面？核心数据实体有哪些？"
3. "有什么业务约束？"

你也可以说"先按你的理解写一版"，AI 会基于 CLAUDE.md 中的产品上下文直接生成，你再修改。

### 第二步：轻量验证

```
/generate 维保管理 --depth=light
```

AI 输出技术方案（页面结构、组件映射、生成文件清单），你确认后生成代码：

```
✅ light 代码已生成。

生成文件：
  - src/types/maintenance.ts
  - src/api/adapters/maintenance-dao.ts
  - src/stores/maintenance.ts
  - src/views/maintenance/PlanList.vue
  - src/views/maintenance/PlanDetail.vue
  - src/router/index.ts (追加路由)

运行：npm run dev → http://localhost:3200/maintenance/plans
```

### 第三步：快速走查

```
/review 维保管理 --mode=light
```

AI 对照设计文档检查核心流程是否跑通。

### 第四步：升级到完整

```
/generate 维保管理 --depth=standard
/generate 维保管理 --depth=full
/review 维保管理 --mode=full
```

### 第五步：需求变更

```
/design --update 维保管理 "新增季度分组展示"
/update 维保管理
```

## 七、常见问题

### Q: light 生成的代码，升级到 standard 会被覆盖吗？

不会。standard 和 full 是**叠加**生成，保留已有代码。前端 DAO（Mock）不动，新增 HTTP adapter + 后端三层。

### Q: 设计文档要写多详细？

够 `/generate` 理解就行。关键信息：哪些页面、什么类型、有哪些字段、什么业务规则。不用写交互细节（除非很关键），UI 细节交给 Figma。

### Q: 没有 Figma 能用吗？

能。`/generate` 的必读输入只有 design.md。Figma 是可选增强——有设计稿时视觉还原更准，没有时用标准 Element Plus 风格。

### Q: 什么时候用 /update，什么时候重新 /generate？

- 设计文档小改（<50% 内容变化）→ `/update`（增量修改，快）
- 设计文档大改（>50%）→ `/generate`（重来更省事）
- 从 light 升级 depth → `/generate --depth=standard --incremental`

### Q: 旧文档（biz-design.md 等）还能用吗？

旧文档保留（加 `_legacy` 后缀）。建议用 `/design` 重新生成一份统一的 design.md，因为新 skill 会优先读它。

### Q: `/generate` 和旧的 `/md-figma-to-vue3` 有什么区别？

`/generate` 是升级版：
- 支持三级深度（旧版只有"全量生成"）
- 内嵌后端生成（旧版需要单独调 `/gen-api`）
- 不产生中间文档（旧版需要 `/gen-ai-spec` 翻译）
- 支持增量叠加（旧版每次从头生成）

## 八、进阶技巧

### 让 AI 更懂你的项目

在 `CLAUDE.md` 中维护好这些信息：
- 产品定位和业务域全景
- 技术栈和目录约定
- 最近完成和待处理的工作
- 关键设计决策

`/snapshot` 可以帮你自动更新。

### 减少重复澄清

第一次用 `/design` 时，把核心业务背景说清楚。AI 会写入设计文档。后续同一域的操作，AI 读设计文档就够了。

### 多域并行

不同业务域的设计文档和代码是独立的，可以同时推进多个域（开多个会话）。
