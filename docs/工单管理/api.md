# 工单管理 — 接口规格

> 合并了原 `api/工单管理.md` 与 `api/工单监控.md`，覆盖工单管理域全部接口。

---

## 1. 获取工单实例列表

**描述**：分页查询工单实例列表，支持多维度筛选，返回含统计卡片数据
**方法**：GET
**路径**：`/api/v1/work-order/instances`
**权限**：需要登录

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 20，最大 100 |
| `keyword` | string | 否 | 关键词，模糊匹配工单编号、发起人姓名 |
| `status` | string | 否 | 实例状态，多选用逗号分隔：draft / active / closed |
| `templateId` | number | 否 | 模板 ID，精确匹配 |
| `priority` | string | 否 | 优先级：urgent / high / normal / low |
| `slaStatus` | string | 否 | SLA 状态：normal / warning / timeout |
| `startDate` | string | 否 | 创建时间起始，格式 YYYY-MM-DD |
| `endDate` | string | 否 | 创建时间截止，格式 YYYY-MM-DD |
| `sortBy` | string | 否 | 排序字段，默认 createdAt |
| `sortOrder` | string | 否 | 排序方向，asc / desc，默认 desc |

### 响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 128,
    "page": 1,
    "pageSize": 20,
    "stats": { "all": 128, "draft": 3, "active": 83, "closed": 42 },
    "list": [
      {
        "id": 1,
        "orderNo": "WO20260601-001",
        "templateId": 1,
        "templateName": "设备维修工单模板",
        "templateVersion": 3,
        "status": "active",
        "priority": "urgent",
        "currentNodeId": 103,
        "currentNodeName": "执行节点",
        "currentNodeType": "execute",
        "currentAssigneeId": 15,
        "currentAssigneeName": "李四",
        "creatorId": 10,
        "creatorName": "张三",
        "creatorOrgId": 1001,
        "creatorOrgName": "xxx物业管理有限公司",
        "parentOrderId": null,
        "createdAt": "2026-06-01 09:30:00",
        "updatedAt": "2026-06-01 10:45:00",
        "sla": {
          "ttrMinutes": 120,
          "ttsMinutes": 1440,
          "ttrEndedAt": "2026-06-01 09:42:00",
          "ttsStartedAt": "2026-06-01 09:42:00",
          "yellowThreshold": 0.8,
          "ttsProgress": 0.72,
          "slaStatus": "warning"
        }
      }
    ]
  }
}
```

---

## 2. 获取工单实例统计

**描述**：获取按实例状态分组的统计计数，用于顶部统计卡片
**方法**：GET
**路径**：`/api/v1/work-order/instances/stats`
**权限**：需要登录

> 根据当前用户角色自动过滤可见范围。即使某状态计数为 0 也以 `0` 返回。

### 响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": { "all": 128, "draft": 3, "active": 83, "closed": 42 }
}
```

---

## 3. 获取工单实例详情

**描述**：获取单个工单实例的完整信息，包含节点链路和处理记录
**方法**：GET
**路径**：`/api/v1/work-order/instances/:id`
**权限**：需要登录

