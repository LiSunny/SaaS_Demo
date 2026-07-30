#!/bin/bash
# ==========================================
# maintenance-demo 一键部署
# 用法:
#   npm run deploy           一键发布前后端
#   ./deploy.sh frontend     只更新前端
#   ./deploy.sh backend      只更新后端
# ==========================================

SERVER="root@60.205.170.250"
FRONTEND_PATH="/opt/myapp/frontend"
BACKEND_PATH="/opt/myapp/backend"

set -e

deploy_frontend() {
  echo ""
  echo "📦 编译前端..."
  npm run build

  echo ""
  echo "📤 上传前端到服务器..."
  scp -r dist/* "${SERVER}:${FRONTEND_PATH}/"

  echo ""
  echo "✅ 前端更新完成 → https://www.lyspace.top"
}

deploy_backend() {
  echo ""
  echo "📤 上传后端代码到服务器..."
  rsync -av --exclude 'node_modules' --exclude 'dev.db' --exclude 'dev.db-wal' --exclude 'dev.db-shm' --exclude '.env' \
    server/ "${SERVER}:${BACKEND_PATH}/"

  echo ""
  echo "📦 服务器上安装依赖..."
  ssh "${SERVER}" "cd ${BACKEND_PATH} && npm install"

  echo ""
  echo "🗄️  同步数据库 schema..."
  ssh "${SERVER}" "cd ${BACKEND_PATH} && npx prisma db push"

  echo ""
  echo "🔄 重启后端..."
  ssh "${SERVER}" "pm2 restart myapp-backend --update-env"

  echo ""
  echo "✅ 后端更新完成"
}

deploy_all() {
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║  🚀 一键发布 maintenance-demo       ║"
  echo "║  目标: ${SERVER}                     ║"
  echo "╚══════════════════════════════════════╝"

  deploy_frontend
  deploy_backend

  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║  ✅ 发布完成                         ║"
  echo "║  🌐 https://www.lyspace.top          ║"
  echo "╚══════════════════════════════════════╝"
}

# 默认：全部部署
case "${1:-all}" in
  frontend)
    deploy_frontend
    ;;
  backend)
    deploy_backend
    ;;
  all)
    deploy_all
    ;;
  *)
    echo "用法: npm run deploy | ./deploy.sh {frontend|backend|all}"
    exit 1
    ;;
esac
