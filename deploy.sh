#!/bin/bash
# ==========================================
# maintenance-demo 一键部署脚本
# 用法:
#   ./deploy.sh frontend   只更新前端
#   ./deploy.sh backend    只更新后端
#   ./deploy.sh all        前后端一起更新
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
  echo "✅ 前端更新完成 → http://60.205.170.250"
}

deploy_backend() {
  echo ""
  echo "📤 上传后端代码到服务器..."
  rsync -av --exclude 'node_modules' --exclude 'dev.db' --exclude '.env' \
    server/ "${SERVER}:${BACKEND_PATH}/"

  echo ""
  echo "📦 服务器上安装依赖..."
  ssh "${SERVER}" "cd ${BACKEND_PATH} && npm install"

  echo ""
  echo "🔄 重启后端..."
  ssh "${SERVER}" "pm2 restart myapp-backend"

  echo ""
  echo "✅ 后端更新完成"
}

case "${1}" in
  frontend)
    deploy_frontend
    ;;
  backend)
    deploy_backend
    ;;
  all)
    deploy_frontend
    deploy_backend
    ;;
  *)
    echo "用法: ./deploy.sh {frontend|backend|all}"
    echo ""
    echo "  frontend  只更新前端"
    echo "  backend   只更新后端"
    echo "  all       前后端一起更新"
    exit 1
    ;;
esac