### 响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "orderNo": "WO20260601-001",
    "templateId": 1,
    "templateName": "设备维修工单模板",
    "templateVersion": 3,
    "status": "active",
    "priority": "urgent",
    "currentNodeId": 103,
    "currentNodeName": "执行节点",
    "currentNodeType": "execute",
    "currentAssigneeId": 15,
    "currentAssigneeName": "李四",
    "creatorId": 10,
    "creatorName": "张三",
    "creatorOrgId": 1001,
    "creatorOrgName": "xxx物业管理有限公司",
    "parentOrderId": null,
    "createdAt": "2026-06-01 09:30:00",
    "updatedAt": "2026-06-01 10:45:00",
    "closedAt": null,
    "closedBy": null,
    "sla": {
      "ttrMinutes": 120, "ttsMinutes": 1440,
      "ttrStartedAt": "2026-06-01 09:35:00",
      "ttrEndedAt": "2026-06-01 09:42:00",
      "ttsStartedAt": "2026-06-01 09:42:00",
      "tsPausedAt": null,
      "yellowThreshold": 0.8,
      "ttrProgress": null, "ttsProgress": 0.72,
      "slaStatus": "warning"
    },
    "nodes": [
      { "id": 101, "name": "发起节点", "type": "start", "status": "completed", "assigneeName": "张三", "completedAt": "2026-06-01 09:30:00", "order": 1 },
      { "id": 102, "name": "指派节点", "type": "assign", "status": "completed", "assigneeName": "系统", "completedAt": "2026-06-01 09:35:00", "order": 2 },
      { "id": 103, "name": "执行节点", "type": "execute", "status": "in_progress", "assigneeName": "李四", "completedAt": null, "order": 3 },
      { "id": 104, "name": "确认节点", "type": "confirm", "status": "pending", "assigneeName": "张三", "completedAt": null, "order": 4 },
      { "id": 105, "name": "关闭节点", "type": "close", "status": "pending", "assigneeName": null, "completedAt": null, "order": 5 }
    ],
    "records": [
      { "id": 301, "action": "接单", "operatorName": "李四", "operatorOrgName": "xxx物业管理有限公司", "content": "确认接单，开始处理", "createdAt": "2026-06-01 09:42:00" },
      { "id": 302, "action": "指派", "operatorName": "系统", "operatorOrgName": null, "content": "自动指派给维修一部 - 李四", "createdAt": "2026-06-01 09:35:00" },
      { "id": 303, "action": "创建工单", "operatorName": "张三", "operatorOrgName": "xxx物业管理有限公司", "content": "创建设备维修工单", "createdAt": "2026-06-01 09:30:00" }
    ]
  }
}
```

---

## 4. 创建工单实例

**描述**：从模板创建新的工单实例，状态为"草稿"
**方法**：POST
**路径**：`/api/v1/work-order/instances`
**权限**：需要登录（物业管理员角色）

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| templateId | number | 是 | 模板 ID |
| templateName | string | 是 | 模板名称（冗余） |
| templateVersion | number | 是 | 模板版本号 |
| priority | string | 是 | urgent / high / normal / low |
| creatorName | string | 是 | 发起人姓名 |

### 响应示例

```json
{
  "code": 0,
  "data": {
    "id": 11,
    "orderNo": "WO20260602-011",
    "templateId": 1,
    "templateName": "设备维修工单模板",
    "templateVersion": 3,
    "status": "draft",
    "priority": "urgent",
    "currentNodeIndex": 1,
    "totalNodes": 5,
    "currentNodeName": "发起节点",
    "creatorName": "张三",
    "createdAt": "2026-06-02 15:30:00",
    "sla": { "ttsMinutes": 1440, "ttsProgress": 0, "slaStatus": "normal" }
  }
}
```

### 错误码

| code | 说明 | 处理 |
|------|------|------|
| 1001 | 模板不存在或已停用 | toast "所选模板不可用" |
| 1002 | priority 值非法 | toast "请选择优先级" |
| 5000 | 服务端异常 | toast "创建失败，请重试" |

---

## 5. 强制改派

**描述**：平台运营方强制更改工单当前节点的处理人
**方法**：POST
**路径**：`/api/v1/work-order/instances/:id/reassign`
**权限**：需要平台运营方角色

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `targetAssigneeId` | number | 是 | 目标处理人 ID |
| `reason` | string | 是 | 改派原因，最多 200 字 |

### 响应结构

```json
{
  "code": 0,
  "message": "工单 WO20260601-001 已改派给王五",
  "data": {
    "id": 1,
    "orderNo": "WO20260601-001",
    "previousAssigneeId": 15,
    "previousAssigneeName": "李四",
    "currentAssigneeId": 20,
    "currentAssigneeName": "王五",
    "updatedAt": "2026-06-01 14:35:00"
  }
}
```

---

## 6. 取消工单

**描述**：手动取消工单实例，取消后进入"已关闭"状态但不触发归档回调
**方法**：POST
**路径**：`/api/v1/work-order/instances/:id/cancel`
**权限**：需要平台运营方角色

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `reason` | string | 是 | 取消原因，最多 200 字 |

### 响应结构

```json
{
  "code": 0,
  "message": "工单 WO20260601-001 已取消",
  "data": {
    "id": 1,
    "orderNo": "WO20260601-001",
    "status": "closed",
    "closedAt": "2026-06-01 14:30:00",
    "closedBy": "平台管理员"
  }
}
```
