# 导航角色可见性设计

> 侧栏导航按岗位动态过滤的设计方案。是 `navigation-design.md` 的角色化扩展，对应 `平台岗位设计.md` 第六节"阶段 2：可见性过滤"。
> 设计日期：2026-06-29

---

## 一、背景与问题

### 1.1 现状

当前导航是全量静态渲染——6 个分组、所有节点人人可见，不区分岗位。`NavNode` 接口只有 5 个字段：

```typescript
interface NavNode {
  key: string
  label: string
  icon?: string
  route?: string
  children?: NavNode[]
}
```

### 1.2 要解决的问题

| # | 问题 | 具体表现 |
|---|------|---------|
| 1 | **不该看的看到了** | 维保工程师看到 `⚙️ 平台管理` 下有租户管理、用户管理、岗位管理 |
| 2 | **该看的找不到** | 企业管理员需要"企业成员"入口，但 M1 没地方放——它不属于 `系统管理` |
| 3 | **静态过滤不够** | `defaultOpen` 只控制默认展开/折叠，不控制可见性——维保工程师点开照样看到系统管理 |
| 4 | **缺乏统一标准** | 每新增一个需限制的菜单，都要 ad-hoc 处理，没有复用逻辑 |

### 1.3 本方案目标

提供**一套标准、可复用的导航可见性过滤机制**，满足：

1. 为每个 `NavNode` 声明"哪些岗位可见"
2. 递归过滤：父节点不可见则子节点全部不可见
3. 空分支折叠：子节点全部不可见时，父节点也隐藏
4. 与搜索过滤 AND 叠加
5. 缺省语义：不声明 = 全员可见，向后兼容

---

## 二、核心概念

### 2.1 判定单元：岗位 key

可见性以**岗位 key** 为判定粒度。岗位 key 来自 `docs/平台岗位设计.md` 中定义的标准标识符，也与 `src/config/positions.ts` 中的 `PositionDef.key` 一致。

| 岗位 key | 名称 | 类型 |
|----------|------|------|
| `platform-admin` | 平台管理员 | 平台方 |
| `org-admin` | 企业管理员（通用） | 通用 |
| `org-admin-property` | 企业管理员（物业） | 物业方 |
| `org-admin-service` | 企业管理员（服务商） | 服务方 |
| `org-admin-supervisor` | 企业管理员（监管） | 监管方 |
| `fire-safety-responsible` | 消防安全责任人 | 物业方 |
| `fire-safety-manager` | 消防安全管理人 | 物业方 |
| `duty-officer` | 消控值班员 | 物业方 |
| `project-lead` | 项目负责人 | 服务方 |
| `tech-lead` | 技术负责人 | 服务方 |
| `maintenance-engineer` | 维保工程师 | 服务方 |
| `safety-supervisor` | 安全监管员 | 监管方 |

### 2.2 用户当前岗位的判定

用户在一个企业中可能拥有多个岗位。当前 Demo 阶段，用户岗位来自 `userStore.currentPositionKey`（单一岗位，通过 localStorage 切换）。

**后续 M4（企业切换）上线后**，判定来源改为"当前企业上下文中，用户在 UserEnterprise 关联表中的 `positions` 字段"（岗位数组），取并集。

当前设计兼容两种来源：
- 单一岗位 key → `['platform-admin']`
- 多岗位 keys → `['fire-safety-manager', 'org-admin-property']`

### 2.3 可见性语义

| 表达式 | 含义 |
|--------|------|
| `visibleTo` 未声明 | 全员可见 |
| `visibleTo: ['platform-admin']` | 仅平台管理员可见 |
| `visibleTo: ['platform-admin', 'org-admin-property', 'org-admin-service', 'org-admin-supervisor']` | 平台管理员 + 所有企业管理员可见 |
| `visibleTo: ['org-admin', 'org-admin-property', 'org-admin-service', 'org-admin-supervisor', 'platform-admin']` | 通用企业管理员 + 所有细分变体 + 平台管理员可见 |

> **设计注意**：`org-admin`（通用）和 `org-admin-property` 等（变体）是独立 key。当目标受众是"所有企业管理员"时，需要显式列举 key。后续可在工具函数层提供 key 通配符或分组宏（如 `ALL_ORG_ADMINS`），但 v1 先保持显式列举，简单透明。

---

## 三、数据结构设计

### 3.1 NavNode 扩展

```typescript
export interface NavNode {
  key: string
  label: string
  icon?: string
  route?: string
  children?: NavNode[]
  visibleTo?: string[]  // 🆕 岗位 key 白名单，缺省 = 全员可见
}
```

`NavGroup` 同样增加 `visibleTo`：

```typescript
export interface NavGroup {
  key: string
  label: string
  icon?: string
  defaultOpen: boolean
  children: NavNode[]
  visibleTo?: string[]  // 🆕 控制整个分组
}
```

