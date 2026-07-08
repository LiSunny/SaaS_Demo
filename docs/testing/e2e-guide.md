# E2E 自动化测试使用指南

> 最后一次更新：2026-07-08

## 一句话总结

在项目根目录运行 `npm run test:e2e`，自动创建独立测试数据库、启动前后端、跑测试、清理环境。**完全不碰你的开发数据库**。

---

## 快速开始

### 首次使用（只需做一次）

```bash
# 在项目根目录
npm install                    # 安装 Playwright（已装在 devDependencies 中则跳过）
npx playwright install chromium # 下载 Chromium 浏览器（~150MB，只需一次）
```

### 日常使用

```bash
npm run test:e2e               # 运行全部测试（约 40 秒）
```

看到这样就是全通过了：

```
Running 9 tests using 1 worker

  ✓ 未登录用户访问 /workbench 应重定向到 /login
  ✓ 登录页应渲染 4 个体验账号卡片
  ✓ 使用默认管理员账号登录后跳转到工作台
  ...

  9 passed (37.4s)
```

---

## 三个运行模式

| 命令 | 用途 | 什么时候用 |
|------|------|-----------|
| `npm run test:e2e` | 命令行运行 | 代码改完后快速验证，CI 自动化 |
| `npm run test:e2e:ui` | 可视化 UI 模式 | 想看每条用例在浏览器里的实际运行过程 |
| `npm run test:e2e:debug` | 逐条调试 | 某条用例失败，需要单步排查 |

### UI 模式（推荐新人）

```bash
npm run test:e2e:ui
```

会打开 Playwright 的图形界面，你能看到：
- 测试用例列表（绿色 = 通过，红色 = 失败）
- 每条用例的浏览器运行回放
- 失败时的截图和 DOM 快照

### 只跑某个文件

```bash
# 只测登录相关
npx playwright test --config=e2e/playwright.config.ts e2e/specs/auth/login.spec.ts

# 只测某一条（用 grep 匹配用例名）
npx playwright test --config=e2e/playwright.config.ts -g "错误密码"
```

---

## 查看测试报告

每次运行后自动生成 HTML 报告：

```bash
npx playwright show-report e2e/reports
```

浏览器打开后能看到：
- **Overview**：通过/失败数量、耗时
- **失败的用例**：截图 + Trace 回放（鼠标移动、网络请求全记录）
- **通过的用例**：执行步骤列表

---

## 它到底做了什么？

```
┌─────────────────────────────────────────────────────────┐
│ 1. rm -f test.db           ← 清理上次测试残留            │
│ 2. prisma db push          ← 在 test.db 里建表（不碰 dev.db）│
│ 3. prisma db seed          ← 填入 3 家企业 + 9 个岗位    │
│ 4. 启动后端 :3202          ← 独立端口，连接 test.db       │
│ 5. ensureDefaultAdmin()    ← 自动创建 13800000000/admin123 │
│ 6. 启动前端 :3200          ← proxy 指向 :3202             │
│ 7. 运行测试                 ← Playwright 打开 Chromium     │
│ 8. 输出报告                 ← 控制台 + e2e/reports/       │
│ 9. 杀掉前后端 + rm test.db ← 一干二净                    │
└─────────────────────────────────────────────────────────┘
```

### 为什么不怕污染开发数据库？

日常开发和测试用的是 **两个完全独立的 SQLite 文件**：

| | 开发 | 测试 |
|------|------|------|
| 数据库文件 | `server/prisma/dev.db` | `server/prisma/test.db` |
| 后端端口 | `3201` | `3202` |
| 前端端口 | `3200` | `3200`（测试结束释放） |
| 数据来源 | 你手动操作积累 | seed 脚本自动生成 |
| 生命周期 | 持久保留 | 测试前创建，测试后删除 |

---

## 当前覆盖了哪些测试？

### Phase 1（已实现）— 登录 & 路由守卫

| # | 测试内容 | 验证了什么 |
|:---:|------|------|
| 1 | 未登录 → 重定向到 `/login` | 路由守卫 `beforeEach` 的 token 检查 |
| 2 | 登录页显示 4 个体验账号 | UI 渲染正确 |
| 3 | 管理员手动登录 → 工作台 | JWT 登录流程 + token 持久化（刷新仍登录） |
| 4 | platform-ops 可访问 `/admin` | 系统角色路由权限 |
| 5 | 登录后重定向回原始页面 | `redirect` 参数正确处理 |
| 6 | 已登录访问 `/login` → 跳走 | 重复登录保护 |
| 7 | 空表单校验 | Element Plus 表单验证 |
| 8 | 错误密码提示 | API 错误消息展示 |
| 9 | 退出后不可访问 | `localStorage` 清理 + 路由保护恢复 |

---

## 常见问题

### Q: 测试跑到一半失败了，端口 3200 被占用

测试结束后如果异常退出（你按了 Ctrl+C），进程可能没被清理。

**解决**：
```bash
# 手动杀掉占用的进程
lsof -ti :3200 | xargs kill
lsof -ti :3202 | xargs kill
```

### Q: 我想在开发服务器开着的时候跑测试

当前测试固定用端口 3200。如果你 `npm run dev:fresh` 正开着，测试会因为端口冲突失败。

**解决**：先 `Ctrl+C` 停掉开发服务，跑完测试再重启。

### Q: 测试太慢了，能加速吗？

37 秒里大部分时间花在启动前后端上。后续可以优化 setup 复用进程，但 POC 阶段 37 秒已经足够快了。

### Q: 浏览器窗口弹出来挡住我

默认是 headless 模式（后台运行），不会弹窗。如果你想看浏览器实际运行，用 `npm run test:e2e:ui`。

### Q: 为什么只有 9 条？企业管理的增删改查呢？

Phase 1 只测了登录和路由守卫（所有功能的前提）。Phase 2 会加上企业 CRUD、用户管理。

### Q: 能加新测试吗？怎么加？

1. 在 `e2e/specs/` 对应业务域目录下新建 `.spec.ts`
2. 复制其他 spec 文件的开头 import 和 `test.describe` 结构
3. 用 `test('用例名', async ({ page }) => { ... })` 写你的用例
4. 跑 `npm run test:e2e` 验证

---

## 目录结构

```
e2e/
├── playwright.config.ts      # 配置文件（想改超时、截图策略看这里）
├── setup.mjs                 # 全局准备（一般不用动）
├── global-teardown.mjs       # 全局清理（一般不用动）
├── fixtures/
│   └── auth.ts               # 登录辅助（loginAsAdmin / setupAuthViaApi）
├── specs/                    # 👈 测试用例都在这里
│   ├── auth/
│   │   └── login.spec.ts     # 登录 & 路由守卫
│   ├── enterprise/           # Phase 2 待实现
│   ├── user/                 # Phase 2 待实现
│   └── position/             # Phase 3 待实现
├── utils/
│   └── api.ts                # 后端 API 辅助函数
└── reports/                  # 测试报告（gitignored，每次运行覆盖）
```

---

## 整合到 Skill 工作流

如果你装了 `/e2e` skill，可以这样用：

```
修改代码 → /verify → /e2e → /review-demo
```

- `/e2e` — 跑自动化测试，快速验证没搞坏已有功能
- `/review-demo` — 手工走查，聚焦 UI 细节和业务逻辑

这也意味着：**每次让 AI 改完代码，先 `/e2e` 确认没回归，再 `/review-demo` 人工验 UI**。
