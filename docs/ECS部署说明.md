# 项目部署说明（maintenance-demo）

## 一键更新部署

在项目目录下（`/Users/liyang/Desktop/AI应用/skill维护/maintenance-demo/`）：

```bash
./deploy.sh frontend    # 只更新前端
./deploy.sh backend     # 只更新后端
./deploy.sh all         # 前后端一起更新
```

---

## 整体架构

```
浏览器 → http://60.205.170.250
         ↓
    nginx (:80)
    ├── /api/*  →  后端 (:3000)  PM2 管理
    └── 其他     →  前端文件 /opt/myapp/frontend/
```

| 组件 | 位置 | 技术 |
|------|------|------|
| 前端 | `/opt/myapp/frontend/` | Vue 3 + Vite |
| 后端 | `/opt/myapp/backend/` | Express + Prisma |
| 数据库 | `/opt/myapp/backend/prisma/dev.db` | SQLite |
| nginx | `/etc/nginx/sites-available/myapp` | — |

---

## 服务器常用命令

```bash
pm2 list                          # 查看后端状态
pm2 logs myapp-backend            # 查看后端日志
pm2 restart myapp-backend         # 重启后端
nginx -t && systemctl reload nginx  # 重载 nginx
```

---

## 默认账号

- 地址：`http://60.205.170.250`
- 账号：`admin` / `admin123`

---

最后修改：2026-06-27