### 3.2 过滤规则

对给定的用户岗位集合 `userPositionKeys: string[]`，递归处理每个节点：

```
function isVisible(node, userPositionKeys):
    1. 若 node.visibleTo 未声明 → 可见
    2. 若 userPositionKeys ∩ node.visibleTo ≠ ∅ → 可见
    3. 否则 → 不可见（含所有子节点）
```

**空分支折叠**：在父节点（NavGroup 或展开式的 NavNode）上应用额外规则：

```
渲染父节点前：
    收集所有直接子节点
    对每个子节点递归 isVisible()
    若全部不可见 → 父节点也不渲染
```

### 3.3 与搜索过滤的关系

两者是 **AND** 叠加关系——搜索过滤和岗位过滤同时生效：

```
最终可见 = 岗位过滤(原始树) AND 搜索过滤(原始树)
```

也就是说，岗位过滤先裁剪整棵树的结构，搜索过滤再在用户输入时做文本匹配。两者独立计算，叠加应用。

---

## 四、各节点 visibleTo 配置

### 4.1 不限制的分组（全员可见）

以下分组不声明 `visibleTo`，所有岗位可见，保持现状：

| 分组 | 理由 |
|------|------|
| ⭐ 工作台 | 全员使用 |
| 🖥 监控与值守 | 消控值班员等使用，但其他岗位也可能查看 |
| 🔧 设备与物联 | 维保工程师等使用，但目前不限制 |
| 🔍 巡查与隐患 | 安全经理等使用，但目前不限制 |
| 📋 合规与管理 | 监管单位等使用，但目前不限制 |
| 🏫 培训与知识 | 全员使用 |

### 4.2 需要限制的分组

**`⚙️ 平台管理` 分组**：

```typescript
{
  key: 'platform-admin',
  label: '平台管理',
  icon: 'admin',
  defaultOpen: false,
  visibleTo: [
    'platform-admin',           // 平台管理员（看全部）
    'org-admin',                // 通用企业管理员（只看企业管理）
    'org-admin-property',       // 物业方企业管理员
    'org-admin-service',        // 服务方企业管理员
    'org-admin-supervisor',     // 监管方企业管理员
  ],
  children: [
    // 流程管理 — 全员可见（不声明 visibleTo）
    {
      key: 'process-mgmt',
      label: '流程管理',
      children: [
        { key: 'flow-template', label: '流程模板', route: '/system/template' },
      ],
    },

    // 平台配置 — 全员可见（不声明 visibleTo）
    { key: 'platform-config', label: '平台配置', route: '/platform' },

    // 系统管理 — 仅平台管理员
    {
      key: 'admin-mgmt',
      label: '系统管理',
      visibleTo: ['platform-admin'],
      children: [
        { key: 'tenant-mgmt', label: '租户管理', route: '/admin/enterpriseManagement/index' },
        { key: 'user-mgmt', label: '用户管理', route: '/admin/users' },        // M0
        { key: 'position-mgmt', label: '岗位管理', route: '/admin/positions' }, // M2
      ],
    },

    // 企业管理 — 企业管理员 + 平台管理员  🆕
    {
      key: 'enterprise-mgmt',
      label: '企业管理',
      visibleTo: [
        'platform-admin',
        'org-admin',
        'org-admin-property',
        'org-admin-service',
        'org-admin-supervisor',
      ],
      children: [
        { key: 'enterprise-members', label: '企业成员', route: '/enterprise/members' },  // M1 🆕
        // 后续扩展：M3 企业自定义岗位、M4 企业切换 等
      ],
    },
  ],
}
```

### 4.3 可见性矩阵一览

| 子节点 | platform-admin | org-admin 系列 | 其他岗位 |
|--------|:---:|:---:|:---:|
| 流程管理 → 流程模板 | ✅ | ✅ | ✅ |
| 平台配置 → | ✅ | ✅ | ✅ |
| **系统管理** | | | |
| 　租户管理 | ✅ | ❌ | ❌ |
| 　用户管理 (M0) | ✅ | ❌ | ❌ |
| 　岗位管理 (M2) | ✅ | ❌ | ❌ |
| **企业管理** 🆕 | | | |
| 　企业成员 (M1) 🆕 | ✅ | ✅ | ❌ |

---

## 五、过滤算法

### 5.1 核心函数

在 `src/config/navigation.ts` 中导出：

```typescript
/**
 * 按岗位过滤导航树。
 * 递归裁剪：visibleTo 不匹配的节点及其全部子节点被移除。
 * 空分支折叠：父节点内所有子节点都被移除后，父节点也移除。
 *
 * @param nodes  原始节点数组
 * @param positionKeys  用户当前拥有的岗位 key 数组
 * @returns 过滤后的节点数组（新引用，不修改原数组）
 */
export function filterNodesByPosition(
  nodes: NavNode[],
  positionKeys: string[]
): NavNode[]
```

