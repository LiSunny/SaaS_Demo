# 本地开发指南

## 一句话总结

在项目根目录打开终端，输入：

```bash
npm run dev:fresh
```

一条命令同时启动**前端页面**和**后端接口**，浏览器打开 `http://localhost:3200` 就能看到页面。

---

## 首次使用（只需做一次）

### 1. 安装依赖

```bash
# 在项目根目录
npm install

# 进入 server 目录，安装后端依赖
cd server
npm install
cd ..
```

### 2. 初始化数据库（如果还没有）

```bash
cd server
npx prisma db push
cd ..
```

### 3. 启动

```bash
npm run dev:fresh
```

看到这个画面就成功了 ↓

```
╔══════════════════════════════════════════╗
║   ✅  开发环境就绪！                     ║
╠══════════════════════════════════════════╣
║   前端  http://localhost:3200            ║
║   后端  http://localhost:3201            ║
║   API   /api/* → :3201                   ║
╚══════════════════════════════════════════╝
        按 Ctrl+C 停止所有服务
```

---

## 常用命令速查

| 命令 | 作用 | 什么时候用 |
|------|------|-----------|
| `npm run dev:fresh` | **一键启动前后端**（推荐） | 每次开始写代码 |
| `npm run dev` | 只启动前端 | 只需要改页面样式时 |
| `cd server && npm run dev` | 只启动后端 | 只需要改接口时 |
| `Ctrl + C` | 停止服务 | 不写了、下班了 |

---

## 日常工作流

```
周一早上：
  打开终端 → cd 到项目目录 → npm run dev:fresh → 开工 🚀

临时离开：
  Ctrl+C 停掉 → 回来后重新 npm run dev:fresh

下班：
  Ctrl+C 停掉 → 关电脑
```

---

- **自动清理残留**：`npm run dev:fresh` 会检查端口 3200/3201 是否被之前残留的进程占用，有的话自动杀掉再启动。
- **端口固定**：前端一定是 `3200`，后端一定是 `3201`，不会乱变。

---

## 常见问题

### Q: 一启动就报错"端口被非 node 进程占用"

说明端口 3200 或 3201 上跑着一个不是 node 的服务（比如 Docker、数据库）。

**解决**：手动停掉那个服务，或者改 `scripts/dev-fresh.sh` 里的 `FE_PORT` / `BE_PORT`。

### Q: 报错"后端进程启动后立即退出"

后端依赖没装。

**解决**：
```bash
cd server
npm install
npx prisma db push    # 如果提示数据库不存在
cd ..
npm run dev:fresh
```

### Q: 启动后页面空白 / 接口 404

后端可能启动失败了。看一下终端输出里有没有红色的报错（`Error` / `❌`）。

### Q: 端口被占用但不想杀进程

那就用原来的命令手动启动：
```bash
npm run dev            # 前端（端口可能自动变成 3201/3202/...）
cd server && npm run dev    # 后端（端口可能自动变成 3202/3203/...）
```

Vite 检测到端口被占用会自动换一个可用端口——这就是之前端口老变的原因。

### Q: Windows 能用吗？

`dev:fresh` 脚本用的是 bash 命令（`lsof`、`kill`），**Windows 的 cmd / PowerShell 不能直接用**。

**Windows 用户可以**：
1. 安装 [Git Bash](https://git-scm.com/)（自带 bash 环境），在 Git Bash 里运行
2. 或安装 WSL，在 WSL 里运行
3. 或手动用旧方式启动：`npm run dev` + `cd server && npm run dev`

---

## 文件说明

| 文件 | 作用 |
|------|------|
| `scripts/dev-fresh.sh` | 一键启动脚本（检查端口→杀掉残留→启后端→启前端→打印地址） |
| `vite.config.ts` 中 `server.port` | 前端端口（3200） |
| `vite.config.ts` 中 `server.proxy` | 前端 `/api/*` 请求自动转发到后端 3201 |
| `server/` 目录 | 后端 Express 代码 |
| `server/prisma/schema.prisma` | 数据库表结构 |
