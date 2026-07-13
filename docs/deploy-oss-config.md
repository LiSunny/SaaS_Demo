# ECS 线上 OSS 配置引导

## 背景

上传功能依赖阿里云 OSS，需要 5 个环境变量。`server/.env` 已被 `deploy.sh` 排除（防止覆盖线上配置），所以需要在服务器上**手动创建一次**。

## 服务器信息

| 项目 | 值 |
|------|-----|
| IP | `60.205.170.250` |
| 用户 | `root` |
| 后端路径 | `/opt/myapp/backend` |
| 进程管理 | PM2（进程名 `myapp-backend`） |

---

## 第一步：SSH 登录服务器

在本地终端执行：

```bash
ssh root@60.205.170.250
```

## 第二步：创建线上 .env 文件

```bash
cat > /opt/myapp/backend/.env << 'EOF'
DATABASE_URL="file:./dev.db"
PORT=3201
NODE_ENV=production
JWT_SECRET=maintenance-demo-prod-请替换为随机字符串
JWT_EXPIRES_IN=7d

# 阿里云 OSS
OSS_REGION=oss-cn-beijing
OSS_ACCESS_KEY_ID=<your-access-key-id>
OSS_ACCESS_KEY_SECRET=<your-access-key-secret>
OSS_BUCKET=gn-saas-files
OSS_BASE_URL=https://gn-saas-files.oss-cn-beijing.aliyuncs.com
EOF
```

> 复制粘贴上面整段命令到终端执行，一步完成。

## 第三步：验证文件内容

```bash
cat /opt/myapp/backend/.env
```

确认 OSS 相关的 5 行都存在且值正确。

## 第四步：重启后端

```bash
pm2 restart myapp-backend
pm2 logs myapp-backend --lines 20
```

看日志确认没有报错，服务正常启动。

## 第五步：验证上传功能

1. 打开浏览器访问 `http://60.205.170.250`
2. 登录 → 运营管理 → 大屏管理 → 新建/编辑大屏
3. 点击"上传缩略图"，选一张图片
4. 上传成功后图片预览正常显示

---

## 常见问题

### Q: 以后 `./deploy.sh backend` 会覆盖 .env 吗？

**不会。** `deploy.sh` 第 35 行 `--exclude '.env'` 确保每次 rsync 都跳过 `.env`，线上配置不受影响。

### Q: 如果 OSS 密钥换了怎么更新？

SSH 登录后直接编辑：

```bash
vim /opt/myapp/backend/.env
# 或
nano /opt/myapp/backend/.env
```

修改对应行，保存后 `pm2 restart myapp-backend`。

### Q: 怎么确认 OSS 配置已生效？

在服务器上执行：

```bash
cd /opt/myapp/backend
node -e "require('dotenv').config(); console.log('OSS 配置:', process.env.OSS_BUCKET ? '✅ 已配置' : '❌ 未配置')"
```

---

## 安全提醒

- `OSS_ACCESS_KEY_SECRET` 是敏感凭证，**绝对不要**提交到 Git 仓库
- 建议在阿里云 RAM 控制台创建一个**子账号**，只授予 OSS 写入权限，用子账号的 AccessKey 替换当前配置
- `JWT_SECRET` 线上应使用随机强密码，不要用本地开发的值