### 5.2 算法伪代码

```
function filterNodesByPosition(nodes, positionKeys):
    result = []
    for node in nodes:
        if !isNodeVisible(node, positionKeys):
            continue                                    // 规则 1-3
        if node.children:
            filteredChildren = filterNodesByPosition(node.children, positionKeys)
            if filteredChildren.length === 0:
                continue                                // 空分支折叠
            result.push({ ...node, children: filteredChildren })
        else:
            result.push({ ...node })
    return result

function isNodeVisible(node, positionKeys):
    if node.visibleTo is undefined:
        return true                                     // 规则 1
    return positionKeys.some(k => node.visibleTo.includes(k))  // 规则 2
```

### 5.3 在 DefaultLayout 中的集成

`filteredGroups` computed 中，岗位过滤作为预处理步骤应用在搜索过滤之前：

```
filteredGroups = computed():
    // Step 1: 岗位过滤
    roleFiltered = NAV_GROUPS
        .filter(group => isNodeVisible(group, userPositionKeys))
        .map(group => ({
            ...group,
            children: filterNodesByPosition(group.children, userPositionKeys)
        }))
        .filter(group => group.children.length > 0)     // 空分组折叠

    // Step 2: 搜索过滤（逻辑不变）
    if hasSearchQuery:
        roleFiltered = applySearchFilter(roleFiltered, searchQuery)

    return roleFiltered
```

---

## 六、实现路径

| 步骤 | 内容 | 涉及文件 | 备注 |
|------|------|---------|------|
| 1 | `NavNode`/`NavGroup` 加 `visibleTo` 字段 | `src/config/navigation.ts` | 纯类型扩展 |
| 2 | 实现 `filterNodesByPosition()` 并导出 | `src/config/navigation.ts` | 纯函数，可单独测试 |
| 3 | 为 `平台管理` 分组及子节点配置 `visibleTo`，新增 `企业管理` 节点 | `src/config/navigation.ts` | 数据层改动 |
| 4 | `filteredGroups` 接入岗位过滤 | `src/layouts/DefaultLayout.vue` | 加 Step 1 过滤 |
| 5 | 注册 `/enterprise/members` 占位路由 | `src/router/index.ts` | M1 实现前指向占位页 |
| 6 | 全流程手动验证 | — | 切换岗位 → 观察侧栏变化 |

---

## 七、后续演进

### 7.1 与 M4（企业切换）的衔接

M4 上线后，`userPositionKeys` 的来源从单一 localStorage key 变为"当前企业上下文中 UserEnterprise.positions 数组"。`filterNodesByPosition` 函数签名无需修改——输入始终是 `string[]`，只改变调用处的取值逻辑。

### 7.2 key 分组宏（v2）

当前 `visibleTo` 需要列举所有企业管理员 key（`org-admin` + 3 个变体），略显冗长。未来可引入 key 分组宏：

```typescript
// src/config/position-groups.ts
export const ALL_ORG_ADMINS = [
  'org-admin',
  'org-admin-property',
  'org-admin-service',
  'org-admin-supervisor',
]

// 使用时：
visibleTo: ['platform-admin', ...ALL_ORG_ADMINS]
```

但 v1 先保持显式列举，确保任何人一眼就能读懂谁可以看到什么。

### 7.3 通配符 / 前缀匹配（v2）

当岗位 key 有明确命名约定（如 `org-admin-*`），可支持通配符：

```typescript
visibleTo: ['platform-admin', 'org-admin*']
```

v1 不实现，因为有 12 个岗位，显式列举足够清晰，不会造成维护负担。

---

## 八、设计决策记录

| # | 决策 | 理由 |
|---|------|------|
| 1 | 以岗位 key 而非角色类型为判定粒度 | 岗位是最小权限单元，与 `平台岗位设计.md` 一致 |
| 2 | `visibleTo` 是白名单（不是黑名单） | 默认全员可见，逐步收紧，安全且向后兼容 |
| 3 | 缺省值 = 全员可见（不是隐藏） | 不影响现有 6 个分组，改动最小 |
| 4 | 递归裁剪 + 空分支折叠 | 让未权限的分组/子菜单彻底消失，不是仅置灰 |
| 5 | 不声明 `disabled` 态 | 不可见的就不要出现；置灰暗示"你有权限但暂时不能用"，语义不同 |
| 6 | v1 显式列举 key，不做分组宏 | 12 个 key，简单透明，不引入不必要的间接层 |
| 7 | 岗位过滤与搜索是 AND 关系 | 两者职责正交——一个按权限裁剪，一个按关键词匹配 |

---

## 九、版本历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-29 | v1.0 | 初始版本：`visibleTo` 机制 + 节点配置 + 过滤算法 + 实现路径 |
