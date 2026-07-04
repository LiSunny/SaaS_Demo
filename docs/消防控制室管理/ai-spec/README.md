# 消防控制室管理 — AI 代码规格

> 基于 [biz-design.md](../biz-design.md) · [module-plan.md](../module-plan.md)
> 生成日期：2026-07-02
> 范围：P0 模块（M0 / M1 / M2）

| 页面 | 类型 | 文件 | 所属模块 | 状态 |
|------|------|------|---------|------|
| 值班记录列表 | 列表管理 | [值班记录列表.md](值班记录列表.md) | M0 值班履责打卡 | ✅ 已生成 |
| AI 预警记录列表 | 列表管理 | [AI预警记录列表.md](AI预警记录列表.md) | M1 AI 视频预警 | ✅ 已生成 |
| 远程点名操作 | 列表管理 | [远程点名操作.md](远程点名操作.md) | M2 视频巡检点名 | ✅ 已生成 |

## 页面关系

三个页面均为 `FireControlPage.vue` 的 Tab 内嵌组件：

```
FireControlPage.vue (主页面)
├── Tab: 实时监控    → FireControlMonitoring.vue (M6, 已完成)
├── Tab: 值班记录    → FireControlDutyRecords.vue (M0, 待改造) ← 值班记录列表.md
├── Tab: 值班人员    → FireControlPersonnel.vue (M5, 后续)
├── Tab: 远程点名    → FireControlRollCall.vue (M2, 待改造) ← 远程点名操作.md
├── Tab: AI 预警     → 🆕 FireControlAlerts.vue (M1, 待新建) ← AI预警记录列表.md
├── Tab: 交接班      → 🆕 FireControlHandover.vue (M4, 后续)
└── Tab: 主机台账    → 🆕 FireControlHostLedger.vue (M3, 后续)
```

## 下一步

- 有 Figma 设计稿：`/md-figma-to-vue3 docs/消防控制室管理/ai-spec/{页面}.md` + Figma 链接
- 无 Figma 设计稿：`/md-figma-to-vue3 docs/消防控制室管理/ai-spec/{页面}.md`（仅基于 MD 生成）
- 如需调整规格：直接编辑对应的 `.md` 文件后重新运行
